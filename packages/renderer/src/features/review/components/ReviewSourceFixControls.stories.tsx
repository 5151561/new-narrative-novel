import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { BookStoryShell } from '@/features/book/components/book-storybook'
import { buildBookDraftReviewStoryData } from '@/features/book/components/book-draft-storybook'

import { ReviewSourceFixControls } from './ReviewSourceFixControls'

const REVIEW_ISSUE_ID = 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge'

interface StoryComponentProps {
  fixStatus?: 'not_started' | 'started' | 'checked' | 'blocked' | 'stale'
}

function StoryComponent({ fixStatus = 'not_started' }: StoryComponentProps) {
  const { locale } = useI18n()
  const { reviewInbox } = buildBookDraftReviewStoryData(locale, {
    reviewFilter: 'compare-deltas',
    selectedChapterId: 'chapter-open-water-signals',
    reviewIssueId: REVIEW_ISSUE_ID,
    fixActionStates:
      fixStatus === 'not_started'
        ? []
        : [
            {
              issueId: REVIEW_ISSUE_ID,
              status: fixStatus === 'stale' ? 'started' : fixStatus,
              stale: fixStatus === 'stale',
              note: 'Story source fix note.',
            },
          ],
  })
  const issue = reviewInbox.selectedIssue ?? reviewInbox.filteredIssues[0]!

  return (
    <ReviewSourceFixControls
      issue={issue}
      onStartFix={() => undefined}
      onSetFixStatus={() => undefined}
      onClearFix={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/ReviewSourceFixControls',
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

export const NotStartedFix: Story = {}

export const StartedFix: Story = {
  args: {
    fixStatus: 'started',
  },
}

export const CheckedFix: Story = {
  args: {
    fixStatus: 'checked',
  },
}

export const BlockedFix: Story = {
  args: {
    fixStatus: 'blocked',
  },
}

export const StaleFix: Story = {
  args: {
    fixStatus: 'stale',
  },
}
