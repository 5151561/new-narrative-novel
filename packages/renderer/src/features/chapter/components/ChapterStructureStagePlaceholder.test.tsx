import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

import { ChapterStructureStagePlaceholder } from './ChapterStructureStagePlaceholder'

const workspace: ChapterStructureWorkspaceViewModel = {
  chapterId: 'chapter-signals-in-rain',
  title: 'Signals in Rain',
  summary: 'Keep structure, density, and assembly pressure in the same chapter workbench.',
  sceneCount: 3,
  unresolvedCount: 6,
  selectedSceneId: 'scene-midnight-platform',
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

describe('ChapterStructureStagePlaceholder', () => {
  it('keeps the selected first scene only in the current assembly lane', () => {
    render(
      <I18nProvider>
        <ChapterStructureStagePlaceholder
          activeView="assembly"
          labels={{
            sequence: 'Sequence',
            outliner: 'Outliner',
            assembly: 'Assembly',
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
        <ChapterStructureStagePlaceholder
          activeView="sequence"
          labels={{
            sequence: 'Sequence',
            outliner: 'Outliner',
            assembly: 'Assembly',
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

  it('falls back to the first available chapter view when the active view is disallowed', () => {
    render(
      <I18nProvider>
        <ChapterStructureStagePlaceholder
          activeView="outliner"
          labels={{
            sequence: 'Sequence',
            outliner: 'Outliner',
            assembly: 'Assembly',
          }}
          availableViews={['sequence', 'assembly']}
          workspace={workspace}
          title="Chapter structure"
          onViewChange={() => {}}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('button', { name: 'Sequence' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: /Beat line 1 Midnight Platform/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sequence 1 Midnight Platform/i })).toBeInTheDocument()
  })
})
