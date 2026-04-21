import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'

import type { RunClient } from '../api/run-client'

import { runQueryKeys } from './run-query-keys'

interface UseRunEventsQueryInput {
  runId: string | null | undefined
  cursor?: string
}

interface UseRunEventsQueryDeps {
  client?: Pick<RunClient, 'getRunEvents'>
  projectId?: string
}

export function useRunEventsQuery({
  runId,
  cursor,
}: UseRunEventsQueryInput, deps: UseRunEventsQueryDeps = {}) {
  const runtime = useOptionalProjectRuntime()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    deps.projectId,
    runtime?.projectId,
    'useRunEventsQuery',
    'deps.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency(
    deps.client,
    runtime?.runClient,
    'useRunEventsQuery',
    'deps.client',
  )
  const query = useQuery({
    queryKey: runQueryKeys.eventsPage(effectiveProjectId, runId ?? '__missing__', cursor),
    enabled: Boolean(runId),
    queryFn: () => effectiveClient.getRunEvents({ runId: runId!, cursor }),
  })

  return {
    page: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
