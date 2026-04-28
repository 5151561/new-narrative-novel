import { describe, expect, it } from 'vitest'

import {
  clearMockReviewIssueDecision,
  exportMockReviewDecisionSnapshot,
  getMockBookReviewDecisions,
  importMockReviewDecisionSnapshot,
  resetMockReviewDecisionDb,
  setMockReviewIssueDecision,
} from './mock-review-decision-db'
import {
  clearMockReviewIssueFixAction,
  exportMockReviewFixActionSnapshot,
  getMockBookReviewFixActions,
  importMockReviewFixActionSnapshot,
  resetMockReviewFixActionDb,
  setMockReviewIssueFixAction,
} from './mock-review-fix-action-db'
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

  it('exports and imports review decision snapshots without leaking mutable references', () => {
    resetMockReviewDecisionDb()
    setMockReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      status: 'reviewed',
      note: 'Persist me',
    })

    const snapshot = exportMockReviewDecisionSnapshot()
    resetMockReviewDecisionDb()
    importMockReviewDecisionSnapshot(snapshot)
    snapshot['book-signal-arc']![0]!.note = 'Mutated snapshot'

    expect(getMockBookReviewDecisions('book-signal-arc')).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        note: 'Persist me',
      }),
    ])
  })
})

describe('review fix action data layer', () => {
  it('writes and overwrites review issue fix actions while preserving the first started label', () => {
    resetMockReviewFixActionDb()

    const initial = setMockReviewIssueFixAction({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      sourceHandoffId: 'handoff-1',
      sourceHandoffLabel: 'Open chapter draft',
      targetScope: 'chapter',
      status: 'started',
      note: '  Started now  ',
    })

    const replaced = setMockReviewIssueFixAction({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-2',
      sourceHandoffId: 'handoff-2',
      sourceHandoffLabel: 'Open scene draft',
      targetScope: 'scene',
      status: 'rewrite_requested' as any,
      note: '  ',
      rewriteRequestNote: '  Needs rewrite  ' as any,
      rewriteRequestId: 'rewrite-issue-1' as any,
      rewriteTargetSceneId: 'scene-7' as any,
    })

    expect(initial.note).toBe('Started now')
    expect(replaced).toMatchObject({
      id: 'book-signal-arc::issue-1',
      issueId: 'issue-1',
      issueSignature: 'signature-2',
      sourceHandoffId: 'handoff-2',
      sourceHandoffLabel: 'Open scene draft',
      targetScope: 'scene',
      status: 'rewrite_requested',
      note: undefined,
      rewriteRequestNote: 'Needs rewrite',
      rewriteRequestId: 'rewrite-issue-1',
      rewriteTargetSceneId: 'scene-7',
      startedAtLabel: initial.startedAtLabel,
    })
    expect(getMockBookReviewFixActions('book-signal-arc')).toEqual([replaced])
  })

  it('clears and resets review issue fix actions without leaking records across tests', () => {
    resetMockReviewFixActionDb()
    setMockReviewIssueFixAction({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      sourceHandoffId: 'handoff-1',
      sourceHandoffLabel: 'Open chapter draft',
      targetScope: 'chapter',
      status: 'started',
    })
    setMockReviewIssueFixAction({
      bookId: 'book-signal-arc',
      issueId: 'issue-2',
      issueSignature: 'signature-2',
      sourceHandoffId: 'handoff-2',
      sourceHandoffLabel: 'Open scene proposal',
      targetScope: 'scene',
      status: 'blocked',
    })

    clearMockReviewIssueFixAction({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
    })
    expect(getMockBookReviewFixActions('book-signal-arc').map((record) => record.issueId)).toEqual(['issue-2'])

    resetMockReviewFixActionDb()
    expect(getMockBookReviewFixActions('book-signal-arc')).toEqual([])
  })

  it('returns cloned fix action records from the client instead of leaking mutable db references', async () => {
    resetMockReviewFixActionDb()
    setMockReviewIssueFixAction({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      sourceHandoffId: 'handoff-1',
      sourceHandoffLabel: 'Open chapter draft',
      targetScope: 'chapter',
      status: 'started',
      note: 'Keep isolated',
    })

    const client = createReviewClient()
    const firstRead = await client.getBookReviewFixActions({ bookId: 'book-signal-arc' })
    firstRead[0]!.note = 'Mutated locally'

    const secondRead = await client.getBookReviewFixActions({ bookId: 'book-signal-arc' })

    expect(secondRead[0]).toMatchObject({
      issueId: 'issue-1',
      note: 'Keep isolated',
    })
  })

  it('keeps decision and fix action mock databases isolated from each other', () => {
    resetMockReviewDecisionDb()
    resetMockReviewFixActionDb()

    setMockReviewIssueDecision({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      status: 'reviewed',
    })
    setMockReviewIssueFixAction({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      sourceHandoffId: 'handoff-1',
      sourceHandoffLabel: 'Open chapter draft',
      targetScope: 'chapter',
      status: 'started',
    })

    resetMockReviewFixActionDb()

    expect(getMockBookReviewFixActions('book-signal-arc')).toEqual([])
    expect(getMockBookReviewDecisions('book-signal-arc')).toHaveLength(1)
  })

  it('exports and imports review fix action snapshots without leaking mutable references', () => {
    resetMockReviewFixActionDb()
    setMockReviewIssueFixAction({
      bookId: 'book-signal-arc',
      issueId: 'issue-1',
      issueSignature: 'signature-1',
      sourceHandoffId: 'handoff-1',
      sourceHandoffLabel: 'Open chapter draft',
      targetScope: 'chapter',
      status: 'started',
      note: 'Persist me',
    })

    const snapshot = exportMockReviewFixActionSnapshot()
    resetMockReviewFixActionDb()
    importMockReviewFixActionSnapshot(snapshot)
    snapshot['book-signal-arc']![0]!.note = 'Mutated snapshot'

    expect(getMockBookReviewFixActions('book-signal-arc')).toEqual([
      expect.objectContaining({
        issueId: 'issue-1',
        note: 'Persist me',
      }),
    ])
  })
})
