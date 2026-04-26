import type { BookLocalizedText } from './book-records'
import type { SceneTraceAssetRefModel, SceneTraceProposalRefModel } from '@/features/scene/types/scene-view-models'

export interface BookDraftAssemblyTraceRollupRecord {
  acceptedFactCount: number
  relatedAssetCount: number
  sourceProposalCount: number
  missingLinks: string[]
}

export interface BookDraftAssemblySceneRecordBase {
  sceneId: string
  order: number
  title: BookLocalizedText
  summary: BookLocalizedText
  proseStatusLabel: BookLocalizedText
  latestDiffSummary?: string
  warningsCount: number
  revisionQueueCount?: number
  draftWordCount?: number
  traceReady: boolean
  traceRollup: BookDraftAssemblyTraceRollupRecord
}

export interface BookDraftAssemblySceneDraftRecord extends BookDraftAssemblySceneRecordBase {
  kind: 'draft'
  proseDraft: string
  sourcePatchId?: string
  sourceProposals: SceneTraceProposalRefModel[]
  acceptedFactIds: string[]
  relatedAssets: SceneTraceAssetRefModel[]
}

export interface BookDraftAssemblySceneGapRecord extends BookDraftAssemblySceneRecordBase {
  kind: 'gap'
  gapReason: BookLocalizedText
}

export type BookDraftAssemblySceneRecord =
  | BookDraftAssemblySceneDraftRecord
  | BookDraftAssemblySceneGapRecord

export interface BookDraftAssemblyChapterRecord {
  chapterId: string
  order: number
  title: BookLocalizedText
  summary: BookLocalizedText
  sceneCount: number
  draftedSceneCount: number
  missingDraftCount: number
  assembledWordCount: number
  warningsCount: number
  queuedRevisionCount: number
  tracedSceneCount: number
  missingTraceSceneCount: number
  scenes: BookDraftAssemblySceneRecord[]
}

export interface BookDraftAssemblyRecord {
  bookId: string
  title: BookLocalizedText
  summary: BookLocalizedText
  chapterCount: number
  sceneCount: number
  draftedSceneCount: number
  missingDraftSceneCount: number
  assembledWordCount: number
  chapters: BookDraftAssemblyChapterRecord[]
}
