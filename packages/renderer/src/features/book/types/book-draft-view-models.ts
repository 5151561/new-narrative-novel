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

export type BookDraftManuscriptSectionKind =
  | 'chapter-heading'
  | 'scene-draft'
  | 'scene-gap'
  | 'transition-draft'
  | 'transition-gap'

export interface BookDraftManuscriptSectionViewModel {
  kind: BookDraftManuscriptSectionKind
  chapterId: string
  chapterOrder: number
  chapterTitle: string
  summary?: string
  assembledWordCount?: number
  missingDraftCount?: number
  sceneId?: string
  sceneOrder?: number
  sceneTitle?: string
  sceneSummary?: string
  proseDraft?: string
  gapReason?: string
  draftWordCount?: number
  traceReady?: boolean
  fromSceneId?: string
  toSceneId?: string
  fromSceneTitle?: string
  toSceneTitle?: string
  transitionProse?: string
  artifactId?: string
}

export interface BookDraftSourceManifestEntryViewModel {
  kind: 'scene-draft' | 'scene-gap' | 'transition-draft' | 'transition-gap'
  chapterId: string
  chapterOrder: number
  chapterTitle: string
  sceneId?: string
  sceneOrder?: number
  sceneTitle?: string
  fromSceneId?: string
  toSceneId?: string
  sourcePatchId?: string
  sourceProposalIds: string[]
  acceptedFactIds: string[]
  artifactId?: string
  traceReady: boolean
  draftWordCount?: number
  gapReason?: string
}

export interface BookDraftReadableManuscriptViewModel {
  formatVersion: 'book-manuscript-assembly-v1'
  markdown: string
  plainText: string
  sections: BookDraftManuscriptSectionViewModel[]
  sourceManifest: BookDraftSourceManifestEntryViewModel[]
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
  readableManuscript: BookDraftReadableManuscriptViewModel
}
