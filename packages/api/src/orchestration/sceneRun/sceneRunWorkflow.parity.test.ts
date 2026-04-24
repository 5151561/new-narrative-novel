import { describe, expect, it } from 'vitest'

import { buildFixtureSceneRunTimelineLabel } from './sceneRunTimeline.js'
import { startSceneRunWorkflow } from './sceneRunWorkflow.js'

describe('startSceneRunWorkflow legacy deterministic start contract', () => {
  it('preserves the legacy fixture start semantics for ids, labels, summaries, refs, and artifacts', () => {
    const workflow = startSceneRunWorkflow({
      sceneId: 'scene-parity-check',
      mode: 'rewrite' as const,
      sequence: 1,
      note: '  Parity guard note.  ',
    }, {
      buildTimelineLabel: buildFixtureSceneRunTimelineLabel,
    })

    expect(workflow.run).toEqual({
      id: 'run-scene-parity-check-001',
      scope: 'scene',
      scopeId: 'scene-parity-check',
      status: 'waiting_review',
      title: 'scene-parity-check run',
      summary: 'Waiting for review: Parity guard note.',
      startedAtLabel: '2026-04-23 10:01',
      pendingReviewId: 'review-scene-parity-check-001',
      latestEventId: 'run-event-scene-parity-check-001-009',
      eventCount: 9,
    })

    expect(workflow.events).toEqual([
      {
        id: 'run-event-scene-parity-check-001-001',
        runId: 'run-scene-parity-check-001',
        order: 1,
        kind: 'run_created',
        label: 'Run created',
        summary: 'Scene run was created in rewrite mode.',
        createdAtLabel: '2026-04-23 10:01',
        refs: undefined,
      },
      {
        id: 'run-event-scene-parity-check-001-002',
        runId: 'run-scene-parity-check-001',
        order: 2,
        kind: 'run_started',
        label: 'Run started',
        summary: 'Narrative runtime started the scene run.',
        createdAtLabel: '2026-04-23 10:02',
        refs: undefined,
      },
      {
        id: 'run-event-scene-parity-check-001-003',
        runId: 'run-scene-parity-check-001',
        order: 3,
        kind: 'context_packet_built',
        label: 'Context packet built',
        summary: 'Runtime assembled the scene context packet.',
        createdAtLabel: '2026-04-23 10:03',
        refs: [
          {
            kind: 'context-packet',
            id: 'ctx-scene-parity-check-run-001',
            label: 'Scene context packet',
          },
        ],
        metadata: {
          includedAssetCount: 3,
          excludedAssetCount: 1,
          redactedAssetCount: 1,
        },
      },
      {
        id: 'run-event-scene-parity-check-001-004',
        runId: 'run-scene-parity-check-001',
        order: 4,
        kind: 'agent_invocation_started',
        label: 'Planner invocation started',
        summary: 'Planning agent invocation started.',
        createdAtLabel: '2026-04-23 10:04',
        refs: [
          {
            kind: 'agent-invocation',
            id: 'agent-invocation-scene-parity-check-run-001-001',
            label: 'Planner',
          },
        ],
      },
      {
        id: 'run-event-scene-parity-check-001-005',
        runId: 'run-scene-parity-check-001',
        order: 5,
        kind: 'agent_invocation_completed',
        label: 'Planner invocation completed',
        summary: 'Planning agent returned proposal candidates.',
        createdAtLabel: '2026-04-23 10:05',
        refs: [
          {
            kind: 'agent-invocation',
            id: 'agent-invocation-scene-parity-check-run-001-001',
            label: 'Planner',
          },
        ],
      },
      {
        id: 'run-event-scene-parity-check-001-006',
        runId: 'run-scene-parity-check-001',
        order: 6,
        kind: 'agent_invocation_started',
        label: 'Writer invocation started',
        summary: 'Writer agent invocation started.',
        createdAtLabel: '2026-04-23 10:06',
        refs: [
          {
            kind: 'agent-invocation',
            id: 'agent-invocation-scene-parity-check-run-001-002',
            label: 'Writer',
          },
        ],
      },
      {
        id: 'run-event-scene-parity-check-001-007',
        runId: 'run-scene-parity-check-001',
        order: 7,
        kind: 'agent_invocation_completed',
        label: 'Writer invocation completed',
        summary: 'Writer agent returned prose candidates.',
        createdAtLabel: '2026-04-23 10:07',
        refs: [
          {
            kind: 'agent-invocation',
            id: 'agent-invocation-scene-parity-check-run-001-002',
            label: 'Writer',
          },
        ],
      },
      {
        id: 'run-event-scene-parity-check-001-008',
        runId: 'run-scene-parity-check-001',
        order: 8,
        kind: 'proposal_created',
        label: 'Proposal set created',
        summary: 'A proposal set is ready for review.',
        createdAtLabel: '2026-04-23 10:08',
        refs: [
          {
            kind: 'proposal-set',
            id: 'proposal-set-scene-parity-check-run-001',
            label: 'Scene proposal set',
          },
        ],
      },
      {
        id: 'run-event-scene-parity-check-001-009',
        runId: 'run-scene-parity-check-001',
        order: 9,
        kind: 'review_requested',
        label: 'Review requested',
        summary: 'Editorial review is waiting on the proposal set.',
        createdAtLabel: '2026-04-23 10:09',
        refs: [
          {
            kind: 'review',
            id: 'review-scene-parity-check-001',
            label: 'Editorial review',
          },
        ],
      },
    ])

    expect(workflow.artifacts).toEqual([
      {
        kind: 'context-packet',
        id: 'ctx-scene-parity-check-run-001',
        runId: 'run-scene-parity-check-001',
        sceneId: 'scene-parity-check',
        title: 'Scene context packet',
        summary: 'Runtime assembled the scene context packet for the run.',
        status: 'built',
      },
      {
        kind: 'agent-invocation',
        id: 'agent-invocation-scene-parity-check-run-001-001',
        runId: 'run-scene-parity-check-001',
        sceneId: 'scene-parity-check',
        title: 'Planner',
        summary: 'Planner invocation prepared for scene run execution.',
        status: 'completed',
        meta: {
          role: 'planner',
          index: 1,
        },
      },
      {
        kind: 'agent-invocation',
        id: 'agent-invocation-scene-parity-check-run-001-002',
        runId: 'run-scene-parity-check-001',
        sceneId: 'scene-parity-check',
        title: 'Writer',
        summary: 'Writer invocation prepared for scene run execution.',
        status: 'completed',
        meta: {
          role: 'writer',
          index: 2,
        },
      },
      {
        kind: 'proposal-set',
        id: 'proposal-set-scene-parity-check-run-001',
        runId: 'run-scene-parity-check-001',
        sceneId: 'scene-parity-check',
        title: 'Scene proposal set',
        summary: 'Combined planner and writer output is ready for editorial review.',
        status: 'ready',
      },
    ])
  })
})
