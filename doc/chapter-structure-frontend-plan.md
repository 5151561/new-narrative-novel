# Chapter / Structure 前端扩建计划（v1）

## 一句话结论

下一步不应该继续往 Scene 底层深挖，而是要用当前已经成型的 workbench 壳子，去验证 **第二个对象层级（Chapter）** 能不能被同一套交互结构稳定承载。

但这次扩建要有节制：

- **先只做 `scope=chapter + lens=structure`**
- 不在这一轮把 Chapter 也做成 Scene 那样的 runtime / orchestration 页面
- 不把 Chapter 直接做成“文档页”或者“看板页”
- 而是做成一个真正的 **章节编排台**

它的核心不是生成，而是：

1. 看整章的场景顺序是否合理；
2. 快速定位每场戏的职责、POV、冲突、揭示与状态；
3. 在不同视图之间切换，但始终围绕同一份 chapter 结构数据；
4. 从 Chapter 稳定下钻到 Scene。

---

## 为什么现在做 Chapter / Structure

当前项目的 Scene 纵切已经证明了几件关键事情：

- workbench shell 已经不是单页，而是 `topBar / modeRail / navigator / mainStage / inspector / bottomDock` 五面结构；
- route 已经承担了主要选中态与深链恢复；
- scene scope 已经把 `structure / orchestrate / draft` 三种 lens 跑通了第一版心智；
- scene 的 navigator / inspector / dock 都已经形成了最小模式。

因此，下一步最有价值的不是继续给 Scene 补更多底层抽象，而是验证：

> 同一套 shell，能不能承载第二个 scope，且交互语义依然清晰。

Chapter 是最合适的下一个 scope，因为它：

- 紧邻 Scene，用户心智迁移成本最低；
- 可以直接复用 route / query / pane 的设计；
- 能开始验证“对象轴 + 工作轴”的双轴模型；
- 比 Asset Story Graph 更轻，更适合做第二条前端纵切。

---

## 这次计划借鉴哪些开源项目，以及各自借什么

## 1. VS Code：借 workbench 壳子，不借复杂度

### 借什么

- 左侧 mode rail / primary sidebar / secondary sidebar / bottom panel 的空间纪律
- 主舞台优先，辅助面板次之
- 状态可恢复、布局有记忆
- 同一工作台里容纳不同任务面

### 不借什么

- 这一轮不做 editor tabs / split editor / 可任意拖拽布局
- 不做 extension host 心智
- 不让界面长成“程序员工具”

### 对当前项目的落地解释

当前项目已经有五面 shell，所以 VS Code 在这里不是“未来方向”，而是 **壳子已经对了，下一步要把第二个 scope 装进去**。

---

## 2. AppFlowy：借“单一数据源，多视图”

### 借什么

- 一份数据可切换多种 view
- view 是对同一模型的不同呈现，不是不同页面各自维护状态
- table / board / calendar 这类 view 切换来自同一 dataset

### 不借什么

- 不做数据库产品感
- 不把 Chapter 变成通用表格系统
- 不引入一整套 property builder 复杂度

### 对当前项目的落地解释

Chapter 需要至少 3 个主视图：

- `Sequence`
- `Outliner`
- `Assembly`

它们必须共享同一份 chapter structure 数据，而不是三个页面各查一次、各自存一次。

---

## 3. Outline：借“安静的知识工作感”

### 借什么

- 安静、清晰、不过度噪声的内容体验
- 侧边栏组织 + 文档主体优先
- 支持评论 / 历史 / 嵌套文档但不抢主舞台
- 读写体验轻、快、连续

### 不借什么

- 不把 Chapter 直接做成 wiki/document-first 页面
- 不让 sidebar 长成纯文档树
- 不把全部能力压进富文本编辑器

### 对当前项目的落地解释

Chapter / Structure 页面应该有 Outline 那种“读结构很轻松”的气质，但中间主区不是普通文档，而是 **结构编排视图**。

---

## 4. BookStack：借明确层级与排序操作

### 借什么

- 显式层级优于过度智能推断
- 拖拽排序是结构编辑的一等公民
- 搜索与直接连接能力服务于层级内容

### 不借什么

- 不把 Book / Chapter / Page 三层结构原样照搬成你的数据模型
- 不把 Chapter 退化成静态目录

### 对当前项目的落地解释

Chapter 的 navigator 必须像 Binder 一样稳定、明确、可排序，而不是只有搜索结果或过滤列表。

---

## 5. Wiki.js：借路径与 breadcrumb 心智

### 借什么

- 路径式 identity
- breadcrumb 帮助用户理解自己在哪一层
- tags/路径是辅助组织，而不是全部内容层级都靠手造文件夹

### 不借什么

- 不把 Chapter 直接做成路径驱动的 wiki 页树
- 不把 Scene 当成 URL path 文件

### 对当前项目的落地解释

Chapter scope 的 route 设计应该清晰表达：

- 当前 book / chapter 是谁
- 当前 lens 是什么
- 当前主视图是哪个
- 当前选中 scene 是谁

---

## 6. Logseq：借链接意识，不借 graph-first 入口

### 借什么

- 内容之间天然互相引用
- backlinks / mentions 是高价值的辅助上下文
- 关系随着使用过程自然积累，而不是纯手工维护

### 不借什么

- 不把 graph 作为默认主界面
- 不把 Chapter / Structure 做成知识图谱浏览器

### 对当前项目的落地解释

在 Chapter / Structure 里，Logseq 的启发主要用于：

- scene 与 asset / POV / unresolved item 的关联呈现
- inspector 中的 mentions / references
- 将来从 chapter 下钻到 scene，再回到 chapter 时保留上下文

---

## 这次扩建的核心产品定义

Chapter / Structure 不是“章节详情页”，而是：

> **一个面向章节编排与结构审视的工作台。**

用户进入这里，不是为了写全文，而是为了回答下面这些问题：

- 这一章一共有几场戏？
- 顺序是否合理？
- 哪场戏承担什么职责？
- POV 有没有断裂？
- 冲突 / 揭示是否在升级？
- 哪些 scene 已经 ready，哪些还 unresolved？
- 这一章拼起来之后阅读节奏是否通顺？

所以它的主任务是：

- **排序**
- **对比**
- **概览**
- **定位**
- **下钻**

而不是：

- runtime 调度
- proposal triage
- prose 精修

这些仍然主要属于 Scene scope。

---

## 交互逻辑总纲

## 一、只扩一个新 scope，不扩一个新产品

这轮不新增“Chapter 页面集合”，而是在现有 workbench 里增加：

- `scope=chapter`
- `lens=structure`

Chapter 先不开放 `orchestrate` / `draft` 两个 lens。

这样做的好处是：

- 工程面最小化改动
- 用户心智不会一下子膨胀
- 可以先验证 scope 切换和多视图是否成立

---

## 二、状态真源继续放在 route

Chapter 这一层的关键选中态，全部放 route：

- `chapterId`
- `view`
- `sceneId`
- `modal`
- 可能的 `filterPreset`

本地 store 只保留：

- navigator 折叠状态
- outliner 列显示配置
- inspectorTab
- dockTab
- 局部 UI 开关

### 原则

- “我现在看哪一章、哪一场、哪个视图” 必须可深链、可刷新恢复
- “我偏好哪些列显示、哪些面板展开” 才放本地 store

---

## 三、三种主视图共享同一份 chapter 结构数据

Chapter 主舞台固定 3 个视图：

### 1. Sequence（默认）

用于看场景顺序、节奏与编排。

展示方式：

- 按场景顺序排列的 scene cards
- 卡片上显示最少但最关键的信息：
  - title
  - purpose
  - POV
  - conflict
  - reveal
  - status
  - unresolved count
  - prose status

可交互：

- 单击：选中 scene，更新 inspector
- 拖拽：调整 scene 顺序
- 插槽按钮：在前后插入 scene
- 双击 / 主动作：进入对应 scene scope

### 2. Outliner

用于高密度对比与快速编辑。

展示方式：

- 行 = scene
- 列 = title / purpose / POV / location / conflict / reveal / status / prose / unresolved / updatedAt

可交互：

- 列排序（仅前端排序）
- 行选择同步 inspector
- 限定字段 inline edit：
  - title
  - purpose
  - POV
  - status
- 批量筛选：
  - only unresolved
  - POV
  - status

### 3. Assembly

用于验证章节拼接后的阅读连续性。

展示方式：

- 按 scene 顺序拼出 chapter assembly view
- 每段 scene 之间显示 transition marker
- 若 prose 不全，则显示 summary / missing 状态

可交互：

- 只读优先
- 可跳回对应 scene
- 可在中间看到 gaps / missing transitions / unresolved warnings

---

## 四、Navigator 不再只是“列表”，而是 Binder

左侧 navigator 的职责：

1. 显示当前 chapter 与 scene 层级；
2. 让用户快速定位 scene；
3. 提供少量结构筛选；
4. 提供新建与排序入口。

### Navigator 结构

- Chapter Header
  - chapter title
  - scene count
  - unresolved count
  - current view badge
- Scene Binder List
  - scene index
  - title
  - POV badge
  - status badge
  - unresolved dot
- Compact Filters
  - all
  - unresolved
  - by POV
  - by status
- Actions
  - new scene
  - collapse all / expand all（如有分组）

### 规则

- navigator 以“结构定位”为主，不塞运行按钮
- 所有结构编辑主动作仍应尽量发生在中间主舞台

---

## 五、Inspector 负责解释，不负责主编辑

右侧 inspector 固定为辅助面板，不承载主排序与主编辑。

Chapter / Structure 第一版建议两个 tab：

### 1. Summary

根据当前选中 scene 展示：

- scene one-line summary
- role in chapter（本场戏承担什么功能）
- incoming / outgoing transition brief
- cast / location / linked assets
- current blockers

### 2. Problems

用于显示结构问题：

- missing purpose
- missing POV
- unresolved proposals/items
- duplicated reveal / weak transition
- prose missing

后续可以再加 `Versions`，但不在第一阶段做。

---

## 六、Bottom Dock 用于结构诊断，不用于 scene runtime trace

Chapter 不是 runtime 主战场，因此 bottom dock 的内容要收敛。

第一版建议只有两个 dock tab：

- `Problems`
- `Activity`

### Problems

显示章节层面的结构告警聚合。

### Activity

显示本次会话内对 chapter 做过的结构动作：

- moved scene
- renamed scene
- changed POV
- inserted scene

它更像“工作记录”，不是 agent trace。

---

## 七、Chapter 到 Scene 的下钻必须很顺

Chapter / Structure 成功与否，很大程度取决于能不能平滑跳到 Scene。

### 交互规则

- Sequence / Outliner / Assembly 里点击 scene 主动作：打开对应 `scope=scene`
- 从 Scene 返回 Chapter 时，应恢复：
  - 原 chapterId
  - 原 view
  - 原 sceneId
  - 原 filter 状态

### 目的

Chapter 是编排台，Scene 是导演台。

两者必须是连续工作流，而不是两个孤岛。

---

## 路由与状态设计建议

建议把当前 scene-only route，升级为 workbench route：

```ts
export type WorkbenchScope = 'scene' | 'chapter'
export type WorkbenchLens = 'structure' | 'orchestrate' | 'draft'
export type ChapterView = 'sequence' | 'outliner' | 'assembly'
export type SceneTab = 'setup' | 'execution' | 'prose'

export interface WorkbenchRouteState {
  scope: WorkbenchScope
  lens: WorkbenchLens

  chapterId?: string
  sceneId?: string

  sceneTab?: SceneTab
  chapterView?: ChapterView

  modal?: 'export' | 'new-scene'
}
```

### 路由约束

- `scope=scene` 时必须有 `sceneId`
- `scope=chapter` 时必须有 `chapterId`
- `scope=chapter` 时当前只允许 `lens=structure`
- `scope=scene` 保持现有 `structure / orchestrate / draft`

### 推荐 URL 形式

```text
?scope=chapter&chapterId=chapter-03&lens=structure&view=sequence&sceneId=scene-midnight-platform
```

---

## 数据与 feature 分层建议

建议完全镜像 scene feature 的组织方式，新建 `features/chapter`：

```text
features/chapter/
  api/
    chapter-client.ts
    chapter-contracts.ts
  components/
    ChapterHeader.tsx
    ChapterViewSwitcher.tsx
    ChapterSequenceView.tsx
    ChapterOutlinerView.tsx
    ChapterAssemblyView.tsx
    ChapterNavigatorPane.tsx
    ChapterInspectorPanel.tsx
    ChapterDockPanel.tsx
  containers/
    ChapterWorkspace.tsx
    ChapterStructureContainer.tsx
    ChapterInspectorContainer.tsx
    ChapterDockContainer.tsx
  hooks/
    useChapterRouteState.ts (或统一为 useWorkbenchRouteState)
    useChapterWorkspaceQuery.ts
    useChapterStructureQuery.ts
    useChapterAssemblyQuery.ts
    useChapterActions.ts
    chapter-query-keys.ts
  store/
    chapter-ui-store.ts
  types/
    chapter-view-models.ts
  fixtures/
    chapter-fixtures.ts
```

### 关键原则

- 不要把 chapter 直接塞进 scene feature
- 但命名与分层风格要尽量对齐，降低迁移成本

---

## 视图模型建议

Chapter / Structure 第一版建议至少有 3 类 view model：

### 1. ChapterWorkspaceViewModel

承载顶层工作台数据：

- id
- title
- bookTitle
- summary
- sceneCount
- unresolvedCount
- status
- availableViews

### 2. ChapterStructureViewModel

承载 Sequence / Outliner 共用数据：

- scenes: ChapterSceneCardViewModel[]
- filters
- stats
- warnings

### 3. ChapterAssemblyViewModel

承载拼接阅读视图：

- assembledBlocks
- missingTransitions
- proseCoverage
- warnings

### 4. ChapterSceneCardViewModel

每个 scene 至少有：

- id
- index
- title
- purpose
- POV
- location
- conflict
- reveal
- status
- proseStatus
- unresolvedCount
- summary
- linkedAssetIds

---

## 这轮不做什么

为了避免范围失控，这一轮明确不做：

1. Chapter runtime / orchestration
2. Chapter 级 proposal triage
3. Asset graph 主界面
4. Editor tabs / split view / layout drag-drop
5. 复杂评论系统
6. graph 视图
7. 自定义 database property builder
8. 复杂多人协作状态

---

## 分 PR 计划

## PR1：把 route 和 shell 从 scene-only 升级为 workbench-aware

### 目标

在不破坏现有 Scene 的前提下，把 route 从 `scene route` 升级为 `workbench route`，支持 `scope=chapter`。

### 主要改动

- 将 `useSceneRouteState` 泛化为 `useWorkbenchRouteState`，或新增统一包装层
- 引入 `scope=chapter`
- 引入 `chapterView=sequence|outliner|assembly`
- 让 `WorkbenchShell` 的消费者支持按 scope 切不同 navigator / mainStage / inspector / dock
- 保持现有 Scene 行为不变

### 验收标准

- 现有 Scene 深链不回归
- `scope=chapter` 的 URL 可正确 parse / build / restore
- route 仍然是选中态唯一真源

---

## PR2：接入 Chapter read-only vertical slice（先只做 Sequence）

### 目标

先把 Chapter / Structure 的只读纵切跑起来，让 workbench 真正出现第二个 scope。

### 范围

- 新建 `features/chapter`
- `chapter-client` 先走 mock data
- 做出：
  - Chapter Navigator
  - Chapter Header
  - Sequence View
  - Inspector Summary
  - Dock Problems

### 交互要求

- 默认打开 `Sequence`
- 默认选中第一条可见 scene
- 点击 scene 同步 route 与 inspector
- 可从 sequence 跳入 scene scope

### 验收标准

- 可以通过 URL 直接打开某个 chapter
- chapter navigator / sequence / inspector 正常联动
- 刷新后恢复同一个 chapter/view/scene 选中态

---

## PR3：补齐多视图切换（Outliner / Assembly）

### 目标

把 Chapter 从“能看”升级成“能切不同工作视角”。

### 范围

- 新增 `Outliner`
- 新增 `Assembly`
- 视图切换放在 main stage header
- 三个视图共享同一份 chapter structure query

### 交互要求

- 切换 view 不重置 `sceneId`
- 切换 view 不清空 filters
- Outliner 与 Sequence 选中态联动
- Assembly 可从段落回跳 scene

### 验收标准

- 3 个主视图稳定切换
- 所有视图共享同一选中 scene
- Assembly 能明确显示 missing prose / transition gap

---

## PR4：加入结构编辑动作（不是 runtime 动作）

### 目标

让 Chapter / Structure 成为真正可操作的编排台。

### 第一批编辑动作

- reorder scene
- rename scene
- edit purpose
- edit POV
- edit status
- insert scene before / after

### 设计原则

- 所有操作都应该立即反馈到 Sequence / Outliner / Inspector
- 如果暂时仍是 mock data，也要保证交互闭环成立
- 不在这一轮引入复杂 optimistic merge，只做最小稳定实现

### 验收标准

- 拖拽排序后，navigator / sequence / outliner 顺序一致
- inline edit 后，所有视图同步刷新
- 新插入 scene 能立即出现在 binder 与主视图中

---

## PR5：Problems / Activity 收口 + smoke

### 目标

补齐 Chapter 作为结构工作台最重要的辅助闭环。

### 范围

- Dock: `Problems` / `Activity`
- Inspector: `Summary` / `Problems`
- 结构规则的前端聚合呈现
- 核心 smoke

### smoke 主路径

```text
打开 chapter
-> 默认进入 sequence
-> 选中 scene
-> 切换 outliner
-> 修改 title / POV / status
-> 回到 sequence
-> 拖拽调整顺序
-> 打开 assembly
-> 从 assembly 跳入 scene
-> 返回 chapter 并恢复原选中态
```

### 验收标准

- 结构动作可追踪
- 问题面板可见且不打断主工作流
- chapter <-> scene 跳转不丢上下文

---

## 推荐的实现顺序

```text
1. workbench route 泛化
2. chapter read-only sequence vertical slice
3. outliner / assembly 多视图
4. 结构编辑动作
5. problems/activity + smoke
```

---

## 成功标准

如果这一轮做对了，最终应该出现下面这 5 个结果：

1. 现有 workbench 壳子第一次稳定承载第二个 scope
2. Chapter 不再像“列表页”或“文档页”，而像真正的结构编排台
3. Sequence / Outliner / Assembly 证明“单一数据，多视图”成立
4. Chapter 到 Scene 的下钻工作流打通
5. 你后面再做 Asset / Knowledge 时，会有一套更成熟的 scope 扩展模板

---

## 最值得立刻开始的工作

**优先启动 PR1：route 与 shell 的 workbench 泛化。**

因为 Chapter / Structure 这次前端扩建，真正要验证的不是某个页面，而是：

> 这套 shell 能不能从“只有 Scene”成长为“支持多 scope 的 Narrative Workbench”。

Chapter 是最合适的第一块试金石。
