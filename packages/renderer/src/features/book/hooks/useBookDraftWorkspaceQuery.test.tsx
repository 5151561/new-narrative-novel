import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import { useBookDraftWorkspaceQuery } from './useBookDraftWorkspaceQuery'

function createWrapper() {
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
