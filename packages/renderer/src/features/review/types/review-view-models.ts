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
  | 'continuity'
  | 'asset-consistency'
  | 'stale-prose'
  | 'scene-proposal'
  | 'chapter-draft'
export type ReviewIssueKind =
  | 'missing_draft'
  | 'trace_gap'
  | 'continuity_conflict'
  | 'asset_inconsistency'
  | 'missing_trace'
  | 'stale_prose_after_canon_change'
  | 'chapter_gap'
  | 'rewrite_request'
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
export type ReviewFixActionViewStatus = 'not_started' | 'started' | 'checked' | 'blocked' | 'rewrite_requested' | 'stale'

export interface ReviewIssueDecisionViewModel {
  status: ReviewDecisionStatus
  note?: string
  updatedAtLabel?: string
  updatedByLabel?: string
  isStale: boolean
}

export interface ReviewIssueFixActionViewModel {
  status: ReviewFixActionViewStatus
  sourceHandoffId?: string
  sourceHandoffLabel?: string
  targetScope?: ReviewSourceHandoffTarget['scope']
  note?: string
  rewriteRequestNote?: string
  rewriteTargetSceneId?: string
  rewriteRequestId?: string
  startedAtLabel?: string
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
  fixAction: ReviewIssueFixActionViewModel
  primaryFixHandoff: ReviewSourceHandoffViewModel | null
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
  continuityConflicts: number
  assetInconsistencies: number
  missingTrace: number
  staleProse: number
  chapterGaps: number
  rewriteRequests: number
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
  fixStarted: number
  fixChecked: number
  fixBlocked: number
  fixStale: number
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
