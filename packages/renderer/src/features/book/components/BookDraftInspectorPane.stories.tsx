import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookDraftInspectorPane } from './BookDraftInspectorPane'
import {
  BookStoryShell,
  type BookStoryVariant,
} from './book-storybook'
import {
  buildBookDraftArtifactStoryData,
  buildBookDraftBranchStoryData,
  buildBookDraftCompareStoryData,
  buildBookDraftExportStoryData,
  buildBookDraftReviewStoryData,
  useLocalizedBookDraftWorkspace,
} from './book-draft-storybook'

interface BookDraftInspectorPaneStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  branchId?: string
  branchBaseline?: 'current' | 'checkpoint'
  exportProfileId?: string
  reviewFilter?: 'all' | 'blockers' | 'trace-gaps' | 'missing-drafts' | 'compare-deltas' | 'export-readiness' | 'branch-readiness' | 'scene-proposals'
  reviewStatusFilter?: 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'
  decisionStates?: Array<{
    issueId: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
    stale?: boolean
  }>
  draftView?: 'read' | 'compare' | 'export' | 'branch' | 'review'
  artifactScenario?: 'empty' | 'latest' | 'stale'
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  branchId,
  branchBaseline = 'current',
  exportProfileId,
  reviewFilter = 'all',
  reviewStatusFilter = 'open',
  decisionStates = [],
  draftView = 'read',
  artifactScenario = 'latest',
}: BookDraftInspectorPaneStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })
  const branchData = buildBookDraftBranchStoryData(locale, { variant, selectedChapterId, branchId, branchBaseline, checkpointId })
  const exportData = buildBookDraftExportStoryData(locale, { variant, selectedChapterId, checkpointId, exportProfileId })
  const artifactWorkspace =
    draftView === 'export'
      ? buildBookDraftArtifactStoryData(locale, { variant, selectedChapterId, checkpointId, exportProfileId, artifactScenario })
      : null
  const reviewData = buildBookDraftReviewStoryData(locale, {
    variant,
    selectedChapterId,
    checkpointId,
    branchId,
    branchBaseline,
    exportProfileId,
    reviewFilter,
    reviewStatusFilter,
    decisionStates,
  })

  return (
    <BookDraftInspectorPane
      bookTitle={workspace.title}
      inspector={workspace.inspector}
      activeDraftView={draftView}
      compare={draftView === 'compare' ? compareData.compare : null}
      branch={draftView === 'branch' ? branchData.branchWorkspace : null}
      exportPreview={draftView === 'export' ? exportData.exportWorkspace : null}
      artifactWorkspace={artifactWorkspace}
      reviewInbox={draftView === 'review' ? reviewData.reviewInbox : null}
      onOpenReviewSource={() => undefined}
      checkpointMeta={draftView === 'compare' ? compareData.selectedCheckpoint : null}
    />
  )
}

const meta = {
  title: 'Business/BookDraftInspectorPane',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-md rounded-md border border-line-soft bg-surface-1">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
    draftView: 'read',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ReadDefault: Story = {}

export const CompareTraceRegression: Story = {
  args: {
    draftView: 'compare',
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareQuietCheckpoint: Story = {
  args: {
    draftView: 'compare',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ExportBlockedByMissingDraft: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportBlockedByTraceGap: Story = {
  args: {
    draftView: 'export',
    variant: 'missing-trace-attention',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportReady: Story = {
  args: {
    draftView: 'export',
    variant: 'quiet-book',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportLatestArtifactStale: Story = {
  args: {
    draftView: 'export',
    variant: 'quiet-book',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    exportProfileId: 'export-review-packet',
    artifactScenario: 'stale',
  },
}

export const BranchCurrentBaselineQuietEnding: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'current',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const BranchCheckpointBaselineHighPressure: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

export const BranchBlockedMissingDraft: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewExportReadiness: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'export-readiness',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const ReviewDeferredDecision: Story = {
  args: {
    draftView: 'review',
    reviewFilter: 'export-readiness',
    reviewStatusFilter: 'deferred',
    selectedChapterId: 'chapter-open-water-signals',
    decisionStates: [
      {
        issueId: 'export-blocker-scene-dawn-slip',
        status: 'deferred',
        note: 'Carry this into the next pass.',
      },
    ],
  },
}
