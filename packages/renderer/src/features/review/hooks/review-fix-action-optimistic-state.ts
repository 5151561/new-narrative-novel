let reviewFixActionMutationSequence = 0
const latestReviewFixActionMutationByIssue = new Map<string, string>()

export interface ReviewFixActionMutationToken {
  issueKey: string
  mutationToken: string
}

export function beginReviewFixActionMutation(bookId: string, issueId: string): ReviewFixActionMutationToken {
  const issueKey = `${bookId}::${issueId}`
  const mutationToken = `${issueKey}::${reviewFixActionMutationSequence++}`
  latestReviewFixActionMutationByIssue.set(issueKey, mutationToken)
  return {
    issueKey,
    mutationToken,
  }
}

export function isLatestReviewFixActionMutation({ issueKey, mutationToken }: ReviewFixActionMutationToken) {
  return latestReviewFixActionMutationByIssue.get(issueKey) === mutationToken
}

export function settleReviewFixActionMutation(token: ReviewFixActionMutationToken) {
  if (isLatestReviewFixActionMutation(token)) {
    latestReviewFixActionMutationByIssue.delete(token.issueKey)
  }
}
