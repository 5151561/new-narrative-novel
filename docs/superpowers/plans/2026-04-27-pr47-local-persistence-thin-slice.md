# PR47 Local Persistence Thin Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current prototype run/review/prose chain survive API or desktop-local service restart through one explicit local project-state file, while keeping the HTTP contract, polling-only runtime shape, and thin desktop shell boundaries unchanged.

**Architecture:** Build on the current PR46 baseline instead of inventing a database or a second runtime path. `packages/api` remains the single product-state writer: it starts from canonical fixture seed, layers a project-scoped persisted overlay from `.narrative/prototype-state.json`, and rewrites that overlay after the narrow set of PR47 mutations. Desktop-local does not gain product logic; it only points the existing local API process at the same state-file contract so web/api and desktop-local keep one persistence path.

**Tech Stack:** TypeScript, Fastify, Node file system APIs, React-free API boundary, Electron desktop supervisor env wiring, Vitest, pnpm

---

This PR is limited to restart persistence for the current prototype chain:

```text
book-signal-arc
-> scene-midnight-platform
-> run
-> paged run events
-> review decision
-> canon patch
-> prose draft
-> trace
-> scene prose read surface
-> chapter draft assembly
-> book draft assembly
```

## Scope Guard

- Stay on `codex/pr46-prototype-regression-gate-demo-hardening`; do not create a worktree for this plan or its implementation.
- PR47 covers only the local persistence thin slice. Do not widen into PR48 model gateway work, PR49 streaming or worker runtime, or PR50 project picker / recent-project UX.
- Keep the current HTTP contract shape shared by `web/api` and `desktop-local`. Desktop remains a thin API supervisor and must not become a second backend.
- Keep `GET /runs/{runId}/events/stream` as explicit `501`. Do not add SSE, WebSocket, background workers, Temporal persistence, or hidden auto-resume behavior.
- Keep fixture seed as canonical truth. The persisted file is a mutable overlay with `schemaVersion` and `seedVersion` guardrails, not a replacement seed source and not a full database.
- Do not introduce renderer route changes, layout changes, new workbench UI, or localStorage changes in this PR. If implementation discovers renderer-visible contract drift, stop and request a follow-up plan instead of widening PR47.
- Reset-to-seed belongs in the API contract for this PR. It does not require project picker UX, desktop menus, or renderer affordances yet.

## Current Baseline To Build On

- PR46 is already complete on this branch and provides `pnpm verify:prototype`, rewrite-request hardening, API run-flow regression coverage, and canonical renderer route closure.
- Renderer-side mock persistence from PR19 already exists in:

```text
packages/renderer/src/app/project-runtime/project-persistence.ts
packages/renderer/src/app/project-runtime/local-storage-project-persistence.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
```

  That boundary is intentionally renderer/mock-only and must not become the product persistence path for PR47.

- `packages/api/src/createServer.ts` still instantiates an in-memory repository through:

```ts
createFixtureRepository({ apiBaseUrl })
```

- `packages/api/src/repositories/fixtureRepository.ts` owns the mutable project snapshot and the scene-to-book read-surface sync, but today it only lives in memory and only exposes `reset()` as an in-process helper.
- `packages/api/src/repositories/runFixtureStore.ts` currently keeps run records, paged events, artifact details, trace graphs, and run sequence counters in memory only.
- `doc/api-contract.md` already states that desktop-local and API runtime share the same `/api/projects/{projectId}/...` contract and that `/events/stream` remains a placeholder.
- `apps/desktop/src/main/runtime-config.ts` and `apps/desktop/src/main/local-api-supervisor.ts` already launch the local API process with thin env wiring, but they do not yet point that process at a durable project-state file.

## PR47 Persistence Contract

Persist exactly these product-facing prototype surfaces:

```text
1. Run records, paged run events, selected variants, artifact summaries/details, and trace graphs required by current run read surfaces.
2. Generated canon patch and prose draft artifacts required by artifact and trace reads.
3. Accepted scene prose read model and the chapter/book draft assembly inputs derived from that read model.
4. Review decisions needed by current review read surfaces.
5. Enough scene/chapter metadata for route-visible continuity after restart, including latest run linkage and prose status labels.
```

The persisted file must not take on later-PR responsibilities. Explicit non-goals for PR47:

```text
- no full database
- no cloud sync
- no user or auth system
- no project picker or recent-project history
- no worker queue persistence
- no event streaming transport
- no renderer shell or layout persistence
```

## File Map

- `docs/superpowers/plans/2026-04-27-pr47-local-persistence-thin-slice.md`
  Purpose: this implementation plan only.
- `doc/api-contract.md`
  Purpose: document the local project-state file, reset-to-seed route, schema/seed-version guard, and the exact persisted versus non-persisted prototype surfaces.
- `packages/api/src/config.ts`
  Purpose: expose the local state-file path to the API server through one explicit config field, defaulting to workspace-root `.narrative/prototype-state.json`.
- `packages/api/src/config.test.ts`
  Purpose: lock env parsing and default-path resolution for the state-file config.
- `packages/api/src/createServer.ts`
  Purpose: pass the resolved state-file config into the fixture repository without changing the external HTTP contract.
- `packages/api/src/routes/project-runtime.ts`
  Purpose: keep project-level runtime routes together and add one reset-to-seed write route for PR47.
- `packages/api/src/repositories/project-state-persistence.ts`
  Purpose: own the on-disk JSON envelope, schema validation, seed-version guard, load/save/clear operations, and directory creation for `.narrative/prototype-state.json`.
- `packages/api/src/repositories/project-state-persistence.test.ts`
  Purpose: protect invalid JSON handling, schema-version guard, seed-version mismatch fallback, and clear/reset semantics.
- `packages/api/src/repositories/runFixtureStore.ts`
  Purpose: export and hydrate project-scoped run-store state instead of keeping runs, events, artifacts, traces, and sequence counters memory-only.
- `packages/api/src/repositories/runFixtureStore.test.ts`
  Purpose: lock run-store snapshot export/import, artifact continuity, event paging, and rewrite-request stability after hydration.
- `packages/api/src/repositories/fixtureRepository.ts`
  Purpose: hydrate project overlays on startup, persist after the narrow PR47 mutation set, and reset one project back to canonical seed while keeping the existing read/write contract intact.
- `packages/api/src/createServer.local-persistence.test.ts`
  Purpose: prove end-to-end restart persistence, reset-to-seed behavior, and seed-version mismatch fallback across fresh server instances using the same on-disk state file.
- `packages/api/src/createServer.run-flow.test.ts`
  Purpose: keep the current HTTP run flow green after hydration support is added.
- `packages/api/src/createServer.run-artifacts.test.ts`
  Purpose: ensure canon patch, prose draft, and trace surfaces remain readable after persistence and restart.
- `packages/api/src/createServer.draft-assembly-regression.test.ts`
  Purpose: keep accepted versus rewrite-request downstream manuscript behavior stable with persistence enabled.
- `packages/api/src/createServer.book-draft-live-assembly.test.ts`
  Purpose: protect book-draft live assembly after accepted scene prose survives restart.
- `packages/api/src/createServer.runtime-info.test.ts`
  Purpose: keep runtime-info healthy and the local supervisor health endpoint unchanged while the new state-file contract is active.
- `packages/api/src/createServer.write-surfaces.test.ts`
  Purpose: move reset-to-seed verification from repository-only helper coverage into the HTTP write surface expected by PR47.
- `packages/api/src/test/support/test-server.ts`
  Purpose: allow API integration tests to launch fresh servers against a temporary state file without touching global machine state.
- `apps/desktop/src/main/runtime-config.ts`
  Purpose: pass the exact same project-state file path to the desktop-local API child process, keeping desktop on the shared API persistence contract.
- `apps/desktop/src/main/runtime-config.test.ts`
  Purpose: lock the desktop-local child-process env so `NARRATIVE_PROJECT_STATE_FILE` points at workspace-root `.narrative/prototype-state.json`.

## Bundle 1: Define The Local Project-State File Contract And Guards

**Files:**
- Modify: `packages/api/src/config.ts`
- Modify: `packages/api/src/config.test.ts`
- Create: `packages/api/src/repositories/project-state-persistence.ts`
- Create: `packages/api/src/repositories/project-state-persistence.test.ts`

- [ ] **Step 1: Write failing tests for config and persistence envelope behavior**

Add tests that lock these exact PR47 decisions before implementation:

```text
state file default path = <workspaceRoot>/.narrative/prototype-state.json
override env = NARRATIVE_PROJECT_STATE_FILE
schemaVersion = 1
seedVersion = "prototype-fixture-seed-v1"
invalid JSON or wrong schemaVersion returns no overlay instead of crashing the server
seedVersion mismatch ignores the saved overlay instead of partially merging stale state
clear() removes persisted overlay content for one project without deleting canonical seed
```

- [ ] **Step 2: Add the project-state persistence module**

Create `packages/api/src/repositories/project-state-persistence.ts` with one focused responsibility:

```text
resolve workspace-root state-file path
read and validate one JSON envelope from disk
store project-scoped overlays keyed by projectId
guard on schemaVersion and seedVersion
write atomically by ensuring the .narrative directory exists and rewriting the file
clear one project overlay without touching seed data
```

Use one persisted envelope for PR47:

```json
{
  "schemaVersion": 1,
  "seedVersion": "prototype-fixture-seed-v1",
  "projects": {
    "book-signal-arc": {
      "updatedAt": "2026-04-27T00:00:00.000Z",
      "reviewDecisions": {},
      "reviewFixActions": {},
      "exportArtifacts": {},
      "chapters": {},
      "scenes": {},
      "runStore": {
        "runStates": [],
        "sceneSequences": {}
      }
    }
  }
}
```

Implementation rule for this bundle:

```text
the overlay may contain only mutable project state
do not copy seed-only books, assets, manuscript checkpoints, export profiles, or experiment branches into the file
```

- [ ] **Step 3: Add the API config seam for the state file**

Extend `ApiServerConfig` in `packages/api/src/config.ts` with:

```text
projectStateFilePath: string
```

Rules:

```text
prefer NARRATIVE_PROJECT_STATE_FILE when present
otherwise resolve workspace-root .narrative/prototype-state.json
keep host/port/apiBasePath/apiBaseUrl behavior unchanged
```

- [ ] **Step 4: Verify Bundle 1**

Run:

```bash
pnpm --filter @narrative-novel/api test -- config.test.ts project-state-persistence.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected:

```text
config tests prove the exact state-file path contract
persistence tests prove schema/seed guards and clear semantics
API typecheck stays green before repository integration starts
```

- [ ] **Step 5: Review and commit Bundle 1**

Commit after review passes:

```bash
git add packages/api/src/config.ts \
  packages/api/src/config.test.ts \
  packages/api/src/repositories/project-state-persistence.ts \
  packages/api/src/repositories/project-state-persistence.test.ts
git commit -m "2026-04-27, define prototype state file contract"
```

## Bundle 2: Persist The Prototype Chain Across Fresh API Servers

**Files:**
- Modify: `packages/api/src/createServer.ts`
- Modify: `packages/api/src/routes/project-runtime.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Modify: `packages/api/src/test/support/test-server.ts`
- Create: `packages/api/src/createServer.local-persistence.test.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/api/src/createServer.run-artifacts.test.ts`
- Modify: `packages/api/src/createServer.draft-assembly-regression.test.ts`
- Modify: `packages/api/src/createServer.book-draft-live-assembly.test.ts`
- Modify: `packages/api/src/createServer.runtime-info.test.ts`
- Modify: `packages/api/src/createServer.write-surfaces.test.ts`

- [ ] **Step 1: Extend unit and integration tests before wiring persistence**

Add failing coverage for these exact restart scenarios:

```text
accepted scene run survives server restart with:
  run detail
  paged events
  canon patch artifact
  prose draft artifact
  trace graph
  scene prose read model
  chapter draft assembly
  book draft assembly

request-rewrite and reject still do not overwrite existing accepted prose after restart

POST /api/projects/:projectId/runtime/reset restores canonical seed state and removes the saved overlay for that project

schemaVersion or seedVersion mismatch ignores the old overlay and serves canonical seed data on the next fresh server

GET /api/projects/:projectId/runtime-info remains healthy
GET /api/health remains unchanged for the desktop supervisor
GET /runs/:runId/events/stream remains 501
```

Use a temp file in `createServer.local-persistence.test.ts` and launch two fresh servers against the same path to prove real restart continuity instead of in-process mutation only.

- [ ] **Step 2: Teach the run store to export and hydrate project snapshots**

Extend `packages/api/src/repositories/runFixtureStore.ts` with project-scoped persistence helpers:

```text
exportProjectSnapshot(projectId)
hydrateProjectSnapshot(projectId, snapshot)
clearProjectSnapshot(projectId)
```

The exported run-store snapshot must preserve:

```text
run record
ordered event list
artifact list
artifact-derived details and summaries after re-index
selected variants
latestReviewDecision
trace nodes and links after re-index
scene run sequence counters
```

Keep one implementation rule explicit:

```text
persist raw run state and re-index derived read surfaces on hydrate
do not persist duplicated derived Maps if they can be rebuilt deterministically
```

- [ ] **Step 3: Hydrate and persist the fixture repository**

Wire `packages/api/src/repositories/fixtureRepository.ts` to:

```text
start from createFixtureDataSnapshot(apiBaseUrl)
load the project overlay from project-state-persistence
apply the overlay only to mutable project slices:
  reviewDecisions
  reviewFixActions
  exportArtifacts
  chapters
  scenes
  runStore snapshot
persist again after the narrow PR47 mutation set
```

Persist after these mutation paths and no more:

```text
setReviewDecision
clearReviewDecision
setReviewFixAction
clearReviewFixAction
createBookExportArtifact
startSceneRun
submitRunReviewDecision
reviseSceneProse
resetProjectRuntimeState
```

Do not widen persistence to unrelated later-PR concerns such as worker queues, project picker metadata, or renderer-local layout.

- [ ] **Step 4: Add one project-level reset-to-seed route**

Extend `packages/api/src/routes/project-runtime.ts` with:

```text
POST /api/projects/:projectId/runtime/reset
```

Route behavior:

```text
reset in-memory mutable project state back to canonical fixture seed
clear the saved overlay for that project from .narrative/prototype-state.json
return 204
do not restart the server
do not touch other projectIds stored in the same file
```

- [ ] **Step 5: Keep createServer and test support thin**

Update `packages/api/src/createServer.ts` and `packages/api/src/test/support/test-server.ts` so tests can pass an explicit `projectStateFilePath` without changing route behavior or requiring global machine setup.

Constraint:

```text
createServer stays a thin constructor
all persistence semantics live in repository and persistence modules, not in route handlers
```

- [ ] **Step 6: Verify Bundle 2**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  runFixtureStore.test.ts \
  createServer.local-persistence.test.ts \
  createServer.run-flow.test.ts \
  createServer.run-artifacts.test.ts \
  createServer.draft-assembly-regression.test.ts \
  createServer.book-draft-live-assembly.test.ts \
  createServer.runtime-info.test.ts \
  createServer.write-surfaces.test.ts
pnpm --filter @narrative-novel/api typecheck
```

Expected:

```text
fresh-server persistence is proven through the real HTTP contract
reset route restores canonical seed state
runtime-info and /api/health stay stable
events/stream remains 501
```

- [ ] **Step 7: Review and commit Bundle 2**

Commit after review passes:

```bash
git add packages/api/src/createServer.ts \
  packages/api/src/routes/project-runtime.ts \
  packages/api/src/repositories/runFixtureStore.ts \
  packages/api/src/repositories/runFixtureStore.test.ts \
  packages/api/src/repositories/fixtureRepository.ts \
  packages/api/src/test/support/test-server.ts \
  packages/api/src/createServer.local-persistence.test.ts \
  packages/api/src/createServer.run-flow.test.ts \
  packages/api/src/createServer.run-artifacts.test.ts \
  packages/api/src/createServer.draft-assembly-regression.test.ts \
  packages/api/src/createServer.book-draft-live-assembly.test.ts \
  packages/api/src/createServer.runtime-info.test.ts \
  packages/api/src/createServer.write-surfaces.test.ts
git commit -m "2026-04-27, persist prototype state across API restart"
```

## Bundle 3: Put Desktop-Local On The Same Contract And Refresh Docs

**Files:**
- Modify: `apps/desktop/src/main/runtime-config.ts`
- Modify: `apps/desktop/src/main/runtime-config.test.ts`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Point the desktop-local child process at the shared state file**

Update `apps/desktop/src/main/runtime-config.ts` so `createLocalApiProcessConfig()` injects:

```text
NARRATIVE_PROJECT_STATE_FILE=<workspaceRoot>/.narrative/prototype-state.json
```

Rules:

```text
desktop-local still chooses host/port dynamically
desktop-local still uses the same /api/health readiness probe
desktop-local does not gain project selection, recent-project history, or any renderer-visible persistence UI in this PR
```

- [ ] **Step 2: Lock the desktop env seam in tests**

Extend `apps/desktop/src/main/runtime-config.test.ts` so it proves:

```text
the spawned API child process receives NARRATIVE_PROJECT_STATE_FILE
the path resolves from workspaceRoot instead of the desktop package directory
existing HOST / PORT / NARRATIVE_RUNTIME env values stay intact
```

- [ ] **Step 3: Update the API contract doc**

Refresh `doc/api-contract.md` with one PR47 section that states:

```text
desktop-local and web/api now share the same local project-state file contract
default local file = .narrative/prototype-state.json
schemaVersion = 1
seedVersion = prototype-fixture-seed-v1
persisted surfaces = review decisions, run history, artifacts, trace, accepted scene prose, chapter/book draft inputs
non-persisted surfaces = streaming transport, project picker, worker queues, auth, renderer layout state
reset route = POST /api/projects/{projectId}/runtime/reset
events/stream remains 501
```

- [ ] **Step 4: Run final verification**

Run:

```bash
pnpm --filter @narrative-novel/desktop test -- runtime-config.test.ts
pnpm --filter @narrative-novel/desktop typecheck
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/api typecheck
pnpm verify:prototype
```

Expected:

```text
desktop-local launches the API with the shared state-file env
full API suite stays green with persistence enabled
PR46 prototype regression gate still passes unchanged
```

- [ ] **Step 5: Storybook / MCP decision**

No Storybook or MCP verification is required for the intended PR47 path because this plan does not touch renderer files or workbench UI surfaces.

Hard stop rule:

```text
if implementation starts changing renderer UI or renderer runtime copy, stop and request a follow-up plan because frontend constitution, Storybook updates, and MCP verification would then become mandatory
```

- [ ] **Step 6: Review and commit Bundle 3**

Commit after review passes:

```bash
git add apps/desktop/src/main/runtime-config.ts \
  apps/desktop/src/main/runtime-config.test.ts \
  doc/api-contract.md
git commit -m "2026-04-27, wire desktop local state file contract"
```

## Execution Notes

- Review each bundle after all tasks in that bundle are complete, then commit once per reviewed bundle.
- Keep changes narrow. If a mutation path outside the listed PR47 set appears to need persistence, do not silently broaden the slice; record it as follow-up scope unless it blocks the current prototype chain.
- Preserve the existing `pnpm verify:prototype` contract from PR46. This PR should make restart continuity better without changing the canonical scene route, renderer shell behavior, or rewrite-request semantics already locked in PR46.

## Self-Review

### Spec Coverage

- Restart persistence for review decisions, canon patch, prose draft, trace, scene prose, and downstream chapter/book assembly is covered by Bundle 2 integration tests and repository/run-store hydration work.
- Thin local-file storage, reset-to-seed, and schema/seed-version migration guard are covered by Bundle 1 contract work plus Bundle 2 reset and mismatch tests.
- Desktop and API sharing one project-state contract is covered by Bundle 3 runtime-config env wiring and doc refresh.
- `/events/stream` staying `501` and later PR48-PR50 remaining out of scope are explicitly guarded in Scope Guard and Bundle 2 verification.

### Assumptions To Check Before Execution

- This plan assumes the default persisted file should live at workspace-root `.narrative/prototype-state.json`. If the controller wants a different explicit local path, change that decision before implementation starts.
- This plan assumes reset-to-seed should be exposed as HTTP-only `POST /api/projects/:projectId/runtime/reset` in PR47, with no renderer or desktop UX yet.
- This plan assumes PR47 may persist mutable `chapters` alongside `scenes` so navigator-visible prose and run labels survive restart, but it does not widen into new chapter-edit UX or project-management behavior.
