import { ApiRequestError } from '@/app/project-runtime/api-transport'

import type {
  AgentInvocationArtifactDetailRecord,
  CanonPatchArtifactDetailRecord,
  ContextPacketArtifactDetailRecord,
  LocalizedTextRecord,
  ProposalSetArtifactDetailRecord,
  ProseDraftArtifactDetailRecord,
  RunArtifactDetailRecord,
  RunArtifactKind,
  RunArtifactListResponse,
  RunArtifactRelatedAssetRecord,
} from './run-artifact-records'
import type {
  RunEventKind,
  RunEventRecord,
  RunEventRefRecord,
  RunEventsPageRecord,
  RunRecord,
  RunReviewDecisionKind,
  RunSelectedProposalVariantRecord,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from './run-records'
import type {
  RunTraceLinkRecord,
  RunTraceNodeKind,
  RunTraceNodeRecord,
  RunTraceRelation,
  RunTraceResponse,
} from './run-trace-records'

const EVENT_PAGE_SIZE = 4
const DEFAULT_PROJECT_ID = 'book-signal-arc'

interface MockRunState {
  run: RunRecord
  events: RunEventRecord[]
  reviewDecisionsByReviewId: Record<string, RunReviewDecisionKind>
  selectedVariantsByReviewId: Record<string, RunSelectedProposalVariantRecord[]>
}

export interface MockRunStateSnapshot {
  run: RunRecord
  events: RunEventRecord[]
  reviewDecisionsByReviewId?: Record<string, RunReviewDecisionKind>
  selectedVariantsByReviewId?: Record<string, RunSelectedProposalVariantRecord[]>
}

export interface MockRunSnapshot {
  runStatesByProjectId: Record<string, MockRunStateSnapshot[]>
  runSceneSequencesByProjectId: Record<string, Record<string, number>>
}

const mockRunStatesByProjectId = new Map<string, Map<string, MockRunState>>()
const mockSceneRunSequenceByProjectId = new Map<string, Map<string, number>>()

function clone<T>(value: T): T {
  return structuredClone(value)
}

function toSequenceLabel(sequence: number) {
  return String(sequence).padStart(3, '0')
}

function buildRunId(sceneId: string, sequence: number) {
  return `run-${sceneId}-${toSequenceLabel(sequence)}`
}

function buildRunEventId(runId: string, order: number) {
  return `${runId.replace(/^run-/, 'run-event-')}-${toSequenceLabel(order)}`
}

function buildReviewId(sceneId: string, sequence: number) {
  return `review-${sceneId}-${toSequenceLabel(sequence)}`
}

function buildContextPacketId(sceneId: string, sequence: number) {
  return `ctx-${sceneId}-run-${toSequenceLabel(sequence)}`
}

function buildProposalSetId(sceneId: string, sequence: number) {
  return `proposal-set-${sceneId}-run-${toSequenceLabel(sequence)}`
}

function buildAgentInvocationId(sceneId: string, sequence: number, index: number) {
  return `agent-invocation-${sceneId}-run-${toSequenceLabel(sequence)}-${toSequenceLabel(index)}`
}

function buildCanonPatchId(sceneId: string, sequence: number) {
  return `canon-patch-${sceneId}-${toSequenceLabel(sequence)}`
}

function buildProseDraftId(sceneId: string, sequence: number) {
  return `prose-draft-${sceneId}-${toSequenceLabel(sequence)}`
}

function buildTraceLinkId(runId: string, relation: RunTraceRelation, index: number) {
  return `trace-link-${runId.replace(/^run-/, '')}-${relation}-${toSequenceLabel(index)}`
}

function buildTimelineLabel(order: number) {
  return `2026-04-21 10:${String(order).padStart(2, '0')}`
}

function createEvent(
  runId: string,
  order: number,
  kind: RunEventKind,
  label: string,
  summary: string,
  refs?: RunEventRefRecord[],
  metadata?: RunEventRecord['metadata'],
): RunEventRecord {
  return {
    id: buildRunEventId(runId, order),
    runId,
    order,
    kind,
    label,
    summary,
    createdAtLabel: buildTimelineLabel(order),
    refs,
    metadata,
  }
}

function createContextPacketEventMetadata(): RunEventRecord['metadata'] {
  return {
    includedAssetCount: 3,
    excludedAssetCount: 1,
    redactedAssetCount: 1,
  }
}

function text(en: string, zhCN = en): LocalizedTextRecord {
  return {
    en,
    'zh-CN': zhCN,
  }
}

function isRunArtifactKind(kind: RunEventRefRecord['kind']): kind is RunArtifactKind {
  return (
    kind === 'context-packet'
    || kind === 'agent-invocation'
    || kind === 'proposal-set'
    || kind === 'canon-patch'
    || kind === 'prose-draft'
  )
}

function formatSceneName(sceneId: string) {
  return sceneId.replace(/^scene-/, '').split('-').filter(Boolean).join(' ')
}

function getRunBucket(projectId = DEFAULT_PROJECT_ID, createIfMissing = false) {
  const existing = mockRunStatesByProjectId.get(projectId)
  if (existing) {
    return existing
  }

  if (!createIfMissing) {
    return undefined
  }

  const next = new Map<string, MockRunState>()
  mockRunStatesByProjectId.set(projectId, next)
  return next
}

function getSequenceBucket(projectId = DEFAULT_PROJECT_ID, createIfMissing = false) {
  const existing = mockSceneRunSequenceByProjectId.get(projectId)
  if (existing) {
    return existing
  }

  if (!createIfMissing) {
    return undefined
  }

  const next = new Map<string, number>()
  mockSceneRunSequenceByProjectId.set(projectId, next)
  return next
}

function setRunState(
  projectId: string,
  run: RunRecord,
  events: RunEventRecord[],
  reviewDecisionsByReviewId: Record<string, RunReviewDecisionKind> = {},
  selectedVariantsByReviewId: Record<string, RunSelectedProposalVariantRecord[]> = {},
) {
  const bucket = getRunBucket(projectId, true)
  bucket!.set(run.id, {
    run: clone(run),
    events: clone(events),
    reviewDecisionsByReviewId: clone(reviewDecisionsByReviewId),
    selectedVariantsByReviewId: clone(selectedVariantsByReviewId),
  })
}

function requireRunState(runId: string, projectId = DEFAULT_PROJECT_ID) {
  const state = getRunBucket(projectId)?.get(runId)
  if (!state) {
    throw new ApiRequestError({
      status: 404,
      message: `Run ${runId} was not found.`,
      code: 'run-not-found',
    })
  }

  return state
}

function appendRunEvent(
  state: MockRunState,
  kind: RunEventKind,
  label: string,
  summary: string,
  refs?: RunEventRefRecord[],
  metadata?: RunEventRecord['metadata'],
) {
  const nextOrder = state.events.length + 1
  const event = createEvent(state.run.id, nextOrder, kind, label, summary, refs, metadata)
  state.events.push(event)
  state.run.latestEventId = event.id
  state.run.eventCount = state.events.length
  return event
}

function extractRunSequence(runId: string) {
  const sequence = Number.parseInt(runId.slice(runId.lastIndexOf('-') + 1), 10)
  return Number.isNaN(sequence) ? 1 : sequence
}

interface MockArtifactEntry {
  id: string
  kind: RunArtifactKind
  sourceEventIds: string[]
}

function getArtifactSortIndex(kind: RunArtifactKind, id: string) {
  const baseIndex: Record<RunArtifactKind, number> = {
    'context-packet': 1,
    'agent-invocation': 2,
    'proposal-set': 3,
    'canon-patch': 4,
    'prose-draft': 5,
  }

  return `${baseIndex[kind]}:${id}`
}

function collectArtifactEntries(state: MockRunState): MockArtifactEntry[] {
  const entriesById = new Map<string, MockArtifactEntry>()

  for (const event of state.events) {
    for (const ref of event.refs ?? []) {
      if (!isRunArtifactKind(ref.kind)) {
        continue
      }

      const existing = entriesById.get(ref.id)
      if (existing) {
        if (!existing.sourceEventIds.includes(event.id)) {
          existing.sourceEventIds.push(event.id)
        }
        continue
      }

      entriesById.set(ref.id, {
        id: ref.id,
        kind: ref.kind,
        sourceEventIds: [event.id],
      })
    }
  }

  return Array.from(entriesById.values()).sort((left, right) =>
    getArtifactSortIndex(left.kind, left.id).localeCompare(getArtifactSortIndex(right.kind, right.id)),
  )
}

function getEventLabel(state: MockRunState, eventId: string) {
  return state.events.find((event) => event.id === eventId)?.createdAtLabel
}

function buildArtifactSummary(state: MockRunState, entry: MockArtifactEntry) {
  const sceneName = formatSceneName(state.run.scopeId)
  const sourceEventLabel = entry.sourceEventIds.map((eventId) => getEventLabel(state, eventId)).find(Boolean)
  const statusLabels: Record<RunArtifactKind, LocalizedTextRecord> = {
    'context-packet': text('Built'),
    'agent-invocation': text('Completed'),
    'proposal-set': text('Ready for review'),
    'canon-patch': text('Applied'),
    'prose-draft': text('Generated'),
  }
  const titles: Record<RunArtifactKind, LocalizedTextRecord> = {
    'context-packet': text('Scene context packet'),
    'agent-invocation': entry.id.endsWith('-002') ? text('Writer invocation') : text('Planner invocation'),
    'proposal-set': text('Scene proposal set'),
    'canon-patch': text('Canon patch'),
    'prose-draft': text('Prose draft'),
  }
  const summaries: Record<RunArtifactKind, LocalizedTextRecord> = {
    'context-packet': text(`Packed context for ${sceneName}.`),
    'agent-invocation': text(`Fixture agent output is ready for ${sceneName}.`),
    'proposal-set': text(`Proposal candidates for ${sceneName} are ready for review.`),
    'canon-patch': text(`Accepted proposal changes were compiled into canon for ${sceneName}.`),
    'prose-draft': text(`A fixture prose draft was rendered for ${sceneName}.`),
  }

  return {
    id: entry.id,
    runId: state.run.id,
    kind: entry.kind,
    title: titles[entry.kind],
    summary: summaries[entry.kind],
    statusLabel: statusLabels[entry.kind],
    createdAtLabel: text(sourceEventLabel ?? 'Linked event 000'),
    sourceEventIds: [...entry.sourceEventIds],
  }
}

function buildLeadAsset(sceneId: string): RunArtifactRelatedAssetRecord {
  return {
    assetId: `asset-${sceneId}-lead`,
    kind: 'character',
    label: text(`${formatSceneName(sceneId)} lead`),
  }
}

function buildSettingAsset(sceneId: string): RunArtifactRelatedAssetRecord {
  return {
    assetId: `asset-${sceneId}-setting`,
    kind: 'location',
    label: text(`${formatSceneName(sceneId)} setting`),
  }
}

function buildProposalIds(proposalSetId: string) {
  return [`${proposalSetId}-proposal-001`, `${proposalSetId}-proposal-002`]
}

function getArtifactEntriesByKind(state: MockRunState, kind: RunArtifactKind) {
  return collectArtifactEntries(state).filter((entry) => entry.kind === kind)
}

function getFirstArtifactEntry(state: MockRunState, kind: RunArtifactKind) {
  return getArtifactEntriesByKind(state, kind)[0]
}

function getProposalSetId(state: MockRunState) {
  return getFirstArtifactEntry(state, 'proposal-set')?.id ?? buildProposalSetId(state.run.scopeId, extractRunSequence(state.run.id))
}

function getContextPacketId(state: MockRunState) {
  return getFirstArtifactEntry(state, 'context-packet')?.id ?? buildContextPacketId(state.run.scopeId, extractRunSequence(state.run.id))
}

function getAgentInvocationIds(state: MockRunState) {
  return getArtifactEntriesByKind(state, 'agent-invocation').map((entry) => entry.id)
}

function getCanonPatchId(state: MockRunState) {
  return getFirstArtifactEntry(state, 'canon-patch')?.id ?? buildCanonPatchId(state.run.scopeId, extractRunSequence(state.run.id))
}

function getReviewDecision(state: MockRunState): CanonPatchArtifactDetailRecord['decision'] {
  const acceptedDecisions = Object.values(state.reviewDecisionsByReviewId).filter(
    (decision): decision is CanonPatchArtifactDetailRecord['decision'] =>
      decision === 'accept' || decision === 'accept-with-edit',
  )

  return acceptedDecisions.at(-1) ?? 'accept'
}

function getReviewId(state: MockRunState) {
  return state.run.pendingReviewId ?? buildReviewId(state.run.scopeId, extractRunSequence(state.run.id))
}

function getSelectedVariants(state: MockRunState) {
  return clone(state.selectedVariantsByReviewId[getReviewId(state)] ?? [])
}

function getAcceptedProposalIds(state: MockRunState) {
  const proposalSetId = getProposalSetId(state)
  return [getReviewDecision(state) === 'accept-with-edit' ? `${proposalSetId}-proposal-002` : `${proposalSetId}-proposal-001`]
}

function getSelectedVariantsForProposalIds(state: MockRunState, proposalIds: string[]) {
  return getSelectedVariants(state).filter((selectedVariant) => proposalIds.includes(selectedVariant.proposalId))
}

function buildContextPacketDetail(state: MockRunState, entry: MockArtifactEntry): ContextPacketArtifactDetailRecord {
  const assetActivations: NonNullable<ContextPacketArtifactDetailRecord['assetActivations']> = [
    {
      id: `${entry.id}-activation-ren-voss`,
      assetId: 'asset-ren-voss',
      assetTitle: text('Ren Voss'),
      assetKind: 'character',
      decision: 'included',
      reasonKind: 'scene-cast',
      reasonLabel: text('Cast member'),
      visibility: 'character-known',
      budget: 'selected-facts',
      targetAgents: ['scene-manager', 'character-agent', 'prose-agent'],
      policyRuleIds: ['ren-scene-cast'],
      note: text('Selected Ren facts entered the packet; private signal notes stayed out.'),
    },
    {
      id: `${entry.id}-activation-mei-arden`,
      assetId: 'asset-mei-arden',
      assetTitle: text('Mei Arden'),
      assetKind: 'character',
      decision: 'included',
      reasonKind: 'scene-cast',
      reasonLabel: text('Cast pressure'),
      visibility: 'public',
      budget: 'selected-facts',
      targetAgents: ['scene-manager', 'character-agent', 'prose-agent'],
      policyRuleIds: ['mei-scene-cast'],
    },
    {
      id: `${entry.id}-activation-midnight-platform`,
      assetId: 'asset-midnight-platform',
      assetTitle: text('Midnight Platform'),
      assetKind: 'location',
      decision: 'included',
      reasonKind: 'scene-location',
      reasonLabel: text('Scene location'),
      visibility: 'public',
      budget: 'mentions-excerpts',
      targetAgents: ['scene-manager', 'prose-agent'],
      policyRuleIds: ['platform-scene-location'],
    },
    {
      id: `${entry.id}-activation-ledger-stays-shut`,
      assetId: 'asset-ledger-stays-shut',
      assetTitle: text('Ledger Stays Shut'),
      assetKind: 'rule',
      decision: 'excluded',
      reasonKind: 'rule-dependency',
      reasonLabel: text('Rule dependency'),
      visibility: 'spoiler',
      budget: 'summary-only',
      targetAgents: ['continuity-reviewer', 'scene-manager'],
      policyRuleIds: ['ledger-rule-dependency'],
      note: text('Spoiler proof contents were excluded from the context packet.'),
    },
    {
      id: `${entry.id}-activation-departure-bell-timing`,
      assetId: 'asset-departure-bell-timing',
      assetTitle: text('Departure Bell Timing'),
      assetKind: 'rule',
      decision: 'redacted',
      reasonKind: 'review-issue',
      reasonLabel: text('Editor timing guardrail'),
      visibility: 'editor-only',
      budget: 'summary-only',
      targetAgents: ['continuity-reviewer'],
      policyRuleIds: ['bell-editor-guardrail'],
      note: text('Exact editor-only timing remained redacted.'),
    },
  ]

  return {
    ...buildArtifactSummary(state, entry),
    kind: 'context-packet',
    sceneId: state.run.scopeId,
    sections: [
      {
        id: `${entry.id}-section-brief`,
        title: text('Scene brief'),
        summary: text('Scene setup, continuity, and editorial intent were packed.'),
        itemCount: 3,
      },
      {
        id: `${entry.id}-section-canon`,
        title: text('Canon anchors'),
        summary: text('Approved canon facts were selected as guardrails.'),
        itemCount: 2,
      },
    ],
    includedCanonFacts: [
      {
        id: `${entry.id}-canon-fact-001`,
        label: text('Scene objective'),
        value: text('Preserve the next visible beat before introducing a reveal.'),
      },
    ],
    includedAssets: [
      {
        assetId: 'asset-ren-voss',
        label: text('Ren Voss'),
        kind: 'character',
        reason: text('Carries the primary point of view through the platform bargain.'),
      },
      {
        assetId: 'asset-mei-arden',
        label: text('Mei Arden'),
        kind: 'character',
        reason: text('Supplies the visible counter-pressure for the exchange.'),
      },
      {
        assetId: 'asset-midnight-platform',
        label: text('Midnight Platform'),
        kind: 'location',
        reason: text('Keeps witness pressure and staging anchored to the platform.'),
      },
    ],
    excludedPrivateFacts: [
      {
        id: `${entry.id}-excluded-001`,
        label: text('Deferred reveal'),
        reason: text('Private reveal notes stay out until review lands.'),
      },
    ],
    assetActivations,
    activationSummary: {
      includedAssetCount: assetActivations.filter((activation) => activation.decision === 'included').length,
      excludedAssetCount: assetActivations.filter((activation) => activation.decision === 'excluded').length,
      redactedAssetCount: assetActivations.filter((activation) => activation.decision === 'redacted').length,
      targetAgentCount: new Set(assetActivations.flatMap((activation) => activation.targetAgents)).size,
      warningCount: 1,
    },
    outputSchemaLabel: text('Scene context packet schema'),
    tokenBudgetLabel: text(`Target budget ${1500 + extractRunSequence(state.run.id) * 100} tokens`),
  }
}

function buildAgentInvocationDetail(state: MockRunState, entry: MockArtifactEntry): AgentInvocationArtifactDetailRecord {
  const isWriter = entry.id.endsWith('-002')
  const proposalSetId = getProposalSetId(state)

  return {
    ...buildArtifactSummary(state, entry),
    kind: 'agent-invocation',
    agentRole: isWriter ? 'scene-writer' : 'scene-planner',
    modelLabel: isWriter ? text('Fixture writer profile') : text('Fixture planner profile'),
    inputSummary: text('Consumes the packed scene context and editorial run note.'),
    outputSummary: isWriter
      ? text('Produces prose-shaping fixture output for the proposal set.')
      : text('Produces structured proposal candidates for editorial review.'),
    contextPacketId: getContextPacketId(state),
    outputSchemaLabel: isWriter ? text('Prose draft scaffold schema') : text('Proposal candidate schema'),
    generatedRefs: [
      {
        kind: 'proposal-set',
        id: proposalSetId,
        label: text('Scene proposal set'),
      },
    ],
  }
}

function buildProposalSetDetail(state: MockRunState, entry: MockArtifactEntry): ProposalSetArtifactDetailRecord {
  const [proposalOneId, proposalTwoId] = buildProposalIds(entry.id)
  const selectedVariantByProposalId = new Map(
    getSelectedVariants(state).map((selectedVariant) => [selectedVariant.proposalId, selectedVariant.variantId]),
  )

  return {
    ...buildArtifactSummary(state, entry),
    kind: 'proposal-set',
    reviewId: getReviewId(state),
    sourceInvocationIds: getAgentInvocationIds(state),
    proposals: [
      {
        id: proposalOneId,
        title: text('Anchor the arrival beat', '锚定入场节拍'),
        summary: text('Open on the scene before introducing any new reveal.', '先打开场景，再引入新的揭示。'),
        changeKind: 'action',
        riskLabel: text('Low continuity risk', '低连续性风险'),
        relatedAssets: [buildLeadAsset(state.run.scopeId)],
        variants: [
          {
            id: 'variant-midnight-platform-default',
            label: text('Balanced arrival', '平衡入场'),
            summary: text(
              'Keep the arrival beat steady and let the reveal wait until the setting is established.',
              '保持入场节拍稳定，等场景建立后再让揭示出现。',
            ),
            rationale: text(
              'This keeps the accepted canon easy to trace without forcing a high-tension rewrite.',
              '这能保持已接受 canon 易于追溯，同时不强行推高冲突。',
            ),
            tradeoffLabel: text('Slower reveal pressure', '揭示压力较慢'),
            riskLabel: text('Low continuity risk', '低连续性风险'),
            relatedAssets: [buildLeadAsset(state.run.scopeId)],
          },
          {
            id: 'variant-midnight-platform-raise-conflict',
            label: text('Higher conflict', '提高冲突'),
            summary: text(
              'Let the lead confront the platform signal immediately and raise the scene pressure.',
              '让主角立刻面对站台信号，抬高场景压力。',
            ),
            rationale: text(
              'This gives review a sharper alternative while keeping the source proposal unchanged.',
              '这为审阅提供更锐利的候选版本，同时保持源 proposal 不变。',
            ),
            tradeoffLabel: text('Sharper transition cost', '转场更陡'),
            riskLabel: text('Medium assembly risk', '中等拼接风险'),
            relatedAssets: [buildLeadAsset(state.run.scopeId), buildSettingAsset(state.run.scopeId)],
          },
        ],
        defaultVariantId: 'variant-midnight-platform-default',
        selectedVariantId: selectedVariantByProposalId.get(proposalOneId),
      },
      {
        id: proposalTwoId,
        title: text('Stage the reveal through the setting', '通过场景调度揭示'),
        summary: text('Let the setting carry the reveal instead of adding exposition.', '让环境承载揭示，而不是增加说明。'),
        changeKind: 'reveal',
        riskLabel: text('Editor check recommended', '建议编辑检查'),
        relatedAssets: [buildSettingAsset(state.run.scopeId)],
      },
    ],
    reviewOptions: [
      { decision: 'accept', label: text('Accept'), description: text('Apply the proposal set without further changes.') },
      { decision: 'accept-with-edit', label: text('Accept with edit'), description: text('Apply the proposal set with editorial adjustments.') },
      { decision: 'request-rewrite', label: text('Request rewrite'), description: text('Close this run and start a new run with rewrite guidance when ready.') },
      { decision: 'reject', label: text('Reject'), description: text('Close the run without producing canon or prose artifacts.') },
    ],
  }
}

function buildCanonPatchDetail(state: MockRunState, entry: MockArtifactEntry): CanonPatchArtifactDetailRecord {
  const proposalSetId = getProposalSetId(state)
  const decision = getReviewDecision(state)
  const acceptedProposalIds = getAcceptedProposalIds(state)
  const selectedVariants = getSelectedVariantsForProposalIds(state, acceptedProposalIds)
  const acceptedFacts = acceptedProposalIds.map((proposalId, index) => {
    const factSelectedVariants = getSelectedVariantsForProposalIds(state, [proposalId])

    return {
      id: `${entry.id}-fact-${toSequenceLabel(index + 1)}`,
      label: text(`Accepted fact ${index + 1}`),
      value: proposalId.endsWith('002')
        ? text('The scene now carries an approved reveal through the environment.')
        : text('The scene now opens on a stable arrival beat.'),
      sourceProposalIds: [proposalId],
      ...(factSelectedVariants.length > 0 ? { selectedVariants: factSelectedVariants } : {}),
      relatedAssets: proposalId.endsWith('002') ? [buildSettingAsset(state.run.scopeId)] : [buildLeadAsset(state.run.scopeId)],
    }
  })

  return {
    ...buildArtifactSummary(state, entry),
    kind: 'canon-patch',
    decision,
    sourceProposalSetId: proposalSetId,
    acceptedProposalIds,
    ...(selectedVariants.length > 0 ? { selectedVariants } : {}),
    acceptedFacts,
    traceLinkIds: [
      buildTraceLinkId(state.run.id, 'accepted_into', 1),
      buildTraceLinkId(state.run.id, 'accepted_into', 2),
    ],
  }
}

function buildProseDraftDetail(state: MockRunState, entry: MockArtifactEntry): ProseDraftArtifactDetailRecord {
  const acceptedProposalIds = getAcceptedProposalIds(state)
  const selectedVariants = getSelectedVariantsForProposalIds(state, acceptedProposalIds)

  return {
    ...buildArtifactSummary(state, entry),
    kind: 'prose-draft',
    sourceCanonPatchId: getCanonPatchId(state),
    sourceProposalIds: acceptedProposalIds,
    ...(selectedVariants.length > 0 ? { selectedVariants } : {}),
    body: text(
      'The scene opens from the accepted run artifact, keeping the selected review material visible in the draft.',
      '场景从已采纳的运行产物展开，并把选中的审阅材料保留在草稿里。',
    ),
    excerpt: text('The scene settles into view before the next reveal turns visible.'),
    wordCount: 140 + extractRunSequence(state.run.id) * 3,
    relatedAssets: [buildLeadAsset(state.run.scopeId), buildSettingAsset(state.run.scopeId)],
    traceLinkIds: [buildTraceLinkId(state.run.id, 'rendered_as', 1)],
  }
}

function buildArtifactDetail(state: MockRunState, entry: MockArtifactEntry): RunArtifactDetailRecord {
  switch (entry.kind) {
    case 'context-packet':
      return buildContextPacketDetail(state, entry)
    case 'agent-invocation':
      return buildAgentInvocationDetail(state, entry)
    case 'proposal-set':
      return buildProposalSetDetail(state, entry)
    case 'canon-patch':
      return buildCanonPatchDetail(state, entry)
    case 'prose-draft':
      return buildProseDraftDetail(state, entry)
  }
}

function addTraceNode(nodesById: Map<string, RunTraceNodeRecord>, node: RunTraceNodeRecord) {
  if (!nodesById.has(node.id)) {
    nodesById.set(node.id, node)
  }
}

function addTraceLink(
  state: {
    links: RunTraceLinkRecord[]
    nodesById: Map<string, RunTraceNodeRecord>
    missingTraceCount: number
  },
  runId: string,
  relationCounts: Map<RunTraceRelation, number>,
  input: {
    from: { id: string; kind: RunTraceNodeKind }
    to: { id: string; kind: RunTraceNodeKind }
    relation: RunTraceRelation
    label: LocalizedTextRecord
  },
) {
  if (state.nodesById.get(input.from.id)?.kind !== input.from.kind || state.nodesById.get(input.to.id)?.kind !== input.to.kind) {
    state.missingTraceCount += 1
    return
  }

  const index = (relationCounts.get(input.relation) ?? 0) + 1
  relationCounts.set(input.relation, index)
  state.links.push({
    id: buildTraceLinkId(runId, input.relation, index),
    from: input.from,
    to: input.to,
    relation: input.relation,
    label: input.label,
  })
}

function buildTraceResponse(state: MockRunState): RunTraceResponse {
  const entries = collectArtifactEntries(state)
  const details = entries.map((entry) => buildArtifactDetail(state, entry))
  const nodesById = new Map<string, RunTraceNodeRecord>()
  const traceState = {
    links: [] as RunTraceLinkRecord[],
    nodesById,
    missingTraceCount: 0,
  }
  const relationCounts = new Map<RunTraceRelation, number>()
  const contextPacket = details.find((detail): detail is ContextPacketArtifactDetailRecord => detail.kind === 'context-packet')
  const proposalSet = details.find((detail): detail is ProposalSetArtifactDetailRecord => detail.kind === 'proposal-set')
  const canonPatch = details.find((detail): detail is CanonPatchArtifactDetailRecord => detail.kind === 'canon-patch')
  const proseDraft = details.find((detail): detail is ProseDraftArtifactDetailRecord => detail.kind === 'prose-draft')
  const agentInvocations = details.filter((detail): detail is AgentInvocationArtifactDetailRecord => detail.kind === 'agent-invocation')

  for (const detail of details) {
    addTraceNode(nodesById, {
      id: detail.id,
      kind: detail.kind,
      label: detail.title,
    })
  }

  if (proposalSet) {
    addTraceNode(nodesById, {
      id: proposalSet.reviewId,
      kind: 'review',
      label: text('Editorial review'),
    })

    for (const proposal of proposalSet.proposals) {
      addTraceNode(nodesById, {
        id: proposal.id,
        kind: 'proposal',
        label: proposal.title,
      })
      for (const asset of proposal.relatedAssets) {
        addTraceNode(nodesById, {
          id: asset.assetId,
          kind: 'asset',
          label: asset.label,
        })
      }
    }
  }

  if (canonPatch) {
    for (const acceptedFact of canonPatch.acceptedFacts) {
      addTraceNode(nodesById, {
        id: acceptedFact.id,
        kind: 'canon-fact',
        label: acceptedFact.label,
      })
      for (const asset of acceptedFact.relatedAssets) {
        addTraceNode(nodesById, {
          id: asset.assetId,
          kind: 'asset',
          label: asset.label,
        })
      }
    }
  }

  if (proseDraft) {
    for (const asset of proseDraft.relatedAssets) {
      addTraceNode(nodesById, {
        id: asset.assetId,
        kind: 'asset',
        label: asset.label,
      })
    }
  }

  for (const invocation of agentInvocations) {
    addTraceLink(traceState, state.run.id, relationCounts, {
      from: { id: invocation.contextPacketId ?? contextPacket?.id ?? '', kind: 'context-packet' },
      to: { id: invocation.id, kind: 'agent-invocation' },
      relation: 'used_context',
      label: text('Used context'),
    })
  }

  if (proposalSet) {
    for (const sourceInvocationId of proposalSet.sourceInvocationIds) {
      addTraceLink(traceState, state.run.id, relationCounts, {
        from: { id: sourceInvocationId, kind: 'agent-invocation' },
        to: { id: proposalSet.id, kind: 'proposal-set' },
        relation: 'generated',
        label: text('Generated'),
      })
    }

    for (const proposal of proposalSet.proposals) {
      addTraceLink(traceState, state.run.id, relationCounts, {
        from: { id: proposalSet.id, kind: 'proposal-set' },
        to: { id: proposal.id, kind: 'proposal' },
        relation: 'proposed',
        label: text('Proposed'),
      })
      for (const asset of proposal.relatedAssets) {
        addTraceLink(traceState, state.run.id, relationCounts, {
          from: { id: proposal.id, kind: 'proposal' },
          to: { id: asset.assetId, kind: 'asset' },
          relation: 'mentions',
          label: text('Mentions'),
        })
      }
    }

    addTraceLink(traceState, state.run.id, relationCounts, {
      from: { id: proposalSet.id, kind: 'proposal-set' },
      to: { id: proposalSet.reviewId, kind: 'review' },
      relation: 'reviewed_by',
      label: text('Reviewed by'),
    })
  }

  if (canonPatch) {
    for (const acceptedFact of canonPatch.acceptedFacts) {
      for (const proposalId of acceptedFact.sourceProposalIds) {
        addTraceLink(traceState, state.run.id, relationCounts, {
          from: { id: proposalId, kind: 'proposal' },
          to: { id: acceptedFact.id, kind: 'canon-fact' },
          relation: 'accepted_into',
          label: text('Accepted into canon'),
        })
      }
      addTraceLink(traceState, state.run.id, relationCounts, {
        from: { id: acceptedFact.id, kind: 'canon-fact' },
        to: { id: canonPatch.id, kind: 'canon-patch' },
        relation: 'accepted_into',
        label: text('Belongs to canon patch'),
      })
    }
  }

  if (proseDraft) {
    addTraceLink(traceState, state.run.id, relationCounts, {
      from: { id: proseDraft.sourceCanonPatchId, kind: 'canon-patch' },
      to: { id: proseDraft.id, kind: 'prose-draft' },
      relation: 'rendered_as',
      label: text('Rendered as prose'),
    })
  }

  const nodes = Array.from(nodesById.values())

  return {
    runId: state.run.id,
    links: traceState.links,
    nodes,
    summary: {
      proposalSetCount: nodes.filter((node) => node.kind === 'proposal-set').length,
      canonPatchCount: nodes.filter((node) => node.kind === 'canon-patch').length,
      proseDraftCount: nodes.filter((node) => node.kind === 'prose-draft').length,
      missingTraceCount: traceState.missingTraceCount,
    },
  }
}

function buildSeedRun() {
  const sceneId = 'scene-midnight-platform'
  const sequence = 1
  const runId = buildRunId(sceneId, sequence)
  const reviewId = buildReviewId(sceneId, sequence)
  const events = [
    createEvent(runId, 1, 'run_created', 'Run created', 'Scene run request accepted.'),
    createEvent(runId, 2, 'run_started', 'Run started', 'Narrative runtime started the scene run.'),
    createEvent(runId, 3, 'context_packet_built', 'Context packet built', 'Runtime assembled the scene context packet.', [
      {
        kind: 'context-packet',
        id: buildContextPacketId(sceneId, sequence),
      },
    ], createContextPacketEventMetadata()),
    createEvent(runId, 4, 'agent_invocation_started', 'Planner invocation started', 'Planning agent invocation started.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 1),
      },
    ]),
    createEvent(runId, 5, 'agent_invocation_completed', 'Planner invocation completed', 'Planning agent returned proposal candidates.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 1),
      },
    ]),
    createEvent(runId, 6, 'agent_invocation_started', 'Writer invocation started', 'Writer agent invocation started.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 2),
      },
    ]),
    createEvent(runId, 7, 'agent_invocation_completed', 'Writer invocation completed', 'Writer agent returned prose candidates.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 2),
      },
    ]),
    createEvent(runId, 8, 'proposal_created', 'Proposal set created', 'A proposal set is ready for review.', [
      {
        kind: 'proposal-set',
        id: buildProposalSetId(sceneId, sequence),
      },
    ]),
    createEvent(runId, 9, 'review_requested', 'Review requested', 'Editorial review is waiting on the proposal set.', [
      {
        kind: 'review',
        id: reviewId,
      },
    ]),
  ]
  const run: RunRecord = {
    id: runId,
    scope: 'scene',
    scopeId: sceneId,
    status: 'waiting_review',
    title: 'Midnight platform scene run',
    summary: 'Planner and writer output are ready for editorial review.',
    startedAtLabel: buildTimelineLabel(1),
    pendingReviewId: reviewId,
    latestEventId: events.at(-1)?.id,
    eventCount: events.length,
  }

  return { run, events, sceneId, sequence }
}

function seedMockRunDb() {
  mockRunStatesByProjectId.clear()
  mockSceneRunSequenceByProjectId.clear()

  const seed = buildSeedRun()
  setRunState(DEFAULT_PROJECT_ID, seed.run, seed.events)
  getSequenceBucket(DEFAULT_PROJECT_ID, true)!.set(seed.sceneId, seed.sequence)
}

function trimNote(note?: string) {
  const value = note?.trim()
  return value ? value : undefined
}

function updateProjectRunState(
  projectId: string,
  run: RunRecord,
  events: RunEventRecord[],
  reviewDecisionsByReviewId: Record<string, RunReviewDecisionKind> = {},
  selectedVariantsByReviewId: Record<string, RunSelectedProposalVariantRecord[]> = {},
) {
  setRunState(projectId, run, events, reviewDecisionsByReviewId, selectedVariantsByReviewId)
  return clone(run)
}

export function getMockRun(runId: string, projectId = DEFAULT_PROJECT_ID): RunRecord | null {
  return clone(getRunBucket(projectId)?.get(runId)?.run ?? null)
}

export function getMockRunEvents(
  {
    runId,
    cursor,
  }: {
    runId: string
    cursor?: string
  },
  projectId = DEFAULT_PROJECT_ID,
): RunEventsPageRecord {
  const state = requireRunState(runId, projectId)
  const startIndex = cursor
    ? (() => {
        const cursorIndex = state.events.findIndex((event) => event.id === cursor)
        if (cursorIndex < 0) {
          throw new ApiRequestError({
            status: 409,
            message: `Run cursor ${cursor} does not exist for ${runId}.`,
            code: 'run-events-cursor-conflict',
          })
        }

        return cursorIndex + 1
      })()
    : 0

  const pageEvents = state.events.slice(startIndex, startIndex + EVENT_PAGE_SIZE)
  const hasMore = startIndex + pageEvents.length < state.events.length

  return {
    runId,
    events: clone(pageEvents),
    nextCursor: hasMore ? pageEvents.at(-1)?.id : undefined,
  }
}

export function getMockRunArtifacts(
  {
    runId,
  }: {
    runId: string
  },
  projectId = DEFAULT_PROJECT_ID,
): RunArtifactListResponse {
  const state = requireRunState(runId, projectId)

  return {
    runId,
    artifacts: collectArtifactEntries(state).map((entry) => buildArtifactSummary(state, entry)),
  }
}

export function getMockRunArtifact(
  {
    runId,
    artifactId,
  }: {
    runId: string
    artifactId: string
  },
  projectId = DEFAULT_PROJECT_ID,
) {
  const state = requireRunState(runId, projectId)
  const entry = collectArtifactEntries(state).find((artifactEntry) => artifactEntry.id === artifactId)

  if (!entry) {
    throw new ApiRequestError({
      status: 404,
      message: `Run artifact ${artifactId} was not found.`,
      code: 'run-artifact-not-found',
      detail: {
        runId,
        artifactId,
      },
    })
  }

  return {
    artifact: buildArtifactDetail(state, entry),
  }
}

export function getMockRunTrace(
  {
    runId,
  }: {
    runId: string
  },
  projectId = DEFAULT_PROJECT_ID,
): RunTraceResponse {
  return buildTraceResponse(requireRunState(runId, projectId))
}

export function startMockSceneRun(input: StartSceneRunInput, projectId = DEFAULT_PROJECT_ID): RunRecord {
  const sequenceBucket = getSequenceBucket(projectId, true)
  const nextSequence = (sequenceBucket?.get(input.sceneId) ?? 0) + 1
  sequenceBucket!.set(input.sceneId, nextSequence)

  const runId = buildRunId(input.sceneId, nextSequence)
  const reviewId = buildReviewId(input.sceneId, nextSequence)
  const note = trimNote(input.note)
  const modeLabel = input.mode ?? 'continue'
  const events = [
    createEvent(runId, 1, 'run_created', 'Run created', `Scene run was created in ${modeLabel} mode.`),
    createEvent(runId, 2, 'run_started', 'Run started', 'Narrative runtime started the scene run.'),
    createEvent(runId, 3, 'context_packet_built', 'Context packet built', 'Runtime assembled the scene context packet.', [
      {
        kind: 'context-packet',
        id: buildContextPacketId(input.sceneId, nextSequence),
      },
    ], createContextPacketEventMetadata()),
    createEvent(runId, 4, 'agent_invocation_started', 'Planner invocation started', 'Planning agent invocation started.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(input.sceneId, nextSequence, 1),
      },
    ]),
    createEvent(runId, 5, 'agent_invocation_completed', 'Planner invocation completed', 'Planning agent returned proposal candidates.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(input.sceneId, nextSequence, 1),
      },
    ]),
    createEvent(runId, 6, 'agent_invocation_started', 'Writer invocation started', 'Writer agent invocation started.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(input.sceneId, nextSequence, 2),
      },
    ]),
    createEvent(runId, 7, 'agent_invocation_completed', 'Writer invocation completed', 'Writer agent returned prose candidates.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(input.sceneId, nextSequence, 2),
      },
    ]),
    createEvent(runId, 8, 'proposal_created', 'Proposal set created', 'A proposal set is ready for review.', [
      {
        kind: 'proposal-set',
        id: buildProposalSetId(input.sceneId, nextSequence),
      },
    ]),
    createEvent(runId, 9, 'review_requested', 'Review requested', 'Editorial review is waiting on the proposal set.', [
      {
        kind: 'review',
        id: reviewId,
      },
    ]),
  ]
  const run: RunRecord = {
    id: runId,
    scope: 'scene',
    scopeId: input.sceneId,
    status: 'waiting_review',
    title: `${input.sceneId} run`,
    summary: note ? `Waiting for review: ${note}` : 'Waiting for review.',
    startedAtLabel: buildTimelineLabel(1),
    pendingReviewId: reviewId,
    latestEventId: events.at(-1)?.id,
    eventCount: events.length,
  }

  return updateProjectRunState(projectId, run, events)
}

function buildReviewDecisionSummary(decision: RunReviewDecisionKind, note?: string) {
  const suffix = note ? ` Note: ${note}` : ''

  switch (decision) {
    case 'accept':
      return `Review accepted the proposal set.${suffix}`
    case 'accept-with-edit':
      return `Review accepted the proposal set with edits.${suffix}`
    case 'request-rewrite':
      return `Review requested a rewrite.${suffix}`
    case 'reject':
      return `Review rejected the proposal set.${suffix}`
  }
}

function buildRunSummary(decision: RunReviewDecisionKind) {
  switch (decision) {
    case 'accept':
      return 'Proposal set accepted and applied to canon and prose.'
    case 'accept-with-edit':
      return 'Proposal set accepted with editor adjustments applied to canon and prose.'
    case 'request-rewrite':
      return 'Rewrite requested. Start a new run to continue.'
    case 'reject':
      return 'Proposal set rejected and the run was closed.'
  }
}

function throwSelectedVariantValidationError(message: string, detail?: unknown): never {
  throw new ApiRequestError({
    status: 400,
    message,
    code: 'run-selected-variant-invalid',
    detail,
  })
}

function validateSelectedVariants(
  state: MockRunState,
  selectedVariants?: RunSelectedProposalVariantRecord[],
): RunSelectedProposalVariantRecord[] {
  if (!selectedVariants || selectedVariants.length === 0) {
    return []
  }

  const proposalSetEntry = getFirstArtifactEntry(state, 'proposal-set') ?? {
    id: getProposalSetId(state),
    kind: 'proposal-set' as const,
    sourceEventIds: [] as string[],
  }
  const proposalSet = buildProposalSetDetail(state, proposalSetEntry)
  const proposalsById = new Map(proposalSet.proposals.map((proposal) => [proposal.id, proposal]))
  const seenProposalIds = new Set<string>()

  for (const selectedVariant of selectedVariants) {
    if (seenProposalIds.has(selectedVariant.proposalId)) {
      throwSelectedVariantValidationError(`Selected variants include duplicate proposal ${selectedVariant.proposalId}.`, {
        proposalId: selectedVariant.proposalId,
      })
    }

    seenProposalIds.add(selectedVariant.proposalId)

    const proposal = proposalsById.get(selectedVariant.proposalId)
    if (!proposal) {
      throwSelectedVariantValidationError(`Selected variant proposal ${selectedVariant.proposalId} was not found.`, {
        proposalId: selectedVariant.proposalId,
      })
    }

    if (!proposal.variants?.some((variant) => variant.id === selectedVariant.variantId)) {
      throwSelectedVariantValidationError(
        `Selected variant ${selectedVariant.variantId} is not valid for proposal ${selectedVariant.proposalId}.`,
        {
          proposalId: selectedVariant.proposalId,
          variantId: selectedVariant.variantId,
        },
      )
    }
  }

  return clone(selectedVariants)
}

export function submitMockRunReviewDecision(
  input: SubmitRunReviewDecisionInput,
  projectId = DEFAULT_PROJECT_ID,
): RunRecord {
  const state = requireRunState(input.runId, projectId)
  if (state.run.pendingReviewId !== input.reviewId) {
    throw new ApiRequestError({
      status: 409,
      message: `Pending review ${input.reviewId} does not match ${state.run.id}.`,
      code: 'run-review-conflict',
    })
  }

  const selectedVariants = validateSelectedVariants(state, input.selectedVariants)
  const note = trimNote(input.note)
  const runSequence = extractRunSequence(input.runId)
  const sceneId = state.run.scopeId
  state.reviewDecisionsByReviewId[input.reviewId] = input.decision
  state.selectedVariantsByReviewId[input.reviewId] = clone(selectedVariants)
  appendRunEvent(
    state,
    'review_decision_submitted',
    'Review decision submitted',
    buildReviewDecisionSummary(input.decision, note),
    [{ kind: 'review', id: input.reviewId }],
    { selectedVariantCount: selectedVariants.length },
  )

  if (input.decision === 'accept' || input.decision === 'accept-with-edit') {
    appendRunEvent(
      state,
      'canon_patch_applied',
      'Canon patch applied',
      input.decision === 'accept-with-edit'
        ? 'Editorial edits were applied to the accepted canon patch.'
        : 'Accepted canon patch was applied to the scene.',
      [{ kind: 'canon-patch', id: input.patchId ?? `canon-patch-${sceneId}-${toSequenceLabel(runSequence)}` }],
    )
    appendRunEvent(
      state,
      'prose_generated',
      'Prose generated',
      input.decision === 'accept-with-edit'
        ? 'Prose draft regenerated after editorial adjustments.'
        : 'Prose draft generated from the accepted patch.',
      [{ kind: 'prose-draft', id: `prose-draft-${sceneId}-${toSequenceLabel(runSequence)}` }],
    )
    appendRunEvent(state, 'run_completed', 'Run completed', 'Run closed after review acceptance.')
    state.run.status = 'completed'
    state.run.completedAtLabel = state.events.at(-1)?.createdAtLabel
  } else if (input.decision === 'request-rewrite') {
    state.run.status = 'completed'
    state.run.completedAtLabel = state.events.at(-1)?.createdAtLabel
  } else {
    appendRunEvent(state, 'run_completed', 'Run completed', 'Run closed after review rejection.')
    state.run.status = 'completed'
    state.run.completedAtLabel = state.events.at(-1)?.createdAtLabel
  }

  state.run.pendingReviewId = undefined
  state.run.summary = buildRunSummary(input.decision)

  return updateProjectRunState(
    projectId,
    state.run,
    state.events,
    state.reviewDecisionsByReviewId,
    state.selectedVariantsByReviewId,
  )
}

export function exportMockRunSnapshot(): MockRunSnapshot {
  return {
    runStatesByProjectId: Object.fromEntries(
      Array.from(mockRunStatesByProjectId.entries()).map(([projectId, bucket]) => [
        projectId,
        Array.from(bucket.values()).map((state) => ({
          run: clone(state.run),
          events: clone(state.events),
          reviewDecisionsByReviewId: clone(state.reviewDecisionsByReviewId),
          selectedVariantsByReviewId: clone(state.selectedVariantsByReviewId),
        })),
      ]),
    ),
    runSceneSequencesByProjectId: Object.fromEntries(
      Array.from(mockSceneRunSequenceByProjectId.entries()).map(([projectId, bucket]) => [
        projectId,
        Object.fromEntries(Array.from(bucket.entries())),
      ]),
    ),
  }
}

export function importMockRunSnapshot(snapshot: MockRunSnapshot): void {
  mockRunStatesByProjectId.clear()
  mockSceneRunSequenceByProjectId.clear()

  for (const [projectId, states] of Object.entries(snapshot.runStatesByProjectId)) {
    if (states.length === 0) {
      continue
    }

    mockRunStatesByProjectId.set(
      projectId,
      new Map(
        states.map((state) => [
          state.run.id,
          {
            run: clone(state.run),
            events: clone(state.events),
            reviewDecisionsByReviewId: clone(state.reviewDecisionsByReviewId ?? {}),
            selectedVariantsByReviewId: clone(state.selectedVariantsByReviewId ?? {}),
          },
        ]),
      ),
    )
  }

  for (const [projectId, sequenceRecord] of Object.entries(snapshot.runSceneSequencesByProjectId)) {
    mockSceneRunSequenceByProjectId.set(projectId, new Map(Object.entries(sequenceRecord)))
  }
}

export function resetMockRunDb(): void {
  seedMockRunDb()
}

seedMockRunDb()
