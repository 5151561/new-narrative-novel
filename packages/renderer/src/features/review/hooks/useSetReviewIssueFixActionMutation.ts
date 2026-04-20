import { useMutation, useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import { reviewClient, type ReviewClient } from '../api/review-client'
import type { ReviewIssueFixActionRecord, SetReviewIssueFixActionInput } from '../api/review-fix-action-records'
import { createReviewFixActionRecordId } from '../api/review-fix-action-records'
import {
  beginReviewFixActionMutation,
  isLatestReviewFixActionMutation,
  settleReviewFixActionMutation,
  type ReviewFixActionMutationToken,
} from './review-fix-action-optimistic-state'
import { reviewQueryKeys } from './review-query-keys'

interface UseSetReviewIssueFixActionMutationOptions {
  bookId: string
  client?: Pick<ReviewClient, 'setReviewIssueFixAction'>
}

interface ReviewFixActionOptimisticContext {
  previousRecord: ReviewIssueFixActionRecord | undefined
  previousIndex: number
  optimisticToken: ReviewFixActionMutationToken
}

export function useSetReviewIssueFixActionMutation({
  bookId,
  client,
}: UseSetReviewIssueFixActionMutationOptions) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const queryKey = reviewQueryKeys.fixActions(bookId)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.reviewClient,
    'useSetReviewIssueFixActionMutation',
    'options.client',
  )

  return useMutation<
    ReviewIssueFixActionRecord,
    Error,
    Omit<SetReviewIssueFixActionInput, 'bookId'>,
    ReviewFixActionOptimisticContext
  >({
    mutationFn: async ({
      issueId,
      issueSignature,
      sourceHandoffId,
      sourceHandoffLabel,
      targetScope,
      status,
      note,
    }) =>
      effectiveClient.setReviewIssueFixAction({
        bookId,
        issueId,
        issueSignature,
        sourceHandoffId,
        sourceHandoffLabel,
        targetScope,
        status,
        note,
      }),
    onMutate: async ({
      issueId,
      issueSignature,
      sourceHandoffId,
      sourceHandoffLabel,
      targetScope,
      status,
      note,
    }) => {
      await queryClient.cancelQueries({ queryKey })

      const previousRecords = queryClient.getQueryData<ReviewIssueFixActionRecord[]>(queryKey) ?? []
      const previousIndex = previousRecords.findIndex((record) => record.issueId === issueId)
      const previousRecord = previousIndex >= 0 ? previousRecords[previousIndex] : undefined
      const optimisticToken = beginReviewFixActionMutation(bookId, issueId)
      const optimisticRecord: ReviewIssueFixActionRecord = {
        id: createReviewFixActionRecordId(bookId, issueId),
        bookId,
        issueId,
        issueSignature,
        sourceHandoffId,
        sourceHandoffLabel,
        targetScope,
        status,
        note: note?.trim() ? note.trim() : undefined,
        startedAtLabel: previousRecord?.startedAtLabel ?? 'Saving fix action',
        updatedAtLabel: 'Saving fix action',
        updatedByLabel: 'Narrative editor',
      }

      queryClient.setQueryData<ReviewIssueFixActionRecord[]>(queryKey, (current = []) => {
        const next = current.filter((record) => record.issueId !== issueId)
        return [...next, optimisticRecord]
      })

      return {
        previousRecord,
        previousIndex,
        optimisticToken,
      }
    },
    onSuccess: (record, _variables, context) => {
      if (!context || !isLatestReviewFixActionMutation(context.optimisticToken)) {
        return
      }

      queryClient.setQueryData<ReviewIssueFixActionRecord[]>(queryKey, (current = []) => {
        const next = current.filter((item) => item.issueId !== record.issueId)
        return [...next, record]
      })
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
