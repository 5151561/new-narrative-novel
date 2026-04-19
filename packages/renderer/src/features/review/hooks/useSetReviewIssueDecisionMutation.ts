import { useMutation, useQueryClient } from '@tanstack/react-query'

import { reviewClient, type ReviewClient } from '../api/review-client'
import type { ReviewIssueDecisionRecord, SetReviewIssueDecisionInput } from '../api/review-decision-records'
import { createReviewDecisionRecordId } from '../api/review-decision-records'
import {
  beginReviewDecisionMutation,
  isLatestReviewDecisionMutation,
  settleReviewDecisionMutation,
  type ReviewDecisionMutationToken,
} from './review-decision-optimistic-state'
import { reviewQueryKeys } from './review-query-keys'

interface UseSetReviewIssueDecisionMutationOptions {
  bookId: string
  client?: Pick<ReviewClient, 'setReviewIssueDecision'>
}

interface ReviewDecisionOptimisticContext {
  previousRecord: ReviewIssueDecisionRecord | undefined
  previousIndex: number
  optimisticToken: ReviewDecisionMutationToken
}

export function useSetReviewIssueDecisionMutation({
  bookId,
  client = reviewClient,
}: UseSetReviewIssueDecisionMutationOptions) {
  const queryClient = useQueryClient()
  const queryKey = reviewQueryKeys.decisions(bookId)

  return useMutation<ReviewIssueDecisionRecord, Error, Omit<SetReviewIssueDecisionInput, 'bookId'>, ReviewDecisionOptimisticContext>({
    mutationFn: async ({ issueId, issueSignature, status, note }) =>
      client.setReviewIssueDecision({
        bookId,
        issueId,
        issueSignature,
        status,
        note,
      }),
    onMutate: async ({ issueId, issueSignature, status, note }) => {
      await queryClient.cancelQueries({ queryKey })

      const previousRecords = queryClient.getQueryData<ReviewIssueDecisionRecord[]>(queryKey) ?? []
      const previousIndex = previousRecords.findIndex((record) => record.issueId === issueId)
      const optimisticToken = beginReviewDecisionMutation(bookId, issueId)
      const optimisticRecord: ReviewIssueDecisionRecord = {
        id: createReviewDecisionRecordId(bookId, issueId),
        bookId,
        issueId,
        issueSignature,
        status,
        note: note?.trim() ? note.trim() : undefined,
        updatedAtLabel: 'Saving review decision',
        updatedByLabel: 'Narrative editor',
      }

      queryClient.setQueryData<ReviewIssueDecisionRecord[]>(queryKey, (current = []) => {
        const next = current.filter((record) => record.issueId !== issueId)
        return [...next, optimisticRecord]
      })

      return {
        previousRecord: previousIndex >= 0 ? previousRecords[previousIndex] : undefined,
        previousIndex,
        optimisticToken,
      }
    },
    onSuccess: (record, _variables, context) => {
      if (!context || !isLatestReviewDecisionMutation(context.optimisticToken)) {
        return
      }

      queryClient.setQueryData<ReviewIssueDecisionRecord[]>(queryKey, (current = []) => {
        const next = current.filter((item) => item.issueId !== record.issueId)
        return [...next, record]
      })
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
