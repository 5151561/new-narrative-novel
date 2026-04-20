import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { createChapterClient } from '../api/chapter-client'
import { patchChapterRecordScene, reorderChapterRecordScenes } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import { useReorderChapterSceneMutation } from './useReorderChapterSceneMutation'

describe('useReorderChapterSceneMutation', () => {
  function clone<T>(value: T): T {
    return structuredClone(value)
  }

  function createDeferredPromise<T>() {
    let resolve: ((value: T) => void) | undefined
    let reject: ((error: Error) => void) | undefined
    const promise = new Promise<T>((nextResolve, nextReject) => {
      resolve = nextResolve
      reject = nextReject
    })

    return {
      promise,
      resolve: (value: T) => resolve?.(value),
      reject: (error: Error) => reject?.(error),
    }
  }

  function createControlledChapterClient(initialRecord: ChapterStructureWorkspaceRecord) {
    let serverRecord = clone(initialRecord)
    let pendingReorderInput: { sceneId: string; targetIndex: number } | null = null
    let pendingPatchInput:
      | {
          sceneId: string
          locale: 'en' | 'zh-CN'
          patch: Partial<Record<'summary' | 'purpose' | 'pov' | 'location' | 'conflict' | 'reveal', string>>
        }
      | null = null

    const reorderDeferred = createDeferredPromise<ChapterStructureWorkspaceRecord | null>()
    const patchDeferred = createDeferredPromise<ChapterStructureWorkspaceRecord | null>()

    return {
      client: {
        getChapterStructureWorkspace: vi.fn(async () => clone(serverRecord)),
        reorderChapterScene: vi.fn(async ({ sceneId, targetIndex }) => {
          pendingReorderInput = { sceneId, targetIndex }
          return reorderDeferred.promise
        }),
        updateChapterSceneStructure: vi.fn(async ({ sceneId, locale, patch }) => {
          pendingPatchInput = { sceneId, locale, patch }
          return patchDeferred.promise
        }),
      },
      resolveReorder() {
        if (!pendingReorderInput) {
          throw new Error('Expected pending reorder mutation')
        }

        serverRecord = reorderChapterRecordScenes(serverRecord, pendingReorderInput.sceneId, pendingReorderInput.targetIndex)
        const committedRecord = clone(serverRecord)
        reorderDeferred.resolve(committedRecord)
        pendingReorderInput = null
        return committedRecord
      },
      resolvePatch() {
        if (!pendingPatchInput) {
          throw new Error('Expected pending patch mutation')
        }

        serverRecord = patchChapterRecordScene(
          serverRecord,
          pendingPatchInput.sceneId,
          pendingPatchInput.patch,
          pendingPatchInput.locale,
        )
        const committedRecord = clone(serverRecord)
        patchDeferred.resolve(committedRecord)
        pendingPatchInput = null
        return committedRecord
      },
      getServerRecord() {
        return clone(serverRecord)
      },
    }
  }

  function createWrapper(
    queryClient: QueryClient,
    runtime = createMockProjectRuntime({
      persistence: {
        async loadProjectSnapshot() {
          return null
        },
        async saveProjectSnapshot() {},
        async clearProjectSnapshot() {},
      },
    }),
  ) {
    return function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
        </QueryClientProvider>
      )
    }
  }

  it('uses the project runtime chapter client when no override is provided', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const baseChapterClient = createChapterClient()
    const seedRecord = await baseChapterClient.getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(seedRecord).not.toBeNull()
    if (!seedRecord) {
      return
    }
    const reorderChapterScene = vi.fn(async ({ sceneId, targetIndex }: { sceneId: string; targetIndex: number }) =>
      reorderChapterRecordScenes(structuredClone(seedRecord), sceneId, targetIndex),
    )
    const runtime = createMockProjectRuntime({
      chapterClient: {
        ...baseChapterClient,
        reorderChapterScene,
      },
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
        useReorderChapterSceneMutation({
          chapterId: 'chapter-signals-in-rain',
        }),
      {
        wrapper: createWrapper(queryClient, runtime),
      },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        sceneId: 'scene-ticket-window',
        targetIndex: 0,
      })
    })

    expect(reorderChapterScene).toHaveBeenCalledWith({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-ticket-window',
      targetIndex: 0,
    })
  })

  it('optimistically reorders the raw chapter record cache and invalidates the workspace query after success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(seedRecord).not.toBeNull()
    queryClient.setQueryData(chapterQueryKeys.workspace('chapter-signals-in-rain'), seedRecord)
    const committedRecord = reorderChapterRecordScenes(seedRecord!, 'scene-ticket-window', 0)

    const client = {
      getChapterStructureWorkspace: vi.fn(),
      reorderChapterScene: vi.fn().mockResolvedValue(committedRecord),
      updateChapterSceneStructure: vi.fn(),
    }
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const hook = renderHook(
      () =>
        useReorderChapterSceneMutation({
          chapterId: 'chapter-signals-in-rain',
          client,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    let mutationPromise: Promise<unknown> | undefined

    await act(async () => {
      mutationPromise = hook.result.current.mutateAsync({
        sceneId: 'scene-ticket-window',
        targetIndex: 0,
      })
    })

    expect(
      (queryClient.getQueryData(
        chapterQueryKeys.workspace('chapter-signals-in-rain'),
      ) as ChapterStructureWorkspaceRecord).scenes.map((scene) => [scene.id, scene.order]),
    ).toEqual([
      ['scene-ticket-window', 1],
      ['scene-midnight-platform', 2],
      ['scene-concourse-delay', 3],
      ['scene-departure-bell', 4],
    ])

    await act(async () => {
      await mutationPromise
    })

    expect(client.reorderChapterScene).toHaveBeenCalledWith({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-ticket-window',
      targetIndex: 0,
    })
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: chapterQueryKeys.workspace('chapter-signals-in-rain'),
        refetchType: 'active',
      })
    })
  })

  it('rolls back the raw chapter record cache when the reorder mutation fails', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(seedRecord).not.toBeNull()
    queryClient.setQueryData(chapterQueryKeys.workspace('chapter-signals-in-rain'), seedRecord)

    const client = {
      getChapterStructureWorkspace: vi.fn(),
      reorderChapterScene: vi.fn().mockRejectedValue(new Error('reorder failed')),
      updateChapterSceneStructure: vi.fn(),
    }

    const hook = renderHook(
      () =>
        useReorderChapterSceneMutation({
          chapterId: 'chapter-signals-in-rain',
          client,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          sceneId: 'scene-ticket-window',
          targetIndex: 0,
        }),
      ),
    ).rejects.toThrow('reorder failed')

    expect(
      (queryClient.getQueryData(
        chapterQueryKeys.workspace('chapter-signals-in-rain'),
      ) as ChapterStructureWorkspaceRecord).scenes.map((scene) => [scene.id, scene.order]),
    ).toEqual([
      ['scene-midnight-platform', 1],
      ['scene-concourse-delay', 2],
      ['scene-ticket-window', 3],
      ['scene-departure-bell', 4],
    ])
  })

  it('keeps a later optimistic patch through an earlier reorder settle and refetches after the final settle', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const chapterId = 'chapter-signals-in-rain'
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId })
    expect(seedRecord).not.toBeNull()
    if (!seedRecord) {
      return
    }

    const controlledClient = createControlledChapterClient(seedRecord)
    const wrapper = createWrapper(queryClient)

    const workspaceHook = renderHook(
      () =>
        useQuery({
          queryKey: chapterQueryKeys.workspace(chapterId),
          queryFn: () => controlledClient.client.getChapterStructureWorkspace({ chapterId }),
          staleTime: Number.POSITIVE_INFINITY,
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(workspaceHook.result.current.data).toEqual(seedRecord)
    })
    expect(controlledClient.client.getChapterStructureWorkspace).toHaveBeenCalledTimes(1)

    const reorderHook = renderHook(
      () =>
        useReorderChapterSceneMutation({
          chapterId,
          client: controlledClient.client,
        }),
      { wrapper },
    )

    const patchModule = await import('./useUpdateChapterSceneStructureMutation')
    const patchHook = renderHook(
      () =>
        patchModule.useUpdateChapterSceneStructureMutation({
          chapterId,
          client: controlledClient.client,
        }),
      { wrapper },
    )

    let reorderPromise: Promise<unknown> | undefined
    let patchPromise: Promise<unknown> | undefined

    await act(async () => {
      reorderPromise = reorderHook.result.current.mutateAsync({
        sceneId: 'scene-ticket-window',
        targetIndex: 0,
      })
    })

    await act(async () => {
      patchPromise = patchHook.result.current.mutateAsync({
        sceneId: 'scene-concourse-delay',
        locale: 'en',
        patch: {
          summary: 'Later optimistic summary',
        },
      })
    })

    await act(async () => {
      controlledClient.resolveReorder()
      await reorderPromise
    })

    await waitFor(() => {
      expect(controlledClient.client.getChapterStructureWorkspace).toHaveBeenCalledTimes(1)
      expect(workspaceHook.result.current.data?.scenes.map((scene) => [scene.id, scene.order, scene.summary.en])).toEqual([
        [
          'scene-ticket-window',
          1,
          'The alias stays offstage while Mei tests whether Ren will trade certainty for speed.',
        ],
        [
          'scene-midnight-platform',
          2,
          'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
        ],
        ['scene-concourse-delay', 3, 'Later optimistic summary'],
        [
          'scene-departure-bell',
          4,
          'The chapter still needs a final bell placement that does not collapse the witness pressure too early.',
        ],
      ])
    })

    workspaceHook.unmount()

    const remountedWorkspaceHook = renderHook(
      () =>
        useQuery({
          queryKey: chapterQueryKeys.workspace(chapterId),
          queryFn: () => controlledClient.client.getChapterStructureWorkspace({ chapterId }),
          staleTime: Number.POSITIVE_INFINITY,
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(controlledClient.client.getChapterStructureWorkspace).toHaveBeenCalledTimes(1)
      expect(remountedWorkspaceHook.result.current.data?.scenes.map((scene) => [scene.id, scene.order, scene.summary.en])).toEqual([
        [
          'scene-ticket-window',
          1,
          'The alias stays offstage while Mei tests whether Ren will trade certainty for speed.',
        ],
        [
          'scene-midnight-platform',
          2,
          'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
        ],
        ['scene-concourse-delay', 3, 'Later optimistic summary'],
        [
          'scene-departure-bell',
          4,
          'The chapter still needs a final bell placement that does not collapse the witness pressure too early.',
        ],
      ])
    })

    await act(async () => {
      controlledClient.resolvePatch()
      await patchPromise
    })

    await waitFor(() => {
      expect(controlledClient.client.getChapterStructureWorkspace).toHaveBeenCalledTimes(2)
      expect(remountedWorkspaceHook.result.current.data).toEqual(controlledClient.getServerRecord())
    })
  })

  it('does not let a failed earlier reorder rollback wipe out a later optimistic scene patch', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(seedRecord).not.toBeNull()
    queryClient.setQueryData(chapterQueryKeys.workspace('chapter-signals-in-rain'), seedRecord)

    const reorderDeferred = createDeferredPromise()
    const patchDeferred = createDeferredPromise()
    const reorderClient = {
      getChapterStructureWorkspace: vi.fn(),
      reorderChapterScene: vi.fn().mockReturnValue(reorderDeferred.promise),
      updateChapterSceneStructure: vi.fn(),
    }
    const patchClient = {
      getChapterStructureWorkspace: vi.fn(),
      reorderChapterScene: vi.fn(),
      updateChapterSceneStructure: vi.fn().mockReturnValue(patchDeferred.promise),
    }

    const reorderHook = renderHook(
      () =>
        useReorderChapterSceneMutation({
          chapterId: 'chapter-signals-in-rain',
          client: reorderClient,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    const patchModule = await import('./useUpdateChapterSceneStructureMutation')
    const patchHook = renderHook(
      () =>
        patchModule.useUpdateChapterSceneStructureMutation({
          chapterId: 'chapter-signals-in-rain',
          client: patchClient,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    let reorderPromise: Promise<unknown> | undefined
    let patchPromise: Promise<unknown> | undefined

    await act(async () => {
      reorderPromise = reorderHook.result.current.mutateAsync({
        sceneId: 'scene-ticket-window',
        targetIndex: 0,
      })
    })

    await act(async () => {
      patchPromise = patchHook.result.current.mutateAsync({
        sceneId: 'scene-concourse-delay',
        locale: 'en',
        patch: {
          summary: 'Later optimistic summary',
        },
      })
    })

    await expect(
      act(async () => {
        reorderDeferred.reject(new Error('reorder failed'))
        await reorderPromise
      }),
    ).rejects.toThrow('reorder failed')

    await waitFor(() => {
      expect(
        (
          queryClient.getQueryData(
            chapterQueryKeys.workspace('chapter-signals-in-rain'),
          ) as ChapterStructureWorkspaceRecord
        ).scenes.map((scene) => [scene.id, scene.order, scene.summary.en]),
      ).toEqual([
        [
          'scene-midnight-platform',
          1,
          'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
        ],
        ['scene-concourse-delay', 2, 'Later optimistic summary'],
        ['scene-ticket-window', 3, 'The alias stays offstage while Mei tests whether Ren will trade certainty for speed.'],
        [
          'scene-departure-bell',
          4,
          'The chapter still needs a final bell placement that does not collapse the witness pressure too early.',
        ],
      ])
    })

    await act(async () => {
      patchDeferred.resolve(null)
      await patchPromise
    })
  })
})
