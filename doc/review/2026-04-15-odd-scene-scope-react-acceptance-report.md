# Scene Scope React 规格验收报告

- 审查对象：`doc/odd-scene-scope-react-spec.md`
- 审查日期：2026-04-15
- 审查范围：`packages/renderer/src` 当前实现、测试与运行时表现
- 验收结论：**不通过**

当前代码更准确的定位是：**完成度不错的可交互 mock 骨架**，而不是已经达到整份 `Scene Scope` 规格的可验收实现。

如果验收口径只收窄到 `Task 02 ~ Task 03` 的静态骨架与本地 mock 交互，这版已经接近通过；但如果按整份规格文档，尤其是 `Task 04`、`Task 08` 和第 10 节运行时边界来验收，当前版本还有明确阻塞项。

## 审查方法

1. 对照 `doc/odd-scene-scope-react-spec.md` 逐节核对信息架构、组件树、状态边界、运行时约束和任务链。
2. 阅读核心代码：
   - `packages/renderer/src/features/scene/**`
   - `packages/renderer/src/mock/scene-fixtures.ts`
   - `packages/renderer/src/App.tsx`
3. 执行验证：
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
4. 启动 Vite 开发服务器后，用 Playwright 抓结构化页面快照并检查控制台错误。

## 总览

| 维度 | 结论 | 说明 |
| --- | --- | --- |
| Workbench 壳与三段式 Scene IA | 部分通过 | `Setup / Execution / Prose` 已落地，主舞台、右侧 inspector、底部 dock 也已进入最终布局。 |
| Setup Tab | 部分通过 | 六个 section 和动作栏都在，但字段和 contract 仍是降级版。 |
| Execution 主舞台 | **不通过** | 默认 `Execution` 入口实跑会触发 React 无限更新，且关键动作仍未接线。 |
| Proposal 审阅语义 | 基本通过 | `Accept / Edit Then Accept / Request Rewrite / Reject` 已分离，`Accept != Commit` 的语义保住了。 |
| Inspector / Bottom Dock | 部分通过 | tab 结构方向正确，但数据仍是 mock，dock 也没有按规格做延迟 hydrate。 |
| Scene client / Query / IPC / patch flow | **不通过** | 仍是本地 fixture 数据库，没有接真实 preload / IPC / patch preview / commit 链路。 |
| 测试与 smoke | 部分通过 | 类型检查、单测、构建都通过，但规格要求的闭环 smoke 还不存在。 |

## 阻塞项

### 1. `Execution` 默认入口在真实浏览器里不可用

规格要求默认入口为 `Scene / Orchestrate / Execution`，且这是主差异点（`doc/odd-scene-scope-react-spec.md:92-105`）。当前实现虽然把默认 tab 设成了 `execution`，但运行时会在 `SceneExecutionContainer` 内触发 `Maximum update depth exceeded`，导致主入口不稳定。

- 代码证据：
  - `packages/renderer/src/features/scene/containers/SceneWorkspace.tsx:18-32`
  - `packages/renderer/src/features/scene/containers/SceneExecutionContainer.tsx:43-53`
- 运行证据：
  - 启动 `pnpm --filter @narrative-novel/renderer dev --host 127.0.0.1 --port 4173`
  - 访问首页后，Playwright 控制台报错：
    - `Maximum update depth exceeded`
    - React 指向 `SceneExecutionContainer.tsx` 内的 proposal 自动选中逻辑

这不是“还没接功能”的问题，而是默认入口已经出现浏览器级阻塞，因此整体验收不能通过。

### 2. Scene client 仍是纯 mock，实现没有进入规格要求的真实 contract / IPC 阶段

规格明确要求：

- 写入仍走 patch flow（`doc/odd-scene-scope-react-spec.md:1159-1164`）
- renderer 只通过 preload / IPC 访问 runtime（`doc/odd-scene-scope-react-spec.md:1161-1173`）
- `Task 04` 需要“用真实 contract/IPC 替换静态 fixture”（`doc/odd-scene-scope-react-spec.md:1323-1333`）

当前 `scene-client` 直接读写本地 mock 数据库：

- `packages/renderer/src/features/scene/api/scene-client.ts:1-94`
- `packages/renderer/src/mock/scene-fixtures.ts:641-772`
- `packages/renderer/src/App.tsx:17` 还直接显示 `Mock Runtime`

这意味着当前实现还停留在 UI 演示层，尚未达到文档要求的前端 contract 阶段，更谈不上 `patch preview -> commitStatePatch` 的正式写回链路。

### 3. 主流程关键动作大多只有按钮，没有行为

规格要求 `AcceptedStateFooter` 至少承载：

- `Continue Run`
- `Open Prose`
- `Open Patch Preview`

见 `doc/odd-scene-scope-react-spec.md:542-577` 与 `doc/odd-scene-scope-react-spec.md:1177-1202`。

但当前实现里：

- `packages/renderer/src/features/scene/components/AcceptedStateFooter.tsx:35-54`
  - `Continue Run` 没有 `onClick`
  - `Patch Preview` 没有 `onClick`
  - `Open Prose` 也没有 `onClick`
- `packages/renderer/src/features/scene/components/SceneHeader.tsx:56-60`
  - `Versions`、`Export` 只有按钮外观，没有行为
- `packages/renderer/src/features/scene/containers/SceneWorkspace.tsx:52`
  - `Thread` 切换传入的是 `() => undefined`

结果是主舞台虽然长得像规格，但用户没法走完核心动作链，无法满足 MVP 所要求的 `Patch preview 入口`（`doc/odd-scene-scope-react-spec.md:1250-1261`）。

### 4. Route state 没落地，`sceneId/tab/beatId/proposalId` 都无法通过 URL 恢复

规格对 `SceneWorkspace` 的要求是读取当前 route 的 `sceneId / tab / lens`，并使用 `useSceneRouteState()`（`doc/odd-scene-scope-react-spec.md:229-234`）；第 8 节还明确要求 URL 至少包含 `id / tab / proposalId / beatId`（`doc/odd-scene-scope-react-spec.md:1041-1053`）。

当前实现没有任何 route state：

- `packages/renderer/src/App.tsx:72-83` 直接硬编码 `sceneId = 'scene-midnight-platform'`
- `packages/renderer/src/features/scene/containers/SceneWorkspace.tsx:18-32` 用局部 `useState` 管 tab
- 代码中也没有 `useSceneRouteState` 对应实现

这会直接影响规格里要求的“默认入口”“可恢复上下文”和 scene 级定位能力，因此也不能算通过。

## 重要但不阻塞主结论的问题

### 5. Bottom Dock 没按规格做延迟加载与按 tab hydrate

规格要求 dock 未打开时不拉全量 trace，用户切到对应 tab 再 hydrate 详情（`doc/odd-scene-scope-react-spec.md:942-946`）。

当前实现一挂载就直接拉全量 dock 数据：

- `packages/renderer/src/features/scene/hooks/useSceneDockData.ts:7-31`

UI 上 tab 是对的：

- `packages/renderer/src/features/scene/components/SceneBottomDock.tsx:14-161`

但数据策略没有落到规格约束上，后续接真实 trace 时会放大性能和耦合问题。

### 6. proposal 动作后，右侧 inspector / 底部 dock 不能保证与主舞台同步

`useProposalActions` 只失效了 `workspace` 和 `execution` query：

- `packages/renderer/src/features/scene/hooks/useProposalActions.ts:14-27`

而 mock 数据更新也只改了 `workspace` / `execution.acceptedSummary`，并没有同步 `inspector` 或 `dock`：

- `packages/renderer/src/mock/scene-fixtures.ts:722-772`

这会导致哪怕在 mock 阶段，主舞台、右侧 `Versions`、底部 `Events/Problems` 之间也可能出现状态漂移，不符合“运行 + 审阅 + 裁决”的一体化目标。

### 7. Setup 与 Prose 已有落点，但 contract 仍是降级版

正面看：

- Setup 的 section 结构完整，动作栏也在：
  - `packages/renderer/src/features/scene/components/SceneSetupTab.tsx:83-520`
- Prose 已支持只读草稿、revision modes、focus mode：
  - `packages/renderer/src/features/scene/components/SceneProseTab.tsx:27-186`

但和规格相比仍有明显缩减：

- Setup 缺少 `scene type`、`hidden participants`、`props`、`reveal restrictions`、`safety / strictness level` 等字段要求（规格见 `doc/odd-scene-scope-react-spec.md:276-333`）
- Prose 仍是本地 mock revise，没有进入真实 `reviseScene` contract，也没有“export to chapter / focus read”这一层产品动作（规格见 `doc/odd-scene-scope-react-spec.md:581-600`）

这类问题本身未必立刻阻塞 UI 骨架验收，但会阻塞“按整份规格文档验收通过”。

## 已达成项

### 1. 主舞台结构方向是对的

以下分层已经落地：

- `SceneHeader`
- `SceneTabBar`
- `SceneExecutionTab`
- `SceneObjectiveStrip`
- `BeatRail`
- `ProposalReviewStack`
- `AcceptedStateFooter`
- `Inspector`
- `Bottom Dock`

对应代码：

- `packages/renderer/src/features/scene/containers/SceneWorkspace.tsx:50-55`
- `packages/renderer/src/features/scene/components/SceneExecutionTab.tsx:1-73`
- `packages/renderer/src/features/scene/components/SceneInspectorPanel.tsx:14-196`
- `packages/renderer/src/features/scene/components/SceneBottomDock.tsx:14-161`

这说明“导演台，不是聊天页/日志页”的方向已经进入代码骨架。

### 2. Proposal 审阅语义基本对齐规格

`ProposalCard` 已经把四类动作拆开，并保留了轻量 `Edit Then Accept`：

- `packages/renderer/src/features/scene/components/ProposalCard.tsx:86-150`

对应测试也覆盖了 `Accept` 与 `Edit Then Accept` 的本地 mock 行为，并且明确没有把 `Commit` 混入同一动作语义：

- `packages/renderer/src/features/scene/hooks/useProposalActions.test.tsx:33-88`

### 3. Inspector / Dock 没有反客为主

当前 inspector 与 dock 都基本遵守了“inspect / diagnose 下沉”的方向：

- `packages/renderer/src/features/scene/components/SceneInspectorPanel.tsx:48-193`
- `packages/renderer/src/features/scene/components/SceneBottomDock.tsx:50-161`

这部分符合规格对信息层级的要求，属于当前实现里最稳的一块。

## 验证结果

### 通过项

- `pnpm typecheck`：通过
- `pnpm test`：通过
  - 7 个测试文件
  - 10 个测试用例
- `pnpm build`：通过

### 失败项

- 浏览器 smoke：
  - 通过 Vite 启动页面后，默认首页进入 `Execution`
  - Playwright 控制台报 `Maximum update depth exceeded`
  - 因而当前“默认进入 Scene Execution 主舞台”的体验不稳定

### 测试覆盖缺口

当前测试主要覆盖的是：

- query hook
- setup form
- proposal action mock
- prose revise mock

但规格要求的闭环 smoke 仍未覆盖：

- `打开 scene -> run -> review -> patch preview -> commit`

对应规格位置：

- `doc/odd-scene-scope-react-spec.md:1375-1385`

## 最终结论

**按整份 `Scene Scope` 规格文档验收：不通过。**

更准确的阶段判断是：

- **UI 架构与信息分层：已进入可评审状态**
- **真实运行时接入与主流程动作：尚未到可验收状态**
- **浏览器默认入口稳定性：当前存在明确阻塞**

## 建议的通过前置条件

建议至少完成以下 5 项后，再做下一轮正式验收：

1. 修复 `SceneExecutionContainer` 的无限更新问题，确保默认 `Execution` 入口可稳定打开。
2. 用真实 preload / IPC / contract 替换 `scene-client` 的 fixture 实现，补上 patch preview 与 `commitStatePatch` 链路。
3. 把 `Continue Run`、`Patch Preview`、`Open Prose`、`Thread`、`Versions`、`Export` 这些显式动作全部接线。
4. 落地 route state，至少支持 `sceneId / tab / beatId / proposalId` 的 URL 恢复。
5. 补一条真正的 smoke：`open scene -> run -> review -> patch preview -> commit`。

在这 5 项完成前，我不建议把当前版本标记为“已按规格验收通过”。
