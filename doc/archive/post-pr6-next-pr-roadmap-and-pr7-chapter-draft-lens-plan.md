# PR7+ 后续实施计划（基于 `codex/pr6-chapter-structure-mutations` 实际代码，并回看开源项目后修订）

## 结论

PR6 已经把 Chapter / Structure 从只读结构台推进成了 **write-light structure workbench**：

- chapter client 不再只读，已经有 `reorderChapterScene(...)` 和 `updateChapterSceneStructure(...)`
- `chapter-record-mutations.ts` 已经把 scene reorder 和 locale-aware structure patch 抽成纯函数
- `mock-chapter-db.ts` 已经拥有 mutable in-memory db 与 `resetMockChapterDb()`
- Binder 已经有 `Move earlier / Move later`
- Outliner 已经有 selected-row 的 inline structure form
- bottom dock 已经开始记录 `view / scene / mutation` 三类 activity

但 PR6 之后，项目仍然停在下面这个阶段：

- workbench scope 仍然只有 `scene | chapter`
- chapter route 仍然只支持 `lens='structure'`
- App 的 mode rail 里，scene 已经有 `structure / orchestrate / draft` 三条 lens，chapter 仍然只有 `structure`
- scene 侧已经有现成的 prose query / prose container / prose fixture 数据，而 chapter 还没有自己的 draft lens

所以，PR6 之后最该做的，不是立刻引入第三个 scope，也不是继续抛光 structure mutations，而是：

**先把 Chapter 从“只有 Structure 的对象”推进成“真正支持第二条 lens 的对象”。**

我推荐的下一步主线是：

1. **PR7：Chapter Draft Lens（Read-first）**
2. **PR8：Asset / Knowledge Foundation**
3. **PR9：Canon & Traceability Bridge**
4. **PR10：Book Structure Workspace**
5. **PR11 以后：Branch / Compare / Publish**

其中，真正应该立刻交给 AI 去做的，是 **PR7：Chapter Draft Lens（Read-first）**。

---

## 一、先确认当前代码基线

下面这些判断，必须建立在当前分支已经存在的代码事实上，而不是继续沿用 PR5 前后的旧假设。

### 1. Chapter 结构写路径已经成立

当前 chapter 代码已经有：

- `packages/renderer/src/features/chapter/api/chapter-client.ts`
- `packages/renderer/src/features/chapter/api/chapter-record-mutations.ts`
- `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`
- `packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.ts`
- `packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.ts`

这意味着 Chapter / Structure 现在已经不是“只能观察”的台子，而是一个最小可写的结构工作面。

### 2. Chapter query identity 仍然很稳定，不应打破

当前 `useChapterStructureWorkspaceQuery(...)` 仍然保持一个很重要的约束：

- query key 只认 `chapterId`
- `selectedSceneId` 只用于在 hook 内派生 localized workspace view-model
- scenes 仍按 `order` 排序后映射为 view-model
- inspector 也仍然是从同一份 chapter workspace record 派生

这条约束是好的，PR7 不应因为新增 chapter draft lens 就去破坏 structure query 的 identity。

### 3. route 仍然把 chapter 锁在 `structure`

当前 `workbench-route.ts` 和 `useWorkbenchRouteState.ts` 仍然把 chapter 规范成：

- `scope: 'chapter'`
- `lens: 'structure'`
- `view: 'sequence' | 'outliner' | 'assembly'`
- `sceneId?: string`

也就是说，**Chapter 现在还不是一个真正的 multi-lens 对象**。

### 4. App 壳子已经把差距暴露得很明显

当前 `App.tsx` 里的 mode rail 其实已经把产品结构差距写出来了：

- 当 `activeScope === 'scene'` 时，有 `structure / orchestrate / draft`
- 当 `activeScope === 'chapter'` 时，只有 `structure`

所以 PR7 的价值非常明确：

**不是“给 chapter 再加一个页面”，而是让 chapter 第一次兑现 scope × lens 双轴模型。**

### 5. scene 侧已经有足够多的 draft 能力可以复用

当前 scene feature 已经具备：

- `sceneQueryKeys.prose(sceneId, locale?)`
- `SceneProseContainer.tsx`
- `SceneProseViewModel`
- `sceneClient.getSceneProse(sceneId)`
- `mock/scene-fixtures.ts` 中已经存在 `proseDraft`、`statusLabel`、`draftWordCount` 等数据基础

这意味着 Chapter Draft 不是要从零发明一套 prose 系统，而是**把 chapter 的对象身份与 scene 的 prose 数据正确拼起来**。

---

## 二、回看开源项目后的借鉴刷新

我重新看了一轮之前文档里点名的几个开源项目。下面这轮不是“致敬名单”，而是 **接下来 PR7–PR10 真正该借的方法**。

## 2.1 VS Code：继续借 workbench 空间纪律，不借程序员噪音

从 VS Code 官方 UI 文档里能确认的几个关键点是：

- Activity Bar、Primary Side Bar、Secondary Side Bar、Editor、Panel、Status Bar 是被明确分区的
- Panel 被定义成位于 editor 区域下方的附加空间，默认承载 output、debug、errors / warnings、terminal
- VS Code 会记住关闭前的 folder、layout 与 open files 状态

对本项目的落点：

- 继续坚持 chapter / scene 都占满五面 workbench
- chapter draft lens 也要保留 navigator / main stage / inspector / bottom dock
- draft lens 的 bottom dock 仍然只放 supporting information，不抢主阅读区
- route 仍要承担恢复状态，而不是另开第二真源

## 2.2 AppFlowy：真正借“一份对象身份，多种视图 / lens”

从 AppFlowy 官方文档和官方指南能确认：

- 一个 database 可以有多个 views，并且这些 views 共享同一份 database
- AppFlowy 当前明确有 Grid / Board / Calendar 三种共享同一 database 的视图
- 同一 database 的各个 view 可以分别配置 sorts、filters 和 visible properties，而不影响其他 view

对本项目的落点：

- Chapter 不应停在“只有 structure”的对象
- PR7 应该让 **同一个 chapter identity** 在 `structure` 与 `draft` 之间切换
- 切 lens 不应复制 chapter 对象，也不应把 Draft 做成另一个伪对象
- future asset knowledge 也应该继续用这种“一份对象，多种工作方式”的方法

## 2.3 Outline：借 calm、snappy、all-day use 的阅读感

从 Outline 官方文档能确认：

- Outline 把 documents 描述为“optimized for all-day use”
- Collections 是组织 workspace 的高层主题容器
- 文档阅读与侧边导航都维持比较低噪音的知识工作体验

对本项目的落点：

- Chapter Draft 的主舞台要是 **连续阅读区**，而不是拼成一堆 noisy cards
- 右侧 inspector 继续保持 contextual pane，而不是复杂控制台
- Asset / Knowledge 的未来形态也应该偏 Outline，而不是后台配置页

## 2.4 BookStack：借显式层级与顺序事实

从 BookStack 官方文档能确认：

- 它把内容明确组织成 shelves / books / chapters / pages
- pages / chapters 可以移动
- book content 可以通过 book sort 进行排序
- 排序是显式事实，不是隐式推导

对本项目的落点：

- chapter draft 的 assembled prose 必须严格按 chapter scene order 来组装
- 不要在 draft lens 里根据 prose 是否存在、scene status、更新时间等重新发明排序
- 未来 book scope 也应该延续这种层级与顺序的明确心智

## 2.5 Wiki.js：借 path / breadcrumb 与稳定位置感

从 Wiki.js 官方文档能确认：

- Global Navigation、Global Search、Breadcrumbs 都是明确的一等界面元素
- 页面直接创建在 path 上，文件夹由 path 自动推断
- breadcrumb 由 path 自动生成

对本项目的落点：

- chapter lens 切换要继续写进 route，而不是靠局部 state
- PR7 开始，chapter route 应能稳定表达：`scope=chapter`、`id`、`lens`、`sceneId`
- 之后在 header / breadcrumb 上显式表达 `Chapter → Draft → Selected Scene` 会很自然

## 2.6 Logseq：借链接意识与 references，不做 graph-first

从 Logseq 官方站点与 docs 索引能确认：

- Linking、References and Embeds 是它的核心能力入口
- 官方站点也持续强调 linked references、queries、search 这类知识组织能力

对本项目的落点：

- PR7 不需要把 graph 做进 chapter draft
- 但 PR8 / PR9 开始，asset mentions / backlinks / references 就该成为第一等数据
- graph 只应作为未来的次级探索视图，而不应作为主入口

---

## 三、推荐的后续顺序

### 近三轮

1. **PR7：Chapter Draft Lens（Read-first）**
2. **PR8：Asset / Knowledge Foundation**
3. **PR9：Canon & Traceability Bridge**

### 中期两轮

4. **PR10：Book Structure Workspace**
5. **PR11 以后：Branch / Compare / Publish**

### 为什么不是 Asset 先上

因为当前代码里最短、最值钱、最顺势的缺口并不是第三个 scope，而是：

**chapter 还没有兑现 multi-lens。**

在 PR6 刚把 chapter structure 写路径补起来后，立刻用 PR7 补 `chapter / draft`，会比直接引入 `asset` 更顺。

---

## 四、PR7：Chapter Draft Lens（Read-first）

## 4.1 目标

把 Chapter 从“只有 Structure 的对象”，推进成“真正拥有第二条 lens 的对象”。

PR7 完成后，用户应该能：

- 在 chapter scope 下切到 `lens='draft'`
- 看到按 chapter scene order 组装的章节阅读稿
- 在 binder / draft stage / inspector / dock 之间围绕同一个 `route.sceneId` 同步聚焦
- 从 chapter draft 平滑打开 scene draft 或 scene orchestrate
- 返回 chapter 时恢复到原来的 `lens='draft'` 与 `sceneId`

一句话说：

**PR7 要证明 Chapter 不是“只有 structure 的特殊页”，而是一个真正的 multi-lens object。**

---

## 4.2 为什么现在就该做 PR7

### 1. 这是兑现双轴模型的最短路径

当前代码里，scene 已经证明了“同一对象可切多 lens”；chapter 还没有。

PR7 做完以后，产品模型会第一次真正成立为：

- `scene`：structure / orchestrate / draft
- `chapter`：structure / draft

这比直接引入第三个 scope 更能巩固你的产品主轴。

### 2. 这一步的实现成本比 Asset 小，而且复用更高

scene 已经有 prose query、prose view-model、scene prose container 和 prose fixture。

所以 PR7 不需要从零发明一条新能力链，而是：

- 复用 chapter 的对象身份和 scene 的 prose 数据
- 用 chapter 顺序把 scene prose 正确 assembly 成连续阅读稿

### 3. 这一步也最能吸收开源项目里真正有用的方法

PR7 是把：

- VS Code 的 workbench 分区
- AppFlowy 的 shared identity / multiple views
- Outline 的 calm reading
- BookStack 的 explicit order
- Wiki.js 的 route / breadcrumb 心智

第一次同时落到一个清楚 PR 上的最好机会。

---

## 4.3 本轮明确不做

为了把 PR7 做窄，以下内容不要混进来：

- 不做 `asset` scope
- 不做 `book` scope
- 不做 `chapter compare` 正式模式
- 不做版本 diff 主视图
- 不做 chapter prose inline editing
- 不做 chapter draft AI rewrite / assemble agent
- 不做 chapter-level review queue
- 不做 graph / backlinks 主入口
- 不做 publish / export

PR7 必须坚持：

**read-first，而不是 compare-first，更不是 write-first。**

---

## 4.4 必须遵守的硬约束

### 1. `route.sceneId` 仍然是 chapter 内唯一选中态真源

不要新增：

- `selectedDraftSceneId` store
- draft lens 局部 selected scene 真源
- binder / reader / inspector 各自的 active state 真源

统一规则仍然是：

- chapter 内部所有聚焦都围绕 `route.sceneId`
- `route.sceneId` 缺失时 fallback 到 chapter 第一场
- 点击 binder scene / draft section / inspector 相关入口都只 patch `sceneId`

### 2. Chapter route 只新增 lens，不新增 mode / compare / section 参数

PR7 只把 chapter route 从：

- `lens: 'structure'`

扩成：

- `lens: 'structure' | 'draft'`

本轮不要新增：

- `compare=true`
- `section=`
- `selectedChunk=`
- `draftMode=`

### 3. `view` 仍然只服务 structure，但要被保留

当前 chapter route 已有 `view`。

PR7 里正确做法不是删除它，而是：

- 当 `lens='structure'` 时继续使用 `view`
- 当 `lens='draft'` 时忽略 `view`，但保留它

这样从 draft 切回 structure 时，仍能回到原来的 `sequence / outliner / assembly`。

### 4. PR6 的 structure mutation 体系不动

以下内容本轮不要重写：

- `chapter-record-mutations.ts`
- `useReorderChapterSceneMutation.ts`
- `useUpdateChapterSceneStructureMutation.ts`
- `ChapterBinderPane.tsx`
- `ChapterOutlinerView.tsx`
- `ChapterStructureWorkspace.tsx`

PR7 的目标是新增 draft lens，而不是把 PR6 再重做一遍。

### 5. chapter draft 的顺序唯一来源仍然是 chapter scene order

assembled chapter prose 必须按 chapter scene order 来拼。

不要根据：

- prose 是否存在
- proseStatusLabel
- last updated
- revision queue

另起排序。

### 6. 继续保留 chapter → scene handoff

draft lens 也应继续保留：

- `Open in Draft`
- `Open in Orchestrate`

但它们仍然是 secondary actions，不应抢掉 chapter 内部阅读 / 聚焦这个主任务。

---

## 4.5 建议的文件改动

## 4.5.1 新增

- `packages/renderer/src/features/chapter/containers/ChapterWorkbench.tsx`
- `packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.tsx`
- `packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts`
- `packages/renderer/src/features/chapter/types/chapter-draft-view-models.ts`
- `packages/renderer/src/features/chapter/components/ChapterDraftBinderPane.tsx`
- `packages/renderer/src/features/chapter/components/ChapterDraftReader.tsx`
- `packages/renderer/src/features/chapter/components/ChapterDraftInspectorPane.tsx`
- `packages/renderer/src/features/chapter/components/ChapterDraftBottomDock.tsx`
- `packages/renderer/src/features/chapter/containers/ChapterDraftDockContainer.tsx`
- `packages/renderer/src/features/chapter/hooks/useChapterDraftActivity.ts`（若不想复用 structure activity hook）
- 对应的 `*.test.tsx`
- 对应的 `*.stories.tsx`（推荐）

## 4.5.2 修改

- `packages/renderer/src/App.tsx`
- `packages/renderer/src/features/workbench/types/workbench-route.ts`
- `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts`
- chapter i18n 文案
- 可能需要轻量修改 `packages/renderer/src/features/chapter/types/chapter-view-models.ts`

## 4.5.3 这一轮尽量不动

- `packages/renderer/src/features/scene/**` 的主要容器
- PR6 已经完成的 structure mutation hooks
- `packages/renderer/src/features/chapter/components/ChapterBinderPane.tsx`
- `packages/renderer/src/features/chapter/components/ChapterOutlinerView.tsx`
- `packages/renderer/src/features/chapter/components/ChapterStructureStage.tsx`

---

## 4.6 路由与壳子改法

## 4.6.1 `workbench-route.ts`

把：

```ts
export interface ChapterRouteState {
  scope: 'chapter'
  chapterId: string
  lens: 'structure'
  view: ChapterStructureView
  sceneId?: string
}
```

改成：

```ts
export type ChapterLens = 'structure' | 'draft'

export interface ChapterRouteState {
  scope: 'chapter'
  chapterId: string
  lens: ChapterLens
  view: ChapterStructureView
  sceneId?: string
}
```

### 规则

- `view` 继续存在
- `lens='draft'` 时忽略 `view`
- 不新增其他 chapter route 参数

## 4.6.2 `useWorkbenchRouteState.ts`

要做的事：

1. `normalizeChapterRoute(...)` 允许 `lens='structure' | 'draft'`
2. `readChapterSnapshot(...)` 读 `lens`
3. `buildWorkbenchSearch(...)` 在 `scope='chapter'` 时写入真实 `lens`
4. `patchChapterRoute(...)` 保持当前 API 形态，不新开 draft 专用 patch hook

### 必须保留的行为

- `sceneId` 仍然可选
- `view` 仍然被保留
- back / forward / refresh 恢复成立

## 4.6.3 `App.tsx`

当前 App 直接在 chapter scope 下渲染 `ChapterStructureWorkspace`，这会让 PR7 后的命名语义变坏。

### 正确做法

新增一个 chapter-scope dispatch container：

- `ChapterWorkbench.tsx`

它内部根据 `route.lens` 选择：

- `ChapterStructureWorkspace`
- `ChapterDraftWorkspace`

然后在 `App.tsx` 里：

- scene scope 继续走现有 scene workbench
- chapter scope 改为渲染 `ChapterWorkbench`

### 为什么这一步值得做

因为从 PR7 开始，chapter 不再只是 structure 页面。

继续让 `ChapterStructureWorkspace` 挂在 App 顶层，会把“structure 拥有 chapter”的反向所有权写死。

---

## 4.7 数据层与 query 设计

## 4.7.1 不新增 chapter-draft route 真源，先新增组合型 query hook

推荐新增：

- `useChapterDraftWorkspaceQuery.ts`

### 它的职责

1. 先读取 chapter structure workspace（只为拿 chapter identity、scene order、scene metadata）
2. 再按 chapter scenes 的顺序并行拉取每个 scene 的 prose query
3. 最终在 hook 内派生出 chapter draft workspace view-model

### 这样做的好处

- 不需要现在就发明一套 chapter draft 后端 client
- 可以直接复用现有：
  - `useChapterStructureWorkspaceQuery(...)`
  - `sceneQueryKeys.prose(...)`
  - `sceneClient.getSceneProse(...)`
- 也能忠实反映当前代码的真实分层

## 4.7.2 `useChapterDraftWorkspaceQuery.ts` 的数据来源

### 上游 1：chapter structure workspace

从这里拿：

- `chapterId`
- `title`
- `summary`
- `selectedSceneId`
- ordered `scenes`
- 每个 scene 的：
  - `id`
  - `order`
  - `title`
  - `summary`
  - `statusLabel`
  - `proseStatusLabel`
  - `runStatusLabel`

### 上游 2：scene prose query

从这里拿：

- `proseDraft`
- `draftWordCount`
- `statusLabel`
- `latestDiffSummary`
- `revisionQueueCount`
- `warningsCount`

## 4.7.3 推荐的 draft view-model

### `ChapterDraftSceneViewModel`

至少有：

- `sceneId`
- `order`
- `title`
- `summary`
- `proseDraft?: string`
- `draftWordCount?: number`
- `proseStatusLabel`
- `sceneStatusLabel`
- `latestDiffSummary?: string`
- `revisionQueueCount?: number`
- `warningsCount: number`
- `isMissingDraft: boolean`

### `ChapterDraftWorkspaceViewModel`

至少有：

- `chapterId`
- `title`
- `summary`
- `selectedSceneId`
- `scenes: ChapterDraftSceneViewModel[]`
- `assembledWordCount`
- `draftedSceneCount`
- `missingDraftCount`
- `selectedScene`
- `inspector`
- `dockSummary`

### `ChapterDraftInspectorViewModel`

建议第一版包含：

- `selectedSceneBrief`
- `selectedSceneMetrics`
  - `draftWordCount`
  - `revisionQueueCount`
  - `warningsCount`
  - `latestDiffSummary`
- `chapterReadiness`
  - `draftedSceneCount`
  - `missingDraftCount`
  - `assembledWordCount`

## 4.7.4 query key 纪律

PR7 不要去改 structure query key。

### 继续成立的东西

- structure 侧的 `chapterQueryKeys.workspace(chapterId)` 不动

### draft 侧的正确做法

不要强行伪造一个新的 chapter-draft server key。

先让 `useChapterDraftWorkspaceQuery(...)` 通过：

- 1 条 chapter structure query
- N 条 scene prose queries

在 hook 内组合 view-model。

这样最贴近当前代码已经存在的事实。

---

## 4.8 组件职责

## 4.8.1 `ChapterDraftBinderPane.tsx`

### 职责

- 继续承担左侧 navigator
- 但从 structure binder 切换成 draft binder 的信息重心

### 必须显示

- scene order
- scene title
- prose status
- draft word count（若有）
- missing draft / queued revision / warning 的轻量标记

### 交互

- 点击 scene：`patchChapterRoute({ sceneId })`
- secondary actions：
  - `Open in Draft`
  - `Open in Orchestrate`

### 不做

- 不做 reorder
- 不做 inline edit
- 不把 structure mutation 动作搬过来

## 4.8.2 `ChapterDraftReader.tsx`

### 职责

这是 PR7 的主舞台核心。

它应该是一个**连续阅读优先的章节阅读稿**，而不是 sequence 的另一种卡片皮肤。

### 每个 section 至少显示

- scene ordinal
- scene title
- prose status badge
- prose body
- 若 prose 缺失，则显示 calm empty state

### 交互

- 点击 section header 或 section body：`patchChapterRoute({ sceneId })`
- 当前 `route.sceneId` 对应 section 有明显 selected state
- 每个 section 保留 secondary actions：
  - `Open in Draft`
  - `Open in Orchestrate`

### 视觉纪律

借 Outline：

- 以连续阅读为主
- 控件克制
- badge / affordance 只做辅助

不要做：

- noisy card grid
- compare gutter
- inline edit
- revision form

## 4.8.3 `ChapterDraftInspectorPane.tsx`

### 职责

右侧只做 contextual reading support。

### 第一版建议固定成两块

#### A. `Selected Scene`

显示：

- title
- summary
- prose status
- draft word count
- revision queue count
- latest diff summary

#### B. `Chapter Readiness`

显示：

- drafted scene count
- missing draft count
- assembled word count
- warnings / attention summary

### 不做

- 不做主编辑
- 不做 compare 主视图
- 不做全量 version tree

## 4.8.4 `ChapterDraftBottomDock.tsx`

### 职责

继续保持 supporting panel，而不是第二个 main stage。

### 第一版建议两块

#### A. `Problems`

列：

- missing draft scenes
- scenes with warnings
- scenes with queued revisions

#### B. `Activity`

列：

- entered draft lens
- focused scene
- open in draft / open in orchestrate（若你愿意记录）

### 不做

- 不搬 scene runtime trace
- 不做 cost / token 面板
- 不做 compare 主视图

---

## 4.9 交互与 handoff 规则

## 4.9.1 从 Chapter Draft 打开 Scene

以下地方都应该能 handoff：

- draft binder item
- draft reader section header
- draft reader section action row

### 两个入口

- `Open in Draft`
- `Open in Orchestrate`

### 行为

- `scope='scene'`
- `sceneId=当前 scene`
- `lens='draft' | 'orchestrate'`
- `tab='prose' | 'execution'`

## 4.9.2 返回策略

仍然依赖：

- 浏览器历史
- route 恢复

返回 chapter 后，应恢复：

- `scope='chapter'`
- `lens='draft'`
- `sceneId`
- 以及 structure 的 dormant `view`

---

## 4.10 测试补齐方案

## 4.10.1 `useWorkbenchRouteState` 测试

至少补：

1. chapter route 现在能读写 `lens='draft'`
2. chapter route 在 `draft` 下仍保留 `view`
3. 从 draft 切回 structure 时，原 `view` 仍可恢复

## 4.10.2 `useChapterDraftWorkspaceQuery.test.ts`

至少覆盖：

1. scenes 按 chapter order 组装
2. scene prose 缺失时会形成 `isMissingDraft`
3. `selectedSceneId` 缺失时 fallback 到首场
4. `assembledWordCount`、`draftedSceneCount`、`missingDraftCount` 派生正确

## 4.10.3 `ChapterDraftReader.test.tsx`

至少覆盖：

1. 连续渲染 ordered scenes
2. selected section 跟 `route.sceneId` 同步
3. 点击另一 section 会触发 `onSelectScene(sceneId)`
4. `Open in Draft` / `Open in Orchestrate` 可触发

## 4.10.4 `ChapterDraftWorkspace.test.tsx`

建议做一条完整集成路径：

```text
打开 ?scope=chapter&id=chapter-signals-in-rain&lens=draft&sceneId=scene-ticket-window
-> binder / reader / inspector / dock 同步聚焦 Ticket Window
-> 点击另一 scene section
-> URL sceneId 更新
-> binder / reader / inspector / dock 同步刷新
-> 点击 Open in Draft
-> 进入 scene scope + draft/prose
-> 浏览器 back
-> 回到 chapter scope + draft + 原 sceneId
```

## 4.10.5 `App.test.tsx`（推荐）

至少再补一条 chapter multi-lens smoke：

```text
打开 chapter structure
-> 切到 chapter draft
-> 选择一个 scene
-> open in scene draft
-> 返回
-> 仍在 chapter draft
-> 切回 structure
-> 原 structure view 恢复
```

---

## 4.11 Storybook 建议

推荐新增：

- `ChapterDraftBinderPane.stories.tsx`
- `ChapterDraftReader.stories.tsx`
- `ChapterDraftInspectorPane.stories.tsx`
- `ChapterDraftBottomDock.stories.tsx`
- `ChapterDraftWorkspace.stories.tsx`（若你允许 page story）

### 最少 story 组合

- `Default`
- `MissingDrafts`
- `SelectedMiddleScene`
- `QuietChapter`

---

## 4.12 实施顺序（给 AI 的执行顺序）

### Step 1
先扩 route：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`
- 只新增 chapter `lens='draft'`
- 保持 `view` 存在

### Step 2
新增 `ChapterWorkbench.tsx`：

- chapter scope dispatch 容器
- 根据 `route.lens` 渲染 `ChapterStructureWorkspace` 或 `ChapterDraftWorkspace`

### Step 3
新增 `useChapterDraftWorkspaceQuery.ts`：

- 复用 `useChapterStructureWorkspaceQuery(...)`
- 再用 `useQueries(...)` 取 ordered scene prose
- 派生 `ChapterDraftWorkspaceViewModel`

### Step 4
新增 draft components：

- binder
- reader
- inspector
- dock

### Step 5
新增 `ChapterDraftWorkspace.tsx`：

- 用 `WorkbenchShell` 接 draft lens 的五个表面
- 继续用 `patchChapterRoute({ sceneId })`
- 继续复用 chapter → scene handoff helper

### Step 6
修改 `App.tsx`：

- 用 `ChapterWorkbench` 代替直接渲染 `ChapterStructureWorkspace`
- mode rail 为 chapter 增加 `draft` lens

### Step 7
补测试与 stories

---

## 4.13 完成后的验收标准

满足以下条件，PR7 就算完成：

1. chapter route 现在支持 `lens='structure' | 'draft'`
2. `App.tsx` 中 chapter scope 不再只有 structure
3. chapter 现在有一个 read-first 的 draft lens
4. chapter draft 按 chapter scene order 组装 prose
5. binder / reader / inspector / dock 围绕同一个 `route.sceneId` 同步
6. `Open in Draft` / `Open in Orchestrate` 在 chapter draft 中仍然可用
7. scene → back → chapter draft 的 roundtrip 恢复成立
8. structure 的 `view` 状态不会因为切去 draft 而丢失
9. PR6 的 structure mutations 不被破坏
10. 不包含 compare / asset / book / publish 扩建

---

## 五、PR8–PR10 的方向（保持窄 PR 节奏）

## PR8：Asset / Knowledge Foundation

### 目标

把 `asset` 作为第三个 scope 正式接进 workbench。

### 借鉴落点

- **Outline**：Profile 页的 calm reading
- **AppFlowy**：一份 typed asset，多种 knowledge views
- **Wiki.js**：稳定 path / breadcrumb
- **Logseq**：mentions / references / backlinks

### 第一版只做

- Character / Location / Rule 三类 typed asset
- `Profile / Mentions / Relations` 三视图
- graph 只预留，不做默认入口

## PR9：Canon & Traceability Bridge

### 目标

把 scene accepted state、chapter draft section、asset mentions 串成可追溯链。

### 借鉴落点

- **Logseq**：references/backlinks 的组织意识
- **VS Code**：追溯信息继续留在 inspector / dock，不抢主舞台

### 第一版只做

- prose section → scene source trace
- asset mentions / backlinks
- selected section 的来源摘要 pane

## PR10：Book Structure Workspace

### 目标

把 `book` 作为第四个对象层级接入，但第一版仍坚持 read-heavy structure workspace。

### 借鉴落点

- **BookStack**：显式层级与排序
- **VS Code**：多表面 workbench
- **Wiki.js**：breadcrumb / path 位置感

### 第一版只做

- chapter sequence
- chapter outliner
- book → chapter handoff
- unresolved / readiness 汇总

---

## 六、外部参考（这次确实建议继续看）

下面这些不是“抄 UI”，而是 AI 在实现前应再次确认的方法源头：

- VS Code UI：`https://code.visualstudio.com/docs/getstarted/userinterface`
- AppFlowy Database View：`https://docs.appflowy.io/docs/documentation/software-contributions/architecture/frontend/database-view`
- AppFlowy Views / Filters / Sorts：`https://appflowy.com/guide/views-filters-and-sorts`
- Outline Documents：`https://docs.getoutline.com/s/guide/doc/documents-UiH1h0aQFQ`
- Outline Collections：`https://docs.getoutline.com/s/guide/doc/collections-l9o3LD22sV`
- BookStack Content Overview：`https://www.bookstackapp.com/docs/user/content-overview/`
- BookStack Organising Content：`https://www.bookstackapp.com/docs/user/organising-content/`
- Wiki.js Interface：`https://docs.requarks.io/guide/intro`
- Wiki.js Folder Structure & Tags：`https://docs.requarks.io/guide/structure`
- Logseq Docs Index：`https://docs.logseq.com/`
- Logseq 官方站点：`https://logseq.com/`

---

## 七、给 AI 的最终一句话指令

在当前 `codex/pr6-chapter-structure-mutations` 已经完成 PR6 的前提下，不要继续抛光 structure mutation，也不要提前引入 Asset / Book；先只围绕 **Chapter Draft Lens（Read-first）** 做一轮窄而实的实现：

- 扩 chapter route 到 `lens='draft'`
- 新增 chapter-scope dispatch 容器，停止让 `ChapterStructureWorkspace` 直接拥有整个 chapter scope
- 用 chapter order + scene prose query 组合出 chapter draft workspace
- 做一套安静的 draft binder / reader / inspector / dock
- 继续坚持 `route.sceneId` 是 chapter 内唯一选中态真源
- 保留 chapter → scene draft / orchestrate handoff
- 保留 structure 的 `view` 状态并支持从 draft 切回恢复
- 用测试固定 multi-lens、route 恢复、section 选中同步这三条硬约束
- 明确不做 compare、asset、book、publish
