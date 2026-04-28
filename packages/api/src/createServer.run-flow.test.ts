import { setTimeout as delay } from 'node:timers/promises'

import { describe, expect, it } from 'vitest'

import { createTestServer, withTestServer } from './test/support/test-server.js'

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

function parseSsePayloads(chunks: string[]) {
  return chunks
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      const dataLine = entry.split('\n').find((line) => line.startsWith('data: '))
      if (!dataLine) {
        return []
      }

      return [JSON.parse(dataLine.slice('data: '.length))]
    })
}

async function waitFor(condition: () => boolean, label: string, timeoutMs = 3_000) {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    if (condition()) {
      return
    }

    await delay(10)
  }

  throw new Error(`Timed out waiting for ${label}`)
}

describe('fixture API server run flow', () => {
  it('supports start, detail, paged events, and review decision submission', async () => {
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
        usage: {
          inputTokens: 1700,
          outputTokens: 240,
          estimatedCostUsd: 0.0246,
          provider: 'fixture',
          modelId: 'fixture-scene-planner',
        },
        runtimeSummary: {
          health: 'attention',
          tokenLabel: '1.9k tokens',
          costLabel: '$0.0246 est.',
          failureClassLabel: 'No runtime failure recorded',
          nextActionLabel: 'Review proposals before any retry or prose continuation.',
        },
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
        usage: {
          inputTokens: 1700,
          outputTokens: 240,
          estimatedCostUsd: 0.0246,
          provider: 'fixture',
          modelId: 'fixture-scene-planner',
        },
        runtimeSummary: {
          health: 'attention',
          tokenLabel: '1.9k tokens',
          costLabel: '$0.0246 est.',
          failureClassLabel: 'No runtime failure recorded',
          nextActionLabel: 'Review proposals before any retry or prose continuation.',
        },
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
      const serializedPreReviewEvents = JSON.stringify([
        ...firstEventsPage.events,
        ...nextEventsPage.events,
        ...finalPreReviewEventsResponse.json().events,
      ])
      expect(serializedPreReviewEvents).not.toContain('transcript')
      expect(serializedPreReviewEvents).not.toContain('Tighten the ending beat.')
      expect(serializedPreReviewEvents).not.toContain('Return scene-planning proposals only.')
      expect(serializedPreReviewEvents).not.toContain('Anchor the arrival beat')

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
        draftWordCount: 50,
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
      expect(JSON.stringify(postReviewEvents)).not.toContain('transcript')
      expect(JSON.stringify(postReviewEvents)).not.toContain('Midnight Platform opens from the accepted run artifact')
      expect(JSON.stringify(postReviewEvents)).not.toContain('sourceProposalIds')

    })
  })

  it('serves the run event stream as text/event-stream with replay-from-cursor and later tail batches', async () => {
    const server = createTestServer()

    try {
      await server.app.listen({ port: 0, host: '127.0.0.1' })
      const address = server.app.server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a bound HTTP server address.')
      }

      const baseUrl = `http://127.0.0.1:${address.port}`
      const startResponse = await fetch(`${baseUrl}/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'rewrite',
          note: 'Tail stream after replay.',
        }),
      })
      expect(startResponse.status).toBe(200)
      const startedRun = await startResponse.json() as {
        id: string
        pendingReviewId?: string
      }

      const firstEventsPageResponse = await fetch(`${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/events`)
      expect(firstEventsPageResponse.status).toBe(200)
      const firstEventsPage = await firstEventsPageResponse.json() as {
        nextCursor?: string
      }

      const secondEventsPageResponse = await fetch(
        `${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${firstEventsPage.nextCursor}`,
      )
      expect(secondEventsPageResponse.status).toBe(200)
      const secondEventsPage = await secondEventsPageResponse.json() as {
        events: Array<{ id: string; kind: string }>
      }

      const finalEventsPageResponse = await fetch(
        `${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${secondEventsPage.events.at(-1)?.id}`,
      )
      expect(finalEventsPageResponse.status).toBe(200)
      const finalEventsPage = await finalEventsPageResponse.json() as {
        events: Array<{ id: string; kind: string }>
      }

      const streamPayloads = [] as Array<{ runId: string; events: Array<{ id: string; kind: string }> }>
      const streamResponse = await fetch(
        `${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/events/stream?cursor=${firstEventsPage.nextCursor}`,
      )

      expect(streamResponse.status).toBe(200)
      expect(streamResponse.headers.get('content-type')).toContain('text/event-stream')
      expect(streamResponse.body).toBeTruthy()

      const reader = streamResponse.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let streamClosed = false
      const readLoop = (async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            streamClosed = true
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''
          streamPayloads.push(...parseSsePayloads(parts))
        }
      })()

      await waitFor(() => streamPayloads.length >= 1, 'initial replay payload')
      expect(streamPayloads[0]).toEqual({
        runId: startedRun.id,
        events: [...secondEventsPage.events, ...finalEventsPage.events],
      })

      const reviewResponse = await fetch(`${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/review-decisions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: startedRun.pendingReviewId,
          decision: 'accept',
          note: 'Ship it.',
        }),
      })
      expect(reviewResponse.status).toBe(200)

      const postReviewEventsResponse = await fetch(
        `${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${finalEventsPage.events.at(-1)?.id}`,
      )
      expect(postReviewEventsResponse.status).toBe(200)
      const postReviewEventsPage = await postReviewEventsResponse.json() as {
        events: Array<{ id: string; kind: string }>
      }

      await waitFor(() => streamPayloads.length >= 2, 'post-review tail payload')
      expect(streamPayloads[1]).toEqual({
        runId: startedRun.id,
        events: postReviewEventsPage.events,
      })

      await waitFor(() => streamClosed, 'stream close after run completion')
      await readLoop
    } finally {
      await server.app.close()
      await server.cleanupProjectStateFile()
    }
  })

  it('opens tail-only stream subscriptions immediately even when replay is empty', async () => {
    const server = createTestServer()

    try {
      await server.app.listen({ port: 0, host: '127.0.0.1' })
      const address = server.app.server.address()
      if (!address || typeof address === 'string') {
        throw new Error('Expected a bound HTTP server address.')
      }

      const baseUrl = `http://127.0.0.1:${address.port}`
      const startResponse = await fetch(`${baseUrl}/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'rewrite',
          note: 'Open the stream before review arrives.',
        }),
      })
      expect(startResponse.status).toBe(200)
      const startedRun = await startResponse.json() as {
        id: string
        latestEventId: string
        pendingReviewId?: string
      }

      const handshakeAbortController = new AbortController()
      const handshakeAbortTimeout = setTimeout(() => handshakeAbortController.abort(), 250)
      let streamResponse: Response
      try {
        streamResponse = await fetch(
          `${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/events/stream?cursor=${startedRun.latestEventId}`,
          { signal: handshakeAbortController.signal },
        )
      } finally {
        clearTimeout(handshakeAbortTimeout)
      }

      expect(streamResponse.status).toBe(200)
      expect(streamResponse.headers.get('content-type')).toContain('text/event-stream')
      expect(streamResponse.body).toBeTruthy()

      const reader = streamResponse.body!.getReader()
      const decoder = new TextDecoder()
      const initialChunk = await Promise.race([
        reader.read(),
        delay(250).then(() => 'timeout' as const),
      ])
      expect(initialChunk).not.toBe('timeout')
      if (initialChunk === 'timeout') {
        throw new Error('expected an immediate SSE frame')
      }
      expect(initialChunk.done).toBe(false)
      const initialText = decoder.decode(initialChunk.value, { stream: true })
      expect(initialText.startsWith(':')).toBe(true)

      const streamPayloads = [] as Array<{ runId: string; events: Array<{ id: string; kind: string }> }>
      let buffer = initialText
      let streamClosed = false
      const readLoop = (async () => {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            streamClosed = true
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() ?? ''
          streamPayloads.push(...parseSsePayloads(parts))
        }
      })()

      const reviewResponse = await fetch(`${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/review-decisions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          reviewId: startedRun.pendingReviewId,
          decision: 'accept',
          note: 'Ship it.',
        }),
      })
      expect(reviewResponse.status).toBe(200)

      const postReviewEventsResponse = await fetch(
        `${baseUrl}/api/projects/book-signal-arc/runs/${startedRun.id}/events?cursor=${startedRun.latestEventId}`,
      )
      expect(postReviewEventsResponse.status).toBe(200)
      const postReviewEventsPage = await postReviewEventsResponse.json() as {
        events: Array<{ id: string; kind: string }>
      }

      await waitFor(() => streamPayloads.length >= 1, 'tail-only payload after review')
      expect(streamPayloads[0]).toEqual({
        runId: startedRun.id,
        events: postReviewEventsPage.events,
      })

      await waitFor(() => streamClosed, 'tail-only stream close after completion')
      await readLoop
    } finally {
      await server.app.close()
      await server.cleanupProjectStateFile()
    }
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

  it('supports the scene run flow for the selected local project store', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Run the local project store happy path.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()
      expect(startedRun).toMatchObject({
        id: 'run-scene-midnight-platform-001',
        status: 'waiting_review',
      })

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/local-project-alpha/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        id: startedRun.id,
        status: 'completed',
      })

      const proseResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/prose',
      })
      expect(proseResponse.statusCode).toBe(200)
      expect(proseResponse.json()).toMatchObject({
        sceneId: 'scene-midnight-platform',
        proseDraft: expect.stringContaining('Midnight Platform opens from the accepted run artifact'),
      })
    }, {
      configOverrides: {
        currentProject: {
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectRoot: '/tmp/local-project-alpha',
          projectTitle: 'Local Project Alpha',
        },
      },
    })
  })

  it('blocks real-project run start over HTTP when the selected provider planner binding is missing config', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })

      expect(startResponse.statusCode).toBe(400)
      expect(startResponse.json()).toMatchObject({
        code: 'RUN_MODEL_CONFIG_REQUIRED',
      })
    }, {
      configOverrides: {
        currentProject: {
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectRoot: '/tmp/local-project-alpha',
          projectTitle: 'Local Project Alpha',
        },
        modelBindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { provider: 'openai-compatible', providerId: 'deepseek', providerLabel: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
          sceneProseWriter: { provider: 'openai-compatible', providerId: 'deepseek', providerLabel: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
          sceneRevision: { provider: 'openai-compatible', providerId: 'deepseek', providerLabel: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
          summary: { provider: 'fixture' },
        },
        modelProvider: 'openai-compatible',
      },
    })
  })

  it('returns a failed run over HTTP when the real planner provider errors after an openai-compatible attempt', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })

      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()
      expect(startedRun).toMatchObject({
        id: 'run-scene-midnight-platform-001',
        status: 'failed',
        failureClass: 'provider_error',
        usage: {
          provider: 'openai-compatible',
          modelId: 'gpt-5.4',
        },
        runtimeSummary: {
          health: 'failed',
          failureClassLabel: 'Provider error',
        },
      })

      const plannerArtifactResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/local-project-alpha/runs/${startedRun.id}/artifacts/agent-invocation-scene-midnight-platform-run-001-001`,
      })
      expect(plannerArtifactResponse.statusCode).toBe(200)
      expect(plannerArtifactResponse.json()).toMatchObject({
        artifact: {
          modelLabel: {
            en: 'DeepSeek planner profile (gpt-5.4)',
            'zh-CN': 'DeepSeek 规划模型 (gpt-5.4)',
          },
          failureDetail: {
            provider: 'openai-compatible',
            modelId: 'gpt-5.4',
          },
        },
      })
    }, {
      configOverrides: {
        currentProject: {
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectRoot: '/tmp/local-project-alpha',
          projectTitle: 'Local Project Alpha',
        },
        modelBindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: {
            apiKey: 'sk-test',
            baseUrl: 'https://api.deepseek.com/v1',
            modelId: 'gpt-5.4',
            provider: 'openai-compatible',
            providerId: 'deepseek',
            providerLabel: 'DeepSeek',
          },
          sceneProseWriter: { provider: 'fixture' },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        modelProvider: 'openai-compatible',
      },
      scenePlannerGatewayDependencies: {
        openAiProvider: {
          generate: async () => {
            throw new Error('upstream failed')
          },
        },
      },
    })
  })

  it('returns a failed run over HTTP when accepted prose generation fails after a real openai-compatible attempt', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/local-project-alpha/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'accept',
        },
      })

      expect(reviewResponse.statusCode).toBe(200)
      const reviewedRun = reviewResponse.json()
      expect(reviewedRun).toMatchObject({
        id: startedRun.id,
        status: 'failed',
        failureClass: 'provider_error',
        runtimeSummary: {
          health: 'failed',
          failureClassLabel: 'Provider error',
        },
        usage: {
          provider: 'openai-compatible',
          modelId: 'gpt-5.4',
        },
      })

      const writerArtifactResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/local-project-alpha/runs/${reviewedRun.id}/artifacts/agent-invocation-scene-midnight-platform-run-001-003`,
      })
      expect(writerArtifactResponse.statusCode).toBe(200)
      expect(writerArtifactResponse.json()).toMatchObject({
        artifact: {
          modelLabel: {
            en: 'DeepSeek writer profile (gpt-5.4)',
            'zh-CN': 'DeepSeek 写作模型 (gpt-5.4)',
          },
          failureDetail: {
            provider: 'openai-compatible',
            modelId: 'gpt-5.4',
          },
        },
      })
    }, {
      configOverrides: {
        currentProject: {
          projectId: 'local-project-alpha',
          projectMode: 'real-project',
          projectRoot: '/tmp/local-project-alpha',
          projectTitle: 'Local Project Alpha',
        },
        modelBindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { provider: 'fixture' },
          sceneProseWriter: {
            apiKey: 'sk-test',
            baseUrl: 'https://api.deepseek.com/v1',
            modelId: 'gpt-5.4',
            provider: 'openai-compatible',
            providerId: 'deepseek',
            providerLabel: 'DeepSeek',
          },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        modelProvider: 'openai-compatible',
      },
      sceneProseWriterGatewayDependencies: {
        openAiProvider: {
          generate: async () => {
            throw new Error('upstream failed')
          },
        },
      },
    })
  })
})
