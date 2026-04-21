import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'

import type { RunClient } from '../api/run-client'

import { runQueryKeys } from './run-query-keys'

interface UseRunQueryDeps {
  client?: Pick<RunClient, 'getRun'>
  projectId?: string
}

export function useRunQuery(runId: string | null | undefined, deps: UseRunQueryDeps = {}) {
  const runtime = useOptionalProjectRuntime()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    deps.projectId,
    runtime?.projectId,
    'useRunQuery',
    'deps.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency(
    deps.client,
    runtime?.runClient,
    'useRunQuery',
    'deps.client',
  )
  const query = useQuery({
    queryKey: runQueryKeys.detail(effectiveProjectId, runId ?? '__missing__'),
    enabled: Boolean(runId),
    queryFn: () => effectiveClient.getRun({ runId: runId! }),
  })

  return {
    run: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
