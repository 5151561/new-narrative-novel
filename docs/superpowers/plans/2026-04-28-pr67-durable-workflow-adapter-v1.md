# PR67 Durable Workflow Adapter v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve scene-run `waiting_review` and `failed` recovery state across API restart, and keep retry/resume/cancel as read-support workflow controls without turning run history into product truth.

**Architecture:** Keep the durable slice inside the existing `runFixtureStore -> fixtureRepository -> routes/run*.ts` seam. Extract the persistence/recovery rules now embedded in `runFixtureStore.ts` into a narrow adapter/helper that owns serialization, hydration validation, and resumable-state recovery, while leaving canon/prose product truth in the existing project scene data flow (`syncRunMutations`, `syncSceneBacklogStatusFromReviewDecision`, `syncSceneProseFromAcceptedRun`).

**Tech Stack:** TypeScript, Fastify routes, Vitest, React Query hook tests in `packages/renderer`

---

## Scope Guard

PR67 is only about durable workflow execution/recovery for scene runs.

In scope:

- persisted `waiting_review` and `failed` run recovery
- resumable/retry/cancel route contract on hydrated runs
- artifact/trace read surfaces staying available after restart
- minimal renderer run-session cache/status closure if the API contract exposes a gap

Out of scope:

- PR66 desktop supervisor/project-picker work
- new workbench panes, run console pages, or shell/layout changes
- changing accepted canon/prose ownership; workflow history stays support data, not product truth
- route redesign, SSE redesign, or replacing the current `fixtureRepository` boundary
- chapter/book orchestration changes outside the existing scene-run seam

## Current Repo Seams

- `packages/api/src/repositories/runFixtureStore.ts`
  currently owns run sequencing, run state creation, persistence export/hydrate, artifact indexing, retry/cancel/resume transitions, and event stream completion.
- `packages/api/src/repositories/project-state-persistence.ts`
  already persists `runStore` inside local project overlays; this is the durable storage seam PR67 must keep using.
- `packages/api/src/repositories/fixtureRepository.ts`
  already persists after run mutations and already treats accepted review output as scene truth via `syncRunMutations` and `syncSceneProseFromAcceptedRun`.
- `packages/api/src/routes/run.ts` and `packages/api/src/routes/runArtifacts.ts`
  already expose start/get/events/retry/cancel/resume/review/artifact/trace endpoints; PR67 should tighten behavior here only if hydration/recovery makes a contract gap visible.
- `packages/renderer/src/features/run/hooks/useSceneRunSession.ts`
  already swaps active run ids and refreshes caches for retry/resume/cancel; renderer changes should stay hook-level unless API behavior forces a visible control change.

## Expected File Map

Likely create:

- `packages/api/src/orchestration/sceneRun/durableRunWorkflowAdapter.ts`
- `packages/api/src/orchestration/sceneRun/durableRunWorkflowAdapter.test.ts`

Likely modify:

- `packages/api/src/repositories/runFixtureStore.ts`
- `packages/api/src/repositories/runFixtureStore.test.ts`
- `packages/api/src/createServer.run-recovery.test.ts`
- `packages/api/src/routes/run.ts` only if input/409 behavior must be tightened
- `packages/api/src/routes/runArtifacts.ts` only if hydrated-run read surfaces regress
- `packages/renderer/src/features/run/hooks/useSceneRunSession.ts` only if API recovery reveals a cache handoff bug
- `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx` if the hook contract changes

Avoid touching unless absolutely required:

- `packages/api/src/createServer.ts`
- `packages/renderer/src/App.tsx`
- `packages/renderer/src/features/workbench/**`

## Bundle 1: Durable Recovery Contract

**Files:**

- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/createServer.run-recovery.test.ts`
- Create: `packages/api/src/orchestration/sceneRun/durableRunWorkflowAdapter.test.ts`

- [ ] **Step 1: Add failing run-store coverage for restart-preserved waiting-review and failed recovery**

Add focused tests around the existing `exportProjectState` / `hydrateProjectState` seam before moving code:

```ts
it('rehydrates a waiting-review run without promoting it to completed truth', async () => {
  const store = createRunFixtureStore()
  const projectId = 'project-waiting-review'
  const run = await store.startSceneRun(projectId, {
    sceneId: 'scene-midnight-platform',
    mode: 'rewrite',
    note: 'Persist waiting review.',
  })

  const snapshot = store.exportProjectState(projectId)!
  const hydrated = createRunFixtureStore()
  hydrated.clearProject(projectId)
  hydrated.hydrateProjectState(projectId, snapshot)

  expect(hydrated.getRun(projectId, run.id)).toMatchObject({
    id: run.id,
    status: 'waiting_review',
    pendingReviewId: run.pendingReviewId,
  })
  expect(hydrated.getRunTrace(projectId, run.id)?.summary).toEqual({
    proposalSetCount: 1,
    canonPatchCount: 0,
    proseDraftCount: 0,
    missingTraceCount: 0,
  })
})
```

```ts
it('rehydrates a failed resumable run with artifacts and trace still readable', async () => {
  const store = createRunFixtureStore()
  const projectId = 'project-failed-recovery'
  const seededRun = await store.startSceneRun(projectId, {
    sceneId: 'scene-midnight-platform',
    mode: 'rewrite',
    note: 'Persist failed recovery.',
  })
  const snapshot = store.exportProjectState(projectId)! as unknown as {
    runStates: MutablePersistedRunState[]
    sceneSequences: Record<string, number>
  }
  const runState = snapshot.runStates.find((entry) => entry.run.id === seededRun.id)!
  runState.run.status = 'failed'
  runState.run.summary = 'Run failed after provider timeout.'
  runState.run.failureClass = 'model_timeout'
  runState.run.failureMessage = 'Provider timed out after the planner invocation.'
  runState.run.resumableFromEventId = runState.run.latestEventId
  runState.run.pendingReviewId = undefined

  const failureEventId = `run-event-${seededRun.id.replace(/^run-/, '')}-010`
  runState.events.push({
    id: failureEventId,
    runId: seededRun.id,
    order: 10,
    kind: 'run_failed',
    label: 'Run failed',
    summary: 'Provider timed out after the planner invocation.',
    createdAtLabel: '2026-04-28 10:10',
    severity: 'error',
    metadata: { failureClass: 'model_timeout' },
  })
  runState.run.latestEventId = failureEventId
  runState.run.eventCount = runState.events.length

  const hydrated = createRunFixtureStore()
  hydrated.clearProject(projectId)
  hydrated.hydrateProjectState(projectId, snapshot)

  const plannerInvocationId = runState.artifacts?.find((artifact) => artifact.kind === 'agent-invocation')?.id
  expect(hydrated.getRun(projectId, seededRun.id)).toMatchObject({
    id: seededRun.id,
    status: 'failed',
    resumableFromEventId: failureEventId,
  })
  expect(plannerInvocationId && hydrated.getRunArtifact(projectId, seededRun.id, plannerInvocationId)).toMatchObject({
    id: plannerInvocationId,
    failureDetail: {
      failureClass: 'model_timeout',
      retryable: true,
    },
  })
  expect(hydrated.getRunTrace(projectId, seededRun.id)).toMatchObject({
    runId: seededRun.id,
    isPartialFailure: true,
    summary: {
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    },
  })
})
```

- [ ] **Step 2: Run the API tests to confirm the new recovery expectations fail before implementation**

Run:

```bash
pnpm --filter @narrative-novel/api test -- src/repositories/runFixtureStore.test.ts src/createServer.run-recovery.test.ts
```

Expected:

- the new waiting-review persistence assertion fails, or
- the new failed-run hydration assertion fails, or
- the code duplication is obvious enough that the new dedicated adapter test cannot pass yet

- [ ] **Step 3: Add adapter-level tests that define the durable contract explicitly**

Create a narrow unit test file for the helper you are about to extract. Lock these behaviors:

```ts
describe('durableRunWorkflowAdapter', () => {
  it('serializes workflow support state without mutating canon or prose truth', () => {
    const serialized = serializeDurableRunState(runState)
    expect(serialized).toMatchObject({
      sequence: 2,
      run: {
        id: 'run-scene-midnight-platform-002',
        status: 'waiting_review',
      },
      latestReviewDecision: undefined,
      selectedVariants: [
        { proposalId: 'proposal-1', variantId: 'variant-1a' },
      ],
    })
  })

  it('rejects invalid persisted entries atomically', () => {
    expect(() =>
      hydrateDurableRunStates({
        snapshot: {
          runStates: [
            validSerializedState,
            { ...validSerializedState, run: { ...validSerializedState.run, id: 42 } },
          ],
          sceneSequences: { 'scene-midnight-platform': 2 },
        },
        createRunState,
      }),
    ).toThrow(/invalid|unsupported/i)
  })

  it('rebuilds read indexes for waiting-review and failed resumable runs after hydration', () => {
    const hydrated = hydrateDurableRunStates({
      snapshot: {
        runStates: [waitingReviewState, failedResumableState],
        sceneSequences: {
          'scene-midnight-platform': 2,
        },
      },
      createRunState,
    })

    expect(hydrated.states.map((state) => state.run.status)).toEqual(['waiting_review', 'failed'])
    expect(hydrated.states[1]?.traceSummary).toMatchObject({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
  })
})
```

The adapter test should verify:

- `RunRecord`, `events`, `artifacts`, `latestReviewDecision`, and `selectedVariants` round-trip
- invalid persisted entries abort hydration without partially mutating the target project
- no accepted canon/prose scene truth is derived from history during hydration

- [ ] **Step 4: Re-run the focused API tests and confirm the adapter contract is still red**

Run:

```bash
pnpm --filter @narrative-novel/api test -- src/orchestration/sceneRun/durableRunWorkflowAdapter.test.ts src/repositories/runFixtureStore.test.ts src/createServer.run-recovery.test.ts
```

Expected: FAIL, because the extracted adapter does not exist yet.

## Bundle 2: Extract Durable Adapter and Wire Run Store

**Files:**

- Create: `packages/api/src/orchestration/sceneRun/durableRunWorkflowAdapter.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`

- [ ] **Step 1: Extract serialization/hydration/recovery helpers out of `runFixtureStore.ts`**

Move the persistence-only pieces into a dedicated helper. The extracted helper should own code shaped roughly like:

```ts
export interface DurablePersistedRunStateRecord {
  sequence: number
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
  latestReviewDecision?: RunReviewDecisionKind
  selectedVariants?: RunSelectedProposalVariantRecord[]
}

export function serializeDurableRunState(state: RunStateLike): DurablePersistedRunStateRecord
export function hydrateDurableRunStates(input: {
  snapshot: PersistedRunStore
  createRunState: (serialized: DurablePersistedRunStateRecord) => RunStateLike
}): { states: RunStateLike[]; sceneSequences: Record<string, number> }
```

Rules the helper must enforce:

- preserve `waiting_review`, `failed`, `completed`, and `cancelled` exactly as stored
- rebuild artifact detail/trace indexes by delegating back through `createRunState`
- never mutate scene/book/chapter truth directly
- treat persistence as all-or-nothing for a project snapshot

- [ ] **Step 2: Replace inline run-store persistence logic with the adapter**

In `runFixtureStore.ts`, reduce the local responsibilities to:

- runtime transitions (`startSceneRun`, `retryRun`, `cancelRun`, `resumeRun`, `submitRunReviewDecision`)
- in-memory buckets and event stream broker
- delegating export/hydrate validation to the adapter

Keep these semantics unchanged:

```ts
if (state.run.status !== 'failed' || !state.run.resumableFromEventId) {
  throw conflict(...)
}
```

```ts
if (isTerminalRunStatus(state.run.status)) {
  completeRunStream(projectId, state.run.id)
}
```

Do not use the adapter to invent new product-level scene updates.

- [ ] **Step 3: Make the restart contract pass end-to-end**

Use the existing `createServer.run-recovery.test.ts` path as the final API proof:

- persisted failed run exposes artifact failure detail after restart
- persisted failed run can `POST /resume`
- persisted waiting-review run still exposes pending review and review submission path after restart

If route code needs tightening, keep it narrow:

- add validation/409 behavior in `packages/api/src/routes/run.ts`
- only touch `packages/api/src/routes/runArtifacts.ts` if hydrated runs incorrectly 404 on valid artifact/trace reads

- [ ] **Step 4: Run the API verification suite**

Run:

```bash
pnpm --filter @narrative-novel/api test -- src/orchestration/sceneRun/durableRunWorkflowAdapter.test.ts src/repositories/runFixtureStore.test.ts src/createServer.run-recovery.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected:

- all three targeted test files pass
- typecheck passes with no new `any`-style escape hatches

## Bundle 3: Minimal Renderer Closure Only If Needed

**Files:**

- Modify if needed: `packages/renderer/src/features/run/hooks/useSceneRunSession.ts`
- Modify if needed: `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx`

- [ ] **Step 1: Add a failing hook test only if API recovery changes the active-run/cache contract**

If Bundle 2 changes the returned run shape or the order of cache refreshes, add a focused hook test like:

```ts
it('keeps a hydrated waiting-review run reviewable after refetching durable state', async () => {
  // getRun returns waiting_review with pendingReviewId from a hydrated project
  // assert canSubmitDecision stays true and activeRunId does not drift
})
```

or:

```ts
it('refreshes the source failed run cache after resume creates a follow-up run', async () => {
  // assert refreshRunReadCaches() covers the old failed run after resume
})
```

Do not add component/UI work unless the hook truly cannot satisfy the durable contract by itself.

- [ ] **Step 2: Fix the hook with the smallest possible change**

Allowed changes:

- cache invalidation order
- `sessionStartedRun` handoff
- preserving `pendingReviewId` / `activeRunId` across refetch

Not allowed:

- new route state
- new layout state
- new workbench panels
- converting run history into scene truth in the renderer

- [ ] **Step 3: Verify renderer only at the hook/test layer unless a visible component changed**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- src/features/run/hooks/useSceneRunSession.test.tsx
pnpm --filter @narrative-novel/renderer typecheck
```

Expected: pass.

Storybook/MCP note:

- no Storybook update is required if the final diff stays hook-only
- if implementation touches `RunReviewGate.tsx` or another visible run component, update the existing story and verify it via Storybook MCP using structured snapshot plus screenshot

## Final Verification

Run:

```bash
pnpm --filter @narrative-novel/api test -- src/orchestration/sceneRun/durableRunWorkflowAdapter.test.ts src/repositories/runFixtureStore.test.ts src/createServer.run-recovery.test.ts
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/renderer test -- src/features/run/hooks/useSceneRunSession.test.tsx
pnpm --filter @narrative-novel/renderer typecheck
```

Optional wider confidence pass only if Bundle 3 changed renderer code:

```bash
pnpm typecheck
pnpm test
```

## Acceptance Checklist

- API restart preserves `waiting_review` runs with valid `pendingReviewId`
- API restart preserves failed resumable runs with readable artifacts/trace and working `resume`
- retry/resume/cancel remain workflow support actions, not product-truth promotion paths
- accepted canon/prose still becomes product truth only through the existing scene sync path after review acceptance
- no workbench shell, route/layout, or Storybook churn unless renderer surface changes truly require it

## Execution Notes

- Keep `packages/api/src/createServer.ts`, `packages/renderer/src/App.tsx`, and workbench shell files untouched unless a failing proof leaves no alternative.
- If you need a new helper name, prefer `durableRunWorkflowAdapter` over generic names like `recoveryUtils`; this PR is about the workflow durability seam, not arbitrary helpers.
- Preserve existing route URLs and response shapes unless a test proves they block restart/recovery closure.

Plan complete and saved to `docs/superpowers/plans/2026-04-28-pr67-durable-workflow-adapter-v1.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
