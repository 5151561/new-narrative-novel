import type { SceneRunArtifactRecord } from './sceneRunRecords.js'
import {
  buildAgentInvocationId,
  buildCanonPatchId,
  buildContextPacketId,
  buildProseDraftId,
  buildProposalSetId,
} from './sceneRunIds.js'

interface SceneRunArtifactBaseInput {
  runId: string
  sceneId: string
  sequence: number
}

interface AgentInvocationArtifactInput extends SceneRunArtifactBaseInput {
  index: number
  role: 'planner' | 'writer'
}

export function createContextPacketArtifact(input: SceneRunArtifactBaseInput): SceneRunArtifactRecord {
  return {
    kind: 'context-packet',
    id: buildContextPacketId(input.sceneId, input.sequence),
    runId: input.runId,
    sceneId: input.sceneId,
    title: 'Scene context packet',
    summary: 'Runtime assembled the scene context packet for the run.',
    status: 'built',
  }
}

export function createAgentInvocationArtifact(input: AgentInvocationArtifactInput): SceneRunArtifactRecord {
  const title = input.role === 'planner' ? 'Planner' : 'Writer'
  return {
    kind: 'agent-invocation',
    id: buildAgentInvocationId(input.sceneId, input.sequence, input.index),
    runId: input.runId,
    sceneId: input.sceneId,
    title,
    summary: `${title} invocation prepared for scene run execution.`,
    status: 'completed',
    meta: {
      role: input.role,
      index: input.index,
    },
  }
}

export function createProposalSetArtifact(input: SceneRunArtifactBaseInput): SceneRunArtifactRecord {
  return {
    kind: 'proposal-set',
    id: buildProposalSetId(input.sceneId, input.sequence),
    runId: input.runId,
    sceneId: input.sceneId,
    title: 'Scene proposal set',
    summary: 'Combined planner and writer output is ready for editorial review.',
    status: 'ready',
  }
}

export function createCanonPatchArtifact(input: SceneRunArtifactBaseInput): SceneRunArtifactRecord {
  return {
    kind: 'canon-patch',
    id: buildCanonPatchId(input.sceneId, input.sequence),
    runId: input.runId,
    sceneId: input.sceneId,
    title: 'Canon patch',
    summary: 'Accepted canon patch for the scene run.',
    status: 'applied',
  }
}

export function createProseDraftArtifact(input: SceneRunArtifactBaseInput): SceneRunArtifactRecord {
  return {
    kind: 'prose-draft',
    id: buildProseDraftId(input.sceneId, input.sequence),
    runId: input.runId,
    sceneId: input.sceneId,
    title: 'Prose draft',
    summary: 'Generated prose draft for the scene run.',
    status: 'generated',
  }
}
