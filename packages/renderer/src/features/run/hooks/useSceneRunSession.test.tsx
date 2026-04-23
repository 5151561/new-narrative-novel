import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createProjectRuntimeTestWrapper, createTestProjectRuntime } from '@/app/project-runtime'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunEventsPageRecord, RunRecord, StartSceneRunInput, SubmitRunReviewDecisionInput } from '@/features/run/api/run-records'
import type { SceneClient } from '@/features/scene/api/scene-client'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

import { useSceneRunSession } from './useSceneRunSession'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createRun(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    id: 'run-scene-midnight-platform-001',
    scope: 'scene',
    scopeId: 'scene-midnight-platform',
    status: 'queued',
    title: 'Scene run',
    summary: 'Queued.',
    startedAtLabel: '2026-04-21 10:00',
    completedAtLabel: undefined,
    pendingReviewId: undefined,
    latestEventId: 'run-event-001',
    eventCount: 1,
    ...overrides,
  }
}

function createEventsPage(overrides: Partial<RunEventsPageRecord> = {}): RunEventsPageRecord {
  return {
    runId: 'run-scene-midnight-platform-001',
    events: [],
    nextCursor: undefined,
    ...overrides,
  }
}

function createRunClient(overrides: Partial<RunClient> = {}): RunClient {
  return {
    startSceneRun: vi.fn(async (_input: StartSceneRunInput) => createRun()),
    getRun: vi.fn(async () => createRun()),
    getRunEvents: vi.fn(async () => createEventsPage()),
    submitRunReviewDecision: vi.fn(async (_input: SubmitRunReviewDecisionInput) => createRun({ status: 'completed' })),
    ...overrides,
  }
}

function createWrapper(runClient: RunClient, queryClient: QueryClient, projectId = 'book-signal-arc') {
  return createProjectRuntimeTestWrapper({
    runtime: {
      ...createTestProjectRuntime(),
      projectId,
      runClient,
    },
    queryClient,
  })
}

afterEach(() => {
  vi.useRealTimers()
})

describe('useSceneRunSession', () => {
  it('uses the current scene run surfaces first and derives review submission state', async () => {
    const queryClient = createQueryClient()
    const runClient = createRunClient({
      getRun: vi.fn(async ({ runId }) =>
        createRun({
          id: runId,
          status: 'waiting_review',
          pendingReviewId: 'review-scene-midnight-platform-001',
          summary: 'Waiting for review.',
        }),
      ),
    })

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId: 'run-from-execution-surface',
          latestRunId: 'run-from-workspace-surface',
        }),
      {
        wrapper: createWrapper(runClient, queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.canSubmitDecision).toBe(true)
    })

    expect(runClient.getRun).toHaveBeenCalledWith({
      runId: 'run-from-execution-surface',
    })
    expect(hook.result.current.activeRunId).toBe('run-from-execution-surface')
    expect(hook.result.current.pendingReviewId).toBe('review-scene-midnight-platform-001')
  })

  it('falls back to the newly started run id when the scene has no active run yet', async () => {
    const queryClient = createQueryClient()
    const startedRun = createRun({
      id: 'run-scene-midnight-platform-002',
      status: 'running',
      summary: 'Running.',
    })
    const runClient = createRunClient({
      startSceneRun: vi.fn(async (_input: StartSceneRunInput) => startedRun),
      getRun: vi.fn(async ({ runId }) => createRun({ id: runId, status: 'running', summary: 'Running.' })),
      getRunEvents: vi.fn(async ({ runId }) => createEventsPage({ runId })),
    })

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
        }),
      {
        wrapper: createWrapper(runClient, queryClient),
      },
    )

    expect(hook.result.current.activeRunId).toBeNull()

    await act(async () => {
      await hook.result.current.startRun({
        mode: 'rewrite',
        note: 'Tighten the ending beat.',
      })
    })

    await waitFor(() => {
      expect(hook.result.current.activeRunId).toBe(startedRun.id)
    })

    expect(runClient.startSceneRun).toHaveBeenCalledWith({
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Tighten the ending beat.',
    })
  })

  it('clears the started-run fallback when switching to a different scene session', async () => {
    const queryClient = createQueryClient()
    const startedRun = createRun({
      id: 'run-scene-midnight-platform-002',
      scopeId: 'scene-midnight-platform',
      status: 'running',
      summary: 'Running.',
    })
    const getRun = vi.fn(async ({ runId }) =>
      createRun({
        id: runId,
        scopeId: runId === startedRun.id ? 'scene-midnight-platform' : 'scene-sunrise-harbor',
        status: 'running',
        summary: 'Running.',
      }),
    )
    const getRunEvents = vi.fn(async ({ runId }) => createEventsPage({ runId }))
    const runClient = createRunClient({
      startSceneRun: vi.fn(async (_input: StartSceneRunInput) => startedRun),
      getRun,
      getRunEvents,
    })

    const hook = renderHook(
      ({ sceneId }) =>
        useSceneRunSession({
          sceneId,
        }),
      {
        initialProps: { sceneId: 'scene-midnight-platform' },
        wrapper: createWrapper(runClient, queryClient),
      },
    )

    await act(async () => {
      await hook.result.current.startRun({
        mode: 'rewrite',
      })
    })

    await waitFor(() => {
      expect(hook.result.current.activeRunId).toBe(startedRun.id)
    })

    const getRunCallCountBeforeSwitch = getRun.mock.calls.length
    const getRunEventsCallCountBeforeSwitch = getRunEvents.mock.calls.length

    hook.rerender({ sceneId: 'scene-sunrise-harbor' })

    expect(hook.result.current.activeRunId).toBeNull()
    expect(getRun.mock.calls.length).toBe(getRunCallCountBeforeSwitch)
    expect(getRunEvents.mock.calls.length).toBe(getRunEventsCallCountBeforeSwitch)
  })

  it('stops polling after the run reaches a terminal status', async () => {
    const queryClient = createQueryClient()
    const getRun = vi.fn().mockResolvedValue(
      createRun({
        status: 'completed',
        summary: 'Completed.',
        completedAtLabel: '2026-04-21 10:30',
      }),
    )
    const getRunEvents = vi.fn().mockResolvedValue(createEventsPage({ runId: 'run-scene-midnight-platform-001' }))
    const runClient = createRunClient({
      getRun,
      getRunEvents,
    })

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId: 'run-scene-midnight-platform-001',
        }),
      {
        wrapper: createWrapper(runClient, queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.run?.status).toBe('completed')
    })

    vi.useFakeTimers()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000)
    })

    expect(getRun).toHaveBeenCalledTimes(1)
    expect(getRunEvents).toHaveBeenCalledTimes(1)
    expect(hook.result.current.isPolling).toBe(false)
  })

  it('polls active runs by refetching both run detail and timeline data', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const queryClient = createQueryClient()
    const runId = 'run-scene-midnight-platform-001'
    const getRun = vi
      .fn()
      .mockResolvedValueOnce(
        createRun({
          id: runId,
          status: 'running',
          summary: 'Running before poll.',
        }),
      )
      .mockResolvedValueOnce(
        createRun({
          id: runId,
          status: 'waiting_review',
          pendingReviewId: 'review-scene-midnight-platform-001',
          summary: 'Waiting for review after poll.',
        }),
      )
    const getRunEvents = vi
      .fn()
      .mockResolvedValueOnce(
        createEventsPage({
          runId,
          events: [
            {
              id: 'run-event-001',
              runId,
              order: 1,
              kind: 'run_started',
              label: 'Run started',
              summary: 'Initial event.',
              createdAtLabel: '2026-04-21 10:00',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createEventsPage({
          runId,
          events: [
            {
              id: 'run-event-001',
              runId,
              order: 1,
              kind: 'run_started',
              label: 'Run started',
              summary: 'Initial event.',
              createdAtLabel: '2026-04-21 10:00',
            },
            {
              id: 'run-event-002',
              runId,
              order: 2,
              kind: 'review_requested',
              label: 'Review requested',
              summary: 'Polled event.',
              createdAtLabel: '2026-04-21 10:05',
            },
          ],
        }),
      )
    const runClient = createRunClient({
      getRun,
      getRunEvents,
    })

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId,
        }),
      {
        wrapper: createWrapper(runClient, queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isPolling).toBe(true)
    })

    expect(getRun).toHaveBeenCalledTimes(1)
    expect(getRunEvents).toHaveBeenCalledTimes(1)
    expect(hook.result.current.events.map((event) => event.id)).toEqual(['run-event-001'])
    expect(setIntervalSpy.mock.calls.length).toBeGreaterThan(0)
    expect(setIntervalSpy.mock.calls.at(-1)).toEqual([expect.any(Function), 5000])

    const pollActiveRun = setIntervalSpy.mock.calls.at(-1)?.[0]
    expect(typeof pollActiveRun).toBe('function')

    await act(async () => {
      ;(pollActiveRun as () => void)()
    })

    await waitFor(() => {
      expect(getRun).toHaveBeenCalledTimes(2)
    })

    expect(getRunEvents).toHaveBeenCalledTimes(2)
    expect(hook.result.current.run?.status).toBe('waiting_review')
    expect(hook.result.current.pendingReviewId).toBe('review-scene-midnight-platform-001')
    expect(hook.result.current.events.map((event) => event.id)).toEqual(['run-event-001', 'run-event-002'])
  })

  it('invalidates scene-related query families after a successful review decision', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const runClient = createRunClient({
      getRun: vi.fn(async () =>
        createRun({
          status: 'waiting_review',
          pendingReviewId: 'review-scene-midnight-platform-001',
          summary: 'Waiting for review.',
        }),
      ),
      submitRunReviewDecision: vi.fn(async (_input: SubmitRunReviewDecisionInput) =>
        createRun({
          status: 'completed',
          pendingReviewId: undefined,
          summary: 'Accepted and applied.',
          completedAtLabel: '2026-04-21 10:20',
        }),
      ),
    })

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId: 'run-scene-midnight-platform-001',
        }),
      {
        wrapper: createWrapper(runClient, queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.canSubmitDecision).toBe(true)
    })

    await act(async () => {
      await hook.result.current.submitDecision({
        decision: 'accept',
        note: 'Ship it.',
      })
    })

    expect(runClient.submitRunReviewDecision).toHaveBeenCalledWith({
      runId: 'run-scene-midnight-platform-001',
      reviewId: 'review-scene-midnight-platform-001',
      decision: 'accept',
      note: 'Ship it.',
    })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sceneQueryKeys.workspace('scene-midnight-platform') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sceneQueryKeys.execution('scene-midnight-platform') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sceneQueryKeys.prose('scene-midnight-platform') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sceneQueryKeys.inspector('scene-midnight-platform') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sceneQueryKeys.dock('scene-midnight-platform') })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: sceneQueryKeys.patchPreview('scene-midnight-platform') })
  })

  it('uses runClient boundaries without touching sceneClient', async () => {
    const queryClient = createQueryClient()
    const runClient = createRunClient({
      getRun: vi.fn(async ({ runId }) =>
        createRun({
          id: runId,
          status: 'waiting_review',
          pendingReviewId: 'review-scene-midnight-platform-001',
          summary: 'Waiting for review.',
        }),
      ),
    })
    const sceneClient = new Proxy({} as SceneClient, {
      get() {
        throw new Error('sceneClient should not be touched by useSceneRunSession')
      },
    })

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId: 'run-scene-midnight-platform-001',
        }),
      {
        wrapper: createProjectRuntimeTestWrapper({
          runtime: {
            ...createTestProjectRuntime(),
            projectId: 'book-signal-arc',
            runClient,
            sceneClient,
          },
          queryClient,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.canSubmitDecision).toBe(true)
    })

    expect(runClient.getRun).toHaveBeenCalledWith({
      runId: 'run-scene-midnight-platform-001',
    })
  })
})
