import {
  createReviewFixActionRecordId,
  type ClearReviewIssueFixActionInput,
  type ReviewIssueFixActionRecord,
  type SetReviewIssueFixActionInput,
} from './review-fix-action-records'

const MOCK_UPDATED_BY_LABEL = 'Narrative editor'
const MOCK_UPDATED_AT_LABEL = 'Saved in mock review session'
const MOCK_STARTED_AT_LABEL = 'Started in mock review session'

const mockReviewFixActionDb = new Map<string, Map<string, ReviewIssueFixActionRecord>>()

function clone<T>(value: T): T {
  return structuredClone(value)
}

function getBookFixActionBucket(bookId: string, createIfMissing = false) {
  const existing = mockReviewFixActionDb.get(bookId)
  if (existing) {
    return existing
  }

  if (!createIfMissing) {
    return undefined
  }

  const next = new Map<string, ReviewIssueFixActionRecord>()
  mockReviewFixActionDb.set(bookId, next)
  return next
}

export function getMockBookReviewFixActions(bookId: string): ReviewIssueFixActionRecord[] {
  return Array.from(getBookFixActionBucket(bookId)?.values() ?? []).map((record) => clone(record))
}

export function setMockReviewIssueFixAction(input: SetReviewIssueFixActionInput): ReviewIssueFixActionRecord {
  const bucket = getBookFixActionBucket(input.bookId, true)
  const existingRecord = bucket?.get(input.issueId)
  const record: ReviewIssueFixActionRecord = {
    id: createReviewFixActionRecordId(input.bookId, input.issueId),
    bookId: input.bookId,
    issueId: input.issueId,
    issueSignature: input.issueSignature,
    sourceHandoffId: input.sourceHandoffId,
    sourceHandoffLabel: input.sourceHandoffLabel,
    targetScope: input.targetScope,
    status: input.status,
    note: input.note?.trim() ? input.note.trim() : undefined,
    startedAtLabel: existingRecord?.startedAtLabel ?? MOCK_STARTED_AT_LABEL,
    updatedAtLabel: MOCK_UPDATED_AT_LABEL,
    updatedByLabel: MOCK_UPDATED_BY_LABEL,
  }

  bucket!.set(input.issueId, record)
  return clone(record)
}

export function clearMockReviewIssueFixAction(input: ClearReviewIssueFixActionInput): void {
  const bucket = getBookFixActionBucket(input.bookId)
  bucket?.delete(input.issueId)

  if (bucket && bucket.size === 0) {
    mockReviewFixActionDb.delete(input.bookId)
  }
}

export function resetMockReviewFixActionDb(): void {
  mockReviewFixActionDb.clear()
}

export function exportMockReviewFixActionSnapshot(): Record<string, ReviewIssueFixActionRecord[]> {
  return Object.fromEntries(
    Array.from(mockReviewFixActionDb.entries()).map(([bookId, bucket]) => [bookId, Array.from(bucket.values()).map((record) => clone(record))]),
  )
}

export function importMockReviewFixActionSnapshot(snapshot: Record<string, ReviewIssueFixActionRecord[]>): void {
  mockReviewFixActionDb.clear()

  for (const [bookId, records] of Object.entries(snapshot)) {
    if (records.length === 0) {
      continue
    }

    mockReviewFixActionDb.set(
      bookId,
      new Map(records.map((record) => [record.issueId, clone(record)])),
    )
  }
}
