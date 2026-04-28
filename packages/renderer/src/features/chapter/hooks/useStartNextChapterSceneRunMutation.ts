import { useMutation, useQueryClient } from '@tanstack/react-query'

import { classifyApiWriteErrorState, resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import { runQueryKeys } from '@/features/run/hooks/run-query-keys'

import type { ChapterClient } from '../api/chapter-client'
import type { StartNextChapterSceneRunInput, StartNextChapterSceneRunRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'

interface UseStartNextChapterSceneRunMutationOptions {
  chapterId: string
  client?: Pick<ChapterClient, 'startNextChapterSceneRun'>
  projectId?: string
}

type MutationInput = Omit<StartNextChapterSceneRunInput, 'chapterId'>

export function useStartNextChapterSceneRunMutation(options: UseStartNextChapterSceneRunMutationOptions) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const effectiveProjectId = resolveProjectRuntimeDependency(
    options.projectId,
    runtime?.projectId,
    'useStartNextChapterSceneRunMutation',
    'options.projectId',
  )
  const effectiveClient = resolveProjectRuntimeDependency(
    options.client,
    runtime?.chapterClient,
    'useStartNextChapterSceneRunMutation',
    'options.client',
  )

  const mutation = useMutation<StartNextChapterSceneRunRecord | null, Error, MutationInput>({
    mutationFn: (input) => effectiveClient.startNextChapterSceneRun({
      chapterId: options.chapterId,
      ...input,
    }),
    onSuccess: async (record) => {
      if (!record) {
        return
      }

      queryClient.setQueryData(
        chapterQueryKeys.workspace(options.chapterId),
        record.chapter,
      )
      queryClient.setQueryData(runQueryKeys.detail(effectiveProjectId, record.run.id), record.run)

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: chapterQueryKeys.workspace(options.chapterId),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: sceneQueryKeys.workspace(record.selectedScene.sceneId),
          refetchType: 'active',
        }),
        queryClient.invalidateQueries({
          queryKey: sceneQueryKeys.execution(record.selectedScene.sceneId),
          refetchType: 'active',
        }),
      ])
    },
  })

  return {
    ...mutation,
    errorState: mutation.error ? classifyApiWriteErrorState(mutation.error) : null,
  }
}
