# PR3 执行文档（基于 `codex/pr2` 实际代码）

## 这份文档的目的

这不是路线图回顾，而是基于当前 `codex/pr2` 已落地代码，为 AI agent 准备的一份可直接实施的 PR3 计划。

PR3 的任务不是再做 chapter 数据层，也不是提前做 dock / handoff，而是把 **Chapter 左侧 Binder + 主舞台 Sequence** 做成第一块真正可用的 chapter surface。

---

## 一、先确认当前代码基线

当前 `codex/pr2` 已经成立的基础：

1. `features/chapter` 已经有独立的 `api / components / containers / hooks / types` 骨架。
2. `ChapterStructureWorkspace.tsx` 已经不再内联 fixture，而是通过 `useChapterStructureWorkspaceQuery()` 取得统一的 `workspace view-model`，再把它喂给 binder / stage / inspector。
3. `useChapterStructureWorkspaceQuery()` 已经把 `record -> localized stable view-model` 做完，而且 **query key 只认 `chapterId`**，`selectedSceneId` 只是 route 派生，不会触发重新拉取 chapter 数据。
4. `useWorkbenchRouteState()` 已经支持 chapter route：`scope=chapter`、`id=<chapterId>`、`lens=structure`、`view=<sequence|outliner|assembly>`、`sceneId?=<selectedSceneId>`。
5. 当前 chapter UI 仍主要由三个 placeholder 组件承担：
   - `ChapterBinderPlaceholder.tsx`
   - `ChapterStructureStagePlaceholder.tsx`
   - `ChapterStructureInspectorPlaceholder.tsx`
6. 当前 Binder 已经能通过 `onSelectScene` 更新选中 scene；但 `Sequence` 分支里的卡片仍只是展示块，不是 route-driven 的真正交互面。
7. 当前测试重点还在 query 与 stage placeholder：
   - chapter query hook 已验证 `queryKey` 仅依赖 `chapterId`，且 `selectedSceneId` 切换不 refetch。
   - stage test 目前只覆盖 `assembly` lane 和 `availableViews` 缩窄场景。

所以，PR2 已经把 chapter 的 **数据层、route 身份、统一 view-model** 打稳了；PR3 不应该再回去改这些，而应该消费这些基础，把 chapter 的第一工作面做实。

---

## 二、PR3 的唯一目标

把 Chapter / Structure 的两块表面做成真实可用：

1. 左侧 Binder 成为真正的章节导航面。
2. 主舞台里的 `Sequence` 成为真正的章节扫描器。

这一步完成后，用户应该能在 chapter 工作面里完成以下事：

- 快速扫描本章 scene 顺序
- 看每场 scene 的基础状态和结构摘要
- 从 Binder 或 Sequence 里切换当前 scene
- 让左侧 Binder、主舞台 Sequence、右侧 Inspector 始终围绕同一个 `route.sceneId` 同步

---

## 三、这一轮明确不做

以下内容不要混进 PR3：

- 不改 chapter query 层
- 不改 `chapterQueryKeys.ts`
- 不改 `useChapterStructureWorkspaceQuery.ts`
- 不改 `chapter-client.ts` / `mock-chapter-db.ts`
- 不做 chapter bottom dock
- 不做 chapter → scene handoff
- 不做 outliner / assembly 的产品化重写
- 不引入 chapter 级本地 store 来保存 selected scene
- 不改 workbench route 序列化规则，除非测试发现真实 bug

一句话说：

**PR3 只做“把已有数据和 route 基础，变成真实 Binder + Sequence 交互面”。**

---

## 四、必须遵守的硬约束

### 1. `route.sceneId` 仍然是 chapter 选中态的唯一真源

不要新增：

- `useState(selectedSceneId)`
- chapter 局部 zustand store
- binder 内部 active scene state
- sequence 内部 selected card state

统一规则：

- 选中态来源：`workspace.selectedSceneId`
- 点击 Binder item：`patchChapterRoute({ sceneId })`
- 点击 Sequence card：`patchChapterRoute({ sceneId })`

### 2. 不要碰 query identity

保持下面这个约束不变：

- query key 只由 `chapterId` 决定
- `selectedSceneId` 只影响派生 view-model，不触发 refetch

PR3 不需要也不允许把 `sceneId` 塞进 `chapterQueryKeys.workspace()`。

### 3. `availableViews` 继续尊重 workspace metadata

当前 `ChapterStructureStagePlaceholder.tsx` 已经支持：

- 默认 `sequence / outliner / assembly`
- 若 `workspace.viewsMeta.availableViews` 缩窄，则只显示允许的 view

PR3 必须保留这一点，不要把 view switcher 写死。

### 4. 只改 navigator + sequence 这条线

本 PR 不要把 top bar / mode rail / inspector 一起重构。

- `ChapterTopCommandBar`：保持现状
- `ChapterModeRail`：保持现状
- `ChapterStructureInspectorPlaceholder.tsx`：本 PR 只消费现有 selected scene 更新，不做信息结构重写

---

## 五、建议的文件改动

### 新增

- `packages/renderer/src/features/chapter/components/ChapterSequenceView.tsx`
- `packages/renderer/src/features/chapter/components/ChapterSequenceView.test.tsx`
- `packages/renderer/src/features/chapter/components/ChapterBinderPane.test.tsx`
- `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.test.tsx`（推荐）
- `packages/renderer/src/features/chapter/components/ChapterSequenceView.stories.tsx`（推荐）
- `packages/renderer/src/features/chapter/components/ChapterBinderPane.stories.tsx`（推荐）

### 重命名

- `packages/renderer/src/features/chapter/components/ChapterBinderPlaceholder.tsx`
  -> `packages/renderer/src/features/chapter/components/ChapterBinderPane.tsx`

### 修改

- `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
- `packages/renderer/src/features/chapter/components/ChapterStructureStagePlaceholder.tsx`

### 本 PR 不动

- `packages/renderer/src/features/chapter/hooks/chapter-query-keys.ts`
- `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts`
- `packages/renderer/src/features/chapter/api/chapter-client.ts`
- `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`
- `packages/renderer/src/features/chapter/types/chapter-view-models.ts`（除非 sequence UI 真缺字段）
- `packages/renderer/src/features/chapter/components/ChapterStructureInspectorPlaceholder.tsx`

---

## 六、组件职责拆分

## 6.1 `ChapterBinderPane.tsx`

这是 PR3 的真实 navigator。

### 组件职责

- 展示当前 chapter 摘要
- 展示 scene list
- 高亮当前选中 scene
- 点击 scene 更新 route
- 用紧凑密度承接“导航”职责，而不是替代主舞台

### props

保持和旧 binder 接近：

- `title: string`
- `description: string`
- `workspace: ChapterStructureWorkspaceViewModel`
- `activeView: ChapterStructureView`
- `onSelectScene?: (sceneId: string) => void`

### UI 规则

顶部 chapter 摘要块保留，继续展示：

- chapter title
- active view badge
- scene count
- unresolved count

scene item 建议展示：

- order
- title
- 一句话 summary
- status badge
- unresolved badge（推荐补上）

注意：

- Binder 是导航面，不要塞进 purpose / conflict / reveal 全字段
- Binder 每项必须是 button
- 必须有 `aria-pressed={active}`
- 选中态来自 `scene.id === workspace.selectedSceneId`

### 不做

- 不加“Open in Scene”动作
- 不加 reorder
- 不加 context menu

---

## 6.2 `ChapterSequenceView.tsx`

这是 PR3 的主舞台核心。

### 组件职责

- 呈现章节顺序
- 让用户扫描节奏与场次密度
- 让用户快速切换 selected scene
- 让用户在不进入 outliner 的前提下完成一轮“章节扫描”

### 建议 props

- `workspace: ChapterStructureWorkspaceViewModel`
- `onSelectScene?: (sceneId: string) => void`

### 每张 card 至少显示

必显：

- order
- title
- summary
- statusLabel
- unresolvedCount

推荐也显示：

- purpose（单行或短段）
- pov
- location
- proseStatusLabel
- lastRunLabel

不建议一开始塞进去：

- conflict 全文
- reveal 全文
- runStatusLabel 大段说明

原因很简单：

`Sequence` 是“顺序 + 节奏 + 快速扫描”视图，不是高密度字段比对视图。高密度字段比对应该留给 PR4 的 `Outliner`。

### 交互规则

- card 必须可点击
- 点击 card 调用 `onSelectScene(scene.id)`
- 选中态使用 `workspace.selectedSceneId`
- card 最外层优先用 `button`，不要只给 `section` 加 `onClick`
- 必须有明确 active 样式
- 必须有明确 focus 样式

### 视觉纪律

- 延续当前 grid 结构即可，不要在 PR3 改成 timeline / drag layout
- card 密度要明显高于现在，但仍保持“可扫描”优先
- 当前选中 card 的视觉权重要高于普通 card，但不要抢到像 primary CTA

---

## 6.3 `ChapterStructureStagePlaceholder.tsx`

这个文件本 PR 不强制重命名。

原因：

- 里面当前同时承载 `sequence / outliner / assembly`
- 真正产品化的只有 sequence
- outliner / assembly 还会在 PR4 继续拆

### 本 PR 的正确做法

让它变成一个“轻薄的 stage switchboard”：

- 保留现有 view switcher
- `sequence` 分支改为渲染新的 `ChapterSequenceView`
- `outliner` 分支先维持当前实现
- `assembly` 分支先维持当前实现

### 这一步不要做

- 不在 PR3 里把 outliner / assembly 一起推翻重写
- 不把整个 stage 一次拆成过多组件

PR3 的目标是把 sequence 先做实，不是提前把 PR4 做掉。

---

## 七、`ChapterStructureWorkspace.tsx` 的接线要求

这个容器已经很接近正确形态了，PR3 不要重写，只需要接新组件。

### 要做的事

1. 将 binder import 改为 `ChapterBinderPane`
2. 将 stage 中 sequence 分支接入 `ChapterSequenceView`
3. 保持 Binder 和 Sequence 都通过 `patchChapterRoute({ sceneId })` 更新选中 scene
4. 保持 `activeView` 仍来自 `route.view`
5. 保持 `availableViews` 仍来自 `workspace.viewsMeta?.availableViews`

### 不要做的事

- 不要在 workspace 里再包一层 chapter-local selected state
- 不要把 selectedSceneId fallback 逻辑搬进组件
- 不要改 loading / error / null-state 结构

`useChapterStructureWorkspaceQuery()` 已经负责把非法或空的 `sceneId` 回落到第一场 scene。PR3 只消费它，不重复发明一套选择逻辑。

---

## 八、测试补齐方案

当前 chapter 测试还没有覆盖 PR3 最关键的交互面，所以这轮必须补。

## 8.1 `ChapterBinderPane.test.tsx`

至少覆盖：

1. 当前 `workspace.selectedSceneId` 对应的 item 有选中态
2. 点击另一个 scene item 会调用 `onSelectScene(sceneId)`
3. scene count / unresolved count / active view badge 正常渲染

## 8.2 `ChapterSequenceView.test.tsx`

至少覆盖：

1. sequence card 会渲染 order / title / summary / status / unresolved
2. 选中 card 来源于 `workspace.selectedSceneId`
3. 点击 card 会调用 `onSelectScene(sceneId)`

## 8.3 `ChapterStructureWorkspace.test.tsx`（推荐，优先级高）

做一个轻量集成测试，验证 route-driven 同步。

建议覆盖：

1. 初始 URL：
   - `?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=sequence&sceneId=scene-midnight-platform`
2. 渲染 `ChapterStructureWorkspace`
3. 断言 Binder 与 Sequence 都高亮 `scene-midnight-platform`
4. 点击 `scene-ticket-window` 的 sequence card
5. 断言：
   - URL 中 `sceneId=scene-ticket-window`
   - Binder 选中态切到 `scene-ticket-window`
   - Inspector 标题/摘要跟着切换

这条测试是 PR3 最值钱的测试，因为它证明：

**route -> workspace query 派生 -> binder / sequence / inspector 三面同步** 已经形成闭环。

## 8.4 保留现有测试

当前两组测试不要删：

- `useChapterStructureWorkspaceQuery.test.tsx`
- `ChapterStructureStagePlaceholder.test.tsx`

如果 stage test 因 sequence 抽出需要调整，只做最小改动。

---

## 九、Storybook 要求（推荐）

chapter 现在还在快速成形阶段，PR3 很适合补 story，减少视觉回归。

建议新增：

### `ChapterBinderPane.stories.tsx`

至少两种 story：

- 默认选中第一场
- 选中中段 scene

### `ChapterSequenceView.stories.tsx`

至少两种 story：

- 正常三到四场 sequence
- 选中末尾 scene

注意：

- story 数据直接复用现有 chapter workspace mock shape 即可
- 不要为了 story 改 query 层

---

## 十、实施顺序（给 AI 的执行顺序）

### Step 1
先重命名 Binder 组件，并保持功能不变：

- `ChapterBinderPlaceholder.tsx` -> `ChapterBinderPane.tsx`
- `ChapterStructureWorkspace.tsx` 更新 import
- 确保现有渲染不坏

### Step 2
新增 `ChapterSequenceView.tsx`，先只做静态渲染：

- 把现有 sequence 分支从 stage 文件中抽出来
- 先保证视觉输出与旧实现一致或更完整

### Step 3
给 `ChapterSequenceView.tsx` 加入点击交互：

- card 改为 button
- 点击触发 `onSelectScene`
- 使用 `workspace.selectedSceneId` 计算 active 样式

### Step 4
回到 `ChapterStructureStagePlaceholder.tsx`：

- sequence 分支替换成 `<ChapterSequenceView />`
- outliner / assembly 保持现状

### Step 5
回到 `ChapterStructureWorkspace.tsx`：

- 统一通过 `patchChapterRoute({ sceneId })` 给 binder 和 sequence 传回调

### Step 6
补测试：

- binder test
- sequence test
- workspace 集成 test

### Step 7
补 stories（如本 PR 包含 story 维护）

---

## 十一、完成后的验收标准

满足以下条件，PR3 就算完成：

1. chapter 数据层完全不动，PR2 的 query 纵切保持稳定。
2. Binder 已成为真实 navigator，而不是 placeholder 名义下的临时展示块。
3. Sequence 已成为真实交互视图，而不是只读卡片墙。
4. Binder 与 Sequence 的选中态完全同步。
5. 选中态唯一真源仍是 `route.sceneId` / `workspace.selectedSceneId`。
6. 切换 selected scene 不触发 chapter query refetch。
7. Inspector 会随着 selected scene 自动更新。
8. `availableViews` 缩窄时，view switcher 仍按 metadata 工作。
9. 新增测试覆盖 Binder / Sequence / Workspace 三层核心交互。

---

## 十二、PR3 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了让 sequence 可点，引入了本地 selected state
- 为了更好测，改坏了 chapter query key
- 顺手把 outliner / assembly 一起大改，导致 PR 面过大
- 顺手改了 chapter inspector 信息结构
- 顺手把 scene handoff 也做进去
- 顺手开始做 dock

PR3 做完后，正确的项目状态应该是：

**chapter 已经有一块可工作的第一工作面，但仍然把 PR4 的 outliner / assembly / inspector-dock 增强留到下一步。**

---

## 十三、给 AI 的最终一句话指令

在 `codex/pr2` 的现有基础上，只围绕 `ChapterStructureWorkspace.tsx`、Binder、Sequence 做一轮窄而实的实现：

- 保持 PR2 的 query / route 约束不变
- 把 Binder 做成真实导航面
- 把 Sequence 做成真实章节扫描器
- 用 route 统一选中态
- 补齐交互测试
- 不提前做 PR4 / PR5 的内容
