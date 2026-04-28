import { describe, expect, it, vi } from 'vitest'

import type {
  RunArtifactDetailRecord,
  RunArtifactSummaryRecord,
  RunEventRecord,
  RunRecord,
  RunReviewDecisionKind,
  RunSelectedProposalVariantRecord,
  RunTraceLinkRecord,
  RunTraceNodeRecord,
  RunTraceResponse,
} from '../../contracts/api-records.js'
import { createRunFixtureStore } from '../../repositories/runFixtureStore.js'
import {
  buildAgentInvocationDetail,
  buildCanonPatchDetail,
  buildContextPacketDetail,
  buildProposalSetDetail,
  buildProseDraftDetail,
} from './sceneRunArtifactDetails.js'
import {
  buildAcceptedRunTrace,
  buildInitialRunTrace,
  buildRejectedRunTrace,
  buildRewriteRunTrace,
} from './sceneRunTraceLinks.js'
import type { SceneRunArtifactRecord } from './sceneRunRecords.js'
import {
  hydrateDurableRunStates,
  serializeDurableRunState,
  type DurablePersistedRunStateRecord,
} from './durableRunWorkflowAdapter.js'

interface HydratedTestRunState {
  sequence: number
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
  artifactDetailsById: Map<string, RunArtifactDetailRecord>
  artifactSummaries: RunArtifactSummaryRecord[]
  latestReviewDecision?: RunReviewDecisionKind
  selectedVariants: RunSelectedProposalVariantRecord[]
  traceLinksById: Map<string, RunTraceLinkRecord>
  traceNodesById: Map<string, RunTraceNodeRecord>
  traceSummary: RunTraceResponse['summary']
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function findReviewId(events: RunEventRecord[]) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const reviewRef = events[index]?.refs?.find((ref) => ref.kind === 'review')
    if (reviewRef) {
      return reviewRef.id
    }
  }

  return undefined
}

function toArtifactSummary(detail: RunArtifactDetailRecord): RunArtifactSummaryRecord {
  return {
    id: detail.id,
    runId: detail.runId,
    kind: detail.kind,
    title: detail.title,
    summary: detail.summary,
    statusLabel: detail.statusLabel,
    createdAtLabel: detail.createdAtLabel,
    sourceEventIds: [...detail.sourceEventIds],
    ...(detail.usage ? { usage: detail.usage } : {}),
  }
}

function collectArtifactSourceEventIds(events: RunEventRecord[], artifact: SceneRunArtifactRecord) {
  return events
    .filter((event) => event.refs?.some((ref) => ref.kind === artifact.kind && ref.id === artifact.id))
    .map((event) => event.id)
}

function collectAcceptedProposalIds(
  proposalSet: ReturnType<typeof buildProposalSetDetail> | undefined,
  selectedVariants?: RunSelectedProposalVariantRecord[],
) {
  if (!proposalSet) {
    return []
  }

  if (!selectedVariants?.length) {
    return proposalSet.proposals[0] ? [proposalSet.proposals[0].id] : []
  }

  const proposalIds = new Set(proposalSet.proposals.map((proposal) => proposal.id))
  return selectedVariants
    .map((selectedVariant) => selectedVariant.proposalId)
    .filter((proposalId, index, values) => proposalIds.has(proposalId) && values.indexOf(proposalId) === index)
}

function materializeRunState(serialized: DurablePersistedRunStateRecord): HydratedTestRunState {
  const state: HydratedTestRunState = {
    sequence: serialized.sequence,
    run: clone(serialized.run),
    events: clone(serialized.events),
    artifacts: clone(serialized.artifacts),
    artifactDetailsById: new Map<string, RunArtifactDetailRecord>(),
    artifactSummaries: [],
    latestReviewDecision: serialized.latestReviewDecision,
    selectedVariants: clone(serialized.selectedVariants ?? []),
    traceLinksById: new Map<string, RunTraceLinkRecord>(),
    traceNodesById: new Map<string, RunTraceNodeRecord>(),
    traceSummary: {
      proposalSetCount: 0,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    },
  }

  const artifactDetailsById = new Map<string, RunArtifactDetailRecord>()
  const artifactSummaries = [] as RunArtifactSummaryRecord[]

  const contextPacketArtifact = state.artifacts.find((artifact) => artifact.kind === 'context-packet')
  const contextPacketDetail = contextPacketArtifact
    ? buildContextPacketDetail({
        artifact: contextPacketArtifact,
        sourceEventIds: collectArtifactSourceEventIds(state.events, contextPacketArtifact),
      })
    : undefined

  if (contextPacketDetail) {
    artifactDetailsById.set(contextPacketDetail.id, contextPacketDetail)
    artifactSummaries.push(toArtifactSummary(contextPacketDetail))
  }

  const agentInvocationDetails = state.artifacts
    .filter((artifact) => artifact.kind === 'agent-invocation')
    .map((artifact) => buildAgentInvocationDetail({
      artifact,
      sourceEventIds: collectArtifactSourceEventIds(state.events, artifact),
      contextPacketId: contextPacketDetail?.id,
    }))

  for (const detail of agentInvocationDetails) {
    artifactDetailsById.set(detail.id, detail)
    artifactSummaries.push(toArtifactSummary(detail))
  }

  const proposalSetArtifact = state.artifacts.find((artifact) => artifact.kind === 'proposal-set')
  const proposalSetDetail = proposalSetArtifact
    ? buildProposalSetDetail({
        artifact: proposalSetArtifact,
        sourceEventIds: collectArtifactSourceEventIds(state.events, proposalSetArtifact),
        reviewId: findReviewId(state.events),
        sourceInvocationIds: agentInvocationDetails
          .filter((detail) => detail.agentRole === 'scene-planner')
          .map((detail) => detail.id),
        selectedVariants: state.selectedVariants,
      })
    : undefined

  if (proposalSetDetail) {
    artifactDetailsById.set(proposalSetDetail.id, proposalSetDetail)
    artifactSummaries.push(toArtifactSummary(proposalSetDetail))
  }

  const acceptedProposalIds = collectAcceptedProposalIds(proposalSetDetail, state.selectedVariants)
  const canonPatchArtifact = state.artifacts.find((artifact) => artifact.kind === 'canon-patch')
  const acceptedDecision = state.latestReviewDecision === 'accept-with-edit' ? 'accept-with-edit' : 'accept'
  const canonPatchDetail = canonPatchArtifact && proposalSetDetail
    ? buildCanonPatchDetail({
        artifact: canonPatchArtifact,
        sourceEventIds: collectArtifactSourceEventIds(state.events, canonPatchArtifact),
        decision: acceptedDecision,
        sourceProposalSetId: proposalSetDetail.id,
        acceptedProposalIds,
        selectedVariants: state.selectedVariants,
      })
    : undefined

  if (canonPatchDetail) {
    artifactDetailsById.set(canonPatchDetail.id, canonPatchDetail)
    artifactSummaries.push(toArtifactSummary(canonPatchDetail))
  }

  const proseDraftArtifact = state.artifacts.find((artifact) => artifact.kind === 'prose-draft')
  const proseDraftDetail = proseDraftArtifact
    ? buildProseDraftDetail({
        artifact: proseDraftArtifact,
        sourceEventIds: collectArtifactSourceEventIds(state.events, proseDraftArtifact),
        sourceCanonPatchId: canonPatchDetail?.id,
        contextPacketId: contextPacketDetail?.id,
        sourceProposalIds: canonPatchDetail?.acceptedProposalIds,
        selectedVariants: canonPatchDetail?.selectedVariants,
      })
    : undefined

  if (proseDraftDetail) {
    artifactDetailsById.set(proseDraftDetail.id, proseDraftDetail)
    artifactSummaries.push(toArtifactSummary(proseDraftDetail))
  }

  const trace = contextPacketDetail && proposalSetDetail
    ? (() => {
        const traceBaseInput = {
          runId: state.run.id,
          contextPacket: contextPacketDetail,
          agentInvocations: agentInvocationDetails,
          proposalSet: proposalSetDetail,
        }

        if (canonPatchDetail && proseDraftDetail) {
          return buildAcceptedRunTrace({
            ...traceBaseInput,
            canonPatch: canonPatchDetail,
            proseDraft: proseDraftDetail,
          })
        }

        switch (state.latestReviewDecision) {
          case 'reject':
            return buildRejectedRunTrace(traceBaseInput)
          case 'request-rewrite':
            return buildRewriteRunTrace(traceBaseInput)
          default:
            return buildInitialRunTrace(traceBaseInput)
        }
      })()
    : {
        runId: state.run.id,
        nodes: [],
        links: [],
        summary: {
          proposalSetCount: 0,
          canonPatchCount: 0,
          proseDraftCount: 0,
          missingTraceCount: 0,
        },
      }

  state.artifactDetailsById = artifactDetailsById
  state.artifactSummaries = artifactSummaries
  state.traceNodesById = new Map(trace.nodes.map((node) => [node.id, node]))
  state.traceLinksById = new Map(trace.links.map((link) => [link.id, link]))
  state.traceSummary = trace.summary
  return state
}

async function createPersistedWaitingReviewState() {
  const store = createRunFixtureStore()
  const run = await store.startSceneRun('adapter-project', {
    sceneId: 'scene-midnight-platform',
    mode: 'rewrite',
    note: 'Persist waiting review.',
  })
  const snapshot = store.exportProjectState('adapter-project')!
  return {
    run,
    serialized: snapshot.runStates[0] as unknown as DurablePersistedRunStateRecord,
  }
}

async function createPersistedFailedState() {
  const store = createRunFixtureStore()
  const projectId = 'adapter-project-failed'
  const seededRun = await store.startSceneRun(projectId, {
    sceneId: 'scene-midnight-platform',
    mode: 'rewrite',
    note: 'Persist failed recovery.',
  })
  const snapshot = store.exportProjectState(projectId)! as unknown as {
    runStates: DurablePersistedRunStateRecord[]
  }
  const runState = snapshot.runStates.find((entry) => entry.run.id === seededRun.id)!
  const failureEventId = `run-event-${seededRun.id.replace(/^run-/, '')}-010`
  runState.run.status = 'failed'
  runState.run.summary = 'Run failed after provider timeout.'
  runState.run.failureClass = 'model_timeout'
  runState.run.failureMessage = 'Provider timed out after the planner invocation.'
  runState.run.resumableFromEventId = runState.run.latestEventId
  runState.run.pendingReviewId = undefined
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
  const plannerInvocation = runState.artifacts.find((artifact) => artifact.kind === 'agent-invocation')
  if (plannerInvocation) {
    plannerInvocation.meta = {
      ...plannerInvocation.meta,
      failureDetail: {
        failureClass: 'model_timeout',
        message: 'Provider timed out after the planner invocation.',
        provider: 'openai',
        modelId: 'gpt-5.4',
        retryable: true,
        sourceEventIds: [failureEventId],
      },
    }
  }
  runState.run.latestEventId = failureEventId
  runState.run.eventCount = runState.events.length
  return {
    seededRun,
    serialized: runState,
  }
}

describe('durableRunWorkflowAdapter', () => {
  it('serializes workflow support state without mutating canon or prose truth', async () => {
    const { serialized } = await createPersistedWaitingReviewState()
    const selectedVariants = [{ proposalId: 'proposal-1', variantId: 'variant-1a' }]

    const serializedState = serializeDurableRunState({
      ...serialized,
      selectedVariants,
    })

    expect(serializedState).toMatchObject({
      sequence: 1,
      run: {
        id: 'run-scene-midnight-platform-001',
        status: 'waiting_review',
      },
      selectedVariants,
    })
    expect(serializedState).not.toHaveProperty('latestReviewDecision')
    expect(serialized.artifacts.some((artifact) => artifact.kind === 'canon-patch')).toBe(false)
    expect(serialized.artifacts.some((artifact) => artifact.kind === 'prose-draft')).toBe(false)
  })

  it('rejects invalid persisted entries atomically', async () => {
    const { serialized } = await createPersistedWaitingReviewState()
    const createRunState = vi.fn(materializeRunState)

    expect(() =>
      hydrateDurableRunStates({
        snapshot: {
          runStates: [
            serialized,
            {
              ...serialized,
              run: {
                ...serialized.run,
                id: 42,
              },
            },
          ] as unknown as import('../../repositories/project-state-persistence.js').PersistedRunStore['runStates'],
          sceneSequences: { 'scene-midnight-platform': 2 },
        },
        createRunState,
      }),
    ).toThrow(/invalid|unsupported/i)
    expect(createRunState).toHaveBeenCalledTimes(1)
  })

  it('rebuilds read indexes for waiting-review and failed resumable runs after hydration', async () => {
    const { serialized: waitingReviewState } = await createPersistedWaitingReviewState()
    const { seededRun, serialized: failedResumableState } = await createPersistedFailedState()

    const hydrated = hydrateDurableRunStates({
      snapshot: {
        runStates: [waitingReviewState, failedResumableState] as unknown as import('../../repositories/project-state-persistence.js').PersistedRunStore['runStates'],
        sceneSequences: {
          'scene-midnight-platform': 2,
        },
      },
      createRunState: materializeRunState,
    })

    expect(hydrated.states.map((state) => state.run.status)).toEqual(['waiting_review', 'failed'])
    expect(hydrated.states[1]?.artifactDetailsById.get('agent-invocation-scene-midnight-platform-run-001-001')).toMatchObject({
      failureDetail: {
        failureClass: 'model_timeout',
        retryable: true,
      },
    })
    expect(hydrated.states[1]?.traceSummary).toMatchObject({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
    expect(hydrated.states[1]?.run.id).toBe(seededRun.id)
  })
})
