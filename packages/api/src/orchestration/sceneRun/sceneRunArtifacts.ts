import type { ScenePlannerGatewayProvenance } from '../modelGateway/scenePlannerGateway.js'
import type { ScenePlannerOutput } from '../modelGateway/scenePlannerOutputSchema.js'
import type {
  SceneRunArtifactRecord,
  SceneRunCanonicalPlannerProposalRecord,
  SceneRunCanonicalPlannerVariantRecord,
} from './sceneRunRecords.js'
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
  provenance?: ScenePlannerGatewayProvenance
}

interface ProposalSetArtifactInput extends SceneRunArtifactBaseInput {
  plannerOutput?: ScenePlannerOutput
}

function formatSceneName(sceneId: string) {
  return sceneId
    .replace(/^scene-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function trimOptional(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function buildDefaultPlannerOutput(sceneId: string): ScenePlannerOutput {
  const sceneName = formatSceneName(sceneId)

  return {
    proposals: [
      {
        title: 'Anchor the arrival beat',
        summary: `Open on ${sceneName} before introducing any new reveal.`,
        changeKind: 'action',
        riskLabel: 'Low continuity risk',
        variants: [
          {
            label: 'Arrival-first',
            summary: `Keep ${sceneName} grounded in the lead character's arrival before escalating the reveal.`,
            rationale: 'Preserves continuity while still giving the scene a clear forward beat.',
            tradeoffLabel: 'Slower escalation',
            riskLabel: 'Low continuity risk',
          },
          {
            label: 'Reveal pressure',
            summary: `Let the reveal intrude earlier while ${sceneName} is still settling.`,
            rationale: 'Creates a sharper hook, but asks review to accept a faster continuity turn.',
            tradeoffLabel: 'Sharper hook',
            riskLabel: 'Higher continuity risk',
          },
        ],
      },
      {
        title: 'Stage the reveal through the setting',
        summary: `Let the ${sceneName} setting carry the reveal instead of adding raw exposition.`,
        changeKind: 'reveal',
        riskLabel: 'Editor check recommended',
      },
    ],
  }
}

function canonicalizePlannerVariants(
  proposalId: string,
  variants?: ScenePlannerOutput['proposals'][number]['variants'],
): SceneRunCanonicalPlannerVariantRecord[] | undefined {
  if (!variants?.length) {
    return undefined
  }

  return variants.map((variant, index) => ({
    id: `${proposalId}-variant-${String(index + 1).padStart(3, '0')}`,
    label: variant.label.trim(),
    summary: variant.summary.trim(),
    rationale: variant.rationale.trim(),
    ...(trimOptional(variant.tradeoffLabel) ? { tradeoffLabel: trimOptional(variant.tradeoffLabel) } : {}),
    ...(trimOptional(variant.riskLabel) ? { riskLabel: trimOptional(variant.riskLabel) } : {}),
  }))
}

function canonicalizePlannerProposals(
  proposalSetId: string,
  plannerOutput: ScenePlannerOutput | undefined,
  sceneId: string,
): SceneRunCanonicalPlannerProposalRecord[] {
  return (plannerOutput ?? buildDefaultPlannerOutput(sceneId)).proposals.map((proposal, index) => {
    const proposalId = `${proposalSetId}-proposal-${String(index + 1).padStart(3, '0')}`
    const variants = canonicalizePlannerVariants(proposalId, proposal.variants)

    return {
      id: proposalId,
      title: proposal.title.trim(),
      summary: proposal.summary.trim(),
      changeKind: proposal.changeKind,
      riskLabel: proposal.riskLabel.trim(),
      ...(variants ? { variants } : {}),
    }
  })
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
  const plannerMeta = input.role === 'planner' && input.provenance
    ? {
        provenance: {
          provider: input.provenance.provider,
          modelId: input.provenance.modelId,
          ...(input.provenance.fallbackReason ? { fallbackReason: input.provenance.fallbackReason } : {}),
        },
      }
    : {}

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
      ...plannerMeta,
    },
  }
}

export function createProposalSetArtifact(input: ProposalSetArtifactInput): SceneRunArtifactRecord {
  const proposalSetId = buildProposalSetId(input.sceneId, input.sequence)

  return {
    kind: 'proposal-set',
    id: proposalSetId,
    runId: input.runId,
    sceneId: input.sceneId,
    title: 'Scene proposal set',
    summary: 'Combined planner and writer output is ready for editorial review.',
    status: 'ready',
    meta: {
      proposals: canonicalizePlannerProposals(proposalSetId, input.plannerOutput, input.sceneId),
    },
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
