import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookDraftCheckpointPicker } from './BookDraftCheckpointPicker'
import { buildBookDraftCompareStoryData } from './book-draft-storybook'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'

interface BookDraftCheckpointPickerStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
}

function StoryComponent({ variant = 'default', selectedChapterId, checkpointId }: BookDraftCheckpointPickerStoryProps) {
  const { locale } = useI18n()
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })

  return (
    <BookDraftCheckpointPicker
      checkpoints={compareData.checkpoints}
      selectedCheckpointId={compareData.selectedCheckpoint.checkpointId}
      checkpointMeta={compareData.selectedCheckpoint}
      onSelectCheckpoint={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookDraftCheckpointPicker',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const CompareDefault: Story = {}

export const CompareQuietCheckpoint: Story = {
  args: {
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
