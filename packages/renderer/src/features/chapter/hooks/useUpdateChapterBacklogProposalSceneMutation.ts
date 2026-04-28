import { useMutation, useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import {
  chapterClient,
  type ChapterClient,
  type UpdateChapterBacklogProposalSceneInput,
} from '../api/chapter-client'
import { patchChapterBacklogProposalScene } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import {
  applyChapterWorkspaceOptimisticUpdate,
  commitChapterWorkspaceOptimisticUpdate,
  invalidateChapterWorkspaceQueryOnSettled,
  rollbackChapterWorkspaceOptimisticUpdate,
  type ChapterWorkspaceOptimisticMutationContext,
} from './chapter-workspace-optimistic-state'

interface UseUpdateChapterBacklogProposalSceneMutationOptions {
  chapterId: string
  client?: ChapterClient
}

export function useUpdateChapterBacklogProposalSceneMutation({
  chapterId,
  client,
}: UseUpdateChapterBacklogProposalSceneMutationOptions) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const queryKey = chapterQueryKeys.workspace(chapterId)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.chapterClient,
    'useUpdateChapterBacklogProposalSceneMutation',
    'options.client',
  )

  return useMutation<
    ChapterStructureWorkspaceRecord | null,
    Error,
    Omit<UpdateChapterBacklogProposalSceneInput, 'chapterId'>,
    ChapterWorkspaceOptimisticMutationContext
  >({
    mutationFn: async ({ proposalId, proposalSceneId, locale, patch, order, backlogStatus }) =>
      effectiveClient.updateChapterBacklogProposalScene({
        chapterId,
        proposalId,
        proposalSceneId,
        locale,
        patch,
        order,
        backlogStatus,
      }),
    onMutate: async ({ proposalId, proposalSceneId, locale, patch, order, backlogStatus }) => {
      await queryClient.cancelQueries({ queryKey })
      return applyChapterWorkspaceOptimisticUpdate(queryClient, queryKey, (record) => {
        if (!record) {
          return record
        }
        return patchChapterBacklogProposalScene(record, proposalId, proposalSceneId, patch ?? {}, locale, order, backlogStatus)
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
