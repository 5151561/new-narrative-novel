import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

import { ChapterBinderPane } from './ChapterBinderPane'

const workspace: ChapterStructureWorkspaceViewModel = {
  chapterId: 'chapter-signals-in-rain',
  title: 'Signals in Rain',
  summary: 'Keep structure, density, and assembly pressure in the same chapter workbench.',
  sceneCount: 3,
  unresolvedCount: 6,
  selectedSceneId: 'scene-concourse-delay',
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
      sceneId: 'scene-concourse-delay',
      title: 'Concourse Delay',
      summary: 'Hold witness pressure at the edge of the exit.',
      unresolvedCount: 2,
      unresolvedLabel: 'Unresolved 2',
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

describe('ChapterBinderPane', () => {
  it('follows workspace.selectedSceneId and renders chapter summary badges', () => {
    render(
      <I18nProvider>
        <ChapterBinderPane
          title="Chapters"
          description="Keep chapter structure, placeholder scenes, and unresolved signals aligned."
          workspace={workspace}
          activeView="sequence"
        />
      </I18nProvider>,
    )

    const selectedScene = screen.getByRole('button', { name: /Scene 2 Concourse Delay/i })

    expect(selectedScene).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('3 scenes')).toBeInTheDocument()
    expect(screen.getByText('Unresolved 6')).toBeInTheDocument()
    expect(screen.getByText('Sequence')).toBeInTheDocument()

    const ticketWindowItem = screen.getByRole('button', { name: /Scene 3 Ticket Window/i })
    expect(within(ticketWindowItem).getByText('Unresolved 1')).toBeInTheDocument()
  })

  it('calls onSelectScene when another scene is clicked', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()

    render(
      <I18nProvider>
        <ChapterBinderPane
          title="Chapters"
          description="Keep chapter structure, placeholder scenes, and unresolved signals aligned."
          workspace={workspace}
          activeView="sequence"
          onSelectScene={onSelectScene}
        />
      </I18nProvider>,
    )

    await user.click(screen.getByRole('button', { name: /Scene 1 Midnight Platform/i }))

    expect(onSelectScene).toHaveBeenCalledWith('scene-midnight-platform')
  })

  it('opens a scene in orchestrate without triggering the primary selection click', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const onOpenScene = vi.fn()

    render(
      <I18nProvider>
        <ChapterBinderPane
          title="Chapters"
          description="Keep chapter structure, placeholder scenes, and unresolved signals aligned."
          workspace={workspace}
          activeView="sequence"
          onSelectScene={onSelectScene}
          onOpenScene={onOpenScene}
        />
      </I18nProvider>,
    )

    const midnightPlatformItem = screen.getByRole('button', { name: /Scene 1 Midnight Platform/i }).closest('li')
    await user.click(within(midnightPlatformItem!).getByRole('button', { name: 'Open in Orchestrate: Midnight Platform' }))

    expect(onOpenScene).toHaveBeenCalledWith('scene-midnight-platform', 'orchestrate')
    expect(onSelectScene).not.toHaveBeenCalled()
  })

  it('opens a scene in draft without triggering the primary selection click', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const onOpenScene = vi.fn()

    render(
      <I18nProvider>
        <ChapterBinderPane
          title="Chapters"
          description="Keep chapter structure, placeholder scenes, and unresolved signals aligned."
          workspace={workspace}
          activeView="sequence"
          onSelectScene={onSelectScene}
          onOpenScene={onOpenScene}
        />
      </I18nProvider>,
    )

    const concourseDelayItem = screen.getByRole('button', { name: /Scene 2 Concourse Delay/i }).closest('li')
    await user.click(within(concourseDelayItem!).getByRole('button', { name: 'Open in Draft: Concourse Delay' }))

    expect(onOpenScene).toHaveBeenCalledWith('scene-concourse-delay', 'draft')
    expect(onSelectScene).not.toHaveBeenCalled()
  })

  it('renders bounded reorder controls and moves a scene without triggering selection', async () => {
    const user = userEvent.setup()
    const onSelectScene = vi.fn()
    const onMoveScene = vi.fn()

    render(
      <I18nProvider>
        <ChapterBinderPane
          title="Chapters"
          description="Keep chapter structure, placeholder scenes, and unresolved signals aligned."
          workspace={workspace}
          activeView="sequence"
          onSelectScene={onSelectScene}
          onMoveScene={onMoveScene}
        />
      </I18nProvider>,
    )

    const firstItem = screen.getByRole('button', { name: /Scene 1 Midnight Platform/i }).closest('li')
    const lastItem = screen.getByRole('button', { name: /Scene 3 Ticket Window/i }).closest('li')

    expect(within(firstItem!).getByRole('button', { name: 'Move earlier: Midnight Platform' })).toBeDisabled()
    expect(within(firstItem!).getByRole('button', { name: 'Move later: Midnight Platform' })).toBeEnabled()
    expect(within(lastItem!).getByRole('button', { name: 'Move earlier: Ticket Window' })).toBeEnabled()
    expect(within(lastItem!).getByRole('button', { name: 'Move later: Ticket Window' })).toBeDisabled()

    await user.click(within(lastItem!).getByRole('button', { name: 'Move earlier: Ticket Window' }))

    expect(onMoveScene).toHaveBeenCalledWith('scene-ticket-window', 'up')
    expect(onSelectScene).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Scene 2 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
  })
})
