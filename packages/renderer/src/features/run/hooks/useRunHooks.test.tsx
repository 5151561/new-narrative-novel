import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { ProjectRuntime } from '@/app/project-runtime'
import { ApiRequestError, createProjectRuntimeTestWrapper, createTestProjectRuntime } from '@/app/project-runtime'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunEventsPageRecord, RunRecord, StartSceneRunInput, SubmitRunReviewDecisionInput } from '@/features/run/api/run-records'

import { runQueryKeys } from './run-query-keys'
import { useRunEventsQuery } from './useRunEventsQuery'
import { useRunQuery } from './useRunQuery'
import { useStartSceneRunMutation } from './useStartSceneRunMutation'
import { useSubmitRunReviewDecisionMutation } from './useSubmitRunReviewDecisionMutation'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createRunRecord(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    id: 'run-scene-midnight-platform-002',
    scope: 'scene',
    scopeId: 'scene-midnight-platform',
    status: 'waiting_review',
    title: 'Midnight Platform run',
    summary: 'Waiting for review.',
    startedAtLabel: '2026-04-21 10:00',
    completedAtLabel: undefined,
    pendingReviewId: 'review-scene-midnight-platform-002',
    latestEventId: 'run-event-scene-midnight-platform-002-005',
    eventCount: 5,
    ...overrides,
  }
}

function createRunEventsPage(overrides: Partial<RunEventsPageRecord> = {}): RunEventsPageRecord {
  return {
    runId: 'run-scene-midnight-platform-001',
    events: [
      {
        id: 'run-event-scene-midnight-platform-001-004',
        runId: 'run-scene-midnight-platform-001',
        order: 4,
        kind: 'agent_invocation_started',
        label: 'Agent invocation started',
        summary: 'Planner agent started.',
        createdAtLabel: '2026-04-21 10:04',
      },
    ],
    nextCursor: 'run-event-scene-midnight-platform-001-004',
    ...overrides,
  }
}

function createRuntimeWithRunClient(runClient: RunClient, projectId = 'book-signal-arc'): ProjectRuntime {
  return {
    ...createTestProjectRuntime(),
    projectId,
    runClient,
  }
}

function createRunClientStub(overrides: Partial<RunClient> = {}): RunClient {
  return {
    startSceneRun: vi.fn(),
    getRun: vi.fn(),
    getRunEvents: vi.fn(),
    submitRunReviewDecision: vi.fn(),
    listRunArtifacts: vi.fn(),
    getRunArtifact: vi.fn(),
    getRunTrace: vi.fn(),
    ...overrides,
  }
}

function createQueryClientWrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('run hooks', () => {
  it('useRunQuery reads run detail through runtime.runClient', async () => {
    const queryClient = createQueryClient()
    const runClient = createRunClientStub({
      getRun: vi.fn(async () => createRunRecord({ id: 'run-scene-midnight-platform-001' })),
    })

    const hook = renderHook(() => useRunQuery('run-scene-midnight-platform-001'), {
      wrapper: createProjectRuntimeTestWrapper({
        runtime: createRuntimeWithRunClient(runClient),
        queryClient,
      }),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(runClient.getRun).toHaveBeenCalledWith({ runId: 'run-scene-midnight-platform-001' })
    expect(hook.result.current.run).toMatchObject({
      id: 'run-scene-midnight-platform-001',
    })
    expect(queryClient.getQueryData(runQueryKeys.detail('book-signal-arc', 'run-scene-midnight-platform-001'))).toMatchObject({
      id: 'run-scene-midnight-platform-001',
    })
  })

  it('useRunQuery works without ProjectRuntimeProvider when explicit client and projectId are supplied', async () => {
    const queryClient = createQueryClient()
    const client = {
      getRun: vi.fn(async () => createRunRecord({ id: 'run-scene-midnight-platform-standalone' })),
    }

    const hook = renderHook(
      () =>
        useRunQuery('run-scene-midnight-platform-standalone', {
          client,
          projectId: 'project-standalone',
        }),
      {
        wrapper: createQueryClientWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(client.getRun).toHaveBeenCalledWith({ runId: 'run-scene-midnight-platform-standalone' })
    expect(
      queryClient.getQueryData(runQueryKeys.detail('project-standalone', 'run-scene-midnight-platform-standalone')),
    ).toMatchObject({
      id: 'run-scene-midnight-platform-standalone',
    })
  })

  it('useRunEventsQuery preserves cursored pages without merging them', async () => {
    const queryClient = createQueryClient()
    const page = createRunEventsPage()
    const runClient = createRunClientStub({
      getRunEvents: vi.fn(async () => page),
    })

    const hook = renderHook(
      () =>
        useRunEventsQuery({
          runId: 'run-scene-midnight-platform-001',
          cursor: 'run-event-scene-midnight-platform-001-003',
        }),
      {
        wrapper: createProjectRuntimeTestWrapper({
          runtime: createRuntimeWithRunClient(runClient),
          queryClient,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(runClient.getRunEvents).toHaveBeenCalledWith({
      runId: 'run-scene-midnight-platform-001',
      cursor: 'run-event-scene-midnight-platform-001-003',
    })
    expect(hook.result.current.page).toEqual(page)
    expect(
      queryClient.getQueryData(
        runQueryKeys.eventsPage('book-signal-arc', 'run-scene-midnight-platform-001', 'run-event-scene-midnight-platform-001-003'),
      ),
    ).toEqual(page)
  })

  it('useStartSceneRunMutation updates the run detail cache and does not write route state', async () => {
    const queryClient = createQueryClient()
    const startedRun = createRunRecord()
    const firstEventsPage = createRunEventsPage({
      runId: startedRun.id,
      nextCursor: undefined,
    })
    const runClient = createRunClientStub({
      startSceneRun: vi.fn(async (_input: StartSceneRunInput) => startedRun),
      getRunEvents: vi.fn(async () => firstEventsPage),
    })
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    const hook = renderHook(() => useStartSceneRunMutation(), {
      wrapper: createProjectRuntimeTestWrapper({
        runtime: createRuntimeWithRunClient(runClient),
        queryClient,
      }),
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        sceneId: 'scene-midnight-platform',
        mode: 'rewrite',
        note: 'Tighten the ending beat.',
      })
    })

    expect(runClient.startSceneRun).toHaveBeenCalledWith({
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Tighten the ending beat.',
    })
    expect(queryClient.getQueryData(runQueryKeys.detail('book-signal-arc', startedRun.id))).toEqual(startedRun)
    expect(runClient.getRunEvents).toHaveBeenCalledWith({
      runId: startedRun.id,
      cursor: undefined,
    })
    expect(replaceStateSpy).not.toHaveBeenCalled()
    expect(pushStateSpy).not.toHaveBeenCalled()
  })

  it('useStartSceneRunMutation classifies write failures', async () => {
    const queryClient = createQueryClient()
    const error = new ApiRequestError({
      status: 409,
      message: 'Run already waiting for review',
      code: 'run-conflict',
    })
    const runClient = createRunClientStub({
      startSceneRun: vi.fn(async () => {
        throw error
      }),
    })

    const hook = renderHook(
      () =>
        useStartSceneRunMutation({
          client: runClient,
          projectId: 'project-standalone',
        }),
      {
        wrapper: createQueryClientWrapper(queryClient),
      },
    )

    await expect(
      act(async () => {
        await hook.result.current.mutateAsync({ sceneId: 'scene-midnight-platform' })
      }),
    ).rejects.toThrow('Run already waiting for review')

    await waitFor(() => {
      expect(hook.result.current.errorState).toMatchObject({
        kind: 'conflict',
        message: 'Run already waiting for review',
        code: 'run-conflict',
      })
    })
  })

  it('useStartSceneRunMutation separates project-scoped run caches under one QueryClient', async () => {
    const queryClient = createQueryClient()
    const sharedRunId = 'run-shared'
    const projectOneRun = createRunRecord({ id: sharedRunId, title: 'Project one run' })
    const projectTwoRun = createRunRecord({ id: sharedRunId, title: 'Project two run' })
    const firstEventsPage = createRunEventsPage({ runId: sharedRunId, nextCursor: undefined })

    const projectOneClient = {
      startSceneRun: vi.fn(async () => projectOneRun),
      getRunEvents: vi.fn(async () => firstEventsPage),
    }
    const projectTwoClient = {
      startSceneRun: vi.fn(async () => projectTwoRun),
      getRunEvents: vi.fn(async () => firstEventsPage),
    }

    const projectOneHook = renderHook(
      () => useStartSceneRunMutation({ client: projectOneClient, projectId: 'project-one' }),
      { wrapper: createQueryClientWrapper(queryClient) },
    )
    const projectTwoHook = renderHook(
      () => useStartSceneRunMutation({ client: projectTwoClient, projectId: 'project-two' }),
      { wrapper: createQueryClientWrapper(queryClient) },
    )

    await act(async () => {
      await projectOneHook.result.current.mutateAsync({ sceneId: 'scene-midnight-platform' })
      await projectTwoHook.result.current.mutateAsync({ sceneId: 'scene-midnight-platform' })
    })

    expect(queryClient.getQueryData(runQueryKeys.detail('project-one', sharedRunId))).toEqual(projectOneRun)
    expect(queryClient.getQueryData(runQueryKeys.detail('project-two', sharedRunId))).toEqual(projectTwoRun)
  })

  it('useSubmitRunReviewDecisionMutation updates run detail, invalidates run events/artifacts/trace, and avoids route writes', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const previousRun = createRunRecord({
      id: 'run-scene-midnight-platform-001',
      latestEventId: 'run-event-scene-midnight-platform-001-009',
      eventCount: 9,
    })
    const completedRun = createRunRecord({
      id: 'run-scene-midnight-platform-001',
      status: 'completed',
      summary: 'Accepted and applied.',
      pendingReviewId: undefined,
      completedAtLabel: '2026-04-21 10:20',
      latestEventId: 'run-event-scene-midnight-platform-001-013',
      eventCount: 13,
    })
    queryClient.setQueryData(runQueryKeys.detail('book-signal-arc', previousRun.id), previousRun)
    queryClient.setQueryData(
      runQueryKeys.eventsPage('book-signal-arc', previousRun.id, undefined),
      createRunEventsPage({ runId: previousRun.id }),
    )

    const runClient = createRunClientStub({
      submitRunReviewDecision: vi.fn(async (_input: SubmitRunReviewDecisionInput) => completedRun),
    })
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState')
    const pushStateSpy = vi.spyOn(window.history, 'pushState')

    const hook = renderHook(() => useSubmitRunReviewDecisionMutation(), {
      wrapper: createProjectRuntimeTestWrapper({
        runtime: createRuntimeWithRunClient(runClient),
        queryClient,
      }),
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        runId: previousRun.id,
        reviewId: 'review-scene-midnight-platform-001',
        decision: 'accept',
        note: 'Ship it.',
      })
    })

    expect(queryClient.getQueryData(runQueryKeys.detail('book-signal-arc', previousRun.id))).toEqual(completedRun)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: runQueryKeys.events('book-signal-arc', previousRun.id),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: runQueryKeys.artifacts('book-signal-arc', previousRun.id),
      refetchType: 'active',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: runQueryKeys.trace('book-signal-arc', previousRun.id),
      refetchType: 'active',
    })
    expect(replaceStateSpy).not.toHaveBeenCalled()
    expect(pushStateSpy).not.toHaveBeenCalled()
  })

  it('useSubmitRunReviewDecisionMutation leaves the previous run cache intact on failure', async () => {
    const queryClient = createQueryClient()
    const previousRun = createRunRecord({
      id: 'run-scene-midnight-platform-001',
      latestEventId: 'run-event-scene-midnight-platform-001-009',
      eventCount: 9,
    })
    queryClient.setQueryData(runQueryKeys.detail('book-signal-arc', previousRun.id), previousRun)

    const runClient = createRunClientStub({
      submitRunReviewDecision: vi.fn(async () => {
        throw new ApiRequestError({
          status: 409,
          message: 'Pending review no longer matches',
          code: 'run-review-conflict',
        })
      }),
    })

    const hook = renderHook(() => useSubmitRunReviewDecisionMutation(), {
      wrapper: createProjectRuntimeTestWrapper({
        runtime: createRuntimeWithRunClient(runClient),
        queryClient,
      }),
    })

    await expect(
      act(async () => {
        await hook.result.current.mutateAsync({
          runId: previousRun.id,
          reviewId: 'review-scene-midnight-platform-001',
          decision: 'accept',
        })
      }),
    ).rejects.toThrow('Pending review no longer matches')

    expect(queryClient.getQueryData(runQueryKeys.detail('book-signal-arc', previousRun.id))).toEqual(previousRun)
    await waitFor(() => {
      expect(hook.result.current.errorState).toMatchObject({
        kind: 'conflict',
        code: 'run-review-conflict',
      })
    })
  })
})
