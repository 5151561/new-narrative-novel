# new-narrative-novel

> 一个面向叙事编排（orchestration）的 Narrative IDE / Workbench 原型。

## 项目是什么

`new-narrative-novel` 不是传统小说编辑器，也不是 chat-first 的 AI 写作页面集合。

它更像一个 **面向叙事创作的工作台**：

- 用户可以在不同对象之间切换：`Book / Chapter / Scene / Asset`
- 用户可以在不同工作视角之间切换：`Structure / Orchestrate / Draft / Knowledge`
- 系统把叙事生成拆成一条可审阅、可回放、可追踪的状态流：
  - `constraint -> proposal -> review -> accepted canon -> prose`

这个项目要解决的问题，不是“让 AI 写一段文本”，而是：

**如何让作者像导演或主编一样，对叙事生成过程进行组织、审阅、吸收与落盘。**

---

## 为什么要做这个

常见 AI 写作产品通常有几个问题：

- 章节、场景、设定、正文都被揉进同一种页面心智里
- 用户只能看到生成结果，难以判断来源与采纳过程
- 大纲、结构、知识、正文经常分散在不同页面甚至不同工具中
- 世界观资料和真实叙事状态脱节
- 复杂创作过程最后被压缩成一个聊天窗口

`new-narrative-novel` 的目标，是把这些问题拆开：

1. 先明确当前在处理哪个对象
2. 再明确当前用什么工作方式处理它
3. 把 AI 参与的中间状态前台化
4. 让最终正文可以追溯到被接受的提案与状态变化

---

## 核心产品模型

### 1. Scope：当前在处理什么对象

长期围绕四类对象展开：

- `Book`
- `Chapter`
- `Scene`
- `Asset`

### 2. Lens：当前在用什么工作视角

同一个对象可以用不同 lens 去处理：

- `Structure`：结构、顺序、节奏、拼接
- `Orchestrate`：运行、proposal、review、accept / rewrite / reject
- `Draft`：正文、diff、来源追踪
- `Knowledge`：资产、关系、引用、canon 事实

### 3. State Flow：系统当前在哪个状态

项目中的 AI 参与不应直接跳到 prose，而应经过可审阅的中间层：

```text
constraint -> proposal -> review -> accepted canon -> prose
```

这样一来：

- proposal 可以被审阅
- accepted state 可以被追踪
- prose 可以被解释“来自哪些已接受变化”

---

## 交互壳子：为什么是 Workbench

项目当前采用的是 **Workbench shell**，而不是固定三栏页面：

1. **Mode Rail**：一级模式 / scope / lens 入口
2. **Navigator**：对象导航与层级选择
3. **Main Stage**：真正做事的主舞台
4. **Inspector**：摘要、上下文、版本、引用等辅助判断区
5. **Bottom Dock / Panel**：问题、活动、运行诊断等支持信息

这背后的交互纪律是：

- 中间只承载一个一级任务
- 右侧只做支持判断
- 底部只放问题与运行信息
- 左侧只做对象导航，不做动作堆叠

---

## 设计借鉴

这个项目不会照搬某一个产品，而是有选择地借鉴多种成熟原型：

### VS Code

借它的 workbench 空间纪律：

- mode rail / side bar / panel / status bar
- tabs / split / layout persistence
- 主舞台与辅助面板的分工

不照搬它的程序员噪音和技术化压迫感。

### AppFlowy

借“一份数据，多种视图”的方法。

这会体现在：

- Chapter 的 `Sequence / Outliner / Assembly`
- 未来 Knowledge 的多视图资产工作面

### Outline

借它安静、清晰、可阅读的知识工作体验。

### BookStack

借它显式层级与顺序组织心智。

### Wiki.js

借它路径化定位与导航方式分离的思路。

### Logseq

借它链接意识、反向引用、references 的组织方式，但不把 graph 做成主入口。

---

## 当前项目状态

当前仓库现在由两个直接可用的工作包组成：

- `@narrative-novel/renderer`：Workbench / Storybook / mock runtime 原型
- `@narrative-novel/api`：fixture-backed API server skeleton，兑现 `/api/projects/{projectId}/...` 合同

根脚本当前暴露了：

- `pnpm dev:api`
- `pnpm dev:renderer`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm storybook`

其中：

- `pnpm typecheck` / `pnpm test` 同时覆盖 `api + renderer`
- `pnpm build` 仍只构建 `renderer`
- `pnpm storybook` 仍只启动 `renderer` 的 Storybook

所以目前最适合把它理解为：

**一个以 renderer / Storybook 为主舞台，并带有可联调 fixture API server 的叙事工作台原型仓库。**

从当前 `App.tsx` 来看，workbench 已经不再只服务 Scene：

- 已支持 `scene` 与 `chapter` 两个 scope
- Scene 侧已接入完整 workbench：top bar / mode rail / navigator / main stage / inspector / bottom dock
- Chapter 侧已经接进 workbench，但当前仍以 `structure` 和 placeholder 骨架为主

这意味着仓库已经进入 **“用第二个 scope 验证 workbench 架构”** 的阶段。

---

## 当前重点方向

当前最重要的前端方向不是继续堆更多 Scene 页面，而是：

### 1. 把 Chapter / Structure 做成真正的数据驱动工作面

重点包括：

- Binder
- Sequence
- Outliner
- Assembly
- Inspector / Problems
- Chapter → Scene 的平滑 handoff

### 2. 继续巩固 workbench 的多 scope 承载能力

也就是验证：

- route 是否足够稳定
- 同一壳子是否能承载不同对象层级
- 视图切换是否真正建立在统一模型之上

### 3. 为未来 Asset / Knowledge 留出入口

但暂时不急着把 graph、wiki、story bible 一次性铺满。

---

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 启动 Storybook

```bash
pnpm storybook
```

### 启动 fixture API server

```bash
pnpm dev:api
```

默认地址：

```txt
http://127.0.0.1:4174
```

### Fixture API contract notes

- Run events stay lightweight and use `refs` to point at run artifacts instead of inlining large context, proposal, canon, or prose payloads.
- `GET /api/projects/:projectId/runs/:runId/artifacts` and `GET /api/projects/:projectId/runs/:runId/artifacts/:artifactId` expose product read models for context packet, agent invocation, proposal set, canon patch, and prose draft details.
- `GET /api/projects/:projectId/runs/:runId/trace` is a product read surface for explicit proposal -> canon -> prose links; it is not a raw workflow, Temporal, or model transcript dump.
- `GET /api/projects/:projectId/runs/:runId/events/stream` remains unimplemented in the fixture API. Use paginated run events for now.

### 配置 renderer 走 API runtime

`packages/renderer/.env.example` 提供了最小联调变量：

```bash
VITE_NARRATIVE_API_BASE_URL=http://localhost:4174
VITE_NARRATIVE_PROJECT_ID=book-signal-arc
```

### 启动 renderer 开发环境

```bash
pnpm dev:renderer
```

### 类型检查

```bash
pnpm typecheck
```

### 运行测试

```bash
pnpm test
```

这会同时运行 `@narrative-novel/api` 与 `@narrative-novel/renderer` 的测试。

### 构建

```bash
pnpm build
```

当前仍只构建 `renderer` 包。

---

## 推荐阅读顺序

如果你第一次进入这个仓库，建议按这个顺序理解项目：

1. 先看本 README，理解项目目标与交互模型
2. 再看前端设计 / 计划文档，理解 workbench、scope、lens 的落地方式
3. 然后进入 `packages/renderer`，从 workbench shell、scene、chapter 三层去看当前实现
4. 最后再看分阶段 PR 计划，理解项目接下来如何推进

---

## 项目原则

- Chat 只是辅助，不是主舞台
- 审阅比生成更重要
- Objects first, views second
- 可追溯性必须前台化
- 结构、正文、知识必须分层
- 视觉上更像安静的专业工作台，而不是炫技控制台

---

## 近期路线

### 已经成立的方向

- Scene workbench 已经是第一条核心纵切
- Workbench shell 已经从 scene-only 往 multi-scope 扩展
- Chapter / Structure 已经作为第二个 scope 接入

### 接下来最重要的事

1. 把 Chapter 从 scaffold 做成真正的数据驱动结构台
2. 完成 `Sequence / Outliner / Assembly` 三视图共享模型
3. 补结构编辑动作与 inspector / dock 逻辑
4. 为未来 `Asset / Knowledge` 预留 story graph 入口

---

## 一句话总结

`new-narrative-novel` 最值得坚持的方向，不是“做更多 AI 页面”，而是把它打造成：

**一个围绕 scope、lens 与 review flow 组织叙事工作的 Narrative IDE。**
