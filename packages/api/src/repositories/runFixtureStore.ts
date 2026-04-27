import type {
  RunArtifactDetailRecord,
  RunArtifactSummaryRecord,
  RunEventRecord,
  RunEventsPageRecord,
  ProposalSetArtifactDetailRecord,
  RunRecord,
  RunReviewDecisionKind,
  RunSelectedProposalVariantRecord,
  RunTraceLinkRecord,
  RunTraceNodeRecord,
  RunTraceResponse,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from '../contracts/api-records.js'
import { badRequest, conflict, notFound } from '../http/errors.js'
import {
  createScenePlannerGateway,
  type ScenePlannerGatewayRequest,
  type ScenePlannerGatewayResult,
} from '../orchestration/modelGateway/scenePlannerGateway.js'
import { FIXTURE_SCENE_PLANNER_MODEL_ID } from '../orchestration/modelGateway/scenePlannerFixtureProvider.js'
import {
  buildAgentInvocationDetail,
  buildCanonPatchDetail,
  buildContextPacketDetail,
  buildProposalSetDetail,
  buildProseDraftDetail,
} from '../orchestration/sceneRun/sceneRunArtifactDetails.js'
import { buildDefaultPlannerOutput } from '../orchestration/sceneRun/sceneRunArtifacts.js'
import { applySceneRunReviewDecisionTransition } from '../orchestration/sceneRun/sceneRunTransitions.js'
import type { SceneRunArtifactRecord } from '../orchestration/sceneRun/sceneRunRecords.js'
import {
  buildAcceptedRunTrace,
  buildInitialRunTrace,
  buildRejectedRunTrace,
  buildRewriteRunTrace,
} from '../orchestration/sceneRun/sceneRunTraceLinks.js'
import { buildFixtureSceneRunTimelineLabel } from '../orchestration/sceneRun/sceneRunTimeline.js'
import { startSceneRunWorkflow } from '../orchestration/sceneRun/sceneRunWorkflow.js'
import type { PersistedRunStore } from './project-state-persistence.js'

const EVENT_PAGE_SIZE = 4
const DEFAULT_PROJECT_ID = 'book-signal-arc'

interface ScenePlannerGatewayLike {
  generate(request: ScenePlannerGatewayRequest): Promise<ScenePlannerGatewayResult>
}

interface RunState {
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

interface PersistedRunStateRecord {
  sequence: number
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
  latestReviewDecision?: RunReviewDecisionKind
  selectedVariants?: RunSelectedProposalVariantRecord[]
}

function trimNote(note?: string) {
  const value = note?.trim()
  return value ? value : undefined
}

function formatSceneName(sceneId: string) {
  return sceneId
    .replace(/^scene-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function toJsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function cloneSelectedVariants(selectedVariants?: RunSelectedProposalVariantRecord[]) {
  return selectedVariants ? clone(selectedVariants) : []
}

function findProposalSetDetail(state: RunState): ProposalSetArtifactDetailRecord | undefined {
  for (const detail of state.artifactDetailsById.values()) {
    if (detail.kind === 'proposal-set') {
      return detail
    }
  }

  return undefined
}

function assertValidSelectedVariants(
  input: {
    projectId: string
    runId: string
    reviewId: string
    selectedVariants?: RunSelectedProposalVariantRecord[]
  },
  proposalSet?: ProposalSetArtifactDetailRecord,
) {
  if (!input.selectedVariants?.length) {
    return
  }

  if (!proposalSet) {
    throw badRequest('selectedVariants cannot be submitted because the run has no proposal set.', {
      code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
      detail: {
        projectId: input.projectId,
        runId: input.runId,
        reviewId: input.reviewId,
      },
    })
  }

  const proposalsById = new Map(proposalSet.proposals.map((proposal) => [proposal.id, proposal]))
  const seenProposalIds = new Set<string>()

  input.selectedVariants.forEach((selectedVariant, index) => {
    if (seenProposalIds.has(selectedVariant.proposalId)) {
      throw badRequest(`selectedVariants proposalId ${selectedVariant.proposalId} must be unique.`, {
        code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
        detail: {
          projectId: input.projectId,
          runId: input.runId,
          reviewId: input.reviewId,
          proposalId: selectedVariant.proposalId,
          index,
        },
      })
    }

    seenProposalIds.add(selectedVariant.proposalId)

    const proposal = proposalsById.get(selectedVariant.proposalId)
    if (!proposal) {
      throw badRequest(`selectedVariants proposalId ${selectedVariant.proposalId} does not exist in the run proposal set.`, {
        code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
        detail: {
          projectId: input.projectId,
          runId: input.runId,
          reviewId: input.reviewId,
          proposalId: selectedVariant.proposalId,
          index,
        },
      })
    }

    if (!proposal.variants?.some((variant) => variant.id === selectedVariant.variantId)) {
      throw badRequest(`selectedVariants variantId ${selectedVariant.variantId} does not exist for proposal ${selectedVariant.proposalId}.`, {
        code: 'INVALID_RUN_REVIEW_SELECTED_VARIANTS',
        detail: {
          projectId: input.projectId,
          runId: input.runId,
          reviewId: input.reviewId,
          proposalId: selectedVariant.proposalId,
          variantId: selectedVariant.variantId,
          index,
        },
      })
    }
  })
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
  }
}

function collectArtifactSourceEventIds(events: RunEventRecord[], artifact: SceneRunArtifactRecord) {
  return events
    .filter((event) => event.refs?.some((ref) => ref.kind === artifact.kind && ref.id === artifact.id))
    .map((event) => event.id)
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

function assertNoArtifactIdConflicts(
  state: RunState,
  input: {
    projectId: string
    runId: string
  },
  nextArtifacts: SceneRunArtifactRecord[],
) {
  const existingIds = new Set(state.artifacts.map((artifact) => artifact.id))
  const nextIds = new Set<string>()

  for (const artifact of nextArtifacts) {
    if (existingIds.has(artifact.id) || nextIds.has(artifact.id)) {
      throw conflict(`Run artifact id ${artifact.id} conflicts within run ${input.runId}.`, {
        code: 'RUN_ARTIFACT_ID_CONFLICT',
        detail: {
          projectId: input.projectId,
          runId: input.runId,
          artifactId: artifact.id,
        },
      })
    }

    nextIds.add(artifact.id)
  }
}

function indexRunReadSurfaces(state: RunState) {
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
        sourceInvocationIds: agentInvocationDetails.map((detail) => detail.id),
        selectedVariants: state.selectedVariants,
      })
    : undefined

  if (proposalSetDetail) {
    artifactDetailsById.set(proposalSetDetail.id, proposalSetDetail)
    artifactSummaries.push(toArtifactSummary(proposalSetDetail))
  }

  const canonPatchArtifact = state.artifacts.find((artifact) => artifact.kind === 'canon-patch')
  const acceptedDecision = state.latestReviewDecision === 'accept-with-edit' ? 'accept-with-edit' : 'accept'
  const canonPatchDetail = canonPatchArtifact && proposalSetDetail
    ? buildCanonPatchDetail({
        artifact: canonPatchArtifact,
        sourceEventIds: collectArtifactSourceEventIds(state.events, canonPatchArtifact),
        decision: acceptedDecision,
        sourceProposalSetId: proposalSetDetail.id,
        selectedVariants: state.selectedVariants,
      })
    : undefined

  if (canonPatchDetail) {
    artifactDetailsById.set(canonPatchDetail.id, canonPatchDetail)
    artifactSummaries.push(toArtifactSummary(canonPatchDetail))
  }

  const proseDraftArtifact = state.artifacts.find((artifact) => artifact.kind === 'prose-draft')
  const proseDraftDetail = proseDraftArtifact && canonPatchDetail
    ? buildProseDraftDetail({
        artifact: proseDraftArtifact,
        sourceEventIds: collectArtifactSourceEventIds(state.events, proseDraftArtifact),
        sourceCanonPatchId: canonPatchDetail.id,
        sourceProposalIds: canonPatchDetail.acceptedProposalIds,
        selectedVariants: canonPatchDetail.selectedVariants,
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
}

function isRunReviewDecisionKind(value: string): value is RunReviewDecisionKind {
  return value === 'accept'
    || value === 'accept-with-edit'
    || value === 'request-rewrite'
    || value === 'reject'
}

function buildFixturePlannerResult(sceneId: string): ScenePlannerGatewayResult {
  return {
    output: buildDefaultPlannerOutput(sceneId),
    provenance: {
      provider: 'fixture',
      modelId: FIXTURE_SCENE_PLANNER_MODEL_ID,
    },
  }
}

function createScenePlannerRequest(input: StartSceneRunInput): ScenePlannerGatewayRequest {
  const modeLabel = input.mode ?? 'continue'
  const note = trimNote(input.note)
  const sceneName = formatSceneName(input.sceneId)

  return {
    sceneId: input.sceneId,
    instructions: 'Return scene-planning proposals only.',
    input: note
      ? `Context packet for ${sceneName}. Requested mode: ${modeLabel}. Editorial note: ${note}.`
      : `Context packet for ${sceneName}. Requested mode: ${modeLabel}.`,
  }
}

function createSeedRun(): {
  projectId: string
  sceneId: string
  sequence: number
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
  latestReviewDecision?: RunReviewDecisionKind
} {
  const projectId = DEFAULT_PROJECT_ID
  const sceneId = 'scene-midnight-platform'
  const sequence = 1
  const plannerResult = buildFixturePlannerResult(sceneId)
  const workflow = startSceneRunWorkflow({
    sceneId,
    sequence,
    plannerOutput: plannerResult.output,
    plannerProvenance: plannerResult.provenance,
  }, {
    buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
  })
  const events = clone(workflow.events)
  if (events[0]) {
    events[0] = {
      ...events[0],
      summary: 'Scene run request accepted.',
    }
  }
  const run: RunRecord = {
    ...workflow.run,
    title: 'Midnight platform scene run',
    summary: 'Planner and writer output are ready for editorial review.',
  }

  return {
    projectId,
    sceneId,
    sequence,
    run,
    events,
    artifacts: workflow.artifacts,
  }
}

export interface RunFixtureStore {
  reset(): void
  clearProject(projectId: string): void
  exportProjectState(projectId: string): PersistedRunStore | undefined
  hydrateProjectState(projectId: string, snapshot: PersistedRunStore): void
  startSceneRun(projectId: string, input: StartSceneRunInput): Promise<RunRecord>
  getRun(projectId: string, runId: string): RunRecord | null
  getRunEvents(projectId: string, input: { runId: string; cursor?: string }): RunEventsPageRecord
  listRunArtifacts(projectId: string, runId: string): RunArtifactSummaryRecord[] | null
  getRunArtifact(projectId: string, runId: string, artifactId: string): RunArtifactDetailRecord | null
  getRunTrace(projectId: string, runId: string): RunTraceResponse | null
  submitRunReviewDecision(projectId: string, input: SubmitRunReviewDecisionInput): RunRecord
}

export function createRunFixtureStore(options: {
  scenePlannerGateway?: ScenePlannerGatewayLike
} = {}): RunFixtureStore {
  const runStatesByProjectId = new Map<string, Map<string, RunState>>()
  const sceneRunSequenceByProjectId = new Map<string, Map<string, number>>()
  const scenePlannerGateway = options.scenePlannerGateway ?? createScenePlannerGateway({
    modelProvider: 'fixture',
  })

  function getRunBucket(projectId: string, createIfMissing = false) {
    const existing = runStatesByProjectId.get(projectId)
    if (existing) {
      return existing
    }

    if (!createIfMissing) {
      return undefined
    }

    const next = new Map<string, RunState>()
    runStatesByProjectId.set(projectId, next)
    return next
  }

  function getSequenceBucket(projectId: string, createIfMissing = false) {
    const existing = sceneRunSequenceByProjectId.get(projectId)
    if (existing) {
      return existing
    }

    if (!createIfMissing) {
      return undefined
    }

    const next = new Map<string, number>()
    sceneRunSequenceByProjectId.set(projectId, next)
    return next
  }

  function createRunState(
    sequence: number,
    run: RunRecord,
    events: RunEventRecord[],
    artifacts: SceneRunArtifactRecord[],
    latestReviewDecision?: RunReviewDecisionKind,
    selectedVariants?: RunSelectedProposalVariantRecord[],
  ) {
    const state: RunState = {
      sequence,
      run: clone(run),
      events: clone(events),
      artifacts: clone(artifacts),
      artifactDetailsById: new Map<string, RunArtifactDetailRecord>(),
      artifactSummaries: [],
      latestReviewDecision,
      selectedVariants: cloneSelectedVariants(selectedVariants),
      traceLinksById: new Map<string, RunTraceLinkRecord>(),
      traceNodesById: new Map<string, RunTraceNodeRecord>(),
      traceSummary: {
        proposalSetCount: 0,
        canonPatchCount: 0,
        proseDraftCount: 0,
        missingTraceCount: 0,
      },
    }
    indexRunReadSurfaces(state)
    return state
  }

  function storeRunState(projectId: string, state: RunState) {
    getRunBucket(projectId, true)!.set(state.run.id, state)
  }

  function serializeRunState(state: RunState): PersistedRunStateRecord {
    return toJsonClone({
      sequence: state.sequence,
      run: state.run,
      events: state.events,
      artifacts: state.artifacts,
      latestReviewDecision: state.latestReviewDecision,
      selectedVariants: state.selectedVariants,
    })
  }

  function isPersistedRunStateRecord(value: unknown): value is PersistedRunStateRecord {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false
    }

    const candidate = value as Partial<PersistedRunStateRecord>
    return typeof candidate.sequence === 'number'
      && typeof candidate.run?.id === 'string'
      && Array.isArray(candidate.events)
      && Array.isArray(candidate.artifacts)
      && (candidate.latestReviewDecision === undefined || isRunReviewDecisionKind(candidate.latestReviewDecision))
      && (candidate.selectedVariants === undefined || Array.isArray(candidate.selectedVariants))
  }

  function requireRunState(projectId: string, runId: string) {
    const state = getRunBucket(projectId)?.get(runId)
    if (!state) {
      throw notFound(`Run ${runId} was not found.`, {
        code: 'RUN_NOT_FOUND',
        detail: { projectId, runId },
      })
    }

    return state
  }

  function reset() {
    runStatesByProjectId.clear()
    sceneRunSequenceByProjectId.clear()

    const seed = createSeedRun()
    storeRunState(seed.projectId, createRunState(
      seed.sequence,
      seed.run,
      seed.events,
      seed.artifacts,
      seed.latestReviewDecision,
    ))
    getSequenceBucket(seed.projectId, true)!.set(seed.sceneId, seed.sequence)
  }

  reset()

  return {
    reset,
    clearProject(projectId) {
      runStatesByProjectId.delete(projectId)
      sceneRunSequenceByProjectId.delete(projectId)
    },
    exportProjectState(projectId) {
      const runBucket = getRunBucket(projectId)
      const sequenceBucket = getSequenceBucket(projectId)
      if (!runBucket?.size && !sequenceBucket?.size) {
        return undefined
      }

      return {
        runStates: [...(runBucket?.values() ?? [])]
          .sort((left, right) => left.sequence - right.sequence)
          .map((state) => serializeRunState(state) as unknown as PersistedRunStore['runStates'][number]),
        sceneSequences: toJsonClone(Object.fromEntries(sequenceBucket?.entries() ?? [])),
      }
    },
    hydrateProjectState(projectId, snapshot) {
      const validatedStates = [] as RunState[]
      for (const serializedState of snapshot.runStates) {
        if (!isPersistedRunStateRecord(serializedState)) {
          return
        }

        try {
          validatedStates.push(createRunState(
            serializedState.sequence,
            serializedState.run,
            serializedState.events,
            serializedState.artifacts,
            serializedState.latestReviewDecision,
            serializedState.selectedVariants,
          ))
        } catch {
          return
        }
      }

      this.clearProject(projectId)

      const sequenceBucket = getSequenceBucket(projectId, true)
      for (const [sceneId, sequence] of Object.entries(snapshot.sceneSequences)) {
        sequenceBucket!.set(sceneId, sequence)
      }

      for (const state of validatedStates) {
        storeRunState(projectId, state)
      }
    },
    async startSceneRun(projectId, input) {
      const sequenceBucket = getSequenceBucket(projectId, true)
      const nextSequence = (sequenceBucket?.get(input.sceneId) ?? 0) + 1
      sequenceBucket!.set(input.sceneId, nextSequence)
      const plannerResult = await scenePlannerGateway.generate(createScenePlannerRequest(input))

      const workflow = startSceneRunWorkflow({
        ...input,
        sequence: nextSequence,
        plannerOutput: plannerResult.output,
        plannerProvenance: plannerResult.provenance,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })

      storeRunState(projectId, createRunState(
        nextSequence,
        workflow.run,
        workflow.events,
        workflow.artifacts,
      ))
      return clone(workflow.run)
    },
    getRun(projectId, runId) {
      const run = getRunBucket(projectId)?.get(runId)?.run
      return run ? clone(run) : null
    },
    getRunEvents(projectId, { runId, cursor }) {
      const state = requireRunState(projectId, runId)
      const startIndex = cursor
        ? (() => {
            const cursorIndex = state.events.findIndex((event) => event.id === cursor)
            if (cursorIndex < 0) {
              throw conflict(`Run cursor ${cursor} does not exist for ${runId}.`, {
                code: 'RUN_EVENTS_CURSOR_CONFLICT',
                detail: { projectId, runId, cursor },
              })
            }

            return cursorIndex + 1
          })()
        : 0

      const pageEvents = state.events.slice(startIndex, startIndex + EVENT_PAGE_SIZE)
      const hasMore = startIndex + pageEvents.length < state.events.length

      return {
        runId,
        events: clone(pageEvents),
        nextCursor: hasMore ? pageEvents.at(-1)?.id : undefined,
      }
    },
    listRunArtifacts(projectId, runId) {
      const artifacts = getRunBucket(projectId)?.get(runId)?.artifactSummaries
      return artifacts ? clone(artifacts) : null
    },
    getRunArtifact(projectId, runId, artifactId) {
      const artifact = getRunBucket(projectId)?.get(runId)?.artifactDetailsById.get(artifactId)
      return artifact ? clone(artifact) : null
    },
    getRunTrace(projectId, runId) {
      const state = getRunBucket(projectId)?.get(runId)
      if (!state) {
        return null
      }

      return clone({
        runId,
        nodes: [...state.traceNodesById.values()],
        links: [...state.traceLinksById.values()],
        summary: state.traceSummary,
      })
    },
    submitRunReviewDecision(projectId, input) {
      if (!isRunReviewDecisionKind(input.decision)) {
        throw badRequest(`Unsupported run review decision "${String(input.decision)}".`, {
          code: 'INVALID_RUN_REVIEW_DECISION',
          detail: {
            projectId,
            runId: input.runId,
            decision: input.decision,
            allowedDecisions: ['accept', 'accept-with-edit', 'request-rewrite', 'reject'],
          },
        })
      }

      const state = requireRunState(projectId, input.runId)
      if (state.run.pendingReviewId !== input.reviewId) {
        throw conflict(`Pending review ${input.reviewId} does not match ${state.run.id}.`, {
          code: 'RUN_REVIEW_CONFLICT',
          detail: { projectId, runId: input.runId, reviewId: input.reviewId },
        })
      }
      assertValidSelectedVariants({
        projectId,
        runId: input.runId,
        reviewId: input.reviewId,
        selectedVariants: input.selectedVariants,
      }, findProposalSetDetail(state))

      const note = trimNote(input.note)
      const transition = applySceneRunReviewDecisionTransition({
        runId: input.runId,
        sceneId: state.run.scopeId,
        sequence: state.sequence,
        priorEventCount: state.events.length,
        reviewId: input.reviewId,
        decision: input.decision,
        note,
        patchId: input.patchId,
        selectedVariants: input.selectedVariants,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })

      assertNoArtifactIdConflicts(state, {
        projectId,
        runId: input.runId,
      }, transition.generatedArtifacts)

      state.events.push(...clone(transition.appendedEvents))
      state.artifacts.push(...clone(transition.generatedArtifacts))
      state.run.status = transition.nextRun.status
      state.run.summary = transition.nextRun.summary
      state.run.completedAtLabel = transition.nextRun.completedAtLabel
      state.run.pendingReviewId = transition.nextRun.pendingReviewId
      state.run.latestEventId = state.events.at(-1)?.id
      state.run.eventCount = state.events.length
      state.latestReviewDecision = input.decision
      state.selectedVariants = cloneSelectedVariants(input.selectedVariants)
      indexRunReadSurfaces(state)

      return clone(state.run)
    },
  }
}
