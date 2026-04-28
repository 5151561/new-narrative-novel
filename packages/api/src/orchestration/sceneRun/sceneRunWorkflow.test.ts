import { describe, expect, it } from 'vitest'

import type { RunContextAssetActivationRecord } from '../../contracts/api-records.js'
import { createFixtureDataSnapshot } from '../../repositories/fixture-data.js'
import { buildSceneContextPacket } from '../contextBuilder/sceneContextBuilder.js'
import { startSceneRunWorkflow } from './sceneRunWorkflow.js'

describe('startSceneRunWorkflow', () => {
  it('threads canonical planner proposals and compact provenance into start artifacts before details are built', () => {
    const workflow = startSceneRunWorkflow({
      sceneId: 'scene-midnight-platform',
      sequence: 2,
      plannerOutput: {
        proposals: [
          {
            title: '  Shift the first alarm  ',
            summary: '  Start on the alarm before the train doors settle.  ',
            changeKind: 'action',
            riskLabel: '  Editor check recommended  ',
            variants: [
              {
                label: '  Hold wide  ',
                summary: '  Keep the platform wide before focusing on Ren.  ',
                rationale: '  Gives the reveal more runway.  ',
                tradeoffLabel: '  Slower focus  ',
                riskLabel: '  Low continuity risk  ',
              },
              {
                label: 'Cut to Ren',
                summary: 'Snap straight to Ren before the station settles.',
                rationale: 'Raises tension immediately.',
              },
            ],
          },
          {
            title: 'Echo the bargain promise',
            summary: 'Carry the promise through platform ambience instead of exposition.',
            changeKind: 'reveal',
            riskLabel: 'Continuity review required',
          },
        ],
      },
      plannerProvenance: {
        provider: 'openai-compatible',
        providerId: 'deepseek',
        providerLabel: 'DeepSeek',
        modelId: 'gpt-5.4',
      },
    }, {
      buildTimelineLabel: (order) => `step-${String(order).padStart(3, '0')}`,
    })

    expect(workflow.artifacts[1]).toMatchObject({
      kind: 'agent-invocation',
      id: 'agent-invocation-scene-midnight-platform-run-002-001',
      meta: {
        role: 'planner',
        index: 1,
        provenance: {
          provider: 'openai-compatible',
          providerId: 'deepseek',
          providerLabel: 'DeepSeek',
          modelId: 'gpt-5.4',
        },
      },
    })

    expect(workflow.artifacts[2]).toMatchObject({
      kind: 'agent-invocation',
      id: 'agent-invocation-scene-midnight-platform-run-002-002',
      meta: {
        role: 'writer',
        index: 2,
      },
    })
    expect(JSON.stringify(workflow.artifacts[1])).not.toContain('Start on the alarm before the train doors settle')

    expect(workflow.artifacts[3]).toMatchObject({
      kind: 'proposal-set',
      id: 'proposal-set-scene-midnight-platform-run-002',
      meta: {
        proposals: [
          {
            id: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
            title: 'Shift the first alarm',
            summary: 'Start on the alarm before the train doors settle.',
            changeKind: 'action',
            riskLabel: 'Editor check recommended',
            variants: [
              {
                id: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
                label: 'Hold wide',
                summary: 'Keep the platform wide before focusing on Ren.',
                rationale: 'Gives the reveal more runway.',
                tradeoffLabel: 'Slower focus',
                riskLabel: 'Low continuity risk',
              },
              {
                id: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
                label: 'Cut to Ren',
                summary: 'Snap straight to Ren before the station settles.',
                rationale: 'Raises tension immediately.',
              },
            ],
          },
          {
            id: 'proposal-set-scene-midnight-platform-run-002-proposal-002',
            title: 'Echo the bargain promise',
            summary: 'Carry the promise through platform ambience instead of exposition.',
            changeKind: 'reveal',
            riskLabel: 'Continuity review required',
          },
        ],
      },
    })
  })

  it('builds a pure scene run workflow state with ordered events and internal artifacts', () => {
    const workflow = startSceneRunWorkflow({
      sceneId: 'scene-midnight-platform',
      sequence: 2,
      mode: 'rewrite',
      note: 'Tighten the ending beat.',
      plannerOutput: {
        proposals: [
          {
            title: 'Anchor the arrival beat',
            summary: 'Open on Midnight Platform before introducing any new reveal.',
            changeKind: 'action',
            riskLabel: 'Low continuity risk',
            variants: [
              {
                label: 'Arrival-first',
                summary: "Keep Midnight Platform grounded in the lead character's arrival before escalating the reveal.",
                rationale: 'Preserves continuity while still giving the scene a clear forward beat.',
                tradeoffLabel: 'Slower escalation',
                riskLabel: 'Low continuity risk',
              },
              {
                label: 'Reveal pressure',
                summary: 'Let the reveal intrude earlier while Midnight Platform is still settling.',
                rationale: 'Creates a sharper hook, but asks review to accept a faster continuity turn.',
                tradeoffLabel: 'Sharper hook',
                riskLabel: 'Higher continuity risk',
              },
            ],
          },
          {
            title: 'Stage the reveal through the setting',
            summary: 'Let the Midnight Platform setting carry the reveal instead of adding raw exposition.',
            changeKind: 'reveal',
            riskLabel: 'Editor check recommended',
          },
        ],
      },
      plannerProvenance: {
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
      },
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
      usage: {
        inputTokens: 1700,
        outputTokens: 240,
        estimatedCostUsd: 0.0246,
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
      },
      runtimeSummary: {
        health: 'attention',
        tokenLabel: '1.9k tokens',
        costLabel: '$0.0246 est.',
        failureClassLabel: 'No runtime failure recorded',
        nextActionLabel: 'Review proposals before any retry or prose continuation.',
      },
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
    expect(workflow.events[4]).toMatchObject({
      kind: 'agent_invocation_completed',
      usage: {
        inputTokens: 1700,
        outputTokens: 240,
        estimatedCostUsd: 0.0246,
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
      },
    })

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
          provenance: {
            provider: 'fixture',
            modelId: 'fixture-scene-planner',
          },
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
        meta: {
          proposals: [
            {
              id: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
              title: 'Anchor the arrival beat',
              summary: 'Open on Midnight Platform before introducing any new reveal.',
              changeKind: 'action',
              riskLabel: 'Low continuity risk',
              variants: [
                {
                  id: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-001',
                  label: 'Arrival-first',
                  summary: "Keep Midnight Platform grounded in the lead character's arrival before escalating the reveal.",
                  rationale: 'Preserves continuity while still giving the scene a clear forward beat.',
                  tradeoffLabel: 'Slower escalation',
                  riskLabel: 'Low continuity risk',
                },
                {
                  id: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
                  label: 'Reveal pressure',
                  summary: 'Let the reveal intrude earlier while Midnight Platform is still settling.',
                  rationale: 'Creates a sharper hook, but asks review to accept a faster continuity turn.',
                  tradeoffLabel: 'Sharper hook',
                  riskLabel: 'Higher continuity risk',
                },
              ],
            },
            {
              id: 'proposal-set-scene-midnight-platform-run-002-proposal-002',
              title: 'Stage the reveal through the setting',
              summary: 'Let the Midnight Platform setting carry the reveal instead of adding raw exposition.',
              changeKind: 'reveal',
              riskLabel: 'Editor check recommended',
            },
          ],
        },
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

  it('carries retry and resumable metadata into resumed follow-up runs', () => {
    const workflow = startSceneRunWorkflow({
      sceneId: 'scene-midnight-platform',
      sequence: 3,
      mode: 'continue',
      retryOfRunId: 'run-scene-midnight-platform-002',
      resumableFromEventId: 'run-event-scene-midnight-platform-002-009',
      resumeSourceRunId: 'run-scene-midnight-platform-002',
      plannerOutput: {
        proposals: [
          {
            title: 'Resume from the failed writer beat',
            summary: 'Pick up from the last stable event without rewriting canon.',
            changeKind: 'action',
            riskLabel: 'Low continuity risk',
          },
        ],
      },
      plannerProvenance: {
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
      },
    }, {
      buildTimelineLabel: (order) => `step-${String(order).padStart(3, '0')}`,
    })

    expect(workflow.run).toMatchObject({
      id: 'run-scene-midnight-platform-003',
      retryOfRunId: 'run-scene-midnight-platform-002',
      resumableFromEventId: 'run-event-scene-midnight-platform-002-009',
      latestEventId: 'run-event-scene-midnight-platform-003-010',
      eventCount: 10,
    })
    expect(workflow.events.at(-1)).toMatchObject({
      kind: 'run_resumed',
      summary: 'Run resumed from run-scene-midnight-platform-002 at event run-event-scene-midnight-platform-002-009.',
    })
  })

  it('derives context packet event metadata counts from the persisted packet instead of hard-coded defaults', () => {
    const snapshot = createFixtureDataSnapshot('http://127.0.0.1:4174/api')
    const basePacket = buildSceneContextPacket({
      project: snapshot.projects['book-signal-arc'],
      sceneId: 'scene-midnight-platform',
      sequence: 2,
    })
    const contextPacket = {
      ...basePacket,
      assetActivations: [
        ...basePacket.assetActivations,
        {
          id: `${basePacket.packetId}-activation-extra-excluded`,
          assetId: 'asset-extra-excluded',
          assetTitle: { en: 'Extra excluded', 'zh-CN': '额外排除项' },
          assetKind: 'lore' as const,
          decision: 'excluded' as const,
          reasonKind: 'rule-dependency' as const,
          reasonLabel: { en: 'Extra excluded lore', 'zh-CN': '额外排除 lore' },
          visibility: 'spoiler' as const,
          budget: 'summary-only' as const,
          targetAgents: ['scene-manager'],
        } satisfies RunContextAssetActivationRecord,
        {
          id: `${basePacket.packetId}-activation-extra-redacted`,
          assetId: 'asset-extra-redacted',
          assetTitle: { en: 'Extra redacted', 'zh-CN': '额外遮蔽项' },
          assetKind: 'lore' as const,
          decision: 'redacted' as const,
          reasonKind: 'review-issue' as const,
          reasonLabel: { en: 'Extra redacted lore', 'zh-CN': '额外遮蔽 lore' },
          visibility: 'editor-only' as const,
          budget: 'summary-only' as const,
          targetAgents: ['continuity-reviewer'],
        } satisfies RunContextAssetActivationRecord,
      ],
      activationSummary: {
        ...basePacket.activationSummary,
        excludedAssetCount: basePacket.activationSummary.excludedAssetCount + 1,
        redactedAssetCount: basePacket.activationSummary.redactedAssetCount + 1,
      },
    }

    const workflow = startSceneRunWorkflow({
      sceneId: 'scene-midnight-platform',
      sequence: 2,
      plannerOutput: {
        proposals: [
          {
            title: 'Anchor the arrival beat',
            summary: 'Open on Midnight Platform before introducing any new reveal.',
            changeKind: 'action',
            riskLabel: 'Low continuity risk',
          },
        ],
      },
      plannerProvenance: {
        provider: 'fixture',
        modelId: 'fixture-scene-planner',
      },
      contextPacket,
    })

    expect(workflow.events[2]).toMatchObject({
      kind: 'context_packet_built',
      metadata: {
        includedAssetCount: 6,
        excludedAssetCount: 1,
        redactedAssetCount: 2,
      },
    })
    expect(JSON.stringify(workflow.events[2])).not.toContain('activation-extra-excluded')
    expect(workflow.artifacts[0]).toMatchObject({
      meta: {
        contextPacket: {
          activationSummary: {
            includedAssetCount: 6,
            excludedAssetCount: 1,
            redactedAssetCount: 2,
          },
        },
      },
    })
  })
})
