import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { BookSignalsView } from './BookSignalsView'

const chapters = [
  {
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
  },
]

describe('BookSignalsView', () => {
  it('renders grouped pressure, readiness, and trace signals with chapter handoff actions', async () => {
    const user = userEvent.setup()
    const onSelectChapter = vi.fn()
    const onOpenChapter = vi.fn()

    render(
      <I18nProvider>
        <BookSignalsView
          chapters={chapters}
          selectedChapterId="chapter-signals-in-rain"
          onSelectChapter={onSelectChapter}
          onOpenChapter={onOpenChapter}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Pressure')).toBeInTheDocument()
    expect(screen.getByText('Readiness')).toBeInTheDocument()
    expect(screen.getByText('Trace')).toBeInTheDocument()
    expect(screen.getByText('Departure bell timing')).toBeInTheDocument()
    expect(screen.getByText('Missing trace 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Signals in Rain' }))
    expect(onSelectChapter).toHaveBeenCalledWith('chapter-signals-in-rain')

    await user.click(screen.getByRole('button', { name: 'Open in Draft: Signals in Rain' }))
    expect(onOpenChapter).toHaveBeenCalledWith('chapter-signals-in-rain', 'draft')
  })
})
