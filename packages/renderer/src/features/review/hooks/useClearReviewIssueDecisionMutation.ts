import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reviewClient, type ReviewClient } from '../api/review-client'
import type { ClearReviewIssueDecisionInput, ReviewIssueDecisionRecord } from '../api/review-decision-records'
import {
  beginReviewDecisionMutation,
  isLatestReviewDecisionMutation,
  settleReviewDecisionMutation,
  type ReviewDecisionMutationToken,
} from './review-decision-optimistic-state'
import { reviewQueryKeys } from './review-query-keys'

interface UseClearReviewIssueDecisionMutationOptions {
  bookId: string
  client?: Pick<ReviewClient, 'clearReviewIssueDecision'>
}

interface ReviewDecisionOptimisticContext {
  previousRecord: ReviewIssueDecisionRecord | undefined
  previousIndex: number
  optimisticToken: ReviewDecisionMutationToken
}

export function useClearReviewIssueDecisionMutation({
  bookId,
  client = reviewClient,
}: UseClearReviewIssueDecisionMutationOptions) {
  const queryClient = useQueryClient()
  const queryKey = reviewQueryKeys.decisions(bookId)

  return useMutation<void, Error, Omit<ClearReviewIssueDecisionInput, 'bookId'>, ReviewDecisionOptimisticContext>({
    mutationFn: async ({ issueId }) =>
      client.clearReviewIssueDecision({
        bookId,
        issueId,
      }),
    onMutate: async ({ issueId }) => {
      await queryClient.cancelQueries({ queryKey })

      const previousRecords = queryClient.getQueryData<ReviewIssueDecisionRecord[]>(queryKey) ?? []
      const previousIndex = previousRecords.findIndex((record) => record.issueId === issueId)
      const optimisticToken = beginReviewDecisionMutation(bookId, issueId)
      queryClient.setQueryData<ReviewIssueDecisionRecord[]>(queryKey, (current = []) =>
        current.filter((record) => record.issueId !== issueId),
      )

      return {
        previousRecord: previousIndex >= 0 ? previousRecords[previousIndex] : undefined,
        previousIndex,
        optimisticToken,
      }
    },
    onError: (_error, variables, context) => {
      if (!context || !isLatestReviewDecisionMutation(context.optimisticToken)) {
        return
      }

      queryClient.setQueryData<ReviewIssueDecisionRecord[]>(queryKey, (current = []) => {
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
      const shouldInvalidate = context ? isLatestReviewDecisionMutation(context.optimisticToken) : true

      if (context) {
        settleReviewDecisionMutation(context.optimisticToken)
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
