# packages/renderer/README.md

## 包定位

`@narrative-novel/renderer` 是本仓库的前端 UI 包，承载：

- React 组件
- 页面容器
- Storybook stories
- fixtures / mock data
- UI 相关测试
- mockup 展示与导出来源

这个包应被视为前端展示层的主要事实来源。

---

## 技术基线

当前包以以下技术为主：

- React
- Vite
- Tailwind CSS
- TypeScript
- Vitest
- Storybook

建议原则：

- 组件和页面优先围绕 Storybook 开发
- 页面先做静态展示，再接业务逻辑
- mockup 导出从 Storybook story 出发，不从临时页面出发

---

## 推荐目录结构

可按实际情况逐步收敛为：

```txt
packages/renderer/
  src/
    components/
      ui/
      business/
    pages/
    mock/
      fixtures/
      factories/
      presets/
    lib/
    styles/
  .storybook/
  package.json
```

### 目录职责

#### `src/components/ui`

- 基础 UI 组件
- 通用展示组件
- 可复用、小颗粒度组件

#### `src/components/business`

- 业务语义更强的组合组件
- 面向领域的展示区块

#### `src/pages`

- 页面容器
- 页面布局
- 页面级组合逻辑
- 页面级 stories

#### `src/mock`

- fixtures
- factories
- presets
- provider mock

---

## Storybook 在本包中的角色

Storybook 不是附属工具，而是本包的规范层与评审层。

Storybook 负责：

- 组件展示
- 页面展示
- 状态枚举
- 文档沉淀
- 交互测试入口
- mockup 评审来源

### 命名建议

基础组件：

```txt
UI/Button
UI/Input
UI/Card
```

业务组件：

```txt
Business/ProjectCard
Business/CharacterPanel
```

页面 / mockup：

```txt
Mockups/Workspace/Final
Mockups/Workspace/Empty
Mockups/Settings/Desktop
```

---

## 开发流程

### 组件开发

推荐顺序：

1. 找现有相似组件
2. 先做最小组件
3. 补 story
4. 补文档
5. 补测试

### 页面开发

推荐顺序：

1. 明确页面目标和复用组件
2. 先写 fixtures
3. 先做 page story
4. 先让 story 稳定渲染
5. 再接 router / store / IPC / async 数据

### 修复任务

推荐顺序：

1. 先从 story 复现问题
2. 找最接近的既有 story 对照
3. 做最小修复
4. 回到 Storybook 验证状态是否完整

---

## Story 约定

### 每个关键组件至少应有

- `Default`
- 一个主要变体
- 一个边界状态

### 每个关键页面至少应有

- `Default`
- `Empty`
- `Dense`
- `Error`（如适用）
- `Final`（如需评审/导出）

### 页面 story 约束

页面 story 应：

- 使用固定输入
- 不依赖真实接口
- 不依赖随机数据
- 尽量使用 `layout: 'fullscreen'`

---

## fixtures 约定

推荐结构：

```txt
src/mock/
  fixtures/
  factories/
  presets/
```

约束：

- story 优先使用稳定 fixture
- 避免实时日期、随机数、远程图片
- 复杂页面至少应有两组以上输入场景

---

## 样式约定

- 优先复用既有 Tailwind 约定
- 避免为单个页面引入平行样式体系
- 非必要不使用大段内联样式
- 优先对齐现有 spacing、圆角、阴影、层级

对于导出态 story，尽量：

- 固定 viewport
- 固定主题
- 关闭不必要动画
- 固定字体来源

---

## 常用命令

以下命令以实际 `package.json` 脚本为准。

### 类型检查

```bash
pnpm --filter @narrative-novel/renderer typecheck
```

### 测试

```bash
pnpm --filter @narrative-novel/renderer test
```

### 启动 Storybook

```bash
pnpm --filter @narrative-novel/renderer storybook
```

### 构建 Storybook

```bash
pnpm --filter @narrative-novel/renderer build-storybook
```

---

## mockup 导出建议

Storybook 负责展示稳定 story，不直接负责导出“设计稿文件”。

推荐导出链路：

1. 在 Storybook 中准备固定 story
2. 用 Playwright 打开固定 story URL
3. 固定 viewport 和主题
4. 等待资源稳定
5. 导出 PNG / PDF

也就是：

- Storybook = 规范层 + 展示层
- Playwright = 机械导出器

---

## 对 agent / Codex 的建议

在本包内执行任务时，优先：

1. 看相关 stories
2. 看相关组件实现
3. 看 fixtures / 文档 / tests
4. 再改页面或逻辑容器

不要：

- 仅凭截图重建 UI
- 未检查复用机会就新建重复组件
- 未补 story 就把组件视为完成
- 把业务入口页当成唯一事实来源

---

## 最小交付清单

一个 UI 任务至少应交付：

- 组件或页面代码
- 对应 story
- 必要 fixture
- 基本类型正确性
- 无明显重复组件

对于关键组件或关键页面，尽量补齐：

- docs
- interaction tests
- a11y 检查
- 导出态 story
