import { useMutation, useQueryClient } from '@tanstack/react-query'

import { classifyApiWriteErrorState, resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunRecord, StartSceneRunInput } from '@/features/run/api/run-records'

import { runQueryKeys } from './run-query-keys'

interface UseStartSceneRunMutationOptions {
  client?: Pick<RunClient, 'startSceneRun' | 'getRunEvents'>
  projectId?: string
}

export function useStartSceneRunMutation(options: UseStartSceneRunMutationOptions = {}) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    options.projectId,
    runtime?.projectId,
    'useStartSceneRunMutation',
    'options.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency(
    options.client,
    runtime?.runClient,
    'useStartSceneRunMutation',
    'options.client',
  )
  const mutation = useMutation<RunRecord, Error, StartSceneRunInput>({
    mutationFn: async (input) => effectiveClient.startSceneRun(input),
    onSuccess: (run) => {
      queryClient.setQueryData(runQueryKeys.detail(effectiveProjectId, run.id), run)
      void queryClient.prefetchQuery({
        queryKey: runQueryKeys.eventsPage(effectiveProjectId, run.id, undefined),
        queryFn: () => effectiveClient.getRunEvents({ runId: run.id, cursor: undefined }),
      })
    },
  })

  return {
    ...mutation,
    errorState: mutation.error ? classifyApiWriteErrorState(mutation.error) : null,
  }
}
