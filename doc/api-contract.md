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
| Scene | `GET` | `/api/projects/{projectId}/runtime-info` | `SceneRuntimeInfo` |
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
