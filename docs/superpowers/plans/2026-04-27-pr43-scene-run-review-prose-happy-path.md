# PR43 Scene Run Review Prose Happy Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Scene / Orchestrate expose one obvious happy path for the usable prototype lock so `book-signal-arc -> scene-midnight-platform -> run -> proposal -> review decision -> canon patch -> prose draft -> chapter draft -> book draft -> trace` is understandable and verifiable from the existing workbench surfaces.

**Architecture:** Reuse the current scene run session, run event timeline, run-level review decision endpoint, and prose/trace read surfaces. This PR is not a new run system; it is a closure pass that makes the existing path the primary main-stage experience, proves downstream cache refresh into chapter/book read models, and keeps Storybook in sync with the affected workbench states.

**Tech Stack:** React, TanStack Query, fixture API runtime, Vitest, Storybook

---

## Scope Guard

- Keep the feature inside `WorkbenchShell`; no alternate full-page flow.
- Keep layout state shell-owned; do not put CTA state, selected variants, or review state into route or local layout state.
- Keep the work read-heavy after submit: no new publish/export/merge workflows.
- Do not widen into SSE, provider UI, prompt editors, runtime debugger surfaces, or backend redesign.
- Do not move the happy path into dock-only or inspector-only interaction.

## Current Repo State To Honor

- `packages/renderer/src/App.scene-runtime-smoke.test.tsx` already drives the HTTP runtime through start -> waiting review -> accept-with-edit -> prose -> trace.
- `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx` still exposes `Continue Active Run`, `Rewrite Run`, and `Run From Scratch`; PR43 should turn this into one obvious primary action instead of inventing a new subsystem.
- `packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts` already invalidates run, scene, chapter, and book query families after a review decision.
- `packages/renderer/src/features/scene/containers/scene-run-session-context.test.tsx` already proves selected proposal variants stay local/shared and out of route state.
- `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`, `SceneDockContainer.stories.tsx`, and `SceneProseContainer.stories.tsx` already provide the Storybook surfaces that must stay aligned.

## File Map

- `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
  Purpose: main-stage run support panel, timeline, and review gate composition.
- `packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx`
  Purpose: scene execution query + route-owned selection + run-session wiring.
- `packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx`
  Purpose: focused UI-level execution container behavior.
- `packages/renderer/src/features/run/hooks/useSceneRunSession.ts`
  Purpose: active run selection, polling, and submit path orchestration.
- `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx`
  Purpose: session-level start/submit behavior and active-run precedence.
- `packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts`
  Purpose: run review decision write path and downstream cache invalidation.
- `packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.test.tsx`
  Purpose: dedicated proof of invalidation breadth; create this file if the current shared hook tests are too indirect.
- `packages/renderer/src/features/scene/containers/scene-run-session-context.tsx`
  Purpose: shared run session + shared proposal variant draft state.
- `packages/renderer/src/features/scene/containers/scene-run-session-context.test.tsx`
  Purpose: verify local/shared variant behavior without route pollution.
- `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
  Purpose: app-level happy-path proof through the actual workbench shell.
- `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`
  Purpose: main stage Storybook state for Scene / Orchestrate.
- `packages/renderer/src/features/scene/containers/SceneDockContainer.stories.tsx`
  Purpose: dock-side waiting-review support state.
- `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
  Purpose: prose surface after accepted run output.
- `packages/renderer/src/features/run/components/RunReviewGate.stories.tsx`
  Purpose: focused review-gate state, especially selected variant copy.

### Bundle 1: Make The Main Stage Present One Primary Run Action

**Files:**
- Modify: `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx`
- Modify if wiring or copy summaries need to change: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx`
- Modify: `packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx`
- Modify only if story copy/state drifts: `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`
- Modify only if review-gate copy/state drifts: `packages/renderer/src/features/run/components/RunReviewGate.stories.tsx`

**Non-goals:**
- Do not add a new route.
- Do not move the timeline or review gate out of the scene main stage.
- Do not remove the existing run modes from the codebase if they still serve as secondary actions.

- [ ] **Step 1: Run the focused execution container test before editing**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- SceneExecutionContainer.test.tsx
```

Expected:

```text
current test output gives a stable starting point for the main-stage CTA change
```

- [ ] **Step 2: Make `SceneExecutionContainer.test.tsx` assert the intended main-stage CTA**

The test file must explicitly verify the usable-prototype main-stage behavior:

```text
Scene / Orchestrate shows one obvious primary CTA: Run Scene
Run Scene starts the scene run with mode: continue
Rewrite Run and Run From Scratch, if kept, are secondary support actions rather than the default primary path
waiting_review still surfaces the timeline and the Run Review Gate in the main-stage support panel
selectedVariantsForSubmit still travel into the review gate summary
```

Do not settle for a generic "button exists" assertion.

- [ ] **Step 3: Make the smallest `SceneExecutionTab.tsx` change that matches the test**

Allowed change:

```text
primary action copy becomes Run Scene
primary action maps to the existing continue-mode run start
existing rewrite/from-scratch actions can remain secondary
timeline and review gate remain visible in the same workbench surface
```

Disallowed change:

```text
new workflow tabs
moving the path into the bottom dock
removing the review gate from the main stage
changing route semantics
```

- [ ] **Step 4: Keep Scene Storybook aligned with the new CTA**

Check these stories and patch only if needed:

```text
Mockups/Scene/Workspace -> Final
Mockups/Scene/Workspace -> Scene / Orchestrate / WaitingReviewMainStageGate
Business/Run/Review Gate -> WithSelectedVariants
```

- [ ] **Step 5: Re-run the focused UI proof**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- SceneExecutionContainer.test.tsx
```

Expected:

```text
Scene / Orchestrate now has one obvious primary run action without changing shell structure
```

### Bundle 2: Lock The Run-Level Review Decision And Downstream Refresh Path

**Files:**
- Modify only if active-run/submit closure needs it: `packages/renderer/src/features/run/hooks/useSceneRunSession.ts`
- Modify: `packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx`
- Modify only if invalidation coverage is incomplete: `packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts`
- Create or modify: `packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.test.tsx`
- Modify only if submit wiring needs a narrow closure: `packages/renderer/src/features/scene/containers/scene-run-session-context.tsx`
- Modify only if variant-submit proof is missing: `packages/renderer/src/features/scene/containers/scene-run-session-context.test.tsx`

**Non-goals:**
- Do not add new mutation endpoints.
- Do not store selected variants in route, localStorage, or global shell layout state.
- Do not widen cache invalidation into unrelated query families.

- [ ] **Step 1: Add explicit session-level submit coverage in `useSceneRunSession.test.tsx`**

The hook test must verify all of the following:

```text
submitDecision uses the active run id, not a stale route/workspace run id
submitDecision forwards the pendingReviewId from the active run
selectedVariants are forwarded unchanged in the submit payload
after a started run, the session keeps the newly started run active until the runtime read model catches up
```

Use `scene-midnight-platform` and real run ids from the current fixture naming style.

- [ ] **Step 2: Create or extend `useSubmitRunReviewDecisionMutation.test.tsx` with cache invalidation proof**

The test file must explicitly assert that a successful scene-scoped review decision invalidates:

```text
runQueryKeys.detail(projectId, runId)
runQueryKeys.events(projectId, runId)
runQueryKeys.artifacts(projectId, runId)
runQueryKeys.trace(projectId, runId)
sceneQueryKeys.workspace(sceneId)
sceneQueryKeys.execution(sceneId)
sceneQueryKeys.prose(sceneId)
sceneQueryKeys.inspector(sceneId)
sceneQueryKeys.dock(sceneId)
sceneQueryKeys.patchPreview(sceneId)
chapterQueryKeys.all
bookQueryKeys.all
```

It must also prove the mutation calls the existing `POST /runs/:runId/review-decisions` path rather than any legacy scene proposal accept endpoint.

- [ ] **Step 3: Keep `scene-run-session-context.test.tsx` focused on local/shared variant state**

Retain the existing proof that selected variants do not enter route state, and add submit-path proof only if it is currently missing:

```text
variant choice is shared between main stage and support surfaces
window.location.search remains unchanged
submit path still consumes selectedVariantsForSubmit
```

- [ ] **Step 4: Apply the smallest hook closure needed**

Acceptable code changes in this bundle:

```text
fix active-run precedence
fix pendingReviewId forwarding
fix incomplete invalidation list
fix selectedVariants submit wiring
```

Unacceptable changes:

```text
new route params
new persistence for review variants
new scene/book/chapter data models
```

- [ ] **Step 5: Re-run the focused hook/session proof**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- useSceneRunSession.test.tsx
pnpm --filter @narrative-novel/renderer test -- useSubmitRunReviewDecisionMutation.test.tsx
pnpm --filter @narrative-novel/renderer test -- scene-run-session-context.test.tsx
```

Expected:

```text
review decisions stay run-level
selected variants stay local/shared
scene/chapter/book downstream reads are guaranteed to refresh
```

### Bundle 3: Prove The App-Level Happy Path And Keep Storybook In Sync

**Files:**
- Modify: `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
- Modify only if story state drifts: `packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx`
- Modify only if story state drifts: `packages/renderer/src/features/scene/containers/SceneDockContainer.stories.tsx`
- Modify only if story state drifts: `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
- Modify only if focused gate state drifts: `packages/renderer/src/features/run/components/RunReviewGate.stories.tsx`

**Non-goals:**
- Do not add a chapter or book UI walkthrough to this PR.
- Do not convert the smoke into a browser-only screenshot test.
- Do not touch Playwright config.

- [ ] **Step 1: Update `App.scene-runtime-smoke.test.tsx` to use the intended primary CTA**

The smoke must explicitly prove this app-level sequence:

```text
/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution
Run Scene
Waiting Review
Open Scene proposal set
Run Review Gate
Accept or Accept With Edit
Review decision submitted
Canon patch applied
Prose generated
Run completed
Open Prose
Run Inspector -> Trace
```

Keep the existing assertions that preview-only scenes are absent from the navigator.

- [ ] **Step 2: Keep the three affected Storybook surfaces aligned**

Check and patch only if needed:

```text
Mockups/Scene/Workspace -> Scene / Orchestrate / WaitingReviewMainStageGate
Mockups/Scene/Bottom Dock -> Scene / Dock / WaitingReviewSupportOnly
Mockups/Scene/Prose -> GeneratedFromAcceptedRun
Business/Run/Review Gate -> WithSelectedVariants
```

The point is not a visual redesign. The point is that Storybook still mirrors the same happy path states the tests are proving.

- [ ] **Step 3: Re-run smoke, API contract support, and Storybook build**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- App.scene-runtime-smoke.test.tsx
pnpm --filter @narrative-novel/api test -- createServer.run-flow.test.ts
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected:

```text
the app shell proves the scene happy path end to end
the API run flow contract still supports the path
storybook stays buildable for the affected workbench states
```

### Bundle 4: Storybook MCP Verification And Bundle Closeout

**Files:**
- No new files unless one of the previous bundles required a narrow story update

**Non-goals:**
- Do not use script-only verification.
- Do not stop at screenshots without structured snapshots.

- [ ] **Step 1: Start Storybook and verify the happy path states through MCP**

Run:

```bash
pnpm storybook
```

Then use Storybook MCP structured page snapshots plus screenshots on:

```text
Mockups/Scene/Workspace / Scene / Orchestrate / WaitingReviewMainStageGate
Mockups/Scene/Bottom Dock / Scene / Dock / WaitingReviewSupportOnly
Mockups/Scene/Prose / GeneratedFromAcceptedRun
Business/Run/Review Gate / WithSelectedVariants
```

Verify:

```text
Run Scene is the primary CTA
review gate is the obvious decision path
selected variant summary is visible when present
accepted run output still surfaces as prose and trace support
```

- [ ] **Step 2: Review and commit only after the verified bundle passes**

Stage only the files that actually changed for PR43.

Suggested commit boundary:

```bash
git add \
  packages/renderer/src/features/scene/components/SceneExecutionTab.tsx \
  packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx \
  packages/renderer/src/features/scene/containers/SceneExecutionContainer.test.tsx \
  packages/renderer/src/features/run/hooks/useSceneRunSession.ts \
  packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx \
  packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts \
  packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.test.tsx \
  packages/renderer/src/features/scene/containers/scene-run-session-context.tsx \
  packages/renderer/src/features/scene/containers/scene-run-session-context.test.tsx \
  packages/renderer/src/App.scene-runtime-smoke.test.tsx \
  packages/renderer/src/features/scene/containers/SceneWorkspace.stories.tsx \
  packages/renderer/src/features/scene/containers/SceneDockContainer.stories.tsx \
  packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx \
  packages/renderer/src/features/run/components/RunReviewGate.stories.tsx
```

## Final Verification

- [ ] Run:

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/api test -- createServer.run-flow.test.ts
pnpm --filter @narrative-novel/renderer build-storybook
```

- [ ] Confirm the happy-path evidence chain is true without widening scope:

```text
scene-midnight-platform is reachable from the canonical workbench route
Run Scene is the primary main-stage action
review decision stays run-level
selected variants stay local/shared and out of the route
accept refreshes prose plus downstream chapter/book read models through existing cache invalidation
trace remains reachable through the existing dock/inspector support surfaces
```

## Expected Outcome

After PR43, the default Scene / Orchestrate experience should read like one continuous product sentence:

```text
book-signal-arc
-> scene-midnight-platform
-> Run Scene
-> proposal
-> review decision
-> canon patch
-> prose draft
-> chapter draft
-> book draft
-> trace
```

No new horizon is introduced. The existing workbench path simply becomes the obvious one, with tests and Storybook proving it.
