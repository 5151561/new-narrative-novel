# orchestration-driven-development 前端下一步拆解

## 文档目标

这份文档不是继续讨论“左中右各放什么”，而是把前一个产品方向正式拆成可以交给 AI 按模块连续开发的前端蓝图：

- 信息架构（Information Architecture）
- 首屏与关键工作台线框（Wireframes）
- React + Tailwind 组件树
- 前端状态边界
- 目录结构与实现顺序
- 适合 AI 开发的拆任务方式

---

## 1. 先拍板：前端应该长成什么

### 最终产品形态

你的前端应该是：

**一个面向叙事编排的 Narrative IDE / Orchestration Workbench**

不是：

- 一组页面拼起来的后台
- 一个多标签聊天器
- 一个传统 wiki
- 一个把底层 runtime trace 直接暴露成主界面的控制台

### 对前一版方案的工程化落地结论

我建议正式采用 **5 面工作台壳子**：

1. **Mode Rail**：最左窄栏，切 Lens / 一级模式
2. **Navigator Pane**：对象树、筛选、队列、索引
3. **Main Stage**：真正做事的舞台
4. **Inspector Pane**：Context / Versions / Runtime / Mentions
5. **Bottom Dock**：事件流、trace、warnings、cost、debug

这比原始三栏更适合 orchestration 产品，因为：

- 主任务和诊断信息不再抢空间
- 右侧 inspector 不会被挤成第二主舞台
- 运行态 trace 可以下沉到底部，而不是污染主创作区

---

## 2. React + Tailwind 下的前端技术基线

## 推荐最小栈

建议用：

- **React + TypeScript**
- **Tailwind CSS**
- **React Router**：负责 workbench 路由与 modal route
- **TanStack Query**：负责服务端 / IPC 数据读取缓存
- **Zustand**：负责工作台 UI 状态
- **Zod**：约束前端 contract 解码
- **Radix / shadcn 风格 headless primitives**：只借可访问性和交互骨架，不把视觉交出去

### 为什么这样搭

因为你的项目会让 AI 参与开发，所以需要：

- 组件职责尽量清楚
- 页面不要过胖
- 表单状态、工作台状态、服务端状态三者分离
- 任何一个子模块都能被单独生成、单独替换、单独测试

### 不建议的方向

不建议：

- 上来就 Next.js 全家桶，把桌面工作台思维强行网页化
- 过早引入复杂全局状态框架，把一切都塞进一个 store
- Tailwind 纯散装写法，最后每个组件都是 60 行 className
- 把 runtime trace、scene review、asset detail 都塞进单页组件

---

## 3. 信息架构：Scope × Lens 双轴模型

## 3.1 对象轴：Scope

这是“我在处理什么”。

- **Book**
- **Chapter**
- **Scene**
- **Asset**

## 3.2 工作轴：Lens

这是“我现在以什么方式看它”。

- **Structure**：结构、顺序、节奏、组织
- **Orchestrate**：运行、proposal、review、accept
- **Draft**：正文、对比、阅读、润色
- **Knowledge**：资产、关系、引用、canon

### 为什么要双轴

如果只靠左侧树 + 中间 tab，后面一定会重新长出很多“隐藏页面”。

双轴的好处是：

- Scope 管对象
- Lens 管工作方式
- Tab 只表达当前对象下的局部生命周期，不承担全局导航

这会让 Workbench 从一开始就具备长期可扩展性。

---

## 4. 路由与 URL / 状态设计

## 推荐路由模型

```txt
/workbench?scope=scene&id=scene_12&lens=orchestrate&tab=execution
/workbench?scope=chapter&id=ch_03&lens=structure&tab=sequence
/workbench?scope=asset&id=char_linyuan&lens=knowledge&tab=profile
/workbench?scope=book&id=book_main&lens=draft&tab=manuscript
```

## Modal Route

```txt
/workbench?scope=scene&id=scene_12&lens=orchestrate&tab=execution&modal=export
/workbench?scope=scene&id=scene_12&lens=orchestrate&tab=execution&modal=settings
/workbench?scope=scene&id=scene_12&lens=orchestrate&tab=execution&modal=new-asset
```

### 好处

- 用户始终停留在 workbench
- Export / Settings / Create 不会反客为主变成独立页面
- 深链接与恢复工作区状态都更容易

---

## 5. 顶层布局：Workbench Shell

## 布局示意

```txt
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Command Bar / Breadcrumb / Global Search / Current Project             │
├──────┬──────────────────────┬────────────────────────────────┬──────────────┤
│ Rail │ Navigator            │ Main Stage                     │ Inspector    │
│ 48px │ 280px                │ minmax(0,1fr)                  │ 360px        │
│      │                      │                                │              │
│      │                      │                                │              │
│      │                      │                                │              │
├──────┴──────────────────────┴────────────────────────────────┴──────────────┤
│ Bottom Dock: Event Stream / Trace / Problems / Cost / Debug                │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Tailwind 网格建议

```tsx
<div className="grid h-screen grid-rows-[48px_minmax(0,1fr)_220px] bg-[var(--app-bg)]">
  <TopCommandBar />
  <div className="grid min-h-0 grid-cols-[48px_280px_minmax(0,1fr)_360px]">
    <ModeRail />
    <NavigatorPane />
    <MainStage />
    <InspectorPane />
  </div>
  <BottomDock />
</div>
```

### 这一层只做壳，不做业务

`WorkbenchShell` 只负责：

- 布局
- pane 宽度
- focus mode / dock open-close
- command palette
- modal 挂载点

它不直接请求 Book / Scene / Asset 数据。

---

## 6. 首屏策略：默认打开什么

## 推荐默认规则

### 有最近工作对象时

直接进入上次停留对象。

例：

- 上次在 `Scene 12 / Orchestrate / Execution`
- 下次打开项目就直接恢复这里

### 第一次打开新项目时

进入：

- `Book / Structure / Overview`
- 如果已经有章节与场景，再自动高亮“最近活跃 Scene”

### 原则

首屏不是欢迎页，不是 dashboard。

首屏必须是 **可立即开始工作** 的工作台。

---

## 7. 各 Scope 的 IA 细化

## 7.1 Book

### 推荐主舞台标签

- `Overview`
- `Outline`
- `Manuscript`

### Navigator 应显示

- 全书章节树
- 关键剧情线程
- 近期变更
- 草稿完成度

### Inspector 应显示

- Global Context
- Major Versions
- Active Threads

---

## 7.2 Chapter

### 推荐主舞台标签

- `Setup`
- `Sequence`
- `Prose`

### 核心中间视图

`Sequence` 不应只是列表，而应支持三切换：

- **Outliner**：字段密集查看
- **Board / Corkboard**：以 scene 卡片看节奏
- **Timeline / Sequence**：线性推进与冲突升级

### 为什么这样设计

Chapter 的核心不是“单次运行结果”，而是：

- scene 顺序
- scene 状态
- 章节推进节奏
- 哪些 scene 已跑完、被阻塞、待审阅

---

## 7.3 Scene

### 推荐主舞台标签

- `Setup`
- `Execution`
- `Prose`

### Scene 才是主战场

Scene 是整个产品最应该最先打磨的核心。

中间主舞台默认进入：

- `Scene / Orchestrate / Execution`

因为你的 orchestration 层级里真正居中的不是 chapter 直接对角色，而是 `Scene Manager` 组织本场戏的多角色调度与 proposal 汇总，所以 Scene 主舞台要围绕“导演台”去设计，而不是围绕聊天流去设计。

### Execution 主舞台应分成 4 块

1. **Objective Strip**
   - 当前 scene 目标
   - 约束
   - cast
   - location
   - risk / warnings

2. **Beat / Chunk Rail**
   - 已执行 chunk
   - 当前 chunk
   - 待生成 chunk

3. **Proposal Review Stack**
   - proposal 列表
   - 结构化 diff
   - accept / edit / reject / rerun

4. **Accepted State Footer**
   - 当前 scene summary
   - accepted facts
   - readiness for prose

### 绝对不要把 Execution 做成什么

不要做成：

- 纯日志流
- 聊天消息流
- 底层 agent trace 的可视化墙

trace 应进入 Bottom Dock。

---

## 7.4 Asset

## 我建议你把旧的 Definition / Mentions & Graph 升级为 5 个标签

- `Profile`
- `Mentions`
- `Relations`
- `Timeline`
- `Prompt Guard`

### 这样比旧方案更稳

旧的 `Definition / Mentions & Graph` 太粗。

更适合 AI 开发和长期维护的做法，是把 Asset 拆成五种清晰工作意图：

- 看定义
- 看引用
- 看关系
- 看状态变化
- 看 agent 绑定和私密信息规则

### Asset Index 也不应该只是列表页

Knowledge 模式下的资产总览建议支持：

- Table
- Cards
- Relations View
- Timeline View
- Conflict View

这就是 **Story Graph**，不是传统 wiki。

---

## 8. 三个关键首屏线框

## 8.1 Scene / Orchestrate / Execution

```txt
┌──────────────────────────────── Main Stage ────────────────────────────────┐
│ Breadcrumb: Book > Ch03 > Scene12             Lens: Orchestrate  Tab: Exec │
├─────────────────────────────────────────────────────────────────────────────┤
│ Objective Strip                                                           │
│ [Goal] 让林渊试探沈昭  [Cast] 林渊 沈昭  [Location] 茶楼  [Warnings] 1      │
├──────────────┬──────────────────────────────────────────────────────────────┤
│ Beat Rail    │ Proposal Review Stack                                       │
│              │                                                              │
│ Beat 1 ✓     │ Proposal Card #18                                            │
│ Beat 2 ✓     │ - Actor: 林渊                                                 │
│ Beat 3 →     │ - Intent: 试探                                               │
│ Beat 4 ·     │ - Conflict: 沈昭保持模糊                                     │
│              │ - State Change: 新增怀疑                                     │
│              │                                                              │
│              │ [Accept] [Edit Then Accept] [Request Rewrite] [Reject]       │
│              │ ------------------------------------------------------------ │
│              │ Proposal Card #19 ...                                        │
├──────────────┴──────────────────────────────────────────────────────────────┤
│ Accepted State Footer                                                      │
│ Scene Summary | Accepted Facts | Ready for Prose | Continue Run            │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8.2 Asset / Knowledge / Profile

```txt
┌──────────────────────────────── Main Stage ────────────────────────────────┐
│ Breadcrumb: Assets > Characters > 林渊        Lens: Knowledge  Tab: Profile │
├─────────────────────────────────────────────────────────────────────────────┤
│ Header                                                                      │
│ 林渊  主角  [Canon Locked] [Referenced by 12 scenes] [Last changed v18]     │
├───────────────────────┬─────────────────────────────────────────────────────┤
│ Identity Card         │ Structured Definition                               │
│ - aliases             │ - public persona                                     │
│ - role type           │ - private motive                                     │
│ - current arc         │ - speaking style                                     │
│ - first appearance    │ - secrets                                            │
│ - latest status       │ - constraints                                         │
├───────────────────────┴─────────────────────────────────────────────────────┤
│ Related Content                                                              │
│ Mentions Preview | Relations Preview | Timeline Preview                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 8.3 Chapter / Structure / Sequence

```txt
┌──────────────────────────────── Main Stage ────────────────────────────────┐
│ Breadcrumb: Book > Ch03                 Lens: Structure  Tab: Sequence      │
├─────────────────────────────────────────────────────────────────────────────┤
│ View Switch: [Outliner] [Board] [Timeline]                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ Scene 10 | 到达茶楼 | POV 林渊 | status done | conflict 2 | review clean     │
│ Scene 11 | 观察沈昭 | POV 林渊 | status blocked | pending proposal 3         │
│ Scene 12 | 正面对谈 | POV 双人 | status running | consistency warning 1      │
│ Scene 13 | 离场余波 | POV 沈昭 | status todo | depends on Scene 12           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. React 组件树

## 9.1 顶层组件树

```txt
<App>
└── <AppProviders>
    ├── <RouterProvider>
    ├── <QueryClientProvider>
    ├── <ThemeProvider>
    ├── <WorkspaceStoreProvider>
    └── <CommandPaletteProvider>
        └── <AppRouter>
            ├── <WorkbenchRoute>
            │   └── <WorkbenchShell>
            │       ├── <TopCommandBar>
            │       ├── <ModeRail>
            │       ├── <NavigatorPane>
            │       ├── <MainStage>
            │       ├── <InspectorPane>
            │       ├── <BottomDock>
            │       ├── <GlobalModals>
            │       └── <Toaster>
            └── <FocusRoute>
                └── <FocusReader>
```

## 9.2 WorkbenchShell 细化

```txt
<WorkbenchShell>
├── <TopCommandBar>
│   ├── <ProjectSwitcher />
│   ├── <Breadcrumbs />
│   ├── <GlobalSearchTrigger />
│   ├── <ConnectionStatusDot />
│   └── <UserActions />
├── <ModeRail>
│   ├── <LensNavButton lens="structure" />
│   ├── <LensNavButton lens="orchestrate" />
│   ├── <LensNavButton lens="draft" />
│   ├── <LensNavButton lens="knowledge" />
│   └── <SettingsTrigger />
├── <NavigatorPane>
│   ├── <NavigatorHeader />
│   ├── <NavigatorFilters />
│   ├── <NavigatorBody />
│   │   ├── <BookTree />
│   │   ├── <ChapterTree />
│   │   ├── <SceneTree />
│   │   ├── <AssetIndex />
│   │   └── <ReviewQueue />
│   └── <NavigatorFooter />
├── <MainStage>
│   ├── <StageHeader />
│   ├── <StageTabs />
│   ├── <StageToolbar />
│   ├── <StageBody />
│   └── <StageStatusBar />
├── <InspectorPane>
│   ├── <InspectorTabs />
│   └── <InspectorBody />
└── <BottomDock>
    ├── <DockTabs />
    └── <DockPanels />
```

## 9.3 Scene Feature 组件树

```txt
<SceneWorkspace>
├── <SceneHeader>
│   ├── <SceneTitle />
│   ├── <SceneMetaBadges />
│   ├── <ThreadSwitcher />
│   └── <ExportTrigger />
├── <SceneTabs>
│   ├── <SceneSetupTab />
│   ├── <SceneExecutionTab />
│   └── <SceneProseTab />
└── <SceneExecutionTab>
    ├── <SceneObjectiveStrip>
    │   ├── <GoalChip />
    │   ├── <CastSummary />
    │   ├── <LocationSummary />
    │   └── <SceneWarningsBadge />
    ├── <SceneExecutionLayout>
    │   ├── <BeatRail>
    │   │   ├── <BeatRailItem />
    │   │   └── <AddBeatButton />
    │   └── <ProposalReviewStack>
    │       ├── <ProposalFilterBar />
    │       ├── <ProposalCard />
    │       │   ├── <ProposalHeader />
    │       │   ├── <ProposalDiffSummary />
    │       │   ├── <ProposalImpactTags />
    │       │   ├── <ProposalActions />
    │       │   └── <ProposalTracePeek />
    │       └── <EmptyProposalState />
    └── <AcceptedStateFooter>
        ├── <SceneSummaryCard />
        ├── <AcceptedFactsPreview />
        ├── <ReadinessIndicator />
        └── <ContinueRunButton />
```

## 9.4 Chapter Feature 组件树

```txt
<ChapterWorkspace>
├── <ChapterHeader />
├── <ChapterTabs>
│   ├── <ChapterSetupTab />
│   ├── <ChapterSequenceTab />
│   └── <ChapterProseTab />
└── <ChapterSequenceTab>
    ├── <SequenceViewSwitcher />
    ├── <ChapterOutlinerView />
    ├── <ChapterBoardView />
    └── <ChapterTimelineView />
```

## 9.5 Asset Feature 组件树

```txt
<AssetWorkspace>
├── <AssetHeader>
│   ├── <AssetAvatarOrGlyph />
│   ├── <AssetTitle />
│   ├── <AssetTypeBadge />
│   ├── <CanonLockBadge />
│   └── <LastChangedBadge />
├── <AssetTabs>
│   ├── <AssetProfileTab />
│   ├── <AssetMentionsTab />
│   ├── <AssetRelationsTab />
│   ├── <AssetTimelineTab />
│   └── <AssetPromptGuardTab />
└── <AssetProfileTab>
    ├── <AssetIdentityCard />
    ├── <AssetStructuredFields />
    ├── <AssetMiniRelationsPreview />
    └── <AssetMiniMentionsPreview />
```

## 9.6 Inspector 组件树

```txt
<InspectorPane>
├── <InspectorTabs>
│   ├── <ContextTab />
│   ├── <VersionsTab />
│   ├── <RuntimeTab />
│   └── <MentionsTab />
└── <InspectorTabPanel>
    ├── <ContextPanel>
    │   ├── <AcceptedFactsPanel />
    │   ├── <KnowledgeBoundaryPanel />
    │   ├── <LocalStatePanel />
    │   └── <RunOverridesPanel />
    ├── <VersionsPanel>
    │   ├── <VersionTimeline />
    │   ├── <CheckpointList />
    │   └── <RestorePreview />
    ├── <RuntimePanel>
    │   ├── <BindingSummary />
    │   ├── <CostLatencySummary />
    │   └── <CurrentRunHealth />
    └── <MentionsPanel>
        ├── <MentionList />
        └── <JumpToSourceActions />
```

## 9.7 Bottom Dock 组件树

```txt
<BottomDock>
├── <DockTabBar>
│   ├── <DockTab event-stream />
│   ├── <DockTab agent-trace />
│   ├── <DockTab prompt-trace />
│   ├── <DockTab problems />
│   └── <DockTab cost />
└── <DockTabPanels>
    ├── <EventStreamPanel />
    ├── <AgentTracePanel />
    ├── <PromptTracePanel />
    ├── <ProblemsPanel />
    └── <CostPanel />
```

---

## 10. React 组件设计纪律

这部分非常重要，尤其你会让 AI 来写。

## 10.1 页面组件只负责装配

例如：

- `SceneExecutionTab.tsx` 只做组合
- 数据获取交给 `useSceneExecutionData()`
- 单卡片渲染交给 `ProposalCard.tsx`
- 操作逻辑交给 `useProposalActions()`

### 你要尽量避免

```txt
ScenePage.tsx
  1200 lines
  ├── fetch data
  ├── tabs
  ├── forms
  ├── review actions
  ├── side effects
  ├── layout classes
  └── mutation handlers
```

## 10.2 Container / Presentational 分层

推荐按三层拆：

1. `route` / `page shell`
2. `feature container`
3. `ui blocks`

例子：

```txt
routes/workbench.tsx
features/scene/containers/SceneExecutionContainer.tsx
features/scene/components/ProposalCard.tsx
components/ui/card.tsx
```

## 10.3 每个组件尽量只解决一个问题

例如：

- `BeatRail` 只关心 beat 列表和选中态
- `ProposalCard` 只关心单个 proposal 的展示与动作
- `AcceptedFactsPanel` 只关心 facts 展示
- `BindingSummary` 只关心 runtime 绑定摘要

---

## 11. Tailwind 设计策略

## 11.1 不要把 Tailwind 写成“散装 CSS”

建议：

- 颜色、边框、阴影、背景都走 CSS variables
- Tailwind 只负责布局、间距、状态、排版规模
- 高频样式做成 layout primitives

## 11.2 推荐 token 方式

```css
:root {
  --app-bg: #f3f1ea;
  --panel-bg: #faf9f5;
  --panel-muted: #f5f4ed;
  --line-soft: #e4e0d4;
  --text-main: #2b2a27;
  --text-muted: #6b675f;
  --accent: #2f5e4e;
  --danger: #9a4b44;
  --warning: #9a7a38;
}
```

## 11.3 推荐抽出来的通用壳组件

优先先做这些：

- `Pane`
- `PaneHeader`
- `SectionCard`
- `Toolbar`
- `Badge`
- `FactList`
- `TimelineList`
- `SplitHandle`
- `EmptyState`
- `InspectorSection`

这样 AI 在写业务组件时，就不会反复生成一堆互不兼容的布局。

## 11.4 className 管理建议

建议至少引入一个 `cn()` 合并函数。

如果你愿意，再加一个 variants 方案，把按钮、badge、pane 状态都收进统一变体里。

---

## 12. 状态边界：什么该放哪里

## 12.1 Route State

放 URL：

- `scope`
- `entityId`
- `lens`
- `tab`
- `modal`
- `focusMode`

## 12.2 Workspace UI State

放 Zustand：

- pane 宽度
- dock 当前 tab
- navigator 展开状态
- 当前选中 proposal
- 当前 filters
- split view 开关

## 12.3 Server / Runtime Data

放 Query：

- 项目树
- 章节列表
- scene detail
- asset detail
- run events
- versions
- mentions
- consistency report

## 12.4 Local Form State

放组件内部或局部 form store：

- scene constraint 编辑中内容
- asset profile 编辑草稿
- prose 文本编辑中内容
- 未保存修改提示

### 边界口诀

- URL 负责“我在哪”
- Zustand 负责“我怎么看”
- Query 负责“系统给了我什么”
- Local State 负责“我正在改什么”

---

## 13. 前端目录结构建议

```txt
src/
  app/
    providers/
    router/
    store/
  components/
    ui/
      badge/
      button/
      card/
      dialog/
      empty-state/
      pane/
      tabs/
      timeline/
      toolbar/
  features/
    workbench/
      components/
      layout/
      hooks/
      store/
      routes/
    navigator/
      components/
      hooks/
    inspector/
      components/
      hooks/
    dock/
      components/
      hooks/
    book/
      components/
      containers/
      hooks/
      api/
      types/
    chapter/
      components/
      containers/
      hooks/
      api/
      types/
    scene/
      components/
      containers/
      hooks/
      api/
      types/
    asset/
      components/
      containers/
      hooks/
      api/
      types/
    settings/
      components/
    export/
      components/
  lib/
    cn.ts
    formatters/
    guards/
  contracts/
    workbench.ts
    scene.ts
    chapter.ts
    asset.ts
```

### 为什么按 feature 切

因为 AI 开发最怕“共享目录越来越大，谁都能改，最后耦合爆炸”。

按 feature 切后：

- Scene 改 Scene
- Asset 改 Asset
- Workbench 壳子单独维护
- 公共 UI 只有少量真正稳定的原子组件

---

## 14. 建议的数据 contract 草图

```ts
export type Scope = 'book' | 'chapter' | 'scene' | 'asset'
export type Lens = 'structure' | 'orchestrate' | 'draft' | 'knowledge'

export interface WorkbenchSelection {
  scope: Scope
  entityId: string
  lens: Lens
  tab: string
}

export interface NavigatorNode {
  id: string
  type: Scope | 'folder' | 'queue' | 'saved-view'
  title: string
  parentId?: string
  status?: 'idle' | 'running' | 'blocked' | 'review' | 'done'
  badgeCount?: number
}

export interface ProposalSummary {
  id: string
  actorId: string
  kind: 'action' | 'intent' | 'conflict' | 'state-change'
  title: string
  summary: string
  impactTags: string[]
  status: 'pending' | 'accepted' | 'rejected' | 'needs-rewrite'
}

export interface AssetSummary {
  id: string
  assetType: 'character' | 'location' | 'organization' | 'object' | 'rule'
  title: string
  aliases?: string[]
  firstAppearance?: string
  latestStatus?: string
  mentionCount: number
  canonLocked?: boolean
}
```

---

## 15. 第一阶段最值得先做的页面组合

如果你要让 AI 连续开发，我建议不是四个 scope 一起上，而是这个顺序：

## Phase A：先把壳子站起来

- WorkbenchShell
- ModeRail
- NavigatorPane
- MainStage
- InspectorPane
- BottomDock
- Command Palette
- Settings Drawer
- Export Modal

### 验收

能进入统一 workbench，能切 scope，能打开空态与假数据。

## Phase B：只做 Scene 核心

- Scene Setup
- Scene Execution
- Proposal Review Stack
- Accepted State Footer
- Inspector 的 Context / Versions / Runtime
- BottomDock 的 Event / Problems

### 验收

用户能在同一舞台完成 scene 的运行、审阅、接受。

## Phase C：做 Asset Story Graph

- Asset Index
- Asset Profile
- Mentions
- Relations
- Timeline
- Prompt Guard

### 验收

资产不再只是列表，能体现对象定义、引用、关系和运行绑定。

## Phase D：做 Chapter Structure

- Outliner
- Board
- Timeline
- scene status / queue / blocked 视图

## Phase E：最后补 Book、Focus Mode、Compare、Polish

---

## 16. 适合 AI 开发的拆任务方式

不要这样下任务：

> 帮我把整个前端都做完。

要这样拆：

### Task 01

实现 `WorkbenchShell`，只做布局与 pane 占位，不接真实数据。

### Task 02

实现 `ModeRail` + `NavigatorPane`，支持 scope / lens 切换与节点选中。

### Task 03

实现 `SceneExecutionTab` 的静态骨架：Objective Strip、Beat Rail、Proposal Stack、Footer。

### Task 04

实现 `ProposalCard`、`ProposalActions`、`ProposalFilterBar`。

### Task 05

实现 `InspectorPane` 的 `Context / Versions / Runtime` 三个面板。

### Task 06

实现 `BottomDock` 的 `Event Stream / Problems / Cost`。

### Task 07

实现 `AssetProfileTab` + `AssetMentionsTab`。

### Task 08

实现 `ChapterSequenceTab` 的 `Outliner / Board / Timeline`。

### Task 09

把静态数据替换成真实 contract / IPC。

### Task 10

补测试、空态、错误态、loading 态。

### 每个任务都要求 AI 输出

- 改了哪些文件
- 新增哪些组件
- 组件职责
- 未覆盖的边界
- 如何手测

---

## 17. 你现在最该定的三个工程决策

## 决策 1：先做“壳 + Scene”，不要一口气铺满四个 scope

因为 Scene 是整个 orchestration 体验最能拉开差距的地方。

## 决策 2：Assets 按 Story Graph 做，不按传统 wiki 做

Wiki 只借阅读感，不借对象模型。

## 决策 3：React + Tailwind 必须先做 primitives，再做业务组件

否则 AI 很快会把整个项目写成一堆互相不兼容的卡片和面板。

---

## 18. 我建议你下一轮直接进入什么产物

下一轮最值得继续往下拆的是两份东西：

1. **Scene Scope 的 React 组件详细规格**
   - 每个组件的 props
   - 每个 hook 的输入输出
   - 每个动作如何映射到 runtime contract

2. **可直接给 AI 用的开发任务清单**
   - 逐任务 prompt
   - 验收标准
   - 文件落点
   - 禁止触碰的边界

如果只选一个，先做 **Scene Scope 详细规格**。
