import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import { BookDraftReader } from './BookDraftReader'

const workspace: BookDraftWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  title: 'Signal Arc',
  summary: 'Read the manuscript in book order without losing chapter boundaries.',
  selectedChapterId: 'chapter-open-water-signals',
  assembledWordCount: 44,
  draftedChapterCount: 1,
  missingDraftChapterCount: 1,
  chapters: [
    {
      chapterId: 'chapter-signals-in-rain',
      order: 1,
      title: 'Signals in Rain',
      summary: 'Keep platform pressure audible through the departure bell.',
      sceneCount: 2,
      draftedSceneCount: 1,
      missingDraftCount: 1,
      assembledWordCount: 21,
      warningsCount: 2,
      queuedRevisionCount: 1,
      tracedSceneCount: 1,
      missingTraceSceneCount: 1,
      coverageStatus: 'attention',
      assembledProseSections: ['Rain held the platform in place while Ren refused to blink first.'],
      sections: [
        {
          sceneId: 'scene-midnight-platform',
          order: 1,
          title: 'Midnight Platform',
          summary: 'Keep the bargain public and constrained.',
          proseDraft: 'Rain held the platform in place while Ren refused to blink first.',
          draftWordCount: 11,
          isMissingDraft: false,
          warningsCount: 0,
          revisionQueueCount: 0,
          traceReady: true,
          relatedAssetCount: 2,
          sourceProposalCount: 2,
          latestDiffSummary: 'No prose revision requested yet.',
        },
        {
          sceneId: 'scene-concourse-delay',
          order: 2,
          title: 'Concourse Delay',
          summary: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
          isMissingDraft: true,
          warningsCount: 2,
          revisionQueueCount: 1,
          traceReady: false,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          latestDiffSummary: 'First prose pass still missing.',
        },
      ],
    },
    {
      chapterId: 'chapter-open-water-signals',
      order: 2,
      title: 'Open Water Signals',
      summary: 'Carry the courier handoff from warehouse pressure into open water.',
      sceneCount: 2,
      draftedSceneCount: 2,
      missingDraftCount: 0,
      assembledWordCount: 23,
      warningsCount: 1,
      queuedRevisionCount: 2,
      tracedSceneCount: 2,
      missingTraceSceneCount: 0,
      coverageStatus: 'ready',
      assembledProseSections: [
        'Warehouse pressure should stay visible while the courier handoff slips toward open water.',
        'The canal release keeps the ledger exposed without settling the bargain.',
      ],
      sections: [
        {
          sceneId: 'scene-warehouse-bridge',
          order: 1,
          title: 'Warehouse Bridge',
          summary: 'Keep the handoff unstable as the courier approaches the canal.',
          proseDraft: 'Warehouse pressure should stay visible while the courier handoff slips toward open water.',
          draftWordCount: 12,
          isMissingDraft: false,
          warningsCount: 0,
          revisionQueueCount: 1,
          traceReady: true,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
          latestDiffSummary: 'Carry the courier leverage through the canal release.',
        },
        {
          sceneId: 'scene-open-water-ledger',
          order: 2,
          title: 'Open Water Ledger',
          summary: 'Keep the ledger visible during the release.',
          proseDraft: 'The canal release keeps the ledger exposed without settling the bargain.',
          draftWordCount: 11,
          isMissingDraft: false,
          warningsCount: 1,
          revisionQueueCount: 1,
          traceReady: true,
          relatedAssetCount: 2,
          sourceProposalCount: 1,
          latestDiffSummary: 'Keep the ledger visible during the release.',
        },
      ],
    },
  ],
  selectedChapter: {
    chapterId: 'chapter-open-water-signals',
    order: 2,
    title: 'Open Water Signals',
    summary: 'Carry the courier handoff from warehouse pressure into open water.',
    sceneCount: 2,
    draftedSceneCount: 2,
    missingDraftCount: 0,
    assembledWordCount: 23,
    warningsCount: 1,
    queuedRevisionCount: 2,
    tracedSceneCount: 2,
    missingTraceSceneCount: 0,
    coverageStatus: 'ready',
    assembledProseSections: [
      'Warehouse pressure should stay visible while the courier handoff slips toward open water.',
      'The canal release keeps the ledger exposed without settling the bargain.',
    ],
    sections: [
      {
        sceneId: 'scene-warehouse-bridge',
        order: 1,
        title: 'Warehouse Bridge',
        summary: 'Keep the handoff unstable as the courier approaches the canal.',
        proseDraft: 'Warehouse pressure should stay visible while the courier handoff slips toward open water.',
        draftWordCount: 12,
        isMissingDraft: false,
        warningsCount: 0,
        revisionQueueCount: 1,
        traceReady: true,
        relatedAssetCount: 1,
        sourceProposalCount: 1,
        latestDiffSummary: 'Carry the courier leverage through the canal release.',
      },
      {
        sceneId: 'scene-open-water-ledger',
        order: 2,
        title: 'Open Water Ledger',
        summary: 'Keep the ledger visible during the release.',
        proseDraft: 'The canal release keeps the ledger exposed without settling the bargain.',
        draftWordCount: 11,
        isMissingDraft: false,
        warningsCount: 1,
        revisionQueueCount: 1,
        traceReady: true,
        relatedAssetCount: 2,
        sourceProposalCount: 1,
        latestDiffSummary: 'Keep the ledger visible during the release.',
      },
    ],
  },
  inspector: {
    selectedChapter: {
      chapterId: 'chapter-open-water-signals',
      title: 'Open Water Signals',
      summary: 'Carry the courier handoff from warehouse pressure into open water.',
      draftedSceneCount: 2,
      missingDraftCount: 0,
      tracedSceneCount: 2,
      missingTraceSceneCount: 0,
      warningsCount: 1,
      queuedRevisionCount: 2,
      assembledWordCount: 23,
      topMissingSceneTitles: [],
      topLatestDiffSummary: 'Carry the courier leverage through the canal release.',
      traceCoverageNote: 'Trace coverage is ready for the selected chapter.',
    },
    readiness: {
      draftedChapterCount: 1,
      missingDraftChapterCount: 1,
      assembledWordCount: 44,
      warningHeavyChapterCount: 2,
      missingTraceChapterCount: 1,
    },
    signals: {
      topMissingScenes: ['Concourse Delay'],
      latestDiffSummaries: ['Carry the courier leverage through the canal release.'],
      traceCoverageNote: 'Trace coverage is ready for the selected chapter.',
    },
  },
  dockSummary: {
    missingDraftChapterCount: 1,
    missingTraceChapterCount: 1,
    warningsChapterCount: 2,
    queuedRevisionChapterCount: 2,
    highestPressureChapters: [],
    missingDraftChapters: [],
    missingTraceChapters: [],
    warningsChapters: [],
    queuedRevisionChapters: [],
  },
}

describe('BookDraftReader', () => {
  it('renders ordered chapter manuscript blocks, shows a quiet missing-draft state, and triggers chapter actions', async () => {
    const user = userEvent.setup()
    const onSelectChapter = vi.fn()
    const onOpenChapter = vi.fn()
    const partialWorkspace: BookDraftWorkspaceViewModel = {
      ...workspace,
      selectedChapterId: 'chapter-signals-in-rain',
      selectedChapter: workspace.chapters[0]!,
    }

    const { rerender } = render(
      <AppProviders>
        <BookDraftReader workspace={workspace} onSelectChapter={onSelectChapter} onOpenChapter={onOpenChapter} />
      </AppProviders>,
    )

    const firstChapter = screen.getByRole('button', { name: /Chapter 1 Signals in Rain/i })
    const secondChapter = screen.getByRole('button', { name: /Chapter 2 Open Water Signals/i })
    const initialDestination = screen.getByRole('region', { name: 'Selected manuscript destination' })

    expect(firstChapter.compareDocumentPosition(secondChapter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(secondChapter).toHaveAttribute('aria-current', 'true')
    expect(initialDestination).toBeInTheDocument()
    expect(initialDestination.querySelectorAll('p.whitespace-pre-wrap').length).toBeGreaterThan(0)
    expect(screen.getByText('Manuscript gap')).toBeInTheDocument()

    await user.click(firstChapter)
    expect(onSelectChapter).toHaveBeenCalledWith('chapter-signals-in-rain')
    rerender(
      <AppProviders>
        <BookDraftReader workspace={partialWorkspace} onSelectChapter={onSelectChapter} onOpenChapter={onOpenChapter} />
      </AppProviders>,
    )
    const partialDestination = screen.getByRole('region', { name: 'Selected manuscript destination' })
    expect(partialDestination).toBeInTheDocument()
    expect(within(partialDestination).getByText('Concourse Delay')).toBeInTheDocument()
    expect(partialDestination.querySelectorAll('p.whitespace-pre-wrap').length).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Open in Draft: Open Water Signals' }))
    await user.click(screen.getByRole('button', { name: 'Open in Structure: Open Water Signals' }))

    expect(onOpenChapter).toHaveBeenNthCalledWith(1, 'chapter-open-water-signals', 'draft')
    expect(onOpenChapter).toHaveBeenNthCalledWith(2, 'chapter-open-water-signals', 'structure')
  })
})
