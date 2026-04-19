import { useQuery } from '@tanstack/react-query'

import { reviewClient, type ReviewClient } from '../api/review-client'
import { reviewQueryKeys } from './review-query-keys'

interface UseBookReviewFixActionsQueryInput {
  bookId: string
  enabled?: boolean
}

interface UseBookReviewFixActionsQueryDeps {
  reviewClient?: Pick<ReviewClient, 'getBookReviewFixActions'>
}

export function useBookReviewFixActionsQuery(
  { bookId, enabled = true }: UseBookReviewFixActionsQueryInput,
  { reviewClient: customReviewClient = reviewClient }: UseBookReviewFixActionsQueryDeps = {},
) {
  return useQuery({
    queryKey: reviewQueryKeys.fixActions(bookId),
    queryFn: () => customReviewClient.getBookReviewFixActions({ bookId }),
    enabled,
  })
}
