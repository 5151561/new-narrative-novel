import type {
  RunEventRecord,
  RunEventsPageRecord,
  RunRecord,
  RunReviewDecisionKind,
  StartSceneRunInput,
  SubmitRunReviewDecisionInput,
} from '../contracts/api-records.js'
import { badRequest, conflict, notFound } from '../http/errors.js'
import { applySceneRunReviewDecisionTransition } from '../orchestration/sceneRun/sceneRunTransitions.js'
import type { SceneRunArtifactRecord } from '../orchestration/sceneRun/sceneRunRecords.js'
import { buildFixtureSceneRunTimelineLabel } from '../orchestration/sceneRun/sceneRunTimeline.js'
import { startSceneRunWorkflow } from '../orchestration/sceneRun/sceneRunWorkflow.js'

const EVENT_PAGE_SIZE = 4
const DEFAULT_PROJECT_ID = 'book-signal-arc'

interface RunState {
  sequence: number
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
}

function trimNote(note?: string) {
  const value = note?.trim()
  return value ? value : undefined
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isRunReviewDecisionKind(value: string): value is RunReviewDecisionKind {
  return value === 'accept'
    || value === 'accept-with-edit'
    || value === 'request-rewrite'
    || value === 'reject'
}

function createSeedRun(): {
  projectId: string
  sceneId: string
  sequence: number
  run: RunRecord
  events: RunEventRecord[]
  artifacts: SceneRunArtifactRecord[]
} {
  const projectId = DEFAULT_PROJECT_ID
  const sceneId = 'scene-midnight-platform'
  const sequence = 1
  const workflow = startSceneRunWorkflow({
    sceneId,
    sequence,
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

  function setRunState(
    projectId: string,
    sequence: number,
    run: RunRecord,
    events: RunEventRecord[],
    artifacts: SceneRunArtifactRecord[],
  ) {
    getRunBucket(projectId, true)!.set(run.id, {
      sequence,
      run: clone(run),
      events: clone(events),
      artifacts: clone(artifacts),
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

  function reset() {
    runStatesByProjectId.clear()
    sceneRunSequenceByProjectId.clear()

    const seed = createSeedRun()
    setRunState(seed.projectId, seed.sequence, seed.run, seed.events, seed.artifacts)
    getSequenceBucket(seed.projectId, true)!.set(seed.sceneId, seed.sequence)
  }

  reset()

  return {
    reset,
    startSceneRun(projectId, input) {
      const sequenceBucket = getSequenceBucket(projectId, true)
      const nextSequence = (sequenceBucket?.get(input.sceneId) ?? 0) + 1
      sequenceBucket!.set(input.sceneId, nextSequence)

      const workflow = startSceneRunWorkflow({
        ...input,
        sequence: nextSequence,
      }, {
        buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
      })

      setRunState(projectId, nextSequence, workflow.run, workflow.events, workflow.artifacts)
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
      const transition = applySceneRunReviewDecisionTransition({
        runId: input.runId,
        sceneId: state.run.scopeId,
        sequence: state.sequence,
        priorEventCount: state.events.length,
        reviewId: input.reviewId,
        decision: input.decision,
        note,
        patchId: input.patchId,
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

      return clone(state.run)
    },
  }
}
