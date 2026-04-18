import type { Meta, StoryObj } from '@storybook/react'

import { BookOutlinerView } from './BookOutlinerView'
import { BookStoryShell, useLocalizedBookWorkspace, type BookStoryVariant } from './book-storybook'

interface BookOutlinerViewStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function BookOutlinerViewStory({
  variant = 'default',
  selectedChapterId,
}: BookOutlinerViewStoryProps) {
  const workspace = useLocalizedBookWorkspace({ variant, selectedChapterId })

  return (
    <BookOutlinerView
      chapters={workspace.chapters}
      selectedChapterId={workspace.selectedChapterId}
      onSelectChapter={() => undefined}
      onOpenChapter={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookOutlinerView',
  component: BookOutlinerViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-7xl">
      <BookOutlinerViewStory {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof BookOutlinerViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SelectedSecondChapter: Story = {
  args: {
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const MissingTraceAttention: Story = {
  args: {
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-dawn-slip',
  },
}
