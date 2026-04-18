# Scene 数据层切换计划（4 个 PR）

## 结论

这份计划以 **“不再扩 UI，先换数据层”** 为中心推进。

原因是当前仓库可见部分基本围绕 `renderer` 展开，根脚本也主要运行 `@narrative-novel/renderer`；同时 `features/scene` 下已经具备 `api / components / containers / hooks` 分层，组件、容器、stories、tests 也已铺开，最近提交还刚完成了 `scene scope UI realignment` 与 `runtime bridge + 路由状态管理` 相关收口。此时继续扩 UI 的收益不高，优先替换 Scene 数据层更稳，也更容易形成可验证闭环。

---

## 目标

用 4 个 PR，把 Scene 页面从当前的 mock / bridge 混合模式，逐步切到 **以 preload bridge 为主、以 Query refetch 为唯一回流机制** 的结构，同时避免路由状态与本地 store 出现双真源。

---

## 范围与原则

### 范围

本计划聚焦 `packages/renderer/src/features/scene`：

- `api`
- `hooks`
- `containers`
- 与 Scene 页面直接相关的状态流与 Query 流

### 原则

1. **不扩 UI，先换数据层。**
2. **bridge mode 与 mock mode 必须严格分离。**
3. **真实写入结果只来自 refetch，不来自本地 fixture 幻觉。**
4. **Accept 不等于 Commit。**
5. **选中态最终只保留一个真源。**

---

## PR1：把 `scene-client` 重构为真正的双模式 adapter

### 目标

将 `packages/renderer/src/features/scene/api/scene-client.ts` 从当前的“bridge + mock 混合写法”，重构为两种边界清晰的运行模式：

- `mock preview mode`
- `preload bridge mode`

### 为什么优先做

当前 `scene-client` 已经定义了完整的 `SceneRuntimeBridge` 能力面，并会检查 `window.narrativeRuntimeBridge?.scene`。但它现有的 `runWriteThrough` 逻辑存在明显风险：**只要 bridge 写成功，后续仍会继续执行 fallback mock 写入**。

这会在接入真 IPC 后制造“真实数据 + 本地 fixture 双写”的分叉风险，是后续所有 PR 的根部问题，因此必须最先处理。

### 具体改动

- 把 `SceneRuntimeBridge`、`SceneClient`、`SceneRuntimeInfo` 抽到独立 contract 文件；若暂不拆文件，也至少在 `scene-client.ts` 内拆出清晰的 adapter 层。
- 删除“bridge 写成功后继续执行 `fallbackWrite`”的行为。
- 明确运行规则：
  - **有 bridge：只走 bridge，并依赖 Query refetch 回流数据。**
  - **没 bridge：只走 mock database。**
- 对“bridge 存在但某个 capability 缺失”的场景：
  - 返回明确错误，或
  - 返回 capability-disabled 状态。
- 不再对 capability 缺失场景偷偷降级到本地 fixture。

### 产出

- 清晰的双模式 adapter 结构。
- 明确的 runtime source 标识。
- 后续只读 / 写入接入的稳定底座。

### 验收标准

- `runtimeInfo.source` 只有两种明确来源：
  - `preload-bridge`
  - `mock-fallback`
- bridge mode 下，不再发生本地 mock DB 被一并改写。
- capability 缺失时，行为明确、可观测、可测试。

---

## PR2：接入只读 bridge，不改现有 UI 结构

### 目标

先打通 Scene 页面的只读能力，让现有页面在真实数据上跑起来，而不是重写页面结构。

需接入的只读接口：

- `getSceneWorkspace`
- `getSceneSetup`
- `getSceneExecution`
- `getSceneProse`
- `getSceneInspector`
- `getSceneDockSummary`
- `getSceneDockTab`

### 为什么这一步可以快做

现有 Query 层和 key 体系已经具备，`sceneQueryKeys` 也已将以下数据面拆分完成：

- `workspace`
- `setup`
- `execution`
- `prose`
- `inspector`
- `dock`
- `patchPreview`

因此这一步的核心不是重写页面，而是**替换 `SceneClient` 底层数据源**。

### 具体改动

优先修改：

- `scene-client.ts`

尽量不动以下容器结构：

- `SceneWorkspace.tsx`
- `SceneSetupContainer.tsx`
- `SceneExecutionContainer.tsx`
- `SceneProseContainer.tsx`
- `SceneInspectorContainer.tsx`
- `SceneDockContainer.tsx`

### 产出

- 现有 Scene 页面可在 bridge 数据上正常读取。
- UI 层无需大面积重构。
- 页面状态表现尽量维持稳定。

### 验收标准

- `Setup / Execution / Prose / Inspector / Dock` 可以基于真实 bridge 数据打开。
- 页面刷新后，仍能读取同一份真实 scene 数据。
- `loading / error / empty state` 表现与现状保持一致。

---

## PR3：接入写路径，但保持 `Accept ≠ Commit`

### 目标

在只读链路稳定后，再打通 Scene 的写操作。

需接入的写接口：

- `saveSceneSetup`
- `continueSceneRun`
- `switchSceneThread`
- `acceptProposal`
- `editAcceptProposal`
- `requestRewrite`
- `rejectProposal`
- `previewAcceptedPatch`
- `commitAcceptedPatch`
- `reviseSceneProse`

### 为什么放在第三步

当前 hooks 层已经把 mutation 后的 Query invalidation 铺好：

- `useProposalActions` 会失效：
  - `workspace`
  - `execution`
  - `inspector`
  - `dock`
  - `patchPreview`
- `useSceneWorkspaceActions` 会失效：
  - `workspace`
  - `execution`
  - `prose`
  - `inspector`
  - `dock`
  - `patchPreview`
- `useSceneSetupForm` 会在保存后刷新：
  - `setup`
  - `workspace`
  - `execution`
  - `inspector`

也就是说，mutation 层骨架已经具备，当前主要差的是：**把底层数据源从 mock 切到 bridge**。

### 具体改动

主要继续收口：

- `scene-client.ts`

并做少量联动检查：

- `useProposalActions.ts`
- `useSceneWorkspaceActions.ts`
- `useSceneSetupForm.ts`

如果 bridge 返回的是“部分更新”而不是“全量快照”，再评估是否需要补充更精细的 cache update；否则第一阶段继续采用：

- `invalidate`
- `refetch`

### 关键约束

- `Accept` 只影响 review / accepted summary / patch candidate。
- `Commit` 仍只发生在 patch flow 中。
- 不允许把 `acceptProposal` 语义直接提升为 prose 正式落盘。

### 验收标准

- `Accept` 不直接等于正式写回。
- `Commit` 只在 patch flow 中发生，与 Scene 规格保持一致。
- bridge mode 下，所有写后结果都来自 refetch，而不是本地 fixture 的假象。

---

## PR4：收口“选中态”真源，并补 smoke

### 目标

把 route/store 的边界收紧，避免 Scene 的选中态出现双真源；随后补一条核心闭环 smoke 路径。

### 为什么必须做

当前状态已经出现“双真源”苗头：

- `useProposalSelection` 实际上只是 `useSceneUiStore` 的别名。
- `scene-ui-store` 里还保留着：
  - `selectedProposalId`
  - `selectedBeatId`
- 但 `SceneExecutionContainer` 已经从 route 读取：
  - `beatId`
  - `proposalId`
- store 主要真正持有的却只是：
  - `filters`

在 mock 时代问题可能不明显，但真 IPC 一接入，route 与 store 很容易发生漂移与打架。

### 具体改动

从 Zustand 中移除：

- `selectedProposalId`
- `selectedBeatId`

改为由 **route 作为唯一真源**。

Zustand 仅保留：

- `filters`
- `inspectorTab`
- `dockTab`
- `patchPreviewOpen`

同时：

- 将 `useProposalSelection` 改名，或
- 重做为一个真正只处理过滤器的 hook

避免命名继续误导读者，把“选中态”错认为 store 持有。

### 产出

- 选中态只有一个真源。
- 深链与刷新恢复更稳定。
- 真 bridge 场景下的状态回放更可靠。

### 验收标准

- 深链 URL 能稳定恢复当前 `beat / proposal`。
- 页面刷新后不会丢失选中态。
- 不再出现 route 与 store 互相覆盖、互相打架的情况。

---

## Smoke 测试定义

最终只验证一条主路径：

```text
打开 scene
-> 进入 execution
-> accept / rewrite / reject
-> open patch preview
-> commit
-> open prose
```

这条路径对应的是当前 Scene 规格里最核心的闭环，也是 Task 04 与 Task 08 想真正打通的主线。

---

## 推荐执行顺序

```text
1. scene-client.ts 双模式重构
2. 只读 bridge 接入
3. 写路径接入
4. route/store 选中态收口
5. 闭环 smoke
```

---

## 落地说明

如果 `main/preload` 代码不在当前仓库中：

- PR2 和 PR3 中真正的 bridge 实现，可以落在外层 Electron 工程；
- 但 renderer 侧仍然应先完成：
  - contract 收口
  - Query 流程对齐
  - 状态边界收口

也就是说，即便 bridge 具体实现不在当前仓库，**renderer 侧这 4 个 PR 仍然可以独立推进**。

---

## 最值得立刻开始的工作

**优先启动 PR1：`scene-client` 双模式重构。**

这是后续所有 bridge 接入的基础，也是当前风险最高、收益最大的改动点。

---

## 参考链接

1. [仓库总览](https://github.com/5151561/new-narrative-novel)
2. [`scene-client.ts`](https://raw.githubusercontent.com/5151561/new-narrative-novel/main/packages/renderer/src/features/scene/api/scene-client.ts)
3. [`scene-query-keys.ts`](https://raw.githubusercontent.com/5151561/new-narrative-novel/main/packages/renderer/src/features/scene/hooks/scene-query-keys.ts)
4. [`useProposalActions.ts`](https://raw.githubusercontent.com/5151561/new-narrative-novel/main/packages/renderer/src/features/scene/hooks/useProposalActions.ts)
5. [`useProposalSelection.ts`](https://github.com/5151561/new-narrative-novel/blob/main/packages/renderer/src/features/scene/hooks/useProposalSelection.ts)
