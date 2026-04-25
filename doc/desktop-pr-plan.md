# Desktop PR 计划（基于当前项目状态）

## 结论

当前项目适合做桌面端，但桌面端不应该变成一个新的产品分叉，也不应该把现有 Web Workbench 改造成 Electron-only 应用。

桌面端的正确定位是：

> **VS Code-style Electron Workbench Shell：Electron 负责本地壳子、项目目录、进程托管和原生集成；Renderer 继续保持 Web-first；API / Worker 独立进程运行；重任务不进入 Renderer。**

也就是说：

```text
apps/desktop
  Electron main / preload
  window lifecycle
  native menu
  project picker
  local API supervisor
  worker supervisor
  logs / diagnostics / packaging

packages/renderer
  现有 React / Vite Workbench
  继续保持 web-first
  不直接访问 fs / child_process / Node

packages/api
  fixture-backed API / future real API
  可由桌面端本地启动
  也可远程部署

packages/worker
  future orchestration worker / Temporal worker / model worker
  不跑在 renderer 里
```

桌面端的第一阶段目标不是“发布一个完整桌面产品”，而是把现在运行项目时需要手动开的服务，逐步收束成一个可安装、可启动、可诊断的本地 Workbench。

---

## 当前项目判断

当前项目已经不是早期三栏页面原型，而是一个围绕 `Book / Chapter / Scene / Asset` 与 `Structure / Orchestrate / Draft / Knowledge` 展开的 Narrative IDE / Workbench。前端已经长期采用五面结构：Mode Rail、Navigator、Main Stage、Inspector、Bottom Dock。

当前主线的重点仍应是文字剧情生成闭环与 API/backend 纵切，桌面端不应该抢走主线。Desktop PR 应该作为一条相对独立的基础设施线推进：

```text
主线：继续推进 PR29+ 的文字生成 / review / canon / prose / trace 闭环
桌面线：先做 Electron thin shell，再接本地 API supervisor，再接项目目录与 worker boundary
```

换句话说：

- **Desktop-PR1 可以现在开**，因为它只验证壳子，不改变主业务。
- **Desktop-PR2 应等 packages/api 的 health / runtime config 更稳定后推进**。
- **Worker / Temporal / LLM 不应该在桌面前两轮里一起塞进去**。

---

## 总体边界

### 1. Electron 不是产品后端

Electron main process 只管：

- BrowserWindow 生命周期
- native menu / tray / dock 基础集成
- preload bridge
- 本地 API / worker 子进程管理
- 项目目录选择
- logs / diagnostics
- packaging / updater

不要把 domain logic、run orchestration、artifact store、LLM 调度塞进 Electron main。

### 2. Renderer 必须继续 Web-first

`packages/renderer` 仍然应该能作为普通 Web app 构建和运行。桌面端只能通过极窄的 `window.narrativeDesktop` bridge 获得本地能力。

禁止：

```text
renderer -> fs
renderer -> child_process
renderer -> ipcRenderer raw access
renderer -> Electron shell raw access
renderer -> local path arbitrary read/write
```

允许：

```text
renderer -> window.narrativeDesktop.getRuntimeStatus()
renderer -> window.narrativeDesktop.selectProjectDirectory()
renderer -> window.narrativeDesktop.restartLocalApi()
renderer -> window.narrativeDesktop.openLogsDirectory()
renderer -> API_BASE_URL -> packages/api
```

### 3. API 走 HTTP，不走 Electron IPC

即便在桌面端，Renderer 也应继续通过 API contract 访问业务能力：

```text
renderer -> http://127.0.0.1:<port>/api/...
```

而不是：

```text
renderer -> ipc -> main -> domain service
```

这样可以保证：

- Web 版和 Desktop 版共享同一套 API contract
- API server 可以单独测试
- 后续真实 backend / remote API / local API 可以切换
- Electron main 不会变成业务泥潭

### 4. 单窗口优先

第一阶段只允许一个主 BrowserWindow。不要做多窗口、多 preview window、多 floating inspector。

Workbench 自己已经有 scope / lens / route / dock，不需要桌面端再发明窗口层级。

### 5. 重任务独立进程

未来以下东西都不能跑在 Renderer，也不应该跑在 Electron main：

- model gateway
- orchestration worker
- Temporal worker
- context builder
- artifact indexing
- embedding / retrieval
- Spatial Blackboard / Blender CLI
- export packaging

第一阶段可以先不启动这些 worker，但 PR 计划要从一开始保留进程边界。

---

# Desktop PR 路线

## Desktop-PR0：Desktop Architecture Decision Doc（推荐先做，极小）

### 目标

先把桌面端的架构边界写进仓库，避免后续 Electron PR 做歪。

### 新增文件

```text
doc/desktop-architecture.md
```

### 内容

- 为什么采用 Electron，而不是现在切 Tauri
- Electron 的职责边界
- Renderer Web-first 约束
- Local API supervisor 方案
- Worker process 边界
- preload bridge 安全规则
- desktop 与 web 共用 API contract 的原则
- 哪些能力明确不在桌面前两轮实现

### 验收标准

- 文档明确写出：Electron 只是 shell，不是 backend。
- 文档明确写出：Renderer 不直接访问 Node。
- 文档明确写出：业务能力仍走 `packages/api`。

### 不做

- 不写任何 Electron 代码
- 不改 renderer
- 不改 API

---

## Desktop-PR1：Electron Thin Shell

### 目标

让现有 renderer 可以作为桌面 App 打开，但不接本地 API、不接项目目录、不接 worker。

这一步只回答一个问题：

> 现有 Workbench 能不能被一个安全的 Electron shell 承载？

### 新增

```text
apps/desktop/package.json
apps/desktop/src/main/main.ts
apps/desktop/src/main/create-window.ts
apps/desktop/src/main/app-menu.ts
apps/desktop/src/preload/index.ts
apps/desktop/src/preload/desktop-api.ts
apps/desktop/src/shared/desktop-bridge-types.ts
apps/desktop/tsconfig.json
apps/desktop/vite.main.config.ts 或 electron-builder / forge 配置
```

### 修改

```text
pnpm-workspace.yaml
package.json scripts
README.md 或 doc/local-dev.md
```

### 实现范围

#### A. dev / prod 加载

dev 模式：

```text
Electron BrowserWindow -> Vite dev server URL
```

prod 模式：

```text
Electron BrowserWindow -> packages/renderer dist/index.html
```

#### B. 安全默认值

BrowserWindow 必须使用：

```ts
webPreferences: {
  preload,
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
}
```

#### C. preload bridge 第一版

只暴露极窄 API：

```ts
window.narrativeDesktop = {
  getAppVersion(): Promise<string>
  getPlatform(): Promise<'darwin' | 'win32' | 'linux'>
  getRuntimeMode(): Promise<'web' | 'desktop'>
}
```

不要暴露 `ipcRenderer`。

#### D. native menu 最小版

只做：

- App / About
- File / Quit
- View / Reload, Toggle DevTools（dev only）

不要做复杂菜单系统。

### 测试

- preload bridge contract test
- main process config unit test（可测 createWindow options）
- desktop dev 启动 smoke
- renderer web build 不受影响

### 验收标准

- `pnpm --filter @narrative-novel/desktop dev` 能打开桌面窗口。
- `pnpm --filter @narrative-novel/desktop build` 能构建桌面壳。
- renderer 中不能访问 Node 全局能力。
- Web 版启动方式不变。

### 不做

- 不启动本地 API
- 不选择项目目录
- 不接 worker
- 不做 packaging release
- 不做 auto update
- 不做本地数据库

---

## Desktop-PR2：Local API Supervisor + Runtime Config

### 目标

桌面端自动启动本地 `packages/api`，Renderer 不再要求用户手动开 API terminal。

这一步解决第一个真实痛点：

> 打开桌面端后，本地 fixture API 能被自动托管，Workbench 可以连接它。

### 新增

```text
apps/desktop/src/main/local-api-supervisor.ts
apps/desktop/src/main/port-utils.ts
apps/desktop/src/main/runtime-config.ts
apps/desktop/src/main/process-log-buffer.ts
apps/desktop/src/preload/runtime-api.ts
packages/renderer/src/app/runtime/runtime-config.ts
packages/renderer/src/app/runtime/useRuntimeConfig.ts
```

### 修改

```text
packages/renderer 的 API client baseUrl 获取方式
packages/api 增加或稳定 GET /api/health
apps/desktop main 启动流程
```

### 实现范围

#### A. local API spawn

Electron main 启动时：

1. 找一个空闲端口
2. spawn `packages/api`
3. 注入环境变量：

```text
PORT=<selectedPort>
NARRATIVE_RUNTIME=desktop-local
```

4. 轮询 `/api/health`
5. health ready 后把 `apiBaseUrl` 传给 Renderer

#### B. renderer runtime config

Renderer 的 API client 不应该写死 `/api`。

建议统一为：

```ts
RuntimeConfig {
  runtimeMode: 'web' | 'desktop-local'
  apiBaseUrl: string
}
```

Web 模式默认：

```text
/api
```

Desktop 模式默认：

```text
http://127.0.0.1:<port>/api
```

#### C. API 崩溃处理

第一版只需要：

- 显示 local API 状态：starting / ready / failed / stopped
- 提供 restartLocalApi bridge
- app quit 时关闭 API 子进程

#### D. 日志缓冲

Main process 记录 API stdout / stderr 最近 N 行，供后续 Runtime Panel 使用。

### 测试

- supervisor 启动 / ready / failed unit test
- runtime config mapper test
- renderer API client 使用 runtime baseUrl 的测试
- desktop smoke：打开 app 后能看到 API health ready

### 验收标准

- 用户只运行 desktop dev 命令即可打开 renderer + local API。
- Renderer 通过 runtime config 使用 local API。
- API 崩溃后桌面端能提示并允许 restart。
- Web 模式 API client 不受影响。

### 不做

- 不接真实 DB
- 不接真实 LLM
- 不接 Temporal
- 不接 worker
- 不实现 SSE stream
- 不做项目目录持久化

---

## Desktop-PR3：Project Picker + Local Project Directory Contract

### 目标

让桌面端拥有“打开一个本地叙事项目”的入口，类似 VS Code 的 Open Folder，但不要实现复杂 workspace 系统。

这一步把桌面端从“本地 API 启动器”推进到“本地项目工作台”。

### 新增

```text
apps/desktop/src/main/project-store.ts
apps/desktop/src/main/project-picker.ts
apps/desktop/src/main/recent-projects.ts
apps/desktop/src/preload/project-api.ts
packages/api/src/runtime/project-runtime.ts
packages/api/src/routes/project-runtime-routes.ts
packages/renderer/src/features/project 或 app/runtime/project hooks（视现有结构决定）
```

### 本地项目目录建议

第一版只定义最小结构：

```text
my-novel-project/
  narrative.project.json
  artifacts/
  logs/
  data/        # future db / sqlite / fixture data
```

`narrative.project.json` 第一版：

```json
{
  "schemaVersion": 1,
  "projectId": "project-local-demo",
  "title": "Local Narrative Project"
}
```

### 实现范围

#### A. Open Project

通过 Electron dialog 选择目录。

选择后：

- 如果目录有 `narrative.project.json`，读取 project metadata。
- 如果没有，提示是否初始化。
- 把 projectRoot 传给 local API。

#### B. Recent Projects

存储最近项目列表到 Electron app data，不写到 renderer localStorage。

#### C. API project runtime

Local API 暂时仍可以 fixture-backed，但要知道当前 project root：

```text
GET /api/projects/current
POST /api/projects/open
```

#### D. Renderer 顶部状态

只显示轻量 project status：

```text
Project: Local Narrative Project
Runtime: Desktop Local API
```

不要做 Dashboard 首页。

### 测试

- project metadata read / init test
- recent projects store test
- API current project route test
- desktop project open smoke

### 验收标准

- 桌面端能选择项目目录。
- 最近项目能恢复。
- Local API 能收到当前 project root。
- Renderer 能显示当前项目身份。

### 不做

- 不做真实迁移系统
- 不做多项目同时打开
- 不做云同步
- 不做权限/用户系统
- 不做复杂 project settings

---

## Desktop-PR4：Worker Boundary + Runtime Diagnostics

### 目标

为未来真实 orchestration worker / Temporal worker / model worker 建立进程边界和诊断面，但第一版仍可用 mock worker。

这一步不是实现真实 AI worker，而是建立桌面端的 worker process lifecycle。

### 新增

```text
apps/desktop/src/main/worker-supervisor.ts
apps/desktop/src/main/process-supervisor-types.ts
apps/desktop/src/preload/process-api.ts
packages/worker/package.json
packages/worker/src/index.ts
packages/worker/src/health.ts
packages/api/src/routes/runtime-process-routes.ts
packages/renderer/src/features/runtime/components/DesktopRuntimePanel.tsx
packages/renderer/src/features/runtime/hooks/useDesktopRuntimeStatus.ts
```

### 实现范围

#### A. worker supervisor

Electron main 可以按需启动 worker：

```text
worker status: disabled / starting / ready / failed / stopped
```

第一版 worker 只需要 health endpoint 或 IPC heartbeat，不做真实 run。

#### B. Runtime Diagnostics

在 renderer 里加一个轻量 diagnostics surface，可以挂在现有 Bottom Dock / Settings-like panel 中。

显示：

- Local API status
- Worker status
- API port
- current project
- last process error
- open logs directory
- restart API
- restart worker

#### C. 按需启动

Worker 不必随 app 启动自动启动。第一版可以：

- API 自动启动
- Worker 在用户进入 run/orchestrate 或点击 Start Worker 时启动

### 测试

- worker supervisor lifecycle tests
- runtime status API tests
- diagnostics panel component tests
- API/worker restart smoke

### 验收标准

- 桌面端能显示 API / Worker 运行状态。
- API 与 Worker 可以独立 restart。
- Worker 崩溃不拖垮 Renderer。
- Renderer 仍不直接访问 child_process。

### 不做

- 不做 Temporal
- 不做真实模型调用
- 不做真实 run execution
- 不做 token stream
- 不做复杂 process explorer

---

## Desktop-PR5：Safe File / Artifact Integration

### 目标

给桌面端补最小本地文件能力，但仍保持 Renderer 不直接读写文件。

这一步服务后续 artifact / logs / export preview，而不是做 full publish。

### 新增

```text
apps/desktop/src/main/file-ops.ts
apps/desktop/src/preload/file-api.ts
packages/api/src/routes/artifact-file-routes.ts
packages/renderer/src/features/artifact/components/OpenArtifactLocationButton.tsx
```

### 实现范围

允许的本地能力：

- open logs directory
- reveal artifact file in folder
- save exported preview to selected path（如果 export preview 已有）
- open external URL safely

严格限制：

- 只能操作当前 project root 或 app logs 下的文件
- 任意路径读写必须通过 dialog 显式授权
- 不暴露 raw path traversal 给 renderer

### 测试

- path guard tests
- open/reveal bridge contract tests
- artifact path mapping tests

### 验收标准

- 用户可以打开 logs / artifact 所在目录。
- Renderer 不能任意读写本地文件。
- 本地路径不会混入 Web 模式逻辑。

### 不做

- 不做 PDF / EPUB / DOCX 真实导出
- 不做文件 watcher
- 不做全局搜索索引
- 不做插件读写文件

---

## Desktop-PR6：Packaging Foundation

### 目标

让桌面端可以被打包成可安装应用，但不追求生产级发布系统一次到位。

### 新增 / 修改

```text
apps/desktop/electron-builder.yml 或 forge config
apps/desktop/assets/icon.icns
apps/desktop/assets/icon.ico
apps/desktop/assets/icon.png
.github/workflows/desktop-build.yml（可选）
doc/desktop-release.md
```

### 实现范围

- macOS / Windows / Linux 基础打包
- app icon
- app name / version
- build artifacts 输出
- logs directory 规范
- crash report placeholder
- auto update 只预留，不实现真实发布通道

### 测试

- package smoke
- app version smoke
- prod renderer loading smoke
- local API path resolution in packaged app

### 验收标准

- 能生成本地安装包或可执行 bundle。
- packaged app 能加载 renderer。
- packaged app 能启动 local API。
- logs 可定位。

### 不做

- 不做真实 auto update
- 不做 code signing 全流程
- 不做 app store 发布
- 不做 production telemetry

---

## Desktop-PR7：Credential Store / Model Binding Preparation（后置）

### 目标

为本地模型 API key / provider config 做安全存储准备。

这一步应放在真实 backend / model gateway 更明确之后，不建议太早做。

### 实现范围

- 使用系统 keychain / safe storage 保存 provider credentials
- Renderer 只看到 provider 是否 configured，不看到完整 secret
- API / worker 通过受控路径读取 credential
- 支持 clear credential

### 不做

- 不做 provider marketplace
- 不做 prompt preset UI
- 不做复杂多账户系统
- 不做云同步 secret

---

# 推荐执行顺序

## 现在可以立刻做

```text
Desktop-PR0：Desktop Architecture Decision Doc
Desktop-PR1：Electron Thin Shell
```

它们不会影响当前主线，也不会强依赖真实 backend。

## API contract 稳定后做

```text
Desktop-PR2：Local API Supervisor + Runtime Config
Desktop-PR3：Project Picker + Local Project Directory Contract
```

这两步会明显改善本地运行体验。

## 真实 run / worker 纵切开始后做

```text
Desktop-PR4：Worker Boundary + Runtime Diagnostics
Desktop-PR5：Safe File / Artifact Integration
```

## 准备给别人试用时做

```text
Desktop-PR6：Packaging Foundation
Desktop-PR7：Credential Store / Model Binding Preparation
```

---

# 与主线 PR 的关系

桌面线不应取代主线。建议并行关系如下：

```text
主线 PR29–PR31：文字剧情生成 / review / canon / prose / trace 闭环
Desktop-PR1：可并行，几乎无业务依赖
Desktop-PR2：依赖 packages/api health / runtime config 稳定
Desktop-PR3：依赖 project runtime contract
Desktop-PR4：依赖 worker / run backend 开始成形
Desktop-PR6：等桌面形态稳定后再做
```

如果资源有限，只做一个桌面 PR，优先做：

> **Desktop-PR1：Electron Thin Shell。**

如果要解决“运行麻烦”，紧接着做：

> **Desktop-PR2：Local API Supervisor + Runtime Config。**

---

# 关键不做项总表

桌面第一阶段不要做：

- 不做 Electron monolith
- 不把 API 塞进 main process
- 不让 Renderer 访问 Node / fs / child_process
- 不做多窗口系统
- 不做插件系统
- 不做真实 LLM / Temporal / workflow engine
- 不做 full publish / export
- 不做复杂 settings center
- 不做 app store / auto update 全流程
- 不做 Tauri 迁移实验
- 不做全局 rail 重构

---

# 完成标志

桌面第一阶段完成可以定义为：

```text
用户可以安装 / 打开桌面 App
-> 选择或恢复本地项目
-> 桌面端自动启动 local API
-> Renderer 连接 local API
-> API / Worker 状态可见
-> artifacts / logs 有安全本地入口
-> Renderer 仍然可以作为 Web app 独立运行
```

满足这几点后，桌面端才算真正服务了项目，而不是只是把网页包了一层壳。

---

# 给 AI agent 的最终执行指令

在当前项目已经拥有 renderer / API contract / workbench 主体的前提下，不要做一个巨型 Electron 重构。先只围绕 Desktop Thin Shell 与 Local Runtime Boundary 做窄 PR：

1. 先写 `doc/desktop-architecture.md` 固定 Electron shell / Web renderer / API process / worker process 的边界。
2. 新增 `apps/desktop`，让 Electron 以安全默认值加载现有 renderer。
3. 保持 `packages/renderer` Web-first，不允许 renderer 直接访问 Node。
4. 再通过 Local API Supervisor 自动启动 `packages/api`，用 runtime config 把 `apiBaseUrl` 注入 renderer。
5. 后续再接 project picker、worker supervisor、diagnostics、packaging。
6. 不提前做 Temporal、真实 LLM、真实 DB、plugin system、multi-window、publish/export。
7. 用测试固定 dev/prod loading、preload contract、API supervisor lifecycle、Web renderer 不受影响这几条硬约束。
