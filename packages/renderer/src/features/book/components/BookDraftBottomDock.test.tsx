import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { BookWorkbenchActivityItem } from '@/features/book/hooks/useBookWorkbenchActivity'

import { BookDraftBottomDock } from './BookDraftBottomDock'

describe('BookDraftBottomDock', () => {
  it('shows compare-mode problems and activity', () => {
    const activity: BookWorkbenchActivityItem[] = [
      {
        id: 'draft-view-0',
        kind: 'draft-view',
        title: 'Entered Compare',
        detail: 'Book draft compare stays route-owned.',
        tone: 'accent',
      },
      {
        id: 'checkpoint-1',
        kind: 'checkpoint',
        title: 'Selected checkpoint PR11 Baseline',
        detail: 'Baseline manuscript snapshot.',
        tone: 'neutral',
      },
      {
        id: 'draft-view-2',
        kind: 'draft-view',
        title: 'Returned to Read',
        detail: 'Read mode restores the manuscript reader.',
        tone: 'neutral',
      },
    ]

    render(
      <AppProviders>
        <BookDraftBottomDock
          summary={{
            missingDraftChapterCount: 0,
            missingTraceChapterCount: 0,
            warningsChapterCount: 0,
            queuedRevisionChapterCount: 0,
            highestPressureChapters: [],
            missingDraftChapters: [],
            missingTraceChapters: [],
            warningsChapters: [],
            queuedRevisionChapters: [],
          }}
          activity={activity}
          activeDraftView="compare"
          compareProblems={{
            changedChapterCount: 2,
            draftMissingSceneCount: 3,
            traceRegressionCount: 1,
            warningsIncreasedChapterCount: 1,
            checkpointMissingSectionCount: 2,
            changedChapters: [{ chapterId: 'chapter-open-water-signals', title: 'Open Water Signals', detail: 'Changed 2 / Added 1 / Missing 1' }],
            missingDraftScenes: [{ chapterId: 'chapter-open-water-signals', title: 'Open Water Signals', detail: 'Dawn Slip still has no current draft.' }],
            traceRegressions: [{ chapterId: 'chapter-open-water-signals', title: 'Open Water Signals', detail: 'Warehouse Bridge lost trace readiness.' }],
            warningsIncreasedChapters: [{ chapterId: 'chapter-open-water-signals', title: 'Open Water Signals', detail: 'Warnings +2' }],
            checkpointMissingSections: [{ chapterId: 'chapter-signals-in-rain', title: 'Signals in Rain', detail: 'Departure Bell only exists in the checkpoint.' }],
          }}
        />
      </AppProviders>,
    )

    expect(screen.getAllByText('Changed chapters').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Draft missing scenes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Trace regressions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Warnings increased chapters').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Checkpoint missing sections').length).toBeGreaterThan(0)
    expect(screen.getByText('Entered Compare')).toBeInTheDocument()
    expect(screen.getByText('Selected checkpoint PR11 Baseline')).toBeInTheDocument()
    expect(screen.getByText('Returned to Read')).toBeInTheDocument()
  })
})
