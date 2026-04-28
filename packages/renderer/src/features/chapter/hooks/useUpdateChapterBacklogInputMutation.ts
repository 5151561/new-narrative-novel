import { useMutation, useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import {
  chapterClient,
  type ChapterClient,
  type UpdateChapterBacklogInput,
} from '../api/chapter-client'
import { patchChapterBacklogPlanning } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import {
  applyChapterWorkspaceOptimisticUpdate,
  commitChapterWorkspaceOptimisticUpdate,
  invalidateChapterWorkspaceQueryOnSettled,
  rollbackChapterWorkspaceOptimisticUpdate,
  type ChapterWorkspaceOptimisticMutationContext,
} from './chapter-workspace-optimistic-state'

interface UseUpdateChapterBacklogInputMutationOptions {
  chapterId: string
  client?: ChapterClient
}

export function useUpdateChapterBacklogInputMutation({
  chapterId,
  client,
}: UseUpdateChapterBacklogInputMutationOptions) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const queryKey = chapterQueryKeys.workspace(chapterId)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.chapterClient,
    'useUpdateChapterBacklogInputMutation',
    'options.client',
  )

  return useMutation<
    ChapterStructureWorkspaceRecord | null,
    Error,
    Omit<UpdateChapterBacklogInput, 'chapterId'>,
    ChapterWorkspaceOptimisticMutationContext
  >({
    mutationFn: async ({ locale, goal, constraints }) =>
      effectiveClient.updateChapterBacklogInput({
        chapterId,
        locale,
        goal,
        constraints,
      }),
    onMutate: async ({ locale, goal, constraints }) => {
      await queryClient.cancelQueries({ queryKey })
      return applyChapterWorkspaceOptimisticUpdate(queryClient, queryKey, (record) => {
        if (!record) {
          return record
        }
        return patchChapterBacklogPlanning(record, { goal, constraints }, locale)
      })
    },
    onSuccess: (record, _variables, context) => {
      commitChapterWorkspaceOptimisticUpdate(queryClient, queryKey, context, record)
      if (record) {
        void queryClient.invalidateQueries({ queryKey: bookQueryKeys.all })
      }
    },
    onError: (_error, _variables, context) => {
      rollbackChapterWorkspaceOptimisticUpdate(queryClient, queryKey, context)
    },
    onSettled: async () => {
      await invalidateChapterWorkspaceQueryOnSettled(queryClient, queryKey)
    },
  })
}
