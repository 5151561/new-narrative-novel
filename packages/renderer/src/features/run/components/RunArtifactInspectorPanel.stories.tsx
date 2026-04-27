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
const proposalSet = getMockRunArtifact({ runId, artifactId: proposalSetId }).artifact
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
