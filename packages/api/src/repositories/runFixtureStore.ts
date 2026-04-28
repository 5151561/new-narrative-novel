import type {
  CancelRunInput,
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
  ResumeRunInput,
  RetryRunInput,
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
  isModelGatewayExecutionError,
  isModelGatewayMissingConfigError,
} from '../orchestration/modelGateway/modelGatewayErrors.js'
import {
  createSceneProseWriterGateway,
  type SceneProseWriterGatewayRequest,
  type SceneProseWriterGatewayResult,
} from '../orchestration/modelGateway/sceneProseWriterGateway.js'
import {
  buildAgentInvocationDetail,
  buildCanonPatchDetail,
  buildContextPacketDetail,
  buildProposalSetDetail,
  buildProseDraftDetail,
} from '../orchestration/sceneRun/sceneRunArtifactDetails.js'
import {
  isSceneContextPacketRecord,
  renderSceneContextPacketForPlanner,
  renderSceneContextPacketForWriter,
  type SceneContextPacketRecord,
} from '../orchestration/contextBuilder/sceneContextBuilder.js'
import {
  buildDefaultPlannerOutput,
  createContextPacketArtifact,
  createAgentInvocationArtifact,
  createCanonPatchArtifact,
  createProseDraftArtifact,
} from '../orchestration/sceneRun/sceneRunArtifacts.js'
import {
  buildAgentInvocationId,
  buildContextPacketId,
  buildRunId,
} from '../orchestration/sceneRun/sceneRunIds.js'
import { createRunEvent } from '../orchestration/sceneRun/sceneRunEventFactory.js'
import {
  applySceneRunReviewDecisionTransition,
  createCancelSceneRunTransition,
  createRetryScheduledSceneRunTransition,
} from '../orchestration/sceneRun/sceneRunTransitions.js'
import type { SceneRunArtifactRecord } from '../orchestration/sceneRun/sceneRunRecords.js'
import {
  buildAcceptedRunTrace,
  buildInitialRunTrace,
  buildRejectedRunTrace,
  buildRewriteRunTrace,
} from '../orchestration/sceneRun/sceneRunTraceLinks.js'
import { buildFixtureSceneRunTimelineLabel } from '../orchestration/sceneRun/sceneRunTimeline.js'
import {
  hydrateDurableRunStates,
  serializeDurableRunState,
  type DurablePersistedRunStateRecord,
} from '../orchestration/sceneRun/durableRunWorkflowAdapter.js'
import { startSceneRunWorkflow } from '../orchestration/sceneRun/sceneRunWorkflow.js'
import type { PersistedRunStore } from './project-state-persistence.js'
import { createRunEventStreamBroker } from './run-event-stream-broker.js'

const EVENT_PAGE_SIZE = 4
const DEFAULT_PROJECT_ID = 'book-signal-arc'

interface ScenePlannerGatewayLike {
  generate(request: ScenePlannerGatewayRequest): Promise<ScenePlannerGatewayResult>
}

interface SceneProseWriterGatewayLike {
  generate(request: SceneProseWriterGatewayRequest): Promise<SceneProseWriterGatewayResult>
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

function localizeText(en: string) {
  return {
    en,
    'zh-CN': en,
  }
}

function readPersistedContextPacket(artifact: SceneRunArtifactRecord | undefined) {
  const packet = artifact?.meta?.contextPacket
  return isSceneContextPacketRecord(packet) ? packet : undefined
}

function findProposalSetDetail(state: RunState): ProposalSetArtifactDetailRecord | undefined {
  for (const detail of state.artifactDetailsById.values()) {
    if (detail.kind === 'proposal-set') {
      return detail
    }
  }

  return undefined
}

function collectAcceptedProposalIds(
  proposalSet: ProposalSetArtifactDetailRecord | undefined,
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
    ...(detail.usage ? { usage: detail.usage } : {}),
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

function createFailedRunUsage(modelId: string) {
  return {
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostUsd: 0,
    provider: 'openai-compatible' as const,
    modelId,
  }
}

function createFailedRunRuntimeSummary(failureClass: 'provider_error' | 'invalid_output', retryable: boolean) {
  return {
    health: 'failed' as const,
    costLabel: '$0.0000 est.',
    tokenLabel: '0 tokens',
    failureClassLabel: failureClass === 'provider_error' ? 'Provider error' : 'Invalid output',
    nextActionLabel: retryable
      ? 'Repair model settings or retry the run after the runtime issue is resolved.'
      : 'Repair model settings before running this scene again.',
  }
}

function createFailedGatewayProvenance(input: {
  modelId: string
  providerId?: string
  providerLabel?: string
}): ScenePlannerGatewayResult['provenance'] | SceneProseWriterGatewayResult['provenance'] {
  if (input.providerId && input.providerLabel) {
    return {
      provider: 'openai-compatible',
      providerId: input.providerId,
      providerLabel: input.providerLabel,
      modelId: input.modelId,
    }
  }

  return {
    provider: 'fixture',
    modelId: input.modelId,
    fallbackReason: 'provider-error',
  }
}

function createFailedStartRunState(input: {
  contextPacket: SceneContextPacketRecord
  failureClass: 'provider_error' | 'invalid_output'
  failureMessage: string
  modelId: string
  providerId?: string
  providerLabel?: string
  retryOfRunId?: string
  resumableFromEventId?: string
  sceneId: string
  sequence: number
}) {
  const runId = buildRunId(input.sceneId, input.sequence)
  const contextPacketId = buildContextPacketId(input.sceneId, input.sequence)
  const plannerInvocationId = buildAgentInvocationId(input.sceneId, input.sequence, 1)
  const events = [
    createRunEvent(
      runId,
      1,
      'run_created',
      'Run created',
      'Scene run request accepted.',
      undefined,
      { buildTimelineLabel: buildFixtureSceneRunTimelineLabel },
    ),
    createRunEvent(
      runId,
      2,
      'run_started',
      'Run started',
      'Narrative runtime started the scene run.',
      undefined,
      { buildTimelineLabel: buildFixtureSceneRunTimelineLabel },
    ),
    createRunEvent(
      runId,
      3,
      'context_packet_built',
      'Context packet built',
      'Runtime assembled the scene context packet.',
      [{ kind: 'context-packet', id: contextPacketId, label: 'Scene context packet' }],
      { buildTimelineLabel: buildFixtureSceneRunTimelineLabel },
    ),
    createRunEvent(
      runId,
      4,
      'agent_invocation_started',
      'Planner invocation started',
      'Planning agent invocation started.',
      [{ kind: 'agent-invocation', id: plannerInvocationId, label: 'Planner' }],
      { buildTimelineLabel: buildFixtureSceneRunTimelineLabel },
    ),
    createRunEvent(
      runId,
      5,
      'run_failed',
      'Run failed',
      input.failureMessage,
      undefined,
      {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
        metadata: {
          failureClass: input.failureClass,
        },
      },
    ),
  ]
  const usage = createFailedRunUsage(input.modelId)
  const artifacts = [
    createContextPacketArtifact({
      runId,
      sceneId: input.sceneId,
      sequence: input.sequence,
      contextPacket: input.contextPacket,
    }),
    createAgentInvocationArtifact({
      runId,
      sceneId: input.sceneId,
      sequence: input.sequence,
      index: 1,
      role: 'planner',
      provenance: createFailedGatewayProvenance(input),
      usage,
      failureDetail: {
        failureClass: input.failureClass,
        message: input.failureMessage,
        modelId: input.modelId,
        provider: 'openai-compatible',
        retryable: true,
        sourceEventIds: [events[4]!.id],
      },
    }),
  ]
  const run: RunRecord = {
    id: runId,
    scope: 'scene',
    scopeId: input.sceneId,
    status: 'failed',
    title: `${input.sceneId} run`,
    summary: input.failureClass === 'provider_error'
      ? 'Scene run failed before review because the planner model request failed.'
      : 'Scene run failed before review because the planner returned invalid structured output.',
    startedAtLabel: events[0]?.createdAtLabel,
    completedAtLabel: events[4]?.createdAtLabel,
    latestEventId: events[4]?.id,
    failureClass: input.failureClass,
    failureMessage: input.failureMessage,
    retryOfRunId: input.retryOfRunId,
    resumableFromEventId: input.resumableFromEventId,
    usage,
    runtimeSummary: createFailedRunRuntimeSummary(input.failureClass, true),
    eventCount: events.length,
  }

  return {
    sequence: input.sequence,
    run,
    events,
    artifacts,
    artifactDetailsById: new Map(),
    artifactSummaries: [],
    selectedVariants: [],
    traceLinksById: new Map(),
    traceNodesById: new Map(),
    traceSummary: {
      proposalSetCount: 0,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    },
  } satisfies RunState
}

function applyAcceptedProseGenerationFailure(state: RunState, input: {
  decision: Extract<RunReviewDecisionKind, 'accept' | 'accept-with-edit'>
  failureClass: 'provider_error' | 'invalid_output'
  failureMessage: string
  modelId: string
  providerId?: string
  providerLabel?: string
  reviewId: string
  selectedVariants?: RunSelectedProposalVariantRecord[]
}) {
  const writerInvocationArtifact = createAgentInvocationArtifact({
    runId: state.run.id,
    sceneId: state.run.scopeId,
    sequence: state.sequence,
    index: 3,
    role: 'writer',
    provenance: createFailedGatewayProvenance(input),
    usage: createFailedRunUsage(input.modelId),
    failureDetail: {
      failureClass: input.failureClass,
      message: input.failureMessage,
      modelId: input.modelId,
      provider: 'openai-compatible',
      retryable: true,
      sourceEventIds: [],
    },
  })
  const reviewDecisionEvent = createRunEvent(
    state.run.id,
    state.events.length + 1,
    'review_decision_submitted',
    'Review decision submitted',
    input.decision === 'accept-with-edit'
      ? 'Review accepted the proposal set with edits, but prose generation did not complete.'
      : 'Review accepted the proposal set, but prose generation did not complete.',
    [{ kind: 'review', id: input.reviewId, label: 'Editorial review' }],
    {
      buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      metadata: {
        selectedVariantCount: input.selectedVariants?.length ?? 0,
      },
    },
  )
  const failedEvent = createRunEvent(
    state.run.id,
    state.events.length + 2,
    'run_failed',
    'Run failed',
    input.failureMessage,
    [{ kind: 'agent-invocation', id: writerInvocationArtifact.id, label: 'Writer' }],
    {
      buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      metadata: {
        failureClass: input.failureClass,
      },
    },
  )
  writerInvocationArtifact.meta = {
    ...writerInvocationArtifact.meta,
    failureDetail: {
      ...(writerInvocationArtifact.meta?.failureDetail as Record<string, unknown>),
      sourceEventIds: [failedEvent.id],
    },
  }

  state.events.push(reviewDecisionEvent, failedEvent)
  state.artifacts.push(writerInvocationArtifact)
  state.run.status = 'failed'
  state.run.summary = 'Scene run failed while generating accepted prose after review.'
  state.run.completedAtLabel = failedEvent.createdAtLabel
  state.run.pendingReviewId = undefined
  state.run.latestEventId = failedEvent.id
  state.run.eventCount = state.events.length
  state.run.failureClass = input.failureClass
  state.run.failureMessage = input.failureMessage
  state.run.usage = createFailedRunUsage(input.modelId)
  state.run.runtimeSummary = createFailedRunRuntimeSummary(input.failureClass, true)
}

function createScenePlannerRequest(
  input: StartSceneRunInput,
  contextPacket: SceneContextPacketRecord,
): ScenePlannerGatewayRequest {
  return {
    sceneId: input.sceneId,
    instructions: 'Return scene-planning proposals only.',
    input: renderSceneContextPacketForPlanner(contextPacket, {
      mode: input.mode,
      note: input.note,
    }),
  }
}

function createSeedRun(
  buildPersistedContextPacket?: (input: { projectId: string; sceneId: string; sequence: number }) => SceneContextPacketRecord,
): {
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
  const contextPacket = buildPersistedContextPacket?.({
    projectId,
    sceneId,
    sequence,
  })
  const workflow = startSceneRunWorkflow({
    sceneId,
    sequence,
    plannerOutput: plannerResult.output,
    plannerProvenance: plannerResult.provenance,
    ...(contextPacket ? { contextPacket } : {}),
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
    artifacts: workflow.artifacts.map((artifact) => {
      if (artifact.kind !== 'context-packet' || !buildPersistedContextPacket) {
        return artifact
      }

      return createContextPacketArtifact({
        runId: run.id,
        sceneId,
        sequence,
        contextPacket: buildPersistedContextPacket({
          projectId,
          sceneId,
          sequence,
        }),
      })
    }),
  }
}

export interface RunFixtureStore {
  reset(): void
  clearProject(projectId: string): void
  exportProjectState(projectId: string): PersistedRunStore | undefined
  hydrateProjectState(projectId: string, snapshot: PersistedRunStore): void
  startSceneRun(projectId: string, input: StartSceneRunInput): Promise<RunRecord>
  retryRun(projectId: string, input: RetryRunInput): Promise<RunRecord>
  cancelRun(projectId: string, input: CancelRunInput): Promise<RunRecord>
  resumeRun(projectId: string, input: ResumeRunInput): Promise<RunRecord>
  getRun(projectId: string, runId: string): RunRecord | null
  getRunEvents(projectId: string, input: { runId: string; cursor?: string }): RunEventsPageRecord
  streamRunEvents(projectId: string, input: { runId: string; cursor?: string; signal?: AbortSignal }): AsyncIterable<RunEventsPageRecord>
  supportsRunEventStream(): boolean
  listRunArtifacts(projectId: string, runId: string): RunArtifactSummaryRecord[] | null
  getRunArtifact(projectId: string, runId: string, artifactId: string): RunArtifactDetailRecord | null
  getRunTrace(projectId: string, runId: string): RunTraceResponse | null
  submitRunReviewDecision(projectId: string, input: SubmitRunReviewDecisionInput): Promise<RunRecord>
}

export function createRunFixtureStore(options: {
  scenePlannerGateway?: ScenePlannerGatewayLike
  sceneProseWriterGateway?: SceneProseWriterGatewayLike
  runEventStreamEnabled?: boolean
  buildSceneContextPacket?: (input: { projectId: string; sceneId: string; sequence: number }) => SceneContextPacketRecord
} = {}): RunFixtureStore {
  const runStatesByProjectId = new Map<string, Map<string, RunState>>()
  const sceneRunSequenceByProjectId = new Map<string, Map<string, number>>()
  const runEventStreamBroker = createRunEventStreamBroker()
  const runEventStreamEnabled = options.runEventStreamEnabled ?? true
  const scenePlannerGateway = options.scenePlannerGateway ?? createScenePlannerGateway({
    modelProvider: 'fixture',
  })
  const sceneProseWriterGateway = options.sceneProseWriterGateway ?? createSceneProseWriterGateway({
    modelProvider: 'fixture',
  })
  const buildPersistedContextPacket = options.buildSceneContextPacket
    ?? ((input: { projectId: string; sceneId: string; sequence: number }) => {
      const sceneName = formatSceneName(input.sceneId)
      const packetId = `ctx-${input.sceneId}-run-${String(input.sequence).padStart(3, '0')}`

      return {
        version: 'scene-context-v1' as const,
        packetId,
        sceneId: input.sceneId,
        narrative: {
          bookPremise: localizeText(`Fixture premise for ${sceneName}.`),
          chapterGoal: localizeText(`Fixture chapter goal for ${sceneName}.`),
          sceneObjective: localizeText(`Preserve the next visible beat for ${sceneName}.`),
          sceneSetup: localizeText(`${sceneName} remains staged for a fixture-only planning pass.`),
          currentState: localizeText('Current scene state remains fixture-backed until project truth is injected.'),
          castSummary: localizeText(`Fixture cast summary for ${sceneName}.`),
          locationSummary: localizeText(`Fixture location summary for ${sceneName}.`),
          styleInstruction: localizeText('Keep the fixture output concise and traceable.'),
          visibilityExplanation: localizeText('Fixture packet keeps the same included, excluded, and redacted counts.'),
          budgetSummary: localizeText(`Budget ${1500 + input.sequence * 100} tokens.`),
        },
        sections: [
          {
            id: `${packetId}-section-brief`,
            title: localizeText('Scene brief'),
            summary: localizeText(`Fixture context packet keeps ${sceneName} readable for planning.`),
            itemCount: 3,
          },
        ],
        includedCanonFacts: [
          {
            id: `${packetId}-canon-fact-001`,
            label: localizeText('Scene objective'),
            value: localizeText(`Preserve the next visible beat for ${sceneName}.`),
          },
        ],
        includedAssets: [
          {
            assetId: 'asset-ren-voss',
            label: localizeText('Ren Voss'),
            kind: 'character',
            reason: localizeText('Fixture POV anchor.'),
          },
          {
            assetId: 'asset-mei-arden',
            label: localizeText('Mei Arden'),
            kind: 'character',
            reason: localizeText('Fixture counter-pressure anchor.'),
          },
          {
            assetId: 'asset-midnight-platform',
            label: localizeText('Midnight Platform'),
            kind: 'location',
            reason: localizeText('Fixture staging anchor.'),
          },
        ],
        excludedPrivateFacts: [
          {
            id: `${packetId}-excluded-001`,
            label: localizeText('Deferred reveal'),
            reason: localizeText('Fixture private reveal remains excluded.'),
          },
        ],
        assetActivations: buildContextPacketDetail({
          artifact: createContextPacketArtifact({
            runId: buildRunId(input.sceneId, input.sequence),
            sceneId: input.sceneId,
            sequence: input.sequence,
          }),
          sourceEventIds: [],
        }).assetActivations ?? [],
        activationSummary: {
          includedAssetCount: 3,
          excludedAssetCount: 1,
          redactedAssetCount: 1,
          targetAgentCount: 4,
          warningCount: 1,
        },
        outputSchemaLabel: localizeText('Scene context packet schema'),
        tokenBudgetLabel: localizeText(`Target budget ${1500 + input.sequence * 100} tokens`),
      }
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

  function toRunStreamKey(projectId: string, runId: string) {
    return `${projectId}::${runId}`
  }

  function createRunStateFromPersistedState(serialized: DurablePersistedRunStateRecord) {
    const state: RunState = {
      sequence: serialized.sequence,
      run: clone(serialized.run),
      events: clone(serialized.events),
      artifacts: clone(serialized.artifacts),
      artifactDetailsById: new Map<string, RunArtifactDetailRecord>(),
      artifactSummaries: [],
      latestReviewDecision: serialized.latestReviewDecision,
      selectedVariants: cloneSelectedVariants(serialized.selectedVariants),
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

  function createRunState(
    sequence: number,
    run: RunRecord,
    events: RunEventRecord[],
    artifacts: SceneRunArtifactRecord[],
    latestReviewDecision?: RunReviewDecisionKind,
    selectedVariants?: RunSelectedProposalVariantRecord[],
  ) {
    return createRunStateFromPersistedState({
      sequence,
      run,
      events,
      artifacts,
      latestReviewDecision,
      selectedVariants,
    })
  }

  function storeRunState(projectId: string, state: RunState) {
    getRunBucket(projectId, true)!.set(state.run.id, state)
  }

  function isTerminalRunStatus(status: RunRecord['status']) {
    return status === 'completed' || status === 'failed' || status === 'cancelled'
  }

  function isAcceptedReviewDecision(decision: RunReviewDecisionKind) {
    return decision === 'accept' || decision === 'accept-with-edit'
  }

  function publishRunEvents(projectId: string, runId: string, events: RunEventRecord[]) {
    if (runEventStreamEnabled && events.length > 0) {
      runEventStreamBroker.publish(toRunStreamKey(projectId, runId), clone(events))
    }
  }

  function completeRunStream(projectId: string, runId: string) {
    if (runEventStreamEnabled) {
      runEventStreamBroker.complete(toRunStreamKey(projectId, runId))
    }
  }

  function createSceneProseWriterRequest(
    state: RunState,
    input: SubmitRunReviewDecisionInput & { decision: Extract<RunReviewDecisionKind, 'accept' | 'accept-with-edit'> },
  ): SceneProseWriterGatewayRequest {
    const proposalSet = findProposalSetDetail(state)
    const acceptedProposalIds = collectAcceptedProposalIds(proposalSet, input.selectedVariants)
    const contextPacket = readPersistedContextPacket(state.artifacts.find((artifact) => artifact.kind === 'context-packet'))

    return {
      task: 'draft',
      sceneId: state.run.scopeId,
      decision: input.decision,
      acceptedProposalIds,
      selectedVariants: cloneSelectedVariants(input.selectedVariants),
      instructions: 'Return structured accepted scene prose with body, excerpt, diffSummary, and relatedAssets.',
      input: contextPacket
        ? renderSceneContextPacketForWriter(contextPacket, {
          decision: input.decision,
          acceptedProposalIds,
          selectedVariantIds: input.selectedVariants?.map((variant) => variant.variantId),
          note: input.note,
        })
        : `Scene: ${formatSceneName(state.run.scopeId)}. Decision: ${input.decision}. Accepted proposals: ${acceptedProposalIds.join(', ') || 'default accepted proposal'}.`,
    }
  }

  function createAcceptedTransitionArtifactsPreview(
    state: RunState,
    input: SubmitRunReviewDecisionInput & { decision: Extract<RunReviewDecisionKind, 'accept' | 'accept-with-edit'> },
  ) {
    const canonPatchArtifact = createCanonPatchArtifact({
      runId: input.runId,
      sceneId: state.run.scopeId,
      sequence: state.sequence,
    })

    return [
      input.patchId
        ? {
            ...canonPatchArtifact,
            id: input.patchId,
          }
        : canonPatchArtifact,
      createAgentInvocationArtifact({
        runId: input.runId,
        sceneId: state.run.scopeId,
        sequence: state.sequence,
        index: 3,
        role: 'writer',
      }),
      createProseDraftArtifact({
        runId: input.runId,
        sceneId: state.run.scopeId,
        sequence: state.sequence,
      }),
    ]
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

  function resolveEventStartIndex(state: RunState, projectId: string, runId: string, cursor?: string) {
    if (!cursor) {
      return 0
    }

    const cursorIndex = state.events.findIndex((event) => event.id === cursor)
    if (cursorIndex < 0) {
      throw conflict(`Run cursor ${cursor} does not exist for ${runId}.`, {
        code: 'RUN_EVENTS_CURSOR_CONFLICT',
        detail: { projectId, runId, cursor },
      })
    }

    return cursorIndex + 1
  }

  function reset() {
    runStatesByProjectId.clear()
    sceneRunSequenceByProjectId.clear()
    runEventStreamBroker.reset()

    const seed = createSeedRun(buildPersistedContextPacket)
    storeRunState(seed.projectId, createRunState(
      seed.sequence,
      seed.run,
      seed.events,
      seed.artifacts,
      seed.latestReviewDecision,
    ))
    getSequenceBucket(seed.projectId, true)!.set(seed.sceneId, seed.sequence)
    if (isTerminalRunStatus(seed.run.status)) {
      runEventStreamBroker.complete(toRunStreamKey(seed.projectId, seed.run.id))
    }
  }

  reset()

  return {
    reset,
    clearProject(projectId) {
      const runBucket = getRunBucket(projectId)
      for (const runId of runBucket?.keys() ?? []) {
        runEventStreamBroker.complete(toRunStreamKey(projectId, runId))
      }

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
          .map((state) => serializeDurableRunState(state) as unknown as PersistedRunStore['runStates'][number]),
        sceneSequences: toJsonClone(Object.fromEntries(sequenceBucket?.entries() ?? [])),
      }
    },
    hydrateProjectState(projectId, snapshot) {
      let hydrated: ReturnType<typeof hydrateDurableRunStates<RunState>>
      try {
        hydrated = hydrateDurableRunStates({
          snapshot,
          createRunState: createRunStateFromPersistedState,
        })
      } catch {
        return
      }

      this.clearProject(projectId)

      const sequenceBucket = getSequenceBucket(projectId, true)
      for (const [sceneId, sequence] of Object.entries(hydrated.sceneSequences)) {
        sequenceBucket!.set(sceneId, sequence)
      }

      for (const state of hydrated.states) {
        storeRunState(projectId, state)
        if (isTerminalRunStatus(state.run.status)) {
          runEventStreamBroker.complete(toRunStreamKey(projectId, state.run.id))
        }
      }
    },
    async startSceneRun(projectId, input) {
      const sequenceBucket = getSequenceBucket(projectId, true)
      const nextSequence = (sequenceBucket?.get(input.sceneId) ?? 0) + 1
      sequenceBucket!.set(input.sceneId, nextSequence)
      const contextPacket = buildPersistedContextPacket({
        projectId,
        sceneId: input.sceneId,
        sequence: nextSequence,
      })
      let plannerResult: ScenePlannerGatewayResult
      try {
        plannerResult = await scenePlannerGateway.generate(createScenePlannerRequest(input, contextPacket))
      } catch (error) {
        if (isModelGatewayMissingConfigError(error)) {
          sequenceBucket!.set(input.sceneId, nextSequence - 1)
          throw badRequest('Selected real-model planner binding is missing required OpenAI settings.', {
            code: 'RUN_MODEL_CONFIG_REQUIRED',
            detail: {
              projectId,
              role: error.role,
              sceneId: input.sceneId,
            },
          })
        }

        if (isModelGatewayExecutionError(error)) {
          const failedState = createFailedStartRunState({
            contextPacket,
            failureClass: error.failureClass,
            failureMessage: error.message,
            modelId: error.modelId,
            providerId: error.providerId,
            providerLabel: error.providerLabel,
            sceneId: input.sceneId,
            sequence: nextSequence,
          })
          indexRunReadSurfaces(failedState)
          storeRunState(projectId, failedState)
          publishRunEvents(projectId, failedState.run.id, failedState.events)
          completeRunStream(projectId, failedState.run.id)
          return clone(failedState.run)
        }

        throw error
      }

      const workflow = startSceneRunWorkflow({
        ...input,
        sequence: nextSequence,
        plannerOutput: plannerResult.output,
        plannerProvenance: plannerResult.provenance,
        contextPacket,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })

      const state = createRunState(
        nextSequence,
        workflow.run,
        workflow.events,
        workflow.artifacts.map((artifact) => {
          if (artifact.kind !== 'context-packet') {
            return artifact
          }

          return createContextPacketArtifact({
            runId: workflow.run.id,
            sceneId: input.sceneId,
            sequence: nextSequence,
            contextPacket,
          })
        }),
      )
      storeRunState(projectId, state)
      publishRunEvents(projectId, workflow.run.id, workflow.events)
      return clone(workflow.run)
    },
    async retryRun(projectId, input) {
      const state = requireRunState(projectId, input.runId)
      const sequenceBucket = getSequenceBucket(projectId, true)
      const nextSequence = (sequenceBucket?.get(state.run.scopeId) ?? state.sequence) + 1
      sequenceBucket!.set(state.run.scopeId, nextSequence)
      const contextPacket = buildPersistedContextPacket({
        projectId,
        sceneId: state.run.scopeId,
        sequence: nextSequence,
      })
      let plannerResult: ScenePlannerGatewayResult
      try {
        plannerResult = await scenePlannerGateway.generate(createScenePlannerRequest({
          sceneId: state.run.scopeId,
          mode: input.mode,
        }, contextPacket))
      } catch (error) {
        if (isModelGatewayMissingConfigError(error)) {
          sequenceBucket!.set(state.run.scopeId, nextSequence - 1)
          throw badRequest('Selected real-model planner binding is missing required OpenAI settings.', {
            code: 'RUN_MODEL_CONFIG_REQUIRED',
            detail: {
              projectId,
              role: error.role,
              runId: input.runId,
            },
          })
        }

        if (isModelGatewayExecutionError(error)) {
          const failedState = createFailedStartRunState({
            contextPacket,
            failureClass: error.failureClass,
            failureMessage: error.message,
            modelId: error.modelId,
            providerId: error.providerId,
            providerLabel: error.providerLabel,
            retryOfRunId: state.run.id,
            sceneId: state.run.scopeId,
            sequence: nextSequence,
          })
          const transition = createRetryScheduledSceneRunTransition({
            runId: state.run.id,
            priorEventCount: state.events.length,
            nextRunId: failedState.run.id,
            mode: input.mode,
          }, {
            buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
          })

          state.events.push(...clone(transition.appendedEvents))
          state.run.latestEventId = state.events.at(-1)?.id
          state.run.eventCount = state.events.length
          indexRunReadSurfaces(state)
          publishRunEvents(projectId, state.run.id, transition.appendedEvents)

          indexRunReadSurfaces(failedState)
          storeRunState(projectId, failedState)
          publishRunEvents(projectId, failedState.run.id, failedState.events)
          completeRunStream(projectId, failedState.run.id)
          return clone(failedState.run)
        }

        throw error
      }
      const workflow = startSceneRunWorkflow({
        sceneId: state.run.scopeId,
        mode: input.mode,
        sequence: nextSequence,
        plannerOutput: plannerResult.output,
        plannerProvenance: plannerResult.provenance,
        contextPacket,
        retryOfRunId: state.run.id,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })
      const transition = createRetryScheduledSceneRunTransition({
        runId: state.run.id,
        priorEventCount: state.events.length,
        nextRunId: workflow.run.id,
        mode: input.mode,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })

      state.events.push(...clone(transition.appendedEvents))
      state.run.latestEventId = state.events.at(-1)?.id
      state.run.eventCount = state.events.length
      indexRunReadSurfaces(state)
      publishRunEvents(projectId, state.run.id, transition.appendedEvents)

      const nextState = createRunState(
        nextSequence,
        workflow.run,
        workflow.events,
        workflow.artifacts.map((artifact) => artifact.kind === 'context-packet'
          ? createContextPacketArtifact({
              runId: workflow.run.id,
              sceneId: state.run.scopeId,
              sequence: nextSequence,
              contextPacket,
            })
          : artifact),
      )
      storeRunState(projectId, nextState)
      publishRunEvents(projectId, workflow.run.id, workflow.events)
      return clone(workflow.run)
    },
    async cancelRun(projectId, input) {
      const state = requireRunState(projectId, input.runId)
      if (state.run.status !== 'queued' && state.run.status !== 'running' && state.run.status !== 'waiting_review') {
        throw conflict(`Run ${input.runId} cannot be cancelled from status ${state.run.status}.`, {
          code: 'RUN_CANCEL_CONFLICT',
          detail: {
            projectId,
            runId: input.runId,
            status: state.run.status,
          },
        })
      }

      const transition = createCancelSceneRunTransition({
        runId: input.runId,
        priorEventCount: state.events.length,
        reason: input.reason,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })
      state.events.push(...clone(transition.appendedEvents))
      state.run.status = transition.nextRun.status
      state.run.summary = transition.nextRun.summary
      state.run.completedAtLabel = transition.nextRun.completedAtLabel
      state.run.pendingReviewId = undefined
      state.run.latestEventId = state.events.at(-1)?.id
      state.run.eventCount = state.events.length
      state.run.cancelRequestedAtLabel = transition.nextRun.cancelRequestedAtLabel
      state.run.failureClass = transition.nextRun.failureClass
      state.run.failureMessage = transition.nextRun.failureMessage
      state.run.resumableFromEventId = transition.nextRun.resumableFromEventId
      indexRunReadSurfaces(state)
      publishRunEvents(projectId, input.runId, transition.appendedEvents)
      completeRunStream(projectId, input.runId)
      return clone(state.run)
    },
    async resumeRun(projectId, input) {
      const state = requireRunState(projectId, input.runId)
      if (state.run.status !== 'failed' || !state.run.resumableFromEventId) {
        throw conflict(`Run ${input.runId} cannot be resumed.`, {
          code: 'RUN_RESUME_CONFLICT',
          detail: {
            projectId,
            runId: input.runId,
            status: state.run.status,
            resumableFromEventId: state.run.resumableFromEventId,
          },
        })
      }

      const sequenceBucket = getSequenceBucket(projectId, true)
      const nextSequence = (sequenceBucket?.get(state.run.scopeId) ?? state.sequence) + 1
      sequenceBucket!.set(state.run.scopeId, nextSequence)
      const contextPacket = buildPersistedContextPacket({
        projectId,
        sceneId: state.run.scopeId,
        sequence: nextSequence,
      })
      let plannerResult: ScenePlannerGatewayResult
      try {
        plannerResult = await scenePlannerGateway.generate(createScenePlannerRequest({
          sceneId: state.run.scopeId,
          mode: 'continue',
          note: `Resume from ${state.run.resumableFromEventId}`,
        }, contextPacket))
      } catch (error) {
        if (isModelGatewayMissingConfigError(error)) {
          sequenceBucket!.set(state.run.scopeId, nextSequence - 1)
          throw badRequest('Selected real-model planner binding is missing required OpenAI settings.', {
            code: 'RUN_MODEL_CONFIG_REQUIRED',
            detail: {
              projectId,
              role: error.role,
              runId: input.runId,
            },
          })
        }

        if (isModelGatewayExecutionError(error)) {
          const failedState = createFailedStartRunState({
            contextPacket,
            failureClass: error.failureClass,
            failureMessage: error.message,
            modelId: error.modelId,
            providerId: error.providerId,
            providerLabel: error.providerLabel,
            retryOfRunId: state.run.id,
            resumableFromEventId: state.run.resumableFromEventId,
            sceneId: state.run.scopeId,
            sequence: nextSequence,
          })
          indexRunReadSurfaces(failedState)
          storeRunState(projectId, failedState)
          publishRunEvents(projectId, failedState.run.id, failedState.events)
          completeRunStream(projectId, failedState.run.id)
          return clone(failedState.run)
        }

        throw error
      }
      const workflow = startSceneRunWorkflow({
        sceneId: state.run.scopeId,
        mode: 'continue',
        note: `Resume from ${state.run.resumableFromEventId}`,
        sequence: nextSequence,
        plannerOutput: plannerResult.output,
        plannerProvenance: plannerResult.provenance,
        contextPacket,
        retryOfRunId: state.run.id,
        resumableFromEventId: state.run.resumableFromEventId,
        resumeSourceRunId: state.run.id,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })

      const nextState = createRunState(
        nextSequence,
        workflow.run,
        workflow.events,
        workflow.artifacts.map((artifact) => artifact.kind === 'context-packet'
          ? createContextPacketArtifact({
              runId: workflow.run.id,
              sceneId: state.run.scopeId,
              sequence: nextSequence,
              contextPacket,
            })
          : artifact),
      )
      storeRunState(projectId, nextState)
      publishRunEvents(projectId, workflow.run.id, workflow.events)
      return clone(workflow.run)
    },
    getRun(projectId, runId) {
      const run = getRunBucket(projectId)?.get(runId)?.run
      return run ? clone(run) : null
    },
    getRunEvents(projectId, { runId, cursor }) {
      const state = requireRunState(projectId, runId)
      const startIndex = resolveEventStartIndex(state, projectId, runId, cursor)
      const pageEvents = state.events.slice(startIndex, startIndex + EVENT_PAGE_SIZE)
      const hasMore = startIndex + pageEvents.length < state.events.length

      return {
        runId,
        events: clone(pageEvents),
        nextCursor: hasMore ? pageEvents.at(-1)?.id : undefined,
      }
    },
    streamRunEvents(projectId, { runId, cursor, signal }) {
      if (!runEventStreamEnabled) {
        return {
          async *[Symbol.asyncIterator]() {},
        }
      }

      const state = requireRunState(projectId, runId)
      const replayEvents = state.events.slice(resolveEventStartIndex(state, projectId, runId, cursor))
      const tailStream = isTerminalRunStatus(state.run.status)
        ? undefined
        : runEventStreamBroker.subscribe(toRunStreamKey(projectId, runId), signal)

      return {
        async *[Symbol.asyncIterator]() {
          if (replayEvents.length > 0) {
            yield {
              runId,
              events: clone(replayEvents),
            }
          }

          if (!tailStream) {
            return
          }

          for await (const events of tailStream) {
            yield {
              runId,
              events: clone(events),
            }
          }
        },
      }
    },
    supportsRunEventStream() {
      return runEventStreamEnabled
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
        ...(state.run.status === 'failed' && state.traceNodesById.size > 0 && state.traceSummary.canonPatchCount === 0 && state.traceSummary.proseDraftCount === 0
          ? { isPartialFailure: true }
          : {}),
        summary: state.traceSummary,
      })
    },
    async submitRunReviewDecision(projectId, input) {
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

      if (isAcceptedReviewDecision(input.decision)) {
        assertNoArtifactIdConflicts(state, {
          projectId,
          runId: input.runId,
        }, createAcceptedTransitionArtifactsPreview(state, {
          ...input,
          decision: input.decision,
        }))
      }

      let proseGeneration: SceneProseWriterGatewayResult | undefined
      if (isAcceptedReviewDecision(input.decision)) {
        try {
          proseGeneration = await sceneProseWriterGateway.generate(createSceneProseWriterRequest(state, {
            ...input,
            decision: input.decision,
          }))
        } catch (error) {
          if (isModelGatewayMissingConfigError(error)) {
            throw badRequest('Selected real-model prose writer binding is missing required OpenAI settings.', {
              code: 'RUN_MODEL_CONFIG_REQUIRED',
              detail: {
                projectId,
                role: error.role,
                runId: input.runId,
              },
            })
          }

          if (isModelGatewayExecutionError(error)) {
            applyAcceptedProseGenerationFailure(state, {
              decision: input.decision,
              failureClass: error.failureClass,
              failureMessage: error.message,
              modelId: error.modelId,
              providerId: error.providerId,
              providerLabel: error.providerLabel,
              reviewId: input.reviewId,
              selectedVariants: input.selectedVariants,
            })
            indexRunReadSurfaces(state)
            publishRunEvents(projectId, input.runId, state.events.slice(-2))
            completeRunStream(projectId, input.runId)
            return clone(state.run)
          }

          throw error
        }
      }

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
        proseGeneration,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })

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
      publishRunEvents(projectId, input.runId, transition.appendedEvents)
      if (isTerminalRunStatus(state.run.status)) {
        completeRunStream(projectId, input.runId)
      }

      return clone(state.run)
    },
  }
}
