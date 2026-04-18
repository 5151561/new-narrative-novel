import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookDraftInspectorPane } from './BookDraftInspectorPane'
import {
  BookStoryShell,
  type BookStoryVariant,
} from './book-storybook'
import {
  buildBookDraftBranchStoryData,
  buildBookDraftCompareStoryData,
  buildBookDraftExportStoryData,
  useLocalizedBookDraftWorkspace,
} from './book-draft-storybook'

interface BookDraftInspectorPaneStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  branchId?: string
  branchBaseline?: 'current' | 'checkpoint'
  exportProfileId?: string
  draftView?: 'read' | 'compare' | 'export' | 'branch'
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  branchId,
  branchBaseline = 'current',
  exportProfileId,
  draftView = 'read',
}: BookDraftInspectorPaneStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })
  const branchData = buildBookDraftBranchStoryData(locale, { variant, selectedChapterId, branchId, branchBaseline, checkpointId })
  const exportData = buildBookDraftExportStoryData(locale, { variant, selectedChapterId, checkpointId, exportProfileId })

  return (
    <BookDraftInspectorPane
      bookTitle={workspace.title}
      inspector={workspace.inspector}
      activeDraftView={draftView}
      compare={draftView === 'compare' ? compareData.compare : null}
      branch={draftView === 'branch' ? branchData.branchWorkspace : null}
      exportPreview={draftView === 'export' ? exportData.exportWorkspace : null}
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
