# PR5 执行文档（基于 `codex/pr4-chapter-workbench` 实际代码）

## 这份文档的目的

这不是路线图回顾，而是基于当前 `codex/pr4-chapter-workbench` 分支已经落地的实际代码，为 AI agent 准备的一份可直接实施的 PR5 指令文档。

PR5 的任务，不是回头重做 PR4，也不是把 scene / chapter 两边一起大改，而是围绕一个很窄但很关键的目标推进：

**把 Chapter / Structure 到 Scene / Orchestrate | Draft 的显式 handoff 真正打通，同时补齐 scene 侧 navigator / fixture parity，并用 app-level smoke 固定 chapter → scene → chapter 的往返路径。**

---

## 一、先确认当前代码基线

当前分支里，PR4 主体其实已经完成，不应再回头重做。

### 1. chapter 五面 workbench 已经落地

当前 chapter scope 已经不再只是 scaffold：

- `ChapterOutlinerView.tsx` 已独立存在
- `ChapterAssemblyView.tsx` 已独立存在
- `ChapterStructureInspectorPane.tsx` 已独立存在
- `ChapterBottomDock.tsx` + `ChapterDockContainer.tsx` 已接进 shell
- `useChapterWorkbenchActivity.ts` 已记录 session-local activity
- `ChapterStructureWorkspace.tsx` 已把 navigator / stage / inspector / dock 全部接进 `WorkbenchShell`

所以 PR5 不要回头重做 chapter 的 stage / inspector / dock。

### 2. chapter route / query identity 约束已经成立，而且现在不该打破

当前 chapter 侧已经成立的关键约束是：

- `route.sceneId` 是 chapter 选中态唯一真源
- `route.view` 是 chapter stage 当前视图唯一真源
- `chapterQueryKeys.workspace(chapterId)` 只由 `chapterId` 决定
- `selectedSceneId` 只用于本地派生 workspace view-model，而不参与 query key

PR5 必须建立在这个约束上，不要为了 handoff 回头改 chapter query identity。

### 3. chapter 侧现在缺的不是“面板”，而是“跨 scope workflow”

当前 chapter surface 基本都只有：

- `onSelectScene(sceneId)`

但还没有真正的：

- `Open in Orchestrate`
- `Open in Draft`
- chapter → scene 的显式路由 helper

也就是说，PR4 证明了 chapter 内部同步；PR5 要证明的是 chapter 可以把当前结构判断平滑送进 scene 工作面。

### 4. scene 侧现在有一个真正的 PR5 blocker：navigator / fixture parity 不完整

当前 `App.tsx` 里的 scene navigator 仍然是硬编码：

- `scene-midnight-platform`
- `scene-warehouse-bridge`

但 chapter mock 数据已经暴露出更多 scene：

- `scene-concourse-delay`
- `scene-ticket-window`
- `scene-departure-bell`
- `scene-canal-watch`
- `scene-dawn-slip`

同时，scene mock 数据当前只真正定义了前两条 scene 记录。

这意味着：

**如果直接做 chapter → scene handoff，chapter 里大多数 scene 都无法在 scene scope 被完整打开。**

所以 PR5 的 0 号前置任务不是 UI 按钮，而是 scene parity。

### 5. 现有测试还没有覆盖真正的跨 scope 往返

当前测试已经很好地覆盖了：

- chapter 内部 route-driven sync
- deep-link 进入 chapter 后，view / selected scene 的恢复
- dock fallback 不留旧内容

但还没有一条真正的 app-level smoke 去固定：

- `chapter -> open scene orchestrate -> back -> 回到原 chapter view + sceneId`
- `chapter -> open scene draft -> back -> 回到原 chapter view + sceneId`

这正是 PR5 最值钱的新测试。

---

## 二、当前不足与修正指导

下面这些是当前分支里最值得修的点，也是 PR5 应该处理的内容。

### A. 先修 scene parity，再做 handoff

这是 PR5 的头号 blocker。

#### 现在的问题

- scene navigator 只认识两个 scene id
- scene fixture 也只完整提供两个 scene record
- chapter workbench 却已经暴露了更多可选 scene

#### 正确修法

至少做到下面两件事：

1. **补齐 scene fixture parity**
   - 让 chapter mock 数据里出现过的 scene，都有可被 `sceneClient` 打开的 scene record
   - 不要求每个新增 scene 都做到和现有两条 scene 一样复杂，但至少要有完整、合法的：
     - `workspace`
     - `setup`
     - `execution`
     - `prose`
     - `inspector`
     - `dock`

2. **去掉 `App.tsx` 里硬编码的 `sceneNavigatorIds`**
   - 不要继续把 scene navigator 绑死为两个 id
   - 优先改成“按当前 active scene 所属 chapter 派生 navigator items”
   - 实现方式可以是：
     - 推荐：给 scene 侧补一个很窄的 navigator helper / query
     - 可接受：先通过共享 mock helper 按 `chapterId` 派生 scene 列表

#### 这一步的目标

不是把 scene 导航系统重做一遍，而是保证：

**chapter 暴露出来的 scene，scene workbench 都能认、都能开、都能在 navigator 里高亮。**

### B. 不要用“scope toggle”冒充 handoff，要做显式 handoff helper

#### 现在的问题

当前 chapter 里的“切去 scene”只有：

- `replaceRoute({ scope: 'scene' })`

这不是 handoff，只是 scope toggle。它没有显式指定：

- 打开哪个 `sceneId`
- 用哪个 `lens`
- 进哪个 `tab`
- 是否清理 `beatId / proposalId / modal`

#### 正确修法

在 `ChapterStructureWorkspace.tsx` 里收一个显式 helper，统一 chapter → scene 路由写法。

推荐形态：

```ts
const openSceneFromChapter = (sceneId: string, lens: 'orchestrate' | 'draft') => {
  if (route.sceneId !== sceneId) {
    patchChapterRoute({ sceneId }, { replace: true })
  }

  replaceRoute({
    scope: 'scene',
    sceneId,
    lens,
    tab: lens === 'draft' ? 'prose' : 'execution',
    beatId: undefined,
    proposalId: undefined,
    modal: undefined,
  })
}
```

#### 这里的关键纪律

- `patchChapterRoute({ sceneId }, { replace: true })` 只用于把“当前 chapter 页面记录”更新成用户真正打开的那个 scene，避免 back 时回到错误的旧选中项
- `replaceRoute({ scope: 'scene', ... })` **不要**传 `{ replace: true }`，必须保留浏览器历史，才能让 `back` 回到 chapter
- `beatId / proposalId / modal` 必须显式清空，不能把上一个 scene 的局部状态泄漏到这次 handoff 里

### C. handoff 动作必须是 secondary action，不能破坏 chapter 的主点击

#### 现在的问题

当前 chapter 各 surface 的主点击都是“选中 scene”。这是对的，不该被 PR5 改坏。

#### 正确修法

在下面这些 surface 上新增“次级动作”：

- `ChapterBinderPane.tsx`
- `ChapterSequenceView.tsx`
- `ChapterOutlinerView.tsx`
- `ChapterAssemblyView.tsx`

建议统一新增：

- `onOpenScene?: (sceneId: string, lens: 'orchestrate' | 'draft') => void`

然后：

- 主点击继续只做 `onSelectScene(sceneId)`
- 次级按钮才做 `onOpenScene(sceneId, 'orchestrate')`
- 次级按钮才做 `onOpenScene(sceneId, 'draft')`

#### 交互纪律

- secondary action 必须 `stopPropagation()`，避免点“Open in Draft”时同时触发整张卡片的主点击
- 不要把 secondary action 做成过重的按钮墙
- Binder / Sequence / Outliner 可以用紧凑 action row
- Assembly 至少要在 `Current seam` 提供 handoff；相邻 scene 卡片也可以带上，但不要把 Assembly 做成操作面板

### D. 把顺手能收的小债一起收掉，但不要扩大范围

这几件小债，建议和 PR5 一起带走：

1. **重命名 `ChapterStructureStagePlaceholder.tsx`**
   - 改成 `ChapterStructureStage.tsx`
   - PR4 已经不是 placeholder 了，命名债该收

2. **去掉 view normalization 的重复逻辑**
   - `ChapterStructureWorkspace.tsx` 已经算了 `effectiveView`
   - stage 文件里不要再算一次
   - 让 stage 只做 switchboard，不再重复归一化

3. **Inspector header 不要继续显示 `chapterId`**
   - 当前 header description 更像内部实现标识
   - 改成 chapter title 或一行 chapter summary

这些是顺手 polish，不是 PR5 主目标，但都值得一起带走。

---

## 三、PR5 的唯一目标

**打通 chapter → scene 的显式 handoff，并保证 handoff 进入 scene 后，navigator / route / back restoration 都是正确的。**

更具体地说，PR5 完成后，用户应该能完成这条路径：

```text
打开 chapter
-> 在 binder / sequence / outliner / assembly 中选到某个 scene
-> 显式点 Open in Orchestrate 或 Open in Draft
-> 进入对应 scene workbench
-> scene navigator 正确认识并高亮当前 scene
-> 浏览器 back 返回 chapter
-> 原 chapter 的 view 与 selected scene 恢复正确
```

---

## 四、这一轮明确不做

以下内容不要混进 PR5：

- 不做 reorder / drag / inline edit
- 不做 chapter 写路径
- 不做 chapter orchestrate 主流程
- 不做 asset / knowledge / graph
- 不做 scene runtime 架构重写
- 不做 tabs / split / shell 大改
- 不做多 scope 同时驻留机制
- 不做 chapter query identity 重构

PR5 仍然是一个 **workflow milestone**，不是 mutation milestone，也不是 shell milestone。

---

## 五、必须遵守的硬约束

### 1. chapter query identity 完全不动

保持下面约束不变：

- `chapterQueryKeys.workspace(chapterId)` 只认 `chapterId`
- `selectedSceneId`、`view`、handoff 按钮都不能进入 chapter query key

### 2. chapter 选中态仍然只有一个真源

不要新增：

- `useState(selectedSceneId)`
- 本地 zustand selected scene store
- outliner / assembly 内部 active state 真源

统一规则仍然是：

- 选中态来源：`workspace.selectedSceneId`
- 选中变更来源：`patchChapterRoute({ sceneId })`

### 3. handoff 是 secondary action，不是主点击替换

- 主点击：继续选中 scene
- 次级动作：打开 scene workbench

不要为了 handoff 把 chapter 自己的浏览任务做坏。

### 4. route 恢复优先依赖浏览器历史，不做新状态容器

- chapter → scene 进入时必须 push 新历史记录
- 返回 chapter 依赖浏览器 back
- 不新增“跨 scope handoff store”
- 不新增“最近 chapter state store”

### 5. handoff helper 必须显式写满 scene 路由

至少显式指定：

- `sceneId`
- `lens`
- `tab`
- `beatId: undefined`
- `proposalId: undefined`
- `modal: undefined`

不要把 scene 旧局部态悄悄带过去。

### 6. scene parity 可以补数据层，但必须保持窄实现

允许为 scene navigator / fixture parity 增加很窄的只读 helper / query；
但不要把 PR5 扩成一整轮 scene 数据层重构。

---

## 六、建议的文件改动

## 6.1 必改

- `packages/renderer/src/App.tsx`
- `packages/renderer/src/mock/scene-fixtures.ts`
- `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
- `packages/renderer/src/features/chapter/components/ChapterBinderPane.tsx`
- `packages/renderer/src/features/chapter/components/ChapterSequenceView.tsx`
- `packages/renderer/src/features/chapter/components/ChapterOutlinerView.tsx`
- `packages/renderer/src/features/chapter/components/ChapterAssemblyView.tsx`
- `packages/renderer/src/features/chapter/components/ChapterStructureInspectorPane.tsx`
- `packages/renderer/src/App.test.tsx`

## 6.2 推荐修改

- `packages/renderer/src/features/chapter/components/ChapterStructureStagePlaceholder.tsx`
  -> `packages/renderer/src/features/chapter/components/ChapterStructureStage.tsx`

- chapter 相关组件测试：
  - `ChapterBinderPane.test.tsx`
  - `ChapterSequenceView.test.tsx`
  - `ChapterOutlinerView.test.tsx`
  - `ChapterAssemblyView.test.tsx`

## 6.3 推荐新增

- `packages/renderer/src/mock/scene-fixtures.parity.test.ts`

这个测试非常值钱，因为它能把“chapter 暴露的 scene 必须都能在 scene scope 打开”固定成机械约束。

---

## 七、分组件 / 分容器接线要求

## 7.1 `App.tsx`

### 要做的事

1. 删掉硬编码的 `sceneNavigatorIds`
2. 让 scene navigator 按当前 active scene 所属 chapter 派生
3. 保证 handoff 进入的任意 scene，都能在 scene navigator 中被正确渲染与高亮

### 实现建议

- 推荐引入一个很窄的 navigator helper / query
- `SceneWorkbench` 先拿到 active scene 的 `chapterId`
- 再按 `chapterId` 取该章下所有 scene navigator items

### 不要做

- 不要继续把 navigator id 列表写死在 `App.tsx`
- 不要为了这件事把 SceneWorkbench 大拆大改

## 7.2 `scene-fixtures.ts`

### 要做的事

补齐当前 chapter 数据里用到、但 scene mock 数据里还没有的 scene record。

### 最低要求

至少补齐：

- `scene-concourse-delay`
- `scene-ticket-window`
- `scene-departure-bell`
- `scene-canal-watch`
- `scene-dawn-slip`

### 允许的实现策略

- 新增一批“轻量但合法”的 scene fixture
- 重点先保证 workspace / setup / execution / prose / inspector / dock 都可读
- 文案可简化，但字段形状必须完整

### 不要做

- 不要为了这批 scene 把 scene 数据模型整体推翻重建

## 7.3 `ChapterStructureWorkspace.tsx`

### 要做的事

1. 新增统一的 `openSceneFromChapter(sceneId, lens)` helper
2. 把 helper 传给 binder / stage（进而传给 sequence / outliner / assembly）
3. 让 chapter mode rail 的“Scene”按钮也能打开当前 selected scene 的默认 orchestrate 页，而不是单纯 `replaceRoute({ scope: 'scene' })`

### mode rail 建议

- 若当前 chapter 有 `selectedSceneId`，则 scene 按钮应打开该 scene 的 orchestrate / execution
- 若没有 `selectedSceneId`，fallback 到 `workspace.scenes[0]?.id`

### 不要做

- 不要把 scene handoff helper 分散写在多个组件里

## 7.4 `ChapterBinderPane.tsx`

### 要做的事

每个 binder item 增加紧凑 secondary actions：

- `Open in Orchestrate`
- `Open in Draft`

### 交互纪律

- 整个 item 主点击仍然只做选中
- secondary action 点击必须阻止冒泡

## 7.5 `ChapterSequenceView.tsx`

### 要做的事

给每张 sequence card 增加 secondary actions：

- `Open in Orchestrate`
- `Open in Draft`

### 交互纪律

- 保持 sequence 仍是“章节扫描器”
- 不要把卡片底部做成一排重操作按钮
- action row 要轻，不抢 summary / purpose 信息

## 7.6 `ChapterOutlinerView.tsx`

### 要做的事

在高密度行里提供 secondary handoff 动作。

### 推荐方式

- 在行尾放紧凑文字按钮或小按钮
- 主体区域点击仍然是 `onSelectScene`
- action 点击才是 `onOpenScene`

### 不要做

- 不要让 outliner 退化成 sequence 卡片
- 不要为了 handoff 降低字段密度

## 7.7 `ChapterAssemblyView.tsx`

### 要做的事

至少在 `Current seam` 上提供：

- `Open in Orchestrate`
- `Open in Draft`

相邻 scene card 若版面允许，也可以一起加，但不是强制。

### 交互纪律

- Assembly 仍然主要负责承接判断，不是跳转控制台
- 当前 seam 的视觉焦点要继续明显强于相邻 scene

## 7.8 `ChapterStructureInspectorPane.tsx`

### 要做的事

顺手收掉 header 小债：

- title 继续跟随 selected scene brief
- description 改成 chapter title 或 chapter summary
- 不要继续直接显示 `chapterId`

### 不要做

- 不要在 inspector 里新增 handoff 主动作
- inspector 仍是支持判断区

## 7.9 `ChapterStructureStagePlaceholder.tsx` -> `ChapterStructureStage.tsx`

### 要做的事

- 去掉 placeholder 命名
- 不再重复 view normalization
- 只保留 stage switchboard 职责

---

## 八、测试补齐方案

PR5 最值钱的新增测试，不是 chapter 组件自身还能不能渲染，而是 **跨 scope workflow 是否连续**。

## 8.1 `scene-fixtures.parity.test.ts`

至少覆盖：

1. 收集 chapter mock 数据里全部 scene id
2. 构建 scene mock database
3. 断言这些 scene id 在 scene mock database 里全部存在

这条测试会直接防止“chapter 能点、scene 打不开”的回归。

## 8.2 组件测试补充

### Binder / Sequence / Outliner / Assembly

至少覆盖：

1. 主点击仍然调用 `onSelectScene`
2. `Open in Orchestrate` 调用 `onOpenScene(sceneId, 'orchestrate')`
3. `Open in Draft` 调用 `onOpenScene(sceneId, 'draft')`
4. secondary action 不会误触发主点击

## 8.3 `App.test.tsx` 增加真正的 app-level smoke

至少新增两条：

### Smoke A：chapter -> orchestrate -> back

```text
打开 chapter outliner（带 sceneId）
-> 点击某一行的 Open in Orchestrate
-> 断言 URL 为 scope=scene + 目标 sceneId + lens=orchestrate + tab=execution
-> 断言 scene navigator 已高亮目标 scene
-> history.back()
-> 断言回到原 chapter
-> 断言原 view=outliner
-> 断言 selected scene 恢复为刚才打开的目标 scene
```

### Smoke B：chapter -> draft -> back

```text
打开 chapter assembly（带 sceneId）
-> 点击 Current seam 的 Open in Draft
-> 断言 URL 为 scope=scene + 目标 sceneId + lens=draft + tab=prose
-> history.back()
-> 断言回到原 chapter
-> 断言原 view=assembly
-> 断言 selected scene 恢复正确
```

### 测试纪律

- 要真的走 app 级路由，不要只 mock 一个组件回调
- 要覆盖 `back`，因为这正是 PR5 的核心价值之一

---

## 九、实施顺序（给 AI 的执行顺序）

### Step 0
先补 scene parity：

- scene fixture 补齐 chapter 引用到的 scene
- 加一条 parity test 固定约束

### Step 1
处理 scene navigator：

- 去掉 `App.tsx` 里的硬编码 `sceneNavigatorIds`
- 改成按当前 scene 所属 chapter 派生 navigator items

### Step 2
在 `ChapterStructureWorkspace.tsx` 里实现统一 handoff helper：

- `openSceneFromChapter(sceneId, lens)`
- 显式写满 scene route
- 保留浏览器历史

### Step 3
给 chapter 四个 surface 接上 secondary handoff actions：

- binder
- sequence
- outliner
- assembly

### Step 4
收顺手的小债：

- stage rename
- 去掉重复 view normalization
- inspector header description 改成产品语义

### Step 5
补测试：

- parity test
- 组件 secondary-action 测试
- app-level smoke

---

## 十、完成后的验收标准

满足以下条件，PR5 就算完成：

1. chapter 当前暴露出来的 scene，都能从 chapter workbench 显式打开到 scene workbench。
2. 进入 scene 后，scene navigator 能正确认识并高亮当前 scene。
3. `Open in Orchestrate` 会进入：
   - `scope=scene`
   - `sceneId=目标 scene`
   - `lens=orchestrate`
   - `tab=execution`
4. `Open in Draft` 会进入：
   - `scope=scene`
   - `sceneId=目标 scene`
   - `lens=draft`
   - `tab=prose`
5. 浏览器 `back` 能恢复：
   - 原 chapter
   - 原 chapter view
   - 原 selected scene
6. chapter query identity 完全不变。
7. chapter 选中态仍然只由 `route.sceneId` 驱动。
8. PR5 不包含 reorder / mutation / knowledge / graph / shell 大改。

---

## 十一、PR5 结束时不要留下的债

以下情况都算“PR 做偏了”：

- chapter 里已经有 handoff 按钮，但打开大多数 scene 会报错
- scene navigator 仍然只认识两个硬编码 scene
- handoff 进入 scene 后，URL 没有显式写对 lens / tab
- handoff 后 `back` 回不去原 chapter view / sceneId
- 为了 handoff，新加了 chapter selected scene store
- 为了 handoff，改坏了 chapter query identity
- 为了 scene parity，把整个 scene 数据层重写了一轮

PR5 做完后，正确的项目状态应该是：

**chapter 已经不再是孤立结构台，而是可以把结构判断平滑送入 scene workbench；同时 scene 侧也足以承接 chapter 暴露出来的 scene 集合。**

---

## 十二、给 AI 的最终一句话指令

在当前 `codex/pr4-chapter-workbench` 分支已经完成 PR4 主体的前提下，只围绕 **scene parity、chapter → scene handoff、app-level roundtrip smoke、以及极少量命名/标题 polish** 做一轮窄而实的实现：

- 不重做 chapter 五面 workbench
- 不改 chapter query identity
- 先补齐 chapter 引用到的 scene fixture 与 navigator parity
- 再给 binder / sequence / outliner / assembly 接上 `Open in Orchestrate` / `Open in Draft`
- 用统一 handoff helper 显式写 scene route
- 用浏览器历史固定 chapter → scene → chapter 的恢复路径
- 补齐 parity test 与 app-level smoke
- 不提前做 PR6 以后的 mutation / knowledge / shell 扩建内容
