# PR12 执行文档（基于 `codex/pr11-book-draft-lens` 当前实际代码）

## 这份文档的目的

这不是路线图回顾，也不是大而全 wishlist。

这是一份**基于 `codex/pr11-book-draft-lens` 分支当前真实代码状态**整理出来的、可以直接交给 AI agent 实施的 PR12 指令文档。

PR12 的任务，不是继续抛光 PR11 已经完成的 `Book / Draft` read-first manuscript，也不是直接进入 publish/export/branch，而是围绕一个更稳、更符合当前产品节奏的目标推进：

**给 Book Draft 增加第一版 manuscript compare / review foundation，让用户能把当前组装稿和一个显式 checkpoint 做章节级、场景级对照。**

一句话判断：

**PR11 已经让 Book 能读全书稿；PR12 应该让 Book 能审全书稿。**

---

## 一、先确认当前代码基线

下面这些判断必须建立在当前 PR11 代码事实上，而不是沿用 PR10 之前的假设。

### 1. 对象轴已经接齐，Book 也已经是 multi-lens object

当前 `WorkbenchScope` 已包含 `scene | chapter | asset | book`，并且 `BookLens` 已经是：

```ts
export type BookLens = 'structure' | 'draft'
```

这意味着 Book 已经不再只是一个结构总览页，而是和 Chapter 一样开始兑现 `structure / draft` 的双 lens 对象身份。

### 2. `BookWorkbench` 已经是 scope-level lens dispatch container

当前 `BookWorkbench.tsx` 已经根据 `route.lens` 分发：

```tsx
return route.lens === 'draft' ? <BookDraftWorkspace /> : <BookStructureWorkspace />
```

所以 PR12 不需要再做 Book scope ownership 的基础接入。PR12 应该在 `BookDraftWorkspace` 内继续深化，而不是回头重写 Book 接入。

### 3. Book Draft 已经占满五面 workbench

当前 `BookDraftWorkspace.tsx` 已经接入：

- `BookModeRail`
- `BookDraftBinderPane`
- `BookDraftReader`
- `BookDraftInspectorPane`
- `BookDraftDockContainer`

并通过 `WorkbenchShell` 组装成完整工作面。

### 4. Book Draft query 已经采用共享 source hook + draft mapper

当前 `useBookDraftWorkspaceQuery(...)` 已经通过 `useBookWorkspaceSources(...)` 获取共享源数据，再交给 `buildBookDraftWorkspaceViewModel(...)` 派生 Book Draft view-model。

这说明 PR11 已经完成了非常关键的拆分：

- source acquisition：`useBookWorkspaceSources(...)`
- structure mapping：`buildBookStructureWorkspaceViewModel(...)`
- draft mapping：`buildBookDraftWorkspaceViewModel(...)`

PR12 不应该复制一套新的巨型 Book data hook，而应该继续复用这个 source 层。

### 5. Book Draft view-model 已经保留了 compare 必需的 section 粒度

当前 `BookDraftSceneSectionViewModel` 保留了：

- `sceneId`
- `order`
- `title`
- `summary`
- `proseDraft?`
- `draftWordCount?`
- `isMissingDraft`
- `warningsCount`
- `revisionQueueCount?`
- `traceReady`
- `relatedAssetCount`
- `sourceProposalCount`
- `latestDiffSummary?`

当前 `BookDraftChapterViewModel` 也保留了 `sections` 和 `assembledProseSections`，没有把整章 prose 压成不可逆的大字符串。

这正好为 PR12 做章节级 / scene section 级 compare 提供了基础。

### 6. PR11 已经有 Book Draft 的 roundtrip 测试

当前 `BookDraftWorkspace.test.tsx` 已覆盖：

```text
打开 book draft deep link
-> binder / reader / inspector / dock 围绕 selectedChapterId 同步
-> 点击另一个 chapter
-> URL selectedChapterId 更新
-> Open in Chapter Draft
-> browser back
-> 回到 Book Draft + 原 selectedChapterId
```

PR12 的测试应建立在这条路径之上，而不是替换它。

---

## 二、PR12 的唯一目标

**在 Book Draft 内新增第一版 manuscript compare / review foundation。**

PR12 完成后，用户应该能：

1. 在 `scope='book' & lens='draft'` 下切换 `Read / Compare` 两种 draft view。
2. 选择一个显式 manuscript checkpoint 作为 compare baseline。
3. 看到当前 manuscript 与 checkpoint 的差异摘要：
   - 每章 word delta
   - scene section changed / added / missing
   - missing draft / missing trace / warnings 的变化提示
4. 用 `route.selectedChapterId` 继续驱动 binder / compare view / inspector / dock 的统一聚焦。
5. 从 Compare 中继续打开 `Chapter / Draft` 或 `Chapter / Structure`。
6. browser back 返回 Book Draft Compare 时恢复：
   - `scope='book'`
   - `lens='draft'`
   - `draftView='compare'`
   - `checkpointId`
   - `selectedChapterId`
7. 从 Compare 切回 Read，再切回 Structure 时，PR11 已经成立的 dormant structure `view` 仍然保留。

一句话说：

**PR12 要把 Book Draft 从“连续阅读稿”推进到“可审阅稿件工作面”，但仍不进入 export / publish / branch。**

---

## 三、为什么现在做 Compare，而不是 Publish / Export / Branch

### 1. Publish 需要先有 reviewable manuscript

当前 Book Draft 已经能 read-first 组装全书稿，但还不能回答：

- 当前稿相对上一个 checkpoint 改了什么？
- 哪些 chapter / scene 的 prose 还缺稿？
- 哪些 trace / warnings 会影响发布准备？

如果没有 Compare / Review foundation，直接做 Export / Publish 会过早。

### 2. Branch 需要先有 checkpoint/compare 心智

Branch / alternative manuscript 需要比较分支差异；PR12 做 checkpoint compare，等于先把最小的“版本对照心智”做出来。

### 3. PR11 已经保留了 section 粒度

当前 Book Draft 没有把 manuscript 压扁成单一字符串，而是保留 chapter 与 scene section。这使得 PR12 可以做轻量 compare，而不用重构 PR11 的主体。

---

## 四、本轮明确不做

为避免 PR12 失控，以下内容不要混进来：

- 不做真实 publish
- 不做 export 文件生成
- 不做 PDF / EPUB / DOCX 导出
- 不做 branch / merge / alternative manuscript
- 不做 manuscript inline edit
- 不做 book mutation
- 不做 chapter reorder from book
- 不做 scene chunk 级 anchor / selection route
- 不做完整 diff algorithm 或 diff library 引入
- 不做 AI rewrite / AI compare summary generation
- 不做 asset editor / graph
- 不做全局 rail 重构
- 不新增 runtime bridge capability

PR12 的定位必须明确为：

**Book Draft Compare / Review Foundation，read-heavy，不写稿、不导出、不分支。**

---

## 五、必须遵守的硬约束

### 5.1 `route.selectedChapterId` 仍然是 Book 内聚焦真源

不要新增：

- `selectedCompareChapterId` store
- compare view 内部 active chapter 真源
- inspector / dock 各自维护不同的 selected chapter

统一规则：

- 当前聚焦 chapter 来源于 `route.selectedChapterId`
- `workspace.selectedChapterId` / compare workspace selected chapter 只是派生结果
- 点击 binder chapter：`patchBookRoute({ selectedChapterId })`
- 点击 compare chapter row/card：`patchBookRoute({ selectedChapterId })`

### 5.2 `view` 继续只服务 Book Structure

当前 Book route 里 `view='sequence' | 'outliner' | 'signals'` 是 Structure view。PR12 不要把 `view` 改成 `read / compare`。

正确做法是新增一个明确的 draft 子状态：

```ts
export type BookDraftView = 'read' | 'compare'
```

并在 `BookRouteState` 上增加可选字段：

```ts
draftView?: BookDraftView
checkpointId?: string
```

这样：

- `view` 继续保留 dormant structure view
- `draftView` 只服务 Book Draft
- `checkpointId` 只在 compare 时有意义

### 5.3 Book client 仍然保持薄，不新增 giant manuscript server client

不要新增：

- `getBookCompareWorkspace()`
- `getBookManuscript()`
- `getBookPublishPreview()`

正确方式：

- `bookClient` 仍只承载 book identity 与 checkpoint seed 读取
- 当前 manuscript 从 `useBookDraftWorkspaceQuery(...)` 派生
- checkpoint manuscript 从 read-only mock checkpoint db 读取
- compare view-model 在纯 mapper 中生成

### 5.4 Compare 只做显式 checkpoint，不做自动历史

PR12 不要试图根据 Git history / local cache / previous query 自动生成 baseline。

本轮只做显式 mock checkpoint：

- checkpoint id 稳定
- checkpoint label 稳定
- checkpoint content 显式写入 mock seed

这样测试、story、deep link 都可控。

### 5.5 不做 scene-level route anchor

PR12 不往 book route 里新增：

- `sceneId`
- `chunkId`
- `selectedSectionId`
- `diffHunkId`

第一版 Compare 的聚焦单位仍然是 chapter。scene section 只是 compare view 内展示的子项。

### 5.6 Compare 不能破坏 Book -> Chapter handoff

当前 Book 已有：

- `Open in Structure`
- `Open in Draft`

PR12 必须保留这两个次级动作。Compare 的主点击仍应是 book 内部聚焦 chapter，不应变成 handoff。

---

## 六、路由与状态改法

## 6.1 `workbench-route.ts`

新增：

```ts
export type BookDraftView = 'read' | 'compare'
```

修改 `BookRouteState`：

```ts
export interface BookRouteState {
  scope: 'book'
  bookId: string
  lens: BookLens
  view: BookStructureView
  selectedChapterId?: string
  draftView?: BookDraftView
  checkpointId?: string
}
```

### URL 示例

```text
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=compare&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-open-water-signals
```

注意：`view=signals` 在这里仍然只是 dormant structure view。

## 6.2 `useWorkbenchRouteState.ts`

要做的事：

1. 增加 `VALID_BOOK_DRAFT_VIEWS`
2. 增加 `DEFAULT_BOOK_CHECKPOINT_ID` 或让 checkpoint fallback 在 compare hook 内处理
3. `normalizeBookRoute(...)` 允许并规范化：
   - `draftView`
   - `checkpointId`
4. `readBookSnapshot(...)` 读取：
   - `draftView`
   - `checkpointId`
5. `buildWorkbenchSearch(...)` 在 book scope 下写入：
   - `draftView`（只在非默认或 lens=draft 时写入均可，推荐写入真实状态）
   - `checkpointId`（存在时写入）
6. `patchBookRoute(...)` 保持一个 API，不新增 compare 专用 patch hook
7. dormant snapshot 恢复继续覆盖四个 scope

### 默认规则建议

- `lens='structure'` 时，`draftView` / `checkpointId` 可以保留在 URL snapshot 中，但 UI 不使用。
- `lens='draft'` 且 `draftView` 缺失时，fallback 到 `'read'`。
- `draftView='compare'` 且 `checkpointId` 缺失时，fallback 到默认 checkpoint。

---

## 七、数据层设计

## 7.1 新增 read-only manuscript checkpoint records

新增文件：

```text
packages/renderer/src/features/book/api/book-manuscript-checkpoints.ts
```

推荐类型：

```ts
export interface BookManuscriptCheckpointRecord {
  id: string
  bookId: string
  label: LocalizedText
  summary: LocalizedText
  createdAtLabel: LocalizedText
  chapterSnapshots: BookManuscriptCheckpointChapterRecord[]
}

export interface BookManuscriptCheckpointChapterRecord {
  chapterId: string
  title: LocalizedText
  summary: LocalizedText
  sceneSnapshots: BookManuscriptCheckpointSceneRecord[]
}

export interface BookManuscriptCheckpointSceneRecord {
  sceneId: string
  title: LocalizedText
  proseDraft?: LocalizedText
  draftWordCount?: number
  traceReady?: boolean
  warningsCount?: number
}
```

### Seed 建议

第一版只做一个默认 checkpoint：

```text
checkpoint-book-signal-arc-pr11-baseline
```

内容不要太多，覆盖当前 book 的两章即可：

- `chapter-signals-in-rain`
- `chapter-open-water-signals`

每章至少覆盖 2–3 个 scene snapshot，并刻意制造：

- 一个 changed scene
- 一个 added current scene
- 一个 missing current draft
- 一个 traceReady 变化

这样 compare UI 和测试都有明确样例。

## 7.2 `book-client.ts` 只增加 checkpoint 读取能力

不要新增 giant compare client，只在现有薄 client 上加：

```ts
getBookManuscriptCheckpoints(input: { bookId: string }): Promise<BookManuscriptCheckpointRecord[]>
getBookManuscriptCheckpoint(input: { bookId: string; checkpointId: string }): Promise<BookManuscriptCheckpointRecord | null>
```

### 为什么可接受

这不是新增 runtime capability，而是 read-only mock metadata。它服务于 compare foundation，不替代 current manuscript query。

## 7.3 query keys

修改或新增：

```text
packages/renderer/src/features/book/hooks/book-query-keys.ts
```

建议新增：

```ts
checkpoints: (bookId: string, locale: Locale) => ['book', 'checkpoints', bookId, locale]
checkpoint: (bookId: string, checkpointId: string, locale: Locale) => ['book', 'checkpoint', bookId, checkpointId, locale]
```

注意：不要改现有 structure / source query identity。

## 7.4 新增 compare query hook

新增：

```text
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
```

职责：

1. 读取当前 `BookDraftWorkspaceViewModel` 或接收它作为参数。
2. 读取 checkpoint list / selected checkpoint。
3. 用 pure mapper 派生 compare workspace。
4. 返回：
   - `compareWorkspace`
   - `checkpoints`
   - `selectedCheckpoint`
   - loading / error 状态

推荐签名：

```ts
export function useBookManuscriptCompareQuery({
  bookId,
  currentDraftWorkspace,
  checkpointId,
}: {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel | null | undefined
  checkpointId?: string | null
})
```

不要让这个 hook 再去重复获取 chapter / scene prose / traceability。

---

## 八、Compare view-model 设计

新增：

```text
packages/renderer/src/features/book/types/book-compare-view-models.ts
```

## 8.1 `BookCompareSceneDeltaViewModel`

```ts
export type BookCompareDeltaKind = 'unchanged' | 'changed' | 'added' | 'missing' | 'draft_missing'

export interface BookCompareSceneDeltaViewModel {
  sceneId: string
  order: number
  title: string
  kind: BookCompareDeltaKind
  currentExcerpt?: string
  checkpointExcerpt?: string
  currentWordCount?: number
  checkpointWordCount?: number
  wordDelta: number
  traceReadyChanged: boolean
  warningsDelta: number
}
```

## 8.2 `BookCompareChapterDeltaViewModel`

```ts
export interface BookCompareChapterDeltaViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  sceneDeltas: BookCompareSceneDeltaViewModel[]
  changedSceneCount: number
  addedSceneCount: number
  missingSceneCount: number
  draftMissingSceneCount: number
  wordDelta: number
  traceRegressionCount: number
  warningsDelta: number
  status: 'stable' | 'changed' | 'attention'
}
```

## 8.3 `BookCompareWorkspaceViewModel`

```ts
export interface BookCompareWorkspaceViewModel {
  bookId: string
  title: string
  selectedChapterId: string | null
  selectedChapter: BookCompareChapterDeltaViewModel | null
  checkpoint: {
    id: string
    label: string
    summary: string
    createdAtLabel: string
  } | null
  chapters: BookCompareChapterDeltaViewModel[]
  totals: {
    changedChapterCount: number
    changedSceneCount: number
    addedSceneCount: number
    missingSceneCount: number
    draftMissingSceneCount: number
    wordDelta: number
    traceRegressionCount: number
    warningsDelta: number
  }
}
```

---

## 九、Pure mapper 设计

新增：

```text
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts
```

### 必须提供的函数

```ts
buildCurrentManuscriptSnapshotFromBookDraft(workspace)
normalizeBookManuscriptCheckpoint(record, locale)
compareBookManuscriptSnapshots({ current, checkpoint, selectedChapterId })
buildSceneDelta({ currentScene, checkpointScene })
```

### 差异规则第一版

不要引入 diff library，只做轻量规则：

- `missing`：checkpoint 中存在，current 中不存在。
- `added`：current 中存在，checkpoint 中不存在。
- `draft_missing`：current scene 存在但 `proseDraft` 缺失。
- `changed`：两边都有 prose，但 `trim()` 后字符串不同，或 word count / traceReady / warnings 有变化。
- `unchanged`：两边 prose 与主要 signals 都一致。

### excerpt 规则

```ts
function excerpt(text?: string) {
  return text?.trim().slice(0, 180)
}
```

第一版不要做复杂 diff highlighting。

---

## 十、组件与容器改法

## 10.1 新增 `BookDraftStage.tsx`

当前 `BookDraftWorkspace.tsx` 直接把 `BookDraftReader` 放进 `mainStage`。

PR12 应新增 stage switchboard：

```text
packages/renderer/src/features/book/components/BookDraftStage.tsx
```

职责：

- 渲染 `Read / Compare` view switcher
- `draftView='read'` 时渲染 `BookDraftReader`
- `draftView='compare'` 时渲染 `BookDraftCompareView`
- view 变化通过 `patchBookRoute({ draftView })`
- 自己不持有第二真源

## 10.2 新增 `BookDraftCompareView.tsx`

```text
packages/renderer/src/features/book/components/BookDraftCompareView.tsx
```

职责：

- 主舞台中展示 chapter-level compare 列表
- 每章展开 scene delta summary
- 当前 selected chapter 高亮
- 点击 chapter row/card：`onSelectChapter(chapterId)`
- 保留次级动作：
  - `Open in Draft`
  - `Open in Structure`

### 每个 chapter compare row 至少显示

- chapter order
- title
- changed / added / missing scene counts
- word delta
- trace regression count
- warnings delta
- status badge

### 每个 selected chapter 的 scene delta 至少显示

- scene order
- scene title
- delta kind
- current excerpt
- checkpoint excerpt
- word delta

### 不做

- 不做 inline edit
- 不做 accept/reject
- 不做 chunk diff 高亮

## 10.3 新增 `BookDraftCheckpointPicker.tsx`

```text
packages/renderer/src/features/book/components/BookDraftCheckpointPicker.tsx
```

职责：

- 展示 checkpoint label / createdAtLabel / summary
- 选择 checkpoint 时调用 `patchBookRoute({ checkpointId })`
- 第一版只有一个 checkpoint 也要保留组件形态，为 PR13 / PR14 扩展准备

## 10.4 修改 `BookDraftInspectorPane.tsx`

第一版不要新增第三个 inspector 组件。建议让现有 inspector 在 compare 模式下多显示一个 `Compare` 区域。

新增 props：

```ts
compare?: BookCompareWorkspaceViewModel | null
activeDraftView?: BookDraftView
```

当 `activeDraftView === 'compare'` 时，显示：

### A. Selected chapter compare

- changed scenes
- added / missing scenes
- word delta
- trace regressions
- warnings delta

### B. Checkpoint

- checkpoint label
- createdAtLabel
- summary

### C. Review attention

- top changed scene titles
- missing draft scene titles
- trace regression hints

Read 模式原有 inspector 不要被破坏。

## 10.5 修改 `BookDraftBottomDock.tsx`

当前 dock 已有 Problems / Activity。

PR12 增加 compare-aware Problems：

- changed chapters
- draft missing scenes
- trace regressions
- warnings increased chapters
- checkpoint missing sections

Activity 增加：

- entered compare
- selected checkpoint
- returned to read

## 10.6 修改 `BookDraftWorkspace.tsx`

要做的事：

1. 继续调用 `useBookDraftWorkspaceQuery(...)` 获取 current draft workspace。
2. 新增 `useBookManuscriptCompareQuery(...)`。
3. 计算：
   - `activeDraftView = route.draftView ?? 'read'`
   - `checkpointId = route.checkpointId ?? defaultCheckpointId`
4. 把 `BookDraftStage` 放入 `mainStage`。
5. 把 compare data 传给 inspector / dock。
6. 保持现有 `openChapterFromBook(...)` 不变。
7. 保持 `route.selectedChapterId` fallback 逻辑不变。

---

## 十一、建议的文件改动

### 11.1 新增

```text
packages/renderer/src/features/book/api/book-manuscript-checkpoints.ts
packages/renderer/src/features/book/components/BookDraftStage.tsx
packages/renderer/src/features/book/components/BookDraftStage.test.tsx
packages/renderer/src/features/book/components/BookDraftCompareView.tsx
packages/renderer/src/features/book/components/BookDraftCompareView.test.tsx
packages/renderer/src/features/book/components/BookDraftCheckpointPicker.tsx
packages/renderer/src/features/book/components/BookDraftCheckpointPicker.test.tsx
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.test.tsx
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.ts
packages/renderer/src/features/book/lib/book-manuscript-compare-mappers.test.ts
packages/renderer/src/features/book/types/book-compare-view-models.ts
```

### 11.2 修改

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/book/api/book-client.ts
packages/renderer/src/features/book/hooks/book-query-keys.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/containers/BookDraftDockContainer.tsx
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
packages/renderer/src/features/book/components/BookDraftReader.tsx
packages/renderer/src/features/book/components/BookDraftBinderPane.tsx
```

如果必须碰 `useBookDraftWorkspaceQuery.ts`，只做类型适配，不重写 source acquisition。

---

## 十二、测试补齐方案

### 12.1 route 测试

至少覆盖：

1. book route 能读写 `draftView='compare'`
2. book route 能读写 `checkpointId`
3. `lens='draft'` 下保留 structure `view`
4. `lens='structure'` 下 dormant `draftView / checkpointId` 不破坏 structure view
5. 四 scope dormant snapshot 继续成立

### 12.2 mapper 测试

`book-manuscript-compare-mappers.test.ts` 至少覆盖：

1. current-only scene -> `added`
2. checkpoint-only scene -> `missing`
3. current scene without prose -> `draft_missing`
4. prose text changed -> `changed`
5. prose same but traceReady changed -> `changed` 且 `traceReadyChanged=true`
6. word delta 计算正确
7. selectedChapterId 缺失时 fallback 到第一章
8. totals 聚合正确

### 12.3 query 测试

`useBookManuscriptCompareQuery.test.tsx` 至少覆盖：

1. 能读取 checkpoint list
2. checkpointId 缺失时使用默认 checkpoint
3. checkpoint 不存在时返回 compare empty / error state
4. current draft workspace 还在 loading 时不生成错误 compare
5. compare workspace selected chapter 与 route.selectedChapterId 同步

### 12.4 component 测试

#### `BookDraftStage.test.tsx`

- read view 渲染 `BookDraftReader`
- compare view 渲染 `BookDraftCompareView`
- 切换 view 触发 `onSelectDraftView`

#### `BookDraftCompareView.test.tsx`

- 渲染 changed / added / missing counts
- selected chapter 高亮
- 点击 chapter 触发 `onSelectChapter`
- `Open in Draft` / `Open in Structure` 可触发
- scene delta excerpts 正确显示

#### `BookDraftCheckpointPicker.test.tsx`

- 展示 checkpoint label / summary
- 选择 checkpoint 触发 `onSelectCheckpoint`

#### `BookDraftInspectorPane.test.tsx`

- compare 模式显示 selected chapter compare summary
- read 模式不显示 compare-only 区块

#### `BookDraftBottomDock.test.tsx`

- compare 模式显示 changed chapters / trace regressions
- activity 可显示 entered compare / selected checkpoint

### 12.5 workspace 集成测试

新增或扩展 `BookDraftWorkspace.test.tsx`：

```text
打开 /workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=compare&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-open-water-signals
-> binder / compare view / inspector / dock 同步聚焦 Open Water Signals
-> compare view 显示 checkpoint label 与 changed scene counts
-> 点击 Chapter 1
-> URL selectedChapterId 更新
-> compare / inspector / dock 同步刷新
-> 点击 Open in Draft
-> 进入 Chapter / Draft
-> browser back
-> 回到 Book / Draft / Compare + 原 checkpointId + selectedChapterId
-> 切回 Read
-> 再切到 Structure
-> structure view 仍是 signals
```

### 12.6 app smoke（推荐）

新增一条：

```text
scene orchestrate snapshot
-> 切到 book draft compare
-> 再切回 scene
-> scene lens/tab/proposal snapshot 不丢
```

这条用于证明 PR12 新增的 `draftView / checkpointId` 不破坏四 scope snapshot 机制。

---

## 十三、Storybook 建议

新增：

```text
BookDraftStage.stories.tsx
BookDraftCompareView.stories.tsx
BookDraftCheckpointPicker.stories.tsx
```

更新：

```text
BookDraftInspectorPane.stories.tsx
BookDraftBottomDock.stories.tsx
BookDraftWorkspace.stories.tsx
```

最少 story 组合：

- `ReadDefault`
- `CompareDefault`
- `CompareSelectedSecondChapter`
- `CompareMissingDrafts`
- `CompareTraceRegression`
- `CompareQuietCheckpoint`

---

## 十四、实施顺序（给 AI 的执行顺序）

### Step 1
先扩 route：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`
- 加 `BookDraftView`
- 加 `draftView? / checkpointId?`
- 补 route tests

### Step 2
新增 checkpoint seed 与 client read 方法：

- `book-manuscript-checkpoints.ts`
- `book-client.ts`
- `book-query-keys.ts`

### Step 3
先写 pure compare mapper：

- `book-compare-view-models.ts`
- `book-manuscript-compare-mappers.ts`
- mapper tests

### Step 4
新增 `useBookManuscriptCompareQuery.ts`：

- 只组合 current draft workspace + checkpoint
- 不重复拉取 chapter / scene / traceability

### Step 5
新增主舞台 compare 组件：

- `BookDraftStage.tsx`
- `BookDraftCompareView.tsx`
- `BookDraftCheckpointPicker.tsx`

### Step 6
接入 `BookDraftWorkspace.tsx`：

- mainStage 改为 `BookDraftStage`
- compare data 传给 inspector / dock
- route patch 负责 draftView / checkpointId

### Step 7
增强 inspector / dock / activity：

- compare summary
- checkpoint summary
- compare problems
- compare activity

### Step 8
补集成测试与 stories：

- route
- mapper
- hook
- components
- workspace roundtrip
- app smoke

---

## 十五、完成后的验收标准

满足以下条件，PR12 就算完成：

1. Book route 支持 `draftView='read' | 'compare'`。
2. Book route 支持 `checkpointId`。
3. `view` 仍只服务 structure，切换 draft compare 不会丢掉 dormant `view`。
4. Book Draft 主舞台有 `Read / Compare` switcher。
5. Compare view 能把当前 manuscript 与显式 checkpoint 做 chapter-level / scene-section-level 对照。
6. `route.selectedChapterId` 仍然统一驱动 binder / compare view / inspector / dock。
7. Compare view 保留 `Open in Draft` / `Open in Structure` handoff。
8. browser back 能恢复 book draft compare 的 `checkpointId` 与 `selectedChapterId`。
9. PR11 的 Book Draft read flow 不被破坏。
10. PR10 的 Book Structure 三视图不被破坏。
11. scene / chapter / asset dormant snapshot 不被破坏。
12. PR12 不包含 publish / export / branch / mutation / AI rewrite。

---

## 十六、PR12 结束时不要留下的债

以下情况都算 PR 做偏了：

- 把 `view` 改成 read / compare，导致 structure dormant view 丢失
- 为 compare 新增 `selectedSceneId` / `chunkId` 等细粒度 book route
- 为 compare 引入新的 selected chapter store
- 复制 `useBookWorkspaceSources(...)` 形成第二套 source waterfall
- 在 Book client 中新增 giant `getBookCompareWorkspace()`
- 用字符串启发式从 prose 自动抽 trace，而不是只比较显式 snapshot
- 把 compare 做成 full diff editor
- 顺手做 export / publish / branch
- 破坏 PR11 的 read-first Book Draft reader

PR12 做完后的正确状态应该是：

**Book Draft 同时支持连续阅读与 checkpoint 对照，但仍保持 read-heavy、route-first、workbench-first 的纪律。**

---

## 十七、PR13 以后建议路线

### PR13：Book Export Preview / Publish Readiness（仍不真正发布）

目标：在 PR12 的 compare / review foundation 之后，新增 export preview surface。

范围建议：

- 不生成真实 PDF / EPUB / DOCX 文件
- 只做 manuscript export preview
- 加 publish readiness checklist
- 使用 PR12 compare summary 与 PR9 traceability coverage 做 readiness 判断

### PR14：Experiment Branch Foundation

目标：建立最小 branch / alternate manuscript 心智。

范围建议：

- mock branch records
- branch selector
- compare branch to main
- 不做复杂 merge
- 不做 Git 化 UI

### PR15：Review Inbox / Manuscript Annotations

目标：把 scene proposal、chapter draft issues、book compare deltas 收束成 review queue。

范围建议：

- read-heavy review inbox
- filters by scope / severity / trace gap
- 不做多人评论系统
- 不做复杂 assignment

---

## 十八、给 AI 的最终一句话指令

在当前 `codex/pr11-book-draft-lens` 已完成 Book Draft Lens 的前提下，不要继续抛光 read-only reader，也不要提前做 publish/export/branch；先只围绕 **Book Manuscript Compare / Review Foundation** 做一轮窄而实的实现：

- 给 Book route 增加 `draftView` 与 `checkpointId`
- 保持 `view` 仍只服务 Book Structure
- 用 read-only manuscript checkpoint seed 作为 baseline
- 复用当前 `useBookDraftWorkspaceQuery(...)` 的 current manuscript，不复制 source waterfall
- 用 pure mapper 派生 chapter / scene-section 级 compare view-model
- 在 Book Draft 主舞台增加 `Read / Compare` switcher 与 compare view
- 让 inspector / dock 显示 compare-aware review signals
- 继续用 `route.selectedChapterId` 统一焦点
- 保留 Book -> Chapter Structure / Draft handoff
- 用测试固定 route restore、compare mapper、workspace roundtrip、四 scope snapshot 不变
- 明确不做 publish、export 文件生成、branch、mutation、AI rewrite
