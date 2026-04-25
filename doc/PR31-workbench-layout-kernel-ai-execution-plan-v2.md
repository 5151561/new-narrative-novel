# PR31：Workbench Layout Kernel / VS Code-style Part Control Foundation

> 可直接交给 AI coding agent 执行。  
> 基线分支：`codex/pr30-scene-prose-revision`  
> 建议新分支：`codex/pr31-workbench-layout-kernel`  
> PR 类型：renderer 架构 / workbench shell 行为 PR  
> 核心目标：把固定五面布局升级成可隐藏、可调整、可恢复的 Workbench Layout Kernel。

---

## 0. 给 AI agent 的最终一句话指令

在 `codex/pr30-scene-prose-revision` 当前代码基础上，**不要继续堆业务组件，也不要重构 Scene / Chapter / Book / Asset**；只围绕共享 `WorkbenchShell` 做一轮窄而实的 VS Code-style layout kernel：part visibility、resizable sash、bottom dock maximize、localStorage restore、reset layout、Storybook 状态和 shell-level tests。URL route 继续只表达对象与工作视角；layout 是本机 UI 偏好。PR31 完成后，所有 scope 不改业务代码也能继承可隐藏、可调整、可恢复的工作台布局。

---

## 1. 背景与纠偏目标

当前项目已经不是普通 AI 写作页面，而是围绕 `Book / Chapter / Scene / Asset` 与 `Structure / Orchestrate / Draft / Knowledge / Review` 展开的 Narrative IDE。现有 UI 已经具备五面 Workbench 形状：

```text
Mode Rail
Navigator
Main Stage
Inspector
Bottom Dock
```

但当前共享 shell 仍然更像固定网页 grid：

```tsx
grid-rows-[minmax(72px,auto)_minmax(0,1fr)_196px]
grid-cols-[68px_240px_minmax(0,1fr)_280px]
```

这会导致后续继续叠加 Runtime、Trace、Context、Review、Book、Export、Desktop 后，产品越来越像“组件平铺”，而不是工具类软件的工作台。

PR31 的任务不是增加业务能力，而是纠正 UI 基座：

```text
fixed web layout
-> shared workbench layout kernel
-> user-controlled parts
-> persistent layout preference
-> Storybook-verifiable behavior
```

---

## 2. PR31 的唯一目标

把 `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx` 从固定五面壳升级为第一版共享 Layout Kernel。

完成后用户应该能：

1. 隐藏 / 显示 Navigator。
2. 隐藏 / 显示 Inspector。
3. 隐藏 / 显示 Bottom Dock。
4. 拖拽 Navigator 与 Main Stage 的边界，调整左侧宽度。
5. 拖拽 Main Stage 与 Inspector 的边界，调整右侧宽度。
6. 拖拽 Main Stage 与 Bottom Dock 的边界，调整底部高度。
7. 最大化 / 恢复 Bottom Dock。
8. 刷新页面后恢复最近一次 layout。
9. 点击 Reset Layout 回到默认布局。
10. Storybook 能展示 default / hidden / resized / dock maximized / narrow viewport 状态。

一句话验收：

> 所有 scope 仍然只给 `WorkbenchShell` 提供内容，但 `WorkbenchShell` 自己拥有可隐藏、可 resize、可恢复的工作台布局行为。

---

## 3. 本轮明确不做

以下内容不要混进 PR31：

- 不做 Editor Tabs。
- 不做多 editor group split。
- 不做 command palette。
- 不做 global keyboard shortcut registry。
- 不做 status bar。
- 不做 secondary side bar 内容注册系统。
- 不做 pane 拖拽换位置。
- 不做 mobile drawer / responsive 大改。
- 不做 Electron / desktop main process。
- 不改 API / runtime / run event contract。
- 不改 scene / chapter / book / asset 的业务 view model。
- 不改 workbench route 序列化。
- 不把 layout state 写进 URL query。
- 不新增平行 `WorkbenchShell`。
- 不引入 `react-resizable-panels` 或其他 runtime dependency，除非单独开依赖评审。

后续建议：

```text
PR32：Editor Tabs / Main Stage Opened Context Foundation
PR33：Layout Actions / Keyboard Shortcuts / Command Surface
PR34：Status Bar + Runtime / Project Signals
```

---

## 4. 必须遵守的硬约束

### 4.1 Route state 与 layout state 分离

URL 继续只表达工作对象与业务视角：

```text
scope
id
lens
tab / view / draftView
selectedChapterId
reviewIssueId
```

不要把下面这些写进 URL：

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

- URL 是可分享、可恢复的工作对象状态。
- Layout 是本机偏好。
- 混在一起会污染深链、测试和用户回放。

### 4.2 Shell owns layout, scopes only provide content

业务 scope 仍然只这样使用 shell：

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

Scene / Chapter / Asset / Book 不允许自己处理：

- pane hidden
- pane width
- bottom dock height
- bottom dock maximize
- reset layout
- sash drag
- localStorage layout persistence

### 4.3 只做三个可控 part

PR31 只控制：

```text
navigator
inspector
bottomDock
```

不控制：

```text
modeRail
topBar
mainStage
statusBar（本轮不存在）
editorTabs（本轮不存在）
```

### 4.4 hidden pane 不可被 focus

隐藏 pane 时不能只是 `opacity: 0` 或视觉压扁。

要求：

- hidden navigator 不渲染 region 内容。
- hidden inspector 不渲染 region 内容。
- hidden bottom dock 不渲染 region 内容。
- hidden part 对应 sash 不渲染或 disabled。
- 用户不能 tab 进入隐藏区域。

### 4.5 MCP 不是借口

如果执行环境有 MCP / browser snapshot：必须使用结构化快照验证 DOM 与 ARIA。

如果没有 MCP：必须用 Testing Library + Storybook build + DOM assertions 替代。

不允许因为“没有 MCP”而跳过验证。

---

## 5. 文件改动规划

### 5.1 新增文件

```text
packages/renderer/src/features/workbench/types/workbench-layout.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
packages/renderer/src/features/workbench/components/WorkbenchSash.tsx
packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
```

### 5.2 修改文件

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
packages/renderer/src/app/i18n/index.tsx
```

### 5.3 尽量不动

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/scene/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/book/**
packages/api/**
packages/desktop/**
```

如果某些业务容器因为 `WorkbenchShell` props 类型兼容而必须小改，只允许做最小接线，不允许重构业务 view model。

---

## 6. Layout model 设计

新增：

```text
packages/renderer/src/features/workbench/types/workbench-layout.ts
```

### 6.1 类型

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
  bottomDock: {
    min: number
    max: number
    defaultSize: number
    maximizedSize: number
  }
}
```

### 6.2 默认值

```ts
export const WORKBENCH_LAYOUT_BOUNDS: WorkbenchLayoutBounds = {
  navigator: { min: 180, max: 420, defaultSize: 240 },
  inspector: { min: 220, max: 460, defaultSize: 280 },
  bottomDock: { min: 120, max: 420, defaultSize: 196, maximizedSize: 420 },
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

说明：

- `bottomDockHeight` 始终表示普通状态高度。
- `bottomDockMaximized=true` 时，实际渲染高度使用 `maximizedSize`。
- 恢复时回到 `bottomDockHeight`。

### 6.3 必须提供 helpers

```ts
export function clampWorkbenchLayoutState(
  input: Partial<WorkbenchLayoutState>,
): WorkbenchLayoutState

export function serializeWorkbenchLayoutState(
  state: WorkbenchLayoutState,
): string

export function parseWorkbenchLayoutState(
  raw: string | null,
): WorkbenchLayoutState

export function getWorkbenchBodyGridColumns(
  state: WorkbenchLayoutState,
): string

export function getWorkbenchShellGridRows(
  state: WorkbenchLayoutState,
): string
```

示例输出：

```ts
getWorkbenchBodyGridColumns(DEFAULT_WORKBENCH_LAYOUT_STATE)
// "68px 240px minmax(0,1fr) 280px"

getWorkbenchBodyGridColumns({
  ...DEFAULT_WORKBENCH_LAYOUT_STATE,
  navigatorVisible: false,
})
// "68px 0px minmax(0,1fr) 280px"

getWorkbenchShellGridRows(DEFAULT_WORKBENCH_LAYOUT_STATE)
// "minmax(72px,auto) minmax(0,1fr) 196px"

getWorkbenchShellGridRows({
  ...DEFAULT_WORKBENCH_LAYOUT_STATE,
  bottomDockVisible: false,
})
// "minmax(72px,auto) minmax(0,1fr) 0px"
```

### 6.4 纯函数测试要求

`workbench-layout` 的逻辑可直接通过 hook 测试覆盖，也可单独补 pure unit tests。至少覆盖：

- invalid JSON -> default。
- partial state -> merge default + clamp。
- navigator width below min -> clamp to min。
- inspector width above max -> clamp to max。
- bottomDockHeight above max -> clamp to max。
- hidden part grid size -> `0px`。
- maximized dock grid row -> `maximizedSize`。

---

## 7. Layout state hook 设计

新增：

```text
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts
```

### 7.1 API

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

export function useWorkbenchLayoutState(
  storageKey?: string,
): WorkbenchLayoutController

export function resetWorkbenchLayoutStorage(storageKey?: string): void
```

### 7.2 Storage key

```ts
export const DEFAULT_WORKBENCH_LAYOUT_STORAGE_KEY =
  'narrative-workbench-layout:v1'
```

### 7.3 行为要求

- 初次 mount 从 localStorage 恢复。
- localStorage 不存在时使用 default。
- localStorage 解析失败时使用 default，不 throw。
- 每次 layout state 变化后写回 localStorage。
- `resetLayout()` 恢复 default，并写回 default 或清理 storage。
- 不读写 `window.location.search`。
- test/story 可以传 `layoutStorageKey` 隔离状态。

### 7.4 `resizePart` 语义

```ts
resizePart('navigator', +16)   // navigatorWidth + 16
resizePart('navigator', -16)   // navigatorWidth - 16
resizePart('inspector', +16)   // inspectorWidth + 16
resizePart('inspector', -16)   // inspectorWidth - 16
resizePart('bottomDock', +16)  // bottomDockHeight + 16
resizePart('bottomDock', -16)  // bottomDockHeight - 16
```

注意：

- 对 Inspector 来说，拖动方向要在 `WorkbenchShell` 层换算 delta，不要让 hook 知道 DOM 方向。
- bottom dock maximized 时，horizontal sash 可 disabled；避免同时 resize 与 maximize 产生冲突。

### 7.5 Hook 测试要求

新增：

```text
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
```

至少覆盖：

1. invalid localStorage JSON falls back to default。
2. default state renders from hook。
3. `togglePart('navigator')` hides navigator state。
4. `setPartVisible('inspector', false)` hides inspector state。
5. `resizePart('navigator', 9999)` clamps at max。
6. `resizePart('bottomDock', -9999)` clamps at min。
7. `toggleBottomDockMaximized()` changes maximized state without destroying normal height。
8. remount restores persisted state。
9. reset restores defaults。
10. hook does not modify `window.location.search`。

---

## 8. UI components

## 8.1 `WorkbenchSash.tsx`

新增：

```text
packages/renderer/src/features/workbench/components/WorkbenchSash.tsx
```

### Props

```ts
interface WorkbenchSashProps {
  orientation: 'vertical' | 'horizontal'
  label: string
  onResize: (delta: number) => void
  disabled?: boolean
}
```

### 行为要求

- `role="separator"`
- `aria-orientation="vertical" | "horizontal"`
- `aria-label={label}`
- `tabIndex={disabled ? -1 : 0}`
- pointer drag 调用 `onResize(delta)`。
- keyboard resize：
  - vertical：ArrowLeft = -16，ArrowRight = +16。
  - horizontal：ArrowUp = -16，ArrowDown = +16。
- disabled 时不响应 pointer / keyboard。
- hit area 至少 8px，视觉线可以 1px。
- 组件不包含 navigator / inspector / dock 业务语义。

### 方向换算

`WorkbenchSash` 只汇报拖拽坐标的正负 delta。具体含义由 `WorkbenchShell` 决定：

```text
Navigator sash：向右拖 -> navigatorWidth 增加。
Inspector sash：向右拖 -> inspectorWidth 减少；向左拖 -> inspectorWidth 增加。
BottomDock sash：向上拖 -> bottomDockHeight 增加；向下拖 -> bottomDockHeight 减少。
```

---

## 8.2 `WorkbenchLayoutControls.tsx`

新增：

```text
packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx
```

### Props

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

### UI 要求

使用已有图标库。如果项目里已经有 `lucide-react`，优先：

```text
PanelLeft
PanelRight
PanelBottom
Maximize2
Minimize2
RotateCcw
```

如果没有对应图标，不新增依赖；使用现有 icon 或文字 fallback。

按钮要求：

- icon-only button。
- 必须有 `aria-label`。
- `title` 可作为 hover fallback。
- pane visible 状态用 `aria-pressed` 表达。
- bottom dock maximize 按钮根据状态切换 label：
  - Maximize Bottom Dock
  - Restore Bottom Dock
- 不放解释性长文案。
- controls 应位于 top bar 右侧附近或 shell 顶部稳定位置，不要侵入业务主舞台。

---

## 8.3 i18n keys

修改：

```text
packages/renderer/src/app/i18n/index.tsx
```

建议新增在 `dictionary.shell` 下：

```ts
navigatorTitle: string
inspectorTitle: string
bottomDockTitle: string
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
Navigator
Inspector
Bottom Dock
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
导航栏
检查器
底部面板
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

如果现有 dictionary 结构不同，允许用项目现有命名风格，但必须保持中英文完整。

---

## 9. `WorkbenchShell.tsx` 改造

修改：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
```

### 9.1 Props 保持兼容

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

`layoutStorageKey` 只给 tests / stories 使用，业务入口默认不传。

### 9.2 DOM region 要求

必须提供稳定 anchors：

```tsx
<div data-testid="workbench-shell" />
<section aria-label={dictionary.shell.navigatorTitle} data-testid="workbench-navigator" />
<main data-testid="workbench-main-stage" />
<section aria-label={dictionary.shell.inspectorTitle} data-testid="workbench-inspector" />
<section aria-label={dictionary.shell.bottomDockTitle} data-testid="workbench-bottom-dock" />
```

说明：

- `navigator` / `inspector` / `bottomDock` 为 `undefined` 时，不渲染对应 region 和控制按钮 active 状态仍应合理。
- 如果内容不存在，toggle 不应导致空白 pane 出现；可以禁用对应 control 或让 control 隐藏。
- hidden region 不渲染。

### 9.3 Layout 计算

禁止继续用 Tailwind arbitrary grid class 写死尺寸。

推荐：

```tsx
const layout = useWorkbenchLayoutState(layoutStorageKey)
const rows = getWorkbenchShellGridRows(layout.state)
const columns = getWorkbenchBodyGridColumns(layout.state)

return (
  <div
    data-testid="workbench-shell"
    className="grid min-h-screen bg-app text-text-main"
    style={{ gridTemplateRows: rows }}
  >
    <header>{topBarWithLayoutControls}</header>

    <div
      data-testid="workbench-body"
      className="grid min-h-0 px-3 py-3"
      style={{ gridTemplateColumns: columns }}
    >
      ...
    </div>

    {layout.state.bottomDockVisible && bottomDock ? (
      <section data-testid="workbench-bottom-dock">...</section>
    ) : null}
  </div>
)
```

### 9.4 Sash 接线

最低要求：

- Navigator visible 且有 navigator 内容时，渲染 Navigator/Main vertical sash。
- Inspector visible 且有 inspector 内容时，渲染 Main/Inspector vertical sash。
- Bottom Dock visible 且未 maximized 且有 bottomDock 内容时，渲染 Main/Dock horizontal sash。
- Bottom Dock maximized 时可以隐藏或 disabled horizontal sash。

推荐 DOM 顺序保持清晰：

```text
mode rail
navigator pane
navigator sash
main stage
inspector sash
inspector pane
```

若采用 CSS absolute sash，也必须保证 test 能通过 role / label 找到 sash。

### 9.5 Layout controls 放置

优先把 `WorkbenchLayoutControls` 放在 topBar 右侧外层 shell control 区，不要要求业务 topBar 自己让位。

可实现为：

```tsx
<header className="...">
  <div className="min-w-0 flex-1">{topBar}</div>
  <WorkbenchLayoutControls ... />
</header>
```

如果现有 topBar 已经是完整宽度布局，允许在 shell header 外套一层 flex，但不要重写业务 topBar。

---

## 10. Storybook 要求

修改：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
```

新增或保留以下 stories：

```ts
Default
NavigatorHidden
InspectorHidden
BottomDockHidden
ResizedPanes
BottomDockMaximized
NarrowViewport
ChapterScope
```

要求：

- 保留已有 story export name，除非无法兼容。
- 不接真实 API。
- 使用 fixture 内容。
- 使用 `layoutStorageKey` 或 story decorator 设置初始 layout。
- 每个 story 初始状态必须稳定，不依赖用户手动点击。

### 10.1 Story 初始状态建议

如果 hook 只从 localStorage 初始化，storybook 可以通过 decorator 写入 storage：

```ts
const withLayoutState = (storageKey, state) => (Story) => {
  window.localStorage.setItem(storageKey, serializeWorkbenchLayoutState(state))
  return <Story args={{ layoutStorageKey: storageKey }} />
}
```

若这种方式导致故事间污染，使用唯一 storage key：

```text
storybook:workbench-layout:default
storybook:workbench-layout:navigator-hidden
...
```

### 10.2 Story 验收

- `NavigatorHidden` 不出现 navigator region。
- `InspectorHidden` 不出现 inspector region。
- `BottomDockHidden` 不出现 bottom dock region。
- `ResizedPanes` 的 grid columns 与默认不同。
- `BottomDockMaximized` 的 bottom dock 明显高于默认。
- `NarrowViewport` 不做移动端 drawer，但不能爆版到不可读。

---

## 11. 测试计划

## 11.1 Unit / component tests

新增：

```text
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
```

`WorkbenchShell.test.tsx` 至少覆盖：

1. default layout renders mode rail / navigator / main stage / inspector / bottom dock。
2. toggle Navigator removes navigator region。
3. toggle Inspector removes inspector region。
4. toggle Bottom Dock removes bottom dock region。
5. reset restores hidden parts and default grid sizes。
6. keyboard resize navigator sash changes `gridTemplateColumns`。
7. keyboard resize inspector sash changes `gridTemplateColumns`。
8. keyboard resize bottom dock sash changes `gridTemplateRows`。
9. bottom dock maximize changes rows and button label becomes restore。
10. remount restores persisted localStorage layout。
11. hidden pane cannot be found by role / test id。
12. layout actions do not change `window.location.search`。

### 11.2 Test selectors / ARIA expectations

Tests 应优先通过 accessible queries：

```ts
screen.getByRole('button', { name: /toggle navigator/i })
screen.getByRole('separator', { name: /resize navigator/i })
```

必要时再用 `data-testid` 检查 grid style。

### 11.3 命令

先跑窄测试：

```bash
pnpm --filter @narrative-novel/renderer test -- WorkbenchShell useWorkbenchLayoutState
```

再跑 renderer 全量门禁：

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer build-storybook
```

Expected：

```text
No TypeScript errors.
All Vitest suites pass.
Storybook build completes.
```

---

## 12. MCP / browser snapshot 验证

如果执行环境有 MCP 或 browser automation，启动 Storybook：

```bash
pnpm --filter @narrative-novel/renderer storybook
```

打开：

```text
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--default&viewMode=story
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--navigator-hidden&viewMode=story
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--bottom-dock-maximized&viewMode=story
```

结构化快照必须证明：

- Default 有 Navigator / Main Stage / Inspector / Bottom Dock regions。
- NavigatorHidden 没有 Navigator region。
- BottomDockMaximized 有 Bottom Dock region，并且按钮显示 Restore Bottom Dock。
- Toggle buttons 是 button，带 `aria-label` 和 `aria-pressed`。
- Sashes 是 separator，带 `aria-orientation`。

没有 MCP 时，用 Testing Library 与 Storybook build 作为替代验收。

---

## 13. Bundle 切分与执行顺序

## Bundle A：Layout State Kernel

Files：

```text
packages/renderer/src/features/workbench/types/workbench-layout.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchLayoutState.test.tsx
```

Tasks：

1. 新增 layout 类型、bounds、default state。
2. 实现 clamp / parse / serialize / grid helpers。
3. 实现 localStorage-backed hook。
4. 补 hook tests。

验收：

```bash
pnpm --filter @narrative-novel/renderer test -- useWorkbenchLayoutState
```

---

## Bundle B：Sash + Controls

Files：

```text
packages/renderer/src/features/workbench/components/WorkbenchSash.tsx
packages/renderer/src/features/workbench/components/WorkbenchLayoutControls.tsx
packages/renderer/src/app/i18n/index.tsx
```

Tasks：

1. 实现 accessible sash。
2. 实现 icon-only layout controls。
3. 补中英文 i18n。
4. 保证 no new runtime dependency。

验收：

- Buttons 有 `aria-label`。
- Buttons 有合理 `aria-pressed`。
- Sash 有 `role="separator"` 与 `aria-orientation`。
- Keyboard resize 可触发 callback。

---

## Bundle C：WorkbenchShell Integration

Files：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
```

Tasks：

1. 将 fixed Tailwind grid 改为 state-driven inline `gridTemplateRows / gridTemplateColumns`。
2. 接入 `useWorkbenchLayoutState`。
3. 接入 `WorkbenchLayoutControls`。
4. 接入三条 sash。
5. hidden panes 不渲染 region content。
6. 补 shell tests。

验收：

```bash
pnpm --filter @narrative-novel/renderer test -- WorkbenchShell
```

---

## Bundle D：Storybook States

Files：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
```

Tasks：

1. 保留 / 修复 Default story。
2. 新增 NavigatorHidden。
3. 新增 InspectorHidden。
4. 新增 BottomDockHidden。
5. 新增 ResizedPanes。
6. 新增 BottomDockMaximized。
7. 新增 NarrowViewport。
8. 保留或补齐 ChapterScope。

验收：

```bash
pnpm --filter @narrative-novel/renderer build-storybook
```

---

## 14. 完成后的整体验收标准

PR31 完成必须满足：

1. `WorkbenchShell` 不再依赖固定 `grid-cols-[68px_240px_minmax(0,1fr)_280px]` 和固定 bottom dock height class。
2. Navigator / Inspector / Bottom Dock 可以通过 shell controls 隐藏和恢复。
3. Hidden pane 不渲染内容，不能被 focus。
4. Navigator / Inspector / Bottom Dock 都可通过 sash resize。
5. Bottom Dock 可 maximize / restore。
6. Layout state 通过 localStorage 恢复。
7. Reset Layout 可恢复默认布局。
8. Layout state 不进入 URL query。
9. Scene / Chapter / Asset / Book 业务 view model 不被重构。
10. `useWorkbenchRouteState` 不被修改。
11. Storybook 覆盖 default / hidden / resized / maximized / narrow 状态。
12. Testing Library tests 覆盖 layout actions 与 persistence。
13. Typecheck / tests / Storybook build 通过。
14. PR 不包含 Editor Tabs / Status Bar / Command Palette / Desktop / API 改动。

---

## 15. PR31 结束时不要留下的债

以下情况都算做偏：

- 把 layout state 写进 URL。
- 改了 `useWorkbenchRouteState` 或 route 类型来承载 pane 状态。
- 业务 scope 自己处理 pane hidden / resize。
- hidden pane 仍在 DOM 中可 focus。
- sash 只有视觉线，没有 `role="separator"`。
- buttons 没有 `aria-label`。
- Storybook 只有默认故事，没有 hidden / resized / maximized 状态。
- 只靠截图验收，没有 DOM / ARIA / test 证明。
- 为 PR31 引入新的重型 layout dependency。
- 顺手做了 editor tabs / command palette / status bar。
- 顺手重构 Scene / Chapter / Book / Asset 工作面。

正确的 PR31 结束状态应该是：

> 业务功能没有变多，但所有业务 scope 都站在一个真正可控制、可恢复、可验证的 Workbench Layout Kernel 上。

---

## 16. 建议 PR description

```md
## Summary

PR31 turns the shared WorkbenchShell from a fixed five-region CSS grid into a reusable Workbench Layout Kernel.

It adds:
- local layout state for navigator / inspector / bottom dock visibility
- resizable workbench sashes
- bottom dock maximize / restore
- localStorage layout persistence
- reset layout action
- accessible layout controls
- Storybook coverage for hidden / resized / maximized states
- shell-level tests for layout behavior

## Non-goals

- No business scope changes
- No editor tabs
- No command palette
- No status bar
- No route changes
- No API / desktop changes

## Testing

- pnpm --filter @narrative-novel/renderer typecheck
- pnpm --filter @narrative-novel/renderer test
- pnpm --filter @narrative-novel/renderer build-storybook
```

---

## 17. Agent execution checklist

执行前：

```bash
git status
pnpm install
pnpm --filter @narrative-novel/renderer test -- WorkbenchShell useWorkbenchLayoutState || true
```

执行中：

- 先做 Bundle A，确保 state kernel 可测试。
- 再做 Bundle B，确保 sash / controls accessible。
- 再做 Bundle C，接入 shell。
- 最后做 Bundle D，补 Storybook states。

提交前：

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer build-storybook
```

最终检查：

```bash
git diff --stat
git diff -- packages/renderer/src/features/workbench
```

确认没有误改：

```text
packages/api/**
packages/desktop/**
features/scene/** 业务逻辑
features/chapter/** 业务逻辑
features/asset/** 业务逻辑
features/book/** 业务逻辑
workbench route types / route hook
```

---

## 18. 最终交付物

PR31 合并后应新增 / 更新这些交付物：

```text
新增 layout model
新增 layout hook
新增 sash component
新增 layout controls component
新增 shell tests
更新 WorkbenchShell
更新 WorkbenchShell stories
更新 i18n
```

并且用户肉眼上能明显感受到：

```text
这不再是固定网页面板；
这是一个可以被用户操控并记住状态的 Narrative IDE Workbench。
```
