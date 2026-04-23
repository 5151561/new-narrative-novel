import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

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

  it('stays on getRunEvents only and does not mention the stream endpoint', async () => {
    const queryClient = createQueryClient()
    const client = {
      getRunEvents: vi.fn(async () => createPage({ events: [createEvent(1)] })),
      streamRunEvents: vi.fn(),
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
      expect(hook.result.current.events).toHaveLength(1)
    })

    expect(client.getRunEvents).toHaveBeenCalledTimes(1)
    expect(client.streamRunEvents).not.toHaveBeenCalled()
    expect(
      readFileSync(resolve(process.cwd(), 'src/features/run/hooks/useRunEventTimelineQuery.ts'), 'utf8'),
    ).not.toContain('/events/stream')
  })
})
