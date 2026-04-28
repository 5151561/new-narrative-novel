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

export type BookDraftAssemblyManuscriptSectionKind =
  | 'chapter-heading'
  | 'scene-draft'
  | 'scene-gap'
  | 'transition-draft'
  | 'transition-gap'

export interface BookDraftAssemblyManuscriptSectionRecordBase {
  kind: BookDraftAssemblyManuscriptSectionKind
  chapterId: string
  chapterOrder: number
  chapterTitle: BookLocalizedText
}

export interface BookDraftAssemblyChapterHeadingSectionRecord extends BookDraftAssemblyManuscriptSectionRecordBase {
  kind: 'chapter-heading'
  summary: BookLocalizedText
  assembledWordCount: number
  missingDraftCount: number
}

export interface BookDraftAssemblySceneManuscriptSectionRecord extends BookDraftAssemblyManuscriptSectionRecordBase {
  kind: 'scene-draft' | 'scene-gap'
  sceneId: string
  sceneOrder: number
  sceneTitle: BookLocalizedText
  sceneSummary: BookLocalizedText
  proseDraft?: string
  gapReason?: BookLocalizedText
  draftWordCount?: number
  traceReady: boolean
  sourcePatchId?: string
  sourceProposalIds: string[]
  acceptedFactIds: string[]
}

export interface BookDraftAssemblyTransitionManuscriptSectionRecord extends BookDraftAssemblyManuscriptSectionRecordBase {
  kind: 'transition-draft' | 'transition-gap'
  fromSceneId: string
  toSceneId: string
  fromSceneTitle: BookLocalizedText
  toSceneTitle: BookLocalizedText
  transitionProse?: string
  artifactId?: string
  gapReason?: BookLocalizedText
}

export type BookDraftAssemblyManuscriptSectionRecord =
  | BookDraftAssemblyChapterHeadingSectionRecord
  | BookDraftAssemblySceneManuscriptSectionRecord
  | BookDraftAssemblyTransitionManuscriptSectionRecord

export interface BookDraftAssemblySourceManifestEntryRecord {
  kind: 'scene-draft' | 'scene-gap' | 'transition-draft' | 'transition-gap'
  chapterId: string
  chapterOrder: number
  chapterTitle: BookLocalizedText
  sceneId?: string
  sceneOrder?: number
  sceneTitle?: BookLocalizedText
  fromSceneId?: string
  toSceneId?: string
  sourcePatchId?: string
  sourceProposalIds: string[]
  acceptedFactIds: string[]
  artifactId?: string
  traceReady: boolean
  draftWordCount?: number
  gapReason?: BookLocalizedText
}

export interface BookDraftAssemblyReadableManuscriptRecord {
  formatVersion: 'book-manuscript-assembly-v1'
  markdown: string
  plainText: string
  sections: BookDraftAssemblyManuscriptSectionRecord[]
  sourceManifest: BookDraftAssemblySourceManifestEntryRecord[]
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
  readableManuscript: BookDraftAssemblyReadableManuscriptRecord
}
