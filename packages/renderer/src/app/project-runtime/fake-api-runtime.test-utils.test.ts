import { describe, expect, it } from 'vitest'

import { ApiRequestError } from './api-transport'
import { createFakeApiRuntime } from './fake-api-runtime.test-utils'

describe('createFakeApiRuntime override matching', () => {
  it('matches override queries regardless of key insertion order', async () => {
    const { runtime } = createFakeApiRuntime({
      overrides: [
        {
          method: 'GET',
          path: '/api/projects/project-smoke/books/book-signal-arc/export-artifacts',
          query: {
            checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
            exportProfileId: 'export-review-packet',
          },
          response: [
            {
              id: 'override-artifact',
            },
          ],
        },
      ],
    })

    await expect(
      runtime.bookClient.getBookExportArtifacts({
        bookId: 'book-signal-arc',
        exportProfileId: 'export-review-packet',
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      }),
    ).resolves.toEqual([
      {
        id: 'override-artifact',
      },
    ])
  })

  it('matches override bodies regardless of key insertion order', async () => {
    const { runtime } = createFakeApiRuntime({
      overrides: [
        {
          method: 'PUT',
          path: '/api/projects/project-smoke/books/book-signal-arc/review-decisions/issue-1',
          body: {
            status: 'deferred',
            issueSignature: 'signature-1',
            issueId: 'issue-1',
            bookId: 'book-signal-arc',
          },
          error: new ApiRequestError({
            status: 409,
            message: 'override-body-match',
          }),
        },
      ],
    })

    await expect(
      runtime.reviewClient.setReviewIssueDecision({
        bookId: 'book-signal-arc',
        issueId: 'issue-1',
        issueSignature: 'signature-1',
        status: 'deferred',
      }),
    ).rejects.toMatchObject({
      message: 'override-body-match',
      status: 409,
    })
  })

  it('treats undefined object entries like JSON transport and matches the same wire payload', async () => {
    const { runtime } = createFakeApiRuntime({
      overrides: [
        {
          method: 'PUT',
          path: '/api/projects/project-smoke/books/book-signal-arc/review-decisions/issue-2',
          body: {
            bookId: 'book-signal-arc',
            issueId: 'issue-2',
            issueSignature: 'signature-2',
            status: 'reviewed',
            note: undefined,
          },
          error: new ApiRequestError({
            status: 409,
            message: 'override-undefined-body-match',
          }),
        },
      ],
    })

    await expect(
      runtime.reviewClient.setReviewIssueDecision({
        bookId: 'book-signal-arc',
        issueId: 'issue-2',
        issueSignature: 'signature-2',
        status: 'reviewed',
      }),
    ).rejects.toMatchObject({
      message: 'override-undefined-body-match',
      status: 409,
    })
  })
})
