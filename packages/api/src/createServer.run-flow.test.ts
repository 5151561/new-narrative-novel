import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

function findEventRef(
  events: Array<{
    kind: string
    refs?: Array<{ kind: string; id: string }>
  }>,
  eventKind: string,
  refKind: string,
) {
  return events.find((event) => event.kind === eventKind)?.refs?.find((ref) => ref.kind === refKind)
}

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
        proseDraft: expect.stringContaining('Midnight Platform opens from the accepted run artifact'),
        draftWordCount: 146,
        statusLabel: 'Generated',
        latestDiffSummary: 'A fixture prose draft was rendered for Midnight Platform.',
        traceSummary: {
          sourcePatchId: 'canon-patch-scene-midnight-platform-002',
          sourceProposals: [
            expect.objectContaining({
              proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
            }),
          ],
          acceptedFactIds: ['canon-patch-scene-midnight-platform-002-fact-001'],
          missingLinks: [],
        },
      })

      const executionAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution',
      })
      expect(executionAfterReview.statusCode).toBe(200)
      expect(executionAfterReview.json()).toMatchObject({
        acceptedSummary: {
          acceptedFacts: [
            expect.objectContaining({
              id: 'canon-patch-scene-midnight-platform-002-fact-001',
              label: 'Accepted fact 1',
            }),
          ],
        },
      })

      const chapterAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/structure',
      })
      expect(chapterAfterReview.statusCode).toBe(200)
      expect(chapterAfterReview.json().scenes[0]).toMatchObject({
        id: 'scene-midnight-platform',
        proseStatusLabel: {
          en: 'Updated',
          'zh-CN': '已更新',
        },
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
      const postReviewEvents = postReviewEventsResponse.json().events
      expect(postReviewEvents.map((event: { kind: string }) => event.kind)).toEqual([
        'review_decision_submitted',
        'canon_patch_applied',
        'prose_generated',
        'run_completed',
      ])
      expect(JSON.stringify(postReviewEvents)).not.toContain('Midnight Platform opens from the accepted run artifact')
      expect(JSON.stringify(postReviewEvents)).not.toContain('sourceProposalIds')

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

  it('materializes prose after accept-with-edit review decisions', async () => {
    await withTestServer(async ({ app }) => {
      const selectedVariant = {
        proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
        variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
      }
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Keep the edit path visible.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'accept-with-edit',
          note: 'Use the editorial adjustment.',
          selectedVariants: [selectedVariant],
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        status: 'completed',
        summary: 'Proposal set accepted with editor adjustments applied to canon and prose.',
      })

      const postReviewEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${startedRun.latestEventId}`,
      })
      expect(postReviewEventsResponse.statusCode).toBe(200)
      const postReviewEvents = postReviewEventsResponse.json().events
      const canonPatchRef = findEventRef(postReviewEvents, 'canon_patch_applied', 'canon-patch')
      const proseDraftRef = findEventRef(postReviewEvents, 'prose_generated', 'prose-draft')
      expect(canonPatchRef).toBeTruthy()
      expect(proseDraftRef).toBeTruthy()

      const canonPatchResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/artifacts/${canonPatchRef!.id}`,
      })
      expect(canonPatchResponse.statusCode).toBe(200)
      expect(canonPatchResponse.json()).toMatchObject({
        artifact: {
          acceptedProposalIds: [selectedVariant.proposalId],
          selectedVariants: [selectedVariant],
          acceptedFacts: [
            expect.objectContaining({
              sourceProposalIds: [selectedVariant.proposalId],
              selectedVariants: [selectedVariant],
            }),
          ],
        },
      })

      const proseDraftResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/artifacts/${proseDraftRef!.id}`,
      })
      expect(proseDraftResponse.statusCode).toBe(200)
      expect(proseDraftResponse.json()).toMatchObject({
        artifact: {
          sourceCanonPatchId: canonPatchRef!.id,
          sourceProposalIds: [selectedVariant.proposalId],
          selectedVariants: [selectedVariant],
          body: {
            en: expect.stringContaining(selectedVariant.variantId),
          },
        },
      })

      const proseAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseAfterReview.statusCode).toBe(200)
      expect(proseAfterReview.json()).toMatchObject({
        proseDraft: expect.stringContaining(selectedVariant.variantId),
        traceSummary: {
          sourcePatchId: 'canon-patch-scene-midnight-platform-002',
          sourceProposals: [
            expect.objectContaining({
              proposalId: selectedVariant.proposalId,
              title: expect.stringContaining('Selected variant Reveal pressure'),
            }),
          ],
        },
      })
    })
  })

  it('preserves request-rewrite run flow semantics over HTTP', async () => {
    await withTestServer(async ({ app }) => {
      const proseBeforeReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseBeforeReview.statusCode).toBe(200)

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
        status: 'completed',
        summary: 'Rewrite requested. Start a new run to continue.',
        completedAtLabel: '2026-04-23 10:10',
        latestEventId: 'run-event-scene-midnight-platform-002-010',
        eventCount: 10,
      })
      expect(reviewResponse.json()).not.toHaveProperty('pendingReviewId')

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
        runStatus: 'completed',
        status: 'draft',
      })

      const executionAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution',
      })
      expect(executionAfterReview.statusCode).toBe(200)
      expect(executionAfterReview.json()).toMatchObject({
        runId: startedRun.id,
        canContinueRun: false,
        canOpenProse: false,
        runtimeSummary: {
          runHealth: 'stable',
        },
      })

      const proseAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseAfterReview.statusCode).toBe(200)
      expect(proseAfterReview.json()).toEqual(proseBeforeReview.json())
    })
  })

  it('does not overwrite scene prose after rejected review decisions', async () => {
    await withTestServer(async ({ app }) => {
      const proseBeforeReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseBeforeReview.statusCode).toBe(200)

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Try a path that will be rejected.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'reject',
          note: 'Close this attempt.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        status: 'completed',
        summary: 'Proposal set rejected and the run was closed.',
      })

      const proseAfterReview = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseAfterReview.statusCode).toBe(200)
      expect(proseAfterReview.json()).toEqual(proseBeforeReview.json())
    })
  })
})
