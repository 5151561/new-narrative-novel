# PR21+ 后续任务计划（基于 `codex/pr20-api-project-runtime-boundary` 当前代码）

## 结论

PR20 已经把项目从“renderer 内部 mock / provider 原型”推进到了 **API-only 前端接入边界**：

- `ProjectRuntime` 已经成为统一 client provider boundary，并包含 `bookClient / chapterClient / assetClient / reviewClient / sceneClient / traceabilitySceneClient`。
- `ProjectRuntime.persistence` 已经被明确降级为 mock-only optional 能力。
- `createApiProjectRuntime(...)` 已经通过 `ApiTransport` 实现现有 client interfaces。
- `apiRouteContract` 已经固定 `/api/projects/:projectId/...` 路径矩阵。
- `BookDraftView` 已经走到 `read / compare / export / branch / review` 五种 draft 子视图。
- `fake-api-runtime.test-utils.ts` 已经能用 fake transport 通过 API runtime 转接到 mock runtime，适合下一轮做 API read slice 验证。

所以，PR20 之后不要继续加新的 UI surface，也不要马上接真实 Temporal / worker / Electron IPC。

下一步最应该做的是：

## **PR21：API-backed Read Slice & Response State Contract**

一句话目标：

> **选一条最能覆盖现有复杂产品面的完整 read path，用 API runtime 跑通，并固定 loading / error / not-found / null / empty array 的响应状态纪律。**

推荐 read path：

```text
Book / Draft / Review
```

原因是它会同时触碰：

- Book Draft workspace
- manuscript compare checkpoint
- export readiness / artifact gate
- experiment branch signals
- review inbox / decisions / fix actions
- source handoff 到 chapter / scene / asset
- traceability-derived review 问题

PR21 完成后，项目应具备一个明确事实：

> **复杂工作面可以完全从 API runtime 读取数据；UI 不需要知道数据来自 mock runtime 还是 API transport。**

---

## 一、当前代码基线判断

### 1. 当前仍是 renderer-first 仓库

根 `package.json` 仍只把 `typecheck / test / build / storybook` 指向 `@narrative-novel/renderer`。`pnpm-workspace.yaml` 虽然允许 `packages/*`，但当前实际主包仍是 renderer。

这意味着 PR21 不应该突然变成后端大 PR。真实后端可以作为后续独立 track，但 PR21 的直接任务应是：

- 用 API runtime 验证前端 read contract；
- 固定 response state；
- 明确哪些 endpoint shape 真实可驱动当前 UI。

### 2. 对象轴和工作轴已经足够深

当前 route 已支持：

```ts
WorkbenchScope = 'scene' | 'chapter' | 'asset' | 'book'
BookDraftView = 'read' | 'compare' | 'export' | 'branch' | 'review'
```

也就是说，继续加产品面已经不是第一优先级。当前最有价值的是把这些已有产品面从“mock-first”推进到“API-contract-first”。

### 3. PR20 已经给了可替换 runtime 边界

当前 `ProjectRuntime` 形态已经是：

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

这就是 PR21 应复用的边界。不要新建第二套 API provider，不要让 feature 直接依赖 `fetch`。

### 4. PR20 的 API adapter 已经覆盖主要 client

`createApiProjectRuntime(...)` 当前已经把以下 client 映射到 `ApiTransport`：

- `bookClient`
- `chapterClient`
- `assetClient`
- `reviewClient`
- `sceneClient`
- `traceabilitySceneClient`

PR21 不应重新设计这些 interface，而应验证：

- 复杂 read path 是否真的只靠这些 interface 就能跑；
- 返回体 shape 是否足够；
- null / empty / error 状态是否在 UI 中稳定。

### 5. fake API runtime 已经是 PR21 的最佳入口

`createFakeApiRuntime(...)` 已经具备这些能力：

- 创建 `createApiProjectRuntime(...)`
- 用 fake transport 记录 requests
- 将 API request 转发到 mock runtime
- 让 tests 能断言 API method / path / body

PR21 应该把它升级成“read slice contract harness”，而不是绕开它直接写零散 fake clients。

---

## 二、后续路线总览

### PR21：API-backed Read Slice & Response State Contract（立即执行）

目标：用 API runtime 跑通 `Book / Draft / Review` read path，固定 endpoint graph、payload shape、loading/error/not-found/empty 状态。

不做 mutation，不做真实后端，不接 Temporal。

### PR22：API-backed Mutations & Unified Write Error Discipline

目标：把已有写路径切到 API runtime，固定 optimistic update / rollback / invalidation / validation-conflict error。

范围：

- chapter scene reorder
- chapter structure patch
- review decision set / clear
- review fix action set / clear
- export artifact build
- scene proposal action / patch commit / prose revision（如果当前 hooks 已有 production path）

### PR23：Run / Event Stream API Surface Contract

目标：新增 run / event stream 的前端 contract 与 UI consumption skeleton，但前端不接 Temporal。

范围：

- `runClient` 或 `sceneRunClient` interface
- API route contract：start run / read run / submit review decision / read events
- product-level run event types
- Scene dock / inspector 中最小 runtime event reader

### PR24：Project Session / API Health Boundary

目标：从“只要 API base URL 就创建 runtime”升级到“project session 可见、health 可见、auth failure 可控”。

范围：

- current project loading
- project switch placeholder
- API health state
- `401 / 403 / 404 / 409 / 422 / 500` 的统一状态表达
- 不做完整账号系统

### PR25：Backend Orchestration Integration UI

目标：在 API-only 边界下，把第一条 scene run / review gate / canon patch 后端纵切接入 UI。

前端只做：

- start run
- observe product-level run events
- submit review decision
- refresh affected scene / chapter / book queries

不要让 renderer 知道 Temporal workflow implementation。

### BE-PR1：API Server Skeleton（建议在 PR21 之后或并行启动）

目标：新增后端包，先实现 PR20 / PR21 固定下来的 read contract。

范围：

- `packages/api` 或 `apps/api`
- typed route handlers
- in-memory / fixture-backed repositories
- contract tests against `doc/api-contract.md`
- 不接真实 LLM，不接 Temporal，不接 DB

---

# PR21 执行文档：API-backed Read Slice & Response State Contract

## 1. PR21 的唯一目标

**用 API runtime 跑通一条完整、复杂、只读的产品路径。**

推荐选择：

```text
Book / Draft / Review
```

PR21 完成后，应能做到：

1. 打开 deep link：

```text
?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&reviewStatusFilter=open&selectedChapterId=chapter-open-water-signals
```

2. 通过 `createApiProjectRuntime(...)` + fake transport 获取所有 read 数据。
3. Book Draft Review 能渲染 review issues、source context、export / branch / compare 相关 signals。
4. 切换 filter / selected chapter / selected issue 仍由 route 驱动。
5. fake API transport 能记录本路径用到的 endpoint graph。
6. loading / error / 404 / null / empty array 的状态都有稳定 UI 与测试。
7. Storybook / tests 默认仍可使用 mock runtime，无真实 API server 依赖。

一句话说：

> **PR21 只验证 API read contract 是否能驱动最复杂的现有工作面。**

---

## 2. 为什么选择 `Book / Draft / Review`

### 2.1 它覆盖面足够大

`Book / Draft / Review` 会触碰：

- `useBookDraftWorkspaceQuery(...)`
- `useBookManuscriptCompareQuery(...)`
- `useBookExportPreviewQuery(...)`
- `useBookExperimentBranchQuery(...)`
- review inbox / decisions / fix actions hooks
- traceability scene sources
- source handoff 到 chapter / scene / asset

这比选一个简单 `asset/profile` 或 `chapter/structure` 更有价值。

### 2.2 它仍是 read-only

PR21 不需要处理 mutation rollback，也不需要处理 validation conflict。

这能把本轮问题收窄成：

- endpoint graph
- payload shape
- loading/error/not-found
- runtime provider correctness
- query key 不变

### 2.3 它能暴露真实后端接入前最重要的缺口

如果 `Book / Draft / Review` 能被 API runtime 稳定驱动，后续真实后端只需要兑现：

- PR20 API matrix
- PR21 response state contract
- PR21 payload examples

如果它不能稳定驱动，说明当前 contract 还太粗，需要先修 contract，而不是直接写后端。

---

## 3. 本轮明确不做

PR21 不做：

- 不做任何新 UI surface。
- 不新增 Book Draft 子视图。
- 不做 mutation API-backed 切换。
- 不做真实 API server。
- 不做 auth / session。
- 不接 SSE。
- 不接 Temporal。
- 不接 worker / IPC / preload。
- 不改 route shape。
- 不改 query key identity。
- 不把 Storybook 改成依赖真实 API。
- 不把 fake API runtime 变成产品 runtime。
- 不清理所有 mock fallback，只清理 PR21 路径上的 production bypass。

---

## 4. 必须遵守的硬约束

### 4.1 route 仍然是 UI location 真源

不要新增：

- selectedReviewIssue store
- selectedBookChapter store
- local active filter store
- local active read source store

统一规则：

- `selectedChapterId` 来自 Book route。
- `reviewFilter / reviewStatusFilter / reviewIssueId` 来自 Book route。
- source handoff 仍通过 `replaceRoute(...)`。
- browser back / forward 必须恢复。

### 4.2 query key identity 不变

PR21 不允许：

- 为 API runtime 改 query key；
- 为 fake API runtime 改 query key；
- 为 base URL 改 query key；
- 为 response status 改 query key。

允许：

- query function 改为 runtime client；
- tests 用 fake API runtime 注入；
- hook 内增加 `enabled` / loading guard。

### 4.3 production read path 不绕过 runtime

PR21 目标路径上的 production code 不应直接 import static client。

允许保留：

- tests 的 custom client injection；
- Storybook 的 mock runtime injection；
- 非 PR21 路径上的旧 debt。

但要在 PR21 文档里列出剩余 debt，不要悄悄扩大范围。

### 4.4 fake API runtime 是测试 harness，不是新业务层

`fake-api-runtime.test-utils.ts` 可以增强为更稳定的 contract harness，但不要把业务 mapper 放进去。

正确定位：

```text
fake API runtime = request recording + API path dispatch + deterministic fixture response
feature hooks/components = 业务 view-model 派生与展示
```

### 4.5 response state 要前台化

PR21 必须明确区分：

- loading
- network error / server error
- 401 / 403 placeholder
- 404 / null detail
- empty list
- partial dependency missing

不要把所有异常都折叠成 generic empty state。

---

## 5. 建议文件改动

### 5.1 新增

```text
packages/renderer/src/app/project-runtime/api-read-slice-contract.test.tsx
packages/renderer/src/app/project-runtime/api-read-slice-fixtures.ts
packages/renderer/src/app/project-runtime/api-response-state.ts
packages/renderer/src/app/project-runtime/api-response-state.test.ts
packages/renderer/src/features/book/containers/BookDraftReviewApiReadSlice.test.tsx
```

如果不想新增 `api-response-state.ts`，也可以先把状态测试压在 workspace/container tests 中。但若多个 feature 都需要同样状态，建议抽出来。

### 5.2 修改

```text
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewDecisionsQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewFixActionsQuery.ts
packages/renderer/src/features/traceability/hooks/useTraceabilitySceneSources.ts
packages/renderer/src/features/asset/hooks/useAssetKnowledgeWorkspaceQuery.ts
packages/renderer/src/app/project-runtime/api-project-runtime.test.ts
doc/api-contract.md
```

### 5.3 这一轮尽量不动

```text
packages/renderer/src/features/book/components/**
packages/renderer/src/features/chapter/components/**
packages/renderer/src/features/scene/components/**
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/app/i18n/**
```

除非测试发现组件没有状态入口，否则不要改视觉组件。

---

## 6. Read path endpoint graph

PR21 应先把 `Book / Draft / Review` 的 endpoint graph 固定下来。

### 6.1 预期读 endpoint

打开 `Book / Draft / Review` 至少可能触发：

```text
GET /api/projects/:projectId/books/:bookId/structure
GET /api/projects/:projectId/chapters/:chapterId/structure
GET /api/projects/:projectId/scenes/:sceneId/prose
GET /api/projects/:projectId/scenes/:sceneId/execution
GET /api/projects/:projectId/scenes/:sceneId/inspector
GET /api/projects/:projectId/scenes/:sceneId/patch-preview
GET /api/projects/:projectId/books/:bookId/manuscript-checkpoints
GET /api/projects/:projectId/books/:bookId/manuscript-checkpoints/:checkpointId
GET /api/projects/:projectId/books/:bookId/export-profiles
GET /api/projects/:projectId/books/:bookId/export-profiles/:exportProfileId
GET /api/projects/:projectId/books/:bookId/experiment-branches
GET /api/projects/:projectId/books/:bookId/experiment-branches/:branchId
GET /api/projects/:projectId/books/:bookId/review-decisions
GET /api/projects/:projectId/books/:bookId/review-fix-actions
GET /api/projects/:projectId/assets/:assetId/knowledge
```

实际 endpoint graph 以测试记录为准。PR21 必须把最终请求列表写进 `doc/api-contract.md` 的 “read slice examples” 小节。

### 6.2 不应出现的请求

PR21 不应触发：

```text
POST /api/projects/:projectId/books/:bookId/export-artifacts
PUT /api/projects/:projectId/books/:bookId/review-decisions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-decisions/:issueId
PUT /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
DELETE /api/projects/:projectId/books/:bookId/review-fix-actions/:issueId
POST /api/projects/:projectId/scenes/:sceneId/proposals/*
POST /api/projects/:projectId/scenes/:sceneId/execution/continue
```

如果测试中出现这些请求，说明 PR21 的 read path 误触发了 mutation 行为。

---

## 7. Response state contract

PR21 需要补齐并测试以下状态。

### 7.1 Object detail 返回 `null`

例如：

```text
GET /books/:bookId/structure -> null
GET /manuscript-checkpoints/:checkpointId -> null
GET /experiment-branches/:branchId -> null
GET /assets/:assetId/knowledge -> null
```

UI 规则：

- 当前主对象为 null：显示 not-found pane。
- 次级依赖为 null：主 workspace 仍可显示，但相关 section 显示 missing dependency / unavailable。
- 不要用空对象假装数据存在。

### 7.2 List 返回空数组

例如：

```text
GET /review-decisions -> []
GET /review-fix-actions -> []
GET /export-profiles -> []
GET /experiment-branches -> []
```

UI 规则：

- 空数组是正常 empty state。
- 不应该被当成 error。
- 如果 list 为空但当前 route 指向某个 id，应显示 “not available in this project”。

### 7.3 Non-2xx error

统一通过 `ApiRequestError` 表达：

```ts
{
  status: number
  message: string
  code?: string
  detail?: unknown
}
```

UI 规则：

- `401 / 403`：显示 API session/auth placeholder，不做完整 auth。
- `404`：区分主对象 not found 与次级依赖缺失。
- `409 / 422`：PR21 只记录为 read contract error；具体 mutation conflict 留到 PR22。
- `500`：显示 retry-friendly error pane。

### 7.4 Partial dependency error

Book Draft Review 依赖很多子查询。PR21 不要求所有 dependency error 都让整个页面崩掉。

建议规则：

- Book structure error：整个 workspace error。
- Chapter structure error：该 chapter block 显示 unavailable，book totals 降级。
- Scene prose / traceability error：该 scene section 显示 trace/prose unavailable。
- Review decisions / fix actions error：review action state 区域显示 unavailable，但 issue list 可继续展示。

---

## 8. 实施顺序（给 AI 的执行顺序）

### Step 1：读当前实现，不要直接开改

先读：

```text
AGENTS.md
packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx
packages/renderer/src/app/project-runtime/api-project-runtime.ts
packages/renderer/src/app/project-runtime/api-route-contract.ts
packages/renderer/src/app/project-runtime/fake-api-runtime.test-utils.ts
packages/renderer/src/features/book/containers/BookDraftWorkspace.tsx
packages/renderer/src/features/book/components/BookDraftStage.tsx
packages/renderer/src/features/book/components/BookDraftReviewView.tsx
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewDecisionsQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewFixActionsQuery.ts
packages/renderer/src/features/traceability/hooks/useTraceabilitySceneSources.ts
```

输出一份短注释或 test name，列出 Book Draft Review 的 query dependency graph。

### Step 2：增强 fake API read fixture

新增或扩展：

```text
api-read-slice-fixtures.ts
fake-api-runtime.test-utils.ts
```

要求：

- 能创建一个 `createBookDraftReviewApiRuntimeFixture(...)`。
- 能配置某个 endpoint 返回 `null`、空数组、指定 error。
- 能记录所有 request 的 method/path/query/body。
- 默认数据仍来自现有 mock runtime，不复制一份巨大 fixture。

推荐 API：

```ts
const fixture = createBookDraftReviewApiRuntimeFixture({
  projectId: 'book-signal-arc',
  overrides: {
    nullPaths: ['/api/projects/book-signal-arc/books/book-missing/structure'],
    errors: {
      '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions': {
        status: 500,
        message: 'Review decisions unavailable',
        code: 'REVIEW_DECISIONS_UNAVAILABLE',
      },
    },
  },
})
```

### Step 3：新增 read slice contract test

新增：

```text
packages/renderer/src/app/project-runtime/api-read-slice-contract.test.tsx
```

测试路径：

```text
打开 Book / Draft / Review deep link
-> 注入 fake API runtime
-> 等待 review view 渲染
-> 断言 endpoint graph 中包含预期 GET
-> 断言没有任何 POST / PUT / PATCH / DELETE
-> 断言 UI 能正常显示 review issue / source / readiness 信息
```

重点不是 snapshot UI，而是：

- API runtime request graph；
- method/path/query 正确；
- read-only 纪律；
- UI 与 API/mock 来源解耦。

### Step 4：补 not-found 与 empty tests

至少新增三条：

#### A. Book not found

```text
GET /books/:bookId/structure -> null
-> Book Draft Review 显示 not-found
-> 不继续无限触发下游 query
```

#### B. Empty review decisions / fix actions

```text
GET /review-decisions -> []
GET /review-fix-actions -> []
-> Review view 仍显示 issues
-> decision/fix action 状态为空但不是 error
```

#### C. Missing selected branch / checkpoint / export profile

```text
selected route id 不存在
-> fallback 或 unavailable state 明确
-> 不把页面整体崩掉
```

### Step 5：补 error tests

至少覆盖：

- `500` review decisions error。
- `404` asset knowledge detail。
- malformed JSON 已由 transport 测过；PR21 只需要验证上层 workspace 不崩。

### Step 6：审计 PR21 read path 是否绕过 runtime

搜索：

```bash
rg "from '@/features/.*/api/.*client'" packages/renderer/src/features/book packages/renderer/src/features/review packages/renderer/src/features/traceability packages/renderer/src/features/asset
rg "create.*Client\(" packages/renderer/src/features/book packages/renderer/src/features/review packages/renderer/src/features/traceability packages/renderer/src/features/asset
```

处理原则：

- 如果是 hook options 的 default client，并且 production container 会传 runtime client，可以保留。
- 如果 production path 直接 import static client，改为 `useOptionalProjectRuntime()` + `resolveProjectRuntimeDependency(...)`。
- 不要扩大到所有 feature；只修 PR21 目标路径。

### Step 7：更新 `doc/api-contract.md`

新增小节：

```md
## 8. PR21 Book Draft Review read slice
```

内容包括：

- deep link 示例；
- endpoint graph；
- read-only guarantee；
- null / empty array / error rules；
- fixture response examples；
- 本轮不涉及 mutation。

### Step 8：运行验证

至少运行：

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
```

如果改了 story runtime setup，再运行：

```bash
pnpm --filter @narrative-novel/renderer storybook
```

---

## 9. 测试要求

### 9.1 `api-read-slice-contract.test.tsx`

至少覆盖：

1. Book Draft Review deep link 能由 fake API runtime 渲染。
2. request graph 包含 book / chapter / scene / review / branch / export / checkpoint / traceability reads。
3. request graph 不包含 mutation method。
4. `reviewFilter / reviewStatusFilter / reviewIssueId / selectedChapterId` 仍来自 route。
5. browser back / forward 恢复 read slice。

### 9.2 `BookDraftReviewApiReadSlice.test.tsx`

至少覆盖：

1. 用 API runtime 打开 review view。
2. 切换 selected chapter 后，review / inspector / dock 同步刷新。
3. 点击 source handoff 到 chapter / scene / asset 后，browser back 回到 review。
4. empty review decisions 不破坏 issue list。
5. review decisions error 有明确 supporting state。

### 9.3 `api-response-state.test.ts`

如果新增 `api-response-state.ts`，至少覆盖：

1. `null` detail -> not found。
2. empty array -> empty state。
3. `ApiRequestError.status === 401 / 403` -> auth placeholder kind。
4. `ApiRequestError.status === 404` -> not found kind。
5. `ApiRequestError.status >= 500` -> server error kind。

### 9.4 existing tests 不应退化

必须保持：

- `api-project-runtime.test.ts`
- `api-route-contract.test.ts`
- `ProjectRuntimeProvider.test.tsx`
- Book Draft / Review existing component tests
- App smoke tests

---

## 10. PR21 验收标准

满足以下条件，PR21 才算完成：

1. `Book / Draft / Review` 能通过 `createApiProjectRuntime(...)` + fake transport 渲染。
2. 目标 read path 的 production hooks 不绕过 `ProjectRuntimeProvider`。
3. request graph 被测试固定。
4. read path 不触发 mutation endpoint。
5. `null` detail、empty array、non-2xx error 都有稳定状态。
6. `doc/api-contract.md` 增加 PR21 read slice 示例。
7. route shape 不变。
8. query key identity 不变。
9. Storybook / tests 不需要真实 API server。
10. 不接 Temporal / SSE / auth / backend server。
11. `pnpm --filter @narrative-novel/renderer typecheck` 通过。
12. `pnpm --filter @narrative-novel/renderer test` 通过。

---

## 11. PR21 结束时不要留下的债

以下情况都算 PR 做偏了：

- 为 Book Draft Review 新建了平行 runtime provider。
- 为 API read slice 改了 route shape。
- 为 API base URL 改了 query key。
- fake API runtime 复制了一整套业务 mapper。
- Storybook 默认需要真实 API server。
- read path 误触发 review decision / export artifact mutation。
- 所有 error 都变成 generic empty state。
- 为了修一个 read path，大范围重构 book/review UI。
- 顺手开始做 PR22 mutation。

PR21 正确结束状态：

> **API runtime 已经能驱动一条复杂 read workflow，并且真实后端未来需要兑现的 payload / state / endpoint graph 已经被测试和文档固定。**

---

# PR22 执行方向：API-backed Mutations & Unified Write Error Discipline

PR22 应在 PR21 read slice 稳定后执行。

## 目标

把已有写路径从 mock mutable DB / local persistence preview 推进到 API runtime write path，并固定：

- optimistic update
- rollback
- invalidation
- validation error
- conflict error
- auth/session error placeholder

## 范围

必须覆盖：

```text
Chapter:
- reorderChapterScene
- updateChapterSceneStructure

Review:
- setReviewIssueDecision
- clearReviewIssueDecision
- setReviewIssueFixAction
- clearReviewIssueFixAction

Book Export:
- buildBookExportArtifact
```

视当前 hooks 情况可覆盖：

```text
Scene:
- saveSceneSetup
- commitAcceptedPatch
- reviseSceneProse
- proposal accept / edit-accept / reject / request-rewrite
```

## 不做

- 不接真实 backend server。
- 不接 run event。
- 不做 branch merge。
- 不做 auth full flow。
- 不改 route。

## 关键要求

- mutation hooks 使用 API runtime client。
- optimistic update 仍只 patch query cache，不改 route。
- rollback 不依赖 localStorage persistence。
- `409 / 422` 进入统一 write error view-model。
- fake API runtime 能模拟 validation / conflict。

---

# PR23 执行方向：Run / Event Stream API Surface Contract

## 目标

为后端 orchestration 暴露第一版 run / event stream API contract，但前端不接 Temporal SDK。

## 建议新增 client

```ts
interface RunClient {
  startSceneRun(input: { sceneId: string; mode?: 'continue' | 'rewrite' }): Promise<RunRecord>
  getRun(input: { runId: string }): Promise<RunRecord | null>
  getRunEvents(input: { runId: string; cursor?: string }): Promise<RunEventPage>
  submitRunReviewDecision(input: SubmitRunReviewDecisionInput): Promise<RunRecord>
}
```

## 建议 endpoints

```text
POST /api/projects/:projectId/scenes/:sceneId/runs
GET  /api/projects/:projectId/runs/:runId
GET  /api/projects/:projectId/runs/:runId/events
POST /api/projects/:projectId/runs/:runId/review-decisions
```

SSE 可先只写 contract：

```text
GET /api/projects/:projectId/runs/:runId/events/stream
```

## UI 范围

- Scene dock 增加 read-only run events source。
- Scene inspector / execution pane 显示 run status。
- 不做真实实时推送也可以先 polling。

## 不做

- 不接 Temporal SDK。
- 不展示 Temporal history。
- 不做 full run debugger。
- 不把 event stream 放进 route。

---

# PR24 执行方向：Project Session / API Health Boundary

## 目标

把 API runtime 从“有 base URL 就创建”升级为“project session 可见、health 可见、auth failure 可控”。

## 范围

- `GET /api/health` 或 `GET /api/projects/:projectId/runtime-info` health 扩展。
- Project selector placeholder。
- Unauthorized / expired / forbidden state。
- API unavailable state。
- App top bar 显示 API runtime source。

## 不做

- 不做完整账号系统。
- 不做 OAuth。
- 不做多用户权限模型。
- 不做 project CRUD。

---

# PR25 执行方向：Backend Orchestration Integration UI

## 目标

在 API-only 前提下，把第一条 scene run / review gate / canon patch 的后端纵切接入 UI。

## 前端只做

- start run
- observe run events
- show waiting review state
- submit review decision
- refresh affected queries

## 后端边界

即使后端内部使用 Temporal，renderer 仍只认识：

```text
REST API
SSE / polling event endpoint
RunRecord
RunEvent
ReviewDecision
```

renderer 不直接 import Temporal SDK，不读取 Temporal history。

---

# BE-PR1 建议：API Server Skeleton（可在 PR21 后启动）

如果准备开始后端，建议独立开后端 PR，不要塞进 PR21。

## 目标

新增一个最小 API server，只兑现 PR20 + PR21 的 read contract。

## 建议目录

```text
packages/api/
  src/
    server.ts
    routes/
    repositories/
    fixtures/
    contract-tests/
```

或者：

```text
apps/api/
```

## 第一版只做

- `/api/projects/:projectId/books/:bookId/structure`
- `/api/projects/:projectId/chapters/:chapterId/structure`
- `/api/projects/:projectId/scenes/:sceneId/prose`
- `/api/projects/:projectId/scenes/:sceneId/execution`
- `/api/projects/:projectId/scenes/:sceneId/inspector`
- `/api/projects/:projectId/scenes/:sceneId/patch-preview`
- `/api/projects/:projectId/books/:bookId/review-decisions`
- `/api/projects/:projectId/books/:bookId/review-fix-actions`
- `/api/projects/:projectId/assets/:assetId/knowledge`

## 不做

- 不接 DB。
- 不接 Temporal。
- 不接 LLM。
- 不做 auth。
- 不做 production deployment。

## 验收

- renderer fake API read slice 的 endpoint graph 可被真实 server fixture 复现。
- API server contract tests 与 `doc/api-contract.md` 一致。

---

# 给 AI agent 的最终一句话指令

在当前 `codex/pr20-api-project-runtime-boundary` 已完成 PR20 的前提下，不要继续新增 Book/Review UI，也不要直接接真实后端、Temporal、SSE 或 auth；先只围绕 **API-backed Read Slice & Response State Contract** 做一轮窄而实的实现：

- 选择 `Book / Draft / Review` 作为唯一目标 read path；
- 使用 `createApiProjectRuntime(...)` + fake transport 驱动该路径；
- 固定 read endpoint graph，并断言本轮没有 mutation request；
- 为 `null`、empty array、non-2xx、partial dependency error 补稳定状态；
- 审计目标 read path 上的 hooks，确保 production path 走 `ProjectRuntimeProvider`；
- 不改 route shape，不改 query key identity；
- 更新 `doc/api-contract.md`，加入 PR21 read slice 示例与 response state 约定；
- 保持 Storybook / tests 默认可用 mock runtime；
- 用 `pnpm --filter @narrative-novel/renderer typecheck` 和 `pnpm --filter @narrative-novel/renderer test` 固定回归。
