import { useQuery } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
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
  { reviewClient: customReviewClient }: UseBookReviewFixActionsQueryDeps = {},
) {
  const runtime = useOptionalProjectRuntime()
  const effectiveReviewClient = resolveProjectRuntimeDependency(
    customReviewClient,
    runtime?.reviewClient,
    'useBookReviewFixActionsQuery',
    'deps.reviewClient',
  )

  return useQuery({
    queryKey: reviewQueryKeys.fixActions(bookId),
    queryFn: () => effectiveReviewClient.getBookReviewFixActions({ bookId }),
    enabled,
  })
}
