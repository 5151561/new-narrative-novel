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

export interface ChapterDraftInspectorViewModel {
  selectedScene: ChapterDraftInspectorSelectedSceneViewModel | null
  chapterReadiness: ChapterDraftReadinessViewModel
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
  runnableScene?: ChapterDraftDockSummaryItem
  missingDraftScenes: ChapterDraftDockSummaryItem[]
  warningScenes: ChapterDraftDockSummaryItem[]
  queuedRevisionScenes: ChapterDraftDockSummaryItem[]
  waitingReviewScenes: ChapterDraftDockSummaryItem[]
}

export interface ChapterDraftWorkspaceViewModel {
  chapterId: string
  title: string
  summary: string
  selectedSceneId: string | null
  scenes: ChapterDraftSceneViewModel[]
  assembledWordCount: number
  draftedSceneCount: number
  missingDraftCount: number
  selectedScene: ChapterDraftSceneViewModel | null
  inspector: ChapterDraftInspectorViewModel
  dockSummary: ChapterDraftDockSummaryViewModel
}
