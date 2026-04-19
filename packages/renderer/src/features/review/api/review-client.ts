import {
  clearMockReviewIssueDecision,
  getMockBookReviewDecisions,
  setMockReviewIssueDecision,
} from './mock-review-decision-db'
import {
  clearMockReviewIssueFixAction,
  getMockBookReviewFixActions,
  setMockReviewIssueFixAction,
} from './mock-review-fix-action-db'
import type {
  ClearReviewIssueDecisionInput,
  ReviewIssueDecisionRecord,
  SetReviewIssueDecisionInput,
} from './review-decision-records'
import type {
  ClearReviewIssueFixActionInput,
  ReviewIssueFixActionRecord,
  SetReviewIssueFixActionInput,
} from './review-fix-action-records'

export interface GetBookReviewDecisionsInput {
  bookId: string
}

export interface GetBookReviewFixActionsInput {
  bookId: string
}

export interface ReviewClient {
  getBookReviewDecisions(input: GetBookReviewDecisionsInput): Promise<ReviewIssueDecisionRecord[]>
  setReviewIssueDecision(input: SetReviewIssueDecisionInput): Promise<ReviewIssueDecisionRecord>
  clearReviewIssueDecision(input: ClearReviewIssueDecisionInput): Promise<void>
  getBookReviewFixActions(input: GetBookReviewFixActionsInput): Promise<ReviewIssueFixActionRecord[]>
  setReviewIssueFixAction(input: SetReviewIssueFixActionInput): Promise<ReviewIssueFixActionRecord>
  clearReviewIssueFixAction(input: ClearReviewIssueFixActionInput): Promise<void>
}

interface CreateReviewClientOptions {
  getBookReviewDecisionsByBookId?: (bookId: string) => ReviewIssueDecisionRecord[]
  setReviewIssueDecisionRecord?: (input: SetReviewIssueDecisionInput) => ReviewIssueDecisionRecord
  clearReviewIssueDecisionRecord?: (input: ClearReviewIssueDecisionInput) => void
  getBookReviewFixActionsByBookId?: (bookId: string) => ReviewIssueFixActionRecord[]
  setReviewIssueFixActionRecord?: (input: SetReviewIssueFixActionInput) => ReviewIssueFixActionRecord
  clearReviewIssueFixActionRecord?: (input: ClearReviewIssueFixActionInput) => void
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

export function createReviewClient({
  getBookReviewDecisionsByBookId = getMockBookReviewDecisions,
  setReviewIssueDecisionRecord = setMockReviewIssueDecision,
  clearReviewIssueDecisionRecord = clearMockReviewIssueDecision,
  getBookReviewFixActionsByBookId = getMockBookReviewFixActions,
  setReviewIssueFixActionRecord = setMockReviewIssueFixAction,
  clearReviewIssueFixActionRecord = clearMockReviewIssueFixAction,
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
    async getBookReviewFixActions({ bookId }) {
      return clone(getBookReviewFixActionsByBookId(bookId))
    },
    async setReviewIssueFixAction(input) {
      return clone(setReviewIssueFixActionRecord(input))
    },
    async clearReviewIssueFixAction(input) {
      clearReviewIssueFixActionRecord(input)
    },
  }
}

export const reviewClient = createReviewClient()
