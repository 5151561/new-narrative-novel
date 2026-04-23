import { describe, expect, it } from 'vitest'

import { createRunFixtureStore } from './runFixtureStore.js'

describe('runFixtureStore', () => {
  it('appends accept-with-edit review events and clears the pending review', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-review', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const reviewedRun = store.submitRunReviewDecision('project-review', {
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
  })

  it('keeps request-rewrite semantics without completing the run', () => {
    const store = createRunFixtureStore()
    const run = store.startSceneRun('project-rewrite', {
      sceneId: 'scene-midnight-platform',
      mode: 'rewrite',
    })

    const reviewedRun = store.submitRunReviewDecision('project-rewrite', {
      runId: run.id,
      reviewId: run.pendingReviewId!,
      decision: 'request-rewrite',
      note: 'Take another pass on the ending beat.',
    })

    expect(reviewedRun).toMatchObject({
      id: run.id,
      status: 'running',
      summary: 'Rewrite requested and the run returned to execution.',
      pendingReviewId: undefined,
      completedAtLabel: undefined,
    })

    const events = store.getRunEvents('project-rewrite', {
      runId: run.id,
      cursor: run.latestEventId,
    })
    expect(events.events.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
    ])
    expect(events.nextCursor).toBeUndefined()
  })
})
