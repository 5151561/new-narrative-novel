import { ApiRequestError } from '@/app/project-runtime/api-transport'

import type {
  RunEventKind,
  RunEventRecord,
  RunEventRefRecord,
  RunEventsPageRecord,
  RunRecord,
  RunReviewDecisionKind,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from './run-records'

const EVENT_PAGE_SIZE = 4
const DEFAULT_PROJECT_ID = 'book-signal-arc'

interface MockRunState {
  run: RunRecord
  events: RunEventRecord[]
}

export interface MockRunStateSnapshot {
  run: RunRecord
  events: RunEventRecord[]
}

export interface MockRunSnapshot {
  runStatesByProjectId: Record<string, MockRunStateSnapshot[]>
  runSceneSequencesByProjectId: Record<string, Record<string, number>>
}

const mockRunStatesByProjectId = new Map<string, Map<string, MockRunState>>()
const mockSceneRunSequenceByProjectId = new Map<string, Map<string, number>>()

function clone<T>(value: T): T {
  return structuredClone(value)
}

function toSequenceLabel(sequence: number) {
  return String(sequence).padStart(3, '0')
}

function buildRunId(sceneId: string, sequence: number) {
  return `run-${sceneId}-${toSequenceLabel(sequence)}`
}

function buildRunEventId(runId: string, order: number) {
  return `${runId.replace(/^run-/, 'run-event-')}-${toSequenceLabel(order)}`
}

function buildReviewId(sceneId: string, sequence: number) {
  return `review-${sceneId}-${toSequenceLabel(sequence)}`
}

function buildContextPacketId(sceneId: string, sequence: number) {
  return `ctx-${sceneId}-run-${toSequenceLabel(sequence)}`
}

function buildProposalSetId(sceneId: string, sequence: number) {
  return `proposal-set-${sceneId}-run-${toSequenceLabel(sequence)}`
}

function buildAgentInvocationId(sceneId: string, sequence: number, index: number) {
  return `agent-invocation-${sceneId}-run-${toSequenceLabel(sequence)}-${toSequenceLabel(index)}`
}

function buildTimelineLabel(order: number) {
  return `2026-04-21 10:${String(order).padStart(2, '0')}`
}

function createEvent(
  runId: string,
  order: number,
  kind: RunEventKind,
  label: string,
  summary: string,
  refs?: RunEventRefRecord[],
): RunEventRecord {
  return {
    id: buildRunEventId(runId, order),
    runId,
    order,
    kind,
    label,
    summary,
    createdAtLabel: buildTimelineLabel(order),
    refs,
  }
}

function getRunBucket(projectId = DEFAULT_PROJECT_ID, createIfMissing = false) {
  const existing = mockRunStatesByProjectId.get(projectId)
  if (existing) {
    return existing
  }

  if (!createIfMissing) {
    return undefined
  }

  const next = new Map<string, MockRunState>()
  mockRunStatesByProjectId.set(projectId, next)
  return next
}

function getSequenceBucket(projectId = DEFAULT_PROJECT_ID, createIfMissing = false) {
  const existing = mockSceneRunSequenceByProjectId.get(projectId)
  if (existing) {
    return existing
  }

  if (!createIfMissing) {
    return undefined
  }

  const next = new Map<string, number>()
  mockSceneRunSequenceByProjectId.set(projectId, next)
  return next
}

function setRunState(projectId: string, run: RunRecord, events: RunEventRecord[]) {
  const bucket = getRunBucket(projectId, true)
  bucket!.set(run.id, {
    run: clone(run),
    events: clone(events),
  })
}

function requireRunState(runId: string, projectId = DEFAULT_PROJECT_ID) {
  const state = getRunBucket(projectId)?.get(runId)
  if (!state) {
    throw new ApiRequestError({
      status: 404,
      message: `Run ${runId} was not found.`,
      code: 'run-not-found',
    })
  }

  return state
}

function appendRunEvent(state: MockRunState, kind: RunEventKind, label: string, summary: string, refs?: RunEventRefRecord[]) {
  const nextOrder = state.events.length + 1
  const event = createEvent(state.run.id, nextOrder, kind, label, summary, refs)
  state.events.push(event)
  state.run.latestEventId = event.id
  state.run.eventCount = state.events.length
  return event
}

function extractRunSequence(runId: string) {
  const sequence = Number.parseInt(runId.slice(runId.lastIndexOf('-') + 1), 10)
  return Number.isNaN(sequence) ? 1 : sequence
}

function buildSeedRun() {
  const sceneId = 'scene-midnight-platform'
  const sequence = 1
  const runId = buildRunId(sceneId, sequence)
  const reviewId = buildReviewId(sceneId, sequence)
  const events = [
    createEvent(runId, 1, 'run_created', 'Run created', 'Scene run request accepted.'),
    createEvent(runId, 2, 'run_started', 'Run started', 'Narrative runtime started the scene run.'),
    createEvent(runId, 3, 'context_packet_built', 'Context packet built', 'Runtime assembled the scene context packet.', [
      {
        kind: 'context-packet',
        id: buildContextPacketId(sceneId, sequence),
      },
    ]),
    createEvent(runId, 4, 'agent_invocation_started', 'Planner invocation started', 'Planning agent invocation started.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 1),
      },
    ]),
    createEvent(runId, 5, 'agent_invocation_completed', 'Planner invocation completed', 'Planning agent returned proposal candidates.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 1),
      },
    ]),
    createEvent(runId, 6, 'agent_invocation_started', 'Writer invocation started', 'Writer agent invocation started.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 2),
      },
    ]),
    createEvent(runId, 7, 'agent_invocation_completed', 'Writer invocation completed', 'Writer agent returned prose candidates.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 2),
      },
    ]),
    createEvent(runId, 8, 'proposal_created', 'Proposal set created', 'A proposal set is ready for review.', [
      {
        kind: 'proposal-set',
        id: buildProposalSetId(sceneId, sequence),
      },
    ]),
    createEvent(runId, 9, 'review_requested', 'Review requested', 'Editorial review is waiting on the proposal set.', [
      {
        kind: 'review',
        id: reviewId,
      },
    ]),
  ]
  const run: RunRecord = {
    id: runId,
    scope: 'scene',
    scopeId: sceneId,
    status: 'waiting_review',
    title: 'Midnight platform scene run',
    summary: 'Planner and writer output are ready for editorial review.',
    startedAtLabel: buildTimelineLabel(1),
    pendingReviewId: reviewId,
    latestEventId: events.at(-1)?.id,
    eventCount: events.length,
  }

  return { run, events, sceneId, sequence }
}

function seedMockRunDb() {
  mockRunStatesByProjectId.clear()
  mockSceneRunSequenceByProjectId.clear()

  const seed = buildSeedRun()
  setRunState(DEFAULT_PROJECT_ID, seed.run, seed.events)
  getSequenceBucket(DEFAULT_PROJECT_ID, true)!.set(seed.sceneId, seed.sequence)
}

function trimNote(note?: string) {
  const value = note?.trim()
  return value ? value : undefined
}

function updateProjectRunState(projectId: string, run: RunRecord, events: RunEventRecord[]) {
  setRunState(projectId, run, events)
  return clone(run)
}

export function getMockRun(runId: string, projectId = DEFAULT_PROJECT_ID): RunRecord | null {
  return clone(getRunBucket(projectId)?.get(runId)?.run ?? null)
}

export function getMockRunEvents(
  {
    runId,
    cursor,
  }: {
    runId: string
    cursor?: string
  },
  projectId = DEFAULT_PROJECT_ID,
): RunEventsPageRecord {
  const state = requireRunState(runId, projectId)
  const startIndex = cursor
    ? (() => {
        const cursorIndex = state.events.findIndex((event) => event.id === cursor)
        if (cursorIndex < 0) {
          throw new ApiRequestError({
            status: 409,
            message: `Run cursor ${cursor} does not exist for ${runId}.`,
            code: 'run-events-cursor-conflict',
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
}

export function startMockSceneRun(input: StartSceneRunInput, projectId = DEFAULT_PROJECT_ID): RunRecord {
  const sequenceBucket = getSequenceBucket(projectId, true)
  const nextSequence = (sequenceBucket?.get(input.sceneId) ?? 0) + 1
  sequenceBucket!.set(input.sceneId, nextSequence)

  const runId = buildRunId(input.sceneId, nextSequence)
  const reviewId = buildReviewId(input.sceneId, nextSequence)
  const note = trimNote(input.note)
  const modeLabel = input.mode ?? 'continue'
  const events = [
    createEvent(runId, 1, 'run_created', 'Run created', `Scene run was created in ${modeLabel} mode.`),
    createEvent(runId, 2, 'run_started', 'Run started', 'Narrative runtime started the scene run.'),
    createEvent(runId, 3, 'context_packet_built', 'Context packet built', 'Runtime assembled the scene context packet.', [
      {
        kind: 'context-packet',
        id: buildContextPacketId(input.sceneId, nextSequence),
      },
    ]),
    createEvent(runId, 4, 'proposal_created', 'Proposal set created', 'A proposal set is ready for review.', [
      {
        kind: 'proposal-set',
        id: buildProposalSetId(input.sceneId, nextSequence),
      },
    ]),
    createEvent(runId, 5, 'review_requested', 'Review requested', 'Editorial review is waiting on the proposal set.', [
      {
        kind: 'review',
        id: reviewId,
      },
    ]),
  ]
  const run: RunRecord = {
    id: runId,
    scope: 'scene',
    scopeId: input.sceneId,
    status: 'waiting_review',
    title: `${input.sceneId} run`,
    summary: note ? `Waiting for review: ${note}` : 'Waiting for review.',
    startedAtLabel: buildTimelineLabel(1),
    pendingReviewId: reviewId,
    latestEventId: events.at(-1)?.id,
    eventCount: events.length,
  }

  return updateProjectRunState(projectId, run, events)
}

function buildReviewDecisionSummary(decision: RunReviewDecisionKind, note?: string) {
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

function buildRunSummary(decision: RunReviewDecisionKind) {
  switch (decision) {
    case 'accept':
      return 'Proposal set accepted and applied to canon and prose.'
    case 'accept-with-edit':
      return 'Proposal set accepted with editor adjustments applied to canon and prose.'
    case 'request-rewrite':
      return 'Rewrite requested and the run returned to execution.'
    case 'reject':
      return 'Proposal set rejected and the run was closed.'
  }
}

export function submitMockRunReviewDecision(
  input: SubmitRunReviewDecisionInput,
  projectId = DEFAULT_PROJECT_ID,
): RunRecord {
  const state = requireRunState(input.runId, projectId)
  if (state.run.pendingReviewId !== input.reviewId) {
    throw new ApiRequestError({
      status: 409,
      message: `Pending review ${input.reviewId} does not match ${state.run.id}.`,
      code: 'run-review-conflict',
    })
  }

  const note = trimNote(input.note)
  const runSequence = extractRunSequence(input.runId)
  const sceneId = state.run.scopeId
  appendRunEvent(
    state,
    'review_decision_submitted',
    'Review decision submitted',
    buildReviewDecisionSummary(input.decision, note),
    [{ kind: 'review', id: input.reviewId }],
  )

  if (input.decision === 'accept' || input.decision === 'accept-with-edit') {
    appendRunEvent(
      state,
      'canon_patch_applied',
      'Canon patch applied',
      input.decision === 'accept-with-edit'
        ? 'Editorial edits were applied to the accepted canon patch.'
        : 'Accepted canon patch was applied to the scene.',
      [{ kind: 'canon-patch', id: input.patchId ?? `canon-patch-${sceneId}-${toSequenceLabel(runSequence)}` }],
    )
    appendRunEvent(
      state,
      'prose_generated',
      'Prose generated',
      input.decision === 'accept-with-edit'
        ? 'Prose draft regenerated after editorial adjustments.'
        : 'Prose draft generated from the accepted patch.',
      [{ kind: 'prose-draft', id: `prose-draft-${sceneId}-${toSequenceLabel(runSequence)}` }],
    )
    appendRunEvent(state, 'run_completed', 'Run completed', 'Run closed after review acceptance.')
    state.run.status = 'completed'
    state.run.completedAtLabel = state.events.at(-1)?.createdAtLabel
  } else if (input.decision === 'request-rewrite') {
    state.run.status = 'running'
    state.run.completedAtLabel = undefined
  } else {
    appendRunEvent(state, 'run_completed', 'Run completed', 'Run closed after review rejection.')
    state.run.status = 'completed'
    state.run.completedAtLabel = state.events.at(-1)?.createdAtLabel
  }

  state.run.pendingReviewId = undefined
  state.run.summary = buildRunSummary(input.decision)

  return updateProjectRunState(projectId, state.run, state.events)
}

export function exportMockRunSnapshot(): MockRunSnapshot {
  return {
    runStatesByProjectId: Object.fromEntries(
      Array.from(mockRunStatesByProjectId.entries()).map(([projectId, bucket]) => [
        projectId,
        Array.from(bucket.values()).map((state) => ({
          run: clone(state.run),
          events: clone(state.events),
        })),
      ]),
    ),
    runSceneSequencesByProjectId: Object.fromEntries(
      Array.from(mockSceneRunSequenceByProjectId.entries()).map(([projectId, bucket]) => [
        projectId,
        Object.fromEntries(Array.from(bucket.entries())),
      ]),
    ),
  }
}

export function importMockRunSnapshot(snapshot: MockRunSnapshot): void {
  mockRunStatesByProjectId.clear()
  mockSceneRunSequenceByProjectId.clear()

  for (const [projectId, states] of Object.entries(snapshot.runStatesByProjectId)) {
    if (states.length === 0) {
      continue
    }

    mockRunStatesByProjectId.set(
      projectId,
      new Map(
        states.map((state) => [
          state.run.id,
          {
            run: clone(state.run),
            events: clone(state.events),
          },
        ]),
      ),
    )
  }

  for (const [projectId, sequenceRecord] of Object.entries(snapshot.runSceneSequencesByProjectId)) {
    mockSceneRunSequenceByProjectId.set(projectId, new Map(Object.entries(sequenceRecord)))
  }
}

export function resetMockRunDb(): void {
  seedMockRunDb()
}

seedMockRunDb()
