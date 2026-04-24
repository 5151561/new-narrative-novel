import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'

import type { RunClient } from '../api/run-client'

import { runQueryKeys } from './run-query-keys'

interface UseRunTraceQueryDeps {
  client?: Pick<RunClient, 'getRunTrace'>
  projectId?: string
}

export function useRunTraceQuery(runId: string | null | undefined, deps: UseRunTraceQueryDeps = {}) {
  const runtime = useOptionalProjectRuntime()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    deps.projectId,
    runtime?.projectId,
    'useRunTraceQuery',
    'deps.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency(
    deps.client,
    runtime?.runClient,
    'useRunTraceQuery',
    'deps.client',
  )
  const query = useQuery({
    queryKey: runQueryKeys.trace(effectiveProjectId, runId ?? '__missing__'),
    enabled: Boolean(runId),
    queryFn: () => effectiveClient.getRunTrace({ runId: runId! }),
  })

  return {
    trace: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
