import type { SceneTraceAssetRefModel, SceneTraceProposalRefModel } from '@/features/scene/types/scene-view-models'

import type { ChapterLocalizedText } from './chapter-records'

export interface ChapterDraftAssemblyTraceRollupRecord {
  acceptedFactCount: number
  relatedAssetCount: number
  sourceProposalCount: number
  missingLinks: string[]
}

export interface ChapterDraftAssemblyArtifactRefRecord {
  kind: 'prose-draft'
  id: string
}

export interface ChapterDraftAssemblySceneSectionRecordBase {
  sceneId: string
  order: number
  title: ChapterLocalizedText
  summary: ChapterLocalizedText
  backlogStatus: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
  proseStatusLabel: ChapterLocalizedText
  latestDiffSummary?: string
  warningsCount: number
  revisionQueueCount?: number
  draftWordCount?: number
  traceReady: boolean
  traceRollup: ChapterDraftAssemblyTraceRollupRecord
}

export interface ChapterDraftAssemblySceneDraftSectionRecord extends ChapterDraftAssemblySceneSectionRecordBase {
  kind: 'scene-draft'
  proseDraft: string
  sourcePatchId?: string
  sourceProposals: SceneTraceProposalRefModel[]
  acceptedFactIds: string[]
  relatedAssets: SceneTraceAssetRefModel[]
}

export interface ChapterDraftAssemblySceneGapSectionRecord extends ChapterDraftAssemblySceneSectionRecordBase {
  kind: 'scene-gap'
  gapReason: ChapterLocalizedText
}

export type ChapterDraftAssemblySceneRecord =
  | ChapterDraftAssemblySceneDraftSectionRecord
  | ChapterDraftAssemblySceneGapSectionRecord

export interface ChapterDraftAssemblyTransitionSectionRecordBase {
  fromSceneId: string
  toSceneId: string
  fromSceneTitle: ChapterLocalizedText
  toSceneTitle: ChapterLocalizedText
}

export interface ChapterDraftAssemblyTransitionDraftSectionRecord extends ChapterDraftAssemblyTransitionSectionRecordBase {
  kind: 'transition-draft'
  transitionProse: string
  artifactRef: ChapterDraftAssemblyArtifactRefRecord
}

export interface ChapterDraftAssemblyTransitionGapSectionRecord extends ChapterDraftAssemblyTransitionSectionRecordBase {
  kind: 'transition-gap'
  gapReason: ChapterLocalizedText
}

export type ChapterDraftAssemblySectionRecord =
  | ChapterDraftAssemblySceneRecord
  | ChapterDraftAssemblyTransitionDraftSectionRecord
  | ChapterDraftAssemblyTransitionGapSectionRecord

export interface ChapterDraftAssemblyRecord {
  chapterId: string
  title: ChapterLocalizedText
  summary: ChapterLocalizedText
  sceneCount: number
  draftedSceneCount: number
  missingDraftCount: number
  assembledWordCount: number
  warningsCount: number
  queuedRevisionCount: number
  tracedSceneCount: number
  missingTraceSceneCount: number
  scenes: ChapterDraftAssemblySceneRecord[]
  sections: ChapterDraftAssemblySectionRecord[]
}

export function readLocalizedChapterDraftAssemblyText(
  value: ChapterLocalizedText,
  locale: 'en' | 'zh-CN',
) {
  return value[locale]
}
