import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { createChapterClient } from '../api/chapter-client'
import { patchChapterRecordScene, reorderChapterRecordScenes } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import { useUpdateChapterSceneStructureMutation } from './useUpdateChapterSceneStructureMutation'

describe('useUpdateChapterSceneStructureMutation', () => {
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

  it('optimistically patches the raw chapter record cache and invalidates the workspace query on settle', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(seedRecord).not.toBeNull()
    queryClient.setQueryData(chapterQueryKeys.workspace('chapter-signals-in-rain'), seedRecord)
    const committedRecord = patchChapterRecordScene(
      seedRecord!,
      'scene-concourse-delay',
      {
        summary: 'Updated optimistic summary',
        conflict: 'Updated optimistic conflict',
      },
      'en',
    )

    const client = {
      getChapterStructureWorkspace: vi.fn(),
      reorderChapterScene: vi.fn(),
      updateChapterSceneStructure: vi.fn().mockResolvedValue(committedRecord),
    }
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const hook = renderHook(
      () =>
        useUpdateChapterSceneStructureMutation({
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
        sceneId: 'scene-concourse-delay',
        locale: 'en',
        patch: {
          summary: 'Updated optimistic summary',
          conflict: 'Updated optimistic conflict',
        },
      })
    })

    expect(
      (
        queryClient.getQueryData(
          chapterQueryKeys.workspace('chapter-signals-in-rain'),
        ) as ChapterStructureWorkspaceRecord
      ).scenes.find((scene) => scene.id === 'scene-concourse-delay'),
    ).toMatchObject({
      summary: {
        en: 'Updated optimistic summary',
        'zh-CN': '人潮阻塞会拖慢离场，但不会解决谁掌控信使线索。',
      },
      conflict: {
        en: 'Updated optimistic conflict',
        'zh-CN': '拥堵拖慢节奏，但 Ren 不能失去主动权。',
      },
    })

    await act(async () => {
      await mutationPromise
    })

    expect(client.updateChapterSceneStructure).toHaveBeenCalledWith({
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-concourse-delay',
      locale: 'en',
      patch: {
        summary: 'Updated optimistic summary',
        conflict: 'Updated optimistic conflict',
      },
    })
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: chapterQueryKeys.workspace('chapter-signals-in-rain'),
        refetchType: 'active',
      })
    })
  })

  it('rolls back the raw chapter record cache when the patch mutation fails', async () => {
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
      reorderChapterScene: vi.fn(),
      updateChapterSceneStructure: vi.fn().mockRejectedValue(new Error('patch failed')),
    }

    const hook = renderHook(
      () =>
        useUpdateChapterSceneStructureMutation({
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
          sceneId: 'scene-concourse-delay',
          locale: 'en',
          patch: {
            summary: 'Should rollback',
          },
        }),
      ),
    ).rejects.toThrow('patch failed')

    expect(
      (
        queryClient.getQueryData(
          chapterQueryKeys.workspace('chapter-signals-in-rain'),
        ) as ChapterStructureWorkspaceRecord
      ).scenes.find((scene) => scene.id === 'scene-concourse-delay'),
    ).toMatchObject({
      summary: {
        en: 'A crowd bottleneck should slow the exit without resolving who controls the courier line.',
        'zh-CN': '人潮阻塞会拖慢离场，但不会解决谁掌控信使线索。',
      },
    })
  })

  it('keeps a later optimistic reorder through an earlier patch settle and refetches after the final settle', async () => {
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

    const patchHook = renderHook(
      () =>
        useUpdateChapterSceneStructureMutation({
          chapterId,
          client: controlledClient.client,
        }),
      { wrapper },
    )

    const reorderModule = await import('./useReorderChapterSceneMutation')
    const reorderHook = renderHook(
      () =>
        reorderModule.useReorderChapterSceneMutation({
          chapterId,
          client: controlledClient.client,
        }),
      { wrapper },
    )

    let patchPromise: Promise<unknown> | undefined
    let reorderPromise: Promise<unknown> | undefined

    await act(async () => {
      patchPromise = patchHook.result.current.mutateAsync({
        sceneId: 'scene-concourse-delay',
        locale: 'en',
        patch: {
          summary: 'Earlier optimistic summary',
        },
      })
    })

    await act(async () => {
      reorderPromise = reorderHook.result.current.mutateAsync({
        sceneId: 'scene-ticket-window',
        targetIndex: 0,
      })
    })

    await act(async () => {
      controlledClient.resolvePatch()
      await patchPromise
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
        ['scene-concourse-delay', 3, 'Earlier optimistic summary'],
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
        ['scene-concourse-delay', 3, 'Earlier optimistic summary'],
        [
          'scene-departure-bell',
          4,
          'The chapter still needs a final bell placement that does not collapse the witness pressure too early.',
        ],
      ])
    })

    await act(async () => {
      controlledClient.resolveReorder()
      await reorderPromise
    })

    await waitFor(() => {
      expect(controlledClient.client.getChapterStructureWorkspace).toHaveBeenCalledTimes(2)
      expect(remountedWorkspaceHook.result.current.data).toEqual(controlledClient.getServerRecord())
    })
  })

  it('does not let a failed earlier patch rollback wipe out a later optimistic reorder', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId: 'chapter-signals-in-rain' })
    expect(seedRecord).not.toBeNull()
    queryClient.setQueryData(chapterQueryKeys.workspace('chapter-signals-in-rain'), seedRecord)

    const patchDeferred = createDeferredPromise()
    const reorderDeferred = createDeferredPromise()
    const patchClient = {
      getChapterStructureWorkspace: vi.fn(),
      reorderChapterScene: vi.fn(),
      updateChapterSceneStructure: vi.fn().mockReturnValue(patchDeferred.promise),
    }
    const reorderClient = {
      getChapterStructureWorkspace: vi.fn(),
      reorderChapterScene: vi.fn().mockReturnValue(reorderDeferred.promise),
      updateChapterSceneStructure: vi.fn(),
    }

    const patchHook = renderHook(
      () =>
        useUpdateChapterSceneStructureMutation({
          chapterId: 'chapter-signals-in-rain',
          client: patchClient,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    const reorderModule = await import('./useReorderChapterSceneMutation')
    const reorderHook = renderHook(
      () =>
        reorderModule.useReorderChapterSceneMutation({
          chapterId: 'chapter-signals-in-rain',
          client: reorderClient,
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    let patchPromise: Promise<unknown> | undefined
    let reorderPromise: Promise<unknown> | undefined

    await act(async () => {
      patchPromise = patchHook.result.current.mutateAsync({
        sceneId: 'scene-concourse-delay',
        locale: 'en',
        patch: {
          summary: 'Earlier optimistic summary',
        },
      })
    })

    await act(async () => {
      reorderPromise = reorderHook.result.current.mutateAsync({
        sceneId: 'scene-ticket-window',
        targetIndex: 0,
      })
    })

    await expect(
      act(async () => {
        patchDeferred.reject(new Error('patch failed'))
        await patchPromise
      }),
    ).rejects.toThrow('patch failed')

    await waitFor(() => {
      expect(
        (
          queryClient.getQueryData(
            chapterQueryKeys.workspace('chapter-signals-in-rain'),
          ) as ChapterStructureWorkspaceRecord
        ).scenes.map((scene) => [scene.id, scene.order, scene.summary.en]),
      ).toEqual([
        ['scene-ticket-window', 1, 'The alias stays offstage while Mei tests whether Ren will trade certainty for speed.'],
        [
          'scene-midnight-platform',
          2,
          'Ren has to lock the bargain before the platform witness turns the ledger into public leverage.',
        ],
        [
          'scene-concourse-delay',
          3,
          'A crowd bottleneck should slow the exit without resolving who controls the courier line.',
        ],
        [
          'scene-departure-bell',
          4,
          'The chapter still needs a final bell placement that does not collapse the witness pressure too early.',
        ],
      ])
    })

    await act(async () => {
      reorderDeferred.resolve(null)
      await reorderPromise
    })
  })
})
