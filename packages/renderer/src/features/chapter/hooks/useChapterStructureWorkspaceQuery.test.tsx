import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useEffect, type PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APP_LOCALE_STORAGE_KEY, I18nProvider, type Locale, useI18n } from '@/app/i18n'
import { ProjectRuntimeProvider, createTestProjectRuntime } from '@/app/project-runtime'

import { createChapterClient } from '../api/chapter-client'
import { resetMockChapterDb } from '../api/mock-chapter-db'
import { useChapterStructureWorkspaceQuery } from './useChapterStructureWorkspaceQuery'
import { chapterQueryKeys } from './chapter-query-keys'

describe('chapter query hooks', () => {
  beforeEach(() => {
    resetMockChapterDb()
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  function wrapperWithoutRuntime() {
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

  function wrapperFactory(runtime = createTestProjectRuntime()) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    let setLocaleRef: ((locale: Locale) => void) | undefined

    function LocaleControl() {
      const { setLocale } = useI18n()

      useEffect(() => {
        setLocaleRef = setLocale
      }, [setLocale])

      return null
    }

    return {
      wrapper: function Wrapper({ children }: PropsWithChildren) {
        return (
          <QueryClientProvider client={queryClient}>
            <I18nProvider>
              <ProjectRuntimeProvider runtime={runtime}>
                <LocaleControl />
                {children}
              </ProjectRuntimeProvider>
            </I18nProvider>
          </QueryClientProvider>
        )
      },
      setLocale(nextLocale: Locale) {
        act(() => {
          setLocaleRef?.(nextLocale)
        })
      },
    }
  }

  const baseInput = {
    chapterId: 'chapter-signals-in-rain',
  }

  it('uses chapter id only for the workspace query key', () => {
    expect(chapterQueryKeys.workspace('chapter-signals-in-rain')).toEqual(['chapter', 'workspace', 'chapter-signals-in-rain'])
  })

  it('supports an explicit chapter client without a runtime provider', async () => {
    const client = {
      getChapterStructureWorkspace: vi.fn(createChapterClient().getChapterStructureWorkspace),
    }
    const hook = renderHook(() => useChapterStructureWorkspaceQuery(baseInput, client), {
      wrapper: wrapperWithoutRuntime(),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(client.getChapterStructureWorkspace).toHaveBeenCalledWith({ chapterId: 'chapter-signals-in-rain' })
    expect(hook.result.current.workspace?.chapterId).toBe('chapter-signals-in-rain')
  })

  it('uses the project runtime chapter client when no override is provided', async () => {
    const baseChapterClient = createChapterClient()
    const client = {
      ...baseChapterClient,
      getChapterStructureWorkspace: vi.fn(baseChapterClient.getChapterStructureWorkspace),
    }
    const runtime = createTestProjectRuntime({
      chapterClient: client,
    })
    const { wrapper } = wrapperFactory(runtime)
    const hook = renderHook(() => useChapterStructureWorkspaceQuery(baseInput), {
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(client.getChapterStructureWorkspace).toHaveBeenCalledWith({ chapterId: 'chapter-signals-in-rain' })
  })

  it('prefers the explicit chapter client over the project runtime client when both are provided', async () => {
    const runtimeClient = {
      getChapterStructureWorkspace: vi.fn(createChapterClient().getChapterStructureWorkspace),
    }
    const customClient = {
      getChapterStructureWorkspace: vi.fn(createChapterClient().getChapterStructureWorkspace),
    }
    const runtime = createTestProjectRuntime({
      chapterClient: runtimeClient,
    })
    const { wrapper } = wrapperFactory(runtime)
    const hook = renderHook(() => useChapterStructureWorkspaceQuery(baseInput, customClient), {
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(customClient.getChapterStructureWorkspace).toHaveBeenCalledWith({ chapterId: 'chapter-signals-in-rain' })
    expect(runtimeClient.getChapterStructureWorkspace).not.toHaveBeenCalled()
  })

  it('hydrates the stable chapter workspace model and falls back to the first scene when selectedSceneId is missing', async () => {
    const { wrapper } = wrapperFactory()

    const hook = renderHook(() => useChapterStructureWorkspaceQuery(baseInput), {
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      selectedSceneId: 'scene-midnight-platform',
      scenes: expect.arrayContaining([expect.objectContaining({ id: 'scene-midnight-platform', order: 1 })]),
      planning: expect.objectContaining({
        goal: expect.any(String),
        constraints: expect.any(Array),
        proposals: expect.any(Array),
      }),
      inspector: expect.objectContaining({
        selectedSceneBrief: expect.objectContaining({
          sceneId: 'scene-midnight-platform',
          title: 'Midnight Platform',
          unresolvedCount: 3,
        }),
        problemsSummary: expect.arrayContaining([
          expect.objectContaining({
            id: 'departure-bell-timing',
          }),
        ]),
      }),
    })
  })

  it('maps planning, proposals, accepted plan id, and canonical backlog status from the raw chapter record', async () => {
    const client = createChapterClient()
    const generated = await client.generateChapterBacklogProposal({ chapterId: 'chapter-signals-in-rain', locale: 'en' })
    const proposal = generated?.planning.proposals.at(-1)
    expect(proposal).toBeTruthy()
    await client.updateChapterBacklogProposalScene({
      chapterId: 'chapter-signals-in-rain',
      proposalId: proposal!.proposalId,
      proposalSceneId: proposal!.scenes[1]!.proposalSceneId,
      locale: 'en',
      patch: {
        summary: 'Open on the crowd bottleneck.',
      },
      order: 1,
      backlogStatus: 'needs_review',
    })
    await client.acceptChapterBacklogProposal({
      chapterId: 'chapter-signals-in-rain',
      proposalId: proposal!.proposalId,
      locale: 'en',
    })

    const { wrapper } = wrapperFactory()
    const hook = renderHook(() => useChapterStructureWorkspaceQuery(baseInput, client), {
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace).toMatchObject({
      planning: {
        acceptedProposalId: proposal!.proposalId,
      },
    })
    expect(hook.result.current.workspace?.scenes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'scene-concourse-delay',
        order: 1,
        backlogStatus: 'needs_review',
      }),
    ]))
    expect(hook.result.current.workspace?.planning.proposals[0]?.scenes[0]).toMatchObject({
      sceneId: 'scene-concourse-delay',
      backlogStatus: 'needs_review',
      summary: 'Open on the crowd bottleneck.',
    })
  })

  it('derives selected scene state from the route without refetching chapter data', async () => {
    const getChapterStructureWorkspace = vi.fn(createChapterClient().getChapterStructureWorkspace)
    const client = {
      getChapterStructureWorkspace,
    }
    const { wrapper } = wrapperFactory()

    const firstInput = { ...baseInput, selectedSceneId: 'scene-midnight-platform' }
    const secondInput = { ...baseInput, selectedSceneId: 'scene-ticket-window' }

    const hook = renderHook(({ input }) => useChapterStructureWorkspaceQuery(input, client), {
      initialProps: { input: firstInput },
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace?.selectedSceneId).toBe('scene-midnight-platform')
    expect(hook.result.current.workspace?.inspector.selectedSceneBrief?.title).toBe('Midnight Platform')
    expect(getChapterStructureWorkspace).toHaveBeenCalledTimes(1)
    expect(getChapterStructureWorkspace).toHaveBeenCalledWith({ chapterId: 'chapter-signals-in-rain' })

    hook.rerender({ input: secondInput })

    await waitFor(() => {
      expect(hook.result.current.workspace?.selectedSceneId).toBe('scene-ticket-window')
    })

    expect(hook.result.current.workspace?.inspector.selectedSceneBrief?.title).toBe('Ticket Window')
    expect(getChapterStructureWorkspace).toHaveBeenCalledTimes(1)
  })

  it('falls back invalid selectedSceneId values to the first scene without changing the query key', async () => {
    const getChapterStructureWorkspace = vi.fn(createChapterClient().getChapterStructureWorkspace)
    const client = {
      getChapterStructureWorkspace,
    }
    const { wrapper } = wrapperFactory()

    const hook = renderHook(
      () =>
        useChapterStructureWorkspaceQuery(
          {
            ...baseInput,
            selectedSceneId: 'scene-does-not-exist',
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

    expect(hook.result.current.workspace?.selectedSceneId).toBe('scene-midnight-platform')
    expect(hook.result.current.workspace?.inspector.selectedSceneBrief?.title).toBe('Midnight Platform')
    expect(getChapterStructureWorkspace).toHaveBeenCalledTimes(1)
  })

  it('surfaces missing chapters as an empty workspace result without throwing', async () => {
    const { wrapper } = wrapperFactory()

    const hook = renderHook(() => useChapterStructureWorkspaceQuery({ chapterId: 'unknown-chapter' }), {
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace).toBeNull()
    expect(hook.result.current.error).toBeNull()
  })

  it('re-localizes the same cached raw record on locale change without refetching the chapter query', async () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'en')

    const getChapterStructureWorkspace = vi.fn(createChapterClient().getChapterStructureWorkspace)
    const client = {
      getChapterStructureWorkspace,
    }
    const { wrapper, setLocale } = wrapperFactory()

    const hook = renderHook(() => useChapterStructureWorkspaceQuery(baseInput, client), {
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.workspace?.title).toBe('Signals in Rain')
    })

    expect(hook.result.current.workspace?.inspector.selectedSceneBrief?.title).toBe('Midnight Platform')
    expect(getChapterStructureWorkspace).toHaveBeenCalledTimes(1)

    setLocale('zh-CN')

    await waitFor(() => {
      expect(hook.result.current.workspace?.title).toBe('雨中信号')
    })

    expect(hook.result.current.workspace?.inspector.selectedSceneBrief?.title).toBe('午夜站台')
    expect(hook.result.current.workspace?.scenes[0]?.title).toBe('午夜站台')
    expect(getChapterStructureWorkspace).toHaveBeenCalledTimes(1)
  })
})
