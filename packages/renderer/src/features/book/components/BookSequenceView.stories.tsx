import type { Meta, StoryObj } from '@storybook/react'

import { BookSequenceView } from './BookSequenceView'
import { BookStoryShell, useLocalizedBookWorkspace, type BookStoryVariant } from './book-storybook'

interface BookSequenceViewStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function BookSequenceViewStory({
  variant = 'default',
  selectedChapterId,
}: BookSequenceViewStoryProps) {
  const workspace = useLocalizedBookWorkspace({ variant, selectedChapterId })

  return (
    <BookSequenceView
      chapters={workspace.chapters}
      selectedChapterId={workspace.selectedChapterId}
      onSelectChapter={() => undefined}
      onOpenChapter={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookSequenceView',
  component: BookSequenceViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-6xl">
      <BookSequenceViewStory {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof BookSequenceViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SelectedSecondChapter: Story = {
  args: {
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBook: Story = {
  args: {
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
