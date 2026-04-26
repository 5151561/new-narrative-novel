# PR20+ 后续任务计划（基于 PR19，按 API-only 后端决策修订）

## 结论

PR19 已经把前端推到了一个新的边界点：

- `ProjectRuntimeProvider` 已经存在。
- `ProjectRuntime` 已经把 `bookClient / chapterClient / reviewClient / sceneClient / traceabilitySceneClient` 收进一个 provider 边界。
- mock runtime 已经能 hydrate / persist project-scoped snapshot。
- book draft 已经走到 `read / compare / export / branch / review` 五种 draft 子视图。
- review、export artifact、branch、source fix action 都已经不再只是静态 UI。

但现在后端方向已经明确为 **API-only**，所以后续不能再沿着“前端 runtime 逐渐变成本地运行内核 / 本地持久化中心”的方向走。

新的判断是：

> **PR19 的 ProjectRuntime 以后只应被解释为“前端 client/provider 边界”，不是产品后端 runtime。**
>
> 真正的 project persistence、run orchestration、review state、canon state、artifact state 都应由 API 后端负责；renderer 只通过 typed API clients 访问这些能力。

因此，PR20 不建议继续做新的 manuscript 功能面，也不建议继续扩 localStorage persistence。下一步最应该做的是：

## **PR20：API Project Runtime Adapter & Contract Boundary**

一句话目标：

> **把 PR19 刚建立的 ProjectRuntime provider 边界，重新收敛成 API-only 前端接入边界。**

PR20 完成后，前端应具备两种 runtime：

1. `createMockProjectRuntime(...)`：只服务 Storybook / tests / 本地无后端预览。
2. `createApiProjectRuntime(...)`：只通过 HTTP API 实现同一组 clients。

同时明确：

- `ProjectPersistencePort` 不再是产品方向，只能保留为 mock runtime 的本地预览能力。
- API runtime 不应实现 localStorage snapshot persistence。
- frontend 不直接接 Temporal / worker / IPC / preload bridge。
- backend 即使内部使用 Temporal，也必须通过 API / SSE / polling 暴露给前端。

---

## 一、当前代码基线

### 1. 对象轴与工作轴已经很完整

当前 route 层已经支持：

- `scene`
- `chapter`
- `asset`
- `book`

并且 `BookDraftView` 已经包含：

- `read`
- `compare`
- `export`
- `branch`
- `review`

这意味着前端产品面已经很深，下一步不应该再先加新 UI，而应该先把数据接入边界稳定下来。

### 2. PR19 已经新增 project runtime / persistence 目录

当前已有：

```text
packages/renderer/src/app/project-runtime/
  ProjectRuntimeProvider.tsx
  project-runtime.ts
  project-persistence.ts
  mock-project-runtime.ts
  local-storage-project-persistence.ts
  project-runtime-test-utils.tsx
```

这说明 PR19 已经建立了注入边界。PR20 应该复用这个边界，而不是再发明一套 parallel provider。

### 3. PR19 的 mock runtime 已经承担了本地快照恢复

当前 mock runtime 会：

- 加载 project snapshot
- 恢复 mock review decisions
- 恢复 mock review fix actions
- 恢复 mock export artifacts
- 恢复 mock chapter records
- mutation 成功后保存 snapshot
- mutation save 失败时 rollback

这对本地预览有价值，但在 API-only 后端决策下，它不能继续升级成“前端产品持久化层”。

### 4. Asset 仍需要纳入 ProjectRuntime

当前 `ProjectRuntime` 里还没有 `assetClient`，但 `asset` 已经是正式 scope。

PR20 必须补齐这件事，否则 API-only 接入会出现一个明显漏洞：

- book / chapter / review / scene 可走 runtime provider
- asset 仍直接 import static `assetClient`

这会破坏统一 API client 边界。

---

## 二、PR20 的唯一目标

**把 ProjectRuntime 变成完整的 API client provider boundary。**

PR20 完成后应满足：

- 所有 feature query / mutation 的 production path 都能通过 `ProjectRuntimeProvider` 注入 client。
- `assetClient` 被纳入 `ProjectRuntime`。
- 新增 `createApiProjectRuntime(...)`，以 HTTP transport 实现现有 client interfaces。
- 新增 API endpoint contract 文档。
- localStorage persistence 明确降级为 mock runtime 的 dev/test/story 预览能力。
- 不改变现有 UI 行为。
- 不改变 route identity。
- 不改变 query key identity。

---

## 三、本轮明确不做

PR20 不做：

- 不做新的 Book Draft view。
- 不做新的 review UI。
- 不做新的 export / branch / publish 功能。
- 不接 Temporal SDK。
- 不接 Electron preload / IPC。
- 不做本地文件系统 persistence。
- 不做 auth 完整流程。
- 不做真实 SSE event stream。
- 不移除 mock runtime。
- 不把所有 mock data 迁移成 API fixture。
- 不重构全局 route。
- 不重构全部 query keys。

PR20 是 **API boundary PR**，不是新产品面 PR。

---

## 四、必须遵守的硬约束

### 4.1 API-only 后端边界

renderer 只能通过 API client 获取和修改产品状态。

不要新增：

- frontend worker runtime
- frontend Temporal client
- preload bridge runtime
- local filesystem persistence
- long-lived browser runtime store

允许保留：

- mock runtime
- localStorage snapshot persistence
- Storybook / tests 的 deterministic runtime injection

但这些必须被明确定位为 **mock preview adapter**。

### 4.2 route 仍然是 UI location 真源

不要因为 API 化而新增：

- selectedBookId store
- selectedChapterId store
- selectedAssetId store
- selectedReviewIssue store

现有规则继续保持：

- scene selection 来自 scene route
- chapter selected scene 来自 chapter route
- asset selected asset 来自 asset route
- book selected chapter / draft subview / review filters 来自 book route

### 4.3 query key identity 不变

PR20 不应该改现有 query key 的语义。

允许：

- query function 改为使用 runtime client
- client 实现从 mock 改成 API adapter

不允许：

- 为 API base URL 改 query key
- 为 provider type 改 query key
- 为 runtime hydration state 改 query key

### 4.4 feature client interfaces 先保持稳定

PR20 不先重写所有 client interface。

正确做法：

- 先让 API runtime 实现现有 interfaces。
- 后续 PR 再根据真实后端 contract 逐步收敛接口。

### 4.5 no backend assumptions in Storybook

Storybook 默认仍应使用 mock runtime。

不要让 story 在无 API server 时失败。

---

## 五、建议文件改动

### 5.1 新增

```text
packages/renderer/src/app/project-runtime/api-transport.ts
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
packages/renderer/src/app/project-runtime/api-transport.test.ts
packages/renderer/src/app/project-runtime/api-route-contract.ts
packages/renderer/src/app/project-runtime/api-route-contract.test.ts

doc/api-contract.md
```

### 5.2 修改

```text
packages/renderer/src/app/project-runtime/project-runtime.ts
packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx
packages/renderer/src/app/project-runtime/mock-project-runtime.ts
packages/renderer/src/app/project-runtime/index.ts
packages/renderer/src/app/providers.tsx

packages/renderer/src/features/asset/hooks/useAssetKnowledgeWorkspaceQuery.ts
packages/renderer/src/features/asset/containers/AssetKnowledgeWorkspace.tsx
packages/renderer/src/features/asset/containers/AssetWorkbench.tsx

packages/renderer/src/features/book/hooks/*Mutation*.ts
packages/renderer/src/features/review/hooks/*Mutation*.ts
packages/renderer/src/features/chapter/hooks/*Mutation*.ts
```

### 5.3 这一轮尽量不动

```text
packages/renderer/src/features/book/components/**
packages/renderer/src/features/chapter/components/**
packages/renderer/src/features/scene/components/**
packages/renderer/src/features/review/components/**
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
```

除非测试发现某个 hook 仍绕过 runtime provider，否则不要改 UI 组件。

---

## 六、API runtime 类型设计

### 6.1 更新 `ProjectRuntime`

把 `assetClient` 加入 runtime。

建议把 `persistence` 改成 mock-only optional：

```ts
export interface ProjectRuntime {
  projectId: string
  bookClient: BookClient
  chapterClient: ChapterClient
  assetClient: AssetClient
  reviewClient: ReviewClient
  sceneClient: SceneClient
  traceabilitySceneClient: TraceabilitySceneClient
  persistence?: ProjectPersistencePort
}
```

### 6.2 新增 API transport

```ts
export interface ApiTransport {
  requestJson<TResponse, TBody = unknown>(input: {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
    path: string
    query?: Record<string, string | number | boolean | null | undefined>
    body?: TBody
    signal?: AbortSignal
  }): Promise<TResponse>
}
```

### 6.3 统一 API error

```ts
export class ApiRequestError extends Error {
  status: number
  code?: string
  detail?: unknown
}
```

第一版只需要：

- `status`
- `message`
- `code?`
- `detail?`

不要在 PR20 做完整 toast / retry UI。

### 6.4 API runtime factory

```ts
export interface CreateApiProjectRuntimeOptions {
  projectId: string
  transport: ApiTransport
}

export function createApiProjectRuntime(options: CreateApiProjectRuntimeOptions): ProjectRuntime
```

注意：

- API runtime 不接收 `persistence`。
- API runtime 不访问 localStorage。
- API runtime 不导入 mock db。

---

## 七、endpoint contract 第一版

PR20 先以文档和 route-builder tests 固定 endpoint，不要求后端已经存在。

### 7.1 Book

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

### 7.2 Chapter

```text
GET   /api/projects/:projectId/chapters/:chapterId/structure
POST  /api/projects/:projectId/chapters/:chapterId/scenes/:sceneId/reorder
PATCH /api/projects/:projectId/chapters/:chapterId/scenes/:sceneId/structure
```

### 7.3 Asset

```text
GET /api/projects/:projectId/assets/:assetId/knowledge
```

### 7.4 Review

```text
GET    /api/projects/:projectId/books/:bookId/review-decisions
PUT    /api/projects/:projectId/books/:bookId/review-decisions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-decisions/:issueId

GET    /api/projects/:projectId/books/:bookId/review-fix-actions
PUT    /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
```

### 7.5 Scene / Traceability

```text
GET /api/projects/:projectId/scenes/:sceneId/workspace
GET /api/projects/:projectId/scenes/:sceneId/execution
GET /api/projects/:projectId/scenes/:sceneId/prose
GET /api/projects/:projectId/scenes/:sceneId/inspector
GET /api/projects/:projectId/scenes/:sceneId/patch-preview
GET /api/projects/:projectId/runtime-info
```

`traceabilitySceneClient` 第一版可以复用 scene endpoints。

---

## 八、实施顺序（给 AI 的执行顺序）

### Step 1：收敛 runtime interface

1. 在 `project-runtime.ts` 中加入 `assetClient`。
2. 将 `persistence` 改为 optional，并在注释中标记为 mock-only。
3. 更新 `mock-project-runtime.ts`，注入 `assetClient`。
4. 确保现有 tests 仍能通过。

### Step 2：新增 API transport

新增：

- `api-transport.ts`
- `api-transport.test.ts`

实现：

- path + query 序列化
- JSON body
- JSON response
- non-2xx -> `ApiRequestError`
- malformed JSON -> `ApiRequestError`

不要引入 axios。第一版用 `fetch`。

### Step 3：新增 API route contract helper

新增：

- `api-route-contract.ts`
- `api-route-contract.test.ts`

目标：

- 所有 API path 在一个地方构造。
- 测试固定 path 与 query。
- feature adapter 不手写重复字符串。

### Step 4：新增 `createApiProjectRuntime(...)`

新增：

- `api-project-runtime.ts`
- `api-project-runtime.test.ts`

实现所有现有 client methods：

- `bookClient`
- `chapterClient`
- `assetClient`
- `reviewClient`
- `sceneClient`
- `traceabilitySceneClient`

测试使用 fake transport：

- 断言 method/path/body 正确。
- 断言返回数据透传。
- 断言 mutation endpoint 正确。

### Step 5：provider 默认运行模式

修改 `ProjectRuntimeProvider.tsx` 或 `providers.tsx`。

建议：

```ts
function createDefaultProjectRuntime() {
  const apiBaseUrl = import.meta.env.VITE_NARRATIVE_API_BASE_URL
  if (apiBaseUrl) {
    return createApiProjectRuntime({
      projectId: import.meta.env.VITE_NARRATIVE_PROJECT_ID ?? 'book-signal-arc',
      transport: createHttpApiTransport({ baseUrl: apiBaseUrl }),
    })
  }
  return createMockProjectRuntime()
}
```

注意：

- tests/story 应显式注入 mock runtime，或默认没有 env 时继续 mock。
- 不要让 CI 因缺 API server 失败。

### Step 6：把 Asset 接入 runtime provider

1. 更新 `useAssetKnowledgeWorkspaceQuery(...)`，允许从 runtime 取 `assetClient`。
2. 更新 `AssetKnowledgeWorkspace.tsx` / `AssetWorkbench.tsx`，不再只依赖 static `assetClient`。
3. 保留 optional client 参数用于 component/query tests。

### Step 7：审计所有 query / mutation hook

检查以下 hooks 是否仍直接 import static client 且生产容器无法注入 runtime：

- `features/book/hooks/**`
- `features/chapter/hooks/**`
- `features/review/hooks/**`
- `features/scene/hooks/**`
- `features/asset/hooks/**`
- `features/traceability/hooks/**`

正确模式：

```ts
const runtime = useOptionalProjectRuntime()
const effectiveClient = resolveProjectRuntimeDependency(
  customClient,
  runtime?.featureClient,
  'hookName',
  'options.featureClient',
)
```

### Step 8：新增 API contract 文档

新增：

```text
doc/api-contract.md
```

内容包括：

- API-only 决策
- endpoint matrix
- response shape 约定
- error shape 约定
- auth placeholder
- SSE / run event 后续预留
- mock runtime 只作 dev/test/story fallback

### Step 9：测试与验证

至少运行：

```bash
pnpm typecheck
pnpm test
```

如果本 PR 修改 Storybook runtime setup，再运行：

```bash
pnpm storybook
```

---

## 九、测试要求

### 9.1 `api-transport.test.ts`

至少覆盖：

1. GET path + query 序列化。
2. POST JSON body。
3. 204 / empty response。
4. non-2xx 转成 `ApiRequestError`。
5. invalid JSON 转成 `ApiRequestError`。

### 9.2 `api-route-contract.test.ts`

至少覆盖：

1. book structure endpoint。
2. chapter reorder endpoint。
3. asset knowledge endpoint。
4. review decision set / clear endpoint。
5. scene prose / execution / patch preview endpoint。

### 9.3 `api-project-runtime.test.ts`

至少覆盖：

1. `getBookStructureRecord` 使用正确 endpoint。
2. `buildBookExportArtifact` 使用 POST 且 body 正确。
3. `reorderChapterScene` 使用 POST 且 body 正确。
4. `updateChapterSceneStructure` 使用 PATCH 且 body 正确。
5. `getAssetKnowledgeWorkspace` 已纳入 runtime。
6. `setReviewIssueDecision` / `clearReviewIssueDecision` 使用 PUT / DELETE。
7. `traceabilitySceneClient` 复用 scene trace endpoints。

### 9.4 provider tests

更新 / 新增：

```text
packages/renderer/src/app/providers.test.tsx
packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.test.tsx
```

至少覆盖：

1. 默认无 API env 时仍使用 mock runtime。
2. 明确传入 runtime 时使用传入 runtime。
3. runtime context 能提供 `assetClient`。
4. `persistence` 不再是 API runtime 必填项。

### 9.5 feature integration smoke

至少新增一条：

```text
用 fake API runtime 打开 asset knowledge deep link
-> Asset navigator / stage / inspector / dock 正常渲染
-> 点击 mention handoff 到 scene/chapter
-> browser back 返回 asset
```

再新增一条：

```text
用 fake API runtime 打开 book draft review
-> 设置 review decision
-> mutation 调用 API runtime reviewClient
-> query invalidation 仍命中原 query key
```

---

## 十、完成后的验收标准

PR20 完成标准：

1. `ProjectRuntime` 包含 `assetClient`。
2. `ProjectRuntime.persistence` 不再是 API runtime 必需字段。
3. 新增 `createApiProjectRuntime(...)`。
4. 新增 `ApiTransport` 与统一 `ApiRequestError`。
5. API route contract helper 有测试覆盖。
6. API runtime 对现有 book / chapter / asset / review / scene / traceability client interface 均有实现。
7. Asset production query path 已能通过 ProjectRuntime 注入 client。
8. mock runtime 仍可用于 Storybook / tests / 无后端本地预览。
9. localStorage snapshot persistence 没有继续扩成产品主路径。
10. route identity 不变。
11. query key identity 不变。
12. 不新增 UI 功能。
13. 不接 Temporal / preload / IPC / local filesystem。
14. `pnpm typecheck` 与 `pnpm test` 通过。

---

## 十一、PR20 结束时不要留下的债

以下情况都算 PR 做偏了：

- API runtime 没有覆盖 asset。
- API runtime 仍依赖 mock db。
- API runtime 仍要求 localStorage persistence。
- feature containers 仍大量绕过 provider 直接 import static client。
- 为了 API base URL 改了 query key。
- 为了 API 迁移改了 route shape。
- Storybook 需要真实 API server 才能打开。
- 新增了 frontend worker / Temporal client / preload bridge。
- 把 PR20 顺手做成 auth / SSE / run orchestration 大 PR。

PR20 的正确结束状态应该是：

> **前端仍然是同一个 Narrative IDE workbench，但所有真实后端能力都已经有一个清晰、可测试、可替换的 API client boundary。**

---

# PR20 之后的推荐路线

## PR21：API-backed Read Slice

目标：选一条完整 read path，用 API runtime 而不是 mock runtime 跑通。

推荐选择：

```text
Book Draft Review
```

因为它会同时触碰：

- book draft workspace
- compare
- export preview
- branch signals
- review inbox
- source handoff

PR21 不做 mutation，只验证 read payload shape 与 loading/error/not-found。

验收：

- fake API fixture server / fake transport 支撑 book draft review。
- loading / error / 404 状态稳定。
- UI 不知道数据来自 mock 还是 API。

## PR22：API-backed Mutations

目标：把已有 write paths 全部走 API runtime，并固定 invalidation / rollback 纪律。

范围：

- chapter reorder
- chapter structure patch
- review decision set / clear
- review fix action set / clear
- build export artifact

验收：

- mutation hooks 不再默认依赖 mock mutable db。
- optimistic update 仍然只 patch query cache，不改 route。
- conflict / validation error 有统一错误对象。

## PR23：Run / Event Stream API Surface

目标：为后端 orchestration 暴露最小 run event 接口，但前端不接 Temporal。

范围：

- `GET /runs/:runId`
- `POST /scenes/:sceneId/runs`
- `POST /runs/:runId/review-decisions`
- `GET /runs/:runId/events` 或 SSE `/runs/:runId/events/stream`

前端只消费 product-level run events，不读取 Temporal history。

## PR24：Project Session / API Persistence Cleanup

目标：把 PR19 localStorage persistence 明确收回到 mock-only/dev-only，并给 API project session 补齐：

- current project loading
- project switch
- API health state
- unauthorized / expired session empty state

不要做完整账号系统，只做 renderer 对 API session 的最小适配。

## PR25：Backend Orchestration Integration UI

目标：在 API-only 的前提下，把 scene run / review gate / canon patch 的第一条后端纵切接入 UI。

前端只需要：

- start run
- observe run events
- submit review decision
- refresh scene/chapter/book affected queries

不要让前端知道 Temporal workflow implementation。

---

# 给 AI agent 的最终一句话指令

在当前 `codex/pr19-project-persistence-provider-boundary` 已完成 PR19 的前提下，不要继续扩展本地 runtime / localStorage persistence，也不要新增新的 manuscript UI；先只围绕 **API Project Runtime Adapter & Contract Boundary** 做一轮窄而实的实现：

- 把 `ProjectRuntime` 明确收敛为前端 API client provider boundary
- 给 runtime 补齐 `assetClient`
- 让 `persistence` 变成 mock-only optional 能力
- 新增 `ApiTransport / ApiRequestError / api route contract / createApiProjectRuntime(...)`
- 用 fake transport 测试所有 client methods 的 method/path/body
- 更新 asset 与仍绕过 provider 的 hooks，让 production path 走 runtime client
- 新增 `doc/api-contract.md` 固定 API-only endpoint matrix
- 保持 route shape 与 query key identity 不变
- 保持 Storybook / tests 默认可用 mock runtime
- 明确不接 Temporal、preload、IPC、本地文件系统、auth 完整流程、SSE 真实流
- 用 `pnpm typecheck` 和 `pnpm test` 固定回归
