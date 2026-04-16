import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterAssemblyView } from './ChapterAssemblyView'

describe('ChapterAssemblyView', () => {
  it('uses the selected scene as the current seam focus', () => {
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')

    render(
      <I18nProvider>
        <ChapterAssemblyView workspace={workspace} />
      </I18nProvider>,
    )

    const currentSeamSection = screen.getByRole('heading', { name: 'Current seam' }).closest('section')

    expect(currentSeamSection).not.toBeNull()
    expect(within(currentSeamSection!).getByText('Concourse Delay')).toBeInTheDocument()
    expect(within(currentSeamSection!).getByText('Hold the exit timing back a little longer.')).toBeInTheDocument()
  })

  it('splits incoming and outgoing scenes around the selected scene', () => {
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')

    render(
      <I18nProvider>
        <ChapterAssemblyView workspace={workspace} />
      </I18nProvider>,
    )

    const incomingSection = screen.getByRole('heading', { name: 'Incoming' }).closest('section')
    const outgoingSection = screen.getByRole('heading', { name: 'Outgoing' }).closest('section')

    expect(incomingSection).not.toBeNull()
    expect(outgoingSection).not.toBeNull()
    expect(within(incomingSection!).getByRole('button', { name: /Midnight Platform/i })).toBeInTheDocument()
    expect(within(incomingSection!).queryByRole('button', { name: /Concourse Delay/i })).not.toBeInTheDocument()
    expect(within(outgoingSection!).getByRole('button', { name: /Ticket Window/i })).toBeInTheDocument()
    expect(within(outgoingSection!).queryByRole('button', { name: /Concourse Delay/i })).not.toBeInTheDocument()
  })

  it('renders assembly hints', () => {
    const workspace = buildChapterStoryWorkspace('scene-midnight-platform')

    render(
      <I18nProvider>
        <ChapterAssemblyView workspace={workspace} />
      </I18nProvider>,
    )

    const hintsSection = screen.getByRole('heading', { name: 'Assembly hints' }).closest('section')

    expect(hintsSection).not.toBeNull()
    expect(within(hintsSection!).getByText('Carry platform pressure')).toBeInTheDocument()
    expect(within(hintsSection!).getByText('Carry platform pressure into the concourse.')).toBeInTheDocument()
  })

  it('calls onSelectScene when an adjacent scene chip is clicked', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const workspace = buildChapterStoryWorkspace('scene-concourse-delay')

    render(
      <I18nProvider>
        <ChapterAssemblyView workspace={workspace} onSelectScene={onSelectScene} />
      </I18nProvider>,
    )

    const incomingSection = screen.getByRole('heading', { name: 'Incoming' }).closest('section')

    await user.click(within(incomingSection!).getByRole('button', { name: /Midnight Platform/i }))

    expect(onSelectScene).toHaveBeenCalledWith('scene-midnight-platform')
  })
})
