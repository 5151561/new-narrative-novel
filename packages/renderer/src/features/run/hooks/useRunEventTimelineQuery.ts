import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'

import type { RunClient } from '../api/run-client'
import type { RunEventRecord } from '../api/run-records'

import { runQueryKeys } from './run-query-keys'

interface UseRunEventTimelineQueryDeps {
  client?: Pick<RunClient, 'getRunEvents'>
  projectId?: string
}

async function loadRunEventTimeline(
  client: Pick<RunClient, 'getRunEvents'>,
  runId: string,
): Promise<RunEventRecord[]> {
  const mergedEvents = new Map<string, RunEventRecord>()
  const seenCursors = new Set<string | undefined>()
  let cursor: string | undefined

  while (!seenCursors.has(cursor)) {
    seenCursors.add(cursor)
    const page = await client.getRunEvents({ runId, cursor })

    for (const event of page.events) {
      mergedEvents.set(event.id, event)
    }

    if (!page.nextCursor) {
      break
    }

    cursor = page.nextCursor
  }

  return Array.from(mergedEvents.values()).sort((left, right) => left.order - right.order)
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
  const effectiveClient = resolveProjectRuntimeDependency(
    deps.client,
    runtime?.runClient,
    'useRunEventTimelineQuery',
    'deps.client',
  )
  const query = useQuery({
    queryKey: runQueryKeys.events(effectiveProjectId, runId ?? '__missing__'),
    enabled: Boolean(runId),
    queryFn: () => loadRunEventTimeline(effectiveClient, runId!),
  })

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
