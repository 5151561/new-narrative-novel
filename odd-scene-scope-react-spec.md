# ODD 前端下一步：Scene Scope 详细规格（React + Tailwind + AI 开发友好）

## 0. 这份文档解决什么

这份文档是把你已经确认的方向，继续往下拆到 **可直接交给 AI 连续开发** 的层级。

它主要回答 6 件事：

1. `Scene Scope` 的主舞台到底长什么样。
2. React 组件应该怎么拆，避免又长回“聊天页”或“大一统页面组件”。
3. Tailwind 应该先抽哪些 primitives，避免 AI 写出一堆互不兼容的面板。
4. 前端状态边界怎么分，避免 Query / Zustand / local state 混乱。
5. Scene 的前端动作怎样映射到现有 runtime / patch / consistency 闭环。
6. 下一轮 AI 开发应该按什么顺序落地。

---

## 1. 本阶段的产品判断

## 1.1 Scene 是导演台，不是聊天页

你已经确认的产品前提是：

- 产品主结构应收口到统一的 `Orchestration Workbench`；
- `Scene` 的 `Execution Flow` 不是纯日志页，而是“运行 + 审阅 + 裁决”的一体化主舞台；
- 中间主区承接原 `Review` 的核心裁决动作；
- 右侧 `Context / Versions` 只能做 inspect 和 override，不能重新长成第二主舞台；
- 原 `Scene Run`、`Patch Review`、`CharacterInteractionPage` 中与正式 orchestration 有关的内容，都应吸收到 `Scene` scope 中。 

所以这一层的实现目标不是“把旧页面搬进来”，而是把 `Scene` 真正做成 **导演台**。

## 1.2 Scene 的中心不是角色消息，而是 Scene Manager

你现在的章内结构已经不是 `chapter agent -> character agent` 直连，而是：

`Book Agent -> Chapter Agent -> Scene Manager Subagent -> Character Agents -> Scene-level Proposals -> Scene Summary -> Chapter Agent -> Prose Agent`

所以前端里真正居中的对象应该是：

- Scene objective
- beat / chunk 推进
- proposal review
- accepted state
- scene summary

而不是：

- 原始对话流
- 模型日志墙
- “多个 agent 在聊天”的可视化噪音

---

## 2. Scene Scope 的稳定信息架构

## 2.1 Scene 的三段式标签

Scene 保持三段式：

- `Setup`
- `Execution`
- `Prose`

其中：

### Setup
负责定义这场戏开始前的条件：

- scene objective
- cast / location / props
- scene constraints
- initial knowledge boundaries
- run preset / strategy

### Execution
负责这场戏的正式推进：

- run state
- beat / chunk 进度
- proposal review
- consistency / warnings 摘要
- accepted facts / scene summary

### Prose
负责“结果 / 产物”：

- prose draft
- compare / revision
- continuity notes
- export to chapter / focus read

## 2.2 Scene 页面默认入口

默认打开：

`Scene / Orchestrate / Execution`

原因：

- 这是产品的主差异点；
- 这是用户最常待的位置；
- 这能避免首屏退回 Setup 表单页的管理感；
- 也能避免直接进入 Prose，导致 orchestration 层被弱化。

只有新建 scene 时，才默认进 `Setup`。

---

## 3. Scene 主舞台结构

## 3.1 中间主舞台分为 4 层

```txt
┌─────────────────────────────────────────────────────────────────────┐
│ Scene Header                                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Objective Strip                                                    │
├───────────────┬─────────────────────────────────────────────────────┤
│ Beat Rail     │ Proposal Review Stack                              │
│               │                                                     │
│               │                                                     │
├───────────────┴─────────────────────────────────────────────────────┤
│ Accepted State Footer                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### A. Scene Header
只负责对象级信息和轻量动作：

- breadcrumb
- scene title
- status badge
- run status badge
- thread / branch switcher
- export trigger
- focus mode trigger（仅在 Prose 可用）

### B. Objective Strip
这是导演台的“当前任务说明”。

固定显示：

- goal
- tension / pacing
- cast summary
- location
- warnings summary
- unresolved count

可折叠次级信息：

- active constraints
- required plot threads
- memory anchors
- private info guard summary

### C. Beat Rail
这是“场面推进的结构感”，不是时间轴摆设。

应支持：

- 已完成 beat / chunk
- 当前进行中 chunk
- 待处理 chunk
- 每个 beat 的 status / warnings / proposal count
- 点击切换右侧 proposal stack 的上下文过滤

### D. Proposal Review Stack
这是 Scene 的核心操作区。

每张 `ProposalCard` 至少包含：

- actor / source
- proposal kind
- summary
- affected state / impact tags
- relation to current beat
- optional evidence / trace peek
- actions: `Accept` / `Edit Then Accept` / `Request Rewrite` / `Reject`

### E. Accepted State Footer
这是“当前 canon-ready 结果”的固定汇总层。

至少显示：

- latest accepted scene summary
- accepted facts preview
- readiness for prose
- continue run / pause run / open prose

---

## 4. 详细组件树（Scene 专项）

## 4.1 顶层组合

```txt
SceneWorkspace
├── SceneHeader
├── SceneTabBar
├── SceneTabPanel
│   ├── SceneSetupTab
│   ├── SceneExecutionTab
│   └── SceneProseTab
├── SceneInspectorBindings
└── SceneDockBindings
```

---

## 4.2 SceneWorkspace

### 职责

- 读取当前 route 的 `sceneId / tab / lens`
- 根据 tab 选择容器组件
- 不直接写任何业务逻辑
- 不承担复杂 mutation

### Props

```ts
interface SceneWorkspaceProps {
  sceneId: string
  defaultTab?: 'setup' | 'execution' | 'prose'
}
```

### 只做这几件事

- `useSceneWorkspaceQuery(sceneId)`
- `useSceneRouteState()`
- `useSceneWorkspaceActions(sceneId)`
- 根据 tab 渲染对应容器

---

## 4.3 SceneHeader

### 职责

- 展示对象级信息
- 承载非核心但与当前 scene 相关的动作
- 不负责 run orchestration

### Props

```ts
interface SceneHeaderProps {
  scene: SceneHeaderModel
  onOpenExport: () => void
  onSwitchThread: (threadId: string) => void
  onOpenVersions: () => void
}

interface SceneHeaderModel {
  id: string
  title: string
  chapterTitle: string
  status: 'draft' | 'running' | 'review' | 'ready' | 'committed'
  runStatus: 'idle' | 'running' | 'paused' | 'failed' | 'completed'
  pendingProposalCount: number
  lastUpdatedAt: string
  activeThreadId?: string
}
```

### 视觉纪律

- 标题区尽量平静，不要塞满工程 badge
- 运行状态要清晰，但不能像 CI 面板
- 右上角只放：`Thread`、`Versions`、`Export`

---

## 4.4 SceneSetupTab

### 结构

```txt
SceneSetupTab
├── SceneIdentitySection
├── SceneObjectiveSection
├── SceneCastSection
├── SceneConstraintSection
├── SceneKnowledgeBoundarySection
├── SceneRuntimePresetSection
└── SceneSetupActionBar
```

### 关键表单字段

#### SceneIdentitySection
- title
- scene type
- chapter relation
- pov

#### SceneObjectiveSection
- immediate objective
- emotional beat
- conflict intent
- exit condition

#### SceneCastSection
- cast list
- primary actor
- hidden participants
- props
- location binding

#### SceneConstraintSection
- must happen
- must not happen
- tone constraint
- continuity reminders

#### SceneKnowledgeBoundarySection
- public facts in scene
- character-known facts
- hidden facts
- reveal restrictions

#### SceneRuntimePresetSection
- strategy preset
- runtime profile override summary
- safety / strictness level

### Setup 页动作

- `Save Draft`
- `Save And Run`
- `Discard Changes`

### 不该出现的内容

- 原始 trace
- patch 审核主动作
- 版本历史主视图

---

## 4.5 SceneExecutionTab

### 结构

```txt
SceneExecutionTab
├── SceneObjectiveStrip
├── SceneExecutionBody
│   ├── BeatRail
│   └── ProposalReviewStack
└── AcceptedStateFooter
```

### SceneExecutionTab 容器职责

- 读取 execution 视图所需聚合数据
- 提供当前选中 beat / proposal
- 串联 proposal actions
- 读取轻量 consistency / warning 摘要

### Props

```ts
interface SceneExecutionTabProps {
  sceneId: string
  runId?: string
}
```

---

## 4.6 SceneObjectiveStrip

### 职责

把“这场戏现在要达成什么”钉在用户面前。

### Props

```ts
interface SceneObjectiveStripProps {
  objective: SceneObjectiveModel
  onOpenConstraints: () => void
  onOpenCastEditor: () => void
}

interface SceneObjectiveModel {
  goal: string
  tensionLabel?: string
  pacingLabel?: string
  cast: Array<{ id: string; name: string; role?: string }>
  location?: { id: string; name: string }
  warningsCount: number
  unresolvedCount: number
  constraintSummary: string[]
}
```

### UI 建议

- 第一行是 goal
- 第二行是 cast / location / tension / warnings
- 右侧给 `Edit Setup` 小入口
- 绝不要把它做成多层卡片墙

---

## 4.7 BeatRail

### 职责

给 orchestration 一个“推进结构”，让用户能清楚知道：

- 戏演到哪一步了
- 哪个 beat 出了问题
- 哪个 beat 积压了 proposal

### Props

```ts
interface BeatRailProps {
  beats: BeatRailItemModel[]
  selectedBeatId?: string
  onSelectBeat: (beatId: string) => void
  onContinueFromBeat?: (beatId: string) => void
}

interface BeatRailItemModel {
  id: string
  index: number
  title: string
  status: 'todo' | 'running' | 'review' | 'accepted' | 'blocked'
  proposalCount: number
  warningCount: number
  summary?: string
}
```

### 设计判断

- `BeatRail` 要更像 “剧情推进列表”，不要像 gantt 图
- MVP 不做可拖拽排序
- 当前 beat 高亮 + sticky 到可见区

---

## 4.8 ProposalReviewStack

### 职责

承载 Scene 的主要审阅与裁决动作。

### 结构

```txt
ProposalReviewStack
├── ProposalFilterBar
├── ProposalList
│   └── ProposalCard*
├── ProposalEmptyState
└── ProposalBatchFooter
```

### Props

```ts
interface ProposalReviewStackProps {
  proposals: ProposalCardModel[]
  selectedProposalId?: string
  filters: ProposalFilters
  onChangeFilters: (next: ProposalFilters) => void
  onSelectProposal: (proposalId: string) => void
  onAccept: (proposalId: string) => void
  onEditAccept: (proposalId: string, draft: ProposalEditInput) => void
  onRequestRewrite: (proposalId: string, note?: string) => void
  onReject: (proposalId: string, reason?: string) => void
}

interface ProposalFilters {
  status?: 'pending' | 'accepted' | 'rejected' | 'rewrite-requested'
  kind?: 'action' | 'intent' | 'conflict' | 'state-change' | 'dialogue'
  beatId?: string
  actorId?: string
  severity?: 'info' | 'warn' | 'high'
}
```

### ProposalCard

```ts
interface ProposalCardModel {
  id: string
  beatId?: string
  actor: {
    id: string
    name: string
    type: 'scene-manager' | 'character' | 'system'
  }
  kind: 'action' | 'intent' | 'conflict' | 'state-change' | 'dialogue'
  title: string
  summary: string
  detail?: string
  status: 'pending' | 'accepted' | 'rejected' | 'rewrite-requested'
  impactTags: string[]
  affects: Array<{
    path: string
    label: string
    deltaSummary: string
  }>
  risks?: Array<{
    severity: 'info' | 'warn' | 'high'
    message: string
  }>
  evidencePeek?: string[]
  sourceTraceId?: string
}
```

### 关键交互纪律

#### Accept
表示“我认可这条 proposal 可以进入 accepted state / patch review 流程”。

#### Commit
不是在这里发生。

commit 仍应通过 patch 流程走正式写回，不和 accept 混为一步。

#### Edit Then Accept
必须是轻量局部改写，不是打开一个全屏编辑器。

#### Request Rewrite
用于把问题退回给 orchestration 层，保留上下文，不直接删除候选。

#### Reject
明确丢弃，不并入 scene accepted state。

---

## 4.9 AcceptedStateFooter

### 职责

这个区域要让用户知道：

- 目前已经被接受了什么
- 这场戏是否已经可以转 prose
- 下一步是继续 run、进入 prose，还是回 setup

### Props

```ts
interface AcceptedStateFooterProps {
  summary: SceneAcceptedSummaryModel
  onContinueRun: () => void
  onOpenProse: () => void
  onOpenPatchPreview: () => void
}

interface SceneAcceptedSummaryModel {
  sceneSummary: string
  acceptedFacts: Array<{ id: string; label: string; value: string }>
  readiness: 'not-ready' | 'draftable' | 'ready'
  pendingProposalCount: number
  warningCount: number
  patchCandidateCount?: number
}
```

### 视觉建议

- 固定在 execution 页底部
- 上半区是 scene summary
- 下半区是 accepted facts / readiness / actions
- 这是“稳定汇总层”，不是第二个 proposal 区

---

## 4.10 SceneProseTab

### 结构

```txt
SceneProseTab
├── ProseToolbar
├── ProseDraftReader
├── ProseComparePanel (optional)
├── RevisionActionBar
└── ProseStatusFooter
```

### 职责

- 展示当前 prose draft
- 发起 `reviseScene`
- 展示 diff summary
- 进入 focus mode

### 初始支持的 revision 类型

- `rewrite`
- `compress`
- `expand`
- `tone_adjust`
- `continuity_fix`

### 不该提前做的内容

- chapter 批量 revision
- publication formatting
- 富文本排版器

---

## 4.11 右侧 Inspector（Scene 专项）

Scene 下右侧推荐 3 个 tab：

- `Context`
- `Versions`
- `Runtime`

如果你想保持整个产品统一为两 tab，也可以把 `Runtime` 并入 `Context` 的子节。

### ContextPanel

显示：

- accepted facts
- private info guard
- character knowledge boundaries
- local state snapshot
- runtime overrides summary

### VersionsPanel

显示：

- scene-level checkpoints
- proposal acceptance timeline
- patch candidate timeline
- latest commit / restore points

### RuntimePanel

只显示：

- active profile summary
- run health
- latency / token / cost summary
- latest failure summary

不显示：

- 原始 stdout / stderr 墙
- 底层 runtime 参数洪水

---

## 4.12 Bottom Dock（Scene 专项）

底部 dock 才是吃掉工程诊断噪音的地方。

推荐 tab：

- `Events`
- `Trace`
- `Consistency`
- `Problems`
- `Cost`

### Events
面向作者的运行事件时间线。

### Trace
给工程/诊断看，但默认折叠深层内容。

### Consistency
显示完整一致性 issue list 与 source references。

### Problems
显示失败、schema error、patch validation error。

### Cost
按 run / chunk 汇总成本和时延。

---

## 5. React + Tailwind 目录落点

```txt
src/
  features/
    scene/
      api/
        scene-client.ts
      components/
        SceneHeader.tsx
        SceneTabBar.tsx
        SceneObjectiveStrip.tsx
        BeatRail.tsx
        ProposalReviewStack.tsx
        ProposalCard.tsx
        AcceptedStateFooter.tsx
        ProseDraftReader.tsx
      containers/
        SceneWorkspace.tsx
        SceneSetupContainer.tsx
        SceneExecutionContainer.tsx
        SceneProseContainer.tsx
      hooks/
        useSceneWorkspaceQuery.ts
        useSceneExecutionQuery.ts
        useSceneSetupForm.ts
        useProposalSelection.ts
        useProposalActions.ts
        useSceneInspectorData.ts
        useSceneDockData.ts
      store/
        scene-ui-store.ts
      types/
        scene-view-models.ts
  components/
    ui/
      Pane.tsx
      PaneHeader.tsx
      SectionCard.tsx
      Toolbar.tsx
      Badge.tsx
      EmptyState.tsx
      TimelineList.tsx
      SplitRail.tsx
      StickyFooter.tsx
      FactList.tsx
      StatusDot.tsx
```

---

## 6. hooks 详细规格

## 6.1 useSceneWorkspaceQuery

### 职责

聚合 scene 级主数据，供 `SceneWorkspace` 和 header 使用。

```ts
interface UseSceneWorkspaceQueryResult {
  scene: SceneWorkspaceViewModel | undefined
  isLoading: boolean
  error?: Error
  refetch: () => Promise<void>
}
```

### 数据来源

- scene detail
- chapter summary (light)
- pending review counts
- latest run summary

### 注意

不要把 execution 全量事件流塞进这个 query。

---

## 6.2 useSceneExecutionQuery

### 职责

读取 execution 专用聚合数据。

```ts
interface UseSceneExecutionQueryResult {
  objective: SceneObjectiveModel
  beats: BeatRailItemModel[]
  proposals: ProposalCardModel[]
  acceptedSummary: SceneAcceptedSummaryModel
  runtimeSummary: SceneRuntimeSummaryModel
  latestConsistency?: SceneConsistencySummaryModel
  isLoading: boolean
  error?: Error
}
```

### 适合放这里的数据

- beat 列表
- 当前 run 的 proposal 列表
- accepted summary
- warnings summary

### 不适合放这里的数据

- prose 全文
- asset profile detail
- 全量原始 trace

---

## 6.3 useSceneSetupForm

### 职责

管理 setup 表单草稿。

```ts
interface UseSceneSetupFormResult {
  values: SceneSetupFormValues
  dirty: boolean
  updateField: <K extends keyof SceneSetupFormValues>(
    key: K,
    value: SceneSetupFormValues[K]
  ) => void
  reset: () => void
  save: () => Promise<void>
  saveAndRun: () => Promise<void>
}
```

### 状态边界

- 正在编辑的 form values：local / form store
- 已保存定义：Query 数据
- `saveAndRun`：触发 mutation，再切到 execution tab

---

## 6.4 useProposalSelection

### 职责

管理当前选中 proposal / filters / beat 过滤。

```ts
interface UseProposalSelectionResult {
  selectedProposalId?: string
  selectedBeatId?: string
  filters: ProposalFilters
  setSelectedProposalId: (id?: string) => void
  setSelectedBeatId: (id?: string) => void
  setFilters: (next: ProposalFilters) => void
  resetFilters: () => void
}
```

### 放在哪里

放 Zustand 比较合适，因为它属于工作台视图状态，而不是后端真源。

---

## 6.5 useProposalActions

### 职责

封装 proposal 的 4 种主要动作。

```ts
interface ProposalActionInput {
  proposalId: string
  note?: string
  editedSummary?: string
  editedFields?: Record<string, unknown>
}

interface UseProposalActionsResult {
  accept: (input: ProposalActionInput) => Promise<void>
  editAccept: (input: ProposalActionInput) => Promise<void>
  requestRewrite: (input: ProposalActionInput) => Promise<void>
  reject: (input: ProposalActionInput) => Promise<void>
  isMutating: boolean
}
```

### 非常重要的纪律

这个 hook 可以更新：

- proposal review state
- local accepted summary cache
- patch candidate preview list

这个 hook 不应该直接绕过 patch flow 写入主状态。

---

## 6.6 useSceneInspectorData

### 职责

给右侧 inspector 提供分 tab 数据。

```ts
interface UseSceneInspectorDataResult {
  context: SceneContextPanelModel
  versions: SceneVersionsPanelModel
  runtime: SceneRuntimeSummaryModel
  isLoading: boolean
}
```

### 其中 `SceneContextPanelModel` 至少包括

```ts
interface SceneContextPanelModel {
  acceptedFacts: Array<{ id: string; label: string; value: string }>
  knowledgeBoundaries: Array<{
    actorId: string
    actorName: string
    knows: string[]
    hiddenFromActor: string[]
  }>
  localState: Array<{ label: string; value: string }>
  overrides: Array<{ label: string; value: string; source?: string }>
}
```

---

## 6.7 useSceneDockData

### 职责

为底部 dock 提供延迟加载数据。

```ts
interface UseSceneDockDataResult {
  events: SceneEventItem[]
  trace: SceneTraceItem[]
  consistency: SceneConsistencyIssue[]
  problems: SceneProblemItem[]
  cost: SceneCostSummary
}
```

### 实现建议

- dock 未打开时不拉全量 trace
- 只拉 summary
- 用户切到对应 tab 时再 hydrate 详情

---

## 7. 类型与前端 contract 草图

## 7.1 Scene workspace 视图模型

```ts
export interface SceneWorkspaceViewModel {
  id: string
  title: string
  chapterId: string
  chapterTitle: string
  status: 'draft' | 'running' | 'review' | 'ready' | 'committed'
  runStatus: 'idle' | 'running' | 'paused' | 'failed' | 'completed'
  objective: string
  castIds: string[]
  locationId?: string
  latestRunId?: string
  pendingProposalCount: number
  warningCount: number
  currentVersionLabel?: string
}
```

## 7.2 Execution 聚合模型

```ts
export interface SceneExecutionViewModel {
  runId?: string
  objective: SceneObjectiveModel
  beats: BeatRailItemModel[]
  proposals: ProposalCardModel[]
  acceptedSummary: SceneAcceptedSummaryModel
  consistencySummary?: SceneConsistencySummaryModel
  canContinueRun: boolean
  canOpenProse: boolean
}
```

## 7.3 Prose 视图模型

```ts
export interface SceneProseViewModel {
  sceneId: string
  proseDraft?: string
  revisionModes: Array<
    'rewrite' | 'compress' | 'expand' | 'tone_adjust' | 'continuity_fix'
  >
  latestDiffSummary?: string
  warningsCount: number
  focusModeAvailable: boolean
}
```

## 7.4 事件模型

```ts
export interface SceneEventItem {
  id: string
  kind:
    | 'run-started'
    | 'chunk-started'
    | 'proposal-created'
    | 'proposal-accepted'
    | 'proposal-rejected'
    | 'summary-updated'
    | 'patch-preview-ready'
    | 'run-failed'
    | 'run-completed'
  label: string
  at: string
  beatId?: string
  proposalId?: string
  severity?: 'info' | 'warn' | 'high'
}
```

## 7.5 问题模型

```ts
export interface SceneProblemItem {
  id: string
  kind: 'consistency' | 'patch' | 'schema' | 'runtime' | 'boundary'
  severity: 'info' | 'warn' | 'high'
  title: string
  detail?: string
  source?: string
  suggestedAction?: string
}
```

---

## 8. 状态边界设计

## 8.1 Route State

放 URL：

- `scope=scene`
- `id=scene_x`
- `lens=orchestrate | draft | structure`
- `tab=setup | execution | prose`
- `modal=export | settings | revise`
- `proposalId`
- `beatId`

## 8.2 Query State

放 TanStack Query：

- scene workspace summary
- execution aggregate
- prose view data
- inspector data
- versions timeline
- patch preview summary

## 8.3 UI View State

放 Zustand：

- selected proposal
- selected beat
- proposal filters
- dock open state
- active dock tab
- local split widths
- inspector active tab

## 8.4 Local Form State

放局部表单：

- setup 编辑草稿
- edit-then-accept 草稿
- revision note
- prose local edit draft

### 原则

- Query 管真源快照
- Zustand 管工作台视图状态
- Local form 管编辑中内容
- URL 管定位与可恢复上下文

---

## 9. Tailwind 组件策略

## 9.1 先做 primitives，再做业务组件

AI 开发最容易失控的地方，是每个业务组件自己发明 panel / badge / footer / toolbar 样式。

所以先做这些 primitives：

- `Pane`
- `PaneHeader`
- `SectionCard`
- `Toolbar`
- `Badge`
- `StatusDot`
- `StickyFooter`
- `FactList`
- `TimelineList`
- `EmptyState`
- `SplitRail`

## 9.2 推荐 tokens

```css
:root {
  --app-bg: #f3f1ea;
  --surface-1: #faf9f5;
  --surface-2: #f5f4ed;
  --line-soft: #e4e0d4;
  --text-main: #2b2a27;
  --text-muted: #6b675f;
  --accent: #2f5e4e;
  --warn: #9a7a38;
  --danger: #9a4b44;
  --success: #44684d;
}
```

## 9.3 面板类命名建议

```ts
export const scenePanel =
  'rounded-xl border border-[var(--line-soft)] bg-[var(--surface-1)]'

export const sceneMutedPanel =
  'rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)]'

export const stickyFooter =
  'sticky bottom-0 border-t border-[var(--line-soft)] bg-[var(--surface-1)]/95 backdrop-blur'
```

## 9.4 业务组件中的 className 纪律

- 布局用 Tailwind
- 颜色和表面层级走 tokens
- variant 统一由 `cn()` + 小型 variants helper 管理
- 不要在 `ProposalCard` 里硬编码 15 个颜色分支

---

## 10. 现有 runtime / IPC 闭环如何映射到 Scene 前端

## 10.1 必须保留的已有边界

前端仍然必须遵守：

- 所有状态写入走 patch 流程
- `commitStatePatch` 仍是正式写回路径
- renderer 只通过 preload / IPC 访问 runtime
- 不能让 UI 直接碰 adapter / filesystem / SQLite / child_process

## 10.2 Scene 视图当前至少应消费的稳定能力

前端最少可以依赖：

- `narrative.generateNextScene`
- `narrative.commitStatePatch`
- `narrativeState.inspect`
- consistency / patch preview 相关现有能力

## 10.3 Scene 前端动作映射建议

### Generate / Continue Run

第一版可以映射到：

- `generateNextScene`
- 或 `chapter workflow` / `scene run` inspect-resume 的未来 contract

### Accept Proposal

第一版先落为：

- 更新前端 review state
- 产生或更新 patch preview 候选摘要
- 刷新 accepted summary

### Open Patch Preview

进入正式 patch 审核视图或 scene 内嵌 patch preview 抽屉。

### Commit Accepted Changes

仍走：

- patch preview
- patch validate
- `commitStatePatch`

### Revise Prose

后续映射到：

- `reviseScene`

### Open History / Restore

后续映射到：

- patch history / snapshot / restore 相关 contract

---

## 11. Scene 专项前端 client 建议

```ts
export interface SceneClient {
  inspectScene(sceneId: string): Promise<SceneWorkspaceViewModel>
  inspectSceneExecution(sceneId: string): Promise<SceneExecutionViewModel>
  saveSceneSetup(input: SaveSceneSetupInput): Promise<void>
  runScene(input: RunSceneInput): Promise<SceneExecutionViewModel>
  acceptProposal(input: ProposalDecisionInput): Promise<ProposalDecisionResult>
  requestRewrite(input: ProposalDecisionInput): Promise<ProposalDecisionResult>
  rejectProposal(input: ProposalDecisionInput): Promise<ProposalDecisionResult>
  inspectSceneProse(sceneId: string): Promise<SceneProseViewModel>
  reviseScene(input: ReviseSceneInput): Promise<SceneRevisionResult>
  previewAcceptedPatch(sceneId: string): Promise<PatchPreviewResult>
  commitAcceptedPatch(input: CommitStatePatchInput): Promise<CommitStatePatchResult>
}
```

### 注意

这不代表你今天就必须有所有 IPC。

它更像是：

- renderer 的聚合 client 目标形态
- 可以先用现有 runtime 能力拼出来
- 再随着 P2/P3 contracts 演进替换底层实现

---

## 12. 最小可实现版本（MVP for Scene Scope）

## 第一轮必须有

- SceneHeader
- SceneSetupTab
- SceneExecutionTab
- ObjectiveStrip
- BeatRail
- ProposalReviewStack
- AcceptedStateFooter
- Inspector: Context / Versions
- Dock: Events / Problems / Consistency
- Patch preview 入口

## 第一轮可以先简化

- 不做多人分屏
- 不做 drag-and-drop beat 编辑
- 不做复杂 diff 可视化
- 不做 prose 富文本编辑
- 不做 plot graph
- 不做多分支 merge

## 第一轮坚决不做

- 通用聊天 UI
- 原始 runtime 控制台当主界面
- renderer 直连底层状态
- 绕过 patch review 的快捷写回

---

## 13. AI 开发任务链（建议顺序）

## Task 01：壳内接入 SceneWorkspace

目标：

- 在现有 WorkbenchShell 中挂入 `SceneWorkspace`
- 支持 `sceneId + tab` route
- 所有数据先用静态 fixture

验收：

- `Setup / Execution / Prose` 可切换
- 三个 tab 各有稳定空态
- 无真实 runtime 也能展示

## Task 02：实现 SceneExecution 静态骨架

目标：

- 实现 `ObjectiveStrip + BeatRail + ProposalReviewStack + AcceptedStateFooter`

验收：

- 一屏内能读懂 run、beat、proposal、accepted summary 的关系
- 页面不是聊天页
- 页面不是日志页

## Task 03：实现 ProposalCard 与动作条

目标：

- 实现 proposal filter
- 实现 accept / edit accept / request rewrite / reject
- 先接本地 mock actions

验收：

- 动作状态清晰
- Accept 不等于 Commit
- proposal 的影响摘要可读

## Task 04：接入 Query + Scene client

目标：

- 用真实 contract/IPC 替换静态 fixture
- 保持 UI 结构不变

验收：

- loading / error / empty state 完整
- 不引入与 runtime contract 脱节的 UI 私有协议

## Task 05：实现 Inspector

目标：

- Context
- Versions
- Runtime summary（可先并入 Context）

验收：

- 右侧只做 inspect / override
- 不出现主编辑动作

## Task 06：实现 Bottom Dock

目标：

- Events
- Consistency
- Problems
- Trace summary

验收：

- 主舞台不被工程日志污染
- 诊断信息可追溯

## Task 07：实现 SceneProseTab

目标：

- prose 只读展示
- revise actions
- diff summary

验收：

- 支持最小 revision 入口
- 不做复杂发布排版

## Task 08：补测试与 smoke

目标：

- renderer component tests
- IPC integration smoke
- Scene 闭环 smoke

验收：

- `打开 scene -> run -> review -> patch preview -> commit` 路径可走通

---

## 14. 可以直接喂给 AI 的任务提示模板

## Prompt A：生成 SceneExecutionTab 骨架

```md
实现一个 React + TypeScript + Tailwind 的 `SceneExecutionTab`。

要求：
- 不要做聊天 UI。
- 不要做日志流主界面。
- 页面结构必须是：`SceneObjectiveStrip`、`BeatRail`、`ProposalReviewStack`、`AcceptedStateFooter`。
- 所有组件拆到独立文件。
- 先用本地 mock data。
- 不要接真实 API。
- 使用已有 `Pane / SectionCard / Badge / StickyFooter` primitives；如果缺失可以一起补，但要保持风格统一。
- 输出：文件树、组件职责、关键 props、手测方式。
```

## Prompt B：生成 ProposalCard 与动作逻辑

```md
实现 `ProposalCard`、`ProposalFilterBar`、`useProposalSelection`、`useProposalActions`。

要求：
- `Accept`、`Edit Then Accept`、`Request Rewrite`、`Reject` 四种动作分离。
- `Accept` 不等于 `Commit`。
- `ProposalCard` 要显示 actor、kind、summary、impactTags、affected state、risks。
- 所有 mutation 先用 mock async functions 模拟。
- 保持 React 组件单一职责，不要写成一个 500 行组件。
- 输出：改动文件、hook 输入输出、交互说明、未覆盖边界。
```

## Prompt C：接入真实 IPC / contracts

```md
把 `SceneExecutionTab` 从 mock data 改为真实 Query 数据。

要求：
- 只能通过 renderer 侧 client 调 preload / IPC。
- 不允许直接访问 Node、filesystem、SQLite、runtime adapter。
- 不允许创建与 shared contracts 脱节的 UI 私有协议。
- 保持现有 UI 结构不变。
- 补 loading、error、empty、retry。
- 输出：改动文件、数据流说明、如何手测。
```

---

## 15. 这份 Scene 规格最重要的 8 条纪律

1. `Scene` 默认入口是 `Execution`，不是欢迎页。
2. `Execution` 的主角是 Scene Manager 组织的 proposal flow，不是聊天消息。
3. `Accept` 与 `Commit` 必须分离。
4. 右侧 inspector 只做 inspect / override，不做 define / write。
5. 原始 trace 必须下沉到底部 dock。
6. renderer 不能直连 runtime adapter / filesystem / SQLite。
7. 所有状态写回仍走 patch flow。
8. 先做 primitives，再让 AI 写业务组件。

---

## 16. 做完这一份之后，下一份文档该是什么

最顺的下一步不是再谈抽象，而是继续往下出一个：

**《AI 开发任务书（按文件落点 + 验收标准 + 禁改边界）》**

那份文档会进一步把：

- 每个任务要改哪些文件
- 哪些文件不能碰
- 每一步的验收标准
- 每一步的 smoke 方式
- 每一步失败时如何回退

全部写死，方便你直接复制给 AI。
