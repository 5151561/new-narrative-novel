# Chapter / Structure 后续扩建计划（PR2–PR5）

## 结论

`codex/chapter-structure-pr1` 已经把 **workbench route / shell 的所有权从 scene 提升到了 workbench**，并且把 `chapter` 作为第二个 scope 接进来了。下一阶段不该再回去做新的壳子泛化，而应该把 Chapter 从“placeholder 证明”推进到“可工作的 read-heavy structure workspace”。

这意味着接下来的主线不是补更多 Scene 底层，而是围绕 Chapter 做 4 件事：

1. 把数据从容器内联 fixture 抽出去，形成 Chapter 自己的 query / view-model 层。
2. 把 `Sequence / Outliner / Assembly` 从 placeholder 变成真正承担不同任务的三种视图。
3. 补齐 chapter scope 的 inspector / bottom dock / chapter→scene handoff，让它真正占满 workbench 的五个表面。
4. 用 smoke 把 “chapter 结构编排 → scene 执行台” 这条往返路径固定下来。

## 当前分支已经成立的基础

### 已完成

- workbench route 已支持 `scope='scene' | 'chapter'`
- chapter route 已支持：
  - `chapterId`
  - `lens='structure'`
  - `view='sequence' | 'outliner' | 'assembly'`
  - `sceneId?`
- `App.tsx` 已根据 `route.scope` 在 `SceneWorkbench` 与 `ChapterWorkbench` 之间切换
- `features/chapter` 已经建立了基本目录：
  - `components`
  - `containers`
  - `types`

### 仍是临时脚手架的部分

- `ChapterStructureWorkspace.tsx` 里仍有内联 `chapterRecords`
- `chapter-view-models.ts` 里的类型仍是 `*PlaceholderViewModel`
- `ChapterBinderPlaceholder.tsx` / `ChapterStructureStagePlaceholder.tsx` 仍以展示脚手架为主
- chapter workbench 目前还没有 `bottomDock`
- chapter 的交互目前只证明了：
  - route 切换可行
  - binder 选 scene 可行
  - view 切换可行

所以，**PR1 证明的是“chapter 能挂进壳子”，不是“chapter 已经是一个有效工作面”。**

## 这一轮的目标

把 Chapter / Structure 做成一个真正可工作的“章节编排台”，而不是 Scene 的次级页面。

用户在这个工作面里应该能完成的事是：

- 看到一个 chapter 中 scene 的顺序、密度与状态
- 从不同视角审视同一份 chapter 数据：
  - `Sequence` 看顺序与节奏
  - `Outliner` 看高密度字段对比
  - `Assembly` 看拼接与过渡
- 选中某个 scene 后，右侧能看到精简但足够有用的结构信息
- 在需要深入处理时，能平滑跳进对应的 scene orchestration / draft

## 这一轮不做的事

为了不让 Chapter 第一个 milestone 失控，以下内容先明确延后：

- Asset / Knowledge scope
- story graph / mentions / backlinks 的完整产品化
- chapter 级别复杂写路径
- chapter 的 AI 生成 / orchestrate 主流程
- branch / compare / publish
- 复杂多人协作与评论系统

也就是说，这一轮的目标是：

**把 Chapter / Structure 做成可靠、清楚、可深链、可切 view、可往返 Scene 的 read-heavy workbench。**

---

## 交互借鉴矩阵（只借方法，不照搬）

### 1. VS Code：借壳子纪律，不借程序员噪音

借：
- mode rail / side bar / inspector / panel 的空间纪律
- tabs / split / panel 的层级秩序
- 布局与打开状态可恢复的思路

不借：
- 过密图标
- 工程化术语泛滥
- 让每个区域都像扩展容器

对当前项目的落点：
- chapter 最终也要占满五面 workbench
- 主舞台只服务一个一级任务
- 底部 panel 只放支持判断的信息，不抢主舞台

### 2. AppFlowy：借“一份数据，多种视图”

借：
- 同一份 chapter dataset 支撑多个 view
- 每个 view 有自己的展示密度与字段重心
- 视图切换不改变对象身份

对当前项目的落点：
- `Sequence / Outliner / Assembly` 都必须共享同一份 chapter query 结果
- route 只切 `view`，不复制数据源
- filter / sort / visible fields 应逐步视图化，而不是每个 view 各自造 state

### 3. BookStack：借明确层级和手动排序心智

借：
- 层级清楚
- 对“内容顺序”有明确心智
- 结构不是隐式推导出来的

对当前项目的落点：
- binder 里的 scene 顺序要成为 chapter structure 的第一事实
- 将来 scene reorder 时，应基于显式顺序，而不是临时排序结果

### 4. Outline：借安静、连续、可阅读的知识工作体验

借：
- 低噪音
- 阅读优先
- 右侧信息区更像支持判断的 contextual pane

对当前项目的落点：
- chapter inspector 不要变成信息堆栈
- 重点先收敛到 `Summary / Problems / Notes`

### 5. Wiki.js：借路径与 breadcrumb 心智

借：
- 页面身份由路径稳定表达
- breadcrumb / path 很适合深链和跨页定位

对当前项目的落点：
- `chapter -> selected scene -> open in scene` 的往返需要稳定路径心智
- 后面可以在 header 中引入更明确的 breadcrumb，而不是只靠标题

### 6. Logseq：借 references/backlinks 的意识，不让 graph 抢主入口

借：
- 页面/块之间的引用意识
- linked references 是辅助理解上下文的有效手段

不借：
- graph-first 主入口
- 把“关系探索”当成主要编辑界面

对当前项目的落点：
- chapter 这一轮只需要为将来的 mentions / backlinks 预留数据位置
- 不要现在就把 graph 做进主舞台

---

## PR2：Chapter 数据层与 query 纵切

## 目标

把 chapter 的数据来源从 `ChapterStructureWorkspace.tsx` 内联记录，迁移到 **feature 级 chapter client + query hooks + stable view model**。

## 为什么先做这个

当前 chapter 视图虽然已经能切，但本质上还是“壳子 + 本地脚手架”。如果不先把数据层独立出来，后面的 `Sequence / Outliner / Assembly` 只会越写越黏在容器文件里，最后很难接 preload bridge 或更真实的数据。

## 改动建议

### 新增

- `packages/renderer/src/features/chapter/api/chapter-client.ts`
- `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`
- `packages/renderer/src/features/chapter/hooks/chapter-query-keys.ts`
- `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts`
- `packages/renderer/src/features/chapter/hooks/useChapterNavigatorQuery.ts`（可选，若 binder 单独需要）

### 修改

- `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
- `packages/renderer/src/features/chapter/types/chapter-view-models.ts`

## 结构原则

### 1. mirror scene，但不要机械复制

Chapter 可以借 Scene 已经证明有效的组织方式：
- `api`
- `hooks`
- `types`
- `components`
- `containers`

但不要为了对称而硬造过多 hook。Chapter 当前只需要最小查询面：
- chapter workspace
- chapter navigator（如果 workspace 不足以支撑左侧摘要）
- chapter inspector / dock 可以暂时从 workspace 派生

### 2. 先 read-only，先统一数据模型

PR2 先不做 mutations。

优先把 Chapter 的 read model 定住，建议至少有这些字段：

#### chapter workspace level
- `chapterId`
- `title`
- `summary`
- `sceneCount`
- `unresolvedCount`
- `viewsMeta`（可选）
- `selectedSceneId`

#### scene row/card level
- `id`
- `order`
- `title`
- `summary`
- `purpose`
- `pov`
- `location`
- `conflict`
- `reveal`
- `statusLabel`
- `proseStatusLabel`
- `runStatusLabel`
- `unresolvedCount`
- `lastRunLabel`

#### inspector level
- `selectedSceneBrief`
- `chapterNotes`
- `problemsSummary`
- `assemblyHints`

### 3. 去掉 Placeholder 命名

`PlaceholderViewModel` 这种命名在 PR2 之后就不该继续存在。

建议改成：
- `ChapterStructureSceneViewModel`
- `ChapterStructureInspectorViewModel`
- `ChapterStructureWorkspaceViewModel`

## 验收标准

- chapter 数据不再内联在容器里
- `Sequence / Outliner / Assembly / Binder / Inspector` 都从同一份 query 数据派生
- URL 刷新后能恢复：
  - `scope=chapter`
  - `id`
  - `view`
  - `sceneId`
- chapter feature 拥有自己的 `api/hooks/types` 基本骨架

---

## PR3：真实 Binder + Sequence 视图

## 目标

把当前 chapter 左侧 binder 和主舞台中的 `Sequence` 先做成真正可用的第一工作面。

## 为什么先做 Sequence

在 Chapter 里，最先被高频使用的一定是：
- 看 scene 顺序
- 看每场大致摘要
- 快速定位当前关注的 scene

所以这一步应该优先打磨 `Binder + Sequence`，而不是先上复杂的高密度 outliner。

## 改动建议

### 组件拆分

把当前 placeholder 拆成清晰组件：
- `ChapterBinderPane.tsx`
- `ChapterSequenceView.tsx`
- `ChapterStructureHeader.tsx`（可选）

### Binder 交互

左侧 Binder 至少支持：
- 高亮当前选中 scene
- 点击 scene 更新 `route.sceneId`
- 显示基础结构摘要：
  - scene count
  - unresolved count
  - active view
- 支持从 binder 进入 scene（先放 action，不必本 PR 完成）

### Sequence 交互

`Sequence` 不应只是 3 列卡片占位。

它应该承担：
- 顺序感知
- 节奏浏览
- 快速选中 scene
- 快速比较相邻 scene 状态

建议卡片至少显示：
- 顺序号
- 标题
- 一句话 purpose/summary
- POV / location
- status / unresolved
- prose status（若已具备）

### 路由规则

- 点击 binder scene：更新 `sceneId`
- 点击 sequence card：也更新 `sceneId`
- 选中态永远由 route 派生
- 不引入额外的本地 selectedScene store

## 验收标准

- Binder 与 Sequence 的选中态完全同步
- `route.sceneId` 是唯一真源
- Sequence 已经能承担“章节扫描器”的任务，不再只是视觉脚手架

---

## PR4：Outliner + Assembly + Chapter Inspector/Dock

## 目标

让 Chapter 真正占满五面 workbench，而不是只有 navigator + stage + inspector 的半套验证。

## 改动建议

### 1. Outliner

Outliner 不是第二套卡片皮肤，而是**高密度结构对比视图**。

建议显示字段：
- order
- title
- purpose
- POV
- location
- conflict
- reveal
- status
- prose status
- unresolved
- last run

第一版不一定非要做原生 table，但必须比 Sequence 明显更高密度。

### 2. Assembly

Assembly 的任务不是再看 scene 卡片，而是验证：
- scene 与 scene 的连接是否顺
- 章节的前后段压力是否合理
- 过渡信息是否断裂

第一版可以收敛成三块：
- `Incoming`
- `Current seam`
- `Outgoing`

也可以补一个 chapter-level 提示区：
- 哪些相邻 scene 缺过渡
- 哪些 unresolved 会影响 assembly

### 3. Inspector

当前 inspector 已有良好方向，但应从“placeholder 信息块”升级成更稳定的信息结构。

建议固定为两个区域：
- `Summary`
- `Problems`

`Notes` 可以继续保留在 Summary 区域里，不必一开始就做 tab。

### 4. Bottom Dock

这是当前 chapter scope 最明显缺的一块。

建议补一个轻量 `ChapterDockContainer`，第一版只做：
- `Problems`
- `Activity`

#### Problems
列出：
- unresolved summary
- assembly risk
- missing fields（例如 POV / reveal 缺失）

#### Activity
列出：
- 最近 view 切换
- 最近 scene 选择
- 以后预留给 reorder / edit / run handoff

注意：
- dock 是支持判断，不是主要编辑区
- 不把 scene runtime trace 直接搬过来

## 验收标准

- chapter workbench 也拥有 bottom dock
- `Sequence / Outliner / Assembly` 三者职责清楚，不再是同构占位
- inspector 和 dock 的信息不重复堆砌

---

## PR5：Chapter ↔ Scene handoff + smoke + polish

## 目标

把 Chapter / Structure 和 Scene / Orchestrate 串起来，证明这不是两个孤立页面，而是一套 workbench 内的两个工作面。

## 关键交互

### 1. 从 Chapter 打开 Scene

在以下位置都应能进入 scene：
- binder item
- sequence card
- outliner row
- assembly 中当前 seam 的 scene chip

### 2. 打开策略

优先提供两个入口：
- `Open in Orchestrate`
- `Open in Draft`

对应行为：
- `scope='scene'`
- `sceneId=当前选中 scene`
- `lens='orchestrate' | 'draft'`
- `tab` 设置为合理默认值

### 3. 返回策略

返回 chapter 不需要复杂“多 scope 同时驻留”机制。

先依赖：
- 浏览器历史
- route 恢复

只要 chapter route 自身足够稳定，用户从 scene 返回时就能回到：
- 原 chapter
- 原 view
- 原 selected scene

### 4. Smoke

新增 chapter 主路径 smoke：

```text
打开 chapter
-> 切到 sequence
-> 选择 scene
-> 切到 outliner
-> 切到 assembly
-> open in scene orchestrate
-> 返回 chapter
-> 原 view / sceneId 恢复
```

## 验收标准

- chapter → scene handoff 顺滑
- back 能恢复 chapter 的 view 与 selection
- smoke 证明多 scope workbench 已具备最基本的工作流连续性

---

## 文档 PR：补一份项目定位文档

这个 PR 建议单独做，而且**现在就值得做**。

### 为什么

当前仓库里已经有：
- 实现计划文档
- 前端设计长文档
- `DESIGN.md` 这种视觉系统文档

但缺一份真正回答这些问题的文档：
- 这个项目到底是什么
- 它想解决什么问题
- 它不是什么
- 它为什么是 Narrative IDE，而不是 AI 写作页集合
- 它借鉴了哪些开源项目，分别借什么、不借什么

### 建议文件名

- `doc/project-positioning.md`

### 内容范围

- 项目一句话定义
- 目标用户与问题场景
- scope / lens 双轴模型
- orchestration state flow
- 设计借鉴矩阵
- 近期路线图
- 与现有 `DESIGN.md` 的关系

### 作用

这份文档会成为：
- 以后写 README 的母文档
- 新 feature 是否偏航的判断基准
- 多个前端 plan 的统一语言来源

---

## 推荐执行顺序

### 路线 A（我更推荐）

1. 文档 PR：`project-positioning.md`
2. PR2：chapter 数据层与 query 纵切
3. PR3：Binder + Sequence
4. PR4：Outliner + Assembly + Inspector/Dock
5. PR5：Chapter ↔ Scene handoff + smoke

### 为什么文档 PR 放前面

因为 PR1 已经让产品从“Scene 页面”进入“多 scope workbench”阶段。

这时如果没有一份稳定的项目定位文档，后面的 Chapter、Knowledge、Draft 很容易各自发展出不同语言和不同目标，最后 UI 会看起来像拼起来的页面集合。

---

## 这一轮的完成标志

满足以下条件，就可以认为 Chapter / Structure 第一阶段完成：

- chapter 不再依赖容器内联数据
- chapter 有完整的 read-only workspace query
- 三种结构视图职责清楚
- chapter 也有自己的 bottom dock
- chapter 可以平滑打开 scene，并能返回恢复状态
- smoke 覆盖 chapter→scene→chapter 主路径

完成这一步后，再决定是否进入下一阶段：
- structure mutations（reorder / inline edit）
- knowledge / assets
- chapter draft assembly 的更深写作工作流

