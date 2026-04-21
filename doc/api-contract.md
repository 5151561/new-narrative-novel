# PR20 API 合同说明

## 1. 当前决策：PR20 只认 API 边界

PR20 的前端运行路径统一收敛到 `/api/projects/{projectId}/...`。

这次的明确取舍是：

- `renderer` 不再把 mock DB / 本地持久化当成产品态数据来源。
- `ProjectRuntime` 的产品路径是 `createApiProjectRuntime -> ApiTransport -> /api/projects/...`。
- mock runtime 仍然保留，但它只用于开发、测试、Storybook、临时演示；它不是产品持久化路径，也不是后续真实数据接入的终态。
- 这保证了前端后续接真实后端时，只需要兑现本文档里的路由、返回体和错误体，不需要再回退到“页面直接读 mock 数据”的模式。

## 2. 当前 API 边界矩阵

以下矩阵描述的是当前已经落地、被 `api-route-contract.ts` 和 `createApiProjectRuntime` 消费的边界。

| 领域 | 方法 | 路径 | 主要返回 |
| --- | --- | --- | --- |
| Book | `GET` | `/api/projects/{projectId}/books/{bookId}/structure` | `BookStructureRecord \| null` |
| Book | `GET` | `/api/projects/{projectId}/books/{bookId}/manuscript-checkpoints` | `BookManuscriptCheckpointRecord[]` |
| Book | `GET` | `/api/projects/{projectId}/books/{bookId}/manuscript-checkpoints/{checkpointId}` | `BookManuscriptCheckpointRecord \| null` |
| Book | `GET` | `/api/projects/{projectId}/books/{bookId}/export-profiles` | `BookExportProfileRecord[]` |
| Book | `GET` | `/api/projects/{projectId}/books/{bookId}/export-profiles/{exportProfileId}` | `BookExportProfileRecord \| null` |
| Book | `GET` | `/api/projects/{projectId}/books/{bookId}/export-artifacts` | `BookExportArtifactRecord[]` |
| Book | `POST` | `/api/projects/{projectId}/books/{bookId}/export-artifacts` | `BookExportArtifactRecord` |
| Book | `GET` | `/api/projects/{projectId}/books/{bookId}/experiment-branches` | `BookExperimentBranchRecord[]` |
| Book | `GET` | `/api/projects/{projectId}/books/{bookId}/experiment-branches/{branchId}` | `BookExperimentBranchRecord \| null` |
| Chapter | `GET` | `/api/projects/{projectId}/chapters/{chapterId}/structure` | `ChapterStructureWorkspaceRecord \| null` |
| Chapter | `POST` | `/api/projects/{projectId}/chapters/{chapterId}/scenes/{sceneId}/reorder` | `ChapterStructureWorkspaceRecord \| null` |
| Chapter | `PATCH` | `/api/projects/{projectId}/chapters/{chapterId}/scenes/{sceneId}/structure` | `ChapterStructureWorkspaceRecord \| null` |
| Asset | `GET` | `/api/projects/{projectId}/assets/{assetId}/knowledge` | `AssetKnowledgeWorkspaceRecord \| null` |
| Review | `GET` | `/api/projects/{projectId}/books/{bookId}/review-decisions` | `ReviewIssueDecisionRecord[]` |
| Review | `PUT` | `/api/projects/{projectId}/books/{bookId}/review-decisions/{issueId}` | `ReviewIssueDecisionRecord` |
| Review | `DELETE` | `/api/projects/{projectId}/books/{bookId}/review-decisions/{issueId}` | 空响应 / `204` |
| Review | `GET` | `/api/projects/{projectId}/books/{bookId}/review-fix-actions` | `ReviewIssueFixActionRecord[]` |
| Review | `PUT` | `/api/projects/{projectId}/books/{bookId}/review-fix-actions/{issueId}` | `ReviewIssueFixActionRecord` |
| Review | `DELETE` | `/api/projects/{projectId}/books/{bookId}/review-fix-actions/{issueId}` | 空响应 / `204` |
| Project Session | `GET` | `/api/projects/{projectId}/runtime-info` | `ProjectRuntimeInfoRecord` |
| Scene | `GET` | `/api/projects/{projectId}/scenes/{sceneId}/workspace` | `SceneWorkspaceViewModel` |
| Scene | `GET` | `/api/projects/{projectId}/scenes/{sceneId}/setup` | `SceneSetupViewModel` |
| Scene | `PATCH` | `/api/projects/{projectId}/scenes/{sceneId}/setup` | 空响应 / `204` |
| Scene | `GET` | `/api/projects/{projectId}/scenes/{sceneId}/execution` | `SceneExecutionViewModel` |
| Scene | `POST` | `/api/projects/{projectId}/scenes/{sceneId}/execution/continue` | 空响应 / `204` |
| Scene | `POST` | `/api/projects/{projectId}/scenes/{sceneId}/execution/thread` | 空响应 / `204` |
| Scene | `GET` | `/api/projects/{projectId}/scenes/{sceneId}/prose` | `SceneProseViewModel` |
| Scene | `POST` | `/api/projects/{projectId}/scenes/{sceneId}/prose/revision` | 空响应 / `204` |
| Scene | `GET` | `/api/projects/{projectId}/scenes/{sceneId}/inspector` | `SceneInspectorViewModel` |
| Scene | `GET` | `/api/projects/{projectId}/scenes/{sceneId}/dock-summary` | `SceneDockViewModel` |
| Scene | `GET` | `/api/projects/{projectId}/scenes/{sceneId}/dock-tabs/{tab}` | `Partial<SceneDockViewModel>` |
| Scene | `GET` | `/api/projects/{projectId}/scenes/{sceneId}/patch-preview` | `ScenePatchPreviewViewModel \| null` |
| Scene | `POST` | `/api/projects/{projectId}/scenes/{sceneId}/patch-commit` | 空响应 / `204` |
| Scene | `POST` | `/api/projects/{projectId}/scenes/{sceneId}/proposals/accept` | 空响应 / `204` |
| Scene | `POST` | `/api/projects/{projectId}/scenes/{sceneId}/proposals/edit-accept` | 空响应 / `204` |
| Scene | `POST` | `/api/projects/{projectId}/scenes/{sceneId}/proposals/request-rewrite` | 空响应 / `204` |
| Scene | `POST` | `/api/projects/{projectId}/scenes/{sceneId}/proposals/reject` | 空响应 / `204` |

## 3. 返回体的实际约定

### 3.1 读接口

- 列表接口返回数组；没有数据时返回空数组，不返回 `null`。
- 明细接口在“对象不存在”时返回 `null`，不抛前端自定义空对象。
- Book / Chapter / Asset 的结构类接口返回的是“记录对象”，通常保留双语文本结构，例如 `{ en, 'zh-CN' }`，由前端再按 locale 映射。
- Scene 相关接口返回的是更贴近 UI 的 view model，默认可以直接驱动工作台渲染，不要求前端再拼装底层持久化结构。
- `/runtime-info` 返回的是项目级 runtime health / source / capability 记录；旧的 scene 顶栏如果仍消费这一路径，应视为 client adaptation，而不是这条合同的主语义。

### 3.2 写接口

- `chapter scene reorder`、`chapter scene structure patch` 返回最新的整章工作区快照，前端据此刷新章节结构缓存。
- `review-decisions/{issueId}` 与 `review-fix-actions/{issueId}` 的 `PUT` 返回最新单条记录；`DELETE` 返回空响应即可。
- `books/{bookId}/export-artifacts` 的 `POST` 返回新产物记录。
- Scene 侧动作型接口当前统一按“命令成功即可”的思路处理，返回空响应；需要新数据时由查询重新拉取。

## 4. 统一错误体

非 2xx 响应应返回 JSON 错误体：

```json
{
  "status": 404,
  "message": "Book not found",
  "code": "BOOK_NOT_FOUND",
  "detail": {
    "bookId": "book-404"
  }
}
```

约定如下：

- `status`: 必填，语义上应与 HTTP status 一致。
- `message`: 必填，给前端直接展示或记录。
- `code`: 选填，给前端做稳定分支判断。
- `detail`: 选填，放结构化上下文，不要求固定 schema。

当前 transport 对非 JSON 错误也能兜底，但那只是兼容行为，不是合同目标；产品接口应优先返回上面的 JSON 形态。

## 5. Auth 占位

本 PR 不进入 auth 实现，但 API 合同预留以下约束：

- `/api/projects/...` 默认视为受保护资源。
- 鉴权失败时返回 `401/403`，并遵守统一错误体。
- 前端不会在本 PR 内实现 token 刷新、会话续期、权限模型；这些由后续 auth 方案补齐。

## PR24 Project Session / API Health Boundary

### 合同目标

- `GET /api/projects/{projectId}/runtime-info` 是项目级 session / runtime health 读取面，不属于 scene route，也不携带 scene/chapter/book/asset 选择状态。
- 这条读取面用于 workbench 级运行时边界展示，让 header 能统一表达当前项目连接的是 mock 还是 API，以及当前健康状态是否可继续信任。
- 它不是完整 auth 流，也不替代 feature 级错误处理。

### `ProjectRuntimeInfoRecord` 结构

```json
{
  "projectId": "project-signal-arc",
  "projectTitle": "Signal Arc",
  "source": "api",
  "status": "healthy",
  "summary": "Connected to runtime gateway.",
  "checkedAtLabel": "2026-04-21 09:30",
  "apiBaseUrl": "/api",
  "versionLabel": "runtime-gateway-2026.04.21",
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

字段语义：

- `projectId` / `projectTitle`：当前 project session 的标识与展示标题。
- `source`: `mock | api`。
  - `mock` 表示当前客户端运行在测试 / Storybook / 演示用 mock runtime 上。
  - `api` 表示当前客户端正在通过 `/api/projects/{projectId}/...` 合同读写真实产品路径。
- `status`：`healthy | checking | unavailable | unauthorized | forbidden | not_found | unknown`。
- `summary`：给 workbench 级 runtime boundary 直接展示的简短说明，强调当前连接状态，而不是 feature 细节。
- `checkedAtLabel` / `apiBaseUrl` / `versionLabel`：可选展示字段，不要求所有实现都返回。
- `capabilities`：项目级能力开关，不是 route state，也不是 UI 权限缓存。

### health status enum 语义

- `healthy`：runtime-info 读取成功，且当前 source/session 可以继续提供 project 级能力信息。
- `checking`：客户端正在首轮检查或手动重试，允许 workbench 继续渲染。
- `unavailable`：服务暂不可用、网络失败、或返回 malformed JSON 等导致当前 health 读取不可用。
- `unauthorized`：返回 `401`，说明当前 runtime 读取需要认证，但本合同不定义后续登录/刷新动作。
- `forbidden`：返回 `403`，说明当前 project session 已被拒绝访问。
- `not_found`：返回 `404`，说明 project runtime session 不存在或路径不可达。
- `unknown`：其他未映射错误，保留给客户端统一降级。

### capabilities 语义

- `read` / `write`：表示项目读写面是否可用，供 workbench header 或 feature 级提示引用。
- `runEvents` / `runEventPolling` / `runEventStream`：表示当前运行事件能力是否开放，以及是 polling 还是 stream。
- `reviewDecisions` / `contextPacketRefs` / `proposalSetRefs`：表示 review/source-trace 相关能力是否可用。
- `capabilities` 只表达当前 runtime session 暴露出的能力，不表示某个具体 feature 已经成功读取完成。

### 错误映射

- `401` -> `unauthorized`
- `403` -> `forbidden`
- `404` -> `not_found`
- `5xx` -> `unavailable`
- network error / fetch failure -> `unavailable`
- malformed JSON -> `unavailable`
- 其他落空错误 -> `unknown`

这里的错误映射只服务于 project-level health boundary：

- 它不替代后续完整 auth/session 设计。
- 它不把 route 改写为某种 “health mode”。
- 它不应该吞掉 feature 自己的 `404 / 500 / malformed JSON` 处理。

### 非目标 / 边界

- health state 不属于 route；禁止把 `status`、`source`、`capabilities` 或 retry 次数塞进 URL。
- project health boundary 不替代 scene/chapter/book/asset 的 feature-level error handling；各 feature 仍要对自己的查询失败单独降级。
- `runtime-info` 是项目级边界，不是完整 auth flow，也不负责登录页跳转、token 刷新或 session 恢复。
- mock 与 api 的区分是 client runtime source distinction，不表示 mock 变成产品合同来源；产品合同仍以 `/api/projects/{projectId}/...` 为准。

## 6. SSE / 运行事件占位

本 PR 不引入 SSE / run event 流，但后续可以在不改现有 REST 路由语义的前提下补充：

- 场景运行进度事件
- proposal / patch 生成事件
- 长任务状态推送

建议把这类能力作为新增事件流端点处理，而不是修改现有查询接口的返回体结构。

## 7. 关于 mock runtime 的位置

需要再次明确：

- mock runtime 是开发、测试、Storybook 的 fallback。
- 它可以帮助前端在没有后端时跑通 UI 和 smoke。
- 它不是产品持久化路径，不代表正式数据边界。
- 产品态必须以 `/api/projects/{projectId}/...` 为唯一合同来源。

## 8. PR21 Book Draft Review read slice

### 8.1 Deep link 示例

本 bundle 约束的读切片以以下深链为代表：

```txt
/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-review-packet&branchId=branch-book-signal-arc-quiet-ending&branchBaseline=current&selectedChapterId=chapter-open-water-signals&reviewFilter=all
```

### 8.2 实际读取的 endpoint graph

Review 读切片会按当前 route 状态读取以下只读端点：

- `GET /api/projects/{projectId}/books/{bookId}/structure`
- `GET /api/projects/{projectId}/chapters/{chapterId}/structure`
- `GET /api/projects/{projectId}/scenes/{sceneId}/prose`
- `GET /api/projects/{projectId}/books/{bookId}/manuscript-checkpoints`
- `GET /api/projects/{projectId}/books/{bookId}/manuscript-checkpoints/{checkpointId}`
- `GET /api/projects/{projectId}/books/{bookId}/export-profiles`
- `GET /api/projects/{projectId}/books/{bookId}/export-profiles/{exportProfileId}`
- `GET /api/projects/{projectId}/books/{bookId}/experiment-branches`
- `GET /api/projects/{projectId}/books/{bookId}/experiment-branches/{branchId}`
- `GET /api/projects/{projectId}/books/{bookId}/review-decisions`
- `GET /api/projects/{projectId}/books/{bookId}/review-fix-actions`

其中 compare / export / branch 相关 endpoint 只在对应 read source 被 review slice 依赖时参与读取；本 bundle 不引入任何 mutation endpoint。

### 8.3 Read-only 保证

- 本 slice 只消费 `GET` 查询。
- 不允许在该 read slice 内偷接 review decision / fix action 的写接口。
- 本 bundle 不覆盖 `PUT / DELETE review-decisions`、`PUT / DELETE review-fix-actions`、导出构建、branch 变更等 mutation 流程。

### 8.4 null / empty / error 规则

- 明细对象返回 `null`：按 not-found 处理。
  - 例：`book structure = null` 表示书籍不存在，后续 chapter / scene / review 读取应停止。
  - 例：`asset knowledge = null` 或 API `404` 表示 asset not found，而不是 generic unavailable。
- 列表返回空数组：按 empty state 处理，不视为错误。
  - 例：`review-decisions = []`、`review-fix-actions = []` 时，review surface 仍应展示，只是 decision / fix action 回到空状态。
- `ApiRequestError 401 / 403`：归类为 auth / session placeholder kind；当前 bundle 不实现真实 auth 流。
- `ApiRequestError 404`：归类为 not-found kind。
- `ApiRequestError >= 500`：归类为 server / unavailable kind。
  - 例：`review-decisions` 500 时，review inbox 仍保持可读，decision 辅助状态显示 unavailable，不得把整个 review 页面打成崩溃或伪健康。
- malformed JSON 已在 transport 层覆盖；上层 workspace 只需要把它当错误处理，不得崩溃。

### 8.5 Fixture / response note

- `book-signal-arc` read slice fixture 用于验证 review queue、checkpoint/export/branch read source 和 partial-error 降级。
- `asset-ren-voss` / `asset-missing` fixture 用于验证 asset knowledge happy path 与 not-found path。
- fixture 响应保持固定输入，供测试与 Storybook 复用；Storybook 不依赖真实 API。

### 8.6 非覆盖范围

本 bundle 只定义 PR21 read slice 的只读合同与降级规则，不覆盖：

- review decision / fix action mutation
- source-fix mutation 流
- export artifact build / download 合同
- branch baseline 切换写入
- 真实 backend / auth / SSE / Temporal 接线

## 9. PR22 API-backed mutation write slice

### 9.1 覆盖的 endpoint

本 bundle 覆盖以下 API-backed mutation write path：

- `PUT /api/projects/{projectId}/books/{bookId}/review-decisions/{issueId}`
- `DELETE /api/projects/{projectId}/books/{bookId}/review-decisions/{issueId}`
- `PUT /api/projects/{projectId}/books/{bookId}/review-fix-actions/{issueId}`
- `DELETE /api/projects/{projectId}/books/{bookId}/review-fix-actions/{issueId}`
- `POST /api/projects/{projectId}/books/{bookId}/export-artifacts`
- `POST /api/projects/{projectId}/chapters/{chapterId}/scenes/{sceneId}/reorder`
- `PATCH /api/projects/{projectId}/chapters/{chapterId}/scenes/{sceneId}/structure`

### 9.2 请求体示例

Review decision set:

```json
{
  "bookId": "book-signal-arc",
  "issueId": "compare-delta-chapter-2-scene-3",
  "issueSignature": "compare-delta-chapter-2-scene-3::compare_delta",
  "status": "reviewed",
  "note": "Ship it"
}
```

Review fix action set:

```json
{
  "bookId": "book-signal-arc",
  "issueId": "scene-proposal-seed-scene-5",
  "issueSignature": "scene-proposal-seed-scene-5::scene_proposal",
  "sourceHandoffId": "scene-proposal-handoff",
  "sourceHandoffLabel": "Open scene proposal",
  "targetScope": "scene",
  "status": "started",
  "note": "Follow proposal branch"
}
```

Chapter reorder:

```json
{
  "targetIndex": 1
}
```

Chapter structure patch:

```json
{
  "locale": "en",
  "patch": {
    "summary": "Keep the witness line open through the gate."
  }
}
```

Export artifact build:

```json
{
  "bookId": "book-signal-arc",
  "exportProfileId": "profile-editorial-md",
  "checkpointId": "checkpoint-api-write",
  "format": "markdown",
  "filename": "signal-arc-profile-editorial-md.md",
  "mimeType": "text/markdown",
  "title": "Signal Arc",
  "summary": "Export artifact for Editorial Markdown.",
  "content": "# Signal Arc\n...",
  "sourceSignature": "...stable export signature...",
  "chapterCount": 1,
  "sceneCount": 1,
  "wordCount": 88,
  "readinessSnapshot": {
    "status": "ready",
    "blockerCount": 0,
    "warningCount": 0,
    "infoCount": 0
  },
  "reviewGateSnapshot": {
    "openBlockerCount": 0,
    "checkedFixCount": 0,
    "blockedFixCount": 0,
    "staleFixCount": 0
  }
}
```

导出构建请求体必须由 `buildBookExportArtifactInput(...)` 生成；gate blocked 时不得偷发 `POST`。

### 9.3 success / optimistic / rollback / invalidation 规则

- Review decision / fix action `PUT`
  - 使用 issue 级 optimistic record 覆盖对应 query cache 项。
  - 成功时以服务端返回的最新单条 record 替换 optimistic record。
  - settle 后只失效原 query key：
    - `reviewQueryKeys.decisions(bookId)`
    - `reviewQueryKeys.fixActions(bookId)`
- Review decision / fix action `DELETE`
  - optimistic 地移除对应 issue 的 record。
  - 失败时只回滚该 issue，自身之外的 read list 不得被抹掉。
  - settle 后只失效原 query key，不改 route shape。
- Chapter reorder / structure patch
  - optimistic 更新整章 `chapterQueryKeys.workspace(chapterId)`。
  - 成功时以服务端返回的整章 workspace 快照提交；binder / outliner / inspector 继续围绕同一个 route `sceneId` 对齐。
  - settle 后 query key identity 仍然是 `chapterQueryKeys.workspace(chapterId)`。
  - 若 mutation response 为 `null`，不得继续记录 success activity；应让 workspace 自己走 not-found / unavailable 语义，而不是伪装写成功。
- Export artifact build
  - gate blocked 时不发请求。
  - 成功时只更新并失效 `bookQueryKeys.exportArtifacts(bookId, exportProfileId, checkpointId)`。
  - 500 失败时不得污染 artifact cache，错误保持 action-scoped。

### 9.4 错误语义

- `409`
  - 视为冲突 / stale write。
  - Chapter reorder、review fix action set 等写操作必须回滚 optimistic state。
- `422`
  - 视为输入无效。
  - Review decision set、chapter structure patch 等写操作必须回滚 optimistic state。
- `401 / 403`
  - 归类为 auth / permission placeholder。
  - 本 bundle 不实现真实登录、续期、权限流，只要求按统一错误体返回并保持 action-scoped。
- `404`
  - 归类为目标资源不存在。
  - 对 chapter workspace，允许现有 not-found 语义接管；不得伪造成功。
- `500`
  - 归类为 server / unavailable。
  - Review mutation failure 不得把 review read issue list 清空，也不得把 review surface 误判成 read failure。
  - Export artifact build failure 不得写入脏 artifact record。

### 9.5 生产路径 audit 结论

- 本次 write slice 审计没有新增 PR22 write path 的直连 feature client bypass。
- `rg "from '@/features/.*/api/.*client'" ...` 命中的生产代码主要是既有 read-side source hook import；本 bundle 不扩大到 scene / asset / traceability 读链修整。
- `rg "create.*Client\\(" ...` 命中的生产路径限于 api module 自身与测试；PR22 write path 未发现新的 runtime 绕过创建。

### 9.6 非覆盖范围

本节只定义 PR22 的前端 API-backed mutation write slice 合同，不覆盖：

- scene run / scene continue / proposal accept / prose revision
- SSE / 运行事件流
- Temporal / backend orchestration
- 真实 backend server、auth server、session server

## 10. PR23 Run / Event Stream API Surface

### 10.1 Endpoint graph

```text
POST /api/projects/{projectId}/scenes/{sceneId}/runs
  -> RunRecord

GET /api/projects/{projectId}/runs/{runId}
  -> RunRecord | null

GET /api/projects/{projectId}/runs/{runId}/events?cursor={eventId}
  -> RunEventsPageRecord

POST /api/projects/{projectId}/runs/{runId}/review-decisions
  -> RunRecord

GET /api/projects/{projectId}/runs/{runId}/events/stream
  -> PR23 只保留合同占位，不在 renderer/runtime 内实现 SSE
```

当前 renderer 只通过 `ProjectRuntime.runClient` 消费以上边界；renderer 不 import Temporal SDK，也不直接读取 workflow engine 内部 history。

### 10.2 Request examples

Start scene run:

```json
{
  "mode": "rewrite",
  "note": "Tighten the ending beat."
}
```

Get run events with cursor:

```http
GET /api/projects/project-run-contract/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-004
```

Submit run review decision:

```json
{
  "reviewId": "review-scene-midnight-platform-002",
  "decision": "accept-with-edit",
  "note": "Keep the bridge line but trim the ending.",
  "patchId": "canon-patch-scene-midnight-platform-002"
}
```

### 10.3 Response examples

Run detail:

```json
{
  "id": "run-scene-midnight-platform-002",
  "scope": "scene",
  "scopeId": "scene-midnight-platform",
  "status": "waiting_review",
  "title": "scene-midnight-platform run",
  "summary": "Waiting for review: Tighten the ending beat.",
  "startedAtLabel": "2026-04-21 10:01",
  "pendingReviewId": "review-scene-midnight-platform-002",
  "latestEventId": "run-event-scene-midnight-platform-002-005",
  "eventCount": 5
}
```

Run events page:

```json
{
  "runId": "run-scene-midnight-platform-002",
  "events": [
    {
      "id": "run-event-scene-midnight-platform-002-003",
      "runId": "run-scene-midnight-platform-002",
      "order": 3,
      "kind": "context_packet_built",
      "label": "Context packet built",
      "summary": "Runtime assembled the scene context packet.",
      "createdAtLabel": "2026-04-21 10:03",
      "refs": [
        {
          "kind": "context-packet",
          "id": "ctx-scene-midnight-platform-run-002"
        }
      ]
    },
    {
      "id": "run-event-scene-midnight-platform-002-004",
      "runId": "run-scene-midnight-platform-002",
      "order": 4,
      "kind": "proposal_created",
      "label": "Proposal set created",
      "summary": "A proposal set is ready for review.",
      "createdAtLabel": "2026-04-21 10:04",
      "refs": [
        {
          "kind": "proposal-set",
          "id": "proposal-set-scene-midnight-platform-run-002"
        }
      ]
    }
  ],
  "nextCursor": "run-event-scene-midnight-platform-002-004"
}
```

Review decision result:

```json
{
  "id": "run-scene-midnight-platform-002",
  "scope": "scene",
  "scopeId": "scene-midnight-platform",
  "status": "completed",
  "title": "scene-midnight-platform run",
  "summary": "Proposal set accepted with editor adjustments applied to canon and prose.",
  "startedAtLabel": "2026-04-21 10:01",
  "completedAtLabel": "2026-04-21 10:09",
  "latestEventId": "run-event-scene-midnight-platform-002-009",
  "eventCount": 9
}
```

### 10.4 Cursor semantics

- `cursor` 是最后一个已消费 `RunEventRecord.id`，不是 offset，也不是 page number。
- 不带 `cursor` 表示读取头页。
- 带 `cursor` 时，服务端返回该事件之后的下一页。
- `nextCursor` 表示当前页最后一条 event 的 id；没有更多数据时返回 `undefined` / 省略字段。
- `cursor` 不存在、属于别的 run、或已失效时，应返回 `409`，并遵守统一错误体。
- PR23 renderer 只消费分页 / polling 合同，不打开 SSE，也不把 cursor 写进 route。

### 10.5 Run event payload rules

必须遵守以下规则：

1. `RunEventRecord` never embeds large prompt/context/prose payloads.
2. Context/prompt/prose/debug payloads are referenced by artifact or context-packet refs.
3. `proposal_created` references `proposal-set`, not a single immutable proposal.
4. Product run events are not Temporal history and not raw LLM token stream.

补充说明：

- `RunEventRecord.summary` 只放产品级摘要，不放长 prompt、长上下文、长 prose、raw token stream、Temporal event history payload。
- 大 payload 一律通过 `refs` 指向外部对象；`RunEventRecord` 只携带轻量引用和可读摘要。
- 允许的 refs 语义位当前包括：`context-packet`、`agent-invocation`、`proposal-set`、`review`、`canon-patch`、`prose-draft`、`artifact`。
- 即使后续接真实 orchestration backend，也不能把 workflow engine 内部事件直接当产品事件流暴露给 renderer。

### 10.6 `context_packet_built` and `context-packet` ref semantics

- `context_packet_built` 表示一次产品级上下文装配完成，可以用于后续 Context Packet Inspector、Prompt Trace、Asset Activation Trace。
- 该 event 自身只表达“上下文包已建立”，不内联完整 prompt 或拼装后的大文本。
- `refs.kind = "context-packet"` 指向外部 context packet 资源，例如：

```json
{
  "kind": "context-packet",
  "id": "ctx-scene-midnight-platform-run-002",
  "label": "Scene context packet"
}
```

- PR23 不定义 context packet 详情 endpoint，只固定事件语义与 ref 位置。

### 10.7 `proposal_created` references `proposal-set`

- `proposal_created` 必须引用 `proposal-set`，不能把模型输出固化成单一 immutable proposal id。
- 这是为了给未来 proposal variants / swipe / regenerate 保留承载位。
- PR23 只固定 `proposal-set` ref 语义，不定义 variants UI，也不引入新的 route state。

### 10.8 Review decision rules

- review decision write path 为 `POST /runs/{runId}/review-decisions`。
- 请求体必须包含 `reviewId` 与 `decision`；`note`、`patchId` 视具体 decision 需要可选携带。
- 当前 decision 值为：`accept`、`accept-with-edit`、`request-rewrite`、`reject`。
- `reviewId` 与 run 当前 `pendingReviewId` 不匹配时返回 `409`。
- `422` 保留为 API / override 可用的 validation 错误语义；PR23 默认 mock contract 只内建 conflict 校验，不额外强制 review decision 字段规则。
- 成功后返回最新 `RunRecord`，并由事件页补充 `review_decision_submitted`、`canon_patch_applied`、`prose_generated`、`run_completed` 等产品事件。
- run review write 只更新 run/event query data；它不写 route，不直接修改 scene/chapter/book UI 状态。

### 10.9 SSE and engine boundary

- `GET /runs/{runId}/events/stream` 在 PR23 只是合同占位，供未来 SSE / stream transport 接入。
- 本 PR 的 fake runtime、API runtime、hooks、tests 都只走 REST request + polling/page contract。
- renderer 不 import Temporal SDK，不感知 worker engine 是 Temporal、in-process worker、fixture backend，还是未来其他实现。
- 产品 run events 不是 Temporal history；它们是 renderer 可以稳定消费的产品级 event records。

### 10.10 Future affordances

以下能力是未来扩展位，不属于 PR23 当前实现范围：

- context packet inspection
- proposal variants
- run debug dock
- asset activation trace

这些未来能力都必须建立在当前 PR23 合同之上：

- 大 payload 继续通过 artifact / context-packet refs 暴露，不能回退成 event 内联。
- `proposal_created` 继续以 `proposal-set` 为中心，而不是单 proposal。
- debug / trace UI 应消费产品级 run events，而不是直接消费 Temporal history。
