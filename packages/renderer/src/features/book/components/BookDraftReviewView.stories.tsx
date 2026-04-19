import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { BookDraftReviewView } from './BookDraftReviewView'
import { buildBookDraftReviewStoryData } from './book-draft-storybook'

interface BookDraftReviewViewStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  reviewFilter?: 'all' | 'blockers' | 'trace-gaps' | 'missing-drafts' | 'compare-deltas' | 'export-readiness' | 'branch-readiness' | 'scene-proposals'
  reviewStatusFilter?: 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'
  includeReviewSeeds?: boolean
  decisionStates?: Array<{
    issueId: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
    stale?: boolean
  }>
  decisionErrorMessage?: string | null
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  reviewFilter = 'all',
  reviewStatusFilter = 'open',
  includeReviewSeeds = true,
  decisionStates = [],
  decisionErrorMessage = null,
}: BookDraftReviewViewStoryProps) {
  const { locale } = useI18n()
  const reviewData = buildBookDraftReviewStoryData(locale, {
    variant,
    selectedChapterId,
    reviewFilter,
    reviewStatusFilter,
    includeReviewSeeds,
    decisionStates,
  })

  return (
    <BookDraftReviewView
      inbox={reviewData.reviewInbox}
      decisionErrorMessage={decisionErrorMessage}
      onSelectFilter={() => undefined}
      onSelectStatusFilter={() => undefined}
      onSelectIssue={() => undefined}
      onSetDecision={() => undefined}
      onClearDecision={() => undefined}
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
    reviewStatusFilter: 'open',
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
    reviewStatusFilter: 'open',
    includeReviewSeeds: false,
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewedIssue: Story = {
  args: {
    reviewFilter: 'scene-proposals',
    reviewStatusFilter: 'reviewed',
    selectedChapterId: 'chapter-open-water-signals',
    decisionStates: [
      {
        issueId: 'scene-proposal-seed-scene-5',
        status: 'reviewed',
        note: 'Proposal reviewed in this pass.',
      },
    ],
  },
}

export const DeferredIssue: Story = {
  args: {
    reviewFilter: 'compare-deltas',
    reviewStatusFilter: 'deferred',
    selectedChapterId: 'chapter-open-water-signals',
    decisionStates: [
      {
        issueId: 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge',
        status: 'deferred',
        note: 'Carry this into the next compare pass.',
      },
    ],
  },
}

export const DismissedIssue: Story = {
  args: {
    reviewFilter: 'trace-gaps',
    reviewStatusFilter: 'dismissed',
    selectedChapterId: 'chapter-open-water-signals',
    decisionStates: [
      {
        issueId: 'trace-gap-chapter-open-water-signals-scene-dawn-slip',
        status: 'dismissed',
        note: 'False positive for this pass.',
      },
    ],
  },
}

export const StaleDecision: Story = {
  args: {
    reviewFilter: 'export-readiness',
    reviewStatusFilter: 'open',
    selectedChapterId: 'chapter-open-water-signals',
    decisionStates: [
      {
        issueId: 'export-blocker-open-water-signals',
        status: 'reviewed',
        stale: true,
        note: 'Source changed after the earlier review.',
      },
    ],
  },
}

export const DecisionErrorPartialInbox: Story = {
  args: {
    reviewFilter: 'all',
    reviewStatusFilter: 'open',
    decisionErrorMessage: 'Review decisions could not be loaded.',
  },
}
