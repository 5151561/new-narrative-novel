# BE-PR3 执行文档：Run Artifact & Trace Read Surfaces

## 这份文档的目的

这是一份基于当前 `codex/be-pr2-scene-run-workflow-skeleton` 分支真实代码状态整理出来的、可以直接交给 AI agent 执行的后端 PR 计划。

BE-PR3 的任务不是继续扩 workflow，也不是提前接真实 Temporal / SSE / DB / LLM，而是补上 BE-PR2 之后最关键的一层：

**让 run event 里已经出现的 `refs` 变成可读取、可审阅、可追溯的产品级 artifact / trace read surface。**

一句话判断：

**BE-PR2 已经让 Scene Run 能跑、能产生事件、能进入 review gate；BE-PR3 应该让这些事件背后的 context / proposal / canon / prose 来源可以被 API 读取，而不是只停留在 event timeline 上。**

---

## 一、先确认当前代码基线

当前分支里，BE-PR2 已经完成了很重要的骨架，不应回头重做。

### 1. API package 已经接进 monorepo

当前仓库已经不再只有 renderer。根 README 中已经暴露：

- `@narrative-novel/api`
- `@narrative-novel/renderer`
- `pnpm dev:api`
- `pnpm dev:renderer`
- `pnpm typecheck`
- `pnpm test`

也就是说，后端 contract 已经开始成为项目的一等部分。

### 2. run route 已经存在

当前 `packages/api/src/routes/run.ts` 已经有这些 endpoint：

- `POST /api/projects/:projectId/scenes/:sceneId/runs`
- `GET /api/projects/:projectId/runs/:runId`
- `GET /api/projects/:projectId/runs/:runId/events`
- `GET /api/projects/:projectId/runs/:runId/events/stream`（当前仍是 501）
- `POST /api/projects/:projectId/runs/:runId/review-decisions`

BE-PR3 不需要重新定义 start run / get run / get events / submit review decision 的基础语义。

### 3. run contract 已经有正确的事件与引用方向

当前 `api-records.ts` 里已经有：

- `RunRecord`
- `RunEventRecord`
- `RunEventKind`
- `RunEventRefKind`
- `RunReviewDecisionKind`

并且 `RunEventKind` 已经包含：

- `context_packet_built`
- `agent_invocation_started`
- `agent_invocation_completed`
- `proposal_created`
- `review_requested`
- `review_decision_submitted`
- `canon_patch_applied`
- `prose_generated`
- `run_completed`

`RunEventRefKind` 也已经包含：

- `context-packet`
- `agent-invocation`
- `proposal-set`
- `review`
- `canon-patch`
- `prose-draft`
- `artifact`

这说明 PR23 / BE-PR2 已经把 “event 不内联大 payload，而是引用 artifact / context / proposal” 的方向打下来了。

### 4. SceneRunWorkflow 已经能产生 waiting_review run

当前 `sceneRunWorkflow.ts` 已经能在 start run 时创建：

- run id
- review id
- context packet artifact
- planner agent invocation artifact
- writer agent invocation artifact
- proposal-set artifact

并按顺序产生事件：

```text
run_created
run_started
context_packet_built
agent_invocation_started
agent_invocation_completed
agent_invocation_started
agent_invocation_completed
proposal_created
review_requested
```

最终 run 进入：

```text
status = waiting_review
pendingReviewId = reviewId
```

### 5. Review decision transitions 已经成立

当前 `sceneRunTransitions.ts` 已经支持：

- `accept`
- `accept-with-edit`
- `request-rewrite`
- `reject`

其中：

- accept / accept-with-edit 会产生 `canon_patch_applied`、`prose_generated`、`run_completed`
- request-rewrite 会让 run 回到 `running`
- reject 会产生 review decision 与 completed event

这说明 BE-PR3 不应该重做 review gate，而应让 review gate 的产物可读、可追溯。

### 6. RunFixtureStore 已经是当前产品状态桥

当前 `runFixtureStore.ts` 已经负责：

- start scene run
- 保存 run / events / artifacts
- event pagination
- review decision transition

`fixtureRepository.ts` 还会在 run mutation 后同步 scene / chapter surfaces，例如：

- scene workspace latestRunId / runStatus
- scene execution runtime summary
- scene prose status / diff summary
- inspector runtime
- chapter scene metadata runStatusLabel / lastRunLabel

这说明 BE-PR2 已经不是纯内存 demo，它已经开始影响产品 surface。

---

## 二、BE-PR3 的唯一目标

**把 BE-PR2 产生的 run event refs 升级成可读取的 artifact detail 与 trace read surface。**

BE-PR3 完成后，调用方应该能完成下面这些动作：

1. start scene run。
2. 从 event timeline 看到 `context-packet / agent-invocation / proposal-set / review` refs。
3. 通过 API 读取这些 refs 对应的 artifact detail。
4. submit review decision。
5. 如果 accept / accept-with-edit，能读取：
   - canon patch detail
   - prose draft detail
   - proposal -> canon patch -> prose draft 的 trace links
6. 如果 request-rewrite / reject，能看到对应 review decision event，但不会伪造 canon / prose artifact。

一句话说：

**BE-PR3 要把 run timeline 从“事件列表”推进到“可审阅的运行证据链”。**

---

## 三、本轮明确不做

为避免 BE-PR3 失控，以下内容不要混进来：

- 不接真实 Temporal。
- 不接真实 SSE / EventSource。
- 不接真实 DB。
- 不接真实 LLM。
- 不做 model provider adapter。
- 不做完整 Context Packet Inspector UI。
- 不做 Proposal Variants UI。
- 不做 branch / checkpoint / publish。
- 不做真实 artifact store / object store。
- 不做 run event streaming 的生产实现。
- 不改 scene / chapter / asset / book 的 route 语义。
- 不把 artifact detail 塞回 `RunEventRecord` 大 payload。
- 不把 Temporal history、LLM raw transcript、prompt 全文作为产品 truth。

BE-PR3 仍然是 fixture-backed API contract PR，不是 orchestration runtime PR。

---

## 四、必须遵守的硬约束

### 4.1 RunEventRecord 继续保持轻量

不要把这些东西内联进 event：

- prompt 全文
- context packet 全文
- 模型原始输出
- prose 全文
- trace graph 大对象

`RunEventRecord` 只保留：

- `id`
- `runId`
- `kind`
- `title`
- `summary`
- `createdAtLabel`
- `status`
- `refs`

大 payload 必须通过 artifact / trace endpoint 读取。

### 4.2 artifact detail 是产品级 read model，不是 raw debug log

BE-PR3 不是做 full debugger。

Artifact detail 应该回答产品问题：

- 本次 run 使用了哪些上下文？
- 哪个 agent 产出了什么结构化结果？
- proposal-set 里有哪些可审阅变化？
- accept 后哪些 facts 进入 canon patch？
- prose draft 来自哪个 canon patch / proposal？

不要把它做成：

- 原始 prompt dump
- token log
- raw LLM transcript
- Temporal history mirror

### 4.3 trace link 必须显式，不靠字符串推断

本轮所有 trace 都来自 fixture / workflow 明确写入的 metadata。

不要做：

- 根据 prose 文本匹配 asset 名称
- 根据 proposal 文案猜 canon fact
- 根据 summary 文案猜 source

正确做法是：

- proposal-set artifact 明确引用 source agent invocation
- canon-patch artifact 明确引用 accepted proposal ids
- prose-draft artifact 明确引用 source canon patch id
- trace endpoint 读取这些显式关系

### 4.4 不改变已成立的 review transition 行为

BE-PR3 可以增强 review transition 产生的 artifact detail，但不应改动：

- accept 的状态流
- accept-with-edit 的状态流
- request-rewrite 的状态流
- reject 的状态流

除非现有测试暴露真实 bug，否则不要重写 transition。

### 4.5 run store 可以增强，但不要替换成 DB

当前 `RunFixtureStore` 仍然是本轮正确落点。

可以新增：

- artifact detail index
- trace link index
- artifact list / lookup 方法
- trace lookup 方法

不要在 BE-PR3 引入：

- Prisma / Drizzle schema
- migrations
- external artifact store
- filesystem persistence

---

## 五、API 设计

### 5.1 新增：列出 run artifacts

```http
GET /api/projects/:projectId/runs/:runId/artifacts
```

返回：

```ts
interface RunArtifactListResponse {
  runId: string
  artifacts: RunArtifactSummaryRecord[]
}
```

用途：

- 让前端不必只从 event refs 拼 artifact 列表。
- 支持未来 Run Debug Dock / Context Packet Inspector。

### 5.2 新增：读取单个 artifact detail

```http
GET /api/projects/:projectId/runs/:runId/artifacts/:artifactId
```

返回：

```ts
interface RunArtifactDetailResponse {
  artifact: RunArtifactDetailRecord
}
```

错误规则：

- run 不存在：404
- artifact 不属于该 run：404
- artifact kind 未支持：500 或 typed fallback，建议不要出现

### 5.3 新增：读取 run trace summary

```http
GET /api/projects/:projectId/runs/:runId/trace
```

返回：

```ts
interface RunTraceResponse {
  runId: string
  links: RunTraceLinkRecord[]
  nodes: RunTraceNodeRecord[]
  summary: {
    proposalSetCount: number
    canonPatchCount: number
    proseDraftCount: number
    missingTraceCount: number
  }
}
```

用途：

- 让 UI 可以直接展示“proposal -> canon -> prose”的最小来源链。
- 不要求本轮做复杂 graph。

### 5.4 不实现真实 stream

当前：

```http
GET /api/projects/:projectId/runs/:runId/events/stream
```

仍可保持 501。

如果要改文案，把旧的 “BE-PR1” 改成更中性的：

```json
{
  "error": "Run event streaming is not implemented in the fixture API. Use paginated events for now."
}
```

不要在 BE-PR3 接真实 SSE。

---

## 六、类型设计

建议修改：

```text
packages/api/src/contracts/api-records.ts
```

或新增更窄的 contract 文件后再从 `api-records.ts` re-export。若当前项目倾向集中 contract，则先集中在 `api-records.ts`。

### 6.1 Artifact summary

```ts
export type RunArtifactKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'canon-patch'
  | 'prose-draft'

export interface RunArtifactSummaryRecord {
  id: string
  runId: string
  kind: RunArtifactKind
  title: LocalizedText
  summary: LocalizedText
  statusLabel: LocalizedText
  createdAtLabel: LocalizedText
  sourceEventIds: string[]
}
```

### 6.2 Artifact detail union

```ts
export type RunArtifactDetailRecord =
  | ContextPacketArtifactDetailRecord
  | AgentInvocationArtifactDetailRecord
  | ProposalSetArtifactDetailRecord
  | CanonPatchArtifactDetailRecord
  | ProseDraftArtifactDetailRecord
```

### 6.3 Context packet detail

```ts
export interface ContextPacketArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'context-packet'
  sceneId: string
  sections: Array<{
    id: string
    title: LocalizedText
    summary: LocalizedText
    itemCount: number
  }>
  includedCanonFacts: Array<{
    id: string
    label: LocalizedText
    value: LocalizedText
  }>
  includedAssets: Array<{
    assetId: string
    kind: 'character' | 'location' | 'rule'
    label: LocalizedText
    reason: LocalizedText
  }>
  excludedPrivateFacts: Array<{
    id: string
    label: LocalizedText
    reason: LocalizedText
  }>
  outputSchemaLabel: LocalizedText
  tokenBudgetLabel: LocalizedText
}
```

### 6.4 Agent invocation detail

```ts
export type SceneRunAgentRole = 'scene-planner' | 'scene-writer'

export interface AgentInvocationArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'agent-invocation'
  agentRole: SceneRunAgentRole
  modelLabel: LocalizedText
  inputSummary: LocalizedText
  outputSummary: LocalizedText
  contextPacketId?: string
  outputSchemaLabel: LocalizedText
  generatedRefs: Array<{
    kind: 'proposal-set' | 'artifact'
    id: string
    label: LocalizedText
  }>
}
```

### 6.5 Proposal set detail

```ts
export interface ProposalSetArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'proposal-set'
  reviewId: string
  sourceInvocationIds: string[]
  proposals: Array<{
    id: string
    title: LocalizedText
    summary: LocalizedText
    changeKind: 'action' | 'reveal' | 'state-change' | 'continuity-note'
    riskLabel: LocalizedText
    relatedAssets: Array<{
      assetId: string
      label: LocalizedText
      kind: 'character' | 'location' | 'rule'
    }>
  }>
  reviewOptions: Array<{
    decision: RunReviewDecisionKind
    label: LocalizedText
    description: LocalizedText
  }>
}
```

### 6.6 Canon patch detail

```ts
export interface CanonPatchArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'canon-patch'
  decision: Extract<RunReviewDecisionKind, 'accept' | 'accept-with-edit'>
  sourceProposalSetId: string
  acceptedProposalIds: string[]
  acceptedFacts: Array<{
    id: string
    label: LocalizedText
    value: LocalizedText
    sourceProposalIds: string[]
    relatedAssets: Array<{
      assetId: string
      label: LocalizedText
      kind: 'character' | 'location' | 'rule'
    }>
  }>
  traceLinkIds: string[]
}
```

### 6.7 Prose draft detail

```ts
export interface ProseDraftArtifactDetailRecord extends RunArtifactSummaryRecord {
  kind: 'prose-draft'
  sourceCanonPatchId: string
  sourceProposalIds: string[]
  excerpt: LocalizedText
  wordCount: number
  relatedAssets: Array<{
    assetId: string
    label: LocalizedText
    kind: 'character' | 'location' | 'rule'
  }>
  traceLinkIds: string[]
}
```

### 6.8 Trace link records

```ts
export type RunTraceNodeKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'proposal'
  | 'review'
  | 'canon-patch'
  | 'canon-fact'
  | 'prose-draft'
  | 'asset'

export type RunTraceRelation =
  | 'used_context'
  | 'generated'
  | 'proposed'
  | 'reviewed_by'
  | 'accepted_into'
  | 'rendered_as'
  | 'mentions'

export interface RunTraceNodeRecord {
  id: string
  kind: RunTraceNodeKind
  label: LocalizedText
}

export interface RunTraceLinkRecord {
  id: string
  from: {
    kind: RunTraceNodeKind
    id: string
  }
  to: {
    kind: RunTraceNodeKind
    id: string
  }
  relation: RunTraceRelation
  label: LocalizedText
}
```

---

## 七、数据与 fixture 层改法

### 7.1 新增 artifact detail builder

推荐新增：

```text
packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts
```

职责：

- 接收 run input / sequence / existing artifact summary。
- 生成 typed artifact detail。
- 不依赖 route / repository。
- 不访问真实 DB。

建议导出：

```ts
buildContextPacketDetail(...)
buildAgentInvocationDetail(...)
buildProposalSetDetail(...)
buildCanonPatchDetail(...)
buildProseDraftDetail(...)
```

### 7.2 新增 trace builder

推荐新增：

```text
packages/api/src/orchestration/sceneRun/sceneRunTraceLinks.ts
```

职责：

- 根据 current artifacts / decision 生成 trace nodes / links。
- 保持纯函数。

建议导出：

```ts
buildInitialRunTrace(...)
buildAcceptedRunTrace(...)
buildRejectedRunTrace(...)
buildRewriteRunTrace(...)
```

第一版可以简单：

- context packet -> planner invocation：`used_context`
- context packet -> writer invocation：`used_context`
- planner invocation -> proposal set：`generated`
- proposal set -> review：`reviewed_by`
- proposal -> canon fact：`accepted_into`
- canon patch -> prose draft：`rendered_as`
- canon fact / prose draft -> asset：`mentions`

### 7.3 增强 run state

当前 run store 内部状态应扩展为：

```ts
interface StoredRunState {
  run: RunRecord
  events: RunEventRecord[]
  artifacts: RunArtifactSummaryRecord[]
  artifactDetailsById: Map<string, RunArtifactDetailRecord>
  traceNodesById: Map<string, RunTraceNodeRecord>
  traceLinksById: Map<string, RunTraceLinkRecord>
}
```

如果当前内部类型已有 `artifacts` 数组，可以保留并新增 detail / trace indexes。

### 7.4 artifact id 必须稳定

当前已有 `sceneRunIds.ts`。BE-PR3 应继续使用集中 id helper。

建议新增：

```ts
buildContextPacketId(runId)
buildAgentInvocationId(runId, role)
buildProposalSetId(runId)
buildCanonPatchId(runId)
buildProseDraftId(runId)
buildTraceLinkId(runId, relation, index)
```

不要在各文件中散落字符串拼接。

---

## 八、Repository 改法

### 8.1 扩展 Repository interface

修改：

```text
packages/api/src/repositories/fixtureRepository.ts
```

或 interface 所在文件。

新增方法：

```ts
listRunArtifacts(projectId: string, runId: string): Promise<RunArtifactSummaryRecord[] | null>
getRunArtifact(projectId: string, runId: string, artifactId: string): Promise<RunArtifactDetailRecord | null>
getRunTrace(projectId: string, runId: string): Promise<RunTraceResponse | null>
```

如果 repository interface 当前不希望返回 response object，可以改为：

```ts
getRunTrace(...): Promise<{
  runId: string
  nodes: RunTraceNodeRecord[]
  links: RunTraceLinkRecord[]
  summary: ...
} | null>
```

### 8.2 RunFixtureStore 新增方法

在 `runFixtureStore.ts` 新增：

```ts
listRunArtifacts(runId: string): RunArtifactSummaryRecord[] | null
getRunArtifact(runId: string, artifactId: string): RunArtifactDetailRecord | null
getRunTrace(runId: string): RunTraceResponse | null
```

### 8.3 submit review decision 后同步 artifact detail / trace

当前 `submitRunReviewDecision` 已经会追加 events / artifacts。

BE-PR3 要确保：

- accept / accept-with-edit 生成 canon patch detail。
- accept / accept-with-edit 生成 prose draft detail。
- trace links 同步增加 proposal -> canon -> prose。
- request-rewrite 不生成 canon / prose trace。
- reject 不生成 canon / prose trace。

---

## 九、Route 改法

新增：

```text
packages/api/src/routes/runArtifacts.ts
```

或直接在 `routes/run.ts` 中追加。若 `run.ts` 已经偏大，推荐单独文件。

### 9.1 建议单独文件

```ts
export async function registerRunArtifactRoutes(app: FastifyInstance, repository: FixtureRepository) {
  app.get('/api/projects/:projectId/runs/:runId/artifacts', ...)
  app.get('/api/projects/:projectId/runs/:runId/artifacts/:artifactId', ...)
  app.get('/api/projects/:projectId/runs/:runId/trace', ...)
}
```

然后在 `createServer.ts` 注册。

### 9.2 错误返回

保持当前 API 风格，建议：

```json
{
  "error": "Run not found"
}
```

```json
{
  "error": "Artifact not found"
}
```

```json
{
  "error": "Trace not found"
}
```

不要引入复杂 error envelope，除非项目现有 contract 已统一。

---

## 十、测试方案

BE-PR3 最值钱的测试不是“endpoint 存在”，而是：

**event refs 是否真的能被 artifact endpoint 读取，并且 review decision 后 trace chain 是否成立。**

### 10.1 纯函数测试

新增：

```text
sceneRunArtifactDetails.test.ts
sceneRunTraceLinks.test.ts
```

至少覆盖：

1. context packet detail 包含 included assets / canon facts / excluded facts。
2. agent invocation detail 正确引用 context packet。
3. proposal set detail 正确引用 source invocation。
4. canon patch detail 正确引用 accepted proposal ids。
5. prose draft detail 正确引用 source canon patch。
6. trace links 包含 proposal -> canon -> prose。
7. request-rewrite / reject 不产生 canon / prose trace。

### 10.2 RunFixtureStore 测试

新增或扩展当前 run store 测试，至少覆盖：

1. start run 后 `listRunArtifacts` 返回 context / agent / proposal artifacts。
2. start run 后每个 event ref 对应的 artifact 能读取。
3. accept 后新增 canon patch / prose draft artifact detail。
4. accept 后 `getRunTrace` 能看到 proposal -> canon -> prose。
5. reject 后没有 canon patch / prose draft artifact。
6. invalid artifact id 返回 null。
7. artifact 不跨 run 泄漏。

### 10.3 Route / integration 测试

扩展：

```text
packages/api/src/createServer.run-flow.test.ts
```

或新增：

```text
packages/api/src/createServer.run-artifacts.test.ts
```

建议完整路径：

```text
POST /scenes/:sceneId/runs
-> GET /runs/:runId/events
-> 找到 context_packet_built refs[0]
-> GET /runs/:runId/artifacts/:artifactId
-> 断言 kind = context-packet
-> 找到 proposal_created refs[0]
-> GET proposal-set artifact detail
-> POST /runs/:runId/review-decisions accept
-> GET /runs/:runId/events
-> 找到 canon_patch_applied / prose_generated refs
-> GET canon patch artifact
-> GET prose draft artifact
-> GET /runs/:runId/trace
-> 断言存在 proposal -> canon -> prose links
```

再补两条窄路径：

- request-rewrite：run 回到 running，不生成 canon / prose artifact。
- reject：run completed，但不生成 canon / prose artifact。

### 10.4 Contract tests

若项目已有 contract test 文件，补：

- `RunArtifactSummaryRecord` shape。
- `RunArtifactDetailRecord` discriminated union。
- `RunTraceResponse` shape。

### 10.5 命令

实现完成后至少跑：

```bash
pnpm typecheck
pnpm test
```

如果只想先跑 API 包，可根据 package scripts 使用：

```bash
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/api test
```

---

## 十一、建议的文件改动

### 11.1 必改

```text
packages/api/src/contracts/api-records.ts
packages/api/src/repositories/fixtureRepository.ts
packages/api/src/repositories/runFixtureStore.ts
packages/api/src/orchestration/sceneRun/sceneRunIds.ts
packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts
packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts
packages/api/src/createServer.ts
packages/api/src/routes/run.ts 或新增 routes/runArtifacts.ts
```

### 11.2 推荐新增

```text
packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts
packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts
packages/api/src/orchestration/sceneRun/sceneRunTraceLinks.ts
packages/api/src/orchestration/sceneRun/sceneRunTraceLinks.test.ts
packages/api/src/routes/runArtifacts.ts
packages/api/src/createServer.run-artifacts.test.ts
```

### 11.3 尽量不动

```text
packages/renderer/**
packages/api/src/routes/scene.ts
packages/api/src/routes/chapter.ts
packages/api/src/routes/book.ts
packages/api/src/routes/asset.ts
packages/api/src/routes/review.ts
packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts（除非需要接 detail builder 输出）
```

如果必须改 `sceneRunWorkflow.ts`，只做最小调整：让它返回 artifact summary + detail / trace seed，不重写 workflow 顺序。

---

## 十二、实施顺序（给 AI 的执行顺序）

### Step 1
先扩 contract：

- `RunArtifactKind`
- `RunArtifactSummaryRecord`
- `RunArtifactDetailRecord`
- `RunTraceNodeRecord`
- `RunTraceLinkRecord`
- `RunTraceResponse`

### Step 2
补 id helper：

- artifact ids
- trace link ids

保持 id 稳定、集中。

### Step 3
新增 artifact detail builder：

- context packet detail
- agent invocation detail
- proposal set detail
- canon patch detail
- prose draft detail

先写纯函数测试。

### Step 4
新增 trace builder：

- initial run trace
- accepted run trace
- rewrite / reject trace

先写纯函数测试。

### Step 5
增强 `RunFixtureStore`：

- 存 artifact details
- 存 trace nodes / links
- 增加 list/get artifact 方法
- 增加 get trace 方法

### Step 6
扩 repository interface 与 implementation：

- `listRunArtifacts`
- `getRunArtifact`
- `getRunTrace`

### Step 7
新增 route：

- `GET /runs/:runId/artifacts`
- `GET /runs/:runId/artifacts/:artifactId`
- `GET /runs/:runId/trace`

并在 `createServer.ts` 注册。

### Step 8
补集成测试：

- start run -> refs -> artifact detail
- accept -> canon/prose artifact -> trace
- request rewrite / reject 不产生 canon/prose artifact

### Step 9
更新 API 文档或 README 中的 API contract 小节：

- event 不内联大 payload
- refs 指向 artifact/context/proposal
- trace 是产品 read surface，不是 raw workflow history

---

## 十三、完成后的验收标准

满足以下条件，BE-PR3 就算完成：

1. `RunEventRecord` 仍然保持轻量，只通过 refs 指向 artifact。
2. start scene run 后，context / agent / proposal artifacts 可通过 API 读取。
3. proposal-set artifact detail 有结构化 proposals，而不是只有 summary 文案。
4. accept / accept-with-edit 后，canon patch artifact detail 可读。
5. accept / accept-with-edit 后，prose draft artifact detail 可读。
6. run trace endpoint 能返回 proposal -> canon -> prose 的最小 trace links。
7. request-rewrite / reject 不伪造 canon patch / prose draft artifact。
8. artifact 不跨 run / project 泄漏。
9. event pagination 行为不被破坏。
10. `events/stream` 可以继续 501，不要求本轮实现。
11. 不接真实 DB / LLM / Temporal / SSE。
12. `pnpm typecheck` 与 `pnpm test` 通过。

---

## 十四、BE-PR3 结束时不要留下的债

以下情况都算 PR 做偏了：

- 把 context / prompt / prose 大段内容直接塞进 `RunEventRecord`。
- 为 artifact detail 新造了与 run store 无关的第二套状态真源。
- trace link 靠字符串匹配推断。
- accept 后只有 UI surface 更新，但没有 canon/prose artifact detail。
- proposal-set 仍然只是一个标题，没有结构化 proposal items。
- 为了 trace endpoint 引入真实数据库或 Temporal history 依赖。
- 在本轮顺手做真实 SSE。
- 在本轮顺手做真实模型调用。
- 改坏现有 start run / event pagination / review decision transition 测试。

BE-PR3 做完后的正确状态应该是：

**Scene Run 已经不只是能跑出事件，而是能通过 API 读到每个关键事件背后的 context、agent output、proposal、canon patch、prose draft 与最小 trace chain。**

---

## 十五、BE-PR4 之后的方向（仅保留，不在本轮实施）

### BE-PR4：Backend Review Gate / Canon Store Foundation

把 fixture canon patch 从 run artifact 推进到真正 domain store：

- canon_facts
- proposal_sets
- reviews
- trace_links

仍可先 fixture-backed，不急着上真实 DB。

### BE-PR5：Model Gateway + Mock/Real Adapter Boundary

新增 model provider adapter 层：

- mock adapter
- OpenAI adapter placeholder
- structured output schema validation

但仍不让 route 直接认识 provider。

### BE-PR6：Durable Workflow Kernel Decision

根据前几轮是否稳定，再决定：

- 继续 lightweight worker
- 接 Temporal
- 接 Inngest / BullMQ / pg-boss

不要在 BE-PR3 抢做 durable workflow。

---

## 十六、给 AI 的最终一句话指令

在当前 `codex/be-pr2-scene-run-workflow-skeleton` 已经完成 Scene Run Workflow Skeleton 的前提下，不要继续扩 workflow，也不要提前接真实 DB / LLM / Temporal / SSE；先只围绕 **Run Artifact & Trace Read Surfaces** 做一轮窄而实的实现：

- 保持 `RunEventRecord` 轻量，只通过 refs 指向 artifact。
- 新增 run artifact list / detail API。
- 新增 run trace summary API。
- 为 context packet / agent invocation / proposal set / canon patch / prose draft 建立 typed artifact detail。
- 让 accept / accept-with-edit 后产生可读 canon patch / prose draft detail。
- 用显式 trace metadata 建立 proposal -> canon -> prose 的最小 trace chain。
- 不做真实 stream、真实模型、真实数据库、Temporal、branch、publish。
- 用纯函数测试、run store 测试和 route 集成测试固定 event refs 可读、review transition 可追溯、artifact 不跨 run 泄漏这三条硬约束。
