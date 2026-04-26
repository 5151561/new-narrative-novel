import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { apiRouteContract } from '@/app/project-runtime'
import { createFakeApiRuntime } from '@/app/project-runtime/fake-api-runtime.test-utils'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import { resetMockChapterDb } from '../api/mock-chapter-db'
import { chapterQueryKeys } from '../hooks/chapter-query-keys'
import { buildChapterStoryWorkspace } from '../components/chapter-story-fixture'
import * as chapterWorkspaceQuery from '../hooks/useChapterStructureWorkspaceQuery'

import { ChapterStructureWorkspace } from './ChapterStructureWorkspace'

afterEach(() => {
  vi.restoreAllMocks()
  resetMockChapterDb()
  window.localStorage.clear()
})

function ChapterRouteHarness() {
  const { route } = useWorkbenchRouteState()

  return route.scope === 'chapter' ? (
    <ChapterStructureWorkspace />
  ) : (
    <div data-testid="route-scope">{route.scope}</div>
  )
}

function createRuntimeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
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

    expect(binderScene).toHaveAttribute('aria-pressed', 'true')
    expect(outlinerRow).toHaveAttribute('aria-current', 'true')
    expect(summarySection).not.toBeNull()
    expect(dockProblemsSection).not.toBeNull()
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
    await user.click(within(dockRegion).getByRole('tab', { name: /Activity/i }))
    const dockActivitySection = within(dockRegion).getByRole('heading', { name: 'Activity' }).closest('section')

    expect(dockActivitySection).not.toBeNull()
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

  it('routes to book scope instead of falling through to scene when clicking Book from chapter structure', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Book' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
    })

    expect(screen.getByTestId('route-scope')).toHaveTextContent('book')
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

  it('reorders from the binder, keeps selection stable, patches structure from the outliner, and records mutation activity', async () => {
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

    const dockRegion = await screen.findByRole('region', { name: 'Chapter bottom dock' })
    const ticketWindowBinderItem = screen.getByRole('button', { name: /Scene 3 Ticket Window/i }).closest('li')

    await user.click(within(ticketWindowBinderItem!).getByRole('button', { name: 'Move earlier: Ticket Window' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Scene 2 Ticket Window/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Scene 3 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /Beat line 2 Ticket Window/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Beat line 3 Concourse Delay/i })).toHaveAttribute('aria-current', 'true')
    })

    await user.click(screen.getByRole('button', { name: 'Sequence' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Sequence 2 Ticket Window/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Sequence 3 Concourse Delay/i })).toHaveAttribute('aria-current', 'true')
    })

    await user.click(screen.getByRole('button', { name: 'Assembly' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Current seam' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Concourse Delay A crowd bottleneck should slow the exit without resolving who controls the courier line\./i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Ticket Window The alias stays offstage while Mei tests whether Ren will trade certainty for speed\./i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Outliner' }))

    const selectedRow = await screen.findByRole('button', { name: /Beat line 3 Concourse Delay/i })
    const selectedRowItem = selectedRow.closest('li')
    await user.click(within(selectedRowItem!).getByRole('button', { name: 'Edit Structure' }))

    const summaryInput = within(selectedRowItem!).getByLabelText('Summary')
    const purposeInput = within(selectedRowItem!).getByLabelText('Purpose')
    const revealInput = within(selectedRowItem!).getByLabelText('Reveal')

    await user.clear(summaryInput)
    await user.type(summaryInput, '  Hold the witness pressure until the gate finally opens.  ')
    await user.clear(purposeInput)
    await user.type(purposeInput, '  Delay the exit so the chapter can spend one more beat in public pressure.  ')
    await user.clear(revealInput)
    await user.type(revealInput, '  The witness line now carries directly into the gate decision.  ')
    await user.click(within(selectedRowItem!).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(
        within(screen.getByRole('heading', { name: 'Summary' }).closest('section')!).getByText(
          'Hold the witness pressure until the gate finally opens.',
        ),
      ).toBeInTheDocument()
      expect(within(selectedRowItem!).getByText('Delay the exit so the chapter can spend one more beat in public pressure.')).toBeInTheDocument()
      expect(within(selectedRowItem!).getByText('The witness line now carries directly into the gate decision.')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Assembly' }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Concourse Delay Hold the witness pressure until the gate finally opens\./i }),
      ).toBeInTheDocument()
    })

    expect(within(dockRegion).getByText('Moved Ticket Window earlier')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Updated structure for Concourse Delay')).toBeInTheDocument()
  })

  it('reorders and patches through the API runtime while keeping binder, outliner, inspector, and route.sceneId aligned', async () => {
    const user = userEvent.setup()
    const queryClient = createRuntimeQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const { requests, runtime } = createFakeApiRuntime({
      projectId: 'project-chapter-write-route',
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-concourse-delay',
    )

    render(
      <AppProviders runtime={runtime} queryClient={queryClient}>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    const dockRegion = await screen.findByRole('region', { name: 'Chapter bottom dock' })
    const ticketWindowBinderItem = screen.getByRole('button', { name: /Scene 3 Ticket Window/i }).closest('li')

    await user.click(within(ticketWindowBinderItem!).getByRole('button', { name: 'Move earlier: Ticket Window' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Scene 2 Ticket Window/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Scene 3 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: /Beat line 2 Ticket Window/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Beat line 3 Concourse Delay/i })).toHaveAttribute('aria-current', 'true')
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
    })

    await user.click(screen.getByRole('button', { name: 'Assembly' }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /Sequence 3 Concourse Delay/i })).not.toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Current seam' })).toBeInTheDocument()
      expect(
        within(screen.getByRole('heading', { name: 'Summary' }).closest('section')!).getByText('Concourse Delay · Unresolved 2'),
      ).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Outliner' }))

    const selectedRow = await screen.findByRole('button', { name: /Beat line 3 Concourse Delay/i })
    const selectedRowItem = selectedRow.closest('li')

    await user.click(within(selectedRowItem!).getByRole('button', { name: 'Edit Structure' }))
    await user.clear(within(selectedRowItem!).getByLabelText('Summary'))
    await user.type(within(selectedRowItem!).getByLabelText('Summary'), '  Keep the witness line open through the gate.  ')
    await user.click(within(selectedRowItem!).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(
        within(screen.getByRole('heading', { name: 'Summary' }).closest('section')!).getByText(
          'Keep the witness line open through the gate.',
        ),
      ).toBeInTheDocument()
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
    })

    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'POST',
        path: apiRouteContract.chapterSceneReorder({
          projectId: 'project-chapter-write-route',
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-ticket-window',
        }),
        body: {
          targetIndex: 1,
        },
      }),
    )
    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'PATCH',
        path: apiRouteContract.chapterSceneStructure({
          projectId: 'project-chapter-write-route',
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-concourse-delay',
        }),
        body: {
          locale: 'en',
          patch: {
            summary: 'Keep the witness line open through the gate.',
          },
        },
      }),
    )
    expect(within(dockRegion).getByText('Moved Ticket Window earlier')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Updated structure for Concourse Delay')).toBeInTheDocument()
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: chapterQueryKeys.workspace('chapter-signals-in-rain'),
        refetchType: 'active',
      })
    })
  })

  it('does not record reorder success activity when the API runtime resolves the mutation to null', async () => {
    const user = userEvent.setup()
    const queryClient = createRuntimeQueryClient()
    const { runtime } = createFakeApiRuntime({
      projectId: 'project-chapter-null-reorder',
      overrides: [
        {
          method: 'POST',
          path: apiRouteContract.chapterSceneReorder({
            projectId: 'project-chapter-null-reorder',
            chapterId: 'chapter-signals-in-rain',
            sceneId: 'scene-ticket-window',
          }),
          body: {
            targetIndex: 1,
          },
          response: null,
        },
      ],
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-concourse-delay',
    )

    render(
      <AppProviders runtime={runtime} queryClient={queryClient}>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    const ticketWindowBinderItem = (await screen.findByRole('button', { name: /Scene 3 Ticket Window/i })).closest('li')
    await user.click(within(ticketWindowBinderItem!).getByRole('button', { name: 'Move earlier: Ticket Window' }))

    await waitFor(() => {
      expect(screen.queryByText('Moved Ticket Window earlier')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('Moved Ticket Window earlier')).not.toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
  })

  it('does not record structure update success activity when the API runtime resolves the patch mutation to null', async () => {
    const user = userEvent.setup()
    const queryClient = createRuntimeQueryClient()
    const { runtime } = createFakeApiRuntime({
      projectId: 'project-chapter-null-patch',
      overrides: [
        {
          method: 'PATCH',
          path: apiRouteContract.chapterSceneStructure({
            projectId: 'project-chapter-null-patch',
            chapterId: 'chapter-signals-in-rain',
            sceneId: 'scene-concourse-delay',
          }),
          body: {
            locale: 'en',
            patch: {
              summary: 'Keep the witness line open through the gate.',
            },
          },
          response: null,
        },
      ],
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-concourse-delay',
    )

    render(
      <AppProviders runtime={runtime} queryClient={queryClient}>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    const selectedRow = await screen.findByRole('button', { name: /Beat line 2 Concourse Delay/i })
    const selectedRowItem = selectedRow.closest('li')
    await user.click(within(selectedRowItem!).getByRole('button', { name: 'Edit Structure' }))
    await user.clear(within(selectedRowItem!).getByLabelText('Summary'))
    await user.type(within(selectedRowItem!).getByLabelText('Summary'), '  Keep the witness line open through the gate.  ')
    await user.click(within(selectedRowItem!).getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.queryByText('Updated structure for Concourse Delay')).not.toBeInTheDocument()
    })

    expect(screen.queryByText('Updated structure for Concourse Delay')).not.toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
  })

  it('closes the selected-row edit form when the locale changes before save', async () => {
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

    const selectedRow = await screen.findByRole('button', { name: /Beat line 2 Concourse Delay/i })
    const selectedRowItem = selectedRow.closest('li')

    await user.click(within(selectedRowItem!).getByRole('button', { name: 'Edit Structure' }))
    await user.clear(within(selectedRowItem!).getByLabelText('Summary'))
    await user.type(within(selectedRowItem!).getByLabelText('Summary'), '  English draft that must not cross locales.  ')

    expect(within(selectedRowItem!).getByRole('button', { name: 'Save' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: '中文' }))

    await waitFor(() => {
      expect(screen.queryByLabelText('摘要')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: '编辑结构' })).toBeInTheDocument()
    })

    expect(screen.getAllByText('候车厅延误').length).toBeGreaterThan(0)
    expect(screen.queryByText('English draft that must not cross locales.')).not.toBeInTheDocument()
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
