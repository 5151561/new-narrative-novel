import type { BookBranchBaseline, BookDraftView, BookReviewFilter, BookReviewStatusFilter } from '@/features/workbench/types/workbench-route'

import { useI18n } from '@/app/i18n'
import type { BookReviewInboxViewModel, ReviewSourceHandoffViewModel } from '@/features/review/types/review-view-models'

import type { BookExperimentBranchSummaryViewModel, BookExperimentBranchWorkspaceViewModel } from '../types/book-branch-view-models'
import type {
  BookManuscriptCheckpointSummaryViewModel,
  BookManuscriptCompareWorkspaceViewModel,
} from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type {
  BookExportPreviewWorkspaceViewModel,
  BookExportProfileSummaryViewModel,
} from '../types/book-export-view-models'
import { BookDraftCheckpointPicker } from './BookDraftCheckpointPicker'
import { BookDraftBranchView } from './BookDraftBranchView'
import { BookDraftCompareView } from './BookDraftCompareView'
import { BookDraftExportView } from './BookDraftExportView'
import { BookDraftReader } from './BookDraftReader'
import { BookDraftReviewView } from './BookDraftReviewView'

interface BookDraftStageProps {
  draftView: BookDraftView
  workspace: BookDraftWorkspaceViewModel
  compare: BookManuscriptCompareWorkspaceViewModel | null
  compareError?: Error | null
  branchWorkspace?: BookExperimentBranchWorkspaceViewModel | null
  branchError?: Error | null
  branches: BookExperimentBranchSummaryViewModel[]
  selectedBranchId: string
  branchBaseline: BookBranchBaseline
  exportPreview?: BookExportPreviewWorkspaceViewModel | null
  exportProfiles: BookExportProfileSummaryViewModel[]
  selectedExportProfileId: string
  exportError?: Error | null
  reviewInbox?: BookReviewInboxViewModel | null
  reviewError?: Error | null
  reviewDecisionError?: Error | null
  checkpoints: BookManuscriptCheckpointSummaryViewModel[]
  selectedCheckpointId: string
  onSelectDraftView: (draftView: BookDraftView) => void
  onSelectChapter: (chapterId: string) => void
  onOpenChapter: (chapterId: string, lens: 'structure' | 'draft') => void
  onSelectCheckpoint: (checkpointId: string) => void
  onSelectBranch: (branchId: string) => void
  onSelectBranchBaseline: (baseline: BookBranchBaseline) => void
  onSelectExportProfile: (exportProfileId: string) => void
  onSelectReviewFilter: (filter: BookReviewFilter) => void
  onSelectReviewStatusFilter?: (statusFilter: BookReviewStatusFilter) => void
  onSelectReviewIssue: (issueId: string) => void
  onSetReviewDecision?: (input: {
    issueId: string
    issueSignature: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
  }) => void
  onClearReviewDecision?: (issueId: string) => void
  isReviewDecisionSaving?: boolean
  onOpenReviewSource: (handoff: ReviewSourceHandoffViewModel) => void
}

export function BookDraftStage({
  draftView,
  workspace,
  compare,
  compareError = null,
  branchWorkspace = null,
  branchError = null,
  branches,
  selectedBranchId,
  branchBaseline,
  exportPreview = null,
  exportProfiles,
  selectedExportProfileId,
  exportError = null,
  reviewInbox = null,
  reviewError = null,
  reviewDecisionError = null,
  checkpoints,
  selectedCheckpointId,
  onSelectDraftView,
  onSelectChapter,
  onOpenChapter,
  onSelectCheckpoint,
  onSelectBranch,
  onSelectBranchBaseline,
  onSelectExportProfile,
  onSelectReviewFilter,
  onSelectReviewStatusFilter = () => undefined,
  onSelectReviewIssue,
  onSetReviewDecision = () => undefined,
  onClearReviewDecision = () => undefined,
  isReviewDecisionSaving = false,
  onOpenReviewSource,
}: BookDraftStageProps) {
  const { locale } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft bg-surface-1 px-4 py-3">
        <div className="inline-flex rounded-md border border-line-soft bg-surface-2 p-1">
          {([
            { value: 'read' as const, label: locale === 'zh-CN' ? 'Read' : 'Read' },
            { value: 'compare' as const, label: locale === 'zh-CN' ? 'Compare' : 'Compare' },
            { value: 'export' as const, label: locale === 'zh-CN' ? 'Export' : 'Export' },
            { value: 'branch' as const, label: locale === 'zh-CN' ? 'Branch' : 'Branch' },
            { value: 'review' as const, label: locale === 'zh-CN' ? 'Review' : 'Review' },
          ]).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={draftView === option.value}
              onClick={() => onSelectDraftView(option.value)}
              className={`rounded-md px-3 py-2 text-sm ${
                draftView === option.value ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      {draftView === 'compare' ? (
        <>
          <div className="border-b border-line-soft bg-surface-1 px-4 py-4">
            <BookDraftCheckpointPicker
              checkpoints={checkpoints}
              selectedCheckpointId={selectedCheckpointId}
              checkpointMeta={compare?.checkpoint ?? checkpoints.find((checkpoint) => checkpoint.checkpointId === selectedCheckpointId) ?? null}
              onSelectCheckpoint={onSelectCheckpoint}
            />
          </div>
          <BookDraftCompareView
            compare={compare}
            errorMessage={compareError?.message ?? null}
            onSelectChapter={onSelectChapter}
            onOpenChapter={onOpenChapter}
          />
        </>
      ) : draftView === 'export' ? (
          <BookDraftExportView
          exportPreview={exportPreview}
          exportProfiles={exportProfiles}
          selectedExportProfileId={selectedExportProfileId}
          errorMessage={exportError?.message ?? null}
          onSelectChapter={onSelectChapter}
          onOpenChapter={onOpenChapter}
          onSelectExportProfile={onSelectExportProfile}
        />
      ) : draftView === 'branch' ? (
        <BookDraftBranchView
          branchWorkspace={branchWorkspace}
          branches={branches}
          selectedBranchId={selectedBranchId}
          branchBaseline={branchBaseline}
          errorMessage={branchError?.message ?? null}
          onSelectChapter={onSelectChapter}
          onOpenChapter={onOpenChapter}
          onSelectBranch={onSelectBranch}
          onSelectBranchBaseline={onSelectBranchBaseline}
        />
      ) : draftView === 'review' ? (
        <BookDraftReviewView
          inbox={reviewInbox}
          errorMessage={reviewError?.message ?? null}
          decisionErrorMessage={reviewDecisionError?.message ?? null}
          onSelectFilter={onSelectReviewFilter}
          onSelectStatusFilter={onSelectReviewStatusFilter}
          onSelectIssue={onSelectReviewIssue}
          onSetDecision={onSetReviewDecision}
          onClearDecision={onClearReviewDecision}
          isDecisionSaving={isReviewDecisionSaving}
          onOpenReviewSource={onOpenReviewSource}
        />
      ) : (
        <BookDraftReader workspace={workspace} onSelectChapter={onSelectChapter} onOpenChapter={onOpenChapter} />
      )}
    </div>
  )
}
