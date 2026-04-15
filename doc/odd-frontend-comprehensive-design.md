# 独属于你的 orchestration-driven-development 前端设计建议

## 一句话判断

你的前端不应该继续长成“一个带三栏的 AI 页面集合”，而应该长成：

**一个面向叙事编排的 Narrative IDE / Orchestration Workbench。**

它的核心不是页面跳转，也不是聊天，而是：

- 在**对象层级**之间切换：Book / Chapter / Scene / Asset
- 在**工作视角**之间切换：结构、编排、写作、知识、审阅
- 在**状态流**之间推进：constraint → proposal → review → accepted canon → prose

也就是说，真正需要被设计清楚的不是“左中右分别塞什么”，而是：

1. 用户当前在处理**哪个对象**；
2. 用户当前在用**什么工作视角**看这个对象；
3. 系统当前在展示**什么状态变化**；
4. 哪些内容属于**主创作舞台**，哪些只属于**上下文/诊断/版本**。

---

## 我最核心的建议：从固定三栏，升级为 IDE 式 5 面结构

你现在的三栏想法是一个不错的起点，但它还不够表达 orchestration 产品真正的复杂度。

我建议把整体壳子升级成下面这套结构：

1. **最左：Mode Rail（模式栏）**  
   很窄，只放一级工作模式图标。

2. **左侧：Navigator（对象导航）**  
   放书、章、场、资产、保存视图、筛选器、运行队列。

3. **中间：Main Stage（主舞台）**  
   真正做事的地方：结构编辑、scene orchestration、proposal review、正文写作。

4. **右侧：Inspector（检查器）**  
   放 Context / Versions / Runtime / Mentions 这类支持性信息。

5. **底部：Dock / Panel（底部运行面板）**  
   放 event stream、agent trace、prompt trace、告警、成本、调试信息。

### 为什么一定要多出一个底部面板

因为你的产品不是普通文档工具，而是 orchestration-driven-development。

这意味着你有一类信息永远存在：

- run 事件流
- agent 调用轨迹
- proposal 生成来源
- token / latency / cost
- warning / guardrail / conflict
- raw trace / structured trace

这些东西既不适合挤在中间，也不适合塞进右侧。它们天然就应该像 IDE 的 terminal / problems / output 一样，成为一个**支持性但高价值的底部面板**。

这样你原先三栏结构里最大的挤压问题就解开了：

- 中间只做主任务
- 右侧只做上下文与检查
- 底部负责运行诊断

这会让整个产品一下子从“复杂页面”升级为“专业工作台”。

---

## 不是单轴导航，而是“双轴模型”

我非常建议你把前端导航从“一个维度”改成“两个维度”：

## 轴 1：对象 Scope

这是你原文档里已经抓到的部分，而且是对的：

- Book
- Chapter
- Scene
- Asset

这是“我正在处理什么东西”。

## 轴 2：工作 Lens

这是你现在还没完全独立出来的部分：

- Structure：结构 / 大纲 / 节奏
- Orchestrate：运行 / proposal / review / accept
- Draft：正文 / prose / compare
- Knowledge：资产 / 关系 / 引用 / canon

这是“我现在以什么方式看这个东西”。

---

## 为什么双轴比“固定 tab”更强

如果你把所有变化都压进中间 tab，会出现几个问题：

1. 不同 scope 的 tab 语义会越来越不统一。
2. 用户会分不清自己是在切对象，还是在切任务。
3. Assets、Run、Draft、Review 很容易重新长成几个并列页面。

双轴模型可以把这件事分清楚：

- **左侧对象树**负责“当前对象是谁”
- **最左模式栏 / 顶部 Lens 切换**负责“当前工作方式是什么”

于是：

- 选中 `Scene 12`，切到 `Orchestrate`，你看到的是运行与 proposal 审阅
- 选中 `Scene 12`，切到 `Draft`，你看到的是 prose 与 diff
- 选中 `Character / 林渊`，切到 `Knowledge`，你看到的是资产详情、关系和出场
- 选中 `Chapter 3`，切到 `Structure`，你看到的是 scene 序列与节奏

这比“每种 scope 自己发明一套 tab”更稳，也更容易长期扩展。

---

## 借鉴谁：不是抄一个产品，而是“拼接正确的原型”

### 1. 整体壳子：借鉴 VS Code

你确实应该借鉴 VS Code，但只借它的**workbench shell**，不要借它的“开发者噪音感”。

要借的部分：

- Activity Bar / 模式栏
- Navigator + 主编辑区
- Editor Tabs
- Split View
- Right Inspector / Secondary Side Bar 的思路
- Bottom Panel
- Status Bar
- Modal Settings / Profiles / Export 这类 centered overlay

不要借的部分：

- 过密图标
- 满屏技术术语
- 一切都做成 extension 容器
- 代码编辑器式的压迫感
- 太像 IDE 导致写作者疏离

你的产品更应该是：

**VS Code 的壳子，Scrivener 的写作心智，GitHub 的审阅机制，Outline 的知识沉静感。**

### 2. 结构编排：借鉴 Scrivener + Plottr

你的 Chapter / Scene 结构，不该只是树。

它应该至少同时提供三种视图：

- **Tree / Binder**：层级结构
- **Outliner**：按字段看 scene
- **Timeline / Sequence**：按节奏与顺序看 scene

因为写小说和做 orchestration，不仅要看“它在树里在哪”，还要看：

- 这一章有几场戏
- 每场的 POV 是谁
- 冲突有没有升级
- 信息揭示顺序是否合理
- 某角色在哪些 scene 出现

所以，Chapter 最适合的不是传统页面，而是：

- 左边 Binder
- 中间可切 Outliner / Timeline / Corkboard
- 右侧 Inspector 显示选中 scene 的关键信息

### 3. Assets / Story Bible：借鉴 Outline + Notion Backlinks + AppFlowy 多视图

Assets 不应该只做“资料页列表”。

也不应该直接抄一个传统 wiki。

我会把它设计成：

**结构化 Story Bible + 自动 backlinks + 关系图谱 + 时间状态视图**

你可以借：

- **Outline**：文档阅读体验、安静、清楚、协作文档感
- **Notion backlinks**：引用自动回链
- **AppFlowy 多视图数据库**：同一份资产数据可切 table / board / calendar / relation-like 视图
- **BookStack / Wiki.js**：文档组织与自托管知识库思路

但不要直接照搬：

- BookStack 那套过强的书/章/页层级
- 纯文档 wiki 的“页面即一切”心智
- 只靠 markdown 页面对资产建模

因为你的资产不是“文档页面”，而是**叙事实体**。

---

## 我对 Assets 的明确建议：不要做 Wiki，要做 Story Graph

如果我来定义你的 Assets，我会把它设计成三层：

## 第一层：Canonical Record（权威定义层）

每个资产先是一个 typed entity：

- Character
- Location
- Organization
- Object / Prop
- Rule / Lore
- Relationship（可单独建模，也可附着在 Character 上）

每个实体都有稳定字段。

### Character 建议字段

- 名称 / 别名
- 角色类型（主角 / 配角 / antagonistic force 等）
- 外显设定
- 内在动机
- 秘密 / private info
- 说话风格
- 决策倾向
- 当前弧线阶段
- 首次登场
- 最新状态
- 绑定 prompt / policy
- 是否为 canon locked

### Location 建议字段

- 名称 / 别名
- 地点类型
- 地理 / 社会 / 权力属性
- 规则 / 风险
- 可见信息 / 隐藏信息
- 首次出现
- 最近被提及

### Rule / Lore 建议字段

- 规则说明
- 适用范围
- 例外条件
- 首次引入位置
- 被哪些 scene / asset 引用
- 是否冲突 / 已废弃

---

## 第二层：Narrative Connections（叙事连接层）

这层不是写定义，而是记录它在故事里如何被使用。

每个资产都应该自动生成：

- Mentions：在哪些 Book / Chapter / Scene 被提及
- Appearances：是否真实出场，还是仅被提到
- Relations：与哪些角色 / 地点 /组织有关
- State Changes：在哪一场戏状态发生了变化
- Knowledge Boundaries：谁知道它，谁不知道它
- Pending Contradictions：是否与已有 canon 冲突

这部分非常关键，因为你做的是 orchestration，不是纯设定档案。

资产真正有价值的不是“定义写了什么”，而是“它在多少 scene 中怎么起作用”。

---

## 第三层：Operational Layer（运行层）

这一层是很多写作工具没有，但你必须有的：

- 被哪些 agent 引用过
- 最近一次参与哪场 run
- run 中被改写过什么
- 当前 prompt bindings / override
- 是否存在 unresolved proposal
- 是否存在 alias / duplicate 待合并

这层会让 Asset 不只是世界观资料，而是 orchestration 的活对象。

---

## Asset 详情页应该有哪些视图

我建议单个 Asset 至少有下面这些视图：

1. **Profile**  
   主资料页。上方是 summary，下方是 structured fields。

2. **Mentions**  
   列出所有引用它的 chapter / scene，能定位到具体段落或 proposal。

3. **Relations**  
   角色关系 / 地点关系 / 组织从属 / 冲突图。

4. **State Timeline**  
   这非常适合你的产品：按时间或场景顺序显示资产状态如何变化。

5. **Versions**  
   定义变更历史、被谁改、来源于哪次 review / merge。

6. **Prompt & Guard**  
   只对需要 agent 绑定的资产显示。放 persona prompt、private info guard、visibility rules。

### 哪个视图应该是默认

默认必须是 **Profile**，不是 Graph。

原因很简单：

- 图谱很酷，但阅读效率低
- 真正高频任务是查看定义、检查出场、修冲突
- 图谱更适合探索，不适合作为主入口

所以：

- Graph 是二级视图
- Mentions / Relations 才是高频

---

## 资产总览页怎么做：不是“列表页”，而是 Story Bible Index

我建议做一个专门的 Knowledge / Assets 模式。

进入后，左侧 Navigator 是：

- All Assets
- Characters
- Locations
- Organizations
- Objects
- Lore / Rules
- Saved Views
- Orphans（从未被引用）
- Hot Assets（最近频繁被提及）
- Conflicts（存在冲突）
- Needs Review（待确认）

中间主区不是只有一种展示方式，而是可以切：

- **Table**：高密度整理
- **Cards**：适合角色/地点卡片
- **Relation View**：关系网络
- **Timeline View**：看状态变化
- **Mentions View**：按叙事上下文浏览

这就是为什么我更倾向于借 AppFlowy 式“同一数据库，多种视图”，而不是传统 wiki 的单页模型。

---

## 对开源 wiki 的明确判断

### 如果你问：assets 要不要借鉴开源 wiki？

我的答案是：

**要借，但只能借它“知识沉淀”的部分，不能把资产系统做成传统 wiki 本体。**

### 适合借的

#### Outline

适合借：

- 清爽阅读感
- 文档层级不压迫
- calm UI
- 页面间切换自然
- 知识库而不是 CMS 的气质

不适合直接照搬：

- 过于 doc-first
- 对 typed entity 不够强
- 关系、状态、版本、运行信息不够前台

#### BookStack

适合借：

- 简单明确的层级组织
- 稳定文档入口
- 标签和搜索思路

不适合直接照搬：

- 书 / 章 / 页模型过强
- 适合文档库，不适合交叉引用很强的叙事实体网络
- 人物、地点、秘密、关系、状态变化无法自然表达

#### Wiki.js

适合借：

- docs 平台感
- 自托管 / 可扩展思路
- 文档系统的成熟组织逻辑

不适合直接照搬：

- 还是以 wiki page 为主对象
- 对叙事 runtime、review、proposal 这些运行态支持太弱

### 真正适合你的组合

我会推荐一个混合体：

- **Outline 的阅读感**
- **Notion 的 backlinks**
- **AppFlowy 的多视图数据库**
- **BookStack 的稳定目录感**
- **Logseq/知识图谱式的引用意识**

然后在这个基础上加上你自己的“run-aware asset model”。

这才是“独属于你”的资产系统。

---

## 主工作台怎么设计：是的，借 VS Code，但要“去程序员噪音”

## 我的推荐壳子

### 最左 Mode Rail

建议只放 5 个一级模式：

- **Workbench**：默认主工作台
- **Structure**：章节 / 场景编排
- **Orchestrate**：运行 / 审阅 / 提案
- **Knowledge**：资产 / canon / story bible
- **Draft**：正文 / 阅读 / compare

Search、Settings、Export 不应当成为一级模式。

- Search：命令式全局入口
- Settings：全局面板
- Export：动作按钮 / modal

### 左侧 Navigator

这是对象树，不是功能菜单。

在不同模式下，左侧内容允许换皮，但本质都还是导航器。

#### 在 Structure 模式下

- Book
- Chapter list
- Scene tree
- 拖拽排序
- 过滤器：POV / unresolved / arc / status

#### 在 Orchestrate 模式下

- 当前 chapter scenes
- Runs
- Review queue
- Pending proposals
- Blocked scenes

#### 在 Knowledge 模式下

- Asset types
- Saved views
- Conflict sets
- Orphans / Hot assets

### 中间 Main Stage

中间主区必须支持：

- Editor tabs
- Split view
- Compare mode
- Focus mode
- Context-sensitive toolbar

为什么要 tabs？

因为你的用户很可能同时开着：

- Chapter 3 sequence
- Scene 12 orchestration
- Character / 林渊
- Scene 12 prose draft

如果没有 tab 和 split，用户会频繁迷失上下文。

### 右侧 Inspector

我不建议永远只有 `Context / Versions` 两个 tab。

更好的做法是：

- 默认只有 `Context / Versions`
- 在 Orchestrate 模式下，临时增加 `Runtime`
- 在 Knowledge 模式下，临时增加 `Mentions`
- 在 Draft 模式下，临时增加 `Comments / Notes`（如果你以后做批注）

也就是说，右侧是**稳定容器，动态标签**。

这样既保留纪律，也不会被两标签限制死。

### 底部 Dock / Panel

固定放这些：

- Event Stream
- Agent Trace
- Prompt Trace
- Problems / Warnings
- Cost / Latency
- Run Output

注意：

- proposal review 不放底部
- 核心裁决必须留在中间
- 底部只放“支持判断的信息”

---

## Scene 主舞台怎么做：不要做日志页，要做“导演台”

这是你产品最关键的地方。

你的 Scene 并不是“运行一次 AI 生成文本”。

按照你的 agent 分层，它是：

- Book Agent 给章节目标
- Chapter Agent 决定下一场戏目标
- Scene Manager 组织一场戏如何演
- Character Agents 从各自视角产出结构化反应
- Scene Manager 汇总 proposal 与 summary
- Prose Agent 最后成文

这意味着 Scene 主舞台必须把“导演层”视觉化。

## 我建议 Scene Orchestrate 的中间结构

### 上半区：Scene Header

显示：

- scene title
- 所属 chapter
- current run state
- cast
- location
- active constraints
- branch / run selector

### 左中区：Director Board

这是导演视图，不是纯聊天流。

这里展示：

- 当前 scene objective
- 当前 beat / step
- 已完成的 action chunk
- 当前冲突点
- 下一轮待处理 proposal bucket

### 右中区：Proposal Review Stack

按“结构化变更”展示 proposal，而不是整段自然语言。

比如一个 proposal card 可以拆成：

- 谁提出
- 动作 / 意图 / 冲突
- 影响到哪些 canon facts
- 风险
- diff to accepted state
- `Accept / Rewrite / Reject / Comment`

这部分其实应该明显借 GitHub PR review。

### 下半区：Scene Summary / Accepted State

实时显示：

- 已接受的状态变化
- 角色关系变化
- 信息揭示变化
- scene summary
- readiness for prose

这样 Scene 主舞台的感觉就会从“AI 跑日志”升级成“导演审片台”。

---

## Chapter 应该怎么做：借 Scrivener Outliner，不要只是流程页

Chapter 不该只是“批处理按钮集合”。

它更应该像“故事编排器”。

## Chapter Structure 视图建议

### 视图 1：Sequence / Timeline

卡片式 scene 序列，能看：

- 顺序
- POV
- 角色出场
- 冲突强度
- 信息揭示
- scene state

### 视图 2：Outliner

高密度表格，字段可显示：

- title
- purpose
- POV
- location
- conflict
- reveal
- status
- prose status
- last run
- unresolved count

### 视图 3：Chapter Draft Assembly

显示：

- scene prose 片段
- 汇总状态
- 缺口
- 过渡是否顺
- 拼接后的章节阅读稿

这样 Chapter 才会是“章节导演台”，而不是 Scene Run 的放大版。

---

## Draft / Prose 怎么设计：借写作工具，不借聊天产品

正文区不要做成聊天气泡，也不要做成一条条生成消息。

它应该像专业写作工具：

- 正文阅读视图
- diff compare 视图
- 片段接受历史
- 引用来源可追溯
- 可切 scene draft / chapter draft / full manuscript

### 推荐的写作态布局

- 中间：正文
- 右侧：来源 / comments / versions
- 左侧：章节或 scene 目录
- 可开启 Focus Mode

### Draft 模式里应该有的 3 个子视图

1. **Read**：纯阅读
2. **Compare**：当前稿 vs 上一稿 / 分支稿
3. **Traceability**：这一段来自哪些 accepted proposals / summaries

这里的第三点非常关键，因为它是 ODD 产品和普通写作软件最拉开差距的地方。

---

## 审阅机制怎么做：直接借 GitHub PR + Linear Triage

你现在最该借的，不是“AI 聊天 UI”，而是 **PR Review UI**。

### 为什么

因为 orchestration 的关键不是生成，而是：

- 提出变化
- 审阅变化
- 决定是否纳入 canon
- 保留可追溯历史

这和 GitHub pull request 非常像。

### 我建议你把 proposal 流程做成这样

1. agent 输出 proposal
2. proposal 先进 **Triage Queue**
3. 用户或系统 reviewer 在中间主舞台看 proposal card
4. 用户可以：
   - Accept
   - Accept with edit
   - Request rewrite
   - Reject
   - Batch accept
5. accepted proposal 合并到 scene/chapter/book state
6. 所有变更进入 version history

这套心智里，最值得借的是：

- GitHub 的 review / approve / request changes
- Linear 的 triage inbox
- Figma 的分支试验再合并

这三个借来之后，你的 orchestration UI 会一下子从“生成器”变成“审阅型创作系统”。

---

## 分支与实验：借 Figma，不要直接 Git 化 UI

你的产品一定会需要 branch / alt run / speculative scene。

但不要把 UI 做成 Git 客户端。

更适合的方式是借 Figma 的 branch 心智：

- 从当前 scene/chapter 创建 experiment branch
- 在 branch 中试跑 alternate version
- branch 内 comments / proposals 保留
- 确认后 merge selected changes
- 不合适就 archive branch

### UI 上怎么体现

- 主工具栏显示 `Main / Branch A / Branch B`
- 右上角提供 `Compare to Main`
- 中间支持“只合并选择过的 accepted chunks”

这样既保留实验自由，又不会把普通写作者拖进 Git 复杂度里。

---

## 左中右到底怎么优化

## 左边：不要再混“导航”和“动作”

左侧最容易变乱。

我的建议：

左边只允许承载三类内容：

1. 对象树
2. 保存视图 / 过滤器
3. 新建对象

左侧不要放：

- Export
- Review 总入口
- 大量运行按钮
- Settings 主内容
- 一堆一次性操作

### 一个很重要的细节

左边应该支持两种密度：

- **normal**：对象树 + metadata
- **compact**：只看树节点

因为写作 / 审阅时，左边最容易吃掉过多宽度。

---

## 中间：只保留一个“主任务”

中间区最大的设计原则是：

**一次只服务一个一级任务。**

比如在 Scene Orchestrate：

- 中间主任务是导演与审阅
- 不是同时塞满日志、设置、图谱、全文、版本

比如在 Draft：

- 中间主任务是阅读/修改正文
- 不是同时塞满 assets、运行事件、长列表

中间区不能贪。

它必须明确告诉用户：

“你现在最应该做的只有这一件事。”

---

## 右边：只做支持判断，不做主创作

右侧很容易失控。

我建议你给它定铁律：

- 右侧负责 explain，不负责 decide
- 右侧负责 inspect，不负责 author
- 右侧负责 assist，不负责 dominate

### 右侧适合放的内容

- accepted context
- relevant assets
- mentions
- versions
- runtime bindings
- diagnostics summary
- local notes

### 右侧不适合放的内容

- 大段 prompt 主编辑
- 主 proposal 审阅流
- 正文主编辑区
- 章节结构主要拖拽操作

---

## 底部状态栏：低调，但非常值得做

我建议你加一个很轻的 status bar。

显示：

- 当前 project / branch
- 当前 model binding
- run status
- unresolved count
- warning count
- last save / last index

记住：

它不是信息墙，它只是“呼吸感”。

如果做得克制，会很高级。

---

## 我会如何命名整个产品的主要区域

我建议用更有“叙事编排”气质的名字，而不是通用后台词。

### 顶层

- Workbench
- Structure
- Orchestrate
- Knowledge
- Draft

### 中间常见视图名

#### Book
- Premise
- Outline
- Manuscript

#### Chapter
- Sequence
- Outliner
- Assembly

#### Scene
- Setup
- Directing
- Review
- Draft

#### Asset
- Profile
- Mentions
- Relations
- Timeline
- Versions

这些名字比一堆抽象工程词更贴近你的产品气质。

---

## 你最不该做的 8 件事

1. **不要把产品做成 chat-first**  
   聊天是辅助，不是主舞台。

2. **不要把 assets 做成纯 wiki**  
   它必须是 typed, linked, versioned, run-aware 的 story graph。

3. **不要坚持固定三栏是唯一圣经**  
   orchestration 产品天然需要底部运行面板。

4. **不要让 Review 变成独立宇宙**  
   Review 应嵌入 Scene / Chapter 主舞台。

5. **不要把 runtime 诊断塞进右侧**  
   放底部。

6. **不要让 top tabs 同时表达对象、模式、生命周期**  
   它会越来越乱。

7. **不要默认用 graph 当主入口**  
   图谱只适合探索，不适合高频编辑。

8. **不要做 Dashboard 首页**  
   打开项目就进工作台。

---

## 如果只允许我给你一个最像“你的”方案

我会给你这个定义：

## 产品定义

**Narrative IDE with Reviewable Orchestration**

## 壳子

- 借 VS Code 的 workbench shell
- 借 Scrivener/Plottr 的叙事编排视图
- 借 Outline/Notion/AppFlowy 的知识组织方式
- 借 GitHub / Linear / Figma 的 triage、review、branch 心智

## 核心创新点

不是“多 agent 聊天”，而是：

- scene manager 可视化
- proposal triage queue
- reviewable canon merge
- asset as story graph
- prose traceability

## 视觉气质

- 比 IDE 更安静
- 比 wiki 更动态
- 比写作软件更可追溯
- 比 agent 控制台更有人类导演感

---

## 我建议的第一版落地顺序

### Phase 1：先做 Workbench Shell

先把外壳搭好：

- mode rail
- navigator
- main stage
- inspector
- bottom panel
- tabs / split / status bar

### Phase 2：先打爆 Scene Orchestrate

这是你的王牌。

优先做：

- scene directing board
- proposal review stack
- accepted state panel
- event trace dock

### Phase 3：做 Asset Story Graph

先支持：

- typed assets
- profile
- mentions
- relations
- versions
- backlinks

### Phase 4：做 Chapter Structure

补上：

- outliner
- sequence / timeline
- chapter assembly

### Phase 5：做 Branch / Compare / Publish

最后做：

- experiment branches
- compare to main
- selective merge
- export modal

---

## 最终结论

你接下来不该问“左边放什么，中间放什么，右边放什么”。

你真正该问的是：

- 我这个产品的**主工作面**有哪些？
- 我的用户是在切**对象**，还是切**工作方式**？
- proposal / review / merge 的状态流，能不能像 PR 一样清晰？
- assets 能不能从资料页，升级成真正的 story graph？

如果这四个问题答清楚了，你的前端就会从“一个有 AI 的写作工具”变成：

**一个真正独属于你的 orchestration-driven-development Narrative IDE。**

