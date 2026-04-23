import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

describe('fixture API server run flow', () => {
  it('supports start, detail, paged events, review decision submission, and stream placeholder', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Tighten the ending beat.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      expect(startResponse.json()).toMatchObject({
        id: 'run-scene-midnight-platform-002',
        status: 'waiting_review',
        pendingReviewId: 'review-scene-midnight-platform-002',
      })

      const detailResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002',
      })
      expect(detailResponse.statusCode).toBe(200)
      expect(detailResponse.json()).toMatchObject({
        id: 'run-scene-midnight-platform-002',
        latestEventId: 'run-event-scene-midnight-platform-002-009',
        eventCount: 9,
      })

      const sceneAfterStart = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
      })
      expect(sceneAfterStart.statusCode).toBe(200)
      expect(sceneAfterStart.json()).toMatchObject({
        latestRunId: 'run-scene-midnight-platform-002',
        runStatus: 'paused',
        status: 'review',
      })

      const executionAfterStart = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution',
      })
      expect(executionAfterStart.statusCode).toBe(200)
      expect(executionAfterStart.json()).toMatchObject({
        runId: 'run-scene-midnight-platform-002',
        runtimeSummary: {
          runHealth: 'attention',
        },
        canContinueRun: false,
        canOpenProse: false,
      })

      const firstEventsResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events',
      })
      expect(firstEventsResponse.statusCode).toBe(200)
      expect(firstEventsResponse.json()).toMatchObject({
        runId: 'run-scene-midnight-platform-002',
        nextCursor: 'run-event-scene-midnight-platform-002-004',
      })
      expect(firstEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
        'run_created',
        'run_started',
        'context_packet_built',
        'agent_invocation_started',
      ])

      const nextEventsResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-004',
      })
      expect(nextEventsResponse.statusCode).toBe(200)
      expect(nextEventsResponse.json()).toMatchObject({
        runId: 'run-scene-midnight-platform-002',
        nextCursor: 'run-event-scene-midnight-platform-002-008',
      })
      expect(nextEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
        'agent_invocation_completed',
        'agent_invocation_started',
        'agent_invocation_completed',
        'proposal_created',
      ])

      const finalPreReviewEventsResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-008',
      })
      expect(finalPreReviewEventsResponse.statusCode).toBe(200)
      expect(finalPreReviewEventsResponse.json()).not.toHaveProperty('nextCursor')
      expect(finalPreReviewEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
        'review_requested',
      ])

      const reviewResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/review-decisions',
        payload: {
          reviewId: 'review-scene-midnight-platform-002',
          decision: 'accept',
          note: 'Ship it.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        id: 'run-scene-midnight-platform-002',
        status: 'completed',
        summary: 'Proposal set accepted and applied to canon and prose.',
      })
      expect(reviewResponse.json()).not.toHaveProperty('pendingReviewId')

      const sceneAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
      })
      expect(sceneAfterReview.statusCode).toBe(200)
      expect(sceneAfterReview.json()).toMatchObject({
        latestRunId: 'run-scene-midnight-platform-002',
        runStatus: 'completed',
        status: 'ready',
      })

      const proseAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseAfterReview.statusCode).toBe(200)
      expect(proseAfterReview.json()).toMatchObject({
        statusLabel: 'Run completed',
        latestDiffSummary: 'Proposal set accepted and applied to canon and prose.',
      })

      const dockAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/dock-tabs/events',
      })
      expect(dockAfterReview.statusCode).toBe(200)
      expect(dockAfterReview.json().events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            meta: 'run-scene-midnight-platform-002',
          }),
        ]),
      )

      const postReviewEventsResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events?cursor=run-event-scene-midnight-platform-002-009',
      })
      expect(postReviewEventsResponse.statusCode).toBe(200)
      expect(postReviewEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
        'review_decision_submitted',
        'canon_patch_applied',
        'prose_generated',
        'run_completed',
      ])

      const streamResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-scene-midnight-platform-002/events/stream',
      })
      expect(streamResponse.statusCode).toBe(501)
      expect(streamResponse.json()).toMatchObject({
        code: 'RUN_EVENT_STREAM_UNIMPLEMENTED',
      })
    })
  })
})
