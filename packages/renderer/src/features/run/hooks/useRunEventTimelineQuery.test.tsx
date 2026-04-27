import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { createProjectRuntimeTestWrapper, createTestProjectRuntime } from '@/app/project-runtime'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunEventRecord, RunEventsPageRecord } from '@/features/run/api/run-records'

import { useRunEventTimelineQuery } from './useRunEventTimelineQuery'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
}

function createWrapper(queryClient: QueryClient) {
  return function QueryClientWrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function createProjectRuntimeWrapper(options: {
  queryClient: QueryClient
  projectId?: string
  runClient: RunClient
  runEventStream?: boolean
  runEventPolling?: boolean
  runtimeInfoError?: Error
}) {
  const {
    queryClient,
    projectId = 'book-signal-arc',
    runClient,
    runEventStream = true,
    runEventPolling = true,
    runtimeInfoError,
  } = options

  return createProjectRuntimeTestWrapper({
    runtime: {
      ...createTestProjectRuntime(),
      projectId,
      runClient,
      runtimeInfoClient: {
        getProjectRuntimeInfo: vi.fn(async () => {
          if (runtimeInfoError) {
            throw runtimeInfoError
          }

          return {
            projectId,
            projectTitle: 'Signal Arc',
            source: 'api' as const,
            status: 'healthy' as const,
            summary: 'Connected to runtime gateway.',
            checkedAtLabel: '2026-04-27 10:00',
            apiBaseUrl: 'https://runtime.example.test',
            versionLabel: 'runtime-v49',
            capabilities: {
              read: true,
              write: true,
              runEvents: true,
              runEventPolling,
              runEventStream,
              reviewDecisions: true,
              contextPacketRefs: true,
              proposalSetRefs: true,
            },
          }
        }),
      },
    },
    queryClient,
  })
}

function createEvent(order: number, overrides: Partial<RunEventRecord> = {}): RunEventRecord {
  return {
    id: `run-event-${order}`,
    runId: 'run-scene-midnight-platform-001',
    order,
    kind: 'agent_invocation_started',
    label: `Event ${order}`,
    summary: `Summary ${order}`,
    createdAtLabel: `2026-04-21 10:0${order}`,
    ...overrides,
  }
}

function createPage(overrides: Partial<RunEventsPageRecord> = {}): RunEventsPageRecord {
  return {
    runId: 'run-scene-midnight-platform-001',
    events: [],
    nextCursor: undefined,
    ...overrides,
  }
}

describe('useRunEventTimelineQuery', () => {
  it('fetches each page and merges them into one timeline', async () => {
    const queryClient = createQueryClient()
    const client: Pick<RunClient, 'getRunEvents'> = {
      getRunEvents: vi
        .fn()
        .mockResolvedValueOnce(
          createPage({
            events: [createEvent(2), createEvent(4)],
            nextCursor: 'cursor-page-2',
          }),
        )
        .mockResolvedValueOnce(
          createPage({
            events: [createEvent(6)],
          }),
        ),
    }

    const hook = renderHook(
      () =>
        useRunEventTimelineQuery('run-scene-midnight-platform-001', {
          client,
          projectId: 'project-standalone',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(client.getRunEvents).toHaveBeenNthCalledWith(1, {
      runId: 'run-scene-midnight-platform-001',
      cursor: undefined,
    })
    expect(client.getRunEvents).toHaveBeenNthCalledWith(2, {
      runId: 'run-scene-midnight-platform-001',
      cursor: 'cursor-page-2',
    })
    expect(hook.result.current.events.map((event) => event.order)).toEqual([2, 4, 6])
  })

  it('keeps merged events ordered by order across pages', async () => {
    const queryClient = createQueryClient()
    const client: Pick<RunClient, 'getRunEvents'> = {
      getRunEvents: vi
        .fn()
        .mockResolvedValueOnce(
          createPage({
            events: [createEvent(5), createEvent(1)],
            nextCursor: 'cursor-page-2',
          }),
        )
        .mockResolvedValueOnce(
          createPage({
            events: [createEvent(4), createEvent(2)],
          }),
        ),
    }

    const hook = renderHook(
      () =>
        useRunEventTimelineQuery('run-scene-midnight-platform-001', {
          client,
          projectId: 'project-standalone',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events).toHaveLength(4)
    })

    expect(hook.result.current.events.map((event) => event.order)).toEqual([1, 2, 4, 5])
  })

  it('does not request when runId is empty', () => {
    const queryClient = createQueryClient()
    const client: Pick<RunClient, 'getRunEvents'> = {
      getRunEvents: vi.fn(),
    }

    const hook = renderHook(
      () =>
        useRunEventTimelineQuery('', {
          client,
          projectId: 'project-standalone',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    expect(hook.result.current.events).toEqual([])
    expect(hook.result.current.isLoading).toBe(false)
    expect(client.getRunEvents).not.toHaveBeenCalled()
  })

  it('refetch reloads the timeline from the first page', async () => {
    const queryClient = createQueryClient()
    const client: Pick<RunClient, 'getRunEvents'> = {
      getRunEvents: vi
        .fn()
        .mockResolvedValueOnce(
          createPage({
            events: [createEvent(1, { summary: 'Initial summary' })],
          }),
        )
        .mockResolvedValueOnce(
          createPage({
            events: [createEvent(1, { summary: 'Reloaded summary' })],
          }),
        ),
    }

    const hook = renderHook(
      () =>
        useRunEventTimelineQuery('run-scene-midnight-platform-001', {
          client,
          projectId: 'project-standalone',
        }),
      {
        wrapper: createWrapper(queryClient),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events[0]?.summary).toBe('Initial summary')
    })

    await act(async () => {
      await hook.result.current.refetch()
    })

    await waitFor(() => {
      expect(hook.result.current.events[0]?.summary).toBe('Reloaded summary')
    })
    expect(client.getRunEvents).toHaveBeenCalledTimes(2)
    expect(client.getRunEvents).toHaveBeenNthCalledWith(2, {
      runId: 'run-scene-midnight-platform-001',
      cursor: undefined,
    })
  })

  it('prefers stream updates for stream-capable runtimes and merges pages by event id order', async () => {
    const queryClient = createQueryClient()
    const getRunEvents = vi.fn(async () => createPage({ events: [createEvent(9)] }))
    let releaseStream: (() => void) | null = null
    const streamRunEvents = vi.fn(async ({ onOpen, onPage, signal }: {
      onOpen?: () => void
      onPage: (page: RunEventsPageRecord) => void
      runId: string
      signal?: AbortSignal
    }) =>
      await new Promise<void>((resolve) => {
        const finish = () => resolve()
        releaseStream = finish
        onOpen?.()
        onPage(
          createPage({
            events: [
              createEvent(5, { id: 'run-event-005', summary: 'Older summary' }),
              createEvent(2, { id: 'run-event-002' }),
            ],
          }),
        )
        onPage(
          createPage({
            events: [
              createEvent(4, { id: 'run-event-004' }),
              createEvent(5, { id: 'run-event-005', summary: 'Updated summary' }),
            ],
          }),
        )
        signal?.addEventListener('abort', finish, { once: true })
      }))
    const runClient = {
      getRunEvents,
      streamRunEvents,
    } as RunClient

    const hook = renderHook(
      () => useRunEventTimelineQuery('run-scene-midnight-platform-001'),
      {
        wrapper: createProjectRuntimeWrapper({
          queryClient,
          runClient,
          runEventStream: true,
          runEventPolling: true,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.order)).toEqual([2, 4, 5])
    })

    expect(streamRunEvents).toHaveBeenCalledTimes(1)
    expect(streamRunEvents).toHaveBeenCalledWith({
      runId: 'run-scene-midnight-platform-001',
      cursor: undefined,
      signal: expect.any(AbortSignal),
      onOpen: expect.any(Function),
      onPage: expect.any(Function),
    })
    expect(getRunEvents).not.toHaveBeenCalled()
    expect(hook.result.current.events.at(-1)?.summary).toBe('Updated summary')

    await act(async () => {
      releaseStream?.()
    })
  })

  it('falls back to paged events after a healthy stream closes', async () => {
    const queryClient = createQueryClient()
    const getRunEvents = vi.fn(async () =>
      createPage({
        events: [createEvent(6)],
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
        createPage({
          events: [createEvent(2)],
        }),
      )
    })
    const runClient = {
      getRunEvents,
      streamRunEvents,
    } as RunClient

    const hook = renderHook(
      () => useRunEventTimelineQuery('run-scene-midnight-platform-001'),
      {
        wrapper: createProjectRuntimeWrapper({
          queryClient,
          runClient,
          runEventStream: true,
          runEventPolling: true,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.order)).toEqual([2, 6])
    })

    expect(streamRunEvents).toHaveBeenCalledTimes(1)
    expect(getRunEvents).toHaveBeenCalledTimes(1)
  })

  it('falls back to paged events when runtime capability disables stream', async () => {
    const queryClient = createQueryClient()
    const getRunEvents = vi
      .fn()
      .mockResolvedValueOnce(
        createPage({
          events: [createEvent(3)],
          nextCursor: 'cursor-page-2',
        }),
      )
      .mockResolvedValueOnce(
        createPage({
          events: [createEvent(1)],
        }),
      )
    const streamRunEvents = vi.fn()
    const runClient = {
      getRunEvents,
      streamRunEvents,
    } as RunClient

    const hook = renderHook(
      () => useRunEventTimelineQuery('run-scene-midnight-platform-001'),
      {
        wrapper: createProjectRuntimeWrapper({
          queryClient,
          runClient,
          runEventStream: false,
          runEventPolling: true,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.order)).toEqual([1, 3])
    })

    expect(streamRunEvents).not.toHaveBeenCalled()
    expect(getRunEvents).toHaveBeenCalledTimes(2)
  })

  it('does not page run events when both stream and polling capabilities are disabled', async () => {
    const queryClient = createQueryClient()
    const getRunEvents = vi.fn(async () => createPage({ events: [createEvent(8)] }))
    const streamRunEvents = vi.fn()
    const runClient = {
      getRunEvents,
      streamRunEvents,
    } as RunClient

    const hook = renderHook(
      () => useRunEventTimelineQuery('run-scene-midnight-platform-001'),
      {
        wrapper: createProjectRuntimeWrapper({
          queryClient,
          runClient,
          runEventStream: false,
          runEventPolling: false,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.events).toEqual([])
    expect(streamRunEvents).not.toHaveBeenCalled()
    expect(getRunEvents).not.toHaveBeenCalled()
  })

  it('falls back to paged events when the stream path errors', async () => {
    const queryClient = createQueryClient()
    const streamRunEvents = vi.fn(async () => {
      throw new Error('stream failed')
    })
    const getRunEvents = vi.fn(async () =>
      createPage({
        events: [createEvent(7)],
      }),
    )
    const runClient = {
      getRunEvents,
      streamRunEvents,
    } as RunClient

    const hook = renderHook(
      () => useRunEventTimelineQuery('run-scene-midnight-platform-001'),
      {
        wrapper: createProjectRuntimeWrapper({
          queryClient,
          runClient,
          runEventStream: true,
          runEventPolling: true,
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.order)).toEqual([7])
    })

    expect(streamRunEvents).toHaveBeenCalledTimes(1)
    expect(getRunEvents).toHaveBeenCalledTimes(1)
    expect(
      readFileSync(resolve(process.cwd(), 'src/features/run/hooks/useRunEventTimelineQuery.ts'), 'utf8'),
    ).toContain('streamRunEvents')
  })

  it('falls back to paged events when runtime info lookup errors for an API runtime path', async () => {
    const queryClient = createQueryClient()
    const streamRunEvents = vi.fn()
    const getRunEvents = vi.fn(async () =>
      createPage({
        events: [createEvent(10)],
      }),
    )
    const runClient = {
      getRunEvents,
      streamRunEvents,
    } as RunClient

    const hook = renderHook(
      () => useRunEventTimelineQuery('run-scene-midnight-platform-001'),
      {
        wrapper: createProjectRuntimeWrapper({
          queryClient,
          runClient,
          runtimeInfoError: new Error('runtime info failed'),
        }),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.events.map((event) => event.order)).toEqual([10])
    })

    expect(streamRunEvents).not.toHaveBeenCalled()
    expect(getRunEvents).toHaveBeenCalledTimes(1)
  })
})
