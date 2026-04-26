import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { createBookClient, type BookClient } from '@/features/book/api/book-client'
import { mockBookRecordSeeds } from '@/features/book/api/mock-book-db'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import { createChapterClient } from '@/features/chapter/api/chapter-client'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import { createSceneClient } from '@/features/scene/api/scene-client'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import { useBookDraftWorkspaceQuery } from './useBookDraftWorkspaceQuery'

function createWrapper(runtime = createMockProjectRuntime({
  persistence: {
    async loadProjectSnapshot() {
      return null
    },
    async saveProjectSnapshot() {},
    async clearProjectSnapshot() {},
  },
})) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }
}

function createWrapperWithoutRuntime() {
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

describe('useBookDraftWorkspaceQuery', () => {
  it('supports explicit source deps without a runtime provider', async () => {
    const baseBookClient = createBookClient()
    const baseChapterClient = createChapterClient()
    const baseSceneClient = createSceneClient()
    const bookClient = {
      getBookStructureRecord: vi.fn(baseBookClient.getBookStructureRecord),
    } satisfies Pick<BookClient, 'getBookStructureRecord'>
    const chapterClient = {
      getChapterStructureWorkspace: vi.fn(baseChapterClient.getChapterStructureWorkspace),
    } satisfies Pick<ChapterClient, 'getChapterStructureWorkspace'>
    const sceneClient = {
      getSceneProse: vi.fn(baseSceneClient.getSceneProse),
    } satisfies Pick<SceneClient, 'getSceneProse'>
    const traceabilitySceneClient = {
      getSceneExecution: vi.fn(baseSceneClient.getSceneExecution),
      getSceneProse: vi.fn(baseSceneClient.getSceneProse),
      getSceneInspector: vi.fn(baseSceneClient.getSceneInspector),
      previewAcceptedPatch: vi.fn(baseSceneClient.previewAcceptedPatch),
    }

    const hook = renderHook(
      () =>
        useBookDraftWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            selectedChapterId: 'chapter-signals-in-rain',
          },
          {
            bookClient,
            chapterClient,
            sceneClient,
            traceabilitySceneClient,
          },
        ),
      {
        wrapper: createWrapperWithoutRuntime(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.workspace?.bookId).toBe('book-signal-arc')
    expect(bookClient.getBookStructureRecord).toHaveBeenCalledWith({ bookId: 'book-signal-arc' })
    expect(chapterClient.getChapterStructureWorkspace).toHaveBeenCalled()
    expect(sceneClient.getSceneProse).toHaveBeenCalled()
    expect(traceabilitySceneClient.getSceneExecution).toHaveBeenCalled()
  })

  it('uses project runtime book, chapter, and scene clients when deps are omitted', async () => {
    const baseBookClient = createBookClient()
    const baseChapterClient = createChapterClient()
    const baseSceneClient = createSceneClient()
    const trackedBookClient = {
      ...baseBookClient,
      getBookStructureRecord: vi.fn(baseBookClient.getBookStructureRecord),
    } satisfies BookClient
    const trackedChapterClient = {
      ...baseChapterClient,
      getChapterStructureWorkspace: vi.fn(baseChapterClient.getChapterStructureWorkspace),
    } satisfies ChapterClient
    const trackedSceneClient = {
      ...baseSceneClient,
      getSceneExecution: vi.fn(baseSceneClient.getSceneExecution),
      getSceneProse: vi.fn(baseSceneClient.getSceneProse),
      getSceneInspector: vi.fn(baseSceneClient.getSceneInspector),
      previewAcceptedPatch: vi.fn(baseSceneClient.previewAcceptedPatch),
    }
    const runtime = createMockProjectRuntime({
      bookClient: trackedBookClient,
      chapterClient: trackedChapterClient,
      sceneClient: trackedSceneClient,
      traceabilitySceneClient: trackedSceneClient,
      persistence: {
        async loadProjectSnapshot() {
          return null
        },
        async saveProjectSnapshot() {},
        async clearProjectSnapshot() {},
      },
    })

    const hook = renderHook(
      () =>
        useBookDraftWorkspaceQuery({
          bookId: 'book-signal-arc',
          selectedChapterId: 'chapter-signals-in-rain',
        }),
      {
        wrapper: createWrapper(runtime),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.workspace?.bookId).toBe('book-signal-arc')
    expect(trackedBookClient.getBookStructureRecord).toHaveBeenCalledWith({ bookId: 'book-signal-arc' })
    expect(trackedChapterClient.getChapterStructureWorkspace).toHaveBeenCalled()
    expect(trackedSceneClient.getSceneProse).toHaveBeenCalled()
  })

  it('assembles chapters and scene sections in book order while deriving manuscript readiness and dock summary', async () => {
    const hook = renderHook(
      () =>
        useBookDraftWorkspaceQuery({
          bookId: 'book-signal-arc',
          selectedChapterId: 'chapter-missing',
        }),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.workspace).toMatchObject({
      bookId: 'book-signal-arc',
      title: 'Signal Arc',
      selectedChapterId: 'chapter-signals-in-rain',
      selectedChapter: expect.objectContaining({
        chapterId: 'chapter-signals-in-rain',
      }),
      draftedChapterCount: expect.any(Number),
      missingDraftChapterCount: expect.any(Number),
      assembledWordCount: expect.any(Number),
      inspector: expect.objectContaining({
        selectedChapter: expect.objectContaining({
          chapterId: 'chapter-signals-in-rain',
        }),
        readiness: expect.objectContaining({
          draftedChapterCount: expect.any(Number),
          missingDraftChapterCount: expect.any(Number),
          assembledWordCount: expect.any(Number),
        }),
      }),
      dockSummary: expect.objectContaining({
        missingDraftChapterCount: expect.any(Number),
        missingTraceChapterCount: expect.any(Number),
        warningsChapterCount: expect.any(Number),
      }),
    })

    expect(hook.result.current.workspace?.chapters.map((chapter) => chapter.chapterId)).toEqual([
      'chapter-signals-in-rain',
      'chapter-open-water-signals',
    ])
    expect(hook.result.current.workspace?.chapters[0]?.sections.map((section) => section.sceneId)).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
      'scene-departure-bell',
    ])
    expect(hook.result.current.workspace?.chapters[1]?.sections.map((section) => section.sceneId)).toEqual([
      'scene-warehouse-bridge',
      'scene-canal-watch',
      'scene-dawn-slip',
    ])
    expect(
      hook.result.current.workspace?.chapters.some((chapter) =>
        chapter.sections.some((section) => section.isMissingDraft),
      ),
    ).toBe(true)
  })

  it('assembles accepted current prose, revised prose, and explicit draft gaps through the shared book draft propagation chain', async () => {
    const bookClient: Pick<BookClient, 'getBookStructureRecord'> = {
      async getBookStructureRecord() {
        return structuredClone(mockBookRecordSeeds['book-signal-arc'])
      },
    }
    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace({ chapterId }) {
        return structuredClone(mockChapterRecordSeeds[chapterId]!)
      },
    }
    const sceneProseBySceneId: Record<string, SceneProseViewModel> = {
      'scene-midnight-platform': {
        sceneId: 'scene-midnight-platform',
        proseDraft: 'Accepted platform prose now reflects the selected review variant.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Accepted review decision propagated the selected platform variant.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 9,
        statusLabel: 'Accepted variant propagated',
      },
      'scene-concourse-delay': {
        sceneId: 'scene-concourse-delay',
        proseDraft: 'Edited concourse prose keeps the witness pressure visible after acceptance.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Accept-with-edit preserved the revised witness handoff wording.',
        warningsCount: 1,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 10,
        statusLabel: 'Accepted with edit',
      },
      'scene-ticket-window': {
        sceneId: 'scene-ticket-window',
        proseDraft: 'Ticket-window prose now carries the revised courier reveal.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Current prose now includes the revised courier reveal.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 8,
        statusLabel: 'Ready',
      },
      'scene-departure-bell': {
        sceneId: 'scene-departure-bell',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'No prose artifact has been materialized for this scene yet.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 1,
        statusLabel: 'Waiting for prose artifact',
      },
      'scene-warehouse-bridge': {
        sceneId: 'scene-warehouse-bridge',
        proseDraft: 'Warehouse bridge prose holds the accepted dock-side handoff.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Dock-side handoff accepted into the current manuscript.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 8,
        statusLabel: 'Ready',
      },
      'scene-canal-watch': {
        sceneId: 'scene-canal-watch',
        proseDraft: 'Canal watch prose remains unchanged in the current draft.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'No compare deltas for canal watch.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 9,
        statusLabel: 'Ready',
      },
      'scene-dawn-slip': {
        sceneId: 'scene-dawn-slip',
        proseDraft: 'Dawn slip prose now lands the revised harbor exit beat.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Revised harbor exit beat is now part of the manuscript.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 10,
        statusLabel: 'Ready',
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneProse'> = {
      async getSceneProse(sceneId) {
        return structuredClone(sceneProseBySceneId[sceneId]!)
      },
    }

    const hook = renderHook(
      () =>
        useBookDraftWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            selectedChapterId: 'chapter-signals-in-rain',
          },
          {
            bookClient,
            chapterClient,
            sceneClient,
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.workspace).toMatchObject({
      bookId: 'book-signal-arc',
      selectedChapterId: 'chapter-signals-in-rain',
      draftedChapterCount: 2,
      missingDraftChapterCount: 1,
      assembledWordCount: 54,
      inspector: {
        selectedChapter: {
          chapterId: 'chapter-signals-in-rain',
          draftedSceneCount: 3,
          missingDraftCount: 1,
          assembledWordCount: 27,
        },
        readiness: {
          draftedChapterCount: 2,
          missingDraftChapterCount: 1,
          assembledWordCount: 54,
        },
      },
    })
    expect(hook.result.current.workspace?.chapters.map((chapter) => chapter.chapterId)).toEqual([
      'chapter-signals-in-rain',
      'chapter-open-water-signals',
    ])
    expect(hook.result.current.workspace?.chapters[0]?.sections.map((section) => section.sceneId)).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
      'scene-departure-bell',
    ])
    expect(hook.result.current.workspace?.chapters[0]?.sections[0]).toMatchObject({
      sceneId: 'scene-midnight-platform',
      proseDraft: 'Accepted platform prose now reflects the selected review variant.',
      latestDiffSummary: 'Accepted review decision propagated the selected platform variant.',
      isMissingDraft: false,
    })
    expect(hook.result.current.workspace?.chapters[0]?.sections[1]).toMatchObject({
      sceneId: 'scene-concourse-delay',
      proseDraft: 'Edited concourse prose keeps the witness pressure visible after acceptance.',
      latestDiffSummary: 'Accept-with-edit preserved the revised witness handoff wording.',
      isMissingDraft: false,
    })
    expect(hook.result.current.workspace?.chapters[0]?.sections[3]).toMatchObject({
      sceneId: 'scene-departure-bell',
      proseDraft: undefined,
      draftWordCount: undefined,
      isMissingDraft: true,
      latestDiffSummary: 'No prose artifact has been materialized for this scene yet.',
    })
  })

  it('stays loading until shared sources are fully ready and does not materialize a partial draft workspace', async () => {
    let resolveSlowScene: ((value: SceneProseViewModel) => void) | undefined
    const slowScenePromise = new Promise<SceneProseViewModel>((resolve) => {
      resolveSlowScene = resolve
    })

    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace({ chapterId }) {
        return structuredClone(mockChapterRecordSeeds[chapterId]!)
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneProse'> = {
      async getSceneProse(sceneId) {
        if (sceneId === 'scene-canal-watch') {
          return slowScenePromise
        }

        return {
          sceneId,
          proseDraft: `${sceneId} prose`,
          revisionModes: ['rewrite'],
          latestDiffSummary: `${sceneId} diff`,
          warningsCount: 0,
          focusModeAvailable: true,
          revisionQueueCount: 0,
          draftWordCount: 2,
          statusLabel: 'Ready',
        }
      },
    }

    const hook = renderHook(
      () =>
        useBookDraftWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            selectedChapterId: 'chapter-open-water-signals',
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(true)
    })

    expect(hook.result.current.workspace).toBeUndefined()
    expect(hook.result.current.error).toBeNull()

    resolveSlowScene?.({
      sceneId: 'scene-canal-watch',
      proseDraft: 'scene-canal-watch prose',
      revisionModes: ['rewrite'],
      latestDiffSummary: 'scene-canal-watch diff',
      warningsCount: 0,
      focusModeAvailable: true,
      revisionQueueCount: 0,
      draftWordCount: 2,
      statusLabel: 'Ready',
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.workspace?.selectedChapterId).toBe('chapter-open-water-signals')
  })

  it('surfaces a prose fetch failure as a real error instead of degrading into missing-draft UI', async () => {
    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace({ chapterId }) {
        return structuredClone(mockChapterRecordSeeds[chapterId]!)
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneProse'> = {
      async getSceneProse(sceneId) {
        if (sceneId === 'scene-canal-watch') {
          throw new Error('Scene prose unavailable')
        }

        return {
          sceneId,
          proseDraft: `${sceneId} prose`,
          revisionModes: ['rewrite'],
          latestDiffSummary: `${sceneId} diff`,
          warningsCount: 0,
          focusModeAvailable: true,
          revisionQueueCount: 0,
          draftWordCount: 2,
          statusLabel: 'Ready',
        }
      },
    }

    const hook = renderHook(
      () =>
        useBookDraftWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            selectedChapterId: 'chapter-open-water-signals',
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace).toBeUndefined()
    expect(hook.result.current.error).toBeInstanceOf(Error)
    expect(hook.result.current.error?.message).toContain('Scene prose unavailable')
  })
})
