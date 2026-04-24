import type { Meta, StoryObj } from '@storybook/react'

import { getMockRunArtifact, resetMockRunDb } from '@/features/run/api/mock-run-db'

import type { ContextPacketArtifactDetailRecord } from '../api/run-artifact-records'

import { RunContextAssetActivationList } from './RunContextAssetActivationList'

const runId = 'run-scene-midnight-platform-001'
const contextPacketId = 'ctx-scene-midnight-platform-run-001'

resetMockRunDb()
const contextPacket = getMockRunArtifact({ runId, artifactId: contextPacketId }).artifact as ContextPacketArtifactDetailRecord
const redactedActivations = contextPacket.assetActivations?.filter((activation) => activation.decision === 'redacted') ?? []

const meta = {
  title: 'Business/Run/Context Asset Activation List',
  component: RunContextAssetActivationList,
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="min-h-[720px] bg-app p-6">
      <RunContextAssetActivationList {...args} />
    </div>
  ),
  args: {
    activations: contextPacket.assetActivations,
    summary: contextPacket.activationSummary,
    onOpenAssetContext: () => undefined,
  },
} satisfies Meta<typeof RunContextAssetActivationList>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const RedactedAssets: Story = {
  args: {
    activations: redactedActivations,
    summary: {
      includedAssetCount: 0,
      excludedAssetCount: 0,
      redactedAssetCount: redactedActivations.length,
      targetAgentCount: new Set(redactedActivations.flatMap((activation) => activation.targetAgents)).size,
      warningCount: redactedActivations.length,
    },
  },
}

export const Empty: Story = {
  args: {
    activations: [],
    summary: undefined,
  },
}
