# Post-PR33 Workbench Surface Audit

## Audited branch
codex/pr33-workbench-surface-contract-stabilization

## Summary
- What feels wrong / fragile after PR33: the shared shell mostly owns layout already, but several shell regions still lack explicit stable test ids, and optional-pane controls are noop-only instead of visibly disabled when a surface does not exist.
- Which issues this PR fixes: this PR hardens the WorkbenchShell contract around semantic shell regions, hidden-pane layout behavior, local-only layout reset, invalid layout storage safety, and bottom dock maximize preference preservation.
- Which issues are intentionally deferred: broader Storybook state expansion, command surface, Quick Open, Status Bar, split editor, mobile layout, backend/API/desktop/SSE/Temporal work, prompt editing, and baseline duplicate React key warnings in BookDraftWorkspace tests are deferred.
- Mandatory reading findings: `doc/frontend-workbench-constitution.md` requires WorkbenchShell-owned layout, route/layout separation, one primary Main Stage, Navigator/Inspector/Dock support roles, Storybook states, and route/layout/selection/restore tests. `doc/project-positioning-and-design-principles.md` and `doc/odd-frontend-comprehensive-design.md` confirm the product is a Narrative IDE using Scope x Lens and a VS Code-like five-surface workbench, not a page collection or dashboard. `doc/post-pr31-vscode-ux-roadmap-and-pr32-editor-context-execution-plan.md` confirms editor contexts are local UI preference while route remains the active business-state truth.
- Source findings: `WorkbenchShell.tsx` owns shell grid rows/columns, pane visibility, shell controls, sashes, and contained scroll wrappers; `WorkbenchSurfaceBody.tsx` is the reusable scroll/overflow wrapper; `WorkbenchBottomDockFrame.tsx` keeps dock content inside a bounded flex/tabpanel frame; `useWorkbenchLayoutState.ts` keeps layout in localStorage and does not touch route/editor state; `workbench-layout.ts` clamps persisted layout and returns `0px` tracks for hidden panes; `workbench-route.ts` contains object/lens/view identity only; `WorkbenchEditorProvider.tsx`, `WorkbenchEditorTabs.tsx`, and `useWorkbenchEditorState.ts` keep opened editor contexts local and restore route snapshots through `replaceRoute`.
- VS Code reference findings: `refer/vscode/src/vs/workbench/browser/layout.ts` and `layoutService.ts` model visibility, resize, and panel maximize as layout-service concerns; `layoutActions.ts` exposes layout actions as workbench-level commands; `sash.ts` treats drag separators as first-class accessible interaction primitives. Bundle 1 borrows the separation, not extra VS Code features.
- Diagnostic inventory: ran `find packages/renderer/src/features -maxdepth 3 -type f | sort | sed -n '1,240p'` to inventory affected feature files. Ran `grep -R "grid-cols-\|grid-rows-\|h-screen\|overflow-hidden\|localStorage\|resize\|bottomDock\|inspectorVisible\|navigatorVisible" packages/renderer/src/features --exclude-dir=node_modules --exclude='*.test.tsx' --exclude='*.stories.tsx' || true`; findings were shell-owned layout state in `features/workbench`, business-scope `bottomDock` prop usage, and content-level grid/overflow classes, with no business feature writing workbench pane widths/hidden state.
- Baseline before Bundle 1: controller reported `pnpm --filter @narrative-novel/renderer typecheck` passed and `pnpm --filter @narrative-novel/renderer test` passed with 156 files / 887 tests. Duplicate React key warnings in BookDraftWorkspace tests such as trace-gap/warnings/compare keys were baseline risk and are intentionally not fixed in this bundle.
- Bundle 1 verification: after shell/layout/test changes, `pnpm --filter @narrative-novel/renderer test -- WorkbenchShell useWorkbenchLayoutState` broadened to the full renderer suite and passed with 156 files / 892 tests; duplicate-key warnings remained the same baseline class. `pnpm --filter @narrative-novel/renderer typecheck` passed.

## Contract risks found
| Risk | Location | Severity | Fix in this PR? | Notes |
|---|---|---:|---|---|
| Shell regions do not all expose stable test ids for future MCP/Storybook checks. | `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`, `WorkbenchLayoutControls.tsx` | 2 | yes | Required ids include top bar, layout controls, mode rail, editor tabs, and all workbench surface regions; editor tab test id is shell-owned via a wrapper. |
| Missing optional panes leave enabled controls that only noop. | `packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx` | 2 | yes | Controls should remain shell controls with accessible labels and disabled/noop behavior when the target pane does not exist. |
| Hidden panes could regress into visual gutters if shell grid gaps or rendered hidden wrappers return. | `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`, `workbench-layout.ts` | 2 | yes | Existing helper returns zero-width tracks and tests assert no CSS grid gap; PR adds/keeps behavior assertions. |
| Bottom dock maximize could accidentally overwrite navigator/inspector preferences in future refactors. | `packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts` | 2 | yes | VS Code reference separates visibility, size, and maximize state; this PR locks the same local-layout discipline with tests. |
| Layout reset could drift into route/editor reset because shell controls sit near editor tabs. | `WorkbenchShell.tsx`, `useWorkbenchLayoutState.ts`, `WorkbenchEditorProvider.tsx` | 3 | yes | Reset layout must only restore layout defaults; route and editor contexts are separate state layers. |
| Baseline duplicate React key warning remains in BookDraftWorkspace tests. | `packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx` baseline stderr | 1 | no | Controller baseline passed typecheck and 887 tests; duplicate keys such as trace-gap/warnings/compare are deferred because Bundle 1 is shell/layout only. |

## Scope surface ownership matrix
| Scope | Navigator owner | Main Stage owner | Inspector owner | Bottom Dock owner | Violations? |
|---|---|---|---|---|---|
| Scene | Scene workbench content via `navigator` prop | Scene workbench content via `mainStage` prop | Scene inspector content via `inspector` prop | Scene dock content via `bottomDock` prop | No shell-layout ownership violation found in Bundle 1 audit. |
| Chapter | Chapter scope content via WorkbenchShell props | Chapter structure/draft content via WorkbenchShell props | Chapter inspector content via WorkbenchShell props | Chapter dock content via WorkbenchShell props | No shell-layout ownership violation found in diagnostic grep. |
| Asset | Asset scope content via WorkbenchShell props | Asset knowledge content via WorkbenchShell props | Asset inspector content via WorkbenchShell props | Asset dock content via WorkbenchShell props | No shell-layout ownership violation found in diagnostic grep. |
| Book | Book scope content via WorkbenchShell props | Book structure/draft content via WorkbenchShell props | Book inspector content via WorkbenchShell props | Book dock content via WorkbenchShell props | No shell-layout ownership violation found in diagnostic grep. |

## Route / layout / editor boundary check
- Route does not contain pane sizes / hidden states: yes
- Layout does not contain active object ids / lens: yes
- Editor context does not create fine-grained tab explosion: yes

## Storybook gaps before this PR
Bundle 1 is limited to shell/layout contract and tests. Existing Storybook state expansion for affected workbench surfaces remains a later-bundle gap. Before this PR, the shell test surface was stronger than the Storybook handoff for explicit test ids and missing-pane control states.
No Storybook MCP run was performed in Bundle 1 because the bundle plan assigns Storybook state expansion and final MCP verification to a later bundle.

## Storybook states added in this PR
None in Bundle 1. Later bundles may append final Storybook shell states and MCP verification evidence.

## Follow-up backlog
- Add Storybook states that demonstrate all affected shell surfaces, missing optional panes, hidden navigator/inspector/bottom dock, and bottom dock maximized/restored.
- Run Storybook MCP structured snapshot plus screenshot verification after Storybook states land.
- Fix the deferred baseline duplicate React key warnings in BookDraftWorkspace tests in a dedicated book-draft cleanup slice.
- Keep route/layout/editor boundary tests near WorkbenchShell and hook tests whenever shell controls or editor tabs change.
