# new-narrative-novel

> 面向叙事编排的 Narrative IDE / Workbench 原型。当前仓库已经从早期单一 Scene UI，推进到四个 scope、项目级 runtime 边界、fixture API server、scene run 时间线、artifact / trace 读面的联调阶段。

## 项目是什么

`new-narrative-novel` 不是传统小说编辑器，也不是 chat-first 的 AI 写作页面集合。

它更像一个 **面向叙事创作的工作台**：作者在 `Book / Chapter / Scene / Asset` 等对象之间切换，用结构、编排、草稿、知识、审阅等工作视角，把 AI 参与的中间过程显式化。

项目关心的核心问题是：

**如何让作者像导演或主编一样，组织、审阅、追踪并落盘叙事生成过程，而不是只收到一段不可解释的文本。**

## 当前状态

截至 2026-04-25，仓库由三个主要 workspace 包组成：

- `@narrative-novel/renderer`：React + Vite + Tailwind 的 workbench 前端、Storybook、mock runtime、UI/feature tests。
- `@narrative-novel/api`：Fastify fixture-backed API server，兑现 `/api/projects/{projectId}/...` 合同，支持 read/write/run/artifact/trace 的产品级接口骨架。
- `@narrative-novel/desktop`：Electron workbench shell，承载现有 renderer，并在桌面模式下托管本地 fixture API；不选择项目目录、不接 worker。

当前最准确的理解是：

**这是一个以 renderer / Storybook 为主要评审面、以 fixture API server 验证真实 HTTP runtime 合同的叙事工作台原型。**

已经落地的主线包括：

- 四个 workbench scope：`scene`、`chapter`、`asset`、`book`。
- route-first 的 scope/lens/view 状态管理，深链以 `/workbench?...` 查询参数承载。
- `ProjectRuntime` 前端 client/provider 边界，产品路径收敛到 `createApiProjectRuntime -> /api/projects/...`。
- mock runtime 仍用于 Storybook、测试、演示；不再被描述为产品持久化终态。
- project-level runtime health 边界：`GET /api/projects/{projectId}/runtime-info`。
- Scene / Orchestrate 的 run 纵切：start run、polling events、waiting review、submit review decision、刷新 scene/chapter read model。
- Run artifact / trace read surfaces：事件只携带轻量 `refs`，大 payload 通过 artifact/trace 读取。
- Asset Context Policy / Context Activation Trace 基础：Asset / Knowledge 可以只读展示资产进入上下文的规则；context-packet artifact detail 可以解释某次 run included / excluded / redacted 了哪些 asset context。

## 产品模型

### Scope：正在处理哪个对象

当前 route 类型已经支持：

- `Scene`
- `Chapter`
- `Asset`
- `Book`

### Lens / View：用什么工作视角处理

当前落地的主要组合：

- `Scene`
  - `structure`
  - `orchestrate`
  - `draft`
- `Chapter`
  - `structure`
  - `draft`
- `Asset`
  - `knowledge`
- `Book`
  - `structure`
  - `draft`

其中 Book draft 继续细分为：

- `read`
- `compare`
- `export`
- `branch`
- `review`

### State Flow：AI 参与过程如何被审阅

系统不把 AI 生成直接压成 prose，而是把中间过程拆成可审阅、可追踪的状态流：

```text
constraint -> proposal -> review -> accepted canon -> prose
```

近期 run/event/artifact/trace 工作把这条链进一步产品化：

- run events 只保留产品级摘要和轻量 refs。
- context packet、agent invocation、proposal set、canon patch、prose draft 等大对象走 artifact detail。
- asset context policy 随 asset knowledge read model 返回；context activation trace 随 context-packet artifact detail 返回。
- proposal -> canon -> prose 的关系走 trace read surface。
- `events/stream` 仍是 501 占位；当前 renderer 使用 REST + polling/page contract。

## Workbench 壳子

项目采用稳定的 **Workbench shell**，而不是一次性固定页面：

1. **Mode Rail**：scope / lens 入口
2. **Navigator**：对象导航与层级选择
3. **Main Stage**：当前主任务
4. **Inspector**：上下文、版本、引用、trace 等辅助判断区
5. **Bottom Dock**：问题、活动、运行状态、支持信息

交互纪律：

- 中间只承载一个一级任务。
- 右侧只做辅助判断。
- 底部只放问题、活动和运行支持信息。
- 左侧负责对象导航，不堆叠主动作。

## 已落地能力概览

### Scene

- Scene workspace：setup / execution / prose。
- Proposal review、patch preview、commit、prose revision 等 mock/API 合同。
- Scene run session：start、detail、event timeline、review gate。
- Run artifact inspector 与 trace panel 作为 Scene / Orchestrate 的支持面。

### Chapter

- Chapter structure workspace：sequence / outliner / assembly。
- Chapter draft workspace。
- Chapter -> Scene handoff。
- Chapter scene reorder、structure patch 的 API-backed mutation 与 optimistic rollback 规则。

### Asset

- Asset knowledge workspace。
- profile / mentions / relations / context 视图。
- 只读 Asset Context Policy：activation rules、visibility、budget、target agents、guardrails、warnings。
- asset not-found 与 Storybook/mock fixture 场景。

### Book

- Book structure workspace：sequence / outliner / signals。
- Book draft workspace：read / compare / export / branch / review。
- Manuscript checkpoints、export profiles、export artifacts、experiment branches。
- Review inbox、review decisions、source-fix actions、trace gap / export readiness / branch readiness 等读写面。

### API / Runtime

- Fastify fixture API server。
- 统一 JSON error body。
- Book / Chapter / Asset / Review / Scene read surfaces。
- Review decision、review fix action、chapter mutation、export artifact build 等写路径。
- Project runtime health：`runtime-info`。
- Scene run REST 合同：start run、get run、paginated events、submit review decision。
- Run artifact / trace read surfaces。
- Context-packet artifact activation trace：included / excluded / redacted asset context detail；run event 仍只放轻量 refs/count metadata。

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 启动 fixture API server

```bash
pnpm dev:api
```

默认地址：

```txt
http://127.0.0.1:4174
```

### 配置 renderer 使用 API runtime

`packages/renderer/.env.example` 提供最小联调变量：

```bash
VITE_NARRATIVE_API_BASE_URL=http://localhost:4174
VITE_NARRATIVE_PROJECT_ID=book-signal-arc
```

不配置 `VITE_NARRATIVE_API_BASE_URL` 时，renderer 使用 mock runtime，适合 Storybook、测试和静态演示。

### 启动 renderer

```bash
pnpm dev:renderer
```

如需固定 host/port，可直接运行 renderer 包脚本：

```bash
pnpm --filter @narrative-novel/renderer dev --host 127.0.0.1 --port 4173
```

### 启动 desktop shell

Desktop shell 会加载现有 Web Workbench，并自动启动本地 `@narrative-novel/api` fixture server。renderer 仍保持 Web-first，业务流量继续通过 HTTP API contract；桌面端只通过 `window.narrativeDesktop` 暴露 runtime config、local API status / restart / log buffer 等窄桥接能力。

先启动 renderer dev server：

```bash
pnpm --filter @narrative-novel/renderer dev --host 127.0.0.1 --port 4173
```

再启动 Electron shell：

```bash
pnpm dev:desktop
```

不需要再手动运行 `pnpm dev:api`。Electron main 会选择可用端口，启动 `packages/api`，并把 `http://127.0.0.1:<port>/api` 作为 desktop-local runtime config 提供给 renderer。

如需使用其它 renderer dev server 地址：

```bash
NARRATIVE_RENDERER_DEV_URL=http://127.0.0.1:5173 pnpm dev:desktop
```

生产加载路径使用 `packages/renderer/dist/index.html` 或打包后的等价 renderer 资源。当前 desktop 包新增依赖后需要重新执行 `pnpm install` 才会写入 lockfile 并安装 Electron。

### 启动 Storybook

```bash
pnpm storybook
```

默认端口由 renderer 包脚本指定为 `6006`：

```txt
http://127.0.0.1:6006
```

Storybook 是前端规范层和评审层。涉及前端组件、页面、fixtures 的改动，应同步更新对应 story，并用结构化页面快照验证关键 story。

## 常用命令

根脚本当前暴露：

```bash
pnpm dev:api
pnpm dev:desktop
pnpm dev:renderer
pnpm build:desktop
pnpm test:desktop
pnpm typecheck:desktop
pnpm typecheck
pnpm test
pnpm build
pnpm storybook
```

说明：

- `pnpm typecheck` 同时覆盖 `@narrative-novel/api`、`@narrative-novel/renderer` 与 `@narrative-novel/desktop`。
- `pnpm test` 同时覆盖 `@narrative-novel/api`、`@narrative-novel/renderer` 与 `@narrative-novel/desktop`。
- `pnpm build` 当前只构建 renderer。
- `pnpm dev:desktop` 启动 Electron thin shell，默认加载 `http://127.0.0.1:4173` 的 renderer dev server。
- `pnpm storybook` 当前只启动 renderer Storybook。

包级命令：

```bash
pnpm --filter @narrative-novel/api typecheck
pnpm --filter @narrative-novel/api test
pnpm --filter @narrative-novel/desktop typecheck
pnpm --filter @narrative-novel/desktop test
pnpm --filter @narrative-novel/desktop build
pnpm --filter @narrative-novel/renderer typecheck
pnpm --filter @narrative-novel/renderer test
pnpm --filter @narrative-novel/renderer build-storybook
```

## API 合同速览

产品态前端边界统一是：

```text
/api/projects/{projectId}/...
```

当前固定 fixture project：

```txt
book-signal-arc
```

关键端点族：

- `GET /api/projects/{projectId}/runtime-info`
- `GET /api/projects/{projectId}/books/{bookId}/structure`
- `GET /api/projects/{projectId}/chapters/{chapterId}/structure`
- `GET /api/projects/{projectId}/assets/{assetId}/knowledge`
- `GET /api/projects/{projectId}/books/{bookId}/review-decisions`
- `PUT /api/projects/{projectId}/books/{bookId}/review-decisions/{issueId}`
- `GET /api/projects/{projectId}/books/{bookId}/review-fix-actions`
- `PUT /api/projects/{projectId}/books/{bookId}/review-fix-actions/{issueId}`
- `POST /api/projects/{projectId}/scenes/{sceneId}/runs`
- `GET /api/projects/{projectId}/runs/{runId}`
- `GET /api/projects/{projectId}/runs/{runId}/events`
- `POST /api/projects/{projectId}/runs/{runId}/review-decisions`
- `GET /api/projects/{projectId}/runs/{runId}/artifacts`
- `GET /api/projects/{projectId}/runs/{runId}/artifacts/{artifactId}`
- `GET /api/projects/{projectId}/runs/{runId}/trace`
- `GET /api/projects/{projectId}/runs/{runId}/events/stream`：当前保持 `501` 占位

详细合同见 [doc/api-contract.md](doc/api-contract.md)。

## 文档入口

当前更可靠的文档入口：

- [doc/project-positioning-and-design-principles.md](doc/project-positioning-and-design-principles.md)：产品定位与设计原则。
- [doc/odd-frontend-comprehensive-design.md](doc/odd-frontend-comprehensive-design.md)：Workbench 交互和前端信息架构。
- [doc/api-contract.md](doc/api-contract.md)：API/runtime 合同。
- [packages/renderer/README.md](packages/renderer/README.md)：renderer 包、Storybook 与前端交付约定。
- [doc/BE-PR1-fixture-backed-api-server-skeleton-execution-plan.md](doc/BE-PR1-fixture-backed-api-server-skeleton-execution-plan.md)：fixture API server 基线。
- [doc/BE-PR2-scene-run-workflow-skeleton-execution-plan.md](doc/BE-PR2-scene-run-workflow-skeleton-execution-plan.md)：scene run workflow skeleton。
- [doc/BE-PR3-run-artifact-trace-read-surfaces-execution-plan.md](doc/BE-PR3-run-artifact-trace-read-surfaces-execution-plan.md)：run artifact / trace API 读面。
- [doc/PR25-backend-orchestration-integration-ui-execution-plan.md](doc/PR25-backend-orchestration-integration-ui-execution-plan.md)：Scene / Orchestrate 接入真实 HTTP run runtime。
- [doc/PR26-run-artifact-trace-inspector-execution-plan.md](doc/PR26-run-artifact-trace-inspector-execution-plan.md)：renderer artifact inspector / trace panel 接入。

## 当前边界

不要把当前仓库误读为已经完成的生产后端或全功能小说编辑器：

- fixture API server 是合同验证和前后端联调骨架，不是真实持久化后端。
- mock runtime 是 Storybook、测试和演示 fallback，不是产品数据来源终态。
- `events/stream` 尚未开放，当前运行事件消费方式是 REST polling/page contract。
- run artifact / trace 是产品 read surface，不是 raw workflow history、Temporal history 或 LLM token stream。
- Asset context policy / activation trace 是 read-only 解释层，不是 prompt editor、RAG、policy mutation 或真实 LLM context builder。
- 目前的重点仍是把 scope/lens/workbench/runtime/API 合同跑稳，再继续扩真实后端、auth、SSE、持久化和更深的编排引擎。
