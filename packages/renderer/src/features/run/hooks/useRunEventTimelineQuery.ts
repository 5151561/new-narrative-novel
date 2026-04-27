import { useEffect, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import {
  resolveProjectRuntimeDependency,
  supportsRunEventPolling,
  supportsRunEventStream,
  useOptionalProjectRuntime,
} from '@/app/project-runtime'

import type { RunClient } from '../api/run-client'
import type { RunEventRecord } from '../api/run-records'

import { runQueryKeys } from './run-query-keys'

type RunTimelineClient = Pick<RunClient, 'getRunEvents'> & Partial<Pick<RunClient, 'streamRunEvents'>>

interface UseRunEventTimelineQueryDeps {
  client?: RunTimelineClient
  projectId?: string
}

function mergeRunEventLists(existing: Iterable<RunEventRecord>, pageEvents: RunEventRecord[]): RunEventRecord[] {
  const mergedEvents = new Map<string, RunEventRecord>()

  for (const event of existing) {
    mergedEvents.set(event.id, event)
  }

  for (const event of pageEvents) {
    mergedEvents.set(event.id, event)
  }

  return Array.from(mergedEvents.values()).sort((left, right) => left.order - right.order)
}

async function loadRunEventTimeline(
  client: Pick<RunClient, 'getRunEvents'>,
  runId: string,
): Promise<RunEventRecord[]> {
  let events: RunEventRecord[] = []
  const seenCursors = new Set<string | undefined>()
  let cursor: string | undefined

  while (!seenCursors.has(cursor)) {
    seenCursors.add(cursor)
    const page = await client.getRunEvents({ runId, cursor })
    events = mergeRunEventLists(events, page.events)

    if (!page.nextCursor) {
      break
    }

    cursor = page.nextCursor
  }

  return events
}

export function useRunEventTimelineQuery(
  runId: string | null | undefined,
  deps: UseRunEventTimelineQueryDeps = {},
) {
  const runtime = useOptionalProjectRuntime()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    deps.projectId,
    runtime?.projectId,
    'useRunEventTimelineQuery',
    'deps.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency<RunTimelineClient>(
    deps.client,
    runtime?.runClient,
    'useRunEventTimelineQuery',
    'deps.client',
  )
  const runtimeInfoClient = runtime?.runtimeInfoClient
  const runtimeInfoQuery = useQuery({
    queryKey: ['project-runtime', effectiveProjectId, 'health'],
    enabled: Boolean(runId && runtimeInfoClient),
    queryFn: () => runtimeInfoClient!.getProjectRuntimeInfo(),
  })
  const streamEnabled = runtimeInfoClient ? supportsRunEventStream(runtimeInfoQuery.data) : false
  const pollingEnabled = runtimeInfoClient
    ? runtimeInfoQuery.isError
      ? true
      : supportsRunEventPolling(runtimeInfoQuery.data)
    : true
  const canUseStream = Boolean(runId && streamEnabled && effectiveClient.streamRunEvents)
  const shouldWaitForRuntimeInfo = Boolean(runId && runtimeInfoClient && runtimeInfoQuery.isPending)
  const [streamState, setStreamState] = useState<{
    runId: string | null
    status: 'idle' | 'connecting' | 'healthy' | 'closed' | 'failed'
    events: RunEventRecord[]
    error: unknown | null
  }>({
    runId: runId ?? null,
    status: 'idle',
    events: [],
    error: null,
  })

  useEffect(() => {
    setStreamState({
      runId: runId ?? null,
      status: 'idle',
      events: [],
      error: null,
    })
  }, [runId])

  useEffect(() => {
    if (!runId || !canUseStream || !effectiveClient.streamRunEvents) {
      return
    }

    const abortController = new AbortController()
    let active = true

    setStreamState({
      runId,
      status: 'connecting',
      events: [],
      error: null,
    })

    void effectiveClient.streamRunEvents({
      runId,
      cursor: undefined,
      signal: abortController.signal,
      onOpen: () => {
        if (!active) {
          return
        }

        setStreamState((current) =>
          current.runId === runId
            ? {
                ...current,
                status: 'healthy',
              }
            : current,
        )
      },
      onPage: (page) => {
        if (!active) {
          return
        }

        setStreamState((current) =>
          current.runId === runId
            ? {
                runId,
                status: 'healthy',
                events: mergeRunEventLists(current.events, page.events),
                error: null,
              }
            : current,
        )
      },
    }).then(() => {
      if (!active || abortController.signal.aborted) {
        return
      }

      setStreamState((current) =>
        current.runId === runId && (current.status === 'connecting' || current.status === 'healthy')
          ? {
              ...current,
              status: 'closed',
            }
          : current,
      )
    }).catch((error) => {
      if (!active || abortController.signal.aborted) {
        return
      }

      setStreamState((current) =>
        current.runId === runId
          ? {
              ...current,
              status: 'failed',
              error,
            }
          : current,
      )
    })

    return () => {
      active = false
      abortController.abort()
    }
  }, [runId, canUseStream, effectiveClient])

  const shouldUseFallbackPolling = Boolean(
    runId &&
      pollingEnabled &&
      (!canUseStream || streamState.status === 'failed' || streamState.status === 'closed' || runtimeInfoQuery.isError) &&
      (!shouldWaitForRuntimeInfo || streamState.status === 'failed' || streamState.status === 'closed'),
  )
  const query = useQuery({
    queryKey: runQueryKeys.events(effectiveProjectId, runId ?? '__missing__'),
    enabled: shouldUseFallbackPolling,
    queryFn: () => loadRunEventTimeline(effectiveClient, runId!),
  })
  const events = shouldUseFallbackPolling
    ? query.data
      ? mergeRunEventLists(streamState.events, query.data)
      : streamState.events
    : streamState.events
  const isLoading = Boolean(runId) && (
    shouldWaitForRuntimeInfo ||
    (canUseStream
      ? streamState.status === 'connecting' && streamState.events.length === 0
      : query.isLoading)
  )

  return {
    events,
    isLoading,
    error: shouldUseFallbackPolling ? query.error : streamState.status === 'failed' ? streamState.error : null,
    isStreamHealthy: canUseStream && streamState.status === 'healthy',
    prefersStreamTransport: shouldWaitForRuntimeInfo || (canUseStream && streamState.status !== 'failed' && streamState.status !== 'closed'),
    usesPagingFallback: shouldUseFallbackPolling,
    refetch: async () => {
      if (!shouldUseFallbackPolling) {
        return
      }

      await query.refetch()
    },
  }
}
