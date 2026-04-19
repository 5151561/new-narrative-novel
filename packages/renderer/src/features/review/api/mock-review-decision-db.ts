import {
  createReviewDecisionRecordId,
  type ClearReviewIssueDecisionInput,
  type ReviewIssueDecisionRecord,
  type SetReviewIssueDecisionInput,
} from './review-decision-records'

const MOCK_UPDATED_BY_LABEL = 'Narrative editor'
const MOCK_UPDATED_AT_LABEL = 'Saved in mock review session'

const mockReviewDecisionDb = new Map<string, Map<string, ReviewIssueDecisionRecord>>()

function clone<T>(value: T): T {
  return structuredClone(value)
}

function getBookDecisionBucket(bookId: string, createIfMissing = false) {
  const existing = mockReviewDecisionDb.get(bookId)
  if (existing) {
    return existing
  }

  if (!createIfMissing) {
    return undefined
  }

  const next = new Map<string, ReviewIssueDecisionRecord>()
  mockReviewDecisionDb.set(bookId, next)
  return next
}

export function getMockBookReviewDecisions(bookId: string): ReviewIssueDecisionRecord[] {
  return Array.from(getBookDecisionBucket(bookId)?.values() ?? []).map((record) => clone(record))
}

export function setMockReviewIssueDecision(input: SetReviewIssueDecisionInput): ReviewIssueDecisionRecord {
  const bucket = getBookDecisionBucket(input.bookId, true)
  const record: ReviewIssueDecisionRecord = {
    id: createReviewDecisionRecordId(input.bookId, input.issueId),
    bookId: input.bookId,
    issueId: input.issueId,
    issueSignature: input.issueSignature,
    status: input.status,
    note: input.note?.trim() ? input.note.trim() : undefined,
    updatedAtLabel: MOCK_UPDATED_AT_LABEL,
    updatedByLabel: MOCK_UPDATED_BY_LABEL,
  }

  bucket!.set(input.issueId, record)
  return clone(record)
}

export function clearMockReviewIssueDecision(input: ClearReviewIssueDecisionInput): void {
  const bucket = getBookDecisionBucket(input.bookId)
  bucket?.delete(input.issueId)

  if (bucket && bucket.size === 0) {
    mockReviewDecisionDb.delete(input.bookId)
  }
}

export function resetMockReviewDecisionDb(): void {
  mockReviewDecisionDb.clear()
}
