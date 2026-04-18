import type { BookExperimentBranchStatus } from '../api/book-experiment-branches'
import type { BookBranchBaseline } from '@/features/workbench/types/workbench-route'

export type BookBranchDeltaKind = 'unchanged' | 'changed' | 'added' | 'missing' | 'draft_missing'

export interface BookExperimentBranchSummaryViewModel {
  branchId: string
  bookId: string
  title: string
  summary: string
  rationale: string
  createdAtLabel: string
  basedOnCheckpointId?: string
  status: BookExperimentBranchStatus
}

export interface BookExperimentBranchSnapshotSceneViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  proseDraft?: string
  draftWordCount?: number
  traceReady: boolean
  warningsCount: number
  sourceProposalCount?: number
}

export interface BookExperimentBranchSnapshotChapterViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  scenes: BookExperimentBranchSnapshotSceneViewModel[]
}

export interface BookExperimentBranchSnapshotViewModel extends BookExperimentBranchSummaryViewModel {
  selectedChapterId: string | null
  chapters: BookExperimentBranchSnapshotChapterViewModel[]
}

export interface BookExperimentBranchBaselineSnapshotViewModel {
  kind: BookBranchBaseline
  label: string
  checkpointId?: string
  bookId: string
  title: string
  summary: string
  selectedChapterId: string | null
  chapters: BookExperimentBranchSnapshotChapterViewModel[]
}

export interface BookBranchSceneDeltaViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  delta: BookBranchDeltaKind
  branchScene?: BookExperimentBranchSnapshotSceneViewModel
  baselineScene?: BookExperimentBranchSnapshotSceneViewModel
  branchExcerpt?: string
  baselineExcerpt?: string
  branchWordCount?: number
  baselineWordCount?: number
  wordDelta: number
  traceReadyChanged: boolean
  warningsDelta: number
  sourceProposalDelta: number
  branchSourceProposalCount?: number
  baselineSourceProposalCount?: number
}

export interface BookBranchChapterDeltaViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  sceneDeltas: BookBranchSceneDeltaViewModel[]
  changedSceneCount: number
  addedSceneCount: number
  missingSceneCount: number
  draftMissingSceneCount: number
  wordDelta: number
  traceRegressionCount: number
  traceImprovementCount: number
  warningsDelta: number
  sourceProposalDelta: number
  readinessStatus: 'ready' | 'attention' | 'blocked'
}

export interface BookExperimentBranchWorkspaceTotalsViewModel {
  changedChapterCount: number
  changedSceneCount: number
  addedSceneCount: number
  missingSceneCount: number
  draftMissingSceneCount: number
  wordDelta: number
  traceRegressionCount: number
  traceImprovementCount: number
  warningsDelta: number
  sourceProposalDelta: number
  blockedChapterCount: number
  attentionChapterCount: number
}

export interface BookExperimentBranchReadinessIssueViewModel {
  id: string
  severity: 'blocker' | 'warning' | 'info'
  chapterId?: string
  sceneId?: string
  title: string
  detail: string
}

export interface BookExperimentBranchReadinessViewModel {
  status: 'ready' | 'attention' | 'blocked'
  label: string
  issues: BookExperimentBranchReadinessIssueViewModel[]
}

export interface BookExperimentBranchComparisonViewModel {
  bookId: string
  title: string
  summary: string
  selectedChapterId: string | null
  selectedChapter: BookBranchChapterDeltaViewModel | null
  baseline: {
    kind: BookBranchBaseline
    label: string
    checkpointId?: string
  }
  chapters: BookBranchChapterDeltaViewModel[]
  totals: BookExperimentBranchWorkspaceTotalsViewModel
  readiness: BookExperimentBranchReadinessViewModel
}

export interface BookExperimentBranchWorkspaceViewModel extends BookExperimentBranchComparisonViewModel {
  branch: BookExperimentBranchSummaryViewModel | null
  branches: BookExperimentBranchSummaryViewModel[]
}
