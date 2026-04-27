import { describe, expect, it } from 'vitest'

import { withTestServer } from './test/support/test-server.js'

type TestApp = Parameters<Parameters<typeof withTestServer>[0]>[0]['app']

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

async function fetchBookDraftAssembly(app: TestApp, bookId = 'book-signal-arc') {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/book-signal-arc/books/${bookId}/draft-assembly`,
  })
  expect(response.statusCode).toBe(200)
  return response.json()
}

function findAssemblyScene(
  assembly: {
    chapters: Array<{
      chapterId: string
      scenes: Array<{
        sceneId: string
      }>
    }>
  },
  chapterId: string,
  sceneId: string,
) {
  const chapter = assembly.chapters.find((entry) => entry.chapterId === chapterId)
  expect(chapter).toBeTruthy()
  const scene = chapter?.scenes.find((entry) => entry.sceneId === sceneId)
  expect(scene).toBeTruthy()
  return scene
}

async function fetchPostReviewEvents(
  app: TestApp,
  runId: string,
  cursor: string,
) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/book-signal-arc/runs/${runId}/events?cursor=${cursor}`,
  })
  expect(response.statusCode).toBe(200)
  return response.json().events
}

describe('fixture API server book draft live assembly', () => {
  it('returns current book/chapter/scene assembly with stable ids, explicit gaps, and order-based sequencing', async () => {
    await withTestServer(async ({ app }) => {
      const assembly = await fetchBookDraftAssembly(app)

      expect(assembly).toMatchObject({
        bookId: 'book-signal-arc',
        chapterCount: 2,
        sceneCount: 3,
        draftedSceneCount: 1,
        missingDraftSceneCount: 2,
      })
      expect(assembly.chapters.map((chapter: { chapterId: string }) => chapter.chapterId)).toEqual([
        'chapter-signals-in-rain',
        'chapter-open-water-signals',
      ])

      expect(assembly.chapters[0]).toMatchObject({
        chapterId: 'chapter-signals-in-rain',
        order: 1,
        sceneCount: 2,
        draftedSceneCount: 1,
        missingDraftCount: 1,
      })
      expect(assembly.chapters[0].scenes.map((scene: { sceneId: string }) => scene.sceneId)).toEqual([
        'scene-midnight-platform',
        'scene-concourse-delay',
      ])
      expect(assembly.chapters[1]).toMatchObject({
        chapterId: 'chapter-open-water-signals',
        order: 2,
      })

      expect(assembly.chapters[0].scenes[0]).toMatchObject({
        kind: 'draft',
        sceneId: 'scene-midnight-platform',
        order: 1,
        proseDraft: 'Ren lets the rain hide the count in his head while Mei keeps every term loud enough for the witness to hear.',
        proseStatusLabel: {
          en: 'Draft ready for review',
          'zh-CN': '草稿可供审阅',
        },
        draftWordCount: 21,
        traceReady: true,
        traceRollup: {
          acceptedFactCount: 1,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
          missingLinks: ['Departure bell timing'],
        },
      })

      expect(assembly.chapters[0].scenes[1]).toMatchObject({
        kind: 'gap',
        sceneId: 'scene-concourse-delay',
        order: 2,
        gapReason: {
          en: expect.stringContaining('No prose draft'),
        },
        traceReady: false,
        traceRollup: {
          acceptedFactCount: 0,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          missingLinks: ['trace'],
        },
      })

      expect(assembly.chapters[1].scenes[0]).toMatchObject({
        kind: 'gap',
        sceneId: 'scene-warehouse-bridge',
        order: 1,
        gapReason: {
          en: expect.stringContaining('No prose draft'),
        },
      })
    })
  })

  it('returns null for missing books following detail-read conventions', async () => {
    await withTestServer(async ({ app }) => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-missing/draft-assembly',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toBeNull()
    })
  })

  it('promotes a missing-draft scene from gap to draft after accept and updates current assembly totals', async () => {
    await withTestServer(async ({ app }) => {
      const assemblyBefore = await fetchBookDraftAssembly(app)
      const sceneBefore = findAssemblyScene(assemblyBefore, 'chapter-open-water-signals', 'scene-warehouse-bridge')

      expect(sceneBefore).toMatchObject({
        kind: 'gap',
        sceneId: 'scene-warehouse-bridge',
      })
      expect(assemblyBefore).toMatchObject({
        draftedSceneCount: 1,
        missingDraftSceneCount: 2,
        assembledWordCount: 21,
      })

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-warehouse-bridge/runs',
        payload: {
          mode: 'rewrite',
          note: 'Promote the missing warehouse scene into the current book draft assembly.',
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
          note: 'Accept the warehouse scene draft.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const assemblyAfter = await fetchBookDraftAssembly(app)
      const sceneAfter = findAssemblyScene(assemblyAfter, 'chapter-open-water-signals', 'scene-warehouse-bridge')

      expect(sceneAfter).toMatchObject({
        kind: 'draft',
        sceneId: 'scene-warehouse-bridge',
        proseStatusLabel: {
          en: 'Generated',
          'zh-CN': '已生成',
        },
      })
      expect(assemblyAfter).toMatchObject({
        draftedSceneCount: 2,
        missingDraftSceneCount: 1,
      })
      expect(assemblyAfter.assembledWordCount).toBeGreaterThan(assemblyBefore.assembledWordCount)
    })
  })

  it('reads accepted scene prose into the live assembly while run events stay lightweight', async () => {
    await withTestServer(async ({ app }) => {
      const selectedVariant = {
        proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
        variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-reveal-pressure',
      }

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Verify the live assembly reads accepted prose.',
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
          note: 'Accept and expose the current prose body through the book read model.',
          selectedVariants: [selectedVariant],
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const postReviewEvents = await fetchPostReviewEvents(app, startedRun.id, startedRun.latestEventId)
      const serializedEvents = JSON.stringify(postReviewEvents)
      expect(serializedEvents).not.toContain('Midnight Platform opens from the accepted run artifact')
      expect(serializedEvents).not.toContain(selectedVariant.variantId)
      expect(serializedEvents).not.toContain('sourceProposalIds')

      const canonPatchRef = findEventRef(postReviewEvents, 'canon_patch_applied', 'canon-patch')
      expect(canonPatchRef).toBeTruthy()

      const assembly = await fetchBookDraftAssembly(app)
      const scene = findAssemblyScene(assembly, 'chapter-signals-in-rain', 'scene-midnight-platform')

      expect(scene).toMatchObject({
        kind: 'draft',
        proseDraft: expect.stringContaining(selectedVariant.variantId),
        proseStatusLabel: {
          en: 'Generated',
          'zh-CN': '已生成',
        },
        sourcePatchId: canonPatchRef!.id,
        sourceProposals: [
          expect.objectContaining({
            proposalId: selectedVariant.proposalId,
            title: expect.stringContaining('Selected variant Reveal pressure'),
          }),
        ],
        acceptedFactIds: [expect.stringContaining(`${canonPatchRef!.id}-fact-001`)],
        traceRollup: {
          acceptedFactCount: 1,
          relatedAssetCount: expect.any(Number),
          sourceProposalCount: 1,
          missingLinks: [],
        },
      })
    })
  })

  it('preserves accept-with-edit provenance in the live assembly where the current read models expose it', async () => {
    await withTestServer(async ({ app }) => {
      const selectedVariant = {
        proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
        variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-reveal-pressure',
      }

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Exercise the editorial acceptance path in the live assembly.',
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
          note: 'Accept with edit and keep provenance visible.',
          selectedVariants: [selectedVariant],
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const postReviewEvents = await fetchPostReviewEvents(app, startedRun.id, startedRun.latestEventId)
      const canonPatchRef = findEventRef(postReviewEvents, 'canon_patch_applied', 'canon-patch')
      expect(canonPatchRef).toBeTruthy()

      const assembly = await fetchBookDraftAssembly(app)
      const scene = findAssemblyScene(assembly, 'chapter-signals-in-rain', 'scene-midnight-platform')

      expect(scene).toMatchObject({
        kind: 'draft',
        proseDraft: expect.stringContaining(selectedVariant.variantId),
        proseStatusLabel: {
          en: 'Generated',
          'zh-CN': '已生成',
        },
        sourcePatchId: canonPatchRef!.id,
        sourceProposals: [
          expect.objectContaining({
            proposalId: selectedVariant.proposalId,
            title: expect.stringContaining('Selected variant Reveal pressure'),
          }),
        ],
        acceptedFactIds: [expect.stringContaining(`${canonPatchRef!.id}-fact-001`)],
      })
    })
  })

  it('does not overwrite the live assembly prose after request-rewrite decisions', async () => {
    await withTestServer(async ({ app }) => {
      const assemblyBefore = await fetchBookDraftAssembly(app)
      const sceneBefore = findAssemblyScene(assemblyBefore, 'chapter-signals-in-rain', 'scene-midnight-platform')

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Request another pass without replacing the live assembly.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/review-decisions`,
        payload: {
          reviewId: startedRun.pendingReviewId,
          decision: 'request-rewrite',
          note: 'Keep the current live assembly draft intact.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const assemblyAfter = await fetchBookDraftAssembly(app)
      const sceneAfter = findAssemblyScene(assemblyAfter, 'chapter-signals-in-rain', 'scene-midnight-platform')

      expect(sceneAfter).toEqual(sceneBefore)
    })
  })

  it('does not overwrite the live assembly prose after reject decisions', async () => {
    await withTestServer(async ({ app }) => {
      const assemblyBefore = await fetchBookDraftAssembly(app)
      const sceneBefore = findAssemblyScene(assemblyBefore, 'chapter-signals-in-rain', 'scene-midnight-platform')

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Reject this pass without replacing the live assembly.',
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
          note: 'Reject without replacing the live assembly prose.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const assemblyAfter = await fetchBookDraftAssembly(app)
      const sceneAfter = findAssemblyScene(assemblyAfter, 'chapter-signals-in-rain', 'scene-midnight-platform')

      expect(sceneAfter).toEqual(sceneBefore)
    })
  })
})
