import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { BookStoryShell } from '@/features/book/components/book-storybook'
import { buildBookDraftReviewStoryData } from '@/features/book/components/book-draft-storybook'

import { ReviewSourceFixControls } from './ReviewSourceFixControls'

const REVIEW_ISSUE_ID = 'compare-delta-chapter-open-water-signals-scene-warehouse-bridge'

interface StoryComponentProps {
  reviewIssueId?: string
  fixStatus?: 'not_started' | 'started' | 'checked' | 'blocked' | 'rewrite_requested' | 'stale'
  reviewFilter?: 'compare-deltas' | 'trace-gaps'
}

function StoryComponent({
  reviewIssueId = REVIEW_ISSUE_ID,
  fixStatus = 'not_started',
  reviewFilter = 'compare-deltas',
}: StoryComponentProps) {
  const { locale } = useI18n()
  const { reviewInbox } = buildBookDraftReviewStoryData(locale, {
    reviewFilter,
    selectedChapterId: 'chapter-open-water-signals',
    reviewIssueId,
    fixActionStates:
      fixStatus === 'not_started'
        ? []
        : [
            {
              issueId: reviewIssueId,
              status: fixStatus === 'stale' ? 'started' : fixStatus,
              stale: fixStatus === 'stale',
              note: 'Story source fix note.',
            },
          ],
  })
  const issue =
    reviewInbox.issues.find((candidate) => candidate.id === reviewIssueId) ??
    reviewInbox.selectedIssue ??
    reviewInbox.filteredIssues[0]!
  const renderedIssue =
    reviewIssueId === 'missing-trace-departure-bell' && fixStatus === 'stale'
      ? {
          ...issue,
          id: 'missing-trace-departure-bell',
          source: 'traceability' as const,
          kind: 'missing_trace' as const,
          title: 'Departure Bell has no trace references',
          detail: 'Departure Bell currently reads as draft prose, but it carries no scene-level trace references back to canon or proposals.',
          chapterId: 'chapter-open-water-signals',
          chapterTitle: 'Open Water Signals',
          chapterOrder: 2,
          sceneId: 'scene-departure-bell',
          sceneTitle: 'Departure Bell',
          sceneOrder: 4,
          handoffs: [
            {
              id: 'missing-trace-departure-bell::chapter-draft',
              label: 'Open chapter draft',
              target: {
                scope: 'chapter' as const,
                chapterId: 'chapter-open-water-signals',
                lens: 'draft' as const,
                view: 'sequence' as const,
                sceneId: 'scene-departure-bell',
              },
            },
            {
              id: 'missing-trace-departure-bell::scene-draft',
              label: 'Open scene draft',
              target: {
                scope: 'scene' as const,
                sceneId: 'scene-departure-bell',
                lens: 'draft' as const,
                tab: 'prose' as const,
              },
            },
          ],
          primaryFixHandoff: {
            id: 'missing-trace-departure-bell::scene-draft',
            label: 'Open scene draft',
            target: {
              scope: 'scene' as const,
              sceneId: 'scene-departure-bell',
              lens: 'draft' as const,
              tab: 'prose' as const,
            },
          },
          fixAction: {
            id: 'story-fix-action-missing-trace-departure-bell',
            issueId: 'missing-trace-departure-bell',
            issueSignature: 'story-stale-fix-signature',
            sourceHandoffId: 'missing-trace-departure-bell::scene-draft',
            sourceHandoffLabel: 'Open scene draft',
            targetScope: 'scene' as const,
            status: 'stale' as const,
            note: 'Story source fix note.',
            rewriteRequestNote: undefined,
            rewriteTargetSceneId: undefined,
            rewriteRequestId: undefined,
            startedAtLabel: 'Story source fix started',
            updatedAtLabel: 'Story source fix updated',
            updatedByLabel: 'Story reviewer',
          },
        }
      : issue

  return (
    <ReviewSourceFixControls
      issue={renderedIssue}
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

export const StaleFixAction: Story = {
  args: {
    fixStatus: 'stale',
    reviewFilter: 'trace-gaps',
    reviewIssueId: 'missing-trace-departure-bell',
  },
}
