# PR25 执行文档（基于 `codex/be-pr1-fixture-api-server-skeleton` 实际代码）

## 这份文档的目的

这不是路线图回顾，也不是“接下来把后端继续做深”的泛泛建议。

这是一份**基于 `codex/be-pr1-fixture-api-server-skeleton` 当前真实代码状态**整理出来的、可以直接交给 AI agent 实施的下一步执行文档。

这一步我不建议继续先做新的后端骨架，而建议先做：

**PR25：Backend Orchestration Integration UI**

一句话判断：

**BE-PR1 已经把 fixture-backed API、run timeline、review decision、scene/chapter read model 同步都接起来了；当前最缺的不是再补一层后端抽象，而是把这条真实 HTTP runtime 先接到现有 `Scene / Orchestrate` UI 上，验证 end-to-end 工作流。**

---

## 一、先确认当前代码基线

下面这些判断必须建立在当前分支已经存在的代码事实上，而不是继续沿用 BE-PR1 之前的预期。

### 1. 仓库已经不再是 renderer-only，而是 `renderer + api` 双包结构

当前根目录已经存在：

- `packages/renderer`
- `packages/api`

根脚本也已经有：

- `dev:api`
- `dev:renderer`
- `typecheck`
- `test`
- `build`
- `storybook`

这说明 BE-PR1 不只是“加了几份 contract 文档”，而是已经把本地 API runtime 的可运行壳子接进仓库了。

### 2. `packages/api` 已经拥有真实 Fastify 入口和 feature routes

当前 `packages/api/src/createServer.ts` 已经会：

- 创建 Fastify app
- 注册 CORS
- 创建 fixture repository
- 注册 `/healthz`
- 注册：
  - `project-runtime`
  - `book`
  - `chapter`
  - `asset`
  - `review`
  - `scene`
  - `run`

也就是说，BE-PR1 不是“只有 runs.ts”，而是已经把 renderer 当前需要的读写 slice 一起挂进 API 了。

### 3. run API surface 已经具备最关键的 5 条路径

当前 `packages/api/src/routes/run.ts` 已经提供：

- `POST /api/projects/:projectId/scenes/:sceneId/runs`
- `GET /api/projects/:projectId/runs/:runId`
- `GET /api/projects/:projectId/runs/:runId/events`
- `GET /api/projects/:projectId/runs/:runId/events/stream`
- `POST /api/projects/:projectId/runs/:runId/review-decisions`

其中 `/events/stream` 当前明确保留为 **501 placeholder**，表示这条分支的正确消费方式仍然是 **polling / page contract**，而不是 EventSource / SSE。

### 4. fixture repository 已经不仅能“返回 run”，还会同步 scene/chapter surfaces

当前 `createFixtureRepository(...)` 并不是一个只读假仓库。

它内部已经通过 `runFixtureStore` 与 `syncRunMutations(...)` 把 run 状态回写到当前产品 read models。

已成立的同步至少包括：

#### scene surfaces
- workspace 的 `latestRunId / runStatus / status / currentVersionLabel`
- execution 的 `runId / runtimeSummary / canContinueRun / canOpenProse`
- prose 的 `statusLabel / latestDiffSummary`
- inspector 的 runtime 摘要
- dock 的 run-status event

#### chapter surfaces
- selected chapter scene rows 上的：
  - `runStatusLabel`
  - `lastRunLabel`

这意味着：

**BE-PR1 实际上已经把“run 会影响 scene/chapter read model”这件事做实了。**

### 5. `runFixtureStore` 已经具备一条完整的 fixture workflow timeline

当前 `runFixtureStore` 已不只是“记录 run started / completed”。它已经会生成一条多步 timeline，包括：

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

并且：

- `context_packet_built` 已经有 `context-packet` ref 语义
- `proposal_created` 以 `proposal-set` 为 ref，而不是把 proposal 锁死成单一变体
- `submitRunReviewDecision(...)` 已经会按 accept / accept-with-edit / request-rewrite / reject 走不同状态转移

换句话说：

**BE-PR1 的“后端 fixture workflow”已经足够支撑一次真实的前端集成验证。**

### 6. renderer 侧的 run hooks 也已经存在

当前 `packages/renderer/src/features/run/hooks` 已经有：

- `useStartSceneRunMutation.ts`
- `useRunQuery.ts`
- `useRunEventsQuery.ts`
- `useSubmitRunReviewDecisionMutation.ts`
- `run-query-keys.ts`

其中：

- `useStartSceneRunMutation(...)` 已经会在成功后写入 run detail cache，并预取首屏 events page
- `useSubmitRunReviewDecisionMutation(...)` 已经会在成功后更新 run detail，并 invalidate 当前 run events

也就是说：

**renderer 侧的 transport hooks 已经搭好了，但还没有真正成为 Scene / Orchestrate UI 的主路径。**

### 7. 当前 Scene / Orchestrate 主容器仍主要依赖 scene-local query / actions

当前 `SceneExecutionContainer.tsx` 仍然以：

- `useSceneExecutionQuery(...)`
- `useProposalActions(...)`
- `useSceneWorkspaceActions(...)`

为主。

而 `useSceneWorkspaceActions(...)` 里的 `continueRun()` 仍然走 `sceneClient.continueSceneRun(sceneId)`，然后整体 invalidate scene queries。

这说明当前最大缺口已经非常清楚：

**run API contract 已经存在，但 Scene / Orchestrate UI 还没有正式切到这条新的 API-backed run flow 上。**

---

## 二、为什么下一步应该是 PR25，而不是先做新的后端 PR

### 1. 现在最有价值的风险不是“后端能不能再抽一层”，而是“前端能不能真的吃下这个 contract”

BE-PR1 已经把：

- API routes
- fixture repository
- run store timeline
- review decision
- scene/chapter read model sync
- renderer run hooks

都补到了可以联调的程度。

这时如果继续先做新的后端内部抽象，很可能会跳过最关键的一步验证：

```text
renderer start run
-> API 返回 run
-> renderer 轮询 events
-> 等到 waiting review
-> 提交 decision
-> scene/chapter surfaces 真实刷新
```

而这条线，恰恰是你后续所有真实 orchestration backend 都要守住的产品边界。

### 2. 当前分支实际上已经“部分吃掉了”原先 BE-PR2 的最低价值部分

如果 BE-PR2 原本最小目标只是证明：

- scene run 会经历多步 timeline
- waiting review 可被提交 decision
- canon/prose 事件会落到 run event stream

那么当前 `runFixtureStore` 已经在 fixture 层把这部分语义做出来了。

所以这时继续急着上新后端 PR，边际收益已经低于：

**先把这条已经存在的 timeline 真实接进 renderer。**

### 3. PR25 做完后，再做 BE-PR2 会更稳

PR25 会帮你回答：

- run detail / event page 的 shape 是否足够前端使用
- scene surfaces invalidation 是否够稳定
- review gate 的 decision input 是否够清晰
- polling contract 是否足够支撑当前 UX
- `context_packet_built / proposal_set / review / canon_patch / prose_draft` refs 是否足够表达以后更深的 debug / trace UI

这些边界一旦被真实 UI 消费验证过，后面的 BE-PR2 才不会变成“后端自嗨式重构”。

---

## 三、PR25 的唯一目标

**把当前已经存在的 API-backed run flow，正式接进 `Scene / Orchestrate` 的主工作面。**

PR25 完成后，用户应该能在 renderer 里完成下面这条完整路径：

```text
进入 Scene / Orchestrate
-> 点击 Start / Continue / Rewrite run
-> 看到当前 run detail 与 run event timeline
-> 等待 run 进入 waiting review
-> 在 UI 中提交 review decision
-> scene execution / prose / inspector / dock 同步刷新
-> chapter 结构面里的该 scene run metadata 也能在刷新后看到变化
```

一句话说：

**PR25 的任务不是“做新后端”，而是把 BE-PR1 已经产出的 API runtime 变成前端真的在用的 runtime。**

---

## 四、本轮明确不做

为了让 PR25 保持窄而实，以下内容不要混进来：

- 不做真实 SSE / EventSource 消费
- 不改 `/events/stream` 的 501 占位策略
- 不做 Temporal / durable workflow 接入
- 不做新的 backend runtime capability
- 不做 context packet inspector 详情页
- 不做 proposal variants / swipe
- 不做 asset activation policy
- 不做 full run debugger
- 不做 chapter / book scope 的 run UI 大扩建
- 不重做 scene execution 的 proposal review 主心智
- 不改 scene / chapter / book route 结构
- 不重做 `ProjectRuntimeProvider` 总体模型

PR25 的定位必须非常明确：

**只做 Scene / Orchestrate 对 BE-PR1 API runtime 的真实接线。**

---

## 五、必须遵守的硬约束

### 5.1 renderer 继续只认 `ProjectRuntime.runClient`，不认识 API server 内部实现

不要让 renderer：

- import `packages/api/**`
- import Fastify server
- import fixture repository / run store
- import Temporal SDK
- import backend-only types

renderer 只能继续通过：

- `ProjectRuntimeProvider`
- `runClient`
- 现有 route contract
- 现有 query keys / hooks

来消费 runtime。

### 5.2 当前 run UI 只走 polling，不碰 stream endpoint

`/events/stream` 当前明确是 501 placeholder。

PR25 的正确方式是：

- 使用 `getRun(...)`
- 使用 `getRunEvents(...)`
- 基于 run status 做 polling / refetch
- 必要时在 composed hook 内自动串 page

不要试图在本轮提前接：

- EventSource
- WebSocket
- SSE polyfill

### 5.3 `route` 不新增 run 相关参数

不要在 PR25 引入：

- `runId`
- `reviewId`
- `eventCursor`
- `activeRunPanel`

到 scene route 里。

当前 PR25 的 run UI 状态应优先依赖：

- scene 当前 `sceneId`
- scene queries 里派生出的 `latestRunId` / `runId`
- start mutation 返回的 `run.id`
- container 内的局部 UI state（仅限展示层）

而不是新开 route 真源。

### 5.4 run detail 不是新的对象真源，scene 仍然是主对象

当前用户仍然在处理：

- 一个 `scene`
- `Scene / Orchestrate` 这个 lens

run 只是当前 scene orchestration 的执行态支持面。

所以：

- 不新增 `scope='run'`
- 不新增独立 run page
- 不把主舞台切成 run dashboard

run 应该增强 Scene / Orchestrate，而不是取代它。

### 5.5 不要把 polling / cursor 逻辑散在多个 presentational 组件里

PR25 最好新增一个窄的 composed hook 或 scene-run adapter，把这些逻辑集中起来：

- active run id 解析
- run detail polling
- events page 串接 / timeline 合并
- waiting review 判断
- review decision mutation 后的 scene query invalidation

不要把这些逻辑分别塞进：

- `SceneExecutionContainer.tsx`
- `SceneExecutionTab.tsx`
- `SceneDockContainer.tsx`
- `SceneBottomDock.tsx`

否则 PR25 很快会变成一轮“组件里横向散落 transport 细节”的改坏 PR。

### 5.6 继续坚持“产品 run events，不是 raw workflow history”

当前 `RunEventRecord` 已经是产品级事件结构：

- `kind`
- `label`
- `summary`
- `severity`
- `createdAtLabel`
- `refs`

PR25 不要让 UI 开始依赖：

- raw prompt token stream
- Temporal event history
- worker internal logs
- backend stack trace

要继续把底部和执行面使用的对象锁在：

**产品级 run events**。

---

## 六、建议的实现方向

## 6.1 新增一个 scene-run composed hook，而不是直接把 run hooks 塞进容器里

推荐新增：

- `packages/renderer/src/features/run/hooks/useSceneRunSession.ts`

### 这层职责

1. 接收 `sceneId`
2. 从 scene workspace / execution query 派生当前 active run id
3. 调用：
   - `useStartSceneRunMutation(...)`
   - `useRunQuery(...)`
   - `useSubmitRunReviewDecisionMutation(...)`
4. 在内部处理：
   - active run fallback
   - 运行中 / waiting review 状态下的 polling
   - events page 的自动串接
   - review gate 状态派生
   - 成功提交 decision 后对 scene 相关 queries 的 invalidate

### 为什么值得单独抽

因为现在 run hooks 已经有了，但都还是基础粒度：

- start
- detail
- events page
- review decision

Scene / Orchestrate 真正需要的不是这四个分离原语，而是：

```text
一个“当前 scene 的 API-backed run session”
```

这层一旦抽出来，PR25 的容器接线会清楚很多。

---

## 6.2 建议新增一个 run event timeline hook，负责把 cursor page 串成 UI 可消费列表

推荐新增：

- `packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.ts`

### 这层职责

1. 输入：`runId`
2. 通过当前 `runClient.getRunEvents(...)` 按 cursor 拉取全部 page
3. 输出：
   - `events: RunEventRecord[]`
   - `isLoading`
   - `error`
   - `refetch`
   - `hasMore`（若你希望保留 load-more 选项）

### 为什么推荐这样做

因为当前 `useRunEventsQuery(...)` 只负责单页。

而 PR25 的执行面 / 底部面板更适合消费：

- 一条完整 timeline
- 或至少一个“已串好的前几页 timeline”

不要让 `SceneExecutionContainer` 自己去手动追 cursor。

### 本轮不做

- 不做 infinite scroll library
- 不做虚拟列表
- 不做事件 stream

fixture mode 下 event 数量很小，保持逻辑简单即可。

---

## 6.3 `SceneExecutionContainer.tsx` 应该成为 PR25 的主接线点

这是当前最适合承接 PR25 的主容器。

### 当前事实

它已经负责：

- `useSceneExecutionQuery(...)`
- `useProposalActions(...)`
- `useSceneWorkspaceActions(...)`
- route-driven beat / proposal selection
- 把数据喂给 `SceneExecutionTab`

### PR25 要做的事

在保留现有 proposal review 主舞台的前提下，额外接入：

- start run
- active run detail
- run event timeline
- waiting review card / controls

### 正确接法

通过新 composed hook 把这些状态收敛成一组 props，再传给：

- `SceneExecutionTab`
- 或一个新增的 `SceneRunPanel` / `RunEventStreamPanel`

### 不要做

- 不要在 `SceneExecutionContainer.tsx` 里自己手搓多层 cursor/page/refetch 逻辑
- 不要把 run event list 和 review gate 状态直接散落在十几个 `useState` 里

---

## 6.4 `SceneExecutionTab.tsx` 只做“消费已整理好的 run state”，不要承担 transport 逻辑

### 本轮建议新增的 UI 能力

第一版只需要补下面这些可见 affordance：

#### A. Run controls
- `Continue run`
- `Rewrite`
- `From scratch`

对应 `StartSceneRunInput.mode`：

- `continue`
- `rewrite`
- `from-scratch`

#### B. Active run summary
至少显示：

- run title
- status
- summary
- latest event label
- pending review state（若有）

#### C. Run event timeline
至少显示：

- event label
- summary
- createdAtLabel
- severity
- refs（轻量）

#### D. Review gate
当 `run.pendingReviewId` 存在且 status 为 `waiting_review` 时，显示：

- `Accept`
- `Accept with edit`
- `Request rewrite`
- `Reject`

### UI 纪律

- scene proposal review 主舞台不要被 run transport UI 吞掉
- run controls / run summary / event timeline 是 supporting surfaces
- 本轮不要把 Scene / Orchestrate 改成 debugger dashboard

---

## 6.5 `SceneDockContainer.tsx` / `SceneBottomDock.tsx` 只做最小增强

当前 scene 已有底部 dock。

PR25 最值得补的，不是整页重构，而是：

### 第一版新增一个 run events 区块
用于显示：

- 当前 active run 的 timeline（或最近几条事件）
- waiting review / completed / failed 的状态提示

### 继续保留现有 dock 职责
不要因为 run timeline 存在，就把底部 dock 变成：

- raw logs 面板
- prompt debugger
- token inspector

PR25 的 dock 仍然是：

**产品级运行支持面板。**

---

## 6.6 `SceneInspectorContainer.tsx` 只做极小配合

如果 inspector 当前已有 runtime / traceability / versions 等 tab，不要在 PR25 大改它。

第一版只需要保证：

- active run summary 或 waiting review 信号，必要时能在现有 runtime/context 面板里看到
- review decision 完成后 inspector 相关 scene query 会刷新

不要让 inspector 成为 PR25 的主落点。

主落点仍然应是：

- Scene Execution 面
- Bottom Dock

---

## 六点五、`useSceneWorkspaceActions.ts` 在 PR25 中不要被继续放大

当前它依然承担 scene-local writes：

- continue run
- switch thread
- commit patch
- open prose / versions / export

PR25 不建议在这个 hook 上继续塞：

- start run with mode
- run detail polling
- review decision submit
- events pagination

更好的边界是：

- `useSceneWorkspaceActions(...)` 继续服务 scene client writes
- 新的 run session/composed hook 服务 API-backed orchestration run flow

否则它会很快失去职责清晰度。

---

## 七、建议的文件改动

## 7.1 推荐新增

```text
packages/renderer/src/features/run/hooks/useSceneRunSession.ts
packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.ts
packages/renderer/src/features/run/hooks/useRunEventTimelineQuery.test.tsx
packages/renderer/src/features/run/hooks/useSceneRunSession.test.tsx
packages/renderer/src/features/run/components/RunEventStreamPanel.tsx
packages/renderer/src/features/run/components/RunEventStreamPanel.test.tsx
packages/renderer/src/features/run/components/RunReviewGate.tsx
packages/renderer/src/features/run/components/RunReviewGate.test.tsx
```

### 说明

如果你希望避免 `features/scene` 再吸进一层 transport UI 细节，把 run 相关的 UI 小组件放进 `features/run/components` 会更干净。

## 7.2 必改

```text
packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx
packages/renderer/src/features/scene/components/SceneExecutionTab.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
packages/renderer/src/features/scene/components/SceneBottomDock.tsx
packages/renderer/src/features/run/hooks/useRunQuery.ts（仅在需要 polling options 时）
packages/renderer/src/features/run/hooks/useRunEventsQuery.ts（仅在需要复用低层 query option 时）
packages/renderer/src/app/project-runtime/api-run-slice-contract.test.tsx（若要补 renderer side contract coverage）
app i18n 文案
```

## 7.3 这一轮尽量不动

```text
packages/api/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/book/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/traceability/**
packages/renderer/src/features/scene/store/scene-ui-store.ts（除非 run review 面板确实需要极小本地 UI state）
packages/renderer/src/features/workbench/** 的 route 类型
```

PR25 的任务是消费 BE-PR1 已经成立的 runtime，不是回头重写 API 或全局 UI 架构。

---

## 八、测试补齐方案

## 8.1 run timeline hook 测试

### `useRunEventTimelineQuery.test.tsx`
至少覆盖：

1. 首屏 page + nextCursor 会被继续拉取并合并
2. 合并后的 events 仍按 `order` 排序
3. `runId` 为空时不请求
4. refetch 能重新取回 timeline
5. `/events/stream` 不参与任何逻辑

## 8.2 scene-run composed hook 测试

### `useSceneRunSession.test.tsx`
至少覆盖：

1. scene 还没有 active run 时，start mutation 成功后能够暴露新的 `run.id`
2. `waiting_review` 时能够派生 `canSubmitDecision`
3. `completed` 时停止 polling
4. review decision 成功后会 invalidate scene 相关 queries
5. 只消费 `runClient`，不 import API implementation

## 8.3 run UI 组件测试

### `RunEventStreamPanel.test.tsx`
至少覆盖：

1. event label / summary / severity / refs 渲染正确
2. loading / error / empty state 正确
3. run ref kind（如 `context-packet` / `proposal-set` / `canon-patch`）能稳定显示

### `RunReviewGate.test.tsx`
至少覆盖：

1. waiting review 时显示四种 decision action
2. `accept-with-edit` 能携带 edited note / patch 说明
3. `request-rewrite` / `reject` 能携带 note
4. 提交中状态不会重复触发

## 8.4 scene execution 集成测试

### `SceneExecutionContainer.test.tsx`
建议新增一条完整路径：

```text
进入 scene orchestrate
-> 点击 Continue run
-> run summary 出现
-> events timeline 合并显示 context_packet_built / agent_invocation / proposal_created / review_requested
-> review gate 出现
-> 点击 Accept
-> run status 变 completed
-> scene prose / execution / dock 相关数据刷新
```

### 最重要的断言

不是“按钮存在”，而是：

- run hooks 真正驱动 UI
- waiting review 真正出现
- decision 真正刷新 scene surfaces

## 8.5 App / runtime integration smoke

### 推荐新增一条最有价值的 smoke

```text
以 api runtime 挂载 renderer
-> 打开 scene orchestrate
-> start run
-> 轮询到 waiting review
-> submit accept
-> 回到 scene prose / dock
-> run 完成信息可见
```

### 为什么这条 smoke 值得做

因为它固定住了 PR25 的真正价值：

**renderer 终于不再只是跑 mock runtime，而是能消费 BE-PR1 的 HTTP runtime contract。**

---

## 九、实施顺序（给 AI 的执行顺序）

### Step 1
先新增 `useRunEventTimelineQuery.ts`：

- 复用当前 `runClient.getRunEvents(...)`
- 在 hook 内串 cursor page
- 先补 hook 单测

### Step 2
新增 `useSceneRunSession.ts`：

- 组合 start / detail / timeline / review decision
- 处理 active run id fallback
- 处理 polling stop/start 规则
- 先补 hook 单测

### Step 3
新增 run UI 小组件：

- `RunEventStreamPanel.tsx`
- `RunReviewGate.tsx`

让 run UI 有自己清楚的边界，不把所有细节挤进 scene components。

### Step 4
回到 `SceneExecutionContainer.tsx` 接线：

- 把 scene-run session 接进来
- 保留现有 proposal review 主舞台
- 在合适区域插入 run summary / review gate / timeline

### Step 5
最小改 `SceneExecutionTab.tsx`：

- 接收新的 run props
- 增加 start/continue/rewrite controls
- 增加 active run summary / review gate / timeline 容器位

### Step 6
增强 `SceneDockContainer.tsx` / `SceneBottomDock.tsx`：

- 底部加入 run event list 或 recent run events 区块
- 不做 full debugger

### Step 7
补集成测试与 runtime smoke：

- scene execution 集成测试
- app-level api runtime smoke

### Step 8
若本 PR 维护 stories，再补最小 story：

- running scene
- waiting review
- completed run
- failed / empty event timeline

---

## 十、完成后的验收标准

满足以下条件，PR25 就算完成：

1. renderer 能通过 `ProjectRuntime.runClient` 真实启动 scene run。
2. renderer 能通过 polling 读取当前 run detail。
3. renderer 能把 paged run events 合并成 timeline 展示。
4. `waiting_review` 时 UI 会显示 review gate。
5. 提交 review decision 后，scene execution / prose / inspector / dock 查询会刷新。
6. chapter 结构面中该 scene 的 run metadata 在刷新后能看到变化。
7. renderer 不 import `packages/api/**`，也不认识 Temporal / worker internals。
8. route 不新增 `runId` 等参数。
9. `/events/stream` 仍保持 501，不被 renderer 依赖。
10. PR25 不包含 context inspector / proposal variants / asset activation / SSE / backend capability 扩建。

---

## 十一、PR25 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了 run timeline，把 route 改成 run-detail router
- 为了 waiting review，新造一套 scene 选中 / run 选中 store 真源
- 把 polling / cursor 逻辑散进多个 scene presentational 组件
- 为了省事直接 import `packages/api` 实现
- 顺手把 `/events/stream` 也接了
- 顺手把 full run debugger / context packet inspector 做进去
- 为了 scene run UI 去大改 chapter / book / asset 容器
- 继续扩大 `useSceneWorkspaceActions(...)`，把 run orchestration transport 都塞进去

PR25 做完后，正确的项目状态应该是：

**BE-PR1 的 API runtime 已经被 renderer 正式吃下，Scene / Orchestrate 终于跑通了 start -> events -> review -> refresh 的第一条真实 HTTP orchestration 纵切。**

---

## 十二、PR25 之后最自然的下一步（不在本轮实施）

PR25 做完后，再回头进入 backend 线会更稳。

那时更合理的后续顺序是：

1. **BE-PR2：SceneRun Workflow Skeleton（后端内部抽离）**
   - 把当前 fixture timeline 逐步抽成更明确的 orchestration module / workflow step 边界
   - 但仍然不引入真实 LLM / Temporal / DB

2. **PR26：Context Packet Inspector**
   - 利用 `context_packet_built` 与 refs 语义，把本次 run 的上下文装配解释前台化

3. **PR27：Proposal Variants / Swipe for proposal-set**
   - 只做 proposal variants，不直接 swipe prose

也就是说：

**PR25 是把 BE-PR1 从“合同成立”推进到“产品真的开始消费这份合同”。**

---

## 十三、给 AI 的最终一句话指令

在当前 `codex/be-pr1-fixture-api-server-skeleton` 已经完成 BE-PR1 的前提下，不要继续先做新的 backend capability，也不要提前接 SSE / context inspector / proposal variants；先只围绕 **PR25：Backend Orchestration Integration UI** 做一轮窄而实的实现：

- 继续只通过 `ProjectRuntime.runClient` 消费 runtime
- 新增一个窄的 scene-run composed hook，整合 start/detail/events/review decision
- 新增一个 paged events timeline hook，把 cursor page 合并成产品级 timeline
- 在 `SceneExecutionContainer / SceneExecutionTab` 中接入 start run、active run summary、review gate、event timeline
- 在 `SceneBottomDock` 中最小补 run events 区块
- 保持 route 不变、stream endpoint 不用、scene 仍然是主对象
- 用测试固定 polling、review gate、scene query refresh、HTTP runtime smoke 这四条硬约束
- 明确不做 SSE、Temporal、context inspector、proposal variants、asset activation policy、full debugger
