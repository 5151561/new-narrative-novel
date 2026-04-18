import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { BookStructureWorkspaceViewModel } from '../types/book-view-models'

import { BookStructureStage } from './BookStructureStage'

const workspace: BookStructureWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  title: 'Signal Arc',
  summary: 'Roll up chapter pressure into one route-first book workspace.',
  selectedChapterId: 'chapter-signals-in-rain',
  chapters: [
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
      coverageStatus: 'attention',
      primaryProblemLabel: 'Departure bell timing',
      primaryAssemblyHintLabel: 'Carry platform pressure',
    },
  ],
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
  totals: {
    chapterCount: 1,
    sceneCount: 4,
    unresolvedCount: 8,
    draftedSceneCount: 3,
    missingDraftCount: 1,
    tracedSceneCount: 3,
    missingTraceSceneCount: 1,
    assembledWordCount: 1091,
    warningsCount: 6,
    queuedRevisionCount: 1,
  },
  inspector: {
    selectedChapter: null,
    overview: {
      chapterCount: 1,
      sceneCount: 4,
      unresolvedCount: 8,
      draftedSceneCount: 3,
      missingDraftCount: 1,
      tracedSceneCount: 3,
      missingTraceSceneCount: 1,
      assembledWordCount: 1091,
      warningsCount: 6,
      queuedRevisionCount: 1,
    },
    riskHighlights: [
      {
        chapterId: 'chapter-signals-in-rain',
        kind: 'problem',
        label: 'Departure bell timing',
        detail: 'The bell still lands before the last negotiation beat resolves.',
      },
    ],
  },
  dockSummary: {
    selectedChapter: null,
    unresolvedCount: 8,
    missingDraftCount: 1,
    missingTraceSceneCount: 1,
    warningsCount: 6,
    problemItems: [
      {
        chapterId: 'chapter-signals-in-rain',
        kind: 'problem',
        label: 'Departure bell timing',
        detail: 'The bell still lands before the last negotiation beat resolves.',
      },
    ],
  },
  viewsMeta: {
    availableViews: ['sequence', 'outliner', 'signals'],
  },
}

describe('BookStructureStage', () => {
  it('renders only the available book views when metadata narrows the switcher', () => {
    render(
      <I18nProvider>
        <BookStructureStage
          activeView="sequence"
          availableViews={['sequence', 'signals']}
          workspace={workspace}
          onViewChange={() => {}}
          onSelectChapter={() => {}}
          onOpenChapter={() => {}}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: 'Sequence' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Signals' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Outliner' })).not.toBeInTheDocument()
  })

  it('keeps switchboard responsibility only and does not normalize an unsupported active view', () => {
    render(
      <I18nProvider>
        <BookStructureStage
          activeView="outliner"
          availableViews={['sequence', 'signals']}
          workspace={workspace}
          onViewChange={() => {}}
          onSelectChapter={() => {}}
          onOpenChapter={() => {}}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: 'Sequence' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Signals' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: 'Signals in Rain' })).not.toBeInTheDocument()
    expect(screen.queryByText('Pressure')).not.toBeInTheDocument()
  })
})
