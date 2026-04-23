# BE-PR1 执行文档：Fixture-backed API Server Skeleton

> 基于 `codex/pr24-project-session-api-health-boundary` 当前代码状态。  
> 这份文档可以直接交给 AI agent 执行。

---

## 0. 结论

PR24 已经把 renderer 侧的 project runtime 边界补齐：

- `ProjectRuntime` 已经拥有 `runClient` 与 `runtimeInfoClient`。
- `features/run` 已经存在 `api` / `hooks`。
- `RunRecord / RunEventRecord / RunEventsPageRecord / SubmitRunReviewDecisionInput` 等 run contract 已经成立。
- `apiRouteContract` 已经覆盖 `runtime-info`、scene run、run events、run review decisions 等路径。
- `doc/api-contract.md` 已经把 PR23 run contract 和 PR24 runtime health contract 记录下来。
- mock runtime 已经有 project-scoped persistence，可以保存 review decisions、fix actions、export artifacts、run states、chapter records 等 mock-side mutable state。

所以，PR24 之后最合适的下一步不是继续扩 renderer UI，而是先落地一条 **fixture-backed API server skeleton**：

**新增 `packages/api`，让 renderer 在设置 `VITE_NARRATIVE_API_BASE_URL` 后，能通过真实 HTTP 调用同一套 `/api/projects/:projectId/...` 合同。**

一句话：

> **BE-PR1 不做真实后端业务，不接 DB / Temporal / LLM；它只把 PR20–PR24 已经固定的 API contract 变成一个能跑、能测、能被 renderer 连上的 fixture server。**

---

## 1. 当前代码基线

### 1.1 已经成立的 renderer 侧能力

当前 repo 仍以 `packages/renderer` 为主，但 workspace 已经采用 `packages/*`，可以直接新增 `packages/api`。

当前 renderer 已经具备：

- `ProjectRuntimeProvider` 根据 `VITE_NARRATIVE_API_BASE_URL` 决定使用 API runtime，否则使用 mock runtime。
- `createApiProjectRuntime(...)` 已经把 `book / chapter / asset / review / run / scene / traceability` client 全部接到 `ApiTransport`。
- `apiRouteContract` 已经是 renderer 与 API server 的路径真源。
- `ApiTransport` 已经有统一 JSON 请求与 `ApiRequestError`。
- `useProjectRuntimeHealthQuery()` 已经能读取 project-level runtime info，并把 network / 401 / 403 / 404 / 5xx / malformed JSON 映射成 health 状态。
- `RunEventKind` 已经包含 `context_packet_built`，`RunEventRefKind` 已经包含 `context-packet`，为后续 Context Packet Inspector 预留语义。

### 1.2 当前真正缺口

现在缺的不是再定义一个前端 hook，而是：

- 没有 `packages/api`。
- 没有真实 HTTP server 兑现 `doc/api-contract.md`。
- `VITE_NARRATIVE_API_BASE_URL` 虽然能切到 API runtime，但没有 server 可连。
- PR25 的 `start run -> poll events -> submit review decision -> invalidate queries` UI 若直接做，会只能继续依赖 mock runtime，无法验证真实 transport boundary。
- BE-PR2 的 workflow skeleton 如果没有 fixture server，会缺少最小可测 HTTP 壳子。

所以 BE-PR1 应先把 API server skeleton 打出来。

---

## 2. BE-PR1 的唯一目标

新增一个 fixture-backed API server：

```text
packages/api
  -> exposes /api/projects/:projectId/...
  -> serves PR20–PR24 contracts from in-memory fixtures
  -> supports runtime-info health
  -> supports run start / run detail / run events / review decision
  -> returns unified JSON errors
  -> has HTTP route tests
```

完成后，应该能做到：

```bash
pnpm --filter @narrative-novel/api dev
VITE_NARRATIVE_API_BASE_URL=http://localhost:4174 pnpm --filter @narrative-novel/renderer dev
```

然后 renderer 顶部 runtime boundary 显示 API runtime healthy，并且默认 workbench 能通过 HTTP 读取 scene / book / chapter / asset / review / run fixture 数据。

---

## 3. 本轮明确不做

BE-PR1 不做：

- 不接 Temporal。
- 不接真实 DB。
- 不接真实 LLM。
- 不接 SSE / WebSocket。
- 不做 OAuth / login / token refresh。
- 不做真实多 project CRUD。
- 不做 production auth / permission model。
- 不做 vector DB / RAG。
- 不做真实 workflow engine。
- 不把 API server 变成 renderer mock runtime 的反向依赖。
- 不改 workbench route。
- 不改 renderer query identity。
- 不改变 `RunRecord / RunEventRecord` payload shape。
- 不做 Context Packet Inspector UI。
- 不做 Proposal Variants UI。
- 不做 Run Debugger UI。

BE-PR1 只做：

```text
HTTP server skeleton
+ fixture repository
+ route handlers
+ unified errors
+ runtime-info
+ run/event/review fixture flow
+ tests
+ docs / scripts
```

---

## 4. 必须遵守的硬约束

### 4.1 API contract 以 renderer 的 `apiRouteContract` 和 `doc/api-contract.md` 为准

不要重新发明路径。

API server 路径必须继续遵守：

```text
/api/projects/:projectId/...
```

尤其是：

```text
GET  /api/projects/:projectId/runtime-info
POST /api/projects/:projectId/scenes/:sceneId/runs
GET  /api/projects/:projectId/runs/:runId
GET  /api/projects/:projectId/runs/:runId/events?cursor=...
POST /api/projects/:projectId/runs/:runId/review-decisions
```

### 4.2 先 fixture-backed，不要引入 DB abstraction 失控

可以新增 repository layer，但它只能是 fixture / in-memory repository：

```text
FixtureRepository
  getProjectRuntimeInfo
  getSceneWorkspace
  startSceneRun
  getRun
  getRunEvents
  submitRunReviewDecision
  ...
```

不要引入 migrations、ORM、Prisma、Drizzle、schema migration。

### 4.3 Run event 仍是产品事件，不是 raw worker / Temporal history

`RunEventRecord` 只承载小 payload：

- `kind`
- `label`
- `summary`
- `severity`
- `refs`

大 prompt / context / prose / debug payload 继续只通过 `refs` 指向：

- `context-packet`
- `proposal-set`
- `agent-invocation`
- `canon-patch`
- `prose-draft`
- `artifact`

### 4.4 PR23 run contract 不回退

不要删除或重命名：

- `context_packet_built`
- `context-packet`
- `proposal-set`
- cursor-based `RunEventsPageRecord`
- `review_decision_submitted`
- `canon_patch_applied`
- `prose_generated`

### 4.5 Runtime health 仍是 project-level，不进入 route

API server 返回 runtime-info，但 renderer 仍然通过 `useProjectRuntimeHealthQuery()` 读，不把 health 写进 URL。

### 4.6 API server 不依赖 browser APIs

不要从 `packages/api` import：

- React components
- hooks
- localStorage persistence
- Storybook files
- renderer test utilities

必要类型可以局部复制到 API package，或者只在测试里按 shape 验证；本轮不要为了共享类型新增大型 `packages/domain`。

---

## 5. 推荐技术选择

### 5.1 推荐新增 package

```text
packages/api
```

### 5.2 推荐栈

建议使用：

```text
Fastify + TypeScript + Vitest
```

原因：

- HTTP server 与 route test 简单。
- `server.inject()` 方便做 contract tests。
- 与现有 TypeScript / Vitest 生态一致。
- 以后可以自然接真实 repository / workflow engine。

如果 AI agent 想避免新增依赖，也可以用 Node `http` 实现；但 BE-PR1 的 route 数量较多，Fastify 更稳。

---

## 6. 建议文件结构

新增：

```text
packages/api/
  package.json
  tsconfig.json
  src/
    server.ts
    createServer.ts
    config.ts
    routes/
      project-runtime.ts
      book.ts
      chapter.ts
      asset.ts
      review.ts
      scene.ts
      run.ts
    repositories/
      fixtureRepository.ts
      fixture-data.ts
      runFixtureStore.ts
    http/
      errors.ts
      json.ts
      route-params.ts
    contracts/
      api-records.ts
    test/
      test-server.ts
    createServer.test.ts
    routes.runtime-info.test.ts
    routes.run.test.ts
    routes.read-surfaces.test.ts
    routes.write-surfaces.test.ts
```

修改：

```text
package.json
pnpm-workspace.yaml（通常不需要，已有 packages/*）
doc/api-contract.md
README.md 或 doc/PR24... 后续路线说明（可选）
```

---

## 7. Package scripts 建议

### 7.1 `packages/api/package.json`

建议：

```json
{
  "name": "@narrative-novel/api",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx src/server.ts",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@fastify/cors": "latest",
    "fastify": "latest"
  },
  "devDependencies": {
    "@types/node": "latest",
    "tsx": "latest",
    "typescript": "^5.8.3",
    "vitest": "^3.1.2"
  }
}
```

版本可以由 AI 按 lockfile 约束选择；不要手写不存在的版本。

### 7.2 root `package.json`

把 root scripts 从 renderer-only 扩成明确脚本：

```json
{
  "scripts": {
    "typecheck": "pnpm --filter @narrative-novel/renderer typecheck && pnpm --filter @narrative-novel/api typecheck",
    "test": "pnpm --filter @narrative-novel/renderer test && pnpm --filter @narrative-novel/api test",
    "build": "pnpm --filter @narrative-novel/renderer build",
    "storybook": "pnpm --filter @narrative-novel/renderer storybook",
    "api:dev": "pnpm --filter @narrative-novel/api dev",
    "renderer:dev": "pnpm --filter @narrative-novel/renderer dev"
  }
}
```

如果你想降低 PR 风险，也可以只新增 `api:dev / api:test / api:typecheck`，暂不改 root `test/typecheck`。但我更推荐让 root `test/typecheck` 覆盖 API，避免后端 package 漂移。

---

## 8. API server 行为设计

### 8.1 Config

`packages/api/src/config.ts`：

```ts
export interface ApiServerConfig {
  port: number
  host: string
  apiBasePath: string
  defaultProjectId: string
  allowCorsOrigin: string | true
}
```

默认值建议：

```text
PORT=4174
HOST=127.0.0.1
DEFAULT_PROJECT_ID=book-signal-arc
CORS_ORIGIN=true for dev
```

### 8.2 Runtime info

`GET /api/projects/:projectId/runtime-info` 返回：

```ts
ProjectRuntimeInfoRecord
```

示例：

```json
{
  "projectId": "book-signal-arc",
  "projectTitle": "book-signal-arc",
  "source": "api",
  "status": "healthy",
  "summary": "Connected to fixture API runtime.",
  "checkedAtLabel": "Fixture API runtime",
  "apiBaseUrl": "http://localhost:4174",
  "versionLabel": "fixture-api-be-pr1",
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

### 8.3 Unified error body

所有非 2xx 错误返回：

```json
{
  "status": 404,
  "message": "Scene not found",
  "code": "SCENE_NOT_FOUND",
  "detail": {
    "sceneId": "scene-404"
  }
}
```

必须覆盖：

- `400` invalid input
- `404` not found
- `409` invalid run event cursor
- `500` unexpected fixture failure

### 8.4 CORS

dev server 必须允许 renderer dev server 跨域访问。

第一版可以：

```ts
await app.register(cors, { origin: true })
```

不要在 BE-PR1 做 production CORS 策略。

---

## 9. Route coverage matrix

BE-PR1 建议覆盖所有当前 `apiRouteContract` 暴露路径，但实现可以是 fixture / in-memory。

### 9.1 Project session

```text
GET /api/projects/:projectId/runtime-info
```

### 9.2 Book

```text
GET  /api/projects/:projectId/books/:bookId/structure
GET  /api/projects/:projectId/books/:bookId/manuscript-checkpoints
GET  /api/projects/:projectId/books/:bookId/manuscript-checkpoints/:checkpointId
GET  /api/projects/:projectId/books/:bookId/export-profiles
GET  /api/projects/:projectId/books/:bookId/export-profiles/:exportProfileId
GET  /api/projects/:projectId/books/:bookId/export-artifacts
POST /api/projects/:projectId/books/:bookId/export-artifacts
GET  /api/projects/:projectId/books/:bookId/experiment-branches
GET  /api/projects/:projectId/books/:bookId/experiment-branches/:branchId
```

第一版 `POST export-artifacts` 只写 in-memory artifact，不生成真实文件。

### 9.3 Chapter

```text
GET   /api/projects/:projectId/chapters/:chapterId/structure
POST  /api/projects/:projectId/chapters/:chapterId/scenes/:sceneId/reorder
PATCH /api/projects/:projectId/chapters/:chapterId/scenes/:sceneId/structure
```

可以复用现有 chapter mutation 语义，但不要直接 import renderer hook。

### 9.4 Asset

```text
GET /api/projects/:projectId/assets/:assetId/knowledge
```

### 9.5 Review

```text
GET    /api/projects/:projectId/books/:bookId/review-decisions
PUT    /api/projects/:projectId/books/:bookId/review-decisions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-decisions/:issueId
GET    /api/projects/:projectId/books/:bookId/review-fix-actions
PUT    /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
```

### 9.6 Scene read surfaces

```text
GET /api/projects/:projectId/scenes/:sceneId/workspace
GET /api/projects/:projectId/scenes/:sceneId/setup
GET /api/projects/:projectId/scenes/:sceneId/execution
GET /api/projects/:projectId/scenes/:sceneId/prose
GET /api/projects/:projectId/scenes/:sceneId/inspector
GET /api/projects/:projectId/scenes/:sceneId/dock-summary
GET /api/projects/:projectId/scenes/:sceneId/dock-tabs/:tab
GET /api/projects/:projectId/scenes/:sceneId/patch-preview
```

### 9.7 Scene write / command placeholders

```text
PATCH /api/projects/:projectId/scenes/:sceneId/setup
POST  /api/projects/:projectId/scenes/:sceneId/execution/continue
POST  /api/projects/:projectId/scenes/:sceneId/execution/thread
POST  /api/projects/:projectId/scenes/:sceneId/patch-commit
POST  /api/projects/:projectId/scenes/:sceneId/prose/revision
POST  /api/projects/:projectId/scenes/:sceneId/proposals/accept
POST  /api/projects/:projectId/scenes/:sceneId/proposals/edit-accept
POST  /api/projects/:projectId/scenes/:sceneId/proposals/request-rewrite
POST  /api/projects/:projectId/scenes/:sceneId/proposals/reject
```

第一版可以：

- 返回 `204`。
- 追加一条 in-memory activity / run event（可选）。
- 不真实改 scene execution state，除非测试需要。

### 9.8 Run endpoints

```text
POST /api/projects/:projectId/scenes/:sceneId/runs
GET  /api/projects/:projectId/runs/:runId
GET  /api/projects/:projectId/runs/:runId/events?cursor=...
POST /api/projects/:projectId/runs/:runId/review-decisions
```

`GET /events/stream` 只保留合同，不在 server 内实现 SSE；可以返回 `501` 或不注册。推荐不注册真实 stream，避免误导 PR25。

---

## 10. Fixture repository 设计

### 10.1 不要反向依赖 renderer

BE-PR1 不要让 `packages/api` 直接依赖 `packages/renderer/src/**`。

原因：

- renderer 有 React / hooks / aliases / browser assumptions。
- API server 不应依赖前端实现。
- 后续如果拆真实 domain package，会更自然。

### 10.2 先复制最小完整 fixture shape

`fixture-data.ts` 可以先包含最小但完整的项目数据：

```text
book-signal-arc
  chapters:
    chapter-signals-in-rain
    chapter-open-water-signals
  scenes:
    scene-midnight-platform
    scene-ticket-window
    scene-open-water-signal
  assets:
    asset-ren-voss
    asset-mei-arden
    asset-midnight-platform
```

要求：

- 每个返回对象字段必须满足 renderer 当前 view-model 使用。
- 不要返回半空对象。
- 缺少对象时返回 `null` 或 404，要符合 `doc/api-contract.md` 约定。

### 10.3 In-memory mutable store

新增 `runFixtureStore.ts`：

```ts
interface RunFixtureStore {
  startSceneRun(input): RunRecord
  getRun(runId): RunRecord | null
  getRunEvents(runId, cursor?): RunEventsPageRecord
  submitRunReviewDecision(input): RunRecord
  reset(): void
}
```

Run flow 第一版固定：

```text
start scene run
-> create run_created
-> run_started
-> context_packet_built
-> agent_invocation_started
-> agent_invocation_completed
-> proposal_created
-> review_requested
-> status waiting_review
```

submit review decision：

```text
review_decision_submitted
-> canon_patch_applied（accept / accept-with-edit only）
-> prose_generated（accept / accept-with-edit only）
-> run_completed 或 run_failed/rejected state（reject 可 completed with rejected summary）
```

### 10.4 Cursor semantics

`GET /runs/:runId/events?cursor=...`：

- 不带 cursor：返回第一页。
- 带 cursor：返回该 event 之后的下一页。
- cursor 属于别的 run 或不存在：返回 `409` JSON error。
- `nextCursor` 是当前页最后一条 event id。

第一版 page size 可以固定为 `50`。

---

## 11. PR25 所需最小数据保证

BE-PR1 做完后，PR25 应能直接实现：

```text
Scene / Orchestrate
  -> Start Run
  -> Poll Run Events
  -> Show Waiting Review
  -> Submit Decision
  -> Invalidate scene execution / inspector / prose / dock queries
```

因此 BE-PR1 的 run fixture 至少要保证：

- `startSceneRun` 返回 `RunRecord.status='waiting_review'` 或经过 event list 可看出 waiting review。
- `pendingReviewId` 必须存在。
- run events 中必须有：
  - `context_packet_built` + `context-packet` ref
  - `proposal_created` + `proposal-set` ref
  - `review_requested` + `review` ref
- `submitRunReviewDecision` 后返回 completed run。
- completed run events 中必须有：
  - `review_decision_submitted`
  - `canon_patch_applied`
  - `prose_generated`
  - `run_completed`

---

## 12. Renderer integration instructions

### 12.1 `.env.example`

新增或更新 renderer env 示例：

```text
VITE_NARRATIVE_API_BASE_URL=http://localhost:4174
VITE_NARRATIVE_PROJECT_ID=book-signal-arc
```

### 12.2 Do not change renderer runtime contract

BE-PR1 不应大改：

- `ProjectRuntimeProvider`
- `createApiProjectRuntime`
- `apiRouteContract`
- `RunClient`
- existing hooks

只允许很小的兼容修复，例如 API server actual response 暴露出某个 contract typo 时修正测试。

---

## 13. 测试方案

### 13.1 API server unit / HTTP tests

用 Fastify inject 测：

#### `routes.runtime-info.test.ts`

至少覆盖：

1. `GET /api/projects/book-signal-arc/runtime-info` 返回 `source='api'`。
2. capabilities 包含：
   - `read`
   - `write`
   - `runEvents`
   - `runEventPolling`
   - `runEventStream=false`
   - `reviewDecisions`
   - `contextPacketRefs`
   - `proposalSetRefs`
3. unknown project 返回 `404` 统一错误体。

#### `routes.run.test.ts`

至少覆盖：

1. `POST /scenes/:sceneId/runs` 返回 waiting review run。
2. `GET /runs/:runId` 返回同一个 run。
3. `GET /runs/:runId/events` 返回 context / proposal / review events。
4. cursor pagination 正确。
5. invalid cursor 返回 `409`。
6. `POST /runs/:runId/review-decisions` 后 run completed。
7. completed events 包含 canon patch / prose / run completed。

#### `routes.read-surfaces.test.ts`

至少覆盖默认 workbench 会读到的路径：

- book structure
- chapter structure
- asset knowledge
- scene workspace
- scene execution
- scene prose
- scene inspector
- scene dock summary
- scene patch preview
- review decisions
- review fix actions

#### `routes.write-surfaces.test.ts`

至少覆盖：

- chapter reorder returns updated chapter structure.
- chapter scene patch returns updated chapter structure.
- review decision `PUT` and `DELETE`.
- review fix action `PUT` and `DELETE`.
- export artifact `POST` returns artifact record.
- scene command endpoints return expected 204 / empty JSON behavior.

### 13.2 Renderer API smoke（推荐）

在 renderer 或 API package 中新增一个 compatibility smoke：

```text
createApiProjectRuntime({ projectId, transport: testTransportToApiServer })
-> runtimeInfoClient.getProjectRuntimeInfo()
-> sceneClient.getSceneWorkspace(defaultSceneId)
-> runClient.startSceneRun(defaultSceneId)
-> runClient.getRunEvents(runId)
-> runClient.submitRunReviewDecision(runId)
```

这个 smoke 价值很高：它证明 API server 不是“自己测自己”，而是真的能被 renderer 的 `createApiProjectRuntime` 消费。

### 13.3 Root validation

PR 完成前至少跑：

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm --filter @narrative-novel/api dev
```

如果 AI agent 无法实际启动长驻 dev server，至少要保证 API tests 通过。

---

## 14. 文档更新要求

更新 `doc/api-contract.md`，新增：

```md
## BE-PR1 Fixture-backed API Server Skeleton
```

写明：

- `packages/api` 是 fixture-backed local/dev API server。
- 它兑现 PR20–PR24 renderer contracts。
- 它不接 DB / Temporal / LLM / SSE。
- Runtime info 的 `source='api'` 表示前端通过 HTTP contract 读写，不表示是真实 production backend。
- Run events 是 product-level event stream，不是 raw LLM token stream，也不是 Temporal history。
- `events/stream` 仍是未来 SSE 占位。
- 如果 endpoint 尚为 command placeholder，应写明返回策略。

更新 README 的本地开发区：

```bash
pnpm api:dev
VITE_NARRATIVE_API_BASE_URL=http://localhost:4174 pnpm renderer:dev
```

---

## 15. 实施顺序（给 AI agent）

### Step 1
新增 `packages/api` 基础 package：

- `package.json`
- `tsconfig.json`
- `src/server.ts`
- `src/createServer.ts`
- `src/config.ts`

先让 `GET /healthz` 或 `GET /api/projects/book-signal-arc/runtime-info` 跑通。

### Step 2
新增 HTTP error helpers：

- `ApiHttpError`
- `notFound(...)`
- `conflict(...)`
- `badRequest(...)`
- global error handler

确保错误体符合 `doc/api-contract.md`。

### Step 3
新增 fixture repository：

- project runtime info
- minimal book/chapter/scene/asset/review/export/branch/checkpoint fixtures
- in-memory mutable state reset helper

### Step 4
实现 read route groups：

- project runtime
- book
- chapter
- asset
- review
- scene

先保证 renderer 默认页面和四个 scope 都能读到完整对象。

### Step 5
实现 write / command route groups：

- chapter reorder / patch
- review decision / fix action
- export artifact create
- scene command placeholders

不要做真实 workflow。

### Step 6
实现 run route group：

- start run
- get run
- get events with cursor
- submit review decision

固定 PR25 所需的 run event shape。

### Step 7
补 API tests：

- runtime-info
- read surfaces
- write surfaces
- run flow
- unified errors

### Step 8
补 renderer compatibility smoke：

- 用 `createApiProjectRuntime` 访问 test API server。

### Step 9
更新 root scripts、README、`doc/api-contract.md`。

---

## 16. 完成后的验收标准

满足以下条件，BE-PR1 才算完成：

1. `packages/api` 已存在，并能独立 `dev / typecheck / test`。
2. Root scripts 能覆盖 API package，或至少提供明确 API scripts。
3. `GET /api/projects/:projectId/runtime-info` 返回 API source 的 healthy runtime info。
4. API server 支持 PR20–PR24 的主要 read / write / run / health routes。
5. Run fixture flow 支持 start / get / events / review decision。
6. Run events 包含 `context_packet_built`、`proposal_created`、`review_requested`、`canon_patch_applied`、`prose_generated`。
7. Events cursor 行为符合 PR23 合同。
8. 统一错误体支持 400 / 404 / 409 / 500。
9. Renderer 的 `createApiProjectRuntime` 可以通过真实 HTTP transport 消费 API server。
10. `VITE_NARRATIVE_API_BASE_URL=http://localhost:4174` 能让 renderer 切到 API runtime。
11. 不包含 DB / Temporal / LLM / SSE / auth full flow。
12. 不改 workbench route，也不改 renderer query identity。

---

## 17. BE-PR1 结束时不要留下的债

以下情况都算做偏：

- API route 路径与 `apiRouteContract` 不一致。
- runtime-info 不返回 capabilities，导致 PR24 health boundary 失效。
- run events 内联大 prompt / prose / context payload。
- API server 直接 import React / renderer hooks。
- 为 fixture server 引入真实 DB / ORM / migrations。
- 为 run fixture 引入 Temporal / worker / job queue。
- 把 `events/stream` 做成半套 SSE，却没有后续消费策略。
- 为了 server 改动 renderer route state。
- 只实现 runtime-info，不实现 renderer 默认 workbench 需要的 read routes。
- 只实现 API 自测，没有 renderer runtime compatibility smoke。

正确结束状态应该是：

> renderer 可以在 mock runtime 与 fixture API runtime 之间切换；fixture API server 兑现现有合同，但业务仍然是可控、可测试、无 DB/LLM/Temporal 的开发地基。

---

## 18. BE-PR1 之后的推荐路线

### PR25：Backend Orchestration Integration UI

在 API-only 前提下，把第一条 scene run / review gate 接进 Scene / Orchestrate：

- Start Run button / command
- poll run events
- event stream panel
- waiting review banner
- submit review decision controls
- invalidate scene execution / prose / inspector / dock queries

### BE-PR2：SceneRun Workflow Skeleton

在 fixture API server 内或旁路 worker 中模拟第一条 workflow：

```text
start scene run
-> context packet built
-> mock character fanout
-> scene manager proposal set
-> waiting review
-> review decision
-> canon patch event
-> prose generated event
-> run completed
```

仍不接真实 LLM / Temporal。

### PR26：Context Packet Inspector

基于 `context_packet_built` 与 `context-packet` refs 做只读 Context Packet Inspector。

### PR27：Proposal Variants Foundation

基于 `proposal-set` ref 做 variants / swipe 心智，但仍走 review gate。

### PR28：Asset Context Policy

把 Asset / Knowledge 与 run context inclusion / exclusion 连接起来，让 asset activation 可审计。

---

## 19. 给 AI 的最终一句话指令

在当前 `codex/pr24-project-session-api-health-boundary` 已完成 PR24 的前提下，不要继续抛光 renderer health UI，也不要直接接 Temporal / DB / LLM；先只围绕 **Fixture-backed API Server Skeleton** 做一轮窄而实的后端地基：

- 新增 `packages/api`
- 用 Fastify/TypeScript 实现 `/api/projects/:projectId/...` fixture server
- 兑现 PR20–PR24 的 read / write / run / health contracts
- 尤其跑通 runtime-info 与 scene run/event/review decision 纵切
- 用 in-memory fixture repository，不接 DB / Temporal / LLM / SSE / auth
- 保持 run event payload 小而可引用，继续支持 context-packet / proposal-set refs
- 补 API route tests 与 renderer `createApiProjectRuntime` compatibility smoke
- 更新 root scripts 与 `doc/api-contract.md`
- 明确不改 workbench route、不改 renderer query identity、不做真实 orchestration workflow
