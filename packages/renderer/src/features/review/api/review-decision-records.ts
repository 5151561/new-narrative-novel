export type StoredReviewDecisionStatus = 'reviewed' | 'deferred' | 'dismissed'

export interface ReviewIssueDecisionRecord {
  id: string
  bookId: string
  issueId: string
  issueSignature: string
  status: StoredReviewDecisionStatus
  note?: string
  updatedAtLabel: string
  updatedByLabel: string
}

export interface SetReviewIssueDecisionInput {
  bookId: string
  issueId: string
  issueSignature: string
  status: StoredReviewDecisionStatus
  note?: string
}

export interface ClearReviewIssueDecisionInput {
  bookId: string
  issueId: string
}

export function createReviewDecisionRecordId(bookId: string, issueId: string) {
  return `${bookId}::${issueId}`
}
