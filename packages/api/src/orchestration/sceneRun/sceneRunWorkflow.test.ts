import { describe, expect, it } from 'vitest'

import { startSceneRunWorkflow } from './sceneRunWorkflow.js'

describe('startSceneRunWorkflow', () => {
  it('builds a pure scene run workflow state with ordered events and internal artifacts', () => {
    const workflow = startSceneRunWorkflow({
      sceneId: 'scene-midnight-platform',
      sequence: 2,
      mode: 'rewrite',
      note: 'Tighten the ending beat.',
    }, {
      buildTimelineLabel: (order) => `step-${String(order).padStart(3, '0')}`,
    })

    expect(workflow.run).toMatchObject({
      id: 'run-scene-midnight-platform-002',
      scope: 'scene',
      scopeId: 'scene-midnight-platform',
      status: 'waiting_review',
      title: 'scene-midnight-platform run',
      summary: 'Waiting for review: Tighten the ending beat.',
      pendingReviewId: 'review-scene-midnight-platform-002',
      latestEventId: 'run-event-scene-midnight-platform-002-009',
      eventCount: 9,
    })
    expect(workflow.run.startedAtLabel).toBe('step-001')

    expect(workflow.events.map((event) => event.kind)).toEqual([
      'run_created',
      'run_started',
      'context_packet_built',
      'agent_invocation_started',
      'agent_invocation_completed',
      'agent_invocation_started',
      'agent_invocation_completed',
      'proposal_created',
      'review_requested',
    ])

    expect(workflow.events.map((event) => event.id)).toEqual([
      'run-event-scene-midnight-platform-002-001',
      'run-event-scene-midnight-platform-002-002',
      'run-event-scene-midnight-platform-002-003',
      'run-event-scene-midnight-platform-002-004',
      'run-event-scene-midnight-platform-002-005',
      'run-event-scene-midnight-platform-002-006',
      'run-event-scene-midnight-platform-002-007',
      'run-event-scene-midnight-platform-002-008',
      'run-event-scene-midnight-platform-002-009',
    ])
    expect(workflow.events.map((event) => event.createdAtLabel)).toEqual([
      'step-001',
      'step-002',
      'step-003',
      'step-004',
      'step-005',
      'step-006',
      'step-007',
      'step-008',
      'step-009',
    ])
    expect(workflow.events[2]).toMatchObject({
      kind: 'context_packet_built',
      metadata: {
        includedAssetCount: 3,
        excludedAssetCount: 1,
        redactedAssetCount: 1,
      },
    })
    expect(JSON.stringify(workflow.events[2])).not.toContain('activation-ren-voss')
    expect(JSON.stringify(workflow.events[2])).not.toContain('ren-scene-cast')

    expect(workflow.artifacts).toEqual([
      expect.objectContaining({
        kind: 'context-packet',
        id: 'ctx-scene-midnight-platform-run-002',
        runId: 'run-scene-midnight-platform-002',
        sceneId: 'scene-midnight-platform',
      }),
      expect.objectContaining({
        kind: 'agent-invocation',
        id: 'agent-invocation-scene-midnight-platform-run-002-001',
        runId: 'run-scene-midnight-platform-002',
        sceneId: 'scene-midnight-platform',
        meta: {
          role: 'planner',
          index: 1,
        },
      }),
      expect.objectContaining({
        kind: 'agent-invocation',
        id: 'agent-invocation-scene-midnight-platform-run-002-002',
        runId: 'run-scene-midnight-platform-002',
        sceneId: 'scene-midnight-platform',
        meta: {
          role: 'writer',
          index: 2,
        },
      }),
      expect.objectContaining({
        kind: 'proposal-set',
        id: 'proposal-set-scene-midnight-platform-run-002',
        runId: 'run-scene-midnight-platform-002',
        sceneId: 'scene-midnight-platform',
      }),
    ])

    const artifactIds = new Set(workflow.artifacts.map((artifact) => artifact.id))
    const refIds = workflow.events
      .flatMap((event) => event.refs ?? [])
      .filter((ref) => ref.kind === 'context-packet' || ref.kind === 'agent-invocation' || ref.kind === 'proposal-set')
      .map((ref) => ref.id)

    expect(refIds).toEqual([
      'ctx-scene-midnight-platform-run-002',
      'agent-invocation-scene-midnight-platform-run-002-001',
      'agent-invocation-scene-midnight-platform-run-002-001',
      'agent-invocation-scene-midnight-platform-run-002-002',
      'agent-invocation-scene-midnight-platform-run-002-002',
      'proposal-set-scene-midnight-platform-run-002',
    ])
    expect(refIds.every((id) => artifactIds.has(id))).toBe(true)
  })
})
