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

describe('fixture API server run recovery routes', () => {
  it('supports retry and cancel endpoints for scene runs', async () => {
    await withTestServer(async ({ app }) => {
      const startResponse = await app.inject({
        method: 'POST',
        url: '/api/projects/book-signal-arc/scenes/scene-midnight-platform/runs',
        payload: {
          mode: 'rewrite',
          note: 'Need a recovery pass.',
        },
      })
      expect(startResponse.statusCode).toBe(200)
      const startedRun = startResponse.json()

      const retryResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${startedRun.id}/retry`,
        payload: {
          mode: 'from-scratch',
        },
      })
      expect(retryResponse.statusCode).toBe(200)
      expect(retryResponse.json()).toMatchObject({
        id: 'run-scene-midnight-platform-003',
        retryOfRunId: startedRun.id,
        status: 'waiting_review',
      })

      const cancelResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${retryResponse.json().id}/cancel`,
        payload: {
          reason: 'Stop after duplicate submission.',
        },
      })
      expect(cancelResponse.statusCode).toBe(200)
      expect(cancelResponse.json()).toMatchObject({
        id: retryResponse.json().id,
        status: 'cancelled',
        failureClass: 'cancelled',
        failureMessage: 'Stop after duplicate submission.',
      })
    })
  })

  it('supports resuming a failed run when persisted recovery metadata exists', async () => {
    const seedStore = createRunFixtureStore()
    const seededRun = await seedStore.startSceneRun('book-signal-arc', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Original failed run.',
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
    const proposalSet = runState.artifacts?.find((artifact) => artifact.kind === 'proposal-set')
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
    if (proposalSet) {
      proposalSet.meta = {
        ...proposalSet.meta,
        usage: {
          inputTokens: 1420,
          outputTokens: 318,
          estimatedCostUsd: 0.0218,
          provider: 'openai',
          modelId: 'gpt-5.4',
        },
      }
    }
    runState.artifacts?.push({
      id: 'prose-draft-scene-midnight-platform-002',
      kind: 'prose-draft',
      runId: seededRun.id,
      sceneId: 'scene-midnight-platform',
      title: 'Prose draft',
      summary: 'Generated prose draft for the scene run.',
      status: 'generated',
      meta: {
        usage: {
          inputTokens: 1840,
          outputTokens: 0,
          estimatedCostUsd: 0.0264,
          provider: 'openai',
          modelId: 'gpt-5.4',
        },
        failureDetail: {
          failureClass: 'provider_error',
          message: 'Writer call failed before prose could be materialized.',
          provider: 'openai',
          modelId: 'gpt-5.4',
          retryable: true,
          sourceEventIds: [`run-event-${seededRun.id.replace(/^run-/, '')}-010`],
        },
      },
    })
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

      const failedProseArtifactResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${seededRun.id}/artifacts/prose-draft-scene-midnight-platform-002`,
      })
      expect(failedProseArtifactResponse.statusCode).toBe(200)
      expect(failedProseArtifactResponse.json()).toMatchObject({
        artifact: {
          id: 'prose-draft-scene-midnight-platform-002',
          usage: {
            inputTokens: 1840,
            outputTokens: 0,
            estimatedCostUsd: 0.0264,
            provider: 'openai',
            modelId: 'gpt-5.4',
          },
          failureDetail: {
            failureClass: 'provider_error',
            message: 'Writer call failed before prose could be materialized.',
            provider: 'openai',
            modelId: 'gpt-5.4',
            retryable: true,
            sourceEventIds: [`run-event-${seededRun.id.replace(/^run-/, '')}-010`],
          },
        },
      })

      const traceResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/book-signal-arc/runs/${seededRun.id}/trace`,
      })
      expect(traceResponse.statusCode).toBe(200)
      expect(traceResponse.json()).toMatchObject({
        runId: seededRun.id,
        isPartialFailure: true,
        summary: {
          proposalSetCount: 1,
          canonPatchCount: 0,
          proseDraftCount: 0,
        },
      })
      expect(traceResponse.json().nodes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'ctx-scene-midnight-platform-run-002',
            kind: 'context-packet',
          }),
          expect.objectContaining({
            id: 'agent-invocation-scene-midnight-platform-run-002-001',
            kind: 'agent-invocation',
          }),
          expect.objectContaining({
            id: 'proposal-set-scene-midnight-platform-run-002',
            kind: 'proposal-set',
          }),
        ]),
      )

      const resumeResponse = await app.inject({
        method: 'POST',
        url: `/api/projects/book-signal-arc/runs/${seededRun.id}/resume`,
      })

      expect(resumeResponse.statusCode).toBe(200)
      expect(resumeResponse.json()).toMatchObject({
        id: 'run-scene-midnight-platform-003',
        retryOfRunId: seededRun.id,
        resumableFromEventId: runState.run.resumableFromEventId,
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
