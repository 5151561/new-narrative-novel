# PR18 执行文档：Export Package Artifact Foundation

基于当前分支：`codex/pr17-review-source-fix-actions`

## 这份文档的目的

这不是路线图回顾，也不是大而全 wishlist。

这是一份**基于当前 `codex/pr17-review-source-fix-actions` 分支真实代码状态**整理出来的、可以直接交给 AI agent 实施的 PR18 指令文档。

PR18 的任务，不是继续扩展 Review Inbox 的 decision / source-fix 状态，也不是直接进入 PDF / EPUB / DOCX / Publish API，而是围绕一个更稳、更符合当前产品节奏的目标推进：

**在现有 Book Draft Export Preview 之上，新增第一版可生成、可回看、可复制 / 下载的 manuscript export artifact。**

一句话判断：

**PR17 已经让 Review issue 能发起和追踪 source-fix 尝试；PR18 应该让 Export Preview 第一次产出真实 artifact，但仍只做本地 mock package，不进入正式发布。**

---

## 一、先确认当前代码基线

下面这些判断必须建立在当前 PR17 代码事实上，而不是沿用 PR12 或 PR13 之前的假设。

### 1. Book Draft 已经拥有完整的 manuscript workflow 子视图

当前 `BookDraftView` 已经包含：

```ts
export type BookDraftView = 'read' | 'compare' | 'export' | 'branch' | 'review'
```

当前 `BookRouteState` 也已经有：

- `draftView?`
- `branchId?`
- `branchBaseline?`
- `checkpointId?`
- `exportProfileId?`
- `reviewFilter?`
- `reviewStatusFilter?`
- `reviewIssueId?`
- `selectedChapterId?`

所以 PR18 不需要新增新的 Book Draft 子视图，也不需要新增新的 `publish` scope / lens。

### 2. Export Preview 已经不是空壳

当前 book feature 已经有：

- `BookDraftExportView.tsx`
- `BookExportProfilePicker.tsx`
- `BookExportReadinessChecklist.tsx`
- `useBookExportPreviewQuery.ts`
- `book-export-view-models.ts`
- `book-export-preview-mappers.ts`
- export profiles seed

这说明 PR18 不需要重新设计 export preview。它应该把现有 preview 作为输入，向后增加 artifact generation 层。

### 3. Review Inbox 已经能覆盖 export / branch / compare / manuscript 问题

当前 review mapper 已经能从这些来源生成 issue：

- current manuscript / missing draft
- traceability gap
- compare delta
- export readiness
- branch readiness
- seed scene proposal / review seeds

PR16 / PR17 之后，review issue 也已经有两层 overlay：

- triage decision：`open / reviewed / deferred / dismissed / stale`
- source-fix action：`not_started / started / checked / blocked / stale`

这意味着 PR18 的 packaging gate 可以使用 review inbox 的当前状态，而不是重新发明一套独立的“打包前检查”。

### 4. PR17 已经把 source fix actions 做成独立 overlay

当前 review feature 已经有：

- `review-fix-action-records.ts`
- `mock-review-fix-action-db.ts`
- `useBookReviewFixActionsQuery.ts`
- `useSetReviewIssueFixActionMutation.ts`
- `useClearReviewIssueFixActionMutation.ts`
- `ReviewSourceFixControls.tsx`

并且 `BookDraftWorkspace.tsx` 已经把 source-fix action 和 `onOpenReviewSource(...)` 接在一起。

这对 PR18 有一个很重要的约束：

**source-fix action 不能自动算作 packaging gate 通过。**

例如：

- `fixAction.status === 'checked'` 只表示用户检查过 source。
- 只有 review decision 从 `open / stale` 变成 `reviewed / dismissed / deferred` 之后，PR18 的 gate 才能认为该 issue 不再是 open blocker。

### 5. 当前缺口是“预览已存在，但没有 artifact”

现在 `BookDraftExportView` 能展示：

- readiness status
- package summary
- included / excluded sections
- chapter package detail
- scene-level package detail
- Open in Draft / Open in Structure handoff

但仍然没有：

- 真实 package artifact record
- 生成 artifact 的 mutation
- artifact content / filename / MIME type
- artifact history
- source signature / stale 判断
- Copy / Download 操作入口
- packaging gate 对 review open blockers 的明确约束

这正是 PR18 要补的洞。

---

## 二、PR18 的唯一目标

**把 Book Draft Export 从“可看预览”推进到“能生成第一版本地 export artifact”。**

PR18 完成后，用户应该能：

1. 在 `scope='book' & lens='draft' & draftView='export'` 下选择 export profile。
2. 看到当前 export preview 的 readiness 和 review gate。
3. 如果 gate 通过，点击 `Build Markdown package` 或 `Build plain text package`。
4. 系统在 mock DB 中写入一条 `BookExportArtifactRecord`。
5. Export view 显示最新 artifact 的：
   - filename
   - format
   - createdAtLabel
   - source profile
   - checkpoint baseline
   - word count / chapter count / scene count
   - readiness snapshot
   - stale / current 状态
6. 用户可以：
   - `Copy package text`
   - `Download .md` / `Download .txt`
7. 如果用户修改了 export profile / checkpoint / current manuscript source，使 artifact 的 source signature 过期，UI 明确显示 `Artifact stale`。
8. Review open blockers 或 export readiness blockers 存在时，build action 被禁用，并显示 gate reasons。
9. 浏览器 back / four-scope dormant snapshot / Book Draft 当前 route 心智不被破坏。

一句话说：

**PR18 要让 Export Preview 第一次产出可用包，但这个包仍是 renderer/mock 层 artifact，不是正式 publish。**

---

## 三、为什么现在做 Artifact，而不是 Publish / Branch Merge / Review History

### 1. Export Preview 已经成熟到可以接 artifact

PR13 以后，Export Preview 已经有 profile、readiness、package summary、chapter detail。继续只抛光 preview 的收益开始降低。下一步最自然是让它产出第一版 artifact。

### 2. Review decisions 与 source-fix actions 已经能作为 packaging gate 的输入

PR16 / PR17 已经让 review issue 具备：

- 是否 open
- 是否 reviewed / deferred / dismissed
- 是否 stale
- 是否已发起 source fix
- source fix 是否 checked / blocked

这使得 PR18 可以实现一个可信的、但仍然很窄的 packaging gate：

```text
export readiness blockers + relevant review open blockers -> canBuildArtifact
```

### 3. Publish 需要先有 artifact

真实 publish/export 文件生成之前，系统必须先拥有：

- artifact record
- artifact content
- artifact metadata
- stale 判断
- gate snapshot

PR18 正是 publish 之前最小、必要的一层。

### 4. Branch merge 仍应该继续后置

Branch selective apply / merge 需要更复杂的 source mutation 和 conflict resolution。当前更值钱的路径是：

```text
preview -> review gate -> artifact
```

而不是马上进入：

```text
branch delta -> selective apply -> conflict merge
```

---

## 四、本轮明确不做

为了让 PR18 保持“窄而实”，以下内容不要混进来：

- 不做 PDF / EPUB / DOCX。
- 不做 zip package。
- 不做真实文件系统写入。
- 不做 publish API。
- 不做 cloud upload / share link。
- 不做 branch merge / selective apply。
- 不做 manuscript inline edit。
- 不做 export profile editor。
- 不做 source data mutation。
- 不做 AI rewrite / AI summary generation。
- 不做多人 review / assignment / comment thread。
- 不新增 `publish` scope / lens / draftView。
- 不新增 `artifactId` route 字段，第一版总是展示当前 profile 下的 latest artifact。

PR18 的定位必须明确为：

**Export Package Artifact Foundation，mock-local、read-heavy + one explicit build mutation。**

---

## 五、必须遵守的硬约束

### 5.1 不新增新的 scope / lens / draftView

当前 `BookDraftView` 已经有 `export`。PR18 必须继续把 artifact 放在：

```text
scope='book'
lens='draft'
draftView='export'
```

不要新增：

- `scope='publish'`
- `lens='publish'`
- `draftView='publish'`
- `draftView='artifact'`

### 5.2 不新增 route 真源

第一版 artifact 不需要 deep link 到某个 artifact id。

不要新增：

- `artifactId`
- `artifactFormat`
- `artifactPanel`
- `downloadIntent`

当前 route 中已有的：

- `bookId`
- `draftView`
- `checkpointId`
- `exportProfileId`
- `selectedChapterId`

已经足够表达 export artifact 的来源上下文。

Artifact 选择规则第一版保持简单：

- 按当前 `bookId + exportProfileId + checkpointId` 找 artifacts。
- 默认展示最新 artifact。
- stale 判断通过 source signature 派生。

### 5.3 Build artifact 是唯一写路径

PR18 可以新增一条 mutation：

```text
buildBookExportArtifact(...)
```

但不要新增：

- delete artifact
- edit artifact
- publish artifact
- upload artifact
- merge artifact

如果测试需要清理，使用 mock DB reset helper，而不是 UI 删除。

### 5.4 Packaging gate 不能把 source-fix checked 当成 resolved

PR17 明确让 source fix action 与 review decision 独立。

因此 PR18 的 gate 规则必须是：

- review blocker 的 `decision.status` 是 `open` 或 `stale`：阻塞 artifact build。
- review blocker 的 `decision.status` 是 `reviewed / deferred / dismissed`：不阻塞 build。
- `fixAction.status === 'checked'`：只作为提示，不自动解除 blocker。
- `fixAction.status === 'blocked'`：应作为 gate reason 的补充说明，但真正阻塞仍来自 open blocker。

### 5.5 Artifact 内容必须来自 export preview，不重新拼一套 manuscript source waterfall

不要在 artifact builder 里重新拉：

- book source
- chapter workspace
- scene prose
- traceability sources
- compare workspace

正确路径是：

```text
BookDraftWorkspace
  -> useBookDraftWorkspaceQuery
  -> useBookManuscriptCompareQuery
  -> useBookExportPreviewQuery
  -> useBookExportArtifactWorkspaceQuery(exportPreview, reviewInbox)
```

Artifact generator 只消费当前 `BookExportPreviewWorkspaceViewModel` 和 packaging gate snapshot。

### 5.6 Artifact content 不做复杂 diff / format engine

第一版只支持：

- `markdown`
- `plain_text`

不要引入：

- markdown AST library
- PDF renderer
- EPUB builder
- DOCX writer
- syntax highlighter
- external formatter

内容生成用纯函数字符串拼接即可。

### 5.7 Mock artifact DB 必须可 reset，client 必须 clone 返回值

PR18 一旦引入 artifact mutation，必须避免测试污染。

新增 mock DB 时必须包含：

- `resetMockBookExportArtifactDb()`
- clone input / clone output
- deterministic artifact id 或可测试的 id generator

---

## 六、数据层设计

## 6.1 新增 artifact records

推荐新增：

```text
packages/renderer/src/features/book/api/book-export-artifact-records.ts
```

建议类型：

```ts
export type BookExportArtifactFormat = 'markdown' | 'plain_text'

export type BookExportArtifactBuildStatus = 'ready'

export interface BookExportArtifactRecord {
  id: string
  bookId: string
  exportProfileId: string
  checkpointId?: string
  format: BookExportArtifactFormat
  status: BookExportArtifactBuildStatus
  filename: string
  mimeType: string
  title: string
  summary: string
  content: string
  sourceSignature: string
  chapterCount: number
  sceneCount: number
  wordCount: number
  readinessSnapshot: {
    status: 'ready' | 'attention' | 'blocked'
    blockerCount: number
    warningCount: number
    infoCount: number
  }
  reviewGateSnapshot: {
    openBlockerCount: number
    checkedFixCount: number
    blockedFixCount: number
    staleFixCount: number
  }
  createdAtLabel: string
  createdByLabel: string
}

export interface BuildBookExportArtifactInput {
  bookId: string
  exportProfileId: string
  checkpointId?: string
  format: BookExportArtifactFormat
  content: string
  title: string
  summary: string
  filename: string
  mimeType: string
  sourceSignature: string
  chapterCount: number
  sceneCount: number
  wordCount: number
  readinessSnapshot: BookExportArtifactRecord['readinessSnapshot']
  reviewGateSnapshot: BookExportArtifactRecord['reviewGateSnapshot']
}
```

### 为什么要有 sourceSignature

Artifact 是某次 export preview 的结果。当前稿、profile、checkpoint 或 readiness 改变后，旧 artifact 不应被误认为“仍然是当前包”。

第一版 source signature 可以由这些字段组合：

- `bookId`
- `exportProfileId`
- `checkpointId`
- included chapter ids
- included scene ids
- scene prose text / draft word count 简化 hash
- readiness issue ids + severity
- package summary included / excluded sections

不要用随机值。

### 为什么 artifact record 直接保存 content

这是第一版 renderer/mock artifact，不需要真实文件系统。把 `content` 放进 record 可以让：

- copy
- download
- story
- test
- artifact stale display

都变得简单可控。

---

## 七、Mock DB 与 client 设计

## 7.1 新增 mock artifact DB

推荐新增：

```text
packages/renderer/src/features/book/api/mock-book-export-artifact-db.ts
```

建议 API：

```ts
export function getMockBookExportArtifacts(input: {
  bookId: string
  exportProfileId?: string
  checkpointId?: string
}): BookExportArtifactRecord[]

export function buildMockBookExportArtifact(
  input: BuildBookExportArtifactInput,
): BookExportArtifactRecord

export function resetMockBookExportArtifactDb(): void
```

### 记录顺序

- 最新 artifact 排在前面。
- 第一版可只在 UI 展示最新 3 条。

### id 规则

建议 deterministic enough：

```ts
book-export-artifact-${bookId}-${exportProfileId}-${format}-${sequence}
```

为了测试稳定，可以在 reset 时重置 sequence。

## 7.2 扩展 book client

修改：

```text
packages/renderer/src/features/book/api/book-client.ts
```

新增：

```ts
getBookExportArtifacts(input: {
  bookId: string
  exportProfileId?: string
  checkpointId?: string
}): Promise<BookExportArtifactRecord[]>

buildBookExportArtifact(input: BuildBookExportArtifactInput): Promise<BookExportArtifactRecord>
```

### 不要做

不要新增：

- `publishBookExportArtifact(...)`
- `downloadBookExportArtifact(...)`
- `deleteBookExportArtifact(...)`
- `updateBookExportArtifact(...)`

Download 是浏览器端基于 artifact content 的 UI 动作，不是 client capability。

## 7.3 query keys

修改：

```text
packages/renderer/src/features/book/hooks/book-query-keys.ts
```

新增：

```ts
exportArtifacts: (bookId: string, exportProfileId?: string, checkpointId?: string) =>
  ['book', 'exportArtifacts', bookId, exportProfileId ?? 'all', checkpointId ?? 'current']
```

不要改现有：

- book structure source keys
- draft workspace source keys
- compare keys
- export profile keys

---

## 八、Artifact mapper / gate 设计

## 8.1 新增 view-model 类型

推荐新增：

```text
packages/renderer/src/features/book/types/book-export-artifact-view-models.ts
```

建议类型：

```ts
export interface BookExportArtifactGateReasonViewModel {
  id: string
  severity: 'blocker' | 'warning'
  title: string
  detail: string
  source: 'export-readiness' | 'review-open-blocker'
}

export interface BookExportArtifactGateViewModel {
  canBuild: boolean
  status: 'ready' | 'attention' | 'blocked'
  label: string
  reasons: BookExportArtifactGateReasonViewModel[]
  openBlockerCount: number
  checkedFixCount: number
  blockedFixCount: number
  staleFixCount: number
}

export interface BookExportArtifactSummaryViewModel {
  artifactId: string
  format: 'markdown' | 'plain_text'
  filename: string
  mimeType: string
  title: string
  summary: string
  content: string
  createdAtLabel: string
  createdByLabel: string
  sourceSignature: string
  isStale: boolean
  chapterCount: number
  sceneCount: number
  wordCount: number
  readinessStatus: 'ready' | 'attention' | 'blocked'
}

export interface BookExportArtifactWorkspaceViewModel {
  bookId: string
  exportProfileId: string
  checkpointId?: string
  sourceSignature: string
  gate: BookExportArtifactGateViewModel
  latestArtifact: BookExportArtifactSummaryViewModel | null
  artifacts: BookExportArtifactSummaryViewModel[]
}
```

## 8.2 新增 pure mapper

推荐新增：

```text
packages/renderer/src/features/book/lib/book-export-artifact-mappers.ts
packages/renderer/src/features/book/lib/book-export-artifact-mappers.test.ts
```

必须提供这些函数：

```ts
createBookExportArtifactSourceSignature(exportPreview)

buildBookExportArtifactGate({
  exportPreview,
  reviewInbox,
})

buildBookExportArtifactContent({
  exportPreview,
  reviewInbox,
  format,
})

buildBookExportArtifactInput({
  exportPreview,
  reviewInbox,
  format,
})

normalizeBookExportArtifactRecord(record, currentSourceSignature)

buildBookExportArtifactWorkspace({
  exportPreview,
  reviewInbox,
  artifactRecords,
})
```

## 8.3 Gate 规则第一版

### Export readiness blockers

如果：

```ts
exportPreview.readiness.blockerCount > 0
```

则 `gate.canBuild = false`。

这些 blockers 应转成 `BookExportArtifactGateReasonViewModel`。

### Review open blockers

从 `reviewInbox.issues` 中筛出：

```ts
issue.severity === 'blocker'
&& (issue.decision.status === 'open' || issue.decision.status === 'stale')
&& issue.source !== 'branch'
```

第一版明确排除 `branch`，因为当前 export artifact 是 current manuscript package，不是 branch package。

这些 issues 应进入 gate reasons。

### Source fix action 只做提示

统计：

- `fixAction.status === 'checked'`
- `fixAction.status === 'blocked'`
- `fixAction.status === 'stale'`

但不要让它们直接决定 `canBuild`。

### Attention / warning

如果没有 blockers，但存在：

- export readiness warnings
- review warning open issues
- checked / blocked fix actions

则 `gate.status = 'attention'`，但 `canBuild = true`。

### Ready

没有 blockers 和 attention reasons 时：

```ts
gate.status = 'ready'
gate.canBuild = true
```

## 8.4 Artifact content 规则

第一版只做 deterministic text。

### Markdown 格式

建议结构：

```md
# {book title}

{book summary}

## Export package

- Profile: {profile title}
- Readiness: {readiness label}
- Chapters: {included chapter count}
- Scenes: {included scene count}
- Words: {assembled word count}

## Manuscript

### Chapter 1: {chapter title}

{chapter summary if profile includes chapterSummaries}

#### Scene 1: {scene title}

{scene proseDraft or [Missing draft]}

## Trace appendix

...

## Compare summary

...

## Readiness checklist

...
```

### Plain text 格式

同样内容，但不用 Markdown 标题符号过多，保持可复制。

### Profile includes 的处理

尊重 `exportPreview.profile.includes`：

- `manuscriptBody`
- `chapterSummaries`
- `sceneHeadings`
- `traceAppendix`
- `compareSummary`
- `readinessChecklist`

如果 profile 不包含某项，不要写入 artifact content。

### Missing draft

如果 scene 缺稿但 profile / gate 允许 artifact build，正文中写：

```text
[Missing draft]
```

不要尝试自动补文。

---

## 九、Hook 设计

## 9.1 新增 artifact workspace query

推荐新增：

```text
packages/renderer/src/features/book/hooks/useBookExportArtifactWorkspaceQuery.ts
```

建议签名：

```ts
export function useBookExportArtifactWorkspaceQuery({
  bookId,
  exportPreview,
  reviewInbox,
  exportProfileId,
  checkpointId,
  enabled = true,
}: {
  bookId: string
  exportPreview: BookExportPreviewWorkspaceViewModel | null | undefined
  reviewInbox: BookReviewInboxViewModel | null | undefined
  exportProfileId?: string | null
  checkpointId?: string | null
  enabled?: boolean
})
```

职责：

1. 读取 artifact records。
2. 用 `exportPreview + reviewInbox + artifactRecords` 派生 artifact workspace。
3. 返回 loading / error。

注意：

- 不重新拉 current draft / compare / export profile。
- `exportPreview === undefined` 时返回 `workspace: undefined`。
- `exportPreview === null` 时返回 `workspace: null`。

## 9.2 新增 build mutation

推荐新增：

```text
packages/renderer/src/features/book/hooks/useBuildBookExportArtifactMutation.ts
```

职责：

- 接收 `BookExportPreviewWorkspaceViewModel`、`BookReviewInboxViewModel | null`、format。
- 在 mutate 前用 gate 再算一次 `canBuild`。
- 如果不能 build，抛出明确 Error。
- 调用 `bookClient.buildBookExportArtifact(...)`。
- 成功后 invalidate `bookQueryKeys.exportArtifacts(...)`。
- 可选：optimistic append，但第一版可以只做 settled invalidate。

### 为什么第一版可以不做 optimistic update

Artifact build 是一次明确 action，速度很快，且 content 较大。先避免在 mutation hook 中复制一份 artifact content 更稳。

---

## 十、UI 组件设计

## 10.1 新增组件

推荐新增：

```text
packages/renderer/src/features/book/components/BookExportArtifactPanel.tsx
packages/renderer/src/features/book/components/BookExportArtifactPanel.test.tsx
packages/renderer/src/features/book/components/BookExportArtifactPanel.stories.tsx

packages/renderer/src/features/book/components/BookExportArtifactGate.tsx
packages/renderer/src/features/book/components/BookExportArtifactGate.test.tsx
packages/renderer/src/features/book/components/BookExportArtifactGate.stories.tsx
```

### `BookExportArtifactGate.tsx`

职责：

- 显示 gate 状态：Ready / Attention / Blocked。
- 显示 gate reasons。
- 明确说明：source-fix checked 不是 resolved。

props：

```ts
interface BookExportArtifactGateProps {
  gate: BookExportArtifactGateViewModel
}
```

### `BookExportArtifactPanel.tsx`

职责：

- 显示最新 artifact。
- 显示 artifact 是否 stale。
- 提供 format selection：Markdown / Plain text。
- 提供 build action。
- 提供 copy / download action。
- 显示 artifact history 的最近几条。

props：

```ts
interface BookExportArtifactPanelProps {
  artifactWorkspace: BookExportArtifactWorkspaceViewModel | null
  selectedFormat: 'markdown' | 'plain_text'
  isBuilding?: boolean
  buildErrorMessage?: string | null
  onSelectFormat: (format: 'markdown' | 'plain_text') => void
  onBuildArtifact: () => void
  onCopyArtifact: (artifact: BookExportArtifactSummaryViewModel) => void
  onDownloadArtifact: (artifact: BookExportArtifactSummaryViewModel) => void
}
```

### Copy / download 行为

#### Copy

优先：

```ts
navigator.clipboard.writeText(artifact.content)
```

测试环境或不支持 clipboard 时，允许 fallback 到 no-op 并显示状态文案。

#### Download

浏览器端生成 Blob：

```ts
const blob = new Blob([artifact.content], { type: artifact.mimeType })
const url = URL.createObjectURL(blob)
```

然后创建临时 `<a download>`。

这是 UI 行为，不是 book client 行为。

## 10.2 修改 `BookDraftExportView.tsx`

新增 props：

```ts
artifactWorkspace?: BookExportArtifactWorkspaceViewModel | null
selectedArtifactFormat: BookExportArtifactFormat
isBuildingArtifact?: boolean
artifactBuildErrorMessage?: string | null
onSelectArtifactFormat: (format: BookExportArtifactFormat) => void
onBuildArtifact: () => void
onCopyArtifact: (artifact: BookExportArtifactSummaryViewModel) => void
onDownloadArtifact: (artifact: BookExportArtifactSummaryViewModel) => void
```

位置建议：

1. profile picker / readiness summary 下方显示 gate。
2. package summary 下方显示 artifact panel。
3. chapter package detail 保持原有职责。

### 不要做

不要把 `BookDraftExportView` 重写成 artifact 页面。它仍然是：

```text
Export Preview + Artifact Builder
```

而不是：

```text
Artifact Manager
```

## 10.3 修改 `BookDraftInspectorPane.tsx`

当 `activeDraftView === 'export'` 时，增加 `Artifact` 区块：

- latest artifact filename
- current / stale
- gate status
- open blocker count
- last build label

不要在 inspector 里放 build button。主 action 应留在 main stage。

## 10.4 修改 `BookDraftBottomDock.tsx`

Problems 区域增加：

- export artifact blocked by readiness
- export artifact blocked by review open blockers
- latest artifact stale

Activity 区域增加：

- built markdown package
- built plain text package
- copied artifact
- downloaded artifact

## 10.5 修改 `useBookWorkbenchActivity.ts`

新增 activity kinds 或复用已有 handoff/review/export activity：

```ts
type BookWorkbenchActivityKind =
  | ...
  | 'export-artifact'
```

新增 helper：

```ts
rememberBookWorkbenchExportArtifact({
  id,
  bookId,
  action: 'built' | 'copied' | 'downloaded'
  filename?: string
  format?: BookExportArtifactFormat
})
```

Activity 仍然是 session-local display，不成为 artifact source of truth。

---

## 十一、容器接线

## 11.1 修改 `BookDraftWorkspace.tsx`

要做的事：

1. 保持当前 `useBookDraftWorkspaceQuery(...)` 不变。
2. 保持当前 `useBookManuscriptCompareQuery(...)` 不变。
3. 保持当前 `useBookExportPreviewQuery(...)` 不变。
4. 新增 `useBookExportArtifactWorkspaceQuery(...)`。
5. 新增 `useBuildBookExportArtifactMutation(...)`。
6. 在 active `export` 或 `review` 时也允许 artifact workspace 派生，因为 review gate 也要看到 export readiness。
7. 把 artifact workspace 传给：
   - `BookDraftStage`
   - `BookDraftInspectorPane`
   - `BookDraftDockContainer`
8. 在 `BookDraftStage` 中继续传给 `BookDraftExportView`。
9. Build 成功后记录 activity。
10. Copy / Download 成功后记录 activity。

### artifact format state

本轮不新增 route 字段。可以在 `BookDraftWorkspace.tsx` 内部用局部 state：

```ts
const [selectedArtifactFormat, setSelectedArtifactFormat] = useState<BookExportArtifactFormat>('markdown')
```

这是允许的，因为：

- 它不拥有对象身份。
- 它不影响 route restore。
- 它只是当前 export action 的 UI preference。

### build handler

伪代码：

```ts
const onBuildArtifact = useCallback(() => {
  if (!exportWorkspace || !artifactWorkspace) return
  void buildArtifactMutation
    .mutateAsync({
      exportPreview: exportWorkspace,
      reviewInbox: reviewInbox ?? null,
      format: selectedArtifactFormat,
    })
    .then((artifact) => {
      rememberBookWorkbenchExportArtifact(...)
    })
}, [...])
```

### 不要做

不要把 artifact content 或 artifact record 存进 React local state 作为真源。

Artifact 真源是：

```text
mock-book-export-artifact-db + query cache
```

---

## 十二、建议的文件改动

### 12.1 新增

```text
packages/renderer/src/features/book/api/book-export-artifact-records.ts
packages/renderer/src/features/book/api/mock-book-export-artifact-db.ts

packages/renderer/src/features/book/types/book-export-artifact-view-models.ts

packages/renderer/src/features/book/lib/book-export-artifact-mappers.ts
packages/renderer/src/features/book/lib/book-export-artifact-mappers.test.ts

packages/renderer/src/features/book/hooks/useBookExportArtifactWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookExportArtifactWorkspaceQuery.test.tsx
packages/renderer/src/features/book/hooks/useBuildBookExportArtifactMutation.ts
packages/renderer/src/features/book/hooks/useBuildBookExportArtifactMutation.test.tsx

packages/renderer/src/features/book/components/BookExportArtifactGate.tsx
packages/renderer/src/features/book/components/BookExportArtifactGate.test.tsx
packages/renderer/src/features/book/components/BookExportArtifactGate.stories.tsx
packages/renderer/src/features/book/components/BookExportArtifactPanel.tsx
packages/renderer/src/features/book/components/BookExportArtifactPanel.test.tsx
packages/renderer/src/features/book/components/BookExportArtifactPanel.stories.tsx
```

### 12.2 修改

```text
packages/renderer/src/features/book/api/book-client.ts
packages/renderer/src/features/book/hooks/book-query-keys.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/containers/BookDraftDockContainer.tsx
packages/renderer/src/features/book/components/BookDraftStage.tsx
packages/renderer/src/features/book/components/BookDraftExportView.tsx
packages/renderer/src/features/book/components/BookDraftInspectorPane.tsx
packages/renderer/src/features/book/components/BookDraftBottomDock.tsx
packages/renderer/src/features/book/hooks/useBookWorkbenchActivity.ts
packages/renderer/src/app/i18n/**
```

### 12.3 这一轮尽量不动

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/chapter/**
packages/renderer/src/features/scene/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/traceability/**
packages/renderer/src/features/review/** 的 decision / source-fix mutation 逻辑
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/lib/book-export-preview-mappers.ts
```

如果必须碰 `useBookExportPreviewQuery.ts`，只做类型适配，不改变 query identity。

---

## 十三、测试补齐方案

### 13.1 artifact mapper 测试

`book-export-artifact-mappers.test.ts` 至少覆盖：

1. `createBookExportArtifactSourceSignature(...)` 对相同 preview 输出稳定 signature。
2. scene prose / readiness issues 改变时 signature 改变。
3. export readiness blocker 会让 `gate.canBuild=false`。
4. review open blocker 会让 `gate.canBuild=false`。
5. reviewed / dismissed blocker 不再阻塞 gate。
6. `fixAction.checked` 不会自动解除 blocker。
7. `fixAction.blocked` 会显示 warning / detail，但真正阻塞仍来自 open blocker。
8. markdown artifact content 包含 book title、profile、chapter、scene prose。
9. profile 不包含 trace appendix 时，artifact content 不包含 trace appendix。
10. missing draft scene 输出 `[Missing draft]`。
11. stale artifact 判断正确。

### 13.2 mock DB / client 测试

新增或扩展 `book-client.test.ts`：

1. `buildBookExportArtifact(...)` 能写入 mock DB。
2. `getBookExportArtifacts(...)` 能按 book/profile/checkpoint 过滤。
3. 最新 artifact 排在前面。
4. `resetMockBookExportArtifactDb()` 会清空 artifacts 并重置 sequence。
5. client 返回 clone，不能泄露 DB 引用。

### 13.3 hook 测试

#### `useBookExportArtifactWorkspaceQuery.test.tsx`

至少覆盖：

1. `exportPreview === undefined` 时 workspace 为 undefined。
2. `exportPreview === null` 时 workspace 为 null。
3. 能把 artifact records + current sourceSignature 派生成 latest artifact。
4. sourceSignature 不匹配时 latest artifact `isStale=true`。
5. gate 使用 review inbox open blockers。

#### `useBuildBookExportArtifactMutation.test.tsx`

至少覆盖：

1. gate ready 时能 build artifact。
2. gate blocked 时 mutation 抛出错误，不写 DB。
3. build 后 invalidate `bookQueryKeys.exportArtifacts(...)`。
4. artifact content 与 format 正确。

### 13.4 component 测试

#### `BookExportArtifactGate.test.tsx`

覆盖：

- ready / attention / blocked 三种状态。
- gate reasons 渲染。
- source-fix checked 不等于 resolved 的说明文案。

#### `BookExportArtifactPanel.test.tsx`

覆盖：

- gate blocked 时 build button disabled。
- format switcher 可切换 Markdown / Plain text。
- latest artifact metadata 渲染。
- stale artifact badge 渲染。
- copy / download callback 可触发。
- no artifact empty state。

#### `BookDraftExportView.test.tsx`

覆盖：

- export preview 原有 readiness / package detail 仍渲染。
- artifact gate / artifact panel 出现。
- build action 透传。
- Open in Draft / Open in Structure 仍可用。

### 13.5 workspace 集成测试

扩展 `BookDraftWorkspace.test.tsx`，建议新增完整路径：

```text
打开 /workbench?scope=book&id=book-signal-arc&lens=draft&draftView=export&exportProfileId=export-profile-editorial-review&selectedChapterId=chapter-open-water-signals
-> export preview 渲染 readiness / package summary
-> artifact gate 显示 blocked，因为存在 open blocker
-> 切到 review，dismiss 或 reviewed 对应 blocker
-> 返回 export
-> gate 允许 build
-> 点击 Build Markdown package
-> latest artifact 出现，filename / word count / readiness snapshot 正确
-> 点击 Copy package text
-> dock activity 出现 copied artifact
-> 点击 Download .md
-> dock activity 出现 downloaded artifact
-> 切到 compare 或切换 checkpoint 后返回 export
-> old artifact 显示 stale
```

如果直接在 UI 中 triage review blocker 让测试过重，可以拆成两条：

1. 使用预置 review decisions 让 gate ready。
2. 使用默认 open blocker 让 gate blocked。

### 13.6 app smoke

推荐新增：

```text
scene orchestrate snapshot
-> 切到 book draft export
-> build artifact
-> 切回 scene
-> scene lens / tab / proposal snapshot 不丢
```

这条 smoke 用来证明：

- PR18 没有改 route。
- artifact mutation 不影响 four-scope dormant snapshot。
- export artifact 只是 Book Draft export surface 内的动作。

---

## 十四、Storybook 建议

新增：

```text
BookExportArtifactGate.stories.tsx
BookExportArtifactPanel.stories.tsx
```

更新：

```text
BookDraftExportView.stories.tsx
BookDraftInspectorPane.stories.tsx
BookDraftBottomDock.stories.tsx
BookDraftWorkspace.stories.tsx
```

最少 story 组合：

- `GateReady`
- `GateBlockedByReadiness`
- `GateBlockedByReview`
- `LatestMarkdownArtifact`
- `LatestArtifactStale`
- `NoArtifactsYet`
- `ExportViewWithArtifactReady`
- `ExportViewWithBlockedGate`

Story 数据优先从现有 export preview fixtures / storybook helpers 派生，不要为了 story 重写 query 层。

---

## 十五、实施顺序（给 AI 的执行顺序）

### Step 1
先新增 artifact records 与 mock DB：

- `book-export-artifact-records.ts`
- `mock-book-export-artifact-db.ts`
- reset helper
- deterministic id / sequence

### Step 2
扩展 `book-client.ts` 与 `book-query-keys.ts`：

- `getBookExportArtifacts(...)`
- `buildBookExportArtifact(...)`
- artifact query key

### Step 3
先写 pure mapper：

- source signature
- gate
- markdown / plain text content
- artifact input builder
- artifact view-model normalizer
- mapper tests

### Step 4
新增 hooks：

- `useBookExportArtifactWorkspaceQuery.ts`
- `useBuildBookExportArtifactMutation.ts`
- hook tests

### Step 5
新增 artifact UI 组件：

- `BookExportArtifactGate.tsx`
- `BookExportArtifactPanel.tsx`
- component tests / stories

### Step 6
接入 `BookDraftExportView.tsx`：

- 显示 gate
- 显示 artifact panel
- 保持原 preview / readiness / chapter detail 不变

### Step 7
接入 `BookDraftWorkspace.tsx`：

- 调用 artifact workspace query
- 调用 build mutation
- 提供 copy / download handlers
- 记录 artifact activity

### Step 8
增强 inspector / dock：

- inspector export artifact summary
- dock export artifact problems / activity

### Step 9
补集成测试与 app smoke：

- gate blocked / ready
- build artifact
- stale artifact
- copy/download callbacks
- four-scope snapshot 不变

---

## 十六、完成后的验收标准

满足以下条件，PR18 就算完成：

1. Book Draft Export 仍使用现有 `draftView='export'`，没有新增 scope / lens / draftView。
2. 没有新增 artifact route 字段。
3. book feature 有 read/write mock export artifact DB，且具备 reset helper。
4. book client 支持读取 artifacts 与 build artifact。
5. export artifact content 由现有 export preview 派生，不重新拉一套 manuscript source waterfall。
6. export artifact 支持 `markdown` 与 `plain_text` 两种格式。
7. packaging gate 同时检查 export readiness blockers 与 relevant review open blockers。
8. source-fix checked 不会自动解除 packaging gate。
9. UI 可以 build artifact、展示 latest artifact、标记 stale、copy content、download file。
10. inspector / dock 能显示 artifact summary、gate problems、artifact activity。
11. Book Draft read / compare / export / branch / review 原有子视图不被破坏。
12. Review decision / source-fix action 现有测试不被破坏。
13. scene / chapter / asset / book dormant snapshot 不被破坏。
14. PR18 不包含 PDF / EPUB / DOCX / publish API / branch merge / manuscript edit / AI rewrite。

---

## 十七、PR18 结束时不要留下的债

以下情况都算 PR 做偏了：

- 新增了 `publish` scope / lens / draftView。
- 把 `view` 或 `draftView` 改成 artifact route 真源。
- 新增 `artifactId` route 字段。
- Artifact builder 重新实现了一套 chapter / scene / traceability source waterfall。
- Artifact build 忽略 review open blockers。
- `fixAction.checked` 被当作 issue resolved。
- Artifact 没有 sourceSignature，无法判断 stale。
- Mock artifact DB 没有 reset helper。
- UI 只有 build 按钮，没有 artifact content / filename / copy / download。
- 顺手做了 PDF / EPUB / DOCX / publish / upload。
- 顺手做了 branch selective apply / merge。
- 把 Export view 改成低层 artifact manager，破坏了 export preview 的主职责。

PR18 做完后的正确状态应该是：

**Book Draft Export 仍是 preview-first 的工作面，但已经能在 review gate 通过后生成第一版本地 manuscript artifact，并能清楚展示 artifact 是否仍匹配当前 export source。**

---

## 十八、PR19 以后建议路线（只保留，不在本轮实施）

### PR19：Branch Merge Readiness / Selective Apply Foundation

在 review decisions、source-fix actions、export artifacts 都成立后，再做 branch 的最小 selective apply：

- branch delta selection
- apply selected scene sections into current manuscript mock layer
- branch readiness gate
- 不做 Git-like conflict resolver
- 不做多人协作 merge

### PR20：Review Pass History / Audit Trail

当 review decisions、source-fix actions 和 export artifacts 都有 record 后，再做 review pass history：

- review pass snapshot
- decision / fix-action / artifact summary
- open blocker delta
- stale issue delta
- 不做 assignment / comment thread

### PR21：Publish / Export Delivery Preview

在 artifact foundation 成立后，再做 publish/readiness delivery surface：

- package preview manifest
- delivery checklist
- export profile lock
- 仍先不生成 PDF / EPUB / DOCX

---

## 十九、给 AI 的最终一句话指令

在当前 `codex/pr17-review-source-fix-actions` 已经完成 PR17 的前提下，不要继续抛光 review source-fix action，也不要提前做 PDF / EPUB / DOCX / publish / branch merge；先只围绕 **Export Package Artifact Foundation** 做一轮窄而实的实现：

- 继续使用现有 `Book / Draft / Export` surface，不新增 scope / lens / route 字段
- 给 book feature 新增 export artifact records、mock DB、reset helper 与 client read/build 方法
- 用现有 `BookExportPreviewWorkspaceViewModel` + `BookReviewInboxViewModel` 派生 packaging gate 和 artifact content
- artifact 只支持 `markdown` 与 `plain_text`
- build action 必须被 export readiness blockers 和 relevant review open blockers gate 住
- source-fix checked / blocked 只作为提示，不自动解除 review blocker
- 生成 artifact 后能展示 metadata、sourceSignature stale 状态、copy 与 download 操作
- inspector / dock 只做 artifact summary 与 activity，不成为第二真源
- 用测试固定 mapper、gate、mock DB reset、build mutation、workspace roundtrip、four-scope snapshot 不变
- 明确不做真实发布、复杂文件格式、branch merge、manuscript edit、AI rewrite
