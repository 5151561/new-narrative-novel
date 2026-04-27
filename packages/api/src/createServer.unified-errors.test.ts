import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

describe('fixture API server unified errors', () => {
  it('returns 404 JSON errors for missing projects and unknown routes', async () => {
    await withTestServer(async ({ app }) => {
      const [missingProject, unknownRoute] = await Promise.all([
        app.inject({
          method: 'GET',
          url: '/api/projects/project-missing/runtime-info',
        }),
        app.inject({
          method: 'GET',
          url: '/api/unknown',
        }),
      ])

      expect(missingProject.statusCode).toBe(404)
      expect(missingProject.json()).toEqual({
        status: 404,
        message: 'Project project-missing was not found.',
        code: 'PROJECT_NOT_FOUND',
        detail: {
          projectId: 'project-missing',
        },
      })

      expect(unknownRoute.statusCode).toBe(404)
      expect(unknownRoute.json()).toEqual({
        status: 404,
        message: 'Route GET /api/unknown was not found.',
        code: 'ROUTE_NOT_FOUND',
        detail: {
          method: 'GET',
          url: '/api/unknown',
        },
      })
    })
  })

  it('returns 400 JSON errors for invalid write payloads without persisting state', async () => {
    await withTestServer(async ({ app }) => {
      const invalidRunModeResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'loop-forever',
        },
      })
      expect(invalidRunModeResponse.statusCode).toBe(400)
      expect(invalidRunModeResponse.json()).toEqual({
        status: 400,
        message: 'Unsupported mode "loop-forever".',
        code: 'INVALID_RUN_MODE',
        detail: {
          body: {
            mode: 'loop-forever',
          },
          allowedModes: ['continue', 'rewrite', 'from-scratch'],
        },
      })

      const malformedRunNoteResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          note: {
            invalid: true,
          },
        },
      })
      expect(malformedRunNoteResponse.statusCode).toBe(400)
      expect(malformedRunNoteResponse.json()).toEqual({
        status: 400,
        message: 'note must be a string when provided.',
        code: 'INVALID_RUN_NOTE',
        detail: {
          body: {
            note: {
              invalid: true,
            },
          },
        },
      })

      const firstValidStartResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })
      expect(firstValidStartResponse.statusCode).toBe(200)
      expect(firstValidStartResponse.json()).toMatchObject({
        id: 'run-scene-midnight-platform-002',
      })

      const invalidRunReviewNoteResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
        payload: {
          reviewId: 'review-scene-midnight-platform-002',
          decision: 'accept',
          note: {
            invalid: true,
          },
        },
      })
      expect(invalidRunReviewNoteResponse.statusCode).toBe(400)
      expect(invalidRunReviewNoteResponse.json()).toEqual({
        status: 400,
        message: 'note must be a string when provided.',
        code: 'INVALID_RUN_REVIEW_NOTE',
        detail: {
          body: {
            reviewId: 'review-scene-midnight-platform-002',
            decision: 'accept',
            note: {
              invalid: true,
            },
          },
        },
      })

      const invalidRunReviewPatchIdResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
        payload: {
          reviewId: 'review-scene-midnight-platform-002',
          decision: 'accept-with-edit',
          patchId: '',
        },
      })
      expect(invalidRunReviewPatchIdResponse.statusCode).toBe(400)
      expect(invalidRunReviewPatchIdResponse.json()).toEqual({
        status: 400,
        message: 'patchId must not be empty when provided.',
        code: 'INVALID_RUN_REVIEW_PATCH_ID',
        detail: {
          body: {
            reviewId: 'review-scene-midnight-platform-002',
            decision: 'accept-with-edit',
            patchId: '',
          },
        },
      })

      const invalidRunReviewSelectedVariantsResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
        payload: {
          reviewId: 'review-scene-midnight-platform-002',
          decision: 'accept',
          selectedVariants: [
            {
              proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
              variantId: '',
            },
          ],
        },
      })
      expect(invalidRunReviewSelectedVariantsResponse.statusCode).toBe(400)
      expect(invalidRunReviewSelectedVariantsResponse.json()).toEqual({
        status: 400,
        message: 'selectedVariants.variantId must not be empty.',
        code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
        detail: {
          body: {
            reviewId: 'review-scene-midnight-platform-002',
            decision: 'accept',
            selectedVariants: [
              {
                proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
                variantId: '',
              },
            ],
          },
          index: 0,
        },
      })

      const invalidSelectedVariantSemanticCases = [
        {
          payload: {
            reviewId: 'review-scene-midnight-platform-002',
            decision: 'accept',
            selectedVariants: [
              {
                proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
                variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
              },
              {
                proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
                variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
              },
            ],
          },
          message: 'selectedVariants proposalId proposal-set-scene-midnight-platform-run-002-proposal-001 must be unique.',
          detail: {
            proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
            index: 1,
          },
        },
        {
          payload: {
            reviewId: 'review-scene-midnight-platform-002',
            decision: 'accept',
            selectedVariants: [
              {
                proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-missing',
                variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-missing-variant-001',
              },
            ],
          },
          message: 'selectedVariants proposalId proposal-set-scene-midnight-platform-run-002-proposal-missing does not exist in the run proposal set.',
          detail: {
            proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-missing',
            index: 0,
          },
        },
        {
          payload: {
            reviewId: 'review-scene-midnight-platform-002',
            decision: 'accept',
            selectedVariants: [
              {
                proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
                variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-missing',
              },
            ],
          },
          message: 'selectedVariants variantId proposal-set-scene-midnight-platform-run-002-proposal-001-variant-missing does not exist for proposal proposal-set-scene-midnight-platform-run-002-proposal-001.',
          detail: {
            proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
            variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-missing',
            index: 0,
          },
        },
      ]

      for (const invalidCase of invalidSelectedVariantSemanticCases) {
        const response = await app.inject({
          method: 'POST',
          url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
          payload: invalidCase.payload,
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({
          status: 400,
          message: invalidCase.message,
          code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
          detail: {
            projectId: 'book-signal-arc',
            runId: 'run-scene-midnight-platform-002',
            reviewId: 'review-scene-midnight-platform-002',
            ...invalidCase.detail,
          },
        })
      }

      const runAfterInvalidReviewNote = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002',
      })
      expect(runAfterInvalidReviewNote.statusCode).toBe(200)
      expect(runAfterInvalidReviewNote.json()).toMatchObject({
        status: 'waiting_review',
        eventCount: 9,
        pendingReviewId: 'review-scene-midnight-platform-002',
      })

      const runEventsAfterInvalidPatchId = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-009',
      })
      expect(runEventsAfterInvalidPatchId.statusCode).toBe(200)
      expect(runEventsAfterInvalidPatchId.json().events).toEqual([])

      const invalidReviewDecisionStatusResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          status: 'approved',
        },
      })
      expect(invalidReviewDecisionStatusResponse.statusCode).toBe(400)
      expect(invalidReviewDecisionStatusResponse.json()).toEqual({
        status: 400,
        message: 'Unsupported review decision status "approved".',
        code: 'INVALID_REVIEW_DECISION',
        detail: {
          body: {
            bookId: 'book-signal-arc',
            issueId: 'compare-delta-scene-midnight-platform',
            issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
            status: 'approved',
          },
          allowedStatuses: ['reviewed', 'deferred', 'dismissed'],
        },
      })

      const invalidReviewDecisionNoteResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          status: 'reviewed',
          note: {
            invalid: true,
          },
        },
      })
      expect(invalidReviewDecisionNoteResponse.statusCode).toBe(400)
      expect(invalidReviewDecisionNoteResponse.json()).toEqual({
        status: 400,
        message: 'note must be a string when provided.',
        code: 'INVALID_REVIEW_DECISION_NOTE',
        detail: {
          body: {
            bookId: 'book-signal-arc',
            issueId: 'compare-delta-scene-midnight-platform',
            issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
            status: 'reviewed',
            note: {
              invalid: true,
            },
          },
        },
      })

      const reviewDecisionsAfterInvalidWrites = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-decisions',
      })
      expect(reviewDecisionsAfterInvalidWrites.statusCode).toBe(200)
      expect(reviewDecisionsAfterInvalidWrites.json()).toEqual([
        expect.objectContaining({
          issueId: 'compare-delta-scene-midnight-platform',
          status: 'deferred',
        }),
      ])

      const invalidReviewFixActionStatusResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          sourceHandoffId: 'handoff-review-002',
          sourceHandoffLabel: 'Bundle C fix action test',
          targetScope: 'scene',
          status: 'verifying',
        },
      })
      expect(invalidReviewFixActionStatusResponse.statusCode).toBe(400)
      expect(invalidReviewFixActionStatusResponse.json()).toEqual({
        status: 400,
        message: 'Unsupported review fix action status "verifying".',
        code: 'INVALID_REVIEW_FIX_ACTION',
        detail: {
          body: {
            bookId: 'book-signal-arc',
            issueId: 'compare-delta-scene-midnight-platform',
            issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
            sourceHandoffId: 'handoff-review-002',
            sourceHandoffLabel: 'Bundle C fix action test',
            targetScope: 'scene',
            status: 'verifying',
          },
          allowedStatuses: ['started', 'checked', 'blocked'],
        },
      })

      const invalidReviewFixActionTargetScopeResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          sourceHandoffId: 'handoff-review-002',
          sourceHandoffLabel: 'Bundle C fix action test',
          targetScope: 'run',
          status: 'checked',
        },
      })
      expect(invalidReviewFixActionTargetScopeResponse.statusCode).toBe(400)
      expect(invalidReviewFixActionTargetScopeResponse.json()).toEqual({
        status: 400,
        message: 'Unsupported targetScope "run".',
        code: 'INVALID_REVIEW_FIX_ACTION',
        detail: {
          body: {
            bookId: 'book-signal-arc',
            issueId: 'compare-delta-scene-midnight-platform',
            issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
            sourceHandoffId: 'handoff-review-002',
            sourceHandoffLabel: 'Bundle C fix action test',
            targetScope: 'run',
            status: 'checked',
          },
          allowedTargetScopes: ['book', 'chapter', 'scene', 'asset'],
        },
      })

      const invalidReviewFixActionNoteResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/compare-delta-scene-midnight-platform',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'compare-delta-scene-midnight-platform',
          issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
          sourceHandoffId: 'handoff-review-002',
          sourceHandoffLabel: 'Bundle C fix action test',
          targetScope: 'scene',
          status: 'checked',
          note: {
            invalid: true,
          },
        },
      })
      expect(invalidReviewFixActionNoteResponse.statusCode).toBe(400)
      expect(invalidReviewFixActionNoteResponse.json()).toEqual({
        status: 400,
        message: 'note must be a string when provided.',
        code: 'INVALID_REVIEW_FIX_ACTION_NOTE',
        detail: {
          body: {
            bookId: 'book-signal-arc',
            issueId: 'compare-delta-scene-midnight-platform',
            issueSignature: 'compare-delta-scene-midnight-platform::compare_delta',
            sourceHandoffId: 'handoff-review-002',
            sourceHandoffLabel: 'Bundle C fix action test',
            targetScope: 'scene',
            status: 'checked',
            note: {
              invalid: true,
            },
          },
        },
      })

      const reviewFixActionsAfterInvalidWrites = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions',
      })
      expect(reviewFixActionsAfterInvalidWrites.statusCode).toBe(200)
      expect(reviewFixActionsAfterInvalidWrites.json()).toEqual([
        expect.objectContaining({
          issueId: 'compare-delta-scene-midnight-platform',
          status: 'started',
          targetScope: 'scene',
        }),
      ])

      const invalidRevisionModeResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision',
        payload: {
          revisionMode: 'polish',
        },
      })
      expect(invalidRevisionModeResponse.statusCode).toBe(400)
      expect(invalidRevisionModeResponse.json()).toEqual({
        status: 400,
        message: 'Unsupported revisionMode "polish".',
        code: 'INVALID_REVISION_MODE',
        detail: {
          body: {
            revisionMode: 'polish',
          },
          allowedRevisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
        },
      })
    })
  })

  it('returns 404, 409, and 500 JSON errors for run and repository failures', async () => {
    await withTestServer(async ({ app, repository }) => {
      const unknownSceneResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-does-not-exist/runs',
        payload: {
          mode: 'rewrite',
        },
      })
      expect(unknownSceneResponse.statusCode).toBe(404)
      expect(unknownSceneResponse.json()).toEqual({
        status: 404,
        message: 'Scene scene-does-not-exist was not found.',
        code: 'SCENE_NOT_FOUND',
        detail: {
          projectId: 'book-signal-arc',
          sceneId: 'scene-does-not-exist',
        },
      })

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })
      expect(startResponse.statusCode).toBe(200)

      const invalidCursorResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-does-not-exist',
      })
      expect(invalidCursorResponse.statusCode).toBe(409)
      expect(invalidCursorResponse.json()).toEqual({
        status: 409,
        message: 'Run cursor run-event-does-not-exist does not exist for run-scene-midnight-platform-002.',
        code: 'RUN_EVENTS_CURSOR_CONFLICT',
        detail: {
          projectId: 'book-signal-arc',
          runId: 'run-scene-midnight-platform-002',
          cursor: 'run-event-does-not-exist',
        },
      })

      const invalidDecisionResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
        payload: {
          reviewId: 'review-scene-midnight-platform-002',
          decision: 'ship-it',
        },
      })
      expect(invalidDecisionResponse.statusCode).toBe(400)
      expect(invalidDecisionResponse.json()).toEqual({
        status: 400,
        message: 'Unsupported run review decision "ship-it".',
        code: 'INVALID_RUN_REVIEW_DECISION',
        detail: {
          body: {
            reviewId: 'review-scene-midnight-platform-002',
            decision: 'ship-it',
          },
          allowedDecisions: ['accept', 'accept-with-edit', 'request-rewrite', 'reject'],
        },
      })

      const detailAfterInvalidDecision = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002',
      })
      expect(detailAfterInvalidDecision.statusCode).toBe(200)
      expect(detailAfterInvalidDecision.json()).toMatchObject({
        status: 'waiting_review',
        pendingReviewId: 'review-scene-midnight-platform-002',
        eventCount: 9,
      })

      const originalGetProjectRuntimeInfo = repository.getProjectRuntimeInfo
      repository.getProjectRuntimeInfo = () => {
        throw new Error('fixture repository exploded')
      }

      const internalErrorResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runtime-info',
      })

      repository.getProjectRuntimeInfo = originalGetProjectRuntimeInfo

      expect(internalErrorResponse.statusCode).toBe(500)
      expect(internalErrorResponse.json()).toEqual({
        status: 500,
        message: 'Internal Server Error',
      })
    })
  })
})
