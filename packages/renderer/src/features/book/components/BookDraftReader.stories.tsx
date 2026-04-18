import type { Meta, StoryObj } from '@storybook/react'

import { BookDraftReader } from './BookDraftReader'
import {
  BookStoryShell,
  type BookStoryVariant,
} from './book-storybook'
import { useLocalizedBookDraftWorkspace } from './book-draft-storybook'

interface BookDraftReaderStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function StoryComponent({ variant = 'default', selectedChapterId }: BookDraftReaderStoryProps) {
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  return <BookDraftReader workspace={workspace} onSelectChapter={() => undefined} onOpenChapter={() => undefined} />
}

const meta = {
  title: 'Business/BookDraftReader',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-5xl rounded-md border border-line-soft bg-surface-1">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const MissingDrafts: Story = {
  args: {
    variant: 'default',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBookDraft: Story = {
  args: {
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
