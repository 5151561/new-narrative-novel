import type { Meta, StoryObj } from '@storybook/react'

import { RunReviewGate } from './RunReviewGate'

const selectedVariants = [
  {
    proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
    variantId: 'variant-midnight-platform-raise-conflict',
  },
]

const meta = {
  title: 'Business/Run/Review Gate',
  component: RunReviewGate,
  parameters: {
    layout: 'centered',
  },
  render: (args) => (
    <div className="w-[620px] bg-app p-6">
      <RunReviewGate {...args} />
    </div>
  ),
  args: {
    runTitle: 'Midnight platform scene run',
    pendingReviewId: 'review-scene-midnight-platform-001',
    isSubmitting: false,
    onSubmitDecision: async () => {},
  },
} satisfies Meta<typeof RunReviewGate>

export default meta

type Story = StoryObj<typeof meta>

export const PendingReview: Story = {}

export const WithSelectedVariants: Story = {
  args: {
    selectedVariants,
    variantSelectionSummary: '1 selected variant will travel with Accept.',
  },
}
