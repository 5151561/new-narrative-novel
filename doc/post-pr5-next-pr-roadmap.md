# PR6 以后路线图（基于 `codex/pr5-chapter-scene-handoff` 当前状态）

## 结论

PR5 完成后，项目已经跨过了一个很关键的里程碑：

- Chapter / Structure 不再只是孤立结构台，而是已经能把选中的 scene 显式 handoff 到 Scene / Orchestrate 或 Scene / Draft。
- scene navigator 也已经能承接 chapter 暴露出来的 scene 集合，不再停留在早期硬编码两条 scene 的阶段。
- 但整个 workbench 目前仍主要围绕 **Scene + Chapter** 两个 scope 展开，而且 chapter 仍然基本只有 **Structure** 这一条 lens。

因此，后续 PR 不应该回头继续打磨 PR5 已经解决的“跨 scope 连通性”，而应该转向三个更有价值的方向：

1. 把 Chapter 从 **read-heavy structure workspace** 推进到 **可写、可调整的结构工作面**。
2. 把当前只在 Scene 上成立的 lens 模型，推进到 Chapter，验证 **同一对象可切多种工作视角**。
3. 在 Chapter 稳定之后，正式引入 **Asset / Knowledge**，再逐步抬升到 **Book** 层。

一句话判断：

**PR6 之后的主线，不再是“能不能跳过去”，而是“能不能在这个 workbench 里持续做事、改东西、追溯来源，并逐步承载第三和第四个对象层级”。**

---

## 一、当前项目状态判断

基于当前分支，我认为项目现在已经形成了下面这个状态：

### 1. Scene × Chapter 的双 scope 骨架已经成立

你当前仓库已经明确把项目定义为一个 Narrative IDE / Workbench，核心模型是：

- Scope：Book / Chapter / Scene / Asset
- Lens：Structure / Orchestrate / Draft / Knowledge
- State flow：constraint → proposal → review → accepted canon → prose

这说明后续 PR 的正确方向，不是继续堆“更多页面”，而是继续兑现这个双轴模型。  

### 2. PR5 已经把 Chapter → Scene workflow 打通

PR5 的目标本来就是：

- scene parity
- chapter → scene 显式 handoff
- app-level roundtrip smoke
- 少量命名与标题 polish

现在这部分既有规划依据，也已经在当前分支代码里落地了。后续就不该再围着 handoff 本身打转，而该进入 handoff 之后真正能做什么。  

### 3. 当前真正的缺口，不是 route，而是“作者工作面深度”

PR2–PR5 的主线，本质上把 Chapter / Structure 做成了一个 **read-heavy、可深链、可往返 Scene** 的工作面。这个目标已经完成。完成之后，文档里明确列出的下一阶段选择，正是：

- structure mutations（reorder / inline edit）
- knowledge / assets
- chapter draft assembly 的更深写作工作流

也就是说，当前最值得做的，不是再做一次 chapter read-only polish，而是进入真正的下一阶段。  

---

## 二、后续路线的总原则

### 原则 1：先加“工作深度”，再加“对象数量”

虽然长期目标里有 Book / Chapter / Scene / Asset 四类对象，但当前 shell 仍主要只承载 Scene 与 Chapter，chapter 也基本只有 Structure 视角。

所以后续正确顺序应当是：

- 先把 Chapter 做深
- 再引入 Asset / Knowledge
- 最后再抬升到 Book

### 原则 2：继续维持“窄而实”的 PR 节奏

PR4、PR5 的计划文档已经证明，你这个项目最适合的推进方式不是“大一统重构”，而是：

- 每个 PR 只解决一个清楚问题
- 每个 PR 都有明确不做项
- 先 fixture / story / query / route
- 再接交互与集成测试

后续路线也应该继续维持这个节奏。

### 原则 3：不要过早进入 Branch / Compare / Publish

项目定位文档已经把 Branch / Compare / Publish 放在主工作流成熟之后。也就是说，在 Chapter 写路径、Asset / Knowledge、Book 层都还没成形之前，不建议提前做分支系统、复杂 compare 或 publish。  

### 原则 4：继续坚持 workbench 纪律

后续 PR 仍应维持：

- 中间主舞台一次只做一个一级任务
- 右侧只做支持判断
- 底部只放问题、活动、运行信息
- route 继续承担恢复状态，而不是另起一套真源

---

## 三、推荐的后续 PR 顺序

我建议把 PR6 之后拆成两段：

### 第一段：把 Chapter 从“可读”推进到“可写”

- **PR6：Chapter Structure Mutations**
- **PR7：Chapter Draft Lens / Assembly Read Flow**

### 第二段：把 Workbench 从双 scope 推进到三 / 四 scope

- **PR8：Asset / Knowledge Foundation**
- **PR9：Canon & Traceability Bridge**
- **PR10：Book Structure Workspace**

然后再把：

- **PR11：Branch / Compare / Publish**

放到更后面。

---

## 四、PR6：Chapter Structure Mutations

## 目标

把 Chapter / Structure 从 **只读结构台** 推进到 **最小可写结构台**。

PR5 之前你证明的是：

- 章节可看
- 视图可切
- scene 可 handoff
- 返回路径可恢复

PR6 应该证明的是：

- 章节结构不仅能看，还能改
- 改动能够在 binder / sequence / outliner / assembly 里同步
- 改动不会破坏当前已经成立的 route / query identity 纪律

## 为什么它应该是下一步

因为当前最大的产品瓶颈已经不是“能否从 chapter 进入 scene”，而是：

**用户在 Chapter / Structure 里看出问题后，还不能直接修结构本身。**

如果这个缺口不补，chapter 仍然只是一个观察台，而不是一个真正的编排台。

## 建议范围

### 必做

1. **chapter mutation layer**
   - 给 chapter feature 增加窄的 mutation API / hook
   - 保持 query identity 不变
   - 以 optimistic update 为优先

2. **scene reorder（章内）**
   - 支持章内 scene 顺序调整
   - binder / sequence / outliner / assembly 同步反映新顺序
   - selected scene 不丢失

3. **有限字段 inline edit**
   - 只开放极少数字段
   - 建议首批字段：`title / summary / purpose / reveal`
   - 不做全字段编辑器

4. **chapter dock 的 mutation feedback**
   - 在 Problems / Activity 之外加入最小 dirty/save feedback
   - 例如：最近一次 reorder、最近一次字段修改、是否有未保存更改

5. **测试与 story**
   - mutation hook 测试
   - reorder 集成测试
   - inline edit 组件测试
   - Storybook 状态补充

### 明确不做

- 不做跨 chapter 移动
- 不做 scene create/delete
- 不做 AI 自动重排
- 不做多人协作冲突
- 不做复杂 undo tree

## 验收标准

- reorder 后四个 chapter 视图同步更新
- selected scene 与 route 恢复不乱
- mutation 不改变 chapter query key 规则
- chapter 终于从 read-heavy workspace 升级为最小 write-capable workspace

---

## 五、PR7：Chapter Draft Lens / Assembly Read Flow

## 目标

让 Chapter 不再只有 Structure 一个 lens，而是拥有第二条真正可用的工作视角：**Draft**。

## 为什么它值得紧跟 PR6

当前 Scene 已经证明了同一对象可以在 `Structure / Orchestrate / Draft` 之间切换；但 Chapter 还没有真正兑现这个双轴模型。

如果 PR6 解决“Chapter 能改结构”，那么 PR7 应该解决：

**Chapter 能否作为“章节阅读 / 拼接 /对照”的工作面存在，而不仅仅是结构视图。**

这一步的价值很高，因为它会第一次在 Chapter 这个对象上验证：

- 同一对象
- 多条 lens
- route 可恢复
- scene ↔ chapter ↔ prose 工作流连续

## 建议范围

### 必做

1. **chapter route 扩展到 draft lens**
   - chapter 不再只支持 `lens='structure'`
   - 新增 `lens='draft'`
   - route 恢复要成立

2. **Chapter Draft Workspace**
   - assembled chapter prose 的只读工作面
   - 从 scene prose 聚合章节阅读稿
   - 默认支持按 scene 分段阅读

3. **Read / Compare 两种阅读状态（可先轻量）**
   - `Read`：连续阅读
   - `Compare`：当前 assembled draft vs 上一个版本 / 上一个 checkpoint
   - 若 PR 过窄要求更强，可先只做 `Read`，为 compare 预留位置

4. **scene source trace**
   - 能从 assembled chapter prose 跳到对应 scene
   - 能从 chapter draft 定位回 scene draft
   - route / back 仍然连续

5. **chapter inspector 在 draft lens 下切换为支持阅读的信息结构**
   - 比如：来源 scene、缺口、过渡风险、变更摘要

### 明确不做

- 不做 full manuscript
- 不做 publish
- 不做复杂评论系统
- 不做 AI 自动 chapter rewrite

## 验收标准

- Chapter 成为第二个真正支持多 lens 的对象
- 章节不再只有结构视角，也能承担阅读与拼接任务
- chapter ↔ scene 的路线从“结构 handoff”扩展为“正文来源往返”

---

## 六、PR8：Asset / Knowledge Foundation

## 目标

把 **Asset** 作为第三个对象 scope 正式接进 workbench，并先做成 **read-heavy knowledge workspace**。

## 为什么放在 PR8，而不是更早

因为在当前阶段，Chapter 刚刚稳定；如果直接跳到 Asset，很容易让项目同时出现：

- 第三个 scope
- 新的数据模型
- 新的 navigator
- 新的主舞台
- 新的 inspector

复杂度会上升得太快。

先完成 PR6–PR7 后，再引入 Asset，会更符合你现有项目一贯的推进节奏。

## 建议范围

### 必做

1. **asset route / scope 接入**
   - `scope='asset'`
   - 默认 `lens='knowledge'`

2. **typed asset mock db + query layer**
   - 首批类型建议只做：
     - Character
     - Location
     - Rule / Lore
   - 不要一开始就铺满所有实体种类

3. **Knowledge Navigator**
   - All Assets
   - Characters
   - Locations
   - Lore / Rules
   - Saved Views（可选但推荐预留）

4. **Asset Main Stage 第一版**
   - `Profile`
   - `Mentions`
   - `Relations`
   - Graph 先不做主入口

5. **Asset Inspector / Dock 第一版**
   - inspector：summary / versions / notes
   - dock：problems / activity / pending contradictions

### 明确不做

- 不做 graph-first 主入口
- 不做复杂 prompt binding 编辑器
- 不做运行态 agent 面板
- 不做全量 story bible CMS

## 验收标准

- workbench 正式从双 scope 进入三 scope
- Asset / Knowledge 不是 wiki page，而是 typed entity workspace
- Scene / Chapter 未来可以把 references 落到 Asset 上

---

## 七、PR9：Canon & Traceability Bridge

## 目标

把当前已经存在的 proposal / accepted canon / prose / asset references，真正串成一条 **可追溯链**。

## 为什么它应该在 Asset 之后

Asset 先落地后，traceability 才有更稳定的承载对象。否则你只能在 scene 内部做局部版本说明，无法把“这段 prose 来源于哪些 accepted changes，又影响了哪些 assets”真正表达清楚。

## 建议范围

### 必做

1. **scene/chapter prose 的来源标注**
   - prose 片段能追到 accepted proposal / accepted summary / scene checkpoint

2. **asset mentions / backlinks**
   - asset 可看到自己在哪些 chapter / scene / prose 中被引用
   - chapter / scene inspector 可看到相关 asset 摘要

3. **版本与检查点桥接**
   - scene draft、chapter draft、asset versions 之间有最小可读关联

4. **traceability inspector / side pane**
   - 不把追溯信息塞到主舞台
   - 仍坚持主舞台只做一级任务，追溯作为支持判断信息

### 明确不做

- 不做复杂时间旅行 UI
- 不做全量审计系统
- 不做分支合并

## 验收标准

- prose 不再只是结果文本，而能解释“它从哪来”
- asset 不再只是资料页，而有叙事引用与变更上下文
- ODD 的 reviewable orchestration 理念开始真正前台化

---

## 八、PR10：Book Structure Workspace

## 目标

把 **Book** 作为第四个对象层级接进 workbench，但第一版仍然坚持 **read-heavy structure workspace**，不要一开始就做 full manuscript 管理器。

## 为什么它要放在 Asset 与 Traceability 之后

因为 Book 层需要承接的不是单个 scene 或单章，而是：

- chapter 顺序
- chapter 摘要
- chapter draft readiness
- 全书结构压力
- 全局 unresolved

如果没有前面几轮对 Chapter / Asset / Traceability 的铺垫，Book 很容易变成一个空壳总览页。

## 建议范围

### 必做

1. **book scope 接入**
   - `scope='book'`
   - 首先只做 `lens='structure'`

2. **Book Navigator**
   - chapter list
   - section / part（若已有模型则接入；若没有则先省略）

3. **Book Main Stage 第一版**
   - chapter sequence
   - chapter outliner
   - chapter unresolved heatmap（可轻量）

4. **Book → Chapter handoff**
   - 从 Book 打开 Chapter / Structure
   - 返回恢复位置

5. **Book Inspector / Dock**
   - 全书摘要
   - unresolved 汇总
   - chapter-level risks
   - 最近活动

### 明确不做

- 不做 full manuscript publish
- 不做封面、导出、发行流程
- 不做多卷/系列复杂管理

## 验收标准

- workbench 四个对象轴终于全部接齐：Book / Chapter / Scene / Asset
- Book 不再是 README 里的概念，而成为真正可进入的工作面
- chapter / scene / asset 的积累开始在 book 层汇总

---

## 九、PR11 以后：Branch / Compare / Publish

这一段我不建议马上做，但应该明确保留为后续阶段。

## 适合进入这一阶段的前提

至少需要下面几项都已成立：

- Chapter 已可写
- Chapter Draft 已成立
- Asset / Knowledge 已成立
- Traceability 已成立
- Book 层已成立

## 那时再做的内容

- experiment branch
- compare to main
- selective merge
- publish / export
- review inbox / batch triage 的更深工作流

也就是说，这一段更像是 **workflow acceleration layer**，而不是当前最该优先补的基础层。

---

## 十、我最推荐的执行顺序

### 近三轮

1. **PR6：Chapter Structure Mutations**
2. **PR7：Chapter Draft Lens / Assembly Read Flow**
3. **PR8：Asset / Knowledge Foundation**

这是我最推荐的前三步，因为它们分别解决了：

- Chapter 能不能改
- Chapter 能不能承担第二条 lens
- Workbench 能不能进入第三个对象层级

### 中期两轮

4. **PR9：Canon & Traceability Bridge**
5. **PR10：Book Structure Workspace**

这是把项目从“scene + chapter 原型”推进到“对象层级完整、追溯链初步成立”的关键阶段。

---

## 十一、每个后续 PR 都应继续遵守的实施纪律

### 1. 继续 Storybook-first

关键组件和关键页面仍应先 fixture、再 story、再 route / query / mutation 接线。

### 2. 继续 route-first 恢复策略

不要为了新功能轻易新增第二真源 store。

### 3. 继续窄 PR

不要把：

- 新 scope
- 新 lens
- 新 mutation 系统
- 新 traceability 模型

一次塞进同一个 PR。

### 4. 继续把 graph / branch / publish 放后面

这些都重要，但它们不是当前最能增加项目“可工作性”的部分。

---

## 十二、最后一句话判断

如果 PR5 的意义是：

**“Chapter 终于不再是孤立结构台，而能把判断平滑送入 Scene。”**

那么 PR6 之后的意义应该是：

**“这个 workbench 不仅能切对象，也能真正承载修改、阅读、知识与追溯，并最终把对象轴扩展到 Asset 与 Book。”**
