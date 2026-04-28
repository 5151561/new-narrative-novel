import type {
  ChapterDraftSelectedSceneTraceabilityViewModel,
  ChapterDraftTraceCoverageViewModel,
} from '@/features/traceability/types/traceability-view-models'

export interface ChapterDraftSceneViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  proseDraft?: string
  draftWordCount?: number
  backlogStatus: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
  backlogStatusLabel: string
  proseStatusLabel: string
  sceneStatusLabel: string
  runStatusLabel: string
  latestDiffSummary?: string
  revisionQueueCount?: number
  warningsCount: number
  isMissingDraft: boolean
  traceSummary?: {
    sourceFactCount: number
    relatedAssetCount: number
    status: 'ready' | 'missing'
  }
}

export type ChapterDraftTransitionStatus = 'ready' | 'gap' | 'weak'

export interface ChapterDraftSceneSectionViewModel extends ChapterDraftSceneViewModel {
  kind: 'scene'
}

export interface ChapterDraftTransitionSectionViewModel {
  kind: 'transition'
  id: string
  fromSceneId: string
  toSceneId: string
  fromSceneTitle: string
  toSceneTitle: string
  status: ChapterDraftTransitionStatus
  detail: string
  proseDraft?: string
  artifactId?: string
}

export type ChapterDraftSectionViewModel =
  | ChapterDraftSceneSectionViewModel
  | ChapterDraftTransitionSectionViewModel

export interface ChapterDraftInspectorSelectedSceneViewModel {
  sceneId: string
  title: string
  summary: string
  proseStatusLabel: string
  draftWordCount?: number
  revisionQueueCount?: number
  warningsCount: number
  latestDiffSummary?: string
}

export interface ChapterDraftReadinessViewModel {
  draftedSceneCount: number
  missingDraftCount: number
  assembledWordCount: number
  warningsCount: number
  queuedRevisionCount: number
}

export interface ChapterDraftInspectorTransitionSeamViewModel {
  id: string
  direction: 'incoming' | 'outgoing'
  status: ChapterDraftTransitionStatus
  counterpartTitle: string
  detail: string
  artifactId?: string
}

export interface ChapterDraftInspectorTransitionSupportViewModel {
  readyCount: number
  weakCount: number
  gapCount: number
  seams: ChapterDraftInspectorTransitionSeamViewModel[]
}

export interface ChapterDraftInspectorViewModel {
  selectedScene: ChapterDraftInspectorSelectedSceneViewModel | null
  chapterReadiness: ChapterDraftReadinessViewModel
  transitionSupport?: ChapterDraftInspectorTransitionSupportViewModel
  selectedSceneTraceability?: ChapterDraftSelectedSceneTraceabilityViewModel | null
  chapterTraceCoverage?: ChapterDraftTraceCoverageViewModel | null
}

export interface ChapterDraftDockSummaryItem {
  sceneId: string
  title: string
  detail: string
}

export interface ChapterDraftDockSummaryViewModel {
  missingDraftCount: number
  warningsCount: number
  queuedRevisionCount: number
  waitingReviewCount: number
  transitionGapCount: number
  transitionReadyCount: number
  transitionWeakCount: number
  runnableScene?: ChapterDraftDockSummaryItem
  missingDraftScenes: ChapterDraftDockSummaryItem[]
  warningScenes: ChapterDraftDockSummaryItem[]
  queuedRevisionScenes: ChapterDraftDockSummaryItem[]
  waitingReviewScenes: ChapterDraftDockSummaryItem[]
  transitionGapSections: ChapterDraftDockSummaryItem[]
  transitionWeakSections: ChapterDraftDockSummaryItem[]
}

export interface ChapterDraftWorkspaceViewModel {
  chapterId: string
  title: string
  summary: string
  selectedSceneId: string | null
  scenes: ChapterDraftSceneViewModel[]
  sections?: ChapterDraftSectionViewModel[]
  assembledWordCount: number
  draftedSceneCount: number
  missingDraftCount: number
  selectedScene: ChapterDraftSceneViewModel | null
  inspector: ChapterDraftInspectorViewModel
  dockSummary: ChapterDraftDockSummaryViewModel
}
