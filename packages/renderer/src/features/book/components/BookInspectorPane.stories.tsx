import type { Meta, StoryObj } from '@storybook/react'

import { BookInspectorPane } from './BookInspectorPane'
import { BookStoryShell, useLocalizedBookWorkspace, type BookStoryVariant } from './book-storybook'

interface BookInspectorPaneStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function BookInspectorPaneStory({
  variant = 'default',
  selectedChapterId,
}: BookInspectorPaneStoryProps) {
  const workspace = useLocalizedBookWorkspace({ variant, selectedChapterId })

  return <BookInspectorPane bookTitle={workspace.title} inspector={workspace.inspector} />
}

const meta = {
  title: 'Business/BookInspectorPane',
  component: BookInspectorPaneStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-md rounded-md border border-line-soft bg-surface-1">
      <BookInspectorPaneStory {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof BookInspectorPaneStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SelectedSecondChapter: Story = {
  args: {
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const SignalsHeavy: Story = {
  args: {
    variant: 'signals-heavy',
    selectedChapterId: 'chapter-dawn-slip',
  },
}
