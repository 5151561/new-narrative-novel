# Post-PR33 Workbench Correction Plan / AI Execution Document

> Source branch: `codex/pr33-workbench-surface-contract-stabilization`
>
> Recommended new branch: `codex/pr34-workbench-experience-contract-hardening`
>
> Purpose: stop feature expansion after PR33 and do a narrow correction PR that hardens the Workbench experience contract, surface ownership, editor-tab behavior, dock behavior, Storybook coverage, and constitution guardrails.

---

## 0. Final instruction to the AI coding agent

You are not building a new feature in this PR.

Do not implement Status Bar, Quick Open, Split Editor, real backend, SSE, Temporal, prompt editor, new scope, new lens, mobile layout, or new product workflow.

Your only job is to make the existing Workbench feel and behave more like a real Narrative IDE instead of a web page with many panels.

Concretely:

1. Keep `route` as the only active business-state truth.
2. Keep layout state as local UI preference.
3. Keep opened editor contexts as local UI preference.
4. Ensure `WorkbenchShell` owns layout, surface regions, scrolling boundaries, and pane visibility.
5. Ensure business scopes only provide content for Mode Rail / Navigator / Main Stage / Inspector / Bottom Dock.
6. Ensure Bottom Dock is only problems/activity/runtime/trace support, not a second main stage.
7. Add contract tests and Storybook states that would fail if a future PR turns the UI back into a dashboard/page collection.

If you find more problems than can fit this PR, record them in `doc/review/post-pr33-workbench-surface-audit.md`, but do not broaden the implementation.

---

## 1. Mandatory reading before coding

Read these files first, in this order:

```text
doc/frontend-workbench-constitution.md
doc/project-positioning-and-design-principles.md
doc/odd-frontend-comprehensive-design.md
doc/post-pr31-vscode-ux-roadmap-and-pr32-editor-context-execution-plan.md
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
packages/renderer/src/features/workbench/components/WorkbenchSurfaceBody.tsx
packages/renderer/src/features/workbench/components/WorkbenchBottomDockFrame.tsx
packages/renderer/src/features/workbench/editor/WorkbenchEditorProvider.tsx
packages/renderer/src/features/workbench/editor/WorkbenchEditorTabs.tsx
packages/renderer/src/features/workbench/editor/useWorkbenchEditorState.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts
packages/renderer/src/features/workbench/types/workbench-layout.ts
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/App.tsx
```

Then run a quick file inventory:

```bash
find packages/renderer/src/features -maxdepth 3 -type f \
  | sort \
  | sed -n '1,240p'
```

Look specifically for local layout or shell-like behavior outside `features/workbench`:

```bash
grep -R "grid-cols-\|grid-rows-\|h-screen\|overflow-hidden\|localStorage\|resize\|bottomDock\|inspectorVisible\|navigatorVisible" \
  packages/renderer/src/features \
  --exclude-dir=node_modules \
  --exclude='*.test.tsx' \
  --exclude='*.stories.tsx' \
  || true
```

This grep is diagnostic. Do not blindly delete matches. Use it to identify shell-boundary risks.

---

## 2. Current diagnosis after PR33

PR33 has moved the project in the right direction: the branch now has Workbench shell layout control, editor contexts/tabs, surface body components, and bottom dock framing primitives.

The remaining problem is not lack of more business features. The remaining problem is that the Workbench contract is still too easy to erode:

```text
layout controls exist, but shell ownership is not yet strongly enforced
editor tabs exist, but active business state must remain route-first
surface wrappers exist, but scroll/overflow contracts can drift by scope
bottom dock frame exists, but dock usage needs stronger product boundaries
Storybook exists, but it must become a behavior contract, not just visual examples
unit tests exist, but they need cross-scope regression intent
```

This PR must therefore be a correction/hardening PR.

---

## 3. Product invariants that must remain true

These are non-negotiable.

### 3.1 Route / layout / editor state boundary

```text
route:
  active business identity
  current scope
  current object id
  current lens / view
  current selected review issue / checkpoint / branch when applicable

layout state:
  navigator visible/hidden
  inspector visible/hidden
  bottom dock visible/hidden
  pane sizes
  dock maximized

editor context state:
  list of opened workbench contexts
  active context id as local UI memory
  saved route snapshot for each opened context
```

Do not write pane width, pane hidden state, dock height, or opened tabs into URL.

Do not store active scene/chapter/asset/book/lens only in localStorage.

### 3.2 Shell owns layout

`WorkbenchShell` owns:

```text
pane visibility
pane size
sash behavior
bottom dock maximize/hide
region roles / aria labels
layout restore/reset
surface overflow boundaries
```

Business scopes must not implement their own pane layout, shell grid, inspector toggles, or dock maximization.

### 3.3 Main Stage remains primary

Main Stage must have one primary task.

Inspector explains/supports.

Bottom Dock diagnoses/traces/runs.

Navigator navigates objects.

Do not put accept/reject/rewrite primary decisions into Bottom Dock.

Do not put writing/proposal review/chapter reorder main workflows into Inspector.

### 3.4 Opened contexts are not business tabs

Editor tabs represent opened work contexts, not nested product tabs.

Allowed identity examples:

```text
scene:<sceneId>:orchestrate
scene:<sceneId>:draft
chapter:<chapterId>:structure
chapter:<chapterId>:draft
asset:<assetId>:knowledge
book:<bookId>:structure
book:<bookId>:draft
```

Do not include proposal ids, artifact ids, review issue ids, or checkpoint ids in the editor context id. Those can remain in the saved route snapshot if already part of route, but they must not create tab explosion.

---

## 4. Explicit non-goals for this PR

Do not do any of the following:

```text
Status Bar
Command Palette rewrite
Quick Open
Split editor groups
Tab drag/drop
Dirty/unsaved state
Global keyboard registry rewrite
Secondary side bar
New feature dashboards
New business scope
New lens
New backend/API endpoints
Real SSE
Temporal
Worker process
Desktop packaging
Prompt editor
Context policy mutation
RAG/vector search
Spatial Blackboard / Blender
```

If you believe one of these is necessary, stop and record it as a follow-up in the audit doc.

---

## 5. Required deliverables

### Deliverable A — audit doc

Create:

```text
doc/review/post-pr33-workbench-surface-audit.md
```

It must contain:

```md
# Post-PR33 Workbench Surface Audit

## Audited branch
codex/pr33-workbench-surface-contract-stabilization

## Summary
- What feels wrong / fragile after PR33
- Which issues this PR fixes
- Which issues are intentionally deferred

## Contract risks found
| Risk | Location | Severity | Fix in this PR? | Notes |
|---|---|---:|---|---|

## Scope surface ownership matrix
| Scope | Navigator owner | Main Stage owner | Inspector owner | Bottom Dock owner | Violations? |
|---|---|---|---|---|---|

## Route / layout / editor boundary check
- Route does not contain pane sizes / hidden states: yes/no
- Layout does not contain active object ids / lens: yes/no
- Editor context does not create fine-grained tab explosion: yes/no

## Storybook gaps before this PR

## Storybook states added in this PR

## Follow-up backlog
```

The audit doc is not optional. It is the handoff record for future agents.

---

### Deliverable B — WorkbenchShell surface contract hardening

Review and harden:

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
packages/renderer/src/features/workbench/components/WorkbenchSurfaceBody.tsx
packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx
packages/renderer/src/features/workbench/components/WorkbenchSash.tsx
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts
packages/renderer/src/features/workbench/types/workbench-layout.ts
```

Required outcomes:

1. `WorkbenchShell` must expose stable test ids and semantic regions for:

```text
workbench-shell
workbench-top-bar
workbench-layout-controls
workbench-body
workbench-mode-rail
workbench-navigator
workbench-main-stage
workbench-editor-tabs
workbench-inspector
workbench-bottom-dock
```

2. Hiding navigator / inspector / bottom dock must not leave empty grid gaps.

3. `bottomDockMaximized` must not destroy navigator/inspector visibility preferences.

4. Reset layout must reset layout only. It must not clear route and must not clear editor contexts unless a separate explicit editor reset already exists.

5. `WorkbenchSurfaceBody` must remain the single scroll/overflow wrapper for scrollable workbench surface content where appropriate.

6. Shell-level scroll must not become page-level scroll. The app should still behave as `h-screen` workbench with contained scroll regions.

7. Layout controls must remain shell controls, not business controls. They should have accessible labels and disabled/noop behavior when a pane does not exist.

Do not restyle the whole product. Only change structure/classes necessary to enforce the contract.

---

### Deliverable C — editor context/tabs hardening

Review and harden:

```text
packages/renderer/src/features/workbench/editor/workbench-editor-context.ts
packages/renderer/src/features/workbench/editor/workbench-editor-descriptors.ts
packages/renderer/src/features/workbench/editor/workbench-editor-storage.ts
packages/renderer/src/features/workbench/editor/useWorkbenchEditorState.ts
packages/renderer/src/features/workbench/editor/WorkbenchEditorProvider.tsx
packages/renderer/src/features/workbench/editor/WorkbenchEditorTabs.tsx
```

Required outcomes:

1. Current route remains the source of what Main Stage displays.

2. Editor context tabs store route snapshots but do not own business state.

3. Clicking a tab must call the existing route replacement path through the provider/controller, not directly mutate business stores.

4. Closing an inactive tab must not change route.

5. Closing the active tab may restore the most recent remaining context route. If no remaining contexts exist, do not invent a new route unless the existing provider already has a default route policy.

6. Storage recovery must tolerate invalid JSON, unknown route shape, missing fields, and old versions.

7. Context count should remain bounded. If a max exists, test it. If no max exists, add a small max such as 12 and test it.

8. Tab identity must stay coarse-grained by `scope + object id + lens`, not artifact/proposal/review issue.

9. The tab strip must not appear as a product-level mode switch. It should look and behave like opened work context headers.

Do not add split groups or drag/drop.

---

### Deliverable D — Bottom Dock contract hardening

Review and harden:

```text
packages/renderer/src/features/workbench/components/WorkbenchBottomDockFrame.tsx
packages/renderer/src/features/workbench/components/WorkbenchBottomDockFrame.test.tsx
```

Then inspect all current bottom dock content usages across:

```text
packages/renderer/src/features/scene
packages/renderer/src/features/chapter
packages/renderer/src/features/asset
packages/renderer/src/features/book
packages/renderer/src/features/review
packages/renderer/src/App.tsx
```

Required outcomes:

1. Multi-tab bottom dock content should use `WorkbenchBottomDockFrame` or an equivalent shared frame, not ad hoc tablists inside feature scopes.

2. Bottom Dock content must be runtime/activity/problems/trace/support only.

3. If a feature currently places primary decision actions in Bottom Dock, move them back to Main Stage or leave a follow-up note if moving is too broad.

4. Bottom Dock frame must support keyboard tab navigation: ArrowLeft, ArrowRight, Home, End.

5. Bottom Dock frame must use `role="tablist"`, `role="tab"`, and `role="tabpanel"` correctly.

6. Bottom Dock frame must use `WorkbenchSurfaceBody` for its scrollable body.

7. Tests must cover keyboard navigation and active panel labeling.

Do not introduce new dock features.

---

### Deliverable E — cross-scope Storybook contract states

Update:

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
```

Add or verify stories that cover:

```text
Default
NavigatorHidden
InspectorHidden
BottomDockHidden
BottomDockMaximized
ResizedPanes
NarrowViewport
ManyEditorTabs
HiddenPanesWithEditorTabs
BottomDockFrameContract
FourScopeSurfaceContract
```

`FourScopeSurfaceContract` should not be a giant business demo. It should be a lightweight Workbench story that proves the shell can host representative content for Scene / Chapter / Asset / Book without each scope owning layout.

Story acceptance:

1. Stories render without runtime API dependency.
2. Stories use mock/fixture content only.
3. Stories show the shell regions clearly.
4. Stories make hidden pane / maximized dock / many tabs visually inspectable.
5. Stories do not create new product pages.

---

### Deliverable F — tests that lock the product contract

Add or update tests in the smallest suitable files.

Required tests:

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
packages/renderer/src/features/workbench/editor/useWorkbenchEditorState.test.tsx
packages/renderer/src/features/workbench/editor/WorkbenchEditorProvider.test.tsx
packages/renderer/src/features/workbench/editor/WorkbenchEditorTabs.test.tsx
packages/renderer/src/features/workbench/components/WorkbenchBottomDockFrame.test.tsx
```

Add a new test file if useful:

```text
packages/renderer/src/features/workbench/workbench-surface-contract.test.tsx
```

Test cases must cover:

1. Hiding panes does not mutate URL route state.
2. Layout reset does not mutate route state.
3. Editor tab activation calls route replacement and does not directly own business rendering.
4. Editor context id does not include fine-grained review/artifact/proposal route parameters.
5. Closing inactive tab does not replace route.
6. Closing active tab restores recent context if available.
7. Invalid editor storage is ignored safely.
8. Invalid layout storage is ignored safely.
9. Bottom dock maximize keeps navigator/inspector preferences intact.
10. Bottom dock frame keyboard navigation works.
11. Main Stage still renders when navigator/inspector/dock are hidden.
12. Storybook-facing contract test or component test verifies the expected workbench test ids exist.

Avoid tests that only assert text exists. Prefer tests that assert route/layout/editor boundaries.

---

### Deliverable G — optional constitution guard script

If this can be done safely in this PR, add:

```text
scripts/check-workbench-constitution.mjs
```

The script should be lightweight and conservative. It should not fail on legitimate existing code unless the pattern is clearly a constitution violation.

Suggested checks:

1. Warn if business feature files contain `h-screen`.
2. Warn if business feature files contain shell-like `grid-cols-[68px` or `grid-rows-[` layout strings.
3. Warn if business feature files mention `navigatorVisible`, `inspectorVisible`, `bottomDockVisible`, or `bottomDockMaximized`.
4. Warn if business feature files write `localStorage` for layout/editor-like keys.
5. Allow these patterns inside `features/workbench`, tests, stories, and desktop shell code.

If added, wire it as a non-invasive script first:

```json
{
  "scripts": {
    "check:workbench": "node scripts/check-workbench-constitution.mjs"
  }
}
```

Do not make it overly strict unless existing code passes.

If this script risks distracting from the main PR, skip it and record it in the audit doc follow-up backlog.

---

## 6. File touch map

### Allowed and expected

```text
doc/review/post-pr33-workbench-surface-audit.md
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
packages/renderer/src/features/workbench/components/WorkbenchSurfaceBody.tsx
packages/renderer/src/features/workbench/components/WorkbenchBottomDockFrame.tsx
packages/renderer/src/features/workbench/components/WorkbenchBottomDockFrame.test.tsx
packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx
packages/renderer/src/features/workbench/components/WorkbenchSash.tsx
packages/renderer/src/features/workbench/editor/*
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
packages/renderer/src/features/workbench/types/workbench-layout.ts
packages/renderer/src/app/i18n/index.tsx
```

### Allowed only if necessary

```text
packages/renderer/src/App.tsx
packages/renderer/src/features/scene/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/book/**
packages/renderer/src/features/review/**
```

Only touch business feature files to remove shell/layout leakage or to replace ad hoc bottom dock framing with the shared workbench frame.

### Do not touch

```text
packages/api/**
packages/desktop/**
pnpm-lock.yaml unless dependency/package scripts truly change
API route contracts
fixture backend behavior
Temporal / worker / SSE placeholders
```

---

## 7. Implementation order

### Step 1 — baseline tests

Run:

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
```

If baseline fails before changes, record the failure in the audit doc and continue only if the failure is unrelated to this PR. Do not hide unrelated failures.

### Step 2 — create audit doc

Create `doc/review/post-pr33-workbench-surface-audit.md` before making code changes.

Fill the initial audit with what you found from reading files and grep diagnostics.

### Step 3 — harden shell surface contract

Make the smallest changes necessary to stabilize shell regions, test ids, pane visibility, resize/maximize behavior, and scroll boundaries.

### Step 4 — harden editor tabs

Patch only behavior bugs and missing tests. Do not redesign tabs.

### Step 5 — harden bottom dock frame

Patch shared dock frame and only obvious ad hoc dock violations.

### Step 6 — add Storybook contract states

Add the required Storybook states after code behavior is stable.

### Step 7 — add/adjust tests

Add route/layout/editor/dock contract tests. Prefer behavior assertions over snapshots.

### Step 8 — update audit doc final section

Mark fixed vs deferred issues.

### Step 9 — run final checks

Run:

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer build-storybook
pnpm typecheck
pnpm test
```

If `build-storybook` is too slow in the environment, run it if feasible and record if not run. Do not claim it passed without running it.

---

## 8. Manual review checklist

After implementation, manually inspect these flows in the running renderer or Storybook.

### 8.1 Workbench shell

```text
open default workbench
hide navigator
hide inspector
hide bottom dock
reset layout
resize navigator
resize inspector
resize dock
maximize dock
restore dock
refresh page
```

Expected:

```text
route does not change
layout preference persists through refresh
main stage remains usable
no empty pane gaps
no page-level scrolling takeover
```

### 8.2 Editor contexts

```text
open Scene / Orchestrate
open Scene / Draft
open Chapter / Structure
open Asset / Knowledge
switch tabs
close inactive tab
close active tab
refresh page
```

Expected:

```text
tabs restore
active route follows tab activation
closing inactive tab does not change route
closing active tab restores a recent context if available
tab identity does not explode when changing review issue/artifact/proposal sub-state
```

### 8.3 Bottom dock

```text
open a workspace with runtime/activity/trace dock content
switch dock tabs with mouse
switch dock tabs with keyboard
maximize dock
hide dock
restore dock
```

Expected:

```text
dock only contains supporting information
keyboard navigation works
dock maximize does not act like a second main stage
dock hide/maximize does not mutate route
```

### 8.4 Four-scope sanity

Check representative routes:

```text
Scene / Orchestrate
Scene / Draft
Chapter / Structure
Chapter / Draft
Asset / Knowledge
Book / Draft / Review
Book / Draft / Compare
```

Expected:

```text
all use the same WorkbenchShell
no scope creates its own shell grid
main stage task remains clear
inspector remains supporting
bottom dock remains support/diagnostic
```

---

## 9. Acceptance criteria

This PR is complete only if all are true:

1. `doc/review/post-pr33-workbench-surface-audit.md` exists and documents fixed/deferred issues.
2. Workbench shell has stable region/test id coverage.
3. Layout hide/resize/maximize/reset behavior is covered by tests.
4. Editor context tab route-sync behavior is covered by tests.
5. Bottom dock frame keyboard/a11y behavior is covered by tests.
6. Storybook includes the required contract states.
7. No new business feature was added.
8. No API/desktop/backend behavior was changed.
9. Route/layout/editor state boundaries remain intact.
10. Main Stage remains the only primary work surface.
11. Inspector and Bottom Dock do not become primary workflow surfaces.
12. Final checks were run or honestly reported.

---

## 10. Automatic failure conditions

Fail the PR if any of these happen:

1. A business feature bypasses `WorkbenchShell`.
2. A scope implements its own pane visibility, splitter, dock maximize, or shell grid.
3. Pane sizes, pane hidden state, or opened tabs are written into URL.
4. Active object/lens business state is stored only in localStorage.
5. Bottom Dock contains primary accept/reject/rewrite decisions.
6. Inspector contains primary writing/proposal review/chapter reorder workflows.
7. Main Stage becomes a dashboard of unrelated cards.
8. Editor tab identity includes proposal/artifact/review issue ids and creates tab explosion.
9. New route schema is introduced for layout/editor preference.
10. Tests only assert text rendering and do not cover route/layout/editor boundaries.
11. Storybook states for hidden/maximized/narrow/many-tabs are missing.
12. The PR introduces Status Bar, Quick Open, Split Editor, real backend, or new feature work.

---

## 11. Follow-up roadmap after this PR

Only after this correction PR passes, continue with:

```text
PR35: Status Bar + Runtime / Project Signals
PR36: Quick Open / Object Jump Foundation
PR37: Editor Split / Two-column Compare Foundation
PR38: Return to business workflow polishing or backend MVP integration
```

Do not start PR35 until this PR proves the Workbench shell, editor contexts, and dock contract are stable.

---

## 12. Final response template for the AI agent

When done, respond with:

```md
## Summary
- ...

## Fixed Workbench contract issues
- ...

## Deferred issues recorded in audit doc
- ...

## Tests / checks run
- `pnpm --filter @narrative-novel/renderer typecheck` — pass/fail
- `pnpm --filter @narrative-novel/renderer test` — pass/fail
- `pnpm --filter @narrative-novel/renderer build-storybook` — pass/fail/not run with reason
- `pnpm typecheck` — pass/fail
- `pnpm test` — pass/fail

## Constitution compliance
- Route/layout/editor boundaries preserved: yes/no
- Main Stage primary task preserved: yes/no
- Inspector and Dock remain supporting surfaces: yes/no
- No new business feature added: yes/no
```

Do not claim success if checks were not run.
