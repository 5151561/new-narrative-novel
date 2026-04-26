# PR15 执行文档（基于 `main` 当前 PR14 代码）

## 这份文档的目的

这不是路线图回顾，也不是大而全 wishlist。

这是一份**基于当前 `main` 分支真实代码状态**整理出来的、可以直接交给 AI agent 实施的 PR15 指令文档。

PR15 的任务，不是继续抛光 PR14 已经完成的 `Book / Draft / Branch`，也不是提前做真实导出、branch merge 或多人评论系统。本轮更合适的目标是：

**在 Book Draft 内建立第一版 Review Inbox / Manuscript Annotations Foundation，把 compare、export、branch、draft readiness、trace gap 与少量 scene/chapter review 信号收束成一个 read-heavy 审阅队列。**

一句话判断：

**PR11 让 Book 能读全书稿，PR12 让 Book 能做 checkpoint 对照，PR13 让 Book 能预检导出，PR14 让 Book 能安全查看实验稿；PR15 应该让 Book 能统一审阅这些信号。**

---

## 一、先确认当前代码基线

以下判断必须建立在当前 `main` 代码事实上，而不是之前误看的未合并分支。

### 1. Book Draft 已经有四个子视图

当前 route 已经支持：

```ts
BookDraftView = 'read' | 'compare' | 'export' | 'branch'
BookBranchBaseline = 'current' | 'checkpoint'
```

`BookRouteState` 当前也已经有：

```ts
draftView?: BookDraftView
branchId?: string
branchBaseline?: BookBranchBaseline
checkpointId?: string
exportProfileId?: string
selectedChapterId?: string
```

所以 PR15 的正确扩展点仍然是 **Book / Draft 的 stage switchboard**，而不是新增第五个 scope 或新增顶层 `review` lens。

### 2. Book Draft stage 已经是真正的 switchboard

当前 `BookDraftStage.tsx` 已经承担：

- `read` -> `BookDraftReader`
- `compare` -> `BookDraftCompareView`
- `export` -> `BookDraftExportView`
- `branch` -> `BookDraftBranchView`

并且 stage 已经接收：

- compare workspace
- export preview workspace
- branch workspace
- checkpoint picker
- branch picker / baseline selector
- export profile selector

PR15 不需要重写 stage，只需要在同一 switchboard 中新增一个窄的 `review` view。

### 3. PR14 已经有 branch 相关完整链路

当前 `features/book` 已经有：

- `api/book-experiment-branches.ts`
- `hooks/useBookExperimentBranchQuery.ts`
- `lib/book-experiment-branch-mappers.ts`
- `types/book-branch-view-models.ts`
- `components/BookDraftBranchView.tsx`
- `components/BookExperimentBranchPicker.tsx`
- 对应 tests / stories

PR15 不要再做 branch foundation；它应该把 branch readiness / blockers / warnings 作为 review issue 来源之一。

### 4. 当前已经有多个可收束的 issue 来源

PR15 可以复用当前已经存在的几类来源：

- current manuscript：`useBookDraftWorkspaceQuery(...)`
- checkpoint compare：`useBookManuscriptCompareQuery(...)`
- export readiness：`useBookExportPreviewQuery(...)`
- experiment branch：`useBookExperimentBranchQuery(...)`
- traceability signals：PR9 已经引入的 traceability source / related assets / missing links
- chapter draft readiness：Book Draft 章节与 scene section 的 missing draft / warnings / revision queue

这意味着 PR15 不应该新增 giant review server client，而应该做一个 **derived review composition layer**。

### 5. PR14 文档已经明确把 PR15 指向 Review Inbox

PR14 后续路线里，PR15 的目标已经被定义为：

- Review Inbox / Manuscript Annotations
- 收束 scene proposal、chapter draft issues、book compare deltas、export readiness blockers、branch readiness issues
- read-heavy review inbox
- filter by scope / severity / trace gap / export blocker / branch issue
- issue -> source scope handoff
- 不做多人评论、assignment、notification

PR15 应严格沿着这个方向做，不要提前进入真实导出或 branch merge。

---

## 二、PR15 的唯一目标

**在 `Book / Draft` 内新增 `Review` 子视图，用一个 read-heavy Review Inbox 收束当前 manuscript、compare、export、branch 与 traceability 的审阅信号。**

PR15 完成后，用户应该能：

1. 在 `scope='book' & lens='draft'` 下切到 `draftView='review'`。
2. 看到一个统一 Review Inbox，包含：
   - missing draft issues
   - trace gap issues
   - compare delta issues
   - export readiness blockers / warnings
   - branch readiness blockers / warnings
   - 少量 scene proposal / chapter review seed issues
3. 按 filter 查看：
   - all
   - blockers
   - trace gaps
   - missing drafts
   - compare deltas
   - export readiness
   - branch readiness
   - scene proposals
4. 选择一个 review issue，并看到：
   - severity
   - source scope / source type
   - chapter / scene / asset anchor
   - issue detail
   - source preview
   - recommended next action
5. 点击 issue 的 source handoff，跳到对应工作面：
   - scene orchestrate / draft
   - chapter structure / draft
   - book compare / export / branch
   - asset profile（若 issue 关联 asset）
6. browser back 返回 Book Draft Review 时恢复：
   - `scope='book'`
   - `lens='draft'`
   - `draftView='review'`
   - `reviewFilter`
   - `reviewIssueId`
   - `selectedChapterId`
7. Review 视图不写稿、不修复 issue、不修改 branch、不发起 publish。

一句话说：

**PR15 要把前面 PR11–PR14 产生的审稿信号统一收束成一个可过滤、可定位、可跳转、可恢复的 review queue，但仍保持 read-heavy。**

---

## 三、为什么 PR15 不该做真实评论系统 / merge / export adapter

### 1. Review Inbox 先于评论系统

现在最需要的是把散落在各个 surface 的信号收束，而不是马上做多人评论、assignment、resolved state、notification。

如果没有统一 Review Inbox，评论系统只会变成多个页面里的零散 comment bubble。

### 2. Review Inbox 先于 branch merge

PR14 的 branch 仍是 read-only alternate manuscript。PR15 可以把 branch blocker / warning 变成 review issue，但不应该开始做 merge。

Merge 会牵动：

- current manuscript mutation
- scene / chapter prose mutation
- traceability update
- export readiness recalculation
- rollback / undo

这些都不应在 PR15 混入。

### 3. Review Inbox 先于真实 export adapter

PR13 / PR14 已经有 export preview 与 branch source 心智。真实导出之前，最好先让用户看到“为什么还不能导出 / 哪些 issue 应先审”。

PR15 正好承担这个 publish readiness 前的审阅收束层。

---

## 四、本轮明确不做

以下内容不要混进 PR15：

- 不做真实 export file adapter
- 不做 PDF / EPUB / DOCX / Markdown / JSON 文件生成
- 不做 branch create / duplicate / archive / merge
- 不做 selective merge
- 不做 accept / reject issue mutation
- 不做 resolved / archived review state
- 不做多人评论系统
- 不做 assignee / due date / notification
- 不做 global command palette / global search overhaul
- 不做 new scope：`scope='review'`
- 不做 new top-level lens：`lens='review'`
- 不做 scene chunk 级 anchor route
- 不做 inline manuscript editing
- 不做 AI 自动生成 review summary
- 不做 graph-first review explorer

PR15 的定位必须明确为：

**Review Inbox / Manuscript Annotations Foundation，read-heavy，可跳转，不写入。**

---

## 五、必须遵守的硬约束

### 5.1 Review 不是新 scope，也不是新 top-level lens

不要新增：

```ts
scope='review'
lens='review'
```

正确做法是扩展：

```ts
BookDraftView = 'read' | 'compare' | 'export' | 'branch' | 'review'
```

Review 是 Book Draft 下的第五个子视图。

### 5.2 `route.selectedChapterId` 仍然是 Book 内章节聚焦真源

Review issue 可能关联 chapter / scene，但 Book 内的章节聚焦仍然必须由：

```ts
route.selectedChapterId
```

驱动。

当用户选择一个 issue：

- 如果 issue 有 `chapterId`，允许同步 patch `selectedChapterId`
- 但不要新增 `selectedReviewChapterId`
- 不要让 review list、inspector、dock 各自维护不同 selected chapter

### 5.3 `reviewIssueId` 只服务 Review 子视图，不替代 object selection

PR15 可以新增：

```ts
reviewIssueId?: string
```

它只表示 Review Inbox 当前选中 issue。

它不能替代：

- `selectedChapterId`
- scene route 的 `sceneId`
- asset route 的 `assetId`

### 5.4 `view` 继续只服务 Book Structure

当前 Book route 的：

```ts
view='sequence' | 'outliner' | 'signals'
```

仍然只服务 Book Structure。

PR15 不要把 `view` 改成 review / compare / branch / export。

### 5.5 不复制 source waterfall

Review query 不要重新拉取：

- book workspace sources
- chapter structure workspaces
- scene prose queries
- traceability scene sources

正确做法：

- `BookDraftWorkspace` 继续拿 current draft workspace
- 继续拿 compare / export / branch workspace
- Review query / mapper 接收这些 view-model
- 只补少量 explicit review seed，用于当前还没有结构化来源的 scene proposal / chapter review sample

### 5.6 Review issue 必须是 derived view-model，不是新的写模型

第一版 `ReviewIssueViewModel` 只来自：

- current draft metrics
- compare deltas
- export readiness issues
- branch readiness issues
- traceability summaries
- explicit read-only review seeds

不要新增 mutable review db。

### 5.7 issue -> source handoff 继续使用现有 route / history

不要新增临时返回栈。

从 Review 打开 source 后，返回依赖：

- browser history
- dormant route snapshot

---

## 六、路由与状态改法

### 6.1 `workbench-route.ts`

把：

```ts
export type BookDraftView = 'read' | 'compare' | 'export' | 'branch'
```

扩成：

```ts
export type BookDraftView = 'read' | 'compare' | 'export' | 'branch' | 'review'
```

新增：

```ts
export type BookReviewFilter =
  | 'all'
  | 'blockers'
  | 'trace-gaps'
  | 'missing-drafts'
  | 'compare-deltas'
  | 'export-readiness'
  | 'branch-readiness'
  | 'scene-proposals'
```

修改 `BookRouteState`：

```ts
export interface BookRouteState {
  scope: 'book'
  bookId: string
  lens: BookLens
  view: BookStructureView
  draftView?: BookDraftView
  branchId?: string
  branchBaseline?: BookBranchBaseline
  checkpointId?: string
  exportProfileId?: string
  reviewFilter?: BookReviewFilter
  reviewIssueId?: string
  selectedChapterId?: string
}
```

### 6.2 URL 示例

```text
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=branch-readiness&reviewIssueId=review-branch-high-pressure-missing-draft&selectedChapterId=chapter-open-water-signals
```

注意：

- `view=signals` 在这里仍然是 dormant structure view。
- `checkpointId / exportProfileId / branchId / branchBaseline` 可以继续保留在 route snapshot 中，Review 只在需要构建对应 issue 来源时读取。

### 6.3 `useWorkbenchRouteState.ts`

要做的事：

1. `VALID_BOOK_DRAFT_VIEWS` 增加 `review`。
2. 新增 `VALID_BOOK_REVIEW_FILTERS`。
3. `CANONICAL_ROUTE_KEYS` 增加：
   - `reviewFilter`
   - `reviewIssueId`
4. `normalizeBookRoute(...)` 允许并规范化：
   - `draftView='review'`
   - `reviewFilter`
   - `reviewIssueId`
5. `readBookSnapshot(...)` 读取：
   - `reviewFilter`
   - `reviewIssueId`
6. `buildWorkbenchSearch(...)` 在 book scope 下写入：
   - `reviewFilter`
   - `reviewIssueId`
7. `patchBookRoute(...)` 继续保持一个 API，不新增 review 专用 patch hook。
8. dormant snapshot 继续覆盖四个 scope。

### 6.4 默认规则建议

- `lens='draft'` 且 `draftView` 缺失时，fallback 到 `read`。
- `draftView='review'` 且 `reviewFilter` 缺失时，fallback 到 `all`。
- `draftView='review'` 且 `reviewIssueId` 缺失时，fallback 到 filtered issues 的第一条 blocker / warning / info。
- `draftView !== 'review'` 时，`reviewFilter / reviewIssueId` 可以保留在 route snapshot 中，但 UI 不使用。

---

## 七、数据层与 view-model 设计

### 7.1 新增 cross-feature review layer

推荐新增：

```text
packages/renderer/src/features/review/
  components/
  hooks/
  lib/
  types/
```

原因：Review Inbox 是跨 feature 组合层，类似 PR9 的 `traceability`。它不应该被塞进 `features/book/lib` 里变成 book-only mapper，也不应该散落在 scene / chapter / asset 中。

PR15 第一版可以只服务 `Book / Draft / Review`，但代码位置应为未来 `Review` 扩展预留空间。

### 7.2 新增 read-only review seed

当前有些 review 来源尚未被完全结构化，例如 scene proposal issue / chapter draft note。PR15 可以新增少量 read-only seed：

```text
packages/renderer/src/features/review/api/book-review-seeds.ts
```

用途：

- 给 scene proposal issue 提供最小样例
- 给 chapter draft annotation 提供最小样例
- 不作为 mutable review db
- 不做 resolved state

建议 seed 覆盖：

- 一个 scene proposal needs review
- 一个 chapter draft transition note
- 一个 asset trace gap note

### 7.3 `ReviewIssueViewModel`

新增：

```text
packages/renderer/src/features/review/types/review-view-models.ts
```

建议类型：

```ts
export type ReviewIssueSeverity = 'blocker' | 'warning' | 'info'

export type ReviewIssueSource =
  | 'manuscript'
  | 'compare'
  | 'export'
  | 'branch'
  | 'traceability'
  | 'scene-proposal'
  | 'chapter-draft'

export type ReviewIssueKind =
  | 'missing_draft'
  | 'trace_gap'
  | 'compare_delta'
  | 'export_blocker'
  | 'export_warning'
  | 'branch_blocker'
  | 'branch_warning'
  | 'scene_proposal'
  | 'chapter_annotation'

export interface ReviewSourceHandoffViewModel {
  id: string
  label: string
  target:
    | { scope: 'book'; lens: 'draft'; draftView: BookDraftView; selectedChapterId?: string; checkpointId?: string; exportProfileId?: string; branchId?: string; branchBaseline?: BookBranchBaseline }
    | { scope: 'chapter'; chapterId: string; lens: 'structure' | 'draft'; sceneId?: string }
    | { scope: 'scene'; sceneId: string; lens: 'orchestrate' | 'draft' | 'structure'; tab?: string }
    | { scope: 'asset'; assetId: string; view?: 'profile' | 'mentions' | 'relations' }
}

export interface ReviewIssueViewModel {
  issueId: string
  severity: ReviewIssueSeverity
  source: ReviewIssueSource
  kind: ReviewIssueKind
  title: string
  detail: string
  recommendation: string
  chapterId?: string
  chapterTitle?: string
  sceneId?: string
  sceneTitle?: string
  assetId?: string
  assetTitle?: string
  sourceLabel: string
  sourceExcerpt?: string
  tags: string[]
  handoffs: ReviewSourceHandoffViewModel[]
}
```

### 7.4 `BookReviewInboxViewModel`

```ts
export interface BookReviewInboxViewModel {
  bookId: string
  title: string
  selectedIssueId: string | null
  selectedIssue: ReviewIssueViewModel | null
  activeFilter: BookReviewFilter
  issues: ReviewIssueViewModel[]
  filteredIssues: ReviewIssueViewModel[]
  groupedIssues: {
    blockers: ReviewIssueViewModel[]
    warnings: ReviewIssueViewModel[]
    info: ReviewIssueViewModel[]
  }
  counts: {
    total: number
    blockers: number
    warnings: number
    info: number
    traceGaps: number
    missingDrafts: number
    compareDeltas: number
    exportReadiness: number
    branchReadiness: number
    sceneProposals: number
  }
  selectedChapterIssueCount: number
  annotationsByChapterId: Record<string, ReviewIssueViewModel[]>
}
```

---

## 八、Issue 来源映射规则

新增：

```text
packages/renderer/src/features/review/lib/book-review-inbox-mappers.ts
packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts
```

### 8.1 从 current draft 生成 issues

从 `BookDraftWorkspaceViewModel` 生成：

- missing draft chapter / scene -> `missing_draft`
- warnings > 0 -> warning issue
- missing trace scene -> `trace_gap`
- queued revision > 0 -> info / warning issue

### 8.2 从 compare workspace 生成 issues

从 `BookManuscriptCompareWorkspaceViewModel` 生成：

- changed chapter / scene -> `compare_delta`
- draft missing scene -> `missing_draft`
- trace regression -> `trace_gap`
- warnings delta > 0 -> warning issue

### 8.3 从 export preview 生成 issues

从 `BookExportPreviewWorkspaceViewModel` 生成：

- readiness blocker -> `export_blocker`
- readiness warning -> `export_warning`
- missing required section -> blocker
- trace/export blocker -> blocker or warning according to existing export readiness severity

### 8.4 从 branch workspace 生成 issues

从 `BookExperimentBranchWorkspaceViewModel` 生成：

- branch readiness blocker -> `branch_blocker`
- branch warning -> `branch_warning`
- branch draft_missing -> blocker
- trace regression -> warning / trace gap
- added scene without source proposal -> warning

### 8.5 从 explicit review seeds 生成 issues

从 read-only seeds 生成：

- scene proposal needs review -> `scene_proposal`
- chapter draft annotation -> `chapter_annotation`
- asset trace note -> `trace_gap`

### 8.6 排序规则

第一版排序保持确定性：

1. severity：blocker -> warning -> info
2. source priority：export -> branch -> compare -> traceability -> manuscript -> scene-proposal -> chapter-draft
3. chapter order
4. scene order
5. issue id

不要使用时间排序，除非 seed 中显式提供 stable `createdAtSortKey`。

### 8.7 filter 规则

```ts
'all' -> all issues
'blockers' -> severity === 'blocker'
'trace-gaps' -> kind === 'trace_gap'
'missing-drafts' -> kind === 'missing_draft'
'compare-deltas' -> source === 'compare'
'export-readiness' -> source === 'export'
'branch-readiness' -> source === 'branch'
'scene-proposals' -> source === 'scene-proposal'
```

---

## 九、query hook 设计

新增：

```text
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
```

推荐签名：

```ts
export function useBookReviewInboxQuery({
  bookId,
  currentDraftWorkspace,
  compareWorkspace,
  exportWorkspace,
  branchWorkspace,
  reviewFilter,
  reviewIssueId,
}: {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  compareWorkspace?: BookManuscriptCompareWorkspaceViewModel | null
  exportWorkspace?: BookExportPreviewWorkspaceViewModel | null
  branchWorkspace?: BookExperimentBranchWorkspaceViewModel | null
  reviewFilter?: BookReviewFilter | null
  reviewIssueId?: string | null
})
```

职责：

1. 接收已经由 BookDraftWorkspace 获取的 current / compare / export / branch view-model。
2. 读取 minimal review seeds。
3. 调用 pure mapper 生成 Review Inbox view-model。
4. 返回 loading / error / empty 状态。

关键纪律：

- 不重复拉取 book workspace sources。
- 不重复拉取 scene prose。
- 不重复拉取 traceability scene sources。
- 不新增 review server client。

---

## 十、UI 与组件设计

### 10.1 `BookDraftStage.tsx`

修改：

- tab 增加 `Review`
- `draftView='review'` 时渲染 `BookDraftReviewView`
- read / compare / export / branch 原行为不变

新增 props：

```ts
reviewInbox?: BookReviewInboxViewModel | null
reviewError?: Error | null
selectedReviewFilter: BookReviewFilter
selectedReviewIssueId?: string | null
onSelectReviewFilter: (filter: BookReviewFilter) => void
onSelectReviewIssue: (issueId: string) => void
onOpenReviewSource: (handoff: ReviewSourceHandoffViewModel) => void
```

### 10.2 `BookDraftReviewView.tsx`

新增：

```text
packages/renderer/src/features/book/components/BookDraftReviewView.tsx
```

职责：

- 主舞台中的 Review Inbox。
- 左侧/上方 filter bar。
- 中间 issue list。
- 右侧或下方 selected issue detail。
- source handoff actions。

建议布局：

```text
Review toolbar / filters
Issue groups: Blockers / Warnings / Info
Selected issue detail
Source preview + handoff actions
```

第一版不做：

- comment composer
- resolve button
- assignment
- notification
- drag / reorder

### 10.3 `BookReviewFilterBar.tsx`

新增：

```text
packages/renderer/src/features/review/components/BookReviewFilterBar.tsx
```

显示：

- All
- Blockers
- Trace gaps
- Missing drafts
- Compare deltas
- Export readiness
- Branch readiness
- Scene proposals

每个 filter 显示 count。

### 10.4 `ReviewIssueList.tsx`

新增：

```text
packages/renderer/src/features/review/components/ReviewIssueList.tsx
```

职责：

- group by severity
- issue row 显示 severity / source / title / chapter / scene / tags
- selected issue 高亮
- 点击 issue：`onSelectIssue(issueId)`

### 10.5 `ReviewIssueDetail.tsx`

新增：

```text
packages/renderer/src/features/review/components/ReviewIssueDetail.tsx
```

显示：

- title
- severity
- source
- detail
- recommendation
- source excerpt
- related chapter / scene / asset
- handoff actions

### 10.6 `BookDraftBinderPane.tsx`

可选小改：

- 增加 per chapter review count badge。
- 只显示轻量数字，不把 binder 变成 issue list。
- 点击 chapter 仍然只 patch `selectedChapterId`。

### 10.7 `BookDraftInspectorPane.tsx`

新增 review-aware 区块。

当 `activeDraftView === 'review'` 时，显示：

#### A. Selected review issue

- severity
- source
- title
- chapter / scene anchor
- recommendation

#### B. Review queue summary

- blocker count
- warning count
- trace gap count
- export readiness count
- branch readiness count

#### C. Source handoff

- recommended source action
- open source buttons

Read / Compare / Export / Branch 原有 inspector 不要被破坏。

### 10.8 `BookDraftBottomDock.tsx`

新增 review-aware Problems：

- blockers
- trace gaps
- missing drafts
- export blockers
- branch blockers

Activity 新增：

- entered review
- selected review filter
- selected review issue
- opened issue source

### 10.9 `useBookWorkbenchActivity.ts`

新增 activity kind：

```ts
type BookWorkbenchActivityKind =
  | 'view'
  | 'chapter'
  | 'handoff'
  | 'compare'
  | 'export'
  | 'branch'
  | 'review'
```

Review activity 只读展示，不拥有 route / issue 真源。

---

## 十一、source handoff 规则

### 11.1 Book source

如果 issue source 是 compare：

```ts
patchBookRoute({
  draftView: 'compare',
  checkpointId,
  selectedChapterId,
})
```

如果 issue source 是 export：

```ts
patchBookRoute({
  draftView: 'export',
  exportProfileId,
  selectedChapterId,
})
```

如果 issue source 是 branch：

```ts
patchBookRoute({
  draftView: 'branch',
  branchId,
  branchBaseline,
  checkpointId,
  selectedChapterId,
})
```

### 11.2 Chapter source

```ts
replaceRoute({
  scope: 'chapter',
  chapterId,
  lens: 'draft' | 'structure',
  sceneId,
})
```

Structure 默认 `view='sequence'`。

### 11.3 Scene source

```ts
replaceRoute({
  scope: 'scene',
  sceneId,
  lens: 'orchestrate' | 'draft' | 'structure',
  tab: 'execution' | 'prose' | ...,
})
```

Scene proposal issue 优先打开：

- `lens='orchestrate'`
- `tab='execution'`

Scene draft issue 优先打开：

- `lens='draft'`
- `tab='prose'`

### 11.4 Asset source

如果 issue 关联 asset：

```ts
replaceRoute({
  scope: 'asset',
  assetId,
  lens: 'knowledge',
  view: 'profile',
})
```

---

## 十二、建议的文件改动

### 12.1 新增

```text
packages/renderer/src/features/review/api/book-review-seeds.ts
packages/renderer/src/features/review/components/BookReviewFilterBar.tsx
packages/renderer/src/features/review/components/BookReviewFilterBar.test.tsx
packages/renderer/src/features/review/components/ReviewIssueList.tsx
packages/renderer/src/features/review/components/ReviewIssueList.test.tsx
packages/renderer/src/features/review/components/ReviewIssueDetail.tsx
packages/renderer/src/features/review/components/ReviewIssueDetail.test.tsx
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.test.tsx
packages/renderer/src/features/review/lib/book-review-inbox-mappers.ts
packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts
packages/renderer/src/features/review/types/review-view-models.ts

packages/renderer/src/features/book/components/BookDraftReviewView.tsx
packages/renderer/src/features/book/components/BookDraftReviewView.test.tsx
packages/renderer/src/features/book/components/BookDraftReviewView.stories.tsx
```

### 12.2 修改

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/book/components/BookDraftStage.tsx
packages/renderer/src/features/book/components/BookDraftStage.test.tsx
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/components/BookDraftBinderPane.tsx（可选：review count badge）
packages/renderer/src/features/book/components/BookDraftInspectorPane.tsx
packages/renderer/src/features/book/components/BookDraftBottomDock.tsx
packages/renderer/src/features/book/containers/BookDraftDockContainer.tsx
packages/renderer/src/features/book/hooks/useBookWorkbenchActivity.ts
packages/renderer/src/app/i18n/**
```

### 12.3 这一轮尽量不动

```text
packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.ts
packages/renderer/src/features/book/lib/book-experiment-branch-mappers.ts
packages/renderer/src/features/traceability/** core hook / mapper
packages/renderer/src/features/chapter/** mutation logic
packages/renderer/src/features/scene/** core containers
packages/renderer/src/features/asset/** core containers
```

PR15 的任务是收束 review signals，不是重写 compare / export / branch。

---

## 十三、测试补齐方案

### 13.1 route 测试

至少覆盖：

1. book route 能读写 `draftView='review'`。
2. book route 能读写 `reviewFilter`。
3. book route 能读写 `reviewIssueId`。
4. `lens='draft'` 下保留 dormant structure `view`。
5. `draftView='review'` 不破坏 `checkpointId / exportProfileId / branchId / branchBaseline` dormant state。
6. 四 scope dormant snapshot 继续成立。

### 13.2 mapper 测试

`book-review-inbox-mappers.test.ts` 至少覆盖：

1. current draft missing scene -> `missing_draft` blocker。
2. trace missing -> `trace_gap` warning。
3. compare changed scene -> `compare_delta` issue。
4. export blocker -> `export_blocker` blocker。
5. branch blocker -> `branch_blocker` blocker。
6. branch warning -> `branch_warning` warning。
7. explicit scene proposal seed -> `scene_proposal` issue。
8. filter `blockers` 只返回 blocker。
9. filter `branch-readiness` 只返回 branch source。
10. selected issue id 缺失时 fallback 到第一条 filtered issue。
11. issue sorting deterministic。
12. annotationsByChapterId 聚合正确。

### 13.3 hook 测试

`useBookReviewInboxQuery.test.tsx` 至少覆盖：

1. current / compare / export / branch view-model 能组合成 review inbox。
2. current draft loading 时返回 loading / undefined，不误报空。
3. export / branch workspace 缺失时，review 仍能显示 current / compare issues。
4. selected issue 与 `reviewIssueId` 同步。
5. filter 切换后 selected issue fallback 正确。

### 13.4 component 测试

#### `BookDraftStage.test.tsx`

- `review` tab 可见。
- 切换 `Review` 触发 `onSelectDraftView('review')`。
- `draftView='review'` 渲染 `BookDraftReviewView`。
- read / compare / export / branch 原行为不回归。

#### `BookDraftReviewView.test.tsx`

- 渲染 filter bar。
- 渲染 blocker / warning / info groups。
- selected issue 高亮。
- 点击 issue 触发 `onSelectIssue`。
- 点击 source handoff 触发 `onOpenReviewSource`。
- empty filter 有 calm empty state。

#### `BookReviewFilterBar.test.tsx`

- 显示各 filter label / count。
- active filter 高亮。
- 点击 filter 触发 `onSelectFilter`。

#### `ReviewIssueList.test.tsx`

- group by severity。
- issue row 显示 severity / source / title / chapter / scene。

#### `ReviewIssueDetail.test.tsx`

- 显示 detail / recommendation / source excerpt。
- handoff buttons 可触发。

#### `BookDraftInspectorPane.test.tsx`

- review 模式显示 selected issue summary。
- review 模式显示 queue summary。
- read / compare / export / branch 模式不显示 review-only 区块。

#### `BookDraftBottomDock.test.tsx`

- review 模式显示 blockers / trace gaps / missing drafts。
- activity 可显示 entered review / selected issue / opened source。

### 13.5 workspace 集成测试

新增或扩展 `BookDraftWorkspace.test.tsx`：

```text
打开 /workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=branch-readiness&reviewIssueId=review-branch-high-pressure-missing-draft&selectedChapterId=chapter-open-water-signals
-> binder / review view / inspector / dock 同步聚焦 Open Water Signals
-> review view 显示 branch readiness issue
-> 切 filter 到 export-readiness
-> URL reviewFilter 更新
-> selected issue fallback 到 export issue
-> 点击一个 issue source: Open in Branch
-> 仍在 book scope + draft + branch，branchId / branchBaseline 被恢复
-> browser back
-> 回到 book draft review + 原 reviewFilter + reviewIssueId
-> 切回 Structure
-> structure view 仍是 signals
```

再加一条跨 scope handoff：

```text
打开 book draft review
-> 选择 scene proposal issue
-> Open in Scene Orchestrate
-> 进入 scene scope + orchestrate/execution
-> browser back
-> 回到 book draft review + 原 issue selected
```

### 13.6 app smoke（推荐）

新增：

```text
scene orchestrate snapshot
-> 切到 book draft review
-> 选择 filter / issue
-> 再切回 scene
-> scene lens/tab/proposal snapshot 不丢
```

再补：

```text
book export snapshot
-> 切到 review
-> 再回 export
-> exportProfileId 仍恢复
```

以及：

```text
book branch snapshot
-> 切到 review
-> 再回 branch
-> branchId / branchBaseline 仍恢复
```

---

## 十四、Storybook 建议

新增：

```text
BookDraftReviewView.stories.tsx
BookReviewFilterBar.stories.tsx
ReviewIssueList.stories.tsx
ReviewIssueDetail.stories.tsx
```

更新：

```text
BookDraftStage.stories.tsx
BookDraftInspectorPane.stories.tsx
BookDraftBottomDock.stories.tsx
BookDraftWorkspace.stories.tsx
```

最少 story 组合：

- `ReviewDefault`
- `ReviewBlockers`
- `ReviewTraceGaps`
- `ReviewExportReadiness`
- `ReviewBranchReadiness`
- `ReviewSceneProposal`
- `ReviewEmptyFilter`

---

## 十五、实施顺序（给 AI 的执行顺序）

### Step 1

先扩 route：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`
- 加 `BookDraftView='review'`
- 加 `BookReviewFilter`
- 加 `reviewFilter? / reviewIssueId?`
- 补 route tests

### Step 2

新增 `features/review` 骨架：

- `types/review-view-models.ts`
- `api/book-review-seeds.ts`
- `lib/book-review-inbox-mappers.ts`
- `hooks/useBookReviewInboxQuery.ts`

先写 pure mapper 与 mapper tests。

### Step 3

实现 review UI primitives：

- `BookReviewFilterBar`
- `ReviewIssueList`
- `ReviewIssueDetail`

补组件 tests。

### Step 4

新增 `BookDraftReviewView.tsx`：

- 接 filter bar / issue list / issue detail
- 接 handoff actions
- 保持 read-heavy

### Step 5

接入 `BookDraftStage.tsx`：

- 增加 Review tab
- `draftView='review'` 时渲染 Review view

### Step 6

接入 `BookDraftWorkspace.tsx`：

- 调用 `useBookReviewInboxQuery(...)`
- 传 current / compare / export / branch workspace
- 实现 `onSelectReviewFilter`
- 实现 `onSelectReviewIssue`
- 实现 `onOpenReviewSource`
- 选择 issue 时同步 `selectedChapterId`（如果 issue 有 chapterId）

### Step 7

增强 inspector / dock / activity：

- review summary
- selected issue
- review problems
- review activity

### Step 8

补集成测试与 stories：

- route
- mapper
- hook
- components
- workspace roundtrip
- app smoke
- stories

---

## 十六、完成后的验收标准

满足以下条件，PR15 就算完成：

1. Book route 支持 `draftView='review'`。
2. Book route 支持 `reviewFilter` 与 `reviewIssueId`。
3. `view` 仍只服务 Book Structure，切换 review 不会丢掉 dormant `view`。
4. Book Draft 主舞台有 `Read / Compare / Export / Branch / Review` switcher。
5. Review view 能聚合 current draft、compare、export、branch、traceability、seed review issues。
6. Review filter 能按 blocker / trace gap / missing draft / compare / export / branch / scene proposal 工作。
7. `route.selectedChapterId` 仍统一驱动 Book 内章节聚焦。
8. `reviewIssueId` 只服务 Review issue selection，不替代 chapter/scene/asset identity。
9. issue detail 能提供 source handoff。
10. browser back 能恢复 book draft review 的 `reviewFilter / reviewIssueId / selectedChapterId`。
11. Read / Compare / Export / Branch 原有 route state 不被破坏。
12. scene / chapter / asset dormant snapshot 不被破坏。
13. PR15 不包含 mutation / merge / real export / comment system / notification。

---

## 十七、PR15 结束时不要留下的债

以下情况都算 PR 做偏了：

- 把 Review 做成新 scope 或新 top-level lens。
- 把 `view` 改成 review 子视图，导致 structure dormant view 丢失。
- 为 review 新增 selected chapter 第二真源。
- 为 review 新增 mutable review db。
- 复制 `useBookWorkspaceSources(...)` 或 `useBookDraftWorkspaceQuery(...)` 形成第五套 source waterfall。
- 在 Book client 中新增 giant `getBookReviewInbox()`。
- 做 resolved / assignment / notification。
- 做 branch merge / export file generation。
- Review view 变成 dashboard，而不是审阅队列与 source handoff。
- 破坏 PR14 的 branch route 恢复。

PR15 做完后的正确状态应该是：

**Book Draft 同时支持 Read / Compare / Export / Branch / Review；用户能在 Review Inbox 中统一看到 manuscript readiness、compare deltas、export blockers、branch issues 与少量 proposal/annotation signals，并能跳回源工作面，但系统仍不写入、不 merge、不发布。**

---

## 十八、PR16 以后建议路线（只做保留，不在本轮实施）

### PR16：Real Export Adapter Spike

目标：在 export preview、branch foundation、review inbox 都稳定后，再做真实文件导出的 adapter spike。

范围建议：

- 先只做 Markdown / JSON package
- 不直接上 PDF / EPUB
- 不做 publish API
- export adapter 与 preview mapper 解耦
- 明确 current / checkpoint / branch 三种 export source 的边界
- export 前读取 review blockers，给出 non-blocking warning 或 hard-block policy

### PR17：Selective Branch Merge Spike

目标：在 branch preview 与 review inbox 都能定位 issue 后，再做最小 selected-chapter / selected-scene merge preview。

范围建议：

- 只做 mock merge preview
- 不直接改写 scene prose
- 不做复杂 conflict resolver
- 不做 Git 化 UI
- merge preview 必须关联 review issues / branch deltas

### PR18：Review Comments / Annotation Mutation Spike

目标：在 Review Inbox 稳定后，再考虑最小单人 annotation 写路径。

范围建议：

- 不做多人协作
- 不做 assignment / notification
- 只做 local mock annotation create / edit / delete
- 明确 annotation anchor 与 route snapshot 关系

---

## 十九、给 AI 的最终一句话指令

在当前 `main` 已完成 PR14 的前提下，不要继续抛光 Branch，也不要提前做真实导出、merge 或多人评论；先只围绕 **Review Inbox / Manuscript Annotations Foundation** 做一轮窄而实的实现：

- 给 Book route 增加 `draftView='review'`、`reviewFilter` 与 `reviewIssueId`
- 保持 `view` 仍只服务 Book Structure
- 复用当前 `useBookDraftWorkspaceQuery(...)`、`useBookManuscriptCompareQuery(...)`、`useBookExportPreviewQuery(...)`、`useBookExperimentBranchQuery(...)`
- 不复制 source waterfall
- 用独立 `features/review` 组合层派生 Review Inbox issues
- 把 missing draft、trace gap、compare delta、export blocker、branch readiness、scene proposal seed 收束成统一 issue model
- 在 Book Draft 主舞台增加 Review view 与 filter / issue detail / source handoff
- 让 inspector / dock 显示 review-aware summary 与 activity
- 继续用 `route.selectedChapterId` 统一章节焦点
- 用测试固定 route restore、review mapper、workspace roundtrip、四 scope snapshot 不变
- 明确不做 mutation、merge、真实 export、comment assignment、notification
