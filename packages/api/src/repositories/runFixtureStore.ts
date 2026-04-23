import type {
  RunEventKind,
  RunEventRecord,
  RunEventRefRecord,
  RunEventsPageRecord,
  RunRecord,
  RunReviewDecisionKind,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from '../contracts/api-records.js'
import { badRequest, conflict, notFound } from '../http/errors.js'

const EVENT_PAGE_SIZE = 4
const DEFAULT_PROJECT_ID = 'book-signal-arc'

interface RunState {
  run: RunRecord
  events: RunEventRecord[]
}

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
  return `2026-04-23 10:${String(order).padStart(2, '0')}`
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

function trimNote(note?: string) {
  const value = note?.trim()
  return value ? value : undefined
}

function extractRunSequence(runId: string) {
  const sequence = Number.parseInt(runId.slice(runId.lastIndexOf('-') + 1), 10)
  return Number.isNaN(sequence) ? 1 : sequence
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

function isRunReviewDecisionKind(value: string): value is RunReviewDecisionKind {
  return value === 'accept'
    || value === 'accept-with-edit'
    || value === 'request-rewrite'
    || value === 'reject'
}

function createSeedRun(): { projectId: string; sceneId: string; sequence: number; run: RunRecord; events: RunEventRecord[] } {
  const projectId = DEFAULT_PROJECT_ID
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
        label: 'Scene context packet',
      },
    ]),
    createEvent(runId, 4, 'agent_invocation_started', 'Planner invocation started', 'Planning agent invocation started.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 1),
        label: 'Planner',
      },
    ]),
    createEvent(runId, 5, 'agent_invocation_completed', 'Planner invocation completed', 'Planning agent returned proposal candidates.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 1),
        label: 'Planner',
      },
    ]),
    createEvent(runId, 6, 'agent_invocation_started', 'Writer invocation started', 'Writer agent invocation started.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 2),
        label: 'Writer',
      },
    ]),
    createEvent(runId, 7, 'agent_invocation_completed', 'Writer invocation completed', 'Writer agent returned prose candidates.', [
      {
        kind: 'agent-invocation',
        id: buildAgentInvocationId(sceneId, sequence, 2),
        label: 'Writer',
      },
    ]),
    createEvent(runId, 8, 'proposal_created', 'Proposal set created', 'A proposal set is ready for review.', [
      {
        kind: 'proposal-set',
        id: buildProposalSetId(sceneId, sequence),
        label: 'Scene proposal set',
      },
    ]),
    createEvent(runId, 9, 'review_requested', 'Review requested', 'Editorial review is waiting on the proposal set.', [
      {
        kind: 'review',
        id: reviewId,
        label: 'Editorial review',
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

  return {
    projectId,
    sceneId,
    sequence,
    run,
    events,
  }
}

export interface RunFixtureStore {
  reset(): void
  startSceneRun(projectId: string, input: StartSceneRunInput): RunRecord
  getRun(projectId: string, runId: string): RunRecord | null
  getRunEvents(projectId: string, input: { runId: string; cursor?: string }): RunEventsPageRecord
  submitRunReviewDecision(projectId: string, input: SubmitRunReviewDecisionInput): RunRecord
}

export function createRunFixtureStore(): RunFixtureStore {
  const runStatesByProjectId = new Map<string, Map<string, RunState>>()
  const sceneRunSequenceByProjectId = new Map<string, Map<string, number>>()

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

  function setRunState(projectId: string, run: RunRecord, events: RunEventRecord[]) {
    getRunBucket(projectId, true)!.set(run.id, {
      run: clone(run),
      events: clone(events),
    })
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

  function appendRunEvent(state: RunState, kind: RunEventKind, label: string, summary: string, refs?: RunEventRefRecord[]) {
    const nextOrder = state.events.length + 1
    const event = createEvent(state.run.id, nextOrder, kind, label, summary, refs)
    state.events.push(event)
    state.run.latestEventId = event.id
    state.run.eventCount = state.events.length
    return event
  }

  function reset() {
    runStatesByProjectId.clear()
    sceneRunSequenceByProjectId.clear()

    const seed = createSeedRun()
    setRunState(seed.projectId, seed.run, seed.events)
    getSequenceBucket(seed.projectId, true)!.set(seed.sceneId, seed.sequence)
  }

  reset()

  return {
    reset,
    startSceneRun(projectId, input) {
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
            label: 'Scene context packet',
          },
        ]),
        createEvent(runId, 4, 'agent_invocation_started', 'Planner invocation started', 'Planning agent invocation started.', [
          {
            kind: 'agent-invocation',
            id: buildAgentInvocationId(input.sceneId, nextSequence, 1),
            label: 'Planner',
          },
        ]),
        createEvent(runId, 5, 'agent_invocation_completed', 'Planner invocation completed', 'Planning agent returned proposal candidates.', [
          {
            kind: 'agent-invocation',
            id: buildAgentInvocationId(input.sceneId, nextSequence, 1),
            label: 'Planner',
          },
        ]),
        createEvent(runId, 6, 'agent_invocation_started', 'Writer invocation started', 'Writer agent invocation started.', [
          {
            kind: 'agent-invocation',
            id: buildAgentInvocationId(input.sceneId, nextSequence, 2),
            label: 'Writer',
          },
        ]),
        createEvent(runId, 7, 'agent_invocation_completed', 'Writer invocation completed', 'Writer agent returned prose candidates.', [
          {
            kind: 'agent-invocation',
            id: buildAgentInvocationId(input.sceneId, nextSequence, 2),
            label: 'Writer',
          },
        ]),
        createEvent(runId, 8, 'proposal_created', 'Proposal set created', 'A proposal set is ready for review.', [
          {
            kind: 'proposal-set',
            id: buildProposalSetId(input.sceneId, nextSequence),
            label: 'Scene proposal set',
          },
        ]),
        createEvent(runId, 9, 'review_requested', 'Review requested', 'Editorial review is waiting on the proposal set.', [
          {
            kind: 'review',
            id: reviewId,
            label: 'Editorial review',
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

      setRunState(projectId, run, events)
      return clone(run)
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

      const note = trimNote(input.note)
      const runSequence = extractRunSequence(input.runId)
      const sceneId = state.run.scopeId

      appendRunEvent(
        state,
        'review_decision_submitted',
        'Review decision submitted',
        buildReviewDecisionSummary(input.decision, note),
        [{ kind: 'review', id: input.reviewId, label: 'Editorial review' }],
      )

      if (input.decision === 'accept' || input.decision === 'accept-with-edit') {
        appendRunEvent(
          state,
          'canon_patch_applied',
          'Canon patch applied',
          input.decision === 'accept-with-edit'
            ? 'Editorial edits were applied to the accepted canon patch.'
            : 'Accepted canon patch was applied to the scene.',
          [{ kind: 'canon-patch', id: input.patchId ?? `canon-patch-${sceneId}-${toSequenceLabel(runSequence)}`, label: 'Canon patch' }],
        )
        appendRunEvent(
          state,
          'prose_generated',
          'Prose generated',
          input.decision === 'accept-with-edit'
            ? 'Prose draft regenerated after editorial adjustments.'
            : 'Prose draft generated from the accepted patch.',
          [{ kind: 'prose-draft', id: `prose-draft-${sceneId}-${toSequenceLabel(runSequence)}`, label: 'Prose draft' }],
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

      return clone(state.run)
    },
  }
}
