import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'

import { ChapterStructureWorkspace } from './ChapterStructureWorkspace'

describe('ChapterStructureWorkspace', () => {
  it('keeps binder, sequence, inspector, and URL scene state in sync with the chapter route', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=sequence&sceneId=scene-midnight-platform',
    )

    render(
      <AppProviders>
        <ChapterStructureWorkspace />
      </AppProviders>,
    )

    const binderScene = await screen.findByRole('button', { name: /Scene 1 Midnight Platform/i })
    const sequenceCard = await screen.findByRole('button', { name: /Sequence 1 Midnight Platform/i })

    expect(binderScene).toHaveAttribute('aria-pressed', 'true')
    expect(sequenceCard).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Midnight Platform · Unresolved 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Sequence 3 Ticket Window/i }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-ticket-window')
    })

    expect(screen.getByRole('button', { name: /Scene 3 Ticket Window/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Sequence 3 Ticket Window/i })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Ticket Window · Unresolved 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Scene 2 Concourse Delay/i }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
    })

    expect(screen.getByRole('button', { name: /Scene 2 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Sequence 2 Concourse Delay/i })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByText('Concourse Delay · Unresolved 2')).toBeInTheDocument()
  })
})
