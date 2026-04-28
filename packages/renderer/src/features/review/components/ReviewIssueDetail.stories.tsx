import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { BookStoryShell } from '@/features/book/components/book-storybook'
import { buildBookDraftReviewStoryData } from '@/features/book/components/book-draft-storybook'
import type { BookReviewFilter } from '@/features/workbench/types/workbench-route'
import type { ReviewIssueViewModel } from '@/features/review/types/review-view-models'

import { ReviewIssueDetail } from './ReviewIssueDetail'

const REVIEW_ISSUE_ID = 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge'

interface StoryComponentProps {
  reviewIssueId?: string
  reviewFilter?: BookReviewFilter
  reviewed?: boolean
  fixStatus?: 'started' | 'rewrite_requested'
}

function StoryComponent({
  reviewIssueId = REVIEW_ISSUE_ID,
  reviewFilter = 'compare-deltas',
  reviewed = false,
  fixStatus,
}: StoryComponentProps) {
  const { locale } = useI18n()
  const { reviewInbox } = buildBookDraftReviewStoryData(locale, {
    reviewFilter,
    reviewStatusFilter: reviewed ? 'reviewed' : 'open',
    selectedChapterId: 'chapter-open-water-signals',
    reviewIssueId,
    decisionStates: reviewed
      ? [
          {
            issueId: reviewIssueId,
            status: 'reviewed',
            note: 'Proposal reviewed in this pass.',
          },
        ]
      : [],
    fixActionStates: fixStatus
      ? [
          {
            issueId: reviewIssueId,
            status: fixStatus,
            note: 'Follow the source proposal before marking this reviewed.',
          },
        ]
      : [],
  })
  const baseIssue =
    reviewInbox.issues.find((issue) => issue.id === reviewIssueId) ?? reviewInbox.selectedIssue ?? reviewInbox.filteredIssues[0] ?? null
  const issue =
    baseIssue == null
      ? null
      : fixStatus === 'rewrite_requested'
        ? buildRewriteRequestIssue(baseIssue)
        : baseIssue

  return (
    <ReviewIssueDetail
      issue={issue}
      onOpenHandoff={() => undefined}
      onSetDecision={() => undefined}
      onClearDecision={() => undefined}
      onStartFix={() => undefined}
      onSetFixStatus={() => undefined}
      onClearFix={() => undefined}
    />
  )
}

function buildRewriteRequestIssue(baseIssue: ReviewIssueViewModel): ReviewIssueViewModel {
  const sceneHandoff = {
    id: 'rewrite-request-scene',
    label: 'Open scene draft',
    target: {
      scope: 'scene' as const,
      sceneId: 'scene-5',
      lens: 'draft' as const,
      tab: 'prose' as const,
    },
  }

  return {
    ...baseIssue,
    id: 'missing-trace-departure-bell',
    source: 'traceability',
    kind: 'missing_trace',
    title: 'Departure Bell has no trace references',
    detail: 'Departure Bell currently reads as draft prose, but it carries no scene-level trace references back to canon or proposals.',
    recommendation: 'Open the scene draft and request a rewrite that restores the missing trace references before the next review pass.',
    chapterId: 'chapter-open-water-signals',
    chapterTitle: 'Open Water Signals',
    chapterOrder: 2,
    sceneId: 'scene-5',
    sceneTitle: 'Departure Bell',
    sceneOrder: 4,
    sourceLabel: 'Traceability QA',
    sourceExcerpt: 'Departure Bell prose is readable, yet the trace chain is blank.',
    issueSignature: 'missing-trace-departure-bell::story-rewrite',
    handoffs: [sceneHandoff],
    primaryFixHandoff: sceneHandoff,
    fixAction: {
      status: 'rewrite_requested',
      sourceHandoffId: sceneHandoff.id,
      sourceHandoffLabel: sceneHandoff.label,
      targetScope: 'scene',
      note: 'Follow the source proposal before marking this reviewed.',
      rewriteRequestNote: 'Follow the source proposal before marking this reviewed.',
      rewriteTargetSceneId: 'scene-5',
      rewriteRequestId: 'story-rewrite-missing-trace-departure-bell',
      startedAtLabel: 'Story source fix started',
      updatedAtLabel: 'Story source fix updated',
      updatedByLabel: 'Story reviewer',
      isStale: false,
    },
  }
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
      <StoryComponent reviewed fixStatus="started" />
    </BookStoryShell>
  ),
}

export const RewriteRequestAction: Story = {
  render: () => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1 p-4">
      <StoryComponent
        reviewIssueId="missing-trace-departure-bell"
        reviewFilter="trace-gaps"
        fixStatus="rewrite_requested"
      />
    </BookStoryShell>
  ),
}
