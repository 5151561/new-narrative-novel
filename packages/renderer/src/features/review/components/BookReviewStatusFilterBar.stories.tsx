import type { Meta, StoryObj } from '@storybook/react'

import { BookStoryShell } from '@/features/book/components/book-storybook'

import { BookReviewStatusFilterBar } from './BookReviewStatusFilterBar'

const meta = {
  title: 'Business/BookReviewStatusFilterBar',
  component: BookReviewStatusFilterBar,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1 p-4">
      <BookReviewStatusFilterBar {...args} />
    </BookStoryShell>
  ),
  args: {
    activeStatusFilter: 'open',
    counts: {
      total: 12,
      blockers: 3,
      warnings: 6,
      info: 3,
      traceGaps: 2,
      missingDrafts: 4,
      compareDeltas: 3,
      exportReadiness: 2,
      branchReadiness: 1,
      sceneProposals: 2,
      open: 6,
      reviewed: 3,
      deferred: 2,
      dismissed: 1,
      stale: 1,
    },
    onSelectStatusFilter: () => undefined,
  },
} satisfies Meta<typeof BookReviewStatusFilterBar>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
