# PR14 执行文档（基于 `codex/pr13-book-export-preview-readiness` 当前实际代码）

## 这份文档的目的

这不是路线图回顾，也不是大而全 wishlist。

这是一份**基于 `codex/pr13-book-export-preview-readiness` 分支当前真实代码状态**整理出来的、可以直接交给 AI agent 实施的 PR14 指令文档。

PR14 的任务，不是继续抛光 PR13 已经完成的 `Book / Draft / Export Preview`，也不是做真实文件导出、正式 publish、复杂 merge 或 Git 式分支系统。本轮更合适的目标是：

**在 Book Draft 内建立第一版 Experiment Branch Foundation，让用户能查看一条 alternate manuscript branch，并把它和 current manuscript / checkpoint 做 read-heavy 对照。**

一句话判断：

**PR11 让 Book 能读全书稿，PR12 让 Book 能审全书稿，PR13 让 Book 能预检打包，PR14 应该让 Book 能安全地查看实验稿。**

---

## 一、先确认当前代码基线

下面这些判断必须建立在 PR13 当前代码事实上，而不是沿用 PR12 之前的旧假设。

### 1. Book 已经是完整对象轴上的 multi-lens object

当前 workbench 对象轴已经包含：

- `scene`
- `chapter`
- `asset`
- `book`

当前 `BookLens` 已经包含：

- `structure`
- `draft`

`BookWorkbench.tsx` 也已经是 scope-level lens dispatch container：

- `route.lens === 'draft'` -> `BookDraftWorkspace`
- 其他情况 -> `BookStructureWorkspace`

所以 PR14 不需要继续处理 Book scope 接入，也不需要再证明 Book multi-lens 成立。

### 2. Book Draft 已经有 Read / Compare / Export 三个子视图

当前 route 已经有：

- `BookDraftView = 'read' | 'compare' | 'export'`
- `checkpointId?`
- `exportProfileId?`
- `selectedChapterId?`

`BookDraftStage.tsx` 已经承担 draft 子视图 switchboard：

- `read` -> `BookDraftReader`
- `compare` -> `BookDraftCompareView`
- `export` -> `BookDraftExportView`

所以 PR14 的正确扩展点不是新开一个顶层 `branch` scope，也不是给 Book 新增第三条 lens，而是继续扩展 Book Draft 的 stage switchboard。

### 3. PR12 / PR13 已经建立了可复用的 manuscript 对照与 readiness 基础

当前 Book Draft 已经存在这些能力链：

```text
useBookDraftWorkspaceQuery(...)
-> current manuscript workspace

useBookManuscriptCompareQuery(...)
-> current manuscript vs explicit checkpoint

useBookExportPreviewQuery(...)
-> current manuscript + compare + export profile
-> export preview + readiness checklist
```

这说明 PR14 不应该重新拉取 chapter / scene / traceability，也不应该复制一条新的 source waterfall。

PR14 应该复用当前的：

- `BookDraftWorkspaceViewModel`
- `BookManuscriptCompareWorkspaceViewModel`
- `book-manuscript-compare-mappers.ts` 中已经建立的 snapshot / delta 心智
- `BookExportReadinessIssueViewModel` 中已经建立的 blocker / warning / info 分级语言

### 4. 当前 Book client 仍是 read-only metadata client

当前 `book-client.ts` 已经读取：

- book structure record
- manuscript checkpoints
- export profiles

这些都仍然是 read-only mock metadata。PR14 应延续这个模式，为 experiment branch 只新增 read-only mock branch records。

不要在 PR14 中新增：

- branch create
- branch edit
- branch merge
- branch publish
- branch delete / archive mutation

### 5. 当前真正缺口不是 export preview，而是 alternate manuscript 心智

PR13 完成后，Book Draft 已经能回答：

- 当前 manuscript 会如何被打包
- readiness blockers / warnings / info 是什么
- export profile 会如何影响纳入内容与阻塞规则

但它还不能回答：

- 如果存在一个 alternate manuscript，它和 current manuscript 差在哪里
- alternate branch 覆盖了哪些 chapter / scene
- branch 的缺稿、trace gap、warnings 是否比 current 更好或更差
- branch 是否值得继续推进到 compare / export / review
- 用户是否能安全查看实验稿，而不污染 current manuscript

这正是 PR14 应该补的洞。

---

## 二、PR14 的唯一目标

**在 `Book / Draft` 内新增 `Branch` 子视图，用 read-only mock branch records 建立第一版 alternate manuscript preview / compare / readiness surface。**

PR14 完成后，用户应该能：

1. 在 `scope='book' & lens='draft'` 下切到 `draftView='branch'`。
2. 选择一个显式 experiment branch，例如：
   - `branch-book-signal-arc-quiet-ending`
   - `branch-book-signal-arc-high-pressure`
3. 选择 branch compare baseline：
   - `current`：与当前 manuscript 对照
   - `checkpoint`：与当前 `checkpointId` 对照
4. 在主舞台看到 selected branch 的：
   - branch summary / rationale
   - chapter-level alternate manuscript preview
   - branch-vs-baseline chapter deltas
   - scene-section deltas
   - missing draft / trace gap / warnings signals
5. 用 `route.selectedChapterId` 继续驱动 binder / branch view / inspector / dock 的统一聚焦。
6. 从 Branch 视图中继续打开：
   - `Chapter / Draft`
   - `Chapter / Structure`
7. 浏览器 back 返回 Book Draft Branch 时恢复：
   - `scope='book'`
   - `lens='draft'`
   - `draftView='branch'`
   - `branchId`
   - `branchBaseline`
   - `checkpointId`（当 baseline 为 checkpoint 时）
   - `selectedChapterId`
8. 从 Branch 切回 Read / Compare / Export，再切回 Structure 时，PR13 已经成立的 dormant state 仍然保留。

一句话说：

**PR14 要让 Book Draft 能安全查看实验稿，但不让实验稿变成 current manuscript，也不做 merge。**

---

## 三、为什么现在做 Branch Foundation，而不是 Review Inbox / Real Export / Merge

### 1. Review Inbox 需要更多 issue 来源

PR15 很适合做 Review Inbox，但它最好建立在更多 issue 来源已经存在的基础上。

PR13 已经有：

- compare deltas
- export readiness blockers
- trace gaps

PR14 如果补上 branch deltas / branch readiness，那么 PR15 的 Review Inbox 才能真正收束：

- scene proposal issues
- chapter draft issues
- book compare deltas
- export readiness blockers
- branch experiment deltas

### 2. Real Export 需要先稳定 preview / branch / review 心智

当前 export preview 仍然是 read-heavy 预检面。如果现在马上做真实 Markdown / JSON / PDF / EPUB 文件生成，会过早引入：

- file adapter
- download side effect
- package format policy
- snapshot freeze policy

PR14 先补 branch foundation，可以让之后真实导出时更清楚：导出的到底是 current manuscript、checkpoint、还是 branch snapshot。

### 3. Merge 是高风险写路径，不适合抢在 read-only branch 之前

Branch 一旦支持 merge，就会牵动：

- current manuscript mutation
- chapter / scene prose mutation
- traceability mutation
- export readiness recalculation
- rollback / undo

当前项目还没有真实 prose mutation 或 merge queue。PR14 应先做 read-only branch，证明 branch 的身份、route、preview、compare 和 readiness 都成立。

---

## 四、本轮明确不做

为了让 PR14 保持窄而实，以下内容不要混进来：

- 不做 branch create / duplicate / archive mutation
- 不做 merge into main
- 不做 selective merge
- 不做 accept / reject branch delta
- 不做 branch publish
- 不做真实文件导出
- 不做 PDF / EPUB / DOCX / Markdown / JSON adapter
- 不做 Book Draft inline edit
- 不做 chapter reorder from book
- 不做 scene chunk anchor route
- 不做 new scope 或 new top-level lens
- 不做 Git 化 UI
- 不做 conflict resolver
- 不做多人评论 / assignment / notification
- 不做 AI 自动生成 branch summary

PR14 的定位必须明确为：

**Experiment Branch Foundation，read-heavy，不 merge、不写稿、不导出、不发布。**

---

## 五、必须遵守的硬约束

### 5.1 Branch 不是新 scope，也不是新 top-level lens

不要新增：

- `scope='branch'`
- `lens='branch'`
- `WorkbenchScope` 中的第五个对象

PR14 的 branch 只是 `Book / Draft` 下的一个 draft 子视图：

```ts
BookDraftView = 'read' | 'compare' | 'export' | 'branch'
```

### 5.2 `route.selectedChapterId` 仍然是 Book 内聚焦真源

不要新增：

- `selectedBranchChapterId` store
- branch view 内部 active chapter 真源
- inspector / dock 各自维护不同的 selected chapter

统一规则：

- 当前 Book 内聚焦 chapter 来源于 `route.selectedChapterId`
- branch workspace selected chapter 只是派生结果
- 点击 binder chapter：`patchBookRoute({ selectedChapterId })`
- 点击 branch chapter row/card：`patchBookRoute({ selectedChapterId })`

### 5.3 `branchId` 只选择实验稿，不切换 current manuscript

`branchId` 不应该改变：

- `useBookDraftWorkspaceQuery(...)` 的 current manuscript
- `useBookManuscriptCompareQuery(...)` 的 current manuscript
- `useBookExportPreviewQuery(...)` 的 current manuscript

第一版 branch 是 alternate snapshot，不是当前稿。

### 5.4 `view` 继续只服务 Book Structure

当前 Book route 里的 `view='sequence' | 'outliner' | 'signals'` 仍然只服务 Structure。

不要把 `view` 改成 `read / compare / export / branch`。

PR14 只扩 `draftView`，并新增 branch 专属子状态：

```ts
branchId?: string
branchBaseline?: 'current' | 'checkpoint'
```

### 5.5 `checkpointId` 继续服务 Compare，也可作为 Branch baseline 的 checkpoint

PR14 不要新增第二套 checkpoint route，例如：

- `branchCheckpointId`
- `baselineCheckpointId`

正确做法是复用已有 `checkpointId`：

- `draftView='compare'` 时：current vs checkpoint
- `draftView='branch' & branchBaseline='checkpoint'` 时：branch vs checkpoint
- `draftView='branch' & branchBaseline='current'` 时：branch vs current manuscript

### 5.6 不复制 source waterfall

不要让 branch hook 重新获取：

- book workspace sources
- chapter structure workspaces
- scene prose queries
- traceability scene sources

PR14 branch hook 应接收或复用当前 `BookDraftWorkspaceViewModel`，再读取 selected branch record，最后在 pure mapper 里对照。

### 5.7 Branch readiness 只能从 explicit branch metadata + existing draft/compare rules 派生

不要用文本匹配或启发式推断：

- trace readiness
- warnings regression
- source proposal count

第一版 branch record 应显式保存：

- chapter snapshots
- scene snapshots
- prose draft / word count
- traceReady
- warningsCount
- sourceProposalCount

---

## 六、路由与状态改法

### 6.1 `workbench-route.ts`

把：

```ts
export type BookDraftView = 'read' | 'compare' | 'export'
```

扩成：

```ts
export type BookDraftView = 'read' | 'compare' | 'export' | 'branch'
export type BookBranchBaseline = 'current' | 'checkpoint'
```

修改 `BookRouteState`：

```ts
export interface BookRouteState {
  scope: 'book'
  bookId: string
  lens: BookLens
  view: BookStructureView
  draftView?: BookDraftView
  checkpointId?: string
  exportProfileId?: string
  branchId?: string
  branchBaseline?: BookBranchBaseline
  selectedChapterId?: string
}
```

### 6.2 URL 示例

```text
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-quiet-ending&branchBaseline=current&selectedChapterId=chapter-open-water-signals
```

如果 branch 选择 checkpoint baseline：

```text
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-quiet-ending&branchBaseline=checkpoint&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-open-water-signals
```

注意：`view=signals` 在这里仍然只是 dormant structure view。

### 6.3 `useWorkbenchRouteState.ts`

要做的事：

1. 增加 `VALID_BOOK_DRAFT_VIEWS` 的 `branch`。
2. 增加 `VALID_BOOK_BRANCH_BASELINES`。
3. 增加 `DEFAULT_BOOK_BRANCH_ID`。
4. `CANONICAL_ROUTE_KEYS` 增加：
   - `branchId`
   - `branchBaseline`
5. `normalizeBookRoute(...)` 允许并规范化：
   - `draftView='branch'`
   - `branchId`
   - `branchBaseline`
6. `readBookSnapshot(...)` 读取：
   - `branchId`
   - `branchBaseline`
7. `buildWorkbenchSearch(...)` 在 book scope 下写入：
   - `branchId`
   - `branchBaseline`
8. `patchBookRoute(...)` 继续保持一个 API，不新增 branch 专用 patch hook。
9. dormant snapshot 恢复继续覆盖四个 scope。

### 6.4 默认规则建议

- `lens='draft'` 且 `draftView` 缺失时，fallback 到 `'read'`。
- `draftView='branch'` 且 `branchId` 缺失时，fallback 到默认 branch。
- `draftView='branch'` 且 `branchBaseline` 缺失时，fallback 到 `'current'`。
- `draftView !== 'branch'` 时，`branchId / branchBaseline` 可以保留在 route snapshot 中，但 UI 不使用。
- `branchBaseline='checkpoint'` 且 `checkpointId` 缺失时，继续 fallback 到 `DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID`。

---

## 七、数据层设计

### 7.1 新增 read-only experiment branch records

新增文件：

```text
packages/renderer/src/features/book/api/book-experiment-branches.ts
```

推荐类型：

```ts
export type BookExperimentBranchStatus = 'active' | 'review' | 'archived'

export interface BookExperimentBranchRecord {
  branchId: string
  bookId: string
  title: BookLocalizedText
  summary: BookLocalizedText
  rationale: BookLocalizedText
  createdAtLabel: BookLocalizedText
  basedOnCheckpointId?: string
  status: BookExperimentBranchStatus
  chapterSnapshots: BookExperimentBranchChapterRecord[]
}

export interface BookExperimentBranchChapterRecord {
  chapterId: string
  title: BookLocalizedText
  summary: BookLocalizedText
  sceneSnapshots: BookExperimentBranchSceneRecord[]
}

export interface BookExperimentBranchSceneRecord {
  sceneId: string
  title: BookLocalizedText
  summary: BookLocalizedText
  proseDraft?: BookLocalizedText
  draftWordCount?: number
  traceReady: boolean
  warningsCount: number
  sourceProposalCount: number
}
```

### 7.2 Seed 建议

第一版只做两个 branch：

#### `branch-book-signal-arc-quiet-ending`

目的：展示更克制、低冲突版本。

制造样例：

- 一章 word count 下降
- 一个 scene prose changed
- 一个 scene traceReady 变好
- warnings 减少
- 没有 missing draft blocker

#### `branch-book-signal-arc-high-pressure`

目的：展示更高冲突、更实验性的版本。

制造样例：

- 一个 chapter word count 上升
- 一个 scene added
- 一个 scene draft missing
- 一个 trace gap
- warnings 增加

这两个 branch 足以覆盖：

- changed
- added
- missing / draft_missing
- trace improvement / regression
- warnings improvement / regression
- branch readiness ready / attention / blocked

### 7.3 `book-client.ts` 只增加 branch 读取能力

不要新增 giant branch workspace client，只在现有 thin client 上加：

```ts
getBookExperimentBranches(input: { bookId: string }): Promise<BookExperimentBranchRecord[]>
getBookExperimentBranch(input: { bookId: string; branchId: string }): Promise<BookExperimentBranchRecord | null>
```

这些方法应只读取 mock seed 并 clone，不写入，不 merge，不生成文件。

### 7.4 query keys

修改：

```text
packages/renderer/src/features/book/hooks/book-query-keys.ts
```

新增：

```ts
branches: (bookId: string, locale?: Locale) => ['book', 'branches', bookId, locale]
branch: (bookId: string, branchId: string, locale?: Locale) => [
  'book',
  'branch',
  bookId,
  branchId,
  locale,
]
```

不要改现有：

- book structure key
- checkpoint key
- export profile key
- source query identity

---

## 八、Branch view-model 设计

新增文件：

```text
packages/renderer/src/features/book/types/book-branch-view-models.ts
```

### 8.1 Branch summary

```ts
export interface BookExperimentBranchSummaryViewModel {
  branchId: string
  bookId: string
  title: string
  summary: string
  rationale: string
  createdAtLabel: string
  basedOnCheckpointId?: string
  status: 'active' | 'review' | 'archived'
}
```

### 8.2 Branch scene delta

```ts
export type BookBranchDeltaKind =
  | 'unchanged'
  | 'changed'
  | 'added'
  | 'missing'
  | 'draft_missing'

export interface BookBranchSceneDeltaViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  delta: BookBranchDeltaKind
  branchExcerpt?: string
  baselineExcerpt?: string
  branchWordCount?: number
  baselineWordCount?: number
  wordDelta: number
  traceReadyChanged: boolean
  warningsDelta: number
  sourceProposalDelta: number
}
```

### 8.3 Branch chapter delta

```ts
export interface BookBranchChapterDeltaViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  sceneDeltas: BookBranchSceneDeltaViewModel[]
  changedSceneCount: number
  addedSceneCount: number
  missingSceneCount: number
  draftMissingSceneCount: number
  wordDelta: number
  traceRegressionCount: number
  traceImprovementCount: number
  warningsDelta: number
  sourceProposalDelta: number
  readinessStatus: 'ready' | 'attention' | 'blocked'
}
```

### 8.4 Branch workspace

```ts
export interface BookExperimentBranchWorkspaceViewModel {
  bookId: string
  title: string
  summary: string
  selectedChapterId: string | null
  selectedChapter: BookBranchChapterDeltaViewModel | null
  branch: BookExperimentBranchSummaryViewModel | null
  branches: BookExperimentBranchSummaryViewModel[]
  baseline: {
    kind: 'current' | 'checkpoint'
    label: string
    checkpointId?: string
  }
  chapters: BookBranchChapterDeltaViewModel[]
  totals: {
    changedChapterCount: number
    changedSceneCount: number
    addedSceneCount: number
    missingSceneCount: number
    draftMissingSceneCount: number
    wordDelta: number
    traceRegressionCount: number
    traceImprovementCount: number
    warningsDelta: number
    sourceProposalDelta: number
    blockedChapterCount: number
    attentionChapterCount: number
  }
  readiness: {
    status: 'ready' | 'attention' | 'blocked'
    label: string
    issues: Array<{
      id: string
      severity: 'blocker' | 'warning' | 'info'
      chapterId?: string
      sceneId?: string
      title: string
      detail: string
    }>
  }
}
```

---

## 九、Pure mapper 设计

新增：

```text
packages/renderer/src/features/book/lib/book-experiment-branch-mappers.ts
packages/renderer/src/features/book/lib/book-experiment-branch-mappers.test.ts
```

### 9.1 必须提供的函数

```ts
normalizeBookExperimentBranch(record, locale)
normalizeBookExperimentBranchSnapshot(record, locale)
buildBranchBaselineSnapshot({ currentDraftWorkspace, checkpoint, baseline })
compareBookExperimentBranchToBaseline({ branchSnapshot, baselineSnapshot, selectedChapterId })
buildBookExperimentBranchWorkspace({ currentDraftWorkspace, branch, branches, checkpoint, branchBaseline, selectedChapterId, locale })
deriveBookExperimentBranchReadiness({ chapters, branch, baseline, locale })
```

### 9.2 对照规则第一版

不要引入 diff library，只做轻量规则：

- `missing`：baseline 中存在，branch 中不存在。
- `added`：branch 中存在，baseline 中不存在。
- `draft_missing`：branch scene 存在但 `proseDraft` 缺失。
- `changed`：两边都有 prose，但 `trim()` 后字符串不同，或 word count / traceReady / warnings / sourceProposalCount 有变化。
- `unchanged`：两边 prose 与主要 signals 都一致。

### 9.3 readiness 规则第一版

- 若任意 branch scene `draft_missing`：branch readiness = `blocked`。
- 若任意 selected branch chapter 有 trace regression：至少 `attention`。
- 若 warningsDelta > 0：至少 `attention`。
- 若 branch 有 added scene 且 sourceProposalCount = 0：至少 `attention`。
- 若 branch 无 blocker / warning：`ready`。

### 9.4 excerpt 规则

```ts
function excerpt(text?: string) {
  return text?.trim().slice(0, 180)
}
```

第一版不要做复杂 diff highlighting。

---

## 十、query hook 设计

新增：

```text
packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.ts
```

推荐签名：

```ts
export function useBookExperimentBranchQuery({
  bookId,
  currentDraftWorkspace,
  branchId,
  branchBaseline,
  checkpointId,
}: {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  branchId?: string | null
  branchBaseline?: 'current' | 'checkpoint'
  checkpointId?: string | null
})
```

职责：

1. 读取 branch list。
2. 读取 selected branch。
3. 当 `branchBaseline === 'checkpoint'` 时读取 selected checkpoint。
4. 将 current draft workspace + selected branch + optional checkpoint 交给 pure mapper。
5. 返回：
   - `branchWorkspace`
   - `branches`
   - `selectedBranch`
   - loading / error 状态

关键纪律：

- 不重新获取 chapter / scene / traceability。
- 不改变 current manuscript。
- 不写入 branch。
- 不触发 merge。

---

## 十一、组件与容器改法

### 11.1 修改 `BookDraftStage.tsx`

把 draft view switcher 从：

- Read
- Compare
- Export

扩成：

- Read
- Compare
- Export
- Branch

新增 props：

```ts
branchWorkspace?: BookExperimentBranchWorkspaceViewModel | null
branchError?: Error | null
branches: BookExperimentBranchSummaryViewModel[]
selectedBranchId: string
branchBaseline: 'current' | 'checkpoint'
onSelectBranch: (branchId: string) => void
onSelectBranchBaseline: (baseline: 'current' | 'checkpoint') => void
```

当 `draftView === 'branch'` 时渲染 `BookDraftBranchView`。

### 11.2 新增 `BookExperimentBranchPicker.tsx`

新增文件：

```text
packages/renderer/src/features/book/components/BookExperimentBranchPicker.tsx
```

职责：

- 展示 branch list
- 展示 branch status / createdAtLabel / rationale
- 选择 branch 时调用 `onSelectBranch(branchId)`
- 支持 baseline selector：
  - `current`
  - `checkpoint`

第一版即使 branch 数量只有两个，也要保留组件形态，为后续 create / archive / merge 做准备。

### 11.3 新增 `BookDraftBranchView.tsx`

新增文件：

```text
packages/renderer/src/features/book/components/BookDraftBranchView.tsx
```

职责：

- 主舞台展示 branch-level alternate manuscript preview
- 展示 branch vs baseline chapter deltas
- 展示 selected chapter 的 scene deltas
- 点击 chapter row/card：`onSelectChapter(chapterId)`
- 保留次级动作：
  - `Open in Draft`
  - `Open in Structure`

每个 chapter row 至少显示：

- chapter order
- title
- word delta
- changed / added / missing / draft_missing counts
- trace regression / improvement
- warnings delta
- readiness status

selected chapter detail 至少显示：

- scene order
- scene title
- delta kind
- branch excerpt
- baseline excerpt
- word delta
- trace / warning / source proposal signals

明确不做：

- 不做 merge 按钮
- 不做 accept / reject delta
- 不做 inline edit
- 不做 full diff editor

### 11.4 修改 `BookDraftInspectorPane.tsx`

新增 props：

```ts
branch?: BookExperimentBranchWorkspaceViewModel | null
```

当 `activeDraftView === 'branch'` 时新增 `Branch` 区域：

#### A. Selected branch

- branch title
- status
- rationale
- baseline label

#### B. Selected chapter branch summary

- changed / added / missing / draft_missing
- word delta
- trace regressions / improvements
- warnings delta

#### C. Branch readiness

- readiness label
- top blockers / warnings

Read / Compare / Export 模式原有 inspector 不要被破坏。

### 11.5 修改 `BookDraftBottomDock.tsx`

新增 branch-aware Problems：

- branch blockers
- branch warnings
- draft missing scenes
- trace regressions
- warning increases
- added scenes without source proposal count

Activity 新增：

- entered branch
- selected branch
- selected branch baseline
- returned to read / compare / export

### 11.6 修改 `useBookWorkbenchActivity.ts`

新增 activity kind：

```ts
type BookWorkbenchActivityKind =
  | ...
  | 'branch'
  | 'branch-baseline'
```

新增 action：

```ts
| 'entered-branch'
| 'selected-branch'
| 'selected-branch-baseline'
```

并让 `useBookWorkbenchActivity(...)` 接收：

```ts
selectedBranch?: { id: string; title: string; summary: string } | null
selectedBranchBaseline?: 'current' | 'checkpoint'
```

### 11.7 修改 `BookDraftWorkspace.tsx`

要做的事：

1. 继续调用 `useBookDraftWorkspaceQuery(...)` 获取 current draft workspace。
2. 继续调用 `useBookManuscriptCompareQuery(...)` 和 `useBookExportPreviewQuery(...)`，不要破坏 PR12 / PR13。
3. 新增 `useBookExperimentBranchQuery(...)`。
4. 计算：
   - `activeDraftView = route.draftView ?? 'read'`
   - `effectiveBranchId = route.branchId ?? DEFAULT_BOOK_EXPERIMENT_BRANCH_ID`
   - `effectiveBranchBaseline = route.branchBaseline ?? 'current'`
5. 把 branch data 传给：
   - `BookDraftStage`
   - `BookDraftInspectorPane`
   - `BookDraftDockContainer`
6. 新增 callbacks：
   - `onSelectBranch`
   - `onSelectBranchBaseline`
7. 保持现有 `openChapterFromBook(...)` 不变。
8. 保持 `route.selectedChapterId` fallback 逻辑不变。

---

## 十二、建议的文件改动

### 12.1 新增

```text
packages/renderer/src/features/book/api/book-experiment-branches.ts
packages/renderer/src/features/book/components/BookDraftBranchView.tsx
packages/renderer/src/features/book/components/BookDraftBranchView.test.tsx
packages/renderer/src/features/book/components/BookDraftBranchView.stories.tsx
packages/renderer/src/features/book/components/BookExperimentBranchPicker.tsx
packages/renderer/src/features/book/components/BookExperimentBranchPicker.test.tsx
packages/renderer/src/features/book/components/BookExperimentBranchPicker.stories.tsx
packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.ts
packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.test.tsx
packages/renderer/src/features/book/lib/book-experiment-branch-mappers.ts
packages/renderer/src/features/book/lib/book-experiment-branch-mappers.test.ts
packages/renderer/src/features/book/types/book-branch-view-models.ts
```

### 12.2 修改

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/book/api/book-client.ts
packages/renderer/src/features/book/hooks/book-query-keys.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/containers/BookDraftDockContainer.tsx
packages/renderer/src/features/book/components/BookDraftStage.tsx
packages/renderer/src/features/book/components/BookDraftInspectorPane.tsx
packages/renderer/src/features/book/components/BookDraftBottomDock.tsx
packages/renderer/src/features/book/hooks/useBookWorkbenchActivity.ts
packages/renderer/src/app/i18n/**
```

### 12.3 这一轮尽量不动

```text
packages/renderer/src/features/chapter/**
packages/renderer/src/features/scene/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/traceability/** 的核心 hook / mapper
packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.ts
packages/renderer/src/features/book/components/BookDraftReader.tsx
packages/renderer/src/features/book/components/BookDraftCompareView.tsx
packages/renderer/src/features/book/components/BookDraftExportView.tsx
```

如果必须碰这些文件，只做类型适配，不重写 source acquisition 或既有 mapper。

---

## 十三、测试补齐方案

### 13.1 route 测试

至少覆盖：

1. book route 能读写 `draftView='branch'`。
2. book route 能读写 `branchId`。
3. book route 能读写 `branchBaseline='current' | 'checkpoint'`。
4. `branchBaseline='checkpoint'` 时继续保留 / fallback `checkpointId`。
5. `lens='draft'` 下保留 structure `view`。
6. `lens='structure'` 下 dormant `draftView / checkpointId / exportProfileId / branchId / branchBaseline` 不破坏 structure view。
7. 四 scope dormant snapshot 继续成立。

### 13.2 mapper 测试

`book-experiment-branch-mappers.test.ts` 至少覆盖：

1. branch-only scene -> `added`。
2. baseline-only scene -> `missing`。
3. branch scene without prose -> `draft_missing`。
4. prose text changed -> `changed`。
5. prose same but traceReady changed -> `changed` 且 `traceReadyChanged=true`。
6. warnings delta 计算正确。
7. source proposal delta 计算正确。
8. branch readiness 在 draft_missing 时为 `blocked`。
9. branch readiness 在 warningsDelta > 0 时为 `attention`。
10. `selectedChapterId` 缺失时 fallback 到第一章。
11. totals 聚合正确。

### 13.3 query 测试

`useBookExperimentBranchQuery.test.tsx` 至少覆盖：

1. 能读取 branch list。
2. branchId 缺失时使用默认 branch。
3. branchId 不存在时返回 branch empty / error state。
4. current draft workspace 还在 loading 时不生成错误 branch workspace。
5. `branchBaseline='current'` 时使用 current manuscript 作为 baseline。
6. `branchBaseline='checkpoint'` 时使用 selected checkpoint 作为 baseline。
7. branch workspace selected chapter 与 route.selectedChapterId 同步。

### 13.4 component 测试

#### `BookDraftStage.test.tsx`

- `branch` view 渲染 `BookDraftBranchView`。
- 切换到 branch 触发 `onSelectDraftView('branch')`。
- read / compare / export 原行为不回归。

#### `BookExperimentBranchPicker.test.tsx`

- 展示 branch title / status / rationale。
- 选择 branch 触发 `onSelectBranch`。
- 选择 baseline 触发 `onSelectBranchBaseline`。

#### `BookDraftBranchView.test.tsx`

- 渲染 branch title / baseline label。
- 渲染 changed / added / missing / draft_missing counts。
- selected chapter 高亮。
- 点击 chapter 触发 `onSelectChapter`。
- `Open in Draft` / `Open in Structure` 可触发。
- scene delta excerpts 正确显示。

#### `BookDraftInspectorPane.test.tsx`

- branch 模式显示 selected branch summary。
- branch 模式显示 selected chapter branch delta。
- branch 模式显示 readiness issues。
- read / compare / export 模式不显示 branch-only 区块。

#### `BookDraftBottomDock.test.tsx`

- branch 模式显示 branch blockers / warnings。
- activity 可显示 entered branch / selected branch / selected branch baseline。

### 13.5 workspace 集成测试

新增或扩展 `BookDraftWorkspace.test.tsx`：

```text
打开 /workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-quiet-ending&branchBaseline=current&selectedChapterId=chapter-open-water-signals
-> binder / branch view / inspector / dock 同步聚焦 Open Water Signals
-> branch view 显示 branch title 与 baseline=current
-> 点击另一个 chapter
-> URL selectedChapterId 更新
-> branch / inspector / dock 同步刷新
-> 切 branchBaseline 到 checkpoint
-> URL branchBaseline=checkpoint 且 checkpointId 保留
-> 点击 Open in Draft
-> 进入 Chapter / Draft
-> browser back
-> 回到 Book / Draft / Branch + 原 branchId + branchBaseline + selectedChapterId
-> 切回 Export
-> 再切到 Structure
-> structure view 仍是 signals
```

### 13.6 app smoke（推荐）

新增一条：

```text
scene orchestrate snapshot
-> 切到 book draft branch
-> 选择 branch 和 baseline
-> 再切回 scene
-> scene lens/tab/proposal snapshot 不丢
```

再补一条：

```text
book export snapshot
-> 切到 branch
-> 再回 export
-> exportProfileId 仍恢复
```

这两条用于证明 PR14 新增的 `branchId / branchBaseline` 不破坏四 scope snapshot 机制，也不破坏 PR13 的 export state。

---

## 十四、Storybook 建议

新增：

```text
BookDraftBranchView.stories.tsx
BookExperimentBranchPicker.stories.tsx
```

更新：

```text
BookDraftStage.stories.tsx
BookDraftInspectorPane.stories.tsx
BookDraftBottomDock.stories.tsx
BookDraftWorkspace.stories.tsx
```

最少 story 组合：

- `BranchDefault`
- `BranchCurrentBaseline`
- `BranchCheckpointBaseline`
- `BranchHighPressure`
- `BranchBlockedByMissingDraft`
- `BranchTraceImproved`
- `BranchQuietEnding`

---

## 十五、实施顺序（给 AI 的执行顺序）

### Step 1
先扩 route：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`
- 加 `BookDraftView='branch'`
- 加 `BookBranchBaseline`
- 加 `branchId? / branchBaseline?`
- 补 route tests

### Step 2
新增 branch seed 与 client read 方法：

- `book-experiment-branches.ts`
- `book-client.ts`
- `book-query-keys.ts`

### Step 3
先写 pure branch mapper：

- `book-branch-view-models.ts`
- `book-experiment-branch-mappers.ts`
- mapper tests

### Step 4
新增 `useBookExperimentBranchQuery.ts`：

- 只组合 current draft workspace + selected branch + optional checkpoint
- 不重复拉取 chapter / scene / traceability

### Step 5
新增主舞台 branch 组件：

- `BookExperimentBranchPicker.tsx`
- `BookDraftBranchView.tsx`

### Step 6
接入 `BookDraftStage.tsx`：

- 增加 Branch tab
- `draftView='branch'` 时渲染 branch view

### Step 7
接入 `BookDraftWorkspace.tsx`：

- 调用 branch query
- 传 branch data 到 stage / inspector / dock
- route patch 负责 branchId / branchBaseline

### Step 8
增强 inspector / dock / activity：

- branch summary
- branch readiness
- branch problems
- branch activity

### Step 9
补集成测试与 stories：

- route
- mapper
- hook
- components
- workspace roundtrip
- app smoke

---

## 十六、完成后的验收标准

满足以下条件，PR14 就算完成：

1. Book route 支持 `draftView='branch'`。
2. Book route 支持 `branchId`。
3. Book route 支持 `branchBaseline='current' | 'checkpoint'`。
4. `view` 仍只服务 Book Structure，切换 branch 不会丢掉 dormant structure view。
5. `checkpointId` 仍服务 Compare，并可作为 branch checkpoint baseline。
6. Book Draft 主舞台有 `Read / Compare / Export / Branch` switcher。
7. Branch view 能展示 selected experiment branch 的 alternate manuscript preview。
8. Branch view 能把 branch 与 current / checkpoint 做 chapter-level 与 scene-section-level 对照。
9. `route.selectedChapterId` 仍统一驱动 binder / branch view / inspector / dock。
10. Branch view 保留 `Open in Draft` / `Open in Structure` handoff。
11. browser back 能恢复 book draft branch 的 `branchId / branchBaseline / selectedChapterId`。
12. PR13 的 Export Preview 不被破坏。
13. PR12 的 Compare view 不被破坏。
14. PR11 的 Book Draft read flow 不被破坏。
15. scene / chapter / asset dormant snapshot 不被破坏。
16. PR14 不包含 branch mutation / merge / publish / real export / AI rewrite。

---

## 十七、PR14 结束时不要留下的债

以下情况都算 PR 做偏了：

- 把 Branch 做成新 scope 或新 top-level lens。
- 把 `view` 改成 read / compare / export / branch，导致 structure dormant view 丢失。
- 为 branch 新增 selected chapter 第二真源。
- 为 branch 新增 sceneId / chunkId 等细粒度 book route。
- 复制 `useBookWorkspaceSources(...)` 或 `useBookDraftWorkspaceQuery(...)` 形成第四套 source waterfall。
- 在 Book client 中新增 giant `getBookBranchWorkspace()`。
- 做 branch create / merge / archive mutation。
- 用 Git 术语和 Git UI 心智压过写作者的 experiment 心智。
- 把 branch view 做成 dashboard，而不是 alternate manuscript preview。
- 顺手做真实导出 / publish / Review Inbox。
- 破坏 PR13 的 export profile / readiness route 恢复。

PR14 做完后的正确状态应该是：

**Book Draft 同时支持 Read / Compare / Export / Branch，用户能安全查看 alternate manuscript，并把它和 current / checkpoint 做可恢复的 read-heavy 对照，但系统仍不写入、不 merge、不发布。**

---

## 十八、PR15 以后建议路线（只做保留，不在本轮实施）

### PR15：Review Inbox / Manuscript Annotations

目标：把 scene proposal、chapter draft issues、book compare deltas、export readiness blockers、branch readiness issues 收束成 review queue。

范围建议：

- read-heavy review inbox
- filters by scope / severity / trace gap / export blocker / branch issue
- issue -> source scope handoff
- 不做多人评论系统
- 不做 assignment / notification

### PR16：Real Export Adapter Spike

目标：在 export preview 与 branch foundation 稳定后，再做真实文件导出的 adapter spike。

范围建议：

- 先只做 Markdown / JSON package
- 不直接上 PDF / EPUB
- 不做 publish API
- export adapter 与 preview mapper 解耦
- 明确 current / checkpoint / branch 三种 export source 的边界

### PR17：Selective Branch Merge Spike

目标：在 branch preview 足够稳定后，再做最小 selected-chapter / selected-scene merge spike。

范围建议：

- 只做 mock merge preview
- 不直接改写 scene prose
- 不做复杂 conflict resolver
- 不做 Git 化 UI

---

## 十九、给 AI 的最终一句话指令

在当前 `codex/pr13-book-export-preview-readiness` 已完成 Book Export Preview / Publish Readiness Foundation 的前提下，不要继续抛光 export preview，也不要提前做真实导出 / publish / merge；先只围绕 **Book Experiment Branch Foundation** 做一轮窄而实的实现：

- 给 Book route 增加 `draftView='branch'`、`branchId` 与 `branchBaseline`
- 保持 `view` 仍只服务 Book Structure
- 保持 `checkpointId` 仍服务 Compare，并可作为 Branch 的 checkpoint baseline
- 用 read-only branch seed 表达 alternate manuscript
- 复用当前 `useBookDraftWorkspaceQuery(...)`，不要复制 source waterfall
- 用 pure mapper 派生 branch vs current / checkpoint 的 chapter / scene-section delta
- 在 Book Draft 主舞台增加 Branch view 与 branch picker
- 让 inspector / dock 显示 branch-aware readiness signals
- 继续用 `route.selectedChapterId` 统一焦点
- 保留 Book -> Chapter Structure / Draft handoff
- 用测试固定 route restore、branch mapper、workspace roundtrip、四 scope snapshot 不变
- 明确不做 branch mutation、merge、真实 export、publish、AI rewrite
