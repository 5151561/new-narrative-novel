import { useMutation, useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { chapterClient, type ChapterClient, type ReorderChapterSceneInput } from '../api/chapter-client'
import { reorderChapterRecordScenes } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import {
  applyChapterWorkspaceOptimisticUpdate,
  commitChapterWorkspaceOptimisticUpdate,
  invalidateChapterWorkspaceQueryOnSettled,
  rollbackChapterWorkspaceOptimisticUpdate,
  type ChapterWorkspaceOptimisticMutationContext,
} from './chapter-workspace-optimistic-state'

interface UseReorderChapterSceneMutationOptions {
  chapterId: string
  client?: ChapterClient
}

export function useReorderChapterSceneMutation({
  chapterId,
  client,
}: UseReorderChapterSceneMutationOptions) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const queryKey = chapterQueryKeys.workspace(chapterId)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.chapterClient,
    'useReorderChapterSceneMutation',
    'options.client',
  )

  return useMutation<ChapterStructureWorkspaceRecord | null, Error, Omit<ReorderChapterSceneInput, 'chapterId'>, ChapterWorkspaceOptimisticMutationContext>({
    mutationFn: async ({ sceneId, targetIndex }) =>
      effectiveClient.reorderChapterScene({
        chapterId,
        sceneId,
        targetIndex,
      }),
    onMutate: async ({ sceneId, targetIndex }) => {
      await queryClient.cancelQueries({ queryKey })

      return applyChapterWorkspaceOptimisticUpdate(queryClient, queryKey, (record) => {
        if (!record) {
          return record
        }

        return reorderChapterRecordScenes(record, sceneId, targetIndex)
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
