import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

import { ChapterStructureStage } from './ChapterStructureStage'

const workspace: ChapterStructureWorkspaceViewModel = {
  chapterId: 'chapter-signals-in-rain',
  title: 'Signals in Rain',
  summary: 'Keep structure, density, and assembly pressure in the same chapter workbench.',
  sceneCount: 3,
  unresolvedCount: 6,
  selectedSceneId: 'scene-midnight-platform',
  planning: {
    goal: 'Keep the chapter pressure public while the ledger stays unread.',
    constraints: [],
    proposals: [],
  },
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
      backlogStatus: 'planned',
      backlogStatusLabel: 'Planned',
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
      backlogStatus: 'needs_review',
      backlogStatusLabel: 'Needs review',
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
      backlogStatus: 'drafted',
      backlogStatusLabel: 'Drafted',
      statusLabel: 'Guarded',
      proseStatusLabel: 'Needs draft',
      runStatusLabel: 'Guarded',
      unresolvedCount: 1,
      lastRunLabel: 'Run 03',
    },
  ],
  inspector: {
    selectedSceneBrief: {
      sceneId: 'scene-midnight-platform',
      title: 'Midnight Platform',
      summary: 'Keep public witness pressure alive at the edge of the scene.',
      unresolvedCount: 3,
      unresolvedLabel: 'Unresolved 3',
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

describe('ChapterStructureStage', () => {
  it('keeps the selected first scene only in the current assembly lane', () => {
    render(
      <I18nProvider>
        <ChapterStructureStage
          activeView="assembly"
          labels={{
            sequence: 'Sequence',
            outliner: 'Outliner',
            assembly: 'Assembly',
            backlog: 'Backlog',
          }}
          workspace={workspace}
          title="Chapter structure"
          onViewChange={() => {}}
        />
      </I18nProvider>,
    )

    const incomingSection = screen.getByRole('heading', { name: 'Incoming' }).closest('section')
    const currentAssemblySection = screen.getByRole('heading', { name: 'Current seam' }).closest('section')

    expect(incomingSection).not.toBeNull()
    expect(currentAssemblySection).not.toBeNull()
    expect(within(incomingSection!).queryByRole('button', { name: /Midnight Platform/i })).not.toBeInTheDocument()
    expect(within(currentAssemblySection!).getByRole('button', { name: /Midnight Platform/i })).toBeInTheDocument()
  })

  it('renders only the available chapter views when metadata narrows the switcher', () => {
    render(
      <I18nProvider>
        <ChapterStructureStage
          activeView="sequence"
          labels={{
            sequence: 'Sequence',
            outliner: 'Outliner',
            assembly: 'Assembly',
            backlog: 'Backlog',
          }}
          availableViews={['sequence', 'assembly']}
          workspace={workspace}
          title="Chapter structure"
          onViewChange={() => {}}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: 'Sequence' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Assembly' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Outliner' })).not.toBeInTheDocument()
  })

  it('keeps switchboard responsibility only and does not normalize an unsupported active view', () => {
    render(
      <I18nProvider>
        <ChapterStructureStage
          activeView="outliner"
          labels={{
            sequence: 'Sequence',
            outliner: 'Outliner',
            assembly: 'Assembly',
            backlog: 'Backlog',
          }}
          availableViews={['sequence', 'assembly']}
          workspace={workspace}
          title="Chapter structure"
          onViewChange={() => {}}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: 'Sequence' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Assembly' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.queryByRole('button', { name: /Sequence 1 Midnight Platform/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Current seam' })).not.toBeInTheDocument()
  })

  it('renders backlog as a single main-stage task when the backlog view is active', () => {
    const backlogWorkspace = {
      ...workspace,
      planning: {
        ...workspace.planning,
        proposals: [
          {
            proposalId: 'chapter-signals-in-rain-backlog-proposal-001',
            chapterId: workspace.chapterId,
            goalSnapshot: workspace.planning.goal,
            constraintSnapshot: [],
            status: 'draft' as const,
            scenes: workspace.scenes.map((scene) => ({
              proposalSceneId: `chapter-signals-in-rain-backlog-proposal-001::${scene.id}`,
              sceneId: scene.id,
              order: scene.order,
              title: scene.title,
              summary: scene.summary,
              purpose: scene.purpose,
              backlogStatus: scene.backlogStatus,
              backlogStatusLabel: scene.backlogStatusLabel,
              plannerNotes: workspace.planning.goal,
            })),
          },
        ],
      },
    }

    render(
      <I18nProvider>
        <ChapterStructureStage
          activeView="backlog"
          labels={{
            sequence: 'Sequence',
            outliner: 'Outliner',
            assembly: 'Assembly',
            backlog: 'Backlog',
          }}
          workspace={backlogWorkspace}
          title="Chapter structure"
          onViewChange={() => {}}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Review and accept the scene backlog')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Incoming' })).not.toBeInTheDocument()
    expect(screen.queryByText('Keep the bargain public and constrained.')).toBeInTheDocument()
  })
})
