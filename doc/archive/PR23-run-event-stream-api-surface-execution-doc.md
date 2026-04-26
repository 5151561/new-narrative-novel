# PR23 Execution Document — Run / Event Stream API Surface Contract

基于当前分支：`codex/pr22-api-backed-mutations-write-error-discipline`

> 这份文档可以直接交给 AI agent 执行。  
> PR23 的任务是固定 renderer 侧的 Run / Event Stream API contract，并为后续真实 orchestration backend、Temporal workflow、Context Packet Inspector、Proposal Variants 等能力预留语义位置。  
> PR23 不是 SillyTavern 功能移植 PR，也不是后端接入 PR。

---

## 0. 给 AI agent 的最终执行指令

在当前 `codex/pr22-api-backed-mutations-write-error-discipline` 已经完成 API read/write contract 与 mutation error discipline 的前提下，不要继续扩 Book / Review / Export UI，也不要接真实后端、Temporal、真实 SSE、数据库、LLM 或 auth；本轮只围绕 **Run / Event Stream API Surface Contract** 做一轮窄而实的 renderer-side contract 实现：

- 新增 `features/run`，定义 run records、run client、query keys、hooks 与 mock run db。
- 给 `ProjectRuntime` 增加 `runClient`。
- 给 `createApiProjectRuntime(...)` 增加 run API adapter。
- 给 `apiRouteContract` 增加 start run / get run / get events / submit review decision / future stream endpoint。
- 扩展 `mockProjectRuntime` 与 `fakeApiRuntime`，让 run endpoints 可被 record、dispatch、override。
- 补 run hook tests、runtime adapter tests、route contract tests、fake API dispatcher tests。
- 在 `RunEventKind` 中预留 `context_packet_built`。
- 在 `RunEventRecord.refs.kind` 中预留 `context-packet`。
- 保持 `proposal_created` 指向 `proposal-set`，不要把 proposal 设计死成单版本。
- 明确 product `RunEventRecord` 不是 Temporal Event History，也不是 raw LLM token stream。
- 更新 `doc/api-contract.md`。

PR23 完成后，renderer 应该能通过同一个 `ProjectRuntime` 边界表达：

```text
start scene run
-> read run status
-> read run events by cursor
-> submit run review decision
```

但 renderer 仍然不知道 workflow engine 是 Temporal、in-process worker、fixture backend 还是未来的其他实现。

---

## 1. PR23 的定位

PR21 / PR22 已经证明已有工作面可以通过 API runtime 读写；PR23 要证明未来 orchestration run 也能通过同一个 API contract 被启动、观察、审阅和恢复。

PR23 的核心不是“开始真正跑 AI”，而是把下面这条后端纵切的前端 contract 定住：

```text
Scene / Orchestrate UI
  -> ProjectRuntime.runClient
    -> ApiTransport / MockRuntime
      -> RunRecord
      -> RunEventRecord[]
      -> RunReviewDecision
```

后续真实 backend 或 Temporal worker 只需要兑现这些 endpoints 与 payload，前端不需要 import Temporal SDK，也不需要读取 Temporal history。

---

## 2. 当前代码基线判断

### 2.1 已成立的基础

当前分支已经具备：

- `ProjectRuntime` 作为统一 runtime / provider boundary。
- `createApiProjectRuntime(...)` 通过 `ApiTransport` 实现现有 feature clients。
- `apiRouteContract` 已覆盖 Book / Chapter / Asset / Review / Scene 的主要 read path 和既有 mutation path。
- PR22 已经建立 mutation write error classifier、fake API write dispatcher、optimistic rollback / invalidation 的测试纪律。
- route 已经覆盖 `scene / chapter / asset / book` 多 scope，以及 book draft 的 compare / export / branch / review 等 view-state。

### 2.2 当前缺口

Scene 侧已经存在一些动作 endpoint，例如 proposal accept / reject / rewrite、patch commit、prose revision 等；但它们不是完整 run/event stream contract。

PR23 要补的是：

- run 如何启动；
- run 的产品级状态如何读取；
- run events 如何分页 / polling；
- future SSE endpoint 如何预留但不实现；
- run 等待 review 时如何提交 decision；
- event refs 如何指向 context packet、proposal set、canon patch、prose draft、artifact 等大 payload 的外部对象。

---

## 3. 本轮明确不做

PR23 不做：

- 不做真实 API server。
- 不接 Temporal SDK。
- 不接真实 SSE / WebSocket。
- 不接真实 DB。
- 不接真实 LLM。
- 不做 auth / session 完整流程。
- 不改 workbench route shape。
- 不把 `runId` 写进 route。
- 不新增 Book / Review / Export UI surface。
- 不重写 Scene Orchestrate 主舞台。
- 不把 Temporal Event History 当成产品事件流。
- 不做 full run debugger。
- 不做 Context Packet Inspector UI。
- 不做 Prompt Manager。
- 不做 WorldInfo / Lorebook UI。
- 不做 swipe / regenerate / proposal variants UI。
- 不做 checkpoint / branch 系统。
- 不做 publish / export file generation。
- 不让 `runClient` 直接 patch scene / chapter / book / asset caches。

PR23 只做：

**Run / Event Stream 的 renderer-side API contract、runtime adapter、mock/fake harness、hooks、tests 与文档。**

---

## 4. SillyTavern-inspired future affordance slots

SillyTavern 值得借的是 power-user 控制面的思想，不是 chat-first 运行模型。PR23 只做最小语义预留：

### 4.1 Context packet slot

为未来的 Context Packet Inspector / Prompt Trace / Asset Activation Trace 预留事件：

```ts
'context_packet_built'
```

并在 refs 中预留：

```ts
'context-packet'
```

PR23 不实现 context packet 详情 API，不显示完整 prompt，不做 Prompt Manager。只保证 run event stream 能表达：

```text
context_packet_built
refs:
  - kind: context-packet
    id: ctx-scene-midnight-platform-run-001
```

### 4.2 Artifact / payload slot

`RunEventRecord` 永远不内联大 payload。大 prompt、大上下文、大模型输出、大 prose、debug detail 以后都通过 refs 指向：

```text
context-packet
agent-invocation
proposal-set
review
canon-patch
prose-draft
artifact
```

### 4.3 Proposal variants slot

`proposal_created` 必须引用 `proposal-set`，不要写死成“一个 run 只有一个单体 proposal”。

未来 SillyTavern 的 swipe / regenerate 心智应落成：

```text
proposal-set
  -> variant A / B / C
  -> review
  -> accept / edit / reject
  -> accepted canon
```

PR23 不实现 variants 字段，也不实现 UI。只保持 `proposal-set` 这个承载点。

### 4.4 Product event stream slot

PR23 的 event stream 是产品级 event stream，不是 raw LLM token stream，也不是 Temporal history。

允许事件表达产品状态变化：

```text
run_created
run_started
context_packet_built
agent_invocation_started
agent_invocation_completed
proposal_created
review_requested
review_decision_submitted
canon_patch_applied
prose_generated
run_completed
run_failed
```

不允许把完整 LLM 输出、prompt、Temporal history payload、长 token stream 直接塞进 `RunEventRecord.summary`。

---

## 5. 必须遵守的硬约束

### 5.1 仍然只有一个 runtime boundary

所有 run read / write 都必须通过：

```ts
useProjectRuntime().runClient
```

不要在 feature 里直接：

```ts
fetch('/api/...')
```

不要新增：

- `RunApiProvider`
- `TemporalProvider`
- `EventStreamProvider`
- 第二套 runtime context

### 5.2 route 不承载 run 状态

PR23 不新增：

- `runId`
- `eventCursor`
- `streamMode`
- `pendingReviewId`
- `runStatus`

run 状态只由 React Query hooks、mutation state、component local state 或后续 backend store 承担。

Route 继续只表示：

- 当前 scope / lens / view；
- selected scene / chapter / asset / book；
- book draft view / checkpoint / export profile / branch / review filter 等 view-state。

### 5.3 event read 先用 polling / page contract

PR23 可以在 route contract 中预留：

```text
GET /api/projects/:projectId/runs/:runId/events/stream
```

但本轮不要在 runtime adapter 中打开 `EventSource`，也不要写 stream reader。

第一版只实现：

```text
GET /api/projects/:projectId/runs/:runId/events?cursor=...
```

### 5.4 runClient 不直接修改其它 feature cache

PR23 的 `runClient` 只负责：

- start run；
- read run；
- read run events；
- submit review decision。

不要在本轮让 run mutation 自动 patch：

- scene workspace；
- chapter draft；
- book review；
- asset mentions；
- traceability cache。

后续 PR25 再决定 affected queries 如何 invalidate。

### 5.5 fake API runtime 仍是 contract harness

`fake-api-runtime.test-utils.ts` 可以：

- record requests；
- dispatch run endpoints；
- forward to mock runtime；
- apply deterministic override。

不能：

- 自己实现 orchestration workflow；
- 自己生成复杂 proposal；
- 持有 UI state；
- 模拟 Temporal history。

---

## 6. Run API contract 设计

### 6.1 Endpoint graph

在 `api-route-contract.ts` 新增：

```text
POST /api/projects/:projectId/scenes/:sceneId/runs
GET  /api/projects/:projectId/runs/:runId
GET  /api/projects/:projectId/runs/:runId/events
POST /api/projects/:projectId/runs/:runId/review-decisions
GET  /api/projects/:projectId/runs/:runId/events/stream  # contract only, PR23 不实现真实 SSE
```

推荐 route helpers：

```ts
sceneRuns({ projectId, sceneId })
run({ projectId, runId })
runEvents({ projectId, runId })
runEventsStream({ projectId, runId })
runReviewDecisions({ projectId, runId })
```

### 6.2 `StartSceneRunInput`

```ts
export interface StartSceneRunInput {
  sceneId: string
  mode?: 'continue' | 'rewrite' | 'from-scratch'
  note?: string
}
```

API request body 必须省略 `sceneId`，因为 sceneId 已经在 path 中：

```json
{
  "mode": "continue",
  "note": "Continue from the current accepted state."
}
```

### 6.3 `RunRecord`

```ts
export type RunScope = 'scene' | 'chapter' | 'book'

export type RunStatus =
  | 'queued'
  | 'running'
  | 'waiting_review'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface RunRecord {
  id: string
  scope: RunScope
  scopeId: string
  status: RunStatus
  title: LocalizedText
  summary: LocalizedText
  startedAtLabel?: LocalizedText
  completedAtLabel?: LocalizedText
  pendingReviewId?: string
  latestEventId?: string
  eventCount: number
}
```

### 6.4 `RunEventRecord`

```ts
export type RunEventKind =
  | 'run_created'
  | 'run_started'
  | 'context_packet_built'
  | 'agent_invocation_started'
  | 'agent_invocation_completed'
  | 'proposal_created'
  | 'review_requested'
  | 'review_decision_submitted'
  | 'canon_patch_applied'
  | 'prose_generated'
  | 'run_completed'
  | 'run_failed'

export type RunEventRefKind =
  | 'context-packet'
  | 'agent-invocation'
  | 'proposal-set'
  | 'review'
  | 'canon-patch'
  | 'prose-draft'
  | 'artifact'

export interface RunEventRecord {
  id: string
  runId: string
  order: number
  kind: RunEventKind
  label: LocalizedText
  summary: LocalizedText
  createdAtLabel: LocalizedText
  severity?: 'info' | 'success' | 'warning' | 'error'
  refs?: Array<{
    kind: RunEventRefKind
    id: string
    label: LocalizedText
  }>
}
```

### 6.5 `RunEventsPageRecord`

```ts
export interface RunEventsPageRecord {
  runId: string
  events: RunEventRecord[]
  nextCursor?: string
}
```

Cursor 规则必须明确写进 `doc/api-contract.md`：

- `cursor` 表示“last seen event id”。
- `cursor` 省略时，从 run 的第一条 event 开始返回 deterministic first page。
- 返回结果只包含 cursor 之后的 events。
- 如果还有更多 events，`nextCursor` 是本页最后一条 event id。
- 如果没有更多 events，`nextCursor` 为 `undefined`。
- PR23 mock 中 page size 可以固定，建议先固定为 `20`，测试中不要依赖真实时间。

### 6.6 `SubmitRunReviewDecisionInput`

```ts
export type RunReviewDecisionKind =
  | 'accept'
  | 'accept-with-edit'
  | 'request-rewrite'
  | 'reject'

export interface SubmitRunReviewDecisionInput {
  runId: string
  reviewId: string
  decision: RunReviewDecisionKind
  note?: string
  patchId?: string
}
```

API request body 必须省略 `runId`，因为 runId 已经在 path 中：

```json
{
  "reviewId": "review-scene-run-midnight-platform-001",
  "decision": "accept",
  "patchId": "patch-midnight-platform-001"
}
```

Response 返回更新后的 `RunRecord`。

---

## 7. 建议文件改动

### 7.1 新增 feature skeleton

```text
packages/renderer/src/features/run/api/run-records.ts
packages/renderer/src/features/run/api/run-client.ts
packages/renderer/src/features/run/api/mock-run-db.ts
packages/renderer/src/features/run/hooks/run-query-keys.ts
packages/renderer/src/features/run/hooks/useRunQuery.ts
packages/renderer/src/features/run/hooks/useRunEventsQuery.ts
packages/renderer/src/features/run/hooks/useStartSceneRunMutation.ts
packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts
packages/renderer/src/features/run/types/run-view-models.ts
packages/renderer/src/features/run/lib/run-event-mappers.ts
```

可选 presentational component：

```text
packages/renderer/src/features/run/components/RunEventStreamPanel.tsx
packages/renderer/src/features/run/components/RunEventStreamPanel.test.tsx
packages/renderer/src/features/run/components/RunEventStreamPanel.stories.tsx
```

默认建议：PR23 可以不接 UI；hook / runtime / contract tests 足够完成本轮目标。若接 UI，只做孤立 presentational `RunEventStreamPanel`，不要重写 Scene dock。

### 7.2 修改 project runtime

```text
packages/renderer/src/app/project-runtime/project-runtime.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.test.ts
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
packages/renderer/src/app/project-runtime/api-route-contract.ts
packages/renderer/src/app/project-runtime/api-route-contract.test.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.test.ts
```

### 7.3 可选修改 Scene dock

仅在本轮决定接最小 UI panel 时修改：

```text
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
packages/renderer/src/features/scene/components/SceneDockPanel.tsx
packages/renderer/src/features/scene/types/scene-view-models.ts
```

要求：

- 只在 existing dock 的 runtime / activity 区域展示 run events。
- 不改 route。
- 不新增 run debugger。
- 不让 dock 持有 run 真源。

### 7.4 更新文档

```text
doc/api-contract.md
doc/PR23-run-event-stream-api-surface-contract-plan.md
```

如果仓库没有 `doc/` 目录，先沿用项目既有文档目录约定，不要新造平行文档体系。

---

## 8. `RunClient` contract

在 `features/run/api/run-client.ts` 中定义：

```ts
export interface GetRunInput {
  runId: string
}

export interface GetRunEventsInput {
  runId: string
  cursor?: string | null
}

export interface RunClient {
  startSceneRun(input: StartSceneRunInput): Promise<RunRecord>
  getRun(input: GetRunInput): Promise<RunRecord | null>
  getRunEvents(input: GetRunEventsInput): Promise<RunEventsPageRecord>
  submitRunReviewDecision(input: SubmitRunReviewDecisionInput): Promise<RunRecord>
}
```

注意：

- `RunClient` 不应该知道 Temporal。
- `RunClient` 不应该暴露 SSE reader。
- `RunClient` 不应该暴露 `contextPacketClient`。
- `RunClient` 不应该返回 raw prompt / raw output。

---

## 9. Hook 设计

### 9.1 `run-query-keys.ts`

```ts
export const runQueryKeys = {
  all: ['runs'] as const,
  run: (runId: string) => [...runQueryKeys.all, 'detail', runId] as const,
  events: (runId: string, cursor?: string | null) =>
    [...runQueryKeys.all, 'events', runId, cursor ?? 'initial'] as const,
}
```

不要把 route view / selected scene / dock tab 塞进 run query key。

### 9.2 `useRunQuery(runId)`

职责：

- 通过 `runtime.runClient.getRun({ runId })` 获取 `RunRecord`。
- 支持 `enabled: Boolean(runId)`。
- 不派生 UI 选中态。
- `RunRecord | null` 直接透出，不在 hook 中伪造 fallback run。

### 9.3 `useRunEventsQuery({ runId, cursor })`

职责：

- 通过 `runtime.runClient.getRunEvents({ runId, cursor })` 获取 event page。
- 保留 `nextCursor`。
- 不接 EventSource。
- 不自动合并多页；如果需要展示多页，后续再做 infinite query。

### 9.4 `useStartSceneRunMutation()`

职责：

- 调用 `runtime.runClient.startSceneRun(input)`。
- 成功后写入 / invalidate `runQueryKeys.run(run.id)`。
- 可选 prefetch first event page。
- 不 patch scene workspace cache。

错误处理：

- 复用 PR22 的 write error classifier。
- `422` -> validation。
- `409` -> conflict。
- `401 / 403` -> auth。
- `500 / network unavailable` -> unavailable。
- 其它 -> unknown。

### 9.5 `useSubmitRunReviewDecisionMutation()`

职责：

- 调用 `runtime.runClient.submitRunReviewDecision(input)`。
- 成功后 update `runQueryKeys.run(run.id)`。
- invalidate `runQueryKeys.events(run.id, ...)` 相关 event queries。
- 不直接修改 scene / chapter / book / asset cache。

---

## 10. Mock run DB 设计

新增：

```text
packages/renderer/src/features/run/api/mock-run-db.ts
```

### 10.1 Seed run

至少提供一个 deterministic fixture：

```text
run-scene-midnight-platform-001
scope: scene
scopeId: scene-midnight-platform
status: waiting_review
pendingReviewId: review-scene-midnight-platform-001
```

### 10.2 Seed events

事件顺序建议：

1. `run_created`
2. `run_started`
3. `context_packet_built`
4. `agent_invocation_started` — Ren Voss
5. `agent_invocation_completed` — Ren Voss
6. `agent_invocation_started` — Mei Arden
7. `agent_invocation_completed` — Mei Arden
8. `proposal_created`
9. `review_requested`

关键 refs 示例：

```ts
{
  kind: 'context_packet_built',
  refs: [
    {
      kind: 'context-packet',
      id: 'ctx-scene-midnight-platform-run-001',
      label: { en: 'Scene manager context packet', 'zh-CN': '场景导演上下文包' },
    },
  ],
}
```

```ts
{
  kind: 'proposal_created',
  refs: [
    {
      kind: 'proposal-set',
      id: 'proposal-set-scene-midnight-platform-run-001',
      label: { en: 'Scene proposal set', 'zh-CN': '场景提案集' },
    },
  ],
}
```

### 10.3 `startSceneRun` mock behavior

- 使用 deterministic counter，不用 `Date.now()` / `Math.random()`。
- `resetMockRunDb()` 后，同样输入生成同样 id。
- start 后可以直接生成一个 `waiting_review` fixture run，方便本轮测试 review decision。
- 或者生成 `running`，但必须在测试里 deterministic。推荐第一版直接生成 `waiting_review`，因为 PR23 的核心路径包含 submit review decision。

建议新 run id：

```text
run-scene-{sceneId}-new-001
```

如果 `sceneId = scene-midnight-platform`：

```text
run-scene-scene-midnight-platform-new-001
```

也可以在 helper 中 normalize，保持测试稳定即可。

### 10.4 `submitRunReviewDecision` mock behavior

- 如果 `runId` 不存在，抛 not-found / equivalent API error。
- 如果 `reviewId` 不匹配当前 `pendingReviewId`，抛 conflict。
- `accept`：append
  - `review_decision_submitted`
  - `canon_patch_applied`
  - `prose_generated`
  - `run_completed`
  - status -> `completed`
  - clear `pendingReviewId`
- `accept-with-edit`：append 同 accept，但 summary 表达 edited patch。
- `request-rewrite`：append
  - `review_decision_submitted`
  - status -> `running`
  - clear `pendingReviewId`
- `reject`：append
  - `review_decision_submitted`
  - `run_completed`
  - status -> `completed`
  - clear `pendingReviewId`

### 10.5 Reset requirement

必须提供：

```ts
resetMockRunDb()
```

测试之间必须调用或由 existing test setup 调用，避免 mutable mock db 污染。

---

## 11. API runtime adapter 要求

在 `api-project-runtime.ts` 中新增：

```ts
function createRunClient(projectId: string, transport: ApiTransport): RunClient
```

实现形态：

```ts
startSceneRun(input) {
  return transport.requestJson({
    method: 'POST',
    path: apiRouteContract.sceneRuns({ projectId, sceneId: input.sceneId }),
    body: { mode: input.mode, note: input.note },
  })
}

getRun({ runId }) {
  return transport.requestJson({
    method: 'GET',
    path: apiRouteContract.run({ projectId, runId }),
  })
}

getRunEvents({ runId, cursor }) {
  return transport.requestJson({
    method: 'GET',
    path: apiRouteContract.runEvents({ projectId, runId }),
    query: { cursor: cursor ?? undefined },
  })
}

submitRunReviewDecision(input) {
  return transport.requestJson({
    method: 'POST',
    path: apiRouteContract.runReviewDecisions({ projectId, runId: input.runId }),
    body: {
      reviewId: input.reviewId,
      decision: input.decision,
      note: input.note,
      patchId: input.patchId,
    },
  })
}
```

确认事项：

- path 中已有 `sceneId` / `runId`，body 不重复带它们。
- optional fields 为 `undefined` 时应按现有 transport 约定省略或稳定序列化。
- errors 保持 `ApiRequestError` shape，不要在 run adapter 内吞掉。

---

## 12. fake API runtime dispatcher 要求

在 `fake-api-runtime.test-utils.ts` 中新增 dispatch：

```text
POST /api/projects/:projectId/scenes/:sceneId/runs
GET  /api/projects/:projectId/runs/:runId
GET  /api/projects/:projectId/runs/:runId/events
POST /api/projects/:projectId/runs/:runId/review-decisions
```

验证点：

- method / path / query / body 都进入 `requests`。
- overrides 可按 method / path / body / query 匹配。
- override 可强制 `409 conflict`、`422 validation`、`500 unavailable`。
- dispatcher 只 forward to mock runtime，不自己实现 workflow 逻辑。
- dispatcher 不认识 Temporal。

---

## 13. Optional `RunEventStreamPanel`

默认不要求接 UI。若本轮需要一个最小可视组件，只允许新增孤立 presentational component：

```text
features/run/components/RunEventStreamPanel.tsx
```

职责：

- 接收 `run?: RunRecord | null`、`events: RunEventRecord[]`、`isLoading?`、`error?`。
- 显示 run status、pending review、ordered events。
- 显示 refs label，但不展开 payload。
- `context-packet` ref 只显示 label / id，不提供 Inspector。
- 不持有 run state。
- 不发起 query。
- 不改 route。

不做：

- 不接 EventSource。
- 不做 token stream。
- 不做 prompt inspector。
- 不做 full debugger。
- 不做 review decision controls。

---

## 14. 测试要求

### 14.1 `api-route-contract.test.ts`

至少覆盖：

1. `sceneRuns({ projectId, sceneId })`。
2. `run({ projectId, runId })`。
3. `runEvents({ projectId, runId })`。
4. `runEventsStream({ projectId, runId })`。
5. `runReviewDecisions({ projectId, runId })`。
6. path escaping。

### 14.2 `api-project-runtime.test.ts`

至少覆盖：

1. `startSceneRun` -> `POST` path / body。
2. `getRun` -> `GET` path。
3. `getRunEvents` -> `GET` path / query cursor。
4. `submitRunReviewDecision` -> `POST` path / body。
5. errors preserve `ApiRequestError` shape。
6. body 不重复携带 path 中的 `sceneId` / `runId`。

### 14.3 `mock-project-runtime.test.ts`

至少覆盖：

1. mock runtime exposes `runClient`。
2. `startSceneRun` creates deterministic run。
3. seeded run includes `context_packet_built` event。
4. seeded `context_packet_built` has `context-packet` ref。
5. seeded `proposal_created` has `proposal-set` ref。
6. `getRunEvents` returns deterministic ordered events。
7. cursor returns events after last seen event id。
8. `submitRunReviewDecision` updates run status and appends events。
9. `resetMockRunDb()` avoids test pollution。

### 14.4 `fake-api-runtime.test-utils.test.ts`

至少覆盖：

1. fake transport records `POST scene runs`。
2. fake transport records `GET run events` with cursor。
3. fake dispatcher forwards to mock runtime。
4. override can force `409 conflict` on `startSceneRun`。
5. override can force `422 validation` on `submitRunReviewDecision`。
6. fake dispatcher does not mutate route or UI state。

### 14.5 Hook tests

新增：

```text
packages/renderer/src/features/run/hooks/useStartSceneRunMutation.test.tsx
packages/renderer/src/features/run/hooks/useRunEventsQuery.test.tsx
packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.test.tsx
```

至少覆盖：

1. start success updates run cache。
2. start failure classifies write error。
3. events query respects cursor。
4. submit decision success updates run detail。
5. submit decision success invalidates run events。
6. submit decision failure does not mutate previous run cache。
7. no hook writes route state。

### 14.6 Optional component tests

若新增 `RunEventStreamPanel`，覆盖：

1. Waiting review run 显示 pending review。
2. `context_packet_built` event 显示 context packet ref label。
3. `proposal_created` event 显示 proposal set ref label。
4. completed run 显示 completed state。
5. failed run 显示 error severity event。
6. empty events 显示 quiet empty state。

### 14.7 Optional integration smoke

若接最小 UI panel，可新增：

```text
SceneRunApiSurfaceContract.test.tsx
```

建议路径：

```text
open Scene / Orchestrate deep link
-> inject fake API runtime
-> start scene run
-> assert POST /scenes/:sceneId/runs
-> run event panel shows context_packet_built / proposal_created / review_requested
-> submit accept decision
-> assert POST /runs/:runId/review-decisions
-> run status becomes completed
-> route scope/lens/tab unchanged
```

若不接 UI，本 smoke 保持为 hook-level contract test 即可。

---

## 15. Storybook 要求

只有新增 `RunEventStreamPanel` 时才补：

```text
packages/renderer/src/features/run/components/RunEventStreamPanel.stories.tsx
```

Story variants：

- `WaitingReview`
- `Running`
- `Completed`
- `Failed`
- `EmptyEvents`
- `WithContextPacketRef`

不要让 story 依赖真实 API server。

---

## 16. `doc/api-contract.md` 更新要求

新增章节：

```md
## PR23 Run / Event Stream API Surface
```

必须包含：

- endpoint graph；
- request examples；
- response examples；
- cursor semantics；
- run event payload rules；
- `context_packet_built` semantics；
- `context-packet` ref semantics；
- `proposal_created` references `proposal-set`；
- review decision rules；
- SSE endpoint is contract-only in PR23；
- renderer does not import Temporal SDK；
- product run events are not Temporal history；
- large payloads are referenced by refs, never embedded in `RunEventRecord`。

建议加一段：

```md
### Future affordance slots

PR23 intentionally does not implement Prompt Manager, WorldInfo, Swipe, Checkpoint, or Branch.
However, the event contract reserves semantic slots for:

- context packet inspection
- proposal variants
- run debug dock
- asset activation trace

Rules:
1. RunEventRecord never embeds large prompt/context/prose payloads.
2. Context/prompt/prose/debug payloads are referenced by artifact or context-packet refs.
3. proposal_created references proposal-set, not a single immutable proposal.
4. product run events are not Temporal history and not raw LLM token stream.
```

---

## 17. 实施顺序

### Step 1：先读代码，不直接开改

先读：

```text
AGENTS.md
packages/renderer/AGENTS.md
packages/renderer/src/app/project-runtime/project-runtime.ts
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/api-route-contract.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
packages/renderer/src/features/scene/api/scene-client.ts
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
packages/renderer/src/features/scene/containers/SceneWorkspace.tsx
```

确认：

- 不需要改 route。
- 不需要真实 backend。
- 不需要重写 scene UI。
- PR22 write error classifier 的位置与用法。
- 现有 fake API dispatcher 的 override pattern。

### Step 2：新增 `features/run` 类型与 client contract

新增：

```text
run-records.ts
run-client.ts
run-query-keys.ts
```

先保证 typecheck 能通过。

### Step 3：扩 `ProjectRuntime`

修改：

```text
project-runtime.ts
mock-project-runtime.ts
api-project-runtime.ts
```

确保 `runClient` 在 mock runtime 和 API runtime 都存在。

### Step 4：扩 `api-route-contract`

新增 run endpoints 和 route helpers，并补 route contract tests。

### Step 5：补 mock run DB

新增 deterministic run fixture、event fixture、`resetMockRunDb()`、start / read / events / review decision helpers。

必须包含 `context_packet_built` 与 `context-packet` ref。

### Step 6：扩 fake API runtime dispatcher

让 fake transport 能 route run endpoints，并能 override errors。

### Step 7：新增 run hooks

新增：

```text
useRunQuery.ts
useRunEventsQuery.ts
useStartSceneRunMutation.ts
useSubmitRunReviewDecisionMutation.ts
```

复用 PR22 write error classifier。

### Step 8：决定是否接最小 UI panel

默认建议不接 UI。若接，只新增 isolated `RunEventStreamPanel`，最多挂到 Scene dock 的 runtime / activity 区域，不新增 route，不做 debugger。

### Step 9：补 tests / stories / docs

至少运行：

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
```

若新增 story，再确保 Storybook 不依赖真实 API server。

---

## 18. 完成后的验收标准

PR23 满足以下条件才算完成：

1. `ProjectRuntime` 新增 `runClient`。
2. mock runtime 与 API runtime 都实现 `runClient`。
3. `apiRouteContract` 覆盖 run start / read / events / review decision / stream contract endpoint。
4. `fake-api-runtime` 能 record / dispatch run endpoints。
5. run hooks 能通过 API runtime 执行。
6. event cursor contract 被测试固定。
7. `RunEventKind` 包含 `context_packet_built`。
8. `RunEventRecord.refs.kind` 包含 `context-packet`。
9. mock events 中至少有一条 `context_packet_built` 并引用 `context-packet`。
10. `proposal_created` 使用 `proposal-set` ref。
11. run review decision write errors 复用 PR22 write classifier。
12. PR23 不改 workbench route shape。
13. PR23 不接 Temporal SDK / true SSE / real API server。
14. PR23 不实现 Prompt Manager / WorldInfo / Swipe / Branch。
15. `doc/api-contract.md` 增加 PR23 run/event stream contract 与 future affordance slots。
16. `pnpm --filter @narrative-novel/renderer typecheck` 通过。
17. `pnpm --filter @narrative-novel/renderer test` 通过。

---

## 19. PR23 结束时不要留下的债

以下情况都算 PR 做偏了：

- 为 run 状态新增 route 参数。
- 新增第二套 API provider。
- feature 直接 `fetch`，绕过 `ProjectRuntime`。
- 把 Temporal history 当成 `RunEventRecord`。
- 把 raw prompt / raw LLM output 塞进 `RunEventRecord`。
- 忘记 `context_packet_built` / `context-packet` 语义预留。
- 把 `proposal_created` 写死成单个 proposal，而不是 `proposal-set`。
- 在 fake API runtime 里实现复杂 orchestration 业务逻辑。
- 为 PR23 顺手做真实 SSE。
- 为 PR23 顺手做真实 backend server。
- 为 PR23 顺手重写 Scene Orchestrate UI。
- start run 成功后直接 patch 大量 scene / chapter / book / asset cache。
- Storybook 依赖真实 API server。
- 借 SillyTavern 时把 chat-first / lorebook-first / prompt-manager-first 心智带进 PR23。

PR23 正确结束状态：

> Renderer 已经拥有稳定的 run / event stream API surface contract，并为 context packet inspection、proposal variants、run debug dock、asset activation trace 预留语义；未来真实 backend 或 Temporal worker 只需要兑现这些 endpoints 与 payload，UI 不需要知道 workflow engine 的实现细节。

---

# BE-PR1 预备说明：API Server Skeleton

这部分只作为后续参考，不属于 PR23 实施范围。

PR23 完成后，可以并行或紧随其后做 BE-PR1：新增最小 API server 包，先用 fixture-backed repositories 兑现 PR21 / PR22 / PR23 已固定的 API contract。

建议目录：

```text
packages/api/
  src/
    app.ts
    server.ts
    routes/
      book-routes.ts
      chapter-routes.ts
      asset-routes.ts
      review-routes.ts
      scene-routes.ts
      run-routes.ts
    repositories/
      fixture-book-repository.ts
      fixture-chapter-repository.ts
      fixture-review-repository.ts
      fixture-run-repository.ts
    contract/
      api-contract.test.ts
```

BE-PR1 做：

- Fastify 或 Hono 二选一。
- fixture-backed repository。
- 实现 PR21 read endpoints。
- 实现 PR22 write endpoints。
- 实现或预留 PR23 run endpoints。
- 返回统一 error body：`status / message / code / detail`。
- contract tests 对齐 `doc/api-contract.md`。

BE-PR1 不做：

- 不接数据库。
- 不接 Temporal。
- 不接 LLM。
- 不接 auth。
- 不做部署。
- 不做真实 SSE。

---

# PR24 / PR25 后续方向

## PR24：Project Session / API Health Boundary

PR23 之后，前端已经知道“怎么表达 run”；下一步需要知道“API runtime 当前是否可用”。

建议范围：

- `GET /api/health`。
- `GET /api/projects/:projectId/runtime-info`。
- App top bar runtime source：mock / api / unavailable。
- 401 / 403 session placeholder。
- API unavailable supporting state。
- project switch placeholder。

不做完整登录系统。

## PR25：Backend Orchestration Integration UI

PR25 才开始把真实 backend orchestration 接进 UI。

renderer 只做：

```text
start run
read run events
submit review decision
invalidate affected queries
show run progress in Scene dock / inspector
```

renderer 不做：

- Temporal SDK import。
- Temporal history reader。
- worker control panel。
- full debugger。

---

# PR26+ SillyTavern 借鉴产品化顺序

PR23 只做语义预留。后面可以逐步产品化：

## PR26 候选：Context Packet Inspector

对应 SillyTavern 的 Prompt Manager / WorldInfo / Prompt Inspector 思想，但你的版本应是：

```text
Run Context Preview
- included canon facts
- included assets
- excluded private facts
- selected scene / chapter / book state
- agent role
- output schema
- token budget
- why included
```

## PR27 候选：Proposal Variants

对应 SillyTavern 的 swipe / regenerate。

你的版本：

```text
proposal-set
  -> variant A / B / C
  -> review
  -> accept / edit / reject
  -> accepted canon
```

## PR28 候选：Asset Context Policy

对应 SillyTavern 的 WorldInfo / Lorebook activation。

你的版本：

```text
Asset activation policy
- explicit link
- current scene cast
- current location
- rule dependency
- review issue dependency
- visibility policy
- context budget
```

## 更后面：Recipes / Extensions / Character Card Import

这些都值得借，但应等 run/event/context/review contract 与第一条 backend orchestration 纵切稳定后再做。

---

# 最终提醒

PR23 的成败不在于“看起来跑了多少 AI”，而在于：

```text
Renderer 是否已经有一个稳定、可测试、后端无关的 run/event/review contract。
```

只要 PR23 坚持：

- runtime-first；
- route 不承载 run；
- product events 不等于 Temporal history；
- 大 payload 只通过 refs；
- context packet / proposal-set 只做语义预留；

它就会成为后面接真实 backend、Temporal、Context Packet Inspector、Proposal Variants、Asset Activation Policy 的安全地基。
