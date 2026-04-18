# PR11 执行文档（基于 `codex/pr10-book-structure-workspace` 当前实际代码）

## 这份文档的目的

这不是路线图回顾，也不是大而全 wishlist。

这是一份 **基于当前 `codex/pr10-book-structure-workspace` 分支真实代码状态** 整理出来的、可以直接交给 AI agent 实施的 PR11 指令文档。

PR11 的任务，不是继续抛光 PR10 已经完成的 `Book / Structure` 三视图，也不是提前进入 `Compare / Publish / Branch`。本轮更合适的目标是：

**把 Book 从“只有 Structure 的对象”推进成“真正拥有第二条 lens 的对象”，并先做成 read-first 的 `Book / Draft`（manuscript assembly）工作面。**

一句话判断：

**PR10 已经把 Book 接进了对象轴；PR11 应该把 Book 接进工作轴。**

---

## 一、先确认当前代码基线

下面这些判断，必须建立在当前分支已经存在的代码事实上，而不是沿用 PR10 之前的假设。

### 1. workbench 对象轴已经接齐到四个 scope

当前 route 类型已经包含：

- `scene`
- `chapter`
- `asset`
- `book`

这说明对象轴已经不再缺一级对象；缺的是某些对象还没有兑现 multi-lens。

### 2. Chapter 已经兑现了 multi-lens，但 Book 还没有

当前 `ChapterRouteState` 已支持：

- `lens='structure' | 'draft'`

而 `BookRouteState` 仍然只有：

- `lens='structure'`
- `view='sequence' | 'outliner' | 'signals'`
- `selectedChapterId?`

所以，**Book 现在还是“单 lens 对象”**。

### 3. `BookWorkbench` 目前仍只分发到 `BookStructureWorkspace`

当前 `BookWorkbench.tsx` 只做了一件事：

- 当 `route.scope === 'book'` 时，直接返回 `BookStructureWorkspace`

这意味着从 scope-level ownership 来看，Book 还没有像 Chapter 那样形成真正的 lens dispatch。

### 4. PR10 已经为 Book Draft 准备好了最关键的基础数据

当前 `useBookStructureWorkspaceQuery(...)` 已经不是一个“空壳 hook”。它已经会：

1. 先读取 `book record`
2. 再按 `chapterIds` 拉取 chapter structure workspace
3. 再按 chapter scene order 拉取各个 scene 的 prose query
4. 再复用 `useTraceabilitySceneSources(...)`
5. 最终把这些信息 roll up 成 chapter-level metrics

也就是说，PR10 已经把 Book/Draft 最难的几件“底层拼装”先做了一半：

- chapter 显式顺序
- scene prose 覆盖统计
- traceability 覆盖统计
- selected chapter route 驱动

### 5. Book 现在已经能 handoff 到 Chapter / Structure 与 Chapter / Draft

当前 `BookStructureWorkspace.tsx` 已经提供：

- `Open in Structure`
- `Open in Draft`

并把 handoff 目标落到 `scope='chapter'`。这意味着 Book 与 Chapter 的上下一层工作流已经连上了。

### 6. PR10 的 app / route / restore smoke 已经成立

当前 app 级测试已经覆盖：

- book 直达 deep link + refresh 恢复
- scene -> book -> scene 的 dormant snapshot 恢复
- chapter / asset 在加入 book 第四个 scope 后仍能恢复各自 snapshot

所以 PR11 不需要回头重做 Book 接入本身，而应该建立在这个稳定壳子上继续前进。

---

## 二、为什么 PR11 不该先做 Compare / Publish / Branch

从项目节奏上看，很多人会直觉认为：

> “Book 既然已经进来了，那下一步是不是应该直接做 compare / publish？”

我不建议这样排。

### 原因 1：当前还没有 Book 自己的 draft 工作面

现在的 Book 只有：

- `Structure`

还没有：

- `Draft`
- 连续阅读的 manuscript surface
- book-level prose inspector

如果现在直接做 compare / publish，会出现一个很不自然的状态：

- 用户还不能在 Book 自己的主工作面里阅读组装后的稿子
- 却要先进入 compare / export / publish

这会让产品顺序倒过来。

### 原因 2：PR10 已经把“结构聚合”做成了，但还没有把“稿件聚合”做成

当前 `useBookStructureWorkspaceQuery(...)` 已经把：

- chapter workspace
- scene prose count
- trace coverage

聚合成了 book-level signals。

下一步最自然的延伸，不是把这些数值直接推去 compare/publish，而是**先把真正的 manuscript 读面做出来**。

### 原因 3：Book/Draft 是把对象轴与工作轴真正闭环的关键一步

当前对象轴状态是：

- Scene：`structure / orchestrate / draft`
- Chapter：`structure / draft`
- Asset：`knowledge`
- Book：`structure`

PR11 应优先把 Book 也推进到：

- `structure / draft`

这样整个上层阅读 / 成稿路径才开始完整。

---

## 三、PR11 的唯一目标

**把 Book 从“只有 Structure 的对象”，推进成“真正拥有第二条 lens 的对象”，并且第一版只做 read-first 的 `Book / Draft`。**

PR11 完成后，用户应该能：

1. 在 `scope='book'` 下切到 `lens='draft'`
2. 看到按 book chapter order 组装出来的连续 manuscript 阅读流
3. 用 `route.selectedChapterId` 驱动 navigator / reader / inspector / dock 的统一聚焦
4. 从 Book Draft 打开 `Chapter / Draft` 或 `Chapter / Structure`
5. 浏览器 back 返回 Book Draft 时，恢复：
   - `scope='book'`
   - `lens='draft'`
   - `selectedChapterId`
6. 从 Book Draft 切回 Book Structure 时，恢复原来的 dormant `view`

一句话说：

**PR11 要让 Book 也变成一个真正的 multi-lens object，而不是停留在 chapter rollup dashboard。**

---

## 四、本轮明确不做

为了让 PR11 保持“窄而实”，以下内容不要混进来：

- 不做 `book compare`
- 不做 `book publish`
- 不做 `book export modal`
- 不做 branch / merge / alt manuscript
- 不做 book mutation
- 不做 chapter reorder from book
- 不做 part / volume / section 体系
- 不做 scene 级 route anchor 注入到 book
- 不做全局 rail 重构
- 不做新的 runtime bridge capability
- 不做 asset editor / asset mutation
- 不做 graph-first manuscript context

PR11 的定位必须明确为：

**Book Draft Lens（read-first manuscript assembly）**

而不是 “Book Draft + Compare + Publish” 三件事一起做。

---

## 五、必须遵守的硬约束

### 5.1 `route.selectedChapterId` 仍然是 Book 内唯一选中态真源

不要新增：

- `selectedBookChapterId` store
- reader 自己的 active chapter 真源
- inspector / dock 各自维护不同的 selected chapter

统一规则：

- 当前 Book 内聚焦对象来源于 `route.selectedChapterId`
- `workspace.selectedChapterId` 只是派生结果
- 点击 binder chapter：`patchBookRoute({ selectedChapterId })`
- 点击 draft reader 中的 chapter section：`patchBookRoute({ selectedChapterId })`

### 5.2 `view` 仍然只服务 structure，但必须被保留

和 Chapter 的做法一样，PR11 正确做法不是删掉 Book route 里的 `view`，而是：

- 当 `lens='structure'` 时继续使用 `view`
- 当 `lens='draft'` 时忽略 `view`，但保留它

这样用户从 Draft 切回 Structure 时，仍能回到原来的：

- `sequence`
- `outliner`
- `signals`

### 5.3 Book client 仍保持很薄，不新增 giant workspace client

PR11 不要为了 Book Draft 去发明：

- `getBookDraftWorkspace()`
- `getBookManuscript()`
- `getBookCompareData()`

正确做法仍然是：

- `bookClient` 只承载 book identity
- Draft lens 通过组合 chapter / scene / traceability 数据派生

### 5.4 不在 loop 中调用高层 composed hook

不要在 Book Draft hook 里对每个 chapter 直接循环调用：

- `useChapterDraftWorkspaceQuery(...)`

因为这会让 hook 关系迅速变复杂且不可控。

正确做法应该是：

1. 抽出一层 **book 共享 source hook**
2. 统一拿到：
   - book record
   - ordered chapter workspaces
   - ordered scene prose
   - traceability rollups
3. 再分别映射成：
   - structure workspace view-model
   - draft workspace view-model

### 5.5 不新增 scene 级 route 参数到 Book

PR11 第一版不要往 book route 里塞：

- `sceneId`
- `selectedSectionId`
- `chunkId`
- `compareMode`

原因很简单：

当前 Book 路由已经有一个很自然的选中对象——`selectedChapterId`。

PR11 第一版的 draft 主体是 **chapter-level manuscript reading**，不是 scene anchor tooling。

### 5.6 继续复用现有 Book -> Chapter handoff，不直接扩成 Book -> Scene 主路径

当前 Book 已经有：

- `Open in Structure`
- `Open in Draft`

而且目标都是 `chapter`。

PR11 不要把主 handoff 改成 Book -> Scene。

更合理的纪律是：

- Book 负责 chapter-level manuscript orchestration
- 更细粒度的 scene 处理继续在 Chapter / Draft 与 Scene 内完成

---

## 六、路由与 scope-level 所有权改法

## 6.1 `workbench-route.ts`

把：

```ts
export type BookLens = 'structure'
```

扩成：

```ts
export type BookLens = 'structure' | 'draft'
```

`BookRouteState` 继续保持：

```ts
export interface BookRouteState {
  scope: 'book'
  bookId: string
  lens: BookLens
  view: BookStructureView
  selectedChapterId?: string
}
```

### 关键纪律

- `selectedChapterId` 保留不变
- `view` 保留不变
- 本轮不新增其他 route 参数

## 6.2 `useWorkbenchRouteState.ts`

要做的事：

1. `VALID_BOOK_LENSES` 从 `['structure']` 扩成 `['structure', 'draft']`
2. `normalizeBookRoute(...)` 允许 `lens='draft'`
3. `buildWorkbenchSearch(...)` 正确写入 Book 的真实 lens
4. `patchBookRoute(...)` 继续保持当前 API，不新增 draft 专用 patch hook

### 必须保留的行为

- dormant `view` 在 `lens='draft'` 时保留
- refresh / direct deep link 可恢复
- scene / chapter / asset / book 四个 scope 的 dormant snapshot 规则不被打坏

## 6.3 `BookWorkbench.tsx`

当前 `BookWorkbench.tsx` 直接返回 `BookStructureWorkspace`。

PR11 正确做法是把它升级成真正的 lens dispatch container：

- `route.lens === 'structure'` -> `BookStructureWorkspace`
- `route.lens === 'draft'` -> `BookDraftWorkspace`

### 为什么这一点重要

因为从 PR11 开始，Book 不再只是 structure page。

如果还让 `BookStructureWorkspace` 直接拥有整个 book scope，就会把 “structure 拥有 book” 的所有权写死。

---

## 七、推荐的数据层改法

## 7.1 新增一层共享 source hook，而不是复制 `useBookStructureWorkspaceQuery(...)`

这是 PR11 最重要的结构调整。

推荐新增：

- `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts`

### 这层的职责

统一产出 Book 两条 lens 都会用到的源数据：

- `bookRecord`
- ordered `chapterWorkspacesById`
- ordered `sceneProseBySceneId`
- `traceRollupsBySceneId`
- `orderedChapterIds`
- `orderedSceneIds`
- loading / error / refetch

### 为什么值得抽这一层

因为现在 `useBookStructureWorkspaceQuery(...)` 已经做了：

- book record
- chapter workspace queries
- scene prose queries
- traceability scene sources

PR11 如果直接再复制一份，会立刻得到第二套几乎相同的瀑布。

而 Book 本身刚好已经进入多 lens 阶段，正适合把 “共享 sources / 不同 mapping” 的模式抽出来。

## 7.2 `useBookStructureWorkspaceQuery.ts` 改为薄 wrapper

改造后它应只做：

1. 读取 `useBookWorkspaceSources(...)`
2. 把 sources 交给 `buildBookStructureWorkspaceViewModel(...)`
3. 返回 structure 专用 workspace

这样 PR10 的结构视图逻辑不会丢，但数据拼装职责会更清楚。

## 7.3 新增 `useBookDraftWorkspaceQuery.ts`

推荐新增：

- `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts`

### 这层职责

1. 读取 `useBookWorkspaceSources(...)`
2. 以 book 的 chapter order 为准
3. 把各 chapter 的 ordered scene prose 组装成 chapter-level manuscript section
4. 派生出 Book Draft 的：
   - binder 数据
   - reader 数据
   - inspector 数据
   - dock summary

### 这层不做的事

- 不直接改 prose
- 不直接改 scene/chapter 数据
- 不发明新的 server identity

它应该是一个 **composed query hook**，不是新的 client capability。

---

## 八、推荐的 draft view-model

## 8.1 `BookDraftSceneSectionViewModel`

用于表示一个 chapter 内部的 scene prose section。

建议至少包含：

- `sceneId`
- `order`
- `title`
- `summary`
- `proseDraft?: string`
- `draftWordCount?: number`
- `isMissingDraft: boolean`
- `warningsCount: number`
- `revisionQueueCount?: number`
- `traceReady: boolean`
- `relatedAssetCount: number`
- `sourceProposalCount: number`
- `latestDiffSummary?: string`

## 8.2 `BookDraftChapterViewModel`

用于 Book Draft 中的一个 chapter manuscript block。

建议至少包含：

- `chapterId`
- `order`
- `title`
- `summary`
- `sceneCount`
- `draftedSceneCount`
- `missingDraftCount`
- `assembledWordCount`
- `warningsCount`
- `queuedRevisionCount`
- `tracedSceneCount`
- `missingTraceSceneCount`
- `sections: BookDraftSceneSectionViewModel[]`
- `assembledProseSections: string[]`
- `coverageStatus: 'ready' | 'attention' | 'missing'`

### 注意

不要在这一层直接把整章 prose 拼成一个不可逆的大字符串后丢掉 section 信息。

正确做法是：

- 保留 ordered section list
- reader 决定是连续渲染还是按 scene 分隔渲染

这样未来若要做 compare / anchor / trace badges，成本会低很多。

## 8.3 `BookDraftWorkspaceViewModel`

建议至少包含：

- `bookId`
- `title`
- `summary`
- `selectedChapterId`
- `chapters: BookDraftChapterViewModel[]`
- `selectedChapter`
- `assembledWordCount`
- `draftedChapterCount`
- `missingDraftChapterCount`
- `inspector`
- `dockSummary`

## 8.4 `BookDraftInspectorViewModel`

建议第一版固定成三块：

### A. `Selected chapter`

- title
- summary
- drafted / missing draft
- traced / missing trace
- warnings / queued revisions
- assembled word count

### B. `Manuscript readiness`

- drafted chapter count
- missing draft chapter count
- total assembled word count
- chapters with warnings
- chapters missing trace

### C. `Selected chapter signals`

- top missing scenes
- latest diff summaries（轻量）
- trace coverage note

## 8.5 `BookDraftDockSummaryViewModel`

建议继续保留两块：

### Problems
- chapters missing draft
- chapters missing trace
- chapters with warnings / queued revisions
- chapters with highest unresolved pressure（可复用结构汇总）

### Activity
- entered draft lens
- focused chapter
- opened chapter draft
- opened chapter structure

---

## 九、组件与容器职责

## 9.1 新增组件 / 容器建议

### 容器

- `packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx`
- `packages/renderer/src/features/book/containers/BookDraftDockContainer.tsx`

### hooks

- `packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts`
- `packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts`

### types / lib

- `packages/renderer/src/features/book/types/book-draft-view-models.ts`
- `packages/renderer/src/features/book/lib/book-draft-workspace-mappers.ts`

### components

- `packages/renderer/src/features/book/components/BookDraftBinderPane.tsx`
- `packages/renderer/src/features/book/components/BookDraftReader.tsx`
- `packages/renderer/src/features/book/components/BookDraftInspectorPane.tsx`
- `packages/renderer/src/features/book/components/BookDraftBottomDock.tsx`

## 9.2 `BookDraftWorkspace.tsx`

这是 PR11 的主容器。

### 职责

1. 读取 book route
2. 调用 `useBookDraftWorkspaceQuery(...)`
3. 继续用 `patchBookRoute({ selectedChapterId })` 更新选中 chapter
4. 通过 `WorkbenchShell` 组装：
   - mode rail
   - binder
   - main reader
   - inspector
   - bottom dock
5. 提供：
   - `Open in Chapter Draft`
   - `Open in Chapter Structure`

### 必须保留的纪律

- `route.selectedChapterId` 是唯一真源
- `view` 不参与 Draft lens 的主渲染，但要保留
- loading / error / null book 结构要与 BookStructureWorkspace 的 pane-state 风格一致

## 9.3 `BookDraftBinderPane.tsx`

### 职责

- 左侧导航
- 按显式 chapter order 显示 chapter manuscript readiness
- 高亮当前 selected chapter

### 每个 item 至少显示

- order
- title
- assembled word count
- missing draft count
- missing trace count
- warnings / queued revisions 的轻量标记

### 交互

- 主点击：`onSelectChapter(chapterId)`
- 次级动作：
  - `Open in Draft`
  - `Open in Structure`

### 不做

- 不做 reorder
- 不做 inline edit
- 不做 direct scene handoff 主入口

## 9.4 `BookDraftReader.tsx`

这是 PR11 的主舞台核心。

### 正确定位

它应该是一个 **连续阅读优先的 manuscript reader**，不是另一套结构表格，也不是 dashboard。

### 建议结构

按 chapter 渲染 chapter sections：

- Chapter header
- chapter summary + readiness badges
- ordered scene sections（scene title + prose 或 calm empty state）

### 交互

- 点击 chapter header / chapter container：`onSelectChapter(chapterId)`
- 当前 selected chapter 有明显 active state
- chapter header 上保留：
  - `Open in Chapter Draft`
  - `Open in Chapter Structure`

### 视觉纪律

- 读优先
- 噪音低
- badge / metrics 只是辅助
- scene 缺稿时用 quiet empty state，而不是告警墙

### 本轮不做

- 不做 inline prose edit
- 不做 compare gutter
- 不做 publish affordance
- 不做 direct scene anchor route

## 9.5 `BookDraftInspectorPane.tsx`

右侧继续只做 supporting judgment。

### 第一版建议固定三块

#### A. Selected Chapter
- title
- summary
- word count
- drafted / missing draft
- traced / missing trace
- warnings / queued revisions

#### B. Readiness
- drafted chapter count
- missing draft chapter count
- total assembled words
- warning-heavy chapters count

#### C. Chapter Signals
- missing scene list（轻量）
- latest diff summary（若有）
- trace note

### 不做

- 不做主阅读区
- 不做全文 compare
- 不做导出设置

## 9.6 `BookDraftBottomDock.tsx`

### 第一版建议两块

#### Problems
显示：
- missing draft chapters
- missing trace chapters
- warning-heavy chapters
- queued revision chapters

#### Activity
显示：
- entered draft lens
- focused chapter
- opened chapter draft
- opened chapter structure

### 纪律

- dock 仍然是 supporting surface
- 不做第二主舞台
- 不搬 runtime trace

## 9.7 `BookModeRail.tsx`

要从现在的单按钮：

- `Structure`

扩成：

- `Structure`
- `Draft`

### 规则

- `BookModeRail` 仍只负责 Book 这个 scope 内的 lens
- 不顺手做全局 rail 抽象化重构

---

## 十、Book -> Chapter handoff 规则

PR11 继续坚持 Book 通过 Chapter 落地，而不是直接把 Book 变成 Scene 调度台。

### 在 Book Draft 中至少保留两个入口

- `Open in Draft`
- `Open in Structure`

### 行为

#### `Open in Draft`

```ts
replaceRoute({
  scope: 'chapter',
  chapterId,
  lens: 'draft',
  sceneId: undefined,
})
```

#### `Open in Structure`

```ts
replaceRoute({
  scope: 'chapter',
  chapterId,
  lens: 'structure',
  view: 'sequence',
  sceneId: undefined,
})
```

### 返回策略

仍然依赖：

- 浏览器历史
- dormant route snapshot

返回 Book 时应恢复：

- `scope='book'`
- `lens='draft'`
- `selectedChapterId`
- 以及 dormant 的 `view`

---

## 十一、测试补齐方案

## 11.1 route 测试

至少补：

1. `BookLens` 现在支持 `structure | draft`
2. `BookRouteState.view` 在 `lens='draft'` 下仍被保留
3. 从 draft 切回 structure 时，之前的 `view` 能恢复
4. 四个 scope 的 dormant snapshot 规则不被破坏

## 11.2 新增共享 source hook 测试

若引入 `useBookWorkspaceSources.ts`，建议至少覆盖：

1. book record + chapter workspace + scene prose + traceability 能组合成功
2. ordered chapter ids 不被打乱
3. ordered scene ids 严格遵守 chapter scene order
4. loading / error / null record 状态正确

## 11.3 `useBookDraftWorkspaceQuery.test.ts`

至少覆盖：

1. 按 book chapter order 组装 chapters
2. 每章内部 scene prose 顺序遵守 chapter scene order
3. `selectedChapterId` 缺失时 fallback 到首章
4. `assembledWordCount` / `missingDraftChapterCount` / `warningsCount` 等派生正确
5. missing draft scenes 能正确落成 quiet empty state 数据

## 11.4 组件测试

### `BookDraftBinderPane.test.tsx`
- 选中态正确
- 点击 chapter 会触发 `onSelectChapter`
- `Open in Draft` / `Open in Structure` 可触发

### `BookDraftReader.test.tsx`
- chapter sections 按顺序渲染
- selected chapter 跟 `route.selectedChapterId` 同步
- chapter header 点击会触发选择
- missing draft scene 显示 quiet empty state
- handoff actions 可用

### `BookDraftInspectorPane.test.tsx`
- Selected Chapter / Readiness / Chapter Signals 三块成立
- selected chapter 变化时 inspector 跟着更新

### `BookDraftBottomDock.test.tsx`
- Problems / Activity 正确显示
- Activity 不成为第二真源

## 11.5 `BookDraftWorkspace.test.tsx`

建议做一条完整路径：

```text
打开 ?scope=book&id=book-signal-arc&lens=draft&selectedChapterId=chapter-open-water-signals
-> binder / reader / inspector / dock 同步聚焦 Open Water Signals
-> 点击另一个 chapter section
-> URL selectedChapterId 更新
-> inspector / dock 同步刷新
-> 点击 Open in Draft
-> 进入 chapter draft
-> browser back
-> 回到 book draft + 原 selectedChapterId
```

## 11.6 `App.test.tsx`（推荐新增真正有价值的 smoke）

### A. `book structure -> book draft -> structure`

```text
打开 book structure signals
-> 切到 draft
-> 再切回 structure
-> 原 signals view 恢复
```

### B. `book draft -> chapter draft -> back`

```text
打开 book draft
-> 选中第二章
-> open in chapter draft
-> browser back
-> 回到 book draft + 第二章仍为 selectedChapterId
```

### C. `scene/chapter/asset dormant snapshots survive book multi-lens`

```text
先进入 scene 或 chapter 或 asset
-> 切到 book draft
-> 再恢复原 scope
-> 原 snapshot 不乱
```

---

## 十二、Storybook 建议

推荐至少新增：

- `BookDraftBinderPane.stories.tsx`
- `BookDraftReader.stories.tsx`
- `BookDraftInspectorPane.stories.tsx`
- `BookDraftBottomDock.stories.tsx`
- `BookDraftWorkspace.stories.tsx`（若允许 page story）

### 最少 story 组合

- `Default`
- `SelectedSecondChapter`
- `MissingDrafts`
- `WarningsHeavy`
- `QuietBookDraft`

---

## 十三、建议的文件改动

## 13.1 必改

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/book/containers/BookWorkbench.tsx
packages/renderer/src/features/book/components/BookModeRail.tsx
packages/renderer/src/features/book/hooks/useBookStructureWorkspaceQuery.ts
packages/renderer/src/App.tsx（如需要 book rail / lens 接线或 smoke 相关小改）
app i18n 文案
```

## 13.2 推荐新增

```text
packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.ts
packages/renderer/src/features/book/types/book-draft-view-models.ts
packages/renderer/src/features/book/components/BookDraftBinderPane.tsx
packages/renderer/src/features/book/components/BookDraftReader.tsx
packages/renderer/src/features/book/components/BookDraftInspectorPane.tsx
packages/renderer/src/features/book/components/BookDraftBottomDock.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/containers/BookDraftDockContainer.tsx
```

## 13.3 这一轮尽量不动

```text
packages/renderer/src/features/scene/** 的主容器与 query identity
packages/renderer/src/features/chapter/** 的 mutation 逻辑
packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts（除非抽纯 mapper 所必须）
packages/renderer/src/features/asset/** 的主容器与 query identity
packages/renderer/src/features/traceability/** 的核心组合逻辑
packages/renderer/src/features/book/api/book-client.ts
packages/renderer/src/features/book/api/book-records.ts
packages/renderer/src/features/book/api/mock-book-db.ts
```

PR11 的重点是 **Book 增加 Draft lens**，不是重做前三个 scope 或者重做 Book client。

---

## 十四、实施顺序（给 AI 的执行顺序）

### Step 1
先扩 route：

- `BookLens` -> `structure | draft`
- `VALID_BOOK_LENSES` 扩到 draft
- 保持 `view` 存在但在 draft 下 dormant

### Step 2
把 `BookWorkbench.tsx` 升级成真正的 lens dispatch container：

- `structure` -> `BookStructureWorkspace`
- `draft` -> `BookDraftWorkspace`

### Step 3
抽共享数据层：

- 新增 `useBookWorkspaceSources.ts`
- 让 `useBookStructureWorkspaceQuery.ts` 改成薄 wrapper
- 确保 PR10 既有逻辑不退化

### Step 4
新增 `useBookDraftWorkspaceQuery.ts` + draft mappers：

- 基于共享 sources 派生 Book Draft workspace view-model
- 保持 chapter order 与 scene order 为唯一装配顺序事实

### Step 5
实现 Draft UI surfaces：

- binder
- reader
- inspector
- bottom dock

### Step 6
实现 `BookDraftWorkspace.tsx`：

- 用 `WorkbenchShell` 接入五个表面
- 继续用 `route.selectedChapterId` 驱动选中态
- 接上 `Open in Chapter Draft / Structure`

### Step 7
扩 `BookModeRail.tsx`：

- 增加 `Draft` lens 按钮
- 保持 scope 按钮逻辑最小变动

### Step 8
补 tests：

- route
- shared sources
- draft query
- draft workspace 集成
- app smoke

### Step 9
补 stories 与文案

---

## 十五、完成后的验收标准

满足以下条件，PR11 就算完成：

1. `BookLens` 已支持 `structure | draft`
2. `BookWorkbench` 不再只返回 `BookStructureWorkspace`
3. Book 现在有一个真正可进入的 `Draft` lens
4. Book Draft 按显式 chapter order 渲染 manuscript 阅读流
5. 每章内部 prose section 按 chapter scene order 渲染
6. `route.selectedChapterId` 仍然是 Book 内唯一选中态真源
7. `BookRouteState.view` 在 `Draft` 下仍被保留，并能从 Draft 切回 Structure 恢复
8. Book Draft 可以 handoff 到 `Chapter / Draft` 与 `Chapter / Structure`
9. browser back 能恢复 Book Draft 的 `selectedChapterId`
10. PR10 已成立的 Book Structure、route restore、四 scope dormant snapshot 不被破坏
11. 不包含 compare / publish / branch / mutation / global rail 重构

---

## 十六、PR11 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了 Book Draft，引入了新的 `selectedChapterId` 第二真源
- 为了 Book Draft，新造了 giant `book draft client`
- 为了复用 Chapter Draft，在 loop 里直接调用高层 composed hook
- 为了 Draft，直接往 Book route 塞 `sceneId / chunkId / compareMode`
- Book Draft reader 变成 dashboard / card wall，而不是连续 manuscript 阅读区
- PR11 顺手开始做 publish / compare / branch
- 顺手把全局 rail 系统重构掉
- 因为加入 Book Draft 而破坏 scene / chapter / asset dormant snapshot 恢复

PR11 做完后的正确项目状态应该是：

**Book 终于从“只有 structure 的上层对象”推进成“也能承担 manuscript reading 的 multi-lens object”，而 compare / publish 仍然被有意识地留在后面。**

---

## 十七、PR11 之后的顺序建议（只做保留，不在本轮实施）

### PR12：Manuscript Compare / Review Surface

等 Book Draft 成立后，再做：

- chapter / book draft compare
- selected section diff review
- source provenance compare

### PR13：Publish / Export Foundation

等 compare 与 book draft 都稳定后，再做：

- export modal
- publish packaging
- manuscript delivery surface

### PR14 以后：Branch / Compare / Publish Acceleration Layer

再更后面，才进入：

- branch
- selective merge
- publish workflow acceleration

---

## 十八、给 AI 的最终一句话指令

在当前 `codex/pr10-book-structure-workspace` 已经完成 PR10 的前提下，不要继续抛光 Book Structure，也不要提前做 Compare / Publish / Branch；先只围绕 **Book Draft Lens（read-first manuscript assembly）** 做一轮窄而实的实现：

- 把 `BookLens` 从 `structure` 扩到 `structure | draft`
- 让 `BookWorkbench` 成为真正的 lens dispatch container
- 抽出一层共享的 `useBookWorkspaceSources(...)`，避免复制 PR10 的 book data composition
- 在此基础上新增 `useBookDraftWorkspaceQuery(...)`
- 做一套安静的 `BookDraftBinderPane / BookDraftReader / BookDraftInspectorPane / BookDraftBottomDock`
- 继续坚持 `route.selectedChapterId` 是 Book 内唯一选中态真源
- 保留 Book -> Chapter Structure / Draft handoff
- 保留 dormant `view` 并支持从 Draft 切回 Structure 时恢复原三视图
- 用测试固定 multi-lens、route 恢复、chapter order / scene order 装配纪律三条硬约束
- 明确不做 compare、publish、branch、mutation、global rail 重构
