# Chapter / Structure 扩建：PR1 实施规格

## 这一步要解决什么

这一轮不是直接做 `Chapter Sequence / Outliner / Assembly` 的完整 UI，而是先把当前 **Scene-only workbench** 升级成 **scope-aware workbench**，让后续 `scope=chapter + lens=structure` 能以最小代价接入。

换句话说，PR1 的目标是：

1. 保持现有 Scene 主路径不坏；
2. 把 route 从 `scene-only` 升级成 `scene | chapter`；
3. 让 shell 能按 scope 切换 navigator / mainStage / inspector / dock；
4. 为 PR2 的 Chapter read-only vertical slice 预留稳定入口。

---

## 这一步为什么先做

当前仓库里有 3 个非常明确的现状：

- `WorkbenchShell` 已经是完整的 5 面壳子：`topBar / modeRail / navigator / mainStage / inspector / bottomDock`。
- `App.tsx` 目前把整个 workbench 直接绑定在 Scene 上：mode rail 的 scope 文案固定是 Scene，navigator 也是 Scene 列表，mainStage 固定是 `SceneWorkspace`。
- `useSceneRouteState.ts` 还是完全的 Scene 路由：`scope` 被硬编码成 `'scene'`，并且 URL 只理解 `tab / beatId / proposalId / modal` 这套 scene 语义。

所以 PR1 的核心不是“再做一个新页面”，而是先把 **壳子与路由的所有权** 从 `features/scene` 挪到 `features/workbench`。

---

## 借鉴哪些开源项目，以及借什么

### 1. VS Code：借 workbench 的空间纪律，不借开发者噪音

借鉴点：

- 左侧 Activity Bar / Mode Rail 只承担一级导航；
- Panel 是 editor 下方的辅助区域，不抢主舞台；
- Activity Bar 项应该绑定“清楚、明确的容器”，不要做成随意弹窗入口。

落到当前项目：

- `modeRail` 继续只放一级工作方式；
- `bottomDock` 继续只承载辅助信息；
- Chapter 接入后不能把大量结构操作塞进 inspector 或 dock。

### 2. AppFlowy：借“一份数据，多种视图”

借鉴点：

- 同一数据库可以切 `Grid / Board / Calendar` 等多个视图；
- 多视图共享一份数据，修改在不同视图之间同步；
- 文档明确鼓励“不同上下文用不同视图”。

落到当前项目：

- Chapter 只维护一份 chapter dataset；
- `Sequence / Outliner / Assembly` 只是不同 `view`，不是三套独立页面；
- route 中应该持有 `view`，而不是用局部 state 偷偷切视图。

### 3. Outline：借安静的 sidebar 组织与手动排序

借鉴点：

- collection 可以在 sidebar 中拖拽重排；
- collection 内文档既能按字母排序，也能手动排序。

落到当前项目：

- Chapter binder 要允许手动顺序作为第一真源；
- saved views / filters 应该属于 navigator，而不是塞进顶部按钮堆。

### 4. BookStack：借显式层级与跨父节点移动

借鉴点：

- 页和章可以移动到新的 chapter / book；
- book sort 界面是显式的 drag & drop 重排，而不是隐式规则。

落到当前项目：

- Chapter 下的 scene 排序应该是显式操作；
- 后续 scene 移入/移出 chapter 时，应复用 chapter binder 的结构心智。

### 5. Wiki.js：借“树状导航”和“静态入口”并存

借鉴点：

- sidebar 既可以是站点树，也可以是静态链接集合。

落到当前项目：

- navigator 默认是 binder/tree；
- 但要允许在 binder 顶部留 saved views / filters / shortcuts 这种静态入口，不必把一切都塞进树节点。

### 6. Logseq：借 backlinks / references 意识，不把 graph 当主入口

借鉴点：

- 双向链接和 references 是高价值的上下文补充；
- 但它不是主编辑入口。

落到当前项目：

- Chapter scope 下右侧 inspector 可以展示“所选 scene 的 brief / mentions / unresolved”；
- 但 Chapter 主入口仍应是 binder + 主视图，而不是 graph。

---

## PR1 的交互结论

### 结论 1：先做 `scope`，再做 `view`

这个 PR 要先解决“当前工作对象是谁”，再解决“Chapter 中间怎么切三种视图”。

因此这一轮优先级是：

1. `scope = scene | chapter`
2. `scene route` 与 `chapter route` 的判别联合类型
3. app shell 根据 `scope` 切换内容
4. chapter scope 先用 placeholder / read-only scaffold 占位

### 结论 2：Chapter 在 PR1 只支持 `lens=structure`

虽然长期会有双轴模型，但当前 PR1 不应该提前把 `chapter + orchestrate` 或 `chapter + draft` 一起放进来。

这一轮只开：

- `scope=chapter`
- `lens=structure`
- `view=sequence | outliner | assembly`

这样能保持类型、URL 和 UI 都足够干净。

### 结论 3：URL 继续让 `id` 表示“当前 scope 主对象”

当前 Scene deep link 已经使用 `?scope=scene&id=<sceneId>` 的心智。

PR1 不建议为了 chapter 再重新发明一套 `sceneId/chapterId` 顶级参数，而是：

- `scope=scene` 时，`id = sceneId`
- `scope=chapter` 时，`id = chapterId`
- chapter 内部的选中 scene 才额外用 `sceneId`

这样能最大限度兼容现有 scene 深链。

---

## 推荐的 route 类型草案

```ts
import type { SceneTab } from '@/features/scene/types/scene-view-models'

export type WorkbenchScope = 'scene' | 'chapter'
export type WorkbenchLens = 'structure' | 'orchestrate' | 'draft'

export type SceneRouteModal = 'export'
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly'

export interface SceneRouteState {
  scope: 'scene'
  sceneId: string
  lens: WorkbenchLens
  tab: SceneTab
  beatId?: string
  proposalId?: string
  modal?: SceneRouteModal
}

export interface ChapterRouteState {
  scope: 'chapter'
  chapterId: string
  lens: 'structure'
  view: ChapterStructureView
  sceneId?: string
}

export type WorkbenchRouteState = SceneRouteState | ChapterRouteState
```

### 为什么是这个形状

- `SceneRouteState` 继续保留现有 `tab / beatId / proposalId / modal`，保证 scene 不返工；
- `ChapterRouteState` 不复用 `tab`，因为 Chapter 的中间主视图语义不是 scene tab；
- `view` 专门给 Chapter 的 `Sequence / Outliner / Assembly`，避免把它硬塞回 scene tab 模型；
- `chapter` 当前强制 `lens='structure'`，防止 PR1 扩散。

---

## URL 规则草案

### Scene

```txt
?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-01&proposalId=proposal-03
```

### Chapter

```txt
?scope=chapter&id=chapter-03&lens=structure&view=sequence&sceneId=scene-midnight-platform
```

### 解析规则

- `scope` 缺失时默认回退到 `scene`
- `scene` scope 下：
  - `id -> sceneId`
  - `tab` 无效时默认 `execution`
- `chapter` scope 下：
  - `id -> chapterId`
  - `view` 无效时默认 `sequence`
  - 忽略 `tab / beatId / proposalId / modal`

---

## hook API 建议

不要再把 app-level route 继续放在 `features/scene` 名下。

### 新增

`packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts`

建议返回：

```ts
interface SetRouteOptions {
  replace?: boolean
}

interface UseWorkbenchRouteStateResult {
  route: WorkbenchRouteState
  replaceRoute: (next: WorkbenchRouteState, options?: SetRouteOptions) => void
  patchSceneRoute: (patch: Partial<SceneRouteState>, options?: SetRouteOptions) => void
  patchChapterRoute: (patch: Partial<ChapterRouteState>, options?: SetRouteOptions) => void
}
```

### 不建议继续用一个 `setRoute(Partial<Union>)`

因为这会产生很多非法组合，比如：

- `scope=chapter + tab=execution`
- `scope=scene + view=sequence`

分开 `patchSceneRoute / patchChapterRoute` 会明显更稳。

---

## 文件级改动清单

## A. 新增文件

### 1. `packages/renderer/src/features/workbench/types/workbench-route.ts`

职责：

- 放 `WorkbenchScope`
- 放 `WorkbenchLens`
- 放 `SceneRouteState / ChapterRouteState / WorkbenchRouteState`
- 放 `ChapterStructureView`

这是 route 类型的唯一真源。

### 2. `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts`

职责：

- 从 `window.location.search` 读取 app-level route
- 负责 URL parse / normalize / build / write
- 提供 `replaceRoute / patchSceneRoute / patchChapterRoute`

### 3. `packages/renderer/src/features/chapter/types/chapter-view-models.ts`

PR1 先放最小类型：

```ts
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly'

export interface ChapterWorkspaceViewModel {
  id: string
  title: string
  sceneCount: number
  unresolvedCount: number
}

export interface ChapterSceneCardModel {
  id: string
  title: string
  summary: string
  povLabel?: string
  locationLabel?: string
  statusLabel?: string
}
```

PR1 不需要完整 domain，只要足够驱动 placeholder / shell scaffold。

### 4. `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`

职责：

- 接 chapter scope route
- 读取 `chapterId / view / sceneId`
- 在 PR1 里先渲染 read-only placeholder scaffold

### 5. `packages/renderer/src/features/chapter/components/ChapterBinderPlaceholder.tsx`

职责：

- 展示 binder 的最小样子
- 先用静态 fixture / placeholder 场景列表占位

### 6. `packages/renderer/src/features/chapter/components/ChapterStructureStagePlaceholder.tsx`

职责：

- 根据 `view` 渲染 `Sequence / Outliner / Assembly` 的空壳
- 明确后续 PR2 的中间区域切换逻辑

---

## B. 修改现有文件

### 1. `packages/renderer/src/App.tsx`

这是 PR1 的最大改动点。

#### 要做的事

- 从 `useSceneRouteState` 改为 `useWorkbenchRouteState`
- 顶层按 `route.scope` 分支：
  - `scene -> 现有 Scene shell`
  - `chapter -> 新 Chapter structure scaffold`
- `TopCommandBar` 不再默认把标题写死成 `Scene cockpit`
- `ModeRail` 不再把 scope 卡片写死成 `Scene`
- `NavigatorPane` 不再只接受 `SceneNavigatorCard[]`

#### 推荐做法

不要一次把 App.tsx 完全拆碎，但至少拆出两层：

- `renderSceneWorkbench(route)`
- `renderChapterWorkbench(route)`

这样 PR1 的 diff 比较可控，PR2 再决定要不要继续抽组件。

### 2. `packages/renderer/src/features/scene/hooks/useSceneRouteState.ts`

把它从“真路由实现”改成“scene 兼容包装层”。

#### 目标

- 现有 Scene 容器和 hooks 先不大改；
- 内部改为调用 `useWorkbenchRouteState()`；
- 只在 `scope === 'scene'` 时暴露 scene route。

#### 推荐形式

```ts
export function useSceneRouteState() {
  const { route, patchSceneRoute } = useWorkbenchRouteState()

  if (route.scope !== 'scene') {
    throw new Error('useSceneRouteState must be used under scene scope')
  }

  return {
    route,
    setRoute: patchSceneRoute,
  }
}
```

这样现有 Scene 代码基本不用大规模改名。

### 3. `packages/renderer/src/app/i18n/index.tsx`

要补的不是大量新词，而是 Chapter PR1 需要的最小标签：

- `chapterWorkbench`
- `chapterStructure`
- `sequence`
- `outliner`
- `assembly`
- `chapters`
- `chapterNavigatorDescription`

另外建议把 `SceneLens` 相关 label helper 逐步抽象成 `WorkbenchLens` label helper，避免名字继续绑在 scene 上。

### 4. `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`

壳体结构本身不用大改，但建议加两点：

- 允许 `navigator` / `inspector` / `bottomDock` 为空时仍保持稳定布局；
- 给 main stage 增加更明确的 `overflow` 约束，避免 Chapter 的 outliner/table 进来后撑坏高度。

这一轮不要改 grid 比例；先保持壳子稳定。

---

## Scene 侧哪些文件先不要动

为了让 PR1 可控，下面这些 Scene 读写逻辑先不碰：

- `scene-client.ts`
- `scene-query-keys.ts`
- `useProposalActions.ts`
- `useSceneWorkspaceActions.ts`
- `SceneExecutionContainer.tsx`
- `SceneSetupContainer.tsx`
- `SceneProseContainer.tsx`
- `SceneInspectorContainer.tsx`
- `SceneDockContainer.tsx`

这些文件只继续通过 `useSceneRouteState` 的兼容包装访问 scene route 即可。

---

## Chapter PR1 占位交互

PR1 不做真实 chapter 数据接入，但 UI 不应该只是一个空白页。

建议做到下面这个程度：

### 左侧 navigator

- 标题：`Chapters`
- 顶部一段说明文案
- 一个 chapter card（当前 chapter）
- card 内显示 scene count / unresolved count
- 下方一个 binder placeholder，列出该 chapter 下 3~5 个静态 scene 项

### 中间 main stage

顶部一排三种 view 切换：

- Sequence
- Outliner
- Assembly

点击切换时：

- 改 URL 中的 `view`
- 不走局部 state

主区内容：

- Sequence：纵向 scene 卡片列表 placeholder
- Outliner：表格形态 placeholder
- Assembly：章节拼接阅读稿 placeholder

### 右侧 inspector

先只放：

- selected scene brief
- unresolved summary
- chapter notes placeholder

### 底部 dock

PR1 可先复用 shell 默认空态；
不要把 Scene 的 runtime trace 生搬过来。

---

## 验收标准

### 路由

- 旧 scene 深链继续可用：
  - `?scope=scene&id=...&lens=...&tab=...`
- chapter 深链可直达：
  - `?scope=chapter&id=...&lens=structure&view=sequence`
- scene scope 不接受 chapter-only 参数污染
- chapter scope 不接受 scene-only 参数污染

### 壳体

- `WorkbenchShell` 布局不变
- 切换 scope 时，mode rail / navigator / main stage / inspector 内容随 scope 变化
- Scene 现有 smoke 路径不回退

### 交互

- 点击 Chapter 视图切换会更新 URL
- 刷新页面后仍能恢复当前 chapter view
- 从 Scene 切到 Chapter，再切回 Scene，不会丢失 scene 深链状态

---

## PR1 推荐提交顺序

### commit 1

新增：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`

完成 parse/build/normalize 与基本单测。

### commit 2

改：

- `useSceneRouteState.ts`

把 Scene route 改成兼容包装。

### commit 3

改：

- `App.tsx`
- `app/i18n/index.tsx`

让 app 按 scope 切 scene/chapter。

### commit 4

新增：

- `features/chapter/...` placeholder scaffold

让 `scope=chapter` 能真正打开。

### commit 5

补：

- route smoke
- deep-link 恢复测试

---

## 这一步刻意不做什么

- 不接真实 chapter query / bridge
- 不做 scene reorder 写操作
- 不做 chapter inspector 的复杂问题面板
- 不做 chapter runtime / trace dock
- 不把 scene container 重构成通用 container

PR1 的目标就是：**先把壳子和路由的所有权切正确。**

---

## 可直接抄用的实现顺序

1. 先写 `workbench-route.ts`
2. 再把当前 `useSceneRouteState.ts` 逻辑复制到 `useWorkbenchRouteState.ts`
3. 在新 hook 里加 `chapter` 分支
4. 把旧 `useSceneRouteState.ts` 改成 wrapper
5. App 按 `route.scope` 分支渲染
6. 最后补 Chapter placeholder

---

## 参考来源

- VS Code User Interface / Activity Bar
- AppFlowy Databases / Grid View / Calendar View
- Outline Collections
- BookStack Organising Content
- Wiki.js Navigation
- Logseq references / links 思想
- 你已有的 `scene-bridge-pr-plan` 与 `odd-frontend-comprehensive-design`
