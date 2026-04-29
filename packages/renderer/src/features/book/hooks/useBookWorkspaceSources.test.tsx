import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ApiRequestError, ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'

import { useBookWorkspaceSources } from './useBookWorkspaceSources'

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
          <ProjectRuntimeProvider runtime={runtime}>
            {children}
          </ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('useBookWorkspaceSources', () => {
  it('collects ordered chapter workspaces, ordered scene prose, and trace rollups from shared book sources', async () => {
    const hook = renderHook(() => useBookWorkspaceSources({ bookId: 'book-signal-arc' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.bookRecord).toMatchObject({
      bookId: 'book-signal-arc',
      chapterIds: ['chapter-signals-in-rain', 'chapter-open-water-signals'],
    })
    expect(hook.result.current.orderedChapterIds).toEqual([
      'chapter-signals-in-rain',
      'chapter-open-water-signals',
    ])
    expect(hook.result.current.chapterWorkspacesById['chapter-signals-in-rain']).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
    })
    expect(hook.result.current.chapterWorkspacesById['chapter-open-water-signals']).toMatchObject({
      chapterId: 'chapter-open-water-signals',
    })
    expect(hook.result.current.orderedSceneIds).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
      'scene-departure-bell',
      'scene-warehouse-bridge',
      'scene-canal-watch',
      'scene-dawn-slip',
    ])
    expect(hook.result.current.sceneProseBySceneId['scene-midnight-platform']).toMatchObject({
      sceneId: 'scene-midnight-platform',
      proseDraft: expect.any(String),
    })
    expect(hook.result.current.sceneProseBySceneId['scene-dawn-slip']).toMatchObject({
      sceneId: 'scene-dawn-slip',
    })
    expect(hook.result.current.traceRollupsBySceneId['scene-midnight-platform']).toMatchObject({
      sceneId: 'scene-midnight-platform',
      acceptedFactCount: expect.any(Number),
      sourceProposalCount: expect.any(Number),
    })
  })

  it('ignores matching missing-scene prose failures so the shared book sources stay usable', async () => {
    const baseRuntime = createMockProjectRuntime()
    const runtime = createMockProjectRuntime({
      persistence: {
        async loadProjectSnapshot() {
          return null
        },
        async saveProjectSnapshot() {},
        async clearProjectSnapshot() {},
      },
      sceneClient: {
        ...baseRuntime.sceneClient,
        async getSceneProse(sceneId) {
          if (sceneId === 'scene-concourse-delay') {
            throw new ApiRequestError({
              status: 404,
              code: 'SCENE_NOT_FOUND',
              message: `Scene ${sceneId} was not found.`,
              detail: { sceneId },
            })
          }

          return baseRuntime.sceneClient.getSceneProse(sceneId)
        },
      },
      traceabilitySceneClient: {
        ...baseRuntime.traceabilitySceneClient,
        async getSceneProse(sceneId) {
          if (sceneId === 'scene-concourse-delay') {
            throw new ApiRequestError({
              status: 404,
              code: 'SCENE_NOT_FOUND',
              message: `Scene ${sceneId} was not found.`,
              detail: { sceneId },
            })
          }

          return baseRuntime.traceabilitySceneClient.getSceneProse(sceneId)
        },
        async getSceneExecution(sceneId) {
          if (sceneId === 'scene-concourse-delay') {
            throw new ApiRequestError({
              status: 404,
              code: 'SCENE_NOT_FOUND',
              message: `Scene ${sceneId} was not found.`,
              detail: { sceneId },
            })
          }

          return baseRuntime.traceabilitySceneClient.getSceneExecution(sceneId)
        },
        async getSceneInspector(sceneId) {
          if (sceneId === 'scene-concourse-delay') {
            throw new ApiRequestError({
              status: 404,
              code: 'SCENE_NOT_FOUND',
              message: `Scene ${sceneId} was not found.`,
              detail: { sceneId },
            })
          }

          return baseRuntime.traceabilitySceneClient.getSceneInspector(sceneId)
        },
        async previewAcceptedPatch(sceneId) {
          if (sceneId === 'scene-concourse-delay') {
            throw new ApiRequestError({
              status: 404,
              code: 'SCENE_NOT_FOUND',
              message: `Scene ${sceneId} was not found.`,
              detail: { sceneId },
            })
          }

          return baseRuntime.traceabilitySceneClient.previewAcceptedPatch(sceneId)
        },
      },
    })
    const hook = renderHook(() => useBookWorkspaceSources({ bookId: 'book-signal-arc' }), {
      wrapper: createWrapper(runtime),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.sceneProseStateBySceneId['scene-concourse-delay']).toMatchObject({
      prose: undefined,
      error: null,
    })
    expect(hook.result.current.traceRollupsBySceneId['scene-concourse-delay']).toBeNull()
  })

  it('does not ignore scene 404s when the runtime does not report explicit SCENE_NOT_FOUND semantics', async () => {
    const baseRuntime = createMockProjectRuntime()
    const runtime = createMockProjectRuntime({
      persistence: {
        async loadProjectSnapshot() {
          return null
        },
        async saveProjectSnapshot() {},
        async clearProjectSnapshot() {},
      },
      sceneClient: {
        ...baseRuntime.sceneClient,
        async getSceneProse(sceneId) {
          if (sceneId === 'scene-concourse-delay') {
            throw new ApiRequestError({
              status: 404,
              message: `Scene ${sceneId} was not found.`,
              detail: { sceneId },
            })
          }

          return baseRuntime.sceneClient.getSceneProse(sceneId)
        },
      },
      traceabilitySceneClient: baseRuntime.traceabilitySceneClient,
    })
    const hook = renderHook(() => useBookWorkspaceSources({ bookId: 'book-signal-arc' }), {
      wrapper: createWrapper(runtime),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeInstanceOf(Error)
    expect(hook.result.current.error?.message).toContain('scene-concourse-delay')
  })
})
