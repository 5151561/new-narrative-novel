# PR27 执行文档：Proposal Variants / Reviewable Alternatives Foundation

> 基于 `codex/pr26-run-artifact-trace-inspector` 当前代码状态。  
> 本文档目标是可以直接交给 AI agent 执行，不是路线图回顾，也不是大而全 wishlist。

---

## 0. PR27 一句话目标

在 PR26 已经完成 **Run Artifact / Trace Inspector** 的前提下，PR27 不继续扩 Run 调试面板，也不提前做 branch / publish / full workflow backend，而是做一轮窄而实的：

**Proposal Variants / Reviewable Alternatives Foundation**

也就是让一次 `proposal-set` 不再只能承载一组平铺 proposal，而是可以表达同一叙事变更的多个可审阅候选版本。用户可以在 Run Artifact Inspector / Review Gate 中比较并选择 variant，最终提交 review decision 时把选择带入 run review contract。

核心纪律：

```text
variant 可以被比较和选择
variant 不直接进入 canon
只有 review decision 接受后的 selected variant 才能成为 canon patch 的来源
```

---

## 1. 当前代码基线判断

PR26 已经完成了很重要的一段基础设施，不应在 PR27 回头重做。

### 1.1 当前分支与整体结构

当前活跃分支是：

```text
codex/pr26-run-artifact-trace-inspector
```

当前项目已经不再只是 renderer 原型，仓库里已经有：

```text
packages/api
packages/renderer
```

renderer feature 目录已经包含：

```text
asset
book
chapter
review
run
scene
traceability
workbench
```

这意味着 PR27 的工作应该建立在已有 `run` feature 与 `api` contract 之上，而不是新增一个脱离 workbench 的 variants 页面。

### 1.2 PR26 已完成的核心能力

PR26 / BE-PR3 已经把以下能力接上：

- API 侧 read surfaces：
  - `GET /projects/:projectId/runs/:runId/artifacts`
  - `GET /projects/:projectId/runs/:runId/artifacts/:artifactId`
  - `GET /projects/:projectId/runs/:runId/trace`
- renderer 侧 runtime contract：
  - `listRunArtifacts(...)`
  - `getRunArtifact(...)`
  - `getRunTrace(...)`
- renderer 侧 UI：
  - `RunArtifactInspectorPanel`
  - `RunArtifactDetailSections`
  - `RunArtifactRefList`
  - `RunTracePanel`
  - `RunEventInspectorPanel`
- Scene Dock 已经可以在 run events / artifacts / trace 之间切换，并显示 selected artifact detail。

因此，PR27 不应该再做“artifact inspector 基础搭建”。这部分已经成立。

### 1.3 当前 proposal-set 的真实缺口

当前 `proposal-set` artifact 已经存在，但它表达的是一组平铺的 proposals：

```ts
ProposalSetArtifactDetailRecord {
  kind: 'proposal-set'
  reviewId: string
  sourceInvocationIds: string[]
  proposals: ProposalSetArtifactProposalRecord[]
  reviewOptions: string[]
}
```

当前 `ProposalSetArtifactProposalRecord` 大致是：

```ts
{
  id: string
  title: LocalizedText
  summary: LocalizedText
  changeKind: LocalizedText
  riskLabel: LocalizedText
  relatedAssets: RunRelatedAssetRecord[]
}
```

也就是说，当前系统能说：

```text
这次 run 生成了哪些 proposal
```

但还不能表达：

```text
同一个 proposal 可以有 A / B / C 三种候选处理方式
用户选择了哪一个 variant
这个选择如何进入 review decision 和后续 canon patch
```

这正是 PR27 要补的缝。

---

## 2. 为什么 PR27 应该做 Proposal Variants

PR26 已经把 Context Packet / Artifact / Trace 的可见性打通了。下一步最有价值的不是继续加调试信息，而是让 **review gate 的创作试错能力** 成立。

### 2.1 这符合项目定位

项目的核心不是 chat-first 续写，而是：

```text
constraint -> proposal -> review -> accepted canon -> prose
```

所以 variants 不能直接变成 prose swipe，也不能直接写入 canon。它们应该存在于 proposal review 层，成为可审阅、可比较、可选择的候选变更。

### 2.2 这承接 PR26 的 artifact inspector

PR26 已经能展示 artifact detail 和 trace。PR27 应该顺势让 `proposal-set` artifact detail 从“只读说明”升级为“可选择候选版本的 review support surface”。

### 2.3 这为后续 Branch / Experiment 打基础，但不提前做 Branch

Proposal Variants 是比 Branch 更小的创作试错单位：

```text
proposal-set 内部的候选版本
```

它不需要完整 manuscript branch，不需要 checkpoint，不需要 merge。它只需要：

- fixture / contract 能表达 variants
- UI 能显示和选择 variants
- review decision 能带上 selected variants
- trace / canon patch 能显示所采纳 variant 的来源

---

## 3. PR27 明确不做

以下内容不要混进 PR27：

- 不做 manuscript branch / experiment branch
- 不做 book compare / publish / export
- 不做 prose swipe
- 不做 AI regenerate variant 的真实后端
- 不做真实 LLM 调用
- 不做 Temporal / workflow runtime 改造
- 不做 full diff editor
- 不做 scene/chapter/book cache 大范围 patch
- 不做 asset context policy
- 不做 prompt manager / context packet editor
- 不做 route 级 selected variant 参数
- 不做全局 rail / workbench 重构
- 不把 variants 做成 canon mutation 入口

PR27 只做：

```text
proposal-set artifact variants contract
+ renderer variant comparison / selection UI
+ review decision selectedVariants payload
+ mock/API contract tests
```

---

## 4. 必须遵守的硬约束

### 4.1 Route 不新增 variant 状态

不要在 workbench route 中加入：

```text
variantId
proposalId
selectedVariantId
```

variant selection 是 run review 的局部 UI draft state，不是全局定位状态。

### 4.2 Review decision 才是 variant 进入后续链路的入口

variant 选择不能直接写 canon。正确链路是：

```text
proposal-set artifact
-> user selects variants
-> submit review decision with selectedVariants
-> mock/api records review decision
-> canon patch / trace detail can reference selected variant
```

### 4.3 保持 proposal-set 向后兼容

已有 `proposals` 不要直接删除。第一版应该扩展现有 proposal record，让没有 variants 的旧 fixture 仍能正常显示。

推荐：

```ts
ProposalSetArtifactProposalRecord {
  ...existingFields
  variants?: ProposalVariantRecord[]
  defaultVariantId?: string
  selectedVariantId?: string
}
```

没有 `variants` 时 UI 继续按 PR26 的只读 proposal 方式显示。

### 4.4 不把 selected variant 存成第二个 run 真源

允许在 renderer 里有局部 draft state，例如：

```text
runId + proposalSetArtifactId -> { proposalId -> variantId }
```

但它只能服务于当前 review UI，不能成为新的 run state 真源。提交 review decision 后，真实来源应以 API/mock store 中的 review decision 为准。

### 4.5 Trace 只做最小增强

PR27 可以让 trace / artifact detail 显示：

```text
accepted variant
source proposal
selected rationale
```

但不要做完整 variant graph，不要引入复杂 trace node navigation。

---

## 5. 数据合同设计

### 5.1 新增 proposal variant 类型

建议在 API contract 与 renderer run records 中新增：

```ts
export interface ProposalVariantRecord {
  id: string
  label: LocalizedText
  summary: LocalizedText
  rationale: LocalizedText
  tradeoffLabel?: LocalizedText
  riskLabel?: LocalizedText
  relatedAssets?: RunRelatedAssetRecord[]
}
```

字段说明：

- `id`：稳定 variant id，例如 `variant-midnight-platform-raise-conflict`
- `label`：短标签，例如 `Higher conflict`
- `summary`：这个候选版本实际做什么
- `rationale`：为什么值得考虑
- `tradeoffLabel`：代价或取舍，例如 `slower prose transition`
- `riskLabel`：风险，例如 `Continuity risk: medium`
- `relatedAssets`：该 variant 特别影响的 asset

### 5.2 扩展 proposal record

在现有 `ProposalSetArtifactProposalRecord` 上新增：

```ts
variants?: ProposalVariantRecord[]
defaultVariantId?: string
selectedVariantId?: string
```

规则：

- `variants` 缺失或为空时，旧 UI 正常渲染 flat proposal。
- `defaultVariantId` 用于初始选择。
- `selectedVariantId` 只表示 mock fixture / 已提交 review 后的选中状态；用户本地选择仍由 UI draft 管理。

### 5.3 扩展 review decision input

当前 review decision input 已有：

```ts
runId
reviewId
decision
note?
patchId?
```

PR27 新增：

```ts
selectedVariants?: Array<{
  proposalId: string
  variantId: string
}>
```

完整建议：

```ts
export interface SubmitRunReviewDecisionInput {
  runId: string
  reviewId: string
  decision: RunReviewDecisionKind
  note?: string
  patchId?: string
  selectedVariants?: RunSelectedProposalVariantRecord[]
}

export interface RunSelectedProposalVariantRecord {
  proposalId: string
  variantId: string
}
```

### 5.4 扩展 review decision record / mock persistence

如果当前 mock db 已保存 review decision，需要同步保存：

```ts
selectedVariants?: RunSelectedProposalVariantRecord[]
```

并在 `review_decision_submitted` event 的 metadata 或 refs 中体现：

```ts
metadata?: {
  selectedVariantCount?: number
}
```

注意：不要把完整 variant 大 payload 塞进 event。event 只承载轻量摘要，详情仍来自 artifact ref。

### 5.5 可选：轻量扩展 trace node

如果现有 trace node 类型可以安全扩展，可以新增：

```ts
RunTraceNodeKind = ... | 'proposal-variant'
```

以及 relation：

```ts
RunTraceRelationKind = ... | 'variant_of' | 'selected_for_review'
```

但这一步是可选的。若改动过大，PR27 可以先只在 `proposal-set` artifact detail 中显示 variants，不必强行扩 trace graph。

---

## 6. Mock / fixture 改法

### 6.1 在至少一个 proposal-set artifact 中加入 variants

建议选择当前默认 scene run 的 proposal-set，为其中 1–2 个 proposal 增加 variants。

示例：

```ts
{
  id: 'proposal-platform-reveal-pressure',
  title: { en: 'Escalate the platform reveal', 'zh-CN': '提高站台揭示压力' },
  summary: { ... },
  changeKind: { ... },
  riskLabel: { ... },
  variants: [
    {
      id: 'variant-platform-reveal-direct',
      label: { en: 'Direct reveal', 'zh-CN': '直接揭示' },
      summary: { en: 'Let Mei state the ledger clue directly.', 'zh-CN': '让 Mei 直接说出账本线索。' },
      rationale: { en: 'Fastest path to canon clarity.', 'zh-CN': '最快建立 canon 清晰度。' },
      tradeoffLabel: { en: 'Less mystery', 'zh-CN': '神秘感下降' },
      riskLabel: { en: 'Low continuity risk', 'zh-CN': '低连续性风险' },
      relatedAssets: [...]
    },
    {
      id: 'variant-platform-reveal-indirect',
      label: { en: 'Indirect pressure', 'zh-CN': '间接施压' },
      summary: { en: 'Use the bell timing to imply the ledger clue.', 'zh-CN': '用铃声时机暗示账本线索。' },
      rationale: { en: 'Keeps prose tension while preserving traceability.', 'zh-CN': '保留正文张力，同时保持可追溯。' },
      tradeoffLabel: { en: 'Needs stronger assembly note', 'zh-CN': '需要更强的拼接提示' },
      riskLabel: { en: 'Medium assembly risk', 'zh-CN': '中等拼接风险' },
      relatedAssets: [...]
    }
  ],
  defaultVariantId: 'variant-platform-reveal-indirect'
}
```

### 6.2 mock review submit 要保留 selected variants

当 `submitRunReviewDecision(...)` 被调用时：

- 保存 decision
- 保存 selectedVariants
- 新增或更新 `review_decision_submitted` event 的轻量 metadata
- 如果 mock 中有 canon patch artifact，可让它显示 selected variant 摘要

不要为了 PR27 自动重算所有 canon facts。只需要让 mock artifact detail 能证明 selected variant 被带入链路。

---

## 7. Renderer UI 设计

### 7.1 新增 `RunProposalVariantSelector.tsx`

推荐新增：

```text
packages/renderer/src/features/run/components/RunProposalVariantSelector.tsx
```

职责：

- 渲染一个 proposal 的 variants
- 显示 label / summary / rationale / tradeoff / risk
- 支持选择一个 variant
- 当前选中 variant 有明确 selected state
- 没有 variants 时返回 `null` 或只显示 proposal summary

Props 建议：

```ts
interface RunProposalVariantSelectorProps {
  proposalId: string
  variants: ProposalVariantRecord[]
  selectedVariantId?: string | null
  defaultVariantId?: string | null
  onSelectVariant?: (proposalId: string, variantId: string) => void
}
```

### 7.2 新增 `RunProposalVariantSummary.tsx`（可选）

如果 `RunArtifactDetailSections.tsx` 已经偏大，建议抽一个 summary 组件：

```text
packages/renderer/src/features/run/components/RunProposalVariantSummary.tsx
```

职责：

- 在 artifact detail 中汇总当前 proposal-set 有多少 proposal 支持 variants
- 显示已选择 / 未选择状态
- 提醒“variants still require review decision”

### 7.3 修改 `RunArtifactDetailSections.tsx`

在 `proposal-set` detail 的每个 proposal 下渲染 variants：

- 若有 variants：显示 `RunProposalVariantSelector`
- 若没有 variants：保留当前 PR26 展示方式
- 不把 proposal-set detail 改成低密度表单页

### 7.4 修改 `RunArtifactInspectorPanel.tsx`

新增 props 以支持 variants draft：

```ts
selectedVariants?: Record<string, string>
onSelectProposalVariant?: (proposalId: string, variantId: string) => void
```

并把这两个 props 传给 detail sections。

### 7.5 修改 `RunReviewGate.tsx`

这是 PR27 的关键 UI 接线点。

当前 review gate 应该继续提供：

- accept
- accept with edit
- request rewrite
- reject

PR27 需要让它在提交 decision 时带上 selected variants。

推荐 props 增量：

```ts
selectedVariants?: Array<{ proposalId: string; variantId: string }>
variantSelectionSummary?: string
```

行为规则：

- 若 proposal-set 有 variants，Accept / Accept with edit 之前应该显示一个轻量 summary：
  - selected variant count
  - unselected variant count
- 若存在 variants 但某些 proposal 未选择，允许使用 default variant 自动补齐，或者在 UI 提示“default variant will be used”。
- 不要强制用户必须手动选择所有 variants，否则第一版体验会太重。

### 7.6 新增 `useRunProposalVariantDraft.ts`

推荐新增：

```text
packages/renderer/src/features/run/hooks/useRunProposalVariantDraft.ts
```

职责：

- 输入 active run id / selected proposal-set artifact
- 初始化每个 proposal 的 selected variant：
  - 优先 `proposal.selectedVariantId`
  - 其次 `proposal.defaultVariantId`
  - 再其次第一个 variant
- 暴露：
  - `selectedVariantsByProposalId`
  - `selectedVariantsForSubmit`
  - `selectVariant(proposalId, variantId)`
  - `reset()`
- 当 runId 或 proposalSetArtifactId 改变时自动 reset

注意：这是局部 UI draft hook，不是 route/store 真源。

### 7.7 接入 `SceneDockContainer.tsx`

当前 Scene Dock 已经集中管理：

- run events
- artifacts
- selected artifact
- trace
- inspector mode
- review gate

PR27 应在这里接入：

- active proposal-set artifact detail
- `useRunProposalVariantDraft(...)`
- 把 selected variants 传给 artifact inspector
- 把 selected variants 传给 review gate / submit decision mutation

不要把 variant state 分散到多个组件里。

---

## 8. API / Fake runtime 改法

### 8.1 修改 API contracts

需要同步修改：

```text
packages/api/src/contracts/run.ts
packages/renderer/src/features/run/api/run-records.ts
```

确保 API package 和 renderer package 的类型一致。

### 8.2 修改 mock/fake run db

查找并修改：

```text
packages/api/src/repositories/**
packages/api/src/orchestration/sceneRun/**
packages/renderer/src/features/run/api/mock-run-db.ts
```

目标：

- fixture proposal-set 有 variants
- submit review decision 接受 selectedVariants
- run event / artifact detail 能看到 selected variant 被记录

### 8.3 修改 run client

`run-client.ts` 的方法形状基本不变，只是 `submitRunReviewDecision(...)` input 类型扩展。

不要新增：

```ts
selectRunProposalVariant(...)
```

variant selection 应该随 review decision 一起提交，不要变成独立写接口。

---

## 9. 测试计划

### 9.1 Contract / type tests

至少覆盖：

1. `ProposalSetArtifactProposalRecord` 可以携带 variants。
2. `SubmitRunReviewDecisionInput` 可以携带 selectedVariants。
3. 没有 variants 的旧 proposal-set record 仍可通过类型/fixture。

### 9.2 Mock db / client tests

至少覆盖：

1. proposal-set artifact detail 返回 variants。
2. submit review decision 时 selectedVariants 被保存。
3. selectedVariants 不会被内联进 run event 大 payload。
4. selected variant 可以在后续 review/canon patch artifact detail 中被读到。

### 9.3 Component tests

#### `RunProposalVariantSelector.test.tsx`

覆盖：

- 渲染 variants label / summary / rationale / risk
- 默认 variant selected
- 点击 variant 调用 `onSelectVariant(proposalId, variantId)`
- selected state 正确

#### `RunArtifactDetailSections.test.tsx`

覆盖：

- proposal-set 有 variants 时显示 selector
- proposal-set 无 variants 时保留旧展示
- 多个 proposals 的 variants 独立显示

#### `RunReviewGate.test.tsx`

覆盖：

- accept decision 会携带 selectedVariants
- accept-with-edit decision 会携带 selectedVariants
- request-rewrite / reject 可以不携带或携带空 variants
- variants summary 显示正确

### 9.4 Hook tests

#### `useRunProposalVariantDraft.test.tsx`

覆盖：

1. 按 `selectedVariantId` 初始化。
2. 没有 selected 时按 `defaultVariantId` 初始化。
3. 没有 default 时按第一个 variant 初始化。
4. runId / proposalSetArtifactId 变化时 reset。
5. `selectedVariantsForSubmit` 输出稳定结构。

### 9.5 Scene Dock integration test

建议扩展现有 Scene Dock / Scene workspace 测试：

```text
打开 scene orchestrate
-> start / load mock run
-> 打开 Run Inspector 的 proposal-set artifact
-> 选择一个非默认 variant
-> 点击 Accept
-> submit review decision payload 包含 selectedVariants
-> dock events 中出现 review_decision_submitted
-> artifact/canon patch detail 能看到 selected variant summary
```

### 9.6 API route tests

如果 API 侧已经有 run flow / run artifact tests，新增或扩展：

```text
POST /reviews/:reviewId/decision with selectedVariants
-> 200
-> GET run events 不内联大 payload
-> GET artifact detail 可看到 selected variant reflected in review/canon patch fixture
```

---

## 10. Storybook 建议

新增或更新：

```text
RunProposalVariantSelector.stories.tsx
RunArtifactInspectorPanel.stories.tsx
RunReviewGate.stories.tsx
RunEventInspectorPanel.stories.tsx
```

最少 stories：

- `ProposalSetWithoutVariants`
- `ProposalSetWithTwoVariants`
- `MultipleVariantGroups`
- `SelectedVariantSubmitted`
- `HighRiskVariant`
- `QuietDefaultVariant`

---

## 11. 建议文件改动清单

### 11.1 必改

```text
packages/api/src/contracts/run.ts
packages/api/src/repositories/** 或相关 mock run store
packages/api/src/routes/run.ts 或 review decision route 所在文件
packages/api/src/test/**

packages/renderer/src/features/run/api/run-records.ts
packages/renderer/src/features/run/api/mock-run-db.ts
packages/renderer/src/features/run/api/run-client.ts
packages/renderer/src/features/run/components/RunArtifactDetailSections.tsx
packages/renderer/src/features/run/components/RunArtifactInspectorPanel.tsx
packages/renderer/src/features/run/components/RunReviewGate.tsx
packages/renderer/src/features/scene/containers/SceneDockContainer.tsx
```

### 11.2 推荐新增

```text
packages/renderer/src/features/run/components/RunProposalVariantSelector.tsx
packages/renderer/src/features/run/components/RunProposalVariantSelector.test.tsx
packages/renderer/src/features/run/hooks/useRunProposalVariantDraft.ts
packages/renderer/src/features/run/hooks/useRunProposalVariantDraft.test.tsx
```

### 11.3 可选新增

```text
packages/renderer/src/features/run/components/RunProposalVariantSummary.tsx
packages/renderer/src/features/run/components/RunProposalVariantSummary.test.tsx
```

### 11.4 这一轮尽量不动

```text
packages/renderer/src/features/workbench/**
packages/renderer/src/features/book/**
packages/renderer/src/features/chapter/**
packages/renderer/src/features/asset/**
packages/renderer/src/features/traceability/** 的核心 mapper / hook
packages/renderer/src/features/scene/components/ProposalReviewStack.tsx（除非只做极小文案/类型适配）
```

PR27 的重点在 run proposal-set artifact 与 run review decision，不是重做 scene proposal stack。

---

## 12. 实施顺序（给 AI agent 的执行步骤）

### Step 1：扩合同类型

- 在 API contract 与 renderer run records 中新增 `ProposalVariantRecord`。
- 扩展 `ProposalSetArtifactProposalRecord`。
- 扩展 `SubmitRunReviewDecisionInput`。
- 保持旧 proposal-set fixture 兼容。

### Step 2：更新 mock / fixture

- 给默认 proposal-set artifact 增加 1–2 个带 variants 的 proposal。
- 确保 fixture 有：
  - default variant
  - high-risk variant
  - indirect / direct tradeoff
- 修改 mock submit review decision 保存 selectedVariants。

### Step 3：先写 selector 组件

- 新增 `RunProposalVariantSelector.tsx`。
- 完成组件测试。
- 不急着接 Scene Dock。

### Step 4：接入 artifact detail

- 修改 `RunArtifactDetailSections.tsx`，在 proposal-set proposal 下显示 variants。
- 修改 `RunArtifactInspectorPanel.tsx`，把 selectedVariants / onSelectProposalVariant 传下去。

### Step 5：新增 variant draft hook

- 实现 `useRunProposalVariantDraft(...)`。
- 覆盖初始化 / reset / submit mapping。

### Step 6：接入 Scene Dock

- 在 `SceneDockContainer.tsx` 中根据 selected artifact detail 初始化 variant draft。
- 把 selected variant draft 传给 artifact inspector。
- 把 selected variant submit payload 传给 review gate / submit decision mutation。

### Step 7：增强 Review Gate

- 显示 selected variants summary。
- 提交 accept / accept-with-edit 时带 selectedVariants。
- request-rewrite / reject 保持现有行为。

### Step 8：补 API / renderer tests

- contract tests
- mock db/client tests
- selector/detail/review gate tests
- scene dock integration
- API route test

### Step 9：补 stories 与文案

- 给 variants 相关 UI 补 Storybook。
- 文案明确：variant 仍需 review，不能直接写入 canon。

---

## 13. 完成后的验收标准

满足以下条件，PR27 就算完成：

1. `proposal-set` artifact 可以表达 proposal variants。
2. 旧的无 variants proposal-set 仍能正常显示。
3. Run Artifact Inspector 能显示 variants，并支持选择。
4. variant 选择是局部 UI draft，不写入 route。
5. Review Gate 提交 accept / accept-with-edit 时能携带 selectedVariants。
6. mock/API review decision 能保存 selectedVariants。
7. Run events 不内联完整 variant payload，只用轻量 metadata / refs。
8. artifact detail 或 canon patch detail 能证明 selected variant 已进入 review/canon chain。
9. Scene Dock 的 events / artifact / trace 基础行为不被破坏。
10. PR27 不包含 branch / publish / prose swipe /真实 LLM regenerate / workflow engine 改造。

---

## 14. PR27 结束时不要留下的债

以下情况都算 PR 做偏：

- 为 variant 选择新增 route 参数。
- 为 variant 选择新增全局 selectedVariant store。
- 把 variants 做成 prose swipe，而不是 proposal alternative。
- 选择 variant 后直接写 canon，不经过 review decision。
- 删除旧 `proposals` 字段导致 PR26 artifact detail 断裂。
- 把完整 prompt / prose / variant payload 塞进 run event。
- 为 PR27 引入 branch / checkpoint / publish。
- 大规模重构 Scene proposal review stack。
- 大规模重构 workbench route 或 rail。

正确状态应该是：

```text
PR26 让 run artifact / trace 可见；
PR27 让 proposal-set 内的候选变更可比较、可选择、可随 review decision 进入后续 canon/prose 链路。
```

---

## 15. PR28+ 保留方向

PR27 完成后，再考虑：

### PR28：Asset Context Policy / Context Packet Inclusion Reasons

目标：让 asset 不只是 profile / mentions / relations，也能表达什么时候进入 agent context。

### PR29：Domain-safe Recipes

目标：把常见 run/review 操作做成 typed commands，而不是开放自由脚本。

### PR30：Experiment Branch Foundation

目标：在 proposal variants 与 manuscript checkpoint 都稳定后，再做 branch / selective adoption。

这些都不要提前塞进 PR27。

---

## 16. 给 AI agent 的最终一句话指令

在当前 `codex/pr26-run-artifact-trace-inspector` 已经完成 run artifact / trace inspector 的前提下，不要继续抛光 run 调试面板，也不要提前做 branch / publish / prose swipe；只围绕 **Proposal Variants / Reviewable Alternatives Foundation** 做一轮窄而实的实现：

- 扩展 `proposal-set` artifact，让 proposal 可携带 variants
- 保持旧 proposal-set 兼容
- 在 Run Artifact Inspector 中显示并选择 variants
- 用局部 draft hook 管理 selected variants，不写 route
- 扩展 review decision payload，accept / accept-with-edit 时提交 selectedVariants
- 让 mock/API 保存 selectedVariants，并在后续 artifact/canon patch detail 中可见
- 保持 run event 轻量，只通过 refs / metadata 指向详情
- 用测试固定 contract、variant selector、review submit、scene dock integration
- 明确不做 branch、publish、prose swipe、真实 LLM regenerate、workflow engine 改造
