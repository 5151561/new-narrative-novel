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

async function fetchChapterScene(
  app: TestApp,
  chapterId: string,
  sceneId: string,
) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/book-signal-arc/chapters/${chapterId}/structure`,
  })
  expect(response.statusCode).toBe(200)
  const scene = response.json().scenes.find((entry: { id: string }) => entry.id === sceneId)
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

async function fetchBookDraftAssembly(
  app: TestApp,
  bookId = 'book-signal-arc',
) {
  const response = await app.inject({
    method: 'GET',
    url: `/api/projects/book-signal-arc/books/${bookId}/draft-assembly`,
  })
  expect(response.statusCode).toBe(200)
  return response.json()
}

describe('fixture API server PR37 draft assembly regression closure', () => {
  it('propagates accepted selected variants through ref-based artifacts, scene prose, chapter status, and trace links', async () => {
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
          note: 'Close the assembly propagation chain.',
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
          note: 'Accept the selected proposal variant.',
          selectedVariants: [selectedVariant],
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        id: startedRun.id,
        status: 'completed',
        summary: 'Proposal set accepted and applied to canon and prose.',
      })
      expect(reviewResponse.json()).not.toHaveProperty('pendingReviewId')

      const postReviewEvents = await fetchPostReviewEvents(app, startedRun.id, startedRun.latestEventId)
      expect(postReviewEvents.map((event: { kind: string }) => event.kind)).toEqual([
        'review_decision_submitted',
        'canon_patch_applied',
        'prose_generated',
        'run_completed',
      ])

      const serializedEvents = JSON.stringify(postReviewEvents)
      expect(serializedEvents).not.toContain(selectedVariant.variantId)
      expect(serializedEvents).not.toContain('sourceProposalIds')
      expect(serializedEvents).not.toContain('acceptedFacts')

      const reviewDecisionEvent = postReviewEvents.find((event: { kind: string }) => event.kind === 'review_decision_submitted')
      expect(reviewDecisionEvent).toMatchObject({
        metadata: {
          selectedVariantCount: 1,
        },
      })
      expect(reviewDecisionEvent).not.toHaveProperty('selectedVariants')

      const canonPatchRef = findEventRef(postReviewEvents, 'canon_patch_applied', 'canon-patch')
      const proseDraftRef = findEventRef(postReviewEvents, 'prose_generated', 'prose-draft')
      expect(canonPatchRef).toBeTruthy()
      expect(proseDraftRef).toBeTruthy()

      const [canonPatchResponse, proseDraftResponse, proseResponse, traceResponse] = await Promise.all([
        app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${startedRun.id}/artifacts/${canonPatchRef!.id}`,
        }),
        app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${startedRun.id}/artifacts/${proseDraftRef!.id}`,
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
        }),
        app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${startedRun.id}/trace`,
        }),
      ])

      expect(canonPatchResponse.statusCode).toBe(200)
      expect(canonPatchResponse.json()).toMatchObject({
        artifact: {
          id: canonPatchRef!.id,
          kind: 'canon-patch',
          decision: 'accept',
          acceptedProposalIds: [selectedVariant.proposalId],
          selectedVariants: [selectedVariant],
        },
      })
      const acceptedFactId = canonPatchResponse.json().artifact.acceptedFacts[0]?.id
      expect(acceptedFactId).toBeTruthy()

      expect(proseDraftResponse.statusCode).toBe(200)
      expect(proseDraftResponse.json()).toMatchObject({
        artifact: {
          id: proseDraftRef!.id,
          kind: 'prose-draft',
          sourceCanonPatchId: canonPatchRef!.id,
          sourceProposalIds: [selectedVariant.proposalId],
          selectedVariants: [selectedVariant],
          body: {
            en: expect.stringContaining(selectedVariant.variantId),
          },
        },
      })

      expect(proseResponse.statusCode).toBe(200)
      expect(proseResponse.json()).toMatchObject({
        proseDraft: expect.stringContaining(selectedVariant.variantId),
        statusLabel: 'Generated',
        traceSummary: {
          sourcePatchId: canonPatchRef!.id,
          sourceProposals: [
            expect.objectContaining({
              proposalId: selectedVariant.proposalId,
              title: expect.stringContaining('Selected variant Reveal pressure'),
            }),
          ],
          acceptedFactIds: [acceptedFactId],
          missingLinks: [],
        },
      })

      const chapterScene = await fetchChapterScene(app, 'chapter-signals-in-rain', 'scene-midnight-platform')
      expect(chapterScene).toMatchObject({
        proseStatusLabel: {
          en: 'Updated',
          'zh-CN': '已更新',
        },
        runStatusLabel: {
          en: 'Run completed',
        },
      })

      expect(traceResponse.statusCode).toBe(200)
      expect(traceResponse.json().summary).toMatchObject({
        proposalSetCount: 1,
        canonPatchCount: 1,
        proseDraftCount: 1,
        missingTraceCount: 0,
      })
      expect(traceResponse.json().links).toEqual(expect.arrayContaining([
        expect.objectContaining({
          relation: 'accepted_into',
          from: {
            kind: 'proposal',
            id: selectedVariant.proposalId,
          },
          to: {
            kind: 'canon-fact',
            id: acceptedFactId,
          },
          label: expect.objectContaining({
            en: expect.stringContaining('selected variant Reveal pressure'),
          }),
        }),
        expect.objectContaining({
          relation: 'accepted_into',
          from: {
            kind: 'canon-fact',
            id: acceptedFactId,
          },
          to: {
            kind: 'canon-patch',
            id: canonPatchRef!.id,
          },
        }),
        expect.objectContaining({
          relation: 'rendered_as',
          from: {
            kind: 'canon-patch',
            id: canonPatchRef!.id,
          },
          to: {
            kind: 'prose-draft',
            id: proseDraftRef!.id,
          },
          label: expect.objectContaining({
            en: expect.stringContaining('selected variant Reveal pressure'),
          }),
        }),
      ]))
    })
  })

  it('preserves accept-with-edit source semantics and selected variant provenance across artifacts and scene read models', async () => {
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
          note: 'Exercise the editorial acceptance path.',
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
          note: 'Accept with editor adjustments.',
          selectedVariants: [selectedVariant],
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        id: startedRun.id,
        status: 'completed',
        summary: 'Proposal set accepted with editor adjustments applied to canon and prose.',
      })

      const postReviewEvents = await fetchPostReviewEvents(app, startedRun.id, startedRun.latestEventId)
      const serializedEvents = JSON.stringify(postReviewEvents)
      expect(serializedEvents).not.toContain(selectedVariant.variantId)
      expect(serializedEvents).not.toContain('sourceProposalIds')

      const canonPatchRef = findEventRef(postReviewEvents, 'canon_patch_applied', 'canon-patch')
      const proseDraftRef = findEventRef(postReviewEvents, 'prose_generated', 'prose-draft')
      expect(canonPatchRef).toBeTruthy()
      expect(proseDraftRef).toBeTruthy()

      const [canonPatchResponse, proseDraftResponse, proseResponse, executionResponse] = await Promise.all([
        app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${startedRun.id}/artifacts/${canonPatchRef!.id}`,
        }),
        app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${startedRun.id}/artifacts/${proseDraftRef!.id}`,
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
        }),
        app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/execution',
        }),
      ])

      expect(canonPatchResponse.statusCode).toBe(200)
      expect(canonPatchResponse.json()).toMatchObject({
        artifact: {
          id: canonPatchRef!.id,
          kind: 'canon-patch',
          decision: 'accept-with-edit',
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
      const acceptedFactId = canonPatchResponse.json().artifact.acceptedFacts[0]?.id
      expect(acceptedFactId).toBeTruthy()

      expect(proseDraftResponse.statusCode).toBe(200)
      expect(proseDraftResponse.json()).toMatchObject({
        artifact: {
          id: proseDraftRef!.id,
          kind: 'prose-draft',
          sourceCanonPatchId: canonPatchRef!.id,
          sourceProposalIds: [selectedVariant.proposalId],
          selectedVariants: [selectedVariant],
          body: {
            en: expect.stringContaining(selectedVariant.variantId),
          },
        },
      })

      expect(proseResponse.statusCode).toBe(200)
      expect(proseResponse.json()).toMatchObject({
        proseDraft: expect.stringContaining(selectedVariant.variantId),
        traceSummary: {
          sourcePatchId: canonPatchRef!.id,
          sourceProposals: [
            expect.objectContaining({
              proposalId: selectedVariant.proposalId,
              title: expect.stringContaining('Selected variant Reveal pressure'),
            }),
          ],
          acceptedFactIds: [acceptedFactId],
        },
      })

      expect(executionResponse.statusCode).toBe(200)
      expect(executionResponse.json()).toMatchObject({
        acceptedSummary: {
          acceptedFacts: [
            expect.objectContaining({
              id: acceptedFactId,
              sourceProposals: [
                expect.objectContaining({
                  proposalId: selectedVariant.proposalId,
                }),
              ],
            }),
          ],
        },
      })
    })
  })

  it('keeps request-rewrite decisions from overwriting existing scene prose or chapter prose status', async () => {
    await withTestServer(async ({ app }) => {
      const proseBeforeResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseBeforeResponse.statusCode).toBe(200)
      const proseBefore = proseBeforeResponse.json()
      const chapterSceneBefore = await fetchChapterScene(app, 'chapter-signals-in-rain', 'scene-midnight-platform')
      const bookDraftAssemblyBefore = await fetchBookDraftAssembly(app)

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Request another pass without replacing draft state.',
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
          note: 'Do another rewrite.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        id: startedRun.id,
        status: 'completed',
        summary: 'Rewrite requested. Start a new run to continue.',
        completedAtLabel: '2026-04-23 10:10',
      })

      const proseAfterResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseAfterResponse.statusCode).toBe(200)
      expect(proseAfterResponse.json()).toEqual(proseBefore)

      const chapterSceneAfter = await fetchChapterScene(app, 'chapter-signals-in-rain', 'scene-midnight-platform')
      expect(chapterSceneAfter.proseStatusLabel).toEqual(chapterSceneBefore.proseStatusLabel)

      const bookDraftAssemblyAfter = await fetchBookDraftAssembly(app)
      expect(bookDraftAssemblyAfter).toEqual(bookDraftAssemblyBefore)
    })
  })

  it('keeps reject decisions from overwriting existing scene prose or chapter prose status', async () => {
    await withTestServer(async ({ app }) => {
      const proseBeforeResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseBeforeResponse.statusCode).toBe(200)
      const proseBefore = proseBeforeResponse.json()
      const chapterSceneBefore = await fetchChapterScene(app, 'chapter-signals-in-rain', 'scene-midnight-platform')

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Reject this pass without replacing draft state.',
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
          note: 'Reject without replacing prose.',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        id: startedRun.id,
        status: 'completed',
        summary: 'Proposal set rejected and the run was closed.',
      })

      const proseAfterResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseAfterResponse.statusCode).toBe(200)
      expect(proseAfterResponse.json()).toEqual(proseBefore)

      const chapterSceneAfter = await fetchChapterScene(app, 'chapter-signals-in-rain', 'scene-midnight-platform')
      expect(chapterSceneAfter.proseStatusLabel).toEqual(chapterSceneBefore.proseStatusLabel)
    })
  })
})
