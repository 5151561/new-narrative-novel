import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'

import type { RunClient } from '../api/run-client'

import { runQueryKeys } from './run-query-keys'

interface UseRunArtifactsQueryDeps {
  client?: Pick<RunClient, 'listRunArtifacts'>
  projectId?: string
}

export function useRunArtifactsQuery(runId: string | null | undefined, deps: UseRunArtifactsQueryDeps = {}) {
  const runtime = useOptionalProjectRuntime()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    deps.projectId,
    runtime?.projectId,
    'useRunArtifactsQuery',
    'deps.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency(
    deps.client,
    runtime?.runClient,
    'useRunArtifactsQuery',
    'deps.client',
  )
  const query = useQuery({
    queryKey: runQueryKeys.artifacts(effectiveProjectId, runId ?? '__missing__'),
    enabled: Boolean(runId),
    queryFn: () => effectiveClient.listRunArtifacts({ runId: runId! }),
  })

  return {
    artifacts: query.data?.artifacts ?? [],
    response: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
