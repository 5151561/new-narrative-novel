import type { Meta, StoryObj } from '@storybook/react'

import { BookNavigatorPane } from './BookNavigatorPane'
import { BookStoryShell, useLocalizedBookWorkspace, type BookStoryVariant } from './book-storybook'

interface BookNavigatorPaneStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function BookNavigatorPaneStory({
  variant = 'default',
  selectedChapterId,
}: BookNavigatorPaneStoryProps) {
  const workspace = useLocalizedBookWorkspace({ variant, selectedChapterId })

  return (
    <BookNavigatorPane
      chapters={workspace.chapters}
      selectedChapterId={workspace.selectedChapterId}
      onSelectChapter={() => undefined}
      onOpenChapter={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookNavigatorPane',
  component: BookNavigatorPaneStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-sm rounded-md border border-line-soft bg-surface-1">
      <BookNavigatorPaneStory {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof BookNavigatorPaneStory>

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
