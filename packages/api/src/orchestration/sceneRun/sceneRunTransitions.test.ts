import { describe, expect, it } from 'vitest'

import { applySceneRunReviewDecisionTransition } from './sceneRunTransitions.js'

describe('applySceneRunReviewDecisionTransition', () => {
  const baseInput = {
    runId: 'run-scene-midnight-platform-002',
    sceneId: 'scene-midnight-platform',
    sequence: 2,
    priorEventCount: 9,
    reviewId: 'review-scene-midnight-platform-002',
  } as const

  it('builds accept transition events, artifacts, and next run state', () => {
    const transition = applySceneRunReviewDecisionTransition({
      ...baseInput,
      decision: 'accept',
      note: 'Ship it.',
    }, {
      buildTimelineLabel: (order) => `step-${String(order).padStart(3, '0')}`,
    })

    expect(transition.appendedEvents.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
      'canon_patch_applied',
      'prose_generated',
      'run_completed',
    ])
    expect(transition.appendedEvents.map((event) => event.id)).toEqual([
      'run-event-scene-midnight-platform-002-010',
      'run-event-scene-midnight-platform-002-011',
      'run-event-scene-midnight-platform-002-012',
      'run-event-scene-midnight-platform-002-013',
    ])
    expect(transition.generatedArtifacts).toEqual([
      expect.objectContaining({
        kind: 'canon-patch',
        id: 'canon-patch-scene-midnight-platform-002',
        runId: 'run-scene-midnight-platform-002',
        status: 'applied',
      }),
      expect.objectContaining({
        kind: 'prose-draft',
        id: 'prose-draft-scene-midnight-platform-002',
        runId: 'run-scene-midnight-platform-002',
        status: 'generated',
      }),
    ])
    expect(transition.nextRun).toEqual({
      status: 'completed',
      summary: 'Proposal set accepted and applied to canon and prose.',
      completedAtLabel: 'step-013',
      pendingReviewId: undefined,
    })
  })

  it('builds accept-with-edit transition with adjusted summaries', () => {
    const transition = applySceneRunReviewDecisionTransition({
      ...baseInput,
      decision: 'accept-with-edit',
      note: 'Apply line-level edits.',
      patchId: 'canon-patch-custom-777',
    }, {
      buildTimelineLabel: (order) => `step-${String(order).padStart(3, '0')}`,
    })

    expect(transition.appendedEvents.map((event) => event.summary)).toEqual([
      'Review accepted the proposal set with edits. Note: Apply line-level edits.',
      'Editorial edits were applied to the accepted canon patch.',
      'Prose draft regenerated after editorial adjustments.',
      'Run closed after review acceptance.',
    ])
    expect(transition.appendedEvents[1]?.refs).toEqual([
      {
        kind: 'canon-patch',
        id: 'canon-patch-custom-777',
        label: 'Canon patch',
      },
    ])
    expect(transition.generatedArtifacts[0]).toEqual(
      expect.objectContaining({
        kind: 'canon-patch',
        id: 'canon-patch-custom-777',
        status: 'applied',
      }),
    )
    expect(transition.nextRun).toEqual({
      status: 'completed',
      summary: 'Proposal set accepted with editor adjustments applied to canon and prose.',
      completedAtLabel: 'step-013',
      pendingReviewId: undefined,
    })
  })

  it('builds request-rewrite transition without completion events or artifacts', () => {
    const transition = applySceneRunReviewDecisionTransition({
      ...baseInput,
      decision: 'request-rewrite',
      note: 'Revise the ending beat.',
    }, {
      buildTimelineLabel: (order) => `step-${String(order).padStart(3, '0')}`,
    })

    expect(transition.appendedEvents.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
    ])
    expect(transition.generatedArtifacts).toEqual([])
    expect(transition.nextRun).toEqual({
      status: 'completed',
      summary: 'Rewrite requested. Start a new run to continue.',
      completedAtLabel: 'step-010',
      pendingReviewId: undefined,
    })
  })

  it('builds reject transition without patch or prose artifacts', () => {
    const transition = applySceneRunReviewDecisionTransition({
      ...baseInput,
      decision: 'reject',
    }, {
      buildTimelineLabel: (order) => `step-${String(order).padStart(3, '0')}`,
    })

    expect(transition.appendedEvents.map((event) => event.kind)).toEqual([
      'review_decision_submitted',
      'run_completed',
    ])
    expect(transition.generatedArtifacts).toEqual([])
    expect(transition.nextRun).toEqual({
      status: 'completed',
      summary: 'Proposal set rejected and the run was closed.',
      completedAtLabel: 'step-011',
      pendingReviewId: undefined,
    })

    const eventIds = transition.appendedEvents.map((event) => event.id)
    expect(new Set(eventIds).size).toBe(eventIds.length)
  })
})
