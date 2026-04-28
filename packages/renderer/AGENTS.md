# packages/renderer/AGENTS.md

## 作用范围

本文件适用于 `packages/renderer` 目录内的所有 AI / agent / Codex 前端任务。

本包是 React + Vite + Tailwind 的 UI 层，承载：

- App / workbench renderer
- Storybook stories
- fixtures / mock data
- UI tests
- mockup 预览

但它**不是**“只要 Storybook 成立就等于真实软件成立”的区域。

---

## 首要原则

1. 先读 `doc/frontend-workbench-constitution.md`。
2. 先看真实产品入口，再看 story。
3. Storybook 是 contract layer，不是真实软件真相。
4. 已接入产品路径的 surface，必须区分 `Storybook Sync Gate` 和 `Real Software Acceptance Gate`。
5. 截图只能做辅助；主证据必须是 MCP 结构化快照。

---

## 真实产品入口优先级

开始任何 renderer 任务前，先定位真实路径：

- `src/App.tsx`
- `src/app/desktop/DesktopAppRoot.tsx`
- `src/app/providers.tsx`
- `src/app/project-runtime/**`
- 受影响 scope / lens 的 container、hook、query、route 文件

然后再看：

- `src/**/*.stories.tsx`
- `src/**/*storybook*.tsx`
- `src/mock/**`
- `.storybook/**`

如果真实软件和 story helper 的行为不一致，以真实产品路径和宪法为准。

---

## 默认不要再做的事

- 先读 story，再把 story 当事实来源
- 先做静态 story，再假定真实软件自然会跟上
- 只在 story 里复现问题就开始修
- 只检查 Storybook 结构化快照就宣称前端完成
- 把 `Storybook pass` 写成 `真实软件 pass`

---

## 默认工作顺序

### 组件类任务

1. 找现有相似组件
2. 找该组件在真实软件里的接入点
3. 做最小实现
4. 补或更新 story
5. 补测试
6. 如果组件已接入真实软件，做真实软件 spot-check

### Workbench / 页面 / 容器任务

1. 明确真实入口、runtime mode、route 和 selected object 真源
2. 先在真实软件或真实测试路径确认目标状态
3. 先改真实容器 / route / runtime / query wiring
4. 再同步 story / fixture / story shell
5. 补测试
6. 跑 `Storybook Sync Gate`
7. 跑 `Real Software Acceptance Gate`

### 修复类任务

1. 先在真实软件、真实测试、或真实 runtime path 复现
2. 用 story 缩小状态空间，而不是拿 story 代替真实复现
3. 做最小改动修复
4. 回到 Storybook 验证受控状态
5. 回到真实软件确认真实路径

---

## Storybook 的正确角色

Storybook 负责：

- 组件展示
- workspace surface 状态枚举
- fixture / empty / error / dense / loading 等稳定预览
- 评审和 mockup contract

Storybook 不负责证明：

- desktop launcher 真可达
- preload bridge / runtime config 真接通
- current project / restore 真成立
- App 入口下的 route / layout / persistence / runtime 无漂移

如果任务改了真实软件路径，Storybook 必须同步，但 Storybook 不能替代真实软件验收。

---

## 必做双 gate 的任务

以下任务默认必须同时做 Storybook 和真实软件验收：

- 改 `App`、`DesktopAppRoot`、runtime、launcher、settings
- 改 WorkbenchShell、navigator、main stage、inspector、bottom dock 联动
- 改 scope / lens / route / layout restore / selected object restore
- 改 review / run / prose / chapter / book 的真实工作流
- 改任何已经接入桌面软件或 API renderer 的 user-facing surface

如果是纯展示组件、mockup-only state、或未接入真实产品路径的 story，可以说明原因后仅做 Storybook gate。

---

## 优先搜索的位置

```txt
src/App.tsx
src/app/desktop/**
src/app/project-runtime/**
src/features/**/containers/**
src/features/workbench/**
src/**/*.stories.tsx
src/**/*storybook*.tsx
src/mock/**
.storybook/**
```

---

## 修改后必须自检

至少检查：

- 真实入口是否仍成立
- story 是否与真实 surface 同步
- route / layout / selection 真源是否清楚
- 是否新增了第二套状态真源
- 是否把业务逻辑偷偷留在 story helper 里
- 是否缺少真实软件验收结论

---

## 推荐命令

```bash
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer storybook
pnpm --filter @narrative-novel/renderer build-storybook
pnpm dev:desktop
pnpm dev:api
pnpm dev:renderer
```

若脚本名与仓库实际不一致，以当前仓库脚本为准。

---

## 输出要求

结束前端任务时，至少拆开写：

1. `Storybook Sync Gate`
2. `Real Software Acceptance Gate`
3. `Overall Verdict`

如果只做了 Storybook 检查，必须明确写：

- `真实软件未验收`

不能写成：

- `前端已通过`

---

## 一句话约束

在这个包里，**前端改动必须同步 Storybook，但真正的交付结论必须由真实软件验收决定。**
