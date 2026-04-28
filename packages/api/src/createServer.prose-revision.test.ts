import { describe, expect, it, vi } from 'vitest'

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
  it('keeps accepted-run prose generation on the structured openai writer path when diffSummary is required', async () => {
    const generate = vi.fn().mockResolvedValue({
      body: {
        en: 'Midnight Platform opens on the accepted beat and keeps the witness pressure visible.',
        'zh-CN': 'Midnight Platform 以已接受节拍开场，并保持见证压力可见。',
      },
      excerpt: {
        en: 'Midnight Platform locks the bargain into view.',
        'zh-CN': 'Midnight Platform 将交易锁定在视野里。',
      },
      diffSummary: 'Drafted the accepted prose directly from the canon patch context.',
      relatedAssets: [
        {
          assetId: 'asset-scene-midnight-platform-lead',
          kind: 'character',
          label: {
            en: 'Midnight Platform lead',
            'zh-CN': 'Midnight Platform 主角',
          },
        },
      ],
    })

    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Exercise the structured writer contract in openai mode.',
        },
      })
      expect(startResponse.statusCode).toBe(200)

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startResponse.json().id}/review-decisions`,
        payload: {
          reviewId: startResponse.json().pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const proseResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(proseResponse.statusCode).toBe(200)
      expect(proseResponse.json()).toMatchObject({
        proseDraft: 'Midnight Platform opens on the accepted beat and keeps the witness pressure visible.',
        latestDiffSummary: 'Accepted prose draft was rendered for Midnight Platform.',
        statusLabel: 'Generated',
        traceSummary: {
          sourcePatchId: 'canon-patch-scene-midnight-platform-002',
          sourceProseDraftId: 'prose-draft-scene-midnight-platform-002',
          contextPacketId: 'ctx-scene-midnight-platform-run-002',
        },
      })
      expect(proseResponse.json().proseDraft).not.toContain('opens from the accepted run artifact')

      expect(generate).toHaveBeenCalledTimes(1)
      expect(generate.mock.calls[0]?.[0]).toMatchObject({
        task: 'draft',
        instructions: expect.stringContaining('body, excerpt, diffSummary, and relatedAssets'),
      })
    }, {
      configOverrides: {
        modelBindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { provider: 'fixture' },
          sceneProseWriter: {
            provider: 'openai-compatible',
            providerId: 'openai-default',
            providerLabel: 'OpenAI',
            baseUrl: 'https://api.openai.com/v1',
            modelId: 'gpt-5.4',
            apiKey: 'sk-test',
          },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        modelProvider: 'openai-compatible',
      },
      sceneProseWriterGatewayDependencies: {
        openAiProvider: {
          generate,
        },
      },
    })
  })

  it('leaves prose unchanged and returns a failed run when accepted openai prose generation fails', async () => {
    await withTestServer(async ({ app }) => {
      const proseBeforeRun = await app.inject({
        method: 'GET',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/prose',
      })
      expect(proseBeforeRun.statusCode).toBe(200)

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })
      expect(startResponse.statusCode).toBe(200)

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/local-project-alpha/runs/${startResponse.json().id}/review-decisions`,
        payload: {
          reviewId: startResponse.json().pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        status: 'failed',
        failureClass: 'provider_error',
      })

      const proseAfterFailure = await app.inject({
        method: 'GET',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/prose',
      })
      expect(proseAfterFailure.statusCode).toBe(200)
      expect(proseAfterFailure.json()).toEqual(proseBeforeRun.json())
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
            baseUrl: 'https://api.openai.com/v1',
            modelId: 'gpt-5.4',
            provider: 'openai-compatible',
            providerId: 'openai-default',
            providerLabel: 'OpenAI',
          },
          sceneProseWriter: {
            apiKey: 'sk-test',
            baseUrl: 'https://api.openai.com/v1',
            modelId: 'gpt-5.4',
            provider: 'openai-compatible',
            providerId: 'openai-default',
            providerLabel: 'OpenAI',
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
      scenePlannerGatewayDependencies: {
        openAiProvider: {
          generate: async () => ({
            proposals: [
              {
                title: 'Keep the accepted run real',
                summary: 'Use the configured planner binding before prose generation fails.',
                changeKind: 'action',
                riskLabel: 'Low continuity risk',
              },
            ],
          }),
        },
      },
    })
  })

  it('creates a real prose revision candidate after an accepted run without changing current draft text or run event payloads until accept', async () => {
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
          instruction: 'Lean into the witness reaction without changing the accepted canon facts.',
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
        revisionQueueCount: 1,
        latestDiffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
        statusLabel: 'Revision candidate ready',
        revisionCandidate: {
          revisionMode: 'expand',
          instruction: 'Lean into the witness reaction without changing the accepted canon facts.',
          proseBody: expect.stringContaining('Lean into the witness reaction without changing the accepted canon facts.'),
          diffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
          sourceProseDraftId: 'prose-draft-scene-midnight-platform-002',
          sourceCanonPatchId: 'canon-patch-scene-midnight-platform-002',
          contextPacketId: 'ctx-scene-midnight-platform-run-002',
          fallbackProvenance: {
            provider: 'fixture',
            modelId: 'fixture-scene-prose-writer',
          },
        },
        traceSummary: proseBeforeRevision.traceSummary,
      })
      expect(proseAfterRevision.revisionCandidate.proseBody).not.toBe(proseBeforeRevision.proseDraft)

      const chapterResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/chapters/chapter-signals-in-rain/structure',
      })
      expect(chapterResponse.statusCode).toBe(200)
      const chapterScene = chapterResponse.json().scenes.find((scene: { id: string }) => scene.id === 'scene-midnight-platform')
      expect(chapterScene).toMatchObject({
        proseStatusLabel: {
          en: 'Revision candidate ready',
          'zh-CN': '修订候选已就绪',
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
            title: 'Prose revision candidate ready',
            detail: 'The expansion revision candidate is ready to compare against the current prose.',
            tone: 'accent',
          }),
        ]),
      )

      const eventsAfterRevision = await fetchAllRunEvents(app, 'book-signal-arc', startedRun.id)
      expect(eventsAfterRevision).toEqual(eventsBeforeRevision)
      const serializedEvents = JSON.stringify(eventsAfterRevision)
      expect(serializedEvents).not.toContain(proseAfterRevision.proseDraft)
      expect(serializedEvents).not.toContain(proseAfterRevision.latestDiffSummary)
      expect(serializedEvents).not.toContain(proseAfterRevision.revisionCandidate.proseBody)
      expect(serializedEvents).not.toContain(proseAfterRevision.revisionCandidate.diffSummary)
      expect(serializedEvents).not.toContain('sourceProposalIds')

      const acceptRevisionResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision/accept',
        payload: {
          revisionId: proseAfterRevision.revisionCandidate.revisionId,
        },
      })
      expect(acceptRevisionResponse.statusCode).toBe(204)

      const acceptedProseResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(acceptedProseResponse.statusCode).toBe(200)
      expect(acceptedProseResponse.json()).toMatchObject({
        proseDraft: proseAfterRevision.revisionCandidate.proseBody,
        draftWordCount: proseAfterRevision.revisionCandidate.proseBody.trim().split(/\s+/).length,
        latestDiffSummary: 'Expanded witness-facing beats while preserving accepted provenance.',
        revisionQueueCount: 0,
        statusLabel: 'Updated',
        traceSummary: {
          sourcePatchId: 'canon-patch-scene-midnight-platform-002',
        },
      })
      expect(acceptedProseResponse.json()).not.toHaveProperty('revisionCandidate')
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

  it('resolves revision provenance from the persisted current prose chain even after later reject or request-rewrite runs advance latestRunId', async () => {
    for (const decision of ['request-rewrite', 'reject'] as const) {
      await withTestServer(async ({ app }) => {
        const acceptedRunResponse = await app.inject({
          method: 'POST',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
          payload: {
            mode: 'rewrite',
            note: `Prepare live prose before a later ${decision} run.`,
          },
        })
        expect(acceptedRunResponse.statusCode).toBe(200)

        const acceptedReviewResponse = await app.inject({
          method: 'POST',
          url: `/api/projects/book-signal-arc/runs/${acceptedRunResponse.json().id}/review-decisions`,
          payload: {
            reviewId: acceptedRunResponse.json().pendingReviewId,
            decision: 'accept',
          },
        })
        expect(acceptedReviewResponse.statusCode).toBe(200)

        const liveProseResponse = await app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
        })
        expect(liveProseResponse.statusCode).toBe(200)
        const liveProse = liveProseResponse.json()
        expect(liveProse.traceSummary?.sourcePatchId).toBe('canon-patch-scene-midnight-platform-002')

        const laterRunResponse = await app.inject({
          method: 'POST',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
          payload: {
            mode: 'rewrite',
            note: `Advance latestRunId through a ${decision} outcome.`,
          },
        })
        expect(laterRunResponse.statusCode).toBe(200)

        const laterReviewResponse = await app.inject({
          method: 'POST',
          url: `/api/projects/book-signal-arc/runs/${laterRunResponse.json().id}/review-decisions`,
          payload: {
            reviewId: laterRunResponse.json().pendingReviewId,
            decision,
          },
        })
        expect(laterReviewResponse.statusCode).toBe(200)

        const revisionResponse = await app.inject({
          method: 'POST',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision',
          payload: {
            revisionMode: 'rewrite',
            instruction: `Revise the persisted live prose after a later ${decision} run.`,
          },
        })
        expect(revisionResponse.statusCode).toBe(204)

        const revisedProseResponse = await app.inject({
          method: 'GET',
          url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
        })
        expect(revisedProseResponse.statusCode).toBe(200)
        expect(revisedProseResponse.json()).toMatchObject({
          proseDraft: liveProse.proseDraft,
          statusLabel: 'Revision candidate ready',
          revisionCandidate: {
            sourceCanonPatchId: 'canon-patch-scene-midnight-platform-002',
            sourceProseDraftId: 'prose-draft-scene-midnight-platform-002',
            contextPacketId: 'ctx-scene-midnight-platform-run-002',
            instruction: `Revise the persisted live prose after a later ${decision} run.`,
          },
        })
      })
    }
  })

  it('advances accepted revision provenance so chained revisions derive from the latest accepted prose lineage', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Create the first accepted prose baseline.',
        },
      })
      expect(startResponse.statusCode).toBe(200)

      const acceptRunResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startResponse.json().id}/review-decisions`,
        payload: {
          reviewId: startResponse.json().pendingReviewId,
          decision: 'accept',
        },
      })
      expect(acceptRunResponse.statusCode).toBe(200)

      const firstRevisionResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision',
        payload: {
          revisionMode: 'rewrite',
          instruction: 'Refocus the current prose around the witness reaction.',
        },
      })
      expect(firstRevisionResponse.statusCode).toBe(204)

      const firstCandidateProseResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(firstCandidateProseResponse.statusCode).toBe(200)
      const firstCandidate = firstCandidateProseResponse.json().revisionCandidate

      const acceptFirstRevisionResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision/accept',
        payload: {
          revisionId: firstCandidate.revisionId,
        },
      })
      expect(acceptFirstRevisionResponse.statusCode).toBe(204)

      const firstAcceptedProseResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(firstAcceptedProseResponse.statusCode).toBe(200)
      expect(firstAcceptedProseResponse.json()).toMatchObject({
        proseDraft: firstCandidate.proseBody,
        traceSummary: {
          sourcePatchId: 'canon-patch-scene-midnight-platform-002',
        },
      })

      const secondRevisionResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose/revision',
        payload: {
          revisionMode: 'compress',
          instruction: 'Tighten the already accepted revision without resetting provenance.',
        },
      })
      expect(secondRevisionResponse.statusCode).toBe(204)

      const secondCandidateProseResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })
      expect(secondCandidateProseResponse.statusCode).toBe(200)
      expect(secondCandidateProseResponse.json()).toMatchObject({
        proseDraft: firstCandidate.proseBody,
        revisionCandidate: {
          sourceCanonPatchId: 'canon-patch-scene-midnight-platform-002',
          sourceProseDraftId: `accepted-prose-revision-${firstCandidate.revisionId}`,
          contextPacketId: 'ctx-scene-midnight-platform-run-002',
        },
      })
    })
  })
})
