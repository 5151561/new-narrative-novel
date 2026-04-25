# PR29 后续任务与 PR30 执行文档

基于 `codex/pr29-scene-prose-generation-vertical-slice` 当前实际代码状态整理。本文档不是路线图回顾，而是一份可以直接交给 AI agent 执行的下一轮任务计划。

---

## 0. 一句话结论

PR29 已经把 **selected proposal variant → review decision → canon patch artifact → prose draft artifact → scene prose read model / trace** 这条薄闭环跑通了。

下一轮最应该做的不是继续铺 context / policy / inspector，也不是把桌面端抢成主线，而是：

## PR30：Scene Prose Revision API-backed Vertical Slice

把现在已经存在于 UI 和 mock client 里的 `Revise Draft` 能力，接成真正的 API-backed fixture mutation，让 `POST /scenes/:sceneId/prose/revision` 不再是 no-op。

一句话说：

> **PR29 让系统能生成正文；PR30 要让系统能对已生成正文发起一次可见、可测试、可追踪边界清楚的修订请求。**

---

## 1. 当前代码基线

以下判断都基于最新 PR29 分支的实际代码，不再沿用 PR28 或 desktop plan 之前的假设。

### 1.1 项目当前仍是 `renderer + api` 双 workspace 主体

仓库当前主要工作包仍然是：

- `@narrative-novel/renderer`
- `@narrative-novel/api`

根脚本已经覆盖：

- `dev:api`
- `dev:renderer`
- `typecheck`
- `test`
- `build`
- `storybook`

也就是说，现在的主线不是纯 renderer 原型，也不是完整生产后端，而是 **fixture-backed API + renderer integration** 阶段。

### 1.2 PR29 的 Scene Prose Generation 纵切已经成立

PR29 已经让 accepted review decision materialize 出：

- canon patch artifact
- prose draft artifact
- run trace links
- scene prose read model
- chapter prose status refresh

API 测试也已经覆盖：

```text
start scene run
-> inspect proposal variants
-> submit selected variant review decision
-> materialize canon patch + prose draft artifact
-> GET scene prose
-> prose trace summary references source patch / proposals / facts
```

这意味着下一轮不需要再证明“accept 后能不能出现 prose”。这件事已经成立。

### 1.3 run event / artifact / trace discipline 已经建立，PR30 不能打破

PR29 后的纪律是：

- event stream 只放轻量 event 与 refs
- 大 context / prose / patch / proposal details 放 artifact detail / trace detail
- `events/stream` 仍是 501，占位而不是真实 SSE
- renderer 仍使用 REST polling/page contract

PR30 不能为了 revision 把 prose 文本、prompt、context packet 直接塞进 run event。

### 1.4 当前最明显的真实缺口：`reviseSceneProse(...)` 仍为空实现

当前 API 已经有：

```text
POST /api/projects/:projectId/scenes/:sceneId/prose/revision
```

route 会校验 `revisionMode`，然后调用 repository 的 `reviseSceneProse(projectId, sceneId, revisionMode)`。

但 fixture repository 中该方法当前仍是 no-op。

与此同时，renderer 里 `SceneProseContainer` 已经会：

```text
call effectiveClient.reviseSceneProse(sceneId, selectedMode)
-> refetch scene prose
```

`SceneProseTab` 也已经有：

- revision mode selector
- `Revise Draft` action
- revision queue / latest diff display

所以 PR30 的切入点非常明确：

> UI 已经有按钮，API route 已经有入口，mock 测试已经有修订语义；真正缺的是 fixture API repository 的写路径与对应集成测试。

---

## 2. 推荐后续顺序

### 主线

```text
PR30：Scene Prose Revision API-backed Vertical Slice
PR31：Chapter / Book Draft Assembly Regression after Scene Prose Mutation
PR32：Run Debug / Context Packet Inspector（视 PR30/31 后体验决定）
PR33+：真实 orchestration backend / worker / model gateway 纵切
```

### 桌面线

Desktop 线可以并行，但不能抢 PR30 主线：

```text
Desktop-PR0：Desktop Architecture Decision Doc（如果还没有正式入仓）
Desktop-PR1：Electron Thin Shell
Desktop-PR2：Local API Supervisor（等 API health/runtime config 更稳定后）
```

桌面端当前应该被视为 **parallel platform track**，不是 PR30 的替代目标。

---

## 3. PR30 的唯一目标

## Scene Prose Revision API-backed Vertical Slice

让用户在 API runtime 下也可以对已经 materialized 的 scene prose 发起 revision request，并且 revision 结果能通过现有 prose query / inspector / dock 被看到。

PR30 完成后，用户应该能：

1. 接受 selected proposal variant，生成 prose draft。
2. 打开 Scene / Draft 的 prose tab。
3. 选择 revision mode，例如 `tighten` / `expand` / `continuity_fix`。
4. 点击 `Revise Draft`。
5. API fixture repository 真实更新 scene prose read model。
6. prose query refetch 后显示：
   - revision queued count 增加
   - latest diff summary 更新
   - prose status 进入 revision queued / review-needed 状态
   - 原有 trace summary 不丢失
7. Chapter / Book 聚合面能至少看到 prose status 的变化。

一句话说：

> **PR30 不是做真正 AI rewrite，而是先把“修订请求进入产品状态”这条 API-backed 写路径做实。**

---

## 4. PR30 明确不做

以下内容不要混进 PR30：

- 不做真实 LLM rewrite
- 不做 Temporal / durable workflow
- 不做真实 SSE / `events/stream`
- 不做真实 DB migration
- 不做 prompt editor
- 不做 Context Packet Inspector 主界面
- 不做 Asset Context Policy mutation
- 不做 Domain-safe Recipes
- 不做 Spatial Blackboard / Blender
- 不做 Desktop Electron 代码
- 不做 Book / Chapter 新 lens
- 不做 branch / publish / export
- 不做 full diff editor
- 不做 scene chunk anchor route

PR30 仍然是 fixture-backed API vertical slice。

---

## 5. 必须遵守的硬约束

### 5.1 prose revision 不能绕过 artifact / trace discipline

PR30 可以更新 scene prose read model，但不能把大 prose payload 写进 run event。

正确做法：

```text
scene prose state:
  proseDraft
  latestDiffSummary
  revisionQueueCount
  statusLabel
  traceSummary

run event:
  only lightweight refs, if any
```

### 5.2 第一个版本只做 revision request / queued state，不做真实改稿

当前接口是：

```text
POST /scenes/:sceneId/prose/revision -> 204
```

这类接口非常适合先表达“修订请求已入队 / 已准备给 review”，而不是同步生成一版新 prose。

PR30 第一版建议：

- 不改写 `proseDraft` 主体文本。
- 增加 `revisionQueueCount`。
- 更新 `latestDiffSummary`。
- 更新 `statusLabel` / `proseStatusLabel`。
- 在 dock activity / timeline 中记录 revision request。

这样可以让 UI 反馈成立，又不会假装已经有真实 rewrite agent。

### 5.3 没有 prose draft 时不能静默成功

如果 scene 还没有 prose draft，`POST /prose/revision` 不应该 no-op 204。

建议返回：

```text
409 SCENE_PROSE_REVISION_DRAFT_REQUIRED
```

或项目现有错误体系中等价的 `badRequest/conflict` 形态。

必须保证：

- 没有 prose 时不更新状态。
- 测试明确覆盖。
- renderer 能继续显示已有 error boundary / toast / inline error。

### 5.4 不能新增 route 真源

不要新增：

- `revisionMode` route param
- `selectedRevisionId`
- `draftRevisionId`
- `revisionPanel`

revision mode 仍然是 `SceneProseContainer` 内的局部 UI state。

### 5.5 不改 scene prose query identity

保持：

```text
sceneQueryKeys.prose(sceneId, locale)
```

不要把 revision mode、runId、artifactId 塞进 prose query key。

### 5.6 PR29 的 accept / reject / request-rewrite 行为不能回归

继续保持：

- accept / accept-with-edit 会 materialize canon patch + prose。
- request rewrite 不覆盖 prose。
- reject 不覆盖 prose。
- events 不内联 prose payload。
- selected variant 仍能进入 canon/prose trace。

---

## 6. PR30 建议文件改动

### 6.1 API 必改

```text
packages/api/src/repositories/fixtureRepository.ts
packages/api/src/routes/scene.ts
packages/api/src/contracts/project-runtime.ts 或相关 contract 类型文件（如需要新增错误码）
packages/api/src/orchestration/sceneRun/sceneRunProseRevision.ts（推荐新增）
packages/api/src/orchestration/sceneRun/sceneRunProseRevision.test.ts（推荐新增）
```

### 6.2 API 推荐新增 helper

新增：

```text
packages/api/src/orchestration/sceneRun/sceneRunProseRevision.ts
```

建议导出：

```ts
export type SceneProseRevisionMode = 'tighten' | 'expand' | 'continuity_fix'

export function applySceneProseRevisionRequest(input: {
  prose: SceneProseViewModel
  revisionMode: SceneProseRevisionMode
  locale: Locale
}): SceneProseViewModel
```

第一版语义：

- 保留 `proseDraft`
- 保留 `traceSummary`
- `revisionQueueCount += 1`
- `latestDiffSummary` 根据 revision mode 生成稳定文案
- `statusLabel` 更新为 `Revision queued` / 对应本地化文案
- 必要时 `warningsCount` 不变

### 6.3 Renderer 可选但推荐

当前 `SceneProseContainer` 直接管理 revision mutation。PR30 可以先不重构，但推荐抽出 hook：

```text
packages/renderer/src/features/scene/hooks/useReviseSceneProseMutation.ts
```

职责：

- 调用 `effectiveClient.reviseSceneProse(sceneId, revisionMode)`
- 成功后 invalidate / refetch prose query
- 不做 optimistic prose text rewrite
- 暴露 `isPending / error`

如果抽 hook 导致范围膨胀，可以只保留 container 当前写法，把重点放在 API-backed 行为和测试。

### 6.4 Storybook 推荐

```text
packages/renderer/src/features/scene/components/SceneProseTab.stories.tsx
```

补充状态：

- `GeneratedFromAcceptedRun`
- `RevisionQueued`
- `NoDraftCannotRevise`

---

## 7. API 实施细节

### Step 1：新增 revision pure helper

先写纯函数，不要直接在 repository 里散写 mutation。

建议行为：

```ts
const REVISION_DIFF_SUMMARY = {
  tighten: 'Latest revision: tighten pass queued for review.',
  expand: 'Latest revision: expansion pass queued for review.',
  continuity_fix: 'Latest revision: continuity pass queued for review.',
}
```

如果项目当前已有中英文 locale helper，则用项目已有 localize 工具；如果没有，第一版可以保持英文 fixture 文案，但不要把文案散落在多个文件。

### Step 2：实现 `fixtureRepository.reviseSceneProse(...)`

当前 no-op 改为：

1. 找到 project。
2. 找到 scene。
3. 如果 `scene.prose?.proseDraft` 为空，抛出 conflict / domain error。
4. 调用 pure helper 更新 `scene.prose`。
5. 同步 scene workspace / inspector / dock 中能看到的 prose revision state。
6. 同步 chapter record 中该 scene 的 `proseStatusLabel`。
7. 如已有 book rollup 从 chapter/scene prose query 派生，不单独复制 book state。

推荐新增 repository 内部 helper：

```ts
function syncChapterSceneProseRevisionStatus(project, sceneId, prose)
function appendSceneDockRevisionEvent(scene, revisionMode)
```

### Step 3：保持 route contract 不变

`scene.ts` 现有 route 已经存在。PR30 尽量只补错误处理。

建议错误：

```text
SCENE_PROSE_REVISION_DRAFT_REQUIRED
SCENE_NOT_FOUND
PROJECT_NOT_FOUND
INVALID_REVISION_MODE
```

如果项目已有统一 error mapper，使用现有 mapper；不要新增第二套错误响应格式。

### Step 4：不要新增 run event 大 payload

如果要记录 revision activity，优先写入 scene dock event / activity，而不是 run event。

如果确实需要 run event，也只能是：

```ts
{
  kind: 'prose_revision_requested',
  refs: [{ kind: 'prose-draft', id: '...', label: ... }]
}
```

但 PR30 第一版建议不扩 `RunEventKind`，避免把 revision request 混进 run timeline 的状态机。

---

## 8. Renderer 实施细节

### 8.1 保持现有 Scene Prose 主交互

当前 UI 已经有：

- revision mode selector
- source summary
- `Revise Draft` button
- revision status / diff summary

不要重做 UI。

PR30 只需要让 API-backed runtime 下按钮真的产生变化。

### 8.2 推荐新增 hook，但不要大改 container

如果新增 `useReviseSceneProseMutation.ts`，建议容器变成：

```ts
const reviseMutation = useReviseSceneProseMutation({ sceneId })

const handleRevise = async () => {
  await reviseMutation.mutateAsync(selectedMode)
}
```

hook 内部：

```ts
await effectiveClient.reviseSceneProse(sceneId, mode)
await queryClient.invalidateQueries({ queryKey: sceneQueryKeys.prose(sceneId, locale) })
```

如果 current code 没有方便拿 `queryClient`，保留 `proseQuery.refetch()` 也可以。

### 8.3 错误状态

没有 prose draft 时，UI 应显示现有 error message；不要让按钮永远 spinning。

如果当前 `SceneProseTab` 没有 error prop，可以先只让 container 解除 pending，并依赖 app-level error log；但测试必须确认 failed revision 不会改变已有 prose。

---

## 9. 测试方案

### 9.1 API pure helper 测试

新增：

```text
sceneRunProseRevision.test.ts
```

至少覆盖：

1. `tighten` 会增加 `revisionQueueCount`。
2. `expand` 会更新 `latestDiffSummary`。
3. `continuity_fix` 不会清空 `traceSummary`。
4. revision 不会修改 `proseDraft` 主体。
5. revision 不会修改 source patch / source proposals / accepted facts。

### 9.2 API route / repository 集成测试

新增或扩展现有 API 流程测试。

建议用一条完整路径：

```text
POST /scenes/:sceneId/runs
-> submit accept review decision
-> GET /scenes/:sceneId/prose，确认 prose 已生成
-> POST /scenes/:sceneId/prose/revision { revisionMode: 'tighten' }
-> GET /scenes/:sceneId/prose
-> revisionQueueCount = 1
-> latestDiffSummary 已更新
-> traceSummary 仍引用原 canon patch / selected proposal
-> proseDraft 不被覆盖
```

再补一条错误路径：

```text
scene 没有 proseDraft
-> POST /prose/revision
-> 409 / expected error
-> scene prose 状态不变
```

再补一条聚合路径：

```text
revision 后 GET /chapters/:chapterId/structure
-> 对应 scene 的 proseStatusLabel 显示 Revision queued / 等价状态
```

### 9.3 Renderer 测试

现有 `SceneProseContainer.test.tsx` 已经覆盖 mock revision 行为。PR30 应增加 API-backed 或 bridge-backed path：

```text
render SceneProseContainer with API runtime fixture
-> click Revise Draft
-> expect effectiveClient.reviseSceneProse called
-> expect prose query refetched
-> expect latest diff summary / revision queue 更新
```

如果 renderer test 不方便接 API server，则至少补 hook test：

```text
useReviseSceneProseMutation calls client and invalidates/refetches prose query
```

### 9.4 App smoke 推荐

推荐增加一条低成本 smoke：

```text
打开 scene draft prose
-> 已有 PR29 materialized prose
-> 点击 Revise Draft
-> prose tab 显示 revision queued
-> 从 scene 切到 chapter draft/book draft
-> 对应 prose status 不丢
```

如果 smoke 成本过高，可留到 PR31。

---

## 10. PR30 完成后的验收标准

满足以下条件，PR30 就算完成：

1. `fixtureRepository.reviseSceneProse(...)` 不再是 no-op。
2. `POST /scenes/:sceneId/prose/revision` 在 API runtime 下能真实更新 scene prose read model。
3. revision 不改写 prose 主体，只更新 revision queue / diff summary / status。
4. 没有 prose draft 时返回明确错误，不静默 204。
5. revision 后 `SceneProseContainer` refetch 能看到新状态。
6. revision 不丢失 PR29 建立的 trace summary。
7. revision 后 chapter/book 聚合至少能看到 prose status 变化。
8. PR29 的 accept / reject / request-rewrite 流程不回归。
9. run events 仍不内联大 prose payload。
10. PR30 不包含真实 LLM、Temporal、SSE、Desktop、branch、publish、export。

---

## 11. PR30 结束时不要留下的债

以下情况都算 PR 做偏了：

- revision API 仍然 204 no-op。
- revision 直接覆盖 `proseDraft`，但没有 artifact / trace 来源。
- revision 把完整 prose 写进 run event。
- 没有 prose draft 时也返回 204。
- 为 revision 新增 route state 或 selected revision store。
- 为 revision 重写 Scene Prose UI。
- 顺手做真实 LLM rewrite。
- 顺手做 Temporal / SSE。
- 顺手做 Desktop Electron。
- 因 revision 破坏 PR29 的 selected variant -> canon patch -> prose trace。

PR30 做完后的正确状态应该是：

> **Scene prose 不仅能从 accepted run artifact 生成，也能通过 API-backed revision request 进入可见的 review/queued 状态；但真实 rewrite agent、durable workflow 和 branch/publish 仍然留给后续。**

---

## 12. PR31 建议：Chapter / Book Draft Assembly Regression after Scene Prose Mutation

PR30 完成后，PR31 不应该马上做新大功能，而应该补一次跨 scope 回归：

### 目标

确保 Scene prose 生成与 revision 状态能稳定反映到：

- Chapter Draft
- Book Draft Read
- Book Draft Compare
- trace/readiness summaries

### 建议范围

- 更新 chapter draft view-model，让 revision queued scenes 有清晰状态。
- 更新 book draft / compare，让 revision queue 和 warning delta 可见。
- 增加从 Scene revision 后返回 Chapter/Book 的 smoke。
- 不做真实 rewrite。
- 不做 publish/export。

### 验收

```text
scene prose revision
-> chapter draft selected section status refreshes
-> book draft selected chapter status refreshes
-> book compare can show revised/queued prose signal
```

---

## 13. Desktop 线建议

你已经完成 `desktop-pr-plan`，但当前 PR30 不应实现桌面代码。

推荐并行节奏：

### Desktop-PR0：Architecture Decision Doc

如果 desktop plan 已经入仓，可只补 ADR：

```text
doc/desktop-architecture-decision.md
```

写清楚：

- Electron 是 shell，不是 product backend。
- Renderer web-first。
- API 独立进程。
- Worker 独立进程。
- Renderer 不碰 Node / fs / child_process / raw ipcRenderer。

### Desktop-PR1：Electron Thin Shell

只做：

- `apps/desktop`
- Electron main / preload
- dev 加载 Vite renderer
- prod 加载 renderer build
- 安全 webPreferences
- minimal menu

不做：

- API supervisor
- local DB
- worker
- packaging
- auto update

### Desktop-PR2：Local API Supervisor

等 API health/runtime config 稳定后再做：

- spawn local API
- health check
- runtime config injection
- app quit cleanup

---

## 14. 给 AI agent 的执行顺序

### Step 1

先新增 API pure helper：

```text
packages/api/src/orchestration/sceneRun/sceneRunProseRevision.ts
```

并补 pure unit tests。

### Step 2

实现 `fixtureRepository.reviseSceneProse(...)`：

- 找 scene
- 校验 proseDraft 存在
- 应用 revision helper
- 同步 scene/chapter 状态
- 追加轻量 activity

### Step 3

补 API route / repository tests：

- accepted run 后 revision 成功
- no prose draft 时失败
- trace summary 不丢
- prose body 不被覆盖
- chapter structure status refresh

### Step 4

Renderer 侧最小接线：

- 保留现有 SceneProseContainer UI
- 可选抽 `useReviseSceneProseMutation`
- 确保 API-backed revision 后 refetch 生效

### Step 5

补 renderer tests / story：

- revision queued state
- no draft error/disabled state
- existing PR29 prose state 不回归

### Step 6

更新文档：

- `doc/api-contract.md` 或对应 API contract 文档
- README 当前状态一句话可选

---

## 15. 给 AI 的最终一句话指令

在当前 `codex/pr29-scene-prose-generation-vertical-slice` 已完成 PR29 的前提下，不要继续铺新的 context/policy 地基，也不要把 Desktop 线混进主线；先只围绕 **Scene Prose Revision API-backed Vertical Slice** 做一轮窄而实的实现：

- 保持 PR29 的 selected variant -> canon patch -> prose artifact -> trace discipline 不变。
- 把 `fixtureRepository.reviseSceneProse(...)` 从 no-op 改成真实 fixture mutation。
- 让 `POST /scenes/:sceneId/prose/revision` 更新 revision queue / diff summary / prose status。
- 没有 prose draft 时返回明确错误。
- 不改写 prose body，不伪造真实 rewrite artifact。
- 保持 scene prose query identity 不变。
- 让 renderer 现有 `Revise Draft` 按钮在 API runtime 下能 refetch 到新状态。
- 用测试固定 API revision、trace 不丢、chapter/book 聚合不乱、PR29 run flow 不回归。
- 明确不做真实 LLM、Temporal、SSE、Desktop、branch、publish、export。
