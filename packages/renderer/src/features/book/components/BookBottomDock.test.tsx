import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { BookBottomDock } from './BookBottomDock'

describe('BookBottomDock', () => {
  it('renders problems and session-local activity for the book workspace', () => {
    render(
      <I18nProvider>
        <BookBottomDock
          summary={{
            selectedChapter: {
              chapterId: 'chapter-signals-in-rain',
              order: 1,
              title: 'Signals in Rain',
              summary: 'Platform pressure needs to hold until the departure bell.',
              sceneCount: 4,
              unresolvedCount: 8,
              draftedSceneCount: 3,
              missingDraftCount: 1,
              assembledWordCount: 1091,
              warningsCount: 6,
              queuedRevisionCount: 1,
              tracedSceneCount: 3,
              missingTraceSceneCount: 1,
              coverageStatus: 'attention',
              primaryProblemLabel: 'Departure bell timing',
              primaryAssemblyHintLabel: 'Carry platform pressure',
            },
            unresolvedCount: 12,
            missingDraftCount: 1,
            missingTraceSceneCount: 2,
            warningsCount: 10,
            problemItems: [
              {
                chapterId: 'chapter-signals-in-rain',
                kind: 'problem',
                label: 'Departure bell timing',
                detail: 'The bell still lands before the last negotiation beat resolves.',
              },
              {
                chapterId: 'chapter-open-water-signals',
                kind: 'missing_trace',
                label: '1 scene still missing trace',
                detail: 'Dawn Slip has no trace rollup yet.',
              },
            ],
          }}
          activity={[
            {
              id: 'view-0',
              kind: 'view',
              title: 'Entered Sequence',
              detail: 'The dock records book-stage switches without owning route state.',
              tone: 'accent',
            },
            {
              id: 'chapter-1',
              kind: 'chapter',
              title: 'Focused Signals in Rain',
              detail: 'Platform pressure needs to hold until the departure bell.',
              tone: 'neutral',
            },
          ]}
        />
      </I18nProvider>,
    )

    const problemsSection = screen.getByRole('heading', { name: 'Problems' }).closest('section')
    const activitySection = screen.getByRole('heading', { name: 'Activity' }).closest('section')

    expect(problemsSection).not.toBeNull()
    expect(activitySection).not.toBeNull()
    expect(within(problemsSection!).getByText('Departure bell timing')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('1 scene still missing trace')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Signals in Rain')).toBeInTheDocument()
    expect(within(activitySection!).getByText('Entered Sequence')).toBeInTheDocument()
    expect(within(activitySection!).getByText('Focused Signals in Rain')).toBeInTheDocument()
  })
})
