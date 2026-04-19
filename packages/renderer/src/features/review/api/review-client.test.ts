import { describe, expect, it } from 'vitest'

import {
  clearMockReviewIssueDecision,
  getMockBookReviewDecisions,
  resetMockReviewDecisionDb,
  setMockReviewIssueDecision,
} from './mock-review-decision-db'
import { createReviewClient } from './review-client'

describe('review decision data layer', () => {
  it('writes and overwrites review issue decisions in the mutable mock db', () => {
    resetMockReviewDecisionDb()

    const initial = setMockReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      status: 'reviewed',
      note: 'First pass',
    })

    const replaced = setMockReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-2',
      status: 'deferred',
      note: 'Later pass',
    })

    expect(initial.issueId).toBe('issue-1')
    expect(replaced.issueSignature).toBe('signature-2')
    expect(getMockBookReviewDecisions('book-signal-arc')).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        issueSignature: 'signature-2',
        status: 'deferred',
        note: 'Later pass',
      }),
    ])
  })

  it('clears and resets review issue decisions without leaking records across tests', () => {
    resetMockReviewDecisionDb()
    setMockReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      status: 'reviewed',
    })
    setMockReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-2',
      issueSignature: 'signature-2',
      status: 'dismissed',
    })

    clearMockReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
    })
    expect(getMockBookReviewDecisions('book-signal-arc').map((record) => record.issueId)).toEqual(['issue-2'])

    resetMockReviewDecisionDb()
    expect(getMockBookReviewDecisions('book-signal-arc')).toEqual([])
  })

  it('returns cloned records from the client instead of leaking mutable db references', async () => {
    resetMockReviewDecisionDb()
    setMockReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      status: 'reviewed',
      note: 'Keep isolated',
    })

    const client = createReviewClient()
    const firstRead = await client.getBookReviewDecisions({ bookId: 'book-signal-arc' })
    firstRead[0]!.note = 'Mutated locally'

    const secondRead = await client.getBookReviewDecisions({ bookId: 'book-signal-arc' })

    expect(secondRead[0]).toMatchObject({
      issueId: 'issue-1',
      note: 'Keep isolated',
    })
  })
})
