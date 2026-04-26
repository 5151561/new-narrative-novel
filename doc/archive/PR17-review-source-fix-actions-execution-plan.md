# PR17 执行文档：Review Source Fix Actions Foundation

基于当前分支：`codex/pr16-review-triage-decisions`

## 这份文档的目的

这不是路线图回顾，也不是大而全 wishlist。

这是一份**基于当前 `codex/pr16-review-triage-decisions` 分支真实代码状态**整理出来的、可以直接交给 AI agent 实施的 PR17 指令文档。

PR17 的任务，不是继续抛光 PR16 已经完成的 Review Triage Decisions，也不是直接进入真实修稿、真实导出、branch merge 或多人评论系统。本轮更合适的目标是：

**给 Review Inbox 增加第一版 Source Fix Actions，让用户能从 review issue 发起可追踪的“去源头处理”动作，并在返回 Review 后看见这个 issue 的 fix action 状态。**

一句话判断：

**PR16 已经让 Review Inbox 能决定“这个问题本轮怎么处理”；PR17 应该让 Review Inbox 能发起“去哪里处理这个问题”。**

---

## 一、先确认当前代码基线

下面这些判断必须建立在 PR16 当前代码事实上，而不是沿用 PR15 或 PR12 之前的假设。

### 1. Book Draft 已经拥有完整的 manuscript workflow 子视图

当前 `BookDraftView` 已经包含：

```ts
' read ' | ' compare ' | ' export ' | ' branch ' | ' review '
```

实际类型中是：

```ts
export type BookDraftView = 'read' | 'compare' | 'export' | 'branch' | 'review'
```

`BookDraftStage.tsx` 也已经在主舞台中提供：

- `Read`
- `Compare`
- `Export`
- `Branch`
- `Review`

所以 PR17 不需要新增新的 Book Draft 子视图，也不需要新增新的 `review` scope。

### 2. Review 已经是独立 feature，而不是 Book 内部临时组件

当前代码已有：

```text
packages/renderer/src/features/review/api/
packages/renderer/src/features/review/components/
packages/renderer/src/features/review/hooks/
packages/renderer/src/features/review/lib/
packages/renderer/src/features/review/types/
```

PR16 之后，`review` feature 已经包含：

- review seed records
- review decision records
- mutable mock review decision db
- review client
- review query keys
- review decision query / mutation hooks
- review inbox mapper
- decision controls
- source / status filter components

这说明 PR17 应继续在 `features/review` 内扩展 source-fix action overlay，而不是把逻辑塞回 `features/book`。

### 3. PR16 已经把 Review 从 read-only queue 推进到 triage queue

当前 Review issue view-model 已经包含：

- `issueSignature`
- `decision.status`
- `decision.note`
- `decision.isStale`

当前 Review decision 状态已经覆盖：

- `open`
- `reviewed`
- `deferred`
- `dismissed`
- `stale`

并且 `BookReviewStatusFilter` 已经支持：

```ts
'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'
```

这意味着 PR17 不应重复做 triage 决策，而应在 triage 之上补“source fix action”这一层。

### 4. Review issue 已经有 cross-scope handoff，但 handoff 还不可追踪

当前 `ReviewSourceHandoffTarget` 已经能指向：

- `Book / Draft / Compare`
- `Book / Draft / Export`
- `Book / Draft / Branch`
- `Chapter / Draft`
- `Chapter / Structure`
- `Scene / Orchestrate`
- `Scene / Draft`
- `Asset / Knowledge`

当前 `BookDraftWorkspace.tsx` 也已经有 `onOpenReviewSource(...)`，能按 handoff target 调用 `replaceRoute(...)`。

但这条动作现在仍只是“跳转”：

- 没有记录用户是否已经从这个 issue 发起过 source fix
- 没有记录用户选择的是哪条 source handoff
- 没有记录用户回来后是否认为 source 已检查过
- 没有区分“triage 决策”和“source fix 尝试”

这正是 PR17 要补的洞。

### 5. PR16 文档也已经把下一步指向 Source Fix Actions

PR16 的后续建议里已经明确把下一轮保留为：

- `PR17：Review Source Fix Actions Foundation`
- 从 review issue 进入对应 source surface
- 对少数安全问题提供 fix intent
- 仍不做 AI 自动修复

PR17 应把这条保留路线落成一轮窄而实的代码改动。

---

## 二、PR17 的唯一目标

**把 Review Inbox 从“能做 triage 决策”推进到“能发起并追踪 source fix action”。**

PR17 完成后，用户应该能：

1. 在 `Book / Draft / Review` 中选中一个 review issue。
2. 看到该 issue 的推荐 source fix action。
3. 点击 `Start source fix`：
   - 先写入一条 source fix action record
   - 再打开对应 source surface
4. 通过浏览器 back 返回 Review 后，看见该 issue 已经标记为 `fix started`。
5. 对已 started 的 issue 执行：
   - `Mark source checked`
   - `Mark blocked`
   - `Clear fix action`
6. 可选地给 source fix action 留下简短 note。
7. 如果 issue 的 `issueSignature` 变化，旧 fix action 被标记为 stale，不应误导用户认为新问题已经被处理过。
8. Review decision 与 source fix action 彼此独立：
   - `reviewed / deferred / dismissed` 表示 triage 决策
   - `started / checked / blocked` 表示 source fix 尝试

一句话说：

**PR17 要让 Review issue 的“去源头处理”从一次性跳转，升级成可记录、可回看、可测试的 source fix action overlay。**

---

## 三、为什么现在做 Source Fix Actions，而不是直接修源数据

### 1. PR16 已经解决“怎么处理这个 issue”的决策层

PR16 让用户能把 issue 标为：

- reviewed
- deferred
- dismissed
- reopened

但它仍没有回答：

**我现在要去哪里修这个 issue，回来后系统怎么知道我尝试过修？**

PR17 正好补这层。

### 2. 直接修改源数据会让 PR17 失控

Review issue 的来源横跨很多 feature：

- missing draft 来自 Book Draft / Chapter Draft / scene prose
- trace gap 来自 traceability
- compare delta 来自 checkpoint compare
- export blocker 来自 export readiness
- branch warning 来自 branch workspace
- scene proposal 来自 scene orchestration
- asset mention / trace issue 来自 asset knowledge

如果 PR17 直接修所有源，会变成跨 feature mutation 大重构。

更稳的做法是：

```text
review issue + source fix action records -> review inbox view-model
```

而不是：

```text
review issue -> 自动修改 source data
```

### 3. Source fix action 是真实修稿和 publish gate 的前置层

后续如果要做：

- apply fix
- source-specific patch
- branch selective apply
- export package gate
- publish readiness gate

系统都需要先知道：

- 哪些 issue 已经发起过 source fix
- 哪些 issue 被用户检查过但没有消失
- 哪些 issue 被用户标记为 blocked
- 哪些 fix attempt 因 issue signature 变化而 stale

PR17 建这层基础最合适。

---

## 四、本轮明确不做

为了让 PR17 保持“窄而实”，以下内容不要混进来：

- 不做真实 manuscript edit
- 不修改 scene / chapter / asset / book 源数据
- 不生成 export 文件
- 不做 branch merge
- 不做 accept / reject branch delta
- 不做 AI 自动修复
- 不做多人评论、assignment、mention、thread
- 不做复杂 review pass history
- 不新增 `review` scope
- 不新增 `review` 顶层 lens
- 不新增 source-specific route 参数，例如 `fixActionId`
- 不把 source fix action 自动等同于 issue resolved

PR17 的定位必须明确为：

**Review Source Fix Action Overlay，不是 source mutation system。**

---

## 五、必须遵守的硬约束

### 5.1 Review 仍然只是 Book Draft 的一个 draft subview

继续使用当前结构：

```text
scope='book'
lens='draft'
draftView='review'
```

不要新增：

```text
scope='review'
lens='review'
```

### 5.2 `reviewIssueId` 仍然只是当前选中 issue，不是数据真源

Route 只允许表达：

- 当前 review filter
- 当前 review status filter
- 当前 selected issue id

PR17 不应把 source fix action 本体塞进 route。

不要新增：

```ts
fixActionId?: string
fixStatusFilter?: string
selectedSourceHandoffId?: string
```

### 5.3 Source fix action 必须是 overlay，不直接修改 source issue

当前 issue 仍然由这些来源生成：

- current draft workspace
- compare workspace
- export workspace
- branch workspace
- seed review records

PR17 新增的是 source fix action overlay：

```text
issue source data + triage decisions + source fix action records -> review inbox view-model
```

不要反过来让 source fix action 成为 issue 来源。

### 5.4 Source fix action 必须绑定 `issueSignature`

和 PR16 decision overlay 一样，source fix action 也必须带 `issueSignature`。

当当前 issue signature 与 fix action record signature 不一致时：

- 旧 fix action 标记为 `stale`
- 当前 issue 仍按新的问题展示
- UI 显示 stale fix action 提示
- 用户可以 clear / restart source fix action

### 5.5 Source fix action 不使用 `resolved` 语义

不要在 PR17 使用容易误导的 `resolved`。

推荐持久化状态：

```ts
type ReviewFixActionStatus = 'started' | 'checked' | 'blocked'
```

推荐 view-model 状态：

```ts
type ReviewFixActionViewStatus =
  | 'not_started'
  | 'started'
  | 'checked'
  | 'blocked'
  | 'stale'
```

含义：

- `not_started`：尚未从 Review 发起 source fix。
- `started`：用户已经从该 issue 打开 source surface。
- `checked`：用户回来后手动标记 source 已检查。
- `blocked`：用户回来后手动标记目前无法处理。
- `stale`：曾有 fix action，但 issue signature 已变化，需要重新处理。

### 5.6 Decision 和 fix action 必须互相独立

不要因为：

- `Mark source checked`

就自动执行：

- `Mark reviewed`

也不要因为：

- `Dismiss for this pass`

就自动清掉 source fix action。

两层含义不同：

- decision = 本轮审阅怎么处理这个 issue
- fix action = 是否已发起 / 检查过对应 source surface

### 5.7 Mock DB 必须可 reset

一旦 PR17 引入 fix action mutation，必须有：

```ts
resetMockReviewFixActionDb()
```

否则测试之间会互相污染。

---

## 六、路由改法

PR17 **默认不需要新增 route 字段**。

现有字段继续够用：

```ts
reviewFilter?: BookReviewFilter
reviewStatusFilter?: BookReviewStatusFilter
reviewIssueId?: string
```

### 保持现有 URL 形态

```text
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&reviewStatusFilter=open&reviewIssueId=trace-gap-chapter-1-scene-2&selectedChapterId=chapter-1
```

### 为什么不新增 `fixStatusFilter`

Source fix action 是 selected issue 的支持信息，不是本轮的队列主过滤轴。

PR16 已经给 queue 增加了 status filter；PR17 不应该继续增加第二套 filter，使 Review Inbox 变成筛选器墙。

第一版只在：

- issue row badge
- selected issue detail
- inspector
- dock summary

展示 fix action 状态即可。

---

## 七、数据层设计

### 7.1 新增 review source fix action records

新增文件：

```text
packages/renderer/src/features/review/api/review-fix-action-records.ts
packages/renderer/src/features/review/api/mock-review-fix-action-db.ts
```

推荐类型：

```ts
export type ReviewFixActionStatus = 'started' | 'checked' | 'blocked'

export interface ReviewIssueFixActionRecord {
  id: string
  bookId: string
  issueId: string
  issueSignature: string
  sourceHandoffId: string
  sourceHandoffLabel: string
  targetScope: 'book' | 'chapter' | 'scene' | 'asset'
  status: ReviewFixActionStatus
  note?: string
  startedAtLabel: string
  updatedAtLabel: string
  updatedByLabel: string
}
```

### 7.2 Mock DB API

`mock-review-fix-action-db.ts` 应提供：

```ts
export function getMockBookReviewFixActions(bookId: string): ReviewIssueFixActionRecord[]

export function setMockReviewIssueFixAction(input: SetReviewIssueFixActionInput): ReviewIssueFixActionRecord

export function clearMockReviewIssueFixAction(input: ClearReviewIssueFixActionInput): void

export function resetMockReviewFixActionDb(): void
```

推荐 input：

```ts
export interface SetReviewIssueFixActionInput {
  bookId: string
  issueId: string
  issueSignature: string
  sourceHandoffId: string
  sourceHandoffLabel: string
  targetScope: 'book' | 'chapter' | 'scene' | 'asset'
  status: ReviewFixActionStatus
  note?: string
}

export interface ClearReviewIssueFixActionInput {
  bookId: string
  issueId: string
}
```

### 7.3 Review client 扩展

修改：

```text
packages/renderer/src/features/review/api/review-client.ts
```

在现有 decision methods 基础上增加：

```ts
getBookReviewFixActions(input: { bookId: string }): Promise<ReviewIssueFixActionRecord[]>

setReviewIssueFixAction(input: SetReviewIssueFixActionInput): Promise<ReviewIssueFixActionRecord>

clearReviewIssueFixAction(input: ClearReviewIssueFixActionInput): Promise<void>
```

### 7.4 Query keys

修改：

```text
packages/renderer/src/features/review/hooks/review-query-keys.ts
```

新增：

```ts
fixActions: (bookId: string) => ['review', 'fixActions', bookId] as const
```

不要改已有：

```ts
decisions: (bookId: string) => ['review', 'decisions', bookId] as const
```

---

## 八、Hook 与 mutation 设计

### 8.1 `useBookReviewFixActionsQuery.ts`

新增：

```text
packages/renderer/src/features/review/hooks/useBookReviewFixActionsQuery.ts
```

职责：

- 调用 `reviewClient.getBookReviewFixActions({ bookId })`
- 返回当前 book 的 fix action records
- error 不应让整个 inbox 崩掉；和 decision error 一样，可作为 partial warning 展示

### 8.2 `useSetReviewIssueFixActionMutation.ts`

新增：

```text
packages/renderer/src/features/review/hooks/useSetReviewIssueFixActionMutation.ts
```

职责：

- 调用 `reviewClient.setReviewIssueFixAction(...)`
- 对 `reviewQueryKeys.fixActions(bookId)` 做 optimistic update
- error rollback
- settled 后 invalidate 同一个 key

### 8.3 `useClearReviewIssueFixActionMutation.ts`

新增：

```text
packages/renderer/src/features/review/hooks/useClearReviewIssueFixActionMutation.ts
```

职责：

- 调用 `reviewClient.clearReviewIssueFixAction(...)`
- optimistic remove 当前 fix action record
- error rollback
- settled 后 invalidate

### 8.4 `useBookReviewInboxQuery.ts` 修改

当前 hook 已经读取 decisions。PR17 应继续增强它：

- 内部调用 `useBookReviewFixActionsQuery({ bookId })`，或接受 `fixActionRecords` 作为注入依赖。
- 把 `fixActionRecords` 传给 mapper。
- 返回结构增加 `fixActionError`。
- loading 状态可以包含 fix action loading，但 fix action error 不应该让 inbox 整体崩掉。

推荐结果结构：

```ts
export interface UseBookReviewInboxQueryResult {
  inbox: BookReviewInboxViewModel | null | undefined
  isLoading: boolean
  error: Error | null
  decisionError: Error | null
  fixActionError: Error | null
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
export type ReviewFixActionViewStatus =
  | 'not_started'
  | 'started'
  | 'checked'
  | 'blocked'
  | 'stale'

export interface ReviewIssueFixActionViewModel {
  status: ReviewFixActionViewStatus
  sourceHandoffId?: string
  sourceHandoffLabel?: string
  targetScope?: 'book' | 'chapter' | 'scene' | 'asset'
  note?: string
  startedAtLabel?: string
  updatedAtLabel?: string
  updatedByLabel?: string
  isStale: boolean
}
```

扩展 `ReviewIssueViewModel`：

```ts
export interface ReviewIssueViewModel {
  // existing fields
  fixAction: ReviewIssueFixActionViewModel
  primaryFixHandoff: ReviewSourceHandoffViewModel | null
}
```

扩展 counts：

```ts
export interface BookReviewInboxCountsViewModel {
  // existing counts
  fixStarted: number
  fixChecked: number
  fixBlocked: number
  fixStale: number
}
```

### 9.2 Mapper 新增函数

修改：

```text
packages/renderer/src/features/review/lib/book-review-inbox-mappers.ts
```

新增：

```ts
export function selectPrimaryReviewFixHandoff(issue: ReviewIssueViewModel): ReviewSourceHandoffViewModel | null

export function applyReviewFixActionsToIssues({
  issues,
  fixActions,
}: {
  issues: ReviewIssueViewModel[]
  fixActions: ReviewIssueFixActionRecord[]
}): ReviewIssueViewModel[]
```

### 9.3 Primary fix handoff 选择规则

第一版不要做复杂 AI 推荐，只用 deterministic rule。

建议：

1. 如果 issue source 是 `export`，优先选择 target 为 `book` 且 `draftView='export'` 的 handoff。
2. 如果 issue source 是 `branch`，优先选择 target 为 `book` 且 `draftView='branch'` 的 handoff。
3. 如果 issue source 是 `compare`，优先选择 target 为 `book` 且 `draftView='compare'` 的 handoff。
4. 如果 issue kind 是 `missing_draft` 或 source 是 `chapter-draft`，优先选择 `Chapter / Draft` handoff。
5. 如果 issue kind 是 `trace_gap`，优先选择能定位到 source surface 的 handoff：
   - 若有 chapter draft handoff，选它。
   - 若有 scene orchestrate / draft handoff，选它。
6. 如果 issue source 是 `scene-proposal`，优先选择 `Scene / Orchestrate`。
7. 如果有 assetId，且存在 `Asset / Knowledge` handoff，可以作为 secondary，不作为默认第一优先，除非这是 asset-specific issue。
8. 如果没有命中规则，fallback 到第一条 handoff。

### 9.4 Fix action stale 规则

如果存在 fix action record，但：

```ts
record.issueSignature !== issue.issueSignature
```

则：

- `issue.fixAction.status = 'stale'`
- `issue.fixAction.isStale = true`
- 不统计为 `fixStarted / fixChecked / fixBlocked`
- 统计为 `fixStale`
- UI 提示用户重新开始 source fix action

### 9.5 Counts 与 filtering 纪律

PR17 不新增 `fixStatusFilter`。

`fixStarted / fixChecked / fixBlocked / fixStale` 只用于：

- badges
- inspector summary
- bottom dock problems
- story / tests

不要把它变成新的 route filter。

---

## 十、UI 改法

### 10.1 新增 `ReviewSourceFixControls.tsx`

新增：

```text
packages/renderer/src/features/review/components/ReviewSourceFixControls.tsx
```

Props：

```ts
interface ReviewSourceFixControlsProps {
  issue: ReviewIssueViewModel
  isSaving?: boolean
  onStartFix: (input: {
    issueId: string
    issueSignature: string
    handoff: ReviewSourceHandoffViewModel
    note?: string
  }) => void
  onSetFixStatus: (input: {
    issueId: string
    issueSignature: string
    status: 'checked' | 'blocked'
    handoff: ReviewSourceHandoffViewModel
    note?: string
  }) => void
  onClearFix: (issueId: string) => void
}
```

UI 第一版：

- source fix status badge
- primary fix target label
- optional note textarea
- `Start source fix`
- `Mark source checked`
- `Mark blocked`
- `Clear fix action`

显示规则：

- `not_started`：显示 `Start source fix`
- `started`：显示 `Mark source checked` / `Mark blocked` / `Clear fix action`
- `checked`：显示 checked summary + `Clear fix action`
- `blocked`：显示 blocked summary + `Clear fix action`
- `stale`：显示 stale warning + `Restart source fix` / `Clear fix action`

### 10.2 修改 `ReviewIssueDetail.tsx`

新增 props：

```ts
isFixActionSaving?: boolean
onStartFix?: ReviewSourceFixControlsProps['onStartFix']
onSetFixStatus?: ReviewSourceFixControlsProps['onSetFixStatus']
onClearFix?: ReviewSourceFixControlsProps['onClearFix']
```

在 existing decision controls 与 handoff actions 之间插入 `ReviewSourceFixControls`。

顺序建议：

1. Issue summary / recommendation
2. Decision controls
3. Source fix controls
4. Source excerpt
5. Handoff actions

注意：

- existing handoff actions 继续保留。
- `Start source fix` 是带记录的 recommended path。
- 普通 handoff actions 仍是无记录的 secondary navigation。

### 10.3 修改 `ReviewIssueList.tsx`

每个 issue row 增加轻量 badge：

- `Fix started`
- `Checked`
- `Blocked`
- `Fix stale`

不要把 row 做成操作面板。

### 10.4 修改 `BookDraftReviewView.tsx`

新增 props：

```ts
isFixActionSaving?: boolean
onStartFix: ReviewSourceFixControlsProps['onStartFix']
onSetFixStatus: ReviewSourceFixControlsProps['onSetFixStatus']
onClearFix: (issueId: string) => void
```

把 props 透传给 `ReviewIssueDetail`。

如果 `fixActionError` 存在，显示 partial warning：

- Review inbox 仍可见。
- Issue 默认显示为未开始 source fix。

### 10.5 修改 `BookDraftInspectorPane.tsx`

在 `activeDraftView === 'review'` 时补充：

- selected issue fix action status
- selected issue primary source fix target
- stale fix action warning
- fix note
- next recommended source action

不要让 inspector 成为第二个 source fix 控制台；控制按钮仍在 detail。

### 10.6 修改 `BookDraftBottomDock.tsx`

Review mode 下 Problems / Activity 增加：

Problems：

- open issues without source fix started
- blocked source fix count
- stale fix action count
- checked but still open issue count

Activity：

- started source fix
- marked source checked
- marked source blocked
- cleared source fix action

### 10.7 修改 `BookDraftReviewView.stories.tsx` / `ReviewIssueDetail.stories.tsx`

新增 story 状态：

- `NotStartedFix`
- `StartedFix`
- `CheckedFix`
- `BlockedFix`
- `StaleFix`

---

## 十一、BookDraftWorkspace 接线要求

修改：

```text
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
```

要做的事：

1. `useBookReviewInboxQuery(...)` 返回 `fixActionError`。
2. 接入：
   - `useSetReviewIssueFixActionMutation(...)`
   - `useClearReviewIssueFixActionMutation(...)`
3. 把 source fix handlers 传给：

```text
BookDraftStage -> BookDraftReviewView -> ReviewIssueDetail -> ReviewSourceFixControls
```

4. `onStartFix(...)` 行为：
   - 从 handoff target 推导 `targetScope`
   - 写入 fix action record：`status='started'`
   - 记录 bottom dock activity
   - 成功后调用现有 `onOpenReviewSource(handoff)`
5. `onSetFixStatus(...)` 行为：
   - 写入 `status='checked' | 'blocked'`
   - 不自动修改 decision
   - 记录 bottom dock activity
6. `onClearFix(...)` 行为：
   - clear fix action record
   - 记录 bottom dock activity
7. 保留现有 `onSetReviewDecision` / `onClearReviewDecision` 不变。
8. 保留现有 `onOpenReviewSource` handoff 不变。

### 不要做

- 不要把 fix action state 放进 `BookDraftWorkspace` 的本地 `useState` 作为真源。
- 不要把 fix action 直接写进 review seed。
- 不要修改 compare / export / branch / draft source data。
- 不要自动将 checked issue 标记为 reviewed。

---

## 十二、建议的文件改动

### 12.1 新增

```text
packages/renderer/src/features/review/api/review-fix-action-records.ts
packages/renderer/src/features/review/api/mock-review-fix-action-db.ts
packages/renderer/src/features/review/hooks/useBookReviewFixActionsQuery.ts
packages/renderer/src/features/review/hooks/useSetReviewIssueFixActionMutation.ts
packages/renderer/src/features/review/hooks/useClearReviewIssueFixActionMutation.ts
packages/renderer/src/features/review/components/ReviewSourceFixControls.tsx
packages/renderer/src/features/review/components/ReviewSourceFixControls.test.tsx
packages/renderer/src/features/review/components/ReviewSourceFixControls.stories.tsx
```

### 12.2 修改

```text
packages/renderer/src/features/review/api/review-client.ts
packages/renderer/src/features/review/api/review-client.test.ts
packages/renderer/src/features/review/hooks/review-query-keys.ts
packages/renderer/src/features/review/types/review-view-models.ts
packages/renderer/src/features/review/lib/book-review-inbox-mappers.ts
packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.test.tsx
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
packages/renderer/src/features/book/lib/book-*-mappers.ts
packages/renderer/src/features/scene/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/traceability/**
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
```

PR17 的任务是 source fix action overlay，不是重做 source workspaces，也不是 route 扩建。

---

## 十三、测试补齐方案

### 13.1 mock db / client 测试

新增或扩展 `review-client.test.ts`，至少覆盖：

1. `setReviewIssueFixAction(...)` 会写入 mutable mock db。
2. 同一 `bookId + issueId` 再次写入会覆盖旧 fix action。
3. `clearReviewIssueFixAction(...)` 会移除 fix action。
4. `resetMockReviewFixActionDb()` 会清空测试污染。
5. client 返回 clone，不泄漏 mutable db 引用。
6. decision db 与 fix action db 互不污染。

### 13.2 mapper 测试

扩展：

```text
packages/renderer/src/features/review/lib/book-review-inbox-mappers.test.ts
```

至少覆盖：

1. 没有 fix action record 时，issue `fixAction.status='not_started'`。
2. started record 会让 issue `fixAction.status='started'`。
3. checked record 会让 issue `fixAction.status='checked'`。
4. blocked record 会让 issue `fixAction.status='blocked'`。
5. signature 不匹配时，issue `fixAction.status='stale'`。
6. stale fix action 不计入 started / checked / blocked counts。
7. `selectPrimaryReviewFixHandoff(...)` 对 export issue 选择 export handoff。
8. `selectPrimaryReviewFixHandoff(...)` 对 branch issue 选择 branch handoff。
9. `selectPrimaryReviewFixHandoff(...)` 对 compare issue 选择 compare handoff。
10. `selectPrimaryReviewFixHandoff(...)` 对 missing draft issue 选择 chapter draft handoff。
11. `selectPrimaryReviewFixHandoff(...)` 没有命中规则时 fallback 到第一条 handoff。
12. decision status filter 不受 fix action status 影响。

### 13.3 mutation hook 测试

新增：

```text
useSetReviewIssueFixActionMutation.test.tsx
useClearReviewIssueFixActionMutation.test.tsx
```

至少覆盖：

1. optimistic update 立即更新 fix actions cache。
2. error rollback。
3. settled invalidate 正确 key。
4. clear fix action 后 issue 回到 `not_started`。

### 13.4 component 测试

#### `ReviewSourceFixControls.test.tsx`

至少覆盖：

- not started issue 显示 `Start source fix`。
- 点击 `Start source fix` 调用 `onStartFix`，并传入 primary handoff。
- started issue 显示 `Mark source checked` / `Mark blocked` / `Clear fix action`。
- checked issue 显示 checked status 与 note。
- blocked issue 显示 blocked status 与 note。
- stale issue 显示 stale warning 与 restart action。
- note 输入会随 action 提交。

#### `ReviewIssueDetail.test.tsx`

至少覆盖：

- 保留 decision controls。
- 保留 existing handoff actions。
- 显示 source fix controls。
- primary source fix target label 正确。

#### `ReviewIssueList.test.tsx`

至少覆盖：

- issue row 显示 fix started / checked / blocked / stale badge。
- selected issue 高亮不变。
- decision status badge 和 fix action badge 可同时出现。

#### `BookDraftReviewView.test.tsx`

至少覆盖：

- source filter + status filter + source fix controls 同时存在。
- `Start source fix` 事件能向上传递。
- partial fix action error 时 inbox 仍可见。

### 13.5 workspace 集成测试

扩展或新增：

```text
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx
```

建议至少覆盖这条路径：

```text
打开 /workbench?scope=book&id=book-signal-arc&lens=draft&draftView=review&reviewFilter=all&reviewStatusFilter=open
-> 选择一个 missing draft issue
-> 点击 Start source fix
-> 进入 Chapter / Draft
-> browser back
-> 回到 Book / Draft / Review
-> 原 issue 显示 Fix started
-> 点击 Mark source checked
-> issue 显示 Checked，但 decision 仍然 open
-> bottom dock activity 记录 source fix started / checked
```

再补一条 blocked / stale 路径：

```text
打开 review
-> 对一个 trace gap issue Start source fix
-> Mark blocked 并填写 note
-> issue row / detail / inspector 都显示 blocked note
-> 构造 signature 变化的 issue
-> old fix action 显示 stale，不再计入 blocked count
```

### 13.6 app smoke 推荐新增

```text
scene orchestrate snapshot
-> 切到 book draft review
-> start source fix 到 chapter draft
-> browser back
-> mark source checked
-> 切回 scene
-> scene lens/tab/proposal snapshot 不丢
-> 再切回 book review
-> checked fix action 仍可见
```

---

## 十四、Storybook 建议

新增：

```text
ReviewSourceFixControls.stories.tsx
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

- `NotStartedFix`
- `StartedFix`
- `CheckedFix`
- `BlockedFix`
- `StaleFix`
- `DecisionReviewedAndFixStarted`
- `FixActionErrorPartialInbox`

---

## 十五、实施顺序（给 AI 的执行顺序）

### Step 1
先新增 source fix action 类型与 mock db：

- `review-fix-action-records.ts`
- `mock-review-fix-action-db.ts`
- reset helper
- client tests

### Step 2
扩展 review client 与 query keys：

- `review-client.ts`
- `review-query-keys.ts`
- 不改 decision key

### Step 3
新增 fix action query / mutation hooks：

- `useBookReviewFixActionsQuery.ts`
- `useSetReviewIssueFixActionMutation.ts`
- `useClearReviewIssueFixActionMutation.ts`

### Step 4
先改 mapper 与 view-model：

- `ReviewIssueFixActionViewModel`
- `primaryFixHandoff`
- `applyReviewFixActionsToIssues(...)`
- `selectPrimaryReviewFixHandoff(...)`
- fix counts
- stale fix action

先把 mapper 单测写稳。

### Step 5
接入 `useBookReviewInboxQuery.ts`：

- 读取 fix action records
- 合并到 issues
- 暴露 `fixActionError`

### Step 6
实现 UI：

- `ReviewSourceFixControls`
- 修改 detail / list / review view

### Step 7
回到 `BookDraftWorkspace.tsx` 接线：

- mutation handlers
- start fix -> write action -> open source
- checked / blocked / clear
- bottom dock activity

### Step 8
增强 inspector / dock / activity：

- fix action status
- note
- stale warning
- blocked / checked counts

### Step 9
补 workspace integration / app smoke / stories。

---

## 十六、完成后的验收标准

满足以下条件，PR17 就算完成：

1. Review issue view-model 支持 source fix action overlay。
2. Review fix action records 存在 read/write mock db，且测试可 reset。
3. 用户能从 selected review issue 点击 `Start source fix`。
4. `Start source fix` 会先写入 fix action record，再打开对应 source handoff。
5. 用户从 source surface 返回 Review 后，issue 显示 fix action status。
6. 用户能执行 `Mark source checked` / `Mark blocked` / `Clear fix action`。
7. Fix action 与 decision 互相独立，不会自动把 issue 标记为 reviewed / dismissed。
8. Fix action 使用 issue signature；signature 变化时显示 stale，不会错误覆盖新问题。
9. ReviewIssueList / ReviewIssueDetail / Inspector / Bottom Dock 都能展示 fix action 状态。
10. Existing review source handoff 仍可用。
11. Browser back / source handoff / dormant snapshot 继续成立。
12. PR17 不包含真实 source fix、export 文件生成、branch merge、AI rewrite、多人评论系统。

---

## 十七、PR17 结束时不要留下的债

以下情况都算 PR 做偏了：

- 新增了 `review` scope 或顶层 lens。
- 为 source fix 新增了 route 真源，例如 `fixActionId`。
- Fix action 直接修改 draft / compare / export / branch source data。
- Fix action 没有 issue signature，导致旧 action 错误覆盖新问题。
- 使用 `resolved` 语义，让用户误以为源问题已被自动修复。
- `Mark source checked` 自动触发 `Mark reviewed`。
- Mock fix action DB 没有 reset，导致测试污染。
- ReviewIssueDetail 被做成复杂任务系统或评论系统。
- 顺手做了 export 文件生成 / branch merge / manuscript edit。

PR17 做完后的正确状态应该是：

**Review Inbox 仍是 Book Draft 的 review surface，但已经能把 issue 的 source-fix 尝试记录为一层独立、可追踪、可测试的 overlay。**

---

## 十八、PR18 以后建议路线（只保留，不在本轮实施）

### PR18：Export Package Artifact Foundation

在 export preview、review decisions、source fix actions 都稳定后，再做第一版真实 artifact：

- 先生成 Markdown / plain text package。
- 不急着做 PDF / EPUB / DOCX。
- 使用 Review open blockers 与 export readiness 作为 packaging gate。
- 仍不做 publish API。

### PR19：Branch Merge Readiness / Selective Apply

在 review decisions 与 source fix action 都成立后，再做 branch merge 的第一版：

- selective apply branch sections
- branch issue gate
- no Git-like UI
- 不做复杂 conflict resolver

### PR20：Review Pass History / Audit Trail

当 decisions 与 source fix action 都已存在后，再做 review pass history：

- review pass snapshot
- decision / fix action summary
- open blocker delta
- 不做多人 assignment / comment thread

---

## 十九、给 AI 的最终一句话指令

在当前 `codex/pr16-review-triage-decisions` 已经完成 PR16 的前提下，不要继续抛光 triage decisions，也不要提前做真实 source mutation / export artifact / branch merge；先只围绕 **Review Source Fix Actions Foundation** 做一轮窄而实的实现：

- 不新增 route 字段，不新增 review scope / lens
- 给 review feature 新增 source fix action records / mutable mock db / reset helper
- 扩展 review client、query keys、query hook 与 optimistic mutation hooks
- 用 issue signature 把 fix action overlay 安全叠到当前派生 issues 上
- 为每个 issue 派生 deterministic primary fix handoff
- 支持 Start source fix / Mark source checked / Mark blocked / Clear fix action
- Start source fix 必须先记录 action，再调用现有 review source handoff
- 决策状态与 fix action 状态必须独立
- 增强 issue list / detail / inspector / dock / activity，但不让它们成为第二真源
- 用测试固定 source fix overlay、stale action、optimistic update、source handoff roundtrip、四 scope snapshot 不变
- 明确不做 manuscript edit、AI auto-fix、export file generation、branch merge、多人评论系统
