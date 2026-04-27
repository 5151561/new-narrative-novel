# PR51-PR68 并行开发研究报告

> 研究对象：`doc/real-project-long-term-roadmap-pr51-pr68.md`
>
> 研究目标：判断 PR51-PR68 哪些工作可以真实并行，哪些只能条件并行，哪些必须严格串行，为后续子代理分发和 bundle 切分提供依据。

---

## 1. 结论先行

- 可以并行，但不能把 `PR51-PR68` 当成 `18` 条互不相干的流水线平铺出去。
- 真正决定并行上限的，不是 PR 编号，而是 `5` 个 gate 和 `4` 条真相链：
  - `proposal -> review -> canon -> prose`
  - `scene -> chapter assembly -> book assembly`
  - `fixture/demo -> real project store`
  - `app session -> restart/reopen -> durable resume`
- 最适合并行的窗口是：
  - `Phase 2` 的 `PR54` 之后
  - `Phase 4` 的 `PR62-PR65`
  - `Phase 5` 的 `PR66-PR67`
- 最不适合并行的窗口是 `Phase 3`。这里更适合“单 bundle 内分 lane”，不适合把相邻 PR 当成独立主线并发推进。
- 推荐把这份路线图看成 `10` 个执行波次，而不是 `18` 个完全独立的 PR 单元。

## 2. 并行判断原则

### 2.1 Gate 不能被并行开发“绕过去”

可以提前做后续代码准备，但不能在 `Gate A-E` 未通过时，把后续阶段当成已解锁主线。

### 2.2 先冻结真相合同，再放开 read surface

凡是会改下面这些合同的任务，先串行冻结边界，再并行做外围：

- artifact shape
- project store schema
- runtime mode identity
- chapter/book assembly read model
- durable workflow resume contract

### 2.3 WorkbenchShell / route / runtime bootstrap 是高冲突区

任何并行拆分，只要同时大量改下面这些中心文件，最后都会退化成假并行：

- `packages/api/src/createServer.ts`
- `packages/renderer/src/App.tsx`
- `packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts`
- `packages/renderer/src/features/workbench/components/WorkbenchShell.tsx`
- `apps/desktop/src/main/main.ts`

### 2.4 前端并行只在“宪法不变”前提下成立

所有 renderer lane 都必须继续满足：

- `WorkbenchShell` 继续拥有 layout
- `scope x lens` 不变
- route / layout 不混淆
- Storybook 状态同步补齐
- route / layout / selection / restore 测试跟上

如果某个 lane 为了抢进度绕开这些边界，它就不该并行。

## 3. 分 Phase 结论

### Phase 1：`PR51-PR53`

结论：`1` 组条件并行 + `1` 个串行收口。

#### 可以条件并行

- `PR51 Real Scene Prose Writer Gateway`
- `PR52 Real Context Builder v1`

原因：

- `PR51` 主要收敛 `accepted proposal / canon patch -> prose artifact -> scene prose read model`
- `PR52` 主要收敛 `context packet` 的内容、解释性和 redaction 说明
- 两者共享场景运行主链，但职责仍能分开

前提：

- 先冻结 `context packet` artifact contract
- 先冻结 `prose draft` artifact contract
- 明确 `PR52` 只能做加法，不得临时改掉 `PR51` 的 prose materialization 语义

推荐 lane：

- Lane P1-A：`packages/api/src/orchestration/sceneRun/**`、`packages/renderer/src/features/scene/**`、`packages/renderer/src/features/run/**`
- Lane P1-B：`packages/api/src/orchestration/modelGateway/**`、`packages/renderer/src/features/traceability/**`、与 context 解释有关的 `scene` / `asset` supporting surface

#### 不建议并行

- `PR53 Scene Prose Revision Loop`

原因：

- 它依赖 `PR51` 已经把“真实 prose artifact -> current scene prose”这条链跑通
- 它的 source chain 验收直接吃 `original prose draft / revision instruction / accepted revision`
- 现在仓库里虽然已经有 `sceneRunProseRevision.ts` 和对应 renderer 容器，但路线图里的 `PR53` 是把现有 fixture/foundation 升级成长期可追踪修订，不是单纯补 UI

判断：

- `PR53` 可以做技术预研
- `PR53` 不适合作为主线 PR 与 `PR51` 同期正式推进

### Phase 2：`PR54-PR57`

结论：这是第一段真正高价值并行窗口，但必须先有一个短串行地基。

#### 必须先串行

- `PR54 Local Project Store v1`

原因：

- `PR55/56/57` 都默认真实项目已经有可识别的 project identity、manifest、schema version、artifact store 边界
- 当前仓库已经有 `packages/api/src/repositories/project-state-persistence.ts`、`apps/desktop/src/main/project-store.ts`、`apps/desktop/src/main/recent-projects.ts`，说明这里不是纯绿地，但仍然需要先把“产品真相落在哪里”定死

#### `PR54` 之后适合三路并行

- `PR55 Project Create / Open / Backup / Migration`
- `PR56 Fixture-to-Real Runtime Boundary`
- `PR57 Model Binding / Credential Store v1`

推荐 lane：

- Lane P2-A：项目生命周期
  - 主目录：`packages/api/src/repositories/**`
  - 主目录：`apps/desktop/src/main/project-store.ts`
  - 主目录：`apps/desktop/src/main/recent-projects.ts`
- Lane P2-B：runtime 身份边界
  - 主目录：`packages/renderer/src/app/runtime/**`
  - 主目录：`packages/renderer/src/app/project-runtime/**`
  - 主目录：`packages/api/src/routes/project-runtime.ts`
- Lane P2-C：模型绑定与凭据
  - 主目录：`packages/api/src/orchestration/modelGateway/**`
  - 主目录：`apps/desktop/src/main/main.ts`
  - 主目录：renderer settings/runtime wiring 所在入口

并行注意点：

- `PR55` 不能自己发明第二套 project identity
- `PR56` 不能把 layout / shell 逻辑混进 runtime banner
- `PR57` 不能把 raw secret 暴露进 renderer/run events/artifacts

### Phase 3：`PR58-PR61`

结论：主链基本串行，只适合做“同一 bundle 内的前后端分 lane”。

#### 串行主链

- `PR58 Chapter Planning and Scene Backlog`
- `PR59 Chapter Run Orchestration v1`
- `PR60 Chapter Draft Assembly v2`
- `PR61 Book Draft / Manuscript Assembly v1`

原因：

- 路线图自己的最低真相链已经写死了：`scene -> chapter assembly -> book assembly`
- `PR59` 要消费 `PR58` 的 accepted scene backlog
- `PR60` 要消费多个 scene prose 和 chapter 状态
- `PR61` 再消费 chapter draft truth

#### 仅推荐这种有限并行

- `PR59` 的 orchestration/status/event side
- `PR60` 的 read model / renderer chapter draft surface

前提：

- 先冻结 `chapter draft` 的 assembled read model
- `PR60` 不得反向改 `PR59` 的 chapter status 语义

不推荐的做法：

- 让 `PR61` 提前正式开主线
- 在 `book` scope 里自己补一套绕过 chapter truth 的 manuscript 聚合

### Phase 4：`PR62-PR65`

结论：这是整份路线图里并行密度最高的一段。

#### 可以并行的四条 lane

- `PR62 Review Inbox / Continuity QA v1`
- `PR63 Asset Story Bible MVP`
- `PR64 Checkpoint / Experiment Branch v1`
- `PR65 Failure Recovery / Cost / Observability v1`

为什么这段适合并行：

- `PR62` 主要是 review issue 汇总、stale 标记、fix/dismiss/rewrite action
- `PR63` 主要是 typed asset truth、visibility、mentions、relations、timeline
- `PR64` 主要是 checkpoint / branch / compare / selective adopt
- `PR65` 主要是 retry、error class、cost、cancel、runtime summaries

它们共享 `Gate C` 之后的真实项目真相，但不必争夺同一条一级创作主链。

推荐 lane：

- Lane P4-A：`packages/renderer/src/features/review/**` + review/read-model API
- Lane P4-B：`packages/renderer/src/features/asset/**` + traceability/context extension
- Lane P4-C：`packages/renderer/src/features/book/**` 的 branch/compare seams + project store checkpoint side
- Lane P4-D：`packages/renderer/src/features/run/**`、`packages/api/src/orchestration/sceneRun/**`、runtime/observability surfaces

并行注意点：

- `PR63` 对 context packet 的扩展必须是 additive contract，不能把 `PR52` 整体重开
- `PR64` 只做 canon/manuscript branch，不要膨胀成 Git-like 全局分支系统
- `PR65` 的信息必须落在 Dock / Runtime supporting surface，不能抢 Main Stage

### Phase 5：`PR66-PR68`

结论：`PR66` 和 `PR67` 可以并行，`PR68` 必须最后单独锁版。

#### 可以并行

- `PR66 Desktop Real Project Mode`
- `PR67 Durable Workflow Adapter v1`

推荐边界：

- Lane P5-A：desktop 入口与 supervisor
  - `apps/desktop/src/main/local-api-supervisor.ts`
  - `apps/desktop/src/main/worker-supervisor.ts`
  - `apps/desktop/src/main/project-store.ts`
  - `apps/desktop/src/main/main.ts`
- Lane P5-B：durable workflow
  - `packages/api/src/orchestration/**`
  - `packages/api/src/repositories/**`
  - run status / resume 所需的最小 renderer hook

前提：

- `PR66` 不能把业务真相塞回 Electron main
- `PR67` 不能让 workflow history 重新变成产品真相

#### 必须串行

- `PR68 Long Project Dogfood / Release Candidate Lock`

原因：

- 这是锁版 PR，不是功能扩展 PR
- 它的职责是把前面所有 lane 汇总到一个真实 dogfood 项目里验证
- 这里只有在 dogfood 发现明确 P0/P1 缺陷后，才适合再拆 bugfix bundle 并行修

## 4. 推荐执行波次

| 波次 | 目标 | 并行度 | 建议 |
| --- | --- | --- | --- |
| Wave 1 | `PR51 + PR52` | 2 lane | 先冻 artifact/context contract，再并行 |
| Wave 2 | `PR53` | 串行 | 收口真实 prose revision |
| Wave 3 | `PR54` | 串行 | 冻结 real project store 基线 |
| Wave 4 | `PR55 + PR56 + PR57` | 3 lane | 这是第一段高性价比并行窗口 |
| Wave 5 | `PR58` | 串行 | 冻结 chapter backlog truth |
| Wave 6 | `PR59 + PR60` | 2 lane，同 bundle | 只做有限并行，不拆成互抢主线的两个 PR |
| Wave 7 | `PR61` | 串行 | book manuscript 收口 |
| Wave 8 | `PR62 + PR63 + PR64 + PR65` | 3-4 lane | 全路线图最高并行密度窗口 |
| Wave 9 | `PR66 + PR67` | 2 lane | desktop 与 durable workflow 并进 |
| Wave 10 | `PR68` | 串行 | dogfood、P0/P1 修复、锁版 |

## 5. 子代理分包建议

如果后续按 bundle 分发给子代理，建议不要按“一个 PR 一个代理”机械切，而是按 ownership 切。

### 推荐分包 A：Phase 2 并行包

- Worker A：`PR55`
  - task 1：Create/Open/Recent Projects
  - task 2：Backup/Migration/Version Guard
- Worker B：`PR56`
  - task 1：runtime identity contract
  - task 2：renderer degraded/runtime badge/read boundary
- Worker C：`PR57`
  - task 1：credential store bridge
  - task 2：model binding settings + run plumbing

### 推荐分包 B：Phase 4 并行包

- Worker A：`PR62`
  - task 1：review inbox issue model
  - task 2：stale/fix/dismiss/rewrite actions
- Worker B：`PR63`
  - task 1：typed asset/project truth
  - task 2：mentions/visibility/context extension
- Worker C：`PR64`
  - task 1：checkpoint store + branch creation
  - task 2：compare/selective adopt
- Worker D：`PR65`
  - task 1：retry/error/cancel semantics
  - task 2：cost/runtime/observability surfaces

### 推荐分包 C：Phase 5 并行包

- Worker A：`PR66`
  - task 1：desktop project open/create path
  - task 2：API/worker supervisor + recent projects
- Worker B：`PR67`
  - task 1：durable run state machine
  - task 2：resume/review/retry/cancel contract

## 6. 当前代码结构对并行的支持度

从当前仓库看，并行开发不是空想，因为已经有这些可复用 seam：

- scene run / prose / revision foundation：
  - `packages/api/src/orchestration/sceneRun/sceneRunWorkflow.ts`
  - `packages/api/src/orchestration/sceneRun/sceneRunProseMaterialization.ts`
  - `packages/api/src/orchestration/sceneRun/sceneRunProseRevision.ts`
- project/runtime foundation：
  - `packages/api/src/repositories/project-state-persistence.ts`
  - `packages/renderer/src/app/runtime/runtime-config.ts`
  - `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
- desktop foundation：
  - `apps/desktop/src/main/project-store.ts`
  - `apps/desktop/src/main/recent-projects.ts`
  - `apps/desktop/src/main/local-api-supervisor.ts`
  - `apps/desktop/src/main/worker-supervisor.ts`
- book/review/branch foundation：
  - `packages/renderer/src/features/book/**`
  - `packages/renderer/src/features/review/**`
  - `packages/renderer/src/features/traceability/**`

这意味着后续并行开发更应该利用现有 seam 扩展，而不是重开新框架。

## 7. 最终建议

- 推荐并行窗口：`Wave 4`、`Wave 8`、`Wave 9`
- 条件并行窗口：`Wave 1`、`Wave 6`
- 不要强行并行的窗口：`Wave 2`、`Wave 3`、`Wave 5`、`Wave 7`、`Wave 10`

## 8. 执行节奏建议

- 每个并行 wave 不要边做边零碎合并，应该等该 wave 内每个 worker 的 `2+ tasks` 都完成后，再做一次合并的 spec/code review。
- review 通过后，按 bundle 单位提交 commit，不要把同一 wave 的多个半成品交叉提交。
- 任何 renderer lane 只要改了 workbench surface、route、layout、review flow、run flow，都要同步补 Storybook 状态。
- renderer 验收不要只看截图，必须走 MCP 结构化快照 + 截图结合的检查方式。
- 如果某个 lane 开始频繁碰 `createServer.ts`、`App.tsx`、`WorkbenchShell.tsx`、`main.ts` 这些热点文件，就应暂停扩并行度，先收敛合同再继续。

如果只给一句执行建议，就是：

> 先把 `Phase 1` 和 `PR54` 当成冻结合同的地基；真正放量并行从 `PR55-PR57` 和 `PR62-PR65` 开始；`Phase 3` 不要为了并行而并行。
