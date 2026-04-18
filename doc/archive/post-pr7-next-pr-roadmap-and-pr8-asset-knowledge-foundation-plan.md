# PR8 后续实施计划（基于 `codex/pr7-chapter-draft-lens` 实际代码）

## 结论

PR7 已经把 Chapter 从“只有 Structure 的对象”推进成了一个真正支持第二条 lens 的对象：

- chapter route 已支持 `lens='structure' | 'draft'`
- chapter scope 已有 `ChapterWorkbench` 分发容器
- `ChapterDraftWorkspace` 已经用 chapter scene order + scene prose query 组装章节阅读稿
- app 级 smoke 已覆盖 `chapter structure -> chapter draft -> scene draft -> back -> structure` 的往返恢复

因此，后续主线不应该继续围绕 PR7 已经解决的 chapter draft 基础能力打磨，而应该进入下一个更有价值的阶段：

**把 Asset / Knowledge 作为第三个 scope 正式接进 workbench。**

一句话判断：

**PR8 的正确目标不是“再补一个 chapter 视图”，而是让 workbench 从 `scene + chapter` 进入 `scene + chapter + asset`，第一次真正兑现 README 里已经写明的对象轴扩展方向。**

---

## 一、先确认当前代码基线

以下判断必须建立在当前 `codex/pr7-chapter-draft-lens` 的真实代码事实上，而不是沿用 PR6 之前的假设。

### 1. 当前 workbench 仍然只有两个 scope

当前 route 类型与 features 目录共同说明：

- `WorkbenchScope` 仍然只有 `scene | chapter`
- `packages/renderer/src/features` 当前也只有：
  - `chapter`
  - `scene`
  - `workbench`

这意味着：

- 第三个对象层级（`asset`）还没有落地
- 第四个对象层级（`book`）也还没有落地

也就是说，PR7 虽然把 Chapter 做深了，但对象轴仍然停留在双 scope 阶段。

### 2. Chapter 已经兑现 multi-lens

PR7 当前代码已经成立的部分包括：

- `ChapterWorkbench.tsx` 会根据 `route.lens` 在：
  - `ChapterStructureWorkspace`
  - `ChapterDraftWorkspace`
  之间切换
- Chapter route 已支持：
  - `scope='chapter'`
  - `lens='structure' | 'draft'`
  - `view='sequence' | 'outliner' | 'assembly'`
  - `sceneId?`

这说明：

**Chapter 现在不再是“挂在 chapter 名下的一张 structure 页面”，而是一个真正支持多 lens 的对象。**

### 3. Chapter Draft 已经不是脚手架，而是组合型工作面

当前 `useChapterDraftWorkspaceQuery.ts` 已经形成了一条很明确的数据链：

1. 先拿 chapter structure workspace
2. 再按 chapter scenes 的顺序对每个 scene 发 prose query
3. 在 hook 内派生出：
   - `draftedSceneCount`
   - `missingDraftCount`
   - `assembledWordCount`
   - dock summary
   - selected scene inspector

这意味着 PR7 的价值已经不仅仅是“多一个页面”，而是：

**Chapter / Draft 已经开始验证同一对象身份跨 query 组合而成的第二工作视角。**

### 4. PR7 还把 roundtrip 恢复做实了

当前测试已经覆盖：

```text
chapter structure
-> chapter draft
-> scene draft
-> browser back
-> chapter draft
-> switch back to structure
-> 原 structure view 恢复
```

这说明：

- chapter 的 dormant `view` 能在 draft 往返后保留
- chapter 与 scene 之间的 back/forward 心智已经成立
- PR7 的“可恢复多 lens”目标已经完成

### 5. 当前最大的缺口，不再是 chapter，而是第三个对象层级

现在最明显的缺口是：

- README 已经把目标对象写成 `Book / Chapter / Scene / Asset`
- README 也已经把工作视角写成 `Structure / Orchestrate / Draft / Knowledge`
- 但当前代码里：
  - 没有 `asset` scope
  - 没有 `knowledge` lens
  - 没有 `features/asset`

所以，继续抛光 chapter draft 的收益已经开始下降；而把 **Asset / Knowledge** 接进来，会更符合项目当前的真实节奏。

---

## 二、推荐的后续顺序

我建议把 PR7 之后的主线定成下面四步：

1. **PR8：Asset / Knowledge Foundation**
2. **PR9：Canon & Traceability Bridge**
3. **PR10：Book Structure Workspace**
4. **PR11 以后：Branch / Compare / Publish**

### 为什么不是继续做 Chapter polish

因为 PR7 结束后，Chapter 已经拥有：

- structure lens
- draft lens
- route 恢复
- scene handoff
- draft roundtrip smoke

此时 Chapter 的“对象深度”已经足够支撑下一阶段；继续局部抛光，只会延后更关键的对象轴扩建。

### 为什么不是先做 Book

因为在没有 Asset / Knowledge 的前提下，Book 很容易只变成“chapter 总览页”。

而 Asset 是后续这些能力的基础：

- references / mentions
- canon facts 的承载对象
- scene/chapter prose 的追溯目标
- 后续 traceability bridge 的落点

所以顺序上应当是：

**先 asset，再 traceability，再 book。**

---

## 三、PR8 的唯一目标

**把 Asset / Knowledge 作为第三个 scope 正式接进 workbench，并把它做成第一版 read-heavy knowledge workspace。**

PR8 完成后，用户应该能：

- 在 workbench 中进入 `scope='asset'`
- 以 `lens='knowledge'` 查看一个 typed asset
- 在 `Profile / Mentions / Relations` 三种知识视图之间切换
- 从 navigator 中切换不同 asset
- 在 mentions 中打开对应的 chapter 或 scene 上下文
- 使用浏览器 back / forward 恢复 asset 的当前 view 与 assetId

一句话说：

**PR8 要证明这个项目不只是 `scene + chapter` 的双对象系统，而是真正开始进入第三对象层级。**

---

## 四、本轮明确不做

为了让 PR8 保持“窄而实”，以下内容不要混进来：

- 不做 `book` scope
- 不做 asset mutations
- 不做 asset editor / inline editing
- 不做 graph-first 入口
- 不做 full backlinks 系统
- 不做 scene/chapter 侧的 asset chips 全量接入
- 不做 compare / publish
- 不做 branch / merge
- 不做全局 command palette / search overhaul
- 不做 prompt binding / agent profile 编辑器
- 不做复杂评论系统

PR8 的定位必须明确为：

**read-heavy knowledge foundation，而不是 asset 全功能系统。**

---

## 五、必须遵守的硬约束

### 1. route 仍然是 asset 选中态与视图态唯一真源

不要新增：

- `selectedAssetId` store
- `activeAssetView` store
- navigator / stage / inspector 各自的本地真源

统一规则必须是：

- 当前资产身份来自 route 的 `assetId`
- 当前资产视图来自 route 的 `view`
- 点击 navigator asset：`patchAssetRoute({ assetId })`
- 点击 stage view switcher：`patchAssetRoute({ view })`
- 点击 relation target asset：`patchAssetRoute({ assetId: targetAssetId })`

### 2. 不要破坏 scene / chapter 已成立的 route 与 query identity

PR8 不应为了引入 asset 而重做：

- scene route 结构
- chapter route 结构
- chapter structure query identity
- chapter draft query 组合方式

Asset 应作为 **新增 scope** 接入，而不是用 asset 把前两个 scope 的边界冲掉。

### 3. 不要把 Knowledge 做成“又一个特殊页面”

Asset 应遵循 workbench 纪律：

- mode rail
- navigator
- main stage
- inspector
- bottom dock

不要把 Asset 做成一个脱离壳子的“资料页 modal”。

### 4. 不要在 PR8 提前做完整 traceability

本轮可以有：

- mentions
- relation list
- 从 mention 打开 scene / chapter

但不要在 PR8 里尝试一次性做：

- prose source graph
- accepted canon chain
- scene/chapter/asset 的全量双向追踪 UI

这些应该留给 PR9。

### 5. 不要把 graph 变成主入口

本轮默认入口必须是：

- `Profile`
- `Mentions`
- `Relations`

Graph 如果未来要做，也只能作为后续的次级探索视图。

---

## 六、路由与壳子改法

## 6.1 `workbench-route.ts`

当前 route 类型已经被 PR7 推到一个关键节点：

- `scene` 有自己的 lens 集
- `chapter` 有自己的 lens 集

PR8 最好顺手把“各 scope 的 lens 类型”再收紧一层，而不是继续扩大一个过宽的统一 lens。

### 推荐改法

```ts
export type SceneLens = 'structure' | 'orchestrate' | 'draft'
export type ChapterLens = 'structure' | 'draft'
export type AssetLens = 'knowledge'

export type WorkbenchScope = 'scene' | 'chapter' | 'asset'
export type AssetKnowledgeView = 'profile' | 'mentions' | 'relations'
```

然后新增：

```ts
export interface AssetRouteState {
  scope: 'asset'
  assetId: string
  lens: AssetLens
  view: AssetKnowledgeView
}
```

### 为什么这一步值得做

因为 PR8 一旦加入 `knowledge`，如果继续让 scene 使用一个“过宽的 WorkbenchLens”，类型语义会开始变差。

PR8 正是把：

- scene lens
- chapter lens
- asset lens

这三类边界写清楚的最好时机。

---

## 6.2 `useWorkbenchRouteState.ts`

要做的事：

1. `WorkbenchSearchState` 增加 `asset`
2. 增加默认 `DEFAULT_ASSET_ID`
3. 增加 `VALID_ASSET_VIEWS`
4. 增加 `VALID_ASSET_LENSES`
5. 新增：
   - `normalizeAssetRoute(...)`
   - `readAssetSnapshot(...)`
6. `buildWorkbenchSearch(...)` 支持 `scope='asset'`
7. 暴露 `patchAssetRoute(...)`
8. `replaceRoute(...)` 支持 `scope='asset'`

### 推荐的 URL 形态

```text
?scope=asset&id=asset-ren-voss&lens=knowledge&view=profile
```

### 必须保留的行为

和现在 scene / chapter 一样：

- inactive scope snapshot 不丢
- back / forward 可恢复
- 从 asset 切回 scene / chapter 时，仍可回到各自上一次状态

---

## 6.3 `App.tsx`

当前 App 顶层只分发：

- `SceneWorkbench`
- `ChapterWorkbench`

PR8 后应改成：

- `SceneWorkbench`
- `ChapterWorkbench`
- `AssetWorkbench`

### 推荐新增

- `packages/renderer/src/features/asset/containers/AssetWorkbench.tsx`

第一版 `AssetWorkbench` 可以很轻，只负责：

- 读取 route
- 暂时只分发到 `AssetKnowledgeWorkspace`

这和 PR7 的 `ChapterWorkbench` 一致，也为未来 asset 追加更多 lens 留出所有权位置。

---

## 6.4 Mode Rail 的最小改法

当前项目里 mode rail 已经分成两套：

- scene scope 下，rail 在 `App.tsx`
- chapter scope 下，rail 在 `ChapterModeRail.tsx`

PR8 不建议顺手做全局 rail 大重构。

### 正确做法

#### Scene rail

只做最小改动：

- scope 按钮从 `scene / chapter` 扩成 `scene / chapter / asset`
- 选择 `asset` 时执行 `replaceRoute({ scope: 'asset' })`

#### Chapter rail

把 `ChapterModeRail` 的 API 从：

```ts
onSwitchScope: () => void
```

改成：

```ts
onSelectScope: (scope: 'scene' | 'chapter' | 'asset') => void
```

然后让 chapter workspace 决定：

- 切 `scene` 时，沿用现有 chapter -> scene handoff 规则
- 切 `asset` 时，走 `replaceRoute({ scope: 'asset' })`
- 切 `chapter` 时 noop

#### Asset rail

新增：

- `AssetModeRail.tsx`

只负责：

- scope 按钮：scene / chapter / asset
- lens 按钮：Knowledge（当前只有一个）

### 为什么不统一 rail

因为 PR8 的主任务是引入第三个 scope，不是做导航系统大重构。

先把 scope 接进来，比先做通用 rail 框架更重要。

---

## 七、Asset 数据层建议

## 7.1 feature 目录

新增：

```text
packages/renderer/src/features/asset/
  api/
  components/
  containers/
  hooks/
  types/
```

这和 chapter / scene 的 feature 组织保持一致。

---

## 7.2 mock data 先做 typed entity，而不是 doc page

第一版建议只做三类资产：

- `character`
- `location`
- `rule`

### 推荐文件

- `api/asset-records.ts`
- `api/mock-asset-db.ts`
- `api/asset-client.ts`

### 推荐最小 seed

不要一开始铺很多数据，先用和现有 scene fixture 强相关的一小组资产：

#### Character
- `asset-ren-voss`
- `asset-mei-arden`

#### Location
- `asset-midnight-platform`
- `asset-ticket-window`

#### Rule
- `asset-ledger-stays-shut`
- `asset-departure-bell-timing`

这样能直接复用当前 scene fixture 中已经存在的人物、地点和规则语义。

---

## 7.3 数据记录建议

### `AssetRecord`

```ts
interface AssetRecord {
  id: string
  kind: 'character' | 'location' | 'rule'
  title: LocalizedText
  summary: LocalizedText
  profile: AssetProfileRecord
  mentions: AssetMentionRecord[]
  relations: AssetRelationRecord[]
  warnings?: LocalizedText[]
  notes?: LocalizedText[]
}
```

### `AssetMentionRecord`

```ts
interface AssetMentionRecord {
  id: string
  targetScope: 'scene' | 'chapter'
  targetId: string
  chapterId?: string
  sceneId?: string
  targetLabel: LocalizedText
  relationLabel: LocalizedText
  excerpt: LocalizedText
  recommendedLens?: 'structure' | 'draft' | 'orchestrate'
}
```

### `AssetRelationRecord`

```ts
interface AssetRelationRecord {
  id: string
  targetAssetId: string
  relationLabel: LocalizedText
  summary: LocalizedText
}
```

### 为什么 mentions 先直接写在 asset record 里

因为 PR8 要的是 read-heavy foundation。

先把 mentions / relations 明确建模，比先追求自动抽取或双向图数据库更符合当前阶段。

---

## 7.4 client contract

第一版 client 只做只读：

```ts
interface AssetClient {
  getAssetKnowledgeWorkspace(input: { assetId: string; locale?: 'en' | 'zh-CN' }): Promise<AssetKnowledgeWorkspaceRecord | null>
}
```

### 为什么 PR8 不做 mutation

因为 asset 的首要任务是先建立：

- 对象身份
- 视图切换
- mentions / relations 的浏览
- route 恢复

不是先做编辑器。

---

## 八、view-model 与 query 建议

## 8.1 `useAssetKnowledgeWorkspaceQuery.ts`

第一版可以像 chapter 一样，直接用一个 workspace query 把 navigator / stage / inspector / dock 需要的数据都派生出来。

### 推荐 query key

```ts
assetQueryKeys.workspace(assetId, locale)
```

### 为什么先不拆 library query

虽然长期看 asset 可能值得拆成：

- library query
- workspace query

但 PR8 里资产量很小，先用单个 workspace query 承担 navigator + selected asset workspace，可以让接线更直。

后续如果 asset 规模上来，再拆也不迟。

---

## 8.2 推荐的 view-model

### Navigator

```ts
interface AssetNavigatorItemViewModel {
  id: string
  kind: 'character' | 'location' | 'rule'
  title: string
  summary: string
  mentionCount: number
  relationCount: number
  hasWarnings: boolean
  isOrphan: boolean
}
```

### Profile

```ts
interface AssetProfileViewModel {
  sections: Array<{
    title: string
    facts: Array<{ label: string; value: string }>
  }>
}
```

### Mentions

```ts
interface AssetMentionViewModel {
  id: string
  targetScope: 'scene' | 'chapter'
  targetId: string
  title: string
  relationLabel: string
  excerpt: string
  recommendedLens?: 'structure' | 'draft' | 'orchestrate'
}
```

### Relations

```ts
interface AssetRelationViewModel {
  id: string
  targetAssetId: string
  targetTitle: string
  relationLabel: string
  summary: string
}
```

### Workspace

```ts
interface AssetKnowledgeWorkspaceViewModel {
  assetId: string
  kind: 'character' | 'location' | 'rule'
  title: string
  summary: string
  navigator: {
    characters: AssetNavigatorItemViewModel[]
    locations: AssetNavigatorItemViewModel[]
    rules: AssetNavigatorItemViewModel[]
  }
  viewsMeta: {
    availableViews: Array<'profile' | 'mentions' | 'relations'>
  }
  profile: AssetProfileViewModel
  mentions: AssetMentionViewModel[]
  relations: AssetRelationViewModel[]
  inspector: AssetInspectorViewModel
  dockSummary: AssetDockSummaryViewModel
}
```

---

## 九、组件职责拆分

## 9.1 新增组件列表

推荐新增：

- `components/AssetModeRail.tsx`
- `components/AssetNavigatorPane.tsx`
- `components/AssetKnowledgeStage.tsx`
- `components/AssetProfileView.tsx`
- `components/AssetMentionsView.tsx`
- `components/AssetRelationsView.tsx`
- `components/AssetInspectorPane.tsx`
- `components/AssetBottomDock.tsx`
- `containers/AssetKnowledgeWorkspace.tsx`
- `containers/AssetDockContainer.tsx`
- `containers/AssetWorkbench.tsx`
- `hooks/useAssetWorkbenchActivity.ts`

---

## 9.2 `AssetNavigatorPane.tsx`

### 职责

- 左侧对象导航
- 按类型分组展示 asset
- 高亮当前选中 asset

### 每个 item 至少显示

- title
- kind badge
- mention count
- relation count
- orphan / warning 的轻量标记

### 交互

- 点击 asset：`patchAssetRoute({ assetId })`
- 不做编辑
- 不做拖拽排序

---

## 9.3 `AssetKnowledgeStage.tsx`

这是 asset scope 的 stage switchboard。

### 职责

- 提供 `Profile / Mentions / Relations` view switcher
- 根据 route.view 切换主舞台内容

### 规则

- `profile` -> `AssetProfileView`
- `mentions` -> `AssetMentionsView`
- `relations` -> `AssetRelationsView`

和 chapter structure 一样：

- view 由 route 决定
- stage 自己不持有第二真源

---

## 9.4 `AssetProfileView.tsx`

### 职责

这是 asset 的默认阅读入口。

### 要点

- 平静、连续、可阅读
- 以 section + fact list 为主
- 不做卡片墙
- 不做表单

### 第一版内容

按 asset kind 渲染不同 facts：

#### character
- role
- agenda
- private knowledge
- public signal

#### location
- type
- pressure
- visibility
- first appearance

#### rule
- constraint
- scope
- exception
- downstream impact

---

## 9.5 `AssetMentionsView.tsx`

### 职责

- 展示 asset 在哪些 chapter / scene 中出现或被提及
- 提供最小的 cross-scope handoff

### 每条 mention 至少显示

- source title
- target scope badge
- relation label
- excerpt

### 次级动作

- scene mention:
  - `Open in Draft`
  - `Open in Orchestrate`
- chapter mention:
  - `Open in Structure`
  - `Open in Draft`

### 本轮不做

- 不做 mention 编辑
- 不做自动摘录定位到 prose chunk
- 不做双向联动高亮

---

## 9.6 `AssetRelationsView.tsx`

### 职责

- 展示和当前 asset 有关系的其他 asset
- 让 asset -> asset 导航成立

### 每条 relation 至少显示

- target asset title
- relation label
- summary

### 交互

- 点击 relation row：`patchAssetRoute({ assetId: targetAssetId })`
- 不做 graph
- 不做关系编辑

---

## 9.7 `AssetInspectorPane.tsx`

右侧继续只做 supporting judgment。

### 第一版建议固定两块

#### Summary
- asset title
- kind
- summary
- mention count
- relation count

#### Consistency
- warnings
- orphan state
- missing field summary

### 不做

- 不做编辑表单
- 不做 graph 控制台
- 不做版本树

---

## 9.8 `AssetBottomDock.tsx`

### 第一版建议两块

#### Problems
显示：
- orphan asset
- warnings
- missing field hints
- no-relations hint

#### Activity
显示：
- entered knowledge
- switched view
- focused asset

### 为什么值得做

因为 Asset 一旦接进 workbench，也应该和 scene / chapter 一样拥有完整的五个表面，而不是只有 navigator + profile。

---

## 十、cross-scope handoff 规则

PR8 不做完整 traceability，但应做最小 handoff。

## 10.1 Asset -> Scene

在 mentions 中，如果 target 是 scene：

- `Open in Draft`
  - `scope='scene'`
  - `id=sceneId`
  - `lens='draft'`
  - `tab='prose'`

- `Open in Orchestrate`
  - `scope='scene'`
  - `id=sceneId`
  - `lens='orchestrate'`
  - `tab='execution'`

## 10.2 Asset -> Chapter

在 mentions 中，如果 target 是 chapter：

- `Open in Structure`
  - `scope='chapter'`
  - `id=chapterId`
  - `lens='structure'`
  - `view='sequence'`

- `Open in Draft`
  - `scope='chapter'`
  - `id=chapterId`
  - `lens='draft'`

## 10.3 返回策略

仍然依赖：

- 浏览器历史
- route snapshot 恢复

不要为了 asset handoff 新造临时返回栈。

---

## 十一、测试补齐方案

## 11.1 route 测试

至少补：

1. `scope='asset'` 能被正确读写
2. `lens='knowledge'` 能被正确规范化
3. `view='profile' | 'mentions' | 'relations'` 能被正确读写
4. 从 asset 切回 scene / chapter 时，inactive snapshot 保持

---

## 11.2 `useAssetKnowledgeWorkspaceQuery.test.ts`

至少覆盖：

1. 能返回 selected asset 的 profile / mentions / relations
2. navigator groups 按类型分组
3. orphan / warning / missing field summary 派生正确
4. relation target 映射正确
5. dockSummary 派生正确

---

## 11.3 组件测试

### `AssetNavigatorPane.test.tsx`
- 选中态正确
- 点击 asset 会触发 `onSelectAsset`

### `AssetKnowledgeStage.test.tsx`
- view switcher 正确渲染 `profile / mentions / relations`
- 切 view 触发 `onSelectView`

### `AssetMentionsView.test.tsx`
- mention rows 显示 source / excerpt
- `Open in Draft` / `Open in Orchestrate` / `Open in Structure` 能触发

### `AssetRelationsView.test.tsx`
- relation rows 显示 relation label
- 点击 target asset 会触发 `onSelectAsset`

### `AssetInspectorPane.test.tsx`
- Summary / Consistency 两块结构成立

### `AssetBottomDock.test.tsx`
- Problems / Activity 正确显示

---

## 11.4 `AssetKnowledgeWorkspace.test.tsx`

建议做一条完整路径：

```text
打开 ?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions
-> navigator / mentions / inspector / dock 同步指向 Ren
-> 点击 relation 中的 Mei
-> URL assetId 切到 Mei
-> navigator / relations / inspector / dock 同步刷新
-> 切到 mentions
-> 点击 Open in Draft（某个 scene mention）
-> 进入 scene draft
-> browser back
-> 回到 asset mentions + Mei
```

这条测试的价值很高，因为它同时固定了：

- asset route
- view route
- asset -> asset 导航
- asset -> scene handoff
- back 恢复

---

## 11.5 `App.test.tsx`（推荐）

再补一条 scope 扩展 smoke：

```text
从 scene scope 切到 asset
-> asset knowledge 正常加载
-> 再切回 chapter
-> chapter 仍能恢复到原 snapshot
```

这样可以证明 `useWorkbenchRouteState` 在加入第三个 scope 后，没有破坏前两个 scope 的 dormant snapshot 规则。

---

## 十二、Storybook 建议

推荐至少新增：

- `AssetNavigatorPane.stories.tsx`
- `AssetProfileView.stories.tsx`
- `AssetMentionsView.stories.tsx`
- `AssetRelationsView.stories.tsx`
- `AssetInspectorPane.stories.tsx`
- `AssetBottomDock.stories.tsx`
- `AssetKnowledgeWorkspace.stories.tsx`（若允许 page story）

### 最少 story 组合

- `Default`
- `Character`
- `Location`
- `Rule`
- `OrphanAsset`
- `WarningsHeavy`

---

## 十三、建议的文件改动

## 13.1 新增

```text
packages/renderer/src/features/asset/api/asset-records.ts
packages/renderer/src/features/asset/api/mock-asset-db.ts
packages/renderer/src/features/asset/api/asset-client.ts
packages/renderer/src/features/asset/components/AssetModeRail.tsx
packages/renderer/src/features/asset/components/AssetNavigatorPane.tsx
packages/renderer/src/features/asset/components/AssetKnowledgeStage.tsx
packages/renderer/src/features/asset/components/AssetProfileView.tsx
packages/renderer/src/features/asset/components/AssetMentionsView.tsx
packages/renderer/src/features/asset/components/AssetRelationsView.tsx
packages/renderer/src/features/asset/components/AssetInspectorPane.tsx
packages/renderer/src/features/asset/components/AssetBottomDock.tsx
packages/renderer/src/features/asset/containers/AssetWorkbench.tsx
packages/renderer/src/features/asset/containers/AssetKnowledgeWorkspace.tsx
packages/renderer/src/features/asset/containers/AssetDockContainer.tsx
packages/renderer/src/features/asset/hooks/asset-query-keys.ts
packages/renderer/src/features/asset/hooks/useAssetKnowledgeWorkspaceQuery.ts
packages/renderer/src/features/asset/hooks/useAssetWorkbenchActivity.ts
packages/renderer/src/features/asset/types/asset-records.ts
packages/renderer/src/features/asset/types/asset-view-models.ts
```

## 13.2 修改

```text
packages/renderer/src/App.tsx
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/chapter/components/ChapterModeRail.tsx
chapter / scene 相关 mode rail 接线
app i18n 文案
```

## 13.3 这一轮尽量不动

```text
packages/renderer/src/features/chapter/** 的 mutation 逻辑
packages/renderer/src/features/chapter/hooks/useChapterDraftWorkspaceQuery.ts
packages/renderer/src/features/scene/** 的核心容器与 query
```

PR8 的任务是新增第三个 scope，而不是重做前两个 scope 的核心实现。

---

## 十四、实施顺序（给 AI 的执行顺序）

### Step 1
先扩 route：

- `workbench-route.ts`
- `useWorkbenchRouteState.ts`
- 加入 `asset` scope、`knowledge` lens、`profile/mentions/relations` view
- 保持 inactive snapshot 恢复规则

### Step 2
新增 asset feature 骨架：

- `api`
- `hooks`
- `types`
- `components`
- `containers`

### Step 3
建立 typed mock asset db：

- seed 数据
- localized text helper
- mention / relation records
- read-only client

### Step 4
实现 `useAssetKnowledgeWorkspaceQuery.ts`：

- 把 navigator / profile / mentions / relations / inspector / dock summary 统一派生出来

### Step 5
实现 main stage 三视图：

- `AssetProfileView`
- `AssetMentionsView`
- `AssetRelationsView`
- `AssetKnowledgeStage`

### Step 6
实现完整 workbench 容器：

- `AssetKnowledgeWorkspace`
- `AssetBottomDock`
- `AssetDockContainer`
- `AssetModeRail`

### Step 7
修改 `App.tsx`：

- 增加 `AssetWorkbench`
- 扩 scene / chapter rail 的 scope 按钮

### Step 8
补 tests：

- route
- query
- component
- workspace 集成
- app smoke

### Step 9
补 stories 与必要文案

---

## 十五、完成后的验收标准

满足以下条件，PR8 就算完成：

1. `WorkbenchScope` 已支持 `asset`
2. workbench 顶层已能进入 asset scope
3. asset route 支持 `lens='knowledge'`
4. asset route 支持 `view='profile' | 'mentions' | 'relations'`
5. asset 现在有完整五面 workbench
6. navigator / stage / inspector / dock 围绕同一个 `route.assetId` 同步
7. mentions 可以最小 handoff 到 chapter / scene
8. browser back 能恢复 asset 当前 view / assetId
9. chapter 与 scene 现有 smoke 不被破坏
10. PR8 不包含 asset mutation / graph / book / compare / publish

---

## 十六、PR8 结束时不要留下的债

以下情况都算“PR 做偏了”：

- 为了 asset 视图切换，新造了本地 selected view store
- 为了 navigator 选中，新造了 selectedAssetId store
- 直接把 asset 做成独立页面而不是 workbench scope
- 把 graph 作为默认入口塞进来
- 在 PR8 里顺手做 asset 编辑器
- 在 PR8 里顺手重构全局 rail 系统
- 为了 mentions，提前把 scene/chapter 全量 backlinks 也做进去
- 为了加入 asset，破坏 scene / chapter 的 dormant snapshot 恢复

PR8 做完后，正确的项目状态应该是：

**workbench 已经进入第三个对象层级，但仍保持 read-heavy、route-first、workbench-first 的纪律。**

---

## 十七、PR9–PR11 的方向（供后续保留）

### PR9：Canon & Traceability Bridge

在 asset 已经存在之后，再把：

- scene accepted state
- chapter draft section
- asset mentions / references

真正串成一条可追溯链。

### PR10：Book Structure Workspace

等 asset 与 traceability 都有落点后，再把 `book` 作为第四个 scope 接入；否则 book 很容易只是一个空壳总览页。

### PR11 以后：Branch / Compare / Publish

这部分应继续后置，等：

- asset
- traceability
- book

都成立后再做。

---

## 十八、给 AI 的最终一句话指令

在当前 `codex/pr7-chapter-draft-lens` 已经完成 PR7 的前提下，不要继续抛光 chapter draft，也不要提前引入 book 或 publish；先只围绕 **Asset / Knowledge Foundation** 做一轮窄而实的实现：

- 把 `asset` 作为第三个 scope 接进 workbench
- 给 asset 建立 `knowledge` lens 和 `profile / mentions / relations` 三视图
- 保持 route 作为 asset 身份与视图的唯一真源
- 用 read-only typed mock asset db 承载 profile / mentions / relations
- 给 asset 补齐 navigator / main stage / inspector / bottom dock 五个表面
- 只做最小的 asset -> chapter / scene handoff，不提前做全量 traceability
- 不做 graph、不做 mutation、不做 book、不做 branch / publish
- 用测试固定 asset route、asset handoff、scope snapshot 恢复这三条硬约束
