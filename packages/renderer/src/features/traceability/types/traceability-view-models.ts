import type { AssetKind, AssetMentionBackingKind } from '@/features/asset/api/asset-records'

export interface TraceabilitySourceProposalViewModel {
  proposalId: string
  title: string
  sourceTraceId?: string
}

export interface TraceabilityRelatedAssetViewModel {
  assetId: string
  title: string
  kind?: AssetKind
}

export interface TraceabilityAcceptedFactViewModel {
  id: string
  label: string
  value: string
  sourceProposals: TraceabilitySourceProposalViewModel[]
  relatedAssets: TraceabilityRelatedAssetViewModel[]
}

export interface TraceabilityPatchChangeViewModel {
  id: string
  label: string
  detail: string
  sourceProposals: TraceabilitySourceProposalViewModel[]
  relatedAssets: TraceabilityRelatedAssetViewModel[]
}

export interface SceneTraceabilityLatestPatchViewModel {
  patchId: string
  label: string
  summary: string
  status: 'ready_for_commit' | 'needs_review' | 'deferred'
  changes: TraceabilityPatchChangeViewModel[]
  sourceProposals: TraceabilitySourceProposalViewModel[]
  relatedAssets: TraceabilityRelatedAssetViewModel[]
}

export interface SceneProseOriginViewModel {
  statusLabel?: string
  latestDiffSummary?: string
  sourcePatchId?: string
  traceSummary?: string
  sourceProposals: TraceabilitySourceProposalViewModel[]
  acceptedFactIds: string[]
  relatedAssets: TraceabilityRelatedAssetViewModel[]
}

export interface SceneTraceabilityViewModel {
  sceneId: string
  acceptedFacts: TraceabilityAcceptedFactViewModel[]
  latestPatch: SceneTraceabilityLatestPatchViewModel | null
  proseOrigin: SceneProseOriginViewModel | null
  sourceProposals: TraceabilitySourceProposalViewModel[]
  relatedAssets: TraceabilityRelatedAssetViewModel[]
  missingLinks: string[]
}

export interface ChapterDraftSelectedSceneTraceabilityViewModel {
  sceneId: string
  acceptedFacts: TraceabilityAcceptedFactViewModel[]
  relatedAssets: TraceabilityRelatedAssetViewModel[]
  latestPatchSummary?: string
  latestDiffSummary?: string
  sourceProposalCount: number
  missingLinks: string[]
}

export interface ChapterDraftTraceCoverageViewModel {
  tracedSceneCount: number
  missingTraceSceneCount: number
  sceneIdsMissingTrace: string[]
  sceneIdsMissingAssets: string[]
}

export interface ChapterDraftTraceabilityViewModel {
  chapterId: string
  selectedSceneId: string | null
  selectedSceneTrace: ChapterDraftSelectedSceneTraceabilityViewModel | null
  chapterCoverage: ChapterDraftTraceCoverageViewModel
}

export interface AssetTraceabilityMentionSummaryViewModel {
  mentionId: string
  title: string
  backingKind: AssetMentionBackingKind
  factLabels: string[]
  proposalTitles: string[]
}

export interface AssetTraceabilitySummaryViewModel {
  assetId: string
  canonBackedMentions: number
  draftContextMentions: number
  unlinkedMentions: number
  mentionSummaries: AssetTraceabilityMentionSummaryViewModel[]
}
