import { describe, expect, it } from 'vitest'

import { createRunFixtureStore } from './repositories/runFixtureStore.js'
import { withTestServer } from './test/support/test-server.js'

interface MutablePersistedRunState {
  run: {
    id: string
    status: string
    summary?: string
    failureClass?: string
    failureMessage?: string
    resumableFromEventId?: string
    pendingReviewId?: string
    startedAtLabel?: string
    completedAtLabel?: string
    latestEventId?: string
    eventCount?: number
  }
  events: Array<{
    id: string
    runId: string
    order: number
    kind: string
    label: string
    summary: string
    createdAtLabel: string
    severity?: 'info' | 'warning' | 'error'
    metadata?: Record<string, string | number | boolean | null>
  }>
  artifacts?: Array<{
    id: string
    kind: string
    runId?: string
    sceneId?: string
    title?: string
    summary?: string
    status?: string
    meta?: Record<string, unknown>
  }>
}

describe('fixture API server Wave 6 Gate D integration', () => {
  it('covers asset context privacy, review rewrite requests, branch adoption, and cancel or retry recovery without prose mutation', async () => {
    await withTestServer(async ({ app }) => {
      const contextRunResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Gate D asset context privacy check.',
        },
      })

      expect(contextRunResponse.statusCode).toBe(200)
      const contextRunId = contextRunResponse.json().id as string
      const contextPacketId = contextRunId.replace(/^run-/, 'ctx-').replace(/-(\d{3})$/, '-run-$1')

      const contextPacketResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${contextRunId}/artifacts/${contextPacketId}`,
      })

      expect(contextPacketResponse.statusCode).toBe(200)
      const contextPacketArtifact = contextPacketResponse.json().artifact

      expect(contextPacketArtifact.assetActivations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            assetId: 'asset-ren-voss',
            visibility: 'character-known',
          }),
        ]),
      )
      expect(contextPacketArtifact.excludedPrivateFacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: expect.objectContaining({
              en: 'Courier signal private key',
            }),
          }),
        ]),
      )
      expect(JSON.stringify(contextPacketArtifact)).not.toContain('current signal key')
      expect(JSON.stringify(contextPacketArtifact)).not.toContain('settle the bargain instantly')

      const reviewSnapshotResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-issue-snapshots',
      })

      expect(reviewSnapshotResponse.statusCode).toBe(200)
      expect(reviewSnapshotResponse.json().issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'continuity-conflict-ledger-public-proof',
            source: 'continuity',
            kind: 'continuity_conflict',
            sceneLocator: expect.objectContaining({
              sceneId: 'scene-midnight-platform',
            }),
          }),
        ]),
      )

      const rewriteRequestResponse = await app.inject({
        method: 'PUT',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions/continuity-conflict-ledger-public-proof',
        payload: {
          bookId: 'book-signal-arc',
          issueId: 'continuity-conflict-ledger-public-proof',
          issueSignature: 'continuity-conflict-ledger-public-proof::signature',
          sourceHandoffId: 'continuity-conflict-ledger-public-proof::scene-orchestrate',
          sourceHandoffLabel: 'Open scene orchestrate',
          targetScope: 'scene',
          status: 'rewrite_requested',
          note: 'Need a rewrite before the next continuity pass.',
          rewriteRequestNote: 'Rewrite Midnight Platform so the ledger proof stays withheld.',
          rewriteTargetSceneId: 'scene-midnight-platform',
          rewriteRequestId: 'rewrite-request-continuity-ledger-public-proof',
        },
      })

      expect(rewriteRequestResponse.statusCode).toBe(200)
      expect(rewriteRequestResponse.json()).toMatchObject({
        status: 'rewrite_requested',
        rewriteTargetSceneId: 'scene-midnight-platform',
        rewriteRequestId: 'rewrite-request-continuity-ledger-public-proof',
      })

      const fixActionListResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/review-fix-actions',
      })

      expect(fixActionListResponse.statusCode).toBe(200)
      expect(fixActionListResponse.json()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            issueId: 'continuity-conflict-ledger-public-proof',
            status: 'rewrite_requested',
            rewriteRequestNote: 'Rewrite Midnight Platform so the ledger proof stays withheld.',
          }),
        ]),
      )

      const checkpointResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/manuscript-checkpoints',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Gate D checkpoint',
          summary: 'Checkpoint captured before branch trial adoption.',
          sourceSignature: 'draft-assembly:book-signal-arc:selected:chapter-signals-in-rain',
          selectedChapterId: 'chapter-signals-in-rain',
        },
      })

      expect(checkpointResponse.statusCode).toBe(200)
      const checkpointId = checkpointResponse.json().checkpointId as string

      const branchResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches',
        payload: {
          bookId: 'book-signal-arc',
          title: 'Gate D branch',
          summary: 'Checkpoint-based experiment branch for Gate D coverage.',
          rationale: 'Validate checkpoint to branch to selective adoption flow.',
          basedOnCheckpointId: checkpointId,
          selectedChapterId: 'chapter-signals-in-rain',
        },
      })

      expect(branchResponse.statusCode).toBe(200)
      const branchId = branchResponse.json().branchId as string

      const adoptionResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/books/book-signal-arc/experiment-branches/${branchId}/adoptions`,
        payload: {
          bookId: 'book-signal-arc',
          branchId,
          chapterId: 'chapter-signals-in-rain',
          sceneId: 'scene-midnight-platform',
          kind: 'prose_draft',
          summary: 'Record the alternate prose draft for selective adoption review.',
          sourceSignature: `branch:${branchId}:scene-midnight-platform:prose-draft`,
        },
      })

      expect(adoptionResponse.statusCode).toBe(200)
      expect(adoptionResponse.json()).toMatchObject({
        branchId,
        chapterId: 'chapter-signals-in-rain',
        sceneId: 'scene-midnight-platform',
        kind: 'prose_draft',
        status: 'adopted',
      })

      const acceptedRunResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Generate an accepted prose baseline before recovery checks.',
        },
      })

      expect(acceptedRunResponse.statusCode).toBe(200)
      const acceptedRun = acceptedRunResponse.json()

      const acceptReviewResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${acceptedRun.id}/review-decisions`,
        payload: {
          reviewId: acceptedRun.pendingReviewId,
          decision: 'accept',
        },
      })

      expect(acceptReviewResponse.statusCode).toBe(200)

      const proseBeforeRecoveryResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })

      expect(proseBeforeRecoveryResponse.statusCode).toBe(200)
      expect(proseBeforeRecoveryResponse.json()).toMatchObject({
        proseDraft: expect.stringContaining('Midnight Platform opens from the accepted run artifact'),
        statusLabel: 'Generated',
      })
      const acceptedProseDraft = proseBeforeRecoveryResponse.json().proseDraft as string

      const recoveryRunResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Recovery validation run.',
        },
      })

      expect(recoveryRunResponse.statusCode).toBe(200)
      const recoveryRunId = recoveryRunResponse.json().id as string

      const cancelResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${recoveryRunId}/cancel`,
        payload: {
          reason: 'Gate D cancellation check.',
        },
      })

      expect(cancelResponse.statusCode).toBe(200)
      expect(cancelResponse.json()).toMatchObject({
        id: recoveryRunId,
        status: 'cancelled',
        failureClass: 'cancelled',
        failureMessage: 'Gate D cancellation check.',
      })

      const retryResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${recoveryRunId}/retry`,
        payload: {
          mode: 'rewrite',
        },
      })

      expect(retryResponse.statusCode).toBe(200)
      expect(retryResponse.json()).toMatchObject({
        retryOfRunId: recoveryRunId,
        status: 'waiting_review',
      })
      expect(retryResponse.json().id).not.toBe(recoveryRunId)

      const proseAfterRecoveryResponse = await app.inject({
        method: 'GET',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/prose',
      })

      expect(proseAfterRecoveryResponse.statusCode).toBe(200)
      expect(proseAfterRecoveryResponse.json().proseDraft).toBe(acceptedProseDraft)
    })
  })

  it('exposes cost and failure detail from failed run artifacts', async () => {
    const seedStore = createRunFixtureStore()
    const seededRun = await seedStore.startSceneRun('book-signal-arc', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Gate D failed artifact detail seed.',
    })
    const persistedState = seedStore.exportProjectState('book-signal-arc')! as unknown as {
      runStates: MutablePersistedRunState[]
      sceneSequences: Record<string, number>
    }
    const runState = persistedState.runStates.find((entry) => entry.run.id === seededRun.id)!
    runState.run.status = 'failed'
    runState.run.summary = 'Run failed after provider timeout.'
    runState.run.failureClass = 'model_timeout'
    runState.run.failureMessage = 'Provider timed out after the planner invocation.'
    runState.run.resumableFromEventId = runState.run.latestEventId
    runState.run.completedAtLabel = runState.run.startedAtLabel
    runState.run.pendingReviewId = undefined
    runState.events.push({
      id: `run-event-${seededRun.id.replace(/^run-/, '')}-010`,
      runId: seededRun.id,
      order: 10,
      kind: 'run_failed',
      label: 'Run failed',
      summary: 'Provider timed out after the planner invocation.',
      createdAtLabel: '2026-04-23 10:10',
      severity: 'error',
      metadata: {
        failureClass: 'model_timeout',
      },
    })
    const plannerInvocation = runState.artifacts?.find((artifact) => artifact.kind === 'agent-invocation')
    if (plannerInvocation) {
      plannerInvocation.meta = {
        ...plannerInvocation.meta,
        usage: {
          inputTokens: 1420,
          outputTokens: 318,
          estimatedCostUsd: 0.0218,
          provider: 'openai',
          modelId: 'gpt-5.4',
        },
        failureDetail: {
          failureClass: 'model_timeout',
          message: 'Provider timed out after the planner invocation.',
          provider: 'openai',
          modelId: 'gpt-5.4',
          retryable: true,
          sourceEventIds: [`run-event-${seededRun.id.replace(/^run-/, '')}-010`],
        },
      }
    }
    runState.run.latestEventId = runState.events.at(-1)!.id
    runState.run.eventCount = runState.events.length

    await withTestServer(async ({ app }) => {
      const artifactDetailResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${seededRun.id}/artifacts/agent-invocation-scene-midnight-platform-run-002-001`,
      })

      expect(artifactDetailResponse.statusCode).toBe(200)
      expect(artifactDetailResponse.json()).toMatchObject({
        artifact: {
          id: 'agent-invocation-scene-midnight-platform-run-002-001',
          usage: {
            inputTokens: 1420,
            outputTokens: 318,
            estimatedCostUsd: 0.0218,
            provider: 'openai',
            modelId: 'gpt-5.4',
          },
          failureDetail: {
            failureClass: 'model_timeout',
            message: 'Provider timed out after the planner invocation.',
            provider: 'openai',
            modelId: 'gpt-5.4',
            retryable: true,
            sourceEventIds: [`run-event-${seededRun.id.replace(/^run-/, '')}-010`],
          },
        },
      })
    }, {
      projectStatePersistence: {
        async load() {
          return {
            schemaVersion: 1,
            seedVersion: 'test-seed',
            projects: {
              'book-signal-arc': {
                updatedAt: '2026-04-28T10:00:00.000Z',
                runStore: persistedState as unknown as import('./repositories/project-state-persistence.js').PersistedRunStore,
              },
            },
          }
        },
        async saveProjectOverlay() {},
        async clearProjectOverlay() {},
      },
    })
  })
})
