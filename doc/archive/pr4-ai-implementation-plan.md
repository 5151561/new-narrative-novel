# PR4 执行文档（基于 `main` 上 PR3 实际代码）

## 这份文档的目的

这不是路线图回顾，而是基于当前 `main` 分支已经落地的 PR3 代码，为 AI agent 准备的一份可直接实施的 PR4 计划。

PR4 的任务不是回头重做 Binder / Sequence，也不是提前把 chapter → scene handoff 做进去，而是把 **Chapter / Structure 剩下的工作面补齐**：

1. 把主舞台里的 `Outliner` 做成真正的高密度结构对比视图。
2. 把主舞台里的 `Assembly` 做成真正围绕 selected scene 的拼接 / 过渡检查视图。
3. 把右侧 inspector 从 placeholder 信息堆栈，收敛成稳定的信息结构。
4. 给 chapter scope 补上第一版 bottom dock，让 chapter 也真正占满五个工作面。

---

## 一、先确认当前代码基线

当前 `main` 已经成立的基础不是“PR3 之前的假设”，而是 **PR3 已经完成后的真实代码状态**。

### 1. chapter feature 的数据与容器骨架已经稳定

当前 `features/chapter` 已经有：

- `api`
- `components`
- `containers`
- `hooks`
- `types`

而且 `ChapterStructureWorkspace.tsx` 已经通过 `useChapterStructureWorkspaceQuery()` 消费统一的 chapter workspace view-model，而不是再在容器里内联 chapter fixture。

### 2. Chapter 选中态已经形成 route-driven 闭环

当前 `ChapterStructureWorkspace.tsx` 已经把：

- Binder 的 scene click
- Sequence 的 scene click
- view switcher 的 view 切换

全部接到 `patchChapterRoute(...)`。

也就是说：

- `route.sceneId` / `workspace.selectedSceneId` 已经是 chapter 选中态唯一真源
- `route.view` 已经是 chapter stage 的唯一 view 真源

### 3. PR3 已经把 Binder + Sequence 做成真实组件

当前 chapter components 已经不是旧的 placeholder 组合，而是：

- `ChapterBinderPane.tsx`
- `ChapterSequenceView.tsx`
- `ChapterStructureStagePlaceholder.tsx`
- `ChapterStructureInspectorPlaceholder.tsx`

其中：

- Binder 已经有 `aria-pressed` 选中态
- Sequence 已经有 `aria-current` 选中态
- `ChapterStructureWorkspace.test.tsx` 已经验证 Binder / Sequence / Inspector / URL 的 route-driven 同步

### 4. PR3 之后真正仍然是 placeholder 的，只剩这三块

#### A. `Outliner`

虽然当前 `ChapterStructureStagePlaceholder.tsx` 已经能切到 `outliner`，但它仍然是 **inline placeholder branch**：

- 还写在 stage 文件内部
- 还没有独立组件
- 还没有自己的测试与 story
- 还没有形成“高密度结构对比视图”的独立职责

#### B. `Assembly`

当前 `assembly` 分支也仍然是 **stage 内联的轻脚手架**：

- 只有 `Incoming / Current assembly` 两块
- 仍主要是 scene title list
- 还没有围绕 selected scene 的真正 seam / transition 检查结构

#### C. `Inspector`

当前 `ChapterStructureInspectorPlaceholder.tsx` 虽然已经能跟随 selected scene 更新，但信息结构仍然偏 placeholder：

- `selected scene brief`
- `unresolved summary`
- `chapter notes`
- `problems`
- `assembly hints`

它是“能看”，但还不是稳定、安静、明确的 contextual pane。

### 5. Workbench 壳子已经支持 bottom dock，但 chapter 还没接进去

`WorkbenchShell` 当前已经有 `bottomDock?: ReactNode` 插槽。

这意味着：

- chapter 不需要先改 shell
- PR4 只需要真正把 chapter 的 `bottomDock` 接进来

### 6. query identity 约束已经成立，而且现在不该打破

当前 chapter query hook 已经成立的关键约束仍然是：

- query key 只认 `chapterId`
- `selectedSceneId` 只用于派生 localized workspace view-model
- 切换 `sceneId` 不 refetch chapter 数据

PR4 必须建立在这个约束之上，而不是为 outliner / assembly / dock 回头改 query identity。

---

## 二、PR4 的唯一目标

**把 Chapter / Structure 从“已有 Binder + Sequence 的半套工作面”，推进成真正占满五面的 chapter workbench。**

这一轮完成后，用户应该能在 chapter 工作面里完成以下事：

- 在 `Sequence` 中快速扫描章节顺序与节奏
- 在 `Outliner` 中高密度比较 scene 的关键结构字段
- 在 `Assembly` 中围绕当前 selected scene 检查前后承接与拼接压力
- 在右侧 inspector 中看到稳定、低噪音的 summary / problems 信息
- 在底部 dock 中看到 chapter 级的问题摘要与最近工作流活动

一句话说：

**PR4 要把 chapter 从“只有 navigator + sequence 是真的”，推进到“stage / inspector / dock 都是真的”。**

---

## 三、这一轮明确不做

以下内容不要混进 PR4：

- 不做 chapter → scene handoff
- 不做 `Open in Orchestrate` / `Open in Draft`
- 不做 reorder / drag / inline structure mutation
- 不做 chapter 写路径或 AI orchestration 主流程
- 不做 asset / knowledge / graph 入口
- 不把 scene runtime trace 直接搬进 chapter dock
- 不改 workbench route 序列化规则，除非测试发现真实 bug
- 不为了 dock 或 inspector 新增 chapter 级 selected scene store

PR4 仍然是 **read-heavy structure workspace**，不是 mutation milestone，也不是 multi-scope workflow milestone。

---

## 四、必须遵守的硬约束

### 1. `route.sceneId` 仍然是 chapter 选中态的唯一真源

不要新增：

- `useState(selectedSceneId)`
- chapter 局部 zustand selected store
- outliner 内部 active row state
- assembly 内部 selected seam state
- inspector 内部 selected scene state

统一规则：

- 选中态来源：`workspace.selectedSceneId`
- 点击 Binder item：`patchChapterRoute({ sceneId })`
- 点击 Sequence card：`patchChapterRoute({ sceneId })`
- 点击 Outliner row：`patchChapterRoute({ sceneId })`
- 点击 Assembly 中的 scene chip / seam card：`patchChapterRoute({ sceneId })`

### 2. 不要碰 query identity

保持下面这个约束不变：

- `chapterQueryKeys.workspace(chapterId)` 只由 `chapterId` 决定
- `selectedSceneId`、`view`、dock 内部展示都不能塞进 query key

PR4 可以新增纯展示 derivation，但不要回头改 chapter query key。

### 3. `availableViews` 必须继续尊重 workspace metadata

当前 `ChapterStructureWorkspace.tsx` 已经把：

- `workspace.viewsMeta?.availableViews`
- fallback `['sequence', 'outliner', 'assembly']`

接到了 stage。

PR4 不能把 view switcher 写死，更不能因为抽出 Outliner / Assembly 组件就忽略 metadata。

### 4. Binder 与 Sequence 只做最小支持性改动

这轮不要重做 PR3 已经完成的部分。

- `ChapterBinderPane.tsx`：保持现有 navigator 角色
- `ChapterSequenceView.tsx`：保持现有章节扫描器角色

除非新 inspector / dock / stage wiring 需要最小配合，否则不要把 PR4 变成“再做一遍 PR3”。

### 5. bottom dock 可以有本地 session activity，但不能成为第二真源

PR4 若要显示：

- 最近 view 切换
- 最近 scene 选择

可以通过 **workspace 容器级的 session log / activity hook** 记录最近交互。

但这个 activity 只能是：

- 派生的
- 只读展示的
- 不拥有对象身份的

它绝不能反过来控制：

- 当前 view
- 当前 selected scene

---

## 五、建议的文件改动

## 5.1 新增

- `packages/renderer/src/features/chapter/components/ChapterOutlinerView.tsx`
- `packages/renderer/src/features/chapter/components/ChapterOutlinerView.test.tsx`
- `packages/renderer/src/features/chapter/components/ChapterAssemblyView.tsx`
- `packages/renderer/src/features/chapter/components/ChapterAssemblyView.test.tsx`
- `packages/renderer/src/features/chapter/components/ChapterBottomDock.tsx`
- `packages/renderer/src/features/chapter/components/ChapterBottomDock.test.tsx`
- `packages/renderer/src/features/chapter/containers/ChapterDockContainer.tsx`
- `packages/renderer/src/features/chapter/hooks/useChapterWorkbenchActivity.ts`
- `packages/renderer/src/features/chapter/components/ChapterOutlinerView.stories.tsx`（推荐）
- `packages/renderer/src/features/chapter/components/ChapterAssemblyView.stories.tsx`（推荐）
- `packages/renderer/src/features/chapter/components/ChapterBottomDock.stories.tsx`（推荐）

## 5.2 重命名（推荐）

- `packages/renderer/src/features/chapter/components/ChapterStructureInspectorPlaceholder.tsx`
  -> `packages/renderer/src/features/chapter/components/ChapterStructureInspectorPane.tsx`

### 可选重命名

- `packages/renderer/src/features/chapter/components/ChapterStructureStagePlaceholder.tsx`
  -> `packages/renderer/src/features/chapter/components/ChapterStructureStage.tsx`

如果你希望 PR4 结束后彻底去掉 placeholder 命名债，这一步值得做；
如果想把 rename 风险压到最低，也可以先保留文件名，只把内部职责做实。

## 5.3 修改

- `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
- `packages/renderer/src/features/chapter/components/ChapterStructureStagePlaceholder.tsx`（或重命名后的 stage 文件）
- `packages/renderer/src/features/chapter/components/chapter-story-fixture.ts`
- `packages/renderer/src/features/chapter/types/chapter-view-models.ts`（仅在组件契约确实需要更清楚的专用类型时）
- chapter 相关 i18n 文案

## 5.4 这一轮尽量不动

- `packages/renderer/src/features/chapter/hooks/chapter-query-keys.ts`
- `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts`
- `packages/renderer/src/features/chapter/api/chapter-client.ts`
- `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`

如果 dock / inspector / assembly 第一版能完全从现有 workspace 派生，就不要为了“更整齐”回头扩 query 层。

---

## 六、组件职责拆分

## 6.1 `ChapterOutlinerView.tsx`

这是 PR4 的第一块主舞台核心。

### 组件职责

- 做高密度结构对比
- 让用户快速比较同章 scene 的关键字段
- 让用户在不离开 chapter 的前提下完成一轮结构检查
- 继续允许快速切换 selected scene

### props

建议保持简单：

- `workspace: ChapterStructureWorkspaceViewModel`
- `onSelectScene?: (sceneId: string) => void`

### 每一行 / 每一块至少显示

必显：

- order
- title
- purpose
- POV
- location
- conflict
- reveal
- statusLabel
- proseStatusLabel
- runStatusLabel
- unresolvedCount
- lastRunLabel

### 交互规则

- 每一行优先用 `button` 或带 button 行为的容器
- 点击一行调用 `onSelectScene(scene.id)`
- 选中态使用 `workspace.selectedSceneId`
- 必须有明确 active / focus 样式

### 视觉纪律

- Outliner 不是 Sequence 的另一套卡片皮肤
- 密度必须明显高于 Sequence
- 可以不是传统 table，但必须让“字段比对”变得更高效
- 不要做 drag handle / reorder affordance

### 不做

- 不做 inline edit
- 不做 reorder
- 不做 open-in-scene 动作

---

## 6.2 `ChapterAssemblyView.tsx`

这是 PR4 的第二块主舞台核心。

### 组件职责

- 围绕当前 selected scene 检查章节承接
- 明确“前一场怎样压进来、当前场承什么、下一场怎样接出去”
- 让 Assembly 真正承担“拼接 / 过渡判断”任务，而不是 scene title list

### props

建议保持与 Outliner 一致：

- `workspace: ChapterStructureWorkspaceViewModel`
- `onSelectScene?: (sceneId: string) => void`

### 推荐结构

第一版建议固定成四块：

1. `Incoming`
   - 当前 selected scene 之前的 scene
2. `Current seam`
   - 以 selected scene 为锚点的当前拼接焦点
3. `Outgoing`
   - 当前 selected scene 之后的 scene
4. `Assembly hints`
   - 复用现有 `workspace.inspector.assemblyHints`

### `Current seam` 应该至少体现

- selected scene 的 title / summary
- 与相邻 scene 的承接关系
- 当前 scene 的 purpose / conflict / reveal 中哪一项在承接上最关键
- unresolved / status 对 assembly 的影响

### 交互规则

- incoming / current / outgoing 中出现的 scene chip 或 scene card 都应该可点击
- 点击后走 `onSelectScene(scene.id)`
- 当前 selected scene 的视觉权重必须明显高于相邻 scene

### 不要做

- 不做 chapter → scene handoff
- 不做重排拖拽
- 不做复杂 graph
- 不做 runtime trace 复刻

---

## 6.3 `ChapterStructureInspectorPane.tsx`

这是 PR4 的右侧收敛点。

### 组件职责

把当前的 placeholder 信息堆栈，收敛成一个 **安静、稳定、支持判断** 的右侧 contextual pane。

### 推荐信息结构

第一版固定成两个区域：

#### A. `Summary`

包含：

- selected scene brief
- unresolved summary
- chapter notes

#### B. `Problems`

包含：

- `problemsSummary`
- `assemblyHints`

也就是说：

- 不再让 inspector 看起来像连续堆叠五块临时盒子
- 让用户一眼分清“上下文摘要”和“问题 / 风险”

### 交互纪律

- inspector 不做主创作
- inspector 不引入 tab，除非你发现现有信息已经明显拥挤
- inspector 继续跟着 `workspace.selectedSceneId` 自动变化

### 不做

- 不做复杂版本系统
- 不做运行日志主视图
- 不做 scene handoff

---

## 6.4 `ChapterBottomDock.tsx` + `ChapterDockContainer.tsx`

这是 PR4 最关键的新表面。

### 为什么必须在这一轮补上

`WorkbenchShell` 已经有 bottom dock 插槽。

如果 chapter 继续不接 dock，那么它仍然只有：

- navigator
- main stage
- inspector

而没有真正形成和 Scene 一致的五面 workbench。

### 第一版目标

只做两块：

#### A. `Problems`

用于承接 chapter 级支持判断信息，例如：

- unresolved 总量
- 当前 selected scene 的 unresolved 摘要
- `workspace.inspector.problemsSummary`
- `workspace.inspector.assemblyHints`
- 可从 scene fields 派生的 missing fields（例如 POV / reveal / location 缺失）

#### B. `Activity`

用于承接最近的 chapter 工作流动作，例如：

- 最近切换到哪个 view
- 最近选择了哪个 scene

### Activity 的正确实现方式

第一版推荐做成 **session-local activity log**：

- 在 `ChapterStructureWorkspace.tsx` 或专用 hook 中观察 `route.view` / `workspace.selectedSceneId` 的变化
- 只追加最近若干条日志
- 仅用于展示，不反向控制 route

这样可以避免：

- 新 chapter store
- 新 query 字段
- 新 route 参数

### 视觉纪律

- dock 是支持判断，不是主舞台
- 第一版不做 tab 也没关系
- 两块并列或上下堆叠都可以，但要让 Problems 与 Activity 职责清楚

### 不做

- 不搬 scene runtime trace
- 不搬 token / latency / execution timeline
- 不把 dock 做成第二个 inspector

---

## 6.5 `ChapterStructureStagePlaceholder.tsx`（或 `ChapterStructureStage.tsx`）

PR4 结束后，这个文件不该再主要承载 placeholder 分支。

### 本轮正确做法

让它变成真正的 stage switchboard：

- 保留现有 view switcher
- `sequence` 分支继续渲染 `ChapterSequenceView`
- `outliner` 分支改为渲染 `ChapterOutlinerView`
- `assembly` 分支改为渲染 `ChapterAssemblyView`

### 不要做

- 不在这个文件里继续堆巨量 inline JSX
- 不把所有 derivation 都塞回 stage 文件

PR4 的目标不是把 stage 文件写大，而是把 stage 职责收敛清楚。

---

## 七、`ChapterStructureWorkspace.tsx` 的接线要求

这个容器在 PR3 后已经很接近正确形态了。

PR4 不要重写它，只要把剩余表面接实。

### 要做的事

1. 继续从 `useChapterStructureWorkspaceQuery()` 取 chapter workspace
2. 继续通过 `patchChapterRoute({ sceneId })` 更新 selected scene
3. 继续通过 `patchChapterRoute({ view })` 更新 active view
4. 保持 `availableViews` 仍来自 `workspace.viewsMeta?.availableViews`
5. 接入新的 outliner / assembly / inspector / dock 组件
6. 给 `WorkbenchShell` 传入真正的 `bottomDock`

### 推荐接法

- `navigator`：`ChapterBinderPane`
- `mainStage`：真正的 chapter stage switchboard
- `inspector`：`ChapterStructureInspectorPane`
- `bottomDock`：`ChapterDockContainer`

### 关于 loading / error / not-found

当前 `ChapterStructureWorkspace.tsx` 已经对：

- loading
- error
- workspace === null

做了完整的 pane state fallback。

PR4 不要把这些结构打散。

只需要保证：

- 章节 loading / error / not-found 时，bottom dock 也有一致的空状态策略
- 不要让 dock 在异常态下单独残留旧内容

---

## 八、测试补齐方案

PR4 的核心不再是“有没有 route 同步”，而是：

**剩余视图和右侧 / 底部表面是否真的承担了自己的工作职责。**

## 8.1 `ChapterOutlinerView.test.tsx`

至少覆盖：

1. 能渲染高密度字段：
   - title
   - purpose
   - POV
   - location
   - conflict
   - reveal
   - unresolved
2. 当前 `workspace.selectedSceneId` 对应的 row 有选中态
3. 点击另一行会调用 `onSelectScene(sceneId)`

## 8.2 `ChapterAssemblyView.test.tsx`

至少覆盖：

1. selected scene 会成为 current seam 焦点
2. incoming / outgoing 会围绕 selected scene 正确切分
3. assembly hints 会显示
4. 点击相邻 scene chip 会调用 `onSelectScene(sceneId)`

## 8.3 `ChapterStructureInspectorPane.test.tsx`

至少覆盖：

1. Summary 区域渲染 selected scene brief / unresolved / notes
2. Problems 区域渲染 problemsSummary / assemblyHints
3. 当 selected scene 变化时，summary 标题 / brief 跟着更新

## 8.4 `ChapterBottomDock.test.tsx`

至少覆盖：

1. Problems 区域会显示 unresolved / problems / hints
2. Activity 区域会显示最近 view 或 scene 变化
3. Activity 只是展示，不会生成新的 selected state 来源

## 8.5 `ChapterStructureWorkspace.test.tsx`

这条测试建议继续保留，并升级为 PR4 最值钱的集成测试。

建议至少覆盖：

1. 初始 URL：
   - `?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-midnight-platform`
2. 渲染 `ChapterStructureWorkspace`
3. 断言：
   - Binder 选中 scene 正确
   - Outliner 高亮 scene 正确
   - Inspector 标题 / brief 正确
   - Bottom dock 已出现
4. 切换到 `assembly`
5. 点击 assembly 中另一个 scene
6. 断言：
   - URL 中 `sceneId` 已切换
   - Binder / Assembly / Inspector 同步更新
   - Bottom dock 中 selected scene 相关摘要也更新

### 继续保留的旧测试

以下测试不要删：

- `useChapterStructureWorkspaceQuery.test.tsx`
- `ChapterStructureStagePlaceholder.test.tsx`
- `ChapterBinderPane.test.tsx`
- `ChapterSequenceView.test.tsx`
- `ChapterStructureWorkspace.test.tsx`

如果 stage 文件因抽组件或重命名需要调整，只做最小迁移。

---

## 九、Storybook 要求（推荐）

PR4 很适合补 story，因为这轮变化主要是“剩余工作面产品化”，story 可以显著减少视觉回归。

建议新增：

### `ChapterOutlinerView.stories.tsx`

至少两种 story：

- `Default`
- `SelectedMiddleScene`

### `ChapterAssemblyView.stories.tsx`

至少两种 story：

- `SelectedFirstScene`
- `SelectedMiddleScene`

### `ChapterStructureInspectorPane.stories.tsx`（推荐）

至少两种 story：

- `Default`
- `ProblemsHeavy`

### `ChapterBottomDock.stories.tsx`

至少两种 story：

- `WithRecentActivity`
- `QuietSession`

### story 数据来源

优先复用现有：

- `chapter-story-fixture.ts`

必要时只做最小扩充。

不要为了 story 去改 query 层。

---

## 十、实施顺序（给 AI 的执行顺序）

### Step 1
先收敛命名债：

- 优先重命名 `ChapterStructureInspectorPlaceholder.tsx`
- 可选决定是否一起重命名 stage 文件

### Step 2
新增 `ChapterOutlinerView.tsx`，先做静态渲染：

- 把当前 outliner inline branch 抽出来
- 先保证字段密度与信息结构成型

### Step 3
给 `ChapterOutlinerView.tsx` 加入选中态与点击交互：

- row/button 可点
- 用 `workspace.selectedSceneId` 算 active
- 点击触发 `onSelectScene`

### Step 4
新增 `ChapterAssemblyView.tsx`：

- 抽离当前 assembly inline branch
- 围绕 selected scene 形成 incoming / current seam / outgoing
- 接入 assembly hints

### Step 5
产品化 inspector：

- 把当前 inspector placeholder 收敛成 `Summary / Problems`
- 保持 selected scene 跟随 route

### Step 6
新增 chapter dock：

- `ChapterDockContainer.tsx`
- `useChapterWorkbenchActivity.ts`
- `ChapterBottomDock.tsx`

### Step 7
回到 `ChapterStructureWorkspace.tsx`：

- 接入新的 outliner / assembly / inspector / dock
- 保持 route-driven scene / view 同步
- 保持 loading / error / not-found 结构

### Step 8
补测试：

- outliner
- assembly
- inspector
- dock
- workspace 集成测试升级

### Step 9
补 stories（如果本 PR 包含 story 维护）

---

## 十一、完成后的验收标准

满足以下条件，PR4 就算完成：

1. chapter query identity 完全不变。
2. `Outliner` 已成为真正的高密度结构对比视图。
3. `Assembly` 已成为真正围绕 selected scene 的拼接检查视图。
4. `Inspector` 已收敛成稳定的信息结构，不再只是 placeholder 堆栈。
5. `ChapterStructureWorkspace` 已向 `WorkbenchShell` 提供 `bottomDock`。
6. chapter workbench 现在也真正拥有五个表面。
7. Binder / Sequence / Outliner / Assembly / Inspector / Dock 围绕同一个 `route.sceneId` 同步。
8. 切换 selected scene 或切换 view 不触发 chapter query refetch。
9. `availableViews` 缩窄时，view switcher 仍按 metadata 工作。
10. 不包含 handoff / reorder / mutation / runtime trace transplant。

---

## 十二、PR4 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了让 Outliner / Assembly 可点，引入了本地 selected state
- 为了给 dock 做活动日志，引入了新的 route 真源或 chapter store 真源
- Outliner 仍然只是 Sequence 的另一套卡片皮肤
- Assembly 仍然只是 title list，没有 current seam 焦点
- Inspector 仍然是 5 块 placeholder 盒子直接堆起来
- 直接把 Scene 的 runtime / trace / cost dock 搬到 chapter
- 顺手把 chapter → scene handoff 也做进去
- 顺手开始做 reorder / inline edit

PR4 做完后，正确的项目状态应该是：

**chapter 已经真正拥有完整 workbench 表面，但仍把 cross-scope handoff 与 smoke 留给 PR5。**

---

## 十三、给 AI 的最终一句话指令

在当前 `main` 分支已经完成 PR3 的前提下，只围绕 `Outliner`、`Assembly`、`Inspector`、`Bottom Dock` 做一轮窄而实的实现：

- 保持 PR3 已经成立的 route / query identity 约束不变
- 不重做 Binder / Sequence
- 让剩余表面各自承担清楚职责
- 用 `route.sceneId` 统一 chapter 选中态
- 让 chapter 也真正占满五面 workbench
- 补齐对应的交互测试
- 不提前做 PR5 的 handoff / smoke / mutation 内容
