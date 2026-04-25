# 2026-04-26 Workbench Layout Comment Summary

## Gate

Fail. The three browser comments all point to the same layout failure family: the workbench shell is behaving like a long page instead of a fixed application viewport with independently scrollable panes.

## Source

- Page: `http://127.0.0.1:4173/?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&proposalId=proposal-midnight-platform-001`
- Viewport: `1117x796`
- Evidence: user diff comments 1-3 with marker screenshots.
- Related prior report: `doc/review/2026-04-25-real-frontend-interaction-smoke.md`

## Summary

The current scene workbench layout does not adapt to a normal desktop viewport. The left navigator card content is clipped, the whole page scrolls vertically, and the bottom dock is pushed below the visible viewport. This breaks the intended IDE/workbench behavior: the top bar, rail, navigator, stage, inspector, and bottom dock should fit inside the viewport; only the inner content regions should scroll.

## Findings

### P1: Workbench root allows full-page vertical growth, pushing the bottom dock below the viewport

Comment 2:

> 页面太长了，直接把底部 docker 栏给挤到下面，需要整页下滑才能看到。vscode 里是中间页面可滑动的，不会出现这种问题。

Observed:

- The selected root layout extends beyond the viewport height.
- The bottom dock is not visible without scrolling the entire browser page.
- This makes the workbench feel like a document page, not a fixed editor shell.

Expected:

- The workbench should occupy exactly the visible viewport.
- Header and dock should remain in the app frame.
- Main-stage content should scroll inside its own panel.
- The browser page itself should not need vertical scrolling for normal workbench use.

Likely responsibility area:

- `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx:60` to `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx:63` uses `min-h-screen`, allowing content to grow beyond the viewport.
- `packages/renderer/src/features/workbench/types/workbench-layout.ts:109` to `packages/renderer/src/features/workbench/types/workbench-layout.ts:117` defines rows as `minmax(72px,auto) minmax(0,1fr) ${bottomDockHeight}px`; the auto header plus content growth can still push the dock down if the shell is not height-clamped.

Fix direction:

- Treat the shell as `h-screen` / fixed viewport height, not `min-h-screen`.
- Ensure the shell root and body have `overflow-hidden`.
- Keep row sizing bounded so the middle row absorbs overflow internally instead of expanding the page.

### P1: Bottom dock header and tab bar consume the dock height, leaving the tab content effectively invisible

Comment 3:

> 显示不完全，根本看不到 子 tab 显示的窗口，上面这个标题啥的把位置全占了。

Observed:

- The dock itself is visible after scrolling, but only the dock title/description and tab strip are comfortably visible.
- The active tab content starts below the visible region.
- This makes `事件 / 追踪 / 一致性 / 问题 / 成本` look clickable but not actually usable in the default dock size.

Expected:

- The dock should reserve a visible content viewport below the tabs.
- The title/description area should be compact enough for the default dock height.
- Active tab content should scroll inside the dock content area, not be hidden below the fold.

Likely responsibility area:

- `packages/renderer/src/features/scene/components/SceneBottomDock.tsx:427` to `packages/renderer/src/features/scene/components/SceneBottomDock.tsx:440` renders a full `PaneHeader`, tabs, then content in a plain `min-h-0 overflow-y-auto` container.
- `packages/renderer/src/features/workbench/types/workbench-layout.ts:24` to `packages/renderer/src/features/workbench/types/workbench-layout.ts:28` sets the default bottom dock height to `196px`, which is too shallow for the current header + tabs + content composition.

Fix direction:

- Make `SceneBottomDock` a bounded flex column where only the active tab body flexes and scrolls.
- Compress or conditionally collapse the dock description in small/default dock heights.
- Revisit the default dock height or use a compact dock header variant for the bottom panel.

### P2: Navigator cards do not adapt to the narrow pane width

Comment 1:

> 布局没有自适应

Observed:

- The selected left navigator card clips the long version badge `CHECKPOINT PR11 + DRAFT DELTA`.
- Long English/chapter labels and mixed-language body text overflow or become visually cramped in the narrow navigator.
- The navigator pane is only 240px by default, but card content is laid out as if it has more horizontal room.

Expected:

- Long badges should wrap, shrink, or stack instead of clipping.
- The card header should adapt to narrow navigator widths.
- Card body text should be clamped or scrollable within the navigator, not hidden awkwardly.

Likely responsibility area:

- `packages/renderer/src/App.tsx:226` to `packages/renderer/src/App.tsx:255` renders navigator cards with a horizontal title/status row.
- `packages/renderer/src/App.tsx:244` to `packages/renderer/src/App.tsx:249` uses `flex items-start justify-between gap-3`; the status badge is not constrained enough for long labels.
- `packages/renderer/src/features/workbench/types/workbench-layout.ts:24` to `packages/renderer/src/features/workbench/types/workbench-layout.ts:27` sets navigator default width to `240px`, so narrow-card behavior must be intentional.

Fix direction:

- Stack the status badge below title metadata at narrow widths, or allow badge wrapping with `max-w-full`.
- Clamp navigator card detail text to a small number of lines.
- Make the navigator list itself scroll vertically inside the pane.

## Combined Acceptance Criteria

- At `1117x796`, the browser page should not need vertical scrolling to reveal the bottom dock.
- The middle body region should fit between top command bar and bottom dock.
- Main stage, navigator, inspector, and bottom dock content should each scroll internally when content overflows.
- The bottom dock should show at least the active tab's first meaningful content row in the default layout.
- Long navigator badges and labels should not clip outside their card.
- The layout should remain usable after toggling navigator, inspector, and bottom dock visibility.

## Suggested Verification

1. Start API and renderer:

```bash
pnpm dev:api
VITE_NARRATIVE_API_BASE_URL=http://127.0.0.1:4174/api VITE_NARRATIVE_PROJECT_ID=book-signal-arc pnpm --filter @narrative-novel/renderer dev --host 127.0.0.1 --port 4173
```

2. Open the same scene route in the in-app browser.
3. Use structured snapshots to confirm:
   - shell root is viewport-bounded,
   - bottom dock is visible without page scroll,
   - dock tab content appears inside the visible dock,
   - navigator card content is not clipped.
4. Repeat at a narrower width near the provided `1117x796` screenshot size.

## Relationship To Previous Smoke

The prior smoke report focused on broken navigation/runtime paths and mixed localization. These comments add a separate layout gate: even the valid scene path is not yet a stable workbench surface at this viewport because the shell, navigator, and bottom dock do not preserve an IDE-like fixed viewport model.
