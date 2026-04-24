import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'

import type { RunClient } from '../api/run-client'

import { runQueryKeys } from './run-query-keys'

interface UseRunArtifactDetailQueryInput {
  runId: string | null | undefined
  artifactId: string | null | undefined
}

interface UseRunArtifactDetailQueryDeps {
  client?: Pick<RunClient, 'getRunArtifact'>
  projectId?: string
}

export function useRunArtifactDetailQuery(
  {
    runId,
    artifactId,
  }: UseRunArtifactDetailQueryInput,
  deps: UseRunArtifactDetailQueryDeps = {},
) {
  const runtime = useOptionalProjectRuntime()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    deps.projectId,
    runtime?.projectId,
    'useRunArtifactDetailQuery',
    'deps.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency(
    deps.client,
    runtime?.runClient,
    'useRunArtifactDetailQuery',
    'deps.client',
  )
  const query = useQuery({
    queryKey: runQueryKeys.artifact(effectiveProjectId, runId ?? '__missing__', artifactId ?? '__missing__'),
    enabled: Boolean(runId && artifactId),
    queryFn: () => effectiveClient.getRunArtifact({ runId: runId!, artifactId: artifactId! }),
  })

  return {
    artifact: query.data?.artifact ?? null,
    response: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
