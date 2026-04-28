import type { RunEventRefRecord } from '../../contracts/api-records.js'
import {
  createAgentInvocationArtifact,
  createCanonPatchArtifact,
  createProseDraftArtifact,
} from './sceneRunArtifacts.js'
import { createRunEvent } from './sceneRunEventFactory.js'
import { buildDefaultSceneRunTimelineLabel } from './sceneRunTimeline.js'
import type {
  SceneRunArtifactRecord,
  SceneRunCancelTransitionInput,
  SceneRunReviewTransitionInput,
  SceneRunReviewTransitionOptions,
  SceneRunReviewTransitionState,
  SceneRunRetryTransitionInput,
} from './sceneRunRecords.js'

type SceneRunReviewTransitionBaseInput = Omit<SceneRunReviewTransitionInput, 'decision'>

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

function buildReviewDecisionSummary(decision: SceneRunReviewTransitionInput['decision'], note?: string) {
  const suffix = note ? ` Note: ${note}` : ''

  switch (decision) {
    case 'accept':
      return `Review accepted the proposal set.${suffix}`
    case 'accept-with-edit':
      return `Review accepted the proposal set with edits.${suffix}`
    case 'request-rewrite':
      return `Review requested a rewrite.${suffix}`
    case 'reject':
      return `Review rejected the proposal set.${suffix}`
  }
}

function buildRunSummary(decision: SceneRunReviewTransitionInput['decision']) {
  switch (decision) {
    case 'accept':
      return 'Proposal set accepted and applied to canon and prose.'
    case 'accept-with-edit':
      return 'Proposal set accepted with editor adjustments applied to canon and prose.'
    case 'request-rewrite':
      return 'Rewrite requested. Start a new run to continue.'
    case 'reject':
      return 'Proposal set rejected and the run was closed.'
  }
}

function appendTransitionEvent(
  input: SceneRunReviewTransitionInput,
  events: SceneRunReviewTransitionState['appendedEvents'],
  kind: SceneRunReviewTransitionState['appendedEvents'][number]['kind'],
  label: string,
  summary: string,
  refs: RunEventRefRecord[] | undefined,
  options?: SceneRunReviewTransitionOptions,
) {
  const order = input.priorEventCount + events.length + 1
  const event = createRunEvent(
    input.runId,
    order,
    kind,
    label,
    summary,
    refs,
    {
      buildTimelineLabel: options?.buildTimelineLabel ?? buildDefaultSceneRunTimelineLabel,
    },
  )
  if (kind === 'review_decision_submitted') {
    event.metadata = {
      selectedVariantCount: input.selectedVariants?.length ?? 0,
    }
  }
  events.push(event)
  return event
}

function createCanonPatchTransitionArtifacts(input: SceneRunReviewTransitionInput) {
  const artifact = createCanonPatchArtifact({
    runId: input.runId,
    sceneId: input.sceneId,
    sequence: input.sequence,
  })

  if (!input.patchId) {
    return artifact
  }

  return {
    ...artifact,
    id: input.patchId,
  }
}

function createAcceptedTransition(
  input: SceneRunReviewTransitionInput,
  options?: SceneRunReviewTransitionOptions,
): SceneRunReviewTransitionState {
  const appendedEvents = [] as SceneRunReviewTransitionState['appendedEvents']
  const generatedArtifacts = [] as SceneRunArtifactRecord[]
  const note = trimNote(input.note)

  appendTransitionEvent(
    input,
    appendedEvents,
    'review_decision_submitted',
    'Review decision submitted',
    buildReviewDecisionSummary(input.decision, note),
    [{ kind: 'review', id: input.reviewId, label: 'Editorial review' }],
    options,
  )

  const canonPatchArtifact = createCanonPatchTransitionArtifacts(input)
  if (!input.proseGeneration) {
    throw new Error(`Accepted review decision ${input.decision} requires prose generation output.`)
  }

  const writerInvocationArtifact = createAgentInvocationArtifact({
    runId: input.runId,
    sceneId: input.sceneId,
    sequence: input.sequence,
    index: 3,
    role: 'writer',
    provenance: input.proseGeneration.provenance,
  })
  const proseDraftArtifact = createProseDraftArtifact({
    runId: input.runId,
    sceneId: input.sceneId,
    sequence: input.sequence,
    writerOutput: input.proseGeneration.output,
    writerProvenance: input.proseGeneration.provenance,
  })
  generatedArtifacts.push(canonPatchArtifact, writerInvocationArtifact, proseDraftArtifact)

  appendTransitionEvent(
    input,
    appendedEvents,
    'canon_patch_applied',
    'Canon patch applied',
    input.decision === 'accept-with-edit'
      ? 'Editorial edits were applied to the accepted canon patch.'
      : 'Accepted canon patch was applied to the scene.',
    [createArtifactRef(canonPatchArtifact, 'Canon patch')],
    options,
  )
  appendTransitionEvent(
    input,
    appendedEvents,
    'prose_generated',
    'Prose generated',
    input.decision === 'accept-with-edit'
      ? 'Prose draft regenerated after editorial adjustments.'
      : 'Prose draft generated from the accepted patch.',
    [
      createArtifactRef(writerInvocationArtifact, 'Writer'),
      createArtifactRef(proseDraftArtifact, 'Prose draft'),
    ],
    options,
  )
  const completedEvent = appendTransitionEvent(
    input,
    appendedEvents,
    'run_completed',
    'Run completed',
    'Run closed after review acceptance.',
    undefined,
    options,
  )

  return {
    appendedEvents,
    generatedArtifacts,
    nextRun: {
      status: 'completed',
      summary: buildRunSummary(input.decision),
      completedAtLabel: completedEvent.createdAtLabel,
      pendingReviewId: undefined,
    },
  }
}

export function createAcceptSceneRunReviewTransition(
  input: SceneRunReviewTransitionBaseInput,
  options?: SceneRunReviewTransitionOptions,
) {
  return createAcceptedTransition({
    ...input,
    decision: 'accept',
  }, options)
}

export function createAcceptWithEditSceneRunReviewTransition(
  input: SceneRunReviewTransitionBaseInput,
  options?: SceneRunReviewTransitionOptions,
) {
  return createAcceptedTransition({
    ...input,
    decision: 'accept-with-edit',
  }, options)
}

export function createRequestRewriteSceneRunReviewTransition(
  input: SceneRunReviewTransitionBaseInput,
  options?: SceneRunReviewTransitionOptions,
): SceneRunReviewTransitionState {
  const appendedEvents = [] as SceneRunReviewTransitionState['appendedEvents']
  const note = trimNote(input.note)

  appendTransitionEvent(
    {
      ...input,
      decision: 'request-rewrite',
    },
    appendedEvents,
    'review_decision_submitted',
    'Review decision submitted',
    buildReviewDecisionSummary('request-rewrite', note),
    [{ kind: 'review', id: input.reviewId, label: 'Editorial review' }],
    options,
  )
  const completedAtLabel = appendedEvents[0]?.createdAtLabel

  return {
    appendedEvents,
    generatedArtifacts: [],
    nextRun: {
      status: 'completed',
      summary: buildRunSummary('request-rewrite'),
      completedAtLabel,
      pendingReviewId: undefined,
    },
  }
}

export function createRejectSceneRunReviewTransition(
  input: SceneRunReviewTransitionBaseInput,
  options?: SceneRunReviewTransitionOptions,
): SceneRunReviewTransitionState {
  const appendedEvents = [] as SceneRunReviewTransitionState['appendedEvents']
  const note = trimNote(input.note)

  appendTransitionEvent(
    {
      ...input,
      decision: 'reject',
    },
    appendedEvents,
    'review_decision_submitted',
    'Review decision submitted',
    buildReviewDecisionSummary('reject', note),
    [{ kind: 'review', id: input.reviewId, label: 'Editorial review' }],
    options,
  )
  const completedEvent = appendTransitionEvent(
    {
      ...input,
      decision: 'reject',
    },
    appendedEvents,
    'run_completed',
    'Run completed',
    'Run closed after review rejection.',
    undefined,
    options,
  )

  return {
    appendedEvents,
    generatedArtifacts: [],
    nextRun: {
      status: 'completed',
      summary: buildRunSummary('reject'),
      completedAtLabel: completedEvent.createdAtLabel,
      pendingReviewId: undefined,
    },
  }
}

export function createRetryScheduledSceneRunTransition(
  input: SceneRunRetryTransitionInput,
  options?: SceneRunReviewTransitionOptions,
) {
  const event = createRunEvent(
    input.runId,
    input.priorEventCount + 1,
    'run_retry_scheduled',
    'Retry scheduled',
    `Retry scheduled in ${input.mode ?? 'continue'} mode as ${input.nextRunId}.`,
    undefined,
    {
      buildTimelineLabel: options?.buildTimelineLabel ?? buildDefaultSceneRunTimelineLabel,
      metadata: {
        mode: input.mode ?? 'continue',
      },
    },
  )

  return {
    appendedEvents: [event],
  }
}

export function createCancelSceneRunTransition(
  input: SceneRunCancelTransitionInput,
  options?: SceneRunReviewTransitionOptions,
): SceneRunReviewTransitionState {
  const buildTimelineLabel = options?.buildTimelineLabel ?? buildDefaultSceneRunTimelineLabel
  const note = trimNote(input.reason)
  const requestedEvent = createRunEvent(
    input.runId,
    input.priorEventCount + 1,
    'run_cancel_requested',
    'Run cancellation requested',
    note ? `Run cancellation was requested. Reason: ${note}` : 'Run cancellation was requested.',
    undefined,
    {
      buildTimelineLabel,
      metadata: note ? { reason: note } : undefined,
    },
  )
  const cancelledEvent = createRunEvent(
    input.runId,
    input.priorEventCount + 2,
    'run_cancelled',
    'Run cancelled',
    note ? `Run cancelled before canon or prose changed. Reason: ${note}` : 'Run cancelled before canon or prose changed.',
    undefined,
    {
      buildTimelineLabel,
    },
  )

  return {
    appendedEvents: [requestedEvent, cancelledEvent],
    generatedArtifacts: [],
    nextRun: {
      status: 'cancelled',
      summary: 'Run cancelled before canon or prose changed.',
      completedAtLabel: cancelledEvent.createdAtLabel,
      pendingReviewId: undefined,
      cancelRequestedAtLabel: requestedEvent.createdAtLabel,
      failureClass: 'cancelled',
      failureMessage: note,
      resumableFromEventId: undefined,
    },
  }
}

export function applySceneRunReviewDecisionTransition(
  input: SceneRunReviewTransitionInput,
  options?: SceneRunReviewTransitionOptions,
): SceneRunReviewTransitionState {
  const baseInput: SceneRunReviewTransitionBaseInput = {
    runId: input.runId,
    sceneId: input.sceneId,
    sequence: input.sequence,
    priorEventCount: input.priorEventCount,
    reviewId: input.reviewId,
    note: input.note,
    patchId: input.patchId,
    selectedVariants: input.selectedVariants,
    proseGeneration: input.proseGeneration,
  }

  switch (input.decision) {
    case 'accept':
      return createAcceptSceneRunReviewTransition(baseInput, options)
    case 'accept-with-edit':
      return createAcceptWithEditSceneRunReviewTransition(baseInput, options)
    case 'request-rewrite':
      return createRequestRewriteSceneRunReviewTransition(baseInput, options)
    case 'reject':
      return createRejectSceneRunReviewTransition(baseInput, options)
  }
}
