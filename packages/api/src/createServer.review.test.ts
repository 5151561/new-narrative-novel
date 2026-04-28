import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

describe('fixture API server review issue snapshots', () => {
  it('returns continuity issue locators for scene asset canon and prose read models', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-issue-snapshots',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchObject({
        bookId: 'book-signal-arc',
      })
      expect(response.json().issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'scene-proposal-seed-scene-5',
            source: 'scene-proposal',
            kind: 'scene_proposal',
          }),
          expect.objectContaining({
            id: 'continuity-conflict-ledger-public-proof',
            source: 'continuity',
            kind: 'continuity_conflict',
            sceneLocator: expect.objectContaining({
              chapterId: 'chapter-signals-in-rain',
              sceneId: 'scene-midnight-platform',
            }),
            assetLocator: expect.objectContaining({
              assetId: 'asset-ledger',
            }),
            canonLocator: expect.objectContaining({
              entityId: 'asset-ledger',
            }),
            proseLocator: expect.objectContaining({
              sceneId: 'scene-midnight-platform',
            }),
          }),
        ]),
      )
    })
  })

  it('marks stored decisions as stale when the current signature changes', async () => {
    await withTestServer(async ({ app }) => {
      const putResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/stale-prose-after-canon-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'stale-prose-after-canon-midnight-platform',
          issueSignature: 'older-signature',
          status: 'reviewed',
          note: 'Was reviewed against an older prose snapshot.',
        },
      })

      expect(putResponse.statusCode).toBe(200)

      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-issue-snapshots',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'stale-prose-after-canon-midnight-platform',
            decision: expect.objectContaining({
              status: 'stale',
              isStale: true,
              note: 'Was reviewed against an older prose snapshot.',
            }),
          }),
        ]),
      )
    })
  })

  it('accepts rewrite_requested fix actions and returns rewrite metadata from the read surface', async () => {
    await withTestServer(async ({ app }) => {
      const putResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/scene-proposal-seed-scene-5',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'scene-proposal-seed-scene-5',
          issueSignature: 'scene-proposal-seed-scene-5::signature',
          sourceHandoffId: 'scene-proposal-scene-5',
          sourceHandoffLabel: 'Open scene draft',
          targetScope: 'scene',
          status: 'rewrite_requested',
          note: 'General fix note.',
          rewriteRequestNote: 'Rewrite the scene prose before the next pass.',
          rewriteTargetSceneId: 'scene-5',
          rewriteRequestId: 'rewrite-request-scene-5',
        },
      })

      expect(putResponse.statusCode).toBe(200)
      expect(putResponse.json()).toMatchObject({
        status: 'rewrite_requested',
        rewriteRequestNote: 'Rewrite the scene prose before the next pass.',
        rewriteTargetSceneId: 'scene-5',
        rewriteRequestId: 'rewrite-request-scene-5',
      })

      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions',
      })

      expect(listResponse.statusCode).toBe(200)
      expect(listResponse.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            issueId: 'scene-proposal-seed-scene-5',
            status: 'rewrite_requested',
            rewriteRequestNote: 'Rewrite the scene prose before the next pass.',
            rewriteTargetSceneId: 'scene-5',
            rewriteRequestId: 'rewrite-request-scene-5',
          }),
        ]),
      )
    })
  })

  it('rejects rewrite_requested fix actions when the target scope is not scene or chapter', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/scene-proposal-seed-scene-5',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'scene-proposal-seed-scene-5',
          issueSignature: 'scene-proposal-seed-scene-5::signature',
          sourceHandoffId: 'book-review',
          sourceHandoffLabel: 'Open book review',
          targetScope: 'book',
          status: 'rewrite_requested',
          note: 'General fix note.',
          rewriteRequestNote: 'Rewrite the scene prose before the next pass.',
          rewriteTargetSceneId: 'scene-5',
          rewriteRequestId: 'rewrite-request-scene-5',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        code: 'INVALID_REWRITE_REQUEST_TARGET_SCOPE',
      })
    })
  })

  it('rejects rewrite_requested fix actions when rewrite metadata is missing', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/scene-proposal-seed-scene-5',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'scene-proposal-seed-scene-5',
          issueSignature: 'scene-proposal-seed-scene-5::signature',
          sourceHandoffId: 'scene-proposal-scene-5',
          sourceHandoffLabel: 'Open scene draft',
          targetScope: 'scene',
          status: 'rewrite_requested',
          note: 'General fix note.',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        code: 'INVALID_REWRITE_REQUEST_PAYLOAD',
      })
    })
  })

  it('returns an empty snapshot list for unsupported books without throwing', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-unsupported/review-issue-snapshots',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        bookId: 'book-unsupported',
        issues: [],
      })
    })
  })
})
