import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import {
  chapterClient,
  type ChapterClient,
} from '../api/chapter-client'
import { appendGeneratedChapterBacklogProposal } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import {
  applyChapterWorkspaceOptimisticUpdate,
  commitChapterWorkspaceOptimisticUpdate,
  invalidateChapterWorkspaceQueryOnSettled,
  rollbackChapterWorkspaceOptimisticUpdate,
  type ChapterWorkspaceOptimisticMutationContext,
} from './chapter-workspace-optimistic-state'

interface UseGenerateChapterBacklogProposalMutationOptions {
  chapterId: string
  client?: ChapterClient
}

export function useGenerateChapterBacklogProposalMutation({
  chapterId,
  client,
}: UseGenerateChapterBacklogProposalMutationOptions) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const queryClient = useQueryClient()
  const queryKey = chapterQueryKeys.workspace(chapterId)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.chapterClient,
    'useGenerateChapterBacklogProposalMutation',
    'options.client',
  )

  return useMutation<ChapterStructureWorkspaceRecord | null, Error, void, ChapterWorkspaceOptimisticMutationContext>({
    mutationFn: async () => effectiveClient.generateChapterBacklogProposal({ chapterId, locale }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey })
      return applyChapterWorkspaceOptimisticUpdate(queryClient, queryKey, (record) => {
        if (!record) {
          return record
        }
        return appendGeneratedChapterBacklogProposal(record)
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
