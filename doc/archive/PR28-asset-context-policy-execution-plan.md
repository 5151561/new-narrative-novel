# PR28 执行文档：Asset Context Policy / Context Activation Trace Foundation

> 基于 `codex/pr27-proposal-variants-reviewable-alternatives` 当前代码状态。  
> 本文档目标是可以直接交给 AI agent 执行，不是路线图回顾，也不是大而全 wishlist。

---

## 0. PR28 一句话目标

在 PR27 已经完成 Proposal Variants / Reviewable Alternatives 的前提下，PR28 不继续抛光 variants，也不提前做真实 LLM / Temporal / full workflow backend，而是做一轮窄而实的：

**Asset Context Policy / Context Activation Trace Foundation**

也就是让系统第一次能清楚表达：

```text
哪些 Asset 可以进入 agent context
为什么进入 / 为什么被排除 / 为什么被红线保护
进入时给哪个 agent、用什么可见性、占用多少上下文预算
某次 run 的 context packet 实际采用了哪些 asset context
```

核心纪律：

```text
Asset policy 是“可进入上下文的规则与约束”，不是 prompt editor。
Context activation 是“本次 run 实际装配结果”，不是 canon。
Run event 仍只携带轻量 refs，大 payload 继续走 artifact detail。
```

---

## 1. 当前代码基线判断

### 1.1 当前仓库已经进入 runtime/API 联调阶段

当前分支已经不是早期纯 renderer 原型。仓库里已有：

```text
packages/api
packages/renderer
```

并且 README 已经把当前状态描述为：

- `@narrative-novel/renderer`：React + Vite + Tailwind 的 workbench 前端、Storybook、mock runtime、UI/feature tests。
- `@narrative-novel/api`：Fastify fixture-backed API server，兑现 `/api/projects/{projectId}/...` 合同，支持 read/write/run/artifact/trace 的产品级接口骨架。

PR28 应继续建立在 `ProjectRuntime -> /api/projects/{projectId}/...` 这条产品路径之上，不要回到 feature 直接读 mock DB 的老路。

### 1.2 PR27 已经完成 Proposal Variants 的纵切

PR27 已经把 variants 接进了三层：

1. **API contract / fixture persistence**
   - `ProposalVariantRecord`
   - `ProposalSetArtifactProposalRecord.variants/defaultVariantId/selectedVariantId`
   - `SubmitRunReviewDecisionInput.selectedVariants`
   - canon patch / prose draft artifact 中记录 selected variants

2. **renderer runtime / mock runtime**
   - `createApiProjectRuntime` 会把 `selectedVariants` 传给 review decision endpoint
   - fake API runtime 与 mock run db 支持 selected variants
   - `useRunProposalVariantDraft(...)` 已经存在，用于局部 UI draft selection

3. **Scene Dock / Artifact Inspector / Review Gate UI**
   - proposal-set artifact detail 可以显示并选择 variants
   - review gate 在 `accept / accept-with-edit` 时携带 selected variants
   - canon patch / prose draft artifact 可以显示 selected variants

因此 PR28 不要再做：

- proposal variants 的第二轮大 UI polish
- variant route state
- variant 独立 mutation endpoint
- variant regenerate / swipe 后端

### 1.3 当前真正的缺口：Asset 还不能解释“如何进入 context”

当前 Asset / Knowledge 已经有：

```text
Profile
Mentions
Relations
Inspector
Bottom Dock
```

但是它还不能回答：

```text
这个 asset 什么时候会进入 Scene Manager context？
角色 agent 能不能看到它？
它是 public fact、character-known fact、private spoiler，还是 editor-only note？
它进入 context 时只用 summary，还是携带 selected facts / mentions？
本次 run 的 context packet 为什么 included / excluded 了它？
```

这正是 PR28 要补的缝。

### 1.4 当前 Context Packet 已经适合作为落点

PR26 / PR27 之后，run artifact / trace read surfaces 已经成立；README 也明确说：

```text
run events 只保留产品级摘要和轻量 refs
context packet、agent invocation、proposal set、canon patch、prose draft 等大对象走 artifact detail
```

所以 PR28 的正确落点不是把 context 内容塞进 event，而是：

```text
context_packet_built event -> context-packet ref -> artifact detail 中显示 context activation trace
```

---

## 2. 为什么 PR28 应该做 Asset Context Policy

### 2.1 它承接 PR26/PR27 的 run artifact / proposal review 链

PR26 让 context packet / artifact / trace 可读，PR27 让 proposal alternatives 可选。下一步最自然的是补齐“这些 alternatives 和 run context 为什么这样出现”的上游解释层。

如果没有 Asset Context Policy，后续真实 orchestration backend 很容易只能说：

```text
这次 run 给了模型一些上下文
```

但不能说：

```text
为什么给这些 asset
为什么没有给那些 private / spoiler asset
为什么某个角色 agent 只看到部分事实
为什么一个 proposal variant 影响了这些 asset
```

### 2.2 它是 SillyTavern WorldInfo / Lorebook 思路的安全转译

PR28 不做 WorldInfo 克隆，不做 prompt manager，而是把“按上下文激活知识”的心智转成叙事对象系统里的：

```text
typed asset policy
+ explicit activation reason
+ visibility / agent scope
+ context budget
+ artifact trace
```

这样既能吸收 power-user context control，又不会把产品退化成 chat-first prompt pile。

### 2.3 它为后续真实 Context Builder 打地基

后续真实 backend / workflow 会需要：

- build context packet
- apply asset visibility policy
- record context inclusion / exclusion
- let UI inspect why an asset was included

PR28 先在 fixture API + renderer read surface 中把这条语义固定下来。

---

## 3. PR28 明确不做

以下内容不要混进 PR28：

- 不做真实 LLM context builder
- 不做 Temporal / durable workflow runtime
- 不做 SSE / events stream 实现
- 不做 asset context policy mutation / editor
- 不做 prompt manager / prompt drag ordering
- 不做 WorldInfo / Lorebook 关键词自动激活引擎
- 不做 RAG / vector search
- 不做 full prompt text 展示或编辑
- 不做 proposal variant regenerate / prose swipe
- 不做 branch / publish / export
- 不做 asset graph
- 不做 route 级 selected activation / selected policy rule 参数
- 不把 context activation 当成 canon mutation 入口

PR28 只做：

```text
read-only asset context policy contract
+ context packet artifact activation trace
+ Asset / Knowledge context view
+ Run Artifact Inspector context activation panel
+ API / renderer fixture tests
```

---

## 4. 必须遵守的硬约束

### 4.1 RunEvent 仍然轻量

禁止把完整 context packet、prompt、asset profile、policy rules、LLM payload 塞进 `RunEventRecord`。

允许：

```ts
refs: [
  { kind: 'context-packet', id: 'ctx-scene-midnight-platform-run-001', label: ... },
]
metadata: {
  includedAssetCount: 3,
  excludedAssetCount: 1,
  redactedAssetCount: 1,
}
```

不允许：

```ts
metadata: {
  fullPrompt: '...',
  includedAssetProfiles: [...large payload...],
}
```

### 4.2 Asset policy 与 runtime activation 要分层

Asset policy 是 asset 的静态 / read-model 规则：

```text
这个 asset 通常如何进入 context
```

Context activation 是某次 run 的实际结果：

```text
这次 context packet 实际 included / excluded / redacted 了什么
```

不要把这两者合成一份数据，也不要让 context packet detail 复制完整 asset record。

### 4.3 Asset 选中态仍由 route 驱动

如果本 PR 给 Asset / Knowledge 增加新 view，推荐：

```ts
AssetKnowledgeView = 'profile' | 'mentions' | 'relations' | 'context'
```

规则：

- 当前 asset 仍来自 `route.assetId`
- 当前 asset view 仍来自 `route.view`
- 点击 asset navigator：`patchAssetRoute({ assetId })`
- 点击 context view switcher：`patchAssetRoute({ view: 'context' })`
- 不新增 `selectedPolicyRuleId` / `selectedActivationId` route 参数

### 4.4 使用显式 fixture metadata，不做字符串推断

PR28 不做关键词匹配和自动 lore activation。

正确做法：

- 在 mock asset records 中显式写 policy rules
- 在 context-packet artifact detail 中显式写 activation records
- mapper 只读取和映射这些记录

### 4.5 不破坏 PR27 selected variants 链路

PR27 已经建立：

```text
proposal-set artifact -> selected variants -> review decision -> canon patch / prose draft artifact
```

PR28 只能增强 context visibility，不应修改这条链路。

### 4.6 API 与 renderer 类型必须同步

新增 record 类型时至少同步：

```text
packages/api/src/contracts/api-records.ts
packages/renderer/src/features/asset/api/asset-records.ts
packages/renderer/src/features/run/api/run-artifact-records.ts
packages/renderer/src/features/run/api/run-records.ts（如需 metadata 类型补充）
```

不要让 API package 与 renderer package 出现同名字段不同 shape。

---

## 5. 数据合同设计

## 5.1 Asset context policy 类型

建议新增：

```ts
export type AssetContextVisibilityRecord =
  | 'public'
  | 'character-known'
  | 'private'
  | 'spoiler'
  | 'editor-only'

export type AssetContextBudgetRecord =
  | 'summary-only'
  | 'selected-facts'
  | 'mentions-excerpts'
  | 'full-profile'

export type AssetContextTargetAgentRecord =
  | 'scene-manager'
  | 'character-agent'
  | 'continuity-reviewer'
  | 'prose-agent'

export type AssetContextActivationReasonKindRecord =
  | 'explicit-link'
  | 'scene-cast'
  | 'scene-location'
  | 'rule-dependency'
  | 'review-issue'
  | 'proposal-variant'
  | 'manual-pin'

export interface AssetContextActivationRuleRecord {
  id: string
  reasonKind: AssetContextActivationReasonKindRecord
  label: LocalizedTextRecord
  summary: LocalizedTextRecord
  targetAgents: AssetContextTargetAgentRecord[]
  visibility: AssetContextVisibilityRecord
  budget: AssetContextBudgetRecord
  priorityLabel?: LocalizedTextRecord
  guardrailLabel?: LocalizedTextRecord
}

export interface AssetContextPolicyRecord {
  assetId: string
  status: 'active' | 'limited' | 'blocked' | 'draft'
  summary: LocalizedTextRecord
  defaultVisibility: AssetContextVisibilityRecord
  defaultBudget: AssetContextBudgetRecord
  activationRules: AssetContextActivationRuleRecord[]
  exclusions?: Array<{
    id: string
    label: LocalizedTextRecord
    summary: LocalizedTextRecord
  }>
  warnings?: LocalizedTextRecord[]
}
```

### 5.2 扩展 Asset knowledge workspace

在 asset workspace record / view-model 中增加：

```ts
contextPolicy?: AssetContextPolicyRecord
viewsMeta: {
  availableViews: Array<'profile' | 'mentions' | 'relations' | 'context'>
}
```

没有 `contextPolicy` 的 asset：

- `context` view 仍可渲染 quiet empty state
- 不要直接 crash
- inspector / dock 显示 “No context policy yet” 一类低噪提示

### 5.3 Context packet activation record

在 `ContextPacketArtifactDetailRecord` 上增加一组 runtime activation 记录。

建议：

```ts
export type RunContextAssetActivationDecisionRecord = 'included' | 'excluded' | 'redacted'

export interface RunContextAssetActivationRecord {
  id: string
  assetId: string
  assetTitle: LocalizedTextRecord
  assetKind: 'character' | 'location' | 'rule'
  decision: RunContextAssetActivationDecisionRecord
  reasonKind: AssetContextActivationReasonKindRecord
  reasonLabel: LocalizedTextRecord
  visibility: AssetContextVisibilityRecord
  budget: AssetContextBudgetRecord
  targetAgents: AssetContextTargetAgentRecord[]
  sourceRefs?: RunEventRefRecord[]
  policyRuleIds?: string[]
  note?: LocalizedTextRecord
}

export interface RunContextActivationSummaryRecord {
  includedAssetCount: number
  excludedAssetCount: number
  redactedAssetCount: number
  targetAgentCount: number
  warningCount: number
}
```

然后在 context packet artifact detail 上追加：

```ts
assetActivations?: RunContextAssetActivationRecord[]
activationSummary?: RunContextActivationSummaryRecord
```

### 5.4 事件 metadata 只放计数

如果要增强 `context_packet_built` 事件，最多放：

```ts
metadata: {
  includedAssetCount: number
  excludedAssetCount: number
  redactedAssetCount: number
}
```

不要在事件里直接放 activation records。

---

## 6. API / fixture 改法

### 6.1 修改 API contracts

建议修改：

```text
packages/api/src/contracts/api-records.ts
```

新增：

- asset context policy records
- context packet asset activation records
- context packet activation summary

### 6.2 修改 API fixture asset data

查找并修改：

```text
packages/api/src/repositories/fixtureProjectData.ts（或当前 fixture data 所在文件）
packages/api/src/repositories/**asset**
```

目标：

- `asset-ren-voss` 有 character policy
- `asset-mei-arden` 有 character policy
- `asset-midnight-platform` 有 location policy
- `asset-ledger-stays-shut` / `asset-departure-bell-timing` 有 rule policy
- 至少一个 asset 有 `spoiler` / `editor-only` / `redacted` 示例
- 至少一个 asset 缺 policy，用于 empty state 测试

### 6.3 修改 context-packet artifact fixture

在默认 scene run 的 context-packet artifact detail 中加入：

```text
included: Ren / Mei / Midnight Platform
excluded: 一条 private / spoiler asset
redacted: 一条 editor-only 或 character-hidden rule
```

同时保留已有 artifact summary / refs 结构，不破坏 PR26 / PR27 artifact inspector。

### 6.4 不新增 endpoint

第一版不新增：

```text
GET /assets/{assetId}/context-policy
GET /runs/{runId}/context-activations
```

原因：

- asset policy 可以随 `GET /assets/{assetId}/knowledge` 返回
- activation trace 可以随 `GET /runs/{runId}/artifacts/{artifactId}` 的 context-packet detail 返回
- endpoint 数量不应在 PR28 过早膨胀

---

## 7. Renderer UI 设计

## 7.1 Asset / Knowledge 增加 Context view

推荐新增：

```text
packages/renderer/src/features/asset/components/AssetContextPolicyView.tsx
```

职责：

- 显示当前 asset 的 context policy
- 显示 activation rules
- 显示 visibility / budget / target agents
- 显示 guardrails / exclusions / warnings
- 没有 policy 时显示 quiet empty state

第一版 UI 结构建议：

```text
Summary
Activation Rules
Visibility & Budget
Guardrails / Exclusions
Warnings
```

### 不做

- 不做 policy 编辑表单
- 不做 drag priority
- 不做 prompt text 编辑
- 不做真实 activation simulate

## 7.2 Asset stage 增加 context tab

修改：

```text
packages/renderer/src/features/asset/components/AssetKnowledgeStage.tsx
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
```

规则：

- `view='context'` 渲染 `AssetContextPolicyView`
- `viewsMeta.availableViews` 若没有 context，则 switcher 不显示 context；但直接 deep link 到 `context` 应 fallback 到 profile 或显示 unavailable state，按当前 asset view 规范处理
- 不新增新 scope / lens

## 7.3 Asset inspector / dock 增强

修改：

```text
AssetInspectorPane.tsx
AssetBottomDock.tsx
AssetDockContainer.tsx
useAssetWorkbenchActivity.ts（如需记录 view 切换）
```

Inspector 增加轻量 `Context Policy` 摘要：

- status
- default visibility
- default budget
- activation rule count
- warning count

Dock Problems 增加：

- blocked policy
- no activation rules
- private / spoiler policy requires caution
- missing context policy

Activity 增加：

- entered context view
- focused policy asset

## 7.4 Run Artifact Inspector 增加 context activation panel

推荐新增：

```text
packages/renderer/src/features/run/components/RunContextAssetActivationList.tsx
```

然后修改：

```text
RunArtifactDetailSections.tsx
RunArtifactInspectorPanel.stories.tsx
RunArtifactInspectorPanel.test.tsx
```

在 context-packet artifact detail 中显示：

```text
Activation Summary
Included Assets
Excluded Assets
Redacted Assets
Target Agents
```

每条 activation 至少显示：

- asset title
- asset kind
- decision badge：included / excluded / redacted
- reason label
- visibility
- budget
- target agents
- source refs（如果有）

### Handoff

每条 asset activation 支持次级动作：

```text
Open asset context
```

行为：

```ts
replaceRoute({
  scope: 'asset',
  assetId,
  lens: 'knowledge',
  view: 'context',
})
```

如果现有 `RunArtifactDetailSections` 不方便直接拿 `replaceRoute`，可以先暴露：

```ts
onOpenAssetContext?: (assetId: string) => void
```

由 `SceneDockContainer` 或上层接入。

## 7.5 Scene Dock 接线

当前 `SceneDockContainer` 已经集中管理 events / artifacts / selected artifact / trace / review gate / variants。

PR28 只需最小接入：

- artifact inspector 传入 `onOpenAssetContext`
- 不把 asset context policy state 放进 SceneDockContainer
- 不让 Scene Dock 持有 asset selection 第二真源

---

## 8. 建议文件改动

### 8.1 API package

```text
packages/api/src/contracts/api-records.ts
packages/api/src/repositories/**
packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.ts
packages/api/src/orchestration/sceneRun/sceneRunArtifactDetails.test.ts
packages/api/src/createServer.run-artifacts.test.ts
packages/api/src/createServer.unified-errors.test.ts（如需要补 malformed/404 边界）
```

### 8.2 Renderer asset feature

```text
packages/renderer/src/features/workbench/types/workbench-route.ts
packages/renderer/src/features/workbench/hooks/useWorkbenchRouteState.ts
packages/renderer/src/features/asset/api/asset-records.ts
packages/renderer/src/features/asset/types/asset-view-models.ts
packages/renderer/src/features/asset/hooks/useAssetKnowledgeWorkspaceQuery.ts
packages/renderer/src/features/asset/components/AssetKnowledgeStage.tsx
packages/renderer/src/features/asset/components/AssetContextPolicyView.tsx
packages/renderer/src/features/asset/components/AssetContextPolicyView.test.tsx
packages/renderer/src/features/asset/components/AssetContextPolicyView.stories.tsx
packages/renderer/src/features/asset/components/AssetInspectorPane.tsx
packages/renderer/src/features/asset/components/AssetBottomDock.tsx
packages/renderer/src/features/asset/containers/AssetKnowledgeWorkspace.tsx
```

### 8.3 Renderer run / scene feature

```text
packages/renderer/src/features/run/api/run-artifact-records.ts
packages/renderer/src/features/run/components/RunContextAssetActivationList.tsx
packages/renderer/src/features/run/components/RunContextAssetActivationList.test.tsx
packages/renderer/src/features/run/components/RunContextAssetActivationList.stories.tsx
packages/renderer/src/features/run/components/RunArtifactDetailSections.tsx
packages/renderer/src/features/run/components/RunArtifactInspectorPanel.tsx
packages/renderer/src/features/run/components/RunArtifactInspectorPanel.test.tsx
packages/renderer/src/features/run/components/RunArtifactInspectorPanel.stories.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.test.tsx
```

### 8.4 Docs

```text
doc/api-contract.md
doc/PR28-asset-context-policy-execution-plan.md
README.md（只在需要更新 current status 时最小补充）
```

---

## 9. 测试计划

### 9.1 API contract / fixture tests

至少覆盖：

1. `GET /api/projects/book-signal-arc/assets/asset-ren-voss/knowledge` 返回 `contextPolicy`。
2. asset workspace `viewsMeta.availableViews` 包含 `context`。
3. context policy 能表达 visibility / budget / activation rules / exclusions。
4. 没有 policy 的 asset 返回可降级空态，不抛 500。
5. context-packet artifact detail 返回 `assetActivations` 与 `activationSummary`。
6. `context_packet_built` event 仍只带轻量 refs/metadata，不内联 asset activation 大 payload。
7. PR27 selected variants 的 API tests 不退化。

### 9.2 Renderer route tests

至少覆盖：

1. `scope='asset'&view='context'` 可以被读写。
2. 非法 asset view fallback 仍按现有规则处理。
3. scene/chapter/book dormant snapshot 不受新增 asset view 影响。

### 9.3 Renderer query / mapper tests

至少覆盖：

1. `useAssetKnowledgeWorkspaceQuery` 能把 `contextPolicy` 映射进 view-model。
2. policy 缺失时提供 quiet empty state 所需数据。
3. inspector / dock summary 的 warning count / activation rule count 派生正确。

### 9.4 Component tests

#### `AssetContextPolicyView.test.tsx`

覆盖：

- summary / activation rules / visibility / budget / agents 正确渲染
- exclusions / warnings 正确渲染
- no-policy empty state 正确渲染

#### `AssetKnowledgeStage.test.tsx`

覆盖：

- context tab 出现并可切换
- 切换 view 调用 `onSelectView('context')`

#### `RunContextAssetActivationList.test.tsx`

覆盖：

- included / excluded / redacted 分组或 badge 正确显示
- reason / visibility / budget / target agents 正确显示
- `Open asset context` 可触发

#### `RunArtifactInspectorPanel.test.tsx`

覆盖：

- context-packet artifact 显示 activation summary
- asset activation list 能渲染
- proposal-set / canon-patch / prose-draft 现有渲染不退化

### 9.5 Integration / smoke tests

#### `AssetKnowledgeWorkspace.test.tsx`

```text
打开 ?scope=asset&id=asset-ren-voss&lens=knowledge&view=context
-> navigator / stage / inspector / dock 同步指向 Ren
-> context policy 渲染 activation rules
-> 切到 mentions 再切回 context
-> URL view 恢复为 context
```

#### `SceneDockContainer.test.tsx`

```text
打开 Scene / Orchestrate events dock
-> 选择 context-packet artifact
-> artifact inspector 显示 included/excluded/redacted asset activations
-> 点击 Open asset context
-> replaceRoute 进入 Asset / Knowledge / Context
-> browser back 回到 Scene Dock artifact inspector
```

#### `App.test.tsx` 推荐 smoke

```text
scene orchestrate snapshot
-> context-packet artifact opens asset context
-> back
-> scene lens/tab/dock snapshot 不丢
```

---

## 10. Storybook 要求

新增或更新：

```text
AssetContextPolicyView.stories.tsx
AssetKnowledgeWorkspace.stories.tsx（新增 ContextPolicy / MissingPolicy story）
RunContextAssetActivationList.stories.tsx
RunArtifactInspectorPanel.stories.tsx（新增 ContextPacketWithActivations）
SceneDockContainer.stories.tsx（新增 ContextPacketActivationTrace）
```

最少 story 组合：

- `AssetContextPolicyActive`
- `AssetContextPolicyBlocked`
- `AssetContextPolicyMissing`
- `ContextPacketActivationTrace`
- `ContextPacketRedactedAssets`

---

## 11. 实施顺序（给 AI 的执行顺序）

### Step 1：先扩 API / renderer 共享 record 类型

- 在 API contract 中新增 asset context policy 与 context activation record。
- 在 renderer run / asset record 中同步类型。
- 不先写 UI。

### Step 2：补 fixture seed

- asset knowledge fixture 增加 `contextPolicy`。
- context-packet artifact fixture 增加 `assetActivations` 和 `activationSummary`。
- 保持 events 轻量，只记录 refs / counts。

### Step 3：补 API tests

- asset knowledge context policy test。
- context-packet artifact activation test。
- event payload 轻量性 test。

### Step 4：扩 asset route/view

- `AssetKnowledgeView` 增加 `context`。
- `useWorkbenchRouteState` 增加合法 view。
- 补 route tests。

### Step 5：实现 Asset Context UI

- `AssetContextPolicyView.tsx`
- 接入 `AssetKnowledgeStage.tsx`
- 增强 inspector / dock summary
- 补组件 tests / stories

### Step 6：实现 Run Context Activation UI

- `RunContextAssetActivationList.tsx`
- 接入 `RunArtifactDetailSections.tsx`
- 接入 `RunArtifactInspectorPanel.tsx`
- 保持 proposal variants UI 不退化

### Step 7：Scene Dock handoff

- 给 artifact inspector 增加 `onOpenAssetContext`
- 在 `SceneDockContainer` 中接到 `replaceRoute({ scope: 'asset', view: 'context' })`
- 补 integration smoke

### Step 8：文档与最终回归

- 更新 `doc/api-contract.md`
- 新增 `doc/PR28-asset-context-policy-execution-plan.md`
- 跑：

```bash
pnpm typecheck
pnpm test
pnpm --filter @narrative-novel/renderer build-storybook
```

---

## 12. 完成后的验收标准

满足以下条件，PR28 就算完成：

1. Asset knowledge record / view-model 支持 read-only `contextPolicy`。
2. Asset / Knowledge 增加 `context` view，且 route-first 恢复成立。
3. Asset context policy 能显示 activation rules、visibility、budget、target agents、exclusions、warnings。
4. Context-packet artifact detail 能显示 included / excluded / redacted asset activations。
5. Run event 仍只携带轻量 refs / metadata，不内联 activation 大 payload。
6. Scene Dock 可以从 context activation 打开 Asset / Knowledge / Context，并可 browser back 恢复 Scene Dock。
7. PR27 proposal variants review flow 不被破坏。
8. API package 与 renderer package 的 record 类型同步。
9. Storybook 覆盖 asset context policy 和 context packet activation trace。
10. PR28 不包含真实 LLM、Temporal、SSE、RAG、policy mutation、prompt editor、branch / publish。

---

## 13. PR28 结束时不要留下的债

以下情况都算 PR 做偏了：

- 把 asset context policy 做成 prompt editor。
- 把 WorldInfo / Lorebook 关键词触发引擎塞进来。
- 把完整 prompt / context packet 放进 run event。
- 为 selected activation 新增 route 参数或全局 store。
- 在 Scene Dock 中维护 asset selection 第二真源。
- context packet artifact 复制整份 asset profile，而不是保存轻量 activation trace。
- 为 policy 增加 mutation endpoint。
- 为 PR28 顺手做真实 LLM context builder。
- 破坏 PR27 selected variants 随 review decision 提交的链路。

PR28 做完后的正确项目状态应该是：

**系统已经能解释“资产如何被允许进入上下文”以及“某次 run 实际如何装配资产上下文”，但仍保持 read-heavy、route-first、artifact-detail-first 的纪律。**

---

## 14. PR29 以后建议路线（只保留，不在本轮实施）

### PR29：Context Packet Preview / Prompt Section Inspector

在 PR28 的 activation trace 之上，增加更完整的 context packet read surface：

- prompt sections
- included canon facts
- output schema
- budget summary
- agent role packet

仍然不做 prompt editor。

### PR30：Asset Context Policy Mutation

等 read surface 成立后，再做 policy 的最小写路径：

- toggle rule active / limited
- update default visibility / budget
- action-scoped optimistic rollback

### PR31：Domain-safe Recipes

把 “rebuild context packet / run continuity check / generate missing draft / review trace gap” 做成 typed command，不开放自由脚本语言。

---

## 15. 给 AI 的最终一句话指令

在当前 `codex/pr27-proposal-variants-reviewable-alternatives` 已经完成 PR27 的前提下，不要继续抛光 variants，也不要提前做真实 LLM / Temporal / prompt manager；先只围绕 **Asset Context Policy / Context Activation Trace Foundation** 做一轮窄而实的实现：

- 给 Asset knowledge 增加 read-only `contextPolicy`
- 给 Asset / Knowledge 增加 `context` view
- 给 context-packet artifact detail 增加 included / excluded / redacted asset activation trace
- 保持 run events 只携带轻量 refs / metadata
- 在 Run Artifact Inspector 中显示 context activation summary 和 asset activation list
- 支持从 context activation 打开 Asset / Knowledge / Context
- 继续使用 route 作为 asset view 与 selected asset 的唯一真源
- 不新增 policy mutation、prompt editor、RAG、SSE、Temporal 或真实 LLM
- 用 API tests、renderer tests、Storybook 和 app smoke 固定 route 恢复、event 轻量性、artifact detail 展示与 PR27 variants 不退化这几条硬约束
