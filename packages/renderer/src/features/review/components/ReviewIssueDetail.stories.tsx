import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { BookStoryShell } from '@/features/book/components/book-storybook'
import { buildBookDraftReviewStoryData } from '@/features/book/components/book-draft-storybook'

import { ReviewIssueDetail } from './ReviewIssueDetail'

function StoryComponent() {
  const { locale } = useI18n()
  const { reviewInbox } = buildBookDraftReviewStoryData(locale, {
    reviewFilter: 'scene-proposals',
    selectedChapterId: 'chapter-open-water-signals',
  })

  return <ReviewIssueDetail issue={reviewInbox.selectedIssue} onOpenHandoff={() => undefined} />
}

const meta = {
  title: 'Business/ReviewIssueDetail',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: () => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1 p-4">
      <StoryComponent />
    </BookStoryShell>
  ),
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ReviewSceneProposal: Story = {}
