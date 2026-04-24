import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'

import type { RunEventRefRecord } from '../api/run-records'

import { RunArtifactRefList } from './RunArtifactRefList'

const refs: RunEventRefRecord[] = [
  { kind: 'context-packet', id: 'ctx-scene-midnight-platform-run-001', label: 'Scene context packet' },
  { kind: 'agent-invocation', id: 'agent-invocation-scene-midnight-platform-run-001-001', label: 'Planner invocation' },
  { kind: 'proposal-set', id: 'proposal-set-scene-midnight-platform-run-001', label: 'Scene proposal set' },
  { kind: 'review', id: 'review-scene-midnight-platform-001', label: 'Editorial review' },
]

const meta = {
  title: 'Business/Run/Artifact Ref List',
  component: RunArtifactRefList,
  parameters: {
    layout: 'padded',
  },
  render: (args) => {
    const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(args.selectedArtifactId ?? null)

    return (
      <div className="rounded-md border border-line-soft bg-surface-1 p-4">
        <RunArtifactRefList
          {...args}
          selectedArtifactId={selectedArtifactId}
          onSelectArtifact={(artifactId) => setSelectedArtifactId(artifactId)}
        />
      </div>
    )
  },
  args: {
    refs,
    selectedArtifactId: 'ctx-scene-midnight-platform-run-001',
  },
} satisfies Meta<typeof RunArtifactRefList>

export default meta

type Story = StoryObj<typeof meta>

export const EventsWithClickableRefs: Story = {}
