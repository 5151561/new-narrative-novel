import { useMutation, useQueryClient } from '@tanstack/react-query'

import { classifyApiWriteErrorState, resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'
import type { RunClient } from '@/features/run/api/run-client'
import type { RunRecord, SubmitRunReviewDecisionInput } from '@/features/run/api/run-records'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

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
      const invalidations: Array<Promise<unknown>> = [
        queryClient.invalidateQueries({
          queryKey: runQueryKeys.detail(effectiveProjectId, run.id),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: runQueryKeys.events(effectiveProjectId, run.id),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: runQueryKeys.artifacts(effectiveProjectId, run.id),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: runQueryKeys.trace(effectiveProjectId, run.id),
          refetchType: 'active',
        }),
      ]

      if (run.scope === 'scene') {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: sceneQueryKeys.workspace(run.scopeId),
            refetchType: 'active',
          }),
          queryClient.invalidateQueries({
            queryKey: sceneQueryKeys.execution(run.scopeId),
            refetchType: 'active',
          }),
          queryClient.invalidateQueries({
            queryKey: sceneQueryKeys.prose(run.scopeId),
            refetchType: 'active',
          }),
          queryClient.invalidateQueries({
            queryKey: sceneQueryKeys.inspector(run.scopeId),
            refetchType: 'active',
          }),
          queryClient.invalidateQueries({
            queryKey: sceneQueryKeys.dock(run.scopeId),
            refetchType: 'active',
          }),
          queryClient.invalidateQueries({
            queryKey: sceneQueryKeys.patchPreview(run.scopeId),
            refetchType: 'active',
          }),
          queryClient.invalidateQueries({
            queryKey: chapterQueryKeys.all,
            refetchType: 'active',
          }),
          queryClient.invalidateQueries({
            queryKey: bookQueryKeys.all,
            refetchType: 'active',
          }),
        )
      }

      await Promise.all(invalidations)
    },
  })

  return {
    ...mutation,
    errorState: mutation.error ? classifyApiWriteErrorState(mutation.error) : null,
  }
}
