# Frontend Delivery And Acceptance Flow

## 目的

把前端交付明确拆成两个不能互相替代的 gate：

- `Storybook Sync Gate`
- `Real Software Acceptance Gate`

这份流程用于修正一个长期偏差：

- `同步到 Storybook` 不等于 `真实软件可用`
- `Storybook 结构化快照通过` 不等于 `App / desktop / runtime / route / restore 通过`

---

## 一句话规则

**Storybook 负责受控预览与 contract；真实软件负责最终验收。两者都要做，且结论必须拆开写。**

---

## 先分清三条路径

### 1. Storybook / mock / test path

用途：

- 组件与 workspace surface 的受控预览
- fixture / empty / loading / error / dense 状态枚举
- review 与讨论时的稳定载体

不能证明：

- desktop launcher 真的可用
- preload bridge / runtime config 真的接通
- current project / recent project restore 真的成立
- App 入口下的 route / layout / query / persistence 没漂移

### 2. Fixture demo path

用途：

- 演示稳定原型闭环
- 验证 API-backed renderer surface
- 检查 canonical fixture path 是否还成立

常用入口：

- `pnpm dev:api`
- `pnpm dev:renderer`
- 或 `pnpm dev:desktop` 后选择 `Open Demo Project`

### 3. Real model dogfood path

用途：

- 验证真实用户启动、建项目、配置模型、运行场景、继续写作的实际软件路径

常用入口：

- `pnpm dev:desktop`

---

## 哪些任务必须做两个 gate

以下前端任务，`Storybook Sync Gate` 和 `Real Software Acceptance Gate` 都是必做项：

- 改 `App`、`DesktopAppRoot`、`ProjectRuntime`、runtime config、desktop bridge
- 改 launcher、settings、runtime badge、project restore
- 改 WorkbenchShell、layout restore、route restore、pane visibility、dock maximize
- 改 scope / lens / view 容器
- 改 navigator / main stage / inspector / bottom dock 的联动
- 改 review / run / prose / chapter draft / book draft 的真实流程
- 改已经接入真实软件的任何 user-facing surface

以下任务允许以 Storybook 为主，但仍应说明为什么不需要真实软件 gate：

- 还没接入产品路径的纯展示组件
- test-only / mockup-only / export-only 的稳定 story
- 不影响真实入口 wiring 的局部视觉微调

如果拿不准，默认做两个 gate。

---

## Parity 配对原则

双 gate 不只是“两个都跑一下”，而是要对**同一组 surface family** 记录成对证据。

`surface family` 指的是用户在真实软件里感知为同一个工作面的一组 surface，例如：

- `Workbench shell / layout`
- `Scene workspace / orchestrate`
- `Scene workspace / draft`
- `Book workspace / structure`
- `Asset workspace / knowledge`

每次前端验收都应先写清楚本次改动覆盖哪些 `surface family`，然后对每一组分别记录：

- 对应的 Storybook story id / story 名称
- 对应的真实软件入口与 route
- 这两边必须对齐检查的关键点
- 两边各自的结构化快照与截图证据
- 两边各自的结果

禁止把一个 story 的通过，拿去替代另一个真实 route 的结论。
也禁止只写“本次 Storybook 已同步、真实软件已验证”而不说明验证的是哪一个 surface family。

可直接复用的 repo-local 模板见：

- `doc/review/2026-04-29-real-frontend-storybook-parity-checklist.md`

---

## 正确的开发顺序

### 1. 先读真实产品路径

先看：

- `doc/frontend-workbench-constitution.md`
- `packages/renderer/src/App.tsx`
- `packages/renderer/src/app/desktop/DesktopAppRoot.tsx`
- `packages/renderer/src/app/providers.tsx`
- 受影响的 container / route hook / runtime hook / query hook

不要先把 story helper 当事实来源。

### 2. 先确认真实软件里要成立什么

必须先回答：

- 用户从哪个真实入口进入这个 surface
- 这条路径属于 `web/mock`、`web/api`，还是 `desktop-local`
- route / layout / selected object / current project 分别由谁持有
- 哪些状态只在 Storybook 里存在，哪些状态必须在真实软件里成立

### 3. 先改真实产品路径，再同步 Storybook

推荐顺序：

1. 改真实容器、route、runtime 或 query wiring
2. 补或更新测试
3. 同步受影响 story / fixture / story shell
4. 跑 Storybook gate
5. 跑真实软件 gate

如果这是纯展示组件任务，可以先补 story，但最终仍要对照真实接入点确认没有漂移。

---

## Gate A: Storybook Sync Gate

### 目标

证明受影响 surface 在受控输入下仍然满足：

- shell / workspace contract
- 关键状态枚举
- mock / fixture / empty / error / loading / dense 行为

### 必做动作

1. 更新受影响 story。
2. 更新受影响 fixture / story helper。
3. 用 MCP 抓结构化快照。
4. 同时保留截图作为辅助证据。

### 常用命令

```bash
pnpm storybook
pnpm --filter @narrative-novel/renderer build-storybook
```

### 验收要求

- 不是只看视觉截图
- 必须有结构化快照
- 必须明确 story id 或 story 名称
- 必须说明检查的是哪几个关键状态
- 必须能和同一 surface family 的真实软件证据一一对应

### Storybook gate 通过，只能说明

- story 本身成立
- 受控 preview 成立
- 相关 surface contract 没明显坏掉

### Storybook gate 不能说明

- 真实软件入口成立
- 真实 runtime 成立
- 真实 restore / persistence 成立
- 用户主流程在真实软件里可用

---

## Gate B: Real Software Acceptance Gate

### 目标

证明真实软件路径本身成立，而不是 mock preview 成立。

### 必做动作

1. 启动真实入口。
2. 进入真实产品路径。
3. 用 MCP 抓结构化快照。
4. 同时保留截图作为辅助证据。
5. 记录当前 runtime mode、project path、入口状态。

### 常用命令

Fixture demo / API renderer path：

```bash
pnpm dev:api
pnpm dev:renderer
```

Desktop-local / real dogfood path：

```bash
pnpm dev:desktop
```

如需 live renderer dev server：

```bash
NARRATIVE_DESKTOP_LIVE_RENDERER=1 pnpm dev:desktop
```

### 必查项

至少检查和本次改动直接相关的真实软件点：

- 入口是否正确
- route 是否正确
- selected object 是否正确
- layout restore / route restore 是否正确
- runtime badge / launcher / settings / current project 是否正确
- main stage 的主任务是否仍在 main stage
- inspector / dock 是否只是支持面，而不是抢主任务
- 与对应 Storybook surface 承诺的 shell / chrome / state 是否一致

### 判定规则

- 真实软件没跑：不能说前端验收通过
- 真实软件跑不起来：应记录为 `blocked`
- 真实软件结论不能用 Storybook 结果代填

---

## 测试、Storybook、真实软件三者的关系

测试负责：

- 回归保护
- contract 保真
- route / layout / selection / restore 边界

Storybook 负责：

- 受控状态演示
- 评审与 mock preview
- surface contract 可视化

真实软件负责：

- 最终产品验收
- desktop / runtime / current project / restore / user flow 真正成立

它们互补，但彼此不能替代。

---

## 输出口径必须拆开

每次前端交付，结论至少按下面格式写：

```md
## Surface Families
- Family: ...
  - Storybook story: ...
  - Real entry path: desktop-local / web/api / fixture demo
  - Real route: ...
  - Parity checks: ...

## Storybook Sync Gate
- Surface family: ...
- Stories: ...
- Command: ...
- Structured snapshot: ...
- Screenshot: ...
- Checked states: ...
- Result: pass / fail / blocked
- Notes: ...

## Real Software Acceptance Gate
- Surface family: ...
- Entry path: desktop-local / web/api / fixture demo
- Route: ...
- Command: ...
- Runtime mode / project context: ...
- Structured snapshot: ...
- Screenshot: ...
- Checked states: ...
- Result: pass / fail / blocked
- Notes: ...

## Parity Verdict
- Surface family: ...
- Storybook vs real software: aligned / drifted / blocked
- Mismatch summary: ...

## Overall Verdict
- Storybook sync: ...
- Real software acceptance: ...
- Final: pass / not passed / blocked
```

如果一次改动涉及多个 surface family，就按 family 重复填写，而不是把所有 story 和所有 route 混在一个结论里。

允许：

- `Storybook sync pass, real software blocked, overall not passed`
- `Scene workspace / draft: Storybook pass, real software fail, parity drifted`

禁止：

- `Storybook pass, therefore frontend pass`
- `Storybook pass on shell story, therefore scene real route also pass`

---

## 禁止事项

禁止把下面行为当成完成：

- 只检查 Storybook 结构化快照
- 只看截图不看结构化快照
- 只验证 story root，不验证真实软件入口
- 只跑 `pnpm test` / `pnpm typecheck` 就说前端验收完成
- 只跑 `pnpm verify:prototype` 就说真实软件验收完成

`pnpm verify:prototype` 只是回归测试集合，不是 Storybook gate，也不是真实软件 gate。

---

## 推荐默认流程

对绝大多数前端 PR，按这个顺序执行：

1. 读宪法与真实入口代码
2. 明确真实软件要成立的用户路径
3. 改真实产品路径
4. 补测试
5. 同步 Storybook
6. 跑 Storybook gate
7. 跑真实软件 gate
8. 分开写两个 gate 的结论

---

## 最终标准

**涉及前端的改动，必须同步到 Storybook；但真正的交付结论，必须由真实软件验收来定。**
