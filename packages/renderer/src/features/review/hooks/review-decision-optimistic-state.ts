let reviewDecisionMutationSequence = 0
const latestReviewDecisionMutationByIssue = new Map<string, string>()

export interface ReviewDecisionMutationToken {
  issueKey: string
  mutationToken: string
}

export function beginReviewDecisionMutation(bookId: string, issueId: string): ReviewDecisionMutationToken {
  const issueKey = `${bookId}::${issueId}`
  const mutationToken = `${issueKey}::${reviewDecisionMutationSequence++}`
  latestReviewDecisionMutationByIssue.set(issueKey, mutationToken)
  return {
    issueKey,
    mutationToken,
  }
}

export function isLatestReviewDecisionMutation({ issueKey, mutationToken }: ReviewDecisionMutationToken) {
  return latestReviewDecisionMutationByIssue.get(issueKey) === mutationToken
}

export function settleReviewDecisionMutation(token: ReviewDecisionMutationToken) {
  if (isLatestReviewDecisionMutation(token)) {
    latestReviewDecisionMutationByIssue.delete(token.issueKey)
  }
}
