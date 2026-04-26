# PR10 执行文档（基于 `codex/pr9-canon-traceability-bridge` 实际代码）

## 这份文档的目的

这不是路线图回顾，也不是下一阶段的大而全 wishlist。

这是一份**基于 `codex/pr9-canon-traceability-bridge` 当前实际代码状态**整理出来的、可以直接交给 AI agent 执行的 PR10 指令文档。

PR10 的任务，不是继续抛光 PR9 已经成立的 traceability surfaces，也不是提前做 publish / compare / branch，而是围绕一个更高价值、也更符合当前产品节奏的目标推进：

**把 `Book` 作为第四个 scope 正式接进 workbench，并先把它做成 read-heavy 的 `Book / Structure` 工作面。**

---

## 一、先确认当前代码基线

当前分支里，PR9 主体已经完成，不应再回头重做。

### 1. workbench 现在已经是三 scope，不再是双 scope

当前 `features` 目录已经存在：

- `asset`
- `chapter`
- `scene`
- `traceability`
- `workbench`

这说明项目当前已经不再停留在 `scene + chapter`，而是已经拥有：

- `scene`
- `chapter`
- `asset`

三个对象层级。

### 2. Chapter 已经兑现了 multi-lens

当前 Chapter 已经不是“挂在 chapter 名下的一张 structure 页面”。

代码里已经有：

- `ChapterWorkbench.tsx`
- `ChapterStructureWorkspace.tsx`
- `ChapterDraftWorkspace.tsx`

也就是说，Chapter 当前已经支持：

- `structure`
- `draft`

两条 lens。

### 3. Asset / Knowledge 也已经成立

当前 `AssetWorkbench.tsx` 已经把 asset scope 接进顶层分发，`AssetKnowledgeWorkspace.tsx` 也已经是一个完整的五面 workbench：

- mode rail
- navigator
- main stage
- inspector
- bottom dock

而不是一个孤立资料页。

### 4. traceability 不再是零散信息，而已经形成独立组合层

当前仓库已经有独立的：

- `features/traceability/hooks`
- `features/traceability/lib`
- `features/traceability/types`
- `features/traceability/components`

而且 traceability 现在已经被接进：

- Scene inspector
- Chapter draft inspector / reader signals
- Asset mentions / summary

PR10 不应该回头重做这条桥，而应该在它之上继续往上抬升对象轴。

### 5. 当前真正缺的，是第四个对象层级：Book

虽然项目定位和 README 长期都把对象轴定义成：

- Book
- Chapter
- Scene
- Asset

但当前代码里还没有：

- `features/book`
- `scope='book'`
- `BookWorkbench`
- `Book / Structure` 工作面

也就是说，**对象轴里唯一还没有真正落地的一级对象，就是 Book。**

### 6. 现在已经有足够多的底层数据可以支撑 Book

这一步现在做，风险已经比 PR7 / PR8 之前低很多，因为当前 mock 层已经有：

- 多个 chapter record
- 多组 scene fixture
- 现成的 scene prose query
- 现成的 traceability composition

特别是当前 chapter mock db 已经不只一章，而是至少已有两章，可以支撑 Book 层第一版的 chapter aggregation，而不是只能做一个空壳总览页。

---

## 二、PR10 的唯一目标

**把 Book 作为第四个 scope 正式接进 workbench，并先做成 `lens='structure'` 的 read-heavy workspace。**

PR10 完成后，用户应该能：

1. 在 workbench 中进入 `scope='book'`
2. 在 `Book / Structure` 中看到 book 内 chapter 的显式顺序
3. 用 book 级视图查看每章的：
   - scene 数量
   - unresolved 压力
   - draft 覆盖情况
   - traceability 覆盖情况
4. 在 navigator / stage / inspector / dock 之间围绕同一个 **selected chapter** 同步聚焦
5. 从 Book 平滑打开 Chapter / Structure 或 Chapter / Draft
6. 使用浏览器历史返回 Book，并恢复原来的：
   - `scope='book'`
   - `view`
   - `selectedChapterId`

一句话说：

**PR10 要证明这个 workbench 的对象轴，终于从 `scene + chapter + asset` 扩展到完整的 `book + chapter + scene + asset`。**

---

## 三、本轮明确不做

为了让 PR10 保持“窄而实”，以下内容不要混进来：

- 不做 `book` 的 `draft` lens
- 不做 full manuscript / assembled manuscript / publish
- 不做 chapter reorder at book level
- 不做 part / section / volume 体系
- 不做 chapter create / delete / move between books
- 不做 branch / compare / publish
- 不做 asset graph / backlinks overhaul
- 不做 book 级 AI orchestration
- 不做跨 book / series 管理
- 不做 command palette / global navigation 重构
- 不做全局 rail 系统统一重构

PR10 的定位必须非常明确：

**Book / Structure foundation，而不是 Book 全功能系统。**

---

## 四、必须遵守的硬约束

### 4.1 Book 的 selected chapter 仍然必须由 route 驱动

不要新增：

- `selectedBookChapterId` store
- navigator 本地 active chapter 真源
- stage / inspector / dock 各自维护不同的 selected chapter

统一规则：

- Book 当前选中 chapter 来源于 `route.selectedChapterId`
- `workspace.selectedChapterId` 只是派生结果
- 点击 navigator chapter：`patchBookRoute({ selectedChapterId })`
- 点击 sequence card / outliner row / signals row：`patchBookRoute({ selectedChapterId })`

### 4.2 不打破现有 scene / chapter / asset 的 query identity

PR10 不应该为了 Book 去改动这些已有约束：

- `sceneQueryKeys.*`
- `chapterQueryKeys.workspace(chapterId)`
- `assetQueryKeys.workspace(assetId, locale)`
- PR9 已经建立好的 traceability query 组合方式

Book 应该是**建立在现有 query 之上的上层组合**，而不是回头把下面三层重写一遍。

### 4.3 Book 第一版必须是 read-only

不要在 PR10 里加入：

- chapter reorder from book
- book metadata edit
- inline edit chapter summary
- traceability fix actions

PR10 先只验证：

- 对象层级是否成立
- 数据聚合是否成立
- handoff / restore 是否成立

### 4.4 不新增新的 traceability runtime capability

PR9 已经证明：

- `scene execution`
- `scene prose`
- `scene inspector`
- `patch preview`

再加上 `features/traceability` 的组合层，已经足以支撑来源链。

PR10 不应该为了 Book 再新增：

- `getBookTraceability()`
- `getChapterRollupTraceability()`
- 新的 preload bridge 能力

正确做法是：

**复用现有 scene / chapter / traceability 数据，在 hook 内做 rollup。**

### 4.5 不做 mode rail 大一统重构

当前代码里：

- scene scope 的 rail 仍在 `App.tsx`
- chapter 有 `ChapterModeRail.tsx`
- asset 有 `AssetModeRail.tsx`

PR10 不要顺手把整个 rail 系统抽成全局统一框架。

正确做法是：

- 在 scene rail 上最小扩 scope 按钮
- 在 chapter / asset rail 上最小增加 `book`
- 为 book 新增自己的 `BookModeRail.tsx`

### 4.6 `useBookStructureWorkspaceQuery` 不要在 loop 里套用复杂上层 hook

本轮不要在 Book hook 中对每一章直接循环调用：

- `useChapterDraftTraceabilityQuery(...)`
- `useChapterDraftWorkspaceQuery(...)`

这会很容易让 PR10 的 hook 层变成嵌套瀑布。

更合理的做法是：

1. 先拿 book record
2. 再批量拿 chapter structure workspace
3. 再把所有 sceneId 扁平化
4. 复用：
   - `scene prose` queries
   - `useTraceabilitySceneSources(sceneIds, ...)`
5. 最后在 pure mapper 中按 chapter 回卷成 book-level metrics

也就是说：

**Book 的聚合应该以 scene 为最小事实，再 roll up 到 chapter，而不是一层层嵌套 chapter hooks。**

---

## 五、路由与壳子改法

## 5.1 `workbench-route.ts`

当前 route 只覆盖：

- `scene`
- `chapter`
- `asset`

PR10 应扩成：

```ts
export type BookLens = 'structure'
export type BookStructureView = 'sequence' | 'outliner' | 'signals'

export type WorkbenchScope = 'scene' | 'chapter' | 'asset' | 'book'

export interface BookRouteState {
  scope: 'book'
  bookId: string
  lens: BookLens
  view: BookStructureView
  selectedChapterId?: string
}
```

### 为什么 `selectedChapterId` 值得单独显式保留

因为它要承担和 Chapter 当前 `sceneId` 类似的角色：

- 作为 Book 内部唯一选中态真源
- 支撑 deep link / refresh restore
- 支撑 `book -> chapter -> back` 的恢复

### 为什么第一版只给 `book` 一个 lens

因为 PR10 的核心目标是把 **Book 作为对象层级接进来**。

现在最值得验证的是：

- Book 的对象身份
- Book 的 route restore
- Book 的 chapter aggregation
- Book -> Chapter handoff

不是 Book 的多 lens。

## 5.2 `useWorkbenchRouteState.ts`

要做的事：

1. `WorkbenchSearchState` 增加 `book`
2. 新增：
   - `DEFAULT_BOOK_ID`
   - `VALID_BOOK_LENSES`
   - `VALID_BOOK_VIEWS`
3. 新增：
   - `normalizeBookRoute(...)`
   - `readBookSnapshot(...)`
4. `buildWorkbenchSearch(...)` 支持 `scope='book'`
5. 暴露 `patchBookRoute(...)`
6. `replaceRoute(...)` 支持 `scope='book'`
7. `CANONICAL_ROUTE_KEYS` 增加 `selectedChapterId`
8. inactive scope snapshot 恢复逻辑扩展到四 scope

### 推荐 URL 形态

```text
?scope=book&id=book-signal-arc&lens=structure&view=outliner&selectedChapterId=chapter-open-water-signals
```

### 必须保留的行为

- 从 scene / chapter / asset 切到 book 时，不抹掉其他 scope 的 dormant snapshot
- 从 book 打开 chapter，再 browser back 时，恢复 book 原来的：
  - `view`
  - `selectedChapterId`
- refresh / direct deep link 仍然成立

## 5.3 `App.tsx`

当前 App 顶层已经分发：

- `SceneWorkbench`
- `ChapterWorkbench`
- `AssetWorkbench`

PR10 后应改成：

- `SceneWorkbench`
- `ChapterWorkbench`
- `AssetWorkbench`
- `BookWorkbench`

### 推荐新增

- `packages/renderer/src/features/book/containers/BookWorkbench.tsx`

它第一版可以很轻，只负责：

- 读取 route
- 当前只分发到 `BookStructureWorkspace`

### 为什么值得单独加一层 `BookWorkbench`

因为从 PR10 开始，Book 终于成为一级对象。

即使当前只支持 `structure`，也应该让 Book 拥有自己的 scope-level 所有权位置，而不是把 `BookStructureWorkspace` 直接塞进 `App.tsx`。

---

## 六、数据层与 query 设计

## 6.1 新增 `features/book` 骨架

推荐新增：

```text
packages/renderer/src/features/book/
  api/
  components/
  containers/
  hooks/
  lib/
  types/
```

这样与当前：

- `chapter`
- `asset`
- `scene`

的 feature 组织方式保持一致。

## 6.2 Book record 第一版必须保持很薄

不要一上来就在 `book` record 里重复存整份 chapter summary / metrics / traceability。

第一版 `book` record 只需要拥有：

- `bookId`
- `title`
- `summary`
- `chapterIds`（显式顺序）
- `viewsMeta?.availableViews`

例如：

```ts
interface BookStructureRecord {
  bookId: string
  title: LocalizedText
  summary: LocalizedText
  chapterIds: string[]
  viewsMeta?: {
    availableViews: BookStructureView[]
  }
}
```

### 为什么要保持薄 record

因为 Book 第一版的价值不在于“自带很多数据”，而在于：

**把已经存在于 chapter / scene / traceability 的事实聚合成更上层的对象工作面。**

## 6.3 mock book db 第一版只需要一册书

推荐新增：

- `api/book-records.ts`
- `api/mock-book-db.ts`
- `api/book-client.ts`

### seed 第一版建议

新增一个默认 book，挂接当前已经存在的两章：

- `chapter-signals-in-rain`
- `chapter-open-water-signals`

第一版不要再扩更多 book seed。

### 为什么这一点现在成立

因为当前 chapter mock db 已经拥有多章数据，scene fixtures 也已覆盖对应 scene，所以 Book 不需要从零发明大量新 fixture 才能开始。

## 6.4 client contract 应保持只读

第一版 `bookClient` 只暴露：

```ts
interface BookClient {
  getBookStructureRecord(input: { bookId: string }): Promise<BookStructureRecord | null>
}
```

不要在 PR10 里引入：

- `updateBook(...)`
- `reorderBookChapters(...)`
- `createBookChapter(...)`

## 6.5 `useBookStructureWorkspaceQuery.ts` 应该是组合型 hook

这将是 PR10 最值钱的 hook。

### 推荐职责

1. 先读取 book record
2. 按 `chapterIds` 顺序批量读取 chapter structure workspace
3. 从各 chapter workspace 扁平化出全书所有 sceneId
4. 批量读取这些 scene 的 prose query
5. 复用 `useTraceabilitySceneSources(sceneIds, ...)`
6. 在 hook 内或 pure mappers 中派生：
   - per-chapter metrics
   - book totals
   - selected chapter inspector
   - dock summary

### 推荐使用的数据来源

#### 上游 1：book record

提供：

- `bookId`
- `title`
- `summary`
- ordered `chapterIds`
- `availableViews`

#### 上游 2：chapter structure workspace

提供：

- `chapterId`
- `title`
- `summary`
- `scenes`
- `inspector.problemsSummary`
- `inspector.assemblyHints`

#### 上游 3：scene prose query

提供：

- `proseDraft`
- `draftWordCount`
- `statusLabel`
- `revisionQueueCount`
- `warningsCount`

#### 上游 4：traceability scene sources

提供：

- trace completeness
- accepted facts presence
- related assets presence
- missing links

### 关键纪律

不要为了 Book 再去造一套 giant workspace client。

正确做法是：

- `bookClient` 只管 book identity
- `useBookStructureWorkspaceQuery` 组合 chapter + scene + traceability

这样最符合当前代码已经建立的模式。

---

## 七、推荐的 view-model

## 7.1 `BookStructureChapterViewModel`

至少应包含：

- `chapterId`
- `order`
- `title`
- `summary`
- `sceneCount`
- `unresolvedCount`
- `draftedSceneCount`
- `missingDraftCount`
- `assembledWordCount`
- `warningsCount`
- `queuedRevisionCount`
- `tracedSceneCount`
- `missingTraceSceneCount`
- `primaryProblemLabel?`
- `primaryAssemblyHintLabel?`
- `coverageStatus: 'ready' | 'attention' | 'missing'`

## 7.2 `BookStructureWorkspaceViewModel`

至少应包含：

- `bookId`
- `title`
- `summary`
- `selectedChapterId`
- `chapters: BookStructureChapterViewModel[]`
- `selectedChapter`
- `viewsMeta`
- `totals`
- `inspector`
- `dockSummary`

### `totals` 建议包含

- `chapterCount`
- `sceneCount`
- `unresolvedCount`
- `draftedSceneCount`
- `missingDraftCount`
- `tracedSceneCount`
- `missingTraceSceneCount`
- `assembledWordCount`
- `warningsCount`

## 7.3 `BookStructureInspectorViewModel`

建议第一版固定为三块数据：

### A. `Selected chapter`

- title
- summary
- scene count
- unresolved count
- drafted / missing draft
- traced / missing trace
- warnings / queued revisions

### B. `Book overview`

- chapter count
- scene count
- unresolved total
- drafted total
- missing trace total
- assembled word count

### C. `Risk highlights`

- 取全书最值得关注的 chapter-level risk 列表
- 来源优先：
  - chapter problems
  - missing draft
  - missing trace

## 7.4 `BookDockSummaryViewModel`

建议提供：

### Problems

- chapters missing draft
- chapters missing trace
- chapters with highest unresolved
- chapters with warnings / queued revisions

### Activity

用于承接 session activity：

- entered book
- switched view
- focused chapter
- opened chapter structure
- opened chapter draft

---

## 八、组件与容器职责拆分

## 8.1 `BookWorkbench.tsx`

### 职责

- book scope dispatch container
- 当前只分发 `BookStructureWorkspace`
- 为未来的 Book Draft / Publish 留出所有权位置

## 8.2 `BookStructureWorkspace.tsx`

这是 PR10 的主容器。

### 职责

1. 读取 `route`
2. 调用 `useBookStructureWorkspaceQuery(...)`
3. 用 `patchBookRoute(...)` 更新：
   - `view`
   - `selectedChapterId`
4. 提供 `openChapterFromBook(...)` helper
5. 通过 `WorkbenchShell` 组装五个表面

### `openChapterFromBook(...)` 建议支持两个入口

- `Open in Structure`
- `Open in Draft`

对应行为：

- `scope='chapter'`
- `chapterId=当前选中 chapter`
- `lens='structure' | 'draft'`
- structure 默认 `view='sequence'`
- draft 默认不写 `sceneId`，让 chapter 自己 fallback

## 8.3 `BookModeRail.tsx`

### 职责

- scope buttons：`scene / chapter / asset / book`
- lens button：`Structure`

### 纪律

- 不做全局 rail 重构
- 不把 Chapter / Asset rail 顺手重写成通用组件

## 8.4 `BookNavigatorPane.tsx`

### 职责

- 左侧 chapter navigator
- 显示 book 内 chapter 的显式顺序
- 高亮当前 `selectedChapterId`

### 每个 item 至少显示

- order
- title
- scene count
- unresolved count
- missing draft / missing trace 的轻量 signal

### 交互

- 主点击：`onSelectChapter(chapterId)`
- 次级动作：
  - `Open in Structure`
  - `Open in Draft`

### 不做

- 不做 drag reorder
- 不做 inline edit
- 不做 chapter create/delete

## 8.5 `BookStructureStage.tsx`

这是 Book 的 stage switchboard。

### 职责

- 提供 `Sequence / Outliner / Signals` view switcher
- 根据 route.view 切换主舞台

### 规则

- `sequence` -> `BookSequenceView`
- `outliner` -> `BookOutlinerView`
- `signals` -> `BookSignalsView`

### 纪律

- view 只由 route 驱动
- stage 自己不再持有第二真源

## 8.6 `BookSequenceView.tsx`

### 职责

- 让用户按显式 chapter 顺序扫描全书结构
- 首先回答“这本书的章节顺序和当前压力分布是什么”

### 每张 chapter card 至少显示

- order
- title
- summary
- scene count
- unresolved
- drafted / missing draft
- traced / missing trace

### 交互

- 点击 card：选中 chapter
- 次级动作：
  - `Open in Structure`
  - `Open in Draft`

## 8.7 `BookOutlinerView.tsx`

### 职责

- 提供更高密度的 chapter-level 对比
- 让用户在 book 层快速比较每章 readiness / trace / unresolved

### 推荐字段

- order
- title
- scene count
- unresolved count
- drafted scene count
- missing draft count
- traced scene count
- missing trace count
- warnings count
- queued revision count
- assembled word count
- primary problem

### 纪律

- 密度必须明显高于 Sequence
- 不做 table editor
- 不做 inline mutation

## 8.8 `BookSignalsView.tsx`

这是 PR10 区别于“只是 chapter list”的关键视图。

### 职责

把 PR9 已经建立的 traceability / readiness / pressure，在 book 层做一次**轻量聚合**。

### 第一版建议只做轻量 matrix / grouped list，不做图表项目

每章至少显示三组信号：

#### A. Structure pressure
- unresolved count
- problem count

#### B. Draft readiness
- drafted scenes
- missing draft scenes
- warnings / queued revisions

#### C. Trace coverage
- traced scenes
- missing trace scenes

### 交互

- 点击 signals row：选中 chapter
- 保留 chapter handoff 次级动作

### 不做

- 不做热力图库
- 不做 chart library 引入
- 不做 full manuscript compare

## 8.9 `BookInspectorPane.tsx`

### 职责

右侧继续只做 supporting judgment。

### 第一版建议固定两到三个区域

#### A. `Selected Chapter`
- title
- summary
- draft / trace / unresolved metrics
- top risk

#### B. `Book Overview`
- totals
- current active view
- selected chapter position

#### C. `Readiness Signals`
- current selected chapter 缺稿 / 缺 trace / warnings 提示

### 不做

- 不做编辑表单
- 不做正文阅读主视图
- 不做复杂 breadcrumb builder

## 8.10 `BookBottomDock.tsx` + `BookDockContainer.tsx`

### 职责

让 Book 也占满五个 workbench 表面。

### 第一版建议两块

#### Problems
- missing draft chapters
- missing trace chapters
- unresolved highest chapters
- warning-heavy chapters

#### Activity
- entered book
- switched view
- selected chapter
- opened chapter structure / draft

### 纪律

- dock 只做 supporting information
- 不做第二主舞台
- 不做 runtime trace 大面板

## 8.11 `useBookWorkbenchActivity.ts`

### 职责

记录 session-local activity，用于 bottom dock 展示。

### 推荐事件类型

- `view`
- `chapter`
- `handoff`

### 纪律

activity 只读展示，不反向控制：

- 当前 selected chapter
- 当前 active view

---

## 九、推荐的文件改动

## 9.1 新增

```text
packages/renderer/src/features/book/api/book-records.ts
packages/renderer/src/features/book/api/mock-book-db.ts
packages/renderer/src/features/book/api/book-client.ts
packages/renderer/src/features/book/components/BookModeRail.tsx
packages/renderer/src/features/book/components/BookNavigatorPane.tsx
packages/renderer/src/features/book/components/BookStructureStage.tsx
packages/renderer/src/features/book/components/BookSequenceView.tsx
packages/renderer/src/features/book/components/BookOutlinerView.tsx
packages/renderer/src/features/book/components/BookSignalsView.tsx
packages/renderer/src/features/book/components/BookInspectorPane.tsx
packages/renderer/src/features/book/components/BookBottomDock.tsx
packages/renderer/src/features/book/containers/BookWorkbench.tsx
packages/renderer/src/features/book/containers/BookStructureWorkspace.tsx
packages/renderer/src/features/book/containers/BookDockContainer.tsx
packages/renderer/src/features/book/hooks/book-query-keys.ts
packages/renderer/src/features/book/hooks/useBookStructureWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookWorkbenchActivity.ts
packages/renderer/src/features/book/lib/book-workspace-mappers.ts
packages/renderer/src/features/book/types/book-view-models.ts
```

## 9.2 修改

```text
packages/renderer/src/App.tsx
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/chapter/components/ChapterModeRail.tsx
packages/renderer/src/features/asset/components/AssetModeRail.tsx
scene rail（当前在 App.tsx 内）
app i18n 文案
```

## 9.3 这一轮尽量不动

```text
packages/renderer/src/features/chapter/** 的 mutation 逻辑
packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts
packages/renderer/src/features/traceability/** 的核心组合逻辑
packages/renderer/src/features/asset/** 的主容器与 query identity
packages/renderer/src/features/scene/** 的主容器与 query identity
```

PR10 的任务是新增 Book，不是重做前三个 scope。

---

## 十、测试补齐方案

## 10.1 route 测试

至少补：

1. `scope='book'` 能被正确读写
2. `lens='structure'` 能被正确规范化
3. `view='sequence' | 'outliner' | 'signals'` 能被正确读写
4. `selectedChapterId` 能被正确读写
5. 从 book 切回 scene / chapter / asset 时，inactive snapshot 保持
6. 从其他 scope 切回 book 时，book 的 dormant snapshot 能恢复

## 10.2 pure mapper / derivation 测试

建议新增：

- `book-workspace-mappers.test.ts`

至少覆盖：

1. chapter 顺序严格遵守 book record 的 `chapterIds`
2. scene count / unresolved count 聚合正确
3. drafted / missing draft 聚合正确
4. traced / missing trace 聚合正确
5. totals 聚合正确
6. `selectedChapterId` 缺失时 fallback 到首章
7. primary problem / status summary 派生正确

## 10.3 `useBookStructureWorkspaceQuery.test.ts`

至少覆盖：

1. book record + chapter workspaces 能组合成功
2. scene prose queries 被正确纳入 chapter metrics
3. traceability scene sources 能被正确 roll up 到 chapter
4. `selectedChapterId` 缺失时 fallback 正确
5. loading / error / null book 状态正确

## 10.4 组件测试

### `BookNavigatorPane.test.tsx`
- 选中态正确
- 点击 chapter 会触发 `onSelectChapter`
- `Open in Structure` / `Open in Draft` 可触发

### `BookSequenceView.test.tsx`
- chapter cards 按顺序渲染
- 点击 card 会触发选择
- selected card 高亮正确

### `BookOutlinerView.test.tsx`
- 高密度字段渲染正确
- row selection 正确
- 次级动作可用

### `BookSignalsView.test.tsx`
- draft / trace / pressure 三组 signals 正确显示
- selected row 跟 route 同步

### `BookInspectorPane.test.tsx`
- Selected Chapter / Book Overview / Readiness Signals 三块成立

### `BookBottomDock.test.tsx`
- Problems / Activity 正确显示
- activity 不成为第二真源

## 10.5 `BookStructureWorkspace.test.tsx`

建议做一条完整路径：

```text
打开 ?scope=book&id=book-signal-arc&lens=structure&view=outliner&selectedChapterId=chapter-open-water-signals
-> navigator / outliner / inspector / dock 同步聚焦 Open Water Signals
-> 切到 signals
-> 点击 Open in Draft
-> 进入 chapter draft
-> browser back
-> 回到 book scope + signals + 原 selectedChapterId
```

这条测试能同时固定：

- route deep link
- view restore
- selected chapter restore
- book -> chapter handoff
- browser back 恢复

## 10.6 `App.test.tsx`（推荐）

至少再补两条 smoke：

### A. scene snapshot survives a book switch

```text
打开 scene orchestrate
-> 切到 book
-> 再切回 scene
-> 原 scene lens/tab 恢复
```

### B. asset/chapter snapshots survive while book is added

```text
先进入 asset 或 chapter
-> 切到 book
-> 再返回原 scope
-> 原 scope snapshot 不乱
```

这两条 smoke 的价值很高，因为它们能证明：

**PR10 在引入第四个 scope 后，没有打坏前面三条已经成立的 snapshot / restore 心智。**

---

## 十一、Storybook 建议

推荐至少新增：

- `BookNavigatorPane.stories.tsx`
- `BookSequenceView.stories.tsx`
- `BookOutlinerView.stories.tsx`
- `BookSignalsView.stories.tsx`
- `BookInspectorPane.stories.tsx`
- `BookBottomDock.stories.tsx`
- `BookStructureWorkspace.stories.tsx`（若允许 page story）

### 最少 story 组合

- `Default`
- `SelectedSecondChapter`
- `SignalsHeavy`
- `QuietBook`
- `MissingTraceAttention`

---

## 十二、实施顺序（给 AI 的执行顺序）

### Step 1
先扩 route：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`
- 加入 `book` scope
- 加入 `BookRouteState`
- 加入 `selectedChapterId`
- 保持 dormant snapshot 恢复规则

### Step 2
新增 `features/book` 骨架：

- `api`
- `hooks`
- `types`
- `lib`
- `components`
- `containers`

### Step 3
先做薄 book record + client：

- `book-records.ts`
- `mock-book-db.ts`
- `book-client.ts`

只让它承载：

- book identity
- ordered chapter ids
- available views

### Step 4
先写 pure mappers：

- `book-workspace-mappers.ts`
- 对 scene / chapter / traceability 的 rollup 逻辑先写纯函数
- 先补 mapper 单测

### Step 5
实现 `useBookStructureWorkspaceQuery.ts`：

- 先拿 book record
- 再批量拿 chapter structure workspace
- 再批量拿 scene prose
- 再复用 `useTraceabilitySceneSources(...)`
- 最后派生 book workspace view-model

### Step 6
实现 Book 主舞台：

- `BookSequenceView`
- `BookOutlinerView`
- `BookSignalsView`
- `BookStructureStage`

### Step 7
实现 supporting surfaces：

- `BookNavigatorPane`
- `BookInspectorPane`
- `BookBottomDock`
- `BookDockContainer`
- `useBookWorkbenchActivity`

### Step 8
实现 scope-level 容器：

- `BookStructureWorkspace`
- `BookWorkbench`
- `openChapterFromBook(...)`
- 让 Book 真正占满五个表面

### Step 9
修改顶层接线：

- `App.tsx` 增加 `BookWorkbench`
- scene rail 增加 `book`
- chapter rail 增加 `book`
- asset rail 增加 `book`

### Step 10
补 tests 与 stories：

- route
- mapper
- query
- workspace 集成
- app smoke
- stories

---

## 十三、完成后的验收标准

满足以下条件，PR10 就算完成：

1. `WorkbenchScope` 已支持 `book`
2. workbench 顶层已能进入 book scope
3. book route 支持：
   - `lens='structure'`
   - `view='sequence' | 'outliner' | 'signals'`
   - `selectedChapterId?`
4. Book 现在有完整五面 workbench
5. navigator / stage / inspector / dock 围绕同一个 `route.selectedChapterId` 同步
6. Book 能按显式 chapter order 显示章节
7. Book 能聚合 chapter-level unresolved / draft / traceability signals
8. Book 可以最小 handoff 到 Chapter / Structure 与 Chapter / Draft
9. browser back 能恢复 book 当前 view 与 selected chapter
10. scene / chapter / asset 现有 smoke 不被破坏
11. PR10 不包含 book draft / mutation / compare / publish

---

## 十四、PR10 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了 selected chapter，新造了第二真源 store
- 为了 Book 聚合，复制了一整套 chapter data 到 book seed
- 为了 trace rollup，新造了新的 runtime bridge capability
- Book signals 变成图表项目或 dashboard 首页
- 顺手把 rail 系统全局统一重构
- 顺手把 Book Draft / Publish 也做进去
- 直接在 Book 里开始做 chapter reorder / mutation
- 通过循环调用高层 hook 造成 query / hook 嵌套失控
- 因为加入 Book 而破坏 scene / chapter / asset 的 dormant snapshot 恢复

PR10 做完后，正确的项目状态应该是：

**对象轴终于完整接齐到了 Book，但仍然保持 read-heavy、route-first、workbench-first 的纪律。**

---

## 十五、给 AI 的最终一句话指令

在当前 `codex/pr9-canon-traceability-bridge` 已经完成 PR9 的前提下，不要继续抛光 traceability surfaces，也不要提前做 publish / compare / book draft；先只围绕 **Book Structure Workspace** 做一轮窄而实的实现：

- 把 `book` 作为第四个 scope 接进 workbench
- 只给 Book 第一版 `lens='structure'`
- 用一个很薄的 book record 挂接当前已有 chapter 数据
- 通过组合 chapter structure workspace、scene prose queries 和 `useTraceabilitySceneSources(...)` 派生 book-level chapter metrics
- 在 Book 中提供 `Sequence / Outliner / Signals` 三种 chapter-level 视图
- 用 `route.selectedChapterId` 统一 navigator / stage / inspector / dock 的选中态
- 提供最小的 `Book -> Chapter Structure / Draft` handoff
- 保持浏览器 back / dormant snapshot 恢复成立
- 不做 book mutation、book draft、publish、compare、global rail 重构
- 用测试固定 route 不变、query identity 不变、四 scope snapshot 恢复不变这三条硬约束
