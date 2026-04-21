import { useMutation, useQueryClient } from '@tanstack/react-query'

import { classifyApiWriteErrorState, resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunRecord, SubmitRunReviewDecisionInput } from '@/features/run/api/run-records'

import { runQueryKeys } from './run-query-keys'

interface UseSubmitRunReviewDecisionMutationOptions {
  client?: Pick<RunClient, 'submitRunReviewDecision'>
  projectId?: string
}

export function useSubmitRunReviewDecisionMutation(options: UseSubmitRunReviewDecisionMutationOptions = {}) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    options.projectId,
    runtime?.projectId,
    'useSubmitRunReviewDecisionMutation',
    'options.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency(
    options.client,
    runtime?.runClient,
    'useSubmitRunReviewDecisionMutation',
    'options.client',
  )
  const mutation = useMutation<RunRecord, Error, SubmitRunReviewDecisionInput>({
    mutationFn: async (input) => effectiveClient.submitRunReviewDecision(input),
    onSuccess: async (run) => {
      queryClient.setQueryData(runQueryKeys.detail(effectiveProjectId, run.id), run)
      await queryClient.invalidateQueries({
        queryKey: runQueryKeys.events(effectiveProjectId, run.id),
        refetchType: 'active',
      })
    },
  })

  return {
    ...mutation,
    errorState: mutation.error ? classifyApiWriteErrorState(mutation.error) : null,
  }
}
