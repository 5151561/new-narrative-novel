export type ReviewFixActionStatus = 'started' | 'checked' | 'blocked' | 'rewrite_requested'
export type ReviewFixActionTargetScope = 'book' | 'chapter' | 'scene' | 'asset'

export interface ReviewIssueFixActionRecord {
  id: string
  bookId: string
  issueId: string
  issueSignature: string
  sourceHandoffId: string
  sourceHandoffLabel: string
  targetScope: ReviewFixActionTargetScope
  status: ReviewFixActionStatus
  note?: string
  rewriteRequestNote?: string
  rewriteTargetSceneId?: string
  rewriteRequestId?: string
  startedAtLabel: string
  updatedAtLabel: string
  updatedByLabel: string
}

export interface SetReviewIssueFixActionInput {
  bookId: string
  issueId: string
  issueSignature: string
  sourceHandoffId: string
  sourceHandoffLabel: string
  targetScope: ReviewFixActionTargetScope
  status: ReviewFixActionStatus
  note?: string
  rewriteRequestNote?: string
  rewriteTargetSceneId?: string
  rewriteRequestId?: string
}

export interface ClearReviewIssueFixActionInput {
  bookId: string
  issueId: string
}

export function createReviewFixActionRecordId(bookId: string, issueId: string) {
  return `${bookId}::${issueId}`
}
