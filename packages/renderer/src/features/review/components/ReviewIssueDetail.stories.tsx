import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { BookStoryShell } from '@/features/book/components/book-storybook'
import { buildBookDraftReviewStoryData } from '@/features/book/components/book-draft-storybook'

import { ReviewIssueDetail } from './ReviewIssueDetail'

const REVIEW_ISSUE_ID = 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge'

interface StoryComponentProps {
  reviewed?: boolean
  fixStarted?: boolean
}

function StoryComponent({ reviewed = false, fixStarted = false }: StoryComponentProps) {
  const { locale } = useI18n()
  const { reviewInbox } = buildBookDraftReviewStoryData(locale, {
    reviewFilter: 'compare-deltas',
    reviewStatusFilter: reviewed ? 'reviewed' : 'open',
    selectedChapterId: 'chapter-open-water-signals',
    reviewIssueId: REVIEW_ISSUE_ID,
    decisionStates: reviewed
      ? [
          {
            issueId: REVIEW_ISSUE_ID,
            status: 'reviewed',
            note: 'Proposal reviewed in this pass.',
          },
        ]
      : [],
    fixActionStates: fixStarted
      ? [
          {
            issueId: REVIEW_ISSUE_ID,
            status: 'started',
            note: 'Follow the source proposal before marking this reviewed.',
          },
        ]
      : [],
  })

  return (
    <ReviewIssueDetail
      issue={reviewInbox.selectedIssue}
      onOpenHandoff={() => undefined}
      onSetDecision={() => undefined}
      onClearDecision={() => undefined}
      onStartFix={() => undefined}
      onSetFixStatus={() => undefined}
      onClearFix={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/ReviewIssueDetail',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1 p-4">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ReviewCompareDelta: Story = {
  render: () => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1 p-4">
      <StoryComponent />
    </BookStoryShell>
  ),
}

export const ReviewedCompareDelta: Story = {
  render: () => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1 p-4">
      <StoryComponent reviewed />
    </BookStoryShell>
  ),
}

export const DecisionReviewedAndFixStarted: Story = {
  render: () => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1 p-4">
      <StoryComponent reviewed fixStarted />
    </BookStoryShell>
  ),
}
