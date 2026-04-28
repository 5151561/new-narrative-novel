import { describe, expect, it, vi } from 'vitest'

import type {
  ContextPacketArtifactDetailRecord,
  RunContextAssetActivationRecord,
} from '../contracts/api-records.js'
import { buildSceneContextPacket } from '../orchestration/contextBuilder/sceneContextBuilder.js'
import {
  ModelGatewayExecutionError,
  ModelGatewayMissingConfigError,
} from '../orchestration/modelGateway/modelGatewayErrors.js'
import { createRunFixtureStore } from './runFixtureStore.js'
import { createFixtureDataSnapshot } from './fixture-data.js'
import { createTestServer } from '../test/support/test-server.js'

interface MutablePersistedRunState {
  run: {
    id: string
    status: string
    summary?: string
    failureClass?: string
    failureMessage?: string
    resumableFromEventId?: string
    pendingReviewId?: string
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

describe('runFixtureStore', () => {
  function createProjectContextPacketBuilder() {
    const snapshot = createFixtureDataSnapshot('http://127.0.0.1:4174/api')

    return ({ projectId, sceneId, sequence }: { projectId: string; sceneId: string; sequence: number }) =>
      buildSceneContextPacket({
        project: snapshot.projects[projectId] ?? snapshot.projects['book-signal-arc']!,
        sceneId,
        sequence,
      })
  }

  function createProjectContextPacketBuilderWithExtraCounts() {
    const buildPacket = createProjectContextPacketBuilder()

    return (input: { projectId: string; sceneId: string; sequence: number }) => {
      const packet = buildPacket(input)

      return {
        ...packet,
        assetActivations: [
          ...packet.assetActivations,
          {
            id: `${packet.packetId}-activation-extra-excluded`,
            assetId: 'asset-extra-excluded',
            assetTitle: { en: 'Extra excluded', 'zh-CN': '额外排除项' },
            assetKind: 'lore' as const,
            decision: 'excluded' as const,
            reasonKind: 'rule-dependency' as const,
            reasonLabel: { en: 'Extra excluded lore', 'zh-CN': '额外排除 lore' },
            visibility: 'spoiler' as const,
            budget: 'summary-only' as const,
            targetAgents: ['scene-manager'],
          } satisfies RunContextAssetActivationRecord,
          {
            id: `${packet.packetId}-activation-extra-redacted`,
            assetId: 'asset-extra-redacted',
            assetTitle: { en: 'Extra redacted', 'zh-CN': '额外遮蔽项' },
            assetKind: 'lore' as const,
            decision: 'redacted' as const,
            reasonKind: 'review-issue' as const,
            reasonLabel: { en: 'Extra redacted lore', 'zh-CN': '额外遮蔽 lore' },
            visibility: 'editor-only' as const,
            budget: 'summary-only' as const,
            targetAgents: ['continuity-reviewer'],
          } satisfies RunContextAssetActivationRecord,
        ],
        activationSummary: {
          ...packet.activationSummary,
          excludedAssetCount: packet.activationSummary.excludedAssetCount + 1,
          redactedAssetCount: packet.activationSummary.redactedAssetCount + 1,
        },
      }
    }
  }

  function createPlannerResult(overrides?: Partial<{
    provider: 'fixture' | 'openai-compatible'
    modelId: string
    projectMode: 'demo-fixture' | 'real-project'
    fallbackUsed: boolean
    fallbackReason: 'missing-config' | 'provider-error' | 'invalid-output'
    proposals: Array<{
      title: string
      summary: string
      changeKind: 'action' | 'reveal' | 'state-change' | 'continuity-note'
      riskLabel: string
      variants?: Array<{
        label: string
        summary: string
        rationale: string
        tradeoffLabel?: string
        riskLabel?: string
      }>
    }>
  }>) {
    return {
      output: {
        proposals: overrides?.proposals ?? [
          {
            title: 'Hold on the departure bell',
            summary: 'Delay the reveal until the platform bell has landed.',
            changeKind: 'action' as const,
            riskLabel: 'Editor check recommended',
            variants: [
              {
                label: 'Wide bell',
                summary: 'Stay wide on the bell before focusing on Ren.',
                rationale: 'Preserves staging before the reveal tightens.',
              },
              {
                label: 'Hard cut',
                summary: 'Cut directly to Ren when the bell hits.',
                rationale: 'Makes the scene feel more urgent.',
                tradeoffLabel: 'Faster escalation',
              },
            ],
          },
        ],
      },
      provenance: {
        fallbackUsed: overrides?.fallbackUsed ?? false,
        provider: overrides?.provider ?? 'openai-compatible',
        modelId: overrides?.modelId ?? 'gpt-5.4',
        projectMode: overrides?.projectMode ?? 'real-project',
        ...((overrides?.provider ?? 'openai-compatible') === 'openai-compatible'
          ? {
              providerId: 'openai-default',
              providerLabel: 'OpenAI',
            }
          : {}),
        ...(overrides?.fallbackReason ? { fallbackReason: overrides.fallbackReason } : {}),
      },
    }
  }

  function listAllEventPages(
    store: ReturnType<typeof createRunFixtureStore>,
    projectId: string,
    runId: string,
  ) {
    const events = [] as ReturnType<typeof store.getRunEvents>['events']
    let cursor: string | undefined

    while (true) {
      const page = store.getRunEvents(projectId, { runId, cursor })
      events.push(...page.events)
      if (!page.nextCursor) {
        return events
      }

      cursor = page.nextCursor
    }
  }

  function findPersistedRunState(
    store: ReturnType<typeof createRunFixtureStore>,
    projectId: string,
    runId: string,
  ) {
    const snapshot = store.exportProjectState(projectId) as
      | {
          runStates: Array<{
            run: { id: string }
            artifacts: Array<{ kind: string; id: string; meta?: Record<string, unknown> }>
          }>
        }
      | undefined

    expect(snapshot).toBeTruthy()
    const runState = snapshot?.runStates.find((candidate) => candidate.run.id === runId)
    expect(runState).toBeTruthy()
    return runState!
  }

  it('allocates distinct scene sequences for concurrent start requests before planner generation resolves', async () => {
    let resolveFirst: ((value: ReturnType<typeof createPlannerResult>) => void) | undefined
    let resolveSecond: ((value: ReturnType<typeof createPlannerResult>) => void) | undefined
    const firstPlanner = new Promise<ReturnType<typeof createPlannerResult>>((resolve) => {
      resolveFirst = resolve
    })
    const secondPlanner = new Promise<ReturnType<typeof createPlannerResult>>((resolve) => {
      resolveSecond = resolve
    })
    const generate = vi.fn()
      .mockImplementationOnce(() => firstPlanner)
      .mockImplementationOnce(() => secondPlanner)
    const store = createRunFixtureStore({
      scenePlannerGateway: { generate },
    })

    const startOne = store.startSceneRun('project-concurrent', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    const startTwo = store.startSceneRun('project-concurrent', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    resolveSecond?.(createPlannerResult({
      proposals: [
        {
          title: 'Second planner result',
          summary: 'Resolve the second request first.',
          changeKind: 'action',
          riskLabel: 'Low continuity risk',
        },
      ],
    }))
    resolveFirst?.(createPlannerResult({
      proposals: [
        {
          title: 'First planner result',
          summary: 'Resolve the first request second.',
          changeKind: 'action',
          riskLabel: 'Low continuity risk',
        },
      ],
    }))

    const [runOne, runTwo] = await Promise.all([startOne, startTwo])

    expect(runOne.id).toBe('run-scene-midnight-platform-001')
    expect(runTwo.id).toBe('run-scene-midnight-platform-002')
    expect(runOne.id).not.toBe(runTwo.id)
    expect(store.getRun('project-concurrent', runOne.id)).toMatchObject({ id: runOne.id })
    expect(store.getRun('project-concurrent', runTwo.id)).toMatchObject({ id: runTwo.id })
  })

  it('blocks real-model start when planner config is missing instead of creating a fixture-looking run', async () => {
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockRejectedValue(new ModelGatewayMissingConfigError({
          provider: 'openai-compatible',
          projectMode: 'real-project',
          role: 'planner',
        })),
      },
    })

    await expect(store.startSceneRun('project-missing-config', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })).rejects.toMatchObject({
      code: 'RUN_MODEL_CONFIG_REQUIRED',
      status: 400,
    })

    expect(store.exportProjectState('project-missing-config')).toEqual({
      runStates: [],
      sceneSequences: {
        'scene-midnight-platform': 0,
      },
    })
  })

  it('records a failed run with honest openai-compatible provenance when planner execution fails after a real-model attempt', async () => {
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockRejectedValue(new ModelGatewayExecutionError({
          failureClass: 'provider_error',
          fallbackUsed: false,
          message: 'OpenAI provider request failed.',
          modelId: 'gpt-5.4',
          provider: 'openai-compatible',
          projectMode: 'real-project',
          retryable: true,
          role: 'planner',
        })),
      },
    })

    const run = await store.startSceneRun('project-provider-error', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    expect(run).toMatchObject({
      id: 'run-scene-midnight-platform-001',
      status: 'failed',
      failureClass: 'provider_error',
      summary: 'Scene run failed before review because the planner model request failed.',
      usage: {
        provider: 'openai-compatible',
        modelId: 'gpt-5.4',
        projectMode: 'real-project',
        fallbackUsed: false,
      },
      runtimeSummary: {
        health: 'failed',
        failureClassLabel: 'Provider error',
      },
    })
    expect(listAllEventPages(store, 'project-provider-error', run.id).map((event) => event.kind)).toContain('run_failed')
  })

  it('preserves demo-fixture projectMode in failed run usage when a demo path provider attempt fails', async () => {
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockRejectedValue(new ModelGatewayExecutionError({
          failureClass: 'provider_error',
          fallbackUsed: false,
          message: 'Configured provider request failed.',
          modelId: 'demo-planner-model',
          provider: 'openai-compatible',
          projectMode: 'demo-fixture',
          retryable: true,
          role: 'planner',
        })),
      },
    })

    const run = await store.startSceneRun('project-demo-provider-error', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    expect(run.usage).toMatchObject({
      provider: 'openai-compatible',
      modelId: 'demo-planner-model',
      projectMode: 'demo-fixture',
      fallbackUsed: false,
    })
  })

  it('replays events after an optional cursor and then tails later review-transition publications without changing event records', async () => {
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockResolvedValue(createPlannerResult()),
      },
    })

    const run = await store.startSceneRun('project-stream-replay', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Replay from cursor and then tail.',
    })
    const firstPage = store.getRunEvents('project-stream-replay', { runId: run.id })
    const secondPage = store.getRunEvents('project-stream-replay', {
      runId: run.id,
      cursor: firstPage.nextCursor,
    })
    const finalPreReviewPage = store.getRunEvents('project-stream-replay', {
      runId: run.id,
      cursor: secondPage.nextCursor,
    })
    const iterator = store.streamRunEvents('project-stream-replay', {
      runId: run.id,
      cursor: firstPage.nextCursor,
    })[Symbol.asyncIterator]()

    await expect(iterator.next()).resolves.toEqual({
      done: false,
      value: {
        runId: run.id,
        events: [...secondPage.events, ...finalPreReviewPage.events],
      },
    })

    const tailPromise = iterator.next()
    const completedRun = await store.submitRunReviewDecision('project-stream-replay', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
      note: 'Ship it.',
    })
    const postReviewPage = store.getRunEvents('project-stream-replay', {
      runId: completedRun.id,
      cursor: finalPreReviewPage.events.at(-1)?.id,
    })

    await expect(tailPromise).resolves.toEqual({
      done: false,
      value: {
        runId: run.id,
        events: postReviewPage.events,
      },
    })
    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    })
  })

  it('tails stream events again after clearProject when a later run reuses the same run id', async () => {
    const projectId = 'project-stream-reuse'
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockResolvedValue(createPlannerResult()),
      },
    })

    const firstRun = await store.startSceneRun(projectId, {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'First pass before reset.',
    })
    expect(firstRun.id).toBe('run-scene-midnight-platform-001')
    await store.submitRunReviewDecision(projectId, {
      runId: firstRun.id,
      reviewId: firstRun.pendingReviewId!,
      decision: 'accept',
    })

    store.clearProject(projectId)

    const secondRun = await store.startSceneRun(projectId, {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Second pass after reset.',
    })
    expect(secondRun.id).toBe(firstRun.id)

    const iterator = store.streamRunEvents(projectId, {
      runId: secondRun.id,
      cursor: secondRun.latestEventId,
    })[Symbol.asyncIterator]()
    const tailPromise = iterator.next()

    await store.submitRunReviewDecision(projectId, {
      runId: secondRun.id,
      reviewId: secondRun.pendingReviewId!,
      decision: 'accept',
    })
    const postReviewPage = store.getRunEvents(projectId, {
      runId: secondRun.id,
      cursor: secondRun.latestEventId,
    })

    await expect(tailPromise).resolves.toEqual({
      done: false,
      value: {
        runId: secondRun.id,
        events: postReviewPage.events,
      },
    })
    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    })
  })

  it('creates a follow-up run on retry and records the source linkage without mutating canon or prose', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-retry-run', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'First pass.',
    })

    const retriedRun = await store.retryRun('project-retry-run', {
      runId: run.id,
      mode: 'from-scratch',
    })

    expect(retriedRun).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      retryOfRunId: run.id,
      status: 'waiting_review',
    })
    expect(store.getRun('project-retry-run', run.id)).toMatchObject({
      id: run.id,
      status: 'waiting_review',
      latestEventId: 'run-event-scene-midnight-platform-001-010',
      eventCount: 10,
    })
    expect(listAllEventPages(store, 'project-retry-run', run.id).at(-1)).toMatchObject({
      kind: 'run_retry_scheduled',
      summary: 'Retry scheduled in from-scratch mode as run-scene-midnight-platform-002.',
    })
  })

  it('cancels an active run, publishes cancellation events, and closes the stream', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-cancel-run', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    const iterator = store.streamRunEvents('project-cancel-run', {
      runId: run.id,
      cursor: run.latestEventId,
    })[Symbol.asyncIterator]()
    const tailPromise = iterator.next()

    const cancelledRun = await store.cancelRun('project-cancel-run', {
      runId: run.id,
      reason: 'Operator stopped the run.',
    })

    expect(cancelledRun).toMatchObject({
      id: run.id,
      status: 'cancelled',
      failureClass: 'cancelled',
      failureMessage: 'Operator stopped the run.',
      cancelRequestedAtLabel: '2026-04-23 10:10',
      completedAtLabel: '2026-04-23 10:11',
    })
    await expect(tailPromise).resolves.toEqual({
      done: false,
      value: {
        runId: run.id,
        events: [
          expect.objectContaining({ kind: 'run_cancel_requested' }),
          expect.objectContaining({ kind: 'run_cancelled' }),
        ],
      },
    })
    await expect(iterator.next()).resolves.toEqual({
      done: true,
      value: undefined,
    })
  })

  it('resumes a failed run from its resumable event into a new active run id', async () => {
    const store = createRunFixtureStore()
    const seededRun = await store.startSceneRun('project-resume-run', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    const snapshot = store.exportProjectState('project-resume-run')! as unknown as {
      runStates: MutablePersistedRunState[]
      sceneSequences: Record<string, number>
    }
    const persistedRunState = snapshot.runStates.find((entry) => entry.run.id === seededRun.id)!
    persistedRunState.run.status = 'failed'
    persistedRunState.run.summary = 'Run failed after a provider timeout.'
    persistedRunState.run.failureClass = 'model_timeout'
    persistedRunState.run.failureMessage = 'Planner call timed out.'
    persistedRunState.run.resumableFromEventId = persistedRunState.run.latestEventId
    persistedRunState.run.pendingReviewId = undefined
    persistedRunState.run.completedAtLabel = '2026-04-23 10:10'
    persistedRunState.events.push({
      id: 'run-event-scene-midnight-platform-001-010',
      runId: seededRun.id,
      order: 10,
      kind: 'run_failed',
      label: 'Run failed',
      summary: 'Planner call timed out.',
      createdAtLabel: '2026-04-23 10:10',
      severity: 'error',
      metadata: {
        failureClass: 'model_timeout',
      },
    })
    persistedRunState.run.latestEventId = 'run-event-scene-midnight-platform-001-010'
    persistedRunState.run.eventCount = 10
    store.hydrateProjectState('project-resume-run', snapshot as unknown as import('./project-state-persistence.js').PersistedRunStore)

    const resumedRun = await store.resumeRun('project-resume-run', {
      runId: seededRun.id,
    })

    expect(resumedRun).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      retryOfRunId: seededRun.id,
      resumableFromEventId: 'run-event-scene-midnight-platform-001-009',
      latestEventId: 'run-event-scene-midnight-platform-002-010',
      eventCount: 10,
    })
    expect(listAllEventPages(store, 'project-resume-run', resumedRun.id).at(-1)).toMatchObject({
      kind: 'run_resumed',
      summary: 'Run resumed from run-scene-midnight-platform-001 at event run-event-scene-midnight-platform-001-009.',
    })
  })

  it('exports and hydrates a completed non-fixture project run with event pages and artifacts intact', async () => {
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockResolvedValue(createPlannerResult()),
      },
    })

    const run = await store.startSceneRun('local-project-alpha', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Hydrate this local project run after restart.',
    })
    const completedRun = await store.submitRunReviewDecision('local-project-alpha', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
    })
    const eventsBeforeHydration = listAllEventPages(store, 'local-project-alpha', completedRun.id)
    const artifactsBeforeHydration = store.listRunArtifacts('local-project-alpha', completedRun.id)
    const proseArtifactBeforeHydration = store.getRunArtifact(
      'local-project-alpha',
      completedRun.id,
      'prose-draft-scene-midnight-platform-001',
    )
    const traceBeforeHydration = store.getRunTrace('local-project-alpha', completedRun.id)

    const exportedState = store.exportProjectState('local-project-alpha')
    expect(exportedState).toBeTruthy()

    const hydratedStore = createRunFixtureStore()
    hydratedStore.hydrateProjectState('local-project-alpha', exportedState!)

    expect(hydratedStore.getRun('local-project-alpha', completedRun.id)).toMatchObject({
      id: completedRun.id,
      status: 'completed',
      latestEventId: completedRun.latestEventId,
      eventCount: completedRun.eventCount,
    })

    const hydratedEvents = listAllEventPages(hydratedStore, 'local-project-alpha', completedRun.id)
    expect(hydratedEvents).toEqual(eventsBeforeHydration)

    const hydratedArtifacts = hydratedStore.listRunArtifacts('local-project-alpha', completedRun.id)
    expect(hydratedArtifacts).toEqual(artifactsBeforeHydration)
    expect(hydratedStore.getRunArtifact('local-project-alpha', completedRun.id, 'prose-draft-scene-midnight-platform-001')).toEqual(
      proseArtifactBeforeHydration,
    )
    expect(hydratedStore.getRunTrace('local-project-alpha', completedRun.id)).toEqual(traceBeforeHydration)

    const streamIterator = hydratedStore.streamRunEvents('local-project-alpha', {
      runId: completedRun.id,
      cursor: completedRun.latestEventId,
    })[Symbol.asyncIterator]()
    await expect(streamIterator.next()).resolves.toEqual({ done: true, value: undefined })
  })

  it('rehydrates a waiting-review run without promoting it to completed truth', async () => {
    const store = createRunFixtureStore()
    const projectId = 'project-waiting-review'
    const run = await store.startSceneRun(projectId, {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Persist waiting review.',
    })

    const snapshot = store.exportProjectState(projectId)
    expect(snapshot).toBeTruthy()

    const hydrated = createRunFixtureStore()
    hydrated.clearProject(projectId)
    hydrated.hydrateProjectState(projectId, snapshot!)

    expect(hydrated.getRun(projectId, run.id)).toMatchObject({
      id: run.id,
      status: 'waiting_review',
      pendingReviewId: run.pendingReviewId,
    })
    expect(hydrated.getRunTrace(projectId, run.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
  })

  it('rehydrates a failed resumable run with artifacts and trace still readable', async () => {
    const store = createRunFixtureStore()
    const projectId = 'project-failed-recovery'
    const seededRun = await store.startSceneRun(projectId, {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Persist failed recovery.',
    })
    const snapshot = store.exportProjectState(projectId)! as unknown as {
      runStates: MutablePersistedRunState[]
      sceneSequences: Record<string, number>
    }
    const runState = snapshot.runStates.find((entry) => entry.run.id === seededRun.id)!
    runState.run.status = 'failed'
    runState.run.summary = 'Run failed after provider timeout.'
    runState.run.failureClass = 'model_timeout'
    runState.run.failureMessage = 'Provider timed out after the planner invocation.'
    runState.run.resumableFromEventId = runState.run.latestEventId
    runState.run.pendingReviewId = undefined

    const failureEventId = `run-event-${seededRun.id.replace(/^run-/, '')}-010`
    runState.events.push({
      id: failureEventId,
      runId: seededRun.id,
      order: 10,
      kind: 'run_failed',
      label: 'Run failed',
      summary: 'Provider timed out after the planner invocation.',
      createdAtLabel: '2026-04-28 10:10',
      severity: 'error',
      metadata: { failureClass: 'model_timeout' },
    })
    const plannerInvocation = runState.artifacts?.find((artifact) => artifact.kind === 'agent-invocation')
    if (plannerInvocation) {
      plannerInvocation.meta = {
        ...plannerInvocation.meta,
        failureDetail: {
          failureClass: 'model_timeout',
          message: 'Provider timed out after the planner invocation.',
          provider: 'openai-compatible',
          modelId: 'gpt-5.4',
          retryable: true,
          sourceEventIds: [failureEventId],
        },
      }
    }
    runState.run.latestEventId = failureEventId
    runState.run.eventCount = runState.events.length

    const hydrated = createRunFixtureStore()
    hydrated.clearProject(projectId)
    hydrated.hydrateProjectState(projectId, snapshot as unknown as import('./project-state-persistence.js').PersistedRunStore)

    const plannerInvocationId = runState.artifacts?.find((artifact) => artifact.kind === 'agent-invocation')?.id
    expect(hydrated.getRun(projectId, seededRun.id)).toMatchObject({
      id: seededRun.id,
      status: 'failed',
      resumableFromEventId: runState.run.resumableFromEventId,
    })
    expect(plannerInvocationId && hydrated.getRunArtifact(projectId, seededRun.id, plannerInvocationId)).toMatchObject({
      id: plannerInvocationId,
      failureDetail: {
        failureClass: 'model_timeout',
        retryable: true,
      },
    })
    expect(hydrated.getRunTrace(projectId, seededRun.id)).toMatchObject({
      runId: seededRun.id,
      isPartialFailure: true,
      summary: {
        proposalSetCount: 1,
        canonPatchCount: 0,
        proseDraftCount: 0,
        missingTraceCount: 0,
      },
    })
  })

  it('awaits planner gateway output and persists canonical planner metadata before artifact details are derived', async () => {
    const generate = vi.fn().mockResolvedValue(createPlannerResult())
    const store = createRunFixtureStore({
      buildSceneContextPacket: createProjectContextPacketBuilder(),
      scenePlannerGateway: {
        generate,
      },
    })

    const runPromise = store.startSceneRun('project-artifacts', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    expect(runPromise).toBeInstanceOf(Promise)

    const run = await runPromise
    expect(generate).toHaveBeenCalledWith({
      sceneId: 'scene-midnight-platform',
      instructions: 'Return scene-planning proposals only.',
      input: expect.stringContaining('Context packet ctx-scene-midnight-platform-run-001.'),
    })

    const runState = findPersistedRunState(store, 'project-artifacts', run.id)
    expect(runState.artifacts.find((artifact) => artifact.id === 'ctx-scene-midnight-platform-run-001')).toMatchObject({
      meta: {
        contextPacket: {
          version: 'scene-context-v1',
          packetId: 'ctx-scene-midnight-platform-run-001',
          narrative: {
            sceneObjective: {
              en: 'Lock the bargain before the witness can turn the ledger into public leverage.',
            },
          },
        },
      },
    })
    expect(runState.artifacts.find((artifact) => artifact.id === 'agent-invocation-scene-midnight-platform-run-001-001')).toMatchObject({
      meta: {
        role: 'planner',
        index: 1,
        provenance: {
          provider: 'openai-compatible',
          modelId: 'gpt-5.4',
        },
      },
    })
    expect(runState.artifacts.find((artifact) => artifact.id === 'proposal-set-scene-midnight-platform-run-001')).toMatchObject({
      meta: {
        proposals: [
          {
            id: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
            title: 'Hold on the departure bell',
            variants: [
              {
                id: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-001',
                label: 'Wide bell',
              },
              {
                id: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-002',
                label: 'Hard cut',
                tradeoffLabel: 'Faster escalation',
              },
            ],
          },
        ],
      },
    })
    expect(JSON.stringify(runState)).not.toContain('Return scene-planning proposals only.')
  })

  it('derives context packet detail from injected project truth instead of default placeholder copy', async () => {
    const store = createRunFixtureStore({
      buildSceneContextPacket: createProjectContextPacketBuilder(),
    })

    const run = await store.startSceneRun('book-signal-arc', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Use the live fixture truth.',
    })

    const contextPacket = store.getRunArtifact('book-signal-arc', run.id, 'ctx-scene-midnight-platform-run-002')
    expect(contextPacket).toMatchObject({
      kind: 'context-packet',
    })
    expect(contextPacket?.kind).toBe('context-packet')
    const contextPacketDetail = contextPacket as ContextPacketArtifactDetailRecord
    expect(contextPacketDetail.sections).toEqual(expect.arrayContaining([
      expect.objectContaining({
        title: expect.objectContaining({
          en: 'Narrative brief',
        }),
      }),
    ]))
    expect(contextPacketDetail.includedCanonFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.objectContaining({
          en: 'Scene objective',
        }),
        value: expect.objectContaining({
          en: 'Lock the bargain before the witness can turn the ledger into public leverage.',
        }),
      }),
      expect.objectContaining({
        label: expect.objectContaining({
          en: 'Ledger remains closed',
        }),
      }),
    ]))
    expect(contextPacketDetail.excludedPrivateFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.objectContaining({
          en: 'Courier signal private key',
        }),
      }),
    ]))
  })

  it('publishes context packet event metadata from packet-derived activation counts during startSceneRun', async () => {
    const store = createRunFixtureStore({
      buildSceneContextPacket: createProjectContextPacketBuilderWithExtraCounts(),
    })

    const run = await store.startSceneRun('book-signal-arc', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const allEvents = listAllEventPages(store, 'book-signal-arc', run.id)
    expect(allEvents.find((event) => event.kind === 'context_packet_built')).toMatchObject({
      metadata: {
        includedAssetCount: 6,
        excludedAssetCount: 1,
        redactedAssetCount: 2,
      },
    })
    expect(store.getRunArtifact('book-signal-arc', run.id, 'ctx-scene-midnight-platform-run-002')).toMatchObject({
      kind: 'context-packet',
      activationSummary: {
        includedAssetCount: 6,
        excludedAssetCount: 1,
        redactedAssetCount: 2,
      },
    })
  })

  it('surfaces stored non-default planner proposals and provenance through getRunArtifact', async () => {
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockResolvedValue(createPlannerResult({
          proposals: [
            {
              title: 'Open with the station alarm',
              summary: 'Lead with the alarm before Ren enters the frame.',
              changeKind: 'action',
              riskLabel: 'Editor check recommended',
              variants: [
                {
                  label: 'Alarm-wide',
                  summary: 'Stay wide on the station alarm beat.',
                  rationale: 'Lets the reveal breathe before character focus.',
                },
                {
                  label: 'Ren-cut',
                  summary: 'Cut directly to Ren on the alarm hit.',
                  rationale: 'Makes the entrance feel abrupt and urgent.',
                  tradeoffLabel: 'Sharper cut',
                  riskLabel: 'Higher continuity risk',
                },
              ],
            },
            {
              title: 'Thread the ledger rumor',
              summary: 'Carry the rumor through ambient station detail.',
              changeKind: 'reveal',
              riskLabel: 'Continuity review required',
            },
          ],
        })),
      },
    })

    const run = await store.startSceneRun('project-custom-readback', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    const proposalSet = store.getRunArtifact('project-custom-readback', run.id, 'proposal-set-scene-midnight-platform-run-001')
    const plannerInvocation = store.getRunArtifact(
      'project-custom-readback',
      run.id,
      'agent-invocation-scene-midnight-platform-run-001-001',
    )

    expect(proposalSet?.kind).toBe('proposal-set')
    if (proposalSet?.kind !== 'proposal-set') {
      throw new Error('expected proposal-set detail')
    }

    expect(proposalSet.proposals[0]).toMatchObject({
      id: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
      title: {
        en: 'Open with the station alarm',
      },
      summary: {
        en: 'Lead with the alarm before Ren enters the frame.',
      },
      defaultVariantId: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-001',
    })
    expect(proposalSet.proposals[0]?.variants?.map((variant) => variant.id)).toEqual([
      'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-001',
      'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-002',
    ])
    expect(proposalSet.proposals[0]?.variants?.map((variant) => variant.label.en)).toEqual([
      'Alarm-wide',
      'Ren-cut',
    ])
    expect(proposalSet.proposals[1]).toMatchObject({
      id: 'proposal-set-scene-midnight-platform-run-001-proposal-002',
      title: {
        en: 'Thread the ledger rumor',
      },
    })
    expect(plannerInvocation).toMatchObject({
      kind: 'agent-invocation',
      provenance: {
        provider: 'openai-compatible',
        modelId: 'gpt-5.4',
        projectMode: 'real-project',
        fallbackUsed: false,
      },
      modelLabel: {
        en: 'OpenAI planner profile (gpt-5.4)',
      },
    })
  })

  it('rehydrates planner-backed proposal detail and lightweight events from exported snapshots', async () => {
    const projectId = 'project-hydrated-planner-output'
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockResolvedValue(createPlannerResult({
          modelId: 'gpt-5.4-mini',
          proposals: [
            {
              title: 'Open with the station alarm',
              summary: 'Lead with the alarm before Ren enters the frame.',
              changeKind: 'action',
              riskLabel: 'Editor check recommended',
              variants: [
                {
                  label: 'Alarm-wide',
                  summary: 'Stay wide on the station alarm beat.',
                  rationale: 'Lets the reveal breathe before character focus.',
                },
              ],
            },
          ],
        })),
      },
    })

    const run = await store.startSceneRun(projectId, {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Persist the validated planner output.',
    })
    const snapshot = store.exportProjectState(projectId)
    expect(snapshot).toBeTruthy()

    const hydratedStore = createRunFixtureStore()
    hydratedStore.clearProject(projectId)
    hydratedStore.hydrateProjectState(projectId, snapshot!)

    const proposalSet = hydratedStore.getRunArtifact(projectId, run.id, 'proposal-set-scene-midnight-platform-run-001')
    const plannerInvocation = hydratedStore.getRunArtifact(
      projectId,
      run.id,
      'agent-invocation-scene-midnight-platform-run-001-001',
    )

    expect(proposalSet?.kind).toBe('proposal-set')
    if (proposalSet?.kind !== 'proposal-set') {
      throw new Error('expected hydrated proposal-set detail')
    }
    expect(proposalSet.proposals).toHaveLength(1)
    expect(proposalSet.proposals[0]?.id).toBe('proposal-set-scene-midnight-platform-run-001-proposal-001')
    expect(proposalSet.proposals[0]?.title.en).toBe('Open with the station alarm')
    expect(proposalSet.proposals[0]?.summary.en).toBe('Lead with the alarm before Ren enters the frame.')
    expect(proposalSet.proposals[0]?.defaultVariantId).toBe(
      'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-001',
    )
    expect(plannerInvocation).toMatchObject({
      kind: 'agent-invocation',
      provenance: {
        provider: 'openai-compatible',
        modelId: 'gpt-5.4-mini',
        projectMode: 'real-project',
        fallbackUsed: false,
      },
      modelLabel: {
        en: 'OpenAI planner profile (gpt-5.4-mini)',
      },
    })

    const serializedEvents = JSON.stringify(listAllEventPages(hydratedStore, projectId, run.id))
    expect(serializedEvents).not.toContain('transcript')
    expect(serializedEvents).not.toContain('Persist the validated planner output.')
    expect(serializedEvents).not.toContain('Return scene-planning proposals only.')
    expect(serializedEvents).not.toContain('Open with the station alarm')
  })

  it('routes createServer start-run persistence through the constructed explicit fixture planner path', async () => {
    const savedOverlays = new Map<string, unknown>()
    const server = createTestServer({
      configOverrides: {
        modelProvider: 'openai-compatible',
        modelBindings: {
          continuityReviewer: { provider: 'fixture' },
          planner: { provider: 'fixture' },
          sceneProseWriter: { provider: 'fixture' },
          sceneRevision: { provider: 'fixture' },
          summary: { provider: 'fixture' },
        },
      },
      projectStatePersistence: {
        async load() {
          return {
            schemaVersion: 1,
            seedVersion: 'prototype-fixture-seed-v1',
            projects: {},
          }
        },
        async saveProjectOverlay(projectId, overlay) {
          savedOverlays.set(projectId, overlay)
        },
        async clearProjectOverlay(projectId) {
          savedOverlays.delete(projectId)
        },
      },
    })

    try {
      await server.repository.whenReady()

      const run = await server.repository.startSceneRun('book-signal-arc', {
        sceneId: 'scene-midnight-platform',
        mode: 'rewrite',
      })
      const overlay = savedOverlays.get('book-signal-arc') as
        | {
            runStore?: {
              runStates: Array<{
                run: { id: string }
                artifacts: Array<{ id: string; meta?: Record<string, unknown> }>
              }>
            }
          }
        | undefined

      const runState = overlay?.runStore?.runStates.find((candidate) => candidate.run.id === run.id)
      expect(runState?.artifacts.find((artifact) => artifact.meta?.role === 'planner')).toMatchObject({
        meta: {
          role: 'planner',
          index: 1,
          provenance: {
            provider: 'fixture',
            modelId: 'fixture-scene-planner',
            projectMode: 'demo-fixture',
            fallbackUsed: false,
          },
        },
      })
    } finally {
      await server.app.close()
      await server.cleanupProjectStateFile()
    }
  })

  it('lists readable start-run artifacts for context, invocations, and proposal sets', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-artifacts', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const artifacts = store.listRunArtifacts('project-artifacts', run.id)

    expect(artifacts?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
    ])
  })

  it('resolves every start-run artifact event ref through getRunArtifact', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-ref-resolution', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const events = listAllEventPages(store, 'project-ref-resolution', run.id)
    const artifactRefs = events
      .flatMap((event) => (event.refs ?? []).map((ref) => ({ eventId: event.id, ref })))
      .filter(({ ref }) => ref.kind === 'context-packet' || ref.kind === 'agent-invocation' || ref.kind === 'proposal-set')

    expect(artifactRefs).toHaveLength(6)
    for (const { eventId, ref } of artifactRefs) {
      expect(store.getRunArtifact('project-ref-resolution', run.id, ref.id)).toMatchObject({
        id: ref.id,
        kind: ref.kind,
        sourceEventIds: expect.arrayContaining([eventId]),
      })
    }
  })

  it('adds canon patch and prose draft details after acceptance', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-accept-artifacts', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    await store.submitRunReviewDecision('project-accept-artifacts', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
    })

    const artifacts = store.listRunArtifacts('project-accept-artifacts', run.id)
    expect(artifacts?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
      'canon-patch',
      'prose-draft',
    ])

    expect(store.getRunArtifact('project-accept-artifacts', run.id, 'canon-patch-scene-midnight-platform-001')).toMatchObject({
      kind: 'canon-patch',
      sourceProposalSetId: 'proposal-set-scene-midnight-platform-run-001',
      acceptedProposalIds: ['proposal-set-scene-midnight-platform-run-001-proposal-001'],
    })
    expect(
      store.getRunArtifact('project-accept-artifacts', run.id, 'agent-invocation-scene-midnight-platform-run-001-003'),
    ).toMatchObject({
      kind: 'agent-invocation',
      agentRole: 'scene-writer',
      modelLabel: {
        en: 'Fixture writer profile (fixture-scene-prose-writer)',
      },
      generatedRefs: [
        {
          kind: 'artifact',
          id: 'prose-draft-scene-midnight-platform-001',
        },
      ],
    })
    expect(store.getRunArtifact('project-accept-artifacts', run.id, 'prose-draft-scene-midnight-platform-001')).toMatchObject({
      kind: 'prose-draft',
      sourceCanonPatchId: 'canon-patch-scene-midnight-platform-001',
      contextPacketId: 'ctx-scene-midnight-platform-run-001',
      sourceProposalIds: ['proposal-set-scene-midnight-platform-run-001-proposal-001'],
    })
    expect(store.getRunArtifact('project-accept-artifacts', run.id, 'proposal-set-scene-midnight-platform-run-001')).toMatchObject({
      kind: 'proposal-set',
      sourceInvocationIds: ['agent-invocation-scene-midnight-platform-run-001-001'],
    })
  })

  it('persists selected variants and exposes lightweight review provenance after acceptance', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-selected-variants', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    const selectedVariant = {
      proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
      variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-002',
    }

    await store.submitRunReviewDecision('project-selected-variants', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
      selectedVariants: [selectedVariant],
    })

    const events = store.getRunEvents('project-selected-variants', {
      runId: run.id,
      cursor: run.latestEventId,
    })
    const reviewEvent = events.events.find((event) => event.kind === 'review_decision_submitted')
    expect(reviewEvent).toMatchObject({
      metadata: {
        selectedVariantCount: 1,
      },
    })
    expect(reviewEvent).not.toHaveProperty('selectedVariants')
    expect(JSON.stringify(reviewEvent)).not.toContain(selectedVariant.variantId)

    expect(store.getRunArtifact('project-selected-variants', run.id, 'proposal-set-scene-midnight-platform-run-001')).toMatchObject({
      kind: 'proposal-set',
      proposals: [
        expect.objectContaining({
          id: selectedVariant.proposalId,
          selectedVariantId: selectedVariant.variantId,
        }),
        expect.any(Object),
      ],
    })
    expect(store.getRunArtifact('project-selected-variants', run.id, 'canon-patch-scene-midnight-platform-001')).toMatchObject({
      kind: 'canon-patch',
      selectedVariants: [selectedVariant],
      acceptedFacts: [
        expect.objectContaining({
          selectedVariants: [selectedVariant],
        }),
      ],
    })
    expect(store.getRunArtifact('project-selected-variants', run.id, 'prose-draft-scene-midnight-platform-001')).toMatchObject({
      kind: 'prose-draft',
      selectedVariants: [selectedVariant],
    })
  })

  it('keeps persisted canon patch, prose draft, and trace provenance aligned for a selected variant on proposal 002', async () => {
    const store = createRunFixtureStore({
      scenePlannerGateway: {
        generate: vi.fn().mockResolvedValue(createPlannerResult({
          proposals: [
            {
              title: 'Hold on the departure bell',
              summary: 'Delay the reveal until the platform bell has landed.',
              changeKind: 'action',
              riskLabel: 'Editor check recommended',
              variants: [
                {
                  label: 'Wide bell',
                  summary: 'Stay wide on the bell before focusing on Ren.',
                  rationale: 'Preserves staging before the reveal tightens.',
                },
              ],
            },
            {
              title: 'Thread the ledger rumor',
              summary: 'Carry the rumor through ambient station detail.',
              changeKind: 'reveal',
              riskLabel: 'Continuity review required',
              variants: [
                {
                  label: 'Ambient rumor',
                  summary: 'Let the platform ambience carry the rumor forward.',
                  rationale: 'Keeps the reveal in the setting instead of exposition.',
                },
              ],
            },
          ],
        })),
      },
    })
    const projectId = 'project-selected-proposal-002'
    const run = await store.startSceneRun(projectId, {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    const selectedVariant = {
      proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-002',
      variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-002-variant-001',
    }

    await store.submitRunReviewDecision(projectId, {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
      selectedVariants: [selectedVariant],
    })

    const snapshot = store.exportProjectState(projectId)
    expect(snapshot).toBeTruthy()

    const hydratedStore = createRunFixtureStore()
    hydratedStore.clearProject(projectId)
    hydratedStore.hydrateProjectState(projectId, snapshot!)

    expect(hydratedStore.getRunArtifact(projectId, run.id, 'canon-patch-scene-midnight-platform-001')).toMatchObject({
      kind: 'canon-patch',
      acceptedProposalIds: [selectedVariant.proposalId],
      selectedVariants: [selectedVariant],
      acceptedFacts: [
        expect.objectContaining({
          sourceProposalIds: [selectedVariant.proposalId],
          selectedVariants: [selectedVariant],
        }),
      ],
    })
    expect(hydratedStore.getRunArtifact(projectId, run.id, 'prose-draft-scene-midnight-platform-001')).toMatchObject({
      kind: 'prose-draft',
      sourceProposalIds: [selectedVariant.proposalId],
      selectedVariants: [selectedVariant],
      body: {
        en: expect.stringContaining(selectedVariant.variantId),
      },
    })
    expect(hydratedStore.getRunTrace(projectId, run.id)).toMatchObject({
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
            id: selectedVariant.proposalId,
          },
        }),
      ]),
    })
  })

  it('rejects invalid selected variants before mutating run state', async () => {
    const invalidCases = [
      {
        name: 'duplicate proposal ids',
        selectedVariants: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
            variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-001',
          },
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
            variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-002',
          },
        ],
        message: 'selectedVariants proposalId proposal-set-scene-midnight-platform-run-001-proposal-001 must be unique.',
      },
      {
        name: 'legacy fixture variant id',
        selectedVariants: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
            variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-reveal-pressure',
          },
        ],
        message: 'selectedVariants variantId proposal-set-scene-midnight-platform-run-001-proposal-001-variant-reveal-pressure does not exist for proposal proposal-set-scene-midnight-platform-run-001-proposal-001.',
      },
      {
        name: 'unknown proposal id',
        selectedVariants: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-missing',
            variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-missing-variant-001',
          },
        ],
        message: 'selectedVariants proposalId proposal-set-scene-midnight-platform-run-001-proposal-missing does not exist in the run proposal set.',
      },
      {
        name: 'unknown variant id',
        selectedVariants: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
            variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-missing',
          },
        ],
        message: 'selectedVariants variantId proposal-set-scene-midnight-platform-run-001-proposal-001-variant-missing does not exist for proposal proposal-set-scene-midnight-platform-run-001-proposal-001.',
      },
      {
        name: 'proposal with no variants',
        selectedVariants: [
          {
            proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-002',
            variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-002-variant-missing',
          },
        ],
        message: 'selectedVariants variantId proposal-set-scene-midnight-platform-run-001-proposal-002-variant-missing does not exist for proposal proposal-set-scene-midnight-platform-run-001-proposal-002.',
      },
    ]

    for (const invalidCase of invalidCases) {
      const store = createRunFixtureStore()
      const projectId = `project-invalid-selected-variants-${invalidCase.name.replaceAll(' ', '-')}`
      const run = await store.startSceneRun(projectId, {
        sceneId: 'scene-midnight-platform',
        mode: 'rewrite',
      })
      const beforeRun = store.getRun(projectId, run.id)
      const beforeEvents = store.getRunEvents(projectId, {
        runId: run.id,
        cursor: run.latestEventId,
      })
      const beforeArtifacts = store.listRunArtifacts(projectId, run.id)

      try {
        await store.submitRunReviewDecision(projectId, {
          runId: run.id,
          reviewId: run.pendingReviewId!,
          decision: 'accept',
          selectedVariants: invalidCase.selectedVariants,
        })
        throw new Error(`expected invalid selectedVariants to throw for ${invalidCase.name}`)
      } catch (error) {
        expect(error).toMatchObject({
          status: 400,
          code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
          message: invalidCase.message,
        })
      }

      expect(store.getRun(projectId, run.id)).toEqual(beforeRun)
      expect(store.getRunEvents(projectId, {
        runId: run.id,
        cursor: run.latestEventId,
      })).toEqual(beforeEvents)
      expect(store.listRunArtifacts(projectId, run.id)).toEqual(beforeArtifacts)
    }
  })

  it('rejects custom patch ids that collide with an existing artifact id and preserves current read surfaces', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-patchid-collision', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const beforeContextPacket = store.getRunArtifact('project-patchid-collision', run.id, 'ctx-scene-midnight-platform-run-001')
    const beforeTrace = store.getRunTrace('project-patchid-collision', run.id)
    const beforeArtifacts = store.listRunArtifacts('project-patchid-collision', run.id)

    try {
      await store.submitRunReviewDecision('project-patchid-collision', {
        runId: run.id,
        reviewId: run.pendingReviewId!,
        decision: 'accept-with-edit',
        patchId: 'ctx-scene-midnight-platform-run-001',
      })
      throw new Error('expected patchId collision to throw')
    } catch (error) {
      expect(error).toMatchObject({
        status: 409,
        code: 'RUN_ARTIFACT_ID_CONFLICT',
        message: 'Run artifact id ctx-scene-midnight-platform-run-001 conflicts within run run-scene-midnight-platform-001.',
      })
    }

    expect(store.getRunArtifact('project-patchid-collision', run.id, 'ctx-scene-midnight-platform-run-001')).toEqual(beforeContextPacket)
    expect(store.getRunTrace('project-patchid-collision', run.id)).toEqual(beforeTrace)
    expect(store.listRunArtifacts('project-patchid-collision', run.id)).toEqual(beforeArtifacts)
  })

  it('rejects colliding patch ids before invoking the writer gateway', async () => {
    const generate = vi.fn()
    const store = createRunFixtureStore({
      sceneProseWriterGateway: {
        generate,
      },
    })
    const run = await store.startSceneRun('project-patchid-collision-no-writer', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    await expect(store.submitRunReviewDecision('project-patchid-collision-no-writer', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept-with-edit',
      patchId: 'ctx-scene-midnight-platform-run-001',
    })).rejects.toMatchObject({
      status: 409,
      code: 'RUN_ARTIFACT_ID_CONFLICT',
    })
    expect(generate).not.toHaveBeenCalled()
  })

  it('reuses the persisted context packet when building the accepted prose writer request', async () => {
    const writerGenerate = vi.fn().mockResolvedValue({
      output: {
        body: {
          en: 'Accepted prose body.',
          'zh-CN': '已接受的正文。',
        },
        excerpt: {
          en: 'Accepted prose excerpt.',
          'zh-CN': '已接受的正文摘录。',
        },
        wordCount: 42,
        relatedAssets: [
          {
            assetId: 'asset-ren-voss',
            kind: 'character',
            label: {
              en: 'Ren Voss',
              'zh-CN': '任·沃斯',
            },
          },
        ],
      },
      provenance: {
        fallbackUsed: false,
        provider: 'fixture',
        modelId: 'fixture-scene-prose-writer',
        projectMode: 'demo-fixture',
      },
    })
    const store = createRunFixtureStore({
      buildSceneContextPacket: createProjectContextPacketBuilder(),
      sceneProseWriterGateway: {
        generate: writerGenerate,
      },
    })

    const run = await store.startSceneRun('book-signal-arc', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Planner note should stay outside run events.',
    })

    await store.submitRunReviewDecision('book-signal-arc', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
      note: 'Keep the accepted packet visible to the writer.',
      selectedVariants: [
        {
          proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
          variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
        },
      ],
    })

    expect(writerGenerate).toHaveBeenCalledWith(expect.objectContaining({
      sceneId: 'scene-midnight-platform',
      instructions: 'Return structured accepted scene prose with body, excerpt, diffSummary, and relatedAssets.',
      input: expect.stringContaining('Context packet ctx-scene-midnight-platform-run-002.'),
    }))
    expect(writerGenerate.mock.calls[0]?.[0].input).toContain('Book premise: Fixture-backed project root for the BE-PR1 API server skeleton.')
    expect(writerGenerate.mock.calls[0]?.[0].input).toContain('Accepted proposals: proposal-set-scene-midnight-platform-run-002-proposal-001.')
    expect(writerGenerate.mock.calls[0]?.[0].input).toContain('Selected variants: proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002.')
  })

  it('translates accepted real-writer failures into a failed run instead of leaving review pending', async () => {
    const store = createRunFixtureStore({
      sceneProseWriterGateway: {
        generate: vi.fn().mockRejectedValue(new ModelGatewayExecutionError({
          failureClass: 'provider_error',
          fallbackUsed: false,
          message: 'OpenAI provider request failed.',
          modelId: 'gpt-5.4',
          provider: 'openai-compatible',
          projectMode: 'real-project',
          retryable: true,
          role: 'sceneProseWriter',
        })),
      },
    })
    const run = await store.startSceneRun('project-review-writer-error', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const failedRun = await store.submitRunReviewDecision('project-review-writer-error', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
    })

    expect(failedRun).toMatchObject({
      id: run.id,
      status: 'failed',
      pendingReviewId: undefined,
      failureClass: 'provider_error',
      summary: 'Scene run failed while generating accepted prose after review.',
      runtimeSummary: {
        health: 'failed',
        failureClassLabel: 'Provider error',
        nextActionLabel: 'Repair model settings or retry the run after the runtime issue is resolved.',
      },
      usage: {
        provider: 'openai-compatible',
        modelId: 'gpt-5.4',
        projectMode: 'real-project',
        fallbackUsed: false,
      },
    })
    expect(listAllEventPages(store, 'project-review-writer-error', run.id).map((event) => event.kind)).toContain('run_failed')
    expect(store.listRunArtifacts('project-review-writer-error', run.id)?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
    ])
  })

  it('preserves accept-with-edit review history when accepted prose generation fails', async () => {
    const store = createRunFixtureStore({
      sceneProseWriterGateway: {
        generate: vi.fn().mockRejectedValue(new ModelGatewayExecutionError({
          failureClass: 'provider_error',
          fallbackUsed: false,
          message: 'OpenAI provider request failed.',
          modelId: 'gpt-5.4',
          provider: 'openai-compatible',
          projectMode: 'real-project',
          retryable: true,
          role: 'sceneProseWriter',
        })),
      },
    })
    const run = await store.startSceneRun('project-review-writer-edit-error', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    await store.submitRunReviewDecision('project-review-writer-edit-error', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept-with-edit',
      note: 'Polish the final exchange.',
    })

    expect(listAllEventPages(store, 'project-review-writer-edit-error', run.id)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'review_decision_submitted',
        summary: 'Review accepted the proposal set with edits, but prose generation did not complete.',
      }),
      expect.objectContaining({
        kind: 'run_failed',
        summary: 'OpenAI provider request failed.',
      }),
    ]))
  })

  it('accepts valid custom patch ids and keeps artifact lookup and trace complete', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-custom-patchid', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    await store.submitRunReviewDecision('project-custom-patchid', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept-with-edit',
      patchId: 'canon-patch-editorial-777',
    })

    expect(store.getRunArtifact('project-custom-patchid', run.id, 'canon-patch-editorial-777')).toMatchObject({
      id: 'canon-patch-editorial-777',
      kind: 'canon-patch',
      decision: 'accept-with-edit',
      traceLinkIds: [
        'trace-link-scene-midnight-platform-001-accepted_into-001',
        'trace-link-scene-midnight-platform-001-accepted_into-002',
      ],
    })
    expect(store.getRunArtifact('project-custom-patchid', run.id, 'ctx-scene-midnight-platform-run-001')).toMatchObject({
      id: 'ctx-scene-midnight-platform-run-001',
      kind: 'context-packet',
    })
    expect(store.getRunTrace('project-custom-patchid', run.id)).toMatchObject({
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
            kind: 'canon-fact',
            id: 'canon-patch-editorial-777-fact-001',
          },
          to: {
            kind: 'canon-patch',
            id: 'canon-patch-editorial-777',
          },
        }),
        expect.objectContaining({
          relation: 'rendered_as',
          from: {
            kind: 'canon-patch',
            id: 'canon-patch-editorial-777',
          },
          to: {
            kind: 'prose-draft',
            id: 'prose-draft-scene-midnight-platform-001',
          },
        }),
      ]),
    })
  })

  it('returns a minimal proposal to canon to prose trace after acceptance', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-accept-trace', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    await store.submitRunReviewDecision('project-accept-trace', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
    })

    const trace = store.getRunTrace('project-accept-trace', run.id)
    const canonPatch = store.getRunArtifact('project-accept-trace', run.id, 'canon-patch-scene-midnight-platform-001')

    expect(trace).toMatchObject({
      runId: run.id,
      summary: {
        proposalSetCount: 1,
        canonPatchCount: 1,
        proseDraftCount: 1,
        missingTraceCount: 0,
      },
    })
    expect(canonPatch).toMatchObject({
      kind: 'canon-patch',
      traceLinkIds: [
        'trace-link-scene-midnight-platform-001-accepted_into-001',
        'trace-link-scene-midnight-platform-001-accepted_into-002',
      ],
    })
    expect(canonPatch?.kind).toBe('canon-patch')
    if (canonPatch?.kind !== 'canon-patch') {
      throw new Error('expected canon patch detail')
    }
    expect(canonPatch.traceLinkIds.every((linkId) => trace?.links.some((link) => link.id === linkId))).toBe(true)
    expect(trace?.links).toEqual(expect.arrayContaining([
      expect.objectContaining({
        relation: 'accepted_into',
        from: {
          kind: 'proposal',
          id: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
        },
        to: {
          kind: 'canon-fact',
          id: 'canon-patch-scene-midnight-platform-001-fact-001',
        },
      }),
      expect.objectContaining({
        relation: 'rendered_as',
        from: {
          kind: 'canon-patch',
          id: 'canon-patch-scene-midnight-platform-001',
        },
        to: {
          kind: 'prose-draft',
          id: 'prose-draft-scene-midnight-platform-001',
        },
      }),
      expect.objectContaining({
        relation: 'accepted_into',
        from: {
          kind: 'canon-fact',
          id: 'canon-patch-scene-midnight-platform-001-fact-001',
        },
        to: {
          kind: 'canon-patch',
          id: 'canon-patch-scene-midnight-platform-001',
        },
      }),
    ]))
  })

  it('does not create canon or prose artifacts for rejection', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-reject-artifacts', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    await store.submitRunReviewDecision('project-reject-artifacts', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'reject',
    })

    expect(store.listRunArtifacts('project-reject-artifacts', run.id)?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
    ])
    expect(store.getRunArtifact('project-reject-artifacts', run.id, 'canon-patch-scene-midnight-platform-001')).toBeNull()
    expect(store.getRunArtifact('project-reject-artifacts', run.id, 'prose-draft-scene-midnight-platform-001')).toBeNull()
    expect(store.getRunTrace('project-reject-artifacts', run.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
  })

  it('returns null for invalid artifact ids', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-invalid-artifact', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    expect(store.getRunArtifact('project-invalid-artifact', run.id, 'artifact-missing')).toBeNull()
  })

  it('keeps artifacts isolated by project and run', async () => {
    const store = createRunFixtureStore()
    const runA = await store.startSceneRun('project-artifact-a', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })
    const runB = await store.startSceneRun('project-artifact-b', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    await store.submitRunReviewDecision('project-artifact-a', {
      runId: runA.id,
      reviewId: runA.pendingReviewId!,
      decision: 'accept',
    })

    expect(runA.id).toBe(runB.id)
    expect(store.getRunArtifact('project-artifact-b', runB.id, 'canon-patch-scene-midnight-platform-001')).toBeNull()
    expect(store.getRunTrace('project-artifact-b', runB.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
  })

  it('appends accept-with-edit review events and clears the pending review', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-review', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const reviewedRun = await store.submitRunReviewDecision('project-review', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept-with-edit',
      note: 'Tighten the final paragraph.',
    })

    expect(reviewedRun).toMatchObject({
      id: run.id,
      status: 'completed',
      summary: 'Proposal set accepted with editor adjustments applied to canon and prose.',
      completedAtLabel: '2026-04-23 10:13',
      pendingReviewId: undefined,
    })

    const events = store.getRunEvents('project-review', {
      runId: run.id,
      cursor: run.latestEventId,
    })
    expect(events.events.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
      'canon_patch_applied',
      'prose_generated',
      'run_completed',
    ])
    expect(store.getRunTrace('project-review', run.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 1,
      proseDraftCount: 1,
      missingTraceCount: 0,
    })
  })

  it('keeps request-rewrite semantics terminal without producing new artifacts', async () => {
    const store = createRunFixtureStore()
    const run = await store.startSceneRun('project-rewrite', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const reviewedRun = await store.submitRunReviewDecision('project-rewrite', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'request-rewrite',
      note: 'Take another pass on the ending beat.',
    })

    expect(reviewedRun).toMatchObject({
      id: run.id,
      status: 'completed',
      summary: 'Rewrite requested. Start a new run to continue.',
      pendingReviewId: undefined,
      completedAtLabel: '2026-04-23 10:10',
    })

    const events = store.getRunEvents('project-rewrite', {
      runId: run.id,
      cursor: run.latestEventId,
    })
    expect(events.events.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
    ])
    expect(events.nextCursor).toBeUndefined()
    expect(store.listRunArtifacts('project-rewrite', run.id)?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
    ])
    expect(store.getRunArtifact('project-rewrite', run.id, 'canon-patch-scene-midnight-platform-001')).toBeNull()
    expect(store.getRunArtifact('project-rewrite', run.id, 'prose-draft-scene-midnight-platform-001')).toBeNull()
    expect(store.getRunTrace('project-rewrite', run.id)?.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
  })

  it('exports, hydrates, and clears project-scoped run snapshots', async () => {
    const store = createRunFixtureStore()
    const projectId = 'project-persisted-run-store'
    const run = await store.startSceneRun(projectId, {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
      note: 'Persist this run across a fresh API server.',
    })

    await store.submitRunReviewDecision(projectId, {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
      selectedVariants: [
        {
          proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
          variantId: 'proposal-set-scene-midnight-platform-run-001-proposal-001-variant-002',
        },
      ],
    })

    const snapshot = store.exportProjectState(projectId)
    expect(snapshot).toMatchObject({
      sceneSequences: {
        'scene-midnight-platform': 1,
      },
    })
    expect(snapshot?.runStates).toHaveLength(1)

    const hydratedStore = createRunFixtureStore()
    hydratedStore.clearProject(projectId)
    hydratedStore.hydrateProjectState(projectId, snapshot!)

    expect(hydratedStore.getRun(projectId, run.id)).toMatchObject({
      id: run.id,
      status: 'completed',
      latestEventId: 'run-event-scene-midnight-platform-001-013',
      eventCount: 13,
    })
    expect(hydratedStore.listRunArtifacts(projectId, run.id)?.map((artifact) => artifact.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
      'canon-patch',
      'prose-draft',
    ])
    expect(hydratedStore.getRunTrace(projectId, run.id)).toMatchObject({
      runId: run.id,
      summary: {
        proposalSetCount: 1,
        canonPatchCount: 1,
        proseDraftCount: 1,
        missingTraceCount: 0,
      },
    })

    hydratedStore.clearProject(projectId)
    expect(hydratedStore.exportProjectState(projectId)).toBeUndefined()
    expect(hydratedStore.getRun(projectId, run.id)).toBeNull()
  })

  it('keeps existing project run state intact when any persisted run snapshot entry is invalid', async () => {
    const store = createRunFixtureStore()
    const projectId = 'project-atomic-hydration'
    const run = await store.startSceneRun(projectId, {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    await store.submitRunReviewDecision(projectId, {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'accept',
    })

    const baselineSnapshot = store.exportProjectState(projectId)
    expect(baselineSnapshot).toBeTruthy()

    store.hydrateProjectState(projectId, {
      sceneSequences: {
        'scene-midnight-platform': 99,
      },
      runStates: [
        {
          sequence: 99,
          run: {
            id: 'run-invalid',
          },
          events: [],
          artifacts: 'invalid-artifacts',
        },
      ],
    } as unknown as NonNullable<typeof baselineSnapshot>)

    expect(store.exportProjectState(projectId)).toEqual(baselineSnapshot)
    expect(store.getRun(projectId, run.id)).toMatchObject({
      id: run.id,
      status: 'completed',
    })
    expect(store.getRun(projectId, 'run-invalid')).toBeNull()
  })
})
