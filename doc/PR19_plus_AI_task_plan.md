# new-narrative-novel：PR18 之后的后续任务计划与 AI 执行文档

> 目标读者：可直接执行代码修改的 AI / Codex / Cursor Agent。  
> 默认基线：`codex/pr18-export-package-artifact-foundation`，或已合并 PR18 的本地 `main`。  
> 计划重点：不要继续堆 UI 页面；先把 PR18 后的 Book / Review / Export 工作流从“内存 mock 原型”推进到“可持久化、可替换 provider 的项目运行边界”。

---

## 0. 当前代码判断

PR18 后，项目已经完成了第一版 Book Export Artifact Foundation：

- Book Draft 的 `export` 视图已经能基于 Export Preview 生成 Markdown / Plain Text artifact。
- Artifact record 已包含 `content`、`sourceSignature`、readiness snapshot、review gate snapshot、filename、mime type、chapter / scene / word counts。
- Artifact build 受 Export Readiness 与 Review open blockers 控制。
- Artifact UI 已提供 build、latest artifact、recent artifacts、copy、download 的容器接口。
- Workbench route 已扩展到 `scene | chapter | asset | book`，Book route 已包含 `read / compare / export / branch / review` 等 draft view。
- 仍然没有真实 project persistence；多数数据仍来自模块级 mock DB 或运行时内存 Map。

因此，**下一个最应该做的是 PR19：Project Persistence & Provider Boundary**。

---

## 1. 后续路线总览

### PR19：Project Persistence & Provider Boundary（立即执行）

把当前 mock client / mock DB 从散落的模块单例，收敛到一个可注入的 Project Runtime，并为关键用户动作提供本地持久化。目标不是接真实后端，而是建立以后替换为 Electron IPC / 文件存储 / 后端 API 时不需要大改 UI 与 hook 的边界。

### PR20：Run / Proposal / Canon / Prose Contract

在 provider 边界稳定后，定义真实写作引擎的最小数据契约：run、proposal、accepted canon patch、prose revision、trace source。只定义 contract、adapter 和 fixture，不接真实大模型。

### PR21：Real Writing Engine Alpha

接入一个可替换的 writing engine adapter，让 Scene Orchestrate 可以从 mock proposal 切到真实 proposal 生成。先做单 scene、单 run、可回放结果，不做复杂队列。

### PR22：Canon Acceptance & Trace Index Alpha

把 accepted proposal / canon patch / prose draft 的关系沉淀为可查询 trace index，为后续冲突检测、asset mention 和解释性导出做准备。

### PR23：Asset Mention / Knowledge Surface

让 prose 与 accepted canon 能回写到 Asset / Knowledge 面板，支持 mention、relation、source proposal 引用，不做大型 graph 可视化。

### PR24：Canon Conflict Review

在 Review Inbox 里加入 canon conflict 类问题：同一事实不同来源冲突、资产状态过期、正文引用与 canon 不一致。

### PR25+：Production Writing Loop

围绕真实写作闭环做可靠性：run history、retry、diff、merge、export provenance、项目文件备份、离线恢复。

---

# PR19 AI 执行任务：Project Persistence & Provider Boundary

## 2. PR19 目标

实现一个项目级 runtime/provider 边界，使 Book / Chapter / Review / Export 相关 hooks 不再只能依赖模块级 singleton client；同时实现本地持久化，让关键用户动作在刷新或重新挂载后仍能恢复。

PR19 完成后，项目仍是 renderer alpha，但应该具备：

1. `AppProviders` 内存在 `ProjectRuntimeProvider`。
2. hooks 默认从 runtime context 获取 clients，同时继续允许测试传入 custom deps。
3. review decisions、review fix actions、book export artifacts、chapter structure edits 至少能通过 localStorage persistence 恢复。
4. Storybook / tests 能使用稳定的 mock runtime，不依赖真实浏览器状态。
5. 后续 PR20 能直接在 runtime 上挂 writing engine adapter。

---

## 3. 严格边界

### 本 PR 必须做

- 新增 Project Runtime / Provider。
- 新增本地 persistence port 与 localStorage adapter。
- 将 Book / Chapter / Review 关键 hooks 改为 provider-aware。
- 保留现有 hook deps 注入能力，不能破坏已有 tests / stories。
- 为 persistence、provider 注入、关键恢复路径补测试。
- 更新必要文档。

### 本 PR 不做

- 不接真实后端、数据库、登录或云同步。
- 不做 PDF / EPUB / DOCX。
- 不做真实 writing engine。
- 不做 branch merge。
- 不重写 UI 组件视觉。
- 不改造整个路由系统为复杂 store。
- 不把 derived view model 直接持久化为事实来源。

---

## 4. 执行前命令

```bash
git checkout codex/pr18-export-package-artifact-foundation
# 如果 PR18 已经合并到 main，则改用：git checkout main

git pull

git checkout -b codex/pr19-project-persistence-provider-boundary
pnpm install
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
```

如果基线分支名不存在，先检查本地是否已经把 PR18 合并进 `main`。不要删除或重置远端分支。

---

## 5. 必读文件

先读这些文件，不要直接开改：

```txt
AGENTS.md
FRONTEND_WORKFLOW.md
packages/renderer/src/app/providers.tsx
packages/renderer/src/App.tsx
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts

packages/renderer/src/features/book/api/book-client.ts
packages/renderer/src/features/book/api/mock-book-db.ts
packages/renderer/src/features/book/api/mock-book-export-artifact-db.ts
packages/renderer/src/features/book/api/book-export-artifact-records.ts
packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/hooks/useBookExportArtifactWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBuildBookExportArtifactMutation.ts
packages/renderer/src/features/book/hooks/book-query-keys.ts

packages/renderer/src/features/chapter/api/chapter-client.ts
packages/renderer/src/features/chapter/api/mock-chapter-db.ts
packages/renderer/src/features/chapter/hooks/chapter-query-keys.ts

packages/renderer/src/features/review/api/review-client.ts
packages/renderer/src/features/review/api/mock-review-decision-db.ts
packages/renderer/src/features/review/api/mock-review-fix-action-db.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewDecisionsQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewFixActionsQuery.ts
packages/renderer/src/features/review/hooks/review-query-keys.ts

packages/renderer/src/features/scene/api/scene-client.ts
packages/renderer/src/features/scene/api/scene-runtime.ts
```

---

## 6. 设计原则

### 6.1 Runtime 是边界，不是新业务层

新增 runtime 的作用是集中注入 clients、persistence 与未来 engine adapter。不要把 Book / Review / Chapter 的业务 mapper 挪进 runtime。

### 6.2 持久化 source record，不持久化 derived view model

可以持久化：

- review decision records
- review fix action records
- book export artifact records
- chapter structure mutable records / patches
- 未来 scene mutation records

不要持久化：

- `BookDraftWorkspaceViewModel`
- `BookExportPreviewWorkspaceViewModel`
- `BookReviewInboxViewModel`
- readiness 计算结果之外的临时 UI 状态

### 6.3 先建立本地 adapter，再为以后替换成 IPC / file store 留接口

本 PR 只实现 `localStorage` adapter，但接口命名不能绑死浏览器。未来可替换为 Electron preload bridge 或文件项目存储。

---

## 7. 具体实现任务

## Task 1：新增 Project Runtime 类型与 Provider

新增目录：

```txt
packages/renderer/src/app/project-runtime/
  project-runtime.ts
  ProjectRuntimeProvider.tsx
  project-persistence.ts
  local-storage-project-persistence.ts
  mock-project-runtime.ts
  index.ts
```

### `project-runtime.ts`

定义：

```ts
import type { BookClient } from '@/features/book/api/book-client'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import type { ReviewClient } from '@/features/review/api/review-client'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type { TraceabilitySceneClient } from '@/features/traceability/hooks/useTraceabilitySceneSources'
import type { ProjectPersistencePort } from './project-persistence'

export interface ProjectRuntime {
  projectId: string
  bookClient: BookClient
  chapterClient: ChapterClient
  reviewClient: ReviewClient
  sceneClient: SceneClient
  traceabilitySceneClient: TraceabilitySceneClient
  persistence: ProjectPersistencePort
}
```

允许 `projectId` 先固定为 `book-signal-arc`，但必须作为字段存在。

### `ProjectRuntimeProvider.tsx`

实现：

- `ProjectRuntimeProvider`
- `useProjectRuntime()`
- `createDefaultProjectRuntime()` 或从 `mock-project-runtime.ts` 引入默认 runtime

要求：

- 未包 Provider 时要抛出明确错误。
- Provider 支持传入 `runtime` prop，方便 tests / stories 注入。
- `AppProviders` 必须包裹 `ProjectRuntimeProvider`。

示例结构：

```tsx
export function ProjectRuntimeProvider({ runtime, children }: PropsWithChildren<{ runtime?: ProjectRuntime }>) {
  const defaultRuntime = useMemo(() => runtime ?? createMockProjectRuntime(), [runtime])
  return <ProjectRuntimeContext.Provider value={defaultRuntime}>{children}</ProjectRuntimeContext.Provider>
}
```

注意：如果 `createMockProjectRuntime()` 内部会读取 localStorage，不要在 SSR / test 无 window 时直接崩溃。

---

## Task 2：新增 Persistence Port 与 localStorage Adapter

### `project-persistence.ts`

定义项目快照：

```ts
import type { BookExportArtifactRecord } from '@/features/book/api/book-export-artifact-records'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { ReviewIssueDecisionRecord } from '@/features/review/api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '@/features/review/api/review-fix-action-records'

export interface ProjectPersistedSnapshotV1 {
  schemaVersion: 1
  projectId: string
  updatedAt: string
  reviewDecisionsByBookId: Record<string, ReviewIssueDecisionRecord[]>
  reviewFixActionsByBookId: Record<string, ReviewIssueFixActionRecord[]>
  bookExportArtifactsByBookId: Record<string, BookExportArtifactRecord[]>
  chapterRecordsById: Record<string, ChapterStructureWorkspaceRecord>
}

export interface ProjectPersistencePort {
  loadProjectSnapshot(projectId: string): Promise<ProjectPersistedSnapshotV1 | null>
  saveProjectSnapshot(projectId: string, snapshot: ProjectPersistedSnapshotV1): Promise<void>
  clearProjectSnapshot(projectId: string): Promise<void>
}
```

### `local-storage-project-persistence.ts`

实现：

- key：`narrative-novel.project.${projectId}.v1`
- `loadProjectSnapshot`
- `saveProjectSnapshot`
- `clearProjectSnapshot`

要求：

- `window` 不存在时返回 no-op memory fallback，测试环境不能崩。
- JSON 解析失败时返回 `null`，不要让 app crash。
- schemaVersion 不是 `1` 时返回 `null`。
- 不吞掉 `saveProjectSnapshot` 的显式错误；可抛出带上下文的 Error。

---

## Task 3：为 mock DB 增加 snapshot export / import

不要重写现有 mock DB。优先给现有 DB 增加快照接口。

### Review decisions

在 `mock-review-decision-db.ts` 增加：

```ts
export function exportMockReviewDecisionSnapshot(): Record<string, ReviewIssueDecisionRecord[]>
export function importMockReviewDecisionSnapshot(snapshot: Record<string, ReviewIssueDecisionRecord[]>): void
```

### Review fix actions

在 `mock-review-fix-action-db.ts` 增加：

```ts
export function exportMockReviewFixActionSnapshot(): Record<string, ReviewIssueFixActionRecord[]>
export function importMockReviewFixActionSnapshot(snapshot: Record<string, ReviewIssueFixActionRecord[]>): void
```

### Book export artifacts

在 `mock-book-export-artifact-db.ts` 增加：

```ts
export function exportMockBookExportArtifactSnapshot(): Record<string, BookExportArtifactRecord[]>
export function importMockBookExportArtifactSnapshot(snapshot: Record<string, BookExportArtifactRecord[]>): void
```

导入时要重建 artifact sequence，避免后续 build id 重复。

### Chapter records

在 `mock-chapter-db.ts` 增加：

```ts
export function exportMockChapterSnapshot(): Record<string, ChapterStructureWorkspaceRecord>
export function importMockChapterSnapshot(snapshot: Record<string, ChapterStructureWorkspaceRecord>): void
```

导入时要保留 seed 中存在但 snapshot 缺失的 chapter，避免局部快照破坏 fixture。

---

## Task 4：实现 `createMockProjectRuntime`

在 `mock-project-runtime.ts` 中：

1. 创建默认 persistence：`createLocalStorageProjectPersistence()`。
2. 启动时读取 `projectId` 的 snapshot。
3. 如果 snapshot 存在，把数据 import 到 mock DB。
4. 创建 clients：`createBookClient()`、`createChapterClient()`、`createReviewClient()`、`createSceneClient()`。
5. 在会修改数据的 client 方法后触发保存。

### 推荐实现方式

先写一个内部函数：

```ts
async function persistCurrentMockSnapshot(projectId: string, persistence: ProjectPersistencePort) {
  await persistence.saveProjectSnapshot(projectId, {
    schemaVersion: 1,
    projectId,
    updatedAt: new Date().toISOString(),
    reviewDecisionsByBookId: exportMockReviewDecisionSnapshot(),
    reviewFixActionsByBookId: exportMockReviewFixActionSnapshot(),
    bookExportArtifactsByBookId: exportMockBookExportArtifactSnapshot(),
    chapterRecordsById: exportMockChapterSnapshot(),
  })
}
```

然后包装 mutation 方法：

- `bookClient.buildBookExportArtifact`
- `chapterClient.reorderChapterScene`
- `chapterClient.updateChapterSceneStructure`
- `reviewClient.setReviewIssueDecision`
- `reviewClient.clearReviewIssueDecision`
- `reviewClient.setReviewIssueFixAction`
- `reviewClient.clearReviewIssueFixAction`

先不要强行持久化 scene mutations；Scene client 已有 preload bridge / mock fallback 复杂性，PR19 可以只为 future scene persistence 留接口，不要扩大范围。

---

## Task 5：将 hooks 改为 provider-aware

原则：保留现有 deps 参数；如果 deps 未提供，就从 `useProjectRuntime()` 读取对应 client。

### 必改 hooks

```txt
packages/renderer/src/features/book/hooks/useBookWorkspaceSources.ts
packages/renderer/src/features/book/hooks/useBookDraftWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookExportPreviewQuery.ts
packages/renderer/src/features/book/hooks/useBookExportArtifactWorkspaceQuery.ts
packages/renderer/src/features/book/hooks/useBookManuscriptCompareQuery.ts
packages/renderer/src/features/book/hooks/useBookExperimentBranchQuery.ts
packages/renderer/src/features/book/hooks/useBuildBookExportArtifactMutation.ts

packages/renderer/src/features/review/hooks/useBookReviewDecisionsQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewFixActionsQuery.ts
packages/renderer/src/features/review/hooks/useBookReviewInboxQuery.ts
packages/renderer/src/features/review/hooks/useSetReviewIssueDecisionMutation.ts
packages/renderer/src/features/review/hooks/useClearReviewIssueDecisionMutation.ts
packages/renderer/src/features/review/hooks/useSetReviewIssueFixActionMutation.ts
packages/renderer/src/features/review/hooks/useClearReviewIssueFixActionMutation.ts

packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts
packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.ts
packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.ts
```

如果某些文件名略有差异，以实际目录为准。

### 示例模式

```ts
export function useBookExportArtifactWorkspaceQuery(input, deps = {}) {
  const runtime = useProjectRuntime()
  const effectiveBookClient = deps.bookClient ?? runtime.bookClient
  // existing query logic...
}
```

注意：如果 hook 当前在测试中不包 provider，会失败。必须更新测试 wrapper，或让 test 继续传 deps。优先更新统一 test wrapper。

---

## Task 6：更新 AppProviders 与 Query invalidation

修改：

```txt
packages/renderer/src/app/providers.tsx
```

要求：

- `AppProviders` 包含 `ProjectRuntimeProvider`。
- `LocaleQuerySync` 里除了 scene / chapter，也要 invalidate book queries。
- review records 如果无 locale 维度，不必因 locale 变化 invalidate；但如果 review inbox derived 文案依赖 locale，可通过 book / scene / chapter refetch 间接更新。

推荐：

```ts
void queryClient.invalidateQueries({ queryKey: bookQueryKeys.all })
```

确保引入 `bookQueryKeys`。

---

## Task 7：Storybook / test runtime 支持

新增一个测试工具或 story helper，例如：

```txt
packages/renderer/src/test/render-with-project-runtime.tsx
packages/renderer/src/app/project-runtime/project-runtime-test-utils.tsx
```

提供：

- `createMemoryProjectPersistence()`
- `createTestProjectRuntime()`
- `renderWithProjectRuntime(ui, { runtime })`

Storybook 如果已有 global decorators，可增加 runtime decorator；不要让 story 直接写真实 localStorage。

---

## Task 8：补测试

至少补以下测试：

### Persistence adapter

文件建议：

```txt
packages/renderer/src/app/project-runtime/local-storage-project-persistence.test.ts
```

覆盖：

- save 后 load 能返回 snapshot。
- invalid JSON 返回 null。
- schemaVersion 不匹配返回 null。
- clear 后 load 返回 null。

### Runtime snapshot

文件建议：

```txt
packages/renderer/src/app/project-runtime/mock-project-runtime.test.ts
```

覆盖：

- set review decision 后触发 snapshot save。
- build export artifact 后 artifact 出现在 saved snapshot。
- import snapshot 后 runtime 能读到已保存的 artifact / review decision。

### Hook provider injection

更新或新增：

```txt
packages/renderer/src/features/book/hooks/useBookExportArtifactWorkspaceQuery.test.tsx
packages/renderer/src/features/book/hooks/useBuildBookExportArtifactMutation.test.tsx
packages/renderer/src/features/review/hooks/useBookReviewDecisionsQuery.test.tsx
packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.test.tsx
```

覆盖：

- 不传 deps 时使用 ProjectRuntimeProvider 中的 client。
- 传 deps 时仍优先使用 custom client，保证旧测试模式不坏。

---

## 8. 验收标准

PR19 完成必须满足：

- `pnpm --filter @narrative-novel/renderer typecheck` 通过。
- `pnpm --filter @narrative-novel/renderer test` 通过。
- `pnpm --filter @narrative-novel/renderer build` 通过。
- 如果修改 Storybook decorator 或 stories，`pnpm --filter @narrative-novel/renderer build-storybook` 也要通过。
- Book export artifact build 后，刷新 / 重新创建 runtime，artifact 能从 persistence 恢复。
- Review decision / fix action 修改后，刷新 / 重新创建 runtime，状态能恢复。
- Chapter reorder / structure patch 后，刷新 / 重新创建 runtime，章节结构能恢复。
- 所有新增 provider-aware hooks 仍支持测试传入 custom client。
- UI 视觉不应发生大面积无关变化。

---

## 9. 完成后输出格式

执行完成后，在回复中列出：

1. 修改了哪些文件。
2. 新增了哪些 runtime / persistence API。
3. 哪些 hooks 已切换为 provider-aware。
4. 哪些数据现在会持久化。
5. 哪些数据暂未持久化，以及原因。
6. 已运行的命令及结果。
7. 下一步建议进入 PR20 的前置条件是否已满足。

---

## 10. PR20 预留接口提醒

PR19 不实现 writing engine，但 runtime 命名应允许 PR20 直接扩展：

```ts
export interface ProjectRuntime {
  projectId: string
  bookClient: BookClient
  chapterClient: ChapterClient
  reviewClient: ReviewClient
  sceneClient: SceneClient
  traceabilitySceneClient: TraceabilitySceneClient
  persistence: ProjectPersistencePort
  // PR20 可以加入：writingEngine?: WritingEnginePort
}
```

不要把未来 engine 的概念写死进 Book UI。PR20 应该通过 adapter / hook 接入，而不是让组件直接调用 engine。

---

# PR20 预案：Run / Proposal / Canon / Prose Contract

PR19 合并后，再启动 PR20。PR20 的执行目标：

1. 新增 `features/writing-engine` 或 `features/runtime-contracts`。
2. 定义最小 contract：
   - `WritingRunRecord`
   - `ProposalRecord`
   - `CanonPatchRecord`
   - `ProseRevisionRecord`
   - `TraceSourceRecord`
3. 提供 mock writing engine adapter。
4. Scene Orchestrate 中只接一个最小入口：start run / receive proposal / accept to canon / request prose。
5. 不直接调用真实 LLM。
6. 所有结果必须能被 Review / Trace / Export 复用。

PR20 的验收标准是：从一个 scene 触发 mock run，得到 proposal，接受后形成 canon patch，再生成 prose revision；Review 与 Trace 能识别这条来源链。

---

# PR21+ 预案

## PR21：Real Writing Engine Alpha

- 接入一个真实或半真实 adapter。
- 只支持单 scene 生成。
- run result 必须落入 PR20 contract。
- 失败要能形成 retryable error，不污染 accepted canon。

## PR22：Trace Index Alpha

- 建立 accepted canon / prose / proposal 的索引。
- Export artifact 的 source signature 可以逐步从 preview signature 升级为 trace-index-based signature。

## PR23：Asset Mention / Knowledge Surface

- 从 prose 和 accepted canon 中提取 asset mention。
- Knowledge 面板显示 source proposals 和 manuscript references。

## PR24：Canon Conflict Review

- 在 Review Inbox 加入 conflict 类 issue。
- 支持 dismiss / defer / source handoff。

---

## 11. 一句话方向

PR18 已经让 Book Export 能生成真实文本 artifact；PR19 不要继续扩 UI，而要把“谁提供数据、谁负责保存、谁能被替换”这条边界立住。这样 PR20 以后接真实写作引擎时，才不会把 engine、mock DB、UI hook 和 Storybook fixture 搅在一起。
