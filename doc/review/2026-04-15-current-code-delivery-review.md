# 当前代码交付审查报告

- 审查日期：2026-04-15
- 审查对象：
  - `doc/odd-frontend-comprehensive-design.md`
  - `doc/odd-scene-scope-react-spec.md`
  - `packages/renderer/src/**`
- 审查结论：**不符合当前交付标准**

## 一句话结论

当前代码已经具备一个可交互的 `Scene Scope` mock 工作台，浏览器里主流程也基本能走通；但它仍然不满足“可交付”标准，因为 **正式构建失败**、**真实 preload / IPC runtime 没有接入**，并且 **整体工作台结构还没有达到综合设计文档要求的双轴导航形态**。

## 审查方法

1. 对照 `odd-frontend-comprehensive-design.md` 检查整体工作台信息架构。
2. 对照 `odd-scene-scope-react-spec.md` 检查 Scene Scope 规格与任务链验收项。
3. 阅读关键实现：
   - `packages/renderer/src/App.tsx`
   - `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`
   - `packages/renderer/src/features/scene/**`
4. 执行验证：
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm build`
5. 启动开发服务器后，用 Playwright 抓结构化快照并验证 `open scene -> continue run -> patch preview -> commit -> open prose`。

## 结论分级

| 维度 | 结论 | 说明 |
| --- | --- | --- |
| Scene mock 主舞台可用性 | 部分通过 | 本地 mock 下，`Execution / Patch Preview / Commit / Prose` 交互基本可走通。 |
| 规格任务 01/02/03/05/06/07 | 大体通过 | Scene Workspace、Execution 骨架、Proposal 动作、Inspector、Dock、Prose 已有落点。 |
| 规格任务 04（真实 Scene client / IPC） | **不通过** | 仍运行在 `Mock Fallback`，仓库里没有真实 preload / IPC bridge 实现。 |
| 规格任务 08（可交付测试 / smoke） | **不通过** | `pnpm build` 失败，无法通过正式交付门槛。 |
| 综合前端设计一致性 | **不通过** | 现有 Workbench 仍是 Scene 专项 demo，还不是文档要求的双轴 Narrative IDE。 |

## 阻塞问题

### 1. 正式构建失败，当前版本不能作为可交付产物

`pnpm build` 直接失败，阻塞交付：

- `packages/renderer/src/features/scene/hooks/useSceneRouteState.ts:57-61`
  - `params.get()` 的返回值仍是 `string | null`，三元表达式没有把结果收窄到 `SceneLens` / `SceneTab` / `SceneRouteModal`。
- `packages/renderer/src/features/scene/hooks/useSceneDockData.test.tsx:73`
  - `renderHook` 初始 props 被推断成 `{ activeTab: 'events' }`，后续 `rerender({ activeTab: 'trace' })` 与该字面量类型冲突。

更严重的是，`pnpm typecheck` 却显示通过：

- `packages/renderer/package.json:7-10`
  - `typecheck` 用的是 `tsc --noEmit`
- `packages/renderer/tsconfig.json:1-6`
  - 这是一个只含 `references` 的 solution config，`files` 为空

实测 `pnpm exec tsc --noEmit --listFilesOnly` 没有列出任何文件，说明当前 `typecheck` 脚本没有覆盖真正会参与构建的项目引用。也就是说，仓库当前的“类型检查通过”是一个假阳性信号，无法作为交付依据。

### 2. 真实 runtime / preload / IPC 没有接入，仍停留在 mock fallback

规格要求 `Task 04` 用真实 contract / IPC 替换静态 fixture，并要求 renderer 只能通过 preload / IPC 访问 runtime：

- `doc/odd-scene-scope-react-spec.md:1323-1333`
- `doc/odd-scene-scope-react-spec.md:1155-1202`

当前实现虽然把 `SceneClient` 抽出来了，也预留了 bridge 形态：

- `packages/renderer/src/features/scene/api/scene-client.ts:35-82`
- `packages/renderer/src/features/scene/api/scene-client.ts:113-159`

但仓库内并没有任何真实 bridge 注入：

- 全仓搜索只命中了测试桩和 renderer fallback 逻辑，没有 `preload`、`contextBridge`、`ipcRenderer`、`generateNextScene`、`commitStatePatch` 的实际实现。
- 运行中的页面顶部也明确显示 `Mock Fallback`：
  - `packages/renderer/src/App.tsx:15-31`

这意味着当前版本依旧是 mock 演示环境，不满足正式交付所需的 runtime 闭环。

### 3. 整体工作台仍未达到综合设计文档要求的双轴模型

综合设计文档要求：

- Mode Rail 承载工作模式：`Workbench / Structure / Orchestrate / Knowledge / Draft`
- Navigator 承载对象导航：`Book / Chapter / Scene / Asset`
- 形成“对象 scope + 工作 lens”的双轴模型

依据：

- `doc/odd-frontend-comprehensive-design.md:431-520`

当前实现里：

- `packages/renderer/src/App.tsx:43-57`
  - Mode Rail 写成了 `Book / Chapter / Scene / Prose`，把对象和模式混在一起；
- `packages/renderer/src/App.tsx:60-83`
  - Navigator 仍是硬编码的两个 scene 条目；
- `packages/renderer/src/App.tsx:86-99`
  - 主区始终挂的只是单个 `SceneWorkspace`；
- `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx:25-57`
  - Shell 只有固定四列 + 固定底 dock，没有 editor tabs、split view 或多对象并行能力。

所以这版更适合被定义为“Scene Scope demo / prototype”，还不能说已经符合整套前端设计交付标准。

## 已验证可用的部分

### 1. Scene 主流程在 mock 环境下基本能走通

通过 Playwright 结构化快照验证：

1. 打开默认页面，落在 `Scene / Execution`
2. 点击 `Continue Run`
3. 点击 `Patch Preview`
4. 点击 `Commit Patch`
5. 点击 `Open Prose`

以上路径在本地开发服务器里都能产生对应 UI 状态变化，说明：

- Scene 主舞台不是静态图；
- `Accept != Commit` 的分层是保住的；
- Patch Preview / Commit / Prose 至少在 mock 数据流里已经接线。

### 2. 测试层面有一定覆盖

执行结果：

- `pnpm test`：通过
  - 11 个测试文件
  - 20 个测试用例

其中已经覆盖：

- `SceneExecutionContainer`
- `useSceneDockData`
- `useSceneInspectorData`
- `useProposalActions`
- `scene-client`
- `App` 的 route state 恢复

这说明当前代码不是“纯手工拼 UI”，而是有一定自检能力。

## 当前阶段判断

更准确地说，当前代码处于：

**“Scene Scope 的高保真 mock 原型，可评审，但尚不可交付”**

如果验收口径只收窄到：

- `Task 01`
- `Task 02`
- `Task 03`
- `Task 05`
- `Task 06`
- `Task 07`

并且允许使用本地 mock runtime，那么这版已经接近通过。

但如果验收口径是“项目当前代码是否符合交付标准”，答案仍然是：

**不符合。**

## 建议的通过前置条件

1. 修复 `pnpm build` 的 TypeScript 错误，并让 `pnpm typecheck` 真正覆盖到构建引用项目。
2. 接入真实 preload / IPC bridge，移除页面顶层的 `Mock Fallback` 交付形态。
3. 至少完成 `Scene` 级 runtime 闭环的正式实现，使 `continue run / patch preview / commit` 不再依赖 fixture 数据。
4. 按综合设计文档继续推进双轴工作台，把 Mode Rail 和 Navigator 从当前硬编码 demo 升级成真实的 scope / lens 导航。
