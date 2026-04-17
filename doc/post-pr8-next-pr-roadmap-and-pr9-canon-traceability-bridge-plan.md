# PR9 后续实施计划（基于 `codex/pr8-asset-knowledge-foundation` 实际代码）

## 结论

PR8 完成后，项目已经跨过了一个很关键的门槛：

- workbench 已不再只是 `scene + chapter`，而是已经正式进入 `scene + chapter + asset` 三个 scope。
- chapter 也不再只有 `structure`，而是已经拥有 `structure + draft` 两条 lens。
- asset / knowledge 已经具备自己的 navigator / main stage / inspector / bottom dock，且已有最小的 asset → chapter / scene handoff。

但 PR8 之后，最明显的缺口也已经非常清楚：

**scene、chapter、asset 三个对象层级都已经存在，但它们之间的“来源链”和“可追溯链”仍然是碎片化的。**

现在的代码里已经有很多 traceability 的碎片：

- scene proposal 已有 `sourceTraceId`
- scene accepted summary / inspector / patch preview 已有 accepted facts
- scene prose 已有 diff summary / revision queue / warnings
- chapter draft 已能按 chapter order 组装 prose
- asset mentions 已能最小 handoff 到 chapter / scene

但这些碎片还没有被收束成用户可直接使用的工作流。

所以，PR8 之后最合理的下一步主线，不是继续抛光 asset foundation，也不是立刻引入 `book`，而是：

## **PR9：Canon & Traceability Bridge**

一句话判断：

**PR9 要把现在已经存在于 scene / chapter / asset 三处的来源信息，收束成第一条可见、可跳转、可恢复的 traceability bridge。**

---

## 一、先确认当前代码基线

下面这些判断，都必须建立在当前 `codex/pr8-asset-knowledge-foundation` 的真实代码事实上，而不是继续沿用 PR7 以前的假设。

### 1. workbench 现在已经是三 scope，而不是双 scope

当前 route 类型已经是：

- `scene`
- `chapter`
- `asset`

其中：

- `scene` 支持 `structure | orchestrate | draft`
- `chapter` 支持 `structure | draft`
- `asset` 支持 `knowledge`

这说明 PR8 结束后，workbench 的对象轴已经不是空想，而是真正进入了第三对象层级。

### 2. chapter draft 已经成立，但仍是 read-first assembly

当前 chapter draft 并不是 placeholder。

它已经能：

- 先拿 chapter structure workspace
- 再按 chapter scene order 去拿每个 scene 的 prose query
- 派生 `assembledWordCount / draftedSceneCount / missingDraftCount / warnings / queuedRevisionCount`
- 用 `route.sceneId` 驱动 selected section

但它现在暴露出来的仍主要是：

- prose 文本
- word count
- warning count
- revision queue
- diff summary

还没有：

- 这一段 prose 来自哪些 accepted facts
- 这一段 prose 最近依赖哪个 patch / proposal
- 这一段 prose 关联了哪些 assets

也就是说，**chapter draft 已经有 assembled reading flow，但还没有 source chain。**

### 3. asset knowledge 已经落地，但仍是 read-heavy foundation

当前 asset feature 已经有完整骨架：

- `api`
- `components`
- `containers`
- `hooks`
- `types`

并且 asset knowledge workspace 已经具备：

- `Profile`
- `Mentions`
- `Relations`
- Inspector
- Bottom dock
- 最小 scene / chapter handoff

但 asset 现在仍然是：

- 只读 client
- 静态 mock mentions / relations
- knowledge-first workspace

还没有：

- mention 是否由 accepted canon 支撑
- mention 是否只是 draft-context
- asset mention 和 scene accepted fact / chapter section prose 的直接桥接

### 4. scene 侧其实已经有很多 traceability 碎片

PR9 最值得做的地方就在这里：

scene 现在并不缺来源信息的“原材料”，只是还没有把它们收束成独立工作面。

当前 scene 已经至少有：

- proposal card 上的 `sourceTraceId`
- execution 的 `acceptedSummary.acceptedFacts`
- inspector context 里的 accepted facts
- patch preview 里的 accepted facts + changes
- prose 里的 latest diff summary / revision queue / warnings
- scene client 中现成的 `getSceneExecution / getSceneProse / getSceneInspector / previewAcceptedPatch`

换句话说，**scene 这条纵切的“来源链材料”已经存在，只差桥接层。**

### 5. PR8 之后还没有 `book` scope

这并不是问题，反而说明顺序应该更清楚：

- 先把 `scene / chapter / asset` 三者真正连起来
- 再上 `book`

否则 book 很容易只是一个空壳总览页，而不是聚合已有工作面的上层对象。

---

## 二、推荐的后续顺序

我建议把 PR8 之后的主线收敛成下面三步：

1. **PR9：Canon & Traceability Bridge**
2. **PR10：Book Structure Workspace**
3. **PR11 以后：Branch / Compare / Publish**

### 为什么不是继续做 Asset polish

因为 asset 作为第三个 scope 已经成立。

继续在 PR9 里做 asset 的 profile / mentions / relations 小修小补，收益已经开始下降；真正高价值的缺口，是把它和 scene / chapter 接起来。

### 为什么不是先做 Book

因为 README 里的 `Book / Chapter / Scene / Asset` 是长期对象轴，不代表对象应按“越上层越先做”的顺序落地。

现在如果直接做 Book：

- 会新增第四个对象层级
- 但 scene / chapter / asset 之间还没有 traceability chain
- Book 很容易只变成 chapter list / readiness summary 的总览页

而如果先做 PR9：

- scene accepted state 能和 chapter prose / asset mentions 发生直接连接
- Book 再进来时就有真正可汇总的“来源链”和“canon bridge”

### 为什么 Branch / Compare / Publish 仍应后置

因为它们更像 workflow acceleration layer。

而当前更关键的是：

**先把已有三个对象层级连成一条能解释“文本从哪来、事实从哪来、asset 为什么在这里出现”的链。**

---

## 三、PR9 的唯一目标

**把 scene accepted state、scene prose、chapter draft section、asset mentions，第一次收束成一条可见的 traceability bridge。**

PR9 完成后，用户应该能在当前 workbench 里完成下面几件事：

### A. 在 Scene 中看见“来源链”

用户在 scene 里不仅能看 proposal / accepted facts / prose，还能看到：

- accepted facts 来源于哪些 proposals
- 当前 prose 最近建立在哪个 patch / accepted facts 上
- 这些 accepted facts / prose 关联了哪些 assets

### B. 在 Chapter Draft 中看见“章节段落来源”

用户选中某个 chapter section 时，右侧应能看到：

- 这个 section 对应的 scene accepted facts
- 最近 patch / diff 摘要
- 关联 assets
- 当前 section 是否缺少 trace link

### C. 在 Asset 中区分“canon-backed mention”和“draft-context mention”

用户在 asset 的 mentions 里，不应该只看到“它在哪被提到”。

更重要的是要能区分：

- 这是由 accepted canon 支撑的 mention
- 这只是当前 draft / patch context 里的 mention
- 这条 mention 还没有真实 trace backing

### D. 能在三者之间跳转而不打破现在的 route 心智

PR9 不应该发明一套新的导航系统。

它应该建立在现有 workbench 路由之上，让用户可以：

- scene → asset
- chapter draft → asset
- asset mention → scene / chapter
- browser back 恢复原来的 scope / lens / selection

一句话说：

**PR9 不是新增一个新页面，而是把现在已经存在的三个对象工作面，第一次用来源链真正缝起来。**

---

## 四、本轮明确不做

为了让 PR9 保持“窄而实”，以下内容不要混进来：

- 不做 `book` scope
- 不做 asset mutation / asset editor
- 不做 graph-first 入口
- 不做 full backlinks / query language
- 不做 prose chunk 级 anchor 定位系统
- 不做 compare mode
- 不做 publish / export 扩建
- 不做 branch / merge
- 不做全局搜索重构
- 不做 AI 自动抽取 trace link
- 不做完整审计系统

PR9 的定位必须是：

**第一版可见的 canon / prose / asset traceability bridge**，而不是一次性把所有知识图谱和审计能力铺满。

---

## 五、必须遵守的硬约束

### 1. 不新增新的 workbench scope，也不新增新的主 lens

PR9 不应该引入：

- `book`
- `traceability` 作为新的顶层 scope
- `traceability` 作为新的顶层 lens

这轮 traceability 应该是：

- scene 的 supporting pane
- chapter draft 的 supporting pane
- asset mentions / inspector 的 supporting enhancement

而不是一个新的一级工作面。

### 2. 现有 route 结构尽量保持不变

当前 route 类型已经比较干净：

- scene：`scope + id + lens + tab + ...`
- chapter：`scope + id + lens + view + sceneId`
- asset：`scope + id + lens + view`

PR9 不要为了 traceability 引入：

- `traceId=`
- `sourceProposalId=`
- `selectedAssetChip=`
- `selectedFactId=`

traceability 的 UI 状态应优先依赖：

- 当前 selected scene
- 当前 selected chapter section
- 当前 selected asset
- inspector tab / local pane state

### 3. 现有 query identity 不能被打破

继续保持下面这些 key 语义不变：

- `chapterQueryKeys.workspace(chapterId)`
- `assetQueryKeys.workspace(assetId, locale)`
- `sceneQueryKeys.workspace(sceneId)`
- `sceneQueryKeys.execution(sceneId)`
- `sceneQueryKeys.prose(sceneId)`
- `sceneQueryKeys.inspector(sceneId)`
- `sceneQueryKeys.patchPreview(sceneId)`

PR9 不应为了 traceability 去改这些已有 query 的 identity。

正确做法是：

- 组合已有 query
- 在 hook 内派生 traceability view-model
- 让 traceability 是 derived layer，而不是新的 server identity

### 4. scene / chapter / asset 的主舞台职责不改变

PR9 仍需坚持 workbench 纪律：

- scene 主舞台继续是 orchestrate / prose / setup
- chapter draft 主舞台继续是连续阅读
- asset 主舞台继续是 profile / mentions / relations

traceability 只能增强 supporting surfaces：

- inspector
- bottom dock
- section header 的轻提示

不要把 chapter reader 或 asset mentions 变成第二个复杂控制台。

### 5. 第一版 trace link 必须走“显式 mock metadata”，不要靠推断

当前 mock 数据虽然丰富，但如果 PR9 试图用文本匹配或启发式规则自动推断：

- 某个 accepted fact 对应哪个 asset
- 某段 prose 对应哪个 patch
- 某个 mention 对应哪个 proposal

很容易让这一轮失控。

PR9 的正确方式是：

- 在 mock scene / asset records 里显式补 trace metadata
- 让 hook 只是读取并组合这些关系
- 不做自动抽取

---

## 六、数据层与类型层建议

## 6.1 不要新增新的 runtime capability；优先扩展现有 view-model 的可选字段

当前 scene client 已经有：

- `getSceneExecution(...)`
- `getSceneProse(...)`
- `getSceneInspector(...)`
- `previewAcceptedPatch(...)`

PR9 最窄的做法，不是再发明一个：

- `getSceneTraceability(...)`

而是：

- 扩展现有 scene view-model 的可选 trace metadata
- 继续用现有 client / bridge 方法
- 由新的 traceability hook 组合这些已有 payload

这样能最大限度降低：

- bridge 改造面
- query key 变化
- 现有 scene 纵切被重写的风险

### 推荐做法

在 `packages/renderer/src/features/scene/types/scene-view-models.ts` 中，给下面这些结构补 **可选** trace 字段：

#### accepted fact

```ts
interface SceneTraceProposalRef {
  proposalId: string
  sourceTraceId?: string
}

interface SceneTraceAssetRef {
  assetId: string
  label: string
  kind: 'character' | 'location' | 'rule'
}
```

然后扩展：

```ts
acceptedFacts: Array<{
  id: string
  label: string
  value: string
  sourceProposals?: SceneTraceProposalRef[]
  relatedAssets?: SceneTraceAssetRef[]
}>
```

#### patch preview change

```ts
changes: Array<{
  id: string
  label: string
  detail: string
  sourceProposals?: SceneTraceProposalRef[]
  relatedAssets?: SceneTraceAssetRef[]
}>
```

#### prose trace summary

```ts
traceSummary?: {
  sourcePatchId?: string
  sourceProposals?: SceneTraceProposalRef[]
  acceptedFactIds?: string[]
  relatedAssets?: SceneTraceAssetRef[]
}
```

这条思路的好处是：

- scene client contract 不需要新增方法
- mock 与 preload bridge 都能保持兼容
- PR9 的 UI 与 hook 只是在“吃更丰富的数据”

---

## 6.2 asset mention record 也要补最小 trace metadata

当前 asset mention 仍然更像“知识页上的静态提及项”。

为了让 asset mentions 能在 PR9 里区分：

- canon-backed
- draft-context
- unlinked

建议在 `packages/renderer/src/features/asset/api/asset-records.ts` 里，为 `AssetMentionRecord` 补最小 trace 字段：

```ts
type AssetMentionBackingKind = 'canon' | 'draft_context' | 'unlinked'

interface AssetMentionBackingRecord {
  kind: AssetMentionBackingKind
  sceneId?: string
  acceptedFactIds?: string[]
  proposalIds?: string[]
  patchId?: string
}
```

然后在 `AssetMentionRecord` 上加：

```ts
backing?: AssetMentionBackingRecord
```

### 为什么不要直接把整个 scene trace 树复制进 asset record

因为 asset 仍然是 knowledge foundation，不应变成第二份 scene 数据缓存。

asset record 只需要保留：

- “我和哪条 scene trace 有关系”的最小 anchor

真正的详情仍由 scene traceability query 去组合。

---

## 6.3 新增一个 cross-feature 的 `traceability` feature，而不是把逻辑散在三个 feature 里

推荐新增：

```text
packages/renderer/src/features/traceability/
  types/
    traceability-view-models.ts
  lib/
    traceability-mappers.ts
  hooks/
    useSceneTraceabilityQuery.ts
    useChapterDraftTraceabilityQuery.ts
    useAssetTraceabilitySummaryQuery.ts
```

### 为什么值得单独开一个 feature

因为 PR9 的问题本质是：

- scene / chapter / asset 之间的跨 feature 组合

如果把这些组合逻辑散落在：

- `features/scene/hooks/**`
- `features/chapter/hooks/**`
- `features/asset/hooks/**`

会很快出现：

- 相同的 mappers 重复三套
- 交叉依赖越来越难维护
- 未来 PR10 / PR11 很难继续复用

### 这层应该只做什么

只做：

- 纯映射
- query 组合
- view-model 派生

不要做：

- route 真源
- mutation 真源
- store 真源

---

## 6.4 三个核心 hook 的职责建议

### A. `useSceneTraceabilityQuery(sceneId)`

输入：

- `sceneExecution`
- `sceneProse`
- `sceneInspector`
- `scenePatchPreview`

输出：

```ts
interface SceneTraceabilityViewModel {
  acceptedFacts: Array<...>
  latestPatch: {
    patchId: string
    label: string
    summary: string
    status: 'ready_for_commit' | 'needs_review' | 'deferred'
    changes: Array<...>
  } | null
  proseOrigin: {
    statusLabel?: string
    latestDiffSummary?: string
    sourcePatchId?: string
    sourceProposals: Array<...>
    acceptedFactIds: string[]
    relatedAssets: Array<...>
  } | null
  relatedAssets: Array<...>
}
```

### B. `useChapterDraftTraceabilityQuery({ chapterId, selectedSceneId })`

输入：

- `useChapterDraftWorkspaceQuery(...)`
- selected scene ids（按 chapter order）
- 对每个 scene 组合 `execution / prose / patchPreview / inspector`

输出：

```ts
interface ChapterDraftTraceabilityViewModel {
  selectedSceneTrace: {
    sceneId: string
    acceptedFacts: Array<...>
    relatedAssets: Array<...>
    latestPatchSummary?: string
    latestDiffSummary?: string
    sourceProposalCount: number
    missingLinks: string[]
  } | null
  chapterCoverage: {
    tracedSceneCount: number
    missingTraceSceneCount: number
    sceneIdsMissingTrace: string[]
    sceneIdsMissingAssets: string[]
  }
}
```

### C. `useAssetTraceabilitySummaryQuery(assetId)`

输入：

- `useAssetKnowledgeWorkspaceQuery(...)`
- mention 中涉及到的 `sceneId / chapterId`
- scene traceability data（按 mention anchor 去拉）

输出：

```ts
interface AssetTraceabilitySummaryViewModel {
  canonBackedMentions: number
  draftContextMentions: number
  unlinkedMentions: number
  mentionSummaries: Array<{
    mentionId: string
    backingKind: 'canon' | 'draft_context' | 'unlinked'
    factLabels: string[]
    proposalTitles: string[]
  }>
}
```

### 关键纪律

这三个 hook 都应该是 **composed hooks**，而不是新的 client identity。

---

## 七、UI 与交互建议

## 7.1 Scene：增加一个真正的 `Traceability` inspector tab

当前 scene inspector 只有：

- `Context`
- `Versions`
- `Runtime`

PR9 最自然的落点，是把 traceability 放进 inspector，而不是塞进底部 runtime dock。

### 推荐做法

在 `SceneInspectorPanel.tsx` 中把 tab 扩成：

- `Context`
- `Versions`
- `Traceability`
- `Runtime`

并同步扩展：

- `scene-ui-store.ts`
- `InspectorTabId`

### `Traceability` tab 第一版建议固定三块

#### A. `Accepted canon`

显示：

- accepted facts
- 每条 fact 来源于哪些 proposals
- 每条 fact 关联哪些 assets

#### B. `Latest patch`

显示：

- patch label / status / summary
- patch changes
- changes 的 source proposals
- changes 的 related assets

#### C. `Prose origin`

显示：

- 当前 prose status / latest diff summary
- prose 依赖的 source patch
- prose 依赖的 accepted facts
- prose 关联 assets

### 交互

- 点 asset chip：打开 `scope='asset'` / `lens='knowledge'` / `view='profile'`
- 不新增 route 参数
- inspector tab 继续走 `scene-ui-store`

### 不做

- 不把 runtime trace 搬过来
- 不做 chunk 级高亮
- 不做 graph 展示

---

## 7.2 Chapter Draft：让 selected section 的来源信息进入 inspector

当前 chapter draft 的主舞台已经是对的：

- 安静
- 连续阅读
- route.sceneId 驱动 selected section

PR9 不应该把 reader 改成“来源卡片墙”。

### 正确做法

让 `ChapterDraftInspectorPane.tsx` 从当前的：

- selected scene summary
- readiness metrics

升级成：

#### A. `Selected section`

保留：

- title
- summary
- prose status
- word count
- latest diff

#### B. `Source facts`

新增：

- accepted facts
- source proposal count
- latest patch summary
- missing trace link 提示

#### C. `Related assets`

新增：

- asset chips
- open asset profile action

#### D. `Chapter trace coverage`

新增：

- traced scene count
- missing trace scene count
- missing asset link scenes

### Reader 只做轻提示

在 `ChapterDraftReader.tsx` 的 section header 里，只补轻量 secondary signals：

- source facts count
- related assets count
- trace ready / trace missing badge

但不要：

- 展开复杂 trace details
- 新增第二套主阅读流

### 交互

- section 仍然通过 `patchChapterRoute({ sceneId })` 选中
- asset chip 通过 `replaceRoute({ scope: 'asset', ... })` 打开 asset
- 现有 `Open in Draft / Open in Orchestrate` 保留不变

---

## 7.3 Asset：让 mentions 从“静态提及”升级成“trace-aware mentions”

当前 asset mentions 已经能打开 scene / chapter，但还没有告诉用户：

- 这条 mention 是不是 canon-backed
- 它是否只存在于 draft context
- 它是否还没有真实 trace backing

### 推荐做法

在 `AssetMentionsView.tsx` 中，为每条 mention 增加一个 backing badge：

- `Canon-backed`
- `Draft-context`
- `Unlinked`

并在卡片里增加一块轻量 `Trace detail`：

- accepted fact label(s)
- source proposal title(s)
- source patch id（若有）

### `AssetInspectorPane.tsx` 也应补一个 Trace summary

在原来的 `Summary / Consistency` 基础上，可把 consistency 收敛成：

- warning count
- orphan state
- missing fields
- canon-backed mention count
- draft-context mention count
- unlinked mention count

### `AssetBottomDock.tsx` 的 Problems 也应同步增强

加入：

- mentions without canon backing
- mentions with missing scene trace
- relations present but no narrative backing

### 不做

- 不做 asset editor
- 不做 mention inline edit
- 不做 graph

---

## 八、建议的文件改动

## 8.1 推荐新增

```text
packages/renderer/src/features/traceability/types/traceability-view-models.ts
packages/renderer/src/features/traceability/lib/traceability-mappers.ts
packages/renderer/src/features/traceability/hooks/useSceneTraceabilityQuery.ts
packages/renderer/src/features/traceability/hooks/useChapterDraftTraceabilityQuery.ts
packages/renderer/src/features/traceability/hooks/useAssetTraceabilitySummaryQuery.ts
packages/renderer/src/features/traceability/components/TraceabilityAssetChips.tsx
packages/renderer/src/features/scene/components/SceneTraceabilityPanel.tsx
```

### 为什么 `SceneTraceabilityPanel.tsx` 值得单独抽

因为如果把 PR9 的新增内容直接塞进 `SceneInspectorPanel.tsx`，这个文件会很快失控。

正确做法是：

- `SceneInspectorPanel.tsx` 继续做 tab switchboard
- `SceneTraceabilityPanel.tsx` 承担 traceability 内容渲染

---

## 8.2 推荐修改

```text
packages/renderer/src/features/scene/types/scene-view-models.ts
packages/renderer/src/mock/scene-fixtures.ts
packages/renderer/src/features/scene/components/SceneInspectorPanel.tsx
packages/renderer/src/features/scene/components/ScenePatchPreviewSheet.tsx
packages/renderer/src/features/scene/components/SceneProseTab.tsx
packages/renderer/src/features/scene/containers/SceneInspectorContainer.tsx
packages/renderer/src/features/scene/store/scene-ui-store.ts

packages/renderer/src/features/chapter/types/chapter-draft-view-models.ts
packages/renderer/src/features/chapter/components/ChapterDraftReader.tsx
packages/renderer/src/features/chapter/components/ChapterDraftInspectorPane.tsx
packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.tsx

packages/renderer/src/features/asset/api/asset-records.ts
packages/renderer/src/features/asset/api/mock-asset-db.ts
packages/renderer/src/features/asset/types/asset-view-models.ts
packages/renderer/src/features/asset/hooks/useAssetKnowledgeWorkspaceQuery.ts
packages/renderer/src/features/asset/components/AssetMentionsView.tsx
packages/renderer/src/features/asset/components/AssetInspectorPane.tsx
packages/renderer/src/features/asset/components/AssetBottomDock.tsx

packages/renderer/src/app/i18n/**
```

---

## 8.3 这一轮尽量不动

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/chapter/api/chapter-client.ts
packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts
packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.ts
packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.ts
packages/renderer/src/features/asset/api/asset-client.ts
packages/renderer/src/features/scene/api/scene-client.ts
packages/renderer/src/features/scene/api/scene-runtime.ts
```

### 为什么 `scene-client.ts` 最好不动

因为 PR9 的重点不是新增 scene runtime capability，而是用已有 scene payload 的 richer metadata 去组合 traceability。

只要 view-model 扩成可选字段、mock fixture 能提供这些字段，scene client 完全可以继续保持 clone / bridge 透传逻辑。

---

## 九、测试补齐方案

## 9.1 纯 mapper / derivation 测试

PR9 最值钱的测试，不是“按钮有没有出现”，而是：

**scene / chapter / asset 的来源链在组合时有没有被正确收束。**

建议至少新增：

### `traceability-mappers.test.ts`

覆盖：

1. scene accepted facts 能映射出 source proposals 与 related assets
2. patch preview 能映射出 source proposals 与 related assets
3. prose origin 能聚合 source patch / accepted facts / related assets
4. asset mention backing 能正确落成：
   - canon-backed
   - draft-context
   - unlinked
5. chapter trace coverage 能正确统计 traced / missing scenes

---

## 9.2 scene 相关测试

### `SceneTraceabilityPanel.test.tsx`

至少覆盖：

1. Accepted canon 区块渲染 accepted facts
2. fact 显示 source proposal / sourceTraceId
3. related asset chip 渲染正确
4. latest patch 区块显示 patch summary / changes
5. prose origin 区块显示 latest diff summary

### `SceneInspectorContainer.test.tsx`

至少覆盖：

1. inspector tab 现在支持 `traceability`
2. 切到 traceability 时，panel 能读到组合后的 trace data
3. 点击 asset chip 能触发 asset handoff

---

## 9.3 chapter draft 相关测试

### `useChapterDraftTraceabilityQuery.test.tsx`

至少覆盖：

1. selectedSceneId 缺失时 fallback 到首个 section
2. selected scene trace 正确使用同一 scene 的 trace data
3. chapter coverage 统计正确
4. related assets 去重正确

### `ChapterDraftInspectorPane.test.tsx`

至少覆盖：

1. 选中 section 时显示 source facts
2. 显示 latest patch / diff summary
3. 显示 related assets
4. trace missing 时有明确 empty / warning state

### `ChapterDraftReader.test.tsx`

至少覆盖：

1. header 上显示 trace ready / trace missing 的轻量 badge
2. section selection 不受新增 trace UI 干扰
3. open scene handoff 仍可用

---

## 9.4 asset 相关测试

### `useAssetTraceabilitySummaryQuery.test.tsx`

至少覆盖：

1. canon-backed mention count 正确
2. draft-context mention count 正确
3. unlinked mention count 正确
4. source fact labels / proposal titles 聚合正确

### `AssetMentionsView.test.tsx`

至少覆盖：

1. mention 显示 backing badge
2. mention 显示 trace detail
3. 现有 open scene / open chapter handoff 继续可用

### `AssetInspectorPane.test.tsx`

至少覆盖：

1. inspector 能显示 trace summary counts
2. orphan / warning / missing field summary 仍然成立

---

## 9.5 app / integration smoke

PR9 至少值得加两条真正有价值的 smoke：

### A. `chapter draft -> asset -> back`

```text
打开 chapter draft
-> 选中一个 section
-> inspector 显示 source facts + related assets
-> 点击一个 asset chip
-> 进入 asset profile
-> browser back
-> 回到 chapter draft + 原 sceneId
```

### B. `scene orchestrate -> asset -> back`

```text
打开 scene orchestrate
-> 切到 inspector traceability
-> 点击 related asset
-> 进入 asset knowledge
-> browser back
-> 回到 scene orchestrate + 原 tab
```

### 这两条 smoke 的意义

它们能真正固定住 PR9 最重要的两件事：

- traceability 已经变成可跳转的工作流，而不是静态说明文字
- 现有 route / history 心智没有被打坏

---

## 十、实施顺序（给 AI 的执行顺序）

### Step 1
先补 mock metadata，而不是先写 UI：

- 扩展 `scene-view-models.ts` 的可选 trace 字段
- 扩展 `mock/scene-fixtures.ts`
- 扩展 `asset-records.ts` / `mock-asset-db.ts`

### Step 2
新增 cross-feature traceability mappers：

- `traceability-view-models.ts`
- `traceability-mappers.ts`
- 先把 scene / chapter / asset 的组合逻辑写纯
- 先补 mapper 单测

### Step 3
新增 traceability hooks：

- `useSceneTraceabilityQuery.ts`
- `useChapterDraftTraceabilityQuery.ts`
- `useAssetTraceabilitySummaryQuery.ts`

### Step 4
先接 Scene：

- 新增 `SceneTraceabilityPanel.tsx`
- 扩展 inspector tab
- 让 scene 成为第一条真正可见的 traceability surface

### Step 5
再接 Chapter Draft：

- 让 selected section 的 trace data 进入 inspector
- 给 reader header 加轻提示
- 保持 draft reader 的连续阅读优先

### Step 6
最后接 Asset：

- 把 mentions 变成 trace-aware
- 给 inspector / dock 补 trace summary
- 保持 asset 仍是 read-heavy knowledge workspace

### Step 7
补 smoke 与 stories：

- scene traceability story
- chapter draft trace story
- asset mention backing story
- app smoke

---

## 十一、完成后的验收标准

满足以下条件，PR9 就算完成：

1. 不新增新的 scope / lens。
2. 不改现有 workbench route 结构。
3. scene inspector 现在有可用的 `Traceability` tab。
4. scene 中能看见 accepted fact → proposal / asset 的桥接。
5. scene prose 能显示最小的 source patch / accepted facts / related assets 摘要。
6. chapter draft inspector 能显示 selected section 的 source facts / latest patch / related assets。
7. chapter draft reader 仍保持 read-first，不会被 trace UI 挤成控制台。
8. asset mentions 能区分 canon-backed / draft-context / unlinked。
9. asset inspector / dock 能显示 trace summary。
10. scene / chapter → asset 的 trace handoff 可用，browser back 恢复成立。
11. 现有 chapter multi-lens、asset deep-link、scene/chapter smoke 不被破坏。
12. PR9 不包含 book / graph / mutation / compare / publish。

---

## 十二、PR9 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了 traceability 新增了一套顶层 route 参数体系
- 为了 selected fact / asset chip 新造了第二真源 store
- scene traceability 变成 runtime log 面板，而不是来源链面板
- chapter draft reader 被改成高噪音卡片流
- asset mentions 只是多了一些说明文字，没有真实 backing 分类
- 为了 PR9 顺手做了 asset editor / graph / book scope
- 新增 `getSceneTraceability()` 一类 runtime capability，导致 bridge 改造面过大
- trace 关系靠字符串匹配推断，而不是显式 mock metadata

PR9 做完后的正确项目状态应该是：

**scene、chapter、asset 三个对象工作面仍各自保持原本职责，但它们之间第一次拥有了一条可见、可跳转、可恢复的 traceability bridge。**

---

## 十三、PR10 与之后的方向（保留给下一轮）

### PR10：Book Structure Workspace

在 PR9 完成后，再进入 `book` scope 会更顺，因为那时 Book 不再只能汇总：

- chapter sequence
- readiness counts

而是还能汇总：

- 哪些 chapters 的 canon / prose bridge 完整
- 哪些 chapters 的 traceability 仍有缺口
- 哪些 assets / rules 跨 chapter 发生了真正的引用压力

### PR11 以后：Branch / Compare / Publish

继续后置。

因为在：

- traceability
- book scope

都还没成立前，branch / compare / publish 仍然会过早进入 acceleration layer。

---

## 十四、给 AI 的最终一句话指令

在当前 `codex/pr8-asset-knowledge-foundation` 已经完成 PR8 的前提下，不要继续抛光 asset foundation，也不要提前做 `book` 或 `graph`；先只围绕 **Canon & Traceability Bridge** 做一轮窄而实的实现：

- 不新增新的 scope / lens / route 参数
- 用现有 scene execution / prose / inspector / patch preview 的 payload 扩出可选 trace metadata
- 用一个独立的 `features/traceability` 组合层把 scene / chapter draft / asset mention 串起来
- 先让 scene inspector 拥有真正的 traceability tab
- 再让 chapter draft inspector 看见 section 的来源链与 related assets
- 最后让 asset mentions 区分 canon-backed / draft-context / unlinked
- 继续复用现有 handoff 与浏览器历史恢复
- 用测试固定 query identity 不变、route 不变、跨 scope back 恢复不变这三条硬约束
- 明确不做 book、graph、mutation、compare、publish
