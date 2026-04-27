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
    listRunArtifacts: vi.fn(),
    getRunArtifact: vi.fn(),
    getRunTrace: vi.fn(),
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
  it('treats rewrite-requested completed runs as terminal instead of an active background review run', async () => {
    const queryClient = createQueryClient()
    const runClient = createRunClient({
      getRun: vi.fn(async ({ runId }) =>
        createRun({
          id: runId,
          status: 'completed',
          summary: 'Rewrite requested. Start a new run to continue.',
          pendingReviewId: undefined,
          completedAtLabel: '2026-04-21 10:10',
          latestEventId: 'run-event-002',
          eventCount: 2,
        }),
      ),
      getRunEvents: vi.fn(async ({ runId }) =>
        createEventsPage({
          runId,
          events: [
            {
              id: 'run-event-002',
              runId,
              order: 2,
              kind: 'review_decision_submitted',
              label: 'Review decision submitted',
              summary: 'Rewrite requested. Start a new run to continue.',
              createdAtLabel: '2026-04-21 10:10',
              severity: 'warning',
              refs: [{ kind: 'review', id: 'review-scene-midnight-platform-001' }],
            },
          ],
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
      expect(hook.result.current.run?.status).toBe('completed')
    })

    expect(hook.result.current.pendingReviewId).toBeNull()
    expect(hook.result.current.isReviewPending).toBe(false)
    expect(hook.result.current.canSubmitDecision).toBe(false)
    expect(hook.result.current.isPolling).toBe(false)
    expect(hook.result.current.events.at(-1)?.kind).toBe('review_decision_submitted')
  })

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

    queryClient.setQueryData(sceneQueryKeys.workspace('scene-midnight-platform', 'en'), {
      id: 'scene-midnight-platform',
      title: 'Midnight platform',
      chapterId: 'chapter-signals-in-rain',
      chapterTitle: 'Signals in Rain',
      status: 'review' as const,
      runStatus: 'paused' as const,
      objective: 'Keep the ledger closed.',
      castIds: ['ren', 'mei'],
      latestRunId: 'run-scene-midnight-platform-001',
      pendingProposalCount: 2,
      warningCount: 1,
      currentVersionLabel: 'Run 07',
      activeThreadId: 'thread-main',
      availableThreads: [{ id: 'thread-main', label: 'Mainline' }],
    })
    queryClient.setQueryData(sceneQueryKeys.execution('scene-midnight-platform', 'en'), {
      runId: 'run-scene-midnight-platform-001',
      objective: {
        goal: 'Keep the ledger closed.',
        warningsCount: 1,
        unresolvedCount: 0,
        cast: [],
        constraintSummary: [],
      },
      beats: [],
      proposals: [],
      acceptedSummary: {
        sceneSummary: '',
        acceptedFacts: [],
        readiness: 'not-ready' as const,
        pendingProposalCount: 0,
        warningCount: 0,
        patchCandidateCount: 0,
      },
      runtimeSummary: {
        runHealth: 'stable' as const,
        latencyLabel: '',
        tokenLabel: '',
        costLabel: '',
      },
      canContinueRun: true,
      canOpenProse: false,
    })

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
    expect(queryClient.getQueryData(sceneQueryKeys.workspace('scene-midnight-platform', 'en'))).toMatchObject({
      runStatus: 'running',
      latestRunId: startedRun.id,
    })
    expect(queryClient.getQueryData(sceneQueryKeys.execution('scene-midnight-platform', 'en'))).toMatchObject({
      runId: startedRun.id,
      canContinueRun: false,
    })
  })

  it('switches to the newly started run when stale scene surfaces still point at an older run id', async () => {
    const queryClient = createQueryClient()
    const staleRun = createRun({
      id: 'run-scene-midnight-platform-001',
      status: 'waiting_review',
      summary: 'Older run still pinned in scene surfaces.',
      pendingReviewId: 'review-scene-midnight-platform-001',
    })
    const startedRun = createRun({
      id: 'run-scene-midnight-platform-002',
      status: 'running',
      summary: 'Rewrite run is now active.',
    })
    const getRun = vi.fn(async ({ runId }) => {
      if (runId === startedRun.id) {
        return startedRun
      }

      return staleRun
    })
    const getRunEvents = vi.fn(async ({ runId }) => createEventsPage({ runId }))
    const runClient = createRunClient({
      startSceneRun: vi.fn(async (_input: StartSceneRunInput) => startedRun),
      getRun,
      getRunEvents,
    })

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId: staleRun.id,
          latestRunId: staleRun.id,
        }),
      {
        wrapper: createWrapper(runClient, queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.activeRunId).toBe(staleRun.id)
      expect(hook.result.current.run?.summary).toBe(staleRun.summary)
    })

    await act(async () => {
      await hook.result.current.startRun({
        mode: 'from-scratch',
      })
    })

    await waitFor(() => {
      expect(hook.result.current.activeRunId).toBe(startedRun.id)
      expect(hook.result.current.run?.summary).toBe(startedRun.summary)
    })

    expect(runClient.startSceneRun).toHaveBeenCalledWith({
      sceneId: 'scene-midnight-platform',
      mode: 'from-scratch',
    })
    expect(getRun).toHaveBeenCalledWith({
      runId: startedRun.id,
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

  it('disables polling while the stream subscription stays healthy for an active run', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const queryClient = createQueryClient()
    const runId = 'run-scene-midnight-platform-001'
    let releaseStream: (() => void) | null = null
    const streamRunEvents = vi.fn(
      async ({ onOpen, onPage, signal }: {
        onOpen?: () => void
        onPage: (page: RunEventsPageRecord) => void
        runId: string
        signal?: AbortSignal
      }) =>
        await new Promise<void>((resolve) => {
          const finish = () => resolve()
          releaseStream = finish
          signal?.addEventListener('abort', finish, { once: true })
          onOpen?.()
          onPage(
            createEventsPage({
              runId,
              events: [
                {
                  id: 'run-event-001',
                  runId,
                  order: 1,
                  kind: 'run_started',
                  label: 'Run started',
                  summary: 'Initial streamed event.',
                  createdAtLabel: '2026-04-21 10:00',
                },
              ],
            }),
          )
        }),
    )
    const getRunEvents = vi.fn(async () => createEventsPage({ runId }))
    const runClient = createRunClient({
      getRun: vi.fn(async () =>
        createRun({
          id: runId,
          status: 'running',
          summary: 'Streaming.',
        }),
      ),
      getRunEvents,
      ...( { streamRunEvents } as Partial<RunClient>),
    } as Partial<RunClient>)

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId,
        }),
      {
        wrapper: createProjectRuntimeTestWrapper({
          runtime: {
            ...createTestProjectRuntime(),
            projectId: 'book-signal-arc',
            runClient,
            runtimeInfoClient: {
              getProjectRuntimeInfo: vi.fn(async () => ({
                projectId: 'book-signal-arc',
                projectTitle: 'Signal Arc',
                source: 'api',
                status: 'healthy',
                summary: 'Connected to runtime gateway.',
                checkedAtLabel: '2026-04-27 10:00',
                apiBaseUrl: 'https://runtime.example.test',
                versionLabel: 'runtime-v49',
                capabilities: {
                  read: true,
                  write: true,
                  runEvents: true,
                  runEventPolling: true,
                  runEventStream: true,
                  reviewDecisions: true,
                  contextPacketRefs: true,
                  proposalSetRefs: true,
                },
              })),
            },
          },
          queryClient,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.id)).toEqual(['run-event-001'])
    })

    expect(streamRunEvents).toHaveBeenCalledTimes(1)
    expect(getRunEvents).not.toHaveBeenCalled()
    expect(hook.result.current.isPolling).toBe(false)
    expect(setIntervalSpy.mock.calls.some(([, interval]) => interval === 5000)).toBe(false)

    await act(async () => {
      releaseStream?.()
    })
  })

  it('resumes paging polls after a healthy stream closes while the run is still active', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const queryClient = createQueryClient()
    const runId = 'run-scene-midnight-platform-001'
    const getRun = vi
      .fn()
      .mockResolvedValueOnce(
        createRun({
          id: runId,
          status: 'running',
          summary: 'Still active after stream close.',
        }),
      )
      .mockResolvedValueOnce(
        createRun({
          id: runId,
          status: 'waiting_review',
          pendingReviewId: 'review-scene-midnight-platform-001',
          summary: 'Waiting after resumed polling.',
        }),
      )
    const getRunEvents = vi
      .fn()
      .mockResolvedValueOnce(
        createEventsPage({
          runId,
          events: [
            {
              id: 'run-event-002',
              runId,
              order: 2,
              kind: 'review_requested',
              label: 'Review requested',
              summary: 'Fetched after stream close.',
              createdAtLabel: '2026-04-21 10:05',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        createEventsPage({
          runId,
          events: [
            {
              id: 'run-event-002',
              runId,
              order: 2,
              kind: 'review_requested',
              label: 'Review requested',
              summary: 'Fetched after stream close.',
              createdAtLabel: '2026-04-21 10:05',
            },
            {
              id: 'run-event-003',
              runId,
              order: 3,
              kind: 'review_requested',
              label: 'Review requested',
              summary: 'Polled after stream close.',
              createdAtLabel: '2026-04-21 10:06',
            },
          ],
        }),
      )
    const streamRunEvents = vi.fn(async ({ onOpen, onPage }: {
      onOpen?: () => void
      onPage: (page: RunEventsPageRecord) => void
      runId: string
      signal?: AbortSignal
    }) => {
      onOpen?.()
      onPage(
        createEventsPage({
          runId,
          events: [
            {
              id: 'run-event-001',
              runId,
              order: 1,
              kind: 'run_started',
              label: 'Run started',
              summary: 'Streamed before close.',
              createdAtLabel: '2026-04-21 10:00',
            },
          ],
        }),
      )
    })
    const runClient = createRunClient({
      getRun,
      getRunEvents,
      ...( { streamRunEvents } as Partial<RunClient>),
    } as Partial<RunClient>)

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId,
        }),
      {
        wrapper: createProjectRuntimeTestWrapper({
          runtime: {
            ...createTestProjectRuntime(),
            projectId: 'book-signal-arc',
            runClient,
            runtimeInfoClient: {
              getProjectRuntimeInfo: vi.fn(async () => ({
                projectId: 'book-signal-arc',
                projectTitle: 'Signal Arc',
                source: 'api',
                status: 'healthy',
                summary: 'Connected to runtime gateway.',
                checkedAtLabel: '2026-04-27 10:00',
                apiBaseUrl: 'https://runtime.example.test',
                versionLabel: 'runtime-v49',
                capabilities: {
                  read: true,
                  write: true,
                  runEvents: true,
                  runEventPolling: true,
                  runEventStream: true,
                  reviewDecisions: true,
                  contextPacketRefs: true,
                  proposalSetRefs: true,
                },
              })),
            },
          },
          queryClient,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.id)).toEqual(['run-event-001', 'run-event-002'])
    })

    await waitFor(() => {
      expect(hook.result.current.isPolling).toBe(true)
    })

    const pollIntervalCall = setIntervalSpy.mock.calls.find(([, interval]) => interval === 5000)
    expect(pollIntervalCall).toEqual([expect.any(Function), 5000])

    const pollActiveRun = pollIntervalCall?.[0]
    expect(typeof pollActiveRun).toBe('function')

    await act(async () => {
      ;(pollActiveRun as () => void)()
    })

    await waitFor(() => {
      expect(getRun).toHaveBeenCalledTimes(2)
    })

    expect(streamRunEvents).toHaveBeenCalledTimes(1)
    expect(getRunEvents).toHaveBeenCalledTimes(2)
    expect(hook.result.current.events.map((event) => event.id)).toEqual(['run-event-001', 'run-event-002', 'run-event-003'])
  })

  it('does not start interval polling after stream close when paging fallback is disabled', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const queryClient = createQueryClient()
    const runId = 'run-scene-midnight-platform-001'
    const getRunEvents = vi.fn(async () =>
      createEventsPage({
        runId,
        events: [
          {
            id: 'run-event-002',
            runId,
            order: 2,
            kind: 'review_requested',
            label: 'Review requested',
            summary: 'This should never be fetched.',
            createdAtLabel: '2026-04-21 10:05',
          },
        ],
      }),
    )
    const streamRunEvents = vi.fn(async ({ onOpen, onPage }: {
      onOpen?: () => void
      onPage: (page: RunEventsPageRecord) => void
      runId: string
      signal?: AbortSignal
    }) => {
      onOpen?.()
      onPage(
        createEventsPage({
          runId,
          events: [
            {
              id: 'run-event-001',
              runId,
              order: 1,
              kind: 'run_started',
              label: 'Run started',
              summary: 'Streamed before close.',
              createdAtLabel: '2026-04-21 10:00',
            },
          ],
        }),
      )
    })
    const runClient = createRunClient({
      getRun: vi.fn(async () =>
        createRun({
          id: runId,
          status: 'running',
          summary: 'Running without paging fallback.',
        }),
      ),
      getRunEvents,
      ...( { streamRunEvents } as Partial<RunClient>),
    } as Partial<RunClient>)

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId,
        }),
      {
        wrapper: createProjectRuntimeTestWrapper({
          runtime: {
            ...createTestProjectRuntime(),
            projectId: 'book-signal-arc',
            runClient,
            runtimeInfoClient: {
              getProjectRuntimeInfo: vi.fn(async () => ({
                projectId: 'book-signal-arc',
                projectTitle: 'Signal Arc',
                source: 'api',
                status: 'healthy',
                summary: 'Connected to runtime gateway.',
                checkedAtLabel: '2026-04-27 10:00',
                apiBaseUrl: 'https://runtime.example.test',
                versionLabel: 'runtime-v49',
                capabilities: {
                  read: true,
                  write: true,
                  runEvents: true,
                  runEventPolling: false,
                  runEventStream: true,
                  reviewDecisions: true,
                  contextPacketRefs: true,
                  proposalSetRefs: true,
                },
              })),
            },
          },
          queryClient,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.id)).toEqual(['run-event-001'])
    })

    await waitFor(() => {
      expect(hook.result.current.isPolling).toBe(false)
    })

    expect(streamRunEvents).toHaveBeenCalledTimes(1)
    expect(getRunEvents).not.toHaveBeenCalled()
    expect(setIntervalSpy.mock.calls.some(([, interval]) => interval === 5000)).toBe(false)
  })

  it('resumes paging polls when the stream path fails for an active run', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const queryClient = createQueryClient()
    const runId = 'run-scene-midnight-platform-001'
    const getRun = vi
      .fn()
      .mockResolvedValueOnce(
        createRun({
          id: runId,
          status: 'running',
          summary: 'Running before stream failure.',
        }),
      )
      .mockResolvedValueOnce(
        createRun({
          id: runId,
          status: 'waiting_review',
          pendingReviewId: 'review-scene-midnight-platform-001',
          summary: 'Waiting after fallback poll.',
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
              summary: 'Fallback event.',
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
              summary: 'Fallback event.',
              createdAtLabel: '2026-04-21 10:00',
            },
            {
              id: 'run-event-002',
              runId,
              order: 2,
              kind: 'review_requested',
              label: 'Review requested',
              summary: 'Polled after stream failure.',
              createdAtLabel: '2026-04-21 10:05',
            },
          ],
        }),
      )
    const runClient = createRunClient({
      getRun,
      getRunEvents,
      ...({
        streamRunEvents: vi.fn(async () => {
          throw new Error('stream failed')
        }),
      } as Partial<RunClient>),
    } as Partial<RunClient>)

    const hook = renderHook(
      () =>
        useSceneRunSession({
          sceneId: 'scene-midnight-platform',
          runId,
        }),
      {
        wrapper: createProjectRuntimeTestWrapper({
          runtime: {
            ...createTestProjectRuntime(),
            projectId: 'book-signal-arc',
            runClient,
            runtimeInfoClient: {
              getProjectRuntimeInfo: vi.fn(async () => ({
                projectId: 'book-signal-arc',
                projectTitle: 'Signal Arc',
                source: 'api',
                status: 'healthy',
                summary: 'Connected to runtime gateway.',
                checkedAtLabel: '2026-04-27 10:00',
                apiBaseUrl: 'https://runtime.example.test',
                versionLabel: 'runtime-v49',
                capabilities: {
                  read: true,
                  write: true,
                  runEvents: true,
                  runEventPolling: true,
                  runEventStream: true,
                  reviewDecisions: true,
                  contextPacketRefs: true,
                  proposalSetRefs: true,
                },
              })),
            },
          },
          queryClient,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.id)).toEqual(['run-event-001'])
    })

    await waitFor(() => {
      expect(hook.result.current.isPolling).toBe(true)
    })

    expect(getRunEvents).toHaveBeenCalledTimes(1)
    const pollIntervalCall = setIntervalSpy.mock.calls.find(([, interval]) => interval === 5000)
    expect(pollIntervalCall).toEqual([expect.any(Function), 5000])

    const pollActiveRun = pollIntervalCall?.[0]
    expect(typeof pollActiveRun).toBe('function')

    await act(async () => {
      ;(pollActiveRun as () => void)()
    })

    await waitFor(() => {
      expect(getRun).toHaveBeenCalledTimes(2)
    })

    expect(getRunEvents).toHaveBeenCalledTimes(2)
    expect(hook.result.current.pendingReviewId).toBe('review-scene-midnight-platform-001')
  })

  it('delegates review-decision invalidation to the submit mutation without duplicating scene invalidations', async () => {
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
    const sceneInvalidationKeys = [
      sceneQueryKeys.workspace('scene-midnight-platform'),
      sceneQueryKeys.execution('scene-midnight-platform'),
      sceneQueryKeys.prose('scene-midnight-platform'),
      sceneQueryKeys.inspector('scene-midnight-platform'),
      sceneQueryKeys.dock('scene-midnight-platform'),
      sceneQueryKeys.patchPreview('scene-midnight-platform'),
    ]

    for (const queryKey of sceneInvalidationKeys) {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey, refetchType: 'active' })
      expect(invalidateSpy.mock.calls.filter(([call]) => JSON.stringify(call.queryKey) === JSON.stringify(queryKey))).toHaveLength(1)
    }
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: sceneQueryKeys.prose('scene-midnight-platform') })
  })

  it('submits review decisions against the active run and current pending review while preserving selected variants', async () => {
    const queryClient = createQueryClient()
    const selectedVariants = [
      {
        proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
        variantId: 'variant-midnight-platform-raise-conflict',
      },
    ]
    const runClient = createRunClient({
      getRun: vi.fn(async ({ runId }) =>
        createRun({
          id: runId,
          status: 'waiting_review',
          pendingReviewId: 'review-scene-midnight-platform-002',
          summary: 'Waiting for review.',
        }),
      ),
      submitRunReviewDecision: vi.fn(async (_input: SubmitRunReviewDecisionInput) =>
        createRun({
          id: 'run-scene-midnight-platform-002',
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
          runId: 'run-scene-midnight-platform-002',
          latestRunId: 'run-scene-midnight-platform-001',
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
        decision: 'accept-with-edit',
        note: 'Adopt the sharper opening.',
        patchId: 'patch-scene-midnight-platform-001',
        selectedVariants,
      })
    })

    expect(runClient.submitRunReviewDecision).toHaveBeenCalledWith({
      runId: 'run-scene-midnight-platform-002',
      reviewId: 'review-scene-midnight-platform-002',
      decision: 'accept-with-edit',
      note: 'Adopt the sharper opening.',
      patchId: 'patch-scene-midnight-platform-001',
      selectedVariants,
    })
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
