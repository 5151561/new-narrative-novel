# PR48 Bundle 3 Through PR50 Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining work on `codex/pr48-bundle3-pr50-completion` by wiring the existing planner gateway into the live scene-run path, adding a real run-stream transport plus explicit worker/process boundary, and making desktop-local usable as a local-project workbench without breaking the current Narrative IDE / Workbench model.

**Architecture:** Start from the code that is already on this branch instead of replaying PR47 or PR48 Bundle 1/2. Keep `packages/api` as the single business contract surface, keep renderer product reads/writes on `ProjectRuntime.runClient`, keep WorkbenchShell in charge of layout, and keep desktop as a thin shell that supervises local API/worker processes plus project selection. Any new desktop or frontend work must stay route/layout-safe, workbench-shaped, and Storybook-verifiable.

**Tech Stack:** TypeScript, Fastify, React, Electron, official `openai` SDK, Server-Sent Events, Vitest, Storybook, pnpm

---

## Scope Guard

- Stay on branch `codex/pr48-bundle3-pr50-completion`. Do not create a worktree.
- Do not re-plan or re-implement PR47. The project-state file contract already exists on this branch and is the persistence base for the remaining work.
- Do not re-open PR48 Bundle 1 or Bundle 2. `openai`/`ajv` dependencies, planner config parsing, planner output schema, fixture provider, OpenAI Responses provider, and gateway fallback code already exist and should be reused.
- PR48 Bundle 3 is still backend-only. Do not widen it into renderer route changes, workbench shell redesign, or desktop project-picker work.
- PR49 may add stream transport and worker/process boundaries, but product run events must remain lightweight product records rather than raw prompt payloads, raw token streams, or workflow-engine history.
- PR49 must preserve the current route shape and keep polling fallback intact until the stream path is proven stable.
- PR50 must improve desktop-local project usability without turning the product into a dashboard or startup web app. If a non-workbench startup surface is needed, keep it desktop-only and outside the main Workbench route; otherwise prefer native Electron project selection and a narrow workbench status surface.
- For frontend work in PR50, obey `doc/frontend-workbench-constitution.md`: WorkbenchShell owns layout, scope × lens remains the product model, route state must not absorb desktop preference or project-session state, and affected surfaces need Storybook coverage plus MCP/browser verification.
- Review every bundle only after every task in that bundle is complete, then commit once per reviewed bundle.

## Current Branch Baseline

The plan starts from the code that actually exists on `codex/pr48-bundle3-pr50-completion`:

- PR47 persistence is already present:
  - `packages/api/src/repositories/project-state-persistence.ts`
  - `packages/api/src/createServer.local-persistence.test.ts`
  - `apps/desktop/src/main/runtime-config.ts`
- PR48 Bundle 1 and Bundle 2 are already present:
  - `packages/api/src/config.ts`
  - `packages/api/src/orchestration/modelGateway/scenePlannerOutputSchema.ts`
  - `packages/api/src/orchestration/modelGateway/scenePlannerFixtureProvider.ts`
  - `packages/api/src/orchestration/modelGateway/scenePlannerOpenAiResponsesProvider.ts`
  - `packages/api/src/orchestration/modelGateway/scenePlannerGateway.ts`
- PR48 Bundle 3 is not wired yet:
  - `packages/api/src/createServer.ts` still constructs `createFixtureRepository(...)` without planner-gateway injection.
  - `packages/api/src/repositories/runFixtureStore.ts` still exposes synchronous `startSceneRun(...)` and still calls `startSceneRunWorkflow(...)` without planner output input.
  - `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts` still creates the planner/writer/proposal artifacts from deterministic fixture-only logic.
  - `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts` still derives planner/proposal detail from canonical fixture builders rather than persisted validated planner output.
- Desktop thin shell and local API supervision already exist:
  - `apps/desktop/src/main/main.ts`
  - `apps/desktop/src/main/local-api-supervisor.ts`
  - `apps/desktop/src/main/runtime-config.ts`
  - `apps/desktop/src/preload/desktop-api.ts`
  - `apps/desktop/src/shared/desktop-bridge-types.ts`
- Desktop local-project usability does not exist yet:
  - no `project-store.ts`
  - no `project-picker.ts`
  - no `recent-projects.ts`
  - no current-project bridge contract
  - no worker supervisor
  - no renderer project-session bootstrap beyond `VITE_NARRATIVE_PROJECT_ID ?? 'book-signal-arc'`
- Renderer currently uses:
  - `window.narrativeDesktop.getRuntimeConfig()` only
  - `ProjectRuntimeProvider` with env-derived `projectId`
  - polling-only scene run session hooks
  - `ProjectRuntimeStatusBadge` for runtime health, but not desktop current-project identity or project-switch affordances

## Remaining Delivery Shape

This completion plan is intentionally split into seven reviewed bundles:

1. PR48 Bundle 3A: planner gateway injection into scene-run workflow/store
2. PR48 Bundle 3B: artifact-detail/persistence/doc closure for validated planner output
3. PR49A: API run-event stream transport and runtime capability flip
4. PR49B: renderer stream subscription with polling fallback and no workbench drift
5. PR49C: desktop worker/process boundary without moving business logic into Electron
6. PR50A: desktop local-project selection, recent-project persistence, and API process project context
7. PR50B: renderer project identity adoption, Storybook closure, and MCP/browser verification

## File Map

- `docs/superpowers/plans/2026-04-27-pr48-bundle3-pr50-completion.md`
  Purpose: this execution plan only.
- `packages/api/src/createServer.ts`
  Purpose: inject the existing planner gateway and later stream/worker-related dependencies into the fixture repository without changing route shape.
- `packages/api/src/test/support/test-server.ts`
  Purpose: let tests inject fake planner gateways, stream brokers, and project metadata without touching machine-global state.
- `packages/api/src/orchestration/sceneRun/sceneRunRecords.ts`
  Purpose: extend start-workflow inputs/state with validated planner output and compact planner provenance.
- `packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts`
  Purpose: persist compact planner provenance on artifacts while keeping raw provider payloads out of event/product surfaces.
- `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts`
  Purpose: accept planner output/provenance as explicit inputs while preserving deterministic fixture parity on the fallback path.
- `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts`
  Purpose: verify workflow creation with explicit planner output and canonical store-owned ids.
- `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.parity.test.ts`
  Purpose: keep the fixture path locked to the legacy deterministic contract.
- `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts`
  Purpose: materialize planner invocation detail and proposal-set detail from validated stored planner output rather than fixture-only derivation.
- `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts`
  Purpose: lock provenance display, proposal override mapping, selected-variant continuity, and unchanged canon/prose behavior.
- `packages/api/src/repositories/runFixtureStore.ts`
  Purpose: make start-run async, call the planner gateway, persist validated planner payloads/provenance, and later publish stream updates.
- `packages/api/src/repositories/runFixtureStore.test.ts`
  Purpose: prove fallback continuity, persisted planner-output hydration, stream publication, and unchanged review transitions.
- `packages/api/src/repositories/fixtureRepository.ts`
  Purpose: await the async run-store start path, keep `syncRunMutations(...)` in the repository layer, and later expose project metadata/runtime capability flips.
- `packages/api/src/repositories/run-event-stream-broker.ts`
  Purpose: own per-run stream subscribers, replay cursor semantics, and SSE-friendly event publication without changing stored event shape.
- `packages/api/src/repositories/run-event-stream-broker.test.ts`
  Purpose: lock replay-from-cursor, unsubscribe, completion, and duplicate-delivery behavior.
- `packages/api/src/routes/run.ts`
  Purpose: replace the `501` placeholder with a real stream endpoint while preserving existing paged-events and review-decision routes.
- `packages/api/src/routes/project-runtime.ts`
  Purpose: extend project-runtime reads with a narrow current-project bootstrap route plus selected-project runtime metadata.
- `packages/api/src/createServer.run-flow.test.ts`
  Purpose: protect start/detail/events/review/stream behavior across PR48 and PR49 changes.
- `packages/api/src/createServer.run-artifacts.test.ts`
  Purpose: prove artifact detail surfaces expose planner overrides first while run events stay lightweight.
- `packages/api/src/createServer.local-persistence.test.ts`
  Purpose: prove planner output and stream-safe event state survive restart through the PR47 state file.
- `packages/api/src/createServer.runtime-info.test.ts`
  Purpose: lock runtime capability flags and project identity responses as stream/project-root features land.
- `packages/api/src/createServer.current-project.test.ts`
  Purpose: verify the current-project bootstrap route and selected-project metadata wiring.
- `packages/api/src/config.ts`
  Purpose: add local-project metadata/env parsing for selected project root/title/id bootstrap.
- `packages/api/src/config.test.ts`
  Purpose: lock any new project-root/env parsing without destabilizing current config behavior.
- `doc/api-contract.md`
  Purpose: document planner-gateway integration, run-stream semantics, worker/process boundary rules, and desktop-local current-project rules.
- `apps/desktop/src/main/runtime-config.ts`
  Purpose: derive API child-process env from the selected desktop project root instead of workspace-root-only defaults.
- `apps/desktop/src/main/local-api-supervisor.ts`
  Purpose: supervise the local API process for the selected project and support restart on project switch.
- `apps/desktop/src/main/project-store.ts`
  Purpose: hold the current desktop project session in Electron main, including resolved metadata and selected root.
- `apps/desktop/src/main/project-picker.ts`
  Purpose: read/init `narrative.project.json` through native dialogs without exposing raw fs access to the renderer.
- `apps/desktop/src/main/recent-projects.ts`
  Purpose: persist and restore recent desktop project roots in Electron app data instead of renderer localStorage.
- `apps/desktop/src/main/project-store.test.ts`
  Purpose: lock current-project restore, switch, and no-project startup behavior.
- `apps/desktop/src/main/project-picker.test.ts`
  Purpose: verify metadata read/init and cancel/error handling for native project selection.
- `apps/desktop/src/main/recent-projects.test.ts`
  Purpose: prove recent-project persistence, de-duplication, and missing-path cleanup.
- `apps/desktop/src/main/process-supervisor-types.ts`
  Purpose: share typed snapshots for API and worker process status.
- `apps/desktop/src/main/worker-supervisor.ts`
  Purpose: create the first explicit worker boundary in Electron main without moving orchestration into the renderer or main process.
- `apps/desktop/src/main/worker-supervisor.test.ts`
  Purpose: prove start/restart/stop/health-failure behavior for the worker supervisor.
- `apps/desktop/src/main/main.ts`
  Purpose: sequence project selection, API startup, worker bridge handlers, and window lifecycle.
- `apps/desktop/src/main/app-menu.ts`
  Purpose: add desktop-local Open Project / Recent Projects entries without adding a web-style dashboard surface.
- `apps/desktop/src/shared/desktop-bridge-types.ts`
  Purpose: extend the narrow bridge contract with current-project and worker/process status shapes.
- `apps/desktop/src/preload/desktop-api.ts`
  Purpose: expose the typed project/process bridge to the renderer.
- `apps/desktop/src/preload/index.ts`
  Purpose: publish the updated `window.narrativeDesktop` contract.
- `apps/desktop/src/preload/desktop-api.test.ts`
  Purpose: prove the bridge only exposes the approved methods.
- `packages/renderer/src/app/runtime/runtime-config.ts`
  Purpose: adopt desktop-local runtime config that includes project identity instead of assuming `VITE_NARRATIVE_PROJECT_ID`.
- `packages/renderer/src/app/runtime/runtime-config.test.ts`
  Purpose: lock desktop runtime bootstrap, invalid bridge payload failure, and project-id adoption.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
  Purpose: construct the API runtime from desktop-local project identity when present while keeping web/api and web/mock behavior stable.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx`
  Purpose: prove desktop-local project identity overrides env defaults without silent mock fallback.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
  Purpose: show narrow project identity/runtime status without turning the header into a dashboard.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
  Purpose: lock project-title display, degraded-retry behavior, and capability badges.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
  Purpose: add desktop-local current-project and degraded/current-project states for Storybook verification.
- `packages/renderer/src/features/run/api/run-client.ts`
  Purpose: add stream-subscription capability while preserving paged-event reads and mock testability.
- `packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.ts`
  Purpose: merge stream-delivered pages with the existing cursor-paged fallback path.
- `packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.test.tsx`
  Purpose: prove stream-first behavior, polling fallback, de-duplication, and no accidental `events/stream` use when unavailable.
- `packages/renderer/src/features/run/hooks/useSceneRunSession.ts`
  Purpose: keep the current session composition layer while preferring stream updates when the runtime supports them.
- `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx`
  Purpose: protect active-run resolution and no-double-polling behavior after stream support lands.

## Bundle 1: PR48 Bundle 3A - Inject The Existing Planner Gateway Into Scene-Run Start

**Files:**
- Modify: `packages/api/src/createServer.ts`
- Modify: `packages/api/src/test/support/test-server.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunRecords.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.parity.test.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`

- [ ] **Step 1: Add failing backend tests for gateway wiring before code changes**

Lock these exact integration facts first:

```text
createServer constructs the existing scenePlannerGateway and injects it into repository/store wiring
runFixtureStore.startSceneRun(...) becomes async internally
fixture fallback still preserves the deterministic parity contract already guarded by sceneRunWorkflow.parity.test.ts
the planner gateway result influences workflow construction before any artifact detail is built
```

- [ ] **Step 2: Thread validated planner output and compact provenance through the pure workflow seam**

Implementation target:

```text
SceneRunWorkflowStartInput gains plannerOutput and plannerProvenance
startSceneRunWorkflow(...) remains pure and still only returns run/events/artifacts
sceneRunArtifacts.ts stores compact planner provenance only:
  provider
  modelId
  fallbackReason
```

Do not add raw prompt text, raw Responses JSON, or raw provider transcripts to workflow state or artifact meta.

- [ ] **Step 3: Make the store/repository start path async and gateway-backed**

Implementation target:

```text
createServer -> createFixtureRepository(..., scenePlannerGateway)
fixtureRepository.startSceneRun(...) awaits runStore.startSceneRun(...)
runFixtureStore.startSceneRun(...) awaits scenePlannerGateway.generate(...)
runFixtureStore assigns canonical proposal/variant ids from runId + ordinal position
syncRunMutations(projectId, run) stays in fixtureRepository.ts
```

- [ ] **Step 4: Verify Bundle 1**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  sceneRunWorkflow.test.ts \
  sceneRunWorkflow.parity.test.ts \
  runFixtureStore.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected:

```text
gateway-backed start-run wiring is covered
fixture parity remains intact
the async seam does not leak into route shape or repository misuse
```

- [ ] **Step 5: Review and commit Bundle 1**

Commit after review passes:

```bash
git add packages/api/src/createServer.ts \
  packages/api/src/test/support/test-server.ts \
  packages/api/src/orchestration/sceneRun/sceneRunRecords.ts \
  packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts \
  packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts \
  packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts \
  packages/api/src/orchestration/sceneRun/sceneRunWorkflow.parity.test.ts \
  packages/api/src/repositories/runFixtureStore.ts \
  packages/api/src/repositories/runFixtureStore.test.ts \
  packages/api/src/repositories/fixtureRepository.ts
git commit -m "2026-04-27, wire planner gateway into scene run start"
```

## Bundle 2: PR48 Bundle 3B - Persist Planner Output And Refresh Artifact Surfaces

**Files:**
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/api/src/createServer.run-artifacts.test.ts`
- Modify: `packages/api/src/createServer.local-persistence.test.ts`
- Modify: `packages/api/src/createServer.draft-assembly-regression.test.ts`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Add failing tests for artifact detail override and persistence restart continuity**

Lock these exact outcomes:

```text
proposal-set detail uses validated planner output when the openai path succeeds
planner invocation detail exposes provider/model/fallback provenance without exposing raw payloads
run events remain lightweight and never embed proposal copy, prompt text, or transcript payloads
validated planner output survives export/hydrate and fresh-server restart through the PR47 state file
accepted canon/prose and downstream draft assembly rules remain unchanged
```

- [ ] **Step 2: Persist validated planner output in run state and artifact-detail builders**

Implementation target:

```text
runFixtureStore serializes validated planner output inside persisted run state
hydrateProjectState(...) reconstructs planner-backed read surfaces safely
buildProposalSetDetail(...) prefers stored planner output over fixture defaults
buildAgentInvocationDetail(...) shows compact provenance from artifact meta
the model never chooses final proposal ids or variant ids
```

- [ ] **Step 3: Refresh the API contract documentation**

Add one PR48 section to `doc/api-contract.md` that states:

```text
planner proposal generation now passes through an API-side gateway
route contracts remain provider-agnostic
NARRATIVE_MODEL_PROVIDER / NARRATIVE_OPENAI_MODEL / OPENAI_API_KEY stay behind config+gateway seams
missing-config, provider-error, and invalid-output all fall back to fixture proposal generation
events/stream remains deferred to PR49 in this bundle
```

- [ ] **Step 4: Verify Bundle 2**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  sceneRunArtifactDetails.test.ts \
  runFixtureStore.test.ts \
  createServer.run-flow.test.ts \
  createServer.run-artifacts.test.ts \
  createServer.local-persistence.test.ts \
  createServer.draft-assembly-regression.test.ts
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/api typecheck
pnpm verify:prototype
```

Expected:

```text
planner output is visible through artifact detail only
restart persistence stays green
renderer-facing prototype regression proof remains intact
```

- [ ] **Step 5: Review and commit Bundle 2**

Commit after review passes:

```bash
git add packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts \
  packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts \
  packages/api/src/repositories/runFixtureStore.ts \
  packages/api/src/repositories/runFixtureStore.test.ts \
  packages/api/src/createServer.run-flow.test.ts \
  packages/api/src/createServer.run-artifacts.test.ts \
  packages/api/src/createServer.local-persistence.test.ts \
  packages/api/src/createServer.draft-assembly-regression.test.ts \
  doc/api-contract.md
git commit -m "2026-04-27, persist planner proposal output surfaces"
```

## Bundle 3: PR49A - Add Run Stream Transport Without Changing Product Event Semantics

**Files:**
- Create: `packages/api/src/repositories/run-event-stream-broker.ts`
- Create: `packages/api/src/repositories/run-event-stream-broker.test.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Modify: `packages/api/src/routes/run.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/api/src/createServer.runtime-info.test.ts`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Add failing tests for stream replay and runtime capability flags**

Lock these exact decisions:

```text
GET /api/projects/{projectId}/runs/{runId}/events/stream becomes a real stream endpoint
the endpoint can replay from an optional cursor and then tail later run-state publications
runtime-info flips runEventStream=true only when the stream endpoint is live
run events stay the same product records used by paged polling; no second event schema is introduced
```

- [ ] **Step 2: Introduce a stream broker that publishes existing product events**

Implementation target:

```text
run-event-stream-broker.ts owns subscribe/publish/complete behavior per runId
runFixtureStore publishes appended product events to the broker after start/review transitions
the broker never manufactures extra event kinds and never exposes raw provider/worker internals
```

- [ ] **Step 3: Replace the `501` placeholder with an SSE route**

Implementation target:

```text
routes/run.ts serves text/event-stream
optional query cursor preserves replay-from-cursor semantics
payload messages carry the same RunEventsPageRecord-compatible structure used by the current client contract
the old GET /runs/{runId}/events route remains unchanged for fallback and tests
```

- [ ] **Step 4: Verify Bundle 3**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  run-event-stream-broker.test.ts \
  runFixtureStore.test.ts \
  createServer.run-flow.test.ts \
  createServer.runtime-info.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected:

```text
stream replay and live tail behavior are covered
runtime-info advertises stream capability correctly
no route/regression drift appears in the existing paged-events contract
```

- [ ] **Step 5: Review and commit Bundle 3**

Commit after review passes:

```bash
git add packages/api/src/repositories/run-event-stream-broker.ts \
  packages/api/src/repositories/run-event-stream-broker.test.ts \
  packages/api/src/repositories/runFixtureStore.ts \
  packages/api/src/repositories/runFixtureStore.test.ts \
  packages/api/src/repositories/fixtureRepository.ts \
  packages/api/src/routes/run.ts \
  packages/api/src/createServer.run-flow.test.ts \
  packages/api/src/createServer.runtime-info.test.ts \
  doc/api-contract.md
git commit -m "2026-04-27, add run event stream transport"
```

## Bundle 4: PR49B - Teach The Renderer To Prefer Stream Updates And Fall Back Cleanly

**Files:**
- Modify: `packages/renderer/src/features/run/api/run-client.ts`
- Modify: `packages/renderer/src/app/project-runtime/api-project-runtime.ts`
- Modify: `packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.ts`
- Modify: `packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.test.tsx`
- Modify: `packages/renderer/src/features/run/hooks/useSceneRunSession.ts`
- Modify: `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx`
- Modify: `packages/renderer/src/app/project-runtime/api-project-runtime.test.ts`
- Modify: `packages/renderer/src/app/project-runtime/project-runtime-info.ts`

- [ ] **Step 1: Add failing renderer tests for stream-first behavior and fallback**

Lock these exact outcomes:

```text
API runtimes with stream capability subscribe to stream updates for the active run
stream pages are merged by event id and sorted by order exactly like paged polling results
if stream is unavailable, errors, or runtime capability says false, hooks fall back to getRunEvents paging
mock runtime and Storybook/test paths remain usable without a live stream endpoint
```

- [ ] **Step 2: Add a stream-capable run-client contract without breaking mock paths**

Implementation target:

```text
RunClient gains a streamRunEvents(...) method
api-project-runtime.ts implements it against /events/stream
mock run-client keeps a deterministic no-network fallback path for tests
project-runtime-info capability fields remain the feature switch, not route guessing
```

- [ ] **Step 3: Prefer stream subscriptions inside the existing session/timeline hooks**

Implementation target:

```text
useRunEventTimelineQuery keeps the current page-merge logic as fallback
useSceneRunSession stays the composition seam for run detail + event timeline
polling interval is disabled while stream subscription is healthy
polling resumes if stream capability is absent or the stream path fails
```

- [ ] **Step 4: Verify Bundle 4**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- \
  src/features/run/hooks/useRunEventTimelineQuery.test.tsx \
  src/features/run/hooks/useSceneRunSession.test.tsx \
  src/app/project-runtime/api-project-runtime.test.ts
pnpm --filter @narrative-novel/renderer typecheck
```

Expected:

```text
renderer uses stream transport when available
fallback to paged polling remains explicit and stable
no route or workbench shell changes are required for PR49B
```

- [ ] **Step 5: Review and commit Bundle 4**

Commit after review passes:

```bash
git add packages/renderer/src/features/run/api/run-client.ts \
  packages/renderer/src/app/project-runtime/api-project-runtime.ts \
  packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.ts \
  packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.test.tsx \
  packages/renderer/src/features/run/hooks/useSceneRunSession.ts \
  packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx \
  packages/renderer/src/app/project-runtime/api-project-runtime.test.ts \
  packages/renderer/src/app/project-runtime/project-runtime-info.ts
git commit -m "2026-04-27, prefer run stream updates in renderer"
```

## Bundle 5: PR49C - Add Desktop Worker Boundary Without Moving Product Logic Into Electron

**Files:**
- Create: `apps/desktop/src/main/process-supervisor-types.ts`
- Create: `apps/desktop/src/main/worker-supervisor.ts`
- Create: `apps/desktop/src/main/worker-supervisor.test.ts`
- Modify: `apps/desktop/src/main/main.ts`
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
- Modify: `apps/desktop/src/preload/desktop-api.ts`
- Modify: `apps/desktop/src/preload/index.ts`
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Add failing desktop tests for worker supervisor lifecycle and bridge exposure**

Lock these exact facts:

```text
worker supervisor has explicit statuses: disabled | starting | ready | failed | stopped
Electron main can read worker status and restart the worker without handing domain logic to the renderer
the preload bridge exposes typed worker/process snapshots only, never raw child-process handles or Node modules
```

- [ ] **Step 2: Build the worker supervisor as a process-boundary placeholder**

Implementation target:

```text
worker-supervisor.ts supervises a separate process or health-checked placeholder worker
the first worker implementation may be mock/health-only
no scene-run orchestration code moves into Electron main
renderer still talks to business capability through API, not worker IPC
```

- [ ] **Step 3: Expose narrow worker/process status through the existing desktop bridge**

Implementation target:

```text
desktop-bridge-types.ts adds typed worker/process snapshot records
desktop-api.ts exposes getWorkerStatus() and restartWorker()
main.ts registers the bridge handlers and keeps app shutdown/startup cleanup correct
doc/api-contract.md records that worker/process status is operational metadata, not product state
```

- [ ] **Step 4: Verify Bundle 5**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- \
  src/main/worker-supervisor.test.ts \
  src/preload/desktop-api.test.ts
pnpm --filter @narrative-novel/desktop typecheck
```

Expected:

```text
the worker boundary exists as a typed desktop process seam
no Electron-to-renderer capability leak appears
```

- [ ] **Step 5: Review and commit Bundle 5**

Commit after review passes:

```bash
git add apps/desktop/src/main/process-supervisor-types.ts \
  apps/desktop/src/main/worker-supervisor.ts \
  apps/desktop/src/main/worker-supervisor.test.ts \
  apps/desktop/src/main/main.ts \
  apps/desktop/src/shared/desktop-bridge-types.ts \
  apps/desktop/src/preload/desktop-api.ts \
  apps/desktop/src/preload/index.ts \
  apps/desktop/src/preload/desktop-api.test.ts \
  doc/api-contract.md
git commit -m "2026-04-27, add desktop worker process boundary"
```

## Bundle 6: PR50A - Make Desktop Local Project Selection Real

**Files:**
- Create: `apps/desktop/src/main/project-store.ts`
- Create: `apps/desktop/src/main/project-picker.ts`
- Create: `apps/desktop/src/main/recent-projects.ts`
- Create: `apps/desktop/src/main/project-store.test.ts`
- Create: `apps/desktop/src/main/project-picker.test.ts`
- Create: `apps/desktop/src/main/recent-projects.test.ts`
- Modify: `apps/desktop/src/main/runtime-config.ts`
- Modify: `apps/desktop/src/main/local-api-supervisor.ts`
- Modify: `apps/desktop/src/main/main.ts`
- Modify: `apps/desktop/src/main/app-menu.ts`
- Modify: `apps/desktop/src/shared/desktop-bridge-types.ts`
- Modify: `apps/desktop/src/preload/desktop-api.ts`
- Modify: `apps/desktop/src/preload/desktop-api.test.ts`
- Modify: `packages/api/src/config.ts`
- Modify: `packages/api/src/config.test.ts`
- Modify: `packages/api/src/createServer.ts`
- Modify: `packages/api/src/routes/project-runtime.ts`
- Modify: `packages/api/src/createServer.runtime-info.test.ts`
- Create: `packages/api/src/createServer.current-project.test.ts`

- [ ] **Step 1: Add failing desktop/API tests for project-root and recent-project behavior**

Lock these exact outcomes:

```text
desktop startup can restore the last valid project root
Open Project uses a native directory dialog and reads or initializes narrative.project.json
recent projects persist in Electron app data instead of renderer localStorage
local API child-process env uses the selected project root for NARRATIVE_PROJECT_STATE_FILE
API exposes a narrow current-project bootstrap read that matches the selected desktop project session
```

- [ ] **Step 2: Introduce a desktop project-session model anchored in Electron main**

Implementation target:

```text
project-picker.ts reads or initializes narrative.project.json
project-store.ts owns the current selected project root + metadata
recent-projects.ts persists and restores recently opened roots
main.ts resolves a project before starting the local API for desktop-local mode
app-menu.ts adds Open Project and Recent Projects commands
```

For the thin slice, keep the current canonical prototype identity stable:

```text
if narrative.project.json omits projectId, initialize it as book-signal-arc
do not widen PR50 into arbitrary multi-project seed generation
```

- [ ] **Step 3: Thread selected project metadata into desktop-local API bootstrap**

Implementation target:

```text
runtime-config.ts derives NARRATIVE_PROJECT_STATE_FILE from <selectedProjectRoot>/.narrative/prototype-state.json
config.ts/createServer.ts accept project-root/title/id env only as bootstrap metadata
project-runtime routes expose current project identity if the desktop bridge needs an API bootstrap read
runtime-info reflects the selected project title instead of always echoing book-signal-arc
```

- [ ] **Step 4: Verify Bundle 6**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- \
  src/main/project-store.test.ts \
  src/main/project-picker.test.ts \
  src/main/recent-projects.test.ts \
  src/preload/desktop-api.test.ts
pnpm --filter @narrative-novel/api test -- \
  config.test.ts \
  createServer.runtime-info.test.ts \
  createServer.current-project.test.ts
pnpm --filter @narrative-novel/desktop typecheck
pnpm --filter @narrative-novel/api typecheck
```

Expected:

```text
desktop-local now has a real local-project session
API bootstrap respects the selected project root and title
current prototype identity is still anchored to the existing fixture-backed contract
```

- [ ] **Step 5: Review and commit Bundle 6**

Commit after review passes:

```bash
git add apps/desktop/src/main/project-store.ts \
  apps/desktop/src/main/project-picker.ts \
  apps/desktop/src/main/recent-projects.ts \
  apps/desktop/src/main/project-store.test.ts \
  apps/desktop/src/main/project-picker.test.ts \
  apps/desktop/src/main/recent-projects.test.ts \
  apps/desktop/src/main/runtime-config.ts \
  apps/desktop/src/main/local-api-supervisor.ts \
  apps/desktop/src/main/main.ts \
  apps/desktop/src/main/app-menu.ts \
  apps/desktop/src/shared/desktop-bridge-types.ts \
  apps/desktop/src/preload/desktop-api.ts \
  apps/desktop/src/preload/desktop-api.test.ts \
  packages/api/src/config.ts \
  packages/api/src/config.test.ts \
  packages/api/src/createServer.ts \
  packages/api/src/routes/project-runtime.ts \
  packages/api/src/createServer.runtime-info.test.ts \
  packages/api/src/createServer.current-project.test.ts
git commit -m "2026-04-27, add desktop local project session"
```

## Bundle 7: PR50B - Adopt Desktop Project Identity In The Renderer And Close Storybook/MCP Verification

**Files:**
- Modify: `packages/renderer/src/app/runtime/runtime-config.ts`
- Modify: `packages/renderer/src/app/runtime/runtime-config.test.ts`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx`
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
- Modify: `packages/renderer/src/App.test.tsx`
- Modify: `README.md`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Add failing renderer tests and stories for desktop-local current-project identity**

Lock these exact user-facing outcomes:

```text
desktop-local runtime config can carry projectId and projectTitle
ProjectRuntimeProvider builds the API runtime from desktop-local project identity instead of env defaulting only
ProjectRuntimeStatusBadge shows narrow project identity + runtime health without becoming a dashboard
workbench shell stays intact across degraded desktop-local runtime states
```

- [ ] **Step 2: Adopt desktop-local project identity with no route/layout pollution**

Implementation target:

```text
runtime-config.ts validates desktop-local { runtimeMode, apiBaseUrl, projectId, projectTitle? }
ProjectRuntimeProvider uses runtimeConfig.projectId when present
ProjectRuntimeStatusBadge surfaces projectTitle or projectId in the existing shell status area
do not write project root, pane state, or recent-project data into the workbench route
do not add a new dashboard/start page inside the workbench
```

- [ ] **Step 3: Update Storybook and run MCP/browser verification**

Required Storybook closure:

```text
add/update stories for healthy desktop-local current-project state
add/update stories for unavailable desktop-local current-project state
if the shell header layout changes, update the affected WorkbenchShell story as well
```

Required verification:

```bash
pnpm --filter @narrative-novel/renderer test -- \
  src/app/runtime/runtime-config.test.ts \
  src/app/project-runtime/ProjectRuntimeProvider.test.tsx \
  src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx \
  src/App.test.tsx
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer build-storybook
```

Then perform Storybook verification with MCP structured snapshots on the affected runtime/project stories. Use the built-in browser or Storybook MCP snapshot flow; do not rely on screenshot-only verification.

- [ ] **Step 4: Final cross-package verification**

Run:

```bash
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/desktop test
pnpm --filter @narrative-novel/desktop typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer typecheck
pnpm verify:prototype
```

Expected:

```text
planner gateway integration, stream transport, worker boundary, and desktop local-project flow all pass without breaking the locked prototype path
frontend Storybook states and workbench shell behavior remain aligned with the constitution
```

- [ ] **Step 5: Review and commit Bundle 7**

Commit after review passes:

```bash
git add packages/renderer/src/app/runtime/runtime-config.ts \
  packages/renderer/src/app/runtime/runtime-config.test.ts \
  packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx \
  packages/renderer/src/App.test.tsx \
  README.md \
  doc/api-contract.md
git commit -m "2026-04-27, finish desktop local project usability"
```

## Execution Notes

- Bundle 1 and Bundle 2 together close the remaining PR48 work. Do not start PR49 bundles until both reviewed commits land.
- PR49 keeps product event semantics fixed. Stream transport may change delivery, but not event meaning or payload discipline.
- PR49 worker work is process-boundary only. Do not move run orchestration, project storage, or prompt/model logic into Electron main.
- PR50 keeps desktop-local inside the current prototype identity. The selected project root may change persistence/log roots and display metadata, but it must not silently invent a second seed system or renderer-local truth source.
- If implementation discovers that arbitrary project ids would require a second canonical seed or a route-model redesign, stop and request a follow-up plan instead of widening PR50.
- If PR50 frontend scope grows beyond runtime/project status presentation, add stories/tests for every affected workbench surface and verify them through Storybook MCP before review.

## Self-Review

### Spec Coverage

- Continue from actual branch state: covered by the Current Branch Baseline section and the file map, which explicitly references the already-present PR47 and PR48 Bundle 1/2 code.
- Cover remaining PR48 Bundle 3 work: covered by Bundle 1 and Bundle 2.
- Add a formal PR49 plan: covered by Bundle 3, Bundle 4, and Bundle 5.
- Add a formal PR50 plan: covered by Bundle 6 and Bundle 7.
- Preserve frontend constitution for any frontend work: covered by Scope Guard, PR50 bundle constraints, and Storybook/MCP verification requirements.
- Keep subagent-driven execution bundle-by-bundle with review/commit checkpoints: covered by the bundle structure and each bundle’s review/commit step.
- Avoid silent scope widening into generic web/dashboard behavior: covered by Scope Guard, PR50 route/layout restrictions, and the execution notes.

### Placeholder Scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Every bundle lists exact file paths, concrete outcomes, verification commands, and commit commands.
- The only conditional branch is an explicit stop rule for scope growth, not a placeholder implementation gap.

### Consistency Check

- PR48 planner work consistently uses the existing `scenePlannerGateway` seam already present on branch.
- PR49 consistently treats stream transport as a delivery change, not a new event model.
- PR50 consistently keeps project-session ownership in Electron main/API bootstrap and keeps renderer route/layout state clean.
- Storybook/MCP verification is required only for the frontend-touching PR50 bundle, not retroactively for the backend-only bundles.
