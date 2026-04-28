import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import type { BookReviewInboxViewModel } from '@/features/review/types/review-view-models'

import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { BookDraftReviewView } from './BookDraftReviewView'
import { buildBookDraftReviewStoryData } from './book-draft-storybook'

interface BookDraftReviewViewStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  reviewIssueId?: string
  reviewFilter?: 'all' | 'blockers' | 'trace-gaps' | 'missing-drafts' | 'compare-deltas' | 'export-readiness' | 'branch-readiness' | 'scene-proposals'
  reviewStatusFilter?: 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'
  includeReviewSeeds?: boolean
  decisionStates?: Array<{
    issueId: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
    stale?: boolean
  }>
  fixActionStates?: Array<{
    issueId: string
    status: 'started' | 'checked' | 'blocked' | 'rewrite_requested'
    note?: string
    stale?: boolean
  }>
  decisionErrorMessage?: string | null
  fixActionErrorMessage?: string | null
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  reviewIssueId,
  reviewFilter = 'all',
  reviewStatusFilter = 'open',
  includeReviewSeeds = true,
  decisionStates = [],
  fixActionStates = [],
  decisionErrorMessage = null,
  fixActionErrorMessage = null,
}: BookDraftReviewViewStoryProps) {
  const { locale } = useI18n()
  const reviewData = buildBookDraftReviewStoryData(locale, {
    variant,
    selectedChapterId,
    reviewIssueId,
    reviewFilter,
    reviewStatusFilter,
    includeReviewSeeds,
    decisionStates,
    fixActionStates,
  })
  const forcedSelectedIssue =
    reviewIssueId != null ? reviewData.reviewInbox.issues.find((issue) => issue.id === reviewIssueId) ?? null : null
  const continuityInbox =
    reviewIssueId === 'continuity-conflict-ledger-public-proof'
      ? buildContinuityQaInbox(reviewData.reviewInbox)
      : null
  const inbox =
    continuityInbox ??
    (forcedSelectedIssue == null
      ? reviewData.reviewInbox
      : {
          ...reviewData.reviewInbox,
          selectedIssueId: forcedSelectedIssue.id,
          selectedIssue: forcedSelectedIssue,
        })

  return (
    <BookDraftReviewView
      inbox={inbox}
      decisionErrorMessage={decisionErrorMessage}
      fixActionErrorMessage={fixActionErrorMessage}
      onSelectFilter={() => undefined}
      onSelectStatusFilter={() => undefined}
      onSelectIssue={() => undefined}
      onSetDecision={() => undefined}
      onClearDecision={() => undefined}
      onStartFix={() => undefined}
      onSetFixStatus={() => undefined}
      onClearFix={() => undefined}
      onOpenReviewSource={() => undefined}
    />
  )
}

function buildContinuityQaInbox(baseInbox: BookReviewInboxViewModel): BookReviewInboxViewModel {
  const continuityIssue = {
    ...baseInbox.selectedIssue!,
    id: 'continuity-conflict-ledger-public-proof',
    severity: 'blocker' as const,
    source: 'continuity' as const,
    kind: 'continuity_conflict' as const,
    title: 'Ledger visibility conflicts with the public-proof beat',
    detail: 'Midnight Platform prose implies the ledger proof already went public while the continuity ledger still marks it as withheld.',
    recommendation: 'Open book review, then inspect the ledger profile and the scene execution notes before changing any source material.',
    chapterId: 'chapter-signals-in-rain',
    chapterTitle: 'Signals in Rain',
    chapterOrder: 1,
    sceneId: 'scene-midnight-platform',
    sceneTitle: 'Midnight Platform',
    sceneOrder: 1,
    assetId: 'asset-ledger',
    assetTitle: 'Ledger',
    sourceLabel: 'Continuity QA',
    sourceExcerpt: 'The current prose treats the ledger proof as public even though the continuity ledger still keeps it private.',
    tags: ['Continuity conflict', 'Ledger'],
    issueSignature: 'continuity-conflict-ledger-public-proof::story',
    handoffs: [
      {
        id: 'continuity-story-book-review',
        label: 'Open book review',
        target: {
          scope: 'book' as const,
          lens: 'draft' as const,
          view: 'sequence' as const,
          draftView: 'review' as const,
          selectedChapterId: 'chapter-signals-in-rain',
          reviewIssueId: 'continuity-conflict-ledger-public-proof',
        },
      },
      {
        id: 'continuity-story-asset',
        label: 'Open asset ledger',
        target: {
          scope: 'asset' as const,
          assetId: 'asset-ledger',
          lens: 'knowledge' as const,
          view: 'context' as const,
        },
      },
      {
        id: 'continuity-story-scene',
        label: 'Open scene orchestrate',
        target: {
          scope: 'scene' as const,
          sceneId: 'scene-midnight-platform',
          lens: 'orchestrate' as const,
          tab: 'execution' as const,
        },
      },
    ],
    primaryFixHandoff: {
      id: 'continuity-story-book-review',
      label: 'Open book review',
      target: {
        scope: 'book' as const,
        lens: 'draft' as const,
        view: 'sequence' as const,
        draftView: 'review' as const,
        selectedChapterId: 'chapter-signals-in-rain',
        reviewIssueId: 'continuity-conflict-ledger-public-proof',
      },
    },
  }

  const issues = [
    continuityIssue,
    ...baseInbox.issues.filter((issue) => issue.id !== continuityIssue.id),
  ]

  return {
    ...baseInbox,
    selectedIssueId: continuityIssue.id,
    selectedIssue: continuityIssue,
    issues,
    filteredIssues: issues,
    groupedIssues: {
      blockers: [continuityIssue, ...baseInbox.groupedIssues.blockers.filter((issue) => issue.id !== continuityIssue.id)],
      warnings: baseInbox.groupedIssues.warnings,
      info: baseInbox.groupedIssues.info,
    },
  }
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

export const SourceFixStarted: Story = {
  args: {
    reviewFilter: 'compare-deltas',
    reviewStatusFilter: 'open',
    selectedChapterId: 'chapter-open-water-signals',
    fixActionStates: [
      {
        issueId: 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge',
        status: 'started',
        note: 'Source fix started from compare review.',
      },
    ],
  },
}

export const SourceFixBlocked: Story = {
  args: {
    reviewFilter: 'trace-gaps',
    reviewStatusFilter: 'open',
    selectedChapterId: 'chapter-open-water-signals',
    fixActionStates: [
      {
        issueId: 'compare-trace-gap-chapter-open-water-signals-scene-warehouse-bridge',
        status: 'blocked',
        note: 'Blocked until compare ownership is resolved.',
      },
    ],
  },
}

export const SourceFixChecked: Story = {
  args: {
    reviewFilter: 'trace-gaps',
    reviewStatusFilter: 'open',
    selectedChapterId: 'chapter-open-water-signals',
    fixActionStates: [
      {
        issueId: 'compare-trace-gap-chapter-open-water-signals-scene-warehouse-bridge',
        status: 'checked',
        note: 'Source checked; review decision remains open.',
      },
    ],
  },
}

export const ContinuityQaQueue: Story = {
  args: {
    reviewFilter: 'all',
    reviewStatusFilter: 'open',
    selectedChapterId: 'chapter-signals-in-rain',
    reviewIssueId: 'continuity-conflict-ledger-public-proof',
  },
}

export const StaleAfterCanonChange: Story = {
  args: {
    reviewFilter: 'all',
    reviewStatusFilter: 'open',
    selectedChapterId: 'chapter-signals-in-rain',
    reviewIssueId: 'stale-prose-after-canon-midnight-platform',
  },
}

export const RewriteRequestAction: Story = {
  args: {
    reviewFilter: 'trace-gaps',
    reviewStatusFilter: 'open',
    selectedChapterId: 'chapter-open-water-signals',
    reviewIssueId: 'missing-trace-departure-bell',
    fixActionStates: [
      {
        issueId: 'missing-trace-departure-bell',
        status: 'rewrite_requested',
        note: 'Request a prose rewrite from the scene draft surface.',
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

export const FixActionErrorPartialInbox: Story = {
  args: {
    reviewFilter: 'all',
    reviewStatusFilter: 'open',
    fixActionErrorMessage: 'Review fix actions could not be loaded.',
  },
}
