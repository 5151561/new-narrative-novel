export interface BookDraftSceneSectionViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  proseDraft?: string
  draftWordCount?: number
  isMissingDraft: boolean
  warningsCount: number
  revisionQueueCount?: number
  traceReady: boolean
  relatedAssetCount: number
  sourceProposalCount: number
  latestDiffSummary?: string
}

export interface BookDraftChapterViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  sceneCount: number
  draftedSceneCount: number
  missingDraftCount: number
  assembledWordCount: number
  warningsCount: number
  queuedRevisionCount: number
  tracedSceneCount: number
  missingTraceSceneCount: number
  sections: BookDraftSceneSectionViewModel[]
  assembledProseSections: string[]
  coverageStatus: 'ready' | 'attention' | 'missing'
}

export interface BookDraftInspectorSelectedChapterViewModel {
  chapterId: string
  title: string
  summary: string
  draftedSceneCount: number
  missingDraftCount: number
  tracedSceneCount: number
  missingTraceSceneCount: number
  warningsCount: number
  queuedRevisionCount: number
  assembledWordCount: number
  topMissingSceneTitles: string[]
  topLatestDiffSummary?: string
  traceCoverageNote: string
}

export interface BookDraftInspectorReadinessViewModel {
  draftedChapterCount: number
  missingDraftChapterCount: number
  assembledWordCount: number
  warningHeavyChapterCount: number
  missingTraceChapterCount: number
}

export interface BookDraftInspectorSignalsViewModel {
  topMissingScenes: string[]
  latestDiffSummaries: string[]
  traceCoverageNote: string
}

export interface BookDraftInspectorViewModel {
  selectedChapter: BookDraftInspectorSelectedChapterViewModel | null
  readiness: BookDraftInspectorReadinessViewModel
  signals: BookDraftInspectorSignalsViewModel
}

export interface BookDraftDockSummaryItem {
  chapterId: string
  title: string
  detail: string
}

export interface BookDraftDockSummaryViewModel {
  missingDraftChapterCount: number
  missingTraceChapterCount: number
  warningsChapterCount: number
  queuedRevisionChapterCount: number
  highestPressureChapters: BookDraftDockSummaryItem[]
  missingDraftChapters: BookDraftDockSummaryItem[]
  missingTraceChapters: BookDraftDockSummaryItem[]
  warningsChapters: BookDraftDockSummaryItem[]
  queuedRevisionChapters: BookDraftDockSummaryItem[]
}

export interface BookDraftWorkspaceViewModel {
  bookId: string
  title: string
  summary: string
  selectedChapterId: string | null
  chapters: BookDraftChapterViewModel[]
  selectedChapter: BookDraftChapterViewModel | null
  assembledWordCount: number
  draftedChapterCount: number
  missingDraftChapterCount: number
  inspector: BookDraftInspectorViewModel
  dockSummary: BookDraftDockSummaryViewModel
}
