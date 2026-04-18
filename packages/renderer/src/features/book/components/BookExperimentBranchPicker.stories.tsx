import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookExperimentBranchPicker } from './BookExperimentBranchPicker'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { buildBookDraftBranchStoryData } from './book-draft-storybook'

interface BookExperimentBranchPickerStoryProps {
  variant?: BookStoryVariant
  branchId?: string
  branchBaseline?: 'current' | 'checkpoint'
}

function StoryComponent({
  variant = 'default',
  branchId,
  branchBaseline = 'current',
}: BookExperimentBranchPickerStoryProps) {
  const { locale } = useI18n()
  const branchData = buildBookDraftBranchStoryData(locale, { variant, branchId, branchBaseline })

  return (
    <BookExperimentBranchPicker
      branches={branchData.branches}
      selectedBranchId={branchData.selectedBranch.branchId}
      branchBaseline={branchBaseline}
      onSelectBranch={() => undefined}
      onSelectBranchBaseline={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookExperimentBranchPicker',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[520px]">
      <div className="p-6">
        <StoryComponent {...args} />
      </div>
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

export const CheckpointBaseline: Story = {
  args: {
    branchBaseline: 'checkpoint',
  },
}

export const HighPressure: Story = {
  args: {
    branchId: 'branch-book-signal-arc-high-pressure',
  },
}
