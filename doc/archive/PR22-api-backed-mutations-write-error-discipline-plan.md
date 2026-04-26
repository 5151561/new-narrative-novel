# PR22 执行文档：API-backed Mutations & Unified Write Error Discipline

基于当前分支：`codex/pr21-api-read-slice-response-state`

## 结论

当前代码已经越过 PR20 的 runtime boundary，并且已经把 PR21 的复杂 read slice 做到了可测试状态：

- `ProjectRuntime` 已经是前端统一 client/provider boundary，包含 `bookClient / chapterClient / assetClient / reviewClient / sceneClient / traceabilitySceneClient`。
- `createApiProjectRuntime(...)` 已经能通过 `ApiTransport` 实现现有 client interface。
- `api-route-contract.ts` 已经覆盖 Book / Chapter / Asset / Review / Scene 的 read 与部分 write 路径。
- `api-read-slice-contract.test.tsx` 已经用 fake API runtime 固定了 `Book / Draft / Review` 的 GET-only endpoint graph。
- `api-response-state.ts` 已经把 `success / empty / not-found / auth / unavailable / pending` 这类读响应状态抽了出来。
- `fake-api-runtime.test-utils.ts` 已经能记录 request，并能把 API request 转发到 mock runtime。

所以 PR22 不应该继续新增 UI surface，也不应该直接接真实后端、Temporal、SSE 或 auth。

PR22 的唯一目标是：

> 把已有的关键写路径切到 API runtime contract 下验证，并统一 `optimistic update / rollback / invalidation / validation error / conflict error / auth/server error` 的写错误纪律。

一句话说：

**PR21 证明复杂 read path 能走 API runtime；PR22 要证明关键 mutation path 也能走 API runtime，而且失败时不会破坏缓存、route 和 UI 状态。**

---

## 一、当前代码基线判断

### 1. PR21 read slice 已经成立

当前 `packages/renderer/src/app/project-runtime/` 下已经有：

- `api-read-slice-contract.test.tsx`
- `api-read-slice-fixtures.ts`
- `api-response-state.ts`
- `api-response-state.test.ts`
- `fake-api-runtime.test-utils.ts`

这说明下一轮不需要再证明“API runtime 能读数据”，而应进入写路径。

### 2. API route contract 已经包含本轮要验证的 mutation endpoints

当前合同里已经存在这些写路径：

```text
POST   /api/projects/:projectId/chapters/:chapterId/scenes/:sceneId/reorder
PATCH  /api/projects/:projectId/chapters/:chapterId/scenes/:sceneId/structure
PUT    /api/projects/:projectId/books/:bookId/review-decisions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-decisions/:issueId
PUT    /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
POST   /api/projects/:projectId/books/:bookId/export-artifacts
```

PR22 不需要重新设计这些 endpoints，而应把它们变成测试固定的 API write contract。

### 3. 多数 mutation hook 已经具备 ProjectRuntime 接入形态

当前这些 hook 已经能通过 `useOptionalProjectRuntime()` + `resolveProjectRuntimeDependency(...)` 取得 runtime client：

- `useReorderChapterSceneMutation(...)`
- `useUpdateChapterSceneStructureMutation(...)`
- `useSetReviewIssueDecisionMutation(...)`
- `useClearReviewIssueDecisionMutation(...)`
- `useSetReviewIssueFixActionMutation(...)`
- `useClearReviewIssueFixActionMutation(...)`
- `useBuildBookExportArtifactMutation(...)`

也就是说，PR22 的重点不是从零写 mutation hook，而是：

- 补齐 fake API mutation dispatcher。
- 固定 request graph / body shape。
- 固定 optimistic success / rollback / invalidation。
- 固定 409 / 422 / 401 / 403 / 404 / 500 的写错误表达。

### 4. fake API runtime 还不是完整 write contract harness

当前 fake API runtime 已经能做 read request recording，并能用 override 模拟响应 / error。

但 PR22 需要把它升级到能稳定覆盖 mutation：

- chapter reorder
- chapter structure patch
- review decision set / clear
- review fix action set / clear
- export artifact build

不要把 fake API runtime 变成业务层；它只负责：

```text
request recording + path dispatch + mock runtime delegation + deterministic error override
```

业务 patch / optimistic mapper 仍应留在 feature hook / lib 中。

---

## 二、PR22 的范围

## 必做范围

### A. Review write slice

覆盖：

```text
PUT    review-decisions/:issueId
DELETE review-decisions/:issueId
PUT    review-fix-actions/:issueId
DELETE review-fix-actions/:issueId
```

这是 PR22 的第一优先级，因为 Review 是 PR21 read slice 的目标工作面。PR22 应把 `Book / Draft / Review` 从 read-only API slice 推进到 read + write API slice。

### B. Chapter structure mutation write slice

覆盖：

```text
POST  chapters/:chapterId/scenes/:sceneId/reorder
PATCH chapters/:chapterId/scenes/:sceneId/structure
```

这是第二优先级，因为它能验证更复杂的 optimistic cache：返回体是 `ChapterStructureWorkspaceRecord | null`，不是单条 record。

### C. Book export artifact build write slice

覆盖：

```text
POST books/:bookId/export-artifacts
```

这是第三优先级，因为它验证 gated mutation：前端必须先判断 export readiness / review blockers，然后再调用 API。

---

## 三、本轮明确不做

PR22 不做：

- 不做真实 API server。
- 不做 auth/session 完整流程。
- 不接 SSE。
- 不接 Temporal。
- 不接 backend worker / IPC / preload。
- 不新增新的 Book / Review / Chapter UI surface。
- 不改 route shape。
- 不改 query key identity。
- 不把 Storybook 改成依赖真实 API。
- 不做 scene run / event stream。
- 不做 scene proposal / patch commit / prose revision 的完整 API write verification；这部分留到 PR23/PR25。
- 不做 branch merge / publish / export file generation。

本轮只做：

**已有 mutation hook 的 API-backed contract verification + unified write error discipline。**

---

## 四、必须遵守的硬约束

### 4.1 Route 不参与 mutation 状态

不要新增：

- `mutationId`
- `savingIssueId`
- `editingMutationMode`
- `exportBuildId`
- `chapterMutationIntent`

mutation 的 pending / error / success 应由 React Query mutation state、feature hook state 或局部 UI state 承担。

Route 继续只表示：

- 当前 scope / lens / view
- selected object
- review filter / selected issue
- checkpoint / branch / export profile 等 view-state

### 4.2 Query key identity 不变

PR22 不允许为了 API runtime 或 error state 改 query key。

继续保持：

```text
chapterQueryKeys.workspace(chapterId)
reviewQueryKeys.decisions(bookId)
reviewQueryKeys.fixActions(bookId)
bookQueryKeys.exportArtifacts(bookId, exportProfileId, checkpointId)
```

允许：

- mutationFn 改为 runtime client。
- fake API runtime 注入。
- hook tests 使用 API runtime wrapper。
- onError rollback / onSettled invalidate。

### 4.3 Optimistic update 仍在 feature hook 内完成

不要把 optimistic update 写进：

- fake API runtime
- API transport
- route hook
- global provider

正确位置仍然是各 feature mutation hook：

```text
chapter hooks -> chapter workspace optimistic state
review hooks  -> review decision / fix action optimistic state
book hook     -> export artifact cache update
```

### 4.4 API write errors 必须被统一分类

PR22 应新增或扩展一个 write error classifier。建议新增：

```text
packages/renderer/src/app/project-runtime/api-write-error-state.ts
packages/renderer/src/app/project-runtime/api-write-error-state.test.ts
```

建议分类：

```ts
export type ApiWriteErrorStateKind =
  | 'validation'
  | 'conflict'
  | 'auth'
  | 'not-found'
  | 'unavailable'
  | 'unknown'
```

映射规则：

```text
400 / 422 -> validation
409       -> conflict
401 / 403 -> auth
404       -> not-found
>=500     -> unavailable
other     -> unknown
```

不要把所有 mutation failure 都显示成 `Something went wrong`。

### 4.5 fake API runtime 是 contract harness，不是业务替代层

`fake-api-runtime.test-utils.ts` 可以：

- 记录 method / path / query / body。
- 路由到 mock runtime client。
- 支持 per-request overrides。
- 抛出 `ApiRequestError`。

它不应该：

- 自己重写 chapter reorder 业务逻辑。
- 自己拼 review issue view-model。
- 自己构造 export readiness gate。
- 持有 UI 状态。

---

## 五、建议文件改动

### 5.1 新增

```text
packages/renderer/src/app/project-runtime/api-write-error-state.ts
packages/renderer/src/app/project-runtime/api-write-error-state.test.ts
packages/renderer/src/app/project-runtime/api-write-slice-contract.test.tsx
packages/renderer/src/app/project-runtime/api-write-slice-fixtures.ts
packages/renderer/src/features/chapter/containers/ChapterStructureApiWriteSlice.test.tsx
packages/renderer/src/features/review/hooks/review-api-mutation-contract.test.tsx
packages/renderer/src/features/book/hooks/book-export-artifact-api-mutation-contract.test.tsx
```

如果不想新增这么多 test 文件，也可以合并成三个较大的文件：

```text
api-write-slice-contract.test.tsx
chapter-api-write-slice.test.tsx
book-review-export-api-write-slice.test.tsx
```

但不要把所有测试都塞进现有 hook test，避免 PR22 的 contract 意义不清楚。

### 5.2 修改

```text
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.test.ts
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
packages/renderer/src/app/project-runtime/api-route-contract.test.ts
packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.test.tsx
packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.test.tsx
packages/renderer/src/features/review/hooks/useSetReviewIssueDecisionMutation.test.tsx
packages/renderer/src/features/review/hooks/useClearReviewIssueDecisionMutation.test.tsx
packages/renderer/src/features/review/hooks/useSetReviewIssueFixActionMutation.test.tsx
packages/renderer/src/features/review/hooks/useClearReviewIssueFixActionMutation.test.tsx
packages/renderer/src/features/book/hooks/useBuildBookExportArtifactMutation.test.tsx
doc/api-contract.md
```

### 5.3 尽量不动

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/book/components/**
packages/renderer/src/features/chapter/components/**
packages/renderer/src/features/scene/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/traceability/**
```

除非测试发现某个组件完全没有 mutation error slot，否则不要改视觉结构。

---

## 六、PR22 endpoint graph

### 6.1 Review mutation endpoints

```text
PUT    /api/projects/:projectId/books/:bookId/review-decisions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-decisions/:issueId
PUT    /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
```

Body shape 应来自现有 input types：

- `SetReviewIssueDecisionInput`
- `ClearReviewIssueDecisionInput`
- `SetReviewIssueFixActionInput`
- `ClearReviewIssueFixActionInput`

验收点：

- PUT 返回最新单条 record。
- DELETE 返回 204 / empty response。
- optimistic record 会先进入 cache。
- server record 会替换 optimistic record。
- error 会 rollback。
- settled 后 invalidate 当前 book 的相应 query key。

### 6.2 Chapter mutation endpoints

```text
POST  /api/projects/:projectId/chapters/:chapterId/scenes/:sceneId/reorder
PATCH /api/projects/:projectId/chapters/:chapterId/scenes/:sceneId/structure
```

验收点：

- reorder body 只包含 `{ targetIndex }`。
- structure patch body 包含 `{ locale, patch }`。
- 返回最新 `ChapterStructureWorkspaceRecord | null`。
- optimistic update 仍先 patch raw record cache。
- server 返回 null 时应被当成 not-found / unavailable 状态，而不是继续假装成功。
- route.sceneId 不变。

### 6.3 Book export artifact build endpoint

```text
POST /api/projects/:projectId/books/:bookId/export-artifacts
```

验收点：

- build 前仍调用 export readiness gate。
- gate blocked 时不发 POST。
- gate allowed 时 request body 使用 `buildBookExportArtifactInput(...)`。
- 成功后 artifact 插入 `bookQueryKeys.exportArtifacts(bookId, exportProfileId, checkpointId)`。
- 失败不污染 artifact cache。

---

## 七、Response / error discipline

### 7.1 统一错误体

继续沿用 PR20 / PR21 的错误体：

```json
{
  "status": 422,
  "message": "Review decision note is too long",
  "code": "REVIEW_DECISION_NOTE_TOO_LONG",
  "detail": {
    "field": "note",
    "maxLength": 240
  }
}
```

### 7.2 写错误分类建议

```text
401 / 403 auth:
  - 显示 session / permission placeholder。
  - rollback optimistic cache。
  - 不自动重试 mutation。

404 not-found:
  - rollback optimistic cache。
  - 若主对象不存在，显示 not-found supporting state。
  - 若单条 review issue 不存在，显示 item-level unavailable。

409 conflict:
  - rollback optimistic cache。
  - 显示 conflict message。
  - 提醒 refresh / re-open source。
  - 不自动覆盖 server state。

422 validation:
  - rollback optimistic cache。
  - 显示 validation message。
  - 保留用户输入草稿，如果组件已有本地 draft。

>=500 unavailable:
  - rollback optimistic cache。
  - 显示 retry-friendly error。
  - 不把 whole workspace 变成 empty state。
```

### 7.3 不要让 mutation error 改变 read semantics

PR21 已固定：

- `null` detail -> not-found
- empty array -> empty state
- non-2xx -> classified error

PR22 应补充：

- mutation failure 不等于 read query failure。
- mutation failure 不应抹掉已有 issue list / chapter data / artifact list。
- mutation failure 后只在对应 action area 显示 write error。

---

## 八、实施顺序（给 AI 的执行顺序）

### Step 1：先读代码，不要直接开改

先读这些文件：

```text
AGENTS.md
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/api-route-contract.ts
packages/renderer/src/app/project-runtime/api-transport.ts
packages/renderer/src/app/project-runtime/api-response-state.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.ts
packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.ts
packages/renderer/src/features/review/hooks/useSetReviewIssueDecisionMutation.ts
packages/renderer/src/features/review/hooks/useClearReviewIssueDecisionMutation.ts
packages/renderer/src/features/review/hooks/useSetReviewIssueFixActionMutation.ts
packages/renderer/src/features/review/hooks/useClearReviewIssueFixActionMutation.ts
packages/renderer/src/features/book/hooks/useBuildBookExportArtifactMutation.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx
```

输出或测试中固定三条写路径 graph：

```text
Review write graph
Chapter structure write graph
Book export artifact write graph
```

### Step 2：新增 API write error classifier

新增：

```text
api-write-error-state.ts
api-write-error-state.test.ts
```

测试至少覆盖：

- 401 / 403 -> auth
- 404 -> not-found
- 409 -> conflict
- 422 -> validation
- 500 -> unavailable
- generic Error -> unknown / unavailable

### Step 3：补齐 fake API runtime mutation dispatcher

修改：

```text
fake-api-runtime.test-utils.ts
```

必须支持：

```text
POST   chapter scene reorder
PATCH  chapter scene structure
PUT    review issue decision
DELETE review issue decision
PUT    review issue fix action
DELETE review issue fix action
POST   book export artifact
```

并确保：

- 所有 mutation 都被 `requests` 记录。
- body 也被记录。
- overrides 能按 method / path / query / body 匹配。
- 409 / 422 / 500 error override 能稳定抛 `ApiRequestError`。

### Step 4：写 API write slice contract test

新增：

```text
api-write-slice-contract.test.tsx
```

建议覆盖三段：

#### A. Book Draft Review decision / fix action

```text
打开 Book / Draft / Review deep link
-> 注入 fake API runtime
-> 点击某个 issue 的 Reviewed / Needs work / Fix action
-> 断言 request method/path/body
-> 断言 optimistic state 立即显示
-> 断言 server record settled 后仍显示
-> 断言 query key 被 invalidate
```

#### B. Chapter Structure reorder / patch

```text
打开 Chapter / Structure / Outliner deep link
-> 注入 fake API runtime
-> 在 Binder 做 Move later
-> 断言 POST reorder path/body
-> 断言 selected scene 不丢失
-> 在 Outliner patch selected scene structure
-> 断言 PATCH structure path/body
-> 断言 inspector / outliner 使用更新文本
```

#### C. Book Draft Export build

```text
打开 Book / Draft / Export deep link
-> 注入 fake API runtime
-> 点击 Build artifact
-> 若 gate blocked，不发 POST
-> 若 gate allowed，断言 POST export-artifacts path/body
-> 成功后 artifact list 更新
```

### Step 5：补 rollback / conflict / validation tests

至少覆盖：

#### Review

- `PUT review-decisions` 422 -> optimistic decision rollback，issue list 不消失。
- `PUT review-fix-actions` 409 -> optimistic fix action rollback，显示 conflict state。
- `DELETE review-decisions` 500 -> previous decision restored。

#### Chapter

- `POST reorder` 409 -> chapter order rollback。
- `PATCH structure` 422 -> text rollback，本地 edit draft 若存在应保留或给出明确错误。

#### Export

- `POST export-artifacts` 500 -> artifact list 不变，显示 retry-friendly error。

### Step 6：审计 production path 不绕过 runtime

运行：

```bash
rg "from '@/features/.*/api/.*client'" packages/renderer/src/features/book packages/renderer/src/features/chapter packages/renderer/src/features/review
rg "create.*Client\(" packages/renderer/src/features/book packages/renderer/src/features/chapter packages/renderer/src/features/review
```

处理原则：

- hook options 的 default mock client 可保留，但 production container 必须能走 runtime client。
- 如果 production path 直接 import static client 并绕过 runtime，需要改成 `useOptionalProjectRuntime()` + `resolveProjectRuntimeDependency(...)`。
- 不要扩大到 scene / asset / traceability，除非本 PR 写路径直接触碰。

### Step 7：更新 `doc/api-contract.md`

新增一节：

```md
## 9. PR22 API-backed mutation write slice
```

内容包括：

- 本轮覆盖的 mutation endpoints。
- request body examples。
- success response rules。
- optimistic update / rollback / invalidation rules。
- `409 / 422 / 401 / 403 / 404 / 500` 写错误规则。
- 明确不覆盖 scene run / SSE / Temporal / backend server。

### Step 8：运行验证

至少运行：

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
```

如果修改了 stories 或 runtime provider story setup，再运行：

```bash
pnpm --filter @narrative-novel/renderer storybook
```

---

## 九、测试清单

### 9.1 `api-write-error-state.test.ts`

覆盖：

1. `ApiRequestError(401)` -> `auth`
2. `ApiRequestError(403)` -> `auth`
3. `ApiRequestError(404)` -> `not-found`
4. `ApiRequestError(409)` -> `conflict`
5. `ApiRequestError(422)` -> `validation`
6. `ApiRequestError(500)` -> `unavailable`
7. generic `Error` -> `unknown` 或 `unavailable`
8. `detail` / `code` 不丢失

### 9.2 `fake-api-runtime.test-utils.test.ts`

覆盖：

1. POST chapter reorder 会路由到 mock runtime。
2. PATCH chapter structure 会路由到 mock runtime。
3. PUT / DELETE review decision 会路由到 mock runtime。
4. PUT / DELETE review fix action 会路由到 mock runtime。
5. POST export artifact 会路由到 mock runtime。
6. override 能按 method / path / body 匹配 mutation。
7. mutation request 被完整记录。

### 9.3 Review mutation tests

覆盖：

1. set decision happy path。
2. clear decision happy path。
3. set fix action happy path。
4. clear fix action happy path。
5. 422 rollback。
6. 409 rollback。
7. 500 rollback。
8. request graph 使用 API route contract。

### 9.4 Chapter mutation tests

覆盖：

1. reorder happy path。
2. structure patch happy path。
3. reorder 409 rollback。
4. patch 422 rollback。
5. mutation 不改变 route.sceneId。
6. query key 仍为 `chapterQueryKeys.workspace(chapterId)`。

### 9.5 Export artifact mutation tests

覆盖：

1. gate blocked 时不发 POST。
2. gate allowed 时发 POST。
3. request body 使用 mapper 生成。
4. success 后 artifact list 更新。
5. 500 时 artifact list 不变。
6. query key 仍为 `bookQueryKeys.exportArtifacts(...)`。

### 9.6 Integration / smoke

至少新增两条：

#### A. Book Draft Review write roundtrip

```text
Book / Draft / Review deep link
-> set review decision
-> set fix action
-> clear decision
-> clear fix action
-> 所有 request 都走 API runtime
-> browser back / forward 不改变 route source of truth
```

#### B. Chapter Structure write roundtrip

```text
Chapter / Structure / Outliner deep link
-> reorder scene
-> patch selected scene structure
-> binder / outliner / inspector 同步
-> route.sceneId 不变
-> API request graph 正确
```

---

## 十、验收标准

PR22 满足以下条件才算完成：

1. Review decision / fix action mutations 能通过 `createApiProjectRuntime(...)` + fake transport 执行。
2. Chapter reorder / structure patch mutations 能通过 API runtime 执行。
3. Book export artifact build 能通过 API runtime 执行。
4. fake API runtime 支持本轮所有 mutation endpoint 的 path dispatch 和 request recording。
5. `409 / 422 / 401 / 403 / 404 / 500` 有统一 write error classification。
6. optimistic update 成功时能被 server response settle。
7. mutation error 会 rollback，不破坏 read cache。
8. mutation settled 后只 invalidate 对应 query key，不改 route，不改 query identity。
9. `doc/api-contract.md` 增加 PR22 write slice 说明。
10. Storybook / tests 不依赖真实 API server。
11. 不接 Temporal / SSE / auth / backend server。
12. `pnpm --filter @narrative-novel/renderer typecheck` 通过。
13. `pnpm --filter @narrative-novel/renderer test` 通过。

---

## 十一、PR22 结束时不要留下的债

以下情况都算 PR 做偏了：

- 为 mutation 新增了第二套 runtime provider。
- 为 mutation 改了 route shape。
- 为 API base URL 或 write status 改了 query key。
- fake API runtime 复制了一整套业务 mapper。
- mutation failure 把整个 read workspace 打成 empty state。
- optimistic rollback 失败，留下脏 cache。
- Storybook 默认需要真实 API server。
- 为 PR22 顺手接了 scene run / SSE / Temporal。
- 为 PR22 顺手做真实 backend server。
- 大范围重构 UI 组件以迁就 write tests。

PR22 正确结束状态：

> 前端最关键的现有写路径已经能由 API runtime 驱动；后续真实后端只需要兑现这些 endpoint、body、success response 和 error response，就能接入同一批 UI / hook / tests。

---

# PR23 之后的建议路线

## PR23：Run / Event Stream API Surface Contract

目标：为后端 orchestration 暴露第一版 run / event stream API contract，但 renderer 不接 Temporal SDK。

建议新增：

```ts
interface RunClient {
  startSceneRun(input: { sceneId: string; mode?: 'continue' | 'rewrite' }): Promise<RunRecord>
  getRun(input: { runId: string }): Promise<RunRecord | null>
  getRunEvents(input: { runId: string; cursor?: string }): Promise<RunEventPage>
  submitRunReviewDecision(input: SubmitRunReviewDecisionInput): Promise<RunRecord>
}
```

建议 endpoints：

```text
POST /api/projects/:projectId/scenes/:sceneId/runs
GET  /api/projects/:projectId/runs/:runId
GET  /api/projects/:projectId/runs/:runId/events
POST /api/projects/:projectId/runs/:runId/review-decisions
```

SSE 可以先只写 contract：

```text
GET /api/projects/:projectId/runs/:runId/events/stream
```

不做：

- 不展示 Temporal history。
- 不接 Temporal SDK。
- 不做 full run debugger。
- 不把 run event stream 写进 route。

## PR24：Project Session / API Health Boundary

目标：把 API runtime 从“能发请求”升级到“project session / API health / auth failure 可见”。

范围：

- `GET /api/health` 或 `GET /api/projects/:projectId/runtime-info` 扩展。
- API unavailable state。
- 401 / 403 session placeholder。
- App top bar 显示 runtime source。
- Project selector placeholder。

不做完整账号系统。

## BE-PR1：API Server Skeleton

建议在 PR22 后启动，或与 PR23 并行。

目标：新增最小 API server，只兑现 PR21 read contract + PR22 write contract。

第一版不接：

- DB
- Temporal
- LLM
- auth
- production deployment

只做：

- fixture-backed repositories
- typed route handlers
- contract tests against `doc/api-contract.md`
- renderer read/write slice 可被真实 server fixture 复现

## PR25：Backend Orchestration Integration UI

目标：在 API-only 边界下，把第一条 scene run / review gate / canon patch 后端纵切接入 UI。

renderer 只认识：

```text
REST API
SSE / polling event endpoint
RunRecord
RunEvent
ReviewDecision
```

renderer 不直接 import Temporal SDK，不读取 Temporal history。

---

## 给 AI agent 的最终一句话指令

在当前 `codex/pr21-api-read-slice-response-state` 已完成 API read slice 的前提下，不要继续新增 UI，也不要接真实后端、Temporal、SSE 或 auth；先只围绕 **API-backed Mutations & Unified Write Error Discipline** 做一轮窄而实的实现：补齐 fake API runtime 的 mutation dispatcher，固定 Review / Chapter / Export 三条现有写路径的 method/path/body/success response，新增统一 write error classifier，用测试验证 optimistic update、rollback、invalidation、query key 不变和 route 不变，并更新 `doc/api-contract.md` 的 PR22 write slice 说明。
