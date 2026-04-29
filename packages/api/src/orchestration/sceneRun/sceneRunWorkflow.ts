import type { RunEventRefRecord, RunRecord } from '../../contracts/api-records.js'
import {
  createAgentInvocationArtifact,
  createContextPacketArtifact,
  createProposalSetArtifact,
} from './sceneRunArtifacts.js'
import { appendRunEvent } from './sceneRunEventFactory.js'
import { buildReviewId, buildRunId } from './sceneRunIds.js'
import { buildDefaultSceneRunTimelineLabel } from './sceneRunTimeline.js'
import type {
  SceneRunWorkflowStartInput,
  SceneRunWorkflowStartOptions,
  SceneRunWorkflowState,
} from './sceneRunRecords.js'

function trimNote(note?: string) {
  const value = note?.trim()
  return value ? value : undefined
}

function createArtifactRef(ref: { kind: RunEventRefRecord['kind']; id: string }, label: string): RunEventRefRecord {
  return {
    kind: ref.kind,
    id: ref.id,
    label,
  }
}

function createContextPacketEventMetadata(contextPacket?: SceneRunWorkflowStartInput['contextPacket']) {
  if (contextPacket?.activationSummary) {
    return {
      includedAssetCount: contextPacket.activationSummary.includedAssetCount,
      excludedAssetCount: contextPacket.activationSummary.excludedAssetCount,
      redactedAssetCount: contextPacket.activationSummary.redactedAssetCount,
    }
  }

  return {
    includedAssetCount: 3,
    excludedAssetCount: 1,
    redactedAssetCount: 1,
  }
}

function createPlannerUsage(input: SceneRunWorkflowStartInput): NonNullable<RunRecord['usage']> {
  const inputTokens = 1500 + input.sequence * 100
  const outputTokens = 200 + input.sequence * 20
  const estimatedCostUsd = Number((inputTokens * 0.00001 + outputTokens * 0.0000316666667).toFixed(4))

  return {
    inputTokens,
    outputTokens,
    estimatedCostUsd,
    provider: input.plannerProvenance.provider,
    modelId: input.plannerProvenance.modelId,
    projectMode: input.plannerProvenance.projectMode,
    fallbackUsed: input.plannerProvenance.fallbackUsed,
    latencyMs: input.plannerProvenance.latencyMs,
  }
}

function formatTokenLabel(usage: NonNullable<RunRecord['usage']>) {
  const totalTokens = usage.inputTokens + usage.outputTokens
  return totalTokens >= 1000
    ? `${Number((totalTokens / 1000).toFixed(1))}k tokens`
    : `${totalTokens} tokens`
}

function createRuntimeSummary(usage: NonNullable<RunRecord['usage']>): NonNullable<RunRecord['runtimeSummary']> {
  return {
    health: 'attention',
    costLabel: `$${usage.estimatedCostUsd.toFixed(4)} est.`,
    tokenLabel: formatTokenLabel(usage),
    failureClassLabel: 'No runtime failure recorded',
    nextActionLabel: 'Review proposals before any retry or prose continuation.',
  }
}

export function startSceneRunWorkflow(
  input: SceneRunWorkflowStartInput,
  options?: SceneRunWorkflowStartOptions,
): SceneRunWorkflowState {
  const runId = buildRunId(input.sceneId, input.sequence)
  const reviewId = buildReviewId(input.sceneId, input.sequence)
  const note = trimNote(input.note)
  const modeLabel = input.mode ?? 'continue'
  const plannerUsage = createPlannerUsage(input)
  const runtimeSummary = createRuntimeSummary(plannerUsage)
  const eventOptions = {
    buildTimelineLabel: options?.buildTimelineLabel ?? buildDefaultSceneRunTimelineLabel,
  }

  const contextPacketArtifact = createContextPacketArtifact({
    runId,
    sceneId: input.sceneId,
    sequence: input.sequence,
    contextPacket: input.contextPacket,
  })
  const plannerInvocationArtifact = createAgentInvocationArtifact({
    runId,
    sceneId: input.sceneId,
    sequence: input.sequence,
    index: 1,
    role: 'planner',
    provenance: input.plannerProvenance,
  })
  const writerInvocationArtifact = createAgentInvocationArtifact({
    runId,
    sceneId: input.sceneId,
    sequence: input.sequence,
    index: 2,
    role: 'writer',
  })
  const proposalSetArtifact = createProposalSetArtifact({
    runId,
    sceneId: input.sceneId,
    sequence: input.sequence,
    plannerOutput: input.plannerOutput,
    provenance: input.plannerProvenance,
  })

  const artifacts = [
    contextPacketArtifact,
    plannerInvocationArtifact,
    writerInvocationArtifact,
    proposalSetArtifact,
  ]

  const events = [] as SceneRunWorkflowState['events']
  appendRunEvent(events, runId, 'run_created', 'Run created', `Scene run was created in ${modeLabel} mode.`, undefined, eventOptions)
  appendRunEvent(events, runId, 'run_started', 'Run started', 'Narrative runtime started the scene run.', undefined, eventOptions)
  appendRunEvent(events, runId, 'context_packet_built', 'Context packet built', 'Runtime assembled the scene context packet.', [
    createArtifactRef(contextPacketArtifact, 'Scene context packet'),
  ], {
    ...eventOptions,
    metadata: createContextPacketEventMetadata(input.contextPacket),
  })
  appendRunEvent(events, runId, 'agent_invocation_started', 'Planner invocation started', 'Planning agent invocation started.', [
    createArtifactRef(plannerInvocationArtifact, 'Planner'),
  ], eventOptions)
  appendRunEvent(events, runId, 'agent_invocation_completed', 'Planner invocation completed', 'Planning agent returned proposal candidates.', [
    createArtifactRef(plannerInvocationArtifact, 'Planner'),
  ], {
    ...eventOptions,
    usage: plannerUsage,
  })
  appendRunEvent(events, runId, 'agent_invocation_started', 'Writer invocation started', 'Writer agent invocation started.', [
    createArtifactRef(writerInvocationArtifact, 'Writer'),
  ], eventOptions)
  appendRunEvent(events, runId, 'agent_invocation_completed', 'Writer invocation completed', 'Writer agent returned prose candidates.', [
    createArtifactRef(writerInvocationArtifact, 'Writer'),
  ], eventOptions)
  appendRunEvent(events, runId, 'proposal_created', 'Proposal set created', 'A proposal set is ready for review.', [
    createArtifactRef(proposalSetArtifact, 'Scene proposal set'),
  ], eventOptions)
  appendRunEvent(events, runId, 'review_requested', 'Review requested', 'Editorial review is waiting on the proposal set.', [
    {
      kind: 'review',
      id: reviewId,
      label: 'Editorial review',
    },
  ], eventOptions)
  if (input.resumeSourceRunId && input.resumableFromEventId) {
    appendRunEvent(
      events,
      runId,
      'run_resumed',
      'Run resumed',
      `Run resumed from ${input.resumeSourceRunId} at event ${input.resumableFromEventId}.`,
      undefined,
      eventOptions,
    )
  }

  const run: RunRecord = {
    id: runId,
    scope: 'scene',
    scopeId: input.sceneId,
    status: 'waiting_review',
    title: `${input.sceneId} run`,
    summary: note ? `Waiting for review: ${note}` : 'Waiting for review.',
    startedAtLabel: events[0]?.createdAtLabel,
    pendingReviewId: reviewId,
    latestEventId: events.at(-1)?.id,
    retryOfRunId: input.retryOfRunId,
    resumableFromEventId: input.resumableFromEventId,
    usage: plannerUsage,
    runtimeSummary,
    eventCount: events.length,
  }

  return {
    run,
    events,
    artifacts,
  }
}
