# BE-PR2 执行文档（基于 `codex/pr25-backend-orchestration-integration-ui` 当前实际代码）

## 这份文档的目的

这不是路线图回顾，也不是泛泛的“后端继续做深”。

这是一份**基于当前 `codex/pr25-backend-orchestration-integration-ui` 分支真实代码状态**整理出来的、可以直接交给 AI agent 实施的下一步执行文档。

PR25 之后，最缺的已经不是再加一块 renderer UI，也不是立刻做 Context Packet Inspector。更自然的下一步是：

**BE-PR2：SceneRun Workflow Skeleton（后端内部抽离）**

一句话判断：

**PR25 已经证明 renderer 能真实消费 HTTP runtime；现在的瓶颈是 backend 内部的 run 流程仍然主要挤在 fixture store 里。下一步应该先把这条 fixture orchestration 抽成稳定的 workflow / transition / artifact skeleton，再让后面的 Context Packet Inspector、Proposal Variants 有干净后端落点。**

---

## 一、先确认当前代码基线

下面这些判断必须建立在当前分支已经存在的代码事实上，而不是沿用 PR23 / PR24 时的预期。

### 1. 仓库已经是 `renderer + api` 双包结构

当前仓库已经不再只是 renderer 原型，而是同时拥有：

- `packages/renderer`
- `packages/api`

`packages/api/src` 里已经有：

- `contracts`
- `http`
- `repositories`
- `routes`
- `createServer.ts`
- `server.ts`
- 对应的 read / write / runtime-info / run-flow 测试

也就是说，后端现在已经不是“只有一份计划文档”，而是本地可运行的 Fastify API 包。

### 2. run HTTP contract 已经成立，而且 renderer 已经真的在消费它

当前 run 路由已经提供：

- `POST /api/projects/:projectId/scenes/:sceneId/runs`
- `GET /api/projects/:projectId/runs/:runId`
- `GET /api/projects/:projectId/runs/:runId/events`
- `GET /api/projects/:projectId/runs/:runId/events/stream`
- `POST /api/projects/:projectId/runs/:runId/review-decisions`

其中 `/events/stream` 仍然明确保留为 `501` placeholder；这说明当前真实消费方式仍然是 polling + cursor page，而不是 SSE。

### 3. renderer 侧已经跑通第一条真实 HTTP orchestration 纵切

当前 renderer 已经新增：

- `useRunEventTimelineQuery.ts`
- `useSceneRunSession.ts`
- `RunEventStreamPanel.tsx`
- `RunReviewGate.tsx`

并且 `SceneExecutionContainer.tsx` / `SceneExecutionTab.tsx` / `SceneBottomDock.tsx` 已经把这条 run 纵切接进 Scene / Orchestrate：

- 可以 start / continue / rewrite run
- 可以轮询 run detail
- 可以分页拉取并合并 run events
- `waiting_review` 时显示 review gate
- scene bottom dock 会显示最近 run milestones

也就是说：

**前端现在已经不是只认 mock runtime，而是真的在吃 API runtime。**

### 4. fixture repository 已经会把 run 结果同步回 scene / chapter read model

当前 `fixtureRepository.ts` 已经不是单纯的 read-only 假仓库。

它会：

- `startSceneRun(...)` 后调用 `runStore.startSceneRun(...)`
- 然后执行 `syncRunMutations(...)`
- `submitRunReviewDecision(...)` 后再执行 `syncRunMutations(...)`

这意味着：

- scene workspace 的 `latestRunId / runStatus / status`
- scene execution 的 `runId / runtimeSummary / canContinueRun / canOpenProse`
- scene prose 的 `statusLabel / latestDiffSummary`
- scene dock 的 run-status signals
- chapter structure 行上的 `runStatusLabel / lastRunLabel`

已经会随着 run 状态推进而刷新。

### 5. 当前真正的后端瓶颈，是 `runFixtureStore.ts` 过于“全能”

当前 `packages/api/src/repositories/runFixtureStore.ts` 同时承担了太多职责：

- run id / review id / artifact id 生成
- startSceneRun 的完整事件序列拼装
- review decision 的状态转移
- `context_packet_built / agent_invocation / proposal_created / review_requested / canon_patch_applied / prose_generated` 等产品事件构建
- run state 内存持久化
- cursor pagination
- summary / latestEventId / eventCount 更新

这会带来两个问题：

1. **workflow 语义被埋进 store 细节里**，后续很难替换成更真实的 orchestration module。
2. **PR26 / PR27 需要的上下文包、proposal-set、canon-patch 等对象，当前只有 refs，没有干净的内部所有权。**

所以，PR25 之后最该做的不是继续堆前端 UI，而是先把 backend 的 scene run 流程抽成稳定 skeleton。

---

## 二、BE-PR2 的唯一目标

**把当前塞在 `runFixtureStore.ts` 里的 scene run fixture orchestration，抽成一条明确的 SceneRun Workflow Skeleton。**

完成后，backend 内部应该从：

```text
route -> repository -> runFixtureStore inline event/state logic
```

推进成：

```text
route
  -> repository
    -> sceneRunWorkflow (pure orchestration logic)
      -> event factory / artifact factory / decision transition
    -> runFixtureStore (thin in-memory persistence + pagination)
    -> syncRunMutations(project read models)
```

一句话说：

**BE-PR2 不是增加新 capability，而是给已经存在的 capability 建立清楚边界。**

---

## 三、本轮明确不做

为了让 BE-PR2 保持“窄而实”，以下内容不要混进来：

- 不改任何 renderer 组件或 route。
- 不改已有 HTTP endpoint shape。
- 不接真实数据库。
- 不接 Temporal。
- 不接真实 LLM。
- 不做 SSE / EventSource 实现。
- 不做 Context Packet Inspector UI。
- 不做 context packet detail endpoint。
- 不做 Proposal Variants / swipe。
- 不做 Asset Activation Policy。
- 不做 worker / task queue。
- 不做 auth / session 扩建。
- 不重做 `syncRunMutations(...)` 的产品刷新策略。
- 不把 `continueSceneRun(...)` 扩成新的公开 command surface。
- 不扩 Book / Chapter / Asset 的 orchestration UI。

BE-PR2 的定位必须非常明确：

**只做 backend 内部 scene run workflow skeleton 抽离。**

---

## 四、必须遵守的硬约束

### 4.1 外部 HTTP contract 完全不变

以下外部 contract 本轮都不能变：

- `POST /api/projects/:projectId/scenes/:sceneId/runs`
- `GET /api/projects/:projectId/runs/:runId`
- `GET /api/projects/:projectId/runs/:runId/events`
- `GET /api/projects/:projectId/runs/:runId/events/stream`
- `POST /api/projects/:projectId/runs/:runId/review-decisions`

包括：

- body / response 字段
- run status 语义
- event kind / ref kind
- cursor page 语义
- `/events/stream` 继续返回 `501`

### 4.2 renderer 不需要因为 BE-PR2 改任何消费逻辑

`ProjectRuntime.runClient`、`useSceneRunSession(...)`、`RunEventStreamPanel`、`RunReviewGate`、`SceneExecutionTab`、`SceneBottomDock` 的现有消费方式本轮应保持不变。

也就是说：

**BE-PR2 是 backend internal refactor + internal skeleton，不是 API contract PR。**

### 4.3 `syncRunMutations(...)` 继续是 scene/chapter read model 刷新入口

当前 read model 的同步纪律是成立的，不要在 BE-PR2 顺手把它打散到 workflow 各步里。

保持：

- `runStore.startSceneRun(...)` / `submitRunReviewDecision(...)` 返回 `RunRecord`
- repository 层继续在成功后调用 `syncRunMutations(projectId, run)`

也就是说：

- workflow 只负责 orchestration state 与 artifact 产出
- repository 继续负责把 run 结果投影到产品读模型

### 4.4 Product events 继续不是 Temporal history

BE-PR2 不应该让内部 workflow 抽离变成“先按 Temporal 的样子写一套伪 history”。

当前产品事件流应该继续是：

- `run_created`
- `run_started`
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

这是产品级 run timeline，不是 workflow engine 内部事件总线。

### 4.5 `request-rewrite` 等当前 decision 语义先保持现状

当前 `submitRunReviewDecision(...)` 的 decision 行为已经被 renderer 和测试消费：

- `accept`
- `accept-with-edit`
- `request-rewrite`
- `reject`

BE-PR2 不要顺手改变这些语义，只把它们抽成清楚的 transition function。

即便当前 `request-rewrite` 仍然比较轻，也先保持外部行为一致。

### 4.6 `runFixtureStore.ts` 必须收缩成“薄 store”

BE-PR2 结束后，`runFixtureStore.ts` 不应继续持有大段 inline workflow 细节。

它应该只负责：

- project -> run state bucket
- sequence bucket
- run state persistence
- cursor pagination
- reset / seed
- 调用 workflow start / decision transition

不要再把：

- 事件清单拼装
- artifact refs 的对象语义
- decision 分支逻辑
- summary / completion rules

继续堆在 store 里。

---

## 五、建议的内部结构改法

## 5.1 新增 `packages/api/src/orchestration/sceneRun/`

推荐新增：

```text
packages/api/src/orchestration/sceneRun/
  sceneRunRecords.ts
  sceneRunIds.ts
  sceneRunEventFactory.ts
  sceneRunArtifacts.ts
  sceneRunTransitions.ts
  sceneRunWorkflow.ts
  sceneRunWorkflow.test.ts
  sceneRunTransitions.test.ts
```

### 角色分工

#### `sceneRunRecords.ts`
定义 BE-PR2 内部 workflow 专用类型，例如：

- `SceneRunWorkflowStartInput`
- `SceneRunWorkflowDecisionInput`
- `SceneRunWorkflowState`
- `SceneRunArtifactRecord`
- `SceneRunArtifactKind`

#### `sceneRunIds.ts`
统一管理：

- `buildRunId(...)`
- `buildReviewId(...)`
- `buildContextPacketId(...)`
- `buildAgentInvocationId(...)`
- `buildProposalSetId(...)`
- 以及 sequence label helper

把当前散落在 `runFixtureStore.ts` 的 id 规则抽出来，后面 PR26 / PR27 才不会改一次 UI ref id 又改一次 backend seed。

#### `sceneRunEventFactory.ts`
统一管理：

- `createRunEvent(...)`
- `appendRunEvent(...)`
- severity / label / summary 的默认规则

### 为什么值得单独抽这一层

因为当前 `runFixtureStore.ts` 已经在同时做：

- workflow transition
- event building
- persistence
- pagination

BE-PR2 的第一步应该先把“怎么造事件”抽离出来。

#### `sceneRunArtifacts.ts`
这是 BE-PR2 最关键的新边界。

推荐引入 internal-only artifact records，用来承接当前 event refs 已经提到的对象：

- `context-packet`
- `agent-invocation`
- `proposal-set`
- `canon-patch`
- `prose-draft`

第一版这些 records 只在 backend 内部存在，不新增 HTTP route。

##### 推荐最小字段

```ts
interface SceneRunArtifactRecord {
  kind: 'context-packet' | 'agent-invocation' | 'proposal-set' | 'canon-patch' | 'prose-draft'
  id: string
  runId: string
  sceneId: string
  title: string
  summary: string
  status?: string
  meta?: Record<string, string | number | boolean | null | undefined>
}
```

### 为什么这一步重要

因为 PR25 已经让 event refs 指向这些对象，但这些对象目前还只是“字符串 ref”。

BE-PR2 要做的是：

**先在 backend 内部让这些 refs 对应到真实 internal records。**

这样后面做：

- PR26 Context Packet Inspector
- PR27 Proposal Variants

时，就不会重新回头改 run skeleton。

#### `sceneRunTransitions.ts`
专门收敛 review decision 的状态推进规则，例如：

- `applyAcceptedDecision(...)`
- `applyAcceptWithEditDecision(...)`
- `applyRewriteRequestedDecision(...)`
- `applyRejectedDecision(...)`

每个 transition 只返回：

- 需要追加的 events
- 需要生成的 artifacts
- 新的 run status / summary / completedAtLabel / pendingReviewId

#### `sceneRunWorkflow.ts`
这是 BE-PR2 的核心。

它至少提供两个纯函数：

```ts
startSceneRunWorkflow(input): SceneRunWorkflowState
applySceneRunReviewDecision(state, input): SceneRunWorkflowState
```

返回内容应至少包括：

- `run`
- `events`
- `artifacts`

### 关键纪律

这个 workflow 层：

- 不知道 Fastify request/response
- 不知道 project snapshot read models
- 不做 cursor pagination
- 不做 HTTP error body
- 不直接改 scene/chapter read model

它只负责：

**给定输入，产出 scene run 的 orchestration state。**

---

## 六、`runFixtureStore.ts` 应该怎么收缩

BE-PR2 之后，`runFixtureStore.ts` 应只保留 4 类职责：

### 6.1 in-memory persistence

继续保留：

- `runStatesByProjectId`
- `sceneRunSequenceByProjectId`
- `reset()`
- `setRunState(...)`
- `requireRunState(...)`

### 6.2 start command wiring

把当前：

- 生成 sequence
- inline 拼一整串 events
- 拼 run record

改成：

```ts
const workflowState = startSceneRunWorkflow(...)
setRunState(projectId, workflowState.run, workflowState.events, workflowState.artifacts)
return clone(workflowState.run)
```

### 6.3 decision command wiring

把当前：

- append review_decision_submitted
- decision 分支逻辑
- append canon/prose/run_completed
- 更新 summary / pendingReviewId / completedAtLabel

改成：

```ts
const nextState = applySceneRunReviewDecision(currentState, input)
replaceRunState(projectId, nextState)
return clone(nextState.run)
```

### 6.4 pagination

`getRunEvents(...)` 的 cursor 分页逻辑本轮可以原样保留。

也就是说：

- workflow 负责生成完整 ordered event list
- store 负责按既有 `EVENT_PAGE_SIZE` 把 event list 切 page

不要把 pagination 逻辑塞进 workflow。

---

## 七、`fixtureRepository.ts` 的改法

这层应继续保持很薄。

### 要做的事

- 继续持有 `runStore`
- 继续在 `startSceneRun(...)` / `submitRunReviewDecision(...)` 后调用 `syncRunMutations(...)`
- 继续只对外暴露现有 repository contract

### 不要做的事

- 不要把 workflow logic 从 `runFixtureStore.ts` 挪到 `fixtureRepository.ts`
- 不要让 repository 直接知道 planner / writer / proposal-set 等 step 细节
- 不要新增 renderer 当前不消费的 repository 公开方法，除非纯测试确实需要

repository 的职责仍然应是：

**组装底层 stores，并把 run 结果投影回产品 read models。**

---

## 八、测试补齐方案

BE-PR2 最值钱的测试，不是“按钮有没有出现”，而是：

**在不改 HTTP contract 的前提下，把 scene run 的内部编排边界固定下来。**

## 8.1 新增 pure workflow 单测

### `sceneRunWorkflow.test.ts`

至少覆盖：

1. `startSceneRunWorkflow(...)` 会生成 ordered events：
   - `run_created`
   - `run_started`
   - `context_packet_built`
   - `agent_invocation_started/completed`
   - `proposal_created`
   - `review_requested`
2. start output 的 run status 为 `waiting_review`
3. `pendingReviewId` 正确
4. `context-packet` / `proposal-set` / `agent-invocation` refs 的 id 与 artifact records 对应
5. 不依赖 repository / Fastify / HTTP

## 8.2 新增 transition 单测

### `sceneRunTransitions.test.ts`

至少覆盖：

1. `accept` 会追加：
   - `review_decision_submitted`
   - `canon_patch_applied`
   - `prose_generated`
   - `run_completed`
2. `accept-with-edit` 会保留 patch/prose 相关事件，但 summary 不同
3. `request-rewrite` 会保留现有外部状态语义，不破坏 contract
4. `reject` 会走 completed 分支
5. transition 不会生成重复 event id
6. transition 会清掉 `pendingReviewId`

## 8.3 `runFixtureStore` 单测

建议新增或扩充：

### `runFixtureStore.test.ts`

至少覆盖：

1. store 只是调用 workflow start / decision transition，不再持有大段 inline event 构造
2. `getRunEvents(...)` cursor 逻辑保持不变
3. reset 后 seed 仍然可用
4. project 隔离仍然成立

## 8.4 保留并升级现有 `createServer.run-flow.test.ts`

这条测试非常值钱，必须保留。

它至少要继续证明：

```text
POST start run
-> GET run detail
-> GET first page events
-> GET next page events
-> POST review decision
-> scene/prose/dock surfaces 刷新
-> /events/stream 仍然 501
```

### 最重要的断言

不是“内部文件变多了”，而是：

- HTTP 返回 shape 不变
- event 序列不变
- scene / chapter 读模型刷新不变
- renderer 未来不需要为 BE-PR2 改消费逻辑

---

## 九、建议的文件改动

## 9.1 新增

```text
packages/api/src/orchestration/sceneRun/sceneRunRecords.ts
packages/api/src/orchestration/sceneRun/sceneRunIds.ts
packages/api/src/orchestration/sceneRun/sceneRunEventFactory.ts
packages/api/src/orchestration/sceneRun/sceneRunArtifacts.ts
packages/api/src/orchestration/sceneRun/sceneRunTransitions.ts
packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts
packages/api/src/orchestration/sceneRun/sceneRunWorkflow.test.ts
packages/api/src/orchestration/sceneRun/sceneRunTransitions.test.ts
packages/api/src/repositories/runFixtureStore.test.ts（若当前尚无）
```

## 9.2 修改

```text
packages/api/src/repositories/runFixtureStore.ts
packages/api/src/repositories/fixtureRepository.ts
packages/api/src/createServer.run-flow.test.ts
```

## 9.3 这一轮尽量不动

```text
packages/renderer/**
packages/api/src/routes/run.ts
packages/api/src/contracts/**
packages/api/src/http/**
packages/api/src/createServer.ts
doc/api-contract.md
```

如果 route 层完全不需要动，就不要为了“更整齐”顺手改 route。

---

## 十、实施顺序（给 AI 的执行顺序）

### Step 1
先抽内部 types / ids / event factory：

- `sceneRunRecords.ts`
- `sceneRunIds.ts`
- `sceneRunEventFactory.ts`

把当前 `runFixtureStore.ts` 中的基础拼装逻辑先拆出来。

### Step 2
再抽 internal artifacts：

- `sceneRunArtifacts.ts`

让 `context-packet` / `agent-invocation` / `proposal-set` / `canon-patch` / `prose-draft` 在 backend 内部拥有真实 records，而不是只有 refs。

### Step 3
实现纯 workflow start：

- `sceneRunWorkflow.ts`

让 `startSceneRunWorkflow(...)` 能独立产出：

- run
- events
- artifacts

并先补单测。

### Step 4
实现 review transition：

- `sceneRunTransitions.ts`

把 accept / accept-with-edit / request-rewrite / reject 的状态推进收敛成纯函数。

### Step 5
回到 `runFixtureStore.ts`：

- 保留 in-memory bucket / sequence / pagination
- 去掉大段 inline workflow 细节
- 改成调用 workflow start / transition

### Step 6
最小改 `fixtureRepository.ts`：

- 继续调用 `syncRunMutations(...)`
- 不扩大公开 repository contract

### Step 7
补 backend tests：

- workflow tests
- transition tests
- store tests
- createServer.run-flow.test.ts 回归验证

---

## 十一、完成后的验收标准

满足以下条件，BE-PR2 就算完成：

1. `packages/api` 仍保持现有 HTTP endpoint 与 response shape。
2. renderer 无需改动即可继续消费 API runtime。
3. `runFixtureStore.ts` 不再持有大段 inline workflow 细节。
4. scene run 的 start / review decision 已被纯 workflow / transition 模块承接。
5. `context-packet` / `agent-invocation` / `proposal-set` / `canon-patch` / `prose-draft` 在 backend 内部已有清楚的 artifact records。
6. `createServer.run-flow.test.ts` 继续通过，且外部可见行为不变。
7. `/events/stream` 仍保持 `501` placeholder。
8. `syncRunMutations(...)` 后的 scene / chapter 读模型刷新不被破坏。
9. PR26 的 Context Packet Inspector 不再需要回头重写 run skeleton。
10. PR27 的 Proposal Variants 也不需要回头重写 `proposal-set` ref 语义。

---

## 十二、BE-PR2 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了抽 workflow，顺手改了 HTTP route shape
- 为了 internal artifacts，顺手加了新的公开 detail endpoint
- 把 renderer 也一起拉进重构
- 把 `syncRunMutations(...)` 散进 workflow 步骤里
- 把 pagination 也重写成另一套 contract
- 为了 request-rewrite 顺手扩了新的 command route
- 为了后面接 Temporal，提前把一切写成伪 workflow engine
- 继续让 `runFixtureStore.ts` 同时负责：workflow + persistence + pagination + read-model projection

BE-PR2 做完后，正确的项目状态应该是：

**前端的真实 HTTP orchestration 纵切保持不变，但 backend 内部已经拥有一条清楚、可测试、可继续演进成真实 workflow engine 的 SceneRun Skeleton。**

---

## 十三、BE-PR2 之后最自然的顺序（不在本轮实施）

更合理的后续顺序是：

1. **PR26：Context Packet Inspector**
   - 利用 `context_packet_built` 与 `context-packet` ref
   - 把上下文装配解释前台化

2. **PR27：Proposal Variants / Swipe for proposal-set**
   - 只做 proposal variants
   - 不直接 swipe prose

也就是说：

**BE-PR2 先把后端内部 run skeleton 站稳，再让 PR26 / PR27 去消费这些更清楚的内部对象。**

---

## 十四、给 AI 的最终一句话指令

在当前 `codex/pr25-backend-orchestration-integration-ui` 已经完成 renderer 对真实 HTTP runtime 的接线前提下，不要继续先堆新的前端 run UI，也不要提前做 Context Packet Inspector / Proposal Variants；先只围绕 **BE-PR2：SceneRun Workflow Skeleton** 做一轮窄而实的 backend internal extraction：

- 保持所有现有 HTTP run endpoints 与 response shape 不变
- 不动 renderer，不动 route，不接 SSE / Temporal / DB / LLM
- 把 `runFixtureStore.ts` 里的 start / review decision orchestration 抽成纯 workflow / transition / artifact 模块
- 让 `runFixtureStore.ts` 收缩为 in-memory persistence + pagination + wiring
- 继续让 `fixtureRepository.ts` 在 start / review 后调用 `syncRunMutations(...)`
- 为 `context-packet` / `agent-invocation` / `proposal-set` / `canon-patch` / `prose-draft` 建立 backend internal artifact records
- 用 pure unit tests 固定 workflow start / decision transition
- 用 `createServer.run-flow.test.ts` 固定外部 contract 与 scene/chapter 刷新不变
- 明确不做公开 artifact detail endpoints、Context Inspector UI、Proposal Variants UI、Temporal 接入
