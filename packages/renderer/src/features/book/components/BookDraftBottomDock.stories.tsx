import type { Meta, StoryObj } from '@storybook/react'

import { BookDraftBottomDock } from './BookDraftBottomDock'
import {
  BookStoryShell,
  type BookStoryVariant,
} from './book-storybook'
import { useI18n } from '@/app/i18n'
import { buildBookDraftStoryActivity, useLocalizedBookDraftWorkspace } from './book-draft-storybook'

interface BookDraftBottomDockStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function StoryComponent({ variant = 'default', selectedChapterId }: BookDraftBottomDockStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })

  return (
    <BookDraftBottomDock
      summary={workspace.dockSummary}
      activity={buildBookDraftStoryActivity(locale, workspace, { quiet: variant === 'quiet-book' })}
    />
  )
}

const meta = {
  title: 'Business/BookDraftBottomDock',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-6xl rounded-md border border-line-soft bg-surface-1">
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

export const WarningsHeavy: Story = {
  args: {
    variant: 'signals-heavy',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBookDraft: Story = {
  args: {
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
