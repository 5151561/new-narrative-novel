import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookDraftCompareView } from './BookDraftCompareView'
import { buildBookDraftCompareStoryData } from './book-draft-storybook'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'

interface BookDraftCompareViewStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
}

function StoryComponent({ variant = 'default', selectedChapterId, checkpointId }: BookDraftCompareViewStoryProps) {
  const { locale } = useI18n()
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })

  return <BookDraftCompareView compare={compareData.compare} onOpenChapter={() => undefined} />
}

const meta = {
  title: 'Business/BookDraftCompareView',
  component: StoryComponent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[780px]">
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

export const CompareSelectedSecondChapter: Story = {
  args: {
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareMissingDrafts: Story = {
  args: {
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

export const CompareTraceRegression: Story = {
  args: {
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareQuietCheckpoint: Story = {
  args: {
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
