# PR16 执行文档：Review Triage Decisions（基于 `codex/pr15-review-inbox-manuscript-annotations` 当前代码）

## 这份文档的目的

这不是路线图回顾，也不是大而全 wishlist。

这是一份**基于当前 `codex/pr15-review-inbox-manuscript-annotations` 分支真实代码状态**整理出来的、可以直接交给 AI agent 实施的 PR16 指令文档。

PR16 的任务，不是继续抛光 PR15 已经完成的 Review Inbox 展示，也不是提前进入真实导出、分支合并或多人评论系统。本轮更合适的目标是：

**给 Review Inbox 增加第一条窄而真实的 triage 写路径，让用户能对 review issue 做“已看过 / 暂缓 / 本轮忽略 / 重新打开”的决策。**

一句话判断：

**PR15 已经让 Book Draft 能聚合审阅问题；PR16 应该让 Book Draft 能处理审阅问题。**

---

## 一、先确认当前代码基线

下面这些判断，必须建立在当前 PR15 代码事实上，而不是沿用 PR12 之前的假设。

### 1. Book Draft 已经拥有完整的 draft 子视图集合

当前 `BookDraftView` 已经包含：

```ts
'read' | 'compare' | 'export' | 'branch' | 'review'
```

`BookDraftStage.tsx` 已经在主舞台中提供：

- `Read`
- `Compare`
- `Export`
- `Branch`
- `Review`

这说明 PR15 后，Book Draft 已经不只是 manuscript reader，而是一个包含 compare / export / branch / review 的 manuscript review workspace。

### 2. PR15 已经新增独立的 `features/review`

当前代码已经有：

```text
packages/renderer/src/features/review/api/book-review-seeds.ts
packages/renderer/src/features/review/components/BookReviewFilterBar.tsx
packages/renderer/src/features/review/components/ReviewIssueDetail.tsx
packages/renderer/src/features/review/components/ReviewIssueList.tsx
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
packages/renderer/src/features/review/lib/book-review-inbox-mappers.ts
packages/renderer/src/features/review/types/review-view-models.ts
```

这说明 Review 已经从 Book feature 内部抽成了独立 feature，但它目前仍主要是 read model / view-model / presentation layer。

### 3. Review Inbox 现在能聚合多个来源，但还没有决策状态

当前 `buildBookReviewInboxViewModel(...)` 已经能从这些来源生成 issue：

- current manuscript draft
- compare workspace
- export preview workspace
- branch workspace
- seed review records

当前 issue 类型已经能表达：

- `missing_draft`
- `trace_gap`
- `compare_delta`
- `export_blocker`
- `export_warning`
- `branch_blocker`
- `branch_warning`
- `scene_proposal`
- `chapter_annotation`

但是它还没有表达：

- 这个 issue 是否被用户看过
- 是否被暂缓到下一轮
- 是否被本轮忽略
- 是否曾经被处理过但因为源内容变化而失效
- 用户是否留下了处理说明

也就是说，当前 Review Inbox 是**聚合视图**，还不是**triage 工作面**。

### 4. 当前 Review UI 只有选择与跳转，没有处理动作

当前组件已经支持：

- `BookReviewFilterBar`：按 source / severity 过滤
- `ReviewIssueList`：分组展示 issue，选择 issue
- `ReviewIssueDetail`：展示详情、建议动作、来源摘录、handoff actions

但 `ReviewIssueDetail` 里还没有：

- Mark reviewed
- Defer
- Dismiss for this pass
- Reopen
- decision note

所以 PR16 的主线很明确：**不要再新增一个 review 页面，而是在当前 Review Inbox 上补决策层。**

### 5. 当前 handoff 心智已经成立，PR16 不应破坏

当前 review issue 的 handoff target 已经能跳到：

- `Book / Draft / Compare`
- `Book / Draft / Export`
- `Book / Draft / Branch`
- `Chapter / Draft`
- `Chapter / Structure`
- `Scene / Orchestrate`
- `Asset / Knowledge`

PR16 必须保留这些 handoff 作为次级动作。Review 的主动作应该是 triage 决策，不是替换现有 handoff。

---

## 二、PR16 的唯一目标

**把 Review Inbox 从 read-only queue 推进到 write-light triage queue。**

PR16 完成后，用户应该能：

1. 在 `Book / Draft / Review` 中看到 issue 的 triage 状态。
2. 对当前 selected issue 执行：
   - `Mark reviewed`
   - `Defer`
   - `Dismiss for this pass`
   - `Reopen`
3. 可选地给决策留下简短 note。
4. 用 route 保持当前：
   - `draftView='review'`
   - `reviewFilter`
   - `reviewStatusFilter`
   - `reviewIssueId`
5. 决策后，issue 能从 open 队列中移出，并在对应状态过滤器中可见。
6. 如果 issue 的源内容变化导致签名不同，旧决策应被标记为 stale，不应继续隐藏新的 issue。
7. browser back / source handoff / dormant snapshot 继续成立。

一句话说：

**PR16 要证明 Review 不只是“看问题和跳转”，而是能承载一轮真实编辑审阅中的 triage decision。**

---

## 三、为什么现在做 triage decisions，而不是真实修稿 / 导出 / 合并

### 1. 当前 Review Inbox 已经有问题来源，但没有处理闭环

PR15 已经把 draft / compare / export / branch / seed annotation 等问题收束到一个入口。如果下一步继续加更多来源，问题数量会增加，但用户仍然只能“看见问题”，不能处理问题。

### 2. 直接修源内容会让 PR16 失控

Review issue 的来源跨越很多 feature：

- missing draft 来自 Book Draft / scene prose
- trace gap 来自 traceability
- compare delta 来自 checkpoint compare
- export blocker 来自 export profile + readiness
- branch warning 来自 branch workspace
- scene proposal 来自 scene orchestration
- chapter annotation 来自 seed / draft issue

如果 PR16 试图直接修所有源，会变成跨 feature mutation 大重构。

更稳的做法是先做一层**review decision overlay**：它不修改源内容，只记录用户对 issue 的审阅决策。

### 3. Triage 决策是后续真实修稿 / publish / branch merge 的前置能力

后续如果要做：

- apply fix
- export package
- branch merge
- publish readiness gate
- multi-pass review

都需要先知道：

- 哪些 issue 仍 open
- 哪些已被确认可暂缓
- 哪些是本轮 false positive
- 哪些之前处理过但源内容已经变了

PR16 正好补这层基础。

---

## 四、本轮明确不做

为了让 PR16 保持“窄而实”，以下内容不要混进来：

- 不做真实 manuscript edit
- 不做 scene / chapter / asset / book 源数据修复
- 不做 export 文件生成
- 不做 branch merge
- 不做 accept / reject branch delta
- 不做多人评论、assignment、mention、thread
- 不做复杂 review pass 历史
- 不做 AI 自动修复
- 不做 graph / global search
- 不新增 `review` scope
- 不新增 `review` 顶层 lens

PR16 的定位必须明确为：

**Review decision overlay，不是 source fixing system。**

---

## 五、必须遵守的硬约束

### 5.1 Review 仍然只是 Book Draft 的一个 draft subview

不要新增：

```ts
scope='review'
lens='review'
```

继续使用当前结构：

```text
scope='book'
lens='draft'
draftView='review'
```

### 5.2 `reviewIssueId` 仍然只是当前选中 issue，不是 issue 数据真源

不要把 issue 本体塞进 route。

route 只允许表达：

- 当前 review filter
- 当前 review status filter
- 当前 selected issue id

issue 数据仍由 query / mapper 派生。

### 5.3 Triage decisions 必须是 overlay，不直接修改 source issue

Review issue 仍然由当前来源生成：

- draft workspace
- compare workspace
- export workspace
- branch workspace
- seed records

PR16 新增的是 decision overlay：

```text
issue source data + decision records -> review inbox view-model
```

不要反过来让 decision record 成为 issue 来源。

### 5.4 决策必须带 issue signature，避免 stale decision 错盖新问题

因为很多 issue 是派生出来的，同一个 `issueId` 可能在源内容变化后代表新的问题版本。

PR16 必须给每个 issue 生成稳定 signature，例如由以下字段拼接：

- `issue.id`
- `issue.kind`
- `issue.source`
- `chapterId`
- `sceneId`
- `assetId`
- `title`
- `detail`
- `sourceExcerpt`

Decision record 存储这个 signature。

当当前 issue signature 与 decision record signature 不一致时：

- 旧 decision 标记为 `stale`
- 当前 issue 仍应出现在 open 队列中
- UI 显示 “decision stale” 提示

### 5.5 决策状态不能声称“已修复源问题”

不要在 PR16 使用会误导用户的 `resolved` 语义作为主要状态。

推荐状态：

```ts
type ReviewDecisionStatus = 'reviewed' | 'deferred' | 'dismissed'
```

含义：

- `reviewed`：用户已看过，保留为本轮已处理。
- `deferred`：用户决定暂缓，后续 review pass 再处理。
- `dismissed`：用户认为本轮不需要处理，或是 false positive。
- `open`：没有 decision overlay，仍待处理。
- `stale`：曾有 decision，但 issue signature 已变化，需要重新处理。

`open` / `stale` 可以是 view-model 状态，不一定存进 DB。

### 5.6 Mock DB 必须可 reset

一旦 PR16 引入 decision mutation，必须有：

```ts
resetMockReviewDecisionDb()
```

否则测试之间会互相污染。

---

## 六、路由改法

### 6.1 `workbench-route.ts`

新增：

```ts
export type BookReviewStatusFilter = 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'
```

扩展 `BookRouteState`：

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
  reviewStatusFilter?: BookReviewStatusFilter
  reviewIssueId?: string
  selectedChapterId?: string
}
```

### 6.2 URL 示例

```text
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=trace-gaps&reviewStatusFilter=open&reviewIssueId=trace-gap-chapter-1-scene-2&selectedChapterId=chapter-1
```

注意：

- `view=signals` 仍然只是 dormant Book Structure view。
- `reviewStatusFilter` 只在 `draftView='review'` 下使用。

### 6.3 `useWorkbenchRouteState.ts`

要做的事：

1. 增加 `VALID_BOOK_REVIEW_STATUS_FILTERS`。
2. `CANONICAL_ROUTE_KEYS` 增加 `reviewStatusFilter`。
3. `readBookSnapshot(...)` 读取 `reviewStatusFilter`。
4. `normalizeBookRoute(...)` 在 `draftView='review'` 时 fallback 到 `reviewStatusFilter='open'`。
5. `buildWorkbenchSearch(...)` 写入真实 `reviewStatusFilter`。
6. `patchBookRoute(...)` 继续保持一个 API，不新增 review 专用 route patch。

### 6.4 默认规则

- `draftView !== 'review'` 时保留 dormant `reviewFilter / reviewStatusFilter / reviewIssueId`，但 UI 不使用。
- `draftView='review'` 且 `reviewStatusFilter` 缺失时 fallback 到 `'open'`。
- 如果当前 `reviewIssueId` 不在过滤结果中，mapper 选择第一个可见 issue，container 用 `{ replace: true }` canonicalize route。

---

## 七、数据层设计

### 7.1 新增 review decision records

新增文件：

```text
packages/renderer/src/features/review/api/review-decision-records.ts
packages/renderer/src/features/review/api/mock-review-decision-db.ts
packages/renderer/src/features/review/api/review-client.ts
```

推荐类型：

```ts
export type ReviewDecisionStatus = 'reviewed' | 'deferred' | 'dismissed'

export interface ReviewIssueDecisionRecord {
  id: string
  bookId: string
  issueId: string
  issueSignature: string
  status: ReviewDecisionStatus
  note?: string
  updatedAtLabel: string
  updatedByLabel: string
}
```

### 7.2 Mock DB

`mock-review-decision-db.ts` 应提供：

```ts
export function getMockBookReviewDecisions(bookId: string): ReviewIssueDecisionRecord[]
export function setMockReviewIssueDecision(input: SetReviewIssueDecisionInput): ReviewIssueDecisionRecord
export function clearMockReviewIssueDecision(input: ClearReviewIssueDecisionInput): void
export function resetMockReviewDecisionDb(): void
```

### 7.3 Review client

`review-client.ts` 第一版只需要：

```ts
export interface ReviewClient {
  getBookReviewDecisions(input: { bookId: string }): Promise<ReviewIssueDecisionRecord[]>
  setReviewIssueDecision(input: {
    bookId: string
    issueId: string
    issueSignature: string
    status: ReviewDecisionStatus
    note?: string
  }): Promise<ReviewIssueDecisionRecord>
  clearReviewIssueDecision(input: {
    bookId: string
    issueId: string
  }): Promise<void>
}
```

### 7.4 Query keys

新增：

```text
packages/renderer/src/features/review/hooks/review-query-keys.ts
```

建议：

```ts
export const reviewQueryKeys = {
  decisions: (bookId: string) => ['review', 'decisions', bookId] as const,
}
```

---

## 八、Hook 与 mutation 设计

### 8.1 `useBookReviewDecisionsQuery.ts`

新增：

```text
packages/renderer/src/features/review/hooks/useBookReviewDecisionsQuery.ts
```

职责：

- 调用 `reviewClient.getBookReviewDecisions({ bookId })`
- 返回当前 book 的 decision records
- loading / error 纳入 review inbox loading / partial error 逻辑

### 8.2 `useSetReviewIssueDecisionMutation.ts`

新增：

```text
packages/renderer/src/features/review/hooks/useSetReviewIssueDecisionMutation.ts
```

职责：

- 调用 `reviewClient.setReviewIssueDecision(...)`
- 对 `reviewQueryKeys.decisions(bookId)` 做 optimistic update
- error 时 rollback
- settled 后 invalidate 同一个 key

### 8.3 `useClearReviewIssueDecisionMutation.ts`

新增：

```text
packages/renderer/src/features/review/hooks/useClearReviewIssueDecisionMutation.ts
```

职责：

- 调用 `reviewClient.clearReviewIssueDecision(...)`
- optimistic remove 当前 decision
- error rollback
- settled invalidate

### 8.4 `useBookReviewInboxQuery.ts`

修改当前 hook：

- 内部调用 `useBookReviewDecisionsQuery({ bookId })`，或接受 `decisionRecords` 作为可注入依赖。
- 把 `reviewStatusFilter` 传给 mapper。
- loading 状态要包含 decision loading。
- decision error 不应该让整个 inbox 崩掉；可以显示 partial warning，并让 inbox 继续以 open 状态展示。

推荐结果结构增加：

```ts
export interface UseBookReviewInboxQueryResult {
  inbox: BookReviewInboxViewModel | null | undefined
  isLoading: boolean
  error: Error | null
  decisionError: Error | null
  isEmpty: boolean
}
```

---

## 九、Mapper 与 view-model 设计

### 9.1 扩展 review types

修改：

```text
packages/renderer/src/features/review/types/review-view-models.ts
```

新增：

```ts
export type ReviewDecisionStatus = 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'stale'

export interface ReviewIssueDecisionViewModel {
  status: ReviewDecisionStatus
  note?: string
  updatedAtLabel?: string
  updatedByLabel?: string
  isStale: boolean
}
```

扩展 `ReviewIssueViewModel`：

```ts
interface ReviewIssueViewModel {
  // existing fields
  issueSignature: string
  decision: ReviewIssueDecisionViewModel
}
```

扩展 counts：

```ts
interface BookReviewInboxCountsViewModel {
  // existing counts
  open: number
  reviewed: number
  deferred: number
  dismissed: number
  stale: number
}
```

扩展 inbox：

```ts
interface BookReviewInboxViewModel {
  // existing fields
  activeStatusFilter: BookReviewStatusFilter
  visibleOpenCount: number
}
```

### 9.2 Mapper 新增函数

修改：

```text
packages/renderer/src/features/review/lib/book-review-inbox-mappers.ts
```

新增或拆出：

```ts
export function createReviewIssueSignature(issue: ReviewIssueViewModel | ReviewIssueSeedShape): string

export function applyReviewDecisionsToIssues({
  issues,
  decisions,
}: {
  issues: ReviewIssueViewModel[]
  decisions: ReviewIssueDecisionRecord[]
}): ReviewIssueViewModel[]

export function filterReviewIssuesByStatus(
  issues: ReviewIssueViewModel[],
  statusFilter: BookReviewStatusFilter,
): ReviewIssueViewModel[]
```

### 9.3 过滤顺序

推荐顺序：

```text
source/severity filter -> status filter -> grouping/sorting/selection
```

也就是说：

- `reviewFilter` 继续负责 “all / blockers / trace gaps / compare deltas / export readiness / branch readiness ...”
- `reviewStatusFilter` 负责 “open / reviewed / deferred / dismissed / all”

### 9.4 stale 规则

如果存在 decision record，但：

```ts
decision.issueSignature !== currentIssue.issueSignature
```

则：

- `issue.decision.status = 'stale'`
- `issue.decision.isStale = true`
- 默认在 `open` 过滤器中可见
- 在 `all` 中也可见
- 不在 `reviewed / deferred / dismissed` 中可见

### 9.5 决策后的选择规则

如果当前 selected issue 因决策而被过滤掉：

- `selectedIssue` fallback 到 filtered list 的第一项
- `selectedIssueId` 更新为 fallback issue id
- 若列表为空，则为 `null`

Container 用 `patchBookRoute({ reviewIssueId: nextId }, { replace: true })` canonicalize。

---

## 十、UI 改法

### 10.1 新增 `ReviewDecisionControls.tsx`

新增：

```text
packages/renderer/src/features/review/components/ReviewDecisionControls.tsx
```

Props：

```ts
interface ReviewDecisionControlsProps {
  issue: ReviewIssueViewModel
  isSaving?: boolean
  onSetDecision: (input: {
    issueId: string
    issueSignature: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
  }) => void
  onClearDecision: (issueId: string) => void
}
```

UI：

- decision status badge
- optional note textarea（可以先做单行/短 textarea）
- `Mark reviewed`
- `Defer`
- `Dismiss for this pass`
- `Reopen`（仅当 status 不是 `open` 或 `stale`）

### 10.2 修改 `ReviewIssueDetail.tsx`

新增 props：

```ts
isDecisionSaving?: boolean
onSetDecision?: ReviewDecisionControlsProps['onSetDecision']
onClearDecision?: ReviewDecisionControlsProps['onClearDecision']
```

并在 recommendation / source excerpt 附近加入 `ReviewDecisionControls`。

注意：

- handoff actions 继续保留。
- decision actions 不应该取代 source handoff。

### 10.3 新增 `BookReviewStatusFilterBar.tsx`

新增：

```text
packages/renderer/src/features/review/components/BookReviewStatusFilterBar.tsx
```

状态过滤：

- `Open`
- `Reviewed`
- `Deferred`
- `Dismissed`
- `All`

每个按钮显示对应 counts。

### 10.4 修改 `BookDraftReviewView.tsx`

新增：

- status filter bar
- decision controls handlers
- partial decision error warning

Props 增加：

```ts
activeStatusFilter: BookReviewStatusFilter
onSelectStatusFilter: (statusFilter: BookReviewStatusFilter) => void
onSetDecision: ReviewDecisionControlsProps['onSetDecision']
onClearDecision: (issueId: string) => void
isDecisionSaving?: boolean
```

### 10.5 修改 `ReviewIssueList.tsx`

每个 issue row 增加：

- decision status badge
- stale badge（如果有）
- note indicator（如果有 note）

不要让 row 变成复杂控制台。

### 10.6 修改 `BookDraftInspectorPane.tsx`

在 `activeDraftView === 'review'` 时补充：

- selected issue decision status
- decision note
- stale decision warning
- next recommended action

### 10.7 修改 `BookDraftBottomDock.tsx`

Review mode 下 Problems / Activity 增加：

- open issue count
- reviewed / deferred / dismissed count
- stale decision count

Activity 增加：

- marked reviewed
- deferred issue
- dismissed issue
- reopened issue

---

## 十一、BookDraftWorkspace 接线要求

修改：

```text
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
```

要做的事：

1. 从 route 读取：
   - `reviewFilter`
   - `reviewStatusFilter`
   - `reviewIssueId`
2. 调用增强后的 `useBookReviewInboxQuery(...)`。
3. 接入：
   - `useSetReviewIssueDecisionMutation(...)`
   - `useClearReviewIssueDecisionMutation(...)`
4. 把决策 handlers 传给 `BookDraftStage -> BookDraftReviewView -> ReviewIssueDetail`。
5. 决策成功后：
   - 如果当前 status filter 是 `open`，让已决策 issue 从当前列表消失。
   - canonicalize `reviewIssueId` 到当前 filtered list 的新 selected issue。
6. 把 selected issue / status filter 传给 activity hook。
7. 保留现有 `onOpenReviewSource` handoff。

### 不要做

- 不要把 decision state 放进 `BookDraftWorkspace` 的本地 `useState` 作为真源。
- 不要把 decision 直接写进 review issue seed。
- 不要修改 compare / export / branch / draft source data。

---

## 十二、建议的文件改动

### 12.1 新增

```text
packages/renderer/src/features/review/api/review-decision-records.ts
packages/renderer/src/features/review/api/mock-review-decision-db.ts
packages/renderer/src/features/review/api/review-client.ts
packages/renderer/src/features/review/hooks/review-query-keys.ts
packages/renderer/src/features/review/hooks/useBookReviewDecisionsQuery.ts
packages/renderer/src/features/review/hooks/useSetReviewIssueDecisionMutation.ts
packages/renderer/src/features/review/hooks/useClearReviewIssueDecisionMutation.ts
packages/renderer/src/features/review/components/BookReviewStatusFilterBar.tsx
packages/renderer/src/features/review/components/BookReviewStatusFilterBar.test.tsx
packages/renderer/src/features/review/components/ReviewDecisionControls.tsx
packages/renderer/src/features/review/components/ReviewDecisionControls.test.tsx
```

### 12.2 修改

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/review/types/review-view-models.ts
packages/renderer/src/features/review/lib/book-review-inbox-mappers.ts
packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.test.tsx
packages/renderer/src/features/review/components/BookReviewFilterBar.tsx
packages/renderer/src/features/review/components/ReviewIssueDetail.tsx
packages/renderer/src/features/review/components/ReviewIssueDetail.test.tsx
packages/renderer/src/features/review/components/ReviewIssueList.tsx
packages/renderer/src/features/review/components/ReviewIssueList.test.tsx
packages/renderer/src/features/book/components/BookDraftReviewView.tsx
packages/renderer/src/features/book/components/BookDraftReviewView.test.tsx
packages/renderer/src/features/book/components/BookDraftInspectorPane.tsx
packages/renderer/src/features/book/components/BookDraftBottomDock.tsx
packages/renderer/src/features/book/hooks/useBookWorkbenchActivity.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/app/i18n/**
```

### 12.3 这一轮尽量不动

```text
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.ts
packages/renderer/src/features/book/lib/book-*-mappers.ts（除非类型适配）
packages/renderer/src/features/scene/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/traceability/**
```

PR16 的任务是 review decision overlay，不是重做 source workspaces。

---

## 十三、测试补齐方案

### 13.1 route 测试

至少覆盖：

1. `BookReviewStatusFilter` 能读写 `open / reviewed / deferred / dismissed / all`。
2. `draftView='review'` 下缺失 status filter 时 fallback 到 `open`。
3. `draftView !== 'review'` 时 dormant `reviewStatusFilter` 不破坏其他 draft views。
4. 四 scope dormant snapshot 规则继续成立。

### 13.2 mock db / client 测试

新增测试至少覆盖：

1. `setReviewIssueDecision(...)` 会写入 mutable mock db。
2. 同一 `bookId + issueId` 再次写入会覆盖旧 decision。
3. `clearReviewIssueDecision(...)` 会移除 decision。
4. `resetMockReviewDecisionDb()` 会清空测试污染。
5. client 返回 clone，不泄漏 mutable db 引用。

### 13.3 mapper 测试

扩展 `book-review-inbox-mappers.test.ts`，至少覆盖：

1. open issue 没有 decision 时 status 为 `open`。
2. reviewed decision 会让 issue status 变为 `reviewed`。
3. deferred decision 会让 issue status 变为 `deferred`。
4. dismissed decision 会让 issue status 变为 `dismissed`。
5. decision signature 不匹配时 status 为 `stale`，且仍出现在 open 过滤器中。
6. `reviewFilter` 与 `reviewStatusFilter` 组合过滤正确。
7. counts 中 open / reviewed / deferred / dismissed / stale 正确。
8. 当前 selected issue 被过滤掉时 fallback 到第一条可见 issue。

### 13.4 mutation hook 测试

新增：

- `useSetReviewIssueDecisionMutation.test.tsx`
- `useClearReviewIssueDecisionMutation.test.tsx`

至少覆盖：

1. optimistic update 立即更新 decisions cache。
2. error rollback。
3. settled invalidate 正确 key。
4. clear decision 后 issue 回到 open。

### 13.5 component 测试

#### `ReviewDecisionControls.test.tsx`

- 默认 issue 显示 open 状态。
- 点击 `Mark reviewed` 调用 `onSetDecision`。
- 点击 `Defer` 调用 `onSetDecision`。
- 点击 `Dismiss for this pass` 调用 `onSetDecision`。
- actioned issue 显示 `Reopen`。
- note 输入会随 action 提交。

#### `BookReviewStatusFilterBar.test.tsx`

- 渲染五个 status filter。
- 显示 counts。
- 点击 filter 触发 `onSelectStatusFilter`。

#### `ReviewIssueList.test.tsx`

- issue row 显示 decision status badge。
- stale decision 显示 stale badge。
- selected issue 高亮不变。

#### `ReviewIssueDetail.test.tsx`

- 保留 handoff actions。
- 显示 decision controls。
- actioned issue 显示 note / status。

#### `BookDraftReviewView.test.tsx`

- source filter + status filter 同时存在。
- 决策按钮会向上传递。
- partial decision error 时保持 inbox 可见。

### 13.6 workspace 集成测试

扩展或新增 `BookDraftWorkspace.test.tsx`：

```text
打开 /workbench?scope=book&id=book-signal-arc&lens=draft&draftView=review&reviewFilter=all&reviewStatusFilter=open
-> Review queue 显示 open issues
-> 选择一个 blocker
-> 点击 Defer
-> issue 从 open 列表移出
-> URL reviewIssueId 被 canonicalize 到下一条 open issue
-> 切到 reviewStatusFilter=deferred
-> 刚刚 deferred 的 issue 可见
-> 点击 Reopen
-> issue 回到 open
-> bottom dock activity 记录 deferred / reopened
```

再补一条 source handoff smoke：

```text
打开 review
-> mark reviewed 某 issue
-> open issue source 到 chapter draft / scene / asset
-> browser back
-> 回到 review，decision 状态仍在
```

### 13.7 app smoke

推荐新增：

```text
scene orchestrate snapshot
-> 切到 book draft review
-> 标记一个 issue reviewed
-> 切回 scene
-> scene lens/tab/proposal snapshot 不丢
-> 再切回 book review
-> reviewed decision 仍可见
```

---

## 十四、Storybook 建议

新增：

```text
BookReviewStatusFilterBar.stories.tsx
ReviewDecisionControls.stories.tsx
```

更新：

```text
ReviewIssueDetail.stories.tsx
ReviewIssueList.stories.tsx
BookDraftReviewView.stories.tsx
BookDraftInspectorPane.stories.tsx
BookDraftBottomDock.stories.tsx
```

最少 story 组合：

- `OpenIssue`
- `ReviewedIssue`
- `DeferredIssue`
- `DismissedIssue`
- `StaleDecision`
- `EmptyOpenQueue`
- `DecisionErrorPartialInbox`

---

## 十五、实施顺序（给 AI 的执行顺序）

### Step 1
先扩 route：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`
- 新增 `BookReviewStatusFilter`
- 加 `reviewStatusFilter?`
- 补 route tests

### Step 2
新增 review decision 数据层：

- `review-decision-records.ts`
- `mock-review-decision-db.ts`
- `review-client.ts`
- reset helper
- client tests

### Step 3
新增 query keys 与 mutation hooks：

- `review-query-keys.ts`
- `useBookReviewDecisionsQuery.ts`
- `useSetReviewIssueDecisionMutation.ts`
- `useClearReviewIssueDecisionMutation.ts`

### Step 4
先改 mapper：

- issue signature
- decision overlay
- status filter
- stale decision
- counts
- selected issue fallback

先把 mapper 单测写稳。

### Step 5
接入 `useBookReviewInboxQuery.ts`：

- 读取 decisions
- 合并 decisions
- 暴露 decision loading / error

### Step 6
实现 UI：

- `BookReviewStatusFilterBar`
- `ReviewDecisionControls`
- 修改 detail / list / review view

### Step 7
回到 `BookDraftWorkspace.tsx` 接线：

- mutation handlers
- status filter route patch
- selected issue canonicalization
- decision activity

### Step 8
增强 inspector / dock / activity：

- decision status
- decision note
- stale warning
- open / actioned counts

### Step 9
补 workspace integration / app smoke / stories。

---

## 十六、完成后的验收标准

满足以下条件，PR16 就算完成：

1. Book route 支持 `reviewStatusFilter`。
2. Review issue view-model 支持 decision overlay。
3. Review decision records 存在 read/write mock db，且测试可 reset。
4. 用户能在 Review Inbox 中 mark reviewed / defer / dismiss / reopen。
5. 决策后 open queue、status filter、counts、selected issue 都正确更新。
6. stale decision 不会错误隐藏源内容已变化的新 issue。
7. Review handoff actions 仍可用。
8. Bottom dock activity 能记录 review decision。
9. Browser back / source handoff 后 decision 状态仍保留在当前 mock session。
10. 现有 Read / Compare / Export / Branch / Review view 不被破坏。
11. scene / chapter / asset / book dormant snapshot 规则不被破坏。
12. PR16 不包含真实 source fix、export 文件生成、branch merge、多人评论系统。

---

## 十七、PR16 结束时不要留下的债

以下情况都算 PR 做偏了：

- 新增了 `review` scope 或顶层 lens。
- 为 Review 选择新造了本地 selected issue store，和 route 冲突。
- 决策直接修改 draft / compare / export / branch source data。
- 决策没有 issue signature，导致旧 decision 错误隐藏新问题。
- `resolved` 语义被当作“源问题已修复”，但实际没有修源。
- Mock decision DB 没有 reset，导致测试互相污染。
- ReviewIssueDetail 被做成复杂评论系统。
- 顺手做了 export 文件生成 / branch merge / manuscript edit。

PR16 做完后的正确状态应该是：

**Review Inbox 仍是 Book Draft 的 supporting review surface，但已经拥有第一条真实、可测试、route-friendly 的 triage 决策写路径。**

---

## 十八、PR17 以后建议路线（只保留，不在本轮实施）

### PR17：Review Source Fix Actions Foundation

在 PR16 的 decision overlay 之后，再做小范围 source fix action：

- 从 review issue 进入对应 source surface。
- 对少数安全问题提供 fix intent，例如 missing draft -> open chapter draft，trace gap -> open trace source。
- 仍不做 AI 自动修复。

### PR18：Export Package Artifact Foundation

在 export preview / review gate 都稳定后，再做真实 export artifact：

- 先生成 markdown / plain text package。
- 不急着做 PDF / EPUB / DOCX。
- 使用 Review open blockers 作为 packaging gate。

### PR19：Branch Merge Readiness / Selective Apply

在 review decisions 与 export gate 都成立后，再做 branch merge 的第一版：

- selective apply branch sections
- branch issue gate
- 不做 Git 化 UI。

---

## 十九、给 AI 的最终一句话指令

在当前 `codex/pr15-review-inbox-manuscript-annotations` 已经完成 PR15 的前提下，不要继续抛光只读 Review Inbox，也不要提前做真实 export / branch merge / 多人评论；先只围绕 **Review Triage Decisions** 做一轮窄而实的实现：

- 给 Book route 增加 `reviewStatusFilter`
- 给 review feature 新增 decision records / mutable mock db / reset helper / review client
- 用 issue signature 把 decision overlay 安全地叠到当前派生 issues 上
- 支持 mark reviewed / defer / dismiss / reopen
- 让 status filter、counts、selected issue canonicalization 都由 mapper 与 route 共同固定
- 保留现有 review source handoff
- 增强 inspector / dock / activity，但不让它们成为第二真源
- 用测试固定 route restore、decision overlay、stale decision、mutation optimistic update、四 scope snapshot 不变
- 明确不做 source fix、export 文件生成、branch merge、AI rewrite、多人评论系统
