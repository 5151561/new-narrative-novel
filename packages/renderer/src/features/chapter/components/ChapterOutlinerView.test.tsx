import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterOutlinerView } from './ChapterOutlinerView'

describe('ChapterOutlinerView', () => {
  it('renders dense structural fields for each scene row', () => {
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} />
      </I18nProvider>,
    )

    const firstRow = screen.getByRole('button', { name: /Beat line 1 Midnight Platform/i })

    expect(firstRow).toBeInTheDocument()
    expect(screen.getByText('Push the bargain into a public stalemate.')).toBeInTheDocument()
    expect(within(firstRow).getByText('Ren Voss')).toBeInTheDocument()
    expect(within(firstRow).getByText('Eastbound platform')).toBeInTheDocument()
    expect(within(firstRow).getByText('Ren needs leverage, Mei needs a higher price.')).toBeInTheDocument()
    expect(within(firstRow).getByText('The courier signal stays readable only to Ren.')).toBeInTheDocument()
    expect(within(firstRow).getByText('Unresolved 3')).toBeInTheDocument()
  })

  it('marks the selected row from workspace.selectedSceneId', () => {
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: /Beat line 2 Concourse Delay/i })).toHaveAttribute('aria-current', 'true')
  })

  it('calls onSelectScene when another row is clicked', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterOutlinerView workspace={workspace} onSelectScene={onSelectScene} />
      </I18nProvider>,
    )

    await user.click(screen.getByRole('button', { name: /Beat line 3 Ticket Window/i }))

    expect(onSelectScene).toHaveBeenCalledWith('scene-ticket-window')
  })
})
