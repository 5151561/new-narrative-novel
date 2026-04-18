export type BookManuscriptCompareDelta = 'missing' | 'added' | 'draft_missing' | 'changed' | 'unchanged'

export interface BookManuscriptSnapshotSceneViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  proseDraft?: string
  draftWordCount?: number
  warningsCount: number
  traceReady: boolean
}

export interface BookManuscriptSnapshotChapterViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  scenes: BookManuscriptSnapshotSceneViewModel[]
}

export interface BookManuscriptSnapshotViewModel {
  bookId: string
  title: string
  summary: string
  selectedChapterId: string | null
  chapters: BookManuscriptSnapshotChapterViewModel[]
}

export interface BookManuscriptCheckpointSummaryViewModel {
  checkpointId: string
  bookId: string
  title: string
  summary: string
}

export interface BookManuscriptCheckpointViewModel extends BookManuscriptCheckpointSummaryViewModel {
  chapters: BookManuscriptSnapshotChapterViewModel[]
}

export interface BookManuscriptCompareSceneViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  delta: BookManuscriptCompareDelta
  currentScene?: BookManuscriptSnapshotSceneViewModel
  checkpointScene?: BookManuscriptSnapshotSceneViewModel
  currentWordCount?: number
  checkpointWordCount?: number
  wordDelta: number
  traceReadyChanged: boolean
  warningsDelta: number
  currentExcerpt?: string
  checkpointExcerpt?: string
}

export interface BookManuscriptCompareTotalsViewModel {
  sceneCount: number
  missingCount: number
  addedCount: number
  draftMissingCount: number
  changedCount: number
  unchangedCount: number
  wordDelta: number
  traceRegressionCount: number
  warningsDelta: number
}

export interface BookManuscriptCompareChapterViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  scenes: BookManuscriptCompareSceneViewModel[]
  totals: BookManuscriptCompareTotalsViewModel
  wordDelta: number
  traceRegressionCount: number
  warningsDelta: number
}

export interface BookManuscriptCompareWorkspaceTotalsViewModel extends BookManuscriptCompareTotalsViewModel {
  chapterCount: number
}

export interface BookManuscriptCompareWorkspaceViewModel {
  bookId: string
  title: string
  summary: string
  checkpoint: BookManuscriptCheckpointSummaryViewModel
  selectedChapterId: string | null
  chapters: BookManuscriptCompareChapterViewModel[]
  selectedChapter: BookManuscriptCompareChapterViewModel | null
  totals: BookManuscriptCompareWorkspaceTotalsViewModel
}
