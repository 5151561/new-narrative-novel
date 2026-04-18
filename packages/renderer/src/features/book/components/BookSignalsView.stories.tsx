import type { Meta, StoryObj } from '@storybook/react'

import { BookSignalsView } from './BookSignalsView'
import { BookStoryShell, useLocalizedBookWorkspace, type BookStoryVariant } from './book-storybook'

interface BookSignalsViewStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function BookSignalsViewStory({
  variant = 'default',
  selectedChapterId,
}: BookSignalsViewStoryProps) {
  const workspace = useLocalizedBookWorkspace({ variant, selectedChapterId })

  return (
    <BookSignalsView
      chapters={workspace.chapters}
      selectedChapterId={workspace.selectedChapterId}
      onSelectChapter={() => undefined}
      onOpenChapter={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookSignalsView',
  component: BookSignalsViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-6xl">
      <BookSignalsViewStory {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof BookSignalsViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SignalsHeavy: Story = {
  args: {
    variant: 'signals-heavy',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBook: Story = {
  args: {
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
