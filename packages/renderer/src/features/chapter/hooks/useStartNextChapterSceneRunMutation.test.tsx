import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import { runQueryKeys } from '@/features/run/hooks/run-query-keys'
import { createChapterClient } from '../api/chapter-client'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import { useStartNextChapterSceneRunMutation } from './useStartNextChapterSceneRunMutation'

function clone<T>(value: T): T {
  return structuredClone(value)
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useStartNextChapterSceneRunMutation', () => {
  it('starts the next chapter scene run and updates chapter/run cache truth', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(seedRecord).not.toBeNull()
    if (!seedRecord) {
      return
    }

    queryClient.setQueryData(chapterQueryKeys.workspace('chapter-signals-in-rain'), seedRecord)
    const returnedChapter: ChapterStructureWorkspaceRecord = {
      ...clone(seedRecord),
      scenes: seedRecord.scenes.map((scene) => (
        scene.id === 'scene-concourse-delay'
          ? {
              ...scene,
              backlogStatus: 'needs_review',
              runStatusLabel: {
                en: 'Run waiting for review',
                'zh-CN': 'Run waiting for review',
              },
            }
          : scene
      )),
    }
    const returnedRun = {
      id: 'run-scene-concourse-delay-chapter-next',
      scope: 'scene' as const,
      scopeId: 'scene-concourse-delay',
      status: 'waiting_review' as const,
      title: 'scene-concourse-delay run',
      summary: 'Waiting for review: Advance the next chapter scene.',
      startedAtLabel: '2026-04-23 10:01',
      pendingReviewId: 'review-scene-concourse-delay-chapter-next',
      latestEventId: 'run-event-scene-concourse-delay-chapter-next-009',
      eventCount: 9,
    }
    const client = {
      startNextChapterSceneRun: vi.fn(async () => ({
        chapter: returnedChapter,
        run: returnedRun,
        selectedScene: {
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-concourse-delay',
          order: 2,
          title: {
            en: 'Concourse Delay',
            'zh-CN': '候车厅延误',
          },
          backlogStatus: 'planned' as const,
        },
      })),
    }
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const hook = renderHook(
      () =>
        useStartNextChapterSceneRunMutation({
          chapterId: 'chapter-signals-in-rain',
          projectId: 'project-1',
          client,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        locale: 'en',
        mode: 'continue',
        note: 'Advance the next chapter scene.',
      })
    })

    expect(client.startNextChapterSceneRun).toHaveBeenCalledWith({
      chapterId: 'chapter-signals-in-rain',
      locale: 'en',
      mode: 'continue',
      note: 'Advance the next chapter scene.',
    })
    expect(queryClient.getQueryData(chapterQueryKeys.workspace('chapter-signals-in-rain'))).toEqual(returnedChapter)
    expect(queryClient.getQueryData(runQueryKeys.detail('project-1', returnedRun.id))).toEqual(returnedRun)

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: chapterQueryKeys.workspace('chapter-signals-in-rain'),
        refetchType: 'active',
      })
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sceneQueryKeys.workspace('scene-concourse-delay'),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: sceneQueryKeys.execution('scene-concourse-delay'),
      refetchType: 'active',
    })
  })
})
