import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookDraftBranchView } from './BookDraftBranchView'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { buildBookDraftBranchStoryData } from './book-draft-storybook'

interface BookDraftBranchViewStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  branchId?: string
  branchBaseline?: 'current' | 'checkpoint'
  checkpointId?: string
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  branchId,
  branchBaseline = 'current',
  checkpointId,
}: BookDraftBranchViewStoryProps) {
  const { locale } = useI18n()
  const branchData = buildBookDraftBranchStoryData(locale, {
    variant,
    selectedChapterId,
    branchId,
    branchBaseline,
    checkpointId,
  })

  return (
    <BookDraftBranchView
      branchWorkspace={branchData.branchWorkspace}
      branches={branchData.branches}
      selectedBranchId={branchData.selectedBranch.branchId}
      branchBaseline={branchBaseline}
      onSelectChapter={() => undefined}
      onOpenChapter={() => undefined}
      onSelectBranch={() => undefined}
      onSelectBranchBaseline={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookDraftBranchView',
  component: StoryComponent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[900px]">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
    branchBaseline: 'current',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CurrentBaseline: Story = {
  args: {
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'current',
  },
}

export const CheckpointBaseline: Story = {
  args: {
    branchId: 'branch-book-signal-arc-quiet-ending',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  },
}

export const HighPressure: Story = {
  args: {
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'current',
  },
}

export const BlockedHighPressure: Story = {
  args: {
    branchId: 'branch-book-signal-arc-high-pressure',
    branchBaseline: 'checkpoint',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  },
}
