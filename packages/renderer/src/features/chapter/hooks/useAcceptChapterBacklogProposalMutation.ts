import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import {
  chapterClient,
  type AcceptChapterBacklogProposalInput,
  type ChapterClient,
} from '../api/chapter-client'
import { acceptChapterBacklogProposal } from '../api/chapter-record-mutations'
import type { ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import { chapterQueryKeys } from './chapter-query-keys'
import {
  applyChapterWorkspaceOptimisticUpdate,
  commitChapterWorkspaceOptimisticUpdate,
  invalidateChapterWorkspaceQueryOnSettled,
  rollbackChapterWorkspaceOptimisticUpdate,
  type ChapterWorkspaceOptimisticMutationContext,
} from './chapter-workspace-optimistic-state'

interface UseAcceptChapterBacklogProposalMutationOptions {
  chapterId: string
  client?: ChapterClient
}

export function useAcceptChapterBacklogProposalMutation({
  chapterId,
  client,
}: UseAcceptChapterBacklogProposalMutationOptions) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const queryClient = useQueryClient()
  const queryKey = chapterQueryKeys.workspace(chapterId)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.chapterClient,
    'useAcceptChapterBacklogProposalMutation',
    'options.client',
  )

  return useMutation<
    ChapterStructureWorkspaceRecord | null,
    Error,
    Omit<AcceptChapterBacklogProposalInput, 'chapterId'>,
    ChapterWorkspaceOptimisticMutationContext
  >({
    mutationFn: async ({ proposalId }) =>
      effectiveClient.acceptChapterBacklogProposal({
        chapterId,
        proposalId,
        locale,
      }),
    onMutate: async ({ proposalId }) => {
      await queryClient.cancelQueries({ queryKey })
      return applyChapterWorkspaceOptimisticUpdate(queryClient, queryKey, (record) => {
        if (!record) {
          return record
        }
        return acceptChapterBacklogProposal(record, proposalId)
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
