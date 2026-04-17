import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  chapterClient,
  type ChapterClient,
  type UpdateChapterSceneStructureInput,
} from '../api/chapter-client'
import { patchChapterRecordScene } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import {
  applyChapterWorkspaceOptimisticUpdate,
  commitChapterWorkspaceOptimisticUpdate,
  invalidateChapterWorkspaceQueryOnSettled,
  rollbackChapterWorkspaceOptimisticUpdate,
  type ChapterWorkspaceOptimisticMutationContext,
} from './chapter-workspace-optimistic-state'

interface UseUpdateChapterSceneStructureMutationOptions {
  chapterId: string
  client?: ChapterClient
}

export function useUpdateChapterSceneStructureMutation({
  chapterId,
  client = chapterClient,
}: UseUpdateChapterSceneStructureMutationOptions) {
  const queryClient = useQueryClient()
  const queryKey = chapterQueryKeys.workspace(chapterId)

  return useMutation<
    ChapterStructureWorkspaceRecord | null,
    Error,
    Omit<UpdateChapterSceneStructureInput, 'chapterId'>,
    ChapterWorkspaceOptimisticMutationContext
  >({
    mutationFn: async ({ sceneId, locale, patch }) =>
      client.updateChapterSceneStructure({
        chapterId,
        sceneId,
        locale,
        patch,
      }),
    onMutate: async ({ sceneId, locale, patch }) => {
      await queryClient.cancelQueries({ queryKey })

      return applyChapterWorkspaceOptimisticUpdate(queryClient, queryKey, (record) => {
        if (!record) {
          return record
        }

        return patchChapterRecordScene(record, sceneId, patch, locale)
      })
    },
    onSuccess: (record, _variables, context) => {
      commitChapterWorkspaceOptimisticUpdate(queryClient, queryKey, context, record)
    },
    onError: (_error, _variables, context) => {
      rollbackChapterWorkspaceOptimisticUpdate(queryClient, queryKey, context)
    },
    onSettled: async () => {
      await invalidateChapterWorkspaceQueryOnSettled(queryClient, queryKey)
    },
  })
}
