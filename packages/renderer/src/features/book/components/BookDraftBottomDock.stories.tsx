import type { Meta, StoryObj } from '@storybook/react'

import { BookDraftBottomDock } from './BookDraftBottomDock'
import {
  BookStoryShell,
  type BookStoryVariant,
} from './book-storybook'
import { useI18n } from '@/app/i18n'
import {
  buildBookDraftBranchProblemsStoryData,
  buildBookDraftBranchStoryData,
  buildBookDraftCompareStoryData,
  buildBookDraftExportStoryData,
  buildBookDraftReviewProblemsStoryData,
  buildBookDraftReviewStoryData,
  buildBookDraftStoryActivity,
  useLocalizedBookDraftWorkspace,
} from './book-draft-storybook'
import type { BookDraftExportProblems } from './BookDraftBottomDock'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'

interface BookDraftBottomDockStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  branchId?: string
  branchBaseline?: 'current' | 'checkpoint'
  exportProfileId?: string
  reviewFilter?: 'all' | 'blockers' | 'trace-gaps' | 'missing-drafts' | 'compare-deltas' | 'export-readiness' | 'branch-readiness' | 'scene-proposals'
  reviewStatusFilter?: 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'
  decisionStates?: Array<{
    issueId: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
    stale?: boolean
  }>
  draftView?: 'read' | 'compare' | 'export' | 'branch' | 'review'
}

function buildExportProblems(exportPreview: BookExportPreviewWorkspaceViewModel | null): BookDraftExportProblems | null {
  if (!exportPreview) {
    return null
  }

  const blockers = exportPreview.readiness.issues.filter((issue) => issue.severity === 'blocker')
  const warnings = exportPreview.readiness.issues.filter((issue) => issue.severity === 'warning')
  const traceGaps = exportPreview.readiness.issues.filter((issue) => issue.kind === 'trace_gap')
  const missingDrafts = exportPreview.readiness.issues.filter((issue) => issue.kind === 'missing_draft')
  const compareRegressions = exportPreview.readiness.issues.filter((issue) => issue.kind === 'compare_regression')
  const toItems = (issues: typeof blockers) =>
    issues.map((issue) => ({
      chapterId: issue.id,
      title: issue.chapterTitle ?? exportPreview.title,
      detail: issue.detail,
    }))

  return {
    blockerCount: blockers.length,
    warningCount: warnings.length,
    traceGapCount: traceGaps.length,
    missingDraftCount: missingDrafts.length,
    compareRegressionCount: compareRegressions.length,
    blockers: toItems(blockers),
    warnings: toItems(warnings),
    traceGaps: toItems(traceGaps),
    missingDrafts: toItems(missingDrafts),
    compareRegressions: toItems(compareRegressions),
  }
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  branchId,
  branchBaseline = 'current',
  exportProfileId,
  reviewFilter = 'all',
  reviewStatusFilter = 'open',
  decisionStates = [],
  draftView = 'read',
}: BookDraftBottomDockStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })
  const branchData = buildBookDraftBranchStoryData(locale, { variant, selectedChapterId, branchId, branchBaseline, checkpointId })
  const exportData = buildBookDraftExportStoryData(locale, { variant, selectedChapterId, checkpointId, exportProfileId })
  const reviewData = buildBookDraftReviewStoryData(locale, {
    variant,
    selectedChapterId,
    checkpointId,
    branchId,
    branchBaseline,
    exportProfileId,
    reviewFilter,
    reviewStatusFilter,
    decisionStates,
  })
  const reviewIssue = reviewData.reviewInbox.selectedIssue

  return (
    <BookDraftBottomDock
      summary={workspace.dockSummary}
      activity={buildBookDraftStoryActivity(locale, workspace, {
        quiet: variant === 'quiet-book' && draftView === 'read',
        draftView,
        checkpointTitle: compareData.selectedCheckpoint.title,
        branchTitle: branchData.selectedBranch.title,
        branchSummary: branchData.selectedBranch.rationale,
        branchBaselineTitle: branchData.branchWorkspace.baseline.label,
        branchBaselineKind: branchData.branchWorkspace.baseline.kind,
        branchBaselineCheckpointId: branchData.branchWorkspace.baseline.checkpointId,
        exportProfileTitle: exportData.selectedExportProfile.title,
        exportProfileSummary: exportData.selectedExportProfile.summary,
        reviewFilter,
        reviewIssueTitle: reviewIssue?.title,
        reviewIssueChapterTitle: reviewIssue?.chapterTitle,
        reviewIssueSceneTitle: reviewIssue?.sceneTitle,
        reviewSourceActionLabel: reviewIssue?.handoffs[0]?.label,
      })}
      activeDraftView={draftView}
      compareProblems={draftView === 'compare' ? compareData.compareProblems : null}
      branchProblems={draftView === 'branch' ? buildBookDraftBranchProblemsStoryData(locale, branchData.branchWorkspace) : null}
      exportProblems={draftView === 'export' ? buildExportProblems(exportData.exportWorkspace) : null}
      reviewProblems={draftView === 'review' ? buildBookDraftReviewProblemsStoryData(reviewData.reviewInbox) : null}
    />
  )
}

const meta = {
  title: 'Business/BookDraftBottomDock',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-6xl rounded-md border border-line-soft bg-surface-1">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
    draftView: 'read',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ReadDefault: Story = {}

export const CompareDefault: Story = {
  args: {
    draftView: 'compare',
  },
}

export const CompareTraceRegression: Story = {
  args: {
    draftView: 'compare',
    variant: 'signals-heavy',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareQuietCheckpoint: Story = {
  args: {
    draftView: 'compare',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBookDraft: Story = {
  args: {
    draftView: 'read',
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ExportBlockedByMissingDraft: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportBlockedByTraceGap: Story = {
  args: {
    draftView: 'export',
    variant: 'missing-trace-attention',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportWarningsOnly: Story = {
  args: {
    draftView: 'export',
    variant: 'signals-heavy',
    exportProfileId: 'export-archive-snapshot',
  },
}

export const ExportReady: Story = {
  args: {
    draftView: 'export',
    variant: 'quiet-book',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    exportProfileId: 'export-review-packet',
  },
}

export const BranchCurrentBaselineQuietEnding: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'current',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const BranchCheckpointBaselineHighPressure: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

export const BranchBlockedMissingDraft: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewBranchReadiness: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'branch-readiness',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewDeferredDecision: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'export-readiness',
    reviewStatusFilter: 'deferred',
    selectedChapterId: 'chapter-open-water-signals',
    decisionStates: [
      {
        issueId: 'export-blocker-scene-dawn-slip',
        status: 'deferred',
        note: 'Carry this into the next pass.',
      },
    ],
  },
}
