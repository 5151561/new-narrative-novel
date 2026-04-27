import type {
  AssetRecord,
  ContextPacketArtifactDetailRecord,
  FixtureProjectData,
  LocalizedTextRecord,
  RunArtifactCanonFactRecord,
  RunArtifactExcludedFactRecord,
  RunArtifactIncludedAssetRecord,
  RunArtifactSectionRecord,
  RunContextActivationSummaryRecord,
  RunContextAssetActivationRecord,
} from '../../contracts/api-records.js'
import { buildContextPacketId } from '../sceneRun/sceneRunIds.js'

function text(en: string, zhCN = en): LocalizedTextRecord {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function trimText(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function summarizeList(values: string[]) {
  return values.filter(Boolean).join('; ')
}

function tokenizeTitle(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9\u4e00-\u9fff]+/u)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3)
}

function sceneContextIncludesAssetSignal(sceneText: string, asset: AssetRecord) {
  const normalizedSceneText = sceneText.toLowerCase()
  return tokenizeTitle(asset.title.en).some((token) => normalizedSceneText.includes(token))
}

function collectAssetFacts(asset: AssetRecord) {
  const profileFacts = asset.profile.sections.flatMap((section) => section.facts)
  const factLine = profileFacts.slice(0, 2).map((fact) => `${fact.label.en}: ${fact.value.en}`).join('; ')
  return factLine ? `${asset.summary.en} ${factLine}`.trim() : asset.summary.en
}

function pickActivationRule(asset: AssetRecord, reasonKind: RunContextAssetActivationRecord['reasonKind']) {
  return asset.contextPolicy?.activationRules.find((rule) => rule.reasonKind === reasonKind)
    ?? asset.contextPolicy?.activationRules[0]
}

function buildActivationRecord(input: {
  packetId: string
  asset: AssetRecord
  decision: RunContextAssetActivationRecord['decision']
  reasonKind: RunContextAssetActivationRecord['reasonKind']
  note?: LocalizedTextRecord
}): RunContextAssetActivationRecord {
  const rule = pickActivationRule(input.asset, input.reasonKind)

  return {
    id: `${input.packetId}-activation-${input.asset.id.replace(/^asset-/, '')}`,
    assetId: input.asset.id,
    assetTitle: input.asset.title,
    assetKind: input.asset.kind,
    decision: input.decision,
    reasonKind: rule?.reasonKind ?? input.reasonKind,
    reasonLabel: rule?.label ?? text('Context rule'),
    visibility: rule?.visibility ?? input.asset.contextPolicy?.defaultVisibility ?? 'public',
    budget: rule?.budget ?? input.asset.contextPolicy?.defaultBudget ?? 'summary-only',
    targetAgents: rule?.targetAgents ?? ['scene-manager'],
    ...(rule?.id ? { policyRuleIds: [rule.id] } : {}),
    ...(input.note ? { note: input.note } : {}),
  }
}

function findSceneBook(project: FixtureProjectData, chapterId: string) {
  return Object.values(project.books).find((book) => book.chapterIds.includes(chapterId))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLocalizedTextRecord(value: unknown): value is LocalizedTextRecord {
  return isRecord(value)
    && typeof value.en === 'string'
    && typeof value['zh-CN'] === 'string'
}

function isRunArtifactSectionRecord(value: unknown): value is RunArtifactSectionRecord {
  return isRecord(value)
    && typeof value.id === 'string'
    && isLocalizedTextRecord(value.title)
    && isLocalizedTextRecord(value.summary)
    && typeof value.itemCount === 'number'
}

function isRunArtifactCanonFactRecord(value: unknown): value is RunArtifactCanonFactRecord {
  return isRecord(value)
    && typeof value.id === 'string'
    && isLocalizedTextRecord(value.label)
    && isLocalizedTextRecord(value.value)
}

function isRunArtifactIncludedAssetRecord(value: unknown): value is RunArtifactIncludedAssetRecord {
  return isRecord(value)
    && typeof value.assetId === 'string'
    && (value.kind === 'character' || value.kind === 'location' || value.kind === 'rule')
    && isLocalizedTextRecord(value.label)
    && isLocalizedTextRecord(value.reason)
}

function isRunArtifactExcludedFactRecord(value: unknown): value is RunArtifactExcludedFactRecord {
  return isRecord(value)
    && typeof value.id === 'string'
    && isLocalizedTextRecord(value.label)
    && isLocalizedTextRecord(value.reason)
}

function isRunContextAssetActivationRecord(value: unknown): value is RunContextAssetActivationRecord {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.assetId === 'string'
    && isLocalizedTextRecord(value.assetTitle)
    && (value.assetKind === 'character' || value.assetKind === 'location' || value.assetKind === 'rule')
    && (value.decision === 'included' || value.decision === 'excluded' || value.decision === 'redacted')
    && typeof value.reasonKind === 'string'
    && isLocalizedTextRecord(value.reasonLabel)
    && typeof value.visibility === 'string'
    && typeof value.budget === 'string'
    && Array.isArray(value.targetAgents)
    && value.targetAgents.every((agent) => typeof agent === 'string')
    && (value.note === undefined || isLocalizedTextRecord(value.note))
}

function isRunContextActivationSummaryRecord(value: unknown): value is RunContextActivationSummaryRecord {
  return isRecord(value)
    && typeof value.includedAssetCount === 'number'
    && typeof value.excludedAssetCount === 'number'
    && typeof value.redactedAssetCount === 'number'
    && typeof value.targetAgentCount === 'number'
    && typeof value.warningCount === 'number'
}

function isSceneContextNarrativeRecord(value: unknown): value is SceneContextNarrativeRecord {
  return isRecord(value)
    && isLocalizedTextRecord(value.bookPremise)
    && isLocalizedTextRecord(value.chapterGoal)
    && isLocalizedTextRecord(value.sceneObjective)
    && isLocalizedTextRecord(value.sceneSetup)
    && isLocalizedTextRecord(value.currentState)
    && isLocalizedTextRecord(value.castSummary)
    && isLocalizedTextRecord(value.locationSummary)
    && isLocalizedTextRecord(value.styleInstruction)
    && isLocalizedTextRecord(value.visibilityExplanation)
    && isLocalizedTextRecord(value.budgetSummary)
}

export interface SceneContextNarrativeRecord {
  bookPremise: LocalizedTextRecord
  chapterGoal: LocalizedTextRecord
  sceneObjective: LocalizedTextRecord
  sceneSetup: LocalizedTextRecord
  currentState: LocalizedTextRecord
  castSummary: LocalizedTextRecord
  locationSummary: LocalizedTextRecord
  styleInstruction: LocalizedTextRecord
  visibilityExplanation: LocalizedTextRecord
  budgetSummary: LocalizedTextRecord
}

export interface SceneContextPacketRecord {
  version: 'scene-context-v1'
  packetId: string
  sceneId: string
  narrative: SceneContextNarrativeRecord
  sections: ContextPacketArtifactDetailRecord['sections']
  includedCanonFacts: ContextPacketArtifactDetailRecord['includedCanonFacts']
  includedAssets: ContextPacketArtifactDetailRecord['includedAssets']
  excludedPrivateFacts: ContextPacketArtifactDetailRecord['excludedPrivateFacts']
  assetActivations: NonNullable<ContextPacketArtifactDetailRecord['assetActivations']>
  activationSummary: NonNullable<ContextPacketArtifactDetailRecord['activationSummary']>
  outputSchemaLabel: LocalizedTextRecord
  tokenBudgetLabel: LocalizedTextRecord
}

export interface BuildSceneContextPacketInput {
  project: FixtureProjectData
  sceneId: string
  sequence: number
}

export function isSceneContextPacketRecord(value: unknown): value is SceneContextPacketRecord {
  return isRecord(value)
    && value.version === 'scene-context-v1'
    && typeof value.packetId === 'string'
    && typeof value.sceneId === 'string'
    && isSceneContextNarrativeRecord(value.narrative)
    && Array.isArray(value.sections)
    && value.sections.every(isRunArtifactSectionRecord)
    && Array.isArray(value.includedCanonFacts)
    && value.includedCanonFacts.every(isRunArtifactCanonFactRecord)
    && Array.isArray(value.includedAssets)
    && value.includedAssets.every(isRunArtifactIncludedAssetRecord)
    && Array.isArray(value.excludedPrivateFacts)
    && value.excludedPrivateFacts.every(isRunArtifactExcludedFactRecord)
    && Array.isArray(value.assetActivations)
    && value.assetActivations.every(isRunContextAssetActivationRecord)
    && isRunContextActivationSummaryRecord(value.activationSummary)
    && isLocalizedTextRecord(value.outputSchemaLabel)
    && isLocalizedTextRecord(value.tokenBudgetLabel)
}

export function buildSceneContextPacket(input: BuildSceneContextPacketInput): SceneContextPacketRecord {
  const scene = input.project.scenes[input.sceneId]
  if (!scene) {
    throw new Error(`Scene ${input.sceneId} was not found in fixture project data.`)
  }

  const chapter = input.project.chapters[scene.workspace.chapterId]
  if (!chapter) {
    throw new Error(`Chapter ${scene.workspace.chapterId} was not found for scene ${input.sceneId}.`)
  }

  const book = findSceneBook(input.project, chapter.chapterId)
  if (!book) {
    throw new Error(`No book includes chapter ${chapter.chapterId}.`)
  }

  const packetId = buildContextPacketId(input.sceneId, input.sequence)
  const sceneContextText = [
    scene.workspace.title,
    scene.workspace.objective,
    scene.setup.identity.summary,
    scene.setup.identity.locationLabel,
    scene.setup.objective.externalGoal,
    scene.setup.objective.emotionalGoal,
    scene.setup.objective.successSignal,
    scene.setup.objective.failureCost,
    ...scene.setup.constraints.map((constraint) => `${constraint.label} ${constraint.summary}`),
    ...scene.setup.knowledgeBoundaries.map((boundary) => `${boundary.label} ${boundary.summary}`),
    scene.execution.acceptedSummary.sceneSummary,
    ...(scene.execution.consistencySummary?.topIssues ?? []),
    ...scene.execution.acceptedSummary.acceptedFacts.map((fact) => `${fact.label} ${fact.value}`),
    ...scene.execution.objective.constraintSummary,
    ...(scene.prose.traceSummary?.missingLinks ?? []),
    ...scene.dock.consistency.checks.map((check) => `${check.label} ${check.detail}`),
    ...scene.dock.problems.items.map((item) => `${item.title} ${item.recommendation}`),
    scene.dock.consistency.summary,
    scene.dock.problems.summary,
    scene.inspector.runtime.latestFailure ?? '',
  ].join(' ')

  const castAssets = scene.workspace.castIds
    .map((assetId) => input.project.assets[assetId]?.assets.find((asset) => asset.id === assetId))
    .filter((asset): asset is AssetRecord => Boolean(asset))
  const locationAsset = scene.workspace.locationId
    ? input.project.assets[scene.workspace.locationId]?.assets.find((asset) => asset.id === scene.workspace.locationId)
    : undefined
  const constraintAssets = scene.setup.constraints
    .map((constraint) => Object.values(input.project.assets)
      .flatMap((workspace) => workspace.assets)
      .find((asset) => (
        asset.title.en.toLowerCase() === constraint.label.toLowerCase()
        || asset.title['zh-CN'].toLowerCase() === constraint.label.toLowerCase()
      )))
    .filter((asset): asset is AssetRecord => Boolean(asset))
  const reviewIssueAssets = Object.values(input.project.assets)
    .flatMap((workspace) => workspace.assets)
    .filter((asset) => (
      asset.contextPolicy?.activationRules.some((rule) => rule.reasonKind === 'review-issue')
      && sceneContextIncludesAssetSignal(sceneContextText, asset)
    ))
  const relevantAssets = new Map<string, AssetRecord>()

  for (const asset of [...castAssets, ...(locationAsset ? [locationAsset] : []), ...constraintAssets, ...reviewIssueAssets]) {
    relevantAssets.set(asset.id, asset)
  }

  const assetActivations = [...relevantAssets.values()].map((asset) => {
    if (scene.workspace.castIds.includes(asset.id)) {
      return buildActivationRecord({
        packetId,
        asset,
        decision: 'included',
        reasonKind: 'scene-cast',
        note: asset.contextPolicy?.exclusions?.[0]
          ? text(
            `Included ${asset.title.en} through scene cast selection; ${asset.contextPolicy.exclusions[0].summary.en}`,
            `已因场景登场阵容纳入 ${asset.title['zh-CN']}；${asset.contextPolicy.exclusions[0].summary['zh-CN']}`,
          )
          : undefined,
      })
    }

    if (scene.workspace.locationId === asset.id) {
      return buildActivationRecord({
        packetId,
        asset,
        decision: 'included',
        reasonKind: 'scene-location',
      })
    }

    if (asset.contextPolicy?.activationRules.some((rule) => rule.reasonKind === 'review-issue')) {
      return buildActivationRecord({
        packetId,
        asset,
        decision: 'redacted',
        reasonKind: 'review-issue',
        note: text(
          `${asset.title.en} stays redacted; only the guardrail and warning count remain visible.`,
          `${asset.title['zh-CN']} 保持遮蔽；仅保留护栏说明和警告计数。`,
        ),
      })
    }

    return buildActivationRecord({
      packetId,
      asset,
      decision: 'excluded',
      reasonKind: 'rule-dependency',
      note: text(
        `${asset.title.en} remains excluded from the shared packet while its guardrail still applies.`,
        `${asset.title['zh-CN']} 继续排除在共享上下文包之外，但其护栏仍然生效。`,
      ),
    })
  })

  const includedAssets = assetActivations
    .filter((activation) => activation.decision === 'included')
    .map((activation) => {
      const asset = relevantAssets.get(activation.assetId)!
      return {
        assetId: asset.id,
        label: asset.title,
        kind: asset.kind,
        reason: text(collectAssetFacts(asset)),
      }
    })

  const excludedPrivateFacts = assetActivations
    .flatMap((activation) => {
      const asset = relevantAssets.get(activation.assetId)!
      const exclusions = asset.contextPolicy?.exclusions ?? []
      if (exclusions.length > 0) {
        return exclusions.map((exclusion, index) => ({
          id: `${packetId}-excluded-${asset.id.replace(/^asset-/, '')}-${String(index + 1).padStart(3, '0')}`,
          label: exclusion.label,
          reason: exclusion.summary,
        }))
      }

      if (activation.decision === 'included') {
        return []
      }

      return [{
        id: `${packetId}-excluded-${asset.id.replace(/^asset-/, '')}-001`,
        label: activation.reasonLabel,
        reason: activation.note ?? text(`${asset.title.en} was withheld from the shared packet.`),
      }]
    })

  const includedCanonFacts = [
    {
      id: `${packetId}-canon-objective`,
      label: text('Scene objective', '场景目标'),
      value: text(scene.workspace.objective),
    },
    {
      id: `${packetId}-canon-current-state`,
      label: text('Current scene state', '当前场景状态'),
      value: text(scene.execution.acceptedSummary.sceneSummary),
    },
    ...scene.execution.acceptedSummary.acceptedFacts.map((fact, index) => ({
      id: fact.id || `${packetId}-canon-accepted-${String(index + 1).padStart(3, '0')}`,
      label: text(fact.label),
      value: text(fact.value),
    })),
  ]

  const castSummary = summarizeList(scene.setup.cast
    .filter((member) => member.selected)
    .map((member) => `${member.name} (${member.role}): ${member.agenda}`))
  const locationSummary = locationAsset
    ? `${locationAsset.title.en}: ${locationAsset.summary.en}`
    : scene.setup.identity.locationLabel
  const styleInstruction = summarizeList([
    `POV ${scene.setup.identity.title} should stay ${scene.execution.objective.pacingLabel?.toLowerCase() ?? 'controlled'} and ${scene.execution.objective.tensionLabel?.toLowerCase() ?? 'tense'}.`,
    `Preset: ${scene.setup.runtimePreset.presetOptions.find((preset) => preset.id === scene.setup.runtimePreset.selectedPresetId)?.summary ?? 'No preset summary provided.'}`,
  ])
  const warningCount = [...relevantAssets.values()].reduce(
    (count, asset) => count + (asset.contextPolicy?.warnings?.length ?? 0),
    0,
  )
  const activationSummary: RunContextActivationSummaryRecord = {
    includedAssetCount: assetActivations.filter((activation) => activation.decision === 'included').length,
    excludedAssetCount: assetActivations.filter((activation) => activation.decision === 'excluded').length,
    redactedAssetCount: assetActivations.filter((activation) => activation.decision === 'redacted').length,
    targetAgentCount: new Set(assetActivations.flatMap((activation) => activation.targetAgents)).size,
    warningCount,
  }
  const targetTokenBudget = 1500 + input.sequence * 100
  const narrative: SceneContextNarrativeRecord = {
    bookPremise: book.summary,
    chapterGoal: chapter.summary,
    sceneObjective: text(scene.workspace.objective),
    sceneSetup: text(scene.setup.identity.summary),
    currentState: text(scene.execution.acceptedSummary.sceneSummary),
    castSummary: text(castSummary || 'No cast selected for this scene context packet.'),
    locationSummary: text(locationSummary),
    styleInstruction: text(styleInstruction),
    visibilityExplanation: text(
      `${activationSummary.includedAssetCount} assets were included, ${activationSummary.excludedAssetCount} were excluded, and ${activationSummary.redactedAssetCount} stayed redacted.`,
      `已纳入 ${activationSummary.includedAssetCount} 项资产，排除 ${activationSummary.excludedAssetCount} 项，遮蔽 ${activationSummary.redactedAssetCount} 项。`,
    ),
    budgetSummary: text(
      `Budget ${targetTokenBudget} tokens across ${includedCanonFacts.length} canon anchors and ${includedAssets.length} included assets.`,
      `预算 ${targetTokenBudget} tokens，覆盖 ${includedCanonFacts.length} 条正典锚点与 ${includedAssets.length} 项已纳入资产。`,
    ),
  }

  return {
    version: 'scene-context-v1',
    packetId,
    sceneId: input.sceneId,
    narrative,
    sections: [
      {
        id: `${packetId}-section-narrative`,
        title: text('Narrative brief', '叙事摘要'),
        summary: text(
          `${book.title.en} premise, ${chapter.title.en} chapter goal, and the live scene objective were packed together.`,
          `已整理 ${book.title['zh-CN']} 的书级 premise、${chapter.title['zh-CN']} 的章节目标与当前场景目标。`,
        ),
        itemCount: 5,
      },
      {
        id: `${packetId}-section-canon`,
        title: text('Canon anchors', '正典锚点'),
        summary: text(
          'Accepted canon facts and current scene state remain the guardrails for planning and prose.',
          '已接受的正典事实与当前场景状态继续作为规划和正文的护栏。',
        ),
        itemCount: includedCanonFacts.length,
      },
      {
        id: `${packetId}-section-assets`,
        title: text('Asset activation', '资产激活'),
        summary: text(
          'Cast, location, constraints, and review-only rules were filtered through visibility policy before inclusion.',
          '登场角色、地点、约束与仅供评审的规则会先经过可见性策略过滤，再决定是否纳入。',
        ),
        itemCount: assetActivations.length,
      },
    ],
    includedCanonFacts,
    includedAssets,
    excludedPrivateFacts,
    assetActivations,
    activationSummary,
    outputSchemaLabel: text('Scene context packet schema', '场景上下文包结构'),
    tokenBudgetLabel: text(`Target budget ${targetTokenBudget} tokens`, `目标预算 ${targetTokenBudget} tokens`),
  }
}

export function renderSceneContextPacketForPlanner(packet: SceneContextPacketRecord, input: {
  mode?: string
  note?: string
}) {
  const modeLabel = trimText(input.mode) ?? 'continue'
  const noteLine = trimText(input.note) ? `Editorial note: ${trimText(input.note)}.` : undefined

  return [
    `Context packet ${packet.packetId}.`,
    `Book premise: ${packet.narrative.bookPremise.en}`,
    `Chapter goal: ${packet.narrative.chapterGoal.en}`,
    `Scene objective: ${packet.narrative.sceneObjective.en}`,
    `Scene setup: ${packet.narrative.sceneSetup.en}`,
    `Current state: ${packet.narrative.currentState.en}`,
    `Accepted canon facts: ${packet.includedCanonFacts.map((fact) => `${fact.label.en}: ${fact.value.en}`).join(' | ')}`,
    `Cast summary: ${packet.narrative.castSummary.en}`,
    `Location summary: ${packet.narrative.locationSummary.en}`,
    `Relevant asset facts: ${packet.includedAssets.map((asset) => `${asset.label.en}: ${asset.reason.en}`).join(' | ')}`,
    `Style instruction: ${packet.narrative.styleInstruction.en}`,
    `Visibility and redaction: ${packet.narrative.visibilityExplanation.en}`,
    `Context budget: ${packet.narrative.budgetSummary.en}`,
    `Requested mode: ${modeLabel}.`,
    noteLine,
  ].filter(Boolean).join(' ')
}

export function renderSceneContextPacketForWriter(packet: SceneContextPacketRecord, input: {
  decision: 'accept' | 'accept-with-edit'
  acceptedProposalIds: string[]
  selectedVariantIds?: string[]
  note?: string
}) {
  const acceptedProposalSummary = input.acceptedProposalIds.length > 0
    ? input.acceptedProposalIds.join(', ')
    : 'default accepted proposal'
  const selectedVariantSummary = input.selectedVariantIds?.length
    ? ` Selected variants: ${input.selectedVariantIds.join(', ')}.`
    : ''
  const noteLine = trimText(input.note) ? ` Editorial note: ${trimText(input.note)}.` : ''

  return [
    renderSceneContextPacketForPlanner(packet, {}),
    `Accepted decision: ${input.decision}.`,
    `Accepted proposals: ${acceptedProposalSummary}.${selectedVariantSummary}${noteLine}`.trim(),
  ].join(' ')
}
