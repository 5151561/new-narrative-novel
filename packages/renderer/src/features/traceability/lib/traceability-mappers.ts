import type { AssetMentionBackingRecord } from '@/features/asset/api/asset-records'
import type {
  SceneAcceptedFactModel,
  SceneExecutionViewModel,
  SceneInspectorViewModel,
  ScenePatchPreviewViewModel,
  SceneProseViewModel,
  SceneTraceAssetRefModel,
  SceneTraceProposalRefModel,
} from '@/features/scene/types/scene-view-models'

import type {
  AssetTraceabilitySummaryViewModel,
  ChapterDraftSceneTraceSummaryViewModel,
  ChapterDraftTraceabilityViewModel,
  SceneProseOriginViewModel,
  SceneTraceabilityLatestPatchViewModel,
  SceneTraceabilityViewModel,
  TraceabilityAcceptedFactViewModel,
  TraceabilityPatchChangeViewModel,
  TraceabilityRelatedAssetViewModel,
  TraceabilitySourceProposalViewModel,
} from '../types/traceability-view-models'

interface BuildSceneTraceabilityViewModelInput {
  sceneId: string
  execution?: SceneExecutionViewModel | null
  prose?: SceneProseViewModel | null
  inspector?: SceneInspectorViewModel | null
  patchPreview?: ScenePatchPreviewViewModel | null
}

interface BuildChapterDraftTraceabilityViewModelInput {
  chapterId: string
  selectedSceneId: string | null | undefined
  scenes: Array<{ sceneId: string; title: string }>
  sceneTraceBySceneId: Record<string, SceneTraceabilityViewModel | undefined>
}

type AssetTraceabilityMentionLike = {
  id: string
  targetScope: 'scene' | 'chapter'
  sceneId?: string
  backing?: AssetMentionBackingRecord
}

interface BuildAssetTraceabilitySummaryViewModelInput<TMention extends AssetTraceabilityMentionLike> {
  assetId: string
  mentions: TMention[]
  sceneTraceBySceneId: Record<string, SceneTraceabilityViewModel | undefined>
  getMentionTitle: (mention: TMention) => string
}

function dedupeByKey<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = getKey(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function buildProposalLookup(
  execution: SceneExecutionViewModel | null | undefined,
  acceptedFacts: SceneAcceptedFactModel[],
  patchPreview: ScenePatchPreviewViewModel | null | undefined,
  prose: SceneProseViewModel | null | undefined,
) {
  const lookup = new Map<string, TraceabilitySourceProposalViewModel>()

  const register = (proposal: SceneTraceProposalRefModel | TraceabilitySourceProposalViewModel | undefined) => {
    if (!proposal?.proposalId) {
      return
    }

    const existing = lookup.get(proposal.proposalId)
    lookup.set(proposal.proposalId, {
      proposalId: proposal.proposalId,
      title:
        proposal.title ??
        existing?.title ??
        execution?.proposals.find((candidate) => candidate.id === proposal.proposalId)?.title ??
        proposal.proposalId,
      sourceTraceId:
        proposal.sourceTraceId ??
        existing?.sourceTraceId ??
        execution?.proposals.find((candidate) => candidate.id === proposal.proposalId)?.sourceTraceId,
    })
  }

  execution?.proposals.forEach((proposal) => register({ proposalId: proposal.id, title: proposal.title, sourceTraceId: proposal.sourceTraceId }))
  acceptedFacts.forEach((fact) => fact.sourceProposals?.forEach(register))
  patchPreview?.changes.forEach((change) => change.sourceProposals?.forEach(register))
  prose?.traceSummary?.sourceProposals?.forEach(register)

  return lookup
}

function mapProposalRefs(
  proposals: SceneTraceProposalRefModel[] | undefined,
  lookup: Map<string, TraceabilitySourceProposalViewModel>,
) {
  return dedupeByKey(
    (proposals ?? []).map((proposal) => {
      const fromLookup = lookup.get(proposal.proposalId)
      return {
        proposalId: proposal.proposalId,
        title: proposal.title ?? fromLookup?.title ?? proposal.proposalId,
        sourceTraceId: proposal.sourceTraceId ?? fromLookup?.sourceTraceId,
      }
    }),
    (proposal) => proposal.proposalId,
  )
}

function mapRelatedAssets(assets: SceneTraceAssetRefModel[] | undefined): TraceabilityRelatedAssetViewModel[] {
  return dedupeByKey(
    (assets ?? []).map((asset) => ({
      assetId: asset.assetId,
      title: asset.title,
      kind: asset.kind,
    })),
    (asset) => asset.assetId,
  )
}

function mapAcceptedFacts(
  acceptedFacts: SceneAcceptedFactModel[],
  lookup: Map<string, TraceabilitySourceProposalViewModel>,
): TraceabilityAcceptedFactViewModel[] {
  return acceptedFacts.map((fact) => ({
    id: fact.id,
    label: fact.label,
    value: fact.value,
    sourceProposals: mapProposalRefs(fact.sourceProposals, lookup),
    relatedAssets: mapRelatedAssets(fact.relatedAssets),
  }))
}

function mapPatchChanges(
  patchPreview: ScenePatchPreviewViewModel | null | undefined,
  lookup: Map<string, TraceabilitySourceProposalViewModel>,
): TraceabilityPatchChangeViewModel[] {
  return (patchPreview?.changes ?? []).map((change) => ({
    id: change.id,
    label: change.label,
    detail: change.detail,
    sourceProposals: mapProposalRefs(change.sourceProposals, lookup),
    relatedAssets: mapRelatedAssets(change.relatedAssets),
  }))
}

function aggregateSourceProposals(
  acceptedFacts: TraceabilityAcceptedFactViewModel[],
  latestPatch: SceneTraceabilityLatestPatchViewModel | null,
  proseOrigin: SceneProseOriginViewModel | null,
) {
  return dedupeByKey(
    [
      ...acceptedFacts.flatMap((fact) => fact.sourceProposals),
      ...(latestPatch?.sourceProposals ?? []),
      ...(proseOrigin?.sourceProposals ?? []),
    ],
    (proposal) => proposal.proposalId,
  )
}

function aggregateRelatedAssets(
  acceptedFacts: TraceabilityAcceptedFactViewModel[],
  latestPatch: SceneTraceabilityLatestPatchViewModel | null,
  proseOrigin: SceneProseOriginViewModel | null,
) {
  return dedupeByKey(
    [
      ...acceptedFacts.flatMap((fact) => fact.relatedAssets),
      ...(latestPatch?.relatedAssets ?? []),
      ...(proseOrigin?.relatedAssets ?? []),
    ],
    (asset) => asset.assetId,
  )
}

function buildLatestPatch(
  patchPreview: ScenePatchPreviewViewModel | null | undefined,
  lookup: Map<string, TraceabilitySourceProposalViewModel>,
): SceneTraceabilityLatestPatchViewModel | null {
  if (!patchPreview) {
    return null
  }

  const changes = mapPatchChanges(patchPreview, lookup)

  return {
    patchId: patchPreview.patchId,
    label: patchPreview.label,
    summary: patchPreview.summary,
    status: patchPreview.status,
    changes,
    sourceProposals: dedupeByKey(
      changes.flatMap((change) => change.sourceProposals),
      (proposal) => proposal.proposalId,
    ),
    relatedAssets: dedupeByKey(
      changes.flatMap((change) => change.relatedAssets),
      (asset) => asset.assetId,
    ),
  }
}

function buildProseOrigin(
  prose: SceneProseViewModel | null | undefined,
  acceptedFacts: TraceabilityAcceptedFactViewModel[],
  latestPatch: SceneTraceabilityLatestPatchViewModel | null,
  lookup: Map<string, TraceabilitySourceProposalViewModel>,
): SceneProseOriginViewModel | null {
  if (!prose) {
    return null
  }

  const acceptedFactIds = dedupeByKey(
    (prose.traceSummary?.acceptedFactIds ?? []).map((acceptedFactId) => acceptedFactId),
    (acceptedFactId) => acceptedFactId,
  )
  const factBackedAssets = acceptedFactIds.flatMap(
    (acceptedFactId) => acceptedFacts.find((fact) => fact.id === acceptedFactId)?.relatedAssets ?? [],
  )
  const factBackedProposals = acceptedFactIds.flatMap(
    (acceptedFactId) => acceptedFacts.find((fact) => fact.id === acceptedFactId)?.sourceProposals ?? [],
  )
  const patchBackedProposals =
    prose.traceSummary?.sourcePatchId && latestPatch?.patchId === prose.traceSummary.sourcePatchId ? latestPatch.sourceProposals : []
  const patchBackedAssets =
    prose.traceSummary?.sourcePatchId && latestPatch?.patchId === prose.traceSummary.sourcePatchId ? latestPatch.relatedAssets : []

  return {
    statusLabel: prose.statusLabel,
    latestDiffSummary: prose.latestDiffSummary,
    traceSummary: prose.traceSummary?.missingLinks?.join(', '),
    sourcePatchId: prose.traceSummary?.sourcePatchId,
    acceptedFactIds,
    sourceProposals: dedupeByKey(
      [
        ...mapProposalRefs(prose.traceSummary?.sourceProposals, lookup),
        ...factBackedProposals,
        ...patchBackedProposals,
      ],
      (proposal) => proposal.proposalId,
    ),
    relatedAssets: dedupeByKey(
      [
        ...mapRelatedAssets(prose.traceSummary?.relatedAssets),
        ...factBackedAssets,
        ...patchBackedAssets,
      ],
      (asset) => asset.assetId,
    ),
  }
}

function deriveMissingLinks(scene: SceneTraceabilityViewModel) {
  const hasStructuredTrace =
    scene.acceptedFacts.some((fact) => fact.sourceProposals.length > 0 || fact.relatedAssets.length > 0) ||
    Boolean(scene.latestPatch && (scene.latestPatch.sourceProposals.length > 0 || scene.latestPatch.relatedAssets.length > 0)) ||
    Boolean(
      scene.proseOrigin &&
        (scene.proseOrigin.acceptedFactIds.length > 0 ||
          scene.proseOrigin.sourceProposals.length > 0 ||
          scene.proseOrigin.relatedAssets.length > 0),
    )

  if (!hasStructuredTrace) {
    return ['trace']
  }

  const missingLinks: string[] = []

  if (scene.relatedAssets.length === 0) {
    missingLinks.push('related_assets')
  }

  if (scene.sourceProposals.length === 0) {
    missingLinks.push('source_proposals')
  }

  return missingLinks
}

function isSceneTraced(scene: SceneTraceabilityViewModel | undefined) {
  if (!scene) {
    return false
  }

  return !scene.missingLinks.includes('trace')
}

export function buildChapterDraftSceneTraceSummaryViewModel(
  sceneId: string,
  sceneTrace: SceneTraceabilityViewModel | null | undefined,
): ChapterDraftSceneTraceSummaryViewModel {
  if (!sceneTrace || sceneTrace.missingLinks.includes('trace')) {
    return {
      sceneId,
      sourceFactCount: 0,
      relatedAssetCount: 0,
      status: 'missing',
    }
  }

  return {
    sceneId,
    sourceFactCount: sceneTrace.acceptedFacts.length,
    relatedAssetCount: sceneTrace.relatedAssets.length,
    status: 'ready',
  }
}

export function buildChapterDraftSelectedSceneTraceabilityViewModel(
  sceneTrace: SceneTraceabilityViewModel | null | undefined,
) {
  if (!sceneTrace) {
    return null
  }

  return {
    sceneId: sceneTrace.sceneId,
    acceptedFacts: sceneTrace.acceptedFacts,
    relatedAssets: sceneTrace.relatedAssets,
    latestPatchSummary: sceneTrace.latestPatch?.summary,
    latestDiffSummary: sceneTrace.proseOrigin?.latestDiffSummary,
    sourceProposalCount: sceneTrace.sourceProposals.length,
    missingLinks: sceneTrace.missingLinks,
  }
}

export function buildChapterDraftTraceCoverageViewModel({
  scenes,
  sceneTraceBySceneId,
}: Omit<BuildChapterDraftTraceabilityViewModelInput, 'chapterId' | 'selectedSceneId'>) {
  const tracedSceneIds = scenes.filter((scene) => isSceneTraced(sceneTraceBySceneId[scene.sceneId])).map((scene) => scene.sceneId)
  const sceneIdsMissingTrace = scenes.filter((scene) => !isSceneTraced(sceneTraceBySceneId[scene.sceneId])).map((scene) => scene.sceneId)
  const sceneIdsMissingAssets = scenes
    .filter((scene) => {
      const trace = sceneTraceBySceneId[scene.sceneId]
      return trace && isSceneTraced(trace) && trace.relatedAssets.length === 0
    })
    .map((scene) => scene.sceneId)

  return {
    tracedSceneCount: tracedSceneIds.length,
    missingTraceSceneCount: sceneIdsMissingTrace.length,
    sceneIdsMissingTrace,
    sceneIdsMissingAssets,
  }
}

function collectAcceptedFactProposalIds(
  acceptedFactIds: string[] | undefined,
  sceneTrace: SceneTraceabilityViewModel | undefined,
) {
  if (!acceptedFactIds?.length || !sceneTrace) {
    return []
  }

  return dedupeByKey(
    acceptedFactIds.flatMap(
      (acceptedFactId) =>
        sceneTrace.acceptedFacts.find((fact) => fact.id === acceptedFactId)?.sourceProposals.map((proposal) => proposal.proposalId) ?? [],
    ),
    (proposalId) => proposalId,
  )
}

function collectProposalTitles(
  backing: AssetMentionBackingRecord | undefined,
  sceneTrace: SceneTraceabilityViewModel | undefined,
) {
  if (!backing || !sceneTrace) {
    return []
  }

  const proposalIds = dedupeByKey(
    [...(backing.proposalIds ?? []), ...collectAcceptedFactProposalIds(backing.acceptedFactIds, sceneTrace)],
    (proposalId) => proposalId,
  )
  const sourceProposals = new Map(sceneTrace.sourceProposals.map((proposal) => [proposal.proposalId, proposal]))
  const patchProposals =
    backing.patchId && sceneTrace.latestPatch?.patchId === backing.patchId
      ? new Map(sceneTrace.latestPatch.sourceProposals.map((proposal) => [proposal.proposalId, proposal]))
      : null
  const titles = proposalIds
    .map((proposalId) => patchProposals?.get(proposalId)?.title ?? sourceProposals.get(proposalId)?.title)
    .filter(Boolean) as string[]

  if (titles.length === 0 && backing.patchId && sceneTrace.latestPatch?.patchId !== backing.patchId) {
    return []
  }

  return dedupeByKey(titles, (title) => title)
}

export function buildSceneTraceabilityViewModel({
  sceneId,
  execution,
  prose,
  inspector,
  patchPreview,
}: BuildSceneTraceabilityViewModelInput): SceneTraceabilityViewModel {
  const acceptedFactsSource = execution?.acceptedSummary.acceptedFacts.length
    ? execution.acceptedSummary.acceptedFacts
    : inspector?.context.acceptedFacts ?? []
  const proposalLookup = buildProposalLookup(execution, acceptedFactsSource, patchPreview, prose)
  const acceptedFacts = mapAcceptedFacts(acceptedFactsSource, proposalLookup)
  const latestPatch = buildLatestPatch(patchPreview, proposalLookup)
  const proseOrigin = buildProseOrigin(prose, acceptedFacts, latestPatch, proposalLookup)
  const scene = {
    sceneId,
    acceptedFacts,
    latestPatch,
    proseOrigin,
    sourceProposals: aggregateSourceProposals(acceptedFacts, latestPatch, proseOrigin),
    relatedAssets: aggregateRelatedAssets(acceptedFacts, latestPatch, proseOrigin),
    missingLinks: [],
  } satisfies SceneTraceabilityViewModel

  scene.missingLinks = deriveMissingLinks(scene)
  return scene
}

export function buildChapterDraftTraceabilityViewModel({
  chapterId,
  selectedSceneId,
  scenes,
  sceneTraceBySceneId,
}: BuildChapterDraftTraceabilityViewModelInput): ChapterDraftTraceabilityViewModel {
  const resolvedSelectedSceneId = scenes.find((scene) => scene.sceneId === selectedSceneId)?.sceneId ?? scenes[0]?.sceneId ?? null
  const selectedSceneTrace = resolvedSelectedSceneId ? sceneTraceBySceneId[resolvedSelectedSceneId] : undefined

  return {
    chapterId,
    selectedSceneId: resolvedSelectedSceneId,
    sceneSummariesBySceneId: Object.fromEntries(
      scenes.map((scene) => [scene.sceneId, buildChapterDraftSceneTraceSummaryViewModel(scene.sceneId, sceneTraceBySceneId[scene.sceneId])]),
    ),
    selectedSceneTrace: buildChapterDraftSelectedSceneTraceabilityViewModel(selectedSceneTrace),
    chapterCoverage: buildChapterDraftTraceCoverageViewModel({
      scenes,
      sceneTraceBySceneId,
    }),
  }
}

export function buildAssetTraceabilitySummaryViewModel<TMention extends AssetTraceabilityMentionLike>({
  assetId,
  mentions,
  sceneTraceBySceneId,
  getMentionTitle,
}: BuildAssetTraceabilitySummaryViewModelInput<TMention>): AssetTraceabilitySummaryViewModel {
  const mentionSummaries = mentions.map((mention) => {
    const backingKind = mention.backing?.kind ?? 'unlinked'
    const sceneTrace = sceneTraceBySceneId[mention.backing?.sceneId ?? mention.sceneId ?? '']
    const factLabels = (mention.backing?.acceptedFactIds ?? [])
      .map((factId) => sceneTrace?.acceptedFacts.find((fact) => fact.id === factId)?.label)
      .filter(Boolean) as string[]

    return {
      mentionId: mention.id,
      title: getMentionTitle(mention),
      backingKind,
      factLabels,
      proposalTitles: collectProposalTitles(mention.backing, sceneTrace),
    }
  })

  return {
    assetId,
    canonBackedMentions: mentionSummaries.filter((mention) => mention.backingKind === 'canon').length,
    draftContextMentions: mentionSummaries.filter((mention) => mention.backingKind === 'draft_context').length,
    unlinkedMentions: mentionSummaries.filter((mention) => mention.backingKind === 'unlinked').length,
    mentionSummaries,
  }
}
