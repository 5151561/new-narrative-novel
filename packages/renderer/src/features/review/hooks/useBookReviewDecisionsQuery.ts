import { useQuery } from '@tanstack/react-query'

import { reviewClient, type ReviewClient } from '../api/review-client'
import { reviewQueryKeys } from './review-query-keys'

interface UseBookReviewDecisionsQueryInput {
  bookId: string
  enabled?: boolean
}

interface UseBookReviewDecisionsQueryDeps {
  reviewClient?: Pick<ReviewClient, 'getBookReviewDecisions'>
}

export function useBookReviewDecisionsQuery(
  { bookId, enabled = true }: UseBookReviewDecisionsQueryInput,
  { reviewClient: customReviewClient = reviewClient }: UseBookReviewDecisionsQueryDeps = {},
) {
  return useQuery({
    queryKey: reviewQueryKeys.decisions(bookId),
    queryFn: () => customReviewClient.getBookReviewDecisions({ bookId }),
    enabled,
  })
}
