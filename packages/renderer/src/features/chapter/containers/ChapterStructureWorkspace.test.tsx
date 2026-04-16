import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { buildChapterStoryWorkspace } from '../components/chapter-story-fixture'
import * as chapterWorkspaceQuery from '../hooks/useChapterStructureWorkspaceQuery'

import { ChapterStructureWorkspace } from './ChapterStructureWorkspace'

afterEach(() => {
  vi.restoreAllMocks()
})

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
    let summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    let problemsSection = screen.getByRole('heading', { name: 'Problems' }).closest('section')

    expect(summarySection).not.toBeNull()
    expect(problemsSection).not.toBeNull()
    expect(screen.getByText('Midnight Platform · Unresolved 3')).toBeInTheDocument()
    expect(
      within(summarySection!).getByText(
        'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
      ),
    ).toBeInTheDocument()
    expect(within(summarySection!).getByText('Witness scrutiny belongs in the auxiliary context, not the stage copy.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Sequence 3 Ticket Window/i }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-ticket-window')
    })

    expect(screen.getByRole('button', { name: /Scene 3 Ticket Window/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Sequence 3 Ticket Window/i })).toHaveAttribute('aria-current', 'true')
    summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    expect(screen.getByText('Ticket Window · Unresolved 1')).toBeInTheDocument()
    expect(
      within(summarySection!).getByText('The alias stays offstage while Mei tests whether Ren will trade certainty for speed.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Scene 2 Concourse Delay/i }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
    })

    expect(screen.getByRole('button', { name: /Scene 2 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Sequence 2 Concourse Delay/i })).toHaveAttribute('aria-current', 'true')
    summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    problemsSection = screen.getByRole('heading', { name: 'Problems' }).closest('section')
    expect(screen.getByText('Concourse Delay · Unresolved 2')).toBeInTheDocument()
    expect(
      within(summarySection!).getByText(
        'A crowd bottleneck should slow the exit without resolving who controls the courier line.',
      ),
    ).toBeInTheDocument()
    expect(within(problemsSection!).getByText('Carry platform pressure')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Outliner' }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('view')).toBe('outliner')
    })

    const outlinerRow = screen.getByRole('button', { name: /Beat line 2 Concourse Delay/i })
    expect(outlinerRow).toHaveAttribute('aria-current', 'true')
    expect(outlinerRow.className).toContain('focus-visible:ring-2')

    await user.click(screen.getByRole('button', { name: /Beat line 3 Ticket Window/i }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-ticket-window')
    })

    expect(screen.getByRole('button', { name: /Scene 3 Ticket Window/i })).toHaveAttribute('aria-pressed', 'true')
    summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    expect(summarySection).not.toBeNull()
    expect(screen.getByText('Ticket Window · Unresolved 1')).toBeInTheDocument()
    expect(
      within(summarySection!).getByText('The alias stays offstage while Mei tests whether Ren will trade certainty for speed.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Assembly' }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('view')).toBe('assembly')
    })

    const currentSeamSection = screen.getByRole('heading', { name: 'Current seam' }).closest('section')
    const incomingSection = screen.getByRole('heading', { name: 'Incoming' }).closest('section')

    expect(currentSeamSection).not.toBeNull()
    expect(incomingSection).not.toBeNull()
    expect(within(currentSeamSection!).getByRole('button', { name: /Ticket Window/i })).toBeInTheDocument()
    expect(within(currentSeamSection!).getByRole('button', { name: /Ticket Window/i }).className).toContain('focus-visible:ring-2')

    await user.click(within(incomingSection!).getByRole('button', { name: /Concourse Delay/i }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
    })

    expect(screen.getByRole('button', { name: /Scene 2 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('heading', { name: 'Current seam' }).closest('section')!).getByRole('button', { name: /Concourse Delay/i })).toBeInTheDocument()
  })

  it('normalizes a disallowed route view against available chapter views and updates the URL', async () => {
    vi.spyOn(chapterWorkspaceQuery, 'useChapterStructureWorkspaceQuery').mockReturnValue({
      workspace: {
        ...buildChapterStoryWorkspace('scene-midnight-platform'),
        viewsMeta: {
          availableViews: ['sequence', 'assembly'],
        },
      },
      isLoading: false,
      error: null,
      refetch: async () => undefined,
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-midnight-platform',
    )

    render(
      <AppProviders>
        <ChapterStructureWorkspace />
      </AppProviders>,
    )

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('view')).toBe('sequence')
    })

    expect(screen.getByRole('button', { name: 'Sequence' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Outliner' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sequence 1 Midnight Platform/i })).toBeInTheDocument()
  })
})
