# Post-PR33 Workbench Surface Audit

## Audited branch
codex/pr33-workbench-surface-contract-stabilization

## Summary
- What feels wrong / fragile after PR33: the shared shell mostly owns layout already, but several shell regions still lack explicit stable test ids, and optional-pane controls are noop-only instead of visibly disabled when a surface does not exist.
- Which issues this PR fixes: this PR hardens the WorkbenchShell contract around semantic shell regions, hidden-pane layout behavior, local-only layout reset, invalid layout storage safety, bottom dock maximize preference preservation, editor-context locality, shared bottom dock framing, and cross-scope Storybook contract states.
- Which issues are intentionally deferred: command surface, Quick Open, Status Bar, split editor, mobile layout, backend/API/desktop/SSE/Temporal work, prompt editing, optional constitution guard scripting, and baseline duplicate React key warnings in BookDraftWorkspace tests are deferred.
- Mandatory reading findings: `doc/frontend-workbench-constitution.md` requires WorkbenchShell-owned layout, route/layout separation, one primary Main Stage, Navigator/Inspector/Dock support roles, Storybook states, and route/layout/selection/restore tests. `doc/project-positioning-and-design-principles.md` and `doc/odd-frontend-comprehensive-design.md` confirm the product is a Narrative IDE using Scope x Lens and a VS Code-like five-surface workbench, not a page collection or dashboard. `doc/post-pr31-vscode-ux-roadmap-and-pr32-editor-context-execution-plan.md` confirms editor contexts are local UI preference while route remains the active business-state truth.
- Source findings: `WorkbenchShell.tsx` owns shell grid rows/columns, pane visibility, shell controls, sashes, and contained scroll wrappers; `WorkbenchSurfaceBody.tsx` is the reusable scroll/overflow wrapper; `WorkbenchBottomDockFrame.tsx` keeps dock content inside a bounded flex/tabpanel frame; `useWorkbenchLayoutState.ts` keeps layout in localStorage and does not touch route/editor state; `workbench-layout.ts` clamps persisted layout and returns `0px` tracks for hidden panes; `workbench-route.ts` contains object/lens/view identity only; `WorkbenchEditorProvider.tsx`, `WorkbenchEditorTabs.tsx`, and `useWorkbenchEditorState.ts` keep opened editor contexts local and restore route snapshots through `replaceRoute`.
- VS Code reference findings: `refer/vscode/src/vs/workbench/browser/layout.ts` and `layoutService.ts` model visibility, resize, and panel maximize as layout-service concerns; `layoutActions.ts` exposes layout actions as workbench-level commands; `sash.ts` treats drag separators as first-class accessible interaction primitives. Bundle 1 borrows the separation, not extra VS Code features.
- Diagnostic inventory: ran `find packages/renderer/src/features -maxdepth 3 -type f | sort | sed -n '1,240p'` to inventory affected feature files. Ran `grep -R "grid-cols-\|grid-rows-\|h-screen\|overflow-hidden\|localStorage\|resize\|bottomDock\|inspectorVisible\|navigatorVisible" packages/renderer/src/features --exclude-dir=node_modules --exclude='*.test.tsx' --exclude='*.stories.tsx' || true`; findings were shell-owned layout state in `features/workbench`, business-scope `bottomDock` prop usage, and content-level grid/overflow classes, with no business feature writing workbench pane widths/hidden state.
- Baseline before Bundle 1: controller reported `pnpm --filter @narrative-novel/renderer typecheck` passed and `pnpm --filter @narrative-novel/renderer test` passed with 156 files / 887 tests. Duplicate React key warnings in BookDraftWorkspace tests such as trace-gap/warnings/compare keys were baseline risk and are intentionally not fixed in this bundle.
- Bundle 1 verification: after shell/layout/test changes, `pnpm --filter @narrative-novel/renderer test -- WorkbenchShell useWorkbenchLayoutState` broadened to the full renderer suite and passed with 156 files / 892 tests; duplicate-key warnings remained the same baseline class. `pnpm --filter @narrative-novel/renderer typecheck` passed.
- Bundle 2 findings: editor contexts remain local UI preference state; route snapshots are restored only through `WorkbenchEditorProvider` / `replaceRoute`, context identity stays coarse (`scope + object id + lens`), inactive close does not replace route, active close restores the most recent remaining context, and invalid/old/unknown editor storage is ignored safely.
- Bundle 2 bottom dock audit: Scene, Chapter, Chapter Draft, Asset, Book, and Book Draft multi-tab dock surfaces use `WorkbenchBottomDockFrame`; observed tab content is problems/activity/runtime/trace/support class content. A broader Scene runtime review decision control remains inside `SceneBottomDock` active run support and is deferred below rather than moved in this bundle.

## Contract risks found
| Risk | Location | Severity | Fix in this PR? | Notes |
|---|---|---:|---|---|
| Shell regions do not all expose stable test ids for future MCP/Storybook checks. | `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`, `WorkbenchLayoutControls.tsx` | 2 | yes | Required ids include top bar, layout controls, mode rail, editor tabs, and all workbench surface regions; editor tab test id is shell-owned via a wrapper. |
| Missing optional panes leave enabled controls that only noop. | `packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx` | 2 | yes | Controls should remain shell controls with accessible labels and disabled/noop behavior when the target pane does not exist. |
| Hidden panes could regress into visual gutters if shell grid gaps or rendered hidden wrappers return. | `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`, `workbench-layout.ts` | 2 | yes | Existing helper returns zero-width tracks and tests assert no CSS grid gap; PR adds/keeps behavior assertions. |
| Bottom dock maximize could accidentally overwrite navigator/inspector preferences in future refactors. | `packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts` | 2 | yes | VS Code reference separates visibility, size, and maximize state; this PR locks the same local-layout discipline with tests. |
| Layout reset could drift into route/editor reset because shell controls sit near editor tabs. | `WorkbenchShell.tsx`, `useWorkbenchLayoutState.ts`, `WorkbenchEditorProvider.tsx` | 3 | yes | Reset layout must only restore layout defaults; route and editor contexts are separate state layers. |
| Baseline duplicate React key warning remains in BookDraftWorkspace tests. | `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx` baseline stderr | 1 | no | Controller baseline passed typecheck and 887 tests; duplicate keys such as trace-gap/warnings/compare are deferred because Bundle 1 is shell/layout only. |
| Scene run review decision controls live in the Bottom Dock support surface. | `packages/renderer/src/features/scene/components/SceneBottomDock.tsx` | 2 | deferred | `RunReviewGate` appears in the events/support tab for waiting-review runs. Moving that primary decision flow back to Main Stage would touch scene runtime workflow ownership and is intentionally deferred from Bundle 2. |

## Scope surface ownership matrix
| Scope | Navigator owner | Main Stage owner | Inspector owner | Bottom Dock owner | Violations? |
|---|---|---|---|---|---|
| Scene | Scene workbench content via `navigator` prop | Scene workbench content via `mainStage` prop | Scene inspector content via `inspector` prop | Scene dock content via `bottomDock` prop | No shell-layout ownership violation found in Bundle 1 audit. |
| Chapter | Chapter scope content via WorkbenchShell props | Chapter structure/draft content via WorkbenchShell props | Chapter inspector content via WorkbenchShell props | Chapter dock content via WorkbenchShell props | No shell-layout ownership violation found in diagnostic grep. |
| Asset | Asset scope content via WorkbenchShell props | Asset knowledge content via WorkbenchShell props | Asset inspector content via WorkbenchShell props | Asset dock content via WorkbenchShell props | No shell-layout ownership violation found in diagnostic grep. |
| Book | Book scope content via WorkbenchShell props | Book structure/draft content via WorkbenchShell props | Book inspector content via WorkbenchShell props | Book dock content via WorkbenchShell props | No shell-layout ownership violation found in diagnostic grep. |
| Review | Book review is currently exposed inside Book Draft lens rather than a separate shell scope. | Book Draft review surface owns the primary review workflow in Main Stage. | Book Draft inspector supports review judgment. | Book Draft dock uses problems/activity summaries through `WorkbenchBottomDockFrame`. | No ad hoc bottom dock tablist found under `features/review`; review hooks/components feed Book Draft surfaces. |

## Route / layout / editor boundary check
- Route does not contain pane sizes / hidden states: yes
- Layout does not contain active object ids / lens: yes
- Editor context does not create fine-grained tab explosion: yes
- Editor context storage tolerates malformed JSON, old/missing route fields, unknown route scopes, and mismatched ids: yes
- Editor tab activation goes through provider/controller route replacement: yes
- Closing inactive editor context does not replace route: yes
- Closing the final active editor context does not invent a new route: yes

## Bottom dock contract check
- Multi-tab dock content uses shared frame: yes for Scene, Chapter, Chapter Draft, Asset, Book, and Book Draft.
- Shared frame uses `role="tablist"`, `role="tab"`, `role="tabpanel"` and `WorkbenchSurfaceBody`: yes.
- Shared frame keyboard support covers ArrowLeft, ArrowRight, Home, and End: yes.
- Active panel labeling is locked with `aria-labelledby` and a fallback when `activeTab` is invalid: yes.
- Deferred broad violation: `SceneBottomDock` embeds `RunReviewGate` in active run support. This may be a primary run-review decision action in the dock; move only in a dedicated scene runtime UX slice.

## Storybook gaps before this PR
Bundle 1 was limited to shell/layout contract and tests. Bundle 2 verified the shared bottom dock frame, but the shell-level Storybook handoff still lacked the exact PR34 state names for hidden panes with editor tabs, many editor tabs, bottom dock frame contract, and a lightweight four-scope shell contract.
No Storybook MCP run was performed in Bundle 1 because the bundle plan assigned Storybook state expansion and final MCP verification to a later bundle.

## Storybook states added in this PR
- Bundle 2 did not add new shell stories; it hardened existing editor/dock contracts and tests.
- Bundle 3 updated `Mockups/Workbench/Shell` with the PR34 contract-state names: `BottomDockFrameContract`, `ManyEditorTabs`, `HiddenPanesWithEditorTabs`, and `FourScopeSurfaceContract`.
- Existing shell states now cover the full requested set: `Default`, `NavigatorHidden`, `InspectorHidden`, `BottomDockHidden`, `BottomDockMaximized`, `ResizedPanes`, `NarrowViewport`, `ManyEditorTabs`, `HiddenPanesWithEditorTabs`, `BottomDockFrameContract`, and `FourScopeSurfaceContract`.
- `FourScopeSurfaceContract` is intentionally lightweight: it uses one `WorkbenchShell` with representative Scene / Chapter / Asset / Book fixture payloads in shell slots, proving scopes provide content while the shell owns layout. It does not add a new product page or runtime dependency.

## Storybook MCP verification
Bundle 2 ran Storybook at `http://127.0.0.1:6006/` and used MCP structured snapshot plus screenshot verification on `mockups-workbench-shell--unified-dock-tabs`. Snapshot showed the Bottom Dock frame as `tablist` / `tab` / `tabpanel` with active panel labeling. The only browser console error was a favicon 404.

Bundle 3 ran Storybook at `http://127.0.0.1:6006/` and verified the updated shell stories with Storybook MCP plus Playwright MCP structured snapshot and screenshot:
- Storybook MCP `getComponentList` returned `Mockups/Workbench/Shell`; `index.json` listed `mockups-workbench-shell--four-scope-surface-contract`, `mockups-workbench-shell--hidden-panes-with-editor-tabs`, `mockups-workbench-shell--many-editor-tabs`, and `mockups-workbench-shell--bottom-dock-frame-contract`.
- `mockups-workbench-shell--four-scope-surface-contract` structured snapshot showed Mode Rail, Navigator, Main Stage, Inspector, Bottom Dock, layout controls, runtime status, and a Bottom Dock frame with `tablist` / `tab` / `tabpanel`. Screenshot showed Scene / Chapter / Asset / Book fixture payloads hosted by one shell.
- `mockups-workbench-shell--hidden-panes-with-editor-tabs` structured snapshot showed Mode Rail and Main Stage with Open Editors tabs while Navigator, Inspector, and Bottom Dock were absent; the maximize dock control was disabled because the dock was hidden. Screenshot showed hidden panes and editor tabs clearly.
- Console noise remained limited to baseline Storybook favicon 404 and React DevTools info.

## Optional constitution guard script decision
Bundle 3 skipped `scripts/check-workbench-constitution.mjs` and root `check:workbench` because this PR is already contract/story/test heavy, and the suggested static checks could become noisy around legitimate shell-owned layout code. Keep this as a follow-up only if the controller wants a conservative warning-only script after PR34 lands.

## Follow-up backlog
- Move Scene run review decision controls out of `SceneBottomDock` active run support if the next scene runtime UX plan confirms that waiting-review acceptance/rewrite/reject is a Main Stage workflow.
- Fix the deferred baseline duplicate React key warnings in BookDraftWorkspace tests in a dedicated book-draft cleanup slice.
- Keep route/layout/editor boundary tests near WorkbenchShell and hook tests whenever shell controls or editor tabs change.
- Consider a warning-only constitution guard script in a dedicated tooling slice after the PR34 contract work is reviewed.
