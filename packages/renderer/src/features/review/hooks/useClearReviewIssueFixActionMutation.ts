import { useMutation, useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { reviewClient, type ReviewClient } from '../api/review-client'
import type { ClearReviewIssueFixActionInput, ReviewIssueFixActionRecord } from '../api/review-fix-action-records'
import {
  beginReviewFixActionMutation,
  isLatestReviewFixActionMutation,
  settleReviewFixActionMutation,
  type ReviewFixActionMutationToken,
} from './review-fix-action-optimistic-state'
import { reviewQueryKeys } from './review-query-keys'

interface UseClearReviewIssueFixActionMutationOptions {
  bookId: string
  client?: Pick<ReviewClient, 'clearReviewIssueFixAction'>
}

interface ReviewFixActionOptimisticContext {
  previousRecord: ReviewIssueFixActionRecord | undefined
  previousIndex: number
  optimisticToken: ReviewFixActionMutationToken
}

export function useClearReviewIssueFixActionMutation({
  bookId,
  client,
}: UseClearReviewIssueFixActionMutationOptions) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const queryKey = reviewQueryKeys.fixActions(bookId)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.reviewClient,
    'useClearReviewIssueFixActionMutation',
    'options.client',
  )

  return useMutation<void, Error, Omit<ClearReviewIssueFixActionInput, 'bookId'>, ReviewFixActionOptimisticContext>({
    mutationFn: async ({ issueId }) =>
      effectiveClient.clearReviewIssueFixAction({
        bookId,
        issueId,
      }),
    onMutate: async ({ issueId }) => {
      await queryClient.cancelQueries({ queryKey })

      const previousRecords = queryClient.getQueryData<ReviewIssueFixActionRecord[]>(queryKey) ?? []
      const previousIndex = previousRecords.findIndex((record) => record.issueId === issueId)
      const optimisticToken = beginReviewFixActionMutation(bookId, issueId)
      queryClient.setQueryData<ReviewIssueFixActionRecord[]>(queryKey, (current = []) =>
        current.filter((record) => record.issueId !== issueId),
      )

      return {
        previousRecord: previousIndex >= 0 ? previousRecords[previousIndex] : undefined,
        previousIndex,
        optimisticToken,
      }
    },
    onError: (_error, variables, context) => {
      if (!context || !isLatestReviewFixActionMutation(context.optimisticToken)) {
        return
      }

      queryClient.setQueryData<ReviewIssueFixActionRecord[]>(queryKey, (current = []) => {
        const next = current.filter((record) => record.issueId !== variables.issueId)
        if (!context?.previousRecord) {
          return next
        }

        const insertIndex =
          context.previousIndex >= 0 && context.previousIndex <= next.length ? context.previousIndex : next.length
        next.splice(insertIndex, 0, context.previousRecord)
        return next
      })
    },
    onSettled: async (_data, _error, _variables, context) => {
      const shouldInvalidate = context ? isLatestReviewFixActionMutation(context.optimisticToken) : true

      if (context) {
        settleReviewFixActionMutation(context.optimisticToken)
      }

      if (shouldInvalidate) {
        await queryClient.invalidateQueries({
          queryKey,
          refetchType: 'active',
        })
      }
    },
  })
}
