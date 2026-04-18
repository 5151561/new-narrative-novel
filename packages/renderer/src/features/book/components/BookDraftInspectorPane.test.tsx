import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftInspectorViewModel } from '../types/book-draft-view-models'
import { BookDraftInspectorPane } from './BookDraftInspectorPane'

const inspector: BookDraftInspectorViewModel = {
  selectedChapter: {
    chapterId: 'chapter-open-water-signals',
    title: 'Open Water Signals',
    summary: 'Carry the courier handoff into open water.',
    draftedSceneCount: 2,
    missingDraftCount: 1,
    tracedSceneCount: 1,
    missingTraceSceneCount: 1,
    warningsCount: 2,
    queuedRevisionCount: 1,
    assembledWordCount: 320,
    topMissingSceneTitles: ['Dawn Slip'],
    topLatestDiffSummary: 'Carry the courier leverage through the canal release.',
    traceCoverageNote: 'Trace coverage still has one visible gap.',
  },
  readiness: {
    draftedChapterCount: 2,
    missingDraftChapterCount: 1,
    assembledWordCount: 680,
    warningHeavyChapterCount: 1,
    missingTraceChapterCount: 1,
  },
  signals: {
    topMissingScenes: ['Dawn Slip'],
    latestDiffSummaries: ['Carry the courier leverage through the canal release.'],
    traceCoverageNote: 'Trace coverage still has one visible gap.',
  },
}

const compare: BookManuscriptCompareWorkspaceViewModel = {
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
  chapters: [],
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
    chapterCount: 1,
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
}

describe('BookDraftInspectorPane', () => {
  it('keeps read-mode content intact when compare mode is inactive', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane bookTitle="Signal Arc" inspector={inspector} activeDraftView="read" />
      </AppProviders>,
    )

    expect(screen.getByText('Manuscript Readiness')).toBeInTheDocument()
    expect(screen.queryByText('Checkpoint')).not.toBeInTheDocument()
  })

  it('shows compare summary, checkpoint, and review attention in compare mode', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="compare"
          compare={compare}
          checkpointMeta={{
            title: 'PR11 Baseline',
            createdAtLabel: '2026-04-17 22:10',
            summary: 'Baseline manuscript snapshot.',
          }}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Selected chapter compare summary')).toBeInTheDocument()
    expect(screen.getByText('Checkpoint')).toBeInTheDocument()
    expect(screen.getByText('Review attention')).toBeInTheDocument()
    expect(screen.getByText('Changed scenes')).toBeInTheDocument()
    expect(screen.getAllByText('Dawn Slip').length).toBeGreaterThan(0)
    expect(screen.getAllByText('River Ledger').length).toBeGreaterThan(0)
    expect(screen.getByText('PR11 Baseline')).toBeInTheDocument()
  })
})
