import type { BookBranchBaseline, BookDraftView, BookReviewFilter } from '@/features/workbench/types/workbench-route'

export type ReviewIssueSeverity = 'blocker' | 'warning' | 'info'
export type ReviewIssueSource =
  | 'manuscript'
  | 'compare'
  | 'export'
  | 'branch'
  | 'traceability'
  | 'scene-proposal'
  | 'chapter-draft'
export type ReviewIssueKind =
  | 'missing_draft'
  | 'trace_gap'
  | 'compare_delta'
  | 'export_blocker'
  | 'export_warning'
  | 'branch_blocker'
  | 'branch_warning'
  | 'scene_proposal'
  | 'chapter_annotation'

export interface ReviewSourceHandoffViewModel {
  label: string
  draftView: BookDraftView
  checkpointId?: string
  exportProfileId?: string
  branchId?: string
  branchBaseline?: BookBranchBaseline
  reviewIssueId?: string
}

export type ReviewOptionalSourceStatus = 'idle' | 'loading' | 'ready'

export interface ReviewIssueViewModel {
  id: string
  severity: ReviewIssueSeverity
  source: ReviewIssueSource
  kind: ReviewIssueKind
  title: string
  detail: string
  chapterId?: string
  chapterTitle?: string
  chapterOrder?: number
  sceneId?: string
  sceneTitle?: string
  sceneOrder?: number
  assetId?: string
  assetTitle?: string
  handoff: ReviewSourceHandoffViewModel
}

export interface BookReviewInboxViewModel {
  bookId: string
  reviewFilter: BookReviewFilter
  issues: ReviewIssueViewModel[]
  filteredIssues: ReviewIssueViewModel[]
  selectedIssueId: string | null
  selectedIssue: ReviewIssueViewModel | null
  annotationsByChapterId: Record<string, ReviewIssueViewModel[]>
}
