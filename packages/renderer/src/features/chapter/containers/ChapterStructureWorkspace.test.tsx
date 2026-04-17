import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import { buildChapterStoryWorkspace } from '../components/chapter-story-fixture'
import * as chapterWorkspaceQuery from '../hooks/useChapterStructureWorkspaceQuery'

import { ChapterStructureWorkspace } from './ChapterStructureWorkspace'

afterEach(() => {
  vi.restoreAllMocks()
})

function ChapterRouteHarness() {
  const { route } = useWorkbenchRouteState()

  return route.scope === 'chapter' ? <ChapterStructureWorkspace /> : <div>Scene scope placeholder</div>
}

describe('ChapterStructureWorkspace', () => {
  it('keeps binder, stage, inspector, and bottom dock in sync with the chapter route', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-midnight-platform',
    )

    render(
      <AppProviders>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    const binderScene = await screen.findByRole('button', { name: /Scene 1 Midnight Platform/i })
    const outlinerRow = await screen.findByRole('button', { name: /Beat line 1 Midnight Platform/i })
    const dockRegion = screen.getByRole('region', { name: 'Chapter bottom dock' })
    const summarySection = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    const dockProblemsSection = within(dockRegion).getByRole('heading', { name: 'Problems' }).closest('section')
    const dockActivitySection = within(dockRegion).getByRole('heading', { name: 'Activity' }).closest('section')

    expect(binderScene).toHaveAttribute('aria-pressed', 'true')
    expect(outlinerRow).toHaveAttribute('aria-current', 'true')
    expect(summarySection).not.toBeNull()
    expect(dockProblemsSection).not.toBeNull()
    expect(dockActivitySection).not.toBeNull()
    expect(within(summarySection!).getByText('Midnight Platform · Unresolved 3')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Midnight Platform · Unresolved 3')).toBeInTheDocument()
    expect(
      within(summarySection!).getByText(
        'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
      ),
    ).toBeInTheDocument()
    expect(within(summarySection!).getByText('Witness scrutiny belongs in the auxiliary context, not the stage copy.')).toBeInTheDocument()
    expect(within(dockProblemsSection!).getByText('Departure bell timing')).toBeInTheDocument()
    expect(within(dockProblemsSection!).getByText('Carry platform pressure')).toBeInTheDocument()
    expect(within(dockActivitySection!).getByText('Entered Outliner')).toBeInTheDocument()
    expect(within(dockActivitySection!).getByText('Focused Midnight Platform')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Assembly' }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('view')).toBe('assembly')
    })

    const currentSeamSection = screen.getByRole('heading', { name: 'Current seam' }).closest('section')
    const outgoingSection = screen.getByRole('heading', { name: 'Outgoing' }).closest('section')

    expect(currentSeamSection).not.toBeNull()
    expect(outgoingSection).not.toBeNull()
    expect(
      within(currentSeamSection!).getByRole('button', {
        name: /Midnight Platform Ren has to lock the bargain before the platform witness turns the ledger into public leverage\./i,
      }),
    ).toBeInTheDocument()
    expect(within(dockRegion).getByText('Switched to Assembly')).toBeInTheDocument()

    await user.click(within(outgoingSection!).getByRole('button', { name: /Concourse Delay/i }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
    })

    expect(screen.getByRole('button', { name: /Scene 2 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
    expect(
      within(screen.getByRole('heading', { name: 'Current seam' }).closest('section')!).getByRole('button', {
        name: /Concourse Delay A crowd bottleneck should slow the exit without resolving who controls the courier line\./i,
      }),
    ).toBeInTheDocument()
    expect(within(screen.getByRole('heading', { name: 'Summary' }).closest('section')!).getByText('Concourse Delay · Unresolved 2')).toBeInTheDocument()
    expect(
      within(screen.getByRole('heading', { name: 'Summary' }).closest('section')!).getByText(
        'A crowd bottleneck should slow the exit without resolving who controls the courier line.',
      ),
    ).toBeInTheDocument()
    expect(within(dockRegion).getByText('Concourse Delay · Unresolved 2')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Focused Concourse Delay')).toBeInTheDocument()
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
        <ChapterRouteHarness />
      </AppProviders>,
    )

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('view')).toBe('sequence')
    })

    expect(screen.getByRole('button', { name: 'Sequence' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Outliner' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sequence 1 Midnight Platform/i })).toBeInTheDocument()
  })

  it('replaces a rendered dock with loading fallback content so stale activity cannot linger', async () => {
    const currentResult: ReturnType<typeof chapterWorkspaceQuery.useChapterStructureWorkspaceQuery> = {
      workspace: buildChapterStoryWorkspace('scene-midnight-platform'),
      isLoading: false,
      error: null,
      refetch: async () => undefined,
    }

    vi.spyOn(chapterWorkspaceQuery, 'useChapterStructureWorkspaceQuery').mockImplementation(() => currentResult)

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-midnight-platform',
    )

    const rendered = render(
      <AppProviders>
        <ChapterStructureWorkspace />
      </AppProviders>,
    )

    expect(await screen.findByText('Entered Outliner')).toBeInTheDocument()

    currentResult.workspace = undefined
    currentResult.isLoading = true

    rendered.rerender(
      <AppProviders>
        <ChapterStructureWorkspace />
      </AppProviders>,
    )

    expect(screen.getByText('Loading bottom dock')).toBeInTheDocument()
    expect(screen.queryByText('Entered Outliner')).not.toBeInTheDocument()
  })

  it('opens the selected chapter scene in scene scope and browser back returns to the chapter selection', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-concourse-delay',
    )

    render(
      <AppProviders>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    await screen.findByRole('button', { name: /Scene 2 Concourse Delay/i })

    await user.click(screen.getByRole('button', { name: 'Scene' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-concourse-delay')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
      expect(params.get('view')).toBeNull()
      expect(params.get('sceneId')).toBeNull()
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('view')).toBe('outliner')
      expect(params.get('sceneId')).toBe('scene-concourse-delay')
    })
  })

  it('patches the chapter route with the first scene before opening scene scope when no scene is selected', async () => {
    const user = userEvent.setup()

    window.history.replaceState({}, '', '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner')

    render(
      <AppProviders>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    await screen.findByRole('button', { name: /Scene 1 Midnight Platform/i })

    await user.click(screen.getByRole('button', { name: 'Scene' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('view')).toBe('outliner')
      expect(params.get('sceneId')).toBe('scene-midnight-platform')
    })
  })

  it.each([
    {
      name: 'error',
      result: {
        workspace: undefined,
        isLoading: false,
        error: new Error('chapter exploded'),
        refetch: async () => undefined,
      },
      title: 'Bottom dock unavailable',
      message: 'chapter exploded',
    },
    {
      name: 'not-found',
      result: {
        workspace: null,
        isLoading: false,
        error: null,
        refetch: async () => undefined,
      },
      title: 'Bottom dock unavailable',
      message: 'Chapter chapter-signals-in-rain could not be found.',
    },
  ])('shows $name bottom-dock fallback content', async ({ result, title, message }) => {
    vi.spyOn(chapterWorkspaceQuery, 'useChapterStructureWorkspaceQuery').mockReturnValue(result)

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

    const dockRegion = screen.getByText(title).closest('section')
    expect(dockRegion).not.toBeNull()
    expect(within(dockRegion!).getByText(message)).toBeInTheDocument()
  })
})
