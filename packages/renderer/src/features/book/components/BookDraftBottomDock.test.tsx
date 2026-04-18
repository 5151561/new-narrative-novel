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

  it('shows export-mode blockers, warnings, and export activity', () => {
    const activity: BookWorkbenchActivityItem[] = [
      {
        id: 'draft-view-0',
        kind: 'draft-view',
        title: 'Entered Export Preview',
        detail: 'Export preview keeps chapter focus and profile selection route-owned.',
        tone: 'accent',
      },
      {
        id: 'export-profile-1',
        kind: 'export-profile',
        title: 'Selected export profile Submission Preview',
        detail: 'Submission-oriented package without internal appendices.',
        tone: 'neutral',
      },
      {
        id: 'draft-view-2',
        kind: 'draft-view',
        title: 'Returned to Read',
        detail: 'Read mode restores the manuscript reader without taking over the dormant structure view.',
        tone: 'neutral',
      },
    ]

    render(
      <AppProviders>
        <BookDraftBottomDock
          summary={{
            missingDraftChapterCount: 1,
            missingTraceChapterCount: 1,
            warningsChapterCount: 2,
            queuedRevisionChapterCount: 1,
            highestPressureChapters: [],
            missingDraftChapters: [],
            missingTraceChapters: [],
            warningsChapters: [],
            queuedRevisionChapters: [],
          }}
          activity={activity}
          activeDraftView="export"
          exportProblems={{
            blockerCount: 2,
            warningCount: 3,
            traceGapCount: 1,
            missingDraftCount: 1,
            compareRegressionCount: 2,
            blockers: [{ chapterId: 'chapter-signals-in-rain', title: 'Signals in Rain', detail: 'Departure Bell still needs current draft prose.' }],
            warnings: [{ chapterId: 'chapter-open-water-signals', title: 'Open Water Signals', detail: 'Warehouse Bridge still carries warning delta +1.' }],
            traceGaps: [{ chapterId: 'chapter-open-water-signals', title: 'Open Water Signals', detail: 'Dawn Slip still lacks trace coverage.' }],
            missingDrafts: [{ chapterId: 'chapter-signals-in-rain', title: 'Signals in Rain', detail: 'Departure Bell is still missing current draft prose.' }],
            compareRegressions: [{ chapterId: 'chapter-open-water-signals', title: 'Open Water Signals', detail: 'Compare still reports one changed scene and one trace regression.' }],
          }}
        />
      </AppProviders>,
    )

    expect(screen.getAllByText('Blockers').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Warnings').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Trace gaps').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Missing drafts').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Compare regressions').length).toBeGreaterThan(0)
    expect(screen.getByText('Entered Export Preview')).toBeInTheDocument()
    expect(screen.getByText('Selected export profile Submission Preview')).toBeInTheDocument()
  })

  it('shows an export-baseline error state instead of generic manuscript support when export mode is broken', () => {
    render(
      <AppProviders>
        <BookDraftBottomDock
          summary={{
            missingDraftChapterCount: 1,
            missingTraceChapterCount: 1,
            warningsChapterCount: 2,
            queuedRevisionChapterCount: 1,
            highestPressureChapters: [],
            missingDraftChapters: [],
            missingTraceChapters: [],
            warningsChapters: [],
            queuedRevisionChapters: [],
          }}
          activity={[]}
          activeDraftView="export"
          exportProblems={null}
          exportError={new Error('Book manuscript checkpoint "checkpoint-missing" could not be found for "book-signal-arc".')}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Export baseline unavailable')).toBeInTheDocument()
    expect(screen.getByText('Book manuscript checkpoint "checkpoint-missing" could not be found for "book-signal-arc".')).toBeInTheDocument()
    expect(screen.queryByText('Missing draft chapters')).not.toBeInTheDocument()
  })
})
