import type { Meta, StoryObj } from '@storybook/react'

import { BookStoryShell } from '@/features/book/components/book-storybook'

import { ReviewDecisionControls } from './ReviewDecisionControls'

const baseIssue = {
  id: 'compare-delta-scene-1',
  severity: 'warning' as const,
  source: 'compare' as const,
  kind: 'compare_delta' as const,
  title: 'Compare delta needs review',
  detail: 'Scene One changed against the selected checkpoint.',
  recommendation: 'Open compare review and verify the changed passage before carrying it forward.',
  chapterId: 'chapter-1',
  chapterTitle: 'Chapter One',
  chapterOrder: 1,
  sceneId: 'scene-1',
  sceneTitle: 'Scene One',
  sceneOrder: 1,
  sourceLabel: 'Compare checkpoint',
  sourceExcerpt: 'Checkpoint river excerpt.',
  tags: ['Compare delta'],
  handoffs: [],
  issueSignature: 'compare-delta-scene-1::signature',
}

const meta = {
  title: 'Business/ReviewDecisionControls',
  component: ReviewDecisionControls,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-2xl rounded-md border border-line-soft bg-surface-1 p-4">
      <ReviewDecisionControls {...args} />
    </BookStoryShell>
  ),
  args: {
    issue: {
      ...baseIssue,
      decision: {
        status: 'open',
        isStale: false,
      },
    },
    onSetDecision: () => undefined,
    onClearDecision: () => undefined,
  },
} satisfies Meta<typeof ReviewDecisionControls>

export default meta

type Story = StoryObj<typeof meta>

export const OpenIssue: Story = {}

export const ReviewedIssue: Story = {
  args: {
    issue: {
      ...baseIssue,
      decision: {
        status: 'reviewed',
        note: 'Handled in this review pass.',
        updatedAtLabel: 'Story review decision',
        updatedByLabel: 'Story reviewer',
        isStale: false,
      },
    },
  },
}

export const DeferredIssue: Story = {
  args: {
    issue: {
      ...baseIssue,
      decision: {
        status: 'deferred',
        note: 'Carry this into the next pass.',
        updatedAtLabel: 'Story review decision',
        updatedByLabel: 'Story reviewer',
        isStale: false,
      },
    },
  },
}

export const DismissedIssue: Story = {
  args: {
    issue: {
      ...baseIssue,
      decision: {
        status: 'dismissed',
        note: 'Not relevant for this pass.',
        updatedAtLabel: 'Story review decision',
        updatedByLabel: 'Story reviewer',
        isStale: false,
      },
    },
  },
}

export const StaleDecision: Story = {
  args: {
    issue: {
      ...baseIssue,
      decision: {
        status: 'stale',
        note: 'Source changed after the last review.',
        updatedAtLabel: 'Story review decision',
        updatedByLabel: 'Story reviewer',
        isStale: true,
      },
    },
  },
}
