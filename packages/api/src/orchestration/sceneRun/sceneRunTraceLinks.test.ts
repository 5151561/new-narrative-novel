import { describe, expect, it } from 'vitest'

import {
  createAgentInvocationArtifact,
  createCanonPatchArtifact,
  createContextPacketArtifact,
  createProposalSetArtifact,
  createProseDraftArtifact,
} from './sceneRunArtifacts.js'
import {
  buildAgentInvocationDetail,
  buildCanonPatchDetail,
  buildContextPacketDetail,
  buildProposalSetDetail,
  buildProseDraftDetail,
} from './sceneRunArtifactDetails.js'
import {
  buildAcceptedRunTrace,
  buildInitialRunTrace,
  buildRejectedRunTrace,
  buildRewriteRunTrace,
} from './sceneRunTraceLinks.js'

describe('sceneRunTraceLinks', () => {
  const runId = 'run-scene-midnight-platform-002'
  const sceneId = 'scene-midnight-platform'

  function buildInitialArtifacts(selectedVariants?: Array<{ proposalId: string; variantId: string }>) {
    const contextPacket = buildContextPacketDetail({
      artifact: createContextPacketArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-003'],
    })
    const plannerInvocation = buildAgentInvocationDetail({
      artifact: createAgentInvocationArtifact({
        runId,
        sceneId,
        sequence: 2,
        index: 1,
        role: 'planner',
      }),
      sourceEventIds: [
        'run-event-scene-midnight-platform-002-004',
        'run-event-scene-midnight-platform-002-005',
      ],
      contextPacketId: contextPacket.id,
    })
    const writerInvocation = buildAgentInvocationDetail({
      artifact: createAgentInvocationArtifact({
        runId,
        sceneId,
        sequence: 2,
        index: 2,
        role: 'writer',
      }),
      sourceEventIds: [
        'run-event-scene-midnight-platform-002-006',
        'run-event-scene-midnight-platform-002-007',
      ],
      contextPacketId: contextPacket.id,
    })
    const proposalSet = buildProposalSetDetail({
      artifact: createProposalSetArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-008'],
      sourceInvocationIds: [plannerInvocation.id, writerInvocation.id],
      selectedVariants,
    })

    return {
      contextPacket,
      plannerInvocation,
      writerInvocation,
      proposalSet,
    }
  }

  it('builds the initial product trace from explicit artifact metadata', () => {
    const initial = buildInitialArtifacts()

    const trace = buildInitialRunTrace({
      runId,
      contextPacket: initial.contextPacket,
      agentInvocations: [initial.plannerInvocation, initial.writerInvocation],
      proposalSet: initial.proposalSet,
    })

    expect(trace.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 0,
      proseDraftCount: 0,
      missingTraceCount: 0,
    })
    expect(trace.nodes.map((node) => node.kind)).toEqual([
      'context-packet',
      'agent-invocation',
      'agent-invocation',
      'proposal-set',
      'review',
      'proposal',
      'proposal',
      'asset',
      'asset',
    ])
    expect(trace.links.map((link) => ({
      id: link.id,
      relation: link.relation,
      from: link.from.id,
      to: link.to.id,
    }))).toEqual([
      {
        id: 'trace-link-scene-midnight-platform-002-used_context-001',
        relation: 'used_context',
        from: initial.contextPacket.id,
        to: initial.plannerInvocation.id,
      },
      {
        id: 'trace-link-scene-midnight-platform-002-used_context-002',
        relation: 'used_context',
        from: initial.contextPacket.id,
        to: initial.writerInvocation.id,
      },
      {
        id: 'trace-link-scene-midnight-platform-002-generated-001',
        relation: 'generated',
        from: initial.plannerInvocation.id,
        to: initial.proposalSet.id,
      },
      {
        id: 'trace-link-scene-midnight-platform-002-generated-002',
        relation: 'generated',
        from: initial.writerInvocation.id,
        to: initial.proposalSet.id,
      },
      {
        id: 'trace-link-scene-midnight-platform-002-proposed-001',
        relation: 'proposed',
        from: initial.proposalSet.id,
        to: `${initial.proposalSet.id}-proposal-001`,
      },
      {
        id: 'trace-link-scene-midnight-platform-002-proposed-002',
        relation: 'proposed',
        from: initial.proposalSet.id,
        to: `${initial.proposalSet.id}-proposal-002`,
      },
      {
        id: 'trace-link-scene-midnight-platform-002-reviewed_by-001',
        relation: 'reviewed_by',
        from: initial.proposalSet.id,
        to: initial.proposalSet.reviewId,
      },
      {
        id: 'trace-link-scene-midnight-platform-002-mentions-001',
        relation: 'mentions',
        from: `${initial.proposalSet.id}-proposal-001`,
        to: 'asset-scene-midnight-platform-lead',
      },
      {
        id: 'trace-link-scene-midnight-platform-002-mentions-002',
        relation: 'mentions',
        from: `${initial.proposalSet.id}-proposal-002`,
        to: 'asset-scene-midnight-platform-setting',
      },
    ])
  })

  it('extends the initial trace with proposal to canon to prose links after acceptance', () => {
    const initial = buildInitialArtifacts()
    const canonPatch = buildCanonPatchDetail({
      artifact: createCanonPatchArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-011'],
      decision: 'accept',
      sourceProposalSetId: initial.proposalSet.id,
      acceptedProposalIds: [`${initial.proposalSet.id}-proposal-001`],
    })
    const proseDraft = buildProseDraftDetail({
      artifact: createProseDraftArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-012'],
      sourceCanonPatchId: canonPatch.id,
      sourceProposalIds: canonPatch.acceptedProposalIds,
    })

    const trace = buildAcceptedRunTrace({
      runId,
      contextPacket: initial.contextPacket,
      agentInvocations: [initial.plannerInvocation, initial.writerInvocation],
      proposalSet: initial.proposalSet,
      canonPatch,
      proseDraft,
    })

    expect(trace.summary).toEqual({
      proposalSetCount: 1,
      canonPatchCount: 1,
      proseDraftCount: 1,
      missingTraceCount: 0,
    })
    expect(trace.links).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'trace-link-scene-midnight-platform-002-accepted_into-001',
        relation: 'accepted_into',
        from: {
          kind: 'proposal',
          id: `${initial.proposalSet.id}-proposal-001`,
        },
        to: {
          kind: 'canon-fact',
          id: `${canonPatch.id}-fact-001`,
        },
      }),
      expect.objectContaining({
        id: 'trace-link-scene-midnight-platform-002-accepted_into-002',
        relation: 'accepted_into',
        from: {
          kind: 'canon-fact',
          id: `${canonPatch.id}-fact-001`,
        },
        to: {
          kind: 'canon-patch',
          id: canonPatch.id,
        },
      }),
      expect.objectContaining({
        id: 'trace-link-scene-midnight-platform-002-rendered_as-001',
        relation: 'rendered_as',
        from: {
          kind: 'canon-patch',
          id: canonPatch.id,
        },
        to: {
          kind: 'prose-draft',
          id: proseDraft.id,
        },
      }),
      expect.objectContaining({
        relation: 'mentions',
        from: {
          kind: 'canon-fact',
          id: `${canonPatch.id}-fact-001`,
        },
        to: {
          kind: 'asset',
          id: 'asset-scene-midnight-platform-lead',
        },
      }),
      expect.objectContaining({
        relation: 'mentions',
        from: {
          kind: 'prose-draft',
          id: proseDraft.id,
        },
        to: {
          kind: 'asset',
          id: 'asset-scene-midnight-platform-setting',
        },
      }),
    ]))
  })

  it('carries selected variant provenance in accepted and rendered trace labels', () => {
    const selectedVariant = {
      proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
      variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-reveal-pressure',
    }
    const initial = buildInitialArtifacts([selectedVariant])
    const canonPatch = buildCanonPatchDetail({
      artifact: createCanonPatchArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-011'],
      decision: 'accept-with-edit',
      sourceProposalSetId: initial.proposalSet.id,
      selectedVariants: [selectedVariant],
    })
    const proseDraft = buildProseDraftDetail({
      artifact: createProseDraftArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-012'],
      sourceCanonPatchId: canonPatch.id,
      sourceProposalIds: canonPatch.acceptedProposalIds,
      selectedVariants: canonPatch.selectedVariants,
    })

    const trace = buildAcceptedRunTrace({
      runId,
      contextPacket: initial.contextPacket,
      agentInvocations: [initial.plannerInvocation, initial.writerInvocation],
      proposalSet: initial.proposalSet,
      canonPatch,
      proseDraft,
    })

    expect(trace.links).toEqual(expect.arrayContaining([
      expect.objectContaining({
        relation: 'accepted_into',
        from: {
          kind: 'proposal',
          id: selectedVariant.proposalId,
        },
        label: {
          en: expect.stringContaining('selected variant Reveal pressure'),
          'zh-CN': expect.stringContaining('已选变体 揭示加压'),
        },
      }),
      expect.objectContaining({
        relation: 'rendered_as',
        from: {
          kind: 'canon-patch',
          id: canonPatch.id,
        },
        label: {
          en: expect.stringContaining('selected variant Reveal pressure'),
          'zh-CN': expect.stringContaining('已选变体 揭示加压'),
        },
      }),
    ]))
  })

  it('keeps rewrite traces free of canon and prose nodes', () => {
    const initial = buildInitialArtifacts()

    const trace = buildRewriteRunTrace({
      runId,
      contextPacket: initial.contextPacket,
      agentInvocations: [initial.plannerInvocation, initial.writerInvocation],
      proposalSet: initial.proposalSet,
    })

    expect(trace.nodes.some((node) => node.kind === 'canon-patch' || node.kind === 'canon-fact' || node.kind === 'prose-draft')).toBe(false)
    expect(trace.links.some((link) => link.relation === 'accepted_into' || link.relation === 'rendered_as')).toBe(false)
  })

  it('keeps reject traces free of canon and prose nodes', () => {
    const initial = buildInitialArtifacts()

    const trace = buildRejectedRunTrace({
      runId,
      contextPacket: initial.contextPacket,
      agentInvocations: [initial.plannerInvocation, initial.writerInvocation],
      proposalSet: initial.proposalSet,
    })

    expect(trace.nodes.some((node) => node.kind === 'canon-patch' || node.kind === 'canon-fact' || node.kind === 'prose-draft')).toBe(false)
    expect(trace.links.some((link) => link.relation === 'accepted_into' || link.relation === 'rendered_as')).toBe(false)
  })
})
