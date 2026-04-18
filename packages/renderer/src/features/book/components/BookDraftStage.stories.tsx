import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookDraftStage } from './BookDraftStage'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import {
  buildBookDraftBranchStoryData,
  buildBookDraftCompareStoryData,
  buildBookDraftExportStoryData,
  useLocalizedBookDraftWorkspace,
} from './book-draft-storybook'

interface BookDraftStageStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  exportProfileId?: string
  branchId?: string
  branchBaseline?: 'current' | 'checkpoint'
  draftView?: 'read' | 'compare' | 'export' | 'branch'
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  exportProfileId,
  branchId,
  branchBaseline = 'current',
  draftView = 'read',
}: BookDraftStageStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })
  const exportData = buildBookDraftExportStoryData(locale, { variant, selectedChapterId, checkpointId, exportProfileId })
  const branchData = buildBookDraftBranchStoryData(locale, { variant, selectedChapterId, checkpointId, branchId, branchBaseline })

  return (
    <BookDraftStage
      draftView={draftView}
      workspace={workspace}
      compare={compareData.compare}
      branchWorkspace={draftView === 'branch' ? branchData.branchWorkspace : branchData.branchWorkspace}
      branches={branchData.branches}
      selectedBranchId={branchData.selectedBranch.branchId}
      branchBaseline={branchBaseline}
      exportPreview={draftView === 'export' ? exportData.exportWorkspace : null}
      exportProfiles={exportData.exportProfiles}
      selectedExportProfileId={exportData.selectedExportProfile.exportProfileId}
      checkpoints={compareData.checkpoints}
      selectedCheckpointId={compareData.selectedCheckpoint.checkpointId}
      onSelectDraftView={() => undefined}
      onSelectChapter={() => undefined}
      onOpenChapter={() => undefined}
      onSelectCheckpoint={() => undefined}
      onSelectBranch={() => undefined}
      onSelectBranchBaseline={() => undefined}
      onSelectExportProfile={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookDraftStage',
  component: StoryComponent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[780px]">
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

export const CompareDefault: Story = {
  args: {
    draftView: 'compare',
  },
}

export const CompareSelectedSecondChapter: Story = {
  args: {
    draftView: 'compare',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareMissingDrafts: Story = {
  args: {
    draftView: 'compare',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

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

export const ExportReviewPacket: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-review-packet',
  },
}

export const ExportSubmissionPreview: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-submission-preview',
  },
}

export const ExportArchiveSnapshot: Story = {
  args: {
    draftView: 'export',
    exportProfileId: 'export-archive-snapshot',
  },
}

export const BranchCurrentBaseline: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'current',
  },
}

export const BranchCheckpointBaseline: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'checkpoint',
  },
}

export const BranchHighPressure: Story = {
  args: {
    draftView: 'branch',
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'current',
  },
}
