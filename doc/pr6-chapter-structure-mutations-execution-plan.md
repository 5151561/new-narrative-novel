# PR6 Execution Plan — Chapter Structure Mutations

## 这份文档的目的

这不是路线图回顾，也不是下一阶段的大而全 wishlist。

这是一份**基于 `codex/pr5-chapter-scene-handoff` 当前实际代码状态**整理出来的、可以直接交给 AI agent 执行的 PR6 指令文档。

PR6 的任务，不是继续扩 scope，也不是提前做 Chapter Draft / Asset / Book，而是围绕一个很窄但很关键的目标推进：

**把 Chapter / Structure 从“能看、能切 view、能 handoff 到 Scene”的 read-heavy workbench，推进到“能直接改结构”的 write-light workbench。**

---

## 一、先确认当前代码基线

当前分支里，PR5 主体已经完成，不应再回头重做。

### 1. chapter 五面 workbench 已经成立

当前 `ChapterStructureWorkspace.tsx` 已经把：

- `ChapterBinderPane`
- `ChapterStructureStage`
- `ChapterStructureInspectorPane`
- `ChapterDockContainer`

全部接进 `WorkbenchShell`，并且 chapter → scene 的显式 `openSceneFromChapter(...)` helper 也已经存在。

所以 PR6 不要回头重做：

- chapter handoff
- chapter dock
- inspector 收敛
- stage switchboard

### 2. chapter route / query identity 约束已经成立，而且现在不该打破

当前 `useChapterStructureWorkspaceQuery(...)` 的关键约束仍然是：

- query key 只认 `chapterId`
- `selectedSceneId` 只在 hook 内用于派生 localized workspace view-model
- 切换 `sceneId` 不 refetch chapter 数据

PR6 必须建立在这个约束上。

### 3. chapter route 仍然只是 structure scope，不应该在 PR6 扩路由模型

当前 `workbench-route.ts` 里：

- `WorkbenchScope = 'scene' | 'chapter'`
- `ChapterRouteState.lens = 'structure'`
- `ChapterRouteState.view = 'sequence' | 'outliner' | 'assembly'`

所以 PR6 不应该趁机引入：

- chapter draft lens
- chapter knowledge lens
- chapter mutation mode route
- 新的 route 参数来承载编辑状态

### 4. chapter 组件表面已经有 handoff 次级动作，不该被 PR6 改坏

当前：

- `ChapterBinderPane`
- `ChapterOutlinerView`
- `ChapterAssemblyView`
- （以及 stage 内的 sequence surface）

都已经支持 `onOpenScene(sceneId, 'orchestrate' | 'draft')` 这类次级动作。

PR6 必须保留这些动作的 secondary-action 地位：

- 主点击仍然是 chapter 内部的浏览 / 选中
- handoff 仍然是次级动作

### 5. chapter client 目前仍是只读 client，真正缺的是写路径

当前 `ChapterClient` 只暴露：

- `getChapterStructureWorkspace(...)`

也就是说，PR5 之后 chapter 的短板已经非常明确：

**不是“能不能看”，而是“能不能改”。**

这正是 PR6 应该补的洞。

---

## 二、PR6 的唯一目标

**让 Chapter / Structure 拥有第一条窄而真实的写路径。**

这一轮完成后，用户应该能在 chapter workbench 里完成两类动作：

### A. 显式 reorder

用户可以直接在 chapter 中调整 scene 顺序，而不是只观察顺序。

### B. 窄范围 structure patch

用户可以直接修改当前 selected scene 的少量结构字段，而不是只能看静态字段。

一句话说：

**PR6 要把 chapter 从“结构审视台”推进到“轻量结构编排台”。**

---

## 三、PR6 的范围必须收窄成这两个 mutation

为了避免 PR6 失控，本轮只做下面两类 mutation：

## 3.1 Scene reorder

这是 PR6 的第一主线。

### 为什么先做 reorder

因为 chapter / structure 的第一事实，本来就是：

- scene 顺序
- scene 相邻关系
- 章节节奏
- assembly 压力

如果 chapter 还不能直接改顺序，那么当前三种视图虽然能看，但仍然没有形成真正的结构工作面。

### 本轮只做什么样的 reorder

只做：

- `Move earlier`
- `Move later`

也就是显式、离散、可预测的 reorder。

### 本轮明确不做什么样的 reorder

不做：

- drag and drop
- multi-select reorder
- send to top / send to bottom
- cross-chapter move
- complex undo/redo stack

PR6 的 reorder 必须是：

**小、稳、确定。**

---

## 3.2 Selected-scene structure patch

这是 PR6 的第二主线。

### 为什么要补一个窄 patch，而不是只做 reorder

如果 PR6 只做 reorder，那 chapter 仍然没有建立起“字段级写路径”。

而 Chapter / Structure 未来一定会需要结构字段 patch：

- purpose
- conflict
- reveal
- location
- POV
- summary

所以 PR6 应至少补一条**很窄但是真的 patch path**，来证明：

- chapter client 不再只读
- query cache 不再只承载 read
- chapter workbench 的各表面可以跟随 mutation 同步刷新

### 本轮 patch 只允许改哪些字段

第一版只允许 patch：

- `summary`
- `purpose`
- `pov`
- `location`
- `conflict`
- `reveal`

### 本轮 patch 明确不改哪些字段

不改：

- `id`
- `order`（由 reorder 单独处理）
- `statusLabel`
- `proseStatusLabel`
- `runStatusLabel`
- `lastRunLabel`
- chapter-level `problemsSummary`
- chapter-level `assemblyHints`

也就是说：

**PR6 的 patch 只碰 scene 的结构字段，不碰运行态，不碰章节级策展摘要。**

---

## 四、这轮明确不做的事

以下内容不要混进 PR6：

- 不做 chapter draft lens
- 不做 chapter knowledge lens
- 不做 asset / knowledge / graph
- 不做 book scope
- 不做 chapter AI orchestration
- 不做 scene 侧 mutation
- 不做 full manuscript / publish
- 不做 drag-and-drop reorder
- 不做 branch / compare
- 不做全局 undo / redo 系统
- 不做多人协作 / comment 系统
- 不自动重算 `problemsSummary` / `assemblyHints`

PR6 仍然只是：

**Chapter Structure Mutations 的第一里程碑。**

---

## 五、必须遵守的硬约束

## 5.1 `route.sceneId` 仍然是 chapter 选中态唯一真源

不要新增：

- `useState(selectedSceneId)` 作为第二真源
- chapter 局部 selected store
- binder / outliner / assembly 各自的 active state 真源

统一规则仍然是：

- 当前选中 scene 来源：`route.sceneId`
- `workspace.selectedSceneId` 只是派生结果
- reorder / patch 成功后，选中 scene 仍由 route 控制

### 允许的本地 state

允许存在：

- outliner 行内 edit draft
- “当前是否正在保存”之类的局部 UI 状态

但它们必须满足：

- 只服务编辑过程
- 不拥有对象身份
- 不替代 route selection

---

## 5.2 chapter query key 仍然只能认 `chapterId`

保持下面约束不变：

- `chapterQueryKeys.workspace(chapterId)` 只由 `chapterId` 决定
- `sceneId`
- `view`
- `editingSceneId`
- `draft form state`
- `mutation pending`

都不能进入 query key。

PR6 可以新增 mutation hooks，但不能改 query identity。

---

## 5.3 chapter route 结构完全不变

不要在 PR6 引入：

- `mode=edit`
- `editingSceneId`
- `draftSection`
- `mutationIntent`

PR6 的编辑过程必须是**局部 UI 状态**，而不是 route 状态。

---

## 5.4 handoff 仍然保留，不被 mutation 挤掉

当前 chapter surface 已经有：

- `Open in Orchestrate`
- `Open in Draft`

PR6 必须继续保留它们。

不要为了给 reorder / patch 腾位置而：

- 删除 handoff 动作
- 把 handoff 藏得过深
- 把主点击改成 handoff

正确纪律仍然是：

- chapter 主点击 = chapter 内部浏览 / 选中 / 比较
- handoff = 次级动作
- mutation = chapter 内部的结构改动动作

---

## 5.5 Binder 是 reorder 主入口；Outliner 是 patch 主入口

为了不让 PR6 的交互失控，本轮把 mutation 入口定死：

### Binder

负责：

- reorder
- 继续保留 open-in-scene 次级动作

### Outliner

负责：

- selected scene 的结构字段 patch

### Sequence / Assembly

这轮仍保持**读优先**：

- 继续承接扫描、比较、assembly 判断
- 不额外塞 reorder / edit affordance

这样可以避免 chapter 各 surface 同时变成“操作墙”。

---

## 5.6 `problemsSummary` / `assemblyHints` 仍视为策展型 read model

这两块当前更像：

- curator-authored summary
- static read model annotation

PR6 不要因为 scene 字段可编辑，就试图自动重算它们。

本轮允许发生的情况是：

- scene 的 `purpose / reveal / summary` 变了
- sequence / outliner / assembly / inspector brief 跟着变
- 但 `problemsSummary` / `assemblyHints` 仍保持原 mock 设定

这是可接受的。

不要把 PR6 扩成“结构编辑 + 智能重算”的双重工程。

---

## 5.7 mock database 必须拥有 reset 能力

PR6 一旦引入 mutation，当前纯常量式 mock 数据就不够了。

必须新增：

- 可写的 in-memory chapter db
- reset helper

否则：

- 测试之间会互相污染
- story / test 会出现跨用例脏状态

这是 PR6 的基础设施，不是可选项。

---

## 六、建议的数据层改法

## 6.1 不要把 mutation 逻辑写散在组件里

PR6 应该先补一层**纯函数 mutation helper**，再让 mock db 和 react-query mutation 复用这层逻辑。

推荐新增：

- `packages/renderer/src/features/chapter/api/chapter-record-mutations.ts`

建议承载：

- `reorderChapterRecordScenes(record, sceneId, targetIndex)`
- `patchChapterRecordScene(record, sceneId, patch, locale)`
- `normalizeSceneOrders(record)`
- `mergeLocalizedText(...)`

### 为什么要先有这一层

因为同一套 mutation 逻辑后面至少会被 3 处使用：

1. mock db 的真实写入
2. react-query cache 的 optimistic update
3. 单元测试

如果直接把逻辑散落在：

- client
- hook
- 组件

PR6 很容易写完就重复三套 reorder / patch 逻辑。

---

## 6.2 chapter client 从只读升级成 read/write client

当前 `ChapterClient` 只有：

- `getChapterStructureWorkspace(...)`

PR6 建议升级成：

- `getChapterStructureWorkspace(...)`
- `reorderChapterScene(...)`
- `updateChapterSceneStructure(...)`

### 推荐 input 形态

```ts
interface ReorderChapterSceneInput {
  chapterId: string
  sceneId: string
  targetIndex: number
}

interface UpdateChapterSceneStructureInput {
  chapterId: string
  sceneId: string
  locale: 'en' | 'zh-CN'
  patch: {
    summary: string
    purpose: string
    pov: string
    location: string
    conflict: string
    reveal: string
  }
}
```

### 为什么 reorder 用 `targetIndex`，而不是 direction

因为：

- UI 可以继续用 `up / down`
- 但 client 层应该尽量表达“目标顺序”而不是“按钮方向”
- 以后若要扩到 `send to top`，也不需要推翻 client contract

UI 可以在容器层把：

- `move earlier`
- `move later`

换算成 `targetIndex`。

---

## 6.3 patch 必须是 locale-aware patch

因为当前 mock 数据本身就是双语结构，不是单字符串。

所以 PR6 里，结构字段 patch 不应该粗暴覆盖整份 `LocalizedText`，而应该：

- 只更新当前 locale 对应的字符串
- 保留另一个 locale 原值

也就是说：

- 在 `zh-CN` 编辑，更新中文值，英文保留
- 在 `en` 编辑，更新英文值，中文保留

### 这件事为什么重要

否则 PR6 会很容易把双语 mock 数据直接写坏。

---

## 6.4 mock db 改造成“种子 + 可变实例 + reset”

推荐把当前：

- `mockChapterRecords`

拆成：

- `mockChapterRecordSeeds`
- `mutableMockChapterRecords`
- `resetMockChapterDb()`

### 推荐做法

```ts
const mockChapterRecordSeeds = { ... }
let mutableMockChapterRecords = structuredClone(mockChapterRecordSeeds)

export function resetMockChapterDb() {
  mutableMockChapterRecords = structuredClone(mockChapterRecordSeeds)
}
```

然后：

- `getMockChapterRecordById()` 从 mutable db 读
- `reorderMockChapterScene(...)` / `updateMockChapterScene(...)` 写 mutable db

### 必须注意

client 返回值仍要 clone。

不要把 mutable db 的引用直接泄漏给 query cache 或组件。

---

## 七、建议的 hook 设计

## 7.1 新增 reorder mutation hook

推荐新增：

- `packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.ts`

### 职责

- 调用 `chapterClient.reorderChapterScene(...)`
- 对 `chapterQueryKeys.workspace(chapterId)` 做 optimistic update
- 失败时 rollback
- 成功 / settled 后 invalidate 同一个 chapter key

### 推荐模式

标准 `useMutation`：

- `onMutate`
- `onError`
- `onSettled`

### 为什么还要 invalidate

虽然 mock db 是内存写入、optimistic update 也能成功，但 settled 后重新对同一个 key invalidate 一次，能保证：

- optimistic derivation 和真实 db 不漂移
- 后续 client 层微调时，PR6 不会变成脆弱实现

---

## 7.2 新增 patch mutation hook

推荐新增：

- `packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.ts`

### 职责

- 调用 `chapterClient.updateChapterSceneStructure(...)`
- 对同一个 chapter workspace key 做 optimistic patch
- rollback / invalidate 行为与 reorder 一致

### 重要纪律

这个 hook patch 的是 **raw chapter record**，不是 localized workspace view-model。

也就是说，optimistic update 时也应 patch query cache 中的 record 数据，再让 `useChapterStructureWorkspaceQuery(...)` 自己去派生 localized workspace。

不要绕过 read hook，直接 patch UI view-model。

---

## 八、组件职责改法

## 8.1 `ChapterBinderPane.tsx`

这是 PR6 的 reorder 主入口。

### 要做的事

每个 scene item 增加一组紧凑 reorder actions：

- `Move earlier`
- `Move later`

### 建议规则

- 第一项禁用 `Move earlier`
- 最后一项禁用 `Move later`
- 点击 reorder 必须 `stopPropagation()`
- reorder 不改变 `sceneId`
- reorder 完成后，当前 selected scene 仍保持选中

### 继续保留

保留当前已有的：

- 主点击选中 scene
- `Open in Orchestrate`
- `Open in Draft`

### 不要做

- 不要把 binder 改成拖拽列表
- 不要在 binder 里顺手做字段编辑表单
- 不要把 reorder 动作做得比主内容更抢眼

### 推荐 props 增量

```ts
onMoveScene?: (sceneId: string, direction: 'up' | 'down') => void
movingSceneId?: string | null
```

---

## 8.2 `ChapterOutlinerView.tsx`

这是 PR6 的 structure patch 主入口。

### 要做的事

只对**当前 active row / selected scene**提供一个窄 inline form。

建议交互：

- 默认仍是高密度 read view
- 当前 selected row 行尾增加 `Edit structure`
- 点开后，在该 row 下方展开一个 compact form
- 只编辑当前 selected scene
- 保存 / 取消后收起

### 表单字段

第一版固定为：

- summary
- purpose
- pov
- location
- conflict
- reveal

### 验证纪律

- 所有字段 `trim()` 后不能为空
- 没有实际变化时，`Save` 不触发 mutation，只关闭编辑态
- 选中 scene 改变时，编辑态自动 reset
- view 切出 outliner 时，编辑态自动 reset

### 为什么只允许 selected row 编辑

因为 Outliner 的首要职责仍然是：

- 高密度比较
- 快速扫描字段差异

如果每一行都长期处于 editable 状态，Outliner 会失去“高密度比较”职责，退化成表单页。

### 推荐 props 增量

```ts
onSaveScenePatch?: (
  sceneId: string,
  patch: {
    summary: string
    purpose: string
    pov: string
    location: string
    conflict: string
    reveal: string
  },
) => Promise<void> | void
savingSceneId?: string | null
```

### 不要做

- 不要把 Outliner 改成 table editor
- 不要支持多行同时编辑
- 不要在 PR6 里加 title / status 可写
- 不要顺手加入 reorder

---

## 8.3 `ChapterSequenceView.tsx`

这一轮只做最小配合。

### 要做的事

基本不新增 mutation affordance。

Sequence 在 PR6 里继续承担：

- 扫描顺序
- 看节奏
- 快速切换 selected scene
- 继续保留已有 handoff 次级动作

### 为什么不在 Sequence 上加 reorder

因为 Binder 已经是更合适的顺序入口。

如果 Sequence 也加 reorder，会导致：

- chapter 两个 surface 同时承载顺序操作
- 操作重叠
- PR6 范围失控

---

## 8.4 `ChapterAssemblyView.tsx`

这一轮保持 read-heavy，不加 mutation。

它继续负责：

- incoming / current seam / outgoing 的承接判断
- 继续保留已有 handoff 次级动作

当 scene 发生 reorder / patch 后，Assembly 只需要正确反映结果即可。

不要把 Assembly 变成第二个编辑入口。

---

## 8.5 `ChapterStructureInspectorPane.tsx`

PR6 里 inspector 继续保持 read-only supporting pane。

### 要做的事

不新增编辑表单。

只保证：

- reorder 后 selected scene brief 仍正确
- patch 后 brief / summary 能正确显示更新值

### 为什么 inspector 不做 patch 表单

因为当前产品纪律一直是：

- 右侧做 supporting judgment
- 主舞台做一级任务

PR6 的 patch 是 chapter 主任务的一部分，应落在主舞台的 Outliner，而不是右侧 inspector。

---

## 8.6 `ChapterBottomDock.tsx` / `useChapterWorkbenchActivity.ts`

PR6 很值得顺手把 mutation activity 补进去。

当前 dock 的 Activity 只记录：

- 进入 / 切换 view
- 聚焦 scene

PR6 建议扩成还能记录：

- `moved-scene`
- `updated-structure`

### 推荐新增 kind

```ts
type ChapterWorkbenchActivityKind = 'view' | 'scene' | 'mutation'
```

### 推荐 mutation event 例子

- `Moved Ticket Window earlier`
- `Updated structure fields for Midnight Platform`

### 为什么值得做

因为 PR6 一旦引入 mutation，bottom dock 的 Activity 如果还只记录 view / selection，就会显得和实际工作流脱节。

### 但仍要保持的纪律

dock 只记录 mutation activity，不拥有 mutation state。

不要把：

- draft form state
- reorder intent
- save result source-of-truth

塞进 dock。

---

## 九、容器接线要求

## 9.1 `ChapterStructureWorkspace.tsx`

这是 PR6 的核心接线点。

### 要做的事

1. 继续保留现有 `openSceneFromChapter(...)`
2. 新接入 reorder mutation hook
3. 新接入 patch mutation hook
4. 把 reorder 回调传给 `ChapterBinderPane`
5. 把 patch 回调传给 `ChapterOutlinerView`
6. 继续把同一个 `workspace` 传给 sequence / outliner / assembly / inspector / dock
7. 把 mutation activity 交给 `ChapterDockContainer`

### 推荐新增 helper

```ts
const moveSceneWithinChapter = (sceneId: string, direction: 'up' | 'down') => {
  // 1. 从 workspace.scenes 找当前位置
  // 2. 计算 targetIndex
  // 3. 边界直接 return
  // 4. 调用 reorder mutation
}
```

### 重要纪律

- 不要在容器里自己手写 reorder 逻辑修改 UI state
- 真正的顺序变更必须经过 mutation hook
- route 只负责选中和 view，不负责 mutation 结果

---

## 9.2 `ChapterDockContainer.tsx`

这一层应继续只做轻量派生，不接管 mutation。

### 要做的事

- 从 `workspace` 派生 problems 区域需要的数据
- 从增强后的 `useChapterWorkbenchActivity(...)` 派生 activity
- 把两者传给 `ChapterBottomDock`

### 推荐改法

让 `useChapterWorkbenchActivity(...)` 支持接收一个可选 `externalEvents` 或 `mutationSignal` 输入，或者在 `ChapterStructureWorkspace.tsx` 内维护一小段 mutation event list，再和现有 activity 合并后传入 dock。

### 选型建议

更推荐：

- 继续让 `useChapterWorkbenchActivity(...)` 统一负责产出 dock activity
- 在 hook 内新增 mutation event append API 或新增 options

不要把一半 activity 逻辑拆到 workspace、另一半留在 hook。

---

## 十、建议的文件改动

## 10.1 必改

- `packages/renderer/src/features/chapter/api/chapter-client.ts`
- `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`
- `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
- `packages/renderer/src/features/chapter/components/ChapterBinderPane.tsx`
- `packages/renderer/src/features/chapter/components/ChapterOutlinerView.tsx`
- `packages/renderer/src/features/chapter/hooks/useChapterWorkbenchActivity.ts`
- `packages/renderer/src/features/chapter/components/ChapterBottomDock.tsx`
- chapter 相关 i18n 文案

## 10.2 推荐新增

- `packages/renderer/src/features/chapter/api/chapter-record-mutations.ts`
- `packages/renderer/src/features/chapter/hooks/useReorderChapterSceneMutation.ts`
- `packages/renderer/src/features/chapter/hooks/useUpdateChapterSceneStructureMutation.ts`

## 10.3 视实现复杂度决定是否新增

- `packages/renderer/src/features/chapter/components/ChapterStructurePatchForm.tsx`

如果你希望 `ChapterOutlinerView.tsx` 不要被表单逻辑撑太大，这个组件值得抽出来；
如果当前 form 仍然很轻，也可以先内联在 outliner 里。

## 10.4 这一轮尽量不动

- `packages/renderer/src/features/workbench/types/workbench-route.ts`
- `packages/renderer/src/features/chapter/hooks/chapter-query-keys.ts`
- `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts`
- `packages/renderer/src/App.tsx`
- `packages/renderer/src/features/scene/**`

PR6 的重点是 chapter 写路径，不是 route 改造，也不是 scene 重构。

---

## 十一、测试补齐方案

PR6 新增测试的关键，不是“按钮有没有出现”，而是：

**mutation 之后，chapter 的各个表面是否仍围绕同一个 query + route 约束同步。**

## 11.1 `chapter-record-mutations` 纯函数测试

建议新增一组纯函数测试，至少覆盖：

### reorder

1. 把中间 scene 上移一位
2. 把中间 scene 下移一位
3. first scene 上移时保持不变
4. last scene 下移时保持不变
5. reorder 后 `order` 连续归一化为 `1..n`
6. reorder 不丢失 scene 其他字段

### patch

1. patch 只改当前 scene
2. patch 只改当前 locale 对应文本
3. 未 patch 的字段保持原值
4. 其他 scene 不受影响

这组测试非常值钱，因为它能把最核心的数据写逻辑固定下来。

---

## 11.2 mock db / client 测试

建议至少覆盖：

1. `reorderChapterScene(...)` 确实写入 mutable db
2. `updateChapterSceneStructure(...)` 确实写入 mutable db
3. `resetMockChapterDb()` 会恢复初始种子
4. client 返回值仍然是 clone，而不是 db 引用

---

## 11.3 `ChapterBinderPane.test.tsx`

至少覆盖：

1. `Move earlier` / `Move later` 按钮存在
2. 首项 / 末项按钮会禁用
3. 点击 reorder 不会误触发主点击选中
4. `Open in Orchestrate` / `Open in Draft` 仍可正常触发

---

## 11.4 `ChapterOutlinerView.test.tsx`

至少覆盖：

1. 当前 selected row 能进入 edit 模式
2. 表单初始值来自当前 selected scene
3. `Save` 会调用 `onSaveScenePatch(sceneId, patch)`
4. `Cancel` 会丢弃本地 draft
5. 切换 selected scene 后，旧 edit state 会 reset
6. 没有实际变化时，不触发 save

---

## 11.5 mutation hook 测试

建议至少覆盖：

### reorder hook

1. optimistic update 会立即更新同一个 chapter workspace cache
2. error 时 rollback
3. settled 后 invalidate 正确 key

### patch hook

1. optimistic patch 会立即更新 cache
2. error 时 rollback
3. invalidate 只打到当前 chapter key

---

## 11.6 `ChapterStructureWorkspace.test.tsx`

这是 PR6 最值钱的 chapter 集成测试。

建议至少新增一条完整路径：

```text
打开 chapter binder / outliner
-> 在 binder 中把 Ticket Window 上移
-> 断言 binder 顺序变化
-> 断言 outliner / sequence / assembly 同步变化
-> 当前 selected scene 不丢失
-> 打开 outliner 的 Edit structure
-> 修改 purpose / reveal
-> 保存
-> 断言 inspector brief / outliner / assembly current seam 用的文本已刷新
-> 底部 dock activity 出现 reorder + update 记录
```

### 这里最重要的断言

不是某个按钮存在，而是：

- mutation 后多表面同步
- route 不乱
- selection 不乱
- dock 记录了 mutation

---

## 11.7 `App.test.tsx`（推荐补一条跨 scope smoke）

PR5 已经有 chapter → scene → chapter 的 roundtrip smoke。

PR6 推荐再补一条更值钱的 smoke：

```text
打开 chapter
-> reorder 某个 scene
-> 从 binder / outliner 继续 open in orchestrate
-> 进入 scene scope
-> scene navigator 按新顺序渲染
```

### 为什么这条 smoke 值得做

因为它能验证：

- chapter mutation 确实写进共享 mock db / query 体系
- scene scope 在 chapter mutation 后也能吃到同一份顺序事实

这会让 PR6 不只是 chapter 内部的小编辑，而是真正影响跨 scope 共享结构事实。

---

## 十二、实施顺序（给 AI 的执行顺序）

### Step 1
先补纯函数 mutation helper：

- `chapter-record-mutations.ts`
- 先把 reorder / patch 逻辑写纯
- 先补对应单测

### Step 2
把 mock db 改造成可写 + 可 reset：

- mutable db
- reset helper
- 写入函数

### Step 3
升级 `ChapterClient`：

- 新增 reorder / patch client contract
- client 调用 mock db 写入

### Step 4
新增 mutation hooks：

- reorder mutation hook
- patch mutation hook
- optimistic update / rollback / invalidate

### Step 5
改 `ChapterBinderPane.tsx`：

- 增加 reorder actions
- 保持 main click / handoff 不变

### Step 6
改 `ChapterOutlinerView.tsx`：

- 加 selected-row edit form
- Save / Cancel / validation

### Step 7
回到 `ChapterStructureWorkspace.tsx` 接线：

- 接 mutation hooks
- 把 callbacks 传给 binder / outliner
- 保持现有 handoff、route、dock wiring 不变

### Step 8
扩充 `useChapterWorkbenchActivity.ts` / dock：

- 让 dock 能记录 mutation activity

### Step 9
补 chapter 集成测试与可选 app smoke

### Step 10
如果本 PR 维护 story，再补 minimal stories；否则可以不做

---

## 十三、完成后的验收标准

满足以下条件，PR6 就算完成：

1. chapter client 不再是只读 client。
2. 用户可以在 Binder 中显式移动 scene 的顺序。
3. 用户可以在 Outliner 中编辑当前 selected scene 的结构字段。
4. reorder 后 scene 的 `order` 会重新归一化，且 chapter 各视图同步更新。
5. patch 后 sequence / outliner / assembly / inspector 使用到的结构文本会同步更新。
6. `route.sceneId` 仍然是唯一 chapter 选中态真源。
7. `chapterQueryKeys.workspace(chapterId)` 的 identity 完全不变。
8. handoff 动作仍然存在且可用。
9. bottom dock activity 至少能记录 view / scene / mutation 三类事件。
10. 测试之间不会因为 mutable mock db 污染彼此状态。
11. PR6 不包含 chapter draft / asset / book / drag-drop / AI orchestration 扩建。

---

## 十四、PR6 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了 edit form，把 route 改成了编辑状态容器
- 为了 reorder，引入了新的 chapter selected store
- 为了 patch，把 Outliner 变成低密度表单页
- Sequence / Assembly 也被塞满 mutation 按钮
- handoff 被 mutation 挤掉或主点击被改坏
- `problemsSummary` / `assemblyHints` 被顺手做成半套智能重算系统
- mutable mock db 没有 reset helper
- optimistic update 逻辑直接 patch UI view-model，而不是 raw record cache
- chapter query identity 被改动
- PR6 顺手开始做 chapter draft / asset / book

PR6 做完后，正确的项目状态应该是：

**chapter 已经拥有第一条窄而真实的写路径，但仍保持 route / query / scope 边界稳定。**

---

## 十五、给 AI 的最终一句话指令

在当前 `codex/pr5-chapter-scene-handoff` 分支已经完成 PR5 主体的前提下，只围绕 **Chapter Structure Mutations** 做一轮窄而实的实现：

- 不重做 PR5 的 handoff / roundtrip
- 不扩 chapter route / lens / scope
- 先补纯函数 mutation helper 与可 reset 的 mock db
- 再把 `ChapterClient` 升级为 read/write client
- 通过 mutation hooks 给同一个 chapter query key 做 optimistic reorder / patch
- 在 Binder 中补显式 reorder 动作
- 在 Outliner 中补 selected-scene 的窄 inline patch form
- 保持 Sequence / Assembly / Inspector 继续读优先
- 扩充 bottom dock activity，让 mutation 也能被记录
- 用测试固定 route 不变、query identity 不变、多表面同步这三条硬约束
- 不提前做 PR7 及其后的 Chapter Draft / Asset / Book 扩建内容
