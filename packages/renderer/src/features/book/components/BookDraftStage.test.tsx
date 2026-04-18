import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

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

describe('BookDraftStage', () => {
  it('renders BookDraftReader in read view', () => {
    render(
      <AppProviders>
        <BookDraftStage
          draftView="read"
          workspace={buildWorkspace()}
          compare={buildCompare()}
          exportPreview={buildExportWorkspace()}
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectExportProfile={vi.fn()}
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
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectExportProfile={vi.fn()}
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
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          onSelectDraftView={vi.fn()}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectExportProfile={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Manuscript checkpoint')).not.toBeInTheDocument()
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
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          onSelectDraftView={onSelectDraftView}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectExportProfile={vi.fn()}
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
          exportProfiles={exportProfiles}
          selectedExportProfileId="export-review-packet"
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          onSelectDraftView={onSelectDraftView}
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectCheckpoint={vi.fn()}
          onSelectExportProfile={vi.fn()}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Export' }))

    expect(onSelectDraftView).toHaveBeenCalledWith('export')
  })
})
