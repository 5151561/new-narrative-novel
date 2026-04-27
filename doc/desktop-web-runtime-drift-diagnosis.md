# Desktop 与 Web 运行差异问题诊断

日期：2026-04-27

## 结论

这次出现的现象不是单一 bug，而是三类问题叠加：

1. Web 与 Electron 默认并不走同一套 runtime。
2. Electron 的 `desktop-local` API fixture 与 renderer/mock fixture 已经漂移。
3. `desktop:dev` 在切到本地 `file://` 加载后，build 产物的资源路径一度不兼容 Electron。

因此用户会观察到：

- 网页部署方式基本正常。
- Electron 更容易出现 `场景不可用`。
- Electron 上更容易暴露 UI 状态错位、空白态、局部布局异常。

## 现象

用户反馈：

- `pnpm desktop:dev` 经常看到旧页面。
- 修成每次重建后，Electron 一度直接白屏。
- 白屏修复后，Electron 中多个 scene 打开时显示 `场景不可用` / `Scene ... was not found.`。
- 相同对象在网页里正常，但在 Electron 里异常。

本次实际复现到的代表性错误：

- `scene-concourse-delay`
- `scene-ticket-window`
- `scene-departure-bell`

在 Electron 中，左侧 navigator 能列出这些 scene，但主舞台、检查器、底部面板会返回：

```text
Scene scene-concourse-delay was not found.
```

## 根因拆解

### 1. Web 与 Electron 默认 runtime 不一致

Web 默认逻辑：

- `packages/renderer/src/app/runtime/runtime-config.ts`
- 当没有 `VITE_NARRATIVE_API_BASE_URL` 时，renderer 会退回 web/mock runtime。

Electron 默认逻辑：

- `window.narrativeDesktop.getRuntimeConfig()`
- `runtimeMode = desktop-local`
- `apiBaseUrl = http://127.0.0.1:<port>/api`
- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx` 会优先创建 API runtime

这意味着：

- Web 正常，不代表 Electron 的 API fixture 正常。
- Electron 更像是在走“合同验证模式”。
- 只要 API fixture 比 renderer mock 落后，Electron 就会先暴露出问题。

### 2. desktop-local API fixture 与 renderer/mock fixture 漂移

这次最核心的功能性问题就在这里。

Electron 左侧 scene navigator 使用的数据链里，已经存在这些 scene：

- `scene-concourse-delay`
- `scene-ticket-window`
- `scene-departure-bell`

但 `packages/api/src/repositories/fixture-data.ts` 里的 `createSceneRecords()` 最初只完整覆盖了较旧的一组 scene fixture，导致：

- chapter 结构里能引用这些 scene
- scene workspace 路由却找不到这些 scene

直接结果：

- `/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/structure` 能列出 scene
- `/api/projects/book-signal-arc/scenes/scene-concourse-delay/workspace` 返回 `404 SCENE_NOT_FOUND`

所以 Electron 表现成：

- 左边能点
- 中间打不开
- 右侧和底部一起报不可用

这不是布局问题先发生，而是数据集先断裂。

### 3. `file://` 加载下的资源路径不兼容

在把 `desktop:dev` 改成“每次 fresh build renderer dist 再启动 Electron”之后，Electron 加载的是：

```text
file:///.../packages/renderer/dist/index.html
```

而 Vite build 产物最初生成的是：

```html
<script src="/assets/...">
<link href="/assets/...">
```

这类绝对路径在 `file://` 场景下会直接找错根目录，结果就是：

- 页面白屏
- HTML 壳子在
- JS/CSS 没有成功加载

## 本次修复内容

### 修复 A：`desktop:dev` 默认每次重建最新 renderer

修改文件：

- `scripts/desktop-dev.mjs`
- `scripts/desktop-dev-utils.mjs`
- `scripts/desktop-dev-utils.test.mjs`

当前行为：

- `pnpm desktop:dev` 默认会先删除 `packages/renderer/dist`
- 再执行 renderer 产物重建
- 再构建 desktop main/preload
- 最后启动 Electron

同时保留一个显式开关：

```bash
NARRATIVE_DESKTOP_LIVE_RENDERER=1 pnpm desktop:dev
```

用于回到 live renderer dev server 路径。

### 修复 B：renderer build 产物改成 Electron 可加载的相对资源路径

修改文件：

- `packages/renderer/vite.config.ts`
- `packages/renderer/vite-base.ts`
- `packages/renderer/vite-base.test.ts`

当前行为：

- dev server 仍使用 `/`
- build 产物改用 `./assets/...`

这样 `file:///.../dist/index.html` 能正确加载 JS/CSS，不再白屏。

### 修复 C：补齐 desktop-local API 中缺失的轻量 scene fixture

修改文件：

- `packages/api/src/repositories/fixture-data.ts`
- `packages/api/src/createServer.read-surfaces.test.ts`
- `packages/api/src/createServer.book-draft-live-assembly.test.ts`

新增 / 补齐的 scene：

- `scene-concourse-delay`
- `scene-ticket-window`
- `scene-departure-bell`

修复目标不是把它们都变成“已成稿场景”，而是：

- 在 scene scope 中可正常打开 workspace/setup/execution/inspector/dock
- 同时在 book draft assembly 中仍可按当前产品契约视为 gap 或缺稿场景

也就是说：

- `scene scope` 可读
- `draft assembly` 语义不被误改

这是本次修复里非常重要的边界。

### 修复 D：清理旧 Electron / 旧 local API 进程干扰

调试过程中还发现一个运行态问题：

- 同时存在旧 Electron + 旧 local API
- 也存在新 Electron + 新 local API

导致表面上“代码已经修了”，但桌面窗口仍显示旧错误状态。

最终需要显式清掉旧进程，只保留新的 desktop dev 进程，才能让窗口真正切到最新 local API fixture。

## 本次验证证据

代码级验证：

- `pnpm --filter @narrative-novel/renderer exec vitest run vite-base.test.ts`
- `node --test scripts/desktop-dev-utils.test.mjs`
- `pnpm --filter @narrative-novel/api test`
- `pnpm --filter @narrative-novel/desktop test`

运行级验证：

- `pnpm desktop:dev`

结构化界面验证：

- Electron 窗口成功从白屏恢复为 workbench
- `scene-concourse-delay` 已能在主舞台打开
- 检查器、底部面板不再显示 `Scene ... was not found.`

本次通过 `Computer Use` 观察到的关键变化：

- 旧状态：左边能列 scene，中间/右边/底部全部 `不可用`
- 新状态：`Concourse Delay` 打开后主舞台有执行视图、检查器有上下文、底部面板有事件内容

## 为什么网页仍然“看起来更正常”

因为网页默认常常走的是 renderer/mock runtime，而 Electron 强制走 desktop-local API runtime。

这意味着 Electron 本质上更接近“产品合同验证面”，会更早暴露下面这些问题：

- scene fixture 是否齐全
- route 与数据 id 是否一致
- read model 是否真可读
- prose / trace / dock 是否真的有合同返回
- Inspector / Dock 是否依赖 API 数据而不是本地硬编码

所以不能把“网页没问题”直接等同于“桌面端没问题”。

更准确地说：

- Web 当前更像展示面
- Electron 当前更像合同联调面

## 为什么 Electron 更容易暴露 UI bug

这次的 UI bug 不是单纯 CSS 问题，而是 runtime 差异放大出来的结果。

当 desktop-local API 返回：

- `404`
- 缺失 prose
- 缺失 trace
- 缺失 scene fixture

工作台就会进入更多真实空态 / 错态 / 半可用态，这些态在 web/mock 下可能根本没出现过。

因此 Electron 更容易暴露：

- 空白态布局
- Inspector / Dock 对错误态的适配问题
- route 已切换但 panel 数据缺失的状态错位
- 某些 tab 在“无 prose draft”时的行为不一致

## 当前状态

当前已修复：

- `desktop:dev` 不再白屏
- 默认每次运行都会 fresh build 最新 renderer
- `scene-concourse-delay`
- `scene-ticket-window`
- `scene-departure-bell`

这些 scene 在 Electron 中不再因为 `SCENE_NOT_FOUND` 而打不开主舞台

当前仍成立的事实：

- Web 与 Electron 仍然不是同一个 runtime 来源
- renderer/mock 与 desktop-local API fixture 仍然可能继续漂移
- 只要 fixture 不统一，Electron 以后仍可能比网页更早暴露问题

## 后续建议

### 短期建议

- 继续把 chapter/navigator 里出现的对象，与 API fixture 中可读的对象做成强约束测试
- 任何新加 scene/chapter/book fixture 时，同时更新 renderer/mock 与 API fixture
- 保持 Electron 作为“真实合同验证面”使用，不要只看 web

### 中期建议

- 抽一套共享 scene fixture seed
- renderer/mock 与 API fixture 从同一份 seed 派生
- 避免两边手写两套 scene 数据

### 长期建议

在开发模式里明确区分两种运行方式：

1. `web/mock` 展示模式
2. `desktop-local API` 合同模式

并把它写进启动文档和命令约定，让使用者明确知道自己当前验证的是哪一层。

## 相关文件

这次问题直接相关的文件：

- `packages/renderer/src/app/runtime/runtime-config.ts`
- `packages/renderer/src/app/project-runtime/ProjectRuntimeProvider.tsx`
- `packages/renderer/vite.config.ts`
- `packages/renderer/vite-base.ts`
- `scripts/desktop-dev.mjs`
- `scripts/desktop-dev-utils.mjs`
- `packages/api/src/repositories/fixture-data.ts`
- `packages/api/src/createServer.read-surfaces.test.ts`
- `packages/api/src/createServer.book-draft-live-assembly.test.ts`

## 一句话总结

这次不是“Electron 比网页差”，而是 Electron 走的就是更真实、更严格的那条 runtime 路径；一旦 renderer/mock 与 API fixture 漂移，Electron 就会率先把这些产品合同问题暴露出来。
