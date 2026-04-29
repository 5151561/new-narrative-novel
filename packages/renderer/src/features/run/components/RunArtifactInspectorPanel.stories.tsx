import type { Meta, StoryObj } from '@storybook/react'

import {
  getMockRunArtifact,
  resetMockRunDb,
  submitMockRunReviewDecision,
} from '@/features/run/api/mock-run-db'

import type { ContextPacketArtifactDetailRecord } from '../api/run-artifact-records'

import { RunArtifactInspectorPanel } from './RunArtifactInspectorPanel'

const runId = 'run-scene-midnight-platform-001'
const reviewId = 'review-scene-midnight-platform-001'
const contextPacketId = 'ctx-scene-midnight-platform-run-001'
const plannerInvocationId = 'agent-invocation-scene-midnight-platform-run-001-001'
const proposalSetId = 'proposal-set-scene-midnight-platform-run-001'
const canonPatchId = 'canon-patch-scene-midnight-platform-001'
const proseDraftId = 'prose-draft-scene-midnight-platform-001'
const selectedVariants = [
  {
    proposalId: `${proposalSetId}-proposal-001`,
    variantId: 'variant-midnight-platform-raise-conflict',
  },
]

resetMockRunDb()
const contextPacket = getMockRunArtifact({ runId, artifactId: contextPacketId }).artifact as ContextPacketArtifactDetailRecord
const contextPacketRedactedAssets: ContextPacketArtifactDetailRecord = {
  ...contextPacket,
  assetActivations: contextPacket.assetActivations?.filter((activation) => activation.decision === 'redacted'),
  activationSummary: {
    includedAssetCount: 0,
    excludedAssetCount: 0,
    redactedAssetCount: contextPacket.assetActivations?.filter((activation) => activation.decision === 'redacted').length ?? 0,
    targetAgentCount: new Set(
      contextPacket.assetActivations
        ?.filter((activation) => activation.decision === 'redacted')
        .flatMap((activation) => activation.targetAgents) ?? [],
    ).size,
    warningCount: contextPacket.activationSummary?.warningCount ?? 0,
  },
}
const plannerInvocation = getMockRunArtifact({ runId, artifactId: plannerInvocationId }).artifact
const proposalSet = getMockRunArtifact({ runId, artifactId: proposalSetId }).artifact
const failedArtifactDetail = {
  ...plannerInvocation,
  title: {
    en: 'Planner invocation failed',
    'zh-CN': '规划器调用失败',
  },
  summary: {
    en: 'The real-provider planner invocation returned output that failed structured validation for this run.',
    'zh-CN': '这次真实提供方规划器调用返回了未通过结构化校验的输出。',
  },
  modelLabel: {
    en: 'OpenAI planner profile',
    'zh-CN': 'OpenAI 规划器配置',
  },
  outputSummary: {
    en: 'No proposal set was emitted because planner output failed normalization.',
    'zh-CN': '由于规划器输出归一化失败，本次未产生提案集。',
  },
  generatedRefs: [],
  provenance: {
    provider: 'openai',
    providerId: 'openai',
    providerLabel: 'OpenAI',
    modelId: 'gpt-5.4',
    projectMode: 'real-project' as const,
    fallbackUsed: false,
  },
  usage: {
    inputTokens: 1420,
    outputTokens: 318,
    estimatedCostUsd: 0.0218,
    actualCostUsd: 0.0241,
    provider: 'openai',
    modelId: 'gpt-5.4',
    projectMode: 'real-project' as const,
    fallbackUsed: false,
  },
  failureDetail: {
    failureClass: 'invalid_output' as const,
    message: 'Proposal normalization failed because no safe variant survived validation.',
    provider: 'openai',
    modelId: 'gpt-5.4',
    projectMode: 'real-project' as const,
    fallbackUsed: false,
    retryable: false,
    sourceEventIds: ['run-event-scene-midnight-platform-001-007', 'run-event-scene-midnight-platform-001-008'],
  },
}
submitMockRunReviewDecision({ runId, reviewId, decision: 'accept', selectedVariants })
const submittedProposalSet = getMockRunArtifact({ runId, artifactId: proposalSetId }).artifact
const canonPatch = getMockRunArtifact({ runId, artifactId: canonPatchId }).artifact
const proseDraft = getMockRunArtifact({ runId, artifactId: proseDraftId }).artifact

const meta = {
  title: 'Business/Run/Artifact Inspector',
  component: RunArtifactInspectorPanel,
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="min-h-[720px] bg-app p-6">
      <RunArtifactInspectorPanel {...args} />
    </div>
  ),
  args: {
    artifact: contextPacket,
    isLoading: false,
    error: null,
  },
} satisfies Meta<typeof RunArtifactInspectorPanel>

export default meta

type Story = StoryObj<typeof meta>

export const ContextPacket: Story = {}

export const ContextPacketWithActivations: Story = {
  args: {
    artifact: contextPacket,
    onOpenAssetContext: () => undefined,
  },
}

export const ContextPacketRedactedAssets: Story = {
  args: {
    artifact: contextPacketRedactedAssets,
    onOpenAssetContext: () => undefined,
  },
}

export const ProposalSet: Story = {
  args: {
    artifact: proposalSet,
  },
}

export const ProposalSetDemoFixtureProvenance: Story = {
  args: {
    artifact: proposalSet,
  },
}

export const ProposalSetWithTwoVariants: Story = {
  args: {
    artifact: proposalSet,
    selectedVariants: {
      [`${proposalSetId}-proposal-001`]: 'variant-midnight-platform-default',
    },
  },
}

export const SelectedVariantSubmitted: Story = {
  args: {
    artifact: submittedProposalSet,
    selectedVariants: {
      [`${proposalSetId}-proposal-001`]: 'variant-midnight-platform-raise-conflict',
    },
  },
}

export const CanonPatch: Story = {
  args: {
    artifact: canonPatch,
  },
}

export const ProseDraft: Story = {
  args: {
    artifact: proseDraft,
  },
}

export const ProseDraftLinkedContext: Story = {
  args: {
    artifact: proseDraft,
  },
}

export const ProseDraftWithContextRef: Story = ProseDraftLinkedContext

export const ErrorArtifactNotFound: Story = {
  args: {
    artifact: null,
    error: new Error('Run artifact missing-artifact was not found.'),
  },
}

export const FailedArtifactDetail: Story = {
  args: {
    artifact: failedArtifactDetail,
  },
}
