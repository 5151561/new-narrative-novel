# PR13 执行文档（基于 `codex/pr12-book-manuscript-compare-review` 当前实际代码）

## 这份文档的目的

这不是路线图回顾，也不是大而全 wishlist。

这是一份**基于 `codex/pr12-book-manuscript-compare-review` 分支当前真实代码状态**整理出来的、可以直接交给 AI agent 实施的 PR13 指令文档。

PR13 的任务，不是继续抛光 PR12 已经完成的 `Book / Draft / Compare`，也不是直接做真实 PDF / EPUB / DOCX 文件导出，更不是提前进入 branch / publish / release workflow。

本轮更合适的目标是：

**在 Book Draft 内新增第一版 Export Preview / Publish Readiness 工作面，让用户能在真正导出之前，看见当前 manuscript 会被怎样打包，以及哪些问题会阻止它进入 publish-ready 状态。**

一句话判断：

**PR11 让 Book 能读全书稿，PR12 让 Book 能审全书稿，PR13 应该让 Book 能预检全书稿。**

---

## 一、先确认当前代码基线

下面这些判断必须建立在 PR12 当前代码事实上，而不是沿用 PR11 之前的旧假设。

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

所以 PR13 不需要继续处理 Book scope 接入，也不需要再证明 Book multi-lens 成立。

### 2. Book Draft 已经有 Read / Compare 两种 draft 子视图

当前 route 已有：

- `BookDraftView = 'read' | 'compare'`
- `checkpointId?`

`BookDraftWorkspace.tsx` 已经读取：

- `route.draftView ?? 'read'`
- `route.checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID`

并将它们传入 `BookDraftStage`。`BookDraftStage.tsx` 已经承担 draft 子视图 switchboard：

- `read` -> `BookDraftReader`
- `compare` -> `BookDraftCompareView`

所以 PR13 的正确扩展点不是另起一个 Book 页面，而是继续扩展 Book Draft 的 stage switchboard。

### 3. PR12 已经建立 explicit checkpoint compare，而不是自动历史

当前 `book-manuscript-checkpoints.ts` 已经提供显式 checkpoint seed；`book-client.ts` 已经提供：

- `getBookManuscriptCheckpoints(...)`
- `getBookManuscriptCheckpoint(...)`

`useBookManuscriptCompareQuery(...)` 也已经把当前 `BookDraftWorkspaceViewModel` 与 selected checkpoint 组合成 compare workspace。

这说明 PR13 可以直接复用 compare 结果做 readiness signal，而不应该再发明第二套 manuscript review 数据源。

### 4. PR12 的 compare mapper 已经保留 chapter / scene-section 粒度

当前 `book-manuscript-compare-mappers.ts` 已经提供：

- `buildCurrentManuscriptSnapshotFromBookDraft(...)`
- `normalizeBookManuscriptCheckpoint(...)`
- `buildSceneDelta(...)`
- `compareBookManuscriptSnapshots(...)`

它的差异粒度仍然是：

- book
- chapter
- scene section

没有把整本稿件压扁成单一字符串。这对 PR13 很关键，因为 export preview 也应该保留 chapter / scene section 层级，不要一上来做不可逆的全文字符串输出。

### 5. 当前只有 Scene 侧存在很轻的 export sheet

当前 scene components 里已有 `SceneExportSheet.tsx`，但它只是 scene workspace 里的轻量导出说明 sheet，内容主要是“准备导出当前 scene package”。

PR13 不应该直接复制它作为 Book 的完整导出方案。Book export preview 是 book draft 的主工作流延伸，应该是一个可恢复、可预检、可审阅的 main-stage surface，而不是一次性弹层。

### 6. 当前真正缺口不是 compare，而是 publish readiness

PR12 完成后，Book Draft 已经能回答：

- 当前稿与 checkpoint 有哪些差异
- 哪些 scene added / missing / changed / draft_missing
- word delta / trace regression / warning delta 如何变化

但它还不能回答：

- 当前稿如果要导出，会包含哪些内容
- 哪些 chapter / scene 会进入 export package
- 缺稿、缺 trace、warning、compare regression 哪些是 blocker，哪些只是 warning
- 当前 manuscript 是否 publish-ready
- export profile 会如何影响打包范围

这正是 PR13 应该补的洞。

---

## 二、PR13 的唯一目标

**在 `Book / Draft` 内新增 `Export Preview / Publish Readiness` 子视图。**

PR13 完成后，用户应该能：

1. 在 `scope='book' & lens='draft'` 下切到 `draftView='export'`。
2. 选择一个显式 export profile，例如：
   - `review-packet`
   - `submission-preview`
   - `archive-snapshot`
3. 在主舞台看到当前 manuscript 的 export preview：
   - book title / summary
   - chapter order
   - chapter section preview
   - scene prose section preview
   - optional appendix / trace / compare summary inclusion
4. 在同一个工作面看到 publish readiness checklist：
   - missing draft blockers
   - trace gaps
   - warnings
   - compare regressions
   - queued revisions
5. 用 `route.selectedChapterId` 继续驱动 binder / export preview / inspector / dock 的统一聚焦。
6. 从 Export Preview 中继续打开：
   - `Chapter / Draft`
   - `Chapter / Structure`
7. 浏览器 back 返回 Book Draft Export 时恢复：
   - `scope='book'`
   - `lens='draft'`
   - `draftView='export'`
   - `exportProfileId`
   - `selectedChapterId`
8. 从 Export Preview 切回 Read / Compare，再切回 Structure 时，PR12 已经成立的 dormant structure `view` 和 compare `checkpointId` 仍然保留。

一句话说：

**PR13 要把 Book Draft 从“能读、能审”推进到“能预检打包”，但仍不生成真实文件，也不进入正式 publish。**

---

## 三、为什么现在做 Export Preview，而不是 Branch / Publish / Export 文件生成

### 1. 真实导出必须先有可解释的 readiness

在没有 readiness checklist 之前，真实导出会变成“点一下下载文件”。这不符合项目一直坚持的 reviewable orchestration 心智。

PR13 应先回答：

- 为什么现在可以导出
- 为什么现在不应该导出
- 导出包会包含哪些内容
- 哪些缺口影响交付质量

### 2. Branch 需要更多版本心智，不适合抢在 export preview 前

PR12 只有显式 checkpoint compare，还没有 branch / alternate manuscript / selective merge。

如果现在直接做 branch，会同时引入：

- branch identity
- branch route
- branch compare
- branch merge
- branch activity

复杂度会明显超过 PR13 应有的范围。

### 3. PR13 可以充分复用 PR12 的 compare foundation

PR13 不需要重新计算 manuscript 差异。它应把 PR12 已有 compare result 用作 readiness 信号来源之一。

这会让实现路径很顺：

```text
BookDraftWorkspace
-> current manuscript workspace
-> compare workspace
-> export profile
-> export preview + readiness view-model
```

### 4. Scene 已有 export sheet，但 Book 需要更高层级的 export preview

Scene export 是局部交接动作；Book export preview 是整本 manuscript 交付预检。它们可以共享“export”语言，但不应共享同一种 UI 结构。

---

## 四、本轮明确不做

为了让 PR13 保持窄而实，以下内容不要混进来：

- 不生成真实文件
- 不做 PDF / EPUB / DOCX / Markdown 下载
- 不做 OS file save dialog
- 不做 publish API / release API
- 不做 branch / merge / alternate manuscript
- 不做 manuscript inline edit
- 不做 book mutation
- 不做 chapter reorder from book
- 不做 scene chunk anchor route
- 不做 full typography / pagination engine
- 不做 print CSS 大工程
- 不做 AI rewrite / AI publish summary
- 不做 asset editor / graph
- 不做 global rail 重构
- 不新增 runtime bridge capability

PR13 的定位必须明确为：

**Book Export Preview / Publish Readiness Foundation，read-heavy，不写稿、不导出文件、不发布、不分支。**

---

## 五、必须遵守的硬约束

### 5.1 `route.selectedChapterId` 仍然是 Book 内聚焦真源

不要新增：

- `selectedExportChapterId` store
- export view 内部 active chapter 真源
- inspector / dock 各自维护 selected chapter

统一规则：

- 当前聚焦 chapter 来源于 `route.selectedChapterId`
- export workspace 的 selected chapter 只是派生结果
- 点击 binder chapter：`patchBookRoute({ selectedChapterId })`
- 点击 export preview chapter block：`patchBookRoute({ selectedChapterId })`

### 5.2 `view` 继续只服务 Book Structure

不要把 `BookRouteState.view` 改成 read / compare / export。

PR12 已经建立了正确边界：

- `view` = Book Structure 的 `sequence | outliner | signals`
- `draftView` = Book Draft 的 `read | compare`

PR13 只应把 `draftView` 扩展为：

```ts
export type BookDraftView = 'read' | 'compare' | 'export'
```

这样：

- `view` 仍然保留 dormant structure state
- `draftView` 只服务 Book Draft
- Structure 与 Draft 的子状态不会互相污染

### 5.3 新增 `exportProfileId?`，但不新增 publish route

建议在 `BookRouteState` 上增加：

```ts
exportProfileId?: string
```

不要新增：

- `publishMode`
- `exportModal`
- `downloadFormat`
- `fileType`
- `publishTarget`

第一版只需要 profile 选择，不需要真实导出目的地。

### 5.4 Book client 仍然保持薄

可以在 `bookClient` 上增加 read-only export profile seed 读取方法，但不要新增 giant server client：

不要新增：

- `getBookExportWorkspace()`
- `generateBookExport()`
- `publishBook()`
- `downloadBookFile()`

允许新增：

- `getBookExportProfiles(bookId)`
- `getBookExportProfile(bookId, exportProfileId)`

这些只是 read-only mock metadata，与 PR12 checkpoint seed 类似。

### 5.5 Export Preview 必须复用 current draft workspace 和 compare workspace

不要重新拉取：

- chapter workspaces
- scene prose
- traceability sources
- checkpoint data

正确方式：

- current manuscript：来自 `useBookDraftWorkspaceQuery(...)`
- compare summary：来自 `useBookManuscriptCompareQuery(...)`
- export profile：来自新的 read-only export profile query
- export readiness：由 pure mapper 派生

### 5.6 不新增 scene-level route anchor

PR13 不往 Book route 里新增：

- `sceneId`
- `chunkId`
- `selectedSectionId`
- `issueId`

Export Preview 第一版的聚焦单位仍然是 chapter。Scene section 只作为 preview 的子项展示。

### 5.7 Export Preview 不能破坏 Book -> Chapter handoff

当前 Book 已有：

- `Open in Structure`
- `Open in Draft`

PR13 必须保留这两个次级动作。Export Preview 的主点击仍是 book 内聚焦 chapter，不应变成 handoff。

---

## 六、路由与状态改法

### 6.1 `workbench-route.ts`

把：

```ts
export type BookDraftView = 'read' | 'compare'
```

扩展为：

```ts
export type BookDraftView = 'read' | 'compare' | 'export'
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
  selectedChapterId?: string
}
```

### 6.2 URL 示例

```text
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-review-packet&selectedChapterId=chapter-open-water-signals
```

注意：

- `view=signals` 仍然只是 dormant structure view。
- `checkpointId` 仍然服务 compare / readiness 的 baseline。
- `exportProfileId` 只服务 export preview。

### 6.3 `useWorkbenchRouteState.ts`

要做的事：

1. `VALID_BOOK_DRAFT_VIEWS` 加入 `export`。
2. 新增 `DEFAULT_BOOK_EXPORT_PROFILE_ID`。
3. `CANONICAL_ROUTE_KEYS` 增加 `exportProfileId`。
4. `normalizeBookRoute(...)` 读取并规范化：
   - `draftView`
   - `checkpointId`
   - `exportProfileId`
5. `readBookSnapshot(...)` 读取 `exportProfileId`。
6. `buildWorkbenchSearch(...)` 在 book scope 下写入 `exportProfileId`。
7. `patchBookRoute(...)` 继续保持一个 API，不新增 export 专用 patch hook。

### 6.4 默认规则建议

- `lens='draft'` 且 `draftView` 缺失时，fallback 到 `read`。
- `draftView='compare'` 且 `checkpointId` 缺失时，fallback 到默认 checkpoint。
- `draftView='export'` 且 `exportProfileId` 缺失时，fallback 到默认 export profile。
- `draftView='export'` 时可以保留 `checkpointId`，因为 readiness 可以使用 compare baseline。
- `lens='structure'` 时，`draftView / checkpointId / exportProfileId` 可以保留在 dormant snapshot 中，但 UI 不使用。

---

## 七、数据层设计

### 7.1 新增 read-only export profile records

新增文件：

```text
packages/renderer/src/features/book/api/book-export-profiles.ts
```

推荐类型：

```ts
export type BookExportProfileKind = 'review_packet' | 'submission_preview' | 'archive_snapshot'

export interface BookExportProfileRecord {
  exportProfileId: string
  bookId: string
  kind: BookExportProfileKind
  title: BookLocalizedText
  summary: BookLocalizedText
  createdAtLabel: BookLocalizedText
  includes: {
    manuscriptBody: boolean
    chapterSummaries: boolean
    sceneHeadings: boolean
    traceAppendix: boolean
    compareSummary: boolean
    readinessChecklist: boolean
  }
  rules: {
    requireAllScenesDrafted: boolean
    requireTraceReady: boolean
    allowWarnings: boolean
    allowDraftMissing: boolean
  }
}
```

### 7.2 Seed 建议

第一版建议至少 3 个 profile：

```text
export-review-packet
export-submission-preview
export-archive-snapshot
```

#### `export-review-packet`

用于内部审阅包：

- 包含 manuscript body
- 包含 chapter summaries
- 包含 trace appendix
- 包含 compare summary
- 允许 warnings
- 不允许 draft_missing

#### `export-submission-preview`

用于投稿预览：

- 包含 manuscript body
- 包含 chapter headings
- 不包含 trace appendix
- 不包含 compare detail
- 不允许 missing draft
- 不允许 warnings 增加

#### `export-archive-snapshot`

用于归档快照：

- 包含 manuscript body
- 包含 compare summary
- 包含 readiness checklist
- 可以保留 warnings
- 可以标记 trace gaps

### 7.3 `book-client.ts` 只增加 profile 读取能力

在现有薄 client 上增加：

```ts
getBookExportProfiles(input: { bookId: string }): Promise<BookExportProfileRecord[]>
getBookExportProfile(input: { bookId: string; exportProfileId: string }): Promise<BookExportProfileRecord | null>
```

这些方法应只读取 mock seed 并 clone，不写入，不生成文件。

### 7.4 query keys

修改：

```text
packages/renderer/src/features/book/hooks/book-query-keys.ts
```

新增：

```ts
exportProfiles: (bookId: string, locale: Locale) => ['book', 'exportProfiles', bookId, locale]
exportProfile: (bookId: string, exportProfileId: string, locale: Locale) => [
  'book',
  'exportProfile',
  bookId,
  exportProfileId,
  locale,
]
```

不要改现有：

- book structure key
- book draft source key
- checkpoint key
- compare key

### 7.5 新增 export preview query hook

新增文件：

```text
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
```

推荐签名：

```ts
export function useBookExportPreviewQuery({
  bookId,
  currentDraftWorkspace,
  compareWorkspace,
  exportProfileId,
}: {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  compareWorkspace: BookManuscriptCompareWorkspaceViewModel | null | undefined
  exportProfileId?: string | null
})
```

职责：

1. 读取 export profile list。
2. 读取 selected export profile。
3. 将 current draft workspace + compare workspace + selected profile 交给 pure mapper。
4. 返回：
   - `exportWorkspace`
   - `exportProfiles`
   - `selectedExportProfile`
   - loading / error

关键纪律：

- 不重新拉取 chapter / scene / traceability。
- 不生成下载文件。
- 不改变 manuscript 数据。

---

## 八、Export view-model 设计

新增文件：

```text
packages/renderer/src/features/book/types/book-export-view-models.ts
```

### 8.1 `BookExportProfileViewModel`

```ts
export interface BookExportProfileViewModel {
  exportProfileId: string
  bookId: string
  kind: 'review_packet' | 'submission_preview' | 'archive_snapshot'
  title: string
  summary: string
  createdAtLabel: string
  includes: {
    manuscriptBody: boolean
    chapterSummaries: boolean
    sceneHeadings: boolean
    traceAppendix: boolean
    compareSummary: boolean
    readinessChecklist: boolean
  }
  rules: {
    requireAllScenesDrafted: boolean
    requireTraceReady: boolean
    allowWarnings: boolean
    allowDraftMissing: boolean
  }
}
```

### 8.2 `BookExportReadinessIssueViewModel`

```ts
export type BookExportReadinessSeverity = 'blocker' | 'warning' | 'info'
export type BookExportReadinessKind =
  | 'missing_draft'
  | 'trace_gap'
  | 'warning_delta'
  | 'queued_revision'
  | 'compare_regression'
  | 'profile_rule'

export interface BookExportReadinessIssueViewModel {
  id: string
  severity: BookExportReadinessSeverity
  kind: BookExportReadinessKind
  chapterId?: string
  sceneId?: string
  title: string
  detail: string
  recommendedActionLabel?: string
}
```

### 8.3 `BookExportScenePreviewViewModel`

```ts
export interface BookExportScenePreviewViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  proseDraft?: string
  draftWordCount?: number
  isIncluded: boolean
  isMissingDraft: boolean
  traceReady: boolean
  warningsCount: number
  compareDelta?: 'unchanged' | 'changed' | 'added' | 'missing' | 'draft_missing'
}
```

### 8.4 `BookExportChapterPreviewViewModel`

```ts
export interface BookExportChapterPreviewViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  isIncluded: boolean
  assembledWordCount: number
  missingDraftCount: number
  missingTraceCount: number
  warningCount: number
  scenes: BookExportScenePreviewViewModel[]
  readinessStatus: 'ready' | 'attention' | 'blocked'
}
```

### 8.5 `BookExportPreviewWorkspaceViewModel`

```ts
export interface BookExportPreviewWorkspaceViewModel {
  bookId: string
  title: string
  summary: string
  selectedChapterId: string | null
  selectedChapter: BookExportChapterPreviewViewModel | null
  profile: BookExportProfileViewModel
  chapters: BookExportChapterPreviewViewModel[]
  totals: {
    includedChapterCount: number
    includedSceneCount: number
    assembledWordCount: number
    blockerCount: number
    warningCount: number
    infoCount: number
    missingDraftCount: number
    traceGapCount: number
    compareChangedSceneCount: number
  }
  readiness: {
    status: 'ready' | 'attention' | 'blocked'
    label: string
    issues: BookExportReadinessIssueViewModel[]
  }
  packageSummary: {
    includedSections: string[]
    excludedSections: string[]
    estimatedPackageLabel: string
  }
}
```

---

## 九、Pure mapper 设计

新增文件：

```text
packages/renderer/src/features/book/lib/book-export-preview-mappers.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts
```

### 9.1 必须提供的函数

```ts
normalizeBookExportProfile(record, locale)
buildBookExportPreviewWorkspace({ currentDraftWorkspace, compareWorkspace, profile, selectedChapterId })
buildBookExportChapterPreview({ chapter, compareChapter, profile })
deriveBookExportReadinessIssues({ currentDraftWorkspace, compareWorkspace, profile })
deriveBookExportReadinessStatus(issues)
```

### 9.2 readiness 规则第一版

不要做智能推断，也不要做 AI 总结。

用显式规则：

#### Blocker

- profile 要求所有 scenes drafted，但存在 missing draft。
- profile 不允许 warnings，但 warningsDelta > 0 或 chapter warningCount > 0。
- profile 要求 trace ready，但存在 trace gap / trace regression。
- compare 中存在 `draft_missing`。

#### Warning

- compare 中存在 changed scene。
- compare 中存在 added scene。
- compare 中存在 missing scene。
- queued revisions > 0。
- profile 包含 trace appendix，但部分 scene 缺 trace。

#### Info

- profile 排除了 trace appendix。
- profile 排除了 compare summary。
- export package 是 archive snapshot，不要求 publish clean。

### 9.3 package summary 规则

根据 profile includes 派生：

- manuscript body
- chapter summaries
- scene headings
- trace appendix
- compare summary
- readiness checklist

第一版只显示 included / excluded，不生成真实文件。

---

## 十、组件与容器改法

### 10.1 扩展 `BookDraftStage.tsx`

当前 `BookDraftStage` 只支持：

- Read
- Compare

PR13 改成：

- Read
- Compare
- Export

新增 props：

```ts
exportPreview?: BookExportPreviewWorkspaceViewModel | null
exportProfiles: BookExportProfileSummaryViewModel[]
selectedExportProfileId: string
exportError?: Error | null
onSelectExportProfile: (exportProfileId: string) => void
```

渲染规则：

- `draftView='read'` -> `BookDraftReader`
- `draftView='compare'` -> `BookDraftCompareView`
- `draftView='export'` -> `BookDraftExportView`

### 10.2 新增 `BookDraftExportView.tsx`

新增文件：

```text
packages/renderer/src/features/book/components/BookDraftExportView.tsx
```

职责：

- 主舞台中展示 export preview 与 readiness。
- 以 chapter 为主单位展示 package 预览。
- 当前 selected chapter 高亮。
- 点击 chapter block：`onSelectChapter(chapterId)`。
- 保留次级动作：
  - `Open in Draft`
  - `Open in Structure`

建议结构：

1. `Export profile summary`
2. `Publish readiness banner`
3. `Package summary`
4. `Chapter preview list`
5. `Selected chapter detail`

不要做：

- download button
- generate file button
- publish button
- accept/reject issues
- inline edit

### 10.3 新增 `BookExportProfilePicker.tsx`

新增文件：

```text
packages/renderer/src/features/book/components/BookExportProfilePicker.tsx
```

职责：

- 展示 export profile label / summary / kind。
- 选择 profile 时调用 `patchBookRoute({ draftView: 'export', exportProfileId })`。
- 即使第一版只有少量 profile，也要保留组件形态。

### 10.4 新增 `BookExportReadinessChecklist.tsx`（推荐）

新增文件：

```text
packages/renderer/src/features/book/components/BookExportReadinessChecklist.tsx
```

职责：

- 渲染 blocker / warning / info issue。
- 支持按 severity 分组。
- 每条 issue 可以显示 chapter / scene label。
- issue 点击时，若有 `chapterId`，调用 `onSelectChapter(chapterId)`。

如果想进一步收窄 PR，也可以先内联在 `BookDraftExportView.tsx` 中；但若组件超过 150 行，建议抽出来。

### 10.5 修改 `BookDraftInspectorPane.tsx`

现有 inspector 已有 read / compare aware 结构。PR13 增加 export-aware 区域。

新增 props：

```ts
exportPreview?: BookExportPreviewWorkspaceViewModel | null
activeDraftView?: BookDraftView
```

当 `activeDraftView === 'export'` 时，显示：

#### A. Export Profile

- profile title
- profile kind
- included package sections

#### B. Readiness

- readiness status
- blocker count
- warning count
- top 3 issues

#### C. Selected Chapter Export

- selected chapter included / blocked / attention
- included scene count
- missing draft count
- trace gap count

Read / Compare 模式原有 inspector 不要被破坏。

### 10.6 修改 `BookDraftBottomDock.tsx`

在 export 模式下 Problems 区域增加：

- blockers
- warnings
- trace gaps
- missing drafts
- compare regressions affecting export

Activity 增加：

- entered export preview
- selected export profile
- returned to read / compare

### 10.7 修改 `BookDraftWorkspace.tsx`

要做的事：

1. 继续调用 `useBookDraftWorkspaceQuery(...)`。
2. 继续调用 `useBookManuscriptCompareQuery(...)`。
3. 新增 `useBookExportPreviewQuery(...)`。
4. 计算：
   - `activeDraftView = route.draftView ?? 'read'`
   - `effectiveCheckpointId = route.checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID`
   - `effectiveExportProfileId = route.exportProfileId ?? DEFAULT_BOOK_EXPORT_PROFILE_ID`
5. `onSelectDraftView('export')` 时写入 `draftView='export'` 与 `exportProfileId`。
6. 新增 `onSelectExportProfile(...)`。
7. 把 export data 传给：
   - `BookDraftStage`
   - `BookDraftInspectorPane`
   - `BookDraftDockContainer`
8. loading 条件只在当前 active draftView 需要对应数据时阻塞：
   - read：不等 compare / export
   - compare：等 compare
   - export：等 export preview

---

## 十一、建议的文件改动

### 11.1 新增

```text
packages/renderer/src/features/book/api/book-export-profiles.ts
packages/renderer/src/features/book/types/book-export-view-models.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.test.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.test.tsx
packages/renderer/src/features/book/components/BookDraftExportView.tsx
packages/renderer/src/features/book/components/BookDraftExportView.test.tsx
packages/renderer/src/features/book/components/BookExportProfilePicker.tsx
packages/renderer/src/features/book/components/BookExportProfilePicker.test.tsx
packages/renderer/src/features/book/components/BookExportReadinessChecklist.tsx
packages/renderer/src/features/book/components/BookExportReadinessChecklist.test.tsx
```

### 11.2 修改

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

### 11.3 这一轮尽量不动

```text
packages/renderer/src/features/chapter/**
packages/renderer/src/features/scene/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/traceability/** 的核心 hook / mapper
packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/lib/book-draft-workspace-mappers.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.ts
packages/renderer/src/features/book/components/BookDraftReader.tsx
packages/renderer/src/features/book/components/BookDraftCompareView.tsx
packages/renderer/src/features/book/components/BookDraftBinderPane.tsx
```

如果必须碰 `BookDraftReader` 或 `BookDraftCompareView`，只做 props 类型兼容，不重写 read / compare 逻辑。

---

## 十二、测试补齐方案

### 12.1 route 测试

至少覆盖：

1. book route 能读写 `draftView='export'`。
2. book route 能读写 `exportProfileId`。
3. `lens='draft'` 下保留 structure `view`。
4. `draftView='export'` 下保留 compare `checkpointId`。
5. `lens='structure'` 下 dormant `draftView / checkpointId / exportProfileId` 不破坏 structure view。
6. 四 scope dormant snapshot 继续成立。

### 12.2 mapper 测试

`book-export-preview-mappers.test.ts` 至少覆盖：

1. profile 被正确 localized。
2. review packet profile 包含 trace appendix / compare summary / readiness checklist。
3. submission profile 不包含 trace appendix。
4. missing draft 在 strict profile 下产生 blocker。
5. trace gap 在 requireTraceReady profile 下产生 blocker。
6. warnings 在 allowWarnings=false profile 下产生 blocker。
7. compare changed / added / missing scene 产生 warning。
8. package summary included / excluded sections 派生正确。
9. selectedChapterId 缺失时 fallback 到第一章。
10. totals 聚合正确。

### 12.3 query 测试

`useBookExportPreviewQuery.test.tsx` 至少覆盖：

1. 能读取 export profile list。
2. `exportProfileId` 缺失时使用默认 profile。
3. profile 不存在时返回 export empty / error state。
4. current draft workspace loading 时不生成错误 export preview。
5. compare workspace 缺失时仍可生成基本 preview，但 compare summary issue 降级为 info。
6. export workspace selected chapter 与 route selected chapter 同步。

### 12.4 component 测试

#### `BookDraftStage.test.tsx`

- read view 渲染 `BookDraftReader`
- compare view 渲染 `BookDraftCompareView`
- export view 渲染 `BookDraftExportView`
- 切换 export 触发 `onSelectDraftView('export')`

#### `BookDraftExportView.test.tsx`

- 渲染 export profile summary
- 渲染 readiness status
- 渲染 blocker / warning counts
- 渲染 chapter preview list
- selected chapter 高亮
- 点击 chapter 触发 `onSelectChapter`
- `Open in Draft` / `Open in Structure` 可触发
- 不出现真实 download / publish button

#### `BookExportProfilePicker.test.tsx`

- 展示 profile title / summary / kind
- 选择 profile 触发 `onSelectExportProfile`

#### `BookExportReadinessChecklist.test.tsx`

- 按 severity 显示 blocker / warning / info
- 点击含 chapterId 的 issue 触发 `onSelectChapter`

#### `BookDraftInspectorPane.test.tsx`

- export 模式显示 profile / readiness / selected chapter export 区块
- read / compare 模式不显示 export-only 区块

#### `BookDraftBottomDock.test.tsx`

- export 模式显示 blockers / warnings / trace gaps
- activity 可显示 entered export / selected profile

### 12.5 workspace 集成测试

扩展 `BookDraftWorkspace.test.tsx`，新增完整路径：

```text
打开 /workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-review-packet&selectedChapterId=chapter-open-water-signals
-> binder / export preview / inspector / dock 同步聚焦 Open Water Signals
-> export preview 显示 profile label 与 readiness status
-> readiness checklist 显示 missing draft / trace gap / warning issue
-> 点击 Chapter 1
-> URL selectedChapterId 更新
-> export preview / inspector / dock 同步刷新
-> 切到 Compare
-> checkpointId 仍保留
-> 切回 Export
-> exportProfileId 仍保留
-> 点击 Open in Draft
-> 进入 Chapter / Draft
-> browser back
-> 回到 Book / Draft / Export + 原 exportProfileId + selectedChapterId
-> 切到 Structure
-> structure view 仍是 signals
```

### 12.6 app smoke（推荐）

新增一条：

```text
scene orchestrate snapshot
-> 切到 book draft export
-> 再切回 scene
-> scene lens/tab/proposal snapshot 不丢
```

这条用于证明 PR13 新增的 `exportProfileId` 不破坏四 scope snapshot 机制。

---

## 十三、Storybook 建议

新增：

```text
BookDraftExportView.stories.tsx
BookExportProfilePicker.stories.tsx
BookExportReadinessChecklist.stories.tsx
```

更新：

```text
BookDraftStage.stories.tsx
BookDraftInspectorPane.stories.tsx
BookDraftBottomDock.stories.tsx
BookDraftWorkspace.stories.tsx
```

最少 story 组合：

- `ExportReviewPacket`
- `ExportSubmissionPreview`
- `ExportArchiveSnapshot`
- `ExportBlockedByMissingDraft`
- `ExportBlockedByTraceGap`
- `ExportWarningsOnly`
- `ExportReady`

---

## 十四、实施顺序（给 AI 的执行顺序）

### Step 1
先扩 route：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`
- 加 `BookDraftView = 'export'`
- 加 `exportProfileId?`
- 补 route tests

### Step 2
新增 export profile seed 与 client read 方法：

- `book-export-profiles.ts`
- `book-client.ts`
- `book-query-keys.ts`

只做 read-only profile metadata。

### Step 3
先写 pure export mapper：

- `book-export-view-models.ts`
- `book-export-preview-mappers.ts`
- mapper tests

确保 readiness 规则固定下来，再接 UI。

### Step 4
新增 `useBookExportPreviewQuery.ts`：

- 只组合 current draft workspace + compare workspace + export profile
- 不重复拉取 chapter / scene / traceability

### Step 5
新增 export 主舞台组件：

- `BookDraftExportView.tsx`
- `BookExportProfilePicker.tsx`
- `BookExportReadinessChecklist.tsx`

### Step 6
接入 `BookDraftStage.tsx`：

- Read / Compare / Export 三段 switcher
- export view 渲染 `BookDraftExportView`

### Step 7
接入 `BookDraftWorkspace.tsx`：

- 调用 export query
- 新增 `onSelectExportProfile`
- route patch 负责 `draftView / exportProfileId`
- export data 传给 stage / inspector / dock

### Step 8
增强 inspector / dock / activity：

- export profile summary
- readiness checklist summary
- blocker / warning problems
- export activity

### Step 9
补集成测试与 stories：

- route
- mapper
- hook
- components
- workspace roundtrip
- app smoke
- stories

---

## 十五、完成后的验收标准

满足以下条件，PR13 就算完成：

1. Book route 支持 `draftView='export'`。
2. Book route 支持 `exportProfileId`。
3. `view` 仍只服务 Book Structure，切换 export 不会丢掉 dormant structure `view`。
4. `checkpointId` 仍可在 Export Preview 中保留并用于 readiness。
5. Book Draft 主舞台有 `Read / Compare / Export` switcher。
6. Export Preview 能按 export profile 展示 package preview。
7. Export Preview 能显示 publish readiness status。
8. Readiness 能区分 blocker / warning / info。
9. `route.selectedChapterId` 仍统一驱动 binder / export preview / inspector / dock。
10. Export Preview 保留 `Open in Draft` / `Open in Structure` handoff。
11. browser back 能恢复 book draft export 的 `exportProfileId` 与 `selectedChapterId`。
12. PR12 的 Book Draft compare flow 不被破坏。
13. PR11 的 Book Draft read flow 不被破坏。
14. PR10 的 Book Structure 三视图不被破坏。
15. scene / chapter / asset dormant snapshot 不被破坏。
16. PR13 不包含真实文件导出 / publish / branch / mutation / AI rewrite。

---

## 十六、PR13 结束时不要留下的债

以下情况都算 PR 做偏了：

- 把 `view` 改成 read / compare / export，导致 structure dormant view 丢失。
- 为 export 新增 selected chapter 第二真源。
- 为 export 引入 `sceneId / chunkId / issueId` 等细粒度 book route。
- 复制 `useBookWorkspaceSources(...)` 或 `useBookDraftWorkspaceQuery(...)` 形成第三套 source waterfall。
- 在 Book client 中新增 giant `getBookExportWorkspace()`。
- 真实生成 PDF / EPUB / DOCX 文件。
- 增加 download / publish side effect。
- 把 export preview 做成 dashboard，而不是 manuscript package preview。
- 顺手做 branch / publish / merge。
- 破坏 PR12 的 compare view 或 PR11 的 read-first reader。

PR13 做完后的正确状态应该是：

**Book Draft 同时支持 Read / Compare / Export Preview，用户能在导出前看见 manuscript package 与 publish readiness，但系统仍保持 read-heavy、route-first、workbench-first 的纪律。**

---

## 十七、PR14 以后建议路线（只做保留，不在本轮实施）

### PR14：Experiment Branch Foundation

目标：建立最小 branch / alternate manuscript 心智。

范围建议：

- mock branch records
- branch selector
- branch to checkpoint compare
- branch readiness summary
- 不做复杂 merge
- 不做 Git 化 UI

### PR15：Review Inbox / Manuscript Annotations

目标：把 scene proposal、chapter draft issues、book compare deltas、export readiness blockers 收束成 review queue。

范围建议：

- read-heavy review inbox
- filters by scope / severity / trace gap / export blocker
- issue -> source scope handoff
- 不做多人评论系统
- 不做 assignment / notification

### PR16：Real Export Adapter Spike

目标：在 export preview 稳定后，再做真实文件导出的 adapter spike。

范围建议：

- 先只做 Markdown / JSON package
- 不直接上 PDF / EPUB
- 不做 publish API
- export adapter 与 preview mapper 解耦

---

## 十八、给 AI 的最终一句话指令

在当前 `codex/pr12-book-manuscript-compare-review` 已完成 Book Manuscript Compare / Review Foundation 的前提下，不要继续抛光 compare，也不要提前做真实 publish / export 文件生成 / branch；先只围绕 **Book Export Preview / Publish Readiness Foundation** 做一轮窄而实的实现：

- 给 Book route 增加 `draftView='export'` 与 `exportProfileId`
- 保持 `view` 仍只服务 Book Structure
- 保持 `checkpointId` 仍服务 Compare / readiness baseline
- 用 read-only export profile seed 表达 review packet / submission preview / archive snapshot
- 复用当前 `useBookDraftWorkspaceQuery(...)` 和 `useBookManuscriptCompareQuery(...)`
- 用 pure mapper 派生 export package preview 与 readiness checklist
- 在 Book Draft 主舞台增加 `Read / Compare / Export` switcher 与 export preview view
- 让 inspector / dock 显示 export-aware readiness signals
- 继续用 `route.selectedChapterId` 统一焦点
- 保留 Book -> Chapter Structure / Draft handoff
- 用测试固定 route restore、export mapper、workspace roundtrip、四 scope snapshot 不变
- 明确不做真实文件导出、publish、branch、mutation、AI rewrite
