import type {
  AgentInvocationArtifactDetailRecord,
  CanonPatchArtifactDetailRecord,
  ContextPacketArtifactDetailRecord,
  LocalizedTextRecord,
  ProposalSetArtifactDetailRecord,
  ProposalSetReviewOptionRecord,
  ProseDraftArtifactDetailRecord,
  RunFailureClass,
  RunFailureDetailRecord,
  RunArtifactGeneratedRefRecord,
  RunReviewDecisionKind,
  RunSelectedProposalVariantRecord,
  RunUsageRecord,
} from '../../contracts/api-records.js'
import {
  buildAgentInvocationId,
  buildCanonPatchId,
  buildContextPacketId,
  buildProseDraftId,
  buildProposalSetId,
  buildReviewId,
  buildTraceLinkId,
} from './sceneRunIds.js'
import type {
  SceneRunArtifactRecord,
  SceneRunCanonicalPlannerProposalRecord,
  SceneRunCanonicalPlannerVariantRecord,
} from './sceneRunRecords.js'
import {
  isSceneContextPacketRecord,
  type SceneContextPacketRecord,
} from '../contextBuilder/sceneContextBuilder.js'
import { parseSceneProseWriterOutput, type SceneProseWriterOutput } from '../modelGateway/sceneProseWriterOutputSchema.js'

interface ArtifactSummaryLabelOverrides {
  title?: LocalizedTextRecord
  summary?: LocalizedTextRecord
  statusLabel?: LocalizedTextRecord
  createdAtLabel?: LocalizedTextRecord
}

interface BuildArtifactDetailBaseInput {
  artifact: SceneRunArtifactRecord
  sourceEventIds: string[]
  labels?: ArtifactSummaryLabelOverrides
}

export interface BuildContextPacketDetailInput extends BuildArtifactDetailBaseInput {}

export interface BuildAgentInvocationDetailInput extends BuildArtifactDetailBaseInput {
  contextPacketId?: string
  generatedRefs?: RunArtifactGeneratedRefRecord[]
}

export interface BuildProposalSetDetailInput extends BuildArtifactDetailBaseInput {
  reviewId?: string
  sourceInvocationIds?: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
}

export interface BuildCanonPatchDetailInput extends BuildArtifactDetailBaseInput {
  decision: CanonPatchArtifactDetailRecord['decision']
  sourceProposalSetId?: string
  acceptedProposalIds?: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
  traceLinkIds?: string[]
}

export interface BuildProseDraftDetailInput extends BuildArtifactDetailBaseInput {
  sourceCanonPatchId?: string
  contextPacketId?: string
  sourceProposalIds?: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
  traceLinkIds?: string[]
}

const artifactStatusLabels = {
  built: localize('Built', '已构建'),
  completed: localize('Completed', '已完成'),
  failed: localize('Failed', '已失败'),
  ready: localize('Ready for review', '待审阅'),
  applied: localize('Applied', '已应用'),
  generated: localize('Generated', '已生成'),
} as const satisfies Record<string, LocalizedTextRecord>

function localize(en: string, zhCN = en): LocalizedTextRecord {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function padSequence(value: number) {
  return String(value).padStart(3, '0')
}

function parseSequenceLabel(id: string) {
  const match = id.match(/-(\d{3})(?:-\d{3})?$/)
  return match?.[1] ?? '000'
}

function parseSequenceNumber(id: string) {
  return Number.parseInt(parseSequenceLabel(id), 10) || 0
}

function parseRunSequenceNumber(runId: string) {
  const match = runId.match(/-(\d{3})$/)
  return Number.parseInt(match?.[1] ?? '0', 10) || 0
}

function parseEventOrderLabel(eventId?: string) {
  const match = eventId?.match(/-(\d{3})$/)
  return match?.[1] ?? '000'
}

function formatSceneName(sceneId: string) {
  return sceneId
    .replace(/^scene-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertArtifactKind<TKind extends SceneRunArtifactRecord['kind']>(
  artifact: SceneRunArtifactRecord,
  kind: TKind,
): asserts artifact is SceneRunArtifactRecord & { kind: TKind } {
  if (artifact.kind !== kind) {
    throw new Error(`Expected ${kind} artifact, received ${artifact.kind}.`)
  }
}

function localizeArtifactStatus(status?: string) {
  if (!status) {
    return localize('Available', '可用')
  }

  if (status in artifactStatusLabels) {
    return artifactStatusLabels[status as keyof typeof artifactStatusLabels]
  }

  return localize(status)
}

function buildDefaultTitle(artifact: SceneRunArtifactRecord): LocalizedTextRecord {
  switch (artifact.kind) {
    case 'context-packet':
      return localize('Scene context packet', '场景上下文包')
    case 'agent-invocation':
      return artifact.meta?.role === 'planner'
        ? localize('Planner invocation', '规划代理调用')
        : localize('Writer invocation', '写作代理调用')
    case 'proposal-set':
      return localize('Scene proposal set', '场景提案集')
    case 'canon-patch':
      return localize('Canon patch', '正典补丁')
    case 'prose-draft':
      return localize('Prose draft', '正文草稿')
  }
}

function buildDefaultSummary(artifact: SceneRunArtifactRecord): LocalizedTextRecord {
  const sceneName = formatSceneName(artifact.sceneId)
  const sequenceLabel = parseSequenceLabel(artifact.id)
  const gatewayProvenance = artifact.kind === 'agent-invocation' || artifact.kind === 'prose-draft'
    ? readGatewayProvenance(artifact)
    : undefined
  const failureDetail = artifact.kind === 'agent-invocation' || artifact.kind === 'proposal-set' || artifact.kind === 'prose-draft'
    ? readFailureDetail(artifact)
    : undefined

  switch (artifact.kind) {
    case 'context-packet':
      return localize(
        `Packed context for ${sceneName} run ${sequenceLabel}.`,
        `已为 ${sceneName} 的第 ${sequenceLabel} 次运行整理上下文。`,
      )
    case 'agent-invocation':
      if (failureDetail) {
        return artifact.meta?.role === 'planner'
          ? localize(
              `Planner invocation failed for ${sceneName}.`,
              `${sceneName} 的规划调用失败。`,
            )
          : localize(
              `Writer invocation failed for ${sceneName}.`,
              `${sceneName} 的写作调用失败。`,
            )
      }

      return artifact.meta?.role === 'planner'
        ? localize(
            gatewayProvenance?.fallbackReason
              ? `Fallback planner output is ready for ${sceneName}.`
              : `Planner output is ready for ${sceneName}.`,
            gatewayProvenance?.fallbackReason
              ? `面向 ${sceneName} 的回退规划输出已就绪。`
              : `面向 ${sceneName} 的规划输出已就绪。`,
          )
        : gatewayProvenance?.provider === 'openai-compatible'
          ? localize(
              `Writer output is ready for ${sceneName}.`,
              `面向 ${sceneName} 的写作输出已就绪。`,
            )
          : gatewayProvenance?.fallbackReason
            ? localize(
                `Fallback writer output is ready for ${sceneName}.`,
                `面向 ${sceneName} 的回退写作输出已就绪。`,
              )
            : localize(
                `Writer fixture output is ready for ${sceneName}.`,
                `面向 ${sceneName} 的写作 fixture 输出已就绪。`,
              )
    case 'proposal-set':
      return localize(
        `Proposal candidates for ${sceneName} are ready for review.`,
        `${sceneName} 的提案候选已可进入审阅。`,
      )
    case 'canon-patch':
      return localize(
        `Accepted proposal changes were compiled into canon for ${sceneName}.`,
        `已将 ${sceneName} 的获批提案变更编译进正典。`,
      )
    case 'prose-draft':
      return buildProseDraftSummary(sceneName, gatewayProvenance)
  }
}

function buildSelectedVariantBodyLine(selectedVariant: RunSelectedProposalVariantRecord, index: number): LocalizedTextRecord {
  const variantLabel = selectedVariant.variantId
    .replace(`${selectedVariant.proposalId}-variant-`, '')
    .split('-')
    .filter(Boolean)
    .join(' ')
  const displayIndex = index + 1

  return localize(
    `Selected variant ${displayIndex} (${variantLabel}) shapes the beat by preserving its proposed effect, with rationale retained from ${selectedVariant.variantId}.`,
    `已选变体 ${displayIndex}（${variantLabel}）按其提案效果塑造节拍，并保留来自 ${selectedVariant.variantId} 的理由。`,
  )
}

function buildProseDraftBody(input: {
  sceneName: string
  sourceProposalIds: string[]
  selectedVariants?: RunSelectedProposalVariantRecord[]
}): LocalizedTextRecord {
  const acceptedProposalLine = input.sourceProposalIds.length > 0
    ? `Accepted proposal ${input.sourceProposalIds.join(', ')} anchors the draft.`
    : 'The default accepted proposal anchors the draft.'
  const acceptedProposalLineZh = input.sourceProposalIds.length > 0
    ? `已接受提案 ${input.sourceProposalIds.join(', ')} 成为正文锚点。`
    : '默认接受提案成为正文锚点。'
  const variantLines = input.selectedVariants?.map(buildSelectedVariantBodyLine) ?? []
  const selectedVariantLine = variantLines.length > 0
    ? variantLines.map((line) => line.en).join(' ')
    : 'No selected proposal variant was submitted, so the draft follows the default accepted proposal path.'
  const selectedVariantLineZh = variantLines.length > 0
    ? variantLines.map((line) => line['zh-CN']).join(' ')
    : '未提交已选提案变体，因此正文沿用默认接受提案路径。'

  return localize(
    `${input.sceneName} opens from the accepted run artifact rather than a hard-coded scene field. ${acceptedProposalLine} ${selectedVariantLine} The scene resolves into generated prose that can be traced back to the canon patch.`,
    `${input.sceneName} 从已接受的运行 artifact 展开，而不是直接写死在 scene 字段里。${acceptedProposalLineZh}${selectedVariantLineZh} 该场景生成的正文可以追溯回正典补丁。`,
  )
}

function buildDefaultCreatedAtLabel(sourceEventIds: string[]) {
  const orderLabel = parseEventOrderLabel(sourceEventIds[0])
  return localize(`Linked event ${orderLabel}`, `关联事件 ${orderLabel}`)
}

function buildArtifactSummary(input: BuildArtifactDetailBaseInput) {
  const failureDetail = readFailureDetail(input.artifact)
  const effectiveStatus = failureDetail ? 'failed' : input.artifact.status

  return {
    id: input.artifact.id,
    runId: input.artifact.runId,
    kind: input.artifact.kind,
    title: input.labels?.title ?? buildDefaultTitle(input.artifact),
    summary: input.labels?.summary ?? buildDefaultSummary(input.artifact),
    statusLabel: input.labels?.statusLabel ?? localizeArtifactStatus(effectiveStatus),
    createdAtLabel: input.labels?.createdAtLabel ?? buildDefaultCreatedAtLabel(input.sourceEventIds),
    sourceEventIds: [...input.sourceEventIds],
    ...(readUsage(input.artifact) ? { usage: readUsage(input.artifact) } : {}),
  }
}

function isRunFailureClass(value: unknown): value is RunFailureClass {
  return value === 'provider_error'
    || value === 'model_timeout'
    || value === 'invalid_output'
    || value === 'cancelled'
    || value === 'unknown'
}

function readUsage(artifact: SceneRunArtifactRecord): RunUsageRecord | undefined {
  const usage = artifact.meta?.usage
  if (!isRecord(usage)) {
    return undefined
  }

  const inputTokens = usage.inputTokens
  const outputTokens = usage.outputTokens
  const estimatedCostUsd = usage.estimatedCostUsd
  const actualCostUsd = usage.actualCostUsd
  const provider = usage.provider
  const modelId = usage.modelId
  const projectMode = usage.projectMode
  const fallbackUsed = usage.fallbackUsed

  if (
    typeof inputTokens !== 'number'
    || typeof outputTokens !== 'number'
    || typeof estimatedCostUsd !== 'number'
    || typeof provider !== 'string'
    || typeof modelId !== 'string'
    || (projectMode !== undefined && projectMode !== 'demo-fixture' && projectMode !== 'real-project')
    || (fallbackUsed !== undefined && typeof fallbackUsed !== 'boolean')
  ) {
    return undefined
  }

  return {
    inputTokens,
    outputTokens,
    estimatedCostUsd,
    ...(typeof actualCostUsd === 'number' ? { actualCostUsd } : {}),
    provider,
    modelId,
    ...(projectMode ? { projectMode } : {}),
    ...(typeof fallbackUsed === 'boolean' ? { fallbackUsed } : {}),
  }
}

function readFailureDetail(artifact: SceneRunArtifactRecord): RunFailureDetailRecord | undefined {
  const failureDetail = artifact.meta?.failureDetail
  if (!isRecord(failureDetail)) {
    return undefined
  }

  const failureClass = failureDetail.failureClass
  const message = failureDetail.message
  const retryable = failureDetail.retryable
  const sourceEventIds = failureDetail.sourceEventIds
  const provider = failureDetail.provider
  const modelId = failureDetail.modelId
  const projectMode = failureDetail.projectMode
  const fallbackUsed = failureDetail.fallbackUsed
  const normalizedSourceEventIds = Array.isArray(sourceEventIds)
    ? sourceEventIds.filter((sourceEventId): sourceEventId is string => typeof sourceEventId === 'string')
    : []

  if (
    !isRunFailureClass(failureClass)
    || typeof message !== 'string'
    || typeof retryable !== 'boolean'
    || !Array.isArray(sourceEventIds)
    || normalizedSourceEventIds.length !== sourceEventIds.length
    || (projectMode !== undefined && projectMode !== 'demo-fixture' && projectMode !== 'real-project')
    || (fallbackUsed !== undefined && typeof fallbackUsed !== 'boolean')
  ) {
    return undefined
  }

  return {
    failureClass,
    message,
    ...(typeof provider === 'string' ? { provider } : {}),
    ...(typeof modelId === 'string' ? { modelId } : {}),
    ...(projectMode ? { projectMode } : {}),
    ...(typeof fallbackUsed === 'boolean' ? { fallbackUsed } : {}),
    retryable,
    sourceEventIds: normalizedSourceEventIds,
  }
}

function readGatewayProvenance(artifact: SceneRunArtifactRecord) {
  const provenance = artifact.meta?.provenance
  if (!isRecord(provenance)) {
    return undefined
  }

  const provider = provenance.provider
  const providerId = provenance.providerId
  const providerLabel = provenance.providerLabel
  const modelId = provenance.modelId
  const projectMode = provenance.projectMode
  const fallbackUsed = provenance.fallbackUsed
  const fallbackReason = provenance.fallbackReason
  if (
    (provider !== 'fixture' && provider !== 'openai-compatible')
    || typeof modelId !== 'string'
    || (projectMode !== 'demo-fixture' && projectMode !== 'real-project')
    || typeof fallbackUsed !== 'boolean'
  ) {
    return undefined
  }

  if (provider === 'openai-compatible' && (typeof providerId !== 'string' || typeof providerLabel !== 'string')) {
    return undefined
  }

  if (
    fallbackReason !== undefined
    && fallbackReason !== 'missing-config'
    && fallbackReason !== 'provider-error'
    && fallbackReason !== 'invalid-output'
  ) {
    return undefined
  }

  return {
    provider,
    ...(provider === 'openai-compatible' ? { providerId, providerLabel } : {}),
    modelId,
    projectMode,
    fallbackUsed,
    ...(fallbackReason ? { fallbackReason } : {}),
  }
}

function readGeneratedRefs(artifact: SceneRunArtifactRecord): RunArtifactGeneratedRefRecord[] | undefined {
  const generatedRefs = artifact.meta?.generatedRefs
  if (!Array.isArray(generatedRefs)) {
    return undefined
  }

  return generatedRefs.every((ref) => (
    isRecord(ref)
    && (ref.kind === 'proposal-set' || ref.kind === 'artifact')
    && typeof ref.id === 'string'
    && isRecord(ref.label)
    && typeof ref.label.en === 'string'
    && typeof ref.label['zh-CN'] === 'string'
  ))
    ? generatedRefs as unknown as RunArtifactGeneratedRefRecord[]
    : undefined
}

function readSceneProseWriterOutput(artifact: SceneRunArtifactRecord): SceneProseWriterOutput | undefined {
  const output = artifact.meta?.output
  if (!isRecord(output)) {
    return undefined
  }

  try {
    return parseSceneProseWriterOutput(output)
  } catch {
    return undefined
  }
}

function readSceneContextPacket(artifact: SceneRunArtifactRecord): SceneContextPacketRecord | undefined {
  const packet = artifact.meta?.contextPacket
  return isSceneContextPacketRecord(packet) ? packet : undefined
}

function readAgentRole(artifact: SceneRunArtifactRecord): AgentInvocationArtifactDetailRecord['agentRole'] {
  const role = artifact.meta?.role

  if (role === 'planner') {
    return 'scene-planner'
  }

  if (role === 'writer') {
    return 'scene-writer'
  }

  throw new Error(`Agent invocation artifact ${artifact.id} is missing a supported role.`)
}

function buildLeadAsset(sceneId: string, sceneName: string) {
  return {
    assetId: `asset-${sceneId}-lead`,
    label: localize(`${sceneName} lead`, `${sceneName} 主角`),
    kind: 'character' as const,
  }
}

function buildSettingAsset(sceneId: string, sceneName: string) {
  return {
    assetId: `asset-${sceneId}-setting`,
    label: localize(`${sceneName} setting`, `${sceneName} 场景地点`),
    kind: 'location' as const,
  }
}

function isCanonicalPlannerVariant(value: unknown): value is SceneRunCanonicalPlannerVariantRecord {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === 'string'
    && typeof value.label === 'string'
    && typeof value.summary === 'string'
    && typeof value.rationale === 'string'
    && (value.tradeoffLabel === undefined || typeof value.tradeoffLabel === 'string')
    && (value.riskLabel === undefined || typeof value.riskLabel === 'string')
}

function isCanonicalPlannerProposal(value: unknown): value is SceneRunCanonicalPlannerProposalRecord {
  if (!isRecord(value)) {
    return false
  }

  return typeof value.id === 'string'
    && typeof value.title === 'string'
    && typeof value.summary === 'string'
    && (
      value.changeKind === 'action'
      || value.changeKind === 'reveal'
      || value.changeKind === 'state-change'
      || value.changeKind === 'continuity-note'
    )
    && typeof value.riskLabel === 'string'
    && (value.variants === undefined || (Array.isArray(value.variants) && value.variants.every(isCanonicalPlannerVariant)))
}

function readCanonicalPlannerProposals(artifact: SceneRunArtifactRecord): SceneRunCanonicalPlannerProposalRecord[] | undefined {
  const proposals = artifact.meta?.proposals
  return Array.isArray(proposals) && proposals.every(isCanonicalPlannerProposal)
    ? proposals
    : undefined
}

function buildProposalRelatedAssets(
  sceneId: string,
  sceneName: string,
  proposal: SceneRunCanonicalPlannerProposalRecord,
) {
  return proposal.changeKind === 'reveal'
    ? [buildSettingAsset(sceneId, sceneName)]
    : [buildLeadAsset(sceneId, sceneName)]
}

function buildVariantRelatedAssets(
  sceneId: string,
  sceneName: string,
  variantIndex: number,
) {
  const leadAsset = buildLeadAsset(sceneId, sceneName)
  const settingAsset = buildSettingAsset(sceneId, sceneName)
  return variantIndex === 0 ? [leadAsset] : [leadAsset, settingAsset]
}

function localizePlannerTitle(value: string) {
  switch (value) {
    case 'Anchor the arrival beat':
      return localize(value, '固定抵达节拍')
    case 'Stage the reveal through the setting':
      return localize(value, '通过场景地点推进揭示')
    default:
      return localize(value)
  }
}

function localizePlannerSummary(sceneName: string, value: string) {
  switch (value) {
    case `Open on ${sceneName} before introducing any new reveal.`:
      return localize(value, `先在 ${sceneName} 落定开场，再引入新的揭示。`)
    case `Let the ${sceneName} setting carry the reveal instead of adding raw exposition.`:
      return localize(value, `让 ${sceneName} 场景来承载揭示，而不是直接堆叠说明。`)
    case `Keep ${sceneName} grounded in the lead character's arrival before escalating the reveal.`:
      return localize(value, `先通过主角抵达让 ${sceneName} 稳住，再升级揭示。`)
    case `Let the reveal intrude earlier while ${sceneName} is still settling.`:
      return localize(value, `在 ${sceneName} 尚未完全落定时提前压入揭示。`)
    default:
      return localize(value)
  }
}

function localizePlannerLabel(value: string) {
  switch (value) {
    case 'Arrival-first':
      return localize(value, '先抵达')
    case 'Reveal pressure':
      return localize(value, '揭示加压')
    default:
      return localize(value)
  }
}

function localizePlannerRationale(value: string) {
  switch (value) {
    case 'Preserves continuity while still giving the scene a clear forward beat.':
      return localize(value, '在保住连续性的同时，让场景拥有清晰的推进节拍。')
    case 'Creates a sharper hook, but asks review to accept a faster continuity turn.':
      return localize(value, '制造更强钩子，但需要审阅接受更快的连续性转折。')
    default:
      return localize(value)
  }
}

function localizePlannerTradeoff(value: string) {
  switch (value) {
    case 'Slower escalation':
      return localize(value, '升级较慢')
    case 'Sharper hook':
      return localize(value, '钩子更强')
    default:
      return localize(value)
  }
}

function localizePlannerRisk(value: string) {
  switch (value) {
    case 'Low continuity risk':
      return localize(value, '连续性风险低')
    case 'Higher continuity risk':
      return localize(value, '连续性风险较高')
    case 'Editor check recommended':
      return localize(value, '建议编辑复核')
    default:
      return localize(value)
  }
}

function buildLocalizedCanonicalProposalSetProposals(
  artifact: SceneRunArtifactRecord,
  proposals: SceneRunCanonicalPlannerProposalRecord[],
  selectedVariants: RunSelectedProposalVariantRecord[] = [],
): ProposalSetArtifactDetailRecord['proposals'] {
  const sceneName = formatSceneName(artifact.sceneId)

  return proposals.map((proposal) => {
    const selectedVariantId = selectedVariants.find((variant) => variant.proposalId === proposal.id)?.variantId

    return {
      id: proposal.id,
      title: localizePlannerTitle(proposal.title),
      summary: localizePlannerSummary(sceneName, proposal.summary),
      changeKind: proposal.changeKind,
      riskLabel: localizePlannerRisk(proposal.riskLabel),
      relatedAssets: buildProposalRelatedAssets(artifact.sceneId, sceneName, proposal),
      ...(proposal.variants
        ? {
            variants: proposal.variants.map((variant, index) => ({
              id: variant.id,
              label: localizePlannerLabel(variant.label),
              summary: localizePlannerSummary(sceneName, variant.summary),
              rationale: localizePlannerRationale(variant.rationale),
              ...(variant.tradeoffLabel ? { tradeoffLabel: localizePlannerTradeoff(variant.tradeoffLabel) } : {}),
              ...(variant.riskLabel ? { riskLabel: localizePlannerRisk(variant.riskLabel) } : {}),
              relatedAssets: buildVariantRelatedAssets(artifact.sceneId, sceneName, index),
            })),
            defaultVariantId: proposal.variants[0]?.id,
          }
        : {}),
      ...(selectedVariantId ? { selectedVariantId } : {}),
    }
  })
}

function buildProposalIds(artifact: SceneRunArtifactRecord) {
  const canonicalSequence = parseRunSequenceNumber(artifact.runId)
  const proposalSetId = buildProposalSetId(artifact.sceneId, canonicalSequence)

  return [
    `${artifact.kind === 'proposal-set' ? artifact.id : proposalSetId}-proposal-001`,
    `${artifact.kind === 'proposal-set' ? artifact.id : proposalSetId}-proposal-002`,
  ]
}

function buildDefaultContextSections(
  artifact: SceneRunArtifactRecord,
): ContextPacketArtifactDetailRecord['sections'] {
  const sceneName = formatSceneName(artifact.sceneId)
  const sequenceLabel = parseSequenceLabel(artifact.id)

  return [
    {
      id: `${artifact.id}-section-brief`,
      title: localize('Scene brief', '场景摘要'),
      summary: localize(
        `Scene setup, continuity, and editorial intent were packed for ${sceneName}.`,
        `已为 ${sceneName} 整理场景设定、连续性和编辑意图。`,
      ),
      itemCount: 3,
    },
    {
      id: `${artifact.id}-section-canon`,
      title: localize('Canon anchors', '正典锚点'),
      summary: localize(
        `Approved canon facts were selected as guardrails for run ${sequenceLabel}.`,
        `已为第 ${sequenceLabel} 次运行选出作为护栏的正典事实。`,
      ),
      itemCount: 2,
    },
    {
      id: `${artifact.id}-section-assets`,
      title: localize('Asset cues', '资产线索'),
      summary: localize(
        'Canonical cast, setting, organization, object, and lore cues were attached for downstream generation.',
        '已附带 canonical 的角色、地点、组织、物件与 lore 线索供后续生成使用。',
      ),
      itemCount: 6,
    },
  ]
}

function buildDefaultIncludedCanonFacts(
  artifact: SceneRunArtifactRecord,
): ContextPacketArtifactDetailRecord['includedCanonFacts'] {
  const sceneName = formatSceneName(artifact.sceneId)
  const sequenceLabel = parseSequenceLabel(artifact.id)

  return [
    {
      id: `${artifact.id}-canon-fact-001`,
      label: localize(`${sceneName} objective`, `${sceneName} 目标`),
      value: localize(
        'This run preserves the next visible beat before any new reveal is introduced.',
        '本次运行会先保住下一个可见节拍，再引入新的揭示。',
      ),
    },
    {
      id: `${artifact.id}-canon-fact-002`,
      label: localize(`Run ${sequenceLabel} continuity guardrail`, `第 ${sequenceLabel} 次运行连续性护栏`),
      value: localize(
        'Existing scene state must remain stable until review decides what can change.',
        '在审阅决定可变更内容之前，现有场景状态必须保持稳定。',
      ),
    },
  ]
}

function buildDefaultIncludedAssets(): ContextPacketArtifactDetailRecord['includedAssets'] {
  return [
    {
      assetId: 'asset-ren-voss',
      label: localize('Ren Voss', '任·沃斯'),
      kind: 'character',
      reason: localize(
        'Carries the primary point of view through the platform bargain.',
        '承担站台谈判中的主要视角。',
      ),
    },
    {
      assetId: 'asset-mei-arden',
      label: localize('Mei Arden', '美伊·阿登'),
      kind: 'character',
      reason: localize(
        'Supplies the visible counter-pressure for the exchange.',
        '为交换提供可见的对抗压力。',
      ),
    },
    {
      assetId: 'asset-midnight-platform',
      label: localize('Midnight Platform', '午夜站台'),
      kind: 'location',
      reason: localize(
        'Keeps witness pressure and staging anchored to the platform.',
        '将目击压力和场面调度固定在月台上。',
      ),
    },
    {
      assetId: 'asset-courier-network',
      label: localize('Courier Network', '信使网络'),
      kind: 'organization',
      reason: localize(
        'Adds the courier-side public posture without exposing private signal handling.',
        '补充信使一侧的公开姿态，但不暴露私密暗号处理细节。',
      ),
    },
    {
      assetId: 'asset-closed-ledger',
      label: localize('Closed Ledger', '闭合账本'),
      kind: 'object',
      reason: localize(
        'Contributes shell-level facts while keeping witness-proof payloads excluded.',
        '仅提供外壳层事实，同时继续排除目击证明载荷。',
      ),
    },
    {
      assetId: 'asset-public-witness-rule',
      label: localize('Public Witness Rule', '公开目击规则'),
      kind: 'lore',
      reason: localize(
        'Carries the high-level rule that keeps public proof out of the bargain.',
        '承载“公开证明不可直接入场”的高层规则。',
      ),
    },
  ]
}

function buildDefaultExcludedPrivateFacts(
  artifact: SceneRunArtifactRecord,
): ContextPacketArtifactDetailRecord['excludedPrivateFacts'] {
  return [
    {
      id: `${artifact.id}-excluded-001`,
      label: localize('Deferred reveal', '延后揭示'),
      reason: localize(
        'Private reveal notes stay out of the shared packet until a review decision lands.',
        '在审阅决定落定前，私有揭示备注不会进入共享上下文包。',
      ),
    },
  ]
}

function buildDefaultAssetActivations(
  artifact: SceneRunArtifactRecord,
): NonNullable<ContextPacketArtifactDetailRecord['assetActivations']> {
  return [
    {
      id: `${artifact.id}-activation-ren-voss`,
      assetId: 'asset-ren-voss',
      assetTitle: localize('Ren Voss', '任·沃斯'),
      assetKind: 'character',
      decision: 'included',
      reasonKind: 'scene-cast',
      reasonLabel: localize('Cast member', '登场角色'),
      visibility: 'character-known',
      budget: 'selected-facts',
      targetAgents: ['scene-manager', 'character-agent', 'prose-agent'],
      policyRuleIds: ['ren-scene-cast'],
      note: localize('Selected Ren facts entered the packet; private signal notes stayed out.', '筛选后的 Ren 事实进入上下文包；私密暗号备注保持排除。'),
    },
    {
      id: `${artifact.id}-activation-mei-arden`,
      assetId: 'asset-mei-arden',
      assetTitle: localize('Mei Arden', '美伊·阿登'),
      assetKind: 'character',
      decision: 'included',
      reasonKind: 'scene-cast',
      reasonLabel: localize('Cast pressure', '登场压力'),
      visibility: 'public',
      budget: 'selected-facts',
      targetAgents: ['scene-manager', 'character-agent', 'prose-agent'],
      policyRuleIds: ['mei-scene-cast'],
    },
    {
      id: `${artifact.id}-activation-midnight-platform`,
      assetId: 'asset-midnight-platform',
      assetTitle: localize('Midnight Platform', '午夜站台'),
      assetKind: 'location',
      decision: 'included',
      reasonKind: 'scene-location',
      reasonLabel: localize('Scene location', '场景地点'),
      visibility: 'public',
      budget: 'mentions-excerpts',
      targetAgents: ['scene-manager', 'prose-agent'],
      policyRuleIds: ['platform-scene-location'],
    },
    {
      id: `${artifact.id}-activation-courier-network`,
      assetId: 'asset-courier-network',
      assetTitle: localize('Courier Network', '信使网络'),
      assetKind: 'organization',
      decision: 'included',
      reasonKind: 'explicit-link',
      reasonLabel: localize('Explicit courier link', '显式信使链接'),
      visibility: 'character-known',
      budget: 'selected-facts',
      targetAgents: ['scene-manager', 'continuity-reviewer'],
      policyRuleIds: ['network-explicit-link'],
    },
    {
      id: `${artifact.id}-activation-closed-ledger`,
      assetId: 'asset-closed-ledger',
      assetTitle: localize('Closed Ledger', '闭合账本'),
      assetKind: 'object',
      decision: 'included',
      reasonKind: 'rule-dependency',
      reasonLabel: localize('Closed-ledger dependency', '闭合账本依赖'),
      visibility: 'character-known',
      budget: 'selected-facts',
      targetAgents: ['scene-manager', 'continuity-reviewer'],
      policyRuleIds: ['ledger-object-dependency'],
      note: localize('Only shell-level ledger facts entered the packet; witness-proof payloads stayed excluded.', '只有账本外壳层事实进入上下文包；目击证明载荷保持排除。'),
    },
    {
      id: `${artifact.id}-activation-public-witness-rule`,
      assetId: 'asset-public-witness-rule',
      assetTitle: localize('Public Witness Rule', '公开目击规则'),
      assetKind: 'lore',
      decision: 'included',
      reasonKind: 'rule-dependency',
      reasonLabel: localize('Witness rule dependency', '目击规则依赖'),
      visibility: 'public',
      budget: 'summary-only',
      targetAgents: ['scene-manager', 'continuity-reviewer', 'prose-agent'],
      policyRuleIds: ['witness-rule-dependency'],
    },
    {
      id: `${artifact.id}-activation-departure-bell-timing`,
      assetId: 'asset-departure-bell-timing',
      assetTitle: localize('Departure Bell Timing', '发车铃时序'),
      assetKind: 'lore',
      decision: 'redacted',
      reasonKind: 'review-issue',
      reasonLabel: localize('Editor timing guardrail', '编辑时序护栏'),
      visibility: 'editor-only',
      budget: 'summary-only',
      targetAgents: ['continuity-reviewer'],
      policyRuleIds: ['bell-editor-guardrail'],
      note: localize('Exact editor-only timing remained redacted.', '精确的编辑专用时序保持遮蔽。'),
    },
  ]
}

function summarizeDefaultAssetActivations(
  activations: NonNullable<ContextPacketArtifactDetailRecord['assetActivations']>,
): ContextPacketArtifactDetailRecord['activationSummary'] {
  return {
    includedAssetCount: activations.filter((activation) => activation.decision === 'included').length,
    excludedAssetCount: activations.filter((activation) => activation.decision === 'excluded').length,
    redactedAssetCount: activations.filter((activation) => activation.decision === 'redacted').length,
    targetAgentCount: new Set(activations.flatMap((activation) => activation.targetAgents)).size,
    warningCount: 1,
  }
}

function buildDefaultGeneratedRefs(artifact: SceneRunArtifactRecord): RunArtifactGeneratedRefRecord[] {
  const explicitGeneratedRefs = readGeneratedRefs(artifact)
  if (explicitGeneratedRefs) {
    return explicitGeneratedRefs
  }

  if (artifact.meta?.role === 'writer') {
    if (readGatewayProvenance(artifact)) {
      const proseDraftId = buildProseDraftId(artifact.sceneId, parseRunSequenceNumber(artifact.runId))

      return [
        {
          kind: 'artifact',
          id: proseDraftId,
          label: localize('Prose draft', '正文草稿'),
        },
      ]
    }

    return []
  }

  const proposalSetId = buildProposalSetId(artifact.sceneId, parseRunSequenceNumber(artifact.runId))

  return [
    {
      kind: 'proposal-set',
      id: proposalSetId,
      label: localize('Scene proposal set', '场景提案集'),
    },
  ]
}

function buildDefaultProposalSetProposals(
  artifact: SceneRunArtifactRecord,
  selectedVariants: RunSelectedProposalVariantRecord[] = [],
): ProposalSetArtifactDetailRecord['proposals'] {
  const canonicalProposals = readCanonicalPlannerProposals(artifact)
  if (canonicalProposals) {
    return buildLocalizedCanonicalProposalSetProposals(artifact, canonicalProposals, selectedVariants)
  }

  const sceneName = formatSceneName(artifact.sceneId)
  const leadAsset = buildLeadAsset(artifact.sceneId, sceneName)
  const settingAsset = buildSettingAsset(artifact.sceneId, sceneName)
  const [proposalOneId, proposalTwoId] = buildProposalIds(artifact)
  const proposalOneDefaultVariantId = `${proposalOneId}-variant-arrival-first`
  const selectedProposalOneVariantId = selectedVariants.find((variant) => variant.proposalId === proposalOneId)?.variantId

  return [
    {
      id: proposalOneId,
      title: localize('Anchor the arrival beat', '固定抵达节拍'),
      summary: localize(
        `Open on ${sceneName} before introducing any new reveal.`,
        `先在 ${sceneName} 落定开场，再引入新的揭示。`,
      ),
      changeKind: 'action',
      riskLabel: localize('Low continuity risk', '连续性风险低'),
      relatedAssets: [leadAsset],
      variants: [
        {
          id: proposalOneDefaultVariantId,
          label: localize('Arrival-first', '先抵达'),
          summary: localize(
            `Keep ${sceneName} grounded in the lead character's arrival before escalating the reveal.`,
            `先通过主角抵达让 ${sceneName} 稳住，再升级揭示。`,
          ),
          rationale: localize(
            'Preserves continuity while still giving the scene a clear forward beat.',
            '在保住连续性的同时，让场景拥有清晰的推进节拍。',
          ),
          tradeoffLabel: localize('Slower escalation', '升级较慢'),
          riskLabel: localize('Low continuity risk', '连续性风险低'),
          relatedAssets: [leadAsset],
        },
        {
          id: `${proposalOneId}-variant-reveal-pressure`,
          label: localize('Reveal pressure', '揭示加压'),
          summary: localize(
            `Let the reveal intrude earlier while ${sceneName} is still settling.`,
            `在 ${sceneName} 尚未完全落定时提前压入揭示。`,
          ),
          rationale: localize(
            'Creates a sharper hook, but asks review to accept a faster continuity turn.',
            '制造更强钩子，但需要审阅接受更快的连续性转折。',
          ),
          tradeoffLabel: localize('Sharper hook', '钩子更强'),
          riskLabel: localize('Higher continuity risk', '连续性风险较高'),
          relatedAssets: [leadAsset, settingAsset],
        },
      ],
      defaultVariantId: proposalOneDefaultVariantId,
      ...(selectedProposalOneVariantId ? { selectedVariantId: selectedProposalOneVariantId } : {}),
    },
    {
      id: proposalTwoId,
      title: localize('Stage the reveal through the setting', '通过场景地点推进揭示'),
      summary: localize(
        `Let the ${sceneName} setting carry the reveal instead of adding raw exposition.`,
        `让 ${sceneName} 场景来承载揭示，而不是直接堆叠说明。`,
      ),
      changeKind: 'reveal',
      riskLabel: localize('Editor check recommended', '建议编辑复核'),
      relatedAssets: [settingAsset],
    },
  ]
}

function buildDefaultReviewOptions(): ProposalSetReviewOptionRecord[] {
  const entries: Array<[RunReviewDecisionKind, LocalizedTextRecord, LocalizedTextRecord]> = [
    ['accept', localize('Accept', '接受'), localize('Apply the proposal set without further changes.', '直接应用提案集，不再追加改动。')],
    [
      'accept-with-edit',
      localize('Accept with edit', '接受并编辑'),
      localize('Apply the proposal set, then layer editorial adjustments.', '应用提案集后，再叠加编辑调整。'),
    ],
    [
      'request-rewrite',
      localize('Request rewrite', '要求重写'),
      localize('Return the run to execution with rewrite guidance.', '附带重写指引后退回执行阶段。'),
    ],
    [
      'reject',
      localize('Reject', '拒绝'),
      localize('Close the run without producing canon or prose artifacts.', '关闭本次运行，不产出 canon 或 prose artifact。'),
    ],
  ]

  return entries.map(([decision, label, description]) => ({
    decision,
    label,
    description,
  }))
}

function buildDefaultAcceptedProposalIds(artifact: SceneRunArtifactRecord) {
  const [proposalOneId] = buildProposalIds(artifact)
  return [proposalOneId]
}

function buildAcceptedProposalIdsFromSource(sourceProposalSetId: string) {
  return [`${sourceProposalSetId}-proposal-001`]
}

function buildAcceptedFactValue(sceneName: string, proposalId: string) {
  if (proposalId.endsWith('002')) {
    return localize(
      `${sceneName} now carries an approved reveal through the environment.`,
      `${sceneName} 现在通过环境承载了一条已批准的揭示。`,
    )
  }

  return localize(
    `${sceneName} now opens on a stable arrival beat before any reveal escalates.`,
    `${sceneName} 现在会先以稳定的抵达节拍开场，再放大揭示。`,
  )
}

function buildAcceptedFactAssets(sceneId: string, sceneName: string, proposalId: string) {
  return proposalId.endsWith('002')
    ? [buildSettingAsset(sceneId, sceneName)]
    : [buildLeadAsset(sceneId, sceneName)]
}

function normalizeSelectedVariants(selectedVariants?: RunSelectedProposalVariantRecord[]) {
  return selectedVariants && selectedVariants.length > 0 ? selectedVariants : undefined
}

function filterSelectedVariantsForProposals(
  selectedVariants: RunSelectedProposalVariantRecord[] | undefined,
  proposalIds: string[],
) {
  return selectedVariants?.filter((variant) => proposalIds.includes(variant.proposalId))
}

function buildDefaultAcceptedFacts(
  artifact: SceneRunArtifactRecord,
  acceptedProposalIds: string[],
  selectedVariants: RunSelectedProposalVariantRecord[] = [],
): CanonPatchArtifactDetailRecord['acceptedFacts'] {
  const sceneName = formatSceneName(artifact.sceneId)

  return acceptedProposalIds.map((proposalId, index) => {
    const selectedProposalVariants = selectedVariants.filter((variant) => variant.proposalId === proposalId)

    return {
      id: `${artifact.id}-fact-${padSequence(index + 1)}`,
      label: localize(`Accepted fact ${index + 1}`, `接受事实 ${index + 1}`),
      value: buildAcceptedFactValue(sceneName, proposalId),
      sourceProposalIds: [proposalId],
      ...(selectedProposalVariants.length > 0 ? { selectedVariants: selectedProposalVariants } : {}),
      relatedAssets: buildAcceptedFactAssets(artifact.sceneId, sceneName, proposalId),
    }
  })
}

function buildDefaultTraceLinkIds(
  artifact: SceneRunArtifactRecord,
  relation: 'accepted_into' | 'rendered_as',
  count = 1,
) {
  return Array.from({ length: count }, (_, index) => buildTraceLinkId(artifact.runId, relation, index + 1))
}

function buildDefaultCanonPatchTraceLinkIds(
  artifact: SceneRunArtifactRecord,
  acceptedFacts: CanonPatchArtifactDetailRecord['acceptedFacts'],
) {
  const acceptedIntoLinkCount = acceptedFacts.reduce((count, fact) => count + fact.sourceProposalIds.length + 1, 0)
  return buildDefaultTraceLinkIds(artifact, 'accepted_into', acceptedIntoLinkCount)
}

export function buildContextPacketDetail(
  input: BuildContextPacketDetailInput,
): ContextPacketArtifactDetailRecord {
  assertArtifactKind(input.artifact, 'context-packet')
  const sequence = parseRunSequenceNumber(input.artifact.runId)
  const persistedPacket = readSceneContextPacket(input.artifact)
  const assetActivations = buildDefaultAssetActivations(input.artifact)

  return {
    ...buildArtifactSummary(input),
    kind: 'context-packet',
    sceneId: input.artifact.sceneId,
    sections: persistedPacket?.sections ?? buildDefaultContextSections(input.artifact),
    includedCanonFacts: persistedPacket?.includedCanonFacts ?? buildDefaultIncludedCanonFacts(input.artifact),
    includedAssets: persistedPacket?.includedAssets ?? buildDefaultIncludedAssets(),
    excludedPrivateFacts: persistedPacket?.excludedPrivateFacts ?? buildDefaultExcludedPrivateFacts(input.artifact),
    assetActivations: persistedPacket?.assetActivations ?? assetActivations,
    activationSummary: persistedPacket?.activationSummary ?? summarizeDefaultAssetActivations(assetActivations),
    outputSchemaLabel: persistedPacket?.outputSchemaLabel ?? localize('Scene context packet schema', '场景上下文包结构'),
    tokenBudgetLabel: persistedPacket?.tokenBudgetLabel ?? localize(`Target budget ${1500 + sequence * 100} tokens`, `目标预算 ${1500 + sequence * 100} tokens`),
  }
}

export function buildAgentInvocationDetail(
  input: BuildAgentInvocationDetailInput,
): AgentInvocationArtifactDetailRecord {
  assertArtifactKind(input.artifact, 'agent-invocation')
  const sceneName = formatSceneName(input.artifact.sceneId)
  const agentRole = readAgentRole(input.artifact)
  const isPlanner = agentRole === 'scene-planner'
  const sequence = parseRunSequenceNumber(input.artifact.runId)
  const gatewayProvenance = readGatewayProvenance(input.artifact)
  const isAcceptedWriterInvocation = !isPlanner && Boolean(gatewayProvenance)
  const isRealWriterInvocation = !isPlanner && gatewayProvenance?.provider === 'openai-compatible'

  return {
    ...buildArtifactSummary(input),
    kind: 'agent-invocation',
    agentRole,
    modelLabel: isPlanner
      ? gatewayProvenance?.provider === 'openai-compatible'
        ? localize(
          `${gatewayProvenance.providerLabel} planner profile (${gatewayProvenance.modelId})`,
          `${gatewayProvenance.providerLabel} 规划模型 (${gatewayProvenance.modelId})`,
        )
        : gatewayProvenance?.fallbackReason
          ? localize(`Fixture planner fallback (${gatewayProvenance.modelId})`, `Fixture 回退规划模型 (${gatewayProvenance.modelId})`)
          : gatewayProvenance
            ? localize(`Fixture planner profile (${gatewayProvenance.modelId})`, `Fixture 规划模型 (${gatewayProvenance.modelId})`)
            : localize('Fixture planner profile', 'Fixture 规划模型')
      : gatewayProvenance?.provider === 'openai-compatible'
        ? localize(
          `${gatewayProvenance.providerLabel} writer profile (${gatewayProvenance.modelId})`,
          `${gatewayProvenance.providerLabel} 写作模型 (${gatewayProvenance.modelId})`,
        )
        : gatewayProvenance?.fallbackReason
          ? localize(`Fixture writer fallback (${gatewayProvenance.modelId})`, `Fixture 回退写作模型 (${gatewayProvenance.modelId})`)
          : gatewayProvenance
            ? localize(`Fixture writer profile (${gatewayProvenance.modelId})`, `Fixture 写作模型 (${gatewayProvenance.modelId})`)
            : localize('Fixture writer profile', 'Fixture 写作模型'),
    inputSummary: isPlanner
      ? localize(
          `Consumes the packed scene context and editorial note for ${sceneName}.`,
          `消费 ${sceneName} 的上下文包和编辑备注。`,
        )
      : isAcceptedWriterInvocation
        ? localize(
          `Consumes the accepted canon patch and editorial decision for ${sceneName}.`,
          `消费 ${sceneName} 的已接受正典补丁和编辑决定。`,
        )
        : localize(
          `Consumes the approved planning frame and context packet for ${sceneName}.`,
          `消费 ${sceneName} 的规划结果和上下文包。`,
        ),
    outputSummary: isPlanner
      ? localize(
          'Produces structured proposal candidates for editorial review.',
          '产出供编辑审阅的结构化提案候选。',
        )
      : isRealWriterInvocation
        ? localize(
          'Produces a structured accepted prose draft after review acceptance.',
          '在审阅接受后产出结构化的正文草稿。',
        )
        : isAcceptedWriterInvocation
          ? localize(
            'Produces an accepted prose draft after review acceptance.',
            '在审阅接受后产出正文草稿。',
          )
        : localize(
          'Produces prose-shaping fixture output for the proposal set.',
          '产出用于提案集的正文塑形 fixture 输出。',
        ),
    contextPacketId: input.contextPacketId ?? buildContextPacketId(input.artifact.sceneId, sequence),
    outputSchemaLabel: isPlanner
      ? localize('Proposal candidate schema', '提案候选结构')
      : localize('Accepted prose draft schema', '已接受正文草稿结构'),
    generatedRefs: input.generatedRefs ?? buildDefaultGeneratedRefs(input.artifact),
    ...(gatewayProvenance ? { provenance: gatewayProvenance } : {}),
    ...(readFailureDetail(input.artifact) ? { failureDetail: readFailureDetail(input.artifact) } : {}),
  }
}

export function buildProposalSetDetail(
  input: BuildProposalSetDetailInput,
): ProposalSetArtifactDetailRecord {
  assertArtifactKind(input.artifact, 'proposal-set')
  const sequence = parseRunSequenceNumber(input.artifact.runId)

  return {
    ...buildArtifactSummary(input),
    kind: 'proposal-set',
    reviewId: input.reviewId ?? buildReviewId(input.artifact.sceneId, sequence),
    sourceInvocationIds: input.sourceInvocationIds ?? [
      buildAgentInvocationId(input.artifact.sceneId, sequence, 1),
      buildAgentInvocationId(input.artifact.sceneId, sequence, 2),
    ],
    proposals: buildDefaultProposalSetProposals(input.artifact, input.selectedVariants),
    reviewOptions: buildDefaultReviewOptions(),
    ...(readGatewayProvenance(input.artifact) ? { provenance: readGatewayProvenance(input.artifact) } : {}),
    ...(readFailureDetail(input.artifact) ? { failureDetail: readFailureDetail(input.artifact) } : {}),
  }
}

export function buildCanonPatchDetail(
  input: BuildCanonPatchDetailInput,
): CanonPatchArtifactDetailRecord {
  assertArtifactKind(input.artifact, 'canon-patch')
  const sequence = parseRunSequenceNumber(input.artifact.runId)
  const sourceProposalSetId = input.sourceProposalSetId ?? buildProposalSetId(input.artifact.sceneId, sequence)
  const acceptedProposalIds = input.acceptedProposalIds
    ?? (input.sourceProposalSetId
      ? buildAcceptedProposalIdsFromSource(input.sourceProposalSetId)
      : buildDefaultAcceptedProposalIds(input.artifact))
  const selectedVariants = normalizeSelectedVariants(
    filterSelectedVariantsForProposals(input.selectedVariants, acceptedProposalIds),
  )
  const acceptedFacts = buildDefaultAcceptedFacts(input.artifact, acceptedProposalIds, selectedVariants)

  return {
    ...buildArtifactSummary(input),
    kind: 'canon-patch',
    decision: input.decision,
    sourceProposalSetId,
    acceptedProposalIds,
    ...(selectedVariants ? { selectedVariants } : {}),
    acceptedFacts,
    traceLinkIds: input.traceLinkIds ?? buildDefaultCanonPatchTraceLinkIds(input.artifact, acceptedFacts),
  }
}

export function buildProseDraftDetail(
  input: BuildProseDraftDetailInput,
): ProseDraftArtifactDetailRecord {
  assertArtifactKind(input.artifact, 'prose-draft')
  const sceneName = formatSceneName(input.artifact.sceneId)
  const sequence = parseRunSequenceNumber(input.artifact.runId)
  const sourceProposalIds = input.sourceProposalIds ?? [buildProposalIds(input.artifact)[0]]
  const selectedVariants = input.selectedVariants && input.selectedVariants.length > 0
    ? input.selectedVariants
    : undefined
  const writerOutput = readSceneProseWriterOutput(input.artifact)
  const provenance = readGatewayProvenance(input.artifact)
  const defaultRelatedAssets = [
    buildLeadAsset(input.artifact.sceneId, sceneName),
    buildSettingAsset(input.artifact.sceneId, sceneName),
  ]
  const summary = buildProseDraftSummary(sceneName, provenance)

  return {
    ...buildArtifactSummary({
      ...input,
      labels: {
        ...input.labels,
        summary,
      },
    }),
    kind: 'prose-draft',
    sourceCanonPatchId: input.sourceCanonPatchId ?? buildCanonPatchId(input.artifact.sceneId, sequence),
    contextPacketId: input.contextPacketId ?? buildContextPacketId(input.artifact.sceneId, sequence),
    sourceProposalIds,
    ...(selectedVariants
      ? { selectedVariants }
      : {}),
    body: writerOutput?.body ?? buildProseDraftBody({
      sceneName,
      sourceProposalIds,
      selectedVariants,
    }),
    excerpt: writerOutput?.excerpt ?? localize(
      `${sceneName} settles into view before the next reveal turns visible.`,
      `${sceneName} 先稳稳落入视野，随后下一段揭示才开始显形。`,
    ),
    wordCount: writerOutput?.wordCount ?? 140 + sequence * 3,
    relatedAssets: writerOutput?.relatedAssets ?? defaultRelatedAssets,
    traceLinkIds: input.traceLinkIds ?? buildDefaultTraceLinkIds(input.artifact, 'rendered_as'),
    ...(provenance ? { provenance } : {}),
    ...(readFailureDetail(input.artifact) ? { failureDetail: readFailureDetail(input.artifact) } : {}),
  }
}

function buildProseDraftSummary(
  sceneName: string,
  provenance?: ReturnType<typeof readGatewayProvenance>,
) {
  if (provenance?.provider === 'openai-compatible') {
    return localize(
      `Accepted prose draft was rendered for ${sceneName}.`,
      `已为 ${sceneName} 渲染获批正文草稿。`,
    )
  }

  if (provenance?.fallbackReason) {
    return localize(
      `Fixture prose fallback was rendered for ${sceneName}.`,
      `已为 ${sceneName} 渲染 fixture 回退正文草稿。`,
    )
  }

  return localize(
    `A fixture prose draft was rendered for ${sceneName}.`,
    `已为 ${sceneName} 渲染 fixture 正文草稿。`,
  )
}
