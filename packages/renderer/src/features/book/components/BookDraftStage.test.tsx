import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'

import { mockBookExperimentBranchSeeds } from '../api/book-experiment-branches'
import { buildBookExperimentBranchWorkspace, normalizeBookExperimentBranch } from '../lib/book-experiment-branch-mappers'
import type { BookExperimentBranchSummaryViewModel, BookExperimentBranchWorkspaceViewModel } from '../types/book-branch-view-models'
import type { BookManuscriptCheckpointSummaryViewModel, BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel, BookExportProfileSummaryViewModel } from '../types/book-export-view-models'
import { BookDraftStage } from './BookDraftStage'

function buildWorkspace(): BookDraftWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Read the manuscript in book order without losing chapter boundaries.',
    selectedChapterId: 'chapter-open-water-signals',
    assembledWordCount: 44,
    draftedChapterCount: 2,
    missingDraftChapterCount: 0,
    chapters: [
      {
        chapterId: 'chapter-signals-in-rain',
        order: 1,
        title: 'Signals in Rain',
        summary: 'Keep platform pressure audible.',
        sceneCount: 1,
        draftedSceneCount: 1,
        missingDraftCount: 0,
        assembledWordCount: 20,
        warningsCount: 1,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 0,
        coverageStatus: 'ready',
        assembledProseSections: ['Rain held the platform in place while Ren refused to blink first.'],
        sections: [
          {
            sceneId: 'scene-midnight-platform',
            order: 1,
            title: 'Midnight Platform',
            summary: 'Keep the bargain public.',
            proseDraft: 'Rain held the platform in place while Ren refused to blink first.',
            draftWordCount: 11,
            isMissingDraft: false,
            warningsCount: 1,
            traceReady: true,
            relatedAssetCount: 2,
            sourceProposalCount: 2,
          },
        ],
      },
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Carry the courier handoff into open water.',
        sceneCount: 1,
        draftedSceneCount: 1,
        missingDraftCount: 0,
        assembledWordCount: 24,
        warningsCount: 0,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 0,
        coverageStatus: 'ready',
        assembledProseSections: ['Warehouse pressure stayed visible while the courier handoff slipped toward open water.'],
        sections: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Keep the handoff unstable.',
            proseDraft: 'Warehouse pressure stayed visible while the courier handoff slipped toward open water.',
            draftWordCount: 13,
            isMissingDraft: false,
            warningsCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
        ],
      },
    ],
    selectedChapter: {
      chapterId: 'chapter-open-water-signals',
      order: 2,
      title: 'Open Water Signals',
      summary: 'Carry the courier handoff into open water.',
      sceneCount: 1,
      draftedSceneCount: 1,
      missingDraftCount: 0,
      assembledWordCount: 24,
      warningsCount: 0,
      queuedRevisionCount: 0,
      tracedSceneCount: 1,
      missingTraceSceneCount: 0,
      coverageStatus: 'ready',
      assembledProseSections: ['Warehouse pressure stayed visible while the courier handoff slipped toward open water.'],
      sections: [
        {
          sceneId: 'scene-warehouse-bridge',
          order: 1,
          title: 'Warehouse Bridge',
          summary: 'Keep the handoff unstable.',
          proseDraft: 'Warehouse pressure stayed visible while the courier handoff slipped toward open water.',
          draftWordCount: 13,
          isMissingDraft: false,
          warningsCount: 0,
          traceReady: true,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
        },
      ],
    },
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 2,
        missingDraftChapterCount: 0,
        assembledWordCount: 44,
        warningHeavyChapterCount: 1,
        missingTraceChapterCount: 0,
      },
      signals: {
        topMissingScenes: [],
        latestDiffSummaries: [],
        traceCoverageNote: 'Trace coverage is ready for the selected chapter.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 0,
      missingTraceChapterCount: 0,
      warningsChapterCount: 1,
      queuedRevisionChapterCount: 0,
      highestPressureChapters: [],
      missingDraftChapters: [],
      missingTraceChapters: [],
      warningsChapters: [],
      queuedRevisionChapters: [],
    },
  }
}

function buildCompare(): BookManuscriptCompareWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Compare current draft against the checkpoint.',
    checkpoint: {
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      bookId: 'book-signal-arc',
      title: 'PR11 Baseline',
      summary: 'Baseline manuscript snapshot.',
    },
    selectedChapterId: 'chapter-open-water-signals',
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Carry the courier handoff into open water.',
        totals: {
          sceneCount: 2,
          missingCount: 1,
          addedCount: 0,
          draftMissingCount: 0,
          changedCount: 1,
          unchangedCount: 0,
          wordDelta: 5,
          traceRegressionCount: 1,
          warningsDelta: 1,
        },
        wordDelta: 5,
        traceRegressionCount: 1,
        warningsDelta: 1,
        scenes: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Keep the handoff unstable.',
            delta: 'changed',
            currentScene: {
              sceneId: 'scene-warehouse-bridge',
              order: 1,
              title: 'Warehouse Bridge',
              summary: 'Keep the handoff unstable.',
              proseDraft: 'Current excerpt',
              draftWordCount: 13,
              warningsCount: 1,
              traceReady: false,
            },
            checkpointScene: {
              sceneId: 'scene-warehouse-bridge',
              order: 1,
              title: 'Warehouse Bridge',
              summary: 'Keep the handoff unstable.',
              proseDraft: 'Checkpoint excerpt',
              draftWordCount: 8,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 13,
            checkpointWordCount: 8,
            wordDelta: 5,
            traceReadyChanged: true,
            warningsDelta: 1,
            currentExcerpt: 'Current excerpt',
            checkpointExcerpt: 'Checkpoint excerpt',
          },
          {
            sceneId: 'scene-river-ledger',
            order: 2,
            title: 'River Ledger',
            summary: 'Legacy checkpoint scene.',
            delta: 'missing',
            checkpointScene: {
              sceneId: 'scene-river-ledger',
              order: 2,
              title: 'River Ledger',
              summary: 'Legacy checkpoint scene.',
              proseDraft: 'Removed excerpt',
              draftWordCount: 7,
              warningsCount: 0,
              traceReady: true,
            },
            wordDelta: -7,
            traceReadyChanged: false,
            warningsDelta: 0,
            checkpointWordCount: 7,
            checkpointExcerpt: 'Removed excerpt',
          },
        ],
      },
    ],
    selectedChapter: {
      chapterId: 'chapter-open-water-signals',
      order: 2,
      title: 'Open Water Signals',
      summary: 'Carry the courier handoff into open water.',
      totals: {
        sceneCount: 2,
        missingCount: 1,
        addedCount: 0,
        draftMissingCount: 0,
        changedCount: 1,
        unchangedCount: 0,
        wordDelta: 5,
        traceRegressionCount: 1,
        warningsDelta: 1,
      },
      wordDelta: 5,
      traceRegressionCount: 1,
      warningsDelta: 1,
      scenes: [
        {
          sceneId: 'scene-warehouse-bridge',
          order: 1,
          title: 'Warehouse Bridge',
          summary: 'Keep the handoff unstable.',
          delta: 'changed',
          currentScene: {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Keep the handoff unstable.',
            proseDraft: 'Current excerpt',
            draftWordCount: 13,
            warningsCount: 1,
            traceReady: false,
          },
          checkpointScene: {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Keep the handoff unstable.',
            proseDraft: 'Checkpoint excerpt',
            draftWordCount: 8,
            warningsCount: 0,
            traceReady: true,
          },
          currentWordCount: 13,
          checkpointWordCount: 8,
          wordDelta: 5,
          traceReadyChanged: true,
          warningsDelta: 1,
          currentExcerpt: 'Current excerpt',
          checkpointExcerpt: 'Checkpoint excerpt',
        },
        {
          sceneId: 'scene-river-ledger',
          order: 2,
          title: 'River Ledger',
          summary: 'Legacy checkpoint scene.',
          delta: 'missing',
          checkpointScene: {
            sceneId: 'scene-river-ledger',
            order: 2,
            title: 'River Ledger',
            summary: 'Legacy checkpoint scene.',
            proseDraft: 'Removed excerpt',
            draftWordCount: 7,
            warningsCount: 0,
            traceReady: true,
          },
          wordDelta: -7,
          traceReadyChanged: false,
          warningsDelta: 0,
          checkpointWordCount: 7,
          checkpointExcerpt: 'Removed excerpt',
        },
      ],
    },
    totals: {
      chapterCount: 1,
      sceneCount: 2,
      missingCount: 1,
      addedCount: 0,
      draftMissingCount: 0,
      changedCount: 1,
      unchangedCount: 0,
      wordDelta: 5,
      traceRegressionCount: 1,
      warningsDelta: 1,
    },
  }
}

const checkpoints: BookManuscriptCheckpointSummaryViewModel[] = [
  {
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    bookId: 'book-signal-arc',
    title: 'PR11 Baseline',
    summary: 'Baseline manuscript snapshot.',
  },
]

const exportProfiles: BookExportProfileSummaryViewModel[] = [
  {
    exportProfileId: 'export-review-packet',
    bookId: 'book-signal-arc',
    kind: 'review_packet',
    title: 'Review Packet',
    summary: 'Full manuscript packet with compare and trace context.',
    createdAtLabel: 'Updated for PR13 baseline',
    includes: {
      manuscriptBody: true,
      chapterSummaries: true,
      sceneHeadings: true,
      traceAppendix: true,
      compareSummary: true,
      readinessChecklist: true,
    },
    rules: {
      requireAllScenesDrafted: true,
      requireTraceReady: true,
      allowWarnings: false,
      allowDraftMissing: false,
    },
  },
]

const branches: BookExperimentBranchSummaryViewModel[] = mockBookExperimentBranchSeeds['book-signal-arc']!.map((record) =>
  normalizeBookExperimentBranch(record, 'en'),
)

function buildExportWorkspace(): BookExportPreviewWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Export-ready manuscript preview.',
    selectedChapterId: 'chapter-open-water-signals',
    selectedChapter: {
      chapterId: 'chapter-open-water-signals',
      order: 2,
      title: 'Open Water Signals',
      summary: 'Carry the courier handoff into open water.',
      isIncluded: true,
      assembledWordCount: 24,
      missingDraftCount: 0,
      missingTraceCount: 1,
      warningCount: 1,
      scenes: [],
      readinessStatus: 'attention',
    },
    profile: exportProfiles[0]!,
    chapters: [
      {
        chapterId: 'chapter-signals-in-rain',
        order: 1,
        title: 'Signals in Rain',
        summary: 'Keep platform pressure audible.',
        isIncluded: true,
        assembledWordCount: 20,
        missingDraftCount: 1,
        missingTraceCount: 0,
        warningCount: 0,
        scenes: [],
        readinessStatus: 'blocked',
      },
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Carry the courier handoff into open water.',
        isIncluded: true,
        assembledWordCount: 24,
        missingDraftCount: 0,
        missingTraceCount: 1,
        warningCount: 1,
        scenes: [],
        readinessStatus: 'attention',
      },
    ],
    totals: {
      includedChapterCount: 2,
      includedSceneCount: 2,
      assembledWordCount: 44,
      blockerCount: 1,
      warningCount: 1,
      infoCount: 0,
      missingDraftCount: 1,
      traceGapCount: 1,
      compareChangedSceneCount: 1,
    },
    readiness: {
      status: 'blocked',
      label: 'Blocked by missing draft coverage',
      issues: [],
    },
    packageSummary: {
      includedSections: ['Manuscript body', 'Compare summary'],
      excludedSections: ['Trace appendix'],
      estimatedPackageLabel: 'Approx. 6 manuscript pages',
    },
  }
}

function buildBranchWorkspace(): BookExperimentBranchWorkspaceViewModel {
  return buildBookExperimentBranchWorkspace({
    currentDraftWorkspace: buildWorkspace(),
    branch: mockBookExperimentBranchSeeds['book-signal-arc']![0]!,
    branches: mockBookExperimentBranchSeeds['book-signal-arc']!,
    checkpoint: null,
    branchBaseline: 'current',
    locale: 'en',
  })
}

function buildReviewInbox(): BookReviewInboxViewModel {
  const handoff = {
    id: 'compare-delta::book-compare',
    label: 'Open compare review',
    target: {
      scope: 'book' as const,
      lens: 'draft' as const,
      view: 'signals' as const,
      draftView: 'compare' as const,
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      selectedChapterId: 'chapter-open-water-signals',
      reviewIssueId: 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge',
    },
  }
  const issue: ReviewIssueViewModel = {
    id: 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge',
    severity: 'warning',
    source: 'compare',
    kind: 'compare_delta',
    title: 'Compare delta needs review',
    detail: 'Warehouse Bridge changed against the selected checkpoint.',
    recommendation: 'Open compare review and verify whether the changed passage should be carried forward.',
    chapterId: 'chapter-open-water-signals',
    chapterTitle: 'Open Water Signals',
    chapterOrder: 2,
    sceneId: 'scene-warehouse-bridge',
    sceneTitle: 'Warehouse Bridge',
    sceneOrder: 1,
    sourceLabel: 'Compare: PR11 Baseline',
    sourceExcerpt: 'Current excerpt',
    tags: ['Compare delta', 'changed'],
    issueSignature: 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge::signature',
    decision: {
      status: 'open',
      isStale: false,
    },
    fixAction: {
      status: 'not_started',
      isStale: false,
    },
    handoffs: [handoff],
    primaryFixHandoff: handoff,
  }

  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    selectedIssueId: issue.id,
    selectedIssue: issue,
    activeFilter: 'all',
    activeStatusFilter: 'open',
    issues: [issue],
    filteredIssues: [issue],
    groupedIssues: {
      blockers: [],
      warnings: [issue],
      info: [],
    },
    counts: {
      total: 1,
      blockers: 0,
      warnings: 1,
      info: 0,
      traceGaps: 0,
      missingDrafts: 0,
      compareDeltas: 1,
      exportReadiness: 0,
      branchReadiness: 0,
      sceneProposals: 0,
      open: 1,
      reviewed: 0,
      deferred: 0,
      dismissed: 0,
      stale: 0,
      fixStarted: 0,
      fixChecked: 0,
      fixBlocked: 0,
      fixStale: 0,
    },
    visibleOpenCount: 1,
    selectedChapterIssueCount: 1,
    annotationsByChapterId: {},
  }
}

describe('BookDraftStage', () => {
  it('renders BookDraftReader in read view', () => {
    render(
      <AppProviders>
        <BookDraftStage
          draftView="read"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={null}
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()
  })

  it('renders BookDraftCompareView in compare view', () => {
    render(
      <AppProviders>
        <BookDraftStage
          draftView="compare"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={null}
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Book manuscript compare' })).toBeInTheDocument()
    expect(screen.getByLabelText('Manuscript checkpoint')).toBeInTheDocument()
  })

  it('renders BookDraftExportView in export view', () => {
    render(
      <AppProviders>
        <BookDraftStage
          draftView="export"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={null}
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Manuscript checkpoint')).not.toBeInTheDocument()
  })

  it('renders BookDraftBranchView in branch view', () => {
    render(
      <AppProviders>
        <BookDraftStage
          draftView="branch"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branchError={null}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={null}
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Book experiment branch' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Branch' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Branch preview')).toBeInTheDocument()
  })

  it('renders BookDraftReviewView without source fix controls when fix handlers are not wired', () => {
    render(
      <AppProviders>
        <BookDraftStage
          draftView="review"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={buildReviewInbox()}
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Start source fix' })).not.toBeInTheDocument()
  })

  it('renders source fix controls in review view when explicit fix handlers are wired', async () => {
    const user = userEvent.setup()
    const onStartReviewFix = vi.fn()

    render(
      <AppProviders>
        <BookDraftStage
          draftView="review"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={buildReviewInbox()}
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onStartReviewFix={onStartReviewFix}
          onSetReviewFixStatus={vi.fn()}
          onClearReviewFix={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Primary fix target')).toBeInTheDocument()
    expect(screen.getByText('Open compare review · book')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start source fix' }))

    expect(onStartReviewFix).toHaveBeenCalledWith({
      issueId: 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge',
      issueSignature: 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge::signature',
      handoff: buildReviewInbox().selectedIssue!.primaryFixHandoff,
      note: undefined,
    })
  })

  it('passes the specific branch error through the branch stage path', () => {
    render(
      <AppProviders>
        <BookDraftStage
          draftView="branch"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={null}
          branchError={new Error('Book experiment branch \"branch-missing\" could not be found for \"book-signal-arc\".')}
          branches={branches}
          selectedBranchId="branch-missing"
          branchBaseline="checkpoint"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={null}
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Branch unavailable')).toBeInTheDocument()
    expect(screen.getByText('Book experiment branch \"branch-missing\" could not be found for \"book-signal-arc\".')).toBeInTheDocument()
  })

  it('switching view triggers the callback', async () => {
    const user = userEvent.setup()
    const onSelectDraftView = vi.fn()

    render(
      <AppProviders>
        <BookDraftStage
          draftView="read"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={null}
          onSelectDraftView={onSelectDraftView}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Compare' }))

    expect(onSelectDraftView).toHaveBeenCalledWith('compare')
  })

  it('switching to export triggers the export draft view callback', async () => {
    const user = userEvent.setup()
    const onSelectDraftView = vi.fn()

    render(
      <AppProviders>
        <BookDraftStage
          draftView="read"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={null}
          onSelectDraftView={onSelectDraftView}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Export' }))

    expect(onSelectDraftView).toHaveBeenCalledWith('export')
  })

  it('switching to branch triggers the branch draft view callback', async () => {
    const user = userEvent.setup()
    const onSelectDraftView = vi.fn()

    render(
      <AppProviders>
        <BookDraftStage
          draftView="read"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={null}
          onSelectDraftView={onSelectDraftView}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Branch' }))

    expect(onSelectDraftView).toHaveBeenCalledWith('branch')
  })

  it('shows the review tab and switching to review triggers the callback', async () => {
    const user = userEvent.setup()
    const onSelectDraftView = vi.fn()

    render(
      <AppProviders>
        <BookDraftStage
          draftView="read"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          branchWorkspace={buildBranchWorkspace()}
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          reviewInbox={buildReviewInbox()}
          onSelectDraftView={onSelectDraftView}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectReviewFilter={vi.fn()}
          onSelectReviewIssue={vi.fn()}
          onOpenReviewSource={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Review' }))

    expect(onSelectDraftView).toHaveBeenCalledWith('review')
  })
})
