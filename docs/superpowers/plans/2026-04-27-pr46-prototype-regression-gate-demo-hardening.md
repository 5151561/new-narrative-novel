# PR46 Prototype Regression Gate / Demo Chain Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the PR45 prototype demo chain into one automated regression gate that protects the API run contract, canonical renderer route, and rewrite-request semantics without widening beyond the current polling-based prototype.

**Architecture:** Build on the current PR45 baseline instead of redesigning it. The fixture API already owns the prototype run/review/prose chain, the renderer already has an API-backed scene smoke, and Storybook already exposes the affected workbench surfaces. PR46 adds a repo-level verification entrypoint, strengthens API and renderer regression coverage around the canonical demo path, and hardens rewrite-request behavior so the product no longer implies that an unseen background rewrite will continue automatically.

**Tech Stack:** TypeScript, Fastify fixture API, React, TanStack Query, Vitest, pnpm, Storybook

---

This PR is limited to the current usable prototype chain:

```text
book-signal-arc
-> scene-midnight-platform
-> run
-> paged run events
-> review decision
-> artifact + trace read surfaces
-> prose draft
-> chapter draft
-> book draft
```

## Scope Guard

- Stay on `codex/pr46-prototype-regression-gate-demo-hardening`; do not create a worktree for this single-line plan and implementation sequence.
- Keep `WorkbenchShell` ownership, scope x lens routing, route/layout separation, and the current canonical scene route unchanged.
- Keep `GET /runs/{runId}/events/stream` as explicit `501` placeholder; do not implement SSE, streaming transport, Temporal history, or background workers.
- Do not add local persistence, real model gateways, desktop packaging work, auth, or new product surfaces.
- Do not broaden into PR47-PR50. A one-line out-of-scope note is enough; no later-PR decomposition belongs in this file.
- Rewrite-request hardening must stay inside the current run/review/read surfaces. Do not invent autonomous rerun orchestration in this PR.

## Current Baseline To Build On

- `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts` already defaults to:

```text
scope=scene
id=scene-midnight-platform
lens=orchestrate
tab=execution
```

- `packages/renderer/src/App.scene-runtime-smoke.test.tsx` already covers the happy-path API-backed chain:

```text
Run Scene
-> Waiting Review
-> Accept With Edit
-> Trace
-> Scene Prose
-> Chapter Draft
-> Book Draft
```

- `packages/api/src/createServer.run-flow.test.ts` already covers:

```text
start run
-> run detail
-> paged events
-> review decision submit
-> downstream scene/chapter updates
-> events/stream 501 placeholder
```

- `packages/api/src/createServer.draft-assembly-regression.test.ts` and `packages/api/src/createServer.book-draft-live-assembly.test.ts` already prove that `request-rewrite` and `reject` do not overwrite existing prose-derived downstream reads.

- `packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts`, `packages/api/src/repositories/runFixtureStore.ts`, and `packages/renderer/src/features/run/api/mock-run-db.ts` currently describe `request-rewrite` as returning the run to `running`, which is the drift PR46 must close.

- Root scripts currently expose `dev:api`, `dev:desktop`, `dev:renderer`, `typecheck`, `test`, `build`, and `storybook`. There is no root `verify:prototype` entrypoint yet.

## File Map

- `package.json`
  Purpose: expose one root `verify:prototype` command for the PR45 demo chain regression gate.
- `scripts/verify-prototype.mjs`
  Purpose: run the focused PR46 API + renderer regression suite in a deterministic order and fail fast on drift.
- `doc/api-contract.md`
  Purpose: keep polling-only prototype contract wording and rewrite-request semantics aligned with the implemented gate.
- `packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts`
  Purpose: define post-review transition semantics, especially the non-auto-continuing rewrite-request outcome.
- `packages/api/src/orchestration/sceneRun/sceneRunTransitions.test.ts`
  Purpose: lock review-decision transition events, summaries, statuses, and artifact generation rules.
- `packages/api/src/repositories/runFixtureStore.ts`
  Purpose: materialize run state, events, artifacts, and trace for the fixture API under the hardened rewrite-request semantics.
- `packages/api/src/repositories/runFixtureStore.test.ts`
  Purpose: protect store-level event paging, artifact/trace readability, and rewrite-request terminal behavior.
- `packages/api/src/repositories/fixtureRepository.ts`
  Purpose: map hardened run status into scene workspace and execution read surfaces without implying hidden background continuation.
- `packages/api/src/createServer.run-flow.test.ts`
  Purpose: protect the end-to-end HTTP run flow for start, paged events, review decision submit, and stream placeholder.
- `packages/api/src/createServer.run-artifacts.test.ts`
  Purpose: keep artifact detail and trace read surfaces readable after accepted runs and stable after rewrite-request decisions.
- `packages/api/src/createServer.draft-assembly-regression.test.ts`
  Purpose: preserve downstream prose/chapter/book expectations after accepted and rewrite-requested reviews.
- `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
  Purpose: lock the canonical route and API-backed scene-to-book chain from the real renderer shell.
- `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.test.tsx`
  Purpose: prevent default-route drift away from the canonical scene orchestrate execution entry.
- `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx`
  Purpose: keep active-run selection and rewrite-request session behavior aligned with the hardened API contract.
- `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
  Purpose: communicate run-session state in the Main Stage without implying invisible rewrite continuation.
- `packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx`
  Purpose: lock Main Stage run-status copy, CTA availability, and rewrite-request guidance.
- `packages/renderer/src/features/scene/components/SceneBottomDock.tsx`
  Purpose: keep Bottom Dock support-only while showing the hardened active-run summary and trace/artifact support.
- `packages/renderer/src/features/scene/components/SceneBottomDock.test.tsx`
  Purpose: protect dock-side support messaging for waiting-review and rewrite-request states.
- `packages/renderer/src/features/run/components/RunReviewGate.tsx`
  Purpose: keep the waiting-review decision UI explicit about review ownership and rewrite-request intent.
- `packages/renderer/src/features/run/components/RunReviewGate.test.tsx`
  Purpose: protect submit payloads and any wording changes required by the hardened rewrite-request flow.
- `packages/renderer/src/features/run/api/mock-run-db.ts`
  Purpose: keep Storybook/test mock run behavior aligned with the real fixture API semantics.
- `packages/renderer/src/app/project-runtime/mock-project-runtime.test.ts`
  Purpose: keep mock runtime review-decision behavior aligned with the renderer-facing contract.
- `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`
  Purpose: keep the canonical scene workspace mockup in sync and add a stable rewrite-requested story state if the UI changes.
- `packages/renderer/src/features/run/components/RunReviewGate.stories.tsx`
  Purpose: keep review-gate copy and decision states in sync for Storybook inspection.

## Bundle 1: Add The Automated Prototype Regression Gate And Lock API Contract Coverage

**Files:**
- Modify: `package.json`
- Create: `scripts/verify-prototype.mjs`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunTransitions.test.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/api/src/createServer.run-artifacts.test.ts`
- Modify: `packages/api/src/createServer.draft-assembly-regression.test.ts`

- [ ] **Step 1: Extend the API regression tests before adding the new root gate**

Add failing assertions that cover the exact PR46 target:

```text
start scene run
-> paged events stay polling-based
-> accepted review exposes readable artifact + trace surfaces
-> rewrite-request does not auto-produce new run milestones, new artifacts, or overwritten draft assembly
-> events/stream stays 501
```

Use these files for the failing test additions:

```text
packages/api/src/orchestration/sceneRun/sceneRunTransitions.test.ts
packages/api/src/repositories/runFixtureStore.test.ts
packages/api/src/createServer.run-flow.test.ts
packages/api/src/createServer.run-artifacts.test.ts
packages/api/src/createServer.draft-assembly-regression.test.ts
```

- [ ] **Step 2: Run the focused API tests and confirm the current rewrite-request drift is exposed**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  sceneRunTransitions.test.ts \
  runFixtureStore.test.ts \
  createServer.run-flow.test.ts \
  createServer.run-artifacts.test.ts \
  createServer.draft-assembly-regression.test.ts
```

Expected before implementation:

```text
accepted-run assertions still pass
new rewrite-request hardening assertions fail because the current baseline still says "returned to execution" / running
stream placeholder assertions continue to pass
```

- [ ] **Step 3: Add the root regression gate entrypoint**

Create `scripts/verify-prototype.mjs` and wire it through `package.json` as:

```text
pnpm verify:prototype
```

The script must execute, in order:

```text
pnpm --filter @narrative-novel/api test -- sceneRunTransitions.test.ts runFixtureStore.test.ts createServer.run-flow.test.ts createServer.run-artifacts.test.ts createServer.draft-assembly-regression.test.ts
pnpm --filter @narrative-novel/renderer test -- App.scene-runtime-smoke.test.tsx useWorkbenchRouteState.test.tsx useSceneRunSession.test.tsx SceneExecutionTab.test.tsx SceneBottomDock.test.tsx RunReviewGate.test.tsx mock-project-runtime.test.ts
```

Design constraint:

```text
no shell-only concatenation inside package.json
single script owns ordering and exit code
no Storybook server launch from this script
```

- [ ] **Step 4: Re-run the focused API tests after the new gate entrypoint is wired**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  sceneRunTransitions.test.ts \
  runFixtureStore.test.ts \
  createServer.run-flow.test.ts \
  createServer.run-artifacts.test.ts \
  createServer.draft-assembly-regression.test.ts
pnpm verify:prototype
```

Expected after this bundle:

```text
API tests are green except for renderer-dependent checks still pending in later bundles
pnpm verify:prototype reaches the renderer test segment and fails only on not-yet-implemented renderer hardening
```

- [ ] **Step 5: Review and commit Bundle 1**

Commit after review passes:

```bash
git add package.json \
  scripts/verify-prototype.mjs \
  packages/api/src/orchestration/sceneRun/sceneRunTransitions.test.ts \
  packages/api/src/repositories/runFixtureStore.test.ts \
  packages/api/src/createServer.run-flow.test.ts \
  packages/api/src/createServer.run-artifacts.test.ts \
  packages/api/src/createServer.draft-assembly-regression.test.ts
git commit -m "2026-04-27, add prototype regression gate coverage"
```

## Bundle 2: Harden Rewrite-Request Semantics In The Fixture API And Mock Runtime

**Files:**
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts`
- Modify: `packages/api/src/orchestration/sceneRun/sceneRunTransitions.test.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.ts`
- Modify: `packages/api/src/repositories/runFixtureStore.test.ts`
- Modify: `packages/api/src/repositories/fixtureRepository.ts`
- Modify: `packages/api/src/createServer.run-flow.test.ts`
- Modify: `packages/api/src/createServer.run-artifacts.test.ts`
- Modify: `packages/api/src/createServer.draft-assembly-regression.test.ts`
- Modify: `packages/renderer/src/features/run/api/mock-run-db.ts`
- Modify: `packages/renderer/src/app/project-runtime/mock-project-runtime.test.ts`

- [ ] **Step 1: Decide and lock the non-auto-continuing rewrite-request outcome in tests first**

Use the tests from Bundle 1 to enforce this exact PR46 contract:

```text
request-rewrite clears pendingReviewId
request-rewrite appends only review_decision_submitted
request-rewrite does not materialize canon patch or prose-draft artifacts
request-rewrite does not mutate existing scene/chapter/book draft assembly
request-rewrite no longer claims that the run returned to background execution automatically
```

For implementation, use an existing terminal `RunStatus` instead of inventing a new status enum. The status and summary must make one thing explicit:

```text
rewrite was requested
automatic follow-up execution is not happening in this PR
the next pass requires an explicit new run from the user
```

- [ ] **Step 2: Patch API transition/store/repository behavior to match the hardened contract**

Update:

```text
packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts
packages/api/src/repositories/runFixtureStore.ts
packages/api/src/repositories/fixtureRepository.ts
```

Implementation constraints:

```text
keep events/stream at 501
keep accepted and accept-with-edit behavior unchanged
keep reject behavior unchanged
do not spawn a follow-up run
do not add persistence or scheduler concepts
```

- [ ] **Step 3: Mirror the same rewrite-request semantics in renderer mock data**

Update `packages/renderer/src/features/run/api/mock-run-db.ts` and `packages/renderer/src/app/project-runtime/mock-project-runtime.test.ts` so Storybook and runtime-facing tests stop advertising invisible continuation.

The mock/runtime alignment must preserve:

```text
selected variant behavior
artifact detail readability for accepted runs
polling-only event queries
```

- [ ] **Step 4: Re-run the focused API and mock-runtime tests**

Run:

```bash
pnpm --filter @narrative-novel/api test -- \
  sceneRunTransitions.test.ts \
  runFixtureStore.test.ts \
  createServer.run-flow.test.ts \
  createServer.run-artifacts.test.ts \
  createServer.draft-assembly-regression.test.ts
pnpm --filter @narrative-novel/renderer test -- \
  mock-project-runtime.test.ts
pnpm verify:prototype
```

Expected:

```text
API rewrite-request tests pass with the new explicit non-auto-continuing semantics
mock runtime reflects the same post-review state
pnpm verify:prototype still fails only on renderer UI/tests not updated yet
```

- [ ] **Step 5: Review and commit Bundle 2**

Commit after review passes:

```bash
git add packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts \
  packages/api/src/orchestration/sceneRun/sceneRunTransitions.test.ts \
  packages/api/src/repositories/runFixtureStore.ts \
  packages/api/src/repositories/runFixtureStore.test.ts \
  packages/api/src/repositories/fixtureRepository.ts \
  packages/api/src/createServer.run-flow.test.ts \
  packages/api/src/createServer.run-artifacts.test.ts \
  packages/api/src/createServer.draft-assembly-regression.test.ts \
  packages/renderer/src/features/run/api/mock-run-db.ts \
  packages/renderer/src/app/project-runtime/mock-project-runtime.test.ts
git commit -m "2026-04-27, harden rewrite-request demo semantics"
```

## Bundle 3: Lock Renderer Canonical Route, API-Backed Demo Smoke, And Storybook Surfaces

**Files:**
- Modify: `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
- Modify: `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.test.tsx`
- Modify: `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx`
- Modify: `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
- Modify: `packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx`
- Modify: `packages/renderer/src/features/scene/components/SceneBottomDock.tsx`
- Modify: `packages/renderer/src/features/scene/components/SceneBottomDock.test.tsx`
- Modify: `packages/renderer/src/features/run/components/RunReviewGate.tsx`
- Modify: `packages/renderer/src/features/run/components/RunReviewGate.test.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`
- Modify: `packages/renderer/src/features/run/components/RunReviewGate.stories.tsx`
- Modify: `doc/api-contract.md`

- [ ] **Step 1: Add failing renderer tests for canonical-route and rewrite-request clarity**

Extend the renderer test coverage to protect:

```text
default route remains scene-midnight-platform / orchestrate / execution
App.scene-runtime-smoke still drives the accepted demo chain end-to-end against the API runtime
rewrite-request state does not look like an active background run
Main Stage copy tells the user the next pass requires an explicit new run when auto-rewrite is not implemented
Bottom Dock stays support-only and mirrors the same state without reintroducing decision ownership there
```

Use these files:

```text
packages/renderer/src/App.scene-runtime-smoke.test.tsx
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.test.tsx
packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx
packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx
packages/renderer/src/features/scene/components/SceneBottomDock.test.tsx
packages/renderer/src/features/run/components/RunReviewGate.test.tsx
```

- [ ] **Step 2: Patch the renderer surfaces with the minimum workbench-safe changes**

Update:

```text
packages/renderer/src/features/scene/components/SceneExecutionTab.tsx
packages/renderer/src/features/scene/components/SceneBottomDock.tsx
packages/renderer/src/features/run/components/RunReviewGate.tsx
packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx
```

Implementation constraints:

```text
do not change route shape
do not move review decisions out of the Main Stage
do not add new layout state
do not add a new page or modal
keep artifact/trace as supporting context
```

- [ ] **Step 3: Sync Storybook for every affected frontend surface**

Update Storybook so the changed behavior is inspectable without running the full app:

```text
packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx
packages/renderer/src/features/run/components/RunReviewGate.stories.tsx
```

Storybook coverage must include:

```text
existing waiting-review main-stage gate still renders
a stable rewrite-requested / manual-restart-visible state if the Main Stage copy changes after Bundle 2
review gate copy remains aligned with the current decision semantics
```

- [ ] **Step 4: Keep the contract doc aligned with the hardened prototype**

Update `doc/api-contract.md` so Section 10 stays honest about:

```text
polling remains the current behavior
events/stream remains placeholder-only
request-rewrite does not imply automatic rerun in PR46
accepted decisions still drive prose/chapter/book reads
```

- [ ] **Step 5: Run the focused renderer suite, the root gate, and repo-level validation**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- \
  App.scene-runtime-smoke.test.tsx \
  useWorkbenchRouteState.test.tsx \
  useSceneRunSession.test.tsx \
  SceneExecutionTab.test.tsx \
  SceneBottomDock.test.tsx \
  RunReviewGate.test.tsx \
  mock-project-runtime.test.ts
pnpm verify:prototype
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected:

```text
targeted renderer tests pass
pnpm verify:prototype passes end-to-end
repo typecheck and test stay green
renderer build and Storybook build succeed
```

- [ ] **Step 6: Reserve the required Storybook/MCP and live-route verification**

After code is complete, perform structured verification later with MCP, not screenshot-only checks:

```text
Storybook MCP structured snapshot + screenshot:
- Mockups/Scene/Workspace/Scene / Orchestrate / WaitingReviewMainStageGate
- the new rewrite-requested scene workspace story if Bundle 3 adds it
- Business/Run/Review Gate/PendingReview

Live API-backed browser verification with structured snapshot:
- start pnpm dev:api
- start pnpm dev:renderer with VITE_NARRATIVE_API_BASE_URL and VITE_NARRATIVE_PROJECT_ID=book-signal-arc
- open /workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution
- verify the canonical route, run/review chain, and rewrite-request messaging through structured page snapshot plus screenshot
```

- [ ] **Step 7: Review and commit Bundle 3**

Commit after review passes:

```bash
git add packages/renderer/src/App.scene-runtime-smoke.test.tsx \
  packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.test.tsx \
  packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx \
  packages/renderer/src/features/scene/components/SceneExecutionTab.tsx \
  packages/renderer/src/features/scene/components/SceneExecutionTab.test.tsx \
  packages/renderer/src/features/scene/components/SceneBottomDock.tsx \
  packages/renderer/src/features/scene/components/SceneBottomDock.test.tsx \
  packages/renderer/src/features/run/components/RunReviewGate.tsx \
  packages/renderer/src/features/run/components/RunReviewGate.test.tsx \
  packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx \
  packages/renderer/src/features/run/components/RunReviewGate.stories.tsx \
  doc/api-contract.md
git commit -m "2026-04-27, close prototype demo regression gate"
```

## Final Verification Matrix

- `pnpm verify:prototype`
  Expected: focused PR46 regression gate passes and fails fast on future drift in API run flow, rewrite semantics, canonical route smoke, or renderer decision messaging.
- `pnpm typecheck`
  Expected: workspace typecheck stays green across fixture-seed, api, renderer, and desktop packages.
- `pnpm test`
  Expected: full workspace tests stay green with no new failing baselines.
- `pnpm build`
  Expected: renderer production build still succeeds.
- `pnpm --filter @narrative-novel/renderer build-storybook`
  Expected: affected workbench surfaces remain story-buildable for MCP inspection.

## Out Of Scope

PR47 and later may broaden automation, transport, or productization, but PR46 stops at the regression gate, current polling contract, and explicit rewrite-request hardening.

## Self-Review

- Spec coverage:
  - Automated regression gate: covered by Bundle 1 root `verify:prototype` entrypoint plus targeted API/renderer suites.
  - API smoke for start/events/review/artifact/trace/downstream assembly: covered by Bundles 1 and 2.
  - Renderer route/runtime smoke: covered by Bundle 3 `App.scene-runtime-smoke.test.tsx` and route-state coverage.
  - Rewrite-request hardening: covered by Bundles 2 and 3 across API, mock runtime, and UI messaging.
  - Storybook + MCP verification reservation: covered by Bundle 3 Step 6.
- Scope check:
  - No SSE, persistence, local storage, real model gateway, or later-PR planning was added.
  - No new scope/lens/layout work was introduced.
- Assumptions to validate during implementation:
  - The hardened rewrite-request outcome should reuse an existing terminal `RunStatus` rather than expanding the status enum.
  - If changing the terminal status affects scene read-model mapping, preserve existing accepted prose/chapter/book reads and do not regress the happy-path smoke.
