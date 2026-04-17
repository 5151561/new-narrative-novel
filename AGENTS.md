# CODEX_SKILL_SPEC.md

## 名称

`storybook-frontend-implementation`

## 目标

该 skill 用于指导 Codex 在本仓库中执行受控前端开发任务，使其优先复用 Storybook 组件、stories、fixtures 与文档，避免截图驱动、重复造轮子和越界修改。

适用范围：

- `packages/renderer`
- 组件开发
- 页面静态拼装
- stories / docs / fixtures / tests 补齐
- 样式和布局修复
- Storybook 可运行性修复

---

## 何时启用

当任务属于以下任一情况时，优先启用该 skill：

- 新增前端组件
- 修改前端组件
- 新增页面 UI
- 修改页面 UI
- 补 stories / docs / fixtures / tests
- 修复 Storybook 中的渲染异常
- 修复 story 与页面之间的布局漂移
- 让页面成为稳定的 mockup 展示态

当任务主要涉及后端、数据库、runtime 核心、构建系统或非 UI 逻辑时，不应优先使用该 skill。

---

## 默认假设

在执行任务前，默认假设：

- 仓库为 monorepo
- `packages/renderer` 是 React + Vite + Tailwind UI 包
- Storybook 已接入或应在该包内接入
- 用户希望优先复用现有实现，而非完全重写
- 如可用，应优先读取 Storybook MCP 暴露的组件与文档信息

---

## 目标边界

本 skill 的目标不是让 Codex 自由发挥做整套页面，而是让 Codex 在 **既有 Storybook 规范层 + 既有代码体系** 内高质量完成任务。

该 skill 启用时，优先完成：

- 复用
- 对齐
- 补齐规范
- 最小改动

而不是：

- 重写
- 平行造轮子
- 用截图重建页面
- 未经约束的大规模样式改造

---

## 输入信号优先级

处理任务时，按以下顺序读取信息：

1. 相关 stories
2. Storybook 文档
3. 相关组件实现
4. props / types
5. fixtures / mock presets
6. tests
7. 真实页面入口
8. 截图

如果 Storybook MCP 可用，应先读取 MCP 提供的组件、story、docs 上下文，再深入代码。

---

## 执行原则

### 1. Storybook 优先

优先围绕 story 执行开发、修复和补齐。

### 2. 最小变更优先

能通过扩展现有组件解决，不新增平行组件。

### 3. 静态展示优先于动态接线

涉及页面开发时：

- 先补静态页面
- 先补 fixtures
- 先补 stories
- 再处理真实数据与业务逻辑

### 4. 不绕过既有规范

不得为了单页速度，绕过现有组件体系、样式体系和 story 约束。

### 5. 先补规范，再放大改动

若相关组件缺少 story、fixture 或文档，应先补规范层，再做大改。

---

## 标准执行流程

### 步骤 1：识别任务类型

将任务归类为：

- 基础组件任务
- 业务组件任务
- 页面任务
- story / docs / fixtures 补齐任务
- 样式修复任务
- Storybook 故障修复任务

### 步骤 2：定位相关文件

优先搜索：

```txt
packages/renderer/src/**/*.stories.tsx
packages/renderer/src/components/**
packages/renderer/src/pages/**
packages/renderer/src/mock/**
packages/renderer/.storybook/**
```

### 步骤 3：读取规范来源

至少检查：

- 是否已有相似 story
- 是否已有相似组件
- 是否已有可复用 layout 或 state 模式
- 是否已有 fixture 可扩展
- 是否有现成 decorator / provider mock

### 步骤 4：实现最小可运行结果

#### 组件类

第一轮先交：

- 组件实现
- 基本 props 类型
- stories

#### 页面类

第一轮先交：

- 静态页面
- fixtures
- page stories

#### 修复类

第一轮先交：

- 精准修复
- 尽量少改无关文件

### 步骤 5：补齐规范

根据任务内容继续补：

- docs
- interaction tests
- a11y 检查
- 边界状态

### 步骤 6：自检

至少确认：

- story 是否可运行
- 类型是否合理
- 是否引入重复组件
- 是否污染全局样式
- 是否存在明显 hardcode 问题
- 是否遗漏必要状态

---

## 文件级操作偏好

### 优先修改

- 与目标组件或页面直接相关的文件
- 已有 stories
- 已有 fixtures
- 局部样式和局部布局

### 谨慎修改

- 全局 tokens
- 全局主题逻辑
- `.storybook/preview.ts`
- 基础 layout 组件
- monorepo 根级配置

### 默认避免

- 无依据的大范围目录重构
- 平行新建一套组件体系
- 把页面专用逻辑塞进基础组件

---

## 对组件类任务的附加要求

若新增组件：

- 优先与现有基础组件风格对齐
- 必须至少带一个 story
- 高复用组件应补多个状态 story
- 避免混入页面专用逻辑

若扩展组件：

- 优先新增变体，而不是复制一份新组件
- 保持 props 命名与既有风格一致
- 不轻易破坏已存在 story 的语义

---

## 对页面类任务的附加要求

若新增页面或大区块：

- 优先拆成可复用区块
- 页面必须能在 Storybook 独立展示
- 页面 story 必须使用固定输入
- 第一轮不要接真实接口
- 目标页面应尽可能成为 mockup 导出来源

若修页面布局：

- 优先对齐既有 layout 组件
- 优先修 spacing、层级、宽度、状态缺失
- 避免把局部问题升级成全局设计系统重构

---

## 对 Storybook 相关任务的附加要求

若修复 Storybook 本身：

- 先检查 `.storybook` 配置
- 检查全局样式入口是否正确注入
- 检查 stories 扫描路径
- 检查依赖 provider 是否通过 decorator 注入
- 检查 Tailwind 扫描范围与样式入口

若任务涉及 mockup 导出：

- 不要把 Storybook 当导出器
- 应把 Storybook 视为固定展示源
- 用 Playwright 或其他稳定工具从固定 story 导出 PNG / PDF

---

## 输出格式要求

完成任务后，输出应至少包含：

1. 修改了哪些文件
2. 这些文件分别解决了什么问题
3. 复用了哪些既有组件或 story 约束
4. 是否补了 stories / fixtures / docs / tests
5. 当前仍存在的风险或未处理项

若只能完成部分任务，应明确说明：

- 已完成范围
- 未完成范围
- 继续推进的建议顺序

---

## 推荐命令

在适用情况下，优先执行：

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer storybook
pnpm --filter @narrative-novel/renderer build-storybook
```

若仓库脚本与以上命令不一致，以实际脚本为准。

---

## 禁止事项

该 skill 启用时，禁止以下行为：

- 大范围重写无关文件
- 仅依据截图重建页面
- 未检查复用机会就新建重复组件
- 未补 story 就把组件视为完成
- 将业务接口波动直接耦合到展示 story 中
- 为单一页面需求污染全局基础样式
- 以一次性 hardcode 代替合理抽象

---

## 理想任务示例

### 示例 1

> 基于现有 Storybook 组件，为项目概览页新增一个统计区块。要求先补 story 和 fixture，再实现页面组合，不接真实数据。

### 示例 2

> 为 `CharacterCard` 增加 `compact` 变体，并补充 `Default` / `Compact` / `Empty` 三个 stories，保持与现有 Card 风格一致。

### 示例 3

> 修复 `Mockups/Workspace/Final` 的间距和层级问题。优先复用现有 layout 组件，不要改全局 token。

### 示例 4

> 某组件只有业务入口页可见，没有独立 story。请先补 story 和 fixture，再收敛组件 API，最后修样式。

---

## 给 Codex 的一句话原则

先读 story，再读代码；先补规范，再改实现；先最小变更，再考虑扩展。
