# PR26 Execution Plan — Run Artifact & Trace Inspector Integration

> 基于当前 `codex/be-pr3-run-artifact-trace-read-surfaces` 分支真实代码状态整理。  
> 这份文档可以直接交给 AI agent 执行。

---

## 0. 一句话结论

BE-PR3 已经把 **run artifact / trace read surfaces** 放到了 API 层，但 renderer 侧目前主要只消费 `start run / get run / get events / submit review decision` 这条运行时间线。

所以下一步不建议马上继续扩 BE-PR4 的真实模型 / prose agent / durable workflow，而应该先做一轮 **Run Artifact & Trace Inspector Integration**：

**把 BE-PR3 已经暴露出来的 artifact / trace read surfaces 接进 Scene / Orchestrate 的产品工作流，让 run events 中的 refs 从“只显示 kind 的冷标签”变成可打开、可审阅、可追溯的产品信息。**

---

## 1. 当前代码基线

### 1.1 仓库现在已经是 renderer + fixture API 双包结构

当前根脚本已经包含：

- `dev:api`
- `dev:renderer`
- `typecheck`
- `test`
- `build`
- `storybook`

`typecheck` / `test` 已覆盖 `@narrative-novel/api` 与 `@narrative-novel/renderer`，但 `build` / `storybook` 仍以 renderer 为主。

这说明当前阶段不是纯前端 mock，也不是完整后端，而是：

**renderer 工作台 + fixture API server contract 的联调原型。**

### 1.2 API 侧已经有 run 基础合同

当前 API 已经支持：

```text
POST /api/projects/:projectId/scenes/:sceneId/runs
GET  /api/projects/:projectId/runs/:runId
GET  /api/projects/:projectId/runs/:runId/events?cursor=...
POST /api/projects/:projectId/runs/:runId/review-decisions
GET  /api/projects/:projectId/runs/:runId/events/stream  -> 501 placeholder
```

`events/stream` 仍是占位，不实现 SSE，这个边界要保留。

### 1.3 BE-PR3 新增了 artifact / trace read surfaces

当前 API 侧还已经有：

```text
GET /api/projects/:projectId/runs/:runId/artifacts
GET /api/projects/:projectId/runs/:runId/artifacts/:artifactId
GET /api/projects/:projectId/runs/:runId/trace
```

这些是 BE-PR3 最有价值的新增内容。

它们把 run event refs 指向的内容产品化为：

- context packet
- agent invocation
- proposal set
- canon patch
- prose draft
- proposal -> canon -> prose trace links

### 1.4 run event 合同已经预留了正确语义

当前 `RunEventKind` 已包含：

- `context_packet_built`
- `agent_invocation_started`
- `agent_invocation_completed`
- `proposal_created`
- `review_requested`
- `review_decision_submitted`
- `canon_patch_applied`
- `prose_generated`
- `run_completed`
- `run_failed`

当前 `RunEventRefKind` 已包含：

- `context-packet`
- `agent-invocation`
- `proposal-set`
- `review`
- `canon-patch`
- `prose-draft`
- `artifact`

这个方向是正确的：run event 自身不内联大 payload，只通过 refs 指向可读 artifact。

### 1.5 renderer 目前还没有真正消费 artifact / trace detail

当前 renderer 侧已经有：

- `ProjectRuntime.runClient`
- `RunClient.startSceneRun(...)`
- `RunClient.getRun(...)`
- `RunClient.getRunEvents(...)`
- `RunClient.submitRunReviewDecision(...)`
- `RunEventStreamPanel`
- `RunReviewGate`
- `useSceneRunSession(...)`
- Scene / Orchestrate 中的 run support
- Scene bottom dock 的 active run event summary

但当前 renderer 侧还缺：

- `listRunArtifacts(...)`
- `getRunArtifact(...)`
- `getRunTrace(...)`
- artifact detail hooks
- trace read hooks
- 可点击的 run event refs
- context packet / proposal set / canon patch / prose draft 的 inspector UI

也就是说，BE-PR3 已经把 API surface 做出来了，但产品工作流还没有真正把它读出来。

---

## 2. PR26 的唯一目标

**把 run artifact / trace read surfaces 接进 renderer，让 Scene / Orchestrate 能从运行时间线进入 artifact 和 trace 的只读审阅面。**

PR26 完成后，用户应该能：

1. 在 Scene / Orchestrate 启动或查看一个 active run。
2. 在 run event timeline 中看到 refs。
3. 点击 `context-packet / agent-invocation / proposal-set / canon-patch / prose-draft` ref。
4. 在同一工作台内看到对应 artifact detail。
5. 切换到 run trace summary，看到 proposal -> canon -> prose -> asset 的最小链路。
6. 提交 review decision 后，canon patch / prose draft artifacts 能出现在 artifact list 与 trace 中。
7. 继续保持 browser route 不变，不把 artifact selection 写进 URL。

一句话说：

**PR26 要把 run event stream 从“事件列表”推进成“可审阅的运行来源入口”。**

---

## 3. 本轮明确不做

不要把 PR26 扩成新的后端大 PR。

本轮不做：

- 不做真实 SSE / EventSource。
- 不做 Temporal / Inngest / BullMQ 接入。
- 不做真实 LLM / model gateway。
- 不做真实 DB / persistence migration。
- 不做 prompt manager。
- 不做 context packet 编辑。
- 不做 proposal variants / swipe。
- 不做 branch / checkpoint mutation。
- 不做 asset activation policy。
- 不做 full run debugger。
- 不做 token log / raw model transcript。
- 不把 artifact selection 写进 workbench route。

PR26 是 **read-only integration**，不是 orchestration engine 实现。

---

## 4. 必须遵守的硬约束

### 4.1 RunEventRecord 继续保持轻量

禁止在 `RunEventRecord` 中内联：

- prompt
- context packet 全量内容
- proposal set 全量内容
- prose 正文
- model transcript
- token stream

正确规则：

```text
RunEventRecord 只保存 label / summary / severity / refs。
大 payload 永远通过 artifact / trace detail query 读取。
```

### 4.2 artifact selection 不能成为 route 真源

本轮不新增：

- `artifactId=`
- `traceNodeId=`
- `runPanel=`
- `contextPacketId=`

artifact selection 是 dock / panel 内部的局部 UI 状态，不是对象轴 / lens 级 route 状态。

### 4.3 run query identity 必须稳定

推荐 query key 形态：

```ts
runQueryKeys.detail(projectId, runId)
runQueryKeys.events(projectId, runId)
runQueryKeys.eventsPage(projectId, runId, cursor)
runQueryKeys.artifacts(projectId, runId)
runQueryKeys.artifact(projectId, runId, artifactId)
runQueryKeys.trace(projectId, runId)
```

不要把 active dock tab、selected artifact、local panel state 混入 run detail / events query key。

### 4.4 Scene 主舞台仍然是 Orchestrate，不被 artifact inspector 抢走

artifact / trace 是 supporting surface。

正确落点：

- Scene bottom dock 的 Events tab 扩展。
- 或在 Events tab 内增加 artifact detail split/panel。
- 或在 run event stream panel 下方显示 selected artifact detail。

不要把 Scene / Orchestrate 主舞台改成 artifact browser。

### 4.5 保留当前 review gate 行为

`RunReviewGate` 已经提供：

- Accept
- Accept with edit
- Request rewrite
- Reject

PR26 只让 decision 之后的 artifact / trace 更可见，不重写 review decision 语义。

---

## 5. 建议的数据与类型改动

### 5.1 新增 renderer 侧 artifact types

新增：

```text
packages/renderer/src/features/run/api/run-artifact-records.ts
```

从 API contract 对齐以下类型，但不要从 `@narrative-novel/api` 直接 import：

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
  title: LocalizedTextRecord
  summary: LocalizedTextRecord
  statusLabel: LocalizedTextRecord
  createdAtLabel: LocalizedTextRecord
  sourceEventIds: string[]
}
```

并补齐 detail union：

- `ContextPacketArtifactDetailRecord`
- `AgentInvocationArtifactDetailRecord`
- `ProposalSetArtifactDetailRecord`
- `CanonPatchArtifactDetailRecord`
- `ProseDraftArtifactDetailRecord`
- `RunArtifactDetailRecord`
- `RunArtifactListResponse`
- `RunArtifactDetailResponse`

### 5.2 新增 renderer 侧 trace types

新增：

```text
packages/renderer/src/features/run/api/run-trace-records.ts
```

至少包含：

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
```

以及：

- `RunTraceNodeRecord`
- `RunTraceLinkRecord`
- `RunTraceResponse`

---

## 6. Runtime / client 改动

### 6.1 扩展 `RunClient`

修改：

```text
packages/renderer/src/features/run/api/run-client.ts
```

增加：

```ts
interface ListRunArtifactsInput {
  runId: string
}

interface GetRunArtifactInput {
  runId: string
  artifactId: string
}

interface GetRunTraceInput {
  runId: string
}

interface RunClient {
  startSceneRun(input: StartSceneRunInput): Promise<RunRecord>
  getRun(input: GetRunInput): Promise<RunRecord | null>
  getRunEvents(input: GetRunEventsInput): Promise<RunEventsPageRecord>
  submitRunReviewDecision(input: SubmitRunReviewDecisionInput): Promise<RunRecord>

  listRunArtifacts(input: ListRunArtifactsInput): Promise<RunArtifactListResponse>
  getRunArtifact(input: GetRunArtifactInput): Promise<RunArtifactDetailResponse>
  getRunTrace(input: GetRunTraceInput): Promise<RunTraceResponse>
}
```

### 6.2 扩展 API route contract

修改：

```text
packages/renderer/src/app/project-runtime/api-route-contract.ts
```

增加：

```ts
runArtifacts({ projectId, runId })
runArtifact({ projectId, runId, artifactId })
runTrace({ projectId, runId })
```

路径必须对齐 API server：

```text
/api/projects/{projectId}/runs/{runId}/artifacts
/api/projects/{projectId}/runs/{runId}/artifacts/{artifactId}
/api/projects/{projectId}/runs/{runId}/trace
```

### 6.3 扩展 `createApiProjectRuntime(...)`

修改：

```text
packages/renderer/src/app/project-runtime/api-project-runtime.ts
```

在 `createRunClient(...)` 中增加：

```ts
async listRunArtifacts({ runId }) {
  return transport.requestJson({
    method: 'GET',
    path: apiRouteContract.runArtifacts({ projectId, runId }),
  })
}

async getRunArtifact({ runId, artifactId }) {
  return transport.requestJson({
    method: 'GET',
    path: apiRouteContract.runArtifact({ projectId, runId, artifactId }),
  })
}

async getRunTrace({ runId }) {
  return transport.requestJson({
    method: 'GET',
    path: apiRouteContract.runTrace({ projectId, runId }),
  })
}
```

### 6.4 扩展 mock runtime

修改：

```text
packages/renderer/src/features/run/api/mock-run-db.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
```

目标：Storybook / unit tests 不依赖 API server 也能显示 artifact / trace panel。

要求：

- 复用现有 mock run events refs。
- artifact summaries 与 detail ids 必须能和 refs 对上。
- review decision accept 后，mock 也要能暴露 canon patch / prose draft artifacts。
- trace response 至少覆盖 context -> invocation -> proposal -> canon -> prose。

---

## 7. Hooks 改动

新增：

```text
packages/renderer/src/features/run/hooks/useRunArtifactsQuery.ts
packages/renderer/src/features/run/hooks/useRunArtifactDetailQuery.ts
packages/renderer/src/features/run/hooks/useRunTraceQuery.ts
```

### 7.1 `useRunArtifactsQuery(runId)`

职责：

- 读取 artifact summary list。
- `enabled: Boolean(runId)`。
- 失败时返回 `error`，不影响 run events 本身展示。

### 7.2 `useRunArtifactDetailQuery({ runId, artifactId })`

职责：

- 读取选中 artifact detail。
- artifactId 为空时不请求。
- 404 时显示 artifact not found empty state，不打崩 Events tab。

### 7.3 `useRunTraceQuery(runId)`

职责：

- 读取 run trace response。
- trace 读取失败时只影响 trace panel。
- 不影响 review gate / event timeline。

---

## 8. UI 组件改动

### 8.1 新增 `RunArtifactRefList`

新增：

```text
packages/renderer/src/features/run/components/RunArtifactRefList.tsx
```

职责：

- 渲染一个 event 的 refs。
- 支持点击 artifact-like refs。
- 对 `review` refs 可先保持静态 badge。

props：

```ts
interface RunArtifactRefListProps {
  refs?: RunEventRefRecord[]
  selectedArtifactId?: string | null
  onSelectArtifact?: (artifactId: string) => void
}
```

规则：

- `context-packet / agent-invocation / proposal-set / canon-patch / prose-draft / artifact` 可点击。
- `review` 暂时不可点击或只作为 badge。
- 点击不得触发 event row 的其他行为。

### 8.2 改造 `RunEventStreamPanel`

修改：

```text
packages/renderer/src/features/run/components/RunEventStreamPanel.tsx
```

新增 props：

```ts
selectedArtifactId?: string | null
onSelectArtifact?: (artifactId: string) => void
```

将当前只显示 `ref.kind` 的 trailing badges 改为 `RunArtifactRefList`。

### 8.3 新增 artifact detail panels

新增：

```text
packages/renderer/src/features/run/components/RunArtifactInspectorPanel.tsx
packages/renderer/src/features/run/components/RunArtifactDetailSections.tsx
```

`RunArtifactInspectorPanel` 根据 detail kind 分发：

- `ContextPacketArtifactPanel`
- `AgentInvocationArtifactPanel`
- `ProposalSetArtifactPanel`
- `CanonPatchArtifactPanel`
- `ProseDraftArtifactPanel`

#### Context Packet panel 必须显示

- sections
- included canon facts
- included assets + reason
- excluded private facts + reason
- output schema label
- token budget label

#### Agent Invocation panel 必须显示

- agent role
- model label
- input summary
- output summary
- context packet id
- output schema label
- generated refs

#### Proposal Set panel 必须显示

- review id
- source invocation ids
- proposals
- change kind
- risk label
- related assets
- review options

#### Canon Patch panel 必须显示

- decision
- source proposal set id
- accepted proposal ids
- accepted facts
- related assets
- trace link ids

#### Prose Draft panel 必须显示

- source canon patch id
- source proposal ids
- excerpt
- word count
- related assets
- trace link ids

### 8.4 新增 `RunTracePanel`

新增：

```text
packages/renderer/src/features/run/components/RunTracePanel.tsx
```

第一版不要做图谱。

用分组列表即可：

- Summary：proposalSetCount / canonPatchCount / proseDraftCount / missingTraceCount
- Links grouped by relation
- Nodes referenced by selected relation

不要引入图表库，不做 graph canvas。

### 8.5 新增 `RunEventInspectorPanel`

新增：

```text
packages/renderer/src/features/run/components/RunEventInspectorPanel.tsx
```

职责：

- 组合 artifact list、selected artifact detail、trace panel。
- 可以内部提供两个 tab：`Artifact` / `Trace`。
- 默认显示 selected artifact detail。
- 没有 selected artifact 时显示 artifact list / trace summary。

---

## 9. Scene 接线改动

### 9.1 改造 `SceneBottomDock` 的 Events tab

修改：

```text
packages/renderer/src/features/scene/components/SceneBottomDock.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
```

当前 Events tab 已经能接收 `runSupport` 并显示 recent run events。

PR26 要做：

- 在 active tab 为 `events` 时，使用 active run id 读取 artifacts / trace。
- 为 Events tab 增加局部 `selectedArtifactId`。
- recent run events 中 refs 可点击。
- 点击 ref 后在 Events tab 下方或右侧显示 artifact detail。
- Trace panel 可从 Events tab 内打开。

### 9.2 保持 SceneExecutionTab 的 run support 不膨胀

`SceneExecutionTab` 中可以继续只显示：

- run status
- latest event
- RunReviewGate
- compact event stream

不要把完整 artifact detail 放进 SceneExecutionTab 主舞台。完整 detail 放 bottom dock。

### 9.3 review decision 后刷新 artifact / trace queries

修改：

```text
packages/renderer/src/features/run/hooks/useSceneRunSession.ts
packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts
```

提交 review decision 成功后，除了已有 scene query invalidation，还应：

- invalidate run detail
- invalidate run events
- invalidate run artifacts
- invalidate run trace

确保 accept / accept-with-edit 后 canon patch / prose draft artifacts 和 trace 链出现。

---

## 10. API server 侧只做最小补强

BE-PR3 已经有 artifacts / trace routes，本轮 API 侧只做防漏补强，不扩后端能力。

允许修改：

```text
packages/api/src/routes/runArtifacts.ts
packages/api/src/repositories/runFixtureStore.ts
packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts
packages/api/src/orchestration/sceneRun/sceneRunTraceLinks.ts
```

仅当测试暴露问题时做：

- artifact sourceEventIds 不稳定。
- trace node/link 去重问题。
- accepted review decision 后 artifact list 未包含 canon patch / prose draft。
- artifact detail 404 / run not found 错误体不统一。

禁止新增：

- DB
- Temporal
- SSE
- LLM
- auth
- real model transcript endpoint

---

## 11. 测试计划

### 11.1 Route contract tests

修改：

```text
packages/renderer/src/app/project-runtime/api-route-contract.test.ts
```

新增断言：

- `runArtifacts(...)`
- `runArtifact(...)`
- `runTrace(...)`

### 11.2 API runtime tests

修改 / 新增：

```text
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
```

至少覆盖：

1. `runClient.listRunArtifacts(...)` 请求正确 path。
2. `runClient.getRunArtifact(...)` 请求正确 path。
3. `runClient.getRunTrace(...)` 请求正确 path。
4. artifact / trace 读取失败时抛 `ApiRequestError`，不吞错误。

### 11.3 Run hook tests

新增：

```text
packages/renderer/src/features/run/hooks/useRunArtifactsQuery.test.tsx
packages/renderer/src/features/run/hooks/useRunArtifactDetailQuery.test.tsx
packages/renderer/src/features/run/hooks/useRunTraceQuery.test.tsx
```

至少覆盖：

- runId 为空不请求。
- happy path 返回数据。
- 404 / 500 时返回 error。
- query key 带 projectId + runId + artifactId。

### 11.4 Run component tests

新增 / 修改：

```text
packages/renderer/src/features/run/components/RunArtifactRefList.test.tsx
packages/renderer/src/features/run/components/RunArtifactInspectorPanel.test.tsx
packages/renderer/src/features/run/components/RunTracePanel.test.tsx
packages/renderer/src/features/run/components/RunEventStreamPanel.test.tsx
```

至少覆盖：

- refs 渲染为可点击 artifact chips。
- 点击 context-packet ref 调用 `onSelectArtifact`。
- context packet panel 显示 included / excluded context。
- proposal set panel 显示 proposals 和 review options。
- canon patch panel 显示 accepted facts。
- prose draft panel 显示 excerpt / source ids。
- trace panel 显示 summary + grouped relation links。

### 11.5 Scene dock integration tests

修改：

```text
packages/renderer/src/features/scene/containers/SceneDockContainer.test.tsx
```

新增路径：

```text
打开 Scene / Orchestrate
-> active run events 出现在 dock events tab
-> 点击 context-packet ref
-> artifact detail panel 显示 included assets / excluded private facts
-> 提交 accept review decision
-> dock events 更新 canon_patch_applied / prose_generated
-> artifact list 能打开 canon patch / prose draft detail
-> trace panel 显示 accepted_into / rendered_as links
```

### 11.6 API server read surface tests

保留并补充：

```text
packages/api/src/createServer.run-artifacts.test.ts
packages/api/src/createServer.read-surfaces.test.ts
```

至少确认：

- `GET /runs/:runId/artifacts` 返回 list。
- `GET /runs/:runId/artifacts/:artifactId` 返回对应 union detail。
- `GET /runs/:runId/trace` 返回 nodes / links / summary。
- run not found 返回统一 JSON 错误体。
- artifact not found 返回统一 JSON 错误体。

### 11.7 App smoke（推荐）

新增或扩展：

```text
packages/renderer/src/App.scene-runtime-smoke.test.tsx
```

路径：

```text
API runtime mode
-> 打开 scene orchestrate
-> start rewrite run
-> dock events 显示 context_packet_built / proposal_created
-> 点击 proposal-set ref
-> 显示 proposal set detail
-> accept with edit
-> dock events 显示 canon_patch_applied / prose_generated
-> 打开 trace
-> trace summary 显示 canonPatchCount=1 / proseDraftCount=1
```

---

## 12. Storybook 建议

新增：

```text
RunArtifactRefList.stories.tsx
RunArtifactInspectorPanel.stories.tsx
RunTracePanel.stories.tsx
RunEventInspectorPanel.stories.tsx
```

更新：

```text
SceneDockContainer.stories.tsx
```

最少 story 组合：

- `ContextPacket`
- `ProposalSet`
- `CanonPatch`
- `ProseDraft`
- `TraceSummary`
- `EventsWithClickableRefs`
- `ErrorArtifactNotFound`

---

## 13. 建议文件改动清单

### 13.1 新增

```text
packages/renderer/src/features/run/api/run-artifact-records.ts
packages/renderer/src/features/run/api/run-trace-records.ts
packages/renderer/src/features/run/hooks/useRunArtifactsQuery.ts
packages/renderer/src/features/run/hooks/useRunArtifactDetailQuery.ts
packages/renderer/src/features/run/hooks/useRunTraceQuery.ts
packages/renderer/src/features/run/components/RunArtifactRefList.tsx
packages/renderer/src/features/run/components/RunArtifactInspectorPanel.tsx
packages/renderer/src/features/run/components/RunArtifactDetailSections.tsx
packages/renderer/src/features/run/components/RunTracePanel.tsx
packages/renderer/src/features/run/components/RunEventInspectorPanel.tsx
```

### 13.2 修改

```text
packages/renderer/src/features/run/api/run-client.ts
packages/renderer/src/features/run/api/mock-run-db.ts
packages/renderer/src/features/run/hooks/run-query-keys.ts
packages/renderer/src/features/run/hooks/useSceneRunSession.ts
packages/renderer/src/features/run/hooks/useSubmitRunReviewDecisionMutation.ts
packages/renderer/src/features/run/components/RunEventStreamPanel.tsx
packages/renderer/src/features/scene/components/SceneBottomDock.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
packages/renderer/src/app/project-runtime/project-runtime.ts
packages/renderer/src/app/project-runtime/api-route-contract.ts
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
packages/renderer/src/app/i18n/**
```

### 13.3 尽量不动

```text
packages/renderer/src/features/book/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/review/**
packages/renderer/src/features/traceability/**
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
```

PR26 不应改 scope / lens / route 模型。

---

## 14. 实施顺序（给 AI 的执行顺序）

### Step 1 — 补 renderer 类型

- 新增 `run-artifact-records.ts`
- 新增 `run-trace-records.ts`
- 与 API contract 字段保持一致
- 不从 API package import 类型

### Step 2 — 扩 route contract 与 RunClient

- 修改 `api-route-contract.ts`
- 修改 `run-client.ts`
- 修改 `api-project-runtime.ts`
- 修改 `mock-project-runtime.ts`
- 补 route contract / api runtime tests

### Step 3 — 扩 mock run db

- artifact list 能根据 run events refs 返回 summaries
- artifact detail 能覆盖五种 kind
- trace response 能覆盖最小 proposal -> canon -> prose 链
- review decision 后 mock artifacts / trace 同步变化

### Step 4 — 新增 hooks

- `useRunArtifactsQuery`
- `useRunArtifactDetailQuery`
- `useRunTraceQuery`
- 补 hook tests

### Step 5 — 做可点击 refs

- 新增 `RunArtifactRefList`
- 修改 `RunEventStreamPanel`
- 保持旧 event timeline 的加载 / 空 / 错误态

### Step 6 — 做 artifact detail UI

- 新增 `RunArtifactInspectorPanel`
- 新增各 kind detail sections
- 不做编辑，不做 raw transcript

### Step 7 — 做 trace UI

- 新增 `RunTracePanel`
- 分组列表展示 relation links
- 不做 graph canvas

### Step 8 — 接进 Scene bottom dock

- `SceneDockContainer` 管理 selected artifact local state
- Events tab 读取 artifacts / trace
- 点击 run event ref 后显示 artifact detail
- review decision 后刷新 artifact / trace

### Step 9 — 补集成测试与 stories

- run components
- run hooks
- SceneDockContainer
- App smoke
- Storybook states

---

## 15. 完成后的验收标准

满足以下条件，PR26 才算完成：

1. renderer `RunClient` 已支持 `listRunArtifacts / getRunArtifact / getRunTrace`。
2. API runtime 与 mock runtime 都能提供 artifact / trace read surface。
3. `RunEventStreamPanel` 中 artifact refs 可点击。
4. 点击 context packet ref 能看到 context packet detail。
5. 点击 proposal set ref 能看到 proposals / review options。
6. accept / accept-with-edit review decision 后，canon patch / prose draft artifacts 可打开。
7. run trace panel 能显示 proposal -> canon -> prose 的最小链路。
8. Scene / Orchestrate 主舞台仍保持原职责，没有变成 artifact browser。
9. 不新增 route 参数，不改 scope / lens 模型。
10. 不实现 SSE / Temporal / real DB / real LLM。
11. `RunEventRecord` 仍然不内联大 payload。
12. API 与 renderer tests 都覆盖新增合同。

---

## 16. PR26 结束时不要留下的债

以下情况都算做偏：

- 在 `RunEventRecord` 里塞完整 context / prompt / prose。
- 把 selected artifact 写进 URL。
- 为 artifact inspector 新增全局 store 作为第二真源。
- 把 trace 做成 graph-first 主入口。
- 顺手接 SSE / Temporal / DB / LLM。
- 把 Context Packet 做成可编辑 Prompt Manager。
- 把 Proposal Set 做成 variants / swipe 系统。
- SceneExecutionTab 主舞台被 artifact detail 挤占。
- mock runtime 与 API runtime 的 artifact shape 不一致。

PR26 做完后的正确状态应该是：

**BE-PR3 暴露出来的 run artifacts / trace links 已经真正成为前端可审阅的产品面，但系统仍保持 fixture-backed、read-only、route-first、event-ref-first 的纪律。**

---

## 17. PR26 之后的建议顺序

PR26 完成后，再进入下面两条线之一。

### 选项 A：BE-PR4 — Prose Agent / Artifact Write-through Skeleton

目标：让 `prose_generated` 不只是 fixture artifact，而是从 accepted canon patch 生成并写入 scene prose draft read model。

前提：PR26 已经让用户能看懂 canon patch / prose draft artifact 的来源。

### 选项 B：PR27 — Proposal Variants Foundation

目标：借鉴 swipe/regenerate 心智，但落到 proposal set variants，而不是直接 swipe prose。

前提：proposal set artifact detail 已经可读。

当前更推荐：

```text
PR26 -> BE-PR4 -> PR27
```

原因是：先让 artifact / trace 可见，再让 prose 产物真实写入，最后再做 variants。
