# packages/renderer/AGENTS.md

## 作用范围

本文件适用于 `packages/renderer` 目录内的所有 AI / agent / Codex 前端任务。

本包是 React + Vite + Tailwind 的 UI 层。处理本包任务时，优先把 Storybook、stories、fixtures、文档和测试视为事实来源。

---

## 首要原则

1. 先读 story，再读代码。
2. 先复用现有组件，再考虑新增组件。
3. 先做静态展示，再接真实业务逻辑。
4. 页面任务先补 fixture 和 page story。
5. 截图只能做视觉核对，不能做主要实现依据。

---

## 修改代码前先做什么

### 对组件任务

先检查：

- 是否已有相似组件
- 是否已有相似变体
- 是否已有 story 可以扩展

### 对页面任务

先检查：

- 是否已有相似 layout
- 是否已有页面级 story
- 是否已有 fixture / preset
- 是否已有可复用业务组件

### 对 Storybook 相关任务

先检查：

- `.storybook/main.*`
- `.storybook/preview.*`
- 全局样式入口
- decorators
- stories 扫描路径

---

## 优先搜索的位置

```txt
src/**/*.stories.tsx
src/components/**
src/pages/**
src/mock/**
.storybook/**
```

如有 Storybook MCP，可优先读取相关 story、组件文档和测试上下文；若不可用，则直接在本地代码中查找同名 story。

---

## 默认工作顺序

### 组件类任务

1. 找现有相似组件
2. 做最小实现
3. 补 story
4. 补文档
5. 补测试

### 页面类任务

1. 明确目标页面与复用组件
2. 先补 fixtures
3. 先补 page story
4. 让 story 稳定渲染
5. 再接业务容器

### 修复类任务

1. 先在 story 中复现
2. 做最小改动修复
3. 确认没有污染全局样式
4. 回到 story 重新验证

---

## 允许做的事

- 扩展现有组件变体
- 新增必要的业务组件
- 补齐 stories、fixtures、docs、tests
- 修复 story 和页面之间的布局漂移
- 为 mockup 准备稳定 story

---

## 默认避免的事

- 无依据新建平行组件体系
- 仅依据截图重建 UI
- 未补 story 就宣称组件完成
- 直接把真实接口耦合进展示 story
- 为单页效果污染全局基础样式
- 无明确必要时大范围重构目录

---

## 页面与 mockup 约束

页面应尽量满足：

- 能在 Storybook 中独立展示
- 使用固定输入
- 不依赖随机数据
- 不依赖不可控时间与网络状态

如果任务目标包含 mockup：

- 应先产出稳定 story
- 再把该 story 作为导出来源
- 不要把 Storybook 当导出器本身

---

## 修改后自检

完成修改后，至少检查：

- story 是否可运行
- 类型是否合理
- 是否新增了重复组件
- 是否缺少常见状态
- 是否引入明显 hardcode
- 是否破坏全局样式或主题

---

## 推荐命令

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer storybook
pnpm --filter @narrative-novel/renderer build-storybook
```

若脚本名与仓库实际不一致，以当前仓库脚本为准。

---

## 输出说明格式

结束任务时，说明：

1. 改了哪些文件
2. 每个文件分别解决了什么问题
3. 复用了哪些现有组件或 story 约束
4. 补了哪些 story / fixture / test
5. 还有哪些风险或后续建议

---

## 一句话约束

在这个包里，优先把 Storybook 规范层补完整，再去扩展业务实现。
