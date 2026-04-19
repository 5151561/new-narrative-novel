import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { BookDraftReviewView } from './BookDraftReviewView'
import { buildBookDraftReviewStoryData } from './book-draft-storybook'

interface BookDraftReviewViewStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  reviewFilter?: 'all' | 'blockers' | 'trace-gaps' | 'missing-drafts' | 'compare-deltas' | 'export-readiness' | 'branch-readiness' | 'scene-proposals'
  includeReviewSeeds?: boolean
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  reviewFilter = 'all',
  includeReviewSeeds = true,
}: BookDraftReviewViewStoryProps) {
  const { locale } = useI18n()
  const reviewData = buildBookDraftReviewStoryData(locale, {
    variant,
    selectedChapterId,
    reviewFilter,
    includeReviewSeeds,
  })

  return (
    <BookDraftReviewView
      inbox={reviewData.reviewInbox}
      onSelectFilter={() => undefined}
      onSelectIssue={() => undefined}
      onOpenReviewSource={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookDraftReviewView',
  component: StoryComponent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[780px]">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
    reviewFilter: 'all',
    includeReviewSeeds: true,
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ReviewDefault: Story = {}

export const ReviewBlockers: Story = {
  args: {
    reviewFilter: 'blockers',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewTraceGaps: Story = {
  args: {
    reviewFilter: 'trace-gaps',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewEmptyFilter: Story = {
  args: {
    variant: 'quiet-book',
    reviewFilter: 'scene-proposals',
    includeReviewSeeds: false,
    selectedChapterId: 'chapter-open-water-signals',
  },
}
