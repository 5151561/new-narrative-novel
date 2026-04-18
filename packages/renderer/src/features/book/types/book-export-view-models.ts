import type { BookExportProfileKind } from '../api/book-export-profiles'
import type { BookManuscriptCompareDelta } from './book-compare-view-models'

export interface BookExportProfileIncludesViewModel {
  manuscriptBody: boolean
  chapterSummaries: boolean
  sceneHeadings: boolean
  traceAppendix: boolean
  compareSummary: boolean
  readinessChecklist: boolean
}

export interface BookExportProfileRulesViewModel {
  requireAllScenesDrafted: boolean
  requireTraceReady: boolean
  allowWarnings: boolean
  allowDraftMissing: boolean
}

export interface BookExportProfileSummaryViewModel {
  exportProfileId: string
  bookId: string
  kind: BookExportProfileKind
  title: string
  summary: string
  createdAtLabel: string
  includes: BookExportProfileIncludesViewModel
  rules: BookExportProfileRulesViewModel
}

export interface BookExportProfileViewModel extends BookExportProfileSummaryViewModel {}

export type BookExportReadinessSeverity = 'blocker' | 'warning' | 'info'

export type BookExportReadinessKind =
  | 'missing_draft'
  | 'trace_gap'
  | 'warning_delta'
  | 'queued_revision'
  | 'compare_regression'
  | 'profile_rule'

export interface BookExportReadinessIssueViewModel {
  id: string
  severity: BookExportReadinessSeverity
  kind: BookExportReadinessKind
  chapterId?: string
  chapterTitle?: string
  sceneId?: string
  sceneTitle?: string
  title: string
  detail: string
  recommendedActionLabel?: string
}

export interface BookExportScenePreviewViewModel {
  sceneId: string
  order: number
  title: string
  summary: string
  proseDraft?: string
  draftWordCount?: number
  isIncluded: boolean
  isMissingDraft: boolean
  traceReady: boolean
  warningsCount: number
  compareDelta?: BookManuscriptCompareDelta
}

export interface BookExportChapterPreviewViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  isIncluded: boolean
  assembledWordCount: number
  missingDraftCount: number
  missingTraceCount: number
  warningCount: number
  scenes: BookExportScenePreviewViewModel[]
  readinessStatus: 'ready' | 'attention' | 'blocked'
}

export interface BookExportPreviewWorkspaceTotalsViewModel {
  includedChapterCount: number
  includedSceneCount: number
  assembledWordCount: number
  blockerCount: number
  warningCount: number
  infoCount: number
  missingDraftCount: number
  traceGapCount: number
  compareChangedSceneCount: number
}

export interface BookExportReadinessViewModel {
  status: 'ready' | 'attention' | 'blocked'
  label: string
  issues: BookExportReadinessIssueViewModel[]
  blockerCount: number
  warningCount: number
  infoCount: number
}

export interface BookExportPackageSummaryViewModel {
  includedSections: string[]
  excludedSections: string[]
  estimatedPackageLabel: string
}

export interface BookExportPreviewWorkspaceViewModel {
  bookId: string
  title: string
  summary: string
  selectedChapterId: string | null
  selectedChapter: BookExportChapterPreviewViewModel | null
  profile: BookExportProfileViewModel
  chapters: BookExportChapterPreviewViewModel[]
  totals: BookExportPreviewWorkspaceTotalsViewModel
  readiness: BookExportReadinessViewModel
  packageSummary: BookExportPackageSummaryViewModel
}
