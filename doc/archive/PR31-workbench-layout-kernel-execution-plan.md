# PR31 Workbench Layout Kernel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `storybook-frontend-implementation` for all renderer/story changes. If this plan is executed with subagents, use `superpowers:subagent-driven-development`; each coding worker should use `gpt-5.5-high`, own at least two tasks, finish all assigned tasks before review, and commit only after bundle review passes.

**Goal:** Turn the current fixed five-region web layout into a VS Code-style workbench layout kernel with visible/hidden parts, resizable pane boundaries, persistent layout state, Storybook coverage, and structured MCP verification.

**Architecture:** Keep business routing and workbench layout state separate. `scope/lens/view` remain URL-owned in `useWorkbenchRouteState`; pane visibility, pane sizes, and dock maximization become local UI layout state owned by the shared `WorkbenchShell`. Borrow VS Code's layout discipline from `refer/vscode`, not its source code or extension architecture.

**Tech Stack:** React 19, Vite, Tailwind, Vitest, Testing Library, Storybook 8, existing i18n dictionaries, no new runtime dependency unless a later review explicitly approves one.

---

## 0. 一句话结论

当前前端已经有 Mode Rail / Navigator / Main Stage / Inspector / Bottom Dock 的五面形状，但 `WorkbenchShell` 仍是固定 CSS grid：

```tsx
grid-rows-[minmax(72px,auto)_minmax(0,1fr)_196px]
grid-cols-[68px_240px_minmax(0,1fr)_280px]
```

这会让产品停留在“网页平铺布局”，而不是“工具类软件工作台”。

PR31 要补的不是某个业务组件，而是一个共享的 **Workbench Layout Kernel**：

- side panes 可以打开 / 关闭
- pane 宽高可以拖拽调整
- bottom dock 可以隐藏 / 恢复 / 最大化
- main stage 会随着布局变化自适应
- layout state 刷新后可恢复
- Storybook 能独立展示这些状态
- MCP 结构化快照能证明这些控件真的改变了 DOM/ARIA 结构

---

## 1. 当前代码基线

### 1.1 已有正确方向

现有产品文档已经把方向说清楚：

- `doc/project-positioning-and-design-principles.md`
  - 定义项目是 Narrative IDE，不是一组 AI 写作页面。
  - 明确长期收敛到 Mode Rail / Navigator / Main Stage / Inspector / Bottom Dock。
  - 明确借 VS Code 的 activity bar / side bar / editor / panel / status bar、tabs / split / panel、布局恢复。
- `doc/odd-frontend-comprehensive-design.md`
  - 明确从固定三栏升级为 IDE 式五面结构。
  - 明确要借 Activity Bar、Navigator、Editor Tabs、Split View、Right Inspector、Bottom Panel、Status Bar。
- `README.md`
  - 已经把 Workbench 壳子写成五面结构，并给出交互纪律。

方向没有错，落地缺的是可交互 layout kernel。

### 1.2 当前真实缺口

当前共享 shell 在：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
```

它的问题不是视觉层，而是结构层：

- pane 宽高是固定 class，不是状态。
- Navigator / Inspector / Bottom Dock 没有 visible state。
- 没有 resize handle / sash。
- 没有 layout persistence。
- 没有 layout controls。
- 没有 shell-level tests。
- Storybook 只有默认/章节示例，没有 hidden/resized/maximized/narrow states。
- 业务 scope 都把内容塞进同一个固定壳子，因此继续加功能只会让“网页感”更重。

### 1.3 VS Code 参考点

本轮必须先读 `refer/vscode`，但不要拷贝源码。

重点参考：

```text
refer/vscode/src/vs/workbench/services/layout/browser/layoutService.ts
refer/vscode/src/vs/workbench/browser/layout.ts
refer/vscode/src/vs/workbench/browser/actions/layoutActions.ts
refer/vscode/src/vs/workbench/browser/parts/panel/panelActions.ts
refer/vscode/src/vs/workbench/browser/parts/auxiliarybar/auxiliaryBarActions.ts
refer/vscode/src/vs/base/browser/ui/splitview/splitview.ts
refer/vscode/src/vs/base/browser/ui/sash/sash.ts
refer/vscode/src/vs/base/browser/ui/grid/gridview.ts
```

要借的机制：

- `Parts` 概念：activitybar / sidebar / editor / panel / auxiliarybar / statusbar。
- `setPartHidden(...)`：part visibility 是 layout service 的职责。
- `getSize(...)` / `setSize(...)` / `resizePart(...)`：尺寸是 layout state，不是散落 CSS。
- panel toggle / focus / position action：用户通过显式 action 操控布局。
- sash / splitview：拖拽边界是工作台体验的一等能力。
- storage restore：布局状态要能恢复。

不要借的东西：

- 不接 VS Code extension registry。
- 不引入 Monaco workbench。
- 不把当前 renderer 改成 VS Code fork。
- 不把 layout state 混进 `scope/lens/view` route。
- 不做完整 command palette。

---

## 2. PR31 的唯一目标

把 `WorkbenchShell` 从固定五栏壳升级为共享 layout kernel 的第一版。

PR31 完成后，用户应该能：

1. 在任意 scope 的 Workbench 中隐藏 / 显示 Navigator。
2. 隐藏 / 显示 Inspector。
3. 隐藏 / 显示 Bottom Dock。
4. 拖拽 Navigator 与 Main Stage 的边界改变左侧宽度。
5. 拖拽 Main Stage 与 Inspector 的边界改变右侧宽度。
6. 拖拽 Main Stage 与 Bottom Dock 的边界改变底部高度。
7. 最大化 / 恢复 Bottom Dock。
8. 刷新页面后恢复最近一次布局。
9. 点击 Reset Layout 回到默认布局。
10. Storybook 能展示 default / hidden / resized / dock maximized / narrow viewport 状态。

一句话：

> PR31 不扩业务功能，只把所有业务 scope 共用的 shell 变成真正的工作台。

---

## 3. 明确不做

PR31 不做以下内容：

- 不做真实 VS Code editor tabs。
- 不做多 editor group split。
- 不做拖拽重排 pane 位置。
- 不做 secondary side bar 独立内容注册系统。
- 不做 command palette。
- 不做 keyboard shortcut registry，只做必要按钮与基础 keyboard resize。
- 不做 Electron / desktop main process。
- 不做项目目录 / Open Folder。
- 不改 API / runtime / run event contract。
- 不改 scene/chapter/book/asset 的业务 view model。
- 不改全局色彩体系和基础设计 token。
- 不新增平行 WorkbenchShell。
- 不把 layout 状态写进 URL query。

这些可以进入后续 PR：

```text
PR32：Editor Tabs / Split Stage Foundation
PR33：Layout Actions / Keyboard Shortcuts / Command Surface
PR34：Desktop native menu maps to renderer layout actions
```

---

## 4. 设计边界

### 4.1 Route state 与 layout state 必须分离

继续由 URL 表达：

```text
scope
id
lens
tab/view/draftView
selectedChapterId
reviewIssueId
```

不要把下面状态写入 URL：

```text
navigatorVisible
inspectorVisible
bottomDockVisible
navigatorWidth
inspectorWidth
bottomDockHeight
bottomDockMaximized
```

原因：

- URL 是可分享的工作对象状态。
- layout 是用户本机偏好。
- 混在一起会让深链变得脏，也会让测试和用户回放变复杂。

### 4.2 Shell owns layout, scopes only provide content

Scene / Chapter / Asset / Book 继续只传：

```tsx
<WorkbenchShell
  topBar={...}
  modeRail={...}
  navigator={...}
  mainStage={...}
  inspector={...}
  bottomDock={...}
/>
```

业务容器不要自己处理：

- pane hidden
- pane width
- bottom dock height
- reset layout
- sash drag

### 4.3 MVP 使用自研轻量 kernel，不引入新依赖

当前依赖里已有 React、Zustand、Testing Library。PR31 首选轻量自研：

- pure reducer / clamp helpers
- `useSyncExternalStore` 或小型 module store
- `localStorage` persistence
- pointer events 实现 sash

暂不引入 `react-resizable-panels`。如果后续实现成本失控，再单独开依赖评审。

---

## 5. 文件规划

### 新增

```text
packages/renderer/src/features/workbench/types/workbench-layout.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
packages/renderer/src/features/workbench/components/WorkbenchSash.tsx
packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
```

### 修改

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
packages/renderer/src/app/i18n/index.tsx
```

### 谨慎修改

```text
packages/renderer/src/styles/globals.css
```

只有在 Tailwind class 不能稳定表达 sash hit area 时才修改全局样式。优先不动。

### 不修改

```text
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/api/**
packages/desktop/**
```

---

## 6. 状态模型

### 6.1 新增 layout 类型

文件：

```text
packages/renderer/src/features/workbench/types/workbench-layout.ts
```

建议类型：

```ts
export type WorkbenchLayoutPart = 'navigator' | 'inspector' | 'bottomDock'

export interface WorkbenchLayoutState {
  navigatorVisible: boolean
  inspectorVisible: boolean
  bottomDockVisible: boolean
  navigatorWidth: number
  inspectorWidth: number
  bottomDockHeight: number
  bottomDockMaximized: boolean
}

export interface WorkbenchLayoutBounds {
  navigator: { min: number; max: number; defaultSize: number }
  inspector: { min: number; max: number; defaultSize: number }
  bottomDock: { min: number; max: number; defaultSize: number; maximizedMin: number }
}
```

默认值：

```ts
export const WORKBENCH_LAYOUT_BOUNDS: WorkbenchLayoutBounds = {
  navigator: { min: 180, max: 420, defaultSize: 240 },
  inspector: { min: 220, max: 460, defaultSize: 280 },
  bottomDock: { min: 120, max: 420, defaultSize: 196, maximizedMin: 360 },
}

export const DEFAULT_WORKBENCH_LAYOUT_STATE: WorkbenchLayoutState = {
  navigatorVisible: true,
  inspectorVisible: true,
  bottomDockVisible: true,
  navigatorWidth: 240,
  inspectorWidth: 280,
  bottomDockHeight: 196,
  bottomDockMaximized: false,
}
```

必须提供 helper：

```ts
export function clampWorkbenchLayoutState(input: Partial<WorkbenchLayoutState>): WorkbenchLayoutState
export function serializeWorkbenchLayoutState(state: WorkbenchLayoutState): string
export function parseWorkbenchLayoutState(raw: string | null): WorkbenchLayoutState
export function getWorkbenchGridColumns(state: WorkbenchLayoutState): string
export function getWorkbenchGridRows(state: WorkbenchLayoutState): string
```

输出示例：

```ts
getWorkbenchGridColumns(defaultState)
// "68px 240px minmax(0,1fr) 280px"

getWorkbenchGridColumns({ ...defaultState, navigatorVisible: false })
// "68px 0px minmax(0,1fr) 280px"

getWorkbenchGridRows({ ...defaultState, bottomDockVisible: false })
// "minmax(72px,auto) minmax(0,1fr) 0px"
```

### 6.2 新增 layout store hook

文件：

```text
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts
```

建议 API：

```ts
export interface WorkbenchLayoutController {
  state: WorkbenchLayoutState
  setPartVisible: (part: WorkbenchLayoutPart, visible: boolean) => void
  togglePart: (part: WorkbenchLayoutPart) => void
  resizePart: (part: WorkbenchLayoutPart, delta: number) => void
  setBottomDockMaximized: (maximized: boolean) => void
  toggleBottomDockMaximized: () => void
  resetLayout: () => void
}

export function useWorkbenchLayoutState(storageKey?: string): WorkbenchLayoutController
export function resetWorkbenchLayoutStorage(storageKey?: string): void
```

存储 key：

```ts
const DEFAULT_WORKBENCH_LAYOUT_STORAGE_KEY = 'narrative-workbench-layout:v1'
```

测试必须覆盖：

- invalid localStorage JSON falls back to default
- widths/heights are clamped
- `togglePart('navigator')` hides and restores navigator
- `resizePart('inspector', 9999)` clamps at max
- reset clears stored state and returns defaults
- layout state does not touch `window.location.search`

---

## 7. UI 组件规划

### 7.1 WorkbenchSash

文件：

```text
packages/renderer/src/features/workbench/components/WorkbenchSash.tsx
```

Props：

```ts
interface WorkbenchSashProps {
  orientation: 'vertical' | 'horizontal'
  label: string
  onResize: (delta: number) => void
  disabled?: boolean
}
```

交互要求：

- pointer drag changes size
- keyboard ArrowLeft / ArrowRight changes vertical sash by 16px
- keyboard ArrowUp / ArrowDown changes horizontal sash by 16px
- `role="separator"`
- `aria-orientation`
- `aria-label`
- disabled 时不响应
- hit area 至少 8px，视觉线可以只有 1px

不要在这个组件里知道 navigator / inspector / dock 语义；它只负责产生 delta。

### 7.2 WorkbenchLayoutControls

文件：

```text
packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx
```

Props：

```ts
interface WorkbenchLayoutControlsProps {
  layout: WorkbenchLayoutState
  onToggleNavigator: () => void
  onToggleInspector: () => void
  onToggleBottomDock: () => void
  onToggleBottomDockMaximized: () => void
  onResetLayout: () => void
}
```

按钮使用 `lucide-react`，优先图标：

```text
PanelLeft
PanelRight
PanelBottom
Maximize2 / Minimize2
RotateCcw
```

按钮要求：

- icon-only button
- `aria-label` 完整表达动作
- title 可作为 hover tooltip fallback
- active/hidden 状态通过 `aria-pressed` 表达
- 不在页面上放一段解释性文案

### 7.3 i18n keys

文件：

```text
packages/renderer/src/app/i18n/index.tsx
```

在 `dictionary.shell` 下新增：

```ts
toggleNavigator: string
toggleInspector: string
toggleBottomDock: string
maximizeBottomDock: string
restoreBottomDock: string
resetWorkbenchLayout: string
resizeNavigator: string
resizeInspector: string
resizeBottomDock: string
```

英文：

```text
Toggle Navigator
Toggle Inspector
Toggle Bottom Dock
Maximize Bottom Dock
Restore Bottom Dock
Reset Workbench Layout
Resize Navigator
Resize Inspector
Resize Bottom Dock
```

中文：

```text
开关导航栏
开关检查器
开关底部面板
最大化底部面板
恢复底部面板
重置工作台布局
调整导航栏宽度
调整检查器宽度
调整底部面板高度
```

---

## 8. WorkbenchShell 改造

文件：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
```

### 8.1 Props 兼容

保持现有 props 不破坏：

```ts
interface WorkbenchShellProps {
  topBar: ReactNode
  modeRail: ReactNode
  navigator?: ReactNode
  mainStage: ReactNode
  inspector?: ReactNode
  bottomDock?: ReactNode
  layoutStorageKey?: string
}
```

`layoutStorageKey` 只给 tests/storybook 使用；业务入口默认不传。

### 8.2 DOM 结构要求

新增稳定 region/test anchors：

```tsx
<div data-testid="workbench-shell" />
<section aria-label={dictionary.shell.navigatorTitle} data-testid="workbench-navigator" />
<main data-testid="workbench-main-stage" />
<section aria-label={dictionary.shell.inspectorTitle} data-testid="workbench-inspector" />
<section aria-label={dictionary.shell.bottomDockTitle} data-testid="workbench-bottom-dock" />
```

如果现有 dictionary 没有 `navigatorTitle`，PR31 可以复用 `dictionary.app.scenes` 或新增更中性的 `dictionary.shell.navigatorTitle`。

### 8.3 Layout 计算

禁止继续把尺寸写死在 Tailwind arbitrary grid class 中。

建议：

```tsx
const columns = getWorkbenchGridColumns(layout.state)
const rows = getWorkbenchGridRows(layout.state)

<div
  data-testid="workbench-shell"
  className="grid min-h-screen bg-app text-text-main"
  style={{ gridTemplateRows: rows }}
>
  ...
  <div
    className="grid min-h-0 px-3 py-3"
    style={{ gridTemplateColumns: columns }}
  >
    ...
  </div>
</div>
```

hidden pane 不应只是透明或压扁内容。要求：

- hidden navigator column width 为 `0px`
- hidden inspector column width 为 `0px`
- hidden bottom dock row height 为 `0px`
- hidden pane content 不渲染，避免焦点进入不可见区域
- corresponding sash disabled / not rendered

### 8.4 Sash 放置

建议 grid columns：

```text
68px [navigator] 8px minmax(0,1fr) 8px [inspector]
```

或者在 pane 边界绝对定位 sash。选择实现时以 DOM 简单、测试稳定为优先。

最低验收：

- Navigator visible 时，Navigator/Main 之间有 `role="separator"`。
- Inspector visible 时，Main/Inspector 之间有 `role="separator"`。
- Bottom Dock visible 且未 hidden 时，Main/Dock 之间有 `role="separator"`。

---

## 9. Storybook 同步

文件：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
```

在现有 `Mockups/Workbench/Shell` 下新增 stories：

```ts
export const Default: Story = {}
export const NavigatorHidden: Story = {}
export const InspectorHidden: Story = {}
export const BottomDockHidden: Story = {}
export const ResizedPanes: Story = {}
export const BottomDockMaximized: Story = {}
export const NarrowViewport: Story = {}
export const ChapterWorkbench: Story = {}
```

如果 `Default` / `ChapterWorkbench` 已存在，保留语义并扩展，不重命名破坏历史 story URL，除非 review 明确允许。

Storybook 需要固定输入，不接真实 API。建议通过 `layoutStorageKey` 与 test helper 让 story 进入指定 layout state。

最低 Storybook 验收：

- hidden stories 不显示对应 region。
- resized story 的 region style 能反映非默认宽高。
- maximized dock story 中 bottom dock 高度明显大于默认。
- narrow viewport story 不出现文本重叠，main stage 仍可读。

---

## 10. 测试计划

### 10.1 Unit tests

新增：

```text
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
```

测试点：

1. default layout renders all five surfaces.
2. toggle Navigator removes navigator region and expands main stage.
3. toggle Inspector removes inspector region.
4. toggle Bottom Dock removes bottom dock region.
5. reset restores all parts and default sizes.
6. keyboard resize on vertical sash updates grid columns.
7. keyboard resize on horizontal sash updates grid rows.
8. persisted localStorage state restores after remount.
9. invalid persisted state falls back safely.

测试命令：

```bash
pnpm --filter @narrative-novel/renderer test -- WorkbenchShell useWorkbenchLayoutState
```

Expected:

```text
PASS packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
PASS packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
```

### 10.2 Renderer full test gate

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
```

Expected:

```text
No TypeScript errors.
All Vitest suites pass.
```

### 10.3 Storybook build gate

```bash
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected:

```text
Storybook build completes.
Mockups/Workbench/Shell stories are included.
```

### 10.4 MCP structured snapshot gate

开发过程中必须使用 MCP 获取结构化页面快照，不要只靠截图。

建议流程：

```bash
pnpm --filter @narrative-novel/renderer storybook
```

MCP 打开：

```text
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--default&viewMode=story
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--navigator-hidden&viewMode=story
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--bottom-dock-maximized&viewMode=story
```

结构化快照必须证明：

- Default story 有 Navigator / Main Stage / Inspector / Bottom Dock regions。
- NavigatorHidden story 没有 Navigator region，Main Stage 仍存在。
- BottomDockMaximized story 有 Bottom Dock region，且 layout control 显示 restore action。
- Toggle buttons 是 button，带 `aria-label` 和合理 `aria-pressed`。
- Sashes 是 separator，带 `aria-orientation`。

不要把“截图看起来像”当作验收。

---

## 11. Bundle 切分

### Bundle A：Layout State Kernel

**Owner:** Worker A  
**Files:**

- Create: `packages/renderer/src/features/workbench/types/workbench-layout.ts`
- Create: `packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts`
- Create: `packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx`

#### Task A1：实现纯 layout model

- [ ] 写 `WorkbenchLayoutState` / bounds / defaults。
- [ ] 写 parse / serialize / clamp helpers。
- [ ] 写 grid rows / columns helpers。
- [ ] 测 invalid persisted JSON。
- [ ] 测 size clamp。

#### Task A2：实现 localStorage-backed layout hook

- [ ] 写 module-level external store。
- [ ] 写 `useWorkbenchLayoutState(storageKey?)`。
- [ ] 写 toggle / resize / maximize / reset actions。
- [ ] 测 remount 后恢复 persisted state。
- [ ] 测 action 不修改 URL search。

#### Bundle A Review Gate

```bash
pnpm --filter @narrative-novel/renderer test -- useWorkbenchLayoutState
pnpm --filter @narrative-novel/renderer typecheck
```

通过 review 后提交：

```bash
git add packages/renderer/src/features/workbench/types/workbench-layout.ts \
  packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts \
  packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
git commit -m "2026-04-25，新增 workbench layout state kernel"
```

### Bundle B：Sash 与 Layout Controls

**Owner:** Worker B  
**Files:**

- Create: `packages/renderer/src/features/workbench/components/WorkbenchSash.tsx`
- Create: `packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx`
- Modify: `packages/renderer/src/app/i18n/index.tsx`
- Test through: `packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx` in Bundle C, or add narrow component tests if implementation benefits from it.

#### Task B1：实现 WorkbenchSash

- [ ] 写 accessible separator。
- [ ] 支持 pointer drag。
- [ ] 支持 keyboard arrow resize。
- [ ] 禁用状态不触发 resize。
- [ ] 不绑定业务 part 名。

#### Task B2：实现 WorkbenchLayoutControls

- [ ] 用 lucide 图标按钮实现 Navigator / Inspector / Bottom Dock toggle。
- [ ] 实现 Bottom Dock maximize / restore。
- [ ] 实现 Reset Layout。
- [ ] 补英文 / 中文 i18n。
- [ ] 所有按钮有 `aria-label`、`title`、`aria-pressed`。

#### Bundle B Review Gate

```bash
pnpm --filter @narrative-novel/renderer typecheck
```

通过 review 后提交：

```bash
git add packages/renderer/src/features/workbench/components/WorkbenchSash.tsx \
  packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx \
  packages/renderer/src/app/i18n/index.tsx
git commit -m "2026-04-25，新增 workbench 布局控制与拖拽边界"
```

### Bundle C：WorkbenchShell Integration + Stories

**Owner:** Worker C  
**Files:**

- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`
- Modify: `packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx`
- Create: `packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx`

#### Task C1：接入 layout kernel

- [ ] `WorkbenchShell` 调用 `useWorkbenchLayoutState(layoutStorageKey)`。
- [ ] 用 helper 生成 grid rows / columns。
- [ ] hidden pane 不渲染内容。
- [ ] main stage 随 pane hidden / size 改变自适应。
- [ ] top bar 区域接入 `WorkbenchLayoutControls`，不破坏现有 `topBar` 内容。
- [ ] 保持 Scene / Chapter / Asset / Book 现有调用方无需改动。

#### Task C2：接入 sashes

- [ ] Navigator/Main 之间接 vertical sash。
- [ ] Main/Inspector 之间接 vertical sash。
- [ ] Main/Bottom Dock 之间接 horizontal sash。
- [ ] hidden / maximized 状态下 sash 行为正确。
- [ ] keyboard resize 有测试覆盖。

#### Task C3：补 shell tests

- [ ] 测默认五面都渲染。
- [ ] 测三个 toggle。
- [ ] 测 reset。
- [ ] 测 keyboard resize。
- [ ] 测 persisted state remount。

#### Task C4：补 Storybook states

- [ ] 保留已有 story URL。
- [ ] 新增 NavigatorHidden。
- [ ] 新增 InspectorHidden。
- [ ] 新增 BottomDockHidden。
- [ ] 新增 ResizedPanes。
- [ ] 新增 BottomDockMaximized。
- [ ] 新增 NarrowViewport。

#### Bundle C Review Gate

```bash
pnpm --filter @narrative-novel/renderer test -- WorkbenchShell useWorkbenchLayoutState
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer build-storybook
```

然后启动 Storybook 并做 MCP 结构化快照验证：

```bash
pnpm --filter @narrative-novel/renderer storybook
```

通过 review 后提交：

```bash
git add packages/renderer/src/features/workbench/components/WorkbenchShell.tsx \
  packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx \
  packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
git commit -m "2026-04-25，接入可恢复 workbench layout shell"
```

---

## 12. 最终验收标准

PR31 只有同时满足以下条件，才算完成：

1. `WorkbenchShell` 不再是固定 grid-only shell。
2. Navigator / Inspector / Bottom Dock 都可隐藏并恢复。
3. Main Stage 会随隐藏状态扩展。
4. Navigator / Inspector / Bottom Dock 尺寸可调整。
5. Bottom Dock 可最大化并恢复。
6. 刷新后 layout state 可恢复。
7. Reset Layout 可回默认。
8. 现有 Scene / Chapter / Asset / Book workbench 入口不需要业务改造即可继承新 layout。
9. Storybook 有覆盖 hidden / resized / maximized states。
10. MCP 结构化快照证明 Storybook 中控件和 regions 真实变化。
11. `pnpm --filter @narrative-novel/renderer typecheck` 通过。
12. `pnpm --filter @narrative-novel/renderer test` 通过。
13. `pnpm --filter @narrative-novel/renderer build-storybook` 通过。

---

## 13. 后续路线

PR31 结束后，再考虑这些方向，不要提前塞进 PR31：

### PR32：Editor Tabs / Split Stage Foundation

目标：

- Main Stage 内部支持 saved workbench tabs。
- Scene Draft / Scene Orchestrate / Chapter Structure 等能作为 tab context。
- 第一版只做 tab model 和 read-only split，不做复杂拖拽。

### PR33：Layout Actions / Keyboard Shortcut Surface

目标：

- 把 shell layout actions 提升成命令层。
- 支持基础快捷键，例如 toggle dock / focus navigator / reset layout。
- 桌面端 native menu 未来可映射到这些命令。

### PR34：Adaptive Workbench Polish

目标：

- 窄屏下定义 drawer/stacked behavior。
- 增加 focus mode / zen mode。
- 增加 layout preset：Writing / Review / Runtime。

---

## 14. Reject Conditions

出现以下情况应直接判定 PR31 不合格：

- 只是在 UI 上加隐藏按钮，但 main stage 不随布局变化。
- 只用 CSS `display:none` 临时隐藏，没有 layout state / persistence。
- 把 pane 宽高写进 URL。
- 每个业务 scope 各自实现一套隐藏/拖拽逻辑。
- 新建第二套 `WorkbenchShell`。
- Storybook 没有同步新增 states。
- 只提供截图，没有 MCP 结构化快照证明。
- 为了实现本轮改动去重构 Scene / Chapter / Book / Asset 业务组件。
- 改 Playwright / Storybook 配置来绕过失败。

---

## 15. 执行提醒

- 开发前先读本文件列出的 `refer/vscode` 文件。
- 先补 Storybook / test 可观测点，再改 shell。
- 不要在业务容器里抢 shell 的职责。
- 不要顺手重做视觉风格。
- 不要把 dock 变成 debugger 主界面；PR31 只处理 layout behavior。
- 涉及前端改动必须同步 Storybook。
- 验证时使用 MCP 结构化快照，不以截图代替。
