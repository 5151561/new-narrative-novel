import type { PropsWithChildren } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProjectRuntimeProvider } from './ProjectRuntimeProvider'
import { ApiRequestError } from './api-transport'
import { createFakeApiRuntime } from './fake-api-runtime.test-utils'
import { runQueryKeys } from '@/features/run/hooks/run-query-keys'
import { useRunEventsQuery } from '@/features/run/hooks/useRunEventsQuery'
import { useStartSceneRunMutation } from '@/features/run/hooks/useStartSceneRunMutation'
import { useSubmitRunReviewDecisionMutation } from '@/features/run/hooks/useSubmitRunReviewDecisionMutation'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function createWrapper(
  queryClient: QueryClient,
  runtime: ReturnType<typeof createFakeApiRuntime>['runtime'],
) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
      </QueryClientProvider>
    )
  }
}

describe('api run-slice contract', () => {
  const originalHref = window.location.href

  afterEach(() => {
    window.history.replaceState({}, '', originalHref)
  })

  it('executes run hooks through the API runtime, records run requests, classifies failures, and leaves route state unchanged', async () => {
    const queryClient = createQueryClient()
    const { requests, runtime } = createFakeApiRuntime({
      projectId: 'project-run-contract',
    })
    const wrapper = createWrapper(queryClient, runtime)
    const initialRoute = '/workbench?scope=scene&id=scene-midnight-platform&lens=draft&tab=execution'
    window.history.replaceState({}, '', initialRoute)
    const initialSearch = window.location.search
    const pushStateSpy = vi.spyOn(window.history, 'pushState')
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

    const startHook = renderHook(() => useStartSceneRunMutation(), { wrapper })

    let startedRunId = ''
    let pendingReviewId = ''
    await act(async () => {
      const startedRun = await startHook.result.current.mutateAsync({
        sceneId: 'scene-midnight-platform',
        mode: 'rewrite',
        note: 'Tighten the ending beat.',
      })
      startedRunId = startedRun.id
      pendingReviewId = startedRun.pendingReviewId ?? ''
    })

    expect(startedRunId).toBe('run-scene-midnight-platform-002')
    expect(
      queryClient.getQueryData(runQueryKeys.detail('project-run-contract', startedRunId)),
    ).toMatchObject({
      id: startedRunId,
      pendingReviewId,
    })
    expect(requests).toContainEqual({
      method: 'POST',
      path: '/api/projects/project-run-contract/scenes/scene-midnight-platform/runs',
      body: {
        mode: 'rewrite',
        note: 'Tighten the ending beat.',
      },
    })

    const eventsHook = renderHook(
      () =>
        useRunEventsQuery({
          runId: startedRunId,
          cursor: 'run-event-scene-midnight-platform-002-004',
        }),
      { wrapper },
    )

    await waitFor(() => {
      expect(eventsHook.result.current.isLoading).toBe(false)
    })

    expect(eventsHook.result.current.page).toMatchObject({
      runId: startedRunId,
      nextCursor: 'run-event-scene-midnight-platform-002-008',
    })
    expect(requests).toContainEqual({
      method: 'GET',
      path: '/api/projects/project-run-contract/runs/run-scene-midnight-platform-002/events',
      query: {
        cursor: 'run-event-scene-midnight-platform-002-004',
      },
    })

    const reviewHook = renderHook(() => useSubmitRunReviewDecisionMutation(), { wrapper })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await act(async () => {
      await reviewHook.result.current.mutateAsync({
        runId: startedRunId,
        reviewId: pendingReviewId,
        decision: 'accept',
        note: 'Ship it.',
      })
    })

    expect(
      queryClient.getQueryData(runQueryKeys.detail('project-run-contract', startedRunId)),
    ).toMatchObject({
      id: startedRunId,
      status: 'completed',
      pendingReviewId: undefined,
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: runQueryKeys.events('project-run-contract', startedRunId),
      refetchType: 'active',
    })
    expect(requests).toContainEqual({
      method: 'POST',
      path: '/api/projects/project-run-contract/runs/run-scene-midnight-platform-002/review-decisions',
      body: {
        reviewId: pendingReviewId,
        decision: 'accept',
        note: 'Ship it.',
        patchId: undefined,
      },
    })
    expect(window.location.search).toBe(initialSearch)
    expect(pushStateSpy).not.toHaveBeenCalled()
    expect(replaceStateSpy).not.toHaveBeenCalled()

    const failureRuntime = createFakeApiRuntime({
      projectId: 'project-run-contract',
      overrides: [
        {
          method: 'POST',
          path: '/api/projects/project-run-contract/scenes/scene-midnight-platform/runs',
          body: {
            mode: 'rewrite',
            note: 'Retry the same run.',
          },
          error: new ApiRequestError({
            status: 409,
            message: 'Run already waiting for review',
            code: 'run-conflict',
          }),
        },
      ],
    })
    const failureHook = renderHook(() => useStartSceneRunMutation(), {
      wrapper: createWrapper(createQueryClient(), failureRuntime.runtime),
    })

    await expect(
      act(async () => {
        await failureHook.result.current.mutateAsync({
          sceneId: 'scene-midnight-platform',
          mode: 'rewrite',
          note: 'Retry the same run.',
        })
      }),
    ).rejects.toThrow('Run already waiting for review')

    await waitFor(() => {
      expect(failureHook.result.current.errorState).toMatchObject({
        kind: 'conflict',
        message: 'Run already waiting for review',
        code: 'run-conflict',
      })
    })
  })

  it('restores the previous URL after the test-owned route mutation', () => {
    expect(window.location.href).toBe(originalHref)
  })
})
