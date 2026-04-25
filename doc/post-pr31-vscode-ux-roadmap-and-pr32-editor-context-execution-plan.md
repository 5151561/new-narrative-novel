# Post-PR31 VS Code-style Workbench UX Roadmap + PR32 AI Execution Plan

> 基线分支：`codex/pr31-workbench-layout-kernel`  
> 建议新分支：`codex/pr32-workbench-editor-context-tabs`  
> 文档目的：给出 PR31 之后继续朝 VS Code 优秀体验推进的路线，并提供一份可以直接交给 AI coding agent 执行的 PR32 Markdown 指令。  
> 核心判断：PR31 是必要纠偏，但只解决了“面板可控”。下一步必须解决“主舞台打开对象、标签、恢复、切换”的编辑器区域体验，否则继续堆业务功能仍然会像网页组件平铺。

---

## 0. 给 AI agent 的最终一句话指令

在当前 `codex/pr31-workbench-layout-kernel` 分支上，不要继续堆 Scene / Chapter / Book / Asset 业务功能，也不要继续只抛光 pane resize；先围绕 **Workbench Editor Context / Tabs Foundation** 做一轮窄而实的实现：

- 保持 `route` 仍然是当前业务对象与 lens/view 的唯一真源。
- 新增一个本机 UI 偏好的 `opened editor contexts` 层，用来记住用户打开过的对象 / lens，并在主舞台顶部显示 VS Code-style tabs。
- 当前 active tab 必须由当前 route 同步生成；点击 tab 只调用现有 `replaceRoute(...)` 恢复该 tab 保存的 route snapshot。
- 只做 single editor group，不做 split editor、不做 drag/drop、不做 dirty state、不做 command palette。
- 把 tab strip 接入共享 `WorkbenchShell` 的 main stage 区域，让所有 scope 自动继承。
- 用 Testing Library + Storybook 固定：打开多个 context、切换 tab、关闭 tab、刷新恢复、route 不被 tab state 污染。

一句话目标：

> PR32 要把 PR31 的“可控五面壳子”推进成“有打开对象记忆的工作台”，让主舞台不再只是一个被 route 替换的 ReactNode，而开始拥有 editor-like 工作流。

---

## 1. 为什么 PR31 之后仍然“不像 VS Code”

PR31 已经完成了正确的第一层：共享 `WorkbenchShell` 不再只是固定 grid，而是有 layout controls、sash、localStorage restore、reset layout、Storybook 状态和 shell-level tests。

但 VS Code 的体验不只来自“可以拖动侧栏”。更核心的是：

```text
打开对象 -> 出现在 editor tabs -> 切到其他对象 -> 原对象仍在 tab 中
-> 关闭 / 恢复 / 快速切换 -> 主舞台保持位置感
```

现在的问题是：

```text
route 决定当前页面
WorkbenchShell 承载当前 mainStage
但 mainStage 没有 opened context / tabs / active editor 心智
```

这会造成几个直接体验问题：

1. 用户从 Scene Orchestrate 跳到 Asset，再到 Book Review，再回 Scene 时，心理上像在“页面跳转”，不是在“切换打开的工作对象”。
2. 主舞台没有 tab strip，用户看不到自己打开了哪些对象 / lens。
3. PR31 的 pane hidden / resize 改善了空间，但没有改善对象工作流。
4. 后续再做 command palette、status bar、runtime dock，如果没有 editor context，仍然会像工具栏叠加在网页上。

所以 PR32 不应该回去做业务页，也不应该继续做更多 pane 控制；应该做主舞台 editor identity。

---

## 2. 当前分支事实判断

### 2.1 PR31 已经完成 layout kernel 的第一层

当前 `features/workbench/components` 目录已经包含：

```text
WorkbenchLayoutControls.tsx
WorkbenchSash.tsx
WorkbenchShell.stories.tsx
WorkbenchShell.test.tsx
WorkbenchShell.tsx
```

这说明 PR31 的共享 shell 行为层已经存在，不需要重做。

### 2.2 当前 route 已经足够承载 editor context

当前 route 类型已经支持四个 scope：

```ts
export type WorkbenchScope = 'scene' | 'chapter' | 'asset' | 'book'
```

并且各 scope 已有明确的 lens / view 状态：

```ts
Scene: structure | orchestrate | draft
Chapter: structure | draft
Asset: knowledge
Book: structure | draft
```

Book Draft 也已经有 `read | compare | export | branch | review` 这类 draftView。也就是说，PR32 不需要扩 route；只需要把当前 route snapshot 作为 editor tab 的恢复对象。

### 2.3 VS Code 的下一层借鉴点不是更多 pane，而是 editor tabs / side-by-side / restored opened files

VS Code 官方 UI 文档把界面分成 Editor、Primary Side Bar、Secondary Side Bar、Status Bar、Activity Bar、Panel 六个区域，并强调每次启动时会保留 folder、layout 和 opened files。它也把 Tabs 描述为 editor region 顶部显示 open files 的 headers，并支持多个 editor side by side。  

PR31 已经在追 layout；PR32 应该开始追 “opened editors”。

---

## 3. PR31 之后的路线建议

### PR32：Workbench Editor Context / Tabs Foundation

目标：让主舞台拥有 opened context / tab strip / tab restore。

做：

- `WorkbenchEditorContext` 类型与 key 规则。
- `useWorkbenchEditorState(...)` 本机 localStorage 状态。
- `WorkbenchEditorProvider` 在 App 层同步 active route。
- `WorkbenchEditorTabs` 渲染在 `WorkbenchShell` 的 main stage 顶部。
- 点击 tab -> `replaceRoute(savedRoute)`。
- 关闭 tab -> 从 opened contexts 删除，active tab 关闭时切到最近 context。
- Storybook / tests 覆盖多 tabs、close、restore、route 不污染。

不做：

- 不做 split editor groups。
- 不做 tab drag/drop。
- 不做 dirty/unsaved state。
- 不做 command palette。
- 不做 global keybinding registry。

### PR33：Command Surface + Keyboard Shortcuts Foundation

目标：让所有 workbench 操作都可以通过 command 执行，而不是只靠按钮。

做：

- `features/workbench/commands`。
- Command registry。
- Minimal command palette overlay。
- 快捷键：toggle navigator、toggle inspector、toggle bottom dock、close active editor、focus editor tabs。
- 把 PR31 layout actions 和 PR32 editor actions 注册为 commands。

注意：PR33 可能需要把 layout state 从 `WorkbenchShell` hook 提升成 provider，供 command registry 调用。这个不要放进 PR32。

### PR34：Status Bar + Runtime / Project Signals

目标：补 VS Code-style 低调状态条，解决“我当前运行在哪个 project/runtime/API/run 状态里”的环境感。

做：

- `WorkbenchStatusBar`。
- project id / runtime mode / API health / active scope / active run / open review count / last update label。
- desktop local API status 最小接入。
- 状态条只做 signals，不做主动作墙。

### PR35：Quick Open / Object Jump Foundation

目标：提供类似 `Cmd/Ctrl+P` 的对象跳转入口。

做：

- Quick Open overlay。
- 搜索 Book / Chapter / Scene / Asset / Review issue 的 fixture index。
- 选择后 open editor context + replaceRoute。
- 不做全文搜索，不接真实 index。

### PR36：Editor Split / Two-column Compare Foundation

目标：在 PR32 tabs 稳定后，再引入最小 split group。

做：

- single -> two editor groups。
- Open to side。
- active group id。
- route 仍表示 active editor；non-active group 只保留 local snapshot。

后置原因：split 没有 tabs 会变成大重构；tabs 没有 command surface 也会难用。PR32 先做 single group。

---

## 4. PR32 的唯一目标

**让 Workbench 的 Main Stage 拥有第一版 editor-like opened context / tabs。**

PR32 完成后，用户应该能：

1. 在不同 scope / lens 之间跳转时，主舞台顶部自动出现打开过的 context tab。
2. 点击旧 tab，恢复该 tab 保存的 route snapshot。
3. 关闭非 active tab。
4. 关闭 active tab 后，自动切到最近访问的其他 tab；没有其他 tab 时，保留当前 route 或回到默认 route。
5. 刷新页面后恢复 opened tabs 列表。
6. 当前 route 变化时，只更新 active context 的 snapshot，不制造过多重复 tab。
7. 所有业务 scope 不需要知道 tabs 内部状态。

---

## 5. 本轮明确不做

以下内容不要混进 PR32：

- 不做 split editor / side-by-side。
- 不做 tab drag/drop reorder。
- 不做 dirty state / unsaved changes。
- 不做 editor pin/unpin 的完整语义；如实现，只能做轻量 `pinned?: boolean` 预留，不接业务。
- 不做 command palette。
- 不做 keyboard shortcut registry。
- 不做 status bar。
- 不做 secondary side bar。
- 不做 route schema 扩展。
- 不做 Scene / Chapter / Book / Asset 业务 view-model 重构。
- 不改 API / runtime / desktop。
- 不把 opened tabs 写入 URL。
- 不让 tab state 成为业务 selection 的第二真源。

---

## 6. 必须遵守的硬约束

### 6.1 route 仍然是 active business state 的唯一真源

PR32 的 tabs 不拥有业务真相。

统一规则：

```text
当前画面显示什么 = 当前 route
打开过哪些 tab = local UI preference
点击 tab = replaceRoute(tab.savedRoute)
route 改变 = sync / update active editor context
```

不要新增：

```text
selectedSceneId store
selectedChapterId store
activeAssetId store
activeBookDraftView store
```

### 6.2 tab key 必须粗粒度，避免 tab 爆炸

tab key 不应该包含 proposalId、reviewIssueId、checkpointId 这类细粒度参数。否则用户在同一个对象里切换 review issue 就会生成一堆 tab。

推荐 key 规则：

```ts
scene:<sceneId>:<lens>
chapter:<chapterId>:<lens>
asset:<assetId>:knowledge
book:<bookId>:<lens>
```

细粒度 route state 应保存在 tab snapshot 里，但不参与 tab identity。

示例：

```text
scene:scene-midnight-platform:orchestrate
scene:scene-midnight-platform:draft
chapter:chapter-signals-in-rain:structure
asset:asset-ren-voss:knowledge
book:book-signal-arc:draft
```

### 6.3 opened tabs 是本机 UI state，不写入 URL

不要新增：

```text
?tabs=
?activeEditor=
?group=
```

原因：

- URL 是分享 / 深链 / 自动化入口。
- Opened tabs 是本机工作区记忆。
- 两者混合会污染已有 route-first 纪律。

### 6.4 Shell renders tabs, App owns route replacement

`WorkbenchShell` 可以渲染 tabs，但不应该自己解析完整 business route。推荐用 provider 注入：

```text
App / Workbench root
  -> WorkbenchEditorProvider(route, replaceRoute)
    -> Scope Workbench
      -> WorkbenchShell
        -> WorkbenchEditorTabs
```

`WorkbenchShell` 只消费 editor UI controller，不直接 import Scene / Chapter / Asset / Book 业务容器。

### 6.5 PR32 不碰 layout state 的所有权

PR31 的 layout state 仍然先留在 `WorkbenchShell` 内部。

PR33 如果要做 command palette，再把 layout controller 提升为 provider。不要在 PR32 同时做 tabs + layout provider 重构。

---

## 7. 建议文件改动

### 7.1 新增

```text
packages/renderer/src/features/workbench/editor/workbench-editor-context.ts
packages/renderer/src/features/workbench/editor/useWorkbenchEditorState.ts
packages/renderer/src/features/workbench/editor/useWorkbenchEditorState.test.tsx
packages/renderer/src/features/workbench/editor/WorkbenchEditorProvider.tsx
packages/renderer/src/features/workbench/editor/WorkbenchEditorTabs.tsx
packages/renderer/src/features/workbench/editor/WorkbenchEditorTabs.test.tsx
packages/renderer/src/features/workbench/editor/workbench-editor-descriptors.ts
packages/renderer/src/features/workbench/editor/workbench-editor-storage.ts
```

如果项目习惯不建 `editor/` 子目录，也可以放在：

```text
packages/renderer/src/features/workbench/hooks/
packages/renderer/src/features/workbench/components/
packages/renderer/src/features/workbench/types/
```

但建议建 `editor/`，因为 PR32 是一个新的 workbench layer，不只是一个组件。

### 7.2 修改

```text
packages/renderer/src/App.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
packages/renderer/src/app/i18n/index.tsx
```

### 7.3 尽量不动

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

只有在 `App.tsx` 接 provider 必须改 scope dispatch 时，允许最小接线。

---

## 8. 类型设计

新增：

```text
packages/renderer/src/features/workbench/editor/workbench-editor-context.ts
```

建议类型：

```ts
import type { WorkbenchRouteState, WorkbenchScope, WorkbenchLens } from '../types/workbench-route'

export type WorkbenchEditorContextId = string

export interface WorkbenchEditorContext {
  id: WorkbenchEditorContextId
  scope: WorkbenchScope
  lens: WorkbenchLens
  title: string
  subtitle?: string
  route: WorkbenchRouteState
  updatedAt: number
  lastActiveAt: number
  pinned?: boolean
}

export interface WorkbenchEditorState {
  contextIds: WorkbenchEditorContextId[]
  activeContextId: WorkbenchEditorContextId | null
  contextsById: Record<WorkbenchEditorContextId, WorkbenchEditorContext>
}

export interface WorkbenchEditorController {
  state: WorkbenchEditorState
  activeContext: WorkbenchEditorContext | null
  openOrUpdateContext: (route: WorkbenchRouteState) => void
  activateContext: (contextId: WorkbenchEditorContextId) => WorkbenchRouteState | null
  closeContext: (contextId: WorkbenchEditorContextId) => WorkbenchRouteState | null
  closeOtherContexts: (contextId: WorkbenchEditorContextId) => void
  resetEditorContexts: () => void
}
```

### 8.1 Context key helper

新增：

```ts
export function getWorkbenchEditorContextId(route: WorkbenchRouteState): WorkbenchEditorContextId
```

规则：

```ts
switch (route.scope) {
  case 'scene':
    return `scene:${route.sceneId}:${route.lens}`
  case 'chapter':
    return `chapter:${route.chapterId}:${route.lens}`
  case 'asset':
    return `asset:${route.assetId}:knowledge`
  case 'book':
    return `book:${route.bookId}:${route.lens}`
}
```

### 8.2 Descriptor helper

新增：

```text
packages/renderer/src/features/workbench/editor/workbench-editor-descriptors.ts
```

第一版可以只做 route-derived labels：

```ts
export function describeWorkbenchEditorContext(
  route: WorkbenchRouteState,
  dictionary: AppDictionary,
): { title: string; subtitle?: string }
```

推荐 label：

```text
Scene · Orchestrate · scene-midnight-platform
Scene · Draft · scene-midnight-platform
Chapter · Structure · chapter-signals-in-rain
Asset · Knowledge · asset-ren-voss
Book · Draft · book-signal-arc
```

注意：第一版不要为了拿真实 title 去耦合各 feature query。后续 PR 可以做 `WorkbenchEditorTitleResolver`，从 active read model 更新 tab title。

---

## 9. Storage 设计

新增：

```text
packages/renderer/src/features/workbench/editor/workbench-editor-storage.ts
```

默认 key：

```ts
export const DEFAULT_WORKBENCH_EDITOR_STORAGE_KEY = 'narrative-workbench-editors:v1'
```

行为：

- localStorage 不存在 -> default empty。
- invalid JSON -> default empty。
- unknown route shape -> 丢弃该 context。
- contexts 数量超过上限时，按 `lastActiveAt` 保留最近 12 个。
- active context 不存在时 fallback 到最近 context。
- 不读写 `window.location.search`。

推荐上限：

```ts
export const MAX_WORKBENCH_EDITOR_CONTEXTS = 12
```

---

## 10. Hook 设计

新增：

```text
packages/renderer/src/features/workbench/editor/useWorkbenchEditorState.ts
```

### 10.1 API

```ts
export function useWorkbenchEditorState(options?: {
  storageKey?: string
  describeContext?: (route: WorkbenchRouteState) => { title: string; subtitle?: string }
}): WorkbenchEditorController
```

### 10.2 核心行为

#### `openOrUpdateContext(route)`

- 计算 context id。
- 如果不存在：新建 context，append 到 `contextIds` 末尾。
- 如果已存在：更新该 context 的 `route` snapshot、title/subtitle、`updatedAt`。
- 设置 `activeContextId` 为该 context。
- 更新 `lastActiveAt`。
- 写回 localStorage。

#### `activateContext(contextId)`

- 返回该 context 保存的 route。
- 更新 `activeContextId` 与 `lastActiveAt`。
- 不直接调用 `replaceRoute`，由 provider 调用。

#### `closeContext(contextId)`

- 删除 context。
- 如果关闭的是非 active tab：返回 `null`。
- 如果关闭的是 active tab：返回最近的剩余 context route。
- 如果没有剩余 context：返回 `null`。

这能让 provider 做：

```ts
const nextRoute = editor.closeContext(id)
if (nextRoute) replaceRoute(nextRoute)
```

---

## 11. Provider 设计

新增：

```text
packages/renderer/src/features/workbench/editor/WorkbenchEditorProvider.tsx
```

### 11.1 职责

- 接收当前 `route` 与 `replaceRoute`。
- 在 route 改变时调用 `openOrUpdateContext(route)`。
- 提供 context 给 `WorkbenchShell` / `WorkbenchEditorTabs`。

### 11.2 建议 API

```tsx
interface WorkbenchEditorProviderProps {
  route: WorkbenchRouteState
  replaceRoute: (route: WorkbenchRouteState) => void
  children: React.ReactNode
  storageKey?: string
}
```

Provider 内部：

```ts
useEffect(() => {
  editor.openOrUpdateContext(route)
}, [route])
```

### 11.3 避免 loop

点击 tab 的行为：

```ts
const route = editor.activateContext(contextId)
if (route) replaceRoute(route)
```

之后 route 变化会再进入 `openOrUpdateContext(route)`，但 id 相同，只更新 snapshot，不新增 tab。

---

## 12. Tabs 组件设计

新增：

```text
packages/renderer/src/features/workbench/editor/WorkbenchEditorTabs.tsx
```

### 12.1 UI 要求

- 横向 tab strip。
- 每个 tab 显示：title + subtitle 或 scope/lens badge。
- active tab 有明显 selected state。
- 每个 tab 有 close button，必须有 `aria-label`。
- tab list 需要 accessible roles：

```tsx
<div role="tablist" aria-label={dictionary.shell.openEditors}>
  <button role="tab" aria-selected={isActive}>...</button>
</div>
```

- 如果没有 contexts，不渲染 tab strip 或渲染空状态都可以。推荐不渲染，避免增加空 chrome。
- 超过可视宽度时 horizontal scroll，不做 overflow menu。

### 12.2 Props

```ts
interface WorkbenchEditorTabsProps {
  contexts: WorkbenchEditorContext[]
  activeContextId: string | null
  onActivateContext: (contextId: string) => void
  onCloseContext: (contextId: string) => void
}
```

### 12.3 关闭规则

- Close button click 必须 `stopPropagation()`。
- 非 active tab 关闭不改变 route。
- active tab 关闭后由 provider / shell 触发 fallback route。
- 如果只剩一个 tab，关闭后可以保留当前 route 但清空 opened context；不要跳未知页面。

---

## 13. `WorkbenchShell.tsx` 接入

修改：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.tsx
```

### 13.1 插入位置

当前 main stage 的中心区域应该从：

```tsx
<Pane data-testid="workbench-main-stage">{mainStage}</Pane>
```

变成：

```tsx
<Pane data-testid="workbench-main-stage" className="flex min-h-0 flex-col overflow-hidden">
  <WorkbenchEditorTabs ... />
  <div className="min-h-0 flex-1 overflow-auto">
    {mainStage}
  </div>
</Pane>
```

### 13.2 Shell 不知道业务

`WorkbenchShell` 只通过 `useWorkbenchEditor()` 获取 tabs controller。

如果 provider 不存在，`WorkbenchShell` 应该优雅降级：不渲染 tabs，直接渲染 mainStage。这样 story / 单测可以更容易隔离。

### 13.3 与 PR31 layout 不冲突

不要改：

- navigator visibility。
- inspector visibility。
- bottom dock visibility。
- sash resize。
- layout localStorage。
- `layoutStorageKey`。

---

## 14. `App.tsx` 接入

修改：

```text
packages/renderer/src/App.tsx
```

推荐结构：

```tsx
const routeController = useWorkbenchRouteState()

return (
  <WorkbenchEditorProvider
    route={routeController.route}
    replaceRoute={routeController.replaceRoute}
  >
    {routeController.route.scope === 'scene' ? <SceneWorkbench ... /> : null}
    {routeController.route.scope === 'chapter' ? <ChapterWorkbench ... /> : null}
    {routeController.route.scope === 'asset' ? <AssetWorkbench ... /> : null}
    {routeController.route.scope === 'book' ? <BookWorkbench ... /> : null}
  </WorkbenchEditorProvider>
)
```

如果 `replaceRoute` 当前 API 不是直接接受完整 route，就新增一个很薄的 adapter，不改 route serialization。

---

## 15. i18n keys

修改：

```text
packages/renderer/src/app/i18n/index.tsx
```

新增在 `dictionary.shell` 或现有合适区域：

英文：

```text
openEditors: Open editors
closeEditor: Close editor
closeOtherEditors: Close other editors
sceneEditor: Scene
chapterEditor: Chapter
assetEditor: Asset
bookEditor: Book
structureLens: Structure
orchestrateLens: Orchestrate
draftLens: Draft
knowledgeLens: Knowledge
```

中文：

```text
openEditors: 已打开对象
closeEditor: 关闭对象
closeOtherEditors: 关闭其他对象
sceneEditor: 场景
chapterEditor: 章节
assetEditor: 资产
bookEditor: 书籍
structureLens: 结构
orchestrateLens: 编排
draftLens: 草稿
knowledgeLens: 知识
```

---

## 16. Storybook 要求

修改：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.stories.tsx
```

新增或扩展：

```text
Default
MultipleEditorTabs
ActiveSceneOrchestrate
ActiveBookDraft
EditorTabsWithHiddenNavigator
EditorTabsWithBottomDockMaximized
EditorTabsOverflow
ChapterScope
```

Story 要求：

- 不接真实 API。
- 用 fixture route snapshots 写入 editor storage。
- 初始状态稳定，不依赖用户手动点击。
- `MultipleEditorTabs` 至少包含 Scene / Chapter / Asset / Book 四个 tab。
- `EditorTabsOverflow` 至少 10 个 context，用来验证横向滚动不爆版。

---

## 17. 测试计划

### 17.1 Pure / hook tests

新增：

```text
packages/renderer/src/features/workbench/editor/useWorkbenchEditorState.test.tsx
```

至少覆盖：

1. invalid localStorage JSON -> empty editor state。
2. `openOrUpdateContext(scene orchestrate route)` 新增 context。
3. 同一 scene/lens route 变化只更新 snapshot，不新增 context。
4. scene orchestrate 与 scene draft 生成两个不同 context。
5. `activateContext(id)` 返回保存的 route。
6. close non-active context 不返回 route。
7. close active context 返回最近 context route。
8. contexts 超过 12 个时按最近活跃裁剪。
9. remount restores localStorage contexts。
10. hook does not modify `window.location.search`。

### 17.2 Component tests

新增：

```text
packages/renderer/src/features/workbench/editor/WorkbenchEditorTabs.test.tsx
```

至少覆盖：

1. renders tablist / tabs。
2. active tab has `aria-selected="true"`。
3. clicking tab calls `onActivateContext(id)`。
4. clicking close calls `onCloseContext(id)` and does not activate tab。
5. long list renders without dropping tabs。
6. close buttons have accessible labels。

### 17.3 Shell integration tests

扩展：

```text
packages/renderer/src/features/workbench/components/WorkbenchShell.test.tsx
```

至少覆盖：

1. provider present -> shell renders editor tabs above main stage。
2. provider absent -> shell still renders main stage without tabs。
3. hidden navigator + editor tabs still keeps main stage accessible。
4. bottom dock maximized + editor tabs still keeps tablist accessible。

### 17.4 App integration test

新增或扩展：

```text
packages/renderer/src/App.test.tsx
```

建议路径：

```text
打开 scene orchestrate
-> tab strip 出现 Scene · Orchestrate
-> 切到 asset knowledge
-> tab strip 出现 Scene + Asset
-> 点击 Scene tab
-> route 恢复 scene orchestrate
-> 切到 book draft review
-> tab strip 出现 Book Draft
-> 关闭 Asset tab
-> route 仍是当前 Book Draft
-> refresh/remount
-> opened tabs 恢复
```

### 17.5 命令

先跑窄测试：

```bash
pnpm --filter @narrative-novel/renderer test -- useWorkbenchEditorState WorkbenchEditorTabs WorkbenchShell
```

再跑全量门禁：

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

## 18. MCP / browser snapshot 验证

如果执行环境有 MCP 或 browser automation，启动 Storybook：

```bash
pnpm --filter @narrative-novel/renderer storybook
```

打开：

```text
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--multiple-editor-tabs&viewMode=story
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--editor-tabs-with-hidden-navigator&viewMode=story
http://127.0.0.1:6006/iframe.html?id=mockups-workbench-shell--editor-tabs-overflow&viewMode=story
```

结构化快照必须证明：

- 有 `role="tablist"`。
- 至少有 4 个 `role="tab"`。
- active tab `aria-selected=true`。
- 每个 close button 有 `aria-label`。
- Navigator hidden story 中，navigator region 不存在，但 tablist 与 main stage 存在。
- Overflow story 不应把 tab 挤出 shell 外导致横向页面滚动。

没有 MCP 时，用 Testing Library + Storybook build 替代，不允许跳过验证。

---

## 19. Bundle 切分与执行顺序

### Bundle A：Editor model + storage

Files：

```text
workbench-editor-context.ts
workbench-editor-storage.ts
workbench-editor-descriptors.ts
useWorkbenchEditorState.ts
useWorkbenchEditorState.test.tsx
```

Tasks：

1. 定义 context / state / controller 类型。
2. 实现 context id helper。
3. 实现 route-derived descriptor。
4. 实现 parse / serialize / clamp / max context storage。
5. 实现 hook 与 tests。

验收：

```bash
pnpm --filter @narrative-novel/renderer test -- useWorkbenchEditorState
```

### Bundle B：Provider + tabs component

Files：

```text
WorkbenchEditorProvider.tsx
WorkbenchEditorTabs.tsx
WorkbenchEditorTabs.test.tsx
app/i18n/index.tsx
```

Tasks：

1. 实现 provider。
2. 实现 accessible tab strip。
3. 实现 activate / close callbacks。
4. 补 i18n。
5. 补 component tests。

### Bundle C：WorkbenchShell + App integration

Files：

```text
WorkbenchShell.tsx
WorkbenchShell.test.tsx
App.tsx
App.test.tsx
```

Tasks：

1. Shell mainStage 上方接入 tabs。
2. Provider 缺失时优雅降级。
3. App 层包 `WorkbenchEditorProvider`。
4. route -> context sync。
5. tab click -> route restore。

### Bundle D：Storybook states

Files：

```text
WorkbenchShell.stories.tsx
```

Tasks：

1. 新增 MultipleEditorTabs。
2. 新增 ActiveSceneOrchestrate。
3. 新增 ActiveBookDraft。
4. 新增 EditorTabsWithHiddenNavigator。
5. 新增 EditorTabsWithBottomDockMaximized。
6. 新增 EditorTabsOverflow。

---

## 20. 完成后的验收标准

满足以下条件，PR32 才算完成：

1. Workbench 主舞台顶部有 editor tab strip。
2. route 变化会 open/update 对应 editor context。
3. 同一对象 + lens 不会重复生成 tab。
4. 不同 lens 可以成为不同 tab，例如同一 scene 的 orchestrate 和 draft。
5. 点击 tab 可以恢复保存的 route snapshot。
6. 关闭非 active tab 不改变当前 route。
7. 关闭 active tab 后能 fallback 到最近 context。
8. opened contexts 会写入 localStorage，刷新后恢复。
9. opened contexts 不写入 URL。
10. PR31 的 layout controls / sash / bottom dock maximize 不退化。
11. Scene / Chapter / Asset / Book 业务 view-model 不被重构。
12. Storybook 有多 tab、hidden pane、overflow 状态。
13. `pnpm --filter @narrative-novel/renderer typecheck` 通过。
14. `pnpm --filter @narrative-novel/renderer test` 通过。
15. `pnpm --filter @narrative-novel/renderer build-storybook` 通过。

---

## 21. PR32 结束时不要留下的债

以下情况都算 PR 做偏：

- tab state 变成业务 selection 真源。
- tabs 写进 URL。
- tab key 包含 proposalId / reviewIssueId，导致 tab 爆炸。
- 为了 tab title 去改各 feature query 或 view-model。
- 顺手做 split editor。
- 顺手做 command palette。
- 顺手做 dirty state。
- 重构 Scene / Chapter / Asset / Book 容器。
- 破坏 PR31 的 layout localStorage / reset / sash tests。
- 在没有 provider 时 `WorkbenchShell` 不能单独渲染。

PR32 做完后的正确状态应该是：

> Workbench 仍然 route-first，但主舞台已经拥有 opened context memory。用户开始感觉自己是在一个 IDE 中打开对象，而不是在一个网页里跳页面。

---

## 22. PR33 预告：为什么 command palette 应该紧跟 PR32

PR32 会让 workbench 有 tabs；但 VS Code 体验还需要“动作统一入口”。PR33 应该把下面动作注册为 commands：

```text
Workbench: Toggle Navigator
Workbench: Toggle Inspector
Workbench: Toggle Bottom Dock
Workbench: Maximize Bottom Dock
Workbench: Reset Layout
Editor: Close Active Context
Editor: Close Other Contexts
Editor: Focus Next Context
Editor: Focus Previous Context
Scope: Switch to Scene
Scope: Switch to Chapter
Scope: Switch to Asset
Scope: Switch to Book
```

PR33 再考虑快捷键：

```text
Cmd/Ctrl+B -> toggle navigator
Cmd/Ctrl+J -> toggle bottom dock
Cmd/Ctrl+W -> close active editor context
Cmd/Ctrl+Shift+P -> command palette
```

但这些不要提前塞进 PR32。

---

## 23. 最后判断

PR31 不是失败；它只是完成了 VS Code-style workbench 的第一块地基。现在体验仍然“不行”，是因为缺的是第二层：

```text
Layout parts -> Editor contexts -> Commands -> Status signals -> Quick open
```

所以后续不应该立刻回到业务功能，也不应该继续做更多外观 polish。最短纠偏路径是：

```text
PR32：Workbench Editor Context / Tabs Foundation
PR33：Command Surface + Keyboard Shortcuts Foundation
PR34：Status Bar + Runtime / Project Signals
PR35：Quick Open / Object Jump Foundation
```

只要 PR32 把 opened context 做出来，这个项目会第一次从“多 scope 路由页面”变成“有打开对象记忆的 Narrative IDE”。
