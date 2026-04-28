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

describe('fixture API server run artifact read surfaces', () => {
  it('serves artifact summaries, artifact detail, and trace links across review acceptance', async () => {
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
      const run = startResponse.json()

      const firstEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/events`,
      })
      expect(firstEventsResponse.statusCode).toBe(200)
      const firstEventsPage = firstEventsResponse.json()

      const secondEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/events?cursor=${firstEventsPage.nextCursor}`,
      })
      expect(secondEventsResponse.statusCode).toBe(200)
      const secondEventsPage = secondEventsResponse.json()

      const allPreReviewEvents = [...firstEventsPage.events, ...secondEventsPage.events]
      const contextPacketEvent = allPreReviewEvents.find((event: { kind: string }) => event.kind === 'context_packet_built')
      const contextPacketRef = findEventRef(allPreReviewEvents, 'context_packet_built', 'context-packet')
      const proposalSetRef = findEventRef(allPreReviewEvents, 'proposal_created', 'proposal-set')

      expect(contextPacketEvent).toMatchObject({
        refs: [
          expect.objectContaining({
            kind: 'context-packet',
          }),
        ],
        metadata: {
          includedAssetCount: 6,
          excludedAssetCount: 0,
          redactedAssetCount: 1,
        },
      })
      expect(contextPacketEvent).not.toHaveProperty('assetActivations')
      expect(JSON.stringify(contextPacketEvent)).not.toContain('activation-ren-voss')
      expect(JSON.stringify(contextPacketEvent)).not.toContain('ren-scene-cast')
      expect(JSON.stringify(contextPacketEvent)).not.toContain('Cast member')

      expect(contextPacketRef).toBeTruthy()
      expect(proposalSetRef).toBeTruthy()

      const contextPacketResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts/${contextPacketRef!.id}`,
      })
      expect(contextPacketResponse.statusCode).toBe(200)
      const contextPacketArtifact = contextPacketResponse.json().artifact
      expect(contextPacketArtifact).toMatchObject({
        id: contextPacketRef!.id,
        kind: 'context-packet',
        sceneId: 'scene-midnight-platform',
        activationSummary: {
          includedAssetCount: 6,
          excludedAssetCount: 0,
          redactedAssetCount: 1,
          targetAgentCount: 4,
          warningCount: 1,
        },
      })
      expect(contextPacketArtifact.sections).toEqual(expect.arrayContaining([
        expect.objectContaining({
          title: expect.objectContaining({
            en: 'Narrative brief',
          }),
        }),
      ]))
      expect(contextPacketArtifact.includedCanonFacts).toEqual(expect.arrayContaining([
        expect.objectContaining({
          label: expect.objectContaining({
            en: 'Scene objective',
          }),
          value: expect.objectContaining({
            en: 'Lock the bargain before the witness can turn the ledger into public leverage.',
          }),
        }),
      ]))
      expect(contextPacketArtifact.excludedPrivateFacts).toEqual(expect.arrayContaining([
        expect.objectContaining({
          label: expect.objectContaining({
            en: 'Courier signal private key',
          }),
        }),
      ]))
      expect(contextPacketArtifact.assetActivations).toEqual(expect.arrayContaining([
        expect.objectContaining({
          assetId: 'asset-ren-voss',
          assetKind: 'character',
          decision: 'included',
          reasonKind: 'scene-cast',
          visibility: 'character-known',
          budget: 'selected-facts',
          policyRuleIds: ['ren-scene-cast'],
        }),
        expect.objectContaining({
          assetId: 'asset-courier-network',
          assetKind: 'organization',
          decision: 'included',
          visibility: 'character-known',
        }),
        expect.objectContaining({
          assetId: 'asset-closed-ledger',
          assetKind: 'object',
          decision: 'included',
          visibility: 'character-known',
        }),
        expect.objectContaining({
          assetId: 'asset-public-witness-rule',
          assetKind: 'lore',
          decision: 'included',
          visibility: 'public',
        }),
        expect.objectContaining({
          assetId: 'asset-departure-bell-timing',
          decision: 'redacted',
          visibility: 'editor-only',
        }),
      ]))

      const proposalSetResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts/${proposalSetRef!.id}`,
      })
      expect(proposalSetResponse.statusCode).toBe(200)
      const selectedVariant = {
        proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
        variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
      }
      const proposalSetArtifact = proposalSetResponse.json().artifact
      expect(proposalSetResponse.json()).toMatchObject({
        artifact: {
          id: proposalSetRef!.id,
          kind: 'proposal-set',
          sourceInvocationIds: ['agent-invocation-scene-midnight-platform-run-002-001'],
          proposals: expect.arrayContaining([
            expect.objectContaining({
              id: selectedVariant.proposalId,
              changeKind: 'action',
              defaultVariantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
              variants: expect.arrayContaining([
                expect.objectContaining({
                  id: selectedVariant.variantId,
                  riskLabel: {
                    en: 'Higher continuity risk',
                    'zh-CN': '连续性风险较高',
                  },
                }),
              ]),
            }),
            expect.objectContaining({
              id: 'proposal-set-scene-midnight-platform-run-002-proposal-002',
              changeKind: 'reveal',
            }),
          ]),
        },
      })
      expect(proposalSetArtifact.proposals[1]).not.toHaveProperty('variants')

      const artifactListBeforeReviewResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts`,
      })
      expect(artifactListBeforeReviewResponse.statusCode).toBe(200)
      expect(artifactListBeforeReviewResponse.json()).toMatchObject({
        runId: run.id,
        artifacts: [
          expect.objectContaining({ kind: 'context-packet' }),
          expect.objectContaining({ kind: 'agent-invocation' }),
          expect.objectContaining({ kind: 'agent-invocation' }),
          expect.objectContaining({ kind: 'proposal-set' }),
        ],
      })

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${run.id}/review-decisions`,
        payload: {
          reviewId: run.pendingReviewId,
          decision: 'accept',
          selectedVariants: [selectedVariant],
        },
      })
      expect(reviewResponse.statusCode).toBe(200)

      const postReviewEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/events?cursor=${run.latestEventId}`,
      })
      expect(postReviewEventsResponse.statusCode).toBe(200)
      const postReviewEvents = postReviewEventsResponse.json().events
      const reviewDecisionEvent = postReviewEvents.find((event: { kind: string }) => event.kind === 'review_decision_submitted')
      expect(reviewDecisionEvent).toMatchObject({
        metadata: {
          selectedVariantCount: 1,
        },
      })
      expect(reviewDecisionEvent).not.toHaveProperty('selectedVariants')
      expect(JSON.stringify(reviewDecisionEvent)).not.toContain(selectedVariant.variantId)

      const canonPatchRef = findEventRef(postReviewEvents, 'canon_patch_applied', 'canon-patch')
      const writerInvocationRef = findEventRef(postReviewEvents, 'prose_generated', 'agent-invocation')
      const proseDraftRef = findEventRef(postReviewEvents, 'prose_generated', 'prose-draft')
      expect(canonPatchRef).toBeTruthy()
      expect(writerInvocationRef).toBeTruthy()
      expect(proseDraftRef).toBeTruthy()

      const canonPatchResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts/${canonPatchRef!.id}`,
      })
      expect(canonPatchResponse.statusCode).toBe(200)
      expect(canonPatchResponse.json()).toMatchObject({
        artifact: {
          id: canonPatchRef!.id,
          kind: 'canon-patch',
          acceptedProposalIds: ['proposal-set-scene-midnight-platform-run-002-proposal-001'],
          selectedVariants: [selectedVariant],
          acceptedFacts: [
            expect.objectContaining({
              selectedVariants: [selectedVariant],
            }),
          ],
        },
      })

      const writerInvocationResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts/${writerInvocationRef!.id}`,
      })
      expect(writerInvocationResponse.statusCode).toBe(200)
      expect(writerInvocationResponse.json()).toMatchObject({
        artifact: {
          id: writerInvocationRef!.id,
          kind: 'agent-invocation',
          agentRole: 'scene-writer',
          modelLabel: {
            en: 'Fixture writer profile (fixture-scene-prose-writer)',
          },
          generatedRefs: [
            expect.objectContaining({
              kind: 'artifact',
              id: proseDraftRef!.id,
            }),
          ],
        },
      })

      const proseDraftResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts/${proseDraftRef!.id}`,
      })
      expect(proseDraftResponse.statusCode).toBe(200)
      expect(proseDraftResponse.json()).toMatchObject({
        artifact: {
          id: proseDraftRef!.id,
          kind: 'prose-draft',
          sourceCanonPatchId: canonPatchRef!.id,
          contextPacketId: contextPacketRef!.id,
          sourceProposalIds: ['proposal-set-scene-midnight-platform-run-002-proposal-001'],
          selectedVariants: [selectedVariant],
          body: {
            en: expect.stringContaining(selectedVariant.variantId),
          },
          excerpt: {
            en: 'Midnight Platform settles into view before the next reveal turns visible.',
            'zh-CN': 'Midnight Platform 先稳稳落入视野，随后下一段揭示才开始显形。',
          },
        },
      })
      expect(proseDraftResponse.json().artifact.body.en).toContain('Accepted proposal proposal-set-scene-midnight-platform-run-002-proposal-001 anchors the draft.')
      expect(proseDraftResponse.json().artifact.summary.en).toBe('A fixture prose draft was rendered for Midnight Platform.')

      const traceResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/trace`,
      })
      expect(traceResponse.statusCode).toBe(200)
      expect(traceResponse.json()).toMatchObject({
        runId: run.id,
        summary: {
          proposalSetCount: 1,
          canonPatchCount: 1,
          proseDraftCount: 1,
          missingTraceCount: 0,
        },
        links: expect.arrayContaining([
          expect.objectContaining({
            relation: 'accepted_into',
            from: {
              kind: 'proposal',
              id: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
            },
            to: {
              kind: 'canon-fact',
              id: 'canon-patch-scene-midnight-platform-002-fact-001',
            },
            label: {
              en: expect.stringContaining('selected variant Reveal pressure'),
              'zh-CN': expect.stringContaining('已选变体 揭示加压'),
            },
          }),
          expect.objectContaining({
            relation: 'accepted_into',
            from: {
              kind: 'canon-fact',
              id: 'canon-patch-scene-midnight-platform-002-fact-001',
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
            label: {
              en: expect.stringContaining('selected variant Reveal pressure'),
              'zh-CN': expect.stringContaining('已选变体 揭示加压'),
            },
          }),
          expect.objectContaining({
            relation: 'generated',
            from: {
              kind: 'agent-invocation',
              id: writerInvocationRef!.id,
            },
            to: {
              kind: 'prose-draft',
              id: proseDraftRef!.id,
            },
          }),
        ]),
      })
      expect(traceResponse.json().links).not.toEqual(expect.arrayContaining([
        expect.objectContaining({
          relation: 'generated',
          from: {
            kind: 'agent-invocation',
            id: writerInvocationRef!.id,
          },
          to: {
            kind: 'proposal-set',
            id: proposalSetRef!.id,
          },
        }),
      ]))
    })
  })

  it('keeps rewrite and reject runs free of canon/prose artifacts and canon/prose trace counts', async () => {
    await withTestServer(async ({ app }) => {
      const rewriteStartResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: { mode: 'rewrite' },
      })
      expect(rewriteStartResponse.statusCode).toBe(200)
      const rewriteRun = rewriteStartResponse.json()

      const rewriteDecisionResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${rewriteRun.id}/review-decisions`,
        payload: {
          reviewId: rewriteRun.pendingReviewId,
          decision: 'request-rewrite',
        },
      })
      expect(rewriteDecisionResponse.statusCode).toBe(200)
      expect(rewriteDecisionResponse.json()).toMatchObject({
        id: rewriteRun.id,
        status: 'completed',
        summary: 'Rewrite requested. Start a new run to continue.',
        completedAtLabel: '2026-04-23 10:10',
      })
      expect(rewriteDecisionResponse.json()).not.toHaveProperty('pendingReviewId')

      const rewriteEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${rewriteRun.id}/events?cursor=${rewriteRun.latestEventId}`,
      })
      expect(rewriteEventsResponse.statusCode).toBe(200)
      expect(rewriteEventsResponse.json()).not.toHaveProperty('nextCursor')
      expect(rewriteEventsResponse.json().events.map((event: { kind: string }) => event.kind)).toEqual([
        'review_decision_submitted',
      ])

      const rewriteArtifactsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${rewriteRun.id}/artifacts`,
      })
      expect(rewriteArtifactsResponse.statusCode).toBe(200)
      expect(rewriteArtifactsResponse.json().artifacts.map((artifact: { kind: string }) => artifact.kind)).toEqual([
        'context-packet',
        'agent-invocation',
        'agent-invocation',
        'proposal-set',
      ])

      const rewriteTraceResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${rewriteRun.id}/trace`,
      })
      expect(rewriteTraceResponse.statusCode).toBe(200)
      expect(rewriteTraceResponse.json().summary).toEqual({
        proposalSetCount: 1,
        canonPatchCount: 0,
        proseDraftCount: 0,
        missingTraceCount: 0,
      })

      const [missingRewriteCanonPatchResponse, missingRewriteProseDraftResponse] = await Promise.all([
        app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${rewriteRun.id}/artifacts/canon-patch-scene-midnight-platform-002`,
        }),
        app.inject({
          method: 'GET',
          url: `/api/projects/book-signal-arc/runs/${rewriteRun.id}/artifacts/prose-draft-scene-midnight-platform-002`,
        }),
      ])
      expect(missingRewriteCanonPatchResponse.statusCode).toBe(404)
      expect(missingRewriteProseDraftResponse.statusCode).toBe(404)

      const rejectStartResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: { mode: 'rewrite' },
      })
      expect(rejectStartResponse.statusCode).toBe(200)
      const rejectRun = rejectStartResponse.json()

      const rejectDecisionResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${rejectRun.id}/review-decisions`,
        payload: {
          reviewId: rejectRun.pendingReviewId,
          decision: 'reject',
        },
      })
      expect(rejectDecisionResponse.statusCode).toBe(200)

      const rejectArtifactsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${rejectRun.id}/artifacts`,
      })
      expect(rejectArtifactsResponse.statusCode).toBe(200)
      expect(rejectArtifactsResponse.json().artifacts.map((artifact: { kind: string }) => artifact.kind)).toEqual([
        'context-packet',
        'agent-invocation',
        'agent-invocation',
        'proposal-set',
      ])

      const rejectTraceResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${rejectRun.id}/trace`,
      })
      expect(rejectTraceResponse.statusCode).toBe(200)
      expect(rejectTraceResponse.json().summary).toEqual({
        proposalSetCount: 1,
        canonPatchCount: 0,
        proseDraftCount: 0,
        missingTraceCount: 0,
      })
    })
  })

  it('keeps artifact lookup isolated by project and run over HTTP', async () => {
    await withTestServer(async ({ app }) => {
      const [runAResponse, runBResponse] = await Promise.all([
        app.inject({
          method: 'POST',
          url: '/api/projects/project-artifact-a/scenes/scene-midnight-platform/runs',
          payload: { mode: 'rewrite' },
        }),
        app.inject({
          method: 'POST',
          url: '/api/projects/project-artifact-b/scenes/scene-midnight-platform/runs',
          payload: { mode: 'rewrite' },
        }),
      ])

      expect(runAResponse.statusCode).toBe(200)
      expect(runBResponse.statusCode).toBe(200)
      const runA = runAResponse.json()
      const runB = runBResponse.json()
      expect(runA.id).toBe(runB.id)

      const acceptResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/project-artifact-a/runs/${runA.id}/review-decisions`,
        payload: {
          reviewId: runA.pendingReviewId,
          decision: 'accept',
        },
      })
      expect(acceptResponse.statusCode).toBe(200)

      const runBArtifactResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/project-artifact-b/runs/${runB.id}/artifacts/canon-patch-scene-midnight-platform-001`,
      })
      expect(runBArtifactResponse.statusCode).toBe(404)
      expect(runBArtifactResponse.json()).toEqual({
        status: 404,
        message: 'Run artifact canon-patch-scene-midnight-platform-001 was not found.',
        code: 'RUN_ARTIFACT_NOT_FOUND',
        detail: {
          projectId: 'project-artifact-b',
          runId: runB.id,
          artifactId: 'canon-patch-scene-midnight-platform-001',
        },
      })

      const runBTraceResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/project-artifact-b/runs/${runB.id}/trace`,
      })
      expect(runBTraceResponse.statusCode).toBe(200)
      expect(runBTraceResponse.json().summary).toEqual({
        proposalSetCount: 1,
        canonPatchCount: 0,
        proseDraftCount: 0,
        missingTraceCount: 0,
      })
    })
  })

  it('keeps artifact lookup isolated across different runs in the same project over HTTP', async () => {
    await withTestServer(async ({ app }) => {
      const runAResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: { mode: 'rewrite' },
      })
      const runBResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: { mode: 'rewrite' },
      })

      expect(runAResponse.statusCode).toBe(200)
      expect(runBResponse.statusCode).toBe(200)
      const runA = runAResponse.json()
      const runB = runBResponse.json()
      expect(runA.id).not.toBe(runB.id)

      const acceptResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${runA.id}/review-decisions`,
        payload: {
          reviewId: runA.pendingReviewId,
          decision: 'accept',
        },
      })
      expect(acceptResponse.statusCode).toBe(200)

      const runAPostReviewEventsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${runA.id}/events?cursor=${runA.latestEventId}`,
      })
      expect(runAPostReviewEventsResponse.statusCode).toBe(200)
      const runAPostReviewEvents = runAPostReviewEventsResponse.json().events
      const runACanonPatchRef = findEventRef(runAPostReviewEvents, 'canon_patch_applied', 'canon-patch')
      const runAProseDraftRef = findEventRef(runAPostReviewEvents, 'prose_generated', 'prose-draft')
      expect(runACanonPatchRef).toBeTruthy()
      expect(runAProseDraftRef).toBeTruthy()

      const runBArtifactListResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${runB.id}/artifacts`,
      })
      expect(runBArtifactListResponse.statusCode).toBe(200)
      expect(runBArtifactListResponse.json().artifacts.map((artifact: { kind: string }) => artifact.kind)).toEqual([
        'context-packet',
        'agent-invocation',
        'agent-invocation',
        'proposal-set',
      ])

      const runBCanonPatchResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${runB.id}/artifacts/${runACanonPatchRef!.id}`,
      })
      expect(runBCanonPatchResponse.statusCode).toBe(404)
      expect(runBCanonPatchResponse.json()).toEqual({
        status: 404,
        message: `Run artifact ${runACanonPatchRef!.id} was not found.`,
        code: 'RUN_ARTIFACT_NOT_FOUND',
        detail: {
          projectId: 'book-signal-arc',
          runId: runB.id,
          artifactId: runACanonPatchRef!.id,
        },
      })

      const runBProseDraftResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${runB.id}/artifacts/${runAProseDraftRef!.id}`,
      })
      expect(runBProseDraftResponse.statusCode).toBe(404)
      expect(runBProseDraftResponse.json()).toEqual({
        status: 404,
        message: `Run artifact ${runAProseDraftRef!.id} was not found.`,
        code: 'RUN_ARTIFACT_NOT_FOUND',
        detail: {
          projectId: 'book-signal-arc',
          runId: runB.id,
          artifactId: runAProseDraftRef!.id,
        },
      })

      const runBTraceResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${runB.id}/trace`,
      })
      expect(runBTraceResponse.statusCode).toBe(200)
      expect(runBTraceResponse.json().summary).toEqual({
        proposalSetCount: 1,
        canonPatchCount: 0,
        proseDraftCount: 0,
        missingTraceCount: 0,
      })
    })
  })

  it('returns 404 JSON errors for missing runs and missing artifacts', async () => {
    await withTestServer(async ({ app }) => {
      const missingArtifactsResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-missing/artifacts',
      })
      expect(missingArtifactsResponse.statusCode).toBe(404)
      expect(missingArtifactsResponse.json()).toEqual({
        status: 404,
        message: 'Run run-missing was not found.',
        code: 'RUN_NOT_FOUND',
        detail: {
          projectId: 'book-signal-arc',
          runId: 'run-missing',
        },
      })

      const missingTraceResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/runs/run-missing/trace',
      })
      expect(missingTraceResponse.statusCode).toBe(404)
      expect(missingTraceResponse.json()).toEqual({
        status: 404,
        message: 'Run run-missing was not found.',
        code: 'RUN_NOT_FOUND',
        detail: {
          projectId: 'book-signal-arc',
          runId: 'run-missing',
        },
      })

      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: { mode: 'rewrite' },
      })
      expect(startResponse.statusCode).toBe(200)
      const run = startResponse.json()

      const missingArtifactResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts/artifact-missing`,
      })
      expect(missingArtifactResponse.statusCode).toBe(404)
      expect(missingArtifactResponse.json()).toEqual({
        status: 404,
        message: 'Run artifact artifact-missing was not found.',
        code: 'RUN_ARTIFACT_NOT_FOUND',
        detail: {
          projectId: 'book-signal-arc',
          runId: run.id,
          artifactId: 'artifact-missing',
        },
      })
    })
  })

  it('returns 404 when artifact summaries are unavailable for an existing run', async () => {
    await withTestServer(async ({ app, repository }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: { mode: 'rewrite' },
      })
      expect(startResponse.statusCode).toBe(200)
      const run = startResponse.json()

      const originalListRunArtifacts = repository.listRunArtifacts
      repository.listRunArtifacts = () => null

      const artifactListResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts`,
      })

      expect(artifactListResponse.statusCode).toBe(404)
      expect(artifactListResponse.json()).toEqual({
        status: 404,
        message: `Run artifacts for ${run.id} were not found.`,
        code: 'RUN_ARTIFACTS_NOT_FOUND',
        detail: {
          projectId: 'book-signal-arc',
          runId: run.id,
        },
      })

      repository.listRunArtifacts = originalListRunArtifacts
    })
  })

  it('returns 409 on patchId collision without mutating run events or artifacts', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: { mode: 'rewrite' },
      })
      expect(startResponse.statusCode).toBe(200)
      const run = startResponse.json()

      const beforeRunResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}`,
      })
      expect(beforeRunResponse.statusCode).toBe(200)
      expect(beforeRunResponse.json()).toMatchObject({
        eventCount: 9,
      })

      const beforeArtifactsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts`,
      })
      expect(beforeArtifactsResponse.statusCode).toBe(200)

      const collisionResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${run.id}/review-decisions`,
        payload: {
          reviewId: run.pendingReviewId,
          decision: 'accept-with-edit',
          patchId: 'ctx-scene-midnight-platform-run-002',
        },
      })
      expect(collisionResponse.statusCode).toBe(409)
      expect(collisionResponse.json()).toEqual({
        status: 409,
        message: `Run artifact id ctx-scene-midnight-platform-run-002 conflicts within run ${run.id}.`,
        code: 'RUN_ARTIFACT_ID_CONFLICT',
        detail: {
          projectId: 'book-signal-arc',
          runId: run.id,
          artifactId: 'ctx-scene-midnight-platform-run-002',
        },
      })

      const afterRunResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}`,
      })
      expect(afterRunResponse.statusCode).toBe(200)
      expect(afterRunResponse.json()).toMatchObject({
        status: 'waiting_review',
        eventCount: 9,
        latestEventId: 'run-event-scene-midnight-platform-002-009',
      })

      const afterArtifactsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${run.id}/artifacts`,
      })
      expect(afterArtifactsResponse.statusCode).toBe(200)
      expect(afterArtifactsResponse.json()).toEqual(beforeArtifactsResponse.json())
    })
  })

  it('returns a config error over HTTP when global openai mode leaves planner config incomplete before artifacts exist', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
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
        modelProvider: 'openai',
      },
    })
  })

  it('returns a config error over HTTP when accepted prose generation requires an explicit writer binding but config is incomplete', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const run = startResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${run.id}/review-decisions`,
        payload: {
          reviewId: run.pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(400)
      expect(reviewResponse.json()).toMatchObject({
        code: 'RUN_MODEL_CONFIG_REQUIRED',
      })
    }, {
      configOverrides: {
        modelBindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { provider: 'fixture' },
          sceneProseWriter: {
            provider: 'openai',
          },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        modelProvider: 'openai',
      },
    })
  })

  it('keeps failed writer invocation artifacts honest when accepted prose generation fails in real mode', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/local-project-alpha/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const run = startResponse.json()

      const reviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/local-project-alpha/runs/${run.id}/review-decisions`,
        payload: {
          reviewId: run.pendingReviewId,
          decision: 'accept',
        },
      })
      expect(reviewResponse.statusCode).toBe(200)
      expect(reviewResponse.json()).toMatchObject({
        status: 'failed',
        failureClass: 'provider_error',
      })

      const artifactsResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/local-project-alpha/runs/${run.id}/artifacts`,
      })
      expect(artifactsResponse.statusCode).toBe(200)
      expect(artifactsResponse.json().artifacts).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'agent-invocation-scene-midnight-platform-run-001-003',
          kind: 'agent-invocation',
        }),
      ]))
      const writerArtifactResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/local-project-alpha/runs/${run.id}/artifacts/agent-invocation-scene-midnight-platform-run-001-003`,
      })
      expect(writerArtifactResponse.statusCode).toBe(200)
      expect(writerArtifactResponse.json()).toMatchObject({
        artifact: {
          id: 'agent-invocation-scene-midnight-platform-run-001-003',
          kind: 'agent-invocation',
          failureDetail: {
            failureClass: 'provider_error',
            provider: 'openai',
            modelId: 'gpt-5.4',
            retryable: true,
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
            modelId: 'gpt-5.4',
            provider: 'openai',
          },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
        modelProvider: 'openai',
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
