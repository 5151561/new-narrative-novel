import type { Meta, StoryObj } from '@storybook/react'

import {
  getMockRunTrace,
  resetMockRunDb,
  submitMockRunReviewDecision,
} from '@/features/run/api/mock-run-db'

import { RunTracePanel } from './RunTracePanel'

const runId = 'run-scene-midnight-platform-001'
const reviewId = 'review-scene-midnight-platform-001'

resetMockRunDb()
submitMockRunReviewDecision({ runId, reviewId, decision: 'accept' })
const trace = getMockRunTrace({ runId })
const partialFailureTrace = {
  ...trace,
  nodes: trace.nodes.filter((node) => node.kind !== 'canon-patch' && node.kind !== 'canon-fact' && node.kind !== 'prose-draft'),
  links: trace.links.filter((link) => link.relation !== 'accepted_into' && link.relation !== 'rendered_as'),
  isPartialFailure: true,
  summary: {
    ...trace.summary,
    canonPatchCount: 0,
    proseDraftCount: 0,
  },
}

const meta = {
  title: 'Business/Run/Trace Panel',
  component: RunTracePanel,
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <div className="min-h-[720px] bg-app p-6">
      <RunTracePanel {...args} />
    </div>
  ),
  args: {
    trace,
    isLoading: false,
    error: null,
  },
} satisfies Meta<typeof RunTracePanel>

export default meta

type Story = StoryObj<typeof meta>

export const TraceSummary: Story = {}

export const PartialFailureTrace: Story = {
  args: {
    trace: partialFailureTrace,
  },
}
