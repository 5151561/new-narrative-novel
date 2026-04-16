# PR2 实施计划：Chapter 数据层与 Query 纵切

## 文档用途

这份文档是给 AI implementation agent 直接执行的 PR2 任务说明。

目标不是继续泛化壳子，也不是提前做 PR3/PR4 的 UI 完成度，而是把 `chapter` 从“已接进 workbench 的 placeholder 工作面”推进成“有稳定数据来源、有统一 read model、可支撑后续三视图演进”的 **read-only structure workspace**。

本 PR 必须严格停留在 **数据层 / query 层 / view-model 层 / 容器接线层**，不要顺手把 Sequence / Outliner / Assembly 重写成正式版，也不要把 bottom dock、chapter→scene handoff、mutation 提前带进来。

---

## 1. 当前基线（以现有分支状态为准）

### 已成立的前提

- workbench route 已支持 `scope='scene' | 'chapter'`
- chapter route 已支持：
  - `chapterId`
  - `lens='structure'`
  - `view='sequence' | 'outliner' | 'assembly'`
  - `sceneId?`
- `App.tsx` 已能根据 `route.scope` 在 `SceneWorkbench` 与 `ChapterWorkbench` 之间切换
- `features/chapter` 已经存在基础目录：
  - `components`
  - `containers`
  - `types`

### 当前仍是脚手架的地方

- `ChapterStructureWorkspace.tsx` 内仍有内联 `chapterRecords`
- `chapter-view-models.ts` 仍使用 `*PlaceholderViewModel`
- binder / stage 等 chapter 组件仍主要在证明“能显示”，而不是“有稳定数据契约”
- chapter 还没有自己的 feature-local api / hooks/query 层

### PR2 要解决的核心问题

现在 chapter 的问题不是“没有视图切换”，而是 **数据身份和 UI 身份还没有真正分离**：

- 数据仍躺在容器里
- 视图依赖 placeholder 类型
- 未来 `Sequence / Outliner / Assembly` 很容易各自长出一套 state 和一套数据读取逻辑
- 这会直接阻碍后续接 preload bridge / repository / 真数据源

---

## 2. 本 PR 的唯一目标

把 chapter 的数据来源从 `ChapterStructureWorkspace.tsx` 内联 fixture 迁移到：

- `feature-local mock db`
- `chapter client`
- `chapter query keys`
- `workspace query hook`
- `stable chapter view models`

并保证：

1. `Sequence / Outliner / Assembly / Binder / Inspector` 都从 **同一份 workspace query 结果** 派生。
2. `view` 和 `sceneId` 仍由 route 控制，不引入新的“选中态 store”。
3. PR2 完成后，chapter feature 拥有和 scene 对齐但不过度复制的 `api / hooks / types` 基本骨架。
4. 这套 read model 能直接支撑 PR3 的 Binder + Sequence，而不用再回头拆数据层。

---

## 3. 明确不做的事

本 PR 不允许包含以下内容：

- 不做 reorder / inline edit / 任何 mutation hooks
- 不做 chapter bottom dock
- 不做 chapter → scene handoff
- 不做 scene orchestration / draft 入口
- 不做复杂 filters / sorts / visible fields 状态
- 不做全局 store（Zustand/Context）来承接 selected scene
- 不做新的 route 结构设计
- 不做 UI 风格重写
- 不做 placeholder 组件的大规模视觉改版

可以改 placeholder 组件的 props/type，使其吃稳定 view model；但不要把 PR2 变成 UI 大改。

---

## 4. 架构决策（必须遵守）

### 4.1 数据 identity 只认 `chapterId`

`chapterId` 才是 query 的数据身份。

以下字段 **不是 query identity**：

- `view`
- `sceneId`

因此：

- query key 只应该包含 `chapterId`
- 切换 `view` 不应产生新的 query key
- 切换 `sceneId` 不应产生新的 query key

### 4.2 `selectedSceneId` 是 route/UI 状态，不是数据源切片

`selectedSceneId` 用于从已加载的 chapter 数据里派生：

- binder 高亮
- stage 当前 scene 选中态
- inspector 的 `selectedSceneBrief`

它不应该触发新的 fetch，也不应该要求单独的 server/client endpoint。

### 4.3 默认只做一个 workspace query

优先实现：

- `useChapterStructureWorkspaceQuery()`

只有在现有 shell / pane contract 明确要求左侧 navigator 拿更窄的数据形状时，才允许额外加：

- `useChapterNavigatorQuery()`

即便加了 navigator query，也必须复用同一份底层 chapter 数据来源，而不是再造第二套 mock 记录。

### 4.4 read model 必须 view-agnostic

PR2 的 read model 必须是“同一份 chapter dataset 的统一表达”，而不是：

- `SequenceViewModel`
- `OutlinerViewModel`
- `AssemblyViewModel`

三套彼此独立的读取模型。

正确方式是：

- 一份 `ChapterStructureWorkspaceViewModel`
- 里面包含统一的 `scenes`
- 由不同视图组件各自选择展示密度和字段组合

### 4.5 彻底移除 Placeholder 类型命名

PR2 之后不允许再出现：

- `*PlaceholderViewModel`

统一替换成稳定命名：

- `ChapterStructureSceneViewModel`
- `ChapterStructureInspectorViewModel`
- `ChapterStructureWorkspaceViewModel`

如果还有“placeholder”语义，只能留在组件名或 UI 描述里，不能留在数据契约层。

---

## 5. 目标目录与文件改动

## 5.1 新增文件

### `packages/renderer/src/features/chapter/api/mock-chapter-db.ts`
职责：

- 承载从容器中抽出的 mock chapter records
- 定义最小 raw record 结构
- 只负责“原始 mock 数据”，不负责 React/query 逻辑

建议导出：

- `mockChapterRecords`
- `getMockChapterRecordById(chapterId: string)`
- 原始 record 类型（若不单独拆文件）

### `packages/renderer/src/features/chapter/api/chapter-client.ts`
职责：

- 提供 chapter feature 的统一读取入口
- 暂时以 mock db 为底层实现
- 为将来切换 preload bridge / repository 保留稳定边界

建议导出：

- `chapterClient`
- `getChapterStructureWorkspace(input: { chapterId: string })`

### `packages/renderer/src/features/chapter/hooks/chapter-query-keys.ts`
职责：

- 收敛 chapter feature 的 query key 约定

建议导出：

```ts
export const chapterQueryKeys = {
  all: ['chapter'] as const,
  workspace: (chapterId: string) => [...chapterQueryKeys.all, 'workspace', chapterId] as const,
  navigator: (chapterId: string) => [...chapterQueryKeys.all, 'navigator', chapterId] as const,
};
```

说明：

- `workspace(chapterId)` 是必需
- `navigator(chapterId)` 只有在确实实现 navigator query 时才使用

### `packages/renderer/src/features/chapter/hooks/useChapterStructureWorkspaceQuery.ts`
职责：

- 读取 chapter workspace 数据
- 把 raw record 映射成 stable workspace view model
- 根据 route 传入的 `selectedSceneId` 派生 inspector / 当前选中 scene

### `packages/renderer/src/features/chapter/hooks/useChapterNavigatorQuery.ts`（可选）
职责：

- 仅当左侧 navigator 需要更窄 props 且 workspace hook 无法优雅复用时实现
- 不能成为第二套独立数据源

## 5.2 必改文件

### `packages/renderer/src/features/chapter/types/chapter-view-models.ts`
职责：

- 删除 `*PlaceholderViewModel`
- 落地稳定 view model 类型
- 统一导出 chapter structure 相关类型

### `packages/renderer/src/features/chapter/containers/ChapterStructureWorkspace.tsx`
职责：

- 删除内联 `chapterRecords`
- 只负责：
  - 读取 route 参数
  - 调用 workspace query hook
  - 把统一数据分发给 binder / stage / inspector

## 5.3 视实际情况修改的文件

如果以下组件当前直接依赖 placeholder 类型、内联数据或容器耦合逻辑，则允许做最小必要修改：

- `ChapterBinderPlaceholder.tsx`
- `ChapterStructureStagePlaceholder.tsx`
- 任何 chapter inspector placeholder/container 组件

修改原则：

- 只改 prop contract / type import / 最小衍生逻辑
- 不做正式 UI 重写
- 不在组件内部再私藏一份 mock 数据

---

## 6. 数据契约（本 PR 要落地的最终类型）

以下是推荐的最小稳定类型。字段命名尽量保持语义直白，不为“暂时 UI 展示”制造歧义。

```ts
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly';

export type ChapterStructureSceneViewModel = {
  id: string;
  order: number;
  title: string;
  summary: string;
  purpose: string;
  pov: string | null;
  location: string | null;
  conflict: string | null;
  reveal: string | null;
  statusLabel: string;
  proseStatusLabel: string;
  runStatusLabel: string;
  unresolvedCount: number;
  lastRunLabel: string | null;
};

export type ChapterStructureSelectedSceneBrief = {
  id: string;
  order: number;
  title: string;
  summary: string;
  purpose: string;
  pov: string | null;
  location: string | null;
  conflict: string | null;
  reveal: string | null;
  statusLabel: string;
  proseStatusLabel: string;
  runStatusLabel: string;
  unresolvedCount: number;
  lastRunLabel: string | null;
};

export type ChapterStructureProblemSummaryItem = {
  id: string;
  label: string;
  sceneId?: string | null;
  severity?: 'info' | 'warning';
};

export type ChapterStructureAssemblyHintItem = {
  id: string;
  label: string;
  sceneId?: string | null;
};

export type ChapterStructureInspectorViewModel = {
  selectedSceneBrief: ChapterStructureSelectedSceneBrief | null;
  chapterNotes: string[];
  problemsSummary: ChapterStructureProblemSummaryItem[];
  assemblyHints: ChapterStructureAssemblyHintItem[];
};

export type ChapterStructureWorkspaceViewModel = {
  chapterId: string;
  title: string;
  summary: string;
  sceneCount: number;
  unresolvedCount: number;
  selectedSceneId: string | null;
  scenes: ChapterStructureSceneViewModel[];
  inspector: ChapterStructureInspectorViewModel;
  viewsMeta?: {
    availableViews: ChapterStructureView[];
  };
};
```

### 契约说明

- `selectedSceneBrief` 与 scene row/card level 字段故意高度重合，这是为了让 inspector 在 PR2 先稳定，不急着发明第二套 scene brief schema。
- `viewsMeta` 可以只放 `availableViews`，不必把当前 view 塞进去；当前 view 继续由 route 控制。
- `sceneCount` 与 `unresolvedCount` 由 `scenes` 派生即可，但在 workspace 层保留聚合结果，方便 binder/header 直接消费。

---

## 7. 原始 mock record 的建议结构

raw record 不需要和最终 view model 一模一样，但必须能稳定映射。

推荐最小 raw 结构：

```ts
type MockChapterSceneRecord = {
  id: string;
  order: number;
  title: string;
  summary: string;
  purpose: string;
  pov?: string | null;
  location?: string | null;
  conflict?: string | null;
  reveal?: string | null;
  statusLabel: string;
  proseStatusLabel: string;
  runStatusLabel: string;
  unresolvedCount: number;
  lastRunLabel?: string | null;
};

type MockChapterRecord = {
  chapterId: string;
  title: string;
  summary: string;
  chapterNotes: string[];
  problemsSummary: Array<{
    id: string;
    label: string;
    sceneId?: string | null;
    severity?: 'info' | 'warning';
  }>;
  assemblyHints: Array<{
    id: string;
    label: string;
    sceneId?: string | null;
  }>;
  scenes: MockChapterSceneRecord[];
};
```

要求：

- scene 顺序必须由 `order` 明确表达，不能依赖数组偶然顺序
- 未来如果 mock 数据改成来自 preload/repository，映射函数仍然应输出同一套 workspace view model

---

## 8. Query hook 的具体实现要求

## 8.1 `useChapterStructureWorkspaceQuery()` 的输入/输出

推荐签名：

```ts
type UseChapterStructureWorkspaceQueryParams = {
  chapterId: string;
  selectedSceneId?: string | null;
};

function useChapterStructureWorkspaceQuery(
  params: UseChapterStructureWorkspaceQueryParams,
): UseQueryResult<ChapterStructureWorkspaceViewModel>;
```

## 8.2 关键实现规则

### 规则 A：query key 只用 `chapterId`

```ts
queryKey: chapterQueryKeys.workspace(params.chapterId)
```

不要把 `selectedSceneId` 放进 key。

### 规则 B：先拿 raw chapter，再映射成 workspace view model

建议流程：

1. `chapterClient.getChapterStructureWorkspace({ chapterId })`
2. 返回 raw chapter record
3. 在 hook 内或独立 mapper 中映射成 `ChapterStructureWorkspaceViewModel`
4. 根据 `selectedSceneId` 派生 `inspector.selectedSceneBrief`

### 规则 C：`selectedSceneId` 缺失时允许只做“渲染层 fallback”

如果 route 中没有 `sceneId`，或者给出的 `sceneId` 在 chapter 中不存在：

- 可以把第一条 scene 作为 **临时渲染 fallback**
- 但不要在 PR2 里自动写回 route
- 也不要引入本地 store 去记住这个 fallback

推荐行为：

- 若 `selectedSceneId` 有效：按 route 选中
- 若无效：`workspace.selectedSceneId` 返回第一条 scene 的 id 或 `null`

### 规则 D：让 binder / stage / inspector 共享同一个 hook 输出

不要再做：

- binder 自己读一份数据
- inspector 自己读一份数据
- stage 再读一份数据

PR2 的价值之一就是让 chapter 五官都围绕同一份 dataset 说话。

## 8.3 建议实现骨架

```ts
export function useChapterStructureWorkspaceQuery({
  chapterId,
  selectedSceneId,
}: UseChapterStructureWorkspaceQueryParams) {
  const query = useQuery({
    queryKey: chapterQueryKeys.workspace(chapterId),
    queryFn: () => chapterClient.getChapterStructureWorkspace({ chapterId }),
  });

  const data = useMemo(() => {
    if (!query.data) return undefined;
    return mapChapterRecordToWorkspaceViewModel(query.data, selectedSceneId ?? null);
  }, [query.data, selectedSceneId]);

  return {
    ...query,
    data,
  };
}
```

注意：

- `selectedSceneId` 只影响映射结果，不影响底层 fetch identity
- 如果你更喜欢在 `select` 中映射，也可以；但要保证类型清晰、选择逻辑可读

---

## 9. `ChapterStructureWorkspace.tsx` 的改造要求

容器最终只做四件事：

1. 从 route 读取：
   - `chapterId`
   - `view`
   - `sceneId`
2. 调用 `useChapterStructureWorkspaceQuery({ chapterId, selectedSceneId: sceneId })`
3. 处理 loading / empty / not-found
4. 把 query 返回的同一份 workspace data 分发给：
   - binder
   - stage
   - inspector

### 容器里不再允许出现

- 内联 mock chapter records
- `selectedScene` 本地 state
- 针对 sequence/outliner/assembly 各自复制数据逻辑

### 容器建议伪代码

```ts
const { chapterId, view, sceneId } = route;

const workspaceQuery = useChapterStructureWorkspaceQuery({
  chapterId,
  selectedSceneId: sceneId ?? null,
});

if (workspaceQuery.isLoading) return <... />;
if (workspaceQuery.isError) return <... />;
if (!workspaceQuery.data) return <... />;

const workspace = workspaceQuery.data;

return (
  <ChapterWorkbenchLayout
    binder={<ChapterBinderPlaceholder workspace={workspace} activeView={view} />}
    stage={<ChapterStructureStagePlaceholder workspace={workspace} activeView={view} />}
    inspector={<ChapterStructureInspector ... />}
  />
);
```

---

## 10. 组件层的最小改造约束

PR2 允许组件改 prop，但不要扩大职责。

### Binder

可接收：

- `workspace: ChapterStructureWorkspaceViewModel`
- `activeView: ChapterStructureView`
- `onSelectScene?: (sceneId: string) => void`

Binder 只消费：

- `title`
- `summary`
- `sceneCount`
- `unresolvedCount`
- `selectedSceneId`
- `scenes`

### Stage

可接收：

- `workspace: ChapterStructureWorkspaceViewModel`
- `activeView: ChapterStructureView`
- `onSelectScene?: (sceneId: string) => void`

Stage 内部根据 `activeView` 切 sequence/outliner/assembly 的 placeholder 表现，但三者都使用同一份 `workspace.scenes`。

### Inspector

可接收：

- `inspector: ChapterStructureInspectorViewModel`

Inspector 只展示：

- `selectedSceneBrief`
- `chapterNotes`
- `problemsSummary`
- `assemblyHints`

PR2 不要在 Inspector 里引入新的 UI 状态机。

---

## 11. 命名与边界规则

### 必须遵守

- 命名里不要再出现 `PlaceholderViewModel`
- mock 数据文件不要放回 `containers`
- query hook 不要 import React 组件
- container 不要知道 raw record 结构细节
- 组件不要直接 import mock db

### 建议遵守

- raw record → mapper → stable view model 三层边界清楚
- 所有 chapter data access 都从 `chapter-client.ts` 进
- 如果 scene feature 已有成熟 query 风格，可借其模式，但不要机械复制无关 hook

---

## 12. 具体实施顺序（AI 按这个顺序改）

### Step 1：先稳定类型命名

- 打开 `chapter-view-models.ts`
- 把所有 `*PlaceholderViewModel` 改成正式命名
- 先让 type 层表达清楚 workspace / scene / inspector 三层结构

### Step 2：把容器中的 mock 数据抽到 `mock-chapter-db.ts`

- 从 `ChapterStructureWorkspace.tsx` 移出 `chapterRecords`
- 在新文件中定义 raw chapter record
- 提供按 `chapterId` 读取的方法

### Step 3：新增 `chapter-client.ts`

- 用 mock db 做底层实现
- 暴露 `getChapterStructureWorkspace({ chapterId })`
- 暂不做 mutation API

### Step 4：新增 query keys

- 落地 `chapterQueryKeys.workspace(chapterId)`
- 若无必要，不实现 navigator key 的实际消费

### Step 5：实现 workspace query hook

- 用 `chapterId` 作为 query identity
- 把 raw record 映射成 `ChapterStructureWorkspaceViewModel`
- 按 `selectedSceneId` 派生 inspector 内容

### Step 6：改造容器

- 删除内联数据
- 用 query hook 读取 workspace
- 把统一数据传给 binder / stage / inspector

### Step 7：修正 placeholder 组件类型

- 替换旧的 placeholder view model imports
- 确保组件只依赖 stable props
- 不在组件里再做数据读取

### Step 8：清理死代码

- 删除旧的内联 chapter record 常量
- 删除失效 placeholder 类型
- 删除不再使用的 helper/import

---

## 13. 验收标准（必须全部满足）

### 13.1 数据与结构

- [ ] `ChapterStructureWorkspace.tsx` 内不再包含内联 `chapterRecords`
- [ ] chapter feature 拥有自己的 `api / hooks / types` 基本骨架
- [ ] 不再存在 `*PlaceholderViewModel`
- [ ] 所有 chapter structure UI 都从同一份 workspace query 结果派生

### 13.2 路由与状态

- [ ] `view` 仍由 route 控制
- [ ] `sceneId` 仍由 route 驱动选中态
- [ ] 没有引入新的 selected scene 全局 store
- [ ] 切换 `view` 不会创建新的 chapter query identity
- [ ] 切换 `sceneId` 不会创建新的 chapter query identity

### 13.3 为后续 PR 留出空间

- [ ] `Sequence / Outliner / Assembly` 共享同一份 `workspace.scenes`
- [ ] inspector 直接消费稳定 `inspector` 数据，不再依赖临时拼接
- [ ] 未来接 preload bridge 时，替换点主要集中在 `chapter-client.ts`

---

## 14. 手工验证脚本

AI 完成代码后，至少自查以下场景：

### 场景 A：chapter route 正常打开

打开一个合法 chapter route：

- 能加载 chapter workspace
- binder / stage / inspector 都有数据
- 没有内联 fixture 相关引用残留

### 场景 B：切 view 不换数据身份

在同一个 chapter 下切换：

- `sequence`
- `outliner`
- `assembly`

预期：

- 页面能正常切换
- 不是三套独立数据源
- 选中 scene 表现仍一致

### 场景 C：带 sceneId 打开

直接打开带 `sceneId` 的 chapter route。

预期：

- binder 高亮正确
- inspector 的 `selectedSceneBrief` 对应正确 scene
- stage 的当前选中表现一致

### 场景 D：不带 sceneId 打开

直接打开不带 `sceneId` 的 chapter route。

预期：

- UI 能正常渲染
- 可使用第一条 scene 作为渲染 fallback
- 不引入新的本地 selected store

### 场景 E：刷新恢复

在 `scope=chapter`、某个 `view`、某个 `sceneId` 下刷新。

预期：

- chapter 仍能恢复到正确 chapter
- view 仍正确
- scene 选中仍正确

---

## 15. 禁止事项清单（给 AI 的红线）

不要做以下事情：

1. 不要把 `view` 放进 query key。
2. 不要把 `sceneId` 放进 query key。
3. 不要实现 `useSequenceQuery / useOutlinerQuery / useAssemblyQuery` 三套 query。
4. 不要用 Zustand/Context 再存一份 selected scene。
5. 不要让 binder / stage / inspector 各自直接读 mock db。
6. 不要在 PR2 顺手加 bottom dock。
7. 不要在 PR2 顺手加 chapter→scene handoff。
8. 不要做 mutation API。
9. 不要把 mock 数据继续塞回容器或组件。
10. 不要为了“和 scene 对称”而制造没有实际价值的 hook 层级。

---

## 16. 交付物定义

本 PR 完成后，仓库里应该留下的不是“更好看的 placeholder”，而是这组稳定资产：

- 一个可替换底层实现的 `chapter-client`
- 一份稳定的 chapter structure workspace query
- 一套正式命名的 chapter structure view models
- 一个不再内联数据的 `ChapterStructureWorkspace` 容器
- 一组能吃同一份 workspace data 的 chapter placeholder 组件

这才是 PR3 能真正开始做 Binder + Sequence 的前提。

---

## 17. 可直接复制给 AI agent 的执行指令

```text
请只实施 PR2：Chapter 数据层与 query 纵切。

严格基于现有 chapter-structure-pr1 的状态继续，不要扩写到 PR3/PR4/PR5。

目标：
1. 把 ChapterStructureWorkspace.tsx 里的内联 chapterRecords 抽到 feature-local mock db。
2. 新增 chapter-client、chapter-query-keys、useChapterStructureWorkspaceQuery。
3. 把 chapter-view-models.ts 中的 PlaceholderViewModel 命名全部替换成正式 view model。
4. 让 binder / stage / inspector 都从同一份 workspace query data 派生。
5. 保持 view 和 sceneId 由 route 控制，不引入新的 selected scene store。
6. query key 只认 chapterId，不要把 view 或 sceneId 放进去。
7. 不做 mutation，不做 bottom dock，不做 chapter→scene handoff，不做 UI 大改。

请优先保证边界清晰、类型稳定、容器不再内联数据，其次再保证 placeholder 组件能编译通过并继续显示。
```

