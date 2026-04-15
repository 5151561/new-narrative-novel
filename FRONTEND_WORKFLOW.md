# FRONTEND_WORKFLOW.md

## 目标

本文件定义本仓库的前端 UI 开发流程，目标是把前端实现建立在 **Storybook stories、文档、fixtures、测试** 之上，而不是建立在截图、临时页面或一次性实现之上。

当前仓库中，前端 UI 的主要工作区是：

- `packages/renderer`

本流程适用于：

- 基础组件开发
- 业务组件开发
- 页面静态拼装
- 页面状态补齐
- mockup 定稿
- Storybook 文档与测试补齐
- UI 回归修复

---

## 事实来源

在 UI 相关任务中，默认按以下优先级判断“什么是正确的”：

1. 现有 stories
2. Storybook 文档
3. 组件 props 与类型定义
4. fixtures / mock data
5. 交互测试与 a11y 约束
6. 真实业务页面实现
7. 截图

### 说明

- 截图只能用于视觉核对，不是主要事实来源。
- 真实业务页面可能混入历史债务，不能天然高于 story。
- 一个组件只有代码没有 story，说明规范层还不完整。

---

## 核心原则

### 1. Story 优先于截图

任何组件新增、页面改版、布局修复、状态补齐，都应先看相关 story。

禁止只凭截图推断：

- 组件边界
- 可复用层级
- props 设计
- 页面状态
- 布局关系

### 2. 先复用，再新增

新增 UI 前必须先检查：

- 是否已有基础组件可复用
- 是否已有业务组件可组合
- 是否已有相似 story 可扩展
- 是否已有相似页面布局可借用

若能通过组合现有组件完成目标，不应新增重复组件。

### 3. 先静态 mock，再接业务逻辑

页面与复杂模块开发顺序固定为：

1. 先做静态组件树
2. 先补 fixtures
3. 先补 page story
4. 先让 story 稳定渲染
5. 再接 router / store / IPC / async 数据

### 4. 状态必须显式化

每个关键组件或页面，都应尽量覆盖常见状态：

- `default`
- `loading`
- `empty`
- `error`
- `disabled`
- `dense`
- `mobile`
- `desktop`
- `final`

没有状态覆盖的 UI，不算稳定规范。

### 5. 页面必须可独立展示

关键页面应能在 Storybook 中独立展示，不依赖：

- 真实接口
- 不可控系统时间
- 随机值
- 实时网络资源
- 不可控登录态

必要时使用 fixture、provider mock、fake store、adapter stub。

---

## 目录职责

推荐围绕如下目录组织前端：

```txt
packages/renderer/
  src/
    components/
    pages/
    mock/
    lib/
    styles/
  .storybook/
```

### `src/components`

放置：

- 基础 UI 组件
- 高复用业务组件
- 组件本体与 props 类型
- 同组件相邻的 `*.stories.tsx`

### `src/pages`

放置：

- 页面容器
- 页面级布局
- 区块组合
- 页面级 `*.stories.tsx`

### `src/mock`

放置：

- `fixtures/`
- `factories/`
- `presets/`
- provider mock
- 本地假数据适配器

### `.storybook`

负责：

- Storybook 配置
- 全局样式注入
- decorators
- viewport / theme 参数
- 导出态稳定设置

---

## Story 命名规范

### 基础组件

```txt
UI/Button
UI/Input
UI/Card
```

### 业务组件

```txt
Business/ProjectCard
Business/CharacterPanel
Business/SceneOutline
```

### 页面 / mockup

真正用于评审和定稿的页面统一放在：

```txt
Mockups/Workspace/Final
Mockups/Workspace/Empty
Mockups/Settings/Desktop
Mockups/Settings/Mobile
Mockups/Library/Dense
```

要求：

- 名称能表达用途
- 名称能表达状态
- 名称能表达平台或尺寸差异
- `Final` 只用于准交付展示态

---

## 新增组件流程

### 第一步：检索已有实现

检查：

- 是否已有相似基础组件
- 是否已有相似业务组件
- 是否已有可扩展变体
- 是否已有相近 story

### 第二步：做最小实现

只先完成：

- props 定义
- 基础渲染
- 基础样式
- 最小交互

### 第三步：补 stories

至少补：

- `Default`
- 主要变体
- 一个边界状态
- 适用时的 `Disabled` / `Loading` / `Empty`

### 第四步：补文档

至少说明：

- 组件用途
- 适用范围
- 不推荐用法
- props 约束
- 组合建议

### 第五步：补测试

按复杂度补：

- render test
- interaction test
- a11y 检查

未补 story 的组件，不视为稳定基础组件。

---

## 新增页面流程

### 第一步：定义页面边界

至少明确：

- 页面名称
- 使用场景
- 必须复用的组件
- 允许新增哪些业务组件
- 目标 story 名称

### 第二步：先写 fixture

至少准备：

- `default`
- `empty`
- `dense`
- `error`（如适用）

### 第三步：先做 page story

页面必须先能在 Storybook 中独立渲染。

### 第四步：再接真实容器

包括：

- router 映射
- store 映射
- IPC / service 数据接入
- 业务状态桥接

### 第五步：补验收项

确认：

- story 稳定
- 组件复用合理
- 状态完整
- 样式无明显漂移
- mockup 可作为导出来源

---

## fixtures 规范

推荐结构：

```txt
src/mock/
  fixtures/
  factories/
  presets/
```

### fixtures

用于稳定展示的固定数据。

### factories

用于快速生成数据结构，但 story 最终输入应是稳定的 fixture，而不是每次随机生成。

### presets

用于组合多种页面场景，例如：

- `default`
- `empty`
- `dense`
- `edgeCase`

### 约束

fixtures 应尽量做到：

- 无随机值
- 无实时日期
- 无远程资源依赖
- 无不可控排序
- 无接口竞态影响

---

## 样式与布局约束

### 1. 优先使用现有 Tailwind 约定

除非必须，不要为了单一页面绕开既有样式结构。

### 2. 避免内联样式泛滥

只有在确实需要动态计算时才使用内联样式。

### 3. 对齐现有 spacing 与层级

改页面时优先沿用现有组件库中的：

- 间距
- 字号
- 层级
- 圆角
- 边框
- 阴影

### 4. 不为单页污染全局

不要为了某一页的效果，直接破坏全局 token、全局 reset、基础组件语义。

### 5. 导出态要稳定

用于 mockup 导出的 story 应尽量：

- 固定 viewport
- 固定主题
- 关闭不必要动画
- 固定字体来源
- 避免懒加载抖动

---

## Storybook 开发约定

### 全局样式

`.storybook/preview.ts` 需要引入 renderer 的全局样式入口。

### decorators

凡是依赖 provider 的组件或页面，都应通过 decorator 提供稳定环境，而不是在 story 中偷接真实业务容器。

### 页面 story

页面 story 默认使用 `layout: 'fullscreen'`，并显式传入固定输入。

### 视口

建议至少稳定以下宽度：

- Desktop: `1440`
- Laptop: `1280`
- Tablet: `768`
- Mobile: `390`

---

## mockup 导出约定

Storybook 负责展示与评审，不负责生成“设计稿文件”。

mockup 导出流程建议固定为：

1. 用 Storybook 生成稳定 story
2. 用 Playwright 打开固定 story URL
3. 固定 viewport
4. 等待字体和资源稳定
5. 导出 PNG / PDF

即：

- Storybook 是事实来源
- Playwright 是机械导出器

---

## Codex / Agent 执行约束

任何 agent 在处理前端任务时，应遵循：

1. 先读相关 stories
2. 再读组件实现与 props
3. 再读 fixtures / docs / tests
4. 最后才改页面或业务容器

agent 不应：

- 绕过 Storybook 另起一套 UI
- 未检查复用机会就新建重复组件
- 仅凭截图重建布局
- 在没有 story 的情况下大改页面

---

## 任务模板

### 模板 A：补组件

> 基于现有 Storybook 组件，为某组件增加新变体。优先复用现有样式结构，不新增重复组件。同步补 stories、最小文档和必要测试。

### 模板 B：做页面

> 基于现有 Storybook 组件与 stories，实现某页面或某模块。先提供静态页面与 fixtures，再补 interaction story。不要直接接真实接口。

### 模板 C：修布局

> 某页面或 story 与既有组件风格不一致。请先读取相关 stories 和组件文档，再在 renderer 包内修复 spacing、层级和布局，不改全局 token。

### 模板 D：补规范

> 为某组件或页面补齐 stories、fixtures、docs 和 a11y 检查，使其成为稳定的可复用基础。

---

## 验收标准

一个前端任务完成后，至少满足：

- 代码可读
- 类型通过
- story 可运行
- 关键状态存在
- 没有明显重复组件
- fixtures 稳定
- 样式无明显漂移
- 必要测试已补齐

页面级任务额外要求：

- 页面可在 Storybook 独立展示
- 页面可作为 mockup 导出来源
- 页面状态切换有明确输入

---

## 建议命令

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer storybook
pnpm --filter @narrative-novel/renderer build-storybook
```

如果实际脚本名不同，以仓库脚本为准。

---

## 最后建议

当前项目不要一开始就把整仓前端交给 agent 自动生成。

推荐顺序：

1. 先补高频组件 stories
2. 再补页面级 stories
3. 再让 Codex 按 story 开发
4. 最后接导出与视觉回归
