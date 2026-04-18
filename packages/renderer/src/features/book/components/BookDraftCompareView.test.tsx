import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import { BookDraftCompareView } from './BookDraftCompareView'

function buildCompareWorkspace(): BookManuscriptCompareWorkspaceViewModel {
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
        chapterId: 'chapter-signals-in-rain',
        order: 1,
        title: 'Signals in Rain',
        summary: 'Keep platform pressure audible.',
        totals: {
          sceneCount: 2,
          missingCount: 0,
          addedCount: 1,
          draftMissingCount: 0,
          changedCount: 1,
          unchangedCount: 0,
          wordDelta: 12,
          traceRegressionCount: 0,
          warningsDelta: 0,
        },
        wordDelta: 12,
        traceRegressionCount: 0,
        warningsDelta: 0,
        scenes: [],
      },
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Carry the courier handoff into open water.',
        totals: {
          sceneCount: 3,
          missingCount: 1,
          addedCount: 1,
          draftMissingCount: 0,
          changedCount: 1,
          unchangedCount: 0,
          wordDelta: 9,
          traceRegressionCount: 1,
          warningsDelta: 2,
        },
        wordDelta: 9,
        traceRegressionCount: 1,
        warningsDelta: 2,
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
              proseDraft: 'Current warehouse excerpt',
              draftWordCount: 18,
              warningsCount: 2,
              traceReady: false,
            },
            checkpointScene: {
              sceneId: 'scene-warehouse-bridge',
              order: 1,
              title: 'Warehouse Bridge',
              summary: 'Keep the handoff unstable.',
              proseDraft: 'Checkpoint warehouse excerpt',
              draftWordCount: 12,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 18,
            checkpointWordCount: 12,
            wordDelta: 6,
            traceReadyChanged: true,
            warningsDelta: 2,
            currentExcerpt: 'Current warehouse excerpt',
            checkpointExcerpt: 'Checkpoint warehouse excerpt',
          },
          {
            sceneId: 'scene-dawn-slip',
            order: 2,
            title: 'Dawn Slip',
            summary: 'New release beat.',
            delta: 'added',
            currentScene: {
              sceneId: 'scene-dawn-slip',
              order: 2,
              title: 'Dawn Slip',
              summary: 'New release beat.',
              proseDraft: 'Current dawn excerpt',
              draftWordCount: 11,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 11,
            wordDelta: 11,
            traceReadyChanged: false,
            warningsDelta: 0,
            currentExcerpt: 'Current dawn excerpt',
          },
          {
            sceneId: 'scene-river-ledger',
            order: 3,
            title: 'River Ledger',
            summary: 'Legacy checkpoint scene.',
            delta: 'missing',
            checkpointScene: {
              sceneId: 'scene-river-ledger',
              order: 3,
              title: 'River Ledger',
              summary: 'Legacy checkpoint scene.',
              proseDraft: 'Checkpoint river excerpt',
              draftWordCount: 8,
              warningsCount: 0,
              traceReady: true,
            },
            checkpointWordCount: 8,
            wordDelta: -8,
            traceReadyChanged: false,
            warningsDelta: 0,
            checkpointExcerpt: 'Checkpoint river excerpt',
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
        sceneCount: 3,
        missingCount: 1,
        addedCount: 1,
        draftMissingCount: 0,
        changedCount: 1,
        unchangedCount: 0,
        wordDelta: 9,
        traceRegressionCount: 1,
        warningsDelta: 2,
      },
      wordDelta: 9,
      traceRegressionCount: 1,
      warningsDelta: 2,
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
            proseDraft: 'Current warehouse excerpt',
            draftWordCount: 18,
            warningsCount: 2,
            traceReady: false,
          },
          checkpointScene: {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Keep the handoff unstable.',
            proseDraft: 'Checkpoint warehouse excerpt',
            draftWordCount: 12,
            warningsCount: 0,
            traceReady: true,
          },
          currentWordCount: 18,
          checkpointWordCount: 12,
          wordDelta: 6,
          traceReadyChanged: true,
          warningsDelta: 2,
          currentExcerpt: 'Current warehouse excerpt',
          checkpointExcerpt: 'Checkpoint warehouse excerpt',
        },
        {
          sceneId: 'scene-dawn-slip',
          order: 2,
          title: 'Dawn Slip',
          summary: 'New release beat.',
          delta: 'added',
          currentScene: {
            sceneId: 'scene-dawn-slip',
            order: 2,
            title: 'Dawn Slip',
            summary: 'New release beat.',
            proseDraft: 'Current dawn excerpt',
            draftWordCount: 11,
            warningsCount: 0,
            traceReady: true,
          },
          currentWordCount: 11,
          wordDelta: 11,
          traceReadyChanged: false,
          warningsDelta: 0,
          currentExcerpt: 'Current dawn excerpt',
        },
        {
          sceneId: 'scene-river-ledger',
          order: 3,
          title: 'River Ledger',
          summary: 'Legacy checkpoint scene.',
          delta: 'missing',
          checkpointScene: {
            sceneId: 'scene-river-ledger',
            order: 3,
            title: 'River Ledger',
            summary: 'Legacy checkpoint scene.',
            proseDraft: 'Checkpoint river excerpt',
            draftWordCount: 8,
            warningsCount: 0,
            traceReady: true,
          },
          checkpointWordCount: 8,
          wordDelta: -8,
          traceReadyChanged: false,
          warningsDelta: 0,
          checkpointExcerpt: 'Checkpoint river excerpt',
        },
      ],
    },
    totals: {
      chapterCount: 2,
      sceneCount: 5,
      missingCount: 1,
      addedCount: 2,
      draftMissingCount: 0,
      changedCount: 2,
      unchangedCount: 0,
      wordDelta: 21,
      traceRegressionCount: 1,
      warningsDelta: 2,
    },
  }
}

describe('BookDraftCompareView', () => {
  it('renders changed, added, missing counts and scene excerpts for the selected chapter', () => {
    render(
      <AppProviders>
        <BookDraftCompareView compare={buildCompareWorkspace()} onSelectChapter={vi.fn()} onOpenChapter={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getAllByText('Changed 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Added 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Missing 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Word delta +9').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Trace regressions 1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Warnings +2').length).toBeGreaterThan(0)
    expect(screen.getByText('Current warehouse excerpt')).toBeInTheDocument()
    expect(screen.getByText('Checkpoint warehouse excerpt')).toBeInTheDocument()
    expect(screen.getByText('Checkpoint river excerpt')).toBeInTheDocument()
  })

  it('highlights the selected chapter and clicking another chapter triggers selection', async () => {
    const user = userEvent.setup()
    const onSelectChapter = vi.fn()

    render(
      <AppProviders>
        <BookDraftCompareView compare={buildCompareWorkspace()} onSelectChapter={onSelectChapter} onOpenChapter={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Chapter 2 Open Water Signals' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Chapter 1 Signals in Rain' }))

    expect(onSelectChapter).toHaveBeenCalledWith('chapter-signals-in-rain')
  })

  it('fires Open in Draft and Open in Structure actions', async () => {
    const user = userEvent.setup()
    const onOpenChapter = vi.fn()

    render(
      <AppProviders>
        <BookDraftCompareView compare={buildCompareWorkspace()} onSelectChapter={vi.fn()} onOpenChapter={onOpenChapter} />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Open in Draft: Open Water Signals' }))
    await user.click(screen.getByRole('button', { name: 'Open in Structure: Open Water Signals' }))

    expect(onOpenChapter).toHaveBeenNthCalledWith(1, 'chapter-open-water-signals', 'draft')
    expect(onOpenChapter).toHaveBeenNthCalledWith(2, 'chapter-open-water-signals', 'structure')
  })
})
