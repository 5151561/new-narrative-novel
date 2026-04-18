import type { Meta, StoryObj } from '@storybook/react'

import { BookDraftInspectorPane } from './BookDraftInspectorPane'
import {
  BookStoryShell,
  type BookStoryVariant,
} from './book-storybook'
import { useLocalizedBookDraftWorkspace } from './book-draft-storybook'

interface BookDraftInspectorPaneStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function StoryComponent({ variant = 'default', selectedChapterId }: BookDraftInspectorPaneStoryProps) {
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  return <BookDraftInspectorPane bookTitle={workspace.title} inspector={workspace.inspector} />
}

const meta = {
  title: 'Business/BookDraftInspectorPane',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-md rounded-md border border-line-soft bg-surface-1">
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

export const MissingTraceAttention: Story = {
  args: {
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
