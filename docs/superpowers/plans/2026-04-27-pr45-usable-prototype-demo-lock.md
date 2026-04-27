# PR45 Usable Prototype Demo Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lock the current PR42-PR44 prototype into one reproducible demo flow with exact startup instructions, explicit runtime recovery guidance, and smoke/storybook proof of the canonical scene-to-book path.

**Architecture:** Build on the current repo state instead of resetting it. The default scene route is already aligned in `useWorkbenchRouteState.ts`, the renderer already has an app-level run smoke, the desktop dev script already launches the local API in desktop mode, and `ProjectRuntimeProvider` still intentionally supports mock fallback for generic web usage. This PR is about demo-path closure: keep generic web/mock support intact, make the documented prototype path explicitly API-backed, tighten degraded runtime guidance, and extend proof so the chain from run to book draft is unambiguous.

**Tech Stack:** React, Electron, pnpm scripts, TanStack Query, TypeScript, Vitest, Storybook, fixture API runtime

---

This PR is part of the usable prototype lock.

It must preserve this exact chain:

```text
book-signal-arc
-> scene-midnight-platform
-> run
-> proposal
-> review decision
-> canon patch
-> prose draft
-> chapter draft
-> book draft
-> trace
```

## Scope Guard

- Keep desktop as a demo host, not a productization project.
- Keep `WorkbenchShell`, scope/lens routing, and route/layout separation unchanged.
- Do not add packaging, auth, project picker, worker supervisor, new providers, or publish/export horizons.
- Do not redesign global runtime mode architecture unless a failing test proves the current behavior blocks the documented demo path.
- Because the default scene route is already implemented, treat route work as verification/closure unless drift is proven.

## Current Baseline To Build On

- `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts` already normalizes the default scene route to:

```text
scope=scene
id=scene-midnight-platform
lens=orchestrate
tab=execution
```

- `packages/renderer/src/App.scene-runtime-smoke.test.tsx` already proves:

```text
load canonical scene route
start run
enter waiting review
submit review decision
see canon patch + prose generated
open Scene Draft
inspect trace in bottom dock
```

- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx` currently behaves like this:

```text
desktop-local => API runtime
web with VITE_NARRATIVE_API_BASE_URL => API runtime
web without API env => mock runtime fallback
```

- `README.md` already documents the mock fallback and the desktop-local startup path.

This means PR45 should close the demo story around the current behavior rather than pretending the repo starts from zero.

## File Map

- `README.md`
  Purpose: top-level startup truth for the prototype path.
- `doc/api-contract.md`
  Purpose: narrow contract docs if runtime/demo wording must stay in sync with README.
- `doc/usable-prototype-demo-script.md`
  Purpose: fixed operator script for the canonical demo path.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
  Purpose: runtime selection seam; keep current behavior unless a test exposes a real mismatch with the documented demo path.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx`
  Purpose: lock current runtime selection behavior and any accepted narrowing for the demo path.
- `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts`
  Purpose: degraded runtime status copy and classification.
- `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx`
  Purpose: exact degraded-status summary assertions.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBoundary.tsx`
  Purpose: visible degraded runtime hint.
- `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`
  Purpose: Storybook proof for healthy/degraded runtime states.
- `packages/renderer/src/App.tsx`
  Purpose: top-level workbench shell entry; only touch if runtime messaging or canonical handoff needs a small UI adjustment.
- `packages/renderer/src/App.test.tsx`
  Purpose: default route and degraded-shell behavior closure.
- `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
  Purpose: canonical prototype smoke from scene run into downstream draft surfaces.
- `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
  Purpose: Scene Draft proof for accepted-run prose.
- `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx`
  Purpose: Chapter Draft proof for readable downstream assembly.
- `packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx`
  Purpose: Book Draft proof for readable manuscript destination.
- `scripts/desktop-dev.mjs`
  Purpose: desktop startup behavior; verify first, patch only if docs and actual behavior drift.
- `apps/desktop/src/main/create-window.ts`
  Purpose: desktop renderer target behavior; verify first, patch only if demo startup drift is proven.

## Bundle 1: Lock Runtime Selection And Recovery Guidance For The Demo Path

**Files:**
- Modify: `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx`
- Modify: `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx`
- Modify if needed: `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts`
- Modify if needed: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBoundary.tsx`
- Modify if needed: `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
- Modify if needed: `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx`

- [ ] **Step 1: First lock the current runtime-selection baseline in tests**

Extend `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx` so it explicitly proves:

```text
desktop-local still resolves to API runtime
web with VITE_NARRATIVE_API_BASE_URL resolves to API runtime
web without VITE_NARRATIVE_API_BASE_URL still resolves to mock runtime today
```

This step is required even if the bundle later narrows behavior, because the plan must build on the actual starting point.

- [ ] **Step 2: Tighten degraded runtime guidance around the demo path**

In `packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx`, add exact assertions for the degraded API case:

```text
status === unavailable
summary copy explicitly says Fixture API unavailable, or equivalent product copy
the degraded hint tells the user to start pnpm dev:api when the API-backed demo path is down
```

If current copy is too generic, patch only:

```text
useProjectRuntimeHealthQuery.ts
ProjectRuntimeStatusBoundary.tsx
```

Do not broaden this into a new runtime UI surface.

- [ ] **Step 3: Keep provider behavior explicit and minimal**

For this PR, the runtime rule is:

```text
generic web without API env remains mock
documented prototype demo path is API-backed through explicit startup instructions
desktop-local remains API-backed
Storybook and injected tests keep their current mock/runtime harness behavior
```

Only patch `ProjectRuntimeProvider.tsx` if a test reveals the implementation does not actually match those rules. Do not flip the global default from mock to API in this PR.

- [ ] **Step 4: Refresh runtime status stories**

Update `packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx` so the degraded state stories reflect the accepted copy and recovery hint. Reuse the existing `AllStates` story instead of creating a parallel Storybook surface.

- [ ] **Step 5: Verify Bundle 1**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- ProjectRuntimeProvider.test.tsx
pnpm --filter @narrative-novel/renderer test -- useProjectRuntimeHealthQuery.test.tsx
pnpm --filter @narrative-novel/renderer test -- App.test.tsx
```

Expected:

```text
runtime selection is explicitly documented in tests
degraded API guidance is product-usable
the workbench shell still renders while runtime is degraded
```

- [ ] **Step 6: Storybook/MCP closure for Bundle 1**

Build Storybook:

```bash
pnpm --filter @narrative-novel/renderer build-storybook
```

Then verify later with Storybook MCP structured snapshot plus screenshot for:

```text
App/Project Runtime/Status Badge/AllStates
```

- [ ] **Step 7: Review and commit Bundle 1**

Commit after review passes:

```bash
git add packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx \
  packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts \
  packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBoundary.tsx \
  packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.stories.tsx \
  packages/renderer/src/App.test.tsx
git commit -m "feat: lock prototype runtime guidance"
```

## Bundle 2: Lock The Startup Script And Canonical Demo Entry, Verification-First

**Files:**
- Add: `doc/usable-prototype-demo-script.md`
- Modify: `README.md`
- Modify if needed: `doc/api-contract.md`
- Verify first, modify only if drift is found: `scripts/desktop-dev.mjs`
- Verify first, modify only if drift is found: `apps/desktop/src/main/create-window.ts`
- Modify if needed: `packages/renderer/src/App.test.tsx`

- [ ] **Step 1: Write the fixed demo operator script**

Create `doc/usable-prototype-demo-script.md` with the exact canonical sequence:

```text
1. pnpm install
2. pnpm dev:api
3. pnpm dev:renderer
4. open /workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution
5. Run scene
6. wait for review
7. submit Accept or Accept With Edit
8. Open Prose
9. switch to Chapter Draft for chapter-signals-in-rain
10. switch to Book Draft for book-signal-arc
11. inspect trace/artifact explanation
```

Also include the desktop variant:

```text
pnpm dev:desktop
```

with the note that desktop-local starts the API host automatically.

- [ ] **Step 2: Rewrite README startup and recovery instructions to match actual behavior**

Update `README.md` so the prototype-demo section is explicit about:

```text
web demo path = start API + renderer
desktop demo path = pnpm dev:desktop
generic web without API env still falls back to mock unless Bundle 1 intentionally changed that rule
recovery path when the API-backed demo is unavailable
```

If `doc/api-contract.md` repeats startup/runtime wording that would become stale, patch that doc in the same bundle. Do not rewrite unrelated sections.

- [ ] **Step 3: Treat default route as a verification gate, not a rewrite**

In `packages/renderer/src/App.test.tsx`, add or tighten a test that loads blank `/workbench` and proves the current route kernel normalizes to:

```text
scope=scene
id=scene-midnight-platform
lens=orchestrate
tab=execution
```

If that test already exists by the time execution starts, only keep it passing and avoid route-kernel edits.

- [ ] **Step 4: Verify desktop startup code before editing it**

Check `scripts/desktop-dev.mjs` and `apps/desktop/src/main/create-window.ts` against the demo script:

```text
desktop rebuild mode
desktop live-renderer mode
automatic API hosting in desktop-local mode
renderer target selection remains local-only
```

Only patch these files if the docs or a test prove drift. The default expectation for this bundle is doc/test closure, not behavior churn.

- [ ] **Step 5: Verify Bundle 2**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- App.test.tsx
pnpm --filter @narrative-novel/desktop test
```

Expected:

```text
default route remains the canonical scene orchestrate entry
desktop still functions as a demo host
docs now match real startup behavior
```

- [ ] **Step 6: Review and commit Bundle 2**

Commit after review passes:

```bash
git add doc/usable-prototype-demo-script.md README.md doc/api-contract.md \
  scripts/desktop-dev.mjs apps/desktop/src/main/create-window.ts \
  packages/renderer/src/App.test.tsx
git commit -m "docs: lock usable prototype demo script"
```

## Bundle 3: Extend The App Smoke From Scene Run To Downstream Draft Reads

**Files:**
- Modify: `packages/renderer/src/App.scene-runtime-smoke.test.tsx`
- Modify if needed: `packages/renderer/src/App.test.tsx`
- Modify if needed: `packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx`
- Modify if needed: `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx`
- Modify if needed: `packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx`

- [ ] **Step 1: Extend the existing smoke, do not add a second happy-path harness unless required**

Keep `packages/renderer/src/App.scene-runtime-smoke.test.tsx` as the primary proof file and extend it so it asserts the full chain after review acceptance:

```text
Open Prose shows Scene Prose Workbench and accepted prose text
the user can reach Chapter Draft for chapter-signals-in-rain
Chapter Draft shows scene-midnight-platform inside the chapter manuscript path
the user can reach Book Draft for book-signal-arc
Book Draft shows the selected chapter as a readable manuscript section
trace/artifact explanation remains available without leaving the workbench model
```

Do not replace this with a screenshot-only smoke.

- [ ] **Step 2: Keep route assertions explicit in the smoke**

The extended smoke must assert the concrete route transitions used by the prototype:

```text
scene route:
  /workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution

scene prose route:
  scope=scene&id=scene-midnight-platform&lens=draft&tab=prose

chapter draft route:
  scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-midnight-platform

book draft route:
  scope=book&id=book-signal-arc&lens=draft&view=signals&selectedChapterId=chapter-signals-in-rain
```

This keeps the smoke aligned with the route-first constitution.

- [ ] **Step 3: Refresh only the affected proof stories**

If the smoke changes visible copy or downstream read expectations, update only:

```text
packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx
  - GeneratedFromAcceptedRun

packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx
  - Default or MissingDrafts, whichever the smoke now relies on

packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx
  - ReadDefault
```

Do not widen this bundle into compare/export/branch/review story churn.

- [ ] **Step 4: Verify Bundle 3**

Run:

```bash
pnpm --filter @narrative-novel/renderer test -- App.scene-runtime-smoke.test.tsx
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected:

```text
the canonical prototype path is reproducible from run to downstream read surfaces
storybook still renders the same affected workbench states
```

- [ ] **Step 5: Storybook/MCP closure for Bundle 3**

Verify later with Storybook MCP structured snapshot plus screenshot for:

```text
Mockups/Scene/Prose/GeneratedFromAcceptedRun
Mockups/Chapter/ChapterDraftWorkspace/Default
Mockups/Book/BookDraftWorkspace/ReadDefault
```

- [ ] **Step 6: Review and commit Bundle 3**

Commit after review passes:

```bash
git add packages/renderer/src/App.scene-runtime-smoke.test.tsx \
  packages/renderer/src/App.test.tsx \
  packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx \
  packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.stories.tsx \
  packages/renderer/src/features/book/containers/BookDraftWorkspace.stories.tsx
git commit -m "test: lock the prototype demo path"
```

## Final Verification

- [ ] Run:

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer build-storybook
pnpm --filter @narrative-novel/desktop test
```

- [ ] Run one live API-backed smoke after implementation:

```bash
pnpm dev:api
pnpm dev:renderer
```

Open:

```text
http://127.0.0.1:5173/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution
```

and follow `doc/usable-prototype-demo-script.md` end to end.

- [ ] Verify later with Storybook MCP using structured snapshots for the affected stories listed above.

## Explicit Non-Goals

- No layout redesign
- No new route schema
- No shell/provider architecture rewrite beyond minimal accepted demo-path narrowing
- No desktop packaging or installer work
- No auth/project-picker/settings-center work
- No export/publish/productization work outside the fixed prototype demo path

## Expected Outcome

After PR45, the repo should have one stable, documented, and test-proven demo path:

```text
start the right host
-> enter the canonical scene route
-> run
-> review
-> see prose
-> reach chapter draft
-> reach book draft
-> inspect trace
```

with explicit recovery guidance when the API-backed demo path is unavailable, and without drifting away from the current Narrative IDE/workbench model.
