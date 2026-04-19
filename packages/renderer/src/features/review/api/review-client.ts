import {
  clearMockReviewIssueDecision,
  getMockBookReviewDecisions,
  setMockReviewIssueDecision,
} from './mock-review-decision-db'
import type {
  ClearReviewIssueDecisionInput,
  ReviewIssueDecisionRecord,
  SetReviewIssueDecisionInput,
} from './review-decision-records'

export interface GetBookReviewDecisionsInput {
  bookId: string
}

export interface ReviewClient {
  getBookReviewDecisions(input: GetBookReviewDecisionsInput): Promise<ReviewIssueDecisionRecord[]>
  setReviewIssueDecision(input: SetReviewIssueDecisionInput): Promise<ReviewIssueDecisionRecord>
  clearReviewIssueDecision(input: ClearReviewIssueDecisionInput): Promise<void>
}

interface CreateReviewClientOptions {
  getBookReviewDecisionsByBookId?: (bookId: string) => ReviewIssueDecisionRecord[]
  setReviewIssueDecisionRecord?: (input: SetReviewIssueDecisionInput) => ReviewIssueDecisionRecord
  clearReviewIssueDecisionRecord?: (input: ClearReviewIssueDecisionInput) => void
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createReviewClient({
  getBookReviewDecisionsByBookId = getMockBookReviewDecisions,
  setReviewIssueDecisionRecord = setMockReviewIssueDecision,
  clearReviewIssueDecisionRecord = clearMockReviewIssueDecision,
}: CreateReviewClientOptions = {}): ReviewClient {
  return {
    async getBookReviewDecisions({ bookId }) {
      return clone(getBookReviewDecisionsByBookId(bookId))
    },
    async setReviewIssueDecision(input) {
      return clone(setReviewIssueDecisionRecord(input))
    },
    async clearReviewIssueDecision(input) {
      clearReviewIssueDecisionRecord(input)
    },
  }
}

export const reviewClient = createReviewClient()
