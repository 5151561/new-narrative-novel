import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { BookInspectorPane } from './BookInspectorPane'

const selectedChapter = {
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
  coverageStatus: 'attention' as const,
  primaryProblemLabel: 'Departure bell timing',
  primaryAssemblyHintLabel: 'Carry platform pressure',
}

describe('BookInspectorPane', () => {
  it('shows selected chapter, book overview, and readiness signals', () => {
    render(
      <I18nProvider>
        <BookInspectorPane
          bookTitle="Signal Arc"
          inspector={{
            selectedChapter,
            overview: {
              chapterCount: 2,
              sceneCount: 7,
              unresolvedCount: 12,
              draftedSceneCount: 6,
              missingDraftCount: 1,
              tracedSceneCount: 5,
              missingTraceSceneCount: 2,
              assembledWordCount: 1883,
              warningsCount: 10,
              queuedRevisionCount: 2,
            },
            riskHighlights: [
              {
                chapterId: 'chapter-signals-in-rain',
                kind: 'problem',
                label: 'Departure bell timing',
                detail: 'The bell still lands before the last negotiation beat resolves.',
              },
            ],
          }}
        />
      </I18nProvider>,
    )

    const selectedSection = screen.getByRole('heading', { name: 'Selected Chapter' }).closest('section')
    const overviewSection = screen.getByRole('heading', { name: 'Book Overview' }).closest('section')
    const readinessSection = screen.getByRole('heading', { name: 'Readiness Signals' }).closest('section')

    expect(selectedSection).not.toBeNull()
    expect(overviewSection).not.toBeNull()
    expect(readinessSection).not.toBeNull()
    expect(within(selectedSection!).getByText('Signals in Rain')).toBeInTheDocument()
    expect(within(selectedSection!).getByText('Carry platform pressure')).toBeInTheDocument()
    expect(within(overviewSection!).getByText('1883')).toBeInTheDocument()
    expect(within(readinessSection!).getByText('Departure bell timing')).toBeInTheDocument()
  })
})
