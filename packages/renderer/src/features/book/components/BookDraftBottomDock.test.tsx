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

  it('shows branch blockers, warnings, regressions, and baseline activity in branch mode', () => {
    const activity: BookWorkbenchActivityItem[] = [
      {
        id: 'draft-view-0',
        kind: 'draft-view',
        title: 'Entered Branch Review',
        detail: 'Branch review keeps branch selection and baseline route-owned.',
        tone: 'accent',
      },
      {
        id: 'branch-1',
        kind: 'branch',
        title: 'Selected branch High Pressure',
        detail: 'Stress the witness line and hold the courier cost in public view.',
        tone: 'neutral',
      },
      {
        id: 'branch-baseline-2',
        kind: 'branch-baseline',
        title: 'Selected checkpoint baseline',
        detail: 'PR11 Baseline',
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
          activeDraftView="branch"
          branchProblems={{
            blockerCount: 1,
            warningCount: 2,
            draftMissingSceneCount: 1,
            traceRegressionCount: 1,
            warningIncreaseCount: 1,
            addedWithoutSourceCount: 2,
            blockers: [{ chapterId: 'chapter-open-water-signals:blocker-1', title: 'Open Water Signals', detail: 'Dawn Slip still has no branch draft.' }],
            warnings: [{ chapterId: 'chapter-open-water-signals:warning-1', title: 'Open Water Signals', detail: 'Warehouse Bridge carries one additional warning.' }],
            draftMissingScenes: [{ chapterId: 'chapter-open-water-signals:scene-dawn-slip', title: 'Open Water Signals', detail: 'Dawn Slip is still draft_missing in the branch.' }],
            traceRegressions: [{ chapterId: 'chapter-open-water-signals:scene-warehouse-bridge', title: 'Open Water Signals', detail: 'Warehouse Bridge lost trace readiness against the baseline.' }],
            warningIncreases: [{ chapterId: 'chapter-open-water-signals:warning-delta', title: 'Open Water Signals', detail: 'Warnings +1 against the checkpoint baseline.' }],
            addedWithoutSource: [{ chapterId: 'chapter-open-water-signals:scene-added', title: 'Open Water Signals', detail: 'Canal Watch was added without a source proposal.' }],
          }}
        />
      </AppProviders>,
    )

    expect(screen.getAllByText('Branch blockers').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Branch warnings').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Draft missing scenes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Trace regressions').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Warning increases').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Added without source').length).toBeGreaterThan(0)
    expect(screen.getByText('Entered Branch Review')).toBeInTheDocument()
    expect(screen.getByText('Selected branch High Pressure')).toBeInTheDocument()
    expect(screen.getByText('Selected checkpoint baseline')).toBeInTheDocument()
  })

  it('shows review-mode blockers, trace gaps, missing drafts, and review activity', () => {
    const activity: BookWorkbenchActivityItem[] = [
      {
        id: 'draft-view-0',
        kind: 'draft-view',
        title: 'Entered Review',
        detail: 'Review keeps filter and issue selection route-owned.',
        tone: 'accent',
      },
      {
        id: 'review-issue-1',
        kind: 'review-issue',
        title: 'Selected review issue Export packet is blocked',
        detail: 'Open Water Signals / Dawn Slip',
        tone: 'neutral',
      },
      {
        id: 'review-source-2',
        kind: 'review-source',
        title: 'Opened issue source Open export readiness',
        detail: 'Export packet is blocked',
        tone: 'neutral',
      },
      {
        id: 'review-decision-3',
        kind: 'review-decision',
        title: 'Deferred issue Export packet is blocked',
        detail: 'Carry this into the next review pass.',
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
          activeDraftView="review"
          reviewProblems={{
            blockerCount: 2,
            traceGapCount: 1,
            missingDraftCount: 2,
            exportBlockerCount: 1,
            branchBlockerCount: 1,
            openCount: 4,
            actionedCount: 3,
            staleCount: 1,
            blockers: [{ chapterId: 'review:blocker-1', title: 'Open Water Signals', detail: 'Export packet is blocked by one missing scene draft.' }],
            traceGaps: [{ chapterId: 'review:trace-gap-1', title: 'Open Water Signals', detail: 'Dawn Slip still lacks trace coverage.' }],
            missingDrafts: [{ chapterId: 'review:missing-draft-1', title: 'Signals in Rain', detail: 'Departure Bell still has no current draft prose.' }],
            exportBlockers: [{ chapterId: 'review:export-1', title: 'Signal Arc', detail: 'Review Packet is still blocked.' }],
            branchBlockers: [{ chapterId: 'review:branch-1', title: 'Open Water Signals', detail: 'High Pressure branch is still blocked against the checkpoint baseline.' }],
          }}
        />
      </AppProviders>,
    )

    expect(screen.getAllByText('Blockers').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Trace gaps').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Missing drafts').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Export blockers').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Branch blockers').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Open').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Actioned').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Decision stale').length).toBeGreaterThan(0)
    expect(screen.getByText('Entered Review')).toBeInTheDocument()
    expect(screen.getByText('Selected review issue Export packet is blocked')).toBeInTheDocument()
    expect(screen.getByText('Opened issue source Open export readiness')).toBeInTheDocument()
    expect(screen.getByText('Deferred issue Export packet is blocked')).toBeInTheDocument()
  })
})
