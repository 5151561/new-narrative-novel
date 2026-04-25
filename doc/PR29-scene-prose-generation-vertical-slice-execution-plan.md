<<<<<<< HEAD
# PR29 Scene Prose Generation Vertical Slice Execution Plan

## Goal

Deliver the API-side vertical slice where an existing scene run can flow through:

```text
selected proposal variant -> accept / accept-with-edit -> canon patch artifact -> prose draft artifact -> scene prose read model
```

This bundle is API/doc scoped. Renderer implementation is out of scope unless a shared API contract file is clearly required.

## Bundle A Scope

### 1. Prose-draft artifact body contract

- Add `body?: LocalizedTextRecord` to `ProseDraftArtifactDetailRecord`.
- Generate deterministic fixture `body` in `buildProseDraftDetail(...)`.
- Body content must reflect:
  - scene name
  - accepted proposal id
  - selected variant effect / rationale when `selectedVariants` exists
  - fallback/default path when selected variants are absent
- Keep `excerpt` for list / summary / dock use.
- Never place prose body, prompt, context packet, or LLM output into run event metadata.

### 2. Pure materialization mapper

- Add `packages/api/src/orchestration/sceneRun/sceneRunProseMaterialization.ts`.
- Export `buildSceneProseFromProseDraftArtifact(input)`.
- Map `ProseDraftArtifactDetailRecord` plus optional `CanonPatchArtifactDetailRecord` and optional `ProposalSetArtifactDetailRecord` to:
  - `proseDraft`
  - `draftWordCount`
  - `statusLabel`
  - `latestDiffSummary`
  - `traceSummary`
- Export `buildAcceptedFactsFromCanonPatch(canonPatch)`.

Mapping rules:

- `proseDraft <- body?.en ?? excerpt.en`
- `draftWordCount <- wordCount`
- `statusLabel <- statusLabel.en or Generated from id`
- `latestDiffSummary <- summary.en`
- `traceSummary.sourcePatchId <- sourceCanonPatchId`
- `traceSummary.sourceProposals <- sourceProposalIds plus selected variant summary`
- `traceSummary.acceptedFactIds <- canonPatch.acceptedFacts[].id`
- `traceSummary.relatedAssets <- proseDraft.relatedAssets`
- `missingLinks <- []`
- `SceneProseViewModel` remains a string view-model; do not put `LocalizedTextRecord` directly into it.

### 3. Fixture repository sync

- After accepted review transitions, find latest `prose-draft`, `canon-patch`, and `proposal-set` details through existing run artifact listing/detail access.
- Only `accept` / `accept-with-edit` with a `prose-draft` artifact may update `scene.prose`.
- `request-rewrite` and `reject` must not generate or overwrite prose.
- Completed reject without prose-draft must not overwrite current scene prose.
- A second accepted run may overwrite scene prose as the latest accepted run.
- Sync accepted facts into:
  - `scene.execution.acceptedSummary.acceptedFacts`
  - `scene.inspector.context.acceptedFacts`
- Sync chapter structure scene row `proseStatusLabel` to generated/updated when materialization occurs.

### 4. API tests

- Mapper tests:
  - body mapping
  - excerpt fallback
  - source patch
  - source proposals / selected variants
  - related assets
  - accepted facts
  - no run event payload dependency
- Run flow tests:
  - accept materializes prose
  - accept-with-edit materializes prose
  - reject/request-rewrite do not materialize
  - events stay lightweight
  - chapter metadata updates
- Run artifact tests:
  - prose-draft has body and excerpt
  - selected variants retained
  - canon-patch/prose-draft source relation retained
  - PR28 context-packet activation trace remains artifact-detail only

### 5. Docs

- Add this PR29 execution plan document.
- Update `doc/api-contract.md` minimally for `ProseDraftArtifactDetailRecord.body`.
- Update `README.md` current status only if there is already a relevant API-side status section.

## Acceptance Constraints

- Existing endpoints are enough:
  - `POST /api/projects/{projectId}/runs/{runId}/review-decisions`
  - `GET /api/projects/{projectId}/runs/{runId}/artifacts`
  - `GET /api/projects/{projectId}/runs/{runId}/artifacts/{artifactId}`
  - `GET /api/projects/{projectId}/runs/{runId}/trace`
  - `GET /api/projects/{projectId}/scenes/{sceneId}/prose`
- Do not add endpoints.
- Do not add route params.
- Do not add true LLM integration.
- Do not add Temporal, SSE, prompt editor, policy mutation, RAG, branch, publish, or spatial blackboard scope.
- Run events must stay lightweight: no prose body, prompt, context packet, or LLM output in event metadata.
- Prose must be materialized from prose-draft artifact detail into the scene prose read model.
- Do not hard-code `scene.prose` directly without source artifact relation.
- Preserve selected variant provenance through proposal-set, canon-patch, prose-draft, scene prose trace, and source summary.

## Verification

Run:

```bash
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/api test
```

Prefer targeted Vitest commands for changed API tests first when local dependencies are available.
=======
# PR29 执行文档：Scene Prose Generation Vertical Slice

> 基于 `codex/pr28-asset-context-policy` 当前代码状态。  
> 这份文档可以直接交给 AI agent 执行。它不是路线图回顾，也不是大而全后端计划。

---

## 0. PR29 一句话目标

在 PR28 已经完成 **Asset Context Policy / Context Activation Trace Foundation** 的前提下，PR29 不继续扩 prompt/context/policy 地基，也不提前做真实 LLM / SSE / Temporal，而是只做一轮窄而实的：

**Scene Prose Generation Vertical Slice**

也就是让当前已经存在的 run / proposal variants / review decision / canon patch / prose draft artifact 链路，第一次真正落到 Scene Draft read model 中，并能被 Chapter Draft / Book Draft 通过现有 scene prose query 聚合读到。

目标闭环必须成立：

```text
start scene run
-> context_packet_built
-> proposal_set with variants
-> select proposal variant in review gate
-> submit accept / accept-with-edit
-> canon-patch artifact created
-> prose-draft artifact created
-> scene prose read model materialized from prose-draft artifact
-> Scene / Draft shows generated prose
-> Chapter / Draft and Book / Draft can assemble the updated scene prose
-> trace/artifact surfaces explain proposal variant -> canon patch -> prose draft
```

核心纪律：

```text
prose 是 artifact materialized read model，不是直接塞进 event。
accepted canon / canon patch 才是叙事真相来源，不是 LLM/raw output。
run events 仍只携带轻量 refs / metadata，大 payload 继续走 artifact detail。
PR29 可以用 deterministic fixture prose，不接真实模型。
```

---

## 1. 当前代码基线判断

### 1.1 当前仓库已经不是早期 renderer demo

当前分支已经有：

```text
packages/api
packages/renderer
```

根脚本也已经同时覆盖 API 与 renderer：

```bash
pnpm dev:api
pnpm dev:renderer
pnpm typecheck
pnpm test
pnpm build
pnpm storybook
```

所以 PR29 应继续建立在 `ProjectRuntime -> /api/projects/{projectId}/...` 这条产品路径上，不要回到 feature 直接读 mock DB 的老路。

### 1.2 PR28 已经把 context policy / activation trace 接进 artifact detail

当前已经成立：

- Asset / Knowledge 有 `context` view。
- Asset knowledge read model 可以携带 read-only `contextPolicy`。
- context-packet artifact detail 可以显示 included / excluded / redacted asset activation trace。
- `context_packet_built` event 仍只带轻量 refs / count metadata。

PR29 不要继续做：

- policy mutation
- prompt manager
- context packet editor
- RAG / WorldInfo keyword engine
- context packet preview expansion

### 1.3 PR27/PR28 已经有 proposal variant -> artifact 链路，但还没有真正 prose materialization

当前 run 层已经有这些基础：

- `SubmitRunReviewDecisionInput.selectedVariants`
- `ProposalSetArtifactDetailRecord.proposals[].variants/defaultVariantId/selectedVariantId`
- `CanonPatchArtifactDetailRecord.selectedVariants`
- `ProseDraftArtifactDetailRecord.selectedVariants`
- `RunTraceResponse` 可表示 proposal / canon-patch / prose-draft 的来源关系

API 侧 `runFixtureStore.submitRunReviewDecision(...)` 当前已经会在 `accept` / `accept-with-edit` 时：

- 追加 `review_decision_submitted`
- 追加 `canon_patch_applied`
- 追加 `prose_generated`
- 生成 `canon-patch` artifact
- 生成 `prose-draft` artifact
- 重建 artifact detail / trace read surfaces

但是 `fixtureRepository.syncSceneSurfacesFromRun(...)` 当前主要同步的是：

- scene workspace 的 latest run / status
- scene execution 的 run status
- scene prose 的 `statusLabel` / `latestDiffSummary`
- chapter structure scene row 的 run label

它还没有把 `prose-draft` artifact 的正文内容真正 materialize 到：

```text
scene.prose.proseDraft
scene.prose.draftWordCount
scene.prose.traceSummary
scene.prose.statusLabel
scene.execution.acceptedSummary.acceptedFacts
scene.inspector.context.acceptedFacts
chapter.scenes[].proseStatusLabel
```

这正是 PR29 的核心缺口。

### 1.4 Renderer 侧 review decision mutation 还只刷新 run queries

当前 `useSubmitRunReviewDecisionMutation(...)` 成功后会刷新：

```text
run detail
run events
run artifacts
run trace
```

但 PR29 需要在 review accept 后，让 Scene / Draft、Chapter / Draft、Book / Draft 能读到新的 scene prose。因此 renderer 侧必须新增 scene/chapter/book 相关 query invalidation，不能只停留在 run panel 刷新。

---

## 2. PR29 的唯一目标

**把 prose-draft artifact materialize 成可被工作台读取的 SceneProseViewModel，并让现有 draft 聚合面能看到它。**

PR29 完成后，用户应该能完成下面这条最小闭环：

```text
打开 Scene / Orchestrate
-> start run
-> proposal-set artifact 中选择 proposal variant
-> accept / accept-with-edit
-> run 进入 completed
-> events 中看到 canon_patch_applied / prose_generated
-> artifact inspector 中看到 canon patch / prose draft 仍保留 selected variant 来源
-> 打开 Scene / Draft
-> 看到由本次 run 生成的 proseDraft
-> prose trace summary 能指向 source patch / source proposals / related assets
-> 打开 Chapter / Draft 或 Book / Draft
-> 看到该 scene prose 被装配进章节 / 全书草稿
```

一句话说：

**PR29 要让“被接受的 proposal variant”第一次变成用户能读到的正文，而不是只停留在 artifact inspector 里。**

---

## 3. 本轮明确不做

以下内容不要混进 PR29：

- 不做真实 LLM 调用。
- 不做 Temporal / durable workflow runtime。
- 不做 SSE / `events/stream` 实现。
- 不做 prompt editor / context packet editor。
- 不做 Asset Context Policy mutation。
- 不做 RAG / vector search。
- 不做 proposal variant regenerate / prose swipe。
- 不做 branch / publish / export 扩建。
- 不做 ChapterRunWorkflow / BookRunWorkflow。
- 不做 multi-scene orchestration。
- 不做完整 prose rewrite workflow。
- 不做 inline prose editor。
- 不做 Spatial Blackboard / Blender。

PR29 只做：

```text
fixture prose draft body
+ artifact -> scene prose materialization
+ renderer query invalidation
+ minimal source display / tests / stories
```

---

## 4. 必须遵守的硬约束

### 4.1 RunEvent 仍然轻量

不允许把完整 prose body、prompt、context packet、LLM output 放进 `RunEventRecord.metadata`。

允许：

```ts
refs: [
  { kind: 'prose-draft', id: 'prose-draft-scene-midnight-platform-001', label: 'Prose draft' },
]
metadata: {
  selectedVariantCount: 1,
}
```

不允许：

```ts
metadata: {
  proseDraft: '...',
  fullPrompt: '...',
  fullContextPacket: { ... },
}
```

### 4.2 prose-draft artifact 是 materialization source

Scene prose read model 必须来自 `prose-draft` artifact detail，而不是在 repository 里另写一份完全无来源的 fixture 文本。

正确方向：

```text
ProseDraftArtifactDetailRecord
-> map to SceneProseViewModel
-> update scene.prose
-> downstream chapter/book draft hooks read scene.prose normally
```

错误方向：

```text
submit review decision
-> hard-code scene.prose.proseDraft = 'some text'
-> trace/artifact 不知道它从哪来
```

### 4.3 selected variant 来源不能丢

如果 review decision 携带：

```ts
selectedVariants: [{ proposalId, variantId }]
```

那么 PR29 后至少这些位置应能保留或读到该来源：

- proposal-set artifact detail 的 selected state
- canon-patch artifact detail
- prose-draft artifact detail
- scene prose trace summary 或 source summary
- run trace links / nodes

### 4.4 不新增 route 参数

不要新增：

- `proseArtifactId`
- `selectedProseDraftId`
- `sourcePatchId`
- `selectedVariantId`

第一版 prose materialization 应该依赖当前 run review result 和 scene prose read model，不靠 route 承载中间状态。

### 4.5 不新增 endpoint

第一版不新增：

```text
POST /prose/generate
GET /scenes/:sceneId/generated-prose
GET /runs/:runId/prose-draft
```

已有端点已经足够：

```text
POST /api/projects/{projectId}/runs/{runId}/review-decisions
GET  /api/projects/{projectId}/runs/{runId}/artifacts/{artifactId}
GET  /api/projects/{projectId}/runs/{runId}/trace
GET  /api/projects/{projectId}/scenes/{sceneId}/prose
```

PR29 的重点是把这些端点背后的 read model 连接起来。

### 4.6 request-rewrite / reject 不应生成或覆盖 prose

只有 `accept` / `accept-with-edit` 可以 materialize prose。

规则：

```text
accept            -> canon patch + prose draft + scene prose update
accept-with-edit  -> canon patch + prose draft + scene prose update
request-rewrite   -> run back to running, no prose materialization
reject            -> run completed/rejected, no prose materialization
```

---

## 5. 推荐数据合同改法

### 5.1 给 ProseDraftArtifactDetailRecord 增加 body

当前 `ProseDraftArtifactDetailRecord` 只有：

```ts
excerpt: LocalizedTextRecord
wordCount: number
```

PR29 建议新增：

```ts
body?: LocalizedTextRecord
```

规则：

- `body` 是 prose materialization 的来源。
- `excerpt` 继续用于列表、summary、dock、compact card。
- 如果旧 fixture 没有 `body`，mapper 可 fallback 到 `excerpt`。
- `body` 不进入 run event。

需要同步修改：

```text
packages/api/src/contracts/api-records.ts
packages/renderer/src/features/run/api/run-artifact-records.ts
```

### 5.2 新增 prose materialization mapper

推荐新增：

```text
packages/api/src/orchestration/sceneRun/sceneRunProseMaterialization.ts
```

建议导出：

```ts
export interface MaterializeSceneProseFromRunInput {
  proseDraft: ProseDraftArtifactDetailRecord
  canonPatch?: CanonPatchArtifactDetailRecord
  proposalSet?: ProposalSetArtifactDetailRecord
}

export function buildSceneProseFromProseDraftArtifact(
  input: MaterializeSceneProseFromRunInput,
): Pick<SceneProseViewModel,
  | 'proseDraft'
  | 'draftWordCount'
  | 'statusLabel'
  | 'latestDiffSummary'
  | 'traceSummary'
>
```

映射规则：

```text
proseDraft       <- proseDraft.body?.en ?? proseDraft.excerpt.en
 draftWordCount  <- proseDraft.wordCount
 statusLabel     <- proseDraft.statusLabel.en 或 `Generated from ${proseDraft.id}`
 latestDiffSummary <- proseDraft.summary.en
 traceSummary.sourcePatchId <- proseDraft.sourceCanonPatchId
 traceSummary.sourceProposals <- proseDraft.sourceProposalIds + selectedVariants summary
 traceSummary.acceptedFactIds <- canonPatch.acceptedFacts[].id
 traceSummary.relatedAssets <- proseDraft.relatedAssets
 traceSummary.missingLinks <- []
```

注意：

- API 侧当前 `SceneProseViewModel` 是 localized 后的 string view-model，不要把 `LocalizedTextRecord` 直接塞进去。
- 第一版可以按现有 fixture API 的默认语言约定使用英文字符串；如果当前 API 已有 locale query，再按现有 locale 处理，不要在 PR29 新开 locale 架构。

### 5.3 accepted facts 同步到 scene execution / inspector

推荐新增 helper：

```ts
export function buildAcceptedFactsFromCanonPatch(
  canonPatch: CanonPatchArtifactDetailRecord,
): SceneAcceptedFactModel[]
```

同步目标：

```text
scene.execution.acceptedSummary.acceptedFacts
scene.execution.acceptedSummary.readiness = 'ready'
scene.execution.acceptedSummary.pendingProposalCount = 0
scene.inspector.context.acceptedFacts
```

这样用户在 Scene / Orchestrate 和 Scene / Draft 两边都能看到 prose 来源不是孤立文本。

---

## 6. API / fixture repository 改法

### 6.1 修改 `buildProseDraftDetail(...)`

文件：

```text
packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts
```

要做：

- 保留当前 `excerpt`。
- 新增 `body`。
- `body` 内容应根据 sceneName、accepted proposal、selected variant 做 deterministic fixture 文本。
- 不调用真实模型。

建议第一版 body 结构：

```text
Paragraph 1: scene setup / arrival beat
Paragraph 2: selected variant effect / reveal pressure
Paragraph 3: closing beat linked to accepted canon
```

如果 `selectedVariants` 存在，body 中至少体现一个 variant label / rationale 的影响；如果没有，使用 default proposal path。

### 6.2 在 run store 暴露 materialization 所需 artifact detail

当前 `runFixtureStore` 内部已经有 `artifactDetailsById`，但 `FixtureRepository` 只能通过公开接口拿：

```ts
listRunArtifacts(projectId, runId)
getRunArtifact(projectId, runId, artifactId)
getRunTrace(projectId, runId)
```

PR29 推荐新增一个内部 helper，而不是把 `RunState` 整个暴露出来：

```ts
function getLatestRunArtifactDetail<TKind extends RunArtifactKind>(
  projectId: string,
  runId: string,
  kind: TKind,
): Extract<RunArtifactDetailRecord, { kind: TKind }> | null
```

可以放在 `fixtureRepository.ts` 内部，通过 `runStore.listRunArtifacts(...)` + `runStore.getRunArtifact(...)` 实现；不一定要扩 `RunFixtureStore` public interface。

### 6.3 修改 `syncSceneSurfacesFromRun(...)`

文件：

```text
packages/api/src/repositories/fixtureRepository.ts
```

当前它会同步 run status 到 scene workspace / execution / prose summary。

PR29 要增加：

```ts
if (run.status === 'completed') {
  const proseDraft = getLatestRunArtifactDetail(projectId, run.id, 'prose-draft')
  const canonPatch = getLatestRunArtifactDetail(projectId, run.id, 'canon-patch')
  const proposalSet = getLatestRunArtifactDetail(projectId, run.id, 'proposal-set')

  if (proseDraft) {
    scene.prose = {
      ...scene.prose,
      ...buildSceneProseFromProseDraftArtifact({ proseDraft, canonPatch, proposalSet }),
      focusModeAvailable: true,
      revisionQueueCount: 0,
      warningsCount: proseDraft.relatedAssets.length ? scene.prose.warningsCount : scene.prose.warningsCount,
    }
  }

  if (canonPatch) {
    scene.execution.acceptedSummary.acceptedFacts = buildAcceptedFactsFromCanonPatch(canonPatch)
    scene.inspector.context.acceptedFacts = buildAcceptedFactsFromCanonPatch(canonPatch)
  }
}
```

注意：

- `request-rewrite` 回到 running 时不覆盖 prose。
- `reject` completed 但没有 prose-draft artifact，因此不会覆盖 prose。
- 第二次 accepted run 允许覆盖当前 scene prose，这正好表达“latest accepted run produced current draft”。

### 6.4 修改 `syncChapterSceneMetadataFromRun(...)`

同文件：

```text
packages/api/src/repositories/fixtureRepository.ts
```

当前它更新：

```text
runStatusLabel
lastRunLabel
```

PR29 需要在 run accepted/materialized 时同步：

```text
proseStatusLabel = Generated / Updated from run
```

建议规则：

```ts
if (run.status === 'completed' && hasProseDraftArtifact) {
  proseStatusLabel.en = 'Generated from accepted run'
  proseStatusLabel['zh-CN'] = '已由获批运行生成'
}
```

如果当前 helper 不方便拿 `hasProseDraftArtifact`，可在 `syncRunMutations(...)` 内先计算一次 accepted materialization result，再传给 scene/chapter sync helpers。

### 6.5 不要碰真实 endpoint 数量

不要新增 route。只让这些已有 route 返回更新后的状态：

```text
GET /api/projects/:projectId/scenes/:sceneId/prose
GET /api/projects/:projectId/scenes/:sceneId/execution
GET /api/projects/:projectId/scenes/:sceneId/inspector
GET /api/projects/:projectId/chapters/:chapterId/structure
```

---

## 7. Renderer 改法

### 7.1 扩展 review decision mutation 的 query invalidation

文件：

```text
packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts
```

当前成功后只刷新：

```text
run detail
run events
run artifacts
run trace
```

PR29 应在 `onSuccess(run)` 中，如果 `run.scope === 'scene'`，继续 invalidate：

```text
scene workspace
scene execution
scene prose
scene inspector
scene dock summary / active dock data
chapter workspace queries（可先 broad invalidate）
book workspace / draft queries（可先 broad invalidate）
traceability scene sources（如已有 query key 可用）
```

推荐做法：

```ts
if (run.scope === 'scene') {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.workspace(run.scopeId), refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.execution(run.scopeId), refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.prose(run.scopeId), refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.inspector(run.scopeId), refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.dock(run.scopeId), refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: chapterQueryKeys.all, refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: bookQueryKeys.all, refetchType: 'active' }),
  ])
}
```

如果 `chapterQueryKeys` / `bookQueryKeys` 没有统一 `all`，先补 `all`，不要用字符串散落 invalidation。

不要在 renderer 里手动 patch scene prose cache。让 API read model 成为真源。

### 7.2 SceneProseTab 显示最小 source summary

文件：

```text
packages/renderer/src/features/scene/components/SceneProseTab.tsx
```

如果当前 `SceneProseTab` 已显示 `traceSummary`，只补测试即可。否则 PR29 建议新增一块轻量 source strip：

```text
Generated from: {sourcePatchId}
Source proposals: N
Related assets: Ren Voss, Midnight Platform
Missing links: none / needs trace
```

不要做完整 trace graph；完整来源仍在 Run Trace / Artifact Inspector。

### 7.3 Scene Dock review gate 保持原交互

不要重写 Review Gate UI。

只确认：

- selected variants 在 accept / accept-with-edit 时仍传给 `submitRunReviewDecision`。
- mutation success 后 Scene / Draft query 会 refetch。
- Review Gate 不直接写 scene prose。

### 7.4 Chapter / Book Draft 不做新 UI，只靠 existing aggregation 验证

PR29 不要改 Chapter Draft / Book Draft 的主舞台 UI。

只要求：

- 它们通过现有 `scene prose query` / `book workspace sources` 读到新的 prose。
- 如果 active query 没自动刷新，通过 query invalidation 解决。
- 不新增 chapter/book 专用 prose mutation。

---

## 8. 建议文件改动

### 8.1 API package

```text
packages/api/src/contracts/api-records.ts
packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts
packages/api/src/orchestration/sceneRun/sceneRunProseMaterialization.ts      # 新增，推荐
packages/api/src/orchestration/sceneRun/sceneRunProseMaterialization.test.ts # 新增，推荐
packages/api/src/repositories/fixtureRepository.ts
packages/api/src/createServer.run-flow.test.ts
packages/api/src/createServer.run-artifacts.test.ts
packages/api/src/repositories/runFixtureStore.test.ts
```

### 8.2 Renderer package

```text
packages/renderer/src/features/run/api/run-artifact-records.ts
packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts
packages/renderer/src/features/run/hooks/useRunHooks.test.tsx
packages/renderer/src/features/scene/components/SceneProseTab.tsx            # 仅 source summary 需要时
packages/renderer/src/features/scene/components/SceneProseTab.test.tsx       # 若已有则更新
packages/renderer/src/features/scene/containers/SceneProseContainer.test.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.test.tsx
packages/renderer/src/features/chapter/containers/ChapterDraftWorkspace.test.tsx # 推荐
packages/renderer/src/features/book/containers/BookDraftWorkspace.test.tsx       # 推荐
```

### 8.3 Docs / Stories

```text
doc/PR29-scene-prose-generation-vertical-slice-execution-plan.md
README.md（只更新 Current status / Next focus，保持最小）
doc/api-contract.md（补 ProseDraftArtifactDetailRecord.body，如采用）
packages/renderer/src/features/scene/containers/SceneProseContainer.stories.tsx
packages/renderer/src/features/run/components/RunArtifactInspectorPanel.stories.tsx
```

---

## 9. 测试计划

### 9.1 API pure mapper tests

新增：

```text
sceneRunProseMaterialization.test.ts
```

至少覆盖：

1. prose-draft artifact 的 `body` 会映射到 `SceneProseViewModel.proseDraft`。
2. 没有 `body` 时 fallback 到 `excerpt`。
3. `sourceCanonPatchId` 映射到 `traceSummary.sourcePatchId`。
4. `sourceProposalIds` / selected variants 能映射到 `traceSummary.sourceProposals`。
5. `relatedAssets` 能映射到 `traceSummary.relatedAssets`。
6. canon patch accepted facts 能映射到 scene accepted facts。
7. mapper 不读取 run events 的大 payload。

### 9.2 API run-flow tests

修改或新增：

```text
packages/api/src/createServer.run-flow.test.ts
```

至少覆盖：

#### A. accept materializes prose

```text
POST /scenes/:sceneId/runs
-> GET proposal-set artifact, pick variant
-> POST /runs/:runId/review-decisions decision=accept selectedVariants=[...]
-> GET /scenes/:sceneId/prose
-> proseDraft exists
-> draftWordCount > 0
-> traceSummary.sourcePatchId exists
-> traceSummary.sourceProposals includes selected proposal
-> traceSummary.relatedAssets exists
```

#### B. accept-with-edit materializes prose

```text
same as above, but decision=accept-with-edit
-> proseDraft exists
-> latestDiffSummary mentions editorial adjustment or accepted edit path
```

#### C. reject does not materialize prose

```text
POST review decision reject
-> no new proseDraft materialized from that run
-> run completed/rejected
-> no prose_generated event
```

#### D. request-rewrite does not materialize prose

```text
POST review decision request-rewrite
-> run returns to running
-> no proseDraft materialized
-> no canon_patch_applied / prose_generated events
```

#### E. events stay lightweight

```text
GET /runs/:runId/events
-> prose_generated event refs prose-draft artifact
-> metadata does not include prose body / context body
```

#### F. chapter metadata updates

```text
After accepted run
-> GET /chapters/:chapterId/structure
-> matching scene row proseStatusLabel changed to generated/updated
-> runStatusLabel / lastRunLabel still updated
```

### 9.3 Artifact tests

修改：

```text
packages/api/src/createServer.run-artifacts.test.ts
```

至少覆盖：

1. prose-draft artifact detail has `body` and `excerpt`.
2. prose-draft artifact retains selected variants.
3. canon-patch artifact and prose-draft artifact share source proposal / variant relation.
4. context-packet activation trace from PR28 still works.
5. proposal-set variant rendering from PR27 still works.

### 9.4 Renderer mutation tests

修改：

```text
packages/renderer/src/features/run/hooks/useRunHooks.test.tsx
# 或 useSubmitRunReviewDecisionMutation.test.tsx（如拆分）
```

至少覆盖：

1. submit review decision success sets run detail cache.
2. invalidates run events / artifacts / trace.
3. when returned run scope is `scene`, invalidates scene workspace / execution / prose / inspector / dock.
4. invalidates chapter/book aggregate queries broadly or via known keys.
5. write error classification behavior不退化。

### 9.5 Renderer scene tests

#### `SceneDockContainer.test.tsx`

```text
打开 Scene / Orchestrate
-> proposal-set artifact 选择 variant
-> submit accept
-> mutation success 后 prose query 被刷新
-> Open prose / 切到 Scene Draft 后能看到 generated prose
```

如果测试环境不适合完整 route 切换，至少验证：

- submit decision 的 selectedVariants payload 没丢。
- onSuccess invalidation 覆盖 scene prose query。

#### `SceneProseContainer.test.tsx`

```text
给定 SceneProseViewModel.proseDraft + traceSummary
-> prose 文本渲染
-> source patch / related assets summary 渲染
-> no prose 时仍显示 quiet empty state
```

### 9.6 Chapter / Book aggregation smoke（推荐）

PR29 最值钱的集成测试是证明 prose 不止出现在 artifact inspector 里。

#### Chapter Draft

```text
accept scene run
-> GET scene prose returns generated text
-> ChapterDraftWorkspace renders selected scene section with generated text
```

#### Book Draft

```text
accept scene run
-> BookDraftWorkspace read view includes generated prose in the relevant chapter/scene section
```

如果当前测试成本过高，可以先写 hook-level test，确保 book/chapter draft aggregation 使用 refetched scene prose view-model。

---

## 10. Storybook 要求

新增或更新：

```text
SceneProseContainer.stories.tsx
SceneDockContainer.stories.tsx
RunArtifactInspectorPanel.stories.tsx
ChapterDraftWorkspace.stories.tsx（可选）
BookDraftWorkspace.stories.tsx（可选）
```

最少 story 组合：

- `SceneProseGeneratedFromRun`
- `SceneProseWithTraceSummary`
- `RunAcceptedWithSelectedVariant`
- `ProseDraftArtifactWithBody`
- `ChapterDraftAfterAcceptedRun`（可选）
- `BookDraftAfterAcceptedRun`（可选）

---

## 11. 实施顺序（给 AI 的执行顺序）

### Step 1：先补 prose artifact body contract

- 修改 API `ProseDraftArtifactDetailRecord`，增加 `body?: LocalizedTextRecord`。
- 修改 renderer `ProseDraftArtifactDetailRecord`，同步增加 `body?: LocalizedTextRecord`。
- 修改 `buildProseDraftDetail(...)`，生成 deterministic fixture body。
- 不碰 event payload。

### Step 2：先写 pure materialization mapper

- 新增 `sceneRunProseMaterialization.ts`。
- 把 artifact -> scene prose / accepted facts 的映射写成纯函数。
- 先补 mapper tests。

### Step 3：接入 fixture repository sync

- 修改 `fixtureRepository.ts`。
- 在 `submitRunReviewDecision(...)` 成功后，通过 run artifacts 找到 `prose-draft` / `canon-patch` / `proposal-set` detail。
- 只有 `accept` / `accept-with-edit` 且存在 prose-draft artifact 时更新 `scene.prose`。
- 同步 scene execution accepted facts / inspector accepted facts。
- 同步 chapter scene row 的 `proseStatusLabel`。

### Step 4：补 API tests

- `createServer.run-flow.test.ts`
- `createServer.run-artifacts.test.ts`
- `runFixtureStore.test.ts`

确保：

- accept path 能 materialize prose。
- reject / rewrite 不 materialize prose。
- events 仍轻量。
- selected variants 不丢。

### Step 5：扩 renderer query invalidation

- 修改 `useSubmitRunReviewDecisionMutation.ts`。
- success 后除了 run queries，也刷新 scene/chapter/book active queries。
- 不手动 patch scene prose cache。

### Step 6：Scene Draft source summary（若缺失）

- `SceneProseTab` 显示 `traceSummary` 的最小 source strip。
- 不做完整 trace graph。

### Step 7：补 renderer tests / stories

- mutation invalidation tests
- SceneProseContainer tests
- SceneDockContainer smoke
- stories

### Step 8：文档回归

- 新增本 PR 文档到 `doc/PR29-scene-prose-generation-vertical-slice-execution-plan.md`。
- 更新 `doc/api-contract.md` 的 prose-draft artifact detail。
- README 只做 current status 最小更新。

### Step 9：最终检查

运行：

```bash
pnpm typecheck
pnpm test
pnpm --filter @narrative-novel/renderer build-storybook
```

如果 build-storybook 太慢或 CI 未要求，可至少保证新增/修改 story 能在本地 Storybook 中打开。

---

## 12. 完成后的验收标准

满足以下条件，PR29 就算完成：

1. `prose-draft` artifact detail 有可 materialize 的 body 或可靠 fallback。
2. `accept` / `accept-with-edit` review decision 会生成 canon-patch + prose-draft artifact，并 materialize 到 scene prose read model。
3. `request-rewrite` / `reject` 不会生成或覆盖 scene prose。
4. Scene / Draft 能显示本次 accepted run 生成的 prose。
5. Scene prose 的 trace summary 能说明 source patch / source proposals / related assets。
6. selected proposal variant 在 proposal-set / canon-patch / prose-draft / scene prose source summary 中不丢。
7. Chapter structure scene row 的 prose status 会随 accepted run 更新。
8. Chapter Draft / Book Draft 能通过现有 aggregation 读到更新后的 scene prose。
9. `prose_generated` event 仍只带 refs / lightweight metadata，不内联 prose body。
10. `useSubmitRunReviewDecisionMutation` 会刷新 run + scene + chapter/book aggregate queries。
11. PR28 context-packet asset activation trace 不退化。
12. PR27 proposal variants review flow 不退化。
13. PR29 不包含真实 LLM、Temporal、SSE、prompt editor、policy mutation、recipes、spatial blackboard。

---

## 13. PR29 结束时不要留下的债

以下情况都算 PR 做偏了：

- `proseDraft` 是直接硬编码进 scene fixture，而不是来自 prose-draft artifact。
- event metadata 里塞了正文全文。
- selected variants 在 canon patch 或 prose draft 中丢失。
- Scene Draft 能看到正文，但 trace/artifact surfaces 解释不了来源。
- accept / reject / rewrite 三条 review decision 分支语义混乱。
- renderer 手动 patch scene prose cache，导致 API read model 不是真源。
- Chapter / Book draft 需要专门写另一套 prose 数据来源。
- 为了 PR29 新增 route 参数或 endpoint。
- 顺手开始做真实 LLM / Temporal / SSE。

PR29 做完后的正确项目状态应该是：

**系统仍是 fixture-backed API + renderer workbench，但 selected proposal variant 已经能通过 review/canon/prose/trace 变成可阅读正文，最小文字生成闭环成立。**

---

## 14. PR30–PR31 后续建议（只保留，不在本轮实施）

### PR30：Prose Review / Rewrite / Revision Closure

在 PR29 prose materialization 成立后，再把 Scene Prose 的 revise/rewrite 做成 API-backed write path：

- `reviseSceneProse(...)` 不再是空实现。
- revision 产生新的 prose artifact 或 revision artifact。
- revision 保留 source prose / source patch。
- revision 不直接改 canon，除非走 review decision。

明确不做：真实 LLM、branch、publish。

### PR31：Chapter / Book Draft Assembly Regression

把 PR29/PR30 的 scene prose 更新，系统性固定到上层装配：

- Chapter Draft assembled text coverage。
- Book Draft read / compare source signature。
- Export readiness / review inbox 的 draft completeness signals。
- run accepted 后上层聚合不 stale。

明确不做：full publish、spatial blackboard、Blender。

### PR32 以后：Spatial Blackboard Data Foundation

只有当文字闭环稳定后，再进入 spatial blackboard 的纯数据 / pure solver 版本。不要在 PR29–PR31 把空间系统提前塞进文字闭环。

---

## 15. 给 AI 的最终一句话指令

在当前 `codex/pr28-asset-context-policy` 已完成 PR28 的前提下，不要继续抛光 context policy，也不要提前做真实 LLM / Temporal / SSE / prompt editor；先只围绕 **Scene Prose Generation Vertical Slice** 做一轮窄而实的实现：

- 给 `prose-draft` artifact detail 补可 materialize 的 body。
- 用纯 mapper 把 prose-draft / canon-patch / proposal-set 映射成 `SceneProseViewModel` 与 accepted facts。
- 在 fixture repository 的 accepted review transition 后，把 prose artifact materialize 到 scene prose read model。
- 保持 run events 只携带轻量 refs / metadata。
- 让 renderer review-decision mutation 刷新 scene/chapter/book 相关 queries。
- 让 Scene Draft 能读到 generated prose，Chapter Draft / Book Draft 能通过现有 aggregation 读到同一份 scene prose。
- 用 API tests、renderer tests、Storybook 和 smoke 固定 `selected variant -> canon patch -> prose draft -> scene prose -> trace` 这条最小闭环。
- 明确不做真实 LLM、policy mutation、recipes、branch/publish、Temporal、SSE、Spatial Blackboard。
>>>>>>> codex/desktop-thin-shell-runtime
