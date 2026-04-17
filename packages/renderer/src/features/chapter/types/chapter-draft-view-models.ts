export interface ChapterDraftSceneViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  proseDraft?: string
  draftWordCount?: number
  proseStatusLabel: string
  sceneStatusLabel: string
  latestDiffSummary?: string
  revisionQueueCount?: number
  warningsCount: number
  isMissingDraft: boolean
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
  missingDraftScenes: ChapterDraftDockSummaryItem[]
  warningScenes: ChapterDraftDockSummaryItem[]
  queuedRevisionScenes: ChapterDraftDockSummaryItem[]
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
