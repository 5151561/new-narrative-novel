# Frontend Workbench Constitution

> 目的：防止 AI agent 在执行前端任务时，把本项目从 **Narrative IDE / Workbench** 扭曲成普通网页、Dashboard、三栏内容页或组件集合。
>
> 本文档是所有前端 PR、AI 执行计划、代码实现、Storybook 和验收测试的必读约束。任何 PR plan、局部需求、组件实现若与本文冲突，优先服从本文。

---

## 0. 一句话宪法

**本项目不是网页应用，不是 AI 写作页面集合，不是 Dashboard，不是 chat-first 产品。它是一个围绕叙事对象、工作视角、审阅流和追溯链组织起来的 Narrative IDE。**

前端的最高目标不是“把功能展示出来”，而是让用户在一个稳定、可恢复、可审阅、可扩展的 Workbench 中持续工作。

---

## 1. 产品身份不可变

### 1.1 本项目是什么

本项目是：

```text
Narrative IDE for Reviewable Orchestration
```

它围绕四类对象展开：

```text
Book / Chapter / Scene / Asset
```

它围绕工作视角展开：

```text
Structure / Orchestrate / Draft / Knowledge / Review
```

它围绕状态流展开：

```text
constraint -> proposal -> review -> accepted canon -> prose
```

### 1.2 本项目不是什么

本项目不是：

- 普通网页后台
- 三栏 AI 写作页
- Dashboard 集合
- Chat-first AI app
- Wiki page collection
- Prompt playground
- 一组互相跳转的 feature pages

### 1.3 判断标准

任何新增 UI 都必须先回答：

```text
用户当前在处理哪个对象？
用户当前用什么 lens 处理它？
主舞台当前唯一一级任务是什么？
右侧和底部分别提供什么支持信息？
这个状态是否能通过 route / layout 恢复？
```

如果答案不清楚，不能实现。

---

## 2. Workbench 是最高前端结构

### 2.1 所有业务必须进入 WorkbenchShell

任何新功能必须落在 Workbench 中。

允许的顶层工作面只有：

```text
Mode Rail
Navigator
Main Stage
Inspector
Bottom Dock
```

禁止新增绕过 WorkbenchShell 的页面级壳子，例如：

```text
/full-page-dashboard
/asset-dashboard
/review-page
/run-console-page
/export-page
```

除非该页面是启动前的 project picker、auth、error boundary 或全局设置 modal。

### 2.2 Shell owns layout, scopes provide content

WorkbenchShell 拥有：

- pane visibility
- pane width / height
- sash resize
- dock collapsed / expanded / maximized
- layout persistence
- reset layout
- keyboard layout commands
- shell-level accessibility semantics

业务 scope 只提供：

- mode rail content
- navigator content
- main stage content
- inspector content
- bottom dock content

业务 scope 不得自己实现：

- splitter / sash
- local pane width
- local inspector toggle
- local dock maximize
- duplicated layout persistence
- business-specific shell grid

如果某个业务功能需要控制布局，它必须通过 Workbench layout kernel 的公开 API，而不是自己造布局状态。

---

## 3. Route / Layout 边界不可混淆

### 3.1 Route 表达工作身份

URL / route 只能表达：

```text
scope
object id
lens
view / tab / selected object
review issue id
checkpoint / branch 等工作身份
```

例如：

```text
scope=book&id=book-signal-arc&lens=draft&draftView=compare&selectedChapterId=...
```

### 3.2 Layout 表达本机偏好

layout state 只能表达：

```text
navigator hidden / visible
inspector hidden / visible
dock hidden / visible
dock maximized
pane sizes
last layout preset
```

这些状态属于本机偏好，应该存入 localStorage / desktop preference，不应该污染 route。

### 3.3 禁止事项

禁止把下面内容写入 route：

- navigator width
- inspector width
- dock height
- pane hidden state
- layout preset
- sidebar collapsed state

禁止把下面内容只存在 layout state：

- 当前 scene / chapter / asset / book
- 当前 lens
- 当前 structure view
- 当前 review issue
- 当前 selected proposal / variant
- 当前 checkpoint / branch

---

## 4. Scope × Lens 是产品主轴

### 4.1 Scope 是对象轴

Scope 回答：

```text
我正在处理什么对象？
```

合法对象包括：

```text
Book / Chapter / Scene / Asset
```

### 4.2 Lens 是工作轴

Lens 回答：

```text
我正在以什么工作方式处理它？
```

常见 lens 包括：

```text
Structure / Orchestrate / Draft / Knowledge / Review
```

### 4.3 禁止把对象切换和任务切换塞进普通 tabs

错误：

```text
一个页面里有 Book tab / Chapter tab / Scene tab / Asset tab
一个页面里混放 Structure / Draft / Review / Runtime 大 tab
每个 scope 自己发明一套导航和 tab 语义
```

正确：

```text
scope 决定对象身份
lens 决定工作方式
view / tab 只在当前 lens 内表达局部视图
```

---

## 5. Main Stage 一次只服务一个一级任务

### 5.1 主舞台必须有唯一主任务

Main Stage 必须回答：

```text
用户现在最应该做的那一件事是什么？
```

示例：

```text
Scene / Orchestrate -> 审阅 proposal、导演 run、接受或拒绝变化
Chapter / Structure -> 比较 scene 顺序、节奏、assembly seam
Chapter / Draft -> 阅读章节稿，定位 scene 来源
Book / Draft / Compare -> 对照 manuscript checkpoint
Asset / Knowledge -> 阅读 profile、mentions、relations
Review -> 处理 review issue 与 source fix
```

### 5.2 禁止主舞台 Dashboard 化

禁止把 Main Stage 做成：

- 多个不相关卡片拼盘
- KPI 总览墙
- 各种组件平铺
- “所有信息都能看到一点”的 overview
- 没有明确下一步动作的 landing page

允许 overview 的条件：

- overview 本身就是当前 lens 的主任务；
- 它仍然围绕一个对象；
- 它有明确的选择、检查或 handoff 行为；
- 它不是为了偷懒把多个功能堆在一起。

---

## 6. Navigator / Inspector / Dock 的职责边界

### 6.1 Navigator：只做对象导航

Navigator 适合放：

- book / chapter / scene / asset tree
- saved views
- filters
- review queue navigation
- current object siblings
- lightweight status badges

Navigator 不适合放：

- primary writing editor
- proposal review stack
- runtime log 主视图
- prompt editor
- export workflow
- 大量一次性 action

### 6.2 Inspector：只做 supporting judgment

Inspector 适合放：

- summary
- context
- versions
- mentions
- trace summary
- selected object metrics
- source facts
- consistency warnings

Inspector 不适合放：

- 正文主编辑
- proposal 主审阅流
- chapter reorder 主交互
- run execution 主控制台
- full prompt editor
- 大型表单工作流

### 6.3 Bottom Dock：只做 problems / activity / runtime / trace

Bottom Dock 适合放：

- Problems
- Activity
- Runtime events
- Trace
- Warnings
- API / worker status
- run progress
- debug summaries

Bottom Dock 不适合放：

- 主创作任务
- 核心 accept / reject 决策
- 正文主阅读
- 主结构编辑
- 资产 profile 主阅读

---

## 7. Opened Contexts 优先于页面跳转

### 7.1 新业务应优先成为 opened context

当用户打开一个 scene、chapter、asset、review issue、artifact、trace、checkpoint compare 时，应优先考虑它是 Main Stage 中的 opened context，而不是独立页面。

长期方向：

```text
WorkbenchShell
  -> opened contexts / editor-like surface
  -> tabs / split / compare / focus mode
```

### 7.2 禁止 feature-page 思维

错误：

```text
做一个 Review 页面
做一个 Artifacts 页面
做一个 Trace 页面
做一个 Export 页面
```

正确：

```text
Review 是某个 scope / lens 下的工作视角或 opened context
Artifact 是可从 run / trace / draft 打开的 supporting context
Trace 是 inspector / dock / opened context，而不是脱离对象的页面
Export 是 Book / Draft 后续工作流，而不是全局网页页面
```

---

## 8. AI / Run / Review 的前端纪律

### 8.1 Chat 不是主舞台

Chat 可以作为辅助入口，但不能成为默认主工作面。

禁止：

```text
把 Scene Orchestrate 做成聊天窗口
把 Character Agents 做成群聊 UI
把 Prose generation 做成消息流
把 review 做成 chat transcript
```

正确：

```text
agent output -> structured proposal
proposal -> review
accepted decision -> canon patch
canon patch -> prose artifact
prose artifact -> draft / trace
```

### 8.2 Proposal 不等于 Canon

前端必须持续表达：

```text
proposal 是候选
review decision 是裁决
accepted canon 是故事真相
prose 是渲染结果
trace 是解释链
```

任何 UI 如果让用户误以为 “AI 输出 = 正文 / canon”，即失败。

### 8.3 Run events 只放轻量 refs

Run event stream 不得内联：

- 大 prompt
- 大 context packet
- LLM 原始长输出
- prose 全文
- trace 全量树

它只能展示事件与 refs：

```text
context-packet
agent-invocation
proposal-set
review
canon-patch
prose-draft
artifact
trace
```

---

## 9. Storybook 是 Workbench 行为验收，不只是截图

每个新增主要 surface / shell behavior 必须有 Storybook 状态。

### 9.1 Shell / layout 必备 states

WorkbenchShell 至少覆盖：

```text
Default
NavigatorHidden
InspectorHidden
BottomDockHidden
ResizedPanes
BottomDockMaximized
NarrowViewport
RestoredLayout
```

### 9.2 业务 workspace 必备 states

每个 scope / lens workspace 至少考虑：

```text
Normal
Loading
Empty
Error
SelectedMiddleItem
InspectorHidden
DockHidden
NarrowViewport
```

### 9.3 Storybook 不是可选 polish

如果一个 PR 改变了布局、主舞台、inspector、dock、navigator、review flow、run flow，但没有对应 Storybook 状态，默认不合格。

---

## 10. 测试必须固定产品心智

### 10.1 必测内容

重要 PR 必须测试：

- route 恢复
- selected object 单一真源
- layout state 不污染 URL
- shell pane hide / resize / restore
- main stage 主任务不被 inspector / dock 接管
- handoff 后 browser back 恢复
- hidden pane 下业务仍可用
- dock maximize 不破坏 navigator / inspector state

### 10.2 禁止只测“渲染了文本”

如果测试只断言：

```text
标题存在
按钮存在
卡片数量正确
```

但没有断言 route、layout、selection、handoff、role boundaries，则测试不足。

---

## 11. PR 计划必须包含宪法合规章节

每个前端 PR plan 必须包含：

```md
## Workbench Constitution Compliance

This PR must not:
- bypass WorkbenchShell
- add page-like dashboard
- implement local pane layout
- duplicate shell state
- put primary work in Inspector or Bottom Dock
- mix route state with layout preference
- create a second selected-object truth source

This PR must:
- declare scope / lens / opened context ownership
- keep Main Stage primary task clear
- use WorkbenchShell surfaces
- preserve route restore
- preserve layout restore
- add Storybook states for affected surfaces
- add tests for route / layout / selection boundaries
```

如果 PR plan 没有这一节，不能执行。

---

## 12. AI Agent 执行协议

任何 AI agent 开始前端实现前，必须先做以下检查：

### 12.1 Before coding

回答：

```text
这个 PR 改的是 shell、scope、lens、opened context、还是具体组件？
它是否需要改 WorkbenchShell？
它是否新增主工作面？
它的主舞台一级任务是什么？
它有没有把 layout 写进业务组件？
它有没有新增第二个 selected state？
```

### 12.2 During coding

必须避免：

- 为了完成功能临时加 page wrapper
- 为了局部方便新增 useState(selectedX)
- 在业务组件里写 grid-template shell
- 在 inspector 里塞主任务
- 在 dock 里塞主决策
- 把所有信息卡片化平铺

### 12.3 Before final response

必须检查：

```text
是否仍然像 IDE？
是否还能解释 scope / lens / main task？
是否绕过了 shell？
是否破坏 route/layout 边界？
Storybook 是否覆盖新状态？
测试是否覆盖状态恢复和选中真源？
```

如果答案不确定，PR 不应声称完成。

---

## 13. 自动失败条件

出现以下任一情况，PR 直接失败：

1. 新增绕过 WorkbenchShell 的业务页面。
2. 业务 scope 自己实现 pane hide / resize / dock maximize。
3. route 中出现 navigator width / inspector width / dock height 等 layout preference。
4. localStorage 中保存 current scene / current lens 等工作身份。
5. Inspector 承担主编辑、主 review、主 writing、主 orchestration。
6. Bottom Dock 承担 accept / reject / rewrite 等核心裁决。
7. Main Stage 退化成卡片 Dashboard，无法说清唯一主任务。
8. 新增 selected object store，与 route 形成双真源。
9. 新 scope / lens 没有接入完整五面 workbench。
10. 改动布局但没有 Storybook 状态和 shell-level tests。
11. AI 输出直接变成 canon / prose，绕过 review / artifact / trace。
12. Run event 内联大 prompt / prose / raw LLM output。

---

## 14. 判断一个 UI 是否偏航

### 14.1 它像 IDE 的表现

- 用户知道自己正在处理哪个对象。
- 用户知道自己处在哪个 lens。
- 主舞台只有一个清楚任务。
- Navigator 是对象导航，不是动作墙。
- Inspector 是上下文判断，不是主编辑器。
- Dock 是问题、活动、运行、追溯，不是主工作流。
- 布局可隐藏、可调整、可恢复。
- route 可深链、可刷新、可 back。
- Storybook 能展示不同工作台状态。

### 14.2 它像网页的危险信号

- 一堆卡片平铺在主舞台。
- 每个 feature 自己一个页面。
- 每个 scope 自己发明布局。
- “打开”意味着跳到另一个页面，而不是工作台 context。
- 右侧越来越像第二主舞台。
- 底部越来越像另一个页面。
- route 只是页面跳转参数，不承担工作状态。
- layout 无法恢复。
- 用户关掉/调整某个 pane 后其他 scope 不继承。

---

## 15. 推荐后续前端推进顺序

若当前 UI 已经开始偏向网页化，应优先做：

```text
1. Workbench Layout Kernel
2. Opened Contexts / Main Stage Tabs
3. Command Palette / Layout Commands
4. Status Bar / Runtime Signals
5. Review / Trace / Export 等业务深化
```

不要在固定网页壳上继续堆业务。

---

## 16. 最后一条

**AI agent 默认会完成局部功能，但不会自动守住产品心智。**

因此，前端实现的第一责任不是“把需求做出来”，而是：

```text
在不破坏 Narrative IDE / Workbench 心智的前提下，把需求做出来。
```

如果两者冲突，宁可缩小功能范围，也不能破坏 Workbench。
