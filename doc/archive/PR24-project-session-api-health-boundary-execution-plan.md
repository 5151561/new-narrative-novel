# PR24 Execution Document — Project Session / API Health Boundary

基于当前分支：`codex/pr23-run-event-stream-api-surface-contract`

> 这份文档可以直接交给 AI agent 执行。
>
> PR24 的任务不是继续扩 Book / Review / Export UI，也不是接真实 orchestration workflow；本轮只围绕 **Project Session / API Health Boundary** 做一轮窄而实的 renderer-side contract 实现，让前端第一次能明确区分“当前使用 mock runtime 还是 API runtime”、“API 是否可用”、“当前 project session 是否有效”。

---

## 0. 给 AI agent 的最终执行指令

在当前 `codex/pr23-run-event-stream-api-surface-contract` 已经完成 Run / Event Stream API Surface Contract 的前提下，不要继续扩 run event UI，不要接 Temporal / SSE / DB / LLM / auth full flow，也不要新建真实 backend server；本轮只做 **Project Session / API Health Boundary**：

- 给 `apiRouteContract` 增加 project-level health / runtime-info route helper，优先使用既有语义路径：`/api/projects/:projectId/runtime-info`。
- 在 `ProjectRuntime` 边界内新增一个 project/session/health client，不要新建平行 runtime provider。
- 给 mock runtime 返回稳定的 mock session / healthy state。
- 给 API runtime 通过 `ApiTransport` 读取 health，并把 network / 401 / 403 / 5xx 转成明确的 UI state。
- 增加 `useProjectRuntimeHealthQuery(...)` 或等价 hook，让 UI 可以读取 runtime source、projectId、health status、capabilities。
- 在 App 顶部或 workbench 顶层增加一个克制的 Runtime Status Badge / Boundary Surface。
- 为 API unavailable / unauthorized / forbidden / unknown project 增加稳定空状态或提示，但不要做完整登录系统。
- 更新 `doc/api-contract.md`，把 project session / health endpoint、错误语义、capabilities 语义写清楚。
- 补 route contract、runtime adapter、mock runtime、health hook、status badge、App smoke tests。

PR24 完成后，renderer 应该能回答：

```text
当前项目 runtime 是 mock 还是 api？
当前 API endpoint 是否可达？
当前 project session 是否有效？
当前 API runtime 声称支持哪些能力？
当 API 不可用 / 未授权 / 禁止访问时，UI 应如何稳定降级？
```

但 PR24 仍不应该让 renderer 认识真实 workflow engine，也不应该把 run / health 状态写进 workbench route。

---

## 1. 当前代码基线判断

### 1.1 已经成立的基础

PR23 结束后，当前代码已经具备：

- `features/run` 目录，包含 `api` 与 `hooks`。
- `RunRecord / RunEventRecord / RunEventsPageRecord / SubmitRunReviewDecisionInput` 等 run contract。
- `RunEventKind` 已预留 `context_packet_built`。
- `RunEventRefKind` 已预留 `context-packet`。
- `RunClient` 已支持：
  - `startSceneRun(...)`
  - `getRun(...)`
  - `getRunEvents(...)`
  - `submitRunReviewDecision(...)`
- `ProjectRuntime` 已包含 `runClient`。
- `apiRouteContract` 已包含：
  - `sceneRuns(...)`
  - `run(...)`
  - `runEvents(...)`
  - `runEventsStream(...)`
  - `runReviewDecisions(...)`
- `createApiProjectRuntime(...)` 已能通过 `ApiTransport` 创建 run client。
- `doc/api-contract.md` 已记录 PR23 run/event stream contract。

这说明 renderer-side API contract 已经从 read / write 扩展到了 orchestration run 的 surface。

### 1.2 当前真正的缺口

现在的缺口不是“再定义一个 run endpoint”，而是：

- API runtime 是否可用，UI 还没有一等表达。
- 当前 project session 是 mock 还是 api，用户没有稳定判断入口。
- API base URL / projectId / runtime source 的状态没有形成统一 view-model。
- network failure、401、403、5xx 在 project 级别还没有统一边界。
- 后续接 BE-PR1 / PR25 时，前端需要一个稳定的 health / capability gate，而不是等某个 feature query 失败后才被动暴露错误。

PR24 要补的是这个 **project-level boundary**。

### 1.3 为什么现在做 PR24

PR23 已经把 run API surface 固定住；下一步如果直接进入 PR25 的 backend orchestration integration UI，前端会缺少一个最基本的问题答案：

```text
我现在连的是哪个 runtime？
这个 runtime 活着吗？
它支持 run events 吗？
它支持 review decision 写入吗？
如果用户未授权，是 project session 问题还是某个 feature query 问题？
```

所以 PR24 应先把 project session / API health boundary 补上。它是 PR25 能稳定接入真实后端纵切的前置条件。

---

## 2. PR24 的唯一目标

**把 API runtime 从“有 transport 就能创建”升级为“project session 可见、health 可见、能力可见、错误边界可控”。**

完成后，用户和开发者应该能在 UI 与测试里明确看到：

- 当前 `ProjectRuntime` 的来源：`mock` / `api`。
- 当前 `projectId`。
- API health：`healthy` / `checking` / `unavailable` / `unauthorized` / `forbidden` / `unknown`。
- API capabilities：至少包括 `read`, `write`, `runEvents`, `eventStreamPlaceholder`, `reviewDecisions`。
- 当 API unavailable / auth failure 时，App 顶部与关键 workbench surface 有一致提示。

一句话说：

**PR24 不是业务能力 PR，而是 future backend integration 的安全边界 PR。**

---

## 3. 本轮明确不做

PR24 不做：

- 不做真实 API server。
- 不接 Temporal SDK。
- 不接真实 SSE / WebSocket。
- 不接真实 DB。
- 不接真实 LLM。
- 不做 OAuth / login / logout。
- 不做完整账号系统。
- 不做 project CRUD。
- 不做多用户权限模型。
- 不把 `projectId` 或 health state 写进 workbench route。
- 不新增 `runId` / `eventCursor` route state。
- 不做 Context Packet Inspector。
- 不做 Proposal Variants UI。
- 不做 Run Debugger。
- 不改 scene / chapter / asset / book 的 query identity。
- 不为了 health 大改全局 mode rail。
- 不在 fake API runtime 里实现真实 orchestration workflow。

PR24 只做：

```text
Project session / API health / capability contract
+ runtime adapter
+ UI boundary
+ tests
+ docs
```

---

## 4. 必须遵守的硬约束

### 4.1 仍然只有一个 runtime boundary

所有 API health / project session 读取都必须走现有 `ProjectRuntime` / `ProjectRuntimeProvider` 边界。

不要新增：

- `ApiHealthProvider`
- `SessionProvider`
- `AuthProvider`
- 第二套 runtime context
- feature 内部直接 `fetch('/api/health')`

### 4.2 route 不承载 runtime health

不要新增这些 route 参数：

- `apiStatus`
- `runtimeSource`
- `health`
- `sessionId`
- `projectSession`

Runtime health 是 runtime/query state，不是 workbench route state。

Route 继续只表达：

- scope / lens / view
- selected scene / chapter / asset / book
- book draft / compare / export / branch / review view-state

### 4.3 不破坏 PR23 run contract

PR24 不能改坏：

- `RunClient`
- `RunRecord`
- `RunEventRecord`
- `RunEventKind`
- `RunEventRefKind`
- `apiRouteContract.sceneRuns(...)`
- `apiRouteContract.runEvents(...)`
- `apiRouteContract.runReviewDecisions(...)`

如需在 runtime info 中声明 run capability，只做 additive capabilities，不改 run payload。

### 4.4 不把 health 与 Scene runtime info 混成一团

当前已有 `/api/projects/:projectId/runtime-info` 语义被 Scene client 使用。

PR24 可以复用这个路径，但要在命名和类型上把它抬升为 project-level runtime/session information。

建议做法：

- 新增 `projectRuntimeInfo({ projectId })` route helper，返回 `/api/projects/:projectId/runtime-info`。
- 保留现有 `sceneRuntimeInfo({ projectId })` helper，作为兼容 alias 或继续供 Scene client 使用。
- 不在 PR24 内大面积重写 Scene runtime data 模型。

### 4.5 Health errors 要可分类

PR24 至少要把以下错误分开：

- network / fetch failure -> `unavailable`
- HTTP 401 -> `unauthorized`
- HTTP 403 -> `forbidden`
- HTTP 404 project not found -> `not_found` 或 `unknown_project`
- HTTP 5xx -> `unavailable`
- malformed JSON -> `unavailable` with detail

不要把所有 error 都变成 generic empty state。

### 4.6 Capability 是 hint，不是权限系统

Capabilities 用来让 UI 判断当前 runtime 支持哪些 surface，例如：

```text
read
write
runEvents
runEventPolling
runEventStreamPlaceholder
reviewDecisions
exportArtifacts
experimentBranches
```

但 PR24 不做完整权限系统。不要把 capability 做成 auth / ACL / RBAC。

---

## 5. 推荐 API contract

### 5.1 Endpoint

优先新增或明确：

```text
GET /api/projects/:projectId/runtime-info
```

可选预留：

```text
GET /api/health
```

建议 PR24 只让 renderer 消费 project-level runtime info，因为当前所有 feature contract 都已经 project-scoped。

### 5.2 Route helper

在 `api-route-contract.ts` 中新增：

```ts
projectRuntimeInfo({ projectId }: { projectId: string }) {
  return `${projectBase(projectId)}/runtime-info`
}
```

保留现有：

```ts
sceneRuntimeInfo({ projectId })
```

如果现有 `sceneRuntimeInfo(...)` 也返回同一个 path，则先让它继续存在，避免 PR24 扩散成 Scene runtime 重构。

### 5.3 Runtime info record

建议新增：

```ts
export type ProjectRuntimeSource = 'mock' | 'api'

export type ProjectRuntimeHealthStatus =
  | 'healthy'
  | 'checking'
  | 'unavailable'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'unknown'

export interface ProjectRuntimeCapabilitiesRecord {
  read: boolean
  write: boolean
  runEvents: boolean
  runEventPolling: boolean
  runEventStream: boolean
  reviewDecisions: boolean
  contextPacketRefs: boolean
  proposalSetRefs: boolean
}

export interface ProjectRuntimeInfoRecord {
  projectId: string
  projectTitle: string
  source: ProjectRuntimeSource
  status: ProjectRuntimeHealthStatus
  summary: string
  checkedAtLabel?: string
  apiBaseUrl?: string
  versionLabel?: string
  capabilities: ProjectRuntimeCapabilitiesRecord
}
```

### 5.4 Mock runtime default

Mock runtime should return:

```ts
{
  projectId,
  projectTitle: 'Mock Narrative Project',
  source: 'mock',
  status: 'healthy',
  summary: 'Using in-memory mock project runtime.',
  checkedAtLabel: 'Static mock runtime',
  capabilities: {
    read: true,
    write: true,
    runEvents: true,
    runEventPolling: true,
    runEventStream: false,
    reviewDecisions: true,
    contextPacketRefs: true,
    proposalSetRefs: true,
  },
}
```

### 5.5 API runtime response example

```json
{
  "projectId": "project-run-contract",
  "projectTitle": "Signal Arc API Fixture",
  "source": "api",
  "status": "healthy",
  "summary": "API runtime reachable. Fixture-backed contracts are available.",
  "checkedAtLabel": "2026-04-21 12:40",
  "apiBaseUrl": "http://localhost:8787",
  "versionLabel": "fixture-api-0.1.0",
  "capabilities": {
    "read": true,
    "write": true,
    "runEvents": true,
    "runEventPolling": true,
    "runEventStream": false,
    "reviewDecisions": true,
    "contextPacketRefs": true,
    "proposalSetRefs": true
  }
}
```

---

## 6. 建议文件改动

### 6.1 新增

```text
packages/renderer/src/app/project-runtime/project-runtime-info.ts
packages/renderer/src/app/project-runtime/project-runtime-info-client.ts
packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.ts
packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.tsx
packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBoundary.tsx
packages/renderer/src/app/project-runtime/ProjectRuntimeStatusBadge.test.tsx
packages/renderer/src/app/project-runtime/useProjectRuntimeHealthQuery.test.tsx
```

如果项目更偏好 feature 组织，也可以使用：

```text
packages/renderer/src/features/project-session/...
```

但第一版更推荐留在 `app/project-runtime`，因为这是跨所有 feature 的 runtime boundary，不是独立叙事对象。

### 6.2 修改

```text
packages/renderer/src/app/project-runtime/project-runtime.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/api-route-contract.ts
packages/renderer/src/app/project-runtime/api-route-contract.test.ts
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
packages/renderer/src/app/project-runtime/mock-project-runtime.test.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.test.ts
packages/renderer/src/app/providers.tsx
packages/renderer/src/App.tsx
packages/renderer/src/app/i18n/**
doc/api-contract.md
```

### 6.3 尽量不动

```text
packages/renderer/src/features/run/api/run-records.ts
packages/renderer/src/features/run/api/run-client.ts
packages/renderer/src/features/run/hooks/**
packages/renderer/src/features/scene/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/book/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/review/**
packages/renderer/src/features/traceability/**
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
```

---

## 7. Client / runtime 接线设计

### 7.1 Project runtime info client

新增：

```ts
export interface ProjectRuntimeInfoClient {
  getProjectRuntimeInfo(): Promise<ProjectRuntimeInfoRecord>
}
```

然后在 `ProjectRuntime` 中增加：

```ts
runtimeInfoClient: ProjectRuntimeInfoClient
```

不要用 optional，除非现有测试迁移成本过高。PR24 的目标就是让所有 runtime 都能回答 runtime info。

### 7.2 Mock runtime

在 `mock-project-runtime.ts` 中创建：

```ts
function createMockProjectRuntimeInfoClient(projectId: string): ProjectRuntimeInfoClient
```

返回 deterministic mock info。

### 7.3 API runtime

在 `api-project-runtime.ts` 中创建：

```ts
function createProjectRuntimeInfoClient(projectId: string, transport: ApiTransport): ProjectRuntimeInfoClient
```

实现：

```ts
getProjectRuntimeInfo() {
  return transport.requestJson<ProjectRuntimeInfoRecord>({
    method: 'GET',
    path: apiRouteContract.projectRuntimeInfo({ projectId }),
  })
}
```

### 7.4 Error classification

可以新增 mapper：

```ts
export function classifyProjectRuntimeHealthError(error: unknown): ProjectRuntimeInfoRecord
```

或在 hook 内转换：

- `ApiRequestError.status === 401` -> `unauthorized`
- `403` -> `forbidden`
- `404` -> `not_found`
- `>= 500` -> `unavailable`
- `fetch` / network -> `unavailable`
- unknown -> `unknown`

注意：不要吞掉原始 error；hook 返回中可保留 `error` 供测试和 debug 使用。

---

## 8. Hook 设计

新增：

```ts
export function useProjectRuntimeHealthQuery() {
  const runtime = useProjectRuntime()
  const query = useQuery({
    queryKey: ['project-runtime', runtime.projectId, 'health'],
    queryFn: () => runtime.runtimeInfoClient.getProjectRuntimeInfo(),
    staleTime: 30_000,
  })

  return {
    info: query.data ?? fallbackInfoFromErrorOrCheckingState,
    isChecking: query.isLoading || query.isFetching,
    error: query.error,
    refetch: query.refetch,
  }
}
```

### Query key 纪律

Query key 只包含：

```text
projectId
health/runtime-info identity
```

不要把当前 workbench route、scope、lens、selected scene、selected chapter 放进 health query key。

---

## 9. UI 设计

### 9.1 `ProjectRuntimeStatusBadge`

职责：

- 显示当前 runtime source：Mock / API。
- 显示 health status：Healthy / Checking / Unavailable / Unauthorized / Forbidden。
- 显示可选 summary。
- 提供一个轻量 `Retry` action。

建议 props：

```ts
interface ProjectRuntimeStatusBadgeProps {
  info: ProjectRuntimeInfoRecord
  isChecking?: boolean
  onRetry?: () => void
}
```

视觉纪律：

- 克制，像 status bar / badge，不要变成 modal。
- 不要挡住主舞台。
- 不要在 healthy 状态下噪音过高。

### 9.2 `ProjectRuntimeStatusBoundary`

职责：

- 当 `status` 为 `unavailable / unauthorized / forbidden / not_found` 时，提供统一提示。
- 允许 children 继续渲染或显示 degraded state，由调用方决定。

第一版建议在 App 顶层只展示 badge，不阻断所有工作面。

### 9.3 App 顶部接线

在 `App.tsx` 或现有 top bar 区域增加：

```tsx
<ProjectRuntimeStatusBadge ... />
```

如果当前 App 没有明确 top bar，则放在 workbench shell 顶部已有区域附近，不要新造一个全局大 header。

### 9.4 不要在 PR24 中做 project selector 完整版

可以做一个只读 project label：

```text
Project: Signal Arc API Fixture
Runtime: API / Mock
```

但不要做：

- project create
- project switch persistence
- import/export project
- auth/session selector

---

## 10. Fake API runtime / test harness

### 10.1 Fake API 应支持 runtime-info dispatch

在 `fake-api-runtime.test-utils.ts` 中增加 route handling：

```text
GET /api/projects/:projectId/runtime-info
```

默认返回 mock-like API info：

```text
source='api'
status='healthy'
```

但允许测试 override：

- 返回 401
- 返回 403
- 返回 404
- 返回 503
- 返回 malformed JSON
- network rejection

### 10.2 Fake API 不应该做的事

不要在 fake API runtime 中：

- 维护真实 session token。
- 模拟完整 auth server。
- 模拟 Temporal workflow。
- 根据 route scope 动态改变 health。
- 自动 patch feature query cache。

Fake API 仍是 contract harness。

---

## 11. 测试补齐方案

### 11.1 `api-route-contract.test.ts`

新增覆盖：

1. `projectRuntimeInfo({ projectId })` 返回 `/api/projects/:projectId/runtime-info`。
2. 现有 `sceneRuntimeInfo({ projectId })` 如果保留，应继续返回同一路径。
3. `projectId` 会正确 encode。
4. run endpoints 不受影响。

### 11.2 `mock-project-runtime.test.ts`

至少覆盖：

1. mock runtime 拥有 `runtimeInfoClient`。
2. `getProjectRuntimeInfo()` 返回 `source='mock'`。
3. mock capabilities 中 `runEvents=true`、`runEventPolling=true`、`runEventStream=false`。
4. `projectId` 正确来自 runtime。

### 11.3 `api-project-runtime.test.ts`

至少覆盖：

1. API runtime 的 `runtimeInfoClient.getProjectRuntimeInfo()` 请求正确 endpoint。
2. 返回 payload 能透传为 `ProjectRuntimeInfoRecord`。
3. 创建 API runtime 后仍包含 `runClient`。
4. Run client 的 endpoints 不被 health 改动。

### 11.4 `useProjectRuntimeHealthQuery.test.tsx`

至少覆盖：

1. healthy mock runtime 返回 healthy view-model。
2. API runtime 401 映射为 unauthorized。
3. API runtime 403 映射为 forbidden。
4. API runtime 503 / network failure 映射为 unavailable。
5. `refetch` 可以被调用。
6. query key 不随 route scope / lens 变化。

### 11.5 `ProjectRuntimeStatusBadge.test.tsx`

至少覆盖：

1. healthy mock 显示 Mock / Healthy。
2. healthy API 显示 API / Healthy。
3. checking 显示 Checking。
4. unavailable 显示 Retry action。
5. unauthorized / forbidden 有明确文案。

### 11.6 App smoke

建议新增：

```text
render App with mock runtime
-> top/status area shows Mock runtime healthy
-> switch scene/chapter/book/asset route
-> runtime badge remains stable
```

再新增：

```text
render App with API runtime returning 503 on runtime-info
-> top/status area shows API unavailable
-> existing route still renders fallback/degraded app shell
-> no route mutation occurs
```

---

## 12. 文档更新要求

更新 `doc/api-contract.md`，新增 section：

```md
## PR24 Project Session / API Health Boundary
```

至少写明：

- Endpoint：`GET /api/projects/{projectId}/runtime-info`
- Response：`ProjectRuntimeInfoRecord`
- Health status 枚举
- Capabilities 语义
- Error mapping：401 / 403 / 404 / 5xx / network
- Mock runtime 与 API runtime 的 source 区分
- Health 不是 auth full flow
- Health state 不写 route
- Health 不替代 feature-level error handling

---

## 13. 实施顺序

### Step 1
先加类型与 route：

- `project-runtime-info.ts`
- `api-route-contract.ts`
- `api-route-contract.test.ts`

### Step 2
扩 `ProjectRuntime`：

- 增加 `runtimeInfoClient`
- 修改 mock runtime
- 修改 API runtime
- 补 runtime tests

### Step 3
实现 health hook：

- `useProjectRuntimeHealthQuery.ts`
- error classification
- hook tests

### Step 4
实现 UI badge / boundary：

- `ProjectRuntimeStatusBadge.tsx`
- `ProjectRuntimeStatusBoundary.tsx`（如需要）
- component tests

### Step 5
接入 App 顶层：

- 显示 runtime source / health / retry
- 不改 workbench route
- 不改 feature query identity

### Step 6
扩 fake API harness：

- 默认 dispatch runtime-info
- 支持 401 / 403 / 404 / 503 / malformed / network override
- 补 fake API tests

### Step 7
更新文档与 app smoke：

- `doc/api-contract.md`
- App smoke tests

---

## 14. 完成后的验收标准

满足以下条件，PR24 才算完成：

1. `ProjectRuntime` 有统一的 runtime/session/health client。
2. Mock runtime 能返回 stable mock health。
3. API runtime 能通过 `ApiTransport` 请求 project runtime info。
4. `apiRouteContract` 有 project-level runtime-info helper。
5. UI 能显示当前 runtime source 与 health status。
6. Network / 401 / 403 / 404 / 5xx 有明确分类。
7. Runtime health 不写 route。
8. Runtime health query key 不依赖 scope / lens / selected object。
9. PR23 的 `runClient`、run endpoints、run hooks 不退化。
10. Scene / Chapter / Asset / Book 现有 smoke 不被破坏。
11. `doc/api-contract.md` 已记录 PR24 health/session contract。
12. 不包含真实 auth、真实 server、Temporal、SSE、DB、LLM、project CRUD。

---

## 15. PR24 结束时不要留下的债

以下情况都算 PR 做偏了：

- 新建了第二套 runtime provider。
- feature hooks 直接 fetch health endpoint，绕过 ProjectRuntime。
- 把 API health 写进 workbench route。
- 把 health 做成完整 auth/session 系统。
- 删除或破坏现有 `sceneRuntimeInfo(...)` 使用路径。
- 为了 health 大改 App navigation / mode rail。
- 让 health failure 阻断所有 mock runtime stories。
- run contract 被顺手改动。
- fake API runtime 开始模拟 orchestration workflow。

PR24 正确结束状态：

> renderer 现在能稳定表达 runtime source、project session health 与 capability boundary；后续真实 API server 或 orchestration backend 可以在这个边界下接入，而不需要让业务 feature 直接感知 transport / auth / engine 细节。

---

## 16. PR24 之后的推荐路线

### BE-PR1：Fixture-backed API Server Skeleton

目标：新增 `packages/api`，先兑现 renderer 已经固定的 API contracts，尤其是 PR20–PR24 的 read/write/run/health surface。

范围建议：

- `packages/api/package.json`
- `src/server.ts`
- `src/routes/**`
- `src/repositories/fixtureRepository.ts`
- `src/http/errors.ts`
- `GET /api/projects/:projectId/runtime-info`
- PR23 run endpoints 的 fixture-backed response
- 不接 DB / Temporal / LLM / auth full flow

### PR25：Backend Orchestration Integration UI

目标：在 API-only 前提下，把第一条 scene run / review gate / canon patch 的后端纵切接入 UI。

前端只做：

- start run
- observe run events via polling
- show waiting review state
- submit review decision
- invalidate affected queries

### BE-PR2：SceneRun Workflow Skeleton

目标：在后端 fixture server 之后，建立第一条 mock workflow：

```text
start scene run
-> context packet built
-> mock character fanout
-> scene manager proposal-set
-> waiting review
-> review decision
-> canon patch event
-> prose generated event
-> run completed
```

### PR26：Context Packet Inspector

目标：基于 PR23 的 `context_packet_built` 与 `context-packet` ref，做第一版只读 Context Packet Inspector。

### PR27：Proposal Variants Foundation

目标：基于 `proposal-set` ref 做 proposal variants / swipe 心智，但仍坚持 review gate。

### PR28：Asset Context Policy

目标：把 Asset / Knowledge 与 run context 连接起来，让 asset inclusion / exclusion 可审计。

---

## 17. 最终一句话

PR23 固定了“run 如何被启动、观察和审阅”的 renderer-side contract；PR24 应固定“renderer 如何知道当前 project runtime 是否可用、可信、支持哪些能力”的边界。不要急着做真实 orchestration UI，也不要先做完整后端。先把 project session / health / capability 这个安全边界补上，后面的 BE-PR1 与 PR25 才能稳。
