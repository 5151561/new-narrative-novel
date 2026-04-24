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

resetMockRunDb()
submitMockRunReviewDecision({ runId, reviewId, decision: 'accept' })
const artifacts = getMockRunArtifacts({ runId }).artifacts
const trace = getMockRunTrace({ runId })

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
    const selectedArtifact = getArtifactDetail(selectedArtifactId)

    return (
      <div className="min-h-[760px] bg-app p-6">
        <RunEventInspectorPanel
          {...args}
          selectedArtifactId={selectedArtifactId}
          selectedArtifact={selectedArtifact}
          onSelectArtifact={setSelectedArtifactId}
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
