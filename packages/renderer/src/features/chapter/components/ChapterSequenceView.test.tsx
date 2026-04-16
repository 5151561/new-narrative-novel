import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

import { ChapterSequenceView } from './ChapterSequenceView'

const workspace: ChapterStructureWorkspaceViewModel = {
  chapterId: 'chapter-signals-in-rain',
  title: 'Signals in Rain',
  summary: 'Keep structure, density, and assembly pressure in the same chapter workbench.',
  sceneCount: 3,
  unresolvedCount: 6,
  selectedSceneId: 'scene-ticket-window',
  scenes: [
    {
      id: 'scene-midnight-platform',
      order: 1,
      title: 'Midnight Platform',
      summary: 'Keep the bargain public and constrained.',
      purpose: 'Push the bargain into a public stalemate.',
      pov: 'Ren Voss',
      location: 'Eastbound platform',
      conflict: 'Ren needs leverage, Mei needs a higher price.',
      reveal: 'The courier signal stays readable only to Ren.',
      statusLabel: 'Current',
      proseStatusLabel: 'Needs draft',
      runStatusLabel: 'Paused',
      unresolvedCount: 3,
      lastRunLabel: 'Run 07',
    },
    {
      id: 'scene-concourse-delay',
      order: 2,
      title: 'Concourse Delay',
      summary: 'Hold the exit timing back a little longer.',
      purpose: 'Hold pressure for the next scene.',
      pov: 'Mei Arden',
      location: 'Concourse hall',
      conflict: 'The crowd slows everyone down.',
      reveal: 'Witness pressure carries inward.',
      statusLabel: 'Queued',
      proseStatusLabel: 'Queued for draft',
      runStatusLabel: 'Idle',
      unresolvedCount: 2,
      lastRunLabel: 'Not run',
    },
    {
      id: 'scene-ticket-window',
      order: 3,
      title: 'Ticket Window',
      summary: 'Keep the alias offstage.',
      purpose: 'Bring speed and certainty into one beat.',
      pov: 'Ren Voss',
      location: 'Ticket window',
      conflict: 'Ren wants speed, Mei wants commitment first.',
      reveal: 'The alias still has not entered public knowledge.',
      statusLabel: 'Guarded',
      proseStatusLabel: 'Needs draft',
      runStatusLabel: 'Guarded',
      unresolvedCount: 1,
      lastRunLabel: 'Run 03',
    },
  ],
  inspector: {
    selectedSceneBrief: {
      sceneId: 'scene-ticket-window',
      title: 'Ticket Window',
      summary: 'Keep the alias offstage while the trade-off tightens.',
      unresolvedCount: 1,
      unresolvedLabel: 'Unresolved 1',
    },
    chapterNotes: ['Ordering remains structural.'],
    problemsSummary: [
      {
        id: 'bell-timing',
        label: 'Bell timing',
        detail: 'The exit bell still lands too early.',
      },
    ],
    assemblyHints: [
      {
        id: 'carry-pressure',
        label: 'Carry platform pressure',
        detail: 'Carry platform pressure into the concourse.',
      },
    ],
  },
  viewsMeta: {
    availableViews: ['sequence', 'outliner', 'assembly'],
  },
}

describe('ChapterSequenceView', () => {
  it('renders order, title, summary, status, and unresolved count on sequence cards', () => {
    render(
      <I18nProvider>
        <ChapterSequenceView workspace={workspace} onSelectScene={() => {}} />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: /Sequence 1 Midnight Platform/i })).toBeInTheDocument()
    expect(screen.getByText('Keep the bargain public and constrained.')).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.getByText('Unresolved 3')).toBeInTheDocument()
  })

  it('follows workspace.selectedSceneId and calls onSelectScene when a card is clicked', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()

    render(
      <I18nProvider>
        <ChapterSequenceView workspace={workspace} onSelectScene={onSelectScene} />
      </I18nProvider>,
    )

    const selectedCard = screen.getByRole('button', { name: /Sequence 3 Ticket Window/i })
    expect(selectedCard).toHaveAttribute('aria-current', 'true')
    expect(selectedCard).not.toHaveAttribute('aria-pressed')

    await user.click(screen.getByRole('button', { name: /Sequence 2 Concourse Delay/i }))

    expect(onSelectScene).toHaveBeenCalledWith('scene-concourse-delay')
  })
})
