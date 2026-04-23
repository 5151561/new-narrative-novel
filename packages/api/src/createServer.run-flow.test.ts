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
      const startedRun = startResponse.json()
      expect(startedRun).toMatchObject({
        id: 'run-scene-midnight-platform-002',
        status: 'waiting_review',
        summary: 'Waiting for review: Tighten the ending beat.',
        startedAtLabel: '2026-04-23 10:01',
        pendingReviewId: 'review-scene-midnight-platform-002',
        latestEventId: 'run-event-scene-midnight-platform-002-009',
        eventCount: 9,
      })

      const detailResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}`,
      })
      expect(detailResponse.statusCode).toBe(200)
      expect(detailResponse.json()).toMatchObject({
        id: startedRun.id,
        pendingReviewId: 'review-scene-midnight-platform-002',
        latestEventId: 'run-event-scene-midnight-platform-002-009',
        eventCount: 9,
      })

      const sceneAfterStart = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
      })
      expect(sceneAfterStart.statusCode).toBe(200)
      expect(sceneAfterStart.json()).toMatchObject({
        latestRunId: startedRun.id,
        runStatus: 'paused',
        status: 'review',
      })

      const executionAfterStart = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution',
      })
      expect(executionAfterStart.statusCode).toBe(200)
      expect(executionAfterStart.json()).toMatchObject({
        runId: startedRun.id,
        runtimeSummary: {
          runHealth: 'attention',
        },
        canContinueRun: false,
        canOpenProse: false,
      })

      const firstEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/events`,
      })
      expect(firstEventsResponse.statusCode).toBe(200)
      const firstEventsPage = firstEventsResponse.json()
      expect(firstEventsPage.runId).toBe(startedRun.id)
      expect(firstEventsPage.nextCursor).toBe('run-event-scene-midnight-platform-002-004')
      expect(firstEventsPage.events.map((event: { kind: string }) => event.kind)).toEqual([
        'run_created',
        'run_started',
        'context_packet_built',
        'agent_invocation_started',
      ])

      const nextEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${firstEventsPage.nextCursor}`,
      })
      expect(nextEventsResponse.statusCode).toBe(200)
      const nextEventsPage = nextEventsResponse.json()
      expect(nextEventsPage.runId).toBe(startedRun.id)
      expect(nextEventsPage.nextCursor).toBe('run-event-scene-midnight-platform-002-008')
      expect(nextEventsPage.events.map((event: { kind: string }) => event.kind)).toEqual([
        'agent_invocation_completed',
        'agent_invocation_started',
        'agent_invocation_completed',
        'proposal_created',
      ])

      const finalPreReviewEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${nextEventsPage.nextCursor}`,
      })
      expect(finalPreReviewEventsResponse.statusCode).toBe(200)
      expect(finalPreReviewEventsResponse.json()).not.toHaveProperty('nextCursor')
      expect(finalPreReviewEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
        'review_requested',
      ])

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'accept',
          note: 'Ship it.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        id: startedRun.id,
        status: 'completed',
        summary: 'Proposal set accepted and applied to canon and prose.',
        completedAtLabel: '2026-04-23 10:13',
        latestEventId: 'run-event-scene-midnight-platform-002-013',
        eventCount: 13,
      })
      expect(reviewResponse.json()).not.toHaveProperty('pendingReviewId')

      const sceneAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
      })
      expect(sceneAfterReview.statusCode).toBe(200)
      expect(sceneAfterReview.json()).toMatchObject({
        latestRunId: startedRun.id,
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
            meta: startedRun.id,
          }),
        ]),
      )

      const postReviewEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${finalPreReviewEventsResponse.json().events.at(-1)?.id}`,
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
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/events/stream`,
      })
      expect(streamResponse.statusCode).toBe(501)
      expect(streamResponse.json()).toMatchObject({
        code: 'RUN_EVENT_STREAM_UNIMPLEMENTED',
      })
    })
  })

  it('preserves request-rewrite run flow semantics over HTTP', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Take another pass.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()
      expect(startedRun).toMatchObject({
        id: 'run-scene-midnight-platform-002',
        status: 'waiting_review',
        pendingReviewId: 'review-scene-midnight-platform-002',
        latestEventId: 'run-event-scene-midnight-platform-002-009',
      })

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'request-rewrite',
          note: 'Revise the final exchange.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        id: startedRun.id,
        status: 'running',
        summary: 'Rewrite requested and the run returned to execution.',
        latestEventId: 'run-event-scene-midnight-platform-002-010',
        eventCount: 10,
      })
      expect(reviewResponse.json()).not.toHaveProperty('pendingReviewId')
      expect(reviewResponse.json()).not.toHaveProperty('completedAtLabel')

      const eventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${startedRun.latestEventId}`,
      })
      expect(eventsResponse.statusCode).toBe(200)
      expect(eventsResponse.json()).not.toHaveProperty('nextCursor')
      expect(eventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
        'review_decision_submitted',
      ])

      const sceneAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/workspace',
      })
      expect(sceneAfterReview.statusCode).toBe(200)
      expect(sceneAfterReview.json()).toMatchObject({
        latestRunId: startedRun.id,
        runStatus: 'running',
        status: 'running',
      })
    })
  })
})
