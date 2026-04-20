import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
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
  { reviewClient: customReviewClient }: UseBookReviewDecisionsQueryDeps = {},
) {
  const runtime = useOptionalProjectRuntime()
  const effectiveReviewClient = resolveProjectRuntimeDependency(
    customReviewClient,
    runtime?.reviewClient,
    'useBookReviewDecisionsQuery',
    'deps.reviewClient',
  )

  return useQuery({
    queryKey: reviewQueryKeys.decisions(bookId),
    queryFn: () => effectiveReviewClient.getBookReviewDecisions({ bookId }),
    enabled,
  })
}
