import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

async function fetchAllRunEvents(
  app: Parameters<Parameters<typeof withTestServer>[0]>[0]['app'],
  projectId: string,
  runId: string,
) {
  const events: unknown[] = []
  let cursor: string | undefined

  do {
    const response = await app.inject({
      method: 'GET',
      url: `/api/projects/${projectId}/runs/${runId}/events${cursor ? `?cursor=${cursor}` : ''}`,
    })
    expect(response.statusCode).toBe(200)
    const page = response.json()
    events.push(...page.events)
    cursor = page.nextCursor
  } while (cursor)

  return events
}

describe('fixture API server scene prose revision', () => {
  it('queues a prose revision after an accepted run without changing draft text or run event payloads', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Prepare a revisionable draft.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'accept',
          note: 'Accept before revision.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const proseBeforeRevisionResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseBeforeRevisionResponse.statusCode).toBe(200)
      const proseBeforeRevision = proseBeforeRevisionResponse.json()
      expect(proseBeforeRevision).toMatchObject({
        proseDraft: expect.stringContaining('Midnight Platform opens from the accepted run artifact'),
        latestDiffSummary: 'A fixture prose draft was rendered for Midnight Platform.',
        statusLabel: 'Generated',
        traceSummary: {
          sourcePatchId: 'canon-patch-scene-midnight-platform-002',
          acceptedFactIds: ['canon-patch-scene-midnight-platform-002-fact-001'],
          missingLinks: [],
        },
      })

      const eventsBeforeRevision = await fetchAllRunEvents(app, 'book-signal-arc', startedRun.id)

      const revisionResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision',
        payload: {
          revisionMode: 'expand',
        },
      })
      expect(revisionResponse.statusCode).toBe(204)

      const proseAfterRevisionResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseAfterRevisionResponse.statusCode).toBe(200)
      const proseAfterRevision = proseAfterRevisionResponse.json()
      expect(proseAfterRevision).toMatchObject({
        proseDraft: proseBeforeRevision.proseDraft,
        revisionQueueCount: (proseBeforeRevision.revisionQueueCount ?? 0) + 1,
        latestDiffSummary: 'Revision queued: expand pass will add supporting beats while keeping trace links intact.',
        statusLabel: 'Revision queued',
        traceSummary: proseBeforeRevision.traceSummary,
      })

      const chapterResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/structure',
      })
      expect(chapterResponse.statusCode).toBe(200)
      const chapterScene = chapterResponse.json().scenes.find((scene: { id: string }) => scene.id === 'scene-midnight-platform')
      expect(chapterScene).toMatchObject({
        proseStatusLabel: {
          en: 'Revision queued',
          'zh-CN': '修订已排队',
        },
      })

      const dockResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/dock-tabs/events',
      })
      expect(dockResponse.statusCode).toBe(200)
      expect(dockResponse.json().events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'prose-revision-scene-midnight-platform',
            title: 'Prose revision queued',
            detail: 'The expansion revision request is waiting for review.',
            tone: 'accent',
          }),
        ]),
      )

      const eventsAfterRevision = await fetchAllRunEvents(app, 'book-signal-arc', startedRun.id)
      expect(eventsAfterRevision).toEqual(eventsBeforeRevision)
      const serializedEvents = JSON.stringify(eventsAfterRevision)
      expect(serializedEvents).not.toContain(proseAfterRevision.proseDraft)
      expect(serializedEvents).not.toContain(proseAfterRevision.latestDiffSummary)
      expect(serializedEvents).not.toContain('sourceProposalIds')
    })
  })

  it('returns 409 when requesting prose revision for a scene without a prose draft', async () => {
    await withTestServer(async ({ app }) => {
      const proseBeforeRevisionResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-warehouse-bridge/prose',
      })
      expect(proseBeforeRevisionResponse.statusCode).toBe(200)
      const proseBeforeRevision = proseBeforeRevisionResponse.json()
      expect(proseBeforeRevision).not.toHaveProperty('proseDraft')

      const revisionResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-warehouse-bridge/prose/revision',
        payload: {
          revisionMode: 'compress',
        },
      })
      expect(revisionResponse.statusCode).toBe(409)
      expect(revisionResponse.json()).toEqual({
        status: 409,
        message: 'Scene scene-warehouse-bridge requires a prose draft before revision can be requested.',
        code: 'SCENE_PROSE_REVISION_DRAFT_REQUIRED',
        detail: {
          projectId: 'book-signal-arc',
          sceneId: 'scene-warehouse-bridge',
          revisionMode: 'compress',
        },
      })

      const proseAfterRevisionResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-warehouse-bridge/prose',
      })
      expect(proseAfterRevisionResponse.statusCode).toBe(200)
      expect(proseAfterRevisionResponse.json()).toEqual(proseBeforeRevision)
    })
  })
})
