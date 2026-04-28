# PR68 Release-Candidate Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock the repo into a release-candidate-only wave, validate one real desktop-local dogfood project end-to-end across desktop/api/renderer, and fix only the P0/P1 blockers proven by that verification.

**Architecture:** Treat PR68 as a serial lock-and-fix wave, not a feature wave. Start from the merged PR67 state, freeze scope, run the existing repo verification commands plus one real desktop dogfood pass, log every failure in a review artifact, then make only evidence-backed bugfixes in the exact broken subsystem seams before rerunning Gate E.

**Tech Stack:** TypeScript, Electron main/preload, Fastify, React, TanStack Query, Storybook, Storybook MCP, Playwright MCP structured snapshots, Vitest, pnpm

---

## Coordinator Handoff

- Execute PR68 on a new serial branch from the accepted Wave 7 merge result. Do not use a parallel worktree for this wave.
- Recommended branch: `codex/pr68-release-candidate-lock`.
- Do not start implementation from `main` if Wave 7 is not merged there yet.
- This wave is evidence-first:
  1. freeze scope
  2. run repo verification
  3. run one real dogfood project
  4. record failures
  5. fix only admitted blockers
  6. rerun Gate E
- Each bugfix bundle must complete its full task list, then receive one combined spec/code review, then fix review findings, then re-review, then commit once.
- Main-thread coordinator must not widen scope while a worker is implementing a reviewed bugfix bundle.

## Scope Guard

- Scope is only `PR68` from `doc/post-phase1-pr54-pr68-parallel-roadmap.md`: release-candidate lock, real dogfood verification, bugfixes only, verification artifact driven.
- The only in-scope defect classes are the explicit PR68 blocker classes from `doc/real-project-long-term-roadmap-pr51-pr68.md`:
  - data loss
  - cannot continue writing
  - trace breakage
  - canon acceptance bypass
  - model config unusable
  - project reopen failure
  - export output unreadable or invalid
- A blocker is admissible only when it is reproduced by the commands or dogfood flow in this plan and captured in the PR68 review artifact.

## Explicit Out Of Scope

- No new feature surfaces.
- No new scope, lens, route model, shell layout model, or workbench information architecture.
- No new dashboards, full-page settings pages, chat-first flows, plugin work, cloud sync, collaboration, publishing ecosystem work, or visual redesigns.
- No speculative refactors "while we are here".
- No Playwright config edits, Storybook config edits, or MCP transport churn for convenience.
- No fixture-seed redesign unless a proven P0/P1 bug requires the minimal fix in that exact seam.

## Workbench Constitution Compliance

- `WorkbenchShell` remains the only layout owner.
- `scope x lens` stays unchanged; PR68 cannot introduce a parallel navigation model.
- Route state continues to express work identity; layout state remains local preference only.
- Main Stage continues to hold one primary task at a time; RC fixes cannot move product work into ad hoc panels.
- Storybook must be updated for every renderer-visible bugfix in this wave.
- Renderer verification must use Storybook MCP or built-in browser MCP with structured snapshots plus screenshots, not screenshots alone.

## Current Baseline From Code Inspection

- Root verification already exists:
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm verify:prototype`
  - `pnpm typecheck:desktop`
  - `pnpm test:desktop`
- Storybook commands already exist:
  - `pnpm storybook`
  - `pnpm --filter @narrative-novel/renderer build-storybook`
- Desktop dev bootstrap already exists in `scripts/desktop-dev.mjs`; `pnpm dev:desktop` rebuilds renderer, builds desktop, and launches Electron.
- Desktop-local runtime env already exists in `apps/desktop/src/main/runtime-config.ts`:
  - selected project id/title
  - `.narrative/project-store.json`
  - `.narrative/artifacts`
  - role-specific model binding env
- Real local project runtime identity already exists:
  - API route: `packages/api/src/routes/project-runtime.ts`
  - API tests: `packages/api/src/createServer.current-project.test.ts`, `createServer.runtime-info.test.ts`, `createServer.local-project-store.test.ts`
  - renderer runtime tests: `packages/renderer/src/app/project-runtime/*.test.tsx`
  - runtime Storybook surface: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
- Desktop create/open/backup/export menu seams already exist in:
  - `apps/desktop/src/main/app-menu.ts`
  - `apps/desktop/src/main/main.ts`
- Book draft, branch, export, review, and scene workflow seams already have focused API and renderer tests:
  - API: `createServer.run-flow.test.ts`, `createServer.prose-revision.test.ts`, `createServer.book-draft-live-assembly.test.ts`, `createServer.book-branches.test.ts`, `createServer.write-surfaces.test.ts`, `createServer.local-persistence.test.ts`, `createServer.wave6-gate-d.test.ts`
  - renderer: `BookDraftWorkspace.test.tsx`, `BookDraftReviewView.test.tsx`, `BookDraftExportView.test.tsx`, `BookDraftBranchView.test.tsx`, `BookExportArtifactGate.test.tsx`, `BookExportArtifactPanel.test.tsx`, `useBuildBookExportArtifactMutation.test.tsx`
- Shared hot files remain high risk and may only be touched when the reproduced blocker proves they are the failing seam:
  - `packages/api/src/createServer.ts`
  - `packages/renderer/src/App.tsx`
  - `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts`
  - `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`
  - `apps/desktop/src/main/main.ts`

## File Map

- Add: `doc/review/2026-04-28-pr68-release-candidate-lock-report.md`
  Purpose: single source of truth for baseline command results, dogfood evidence, blocker classification, fix bundles, MCP snapshots, and Gate E verdict.
- Modify only if a blocker is proven in that subsystem:
  - `apps/desktop/src/main/**`
    Purpose: project create/open/reopen, menu actions, backup/export, runtime restart, model binding persistence, current project bridge.
  - `apps/desktop/src/preload/**`
    Purpose: narrow desktop bridge regressions only.
  - `packages/api/src/routes/**`
    Purpose: exact route-level contract bugs only.
  - `packages/api/src/createServer*.test.ts`
    Purpose: add failing reproduction and regression coverage at the API boundary actually broken by dogfood.
  - `packages/api/src/createServer.ts`
    Purpose: shared hot file; allowed only when a failing route/runtime integration proves the defect lives there.
  - `packages/api/src/repositories/**`
    Purpose: local project persistence, branch/export/checkpoint/run-trace integrity defects only.
  - `packages/api/src/orchestration/modelGateway/**`
    Purpose: model config / provider binding blockers only.
  - `packages/renderer/src/app/project-runtime/**`
    Purpose: runtime identity, degraded-state messaging, or local-project runtime client regressions only.
  - `packages/renderer/src/features/scene/**`
    Purpose: scene run/review/prose blockers only.
  - `packages/renderer/src/features/book/**`
    Purpose: branch/export/review/draft blockers only.
  - `packages/renderer/src/features/run/**`
    Purpose: trace, review gate, selected variant, or run-event support blockers only.
  - `packages/renderer/src/features/workbench/**`
    Purpose: route/restore selection bugs only; no shell redesign.
  - `packages/renderer/src/**/*.stories.tsx`
    Purpose: story sync for any touched renderer-visible surface.

## Admit / Reject Contract

### Admit

- The failure is reproduced by an exact command in this plan or by the scripted dogfood flow below.
- The failure maps to one of the explicit P0/P1 blocker classes.
- The failing seam is named in the review artifact with:
  - reproduction steps
  - exact command or dogfood step
  - observed result
  - expected result
  - affected subsystem
- The fix can be contained to the broken seam plus its nearest tests/stories/docs.

### Reject

- "Would be nice before release" issues without workflow breakage.
- Cosmetic polish, copy rewrites, or layout taste changes not tied to a blocker.
- New authoring capability, new route shape, or new desktop/global settings surface.
- Refactors that touch shared hot files without a reproduced failure.
- Any change that makes the product feel more like a generic web app than a workbench.

## Required Verification Commands

Run these commands exactly before any bugfix is admitted:

```bash
pnpm typecheck
pnpm test
pnpm verify:prototype
pnpm typecheck:desktop
pnpm test:desktop
pnpm --filter @narrative-novel/renderer build-storybook
```

Focused API suite:

```bash
pnpm --filter @narrative-novel/api exec vitest run \
  src/createServer.current-project.test.ts \
  src/createServer.runtime-info.test.ts \
  src/createServer.local-project-store.test.ts \
  src/createServer.run-flow.test.ts \
  src/createServer.prose-revision.test.ts \
  src/createServer.book-draft-live-assembly.test.ts \
  src/createServer.book-branches.test.ts \
  src/createServer.write-surfaces.test.ts \
  src/createServer.local-project-reset.test.ts \
  src/createServer.local-persistence.test.ts \
  src/createServer.wave6-gate-d.test.ts
```

Focused renderer suite:

```bash
pnpm --filter @narrative-novel/renderer exec vitest run \
  src/App.scene-runtime-smoke.test.tsx \
  src/app/runtime/runtime-config.test.ts \
  src/app/project-runtime/ProjectRuntimeProvider.test.tsx \
  src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx \
  src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx \
  src/features/workbench/hooks/useWorkbenchRouteState.test.tsx \
  src/features/scene/components/SceneExecutionTab.test.tsx \
  src/features/scene/components/SceneBottomDock.test.tsx \
  src/features/run/hooks/useSceneRunSession.test.tsx \
  src/features/run/components/RunReviewGate.test.tsx \
  src/features/book/containers/BookDraftWorkspace.test.tsx \
  src/features/book/components/BookDraftReviewView.test.tsx \
  src/features/book/components/BookDraftExportView.test.tsx \
  src/features/book/components/BookDraftBranchView.test.tsx \
  src/features/book/components/BookExportArtifactGate.test.tsx \
  src/features/book/components/BookExportArtifactPanel.test.tsx \
  src/features/book/hooks/useBuildBookExportArtifactMutation.test.tsx
```

Focused desktop suite:

```bash
pnpm --filter @narrative-novel/desktop exec vitest run \
  src/main/project-picker.test.ts \
  src/main/project-store.test.ts \
  src/main/recent-projects.test.ts \
  src/main/runtime-config.test.ts \
  src/main/local-api-supervisor.test.ts \
  src/main/credential-store.test.ts \
  src/main/model-binding-store.test.ts \
  src/main/main.test.ts \
  src/preload/desktop-api.test.ts
```

## Dogfood Flow Contract

PR68 dogfood must prove this exact release-candidate flow:

```text
Create/open real project
-> configure model
-> write 3 chapters / 10 scenes through workflow
-> revise prose
-> use assets
-> branch experiment
-> export manuscript
-> backup
-> close/reopen
-> continue writing
```

The dogfood project must be non-fixture and desktop-local:

- runtime status must resolve as `real-local-project`, not `fixture-demo`
- `GET /api/current-project` and `GET /api/projects/:projectId/runtime-info` must agree on the selected project
- no silent mock fallback is allowed once a local project is selected

Suggested clean dogfood root:

```bash
mkdir -p /tmp/narrative-pr68-dogfood
```

Desktop launch command:

```bash
pnpm dev:desktop
```

Storybook launch command for renderer-visible verification:

```bash
pnpm storybook
```

## Storybook / MCP Verification Targets

Use MCP structured snapshots plus screenshots on these existing surfaces before sign-off, and again after any renderer-visible fix that touches the same area:

- `App/Project Runtime/Status Badge`
  - `RealLocalProjectHealthy`
  - `NoSilentMockFallback`
- `Mockups/Scene/Workspace`
  - `Final`
  - `Scene / Orchestrate / WaitingReviewMainStageGate`
- `Business/BookDraftReviewView`
  - `ReviewDefault`
- `Business/BookDraftExportView`
  - `ExportViewWithArtifactReady`
  - `ExportViewWithBlockedGate`
- `Business/BookDraftBranchView`
  - `SelectiveAdopt`
  - `ArchivedBranch`

If a blocker touches another renderer-visible surface, add the exact story title used for proof to the review artifact before fixing it.

## Task 1: Freeze The RC Baseline

**Files:**

- Add: `doc/review/2026-04-28-pr68-release-candidate-lock-report.md`

- [ ] **Step 1.1: Start the branch and create the PR68 review artifact**

```bash
git switch -c codex/pr68-release-candidate-lock
```

Create `doc/review/2026-04-28-pr68-release-candidate-lock-report.md` with these required sections:

- branch and base commit
- baseline command results
- dogfood environment
- reproduced blockers
- rejected non-blockers
- bugfix bundles
- Storybook/MCP evidence
- Gate E verdict

- [ ] **Step 1.2: Run the full baseline command set before changing code**

Run the exact command blocks from `Required Verification Commands` and paste pass/fail results into the review artifact.

Expected:

- if everything passes, continue to dogfood before changing code
- if anything fails, do not fix yet; first record the failing command, first failing test name, and owning subsystem in the review artifact

- [ ] **Step 1.3: Stop feature intake**

Record these lock rules at the top of the review artifact:

- only P0/P1 blockers are admissible
- every code change must cite one reproduced blocker id from the artifact
- every admitted blocker must name the smallest possible seam

## Task 2: Run One Real Desktop Dogfood Pass

**Files:**

- Modify: `doc/review/2026-04-28-pr68-release-candidate-lock-report.md`

- [ ] **Step 2.1: Launch Storybook and desktop from the current branch**

Use separate terminals:

```bash
pnpm storybook
```

```bash
pnpm dev:desktop
```

Expected:

- Storybook available at `http://127.0.0.1:6006`
- Electron launches with the local API supervisor
- the runtime status surface resolves a desktop-local project when a project is selected

- [ ] **Step 2.2: Create a fresh non-fixture dogfood project**

In the desktop app:

1. `File -> Create Project...`
2. choose a fresh directory under `/tmp/narrative-pr68-dogfood`
3. confirm `narrative.project.json`, `.narrative/project-store.json`, and `.narrative/artifacts/` are created

Record in the artifact:

- chosen project root
- resulting `projectId`
- resulting `projectTitle`
- whether reopen-from-recent works on first pass

- [ ] **Step 2.3: Execute the RC workflow and log evidence**

Run the full dogfood flow in the desktop app. At each stage, record pass/fail and exact failure symptoms:

1. create/open real project
2. configure model through the existing desktop credential/model-binding UI path
3. complete enough writing flow to cover 3 chapters / 10 scenes
4. request and accept prose revision
5. use asset context in workflow
6. create and inspect at least one branch experiment
7. export manuscript artifact
8. create manual backup and manual export archive through the existing File menu actions
9. close and reopen the app and the same project
10. continue writing without losing accepted canon, prose, trace, review state, branch state, or export artifacts

- [ ] **Step 2.4: Capture MCP proof on the existing renderer story surfaces**

For each story listed in `Storybook / MCP Verification Targets`:

- capture a structured MCP snapshot
- capture a screenshot
- note any mismatch between Storybook proof and desktop behavior

Expected:

- runtime states are legible and correctly labeled
- scene run/review states stay workbench-shaped
- export and branch states remain readable and actionable
- no Storybook drift remains on any renderer surface touched by a blocker

## Task 3: Admit And Fix Only Proven Blockers

**Files:**

- Modify only the exact broken subsystem files plus nearest tests/stories and `doc/review/2026-04-28-pr68-release-candidate-lock-report.md`

- [ ] **Step 3.1: Convert each admitted blocker into a focused failing regression**

For every admitted blocker:

1. choose the nearest existing test file listed in the baseline section
2. add one failing test that reproduces the exact blocker
3. run only that focused test file first

Examples of valid nearest-seam targets:

- project reopen / backup / archive bugs:
  - `apps/desktop/src/main/main.test.ts`
  - `apps/desktop/src/main/project-store.test.ts`
  - `apps/desktop/src/main/runtime-config.test.ts`
- runtime identity / no-silent-mock bugs:
  - `packages/api/src/createServer.runtime-info.test.ts`
  - `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx`
  - `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx`
- canon / prose / trace continuity bugs:
  - `packages/api/src/createServer.run-flow.test.ts`
  - `packages/api/src/createServer.prose-revision.test.ts`
  - `packages/api/src/createServer.local-persistence.test.ts`
  - `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx`
- branch / export unreadable bugs:
  - `packages/api/src/createServer.book-branches.test.ts`
  - `packages/api/src/createServer.write-surfaces.test.ts`
  - `packages/renderer/src/features/book/components/BookDraftBranchView.test.tsx`
  - `packages/renderer/src/features/book/components/BookDraftExportView.test.tsx`
  - `packages/renderer/src/features/book/components/BookExportArtifactGate.test.tsx`

- [ ] **Step 3.2: Implement the smallest fix in the proven seam**

Rules:

- fix only the reproduced blocker
- avoid shared hot files unless the failing test proves the bug lives there
- if a renderer-visible fix changes product output, update the matching story in the same bundle
- if the blocker changes user-visible copy or state labels, update the review artifact with before/after evidence

- [ ] **Step 3.3: Rerun the focused regression immediately**

Expected:

- the new failing regression passes
- no adjacent targeted tests fail in the same subsystem

- [ ] **Step 3.4: Run subsystem verification before asking for review**

Use the smallest command block that still covers the bug:

- desktop blocker: rerun the focused desktop suite command
- API blocker: rerun the focused API suite command
- renderer blocker: rerun the focused renderer suite command
- cross-boundary blocker: rerun every relevant focused suite plus `pnpm verify:prototype`

- [ ] **Step 3.5: Review, fix findings, and commit once per accepted bugfix bundle**

The review artifact must record:

- blocker id
- exact files changed
- focused regression added
- verification commands rerun
- review outcome
- commit hash after acceptance

## Task 4: Rerun Gate E And Decide Admit / Reject

**Files:**

- Modify: `doc/review/2026-04-28-pr68-release-candidate-lock-report.md`

- [ ] **Step 4.1: Rerun the full verification matrix after the last accepted bugfix bundle**

Run all command blocks in `Required Verification Commands` again.

Expected:

- all root commands pass
- all focused suites pass
- `pnpm --filter @narrative-novel/renderer build-storybook` passes

- [ ] **Step 4.2: Rerun the full desktop dogfood flow on a persisted project**

Use the same dogfood project from Task 2.

Expected:

- current project restores correctly
- model config remains usable after reopen
- accepted canon/prose survives reopen
- trace links remain readable
- branch state survives reopen
- export artifacts remain readable
- backup and export archive still work
- writing can continue after reopen without fallback to fixture or mock

- [ ] **Step 4.3: Repeat Storybook MCP verification for every touched renderer surface**

Expected:

- structured snapshots and screenshots match the fixed behavior
- no affected story regressed into English-only, broken layout, or wrong workbench state

- [ ] **Step 4.4: Apply the final Gate E verdict**

`Gate E PASS` only if all conditions below are true:

- no admitted blocker remains open
- no full-matrix verification command is failing
- the real dogfood flow completes end-to-end on a non-fixture local project
- Storybook/MCP proof exists for every renderer-visible fix
- no out-of-scope feature work was introduced

`Gate E REJECT` if any condition below occurs:

- data is lost, reset incorrectly, or diverges after reopen
- a write/review/revise/export path is still blocked
- runtime falls back silently away from the selected real local project
- canon acceptance can be bypassed or trace continuity breaks
- export output is unreadable or missing required content
- a fix required unreviewed scope growth outside PR68

## Final Deliverables

- Accepted serial branch for `PR68`
- `doc/review/2026-04-28-pr68-release-candidate-lock-report.md`
- one or more reviewed bugfix commits, each tied to an admitted blocker
- explicit final verdict: `Gate E PASS` or `Gate E REJECT`

