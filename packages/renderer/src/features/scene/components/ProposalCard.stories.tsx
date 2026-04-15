import type { Meta, StoryObj } from '@storybook/react'

import { getSceneFixture } from '@/mock/scene-fixtures'

import { ProposalCard } from './ProposalCard'

const scene = getSceneFixture('scene-midnight-platform')
const pendingProposal = scene.execution.proposals[0]
const rewriteProposal = scene.execution.proposals.find((proposal) => proposal.status === 'rewrite-requested')!

const meta = {
  title: 'Business/ProposalCard',
  component: ProposalCard,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <div className="min-h-[720px] bg-app p-6">
      <div className="max-w-3xl">
        <ProposalCard
          {...args}
          onSelect={() => undefined}
          onAccept={() => undefined}
          onEditAccept={() => undefined}
          onRequestRewrite={() => undefined}
          onReject={() => undefined}
        />
      </div>
    </div>
  ),
  args: {
    proposal: pendingProposal,
    selected: false,
    onSelect: () => undefined,
    onAccept: () => undefined,
    onEditAccept: () => undefined,
    onRequestRewrite: () => undefined,
    onReject: () => undefined,
  },
} satisfies Meta<typeof ProposalCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const RewriteRequested: Story = {
  args: {
    proposal: rewriteProposal,
  },
}
