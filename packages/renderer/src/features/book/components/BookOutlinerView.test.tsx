import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { BookOutlinerView } from './BookOutlinerView'

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
  {
    chapterId: 'chapter-open-water-signals',
    order: 2,
    title: 'Open Water Signals',
    summary: 'Warehouse pressure should stay legible as the exit opens.',
    sceneCount: 3,
    unresolvedCount: 4,
    draftedSceneCount: 3,
    missingDraftCount: 0,
    assembledWordCount: 792,
    warningsCount: 4,
    queuedRevisionCount: 1,
    tracedSceneCount: 2,
    missingTraceSceneCount: 1,
    coverageStatus: 'attention' as const,
    primaryProblemLabel: 'Handoff bridge',
    primaryAssemblyHintLabel: 'Warehouse to canal carry-through',
  },
]

describe('BookOutlinerView', () => {
  it('renders dense chapter metrics rows with select and handoff actions', async () => {
    const user = userEvent.setup()
    const onSelectChapter = vi.fn()
    const onOpenChapter = vi.fn()

    render(
      <I18nProvider>
        <BookOutlinerView
          chapters={chapters}
          selectedChapterId="chapter-signals-in-rain"
          onSelectChapter={onSelectChapter}
          onOpenChapter={onOpenChapter}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: /Beat line 1 Signals in Rain/i })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('1091 words')).toBeInTheDocument()
    expect(screen.getByText('Departure bell timing')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Beat line 2 Open Water Signals/i }))
    expect(onSelectChapter).toHaveBeenCalledWith('chapter-open-water-signals')

    await user.click(screen.getByRole('button', { name: 'Open in Structure: Open Water Signals' }))
    expect(onOpenChapter).toHaveBeenNthCalledWith(1, 'chapter-open-water-signals', 'structure')
  })
})
