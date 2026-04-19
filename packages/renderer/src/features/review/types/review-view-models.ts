import type { SceneTab } from '@/features/scene/types/scene-view-models'
import type {
  AssetKnowledgeView,
  BookBranchBaseline,
  BookDraftView,
  BookReviewFilter,
  BookReviewStatusFilter,
  BookStructureView,
  ChapterStructureView,
} from '@/features/workbench/types/workbench-route'

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

export type ReviewSourceHandoffTarget =
  | {
      scope: 'book'
      lens: 'draft'
      view: BookStructureView
      draftView: BookDraftView
      selectedChapterId?: string
      checkpointId?: string
      exportProfileId?: string
      branchId?: string
      branchBaseline?: BookBranchBaseline
      reviewIssueId?: string
    }
  | {
      scope: 'chapter'
      chapterId: string
      lens: 'structure' | 'draft'
      view: ChapterStructureView
      sceneId?: string
    }
  | {
      scope: 'scene'
      sceneId: string
      lens: 'orchestrate' | 'draft' | 'structure'
      tab: SceneTab
    }
  | {
      scope: 'asset'
      assetId: string
      lens: 'knowledge'
      view: AssetKnowledgeView
    }

export interface ReviewSourceHandoffViewModel {
  id: string
  label: string
  target: ReviewSourceHandoffTarget
}

export type ReviewOptionalSourceStatus = 'idle' | 'loading' | 'ready'
export type ReviewDecisionStatus = 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'stale'

export interface ReviewIssueDecisionViewModel {
  status: ReviewDecisionStatus
  note?: string
  updatedAtLabel?: string
  updatedByLabel?: string
  isStale: boolean
}

export interface ReviewIssueViewModel {
  id: string
  severity: ReviewIssueSeverity
  source: ReviewIssueSource
  kind: ReviewIssueKind
  title: string
  detail: string
  recommendation: string
  chapterId?: string
  chapterTitle?: string
  chapterOrder?: number
  sceneId?: string
  sceneTitle?: string
  sceneOrder?: number
  assetId?: string
  assetTitle?: string
  sourceLabel: string
  sourceExcerpt?: string
  tags: string[]
  handoffs: ReviewSourceHandoffViewModel[]
  issueSignature: string
  decision: ReviewIssueDecisionViewModel
}

export interface ReviewIssueGroupsViewModel {
  blockers: ReviewIssueViewModel[]
  warnings: ReviewIssueViewModel[]
  info: ReviewIssueViewModel[]
}

export interface BookReviewInboxCountsViewModel {
  total: number
  blockers: number
  warnings: number
  info: number
  traceGaps: number
  missingDrafts: number
  compareDeltas: number
  exportReadiness: number
  branchReadiness: number
  sceneProposals: number
  open: number
  reviewed: number
  deferred: number
  dismissed: number
  stale: number
}

export interface BookReviewInboxViewModel {
  bookId: string
  title: string
  selectedIssueId: string | null
  selectedIssue: ReviewIssueViewModel | null
  activeFilter: BookReviewFilter
  activeStatusFilter: BookReviewStatusFilter
  issues: ReviewIssueViewModel[]
  filteredIssues: ReviewIssueViewModel[]
  groupedIssues: ReviewIssueGroupsViewModel
  counts: BookReviewInboxCountsViewModel
  visibleOpenCount: number
  selectedChapterIssueCount: number
  annotationsByChapterId: Record<string, ReviewIssueViewModel[]>
}
