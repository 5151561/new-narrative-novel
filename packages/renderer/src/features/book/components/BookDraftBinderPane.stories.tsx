import type { Meta, StoryObj } from '@storybook/react'

import { BookDraftBinderPane } from './BookDraftBinderPane'
import {
  BookStoryShell,
  type BookStoryVariant,
} from './book-storybook'
import { useLocalizedBookDraftWorkspace } from './book-draft-storybook'

interface BookDraftBinderPaneStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function StoryComponent({ variant = 'default', selectedChapterId }: BookDraftBinderPaneStoryProps) {
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  return <BookDraftBinderPane workspace={workspace} onSelectChapter={() => undefined} onOpenChapter={() => undefined} />
}

const meta = {
  title: 'Business/BookDraftBinderPane',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-sm rounded-md border border-line-soft bg-surface-1">
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

export const SelectedSecondChapter: Story = {
  args: {
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const WarningsHeavy: Story = {
  args: {
    variant: 'signals-heavy',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
