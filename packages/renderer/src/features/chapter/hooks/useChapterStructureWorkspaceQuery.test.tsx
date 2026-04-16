import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'

import { I18nProvider } from '@/app/i18n'
import type { ChapterRouteState } from '@/features/workbench/types/workbench-route'

import { createChapterClient } from '../api/chapter-client'
import { useChapterStructureWorkspaceQuery } from './useChapterStructureWorkspaceQuery'

describe('chapter query hooks', () => {
  function wrapperFactory() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    return function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          <I18nProvider>{children}</I18nProvider>
        </QueryClientProvider>
      )
    }
  }

  const baseRoute: ChapterRouteState = {
    scope: 'chapter',
    chapterId: 'chapter-signals-in-rain',
    lens: 'structure',
    view: 'sequence',
  }

  it('hydrates the chapter workspace model and falls back to the first scene when route.sceneId is missing', async () => {
    const wrapper = wrapperFactory()

    const hook = renderHook(() => useChapterStructureWorkspaceQuery(baseRoute), {
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.model).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      currentSceneId: 'scene-midnight-platform',
      scenes: expect.arrayContaining([expect.objectContaining({ id: 'scene-midnight-platform', order: 1 })]),
      inspector: expect.objectContaining({
        selectedSceneTitle: 'Midnight Platform',
      }),
    })
  })

  it('derives selected scene state from the route without refetching chapter data', async () => {
    const getChapterStructureWorkspace = vi.fn(createChapterClient().getChapterStructureWorkspace)
    const client = {
      getChapterStructureWorkspace,
    }
    const wrapper = wrapperFactory()

    const firstRoute: ChapterRouteState = {
      ...baseRoute,
      sceneId: 'scene-midnight-platform',
    }
    const secondRoute: ChapterRouteState = {
      ...baseRoute,
      sceneId: 'scene-ticket-window',
    }

    const hook = renderHook(({ route }) => useChapterStructureWorkspaceQuery(route, client), {
      initialProps: { route: firstRoute },
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.model.currentSceneId).toBe('scene-midnight-platform')
    expect(hook.result.current.model.inspector.selectedSceneTitle).toBe('Midnight Platform')
    expect(getChapterStructureWorkspace).toHaveBeenCalledTimes(1)

    hook.rerender({ route: secondRoute })

    await waitFor(() => {
      expect(hook.result.current.model.currentSceneId).toBe('scene-ticket-window')
    })

    expect(hook.result.current.model.inspector.selectedSceneTitle).toBe('Ticket Window')
    expect(getChapterStructureWorkspace).toHaveBeenCalledTimes(1)
  })

  it('falls back invalid route.sceneId values to the first scene without changing the query key', async () => {
    const getChapterStructureWorkspace = vi.fn(createChapterClient().getChapterStructureWorkspace)
    const client = {
      getChapterStructureWorkspace,
    }
    const wrapper = wrapperFactory()

    const hook = renderHook(
      () =>
        useChapterStructureWorkspaceQuery(
          {
            ...baseRoute,
            sceneId: 'scene-does-not-exist',
          },
          client,
        ),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.model.currentSceneId).toBe('scene-midnight-platform')
    expect(hook.result.current.model.inspector.selectedSceneTitle).toBe('Midnight Platform')
    expect(getChapterStructureWorkspace).toHaveBeenCalledTimes(1)
  })
})
