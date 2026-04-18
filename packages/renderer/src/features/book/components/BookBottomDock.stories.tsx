import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookBottomDock } from './BookBottomDock'
import { BookStoryShell, buildBookStoryActivity, useLocalizedBookWorkspace, type BookStoryVariant } from './book-storybook'

interface BookBottomDockStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function BookBottomDockStory({
  variant = 'default',
  selectedChapterId,
}: BookBottomDockStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookWorkspace({ variant, selectedChapterId })

  return (
    <BookBottomDock
      summary={workspace.dockSummary}
      activity={buildBookStoryActivity(locale, workspace, {
        activeView: variant === 'missing-trace-attention' ? 'outliner' : 'signals',
        quiet: variant === 'quiet-book',
      })}
    />
  )
}

const meta = {
  title: 'Business/BookBottomDock',
  component: BookBottomDockStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-6xl rounded-md border border-line-soft bg-surface-1">
      <BookBottomDockStory {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
  },
} satisfies Meta<typeof BookBottomDockStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const QuietBook: Story = {
  args: {
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const MissingTraceAttention: Story = {
  args: {
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-dawn-slip',
  },
}
