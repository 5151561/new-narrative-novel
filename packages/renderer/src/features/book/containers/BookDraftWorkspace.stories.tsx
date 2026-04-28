import type { Meta, StoryObj } from '@storybook/react'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { WorkbenchStatusTopBar } from '@/features/workbench/components/WorkbenchStatusTopBar'

import { BookDraftBinderPane } from '../components/BookDraftBinderPane'
import { BookDraftInspectorPane } from '../components/BookDraftInspectorPane'
import { BookDraftBottomDock } from '../components/BookDraftBottomDock'
import { BookDraftStage } from '../components/BookDraftStage'
import { BookModeRail } from '../components/BookModeRail'
import {
  BookStoryShell,
  type BookStoryVariant,
} from '../components/book-storybook'
import {
  buildBookDraftBranchProblemsStoryData,
  buildBookDraftArtifactStoryData,
  buildBookDraftBranchStoryData,
  buildBookDraftCompareStoryData,
  buildBookDraftExportStoryData,
  buildBookDraftReviewProblemsStoryData,
  buildBookDraftReviewStoryData,
  buildBookDraftStoryActivity,
  useLocalizedBookDraftWorkspace,
} from '../components/book-draft-storybook'
import { buildBookDraftExportBaselineError } from '../components/book-draft-storybook'
import type { BookDraftExportProblems } from '../components/BookDraftBottomDock'
import type { BookExportArtifactWorkspaceViewModel } from '../types/book-export-artifact-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'

interface BookDraftWorkspaceStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  branchId?: string
  branchBaseline?: 'current' | 'checkpoint'
  exportProfileId?: string
  reviewSeedBookId?: string
  reviewIssueId?: string
  reviewFilter?: 'all' | 'blockers' | 'trace-gaps' | 'missing-drafts' | 'compare-deltas' | 'export-readiness' | 'branch-readiness' | 'scene-proposals'
  reviewStatusFilter?: 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'
  decisionStates?: Array<{
    issueId: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
    stale?: boolean
  }>
  fixActionStates?: Array<{
    issueId: string
    status: 'started' | 'checked' | 'blocked'
    note?: string
    stale?: boolean
  }>
  draftView?: 'read' | 'compare' | 'export' | 'branch' | 'review'
  exportState?: 'ready' | 'error'
  artifactScenario?: 'empty' | 'latest' | 'stale'
}

function buildExportProblems(
  exportPreview: BookExportPreviewWorkspaceViewModel | null,
  artifactWorkspace: BookExportArtifactWorkspaceViewModel | null,
): BookDraftExportProblems | null {
  if (!exportPreview) {
    return null
  }

  const blockers = exportPreview.readiness.issues.filter((issue) => issue.severity === 'blocker')
  const warnings = exportPreview.readiness.issues.filter((issue) => issue.severity === 'warning')
  const traceGaps = exportPreview.readiness.issues.filter((issue) => issue.kind === 'trace_gap')
  const missingDrafts = exportPreview.readiness.issues.filter((issue) => issue.kind === 'missing_draft')
  const compareRegressions = exportPreview.readiness.issues.filter((issue) => issue.kind === 'compare_regression')
  const artifactReadinessBlockers =
    artifactWorkspace?.gate.reasons.filter((reason) => reason.severity === 'blocker' && reason.source === 'export-readiness') ?? []
  const artifactReviewBlockers =
    artifactWorkspace?.gate.reasons.filter((reason) => reason.severity === 'blocker' && reason.source === 'review-open-blocker') ?? []
  const staleArtifact = artifactWorkspace?.latestArtifact?.isStale ? artifactWorkspace.latestArtifact : null
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
    artifactReadinessBlockerCount: artifactReadinessBlockers.length,
    artifactReviewBlockerCount: artifactReviewBlockers.length,
    staleArtifactCount: staleArtifact ? 1 : 0,
    blockers: toItems(blockers),
    warnings: toItems(warnings),
    traceGaps: toItems(traceGaps),
    missingDrafts: toItems(missingDrafts),
    compareRegressions: toItems(compareRegressions),
    artifactGateProblems: [
      ...artifactReadinessBlockers.map((reason) => ({
        chapterId: `artifact-readiness:${reason.id}`,
        title: 'Artifact blocked by export readiness',
        detail: reason.title,
      })),
      ...artifactReviewBlockers.map((reason) => ({
        chapterId: `artifact-review:${reason.id}`,
        title: 'Artifact blocked by review open blockers',
        detail: reason.detail,
      })),
      ...(staleArtifact
        ? [
            {
              chapterId: `artifact-stale:${staleArtifact.artifactId}`,
              title: 'Latest artifact stale',
              detail: `${staleArtifact.filename} no longer matches the current export source.`,
            },
          ]
        : []),
    ],
  }
}

function WorkspacePreview({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  branchId,
  branchBaseline = 'current',
  exportProfileId,
  reviewSeedBookId,
  reviewIssueId,
  reviewFilter = 'all',
  reviewStatusFilter = 'open',
  decisionStates = [],
  fixActionStates = [],
  draftView = 'read',
  exportState = 'ready',
  artifactScenario = 'latest',
}: BookDraftWorkspaceStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const selectedChapterTitle = workspace.chapters.find((chapter) => chapter.chapterId === workspace.selectedChapterId)?.title
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })
  const branchData = buildBookDraftBranchStoryData(locale, { variant, selectedChapterId, branchId, branchBaseline, checkpointId })
  const exportData = buildBookDraftExportStoryData(locale, { variant, selectedChapterId, checkpointId, exportProfileId })
  const artifactWorkspace =
    draftView === 'export' && exportState === 'ready'
      ? buildBookDraftArtifactStoryData(locale, { variant, selectedChapterId, checkpointId, exportProfileId, artifactScenario })
      : null
  const reviewData = buildBookDraftReviewStoryData(locale, {
    variant,
    selectedChapterId,
    checkpointId,
    exportProfileId,
    branchId,
    branchBaseline,
    reviewSeedBookId,
    reviewFilter,
    reviewStatusFilter,
    reviewIssueId,
    decisionStates,
    fixActionStates,
    includeReviewSeeds: !(draftView === 'review' && reviewFilter === 'scene-proposals' && variant === 'quiet-book'),
  })
  const exportError = draftView === 'export' && exportState === 'error' ? buildBookDraftExportBaselineError() : null
  const effectiveExportPreview = exportError ? null : exportData.exportWorkspace
  const reviewIssue = reviewData.reviewInbox.selectedIssue
  const activity = buildBookDraftStoryActivity(locale, workspace, {
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
  })

  return (
    <WorkbenchShell
      topBar={
        <WorkbenchStatusTopBar
          title={locale === 'zh-CN' ? '书籍手稿' : 'Book manuscript'}
          subtitle={`${workspace.title} / ${getWorkbenchLensLabel(locale, 'draft')}${selectedChapterTitle ? ` / ${selectedChapterTitle}` : ''}`}
        >
          <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${workspace.assembledWordCount} 词` : `${workspace.assembledWordCount} words`}</Badge>
          <Badge tone={workspace.missingDraftChapterCount > 0 ? 'warn' : 'success'}>
            {locale === 'zh-CN' ? `缺稿 ${workspace.missingDraftChapterCount}` : `Missing ${workspace.missingDraftChapterCount}`}
          </Badge>
        </WorkbenchStatusTopBar>
      }
      modeRail={<BookModeRail activeScope="book" activeLens="draft" onSelectScope={() => undefined} onSelectLens={() => undefined} />}
      navigator={<BookDraftBinderPane workspace={workspace} onSelectChapter={() => undefined} onOpenChapter={() => undefined} />}
      mainStage={
        <BookDraftStage
          draftView={draftView}
          workspace={workspace}
          compare={compareData.compare}
          branchWorkspace={draftView === 'branch' ? branchData.branchWorkspace : null}
          branchError={null}
          branches={branchData.branches}
          selectedBranchId={branchData.selectedBranch.branchId}
          branchBaseline={branchBaseline}
          exportPreview={draftView === 'export' ? effectiveExportPreview : null}
          exportProfiles={exportData.exportProfiles}
          selectedExportProfileId={exportData.selectedExportProfile.exportProfileId}
          exportError={exportError}
          artifactWorkspace={artifactWorkspace}
          selectedArtifactFormat="markdown"
          isBuildingArtifact={false}
          artifactBuildErrorMessage={null}
          reviewInbox={draftView === 'review' ? reviewData.reviewInbox : null}
          reviewError={null}
          checkpoints={compareData.checkpoints}
          selectedCheckpointId={compareData.selectedCheckpoint.checkpointId}
          onSelectDraftView={() => undefined}
          onSelectChapter={() => undefined}
          onOpenChapter={() => undefined}
          onSelectCheckpoint={() => undefined}
          onSelectBranch={() => undefined}
          onSelectBranchBaseline={() => undefined}
          onSelectExportProfile={() => undefined}
          onSelectArtifactFormat={() => undefined}
          onBuildArtifact={() => undefined}
          onCopyArtifact={() => undefined}
          onDownloadArtifact={() => undefined}
          onSelectReviewFilter={() => undefined}
          onSelectReviewStatusFilter={() => undefined}
          onSelectReviewIssue={() => undefined}
          onSetReviewDecision={() => undefined}
          onClearReviewDecision={() => undefined}
          onStartReviewFix={() => undefined}
          onSetReviewFixStatus={() => undefined}
          onClearReviewFix={() => undefined}
          onOpenReviewSource={() => undefined}
        />
      }
      inspector={
        <BookDraftInspectorPane
          bookTitle={workspace.title}
          inspector={workspace.inspector}
          readableManuscript={workspace.readableManuscript}
          activeDraftView={draftView}
          compare={draftView === 'compare' ? compareData.compare : null}
          branch={draftView === 'branch' ? branchData.branchWorkspace : null}
          exportPreview={draftView === 'export' ? effectiveExportPreview : null}
          artifactWorkspace={artifactWorkspace}
          exportError={exportError}
          reviewInbox={draftView === 'review' ? reviewData.reviewInbox : null}
          onOpenReviewSource={() => undefined}
          checkpointMeta={draftView === 'compare' ? compareData.selectedCheckpoint : null}
        />
      }
      bottomDock={
        <BookDraftBottomDock
          summary={workspace.dockSummary}
          activity={activity}
          activeDraftView={draftView}
          compareProblems={draftView === 'compare' ? compareData.compareProblems : null}
          branchProblems={draftView === 'branch' ? buildBookDraftBranchProblemsStoryData(locale, branchData.branchWorkspace) : null}
          exportProblems={draftView === 'export' ? buildExportProblems(effectiveExportPreview, artifactWorkspace) : null}
          reviewProblems={draftView === 'review' ? buildBookDraftReviewProblemsStoryData(reviewData.reviewInbox) : null}
          exportError={exportError}
        />
      }
    />
  )
}

const meta = {
  title: 'Mockups/Book/BookDraftWorkspace',
  component: WorkspacePreview,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[780px]">
      <WorkspacePreview {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
    draftView: 'read',
    exportState: 'ready',
  },
} satisfies Meta<typeof WorkspacePreview>

export default meta

type Story = StoryObj<typeof meta>

export const ReadDefault: Story = {}

export const CompareDefault: Story = {
  args: {
    draftView: 'compare',
  },
}

export const CompareSelectedSecondChapter: Story = {
  args: {
    draftView: 'compare',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareMissingDrafts: Story = {
  args: {
    draftView: 'compare',
    variant: 'default',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

export const CompareTraceRegression: Story = {
  args: {
    draftView: 'compare',
    variant: 'missing-trace-attention',
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

export const ReadManuscriptReady: Story = {
  args: {
    draftView: 'read',
    variant: 'manuscript-ready',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

export const ReadManuscriptGaps: Story = {
  args: {
    draftView: 'read',
    variant: 'manuscript-gaps',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ExportReviewPacket: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportSubmissionPreview: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-submission-preview',
  },
}

export const ExportArchiveSnapshot: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-archive-snapshot',
  },
}

export const ExportBlockedByMissingDraft: Story = {
  args: {
    draftView: 'export',
    variant: 'default',
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

export const ExportReadableManuscript: Story = {
  args: {
    draftView: 'export',
    variant: 'manuscript-ready',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportLatestArtifactStale: Story = {
  args: {
    draftView: 'export',
    variant: 'quiet-book',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    exportProfileId: 'export-review-packet',
    artifactScenario: 'stale',
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

export const BranchTraceImprovedQuietEnding: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ExportBaselineUnavailable: Story = {
  args: {
    draftView: 'export',
    exportState: 'error',
    checkpointId: 'checkpoint-missing',
    exportProfileId: 'export-review-packet',
  },
}

export const ReviewTraceGaps: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'trace-gaps',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewSourceFixStartReady: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'trace-gaps',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewSourceFixStarted: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'trace-gaps',
    selectedChapterId: 'chapter-open-water-signals',
    fixActionStates: [
      {
        issueId: 'compare-trace-gap-chapter-open-water-signals-scene-warehouse-bridge',
        status: 'started',
        note: 'Source fix started from compare review.',
      },
    ],
  },
}

export const ReviewSourceFixBlocked: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'trace-gaps',
    selectedChapterId: 'chapter-open-water-signals',
    fixActionStates: [
      {
        issueId: 'compare-trace-gap-chapter-open-water-signals-scene-warehouse-bridge',
        status: 'blocked',
        note: 'Blocked until compare ownership is resolved.',
      },
    ],
  },
}

export const ReviewSourceFixChecked: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'trace-gaps',
    selectedChapterId: 'chapter-open-water-signals',
    fixActionStates: [
      {
        issueId: 'compare-trace-gap-chapter-open-water-signals-scene-warehouse-bridge',
        status: 'checked',
        note: 'Source checked; review decision remains open.',
      },
    ],
  },
}

export const ReviewEmptyFilter: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'scene-proposals',
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewDeferredDecision: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'export-readiness',
    reviewStatusFilter: 'deferred',
    decisionStates: [
      {
        issueId: 'export-blocker-scene-dawn-slip',
        status: 'deferred',
        note: 'Carry this into the next pass.',
      },
    ],
  },
}

export const GateDReviewBranchReady: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'all',
    reviewStatusFilter: 'open',
    reviewSeedBookId: 'book-signal-arc',
    reviewIssueId: 'continuity-conflict-ledger-public-proof',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'checkpoint',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}
