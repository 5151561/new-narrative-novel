import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import {
  getMockRunArtifact,
  getMockRunArtifacts,
  getMockRunTrace,
  resetMockRunDb,
  submitMockRunReviewDecision,
} from '@/features/run/api/mock-run-db'

import type { RunArtifactDetailRecord } from '../api/run-artifact-records'

import { RunEventInspectorPanel } from './RunEventInspectorPanel'

const runId = 'run-scene-midnight-platform-001'
const reviewId = 'review-scene-midnight-platform-001'
const contextPacketId = 'ctx-scene-midnight-platform-run-001'
const proposalSetId = 'proposal-set-scene-midnight-platform-run-001'

resetMockRunDb()
submitMockRunReviewDecision({
  runId,
  reviewId,
  decision: 'accept',
  selectedVariants: [
    {
      proposalId: `${proposalSetId}-proposal-001`,
      variantId: 'variant-midnight-platform-raise-conflict',
    },
  ],
})
const artifacts = getMockRunArtifacts({ runId }).artifacts
const trace = getMockRunTrace({ runId })
const providerErrorArtifact = {
  ...getMockRunArtifact({ runId, artifactId: proposalSetId }).artifact,
  usage: {
    inputTokens: 1420,
    outputTokens: 318,
    estimatedCostUsd: 0.0218,
    provider: 'openai',
    modelId: 'gpt-5.4',
  },
  failureDetail: {
    failureClass: 'provider_error' as const,
    message: 'Provider returned 502 while proposal packaging was being finalized.',
    provider: 'openai',
    modelId: 'gpt-5.4',
    retryable: true,
    sourceEventIds: ['run-event-scene-midnight-platform-001-007'],
  },
}

function getArtifactDetail(artifactId: string | null): RunArtifactDetailRecord | null {
  return artifactId ? getMockRunArtifact({ runId, artifactId }).artifact : null
}

const meta = {
  title: 'Business/Run/Event Inspector',
  component: RunEventInspectorPanel,
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => {
    const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(args.selectedArtifactId ?? null)
    const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
      [`${proposalSetId}-proposal-001`]: 'variant-midnight-platform-default',
    })
    const selectedArtifact = selectedArtifactId === args.selectedArtifactId && args.selectedArtifact
      ? args.selectedArtifact
      : getArtifactDetail(selectedArtifactId)

    return (
      <div className="min-h-[760px] bg-app p-6">
        <RunEventInspectorPanel
          {...args}
          selectedArtifactId={selectedArtifactId}
          selectedArtifact={selectedArtifact}
          onSelectArtifact={setSelectedArtifactId}
          selectedVariants={selectedVariants}
          onSelectProposalVariant={(proposalId, variantId) =>
            setSelectedVariants((current) => ({
              ...current,
              [proposalId]: variantId,
            }))
          }
        />
      </div>
    )
  },
  args: {
    artifacts,
    selectedArtifactId: contextPacketId,
    selectedArtifact: getArtifactDetail(contextPacketId),
    trace,
    isArtifactLoading: false,
    isTraceLoading: false,
    artifactError: null,
    traceError: null,
  },
} satisfies Meta<typeof RunEventInspectorPanel>

export default meta

type Story = StoryObj<typeof meta>

export const ContextPacket: Story = {}

export const TraceSummary: Story = {
  args: {
    mode: 'trace',
    selectedArtifactId: null,
    selectedArtifact: null,
  },
}

export const ProposalVariants: Story = {
  args: {
    selectedArtifactId: proposalSetId,
    selectedArtifact: getArtifactDetail(proposalSetId),
  },
}

export const ProviderError: Story = {
  args: {
    selectedArtifactId: proposalSetId,
    selectedArtifact: providerErrorArtifact,
  },
}
