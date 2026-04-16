# 项目定位与设计借鉴说明

## 这份文档回答什么

这份文档不是实现计划，也不是视觉规范。

它回答的是：

- 这个项目是什么
- 它想解决什么问题
- 它为什么要长成现在这样
- 它借鉴了哪些开源项目
- 这些借鉴最终会怎样落到交互和信息架构上

如果说：
- `DESIGN.md` 解释的是“看起来像什么”
- 各类 PR plan 解释的是“下一步做什么”

那么这份文档解释的是：

**“它到底为什么存在，以及为什么要按这种方式长出来。”**

---

## 一句话定义

**new-narrative-novel 不是一个 AI 写作页面集合，而是一个用于 orchestration-driven-development 的 Narrative IDE。**

它的核心不是单次生成文本，而是把叙事创作中的结构、运行、审阅、知识与成文，组织成一个可追溯、可审阅、可切换工作视角的工作台。

---

## 它要解决的问题

普通写作工具常见的问题是：

- 结构、大纲、正文、设定分散在不同页面甚至不同工具里
- AI 生成内容通常缺乏审阅层和可追溯来源
- 章节与场景之间的切换没有稳定的工作面
- 世界观资料页和实际叙事状态脱节
- 复杂创作过程最后都被压扁成“一个聊天窗口”

这个项目要解决的是另一类问题：

### 1. 对象切换问题
创作者并不总是在“写文本”。

他们可能在处理：
- 一本书
- 一个章节
- 一场 scene
- 一个角色 / 地点 / lore 资产

所以系统必须先回答：**用户当前在处理哪个对象。**

### 2. 工作视角问题
即便处理的是同一个对象，用户做的事也不同：
- 看结构
- 编排运行
- 写正文
- 查知识
- 做审阅

所以系统还必须回答：**用户当前是以什么 lens 在看这个对象。**

### 3. 状态推进问题
叙事 orchestration 不是“点一下生成”。

它更像一条状态流：
- constraints
- proposal
- review
- accepted canon
- prose

系统必须让这条状态流可见、可判断、可回放。

### 4. 可追溯问题
如果正文来自 proposal，proposal 来自 scene manager 或其他 agent，用户就应该能追到：
- 这段变化来自哪里
- 为什么被接受
- 何时进入 canon

---

## 它不是什么

为了避免产品逐渐偏航，这里把“不是什么”写清楚。

### 1. 不是 chat-first AI app
聊天可以存在，但只能是辅助入口，不能成为主舞台。

### 2. 不是传统 wiki
知识沉淀很重要，但项目的主对象不是“页面”，而是叙事对象和它们的运行关系。

### 3. 不是普通写作软件
正文只是终局之一，不是唯一中心。

### 4. 不是一组松散页面
它必须是一套统一 workbench，而不是 Scene、Chapter、Asset 各自一套导航方式。

---

## 核心产品模型

## 1. 双轴模型：Scope × Lens

### Scope（对象轴）
表示“我正在处理什么对象”：
- Book
- Chapter
- Scene
- Asset

### Lens（工作轴）
表示“我正在以什么工作方式看这个对象”：
- Structure
- Orchestrate
- Draft
- Knowledge
- Review（可作为主 lens，也可内嵌于某些 scope）

这个双轴模型的作用是把“对象切换”和“任务切换”分开。

否则所有切换都塞在 tab 里，最终会让：
- scope 语义混乱
- 页面结构越来越不一致
- 新 feature 只能继续长成独立页面

## 2. 状态流模型

系统需要显式承认下面这条状态流：

```text
constraint -> proposal -> review -> accepted canon -> prose
```

这条状态流决定了很多交互纪律：
- proposal 不等于正式写入
- review 必须可见
- accepted canon 必须能追溯来源
- prose 不是孤立文本，而是上游状态的结果

## 3. Workbench 模型

系统应长期收敛到一个 IDE 式 workbench：
- Mode Rail
- Navigator
- Main Stage
- Inspector
- Bottom Dock

这不是为了模仿 IDE，而是因为这类产品天然存在三种不同信息：
- 主任务信息
- 辅助上下文信息
- 运行/诊断信息

如果不把这三类信息分区，UI 最终一定会拥堵。

---

## 设计借鉴矩阵

## 1. VS Code：借工作台纪律

借什么：
- activity bar / side bar / editor / panel / status bar 的空间秩序
- tabs / split / panel 的层级关系
- 布局与打开状态可恢复
- 主编辑区与辅助面板的明确分工

不借什么：
- 过度技术化术语
- 程序员噪音感
- 让所有区域都像 extension 容器

落到本项目：
- `WorkbenchShell` 应该长期保持稳定
- `scene`、`chapter`、`asset` 只是这个壳子里的不同工作面
- bottom dock 承载 Problems / Activity / Runtime，而不抢主舞台

## 2. AppFlowy：借“同一数据，多视图”

借什么：
- 同一份数据可以被 Grid / Board / Calendar 等不同视图复用
- 每个视图拥有自己的 filters / sorts / field visibility
- 视图是工作方式，不是对象复制

落到本项目：
- Chapter 的 `Sequence / Outliner / Assembly` 应共享同一份 chapter 数据
- 未来 Knowledge 也应遵循“一份 asset 数据，多种视图”的方法
- 视图变化应优先通过 route / view state 表达，而不是复制页面

## 3. Outline：借安静与可阅读性

借什么：
- 平静的知识工作体验
- 阅读优先而不是工具感压迫
- 文档和知识工作应当“容易进入”而不是“到处是控件”

落到本项目：
- inspector 要安静、简洁
- 文本型信息要可读
- Knowledge scope 未来应更像 calm knowledge base，而不是后台配置页

## 4. BookStack：借显式层级

借什么：
- 层级清晰
- 结构组织有稳定顺序
- 对“放在哪一层”有非常直白的心智

落到本项目：
- Book / Chapter / Scene 的结构层级要始终清楚
- binder 不能只是一堆平铺列表
- chapter 中 scene 的顺序必须是显式事实

## 5. Wiki.js：借 path / breadcrumb 心智

借什么：
- 页面身份可由路径表达
- 通过 path 与 breadcrumb 建立稳定位置感
- 文档组织不是只有树，也可以是路径化组织

落到本项目：
- route 应成为对象定位与状态恢复的主要载体
- 将来 header / breadcrumb 可以进一步显式表达当前对象位置

## 6. Logseq：借链接意识与 references

借什么：
- linked references / backlinks 的知识组织思路
- 页面与块之间的相互引用意识
- 关联信息可以作为次级视图逐步积累

不借什么：
- graph-first 主入口
- 把图谱探索变成主要编辑方式

落到本项目：
- Asset 未来应有 mentions / references / relations
- 但 graph 只能是探索视图，不该成为默认入口

---

## 项目的交互原则

## 1. 中间主舞台一次只服务一个一级任务

在任意时刻，中间区都必须回答：

**“现在最重要、最该做的那件事是什么？”**

例如：
- Scene / Orchestrate：主任务是审阅与导演
- Chapter / Structure：主任务是编排与比较
- Draft：主任务是阅读与成文

## 2. 右侧只做支持判断，不做主创作

右侧适合放：
- summary
- context
- versions
- mentions
- problems
- notes

右侧不适合放：
- 正文主编辑
- proposal 主审阅流
- 复杂拖拽主交互

## 3. 底部只放运行与诊断，不放主任务

底部 dock 适合：
- problems
- activity
- trace
- runtime
- warnings
- cost / latency（未来）

底部不适合：
- 主要创作任务
- 核心 accept/reject 决策

## 4. route 是恢复状态的核心，不是附属参数

深链、刷新恢复、chapter→scene→chapter 往返，都应优先依赖 route。

## 5. 选中态只保留一个真源

无论是 scene proposal，还是 chapter selected scene，都不应该出现 route/store 双真源。

---

## 当前阶段的产品路线

## Phase 1：Workbench 壳子
已经开始落地。

重点：
- route 泛化
- scope 切换
- chapter 作为第二个 scope 接入

## Phase 2：Scene 纵切闭环
已具备较强基础。

重点：
- scene runtime / proposal / review / prose
- route 与 query 的单一真源

## Phase 3：Chapter / Structure
当前优先级最高。

重点：
- binder
- sequence / outliner / assembly
- chapter→scene handoff
- read-heavy structure workspace

## Phase 4：Knowledge / Assets
在 Chapter 稳定后推进。

重点：
- typed entity
- mentions / relations / versions
- story graph 的次级探索视图

## Phase 5：Branch / Compare / Publish
在主工作流成熟后推进。

---

## 与现有文档的关系

建议把文档职责分开：

### `DESIGN.md`
回答：
- 视觉系统
- 色板 / 字体 / 气质
- 组件美学

### 各类 PR plan
回答：
- 当前具体要改什么
- 先后顺序与验收标准

### 本文档
回答：
- 产品是什么
- 为什么按这种方式长
- 借鉴了谁，取舍是什么

### 未来 README
回答：
- 新人第一次进入仓库时需要知道什么

理想做法是：
- 本文档作为“母文档”
- README 从本文档提炼 20% 的公开版本

---

## 命名建议

为了统一语言，建议长期采用下面这套命名：

### 顶层模式
- Workbench
- Structure
- Orchestrate
- Knowledge
- Draft

### Chapter
- Sequence
- Outliner
- Assembly

### Scene
- Setup
- Directing
- Review
- Draft

### Asset
- Profile
- Mentions
- Relations
- Timeline
- Versions

---

## 最后一句话

这个项目真正独特的地方，不是“用了 AI”，也不是“能生成正文”。

它真正独特的地方是：

**它试图把叙事创作中的结构、运行、审阅、知识和成文，收束进一个可追溯、可切换、可持续扩展的 Narrative IDE。**

这也是它在产品设计上必须坚持 workbench、双轴模型、reviewable orchestration、以及 story-aware knowledge 的原因。

