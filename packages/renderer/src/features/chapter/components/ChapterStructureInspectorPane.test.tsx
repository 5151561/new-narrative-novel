import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterStructureInspectorPane } from './ChapterStructureInspectorPane'

describe('ChapterStructureInspectorPane', () => {
  it('renders selected scene brief, unresolved summary, and chapter notes in Summary', () => {
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterStructureInspectorPane
          chapterTitle={workspace.title}
          chapterSummary={workspace.summary}
          unresolvedCount={workspace.unresolvedCount}
          inspector={workspace.inspector}
        />
      </I18nProvider>,
    )

    const summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')

    expect(summarySection).not.toBeNull()
    expect(screen.getByText(workspace.summary)).toBeInTheDocument()
    expect(screen.queryByText(workspace.chapterId)).not.toBeInTheDocument()
    expect(within(summarySection!).getByText('Keep public witness pressure alive at the edge of the scene.')).toBeInTheDocument()
    expect(within(summarySection!).getByText('Midnight Platform · Unresolved 3')).toBeInTheDocument()
    expect(within(summarySection!).getByText('Ordering remains structural.')).toBeInTheDocument()
  })

  it('renders problems summary and assembly hints in Problems', () => {
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')

    render(
      <I18nProvider>
        <ChapterStructureInspectorPane
          chapterTitle={workspace.title}
          chapterSummary={workspace.summary}
          unresolvedCount={workspace.unresolvedCount}
          inspector={workspace.inspector}
        />
      </I18nProvider>,
    )

    const problemsSection = screen.getByRole('heading', { name: 'Problems' }).closest('section')

    expect(problemsSection).not.toBeNull()
    expect(within(problemsSection!).getByText('Bell timing')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('The exit bell still lands too early.')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Carry platform pressure')).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Carry platform pressure into the concourse.')).toBeInTheDocument()
  })

  it('updates the summary heading and brief when the selected scene changes', () => {
    const firstWorkspace = buildChapterStoryWorkspace('scene-midnight-platform')
    const secondWorkspace = buildChapterStoryWorkspace('scene-ticket-window')

    const { rerender } = render(
      <I18nProvider>
        <ChapterStructureInspectorPane
          chapterTitle={firstWorkspace.title}
          chapterSummary={firstWorkspace.summary}
          unresolvedCount={firstWorkspace.unresolvedCount}
          inspector={firstWorkspace.inspector}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Midnight Platform' })).toBeInTheDocument()
    expect(screen.getByText('Keep public witness pressure alive at the edge of the scene.')).toBeInTheDocument()

    rerender(
      <I18nProvider>
        <ChapterStructureInspectorPane
          chapterTitle={secondWorkspace.title}
          chapterSummary={secondWorkspace.summary}
          unresolvedCount={secondWorkspace.unresolvedCount}
          inspector={secondWorkspace.inspector}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Ticket Window' })).toBeInTheDocument()
    expect(screen.getByText('Keep the alias offstage while the trade-off tightens.')).toBeInTheDocument()
    expect(screen.queryByText('Keep public witness pressure alive at the edge of the scene.')).not.toBeInTheDocument()
  })
})
