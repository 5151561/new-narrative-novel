import type { Meta, StoryObj } from '@storybook/react'

import { BookDraftBottomDock } from './BookDraftBottomDock'
import {
  BookStoryShell,
  type BookStoryVariant,
} from './book-storybook'
import { useI18n } from '@/app/i18n'
import { buildBookDraftCompareStoryData, buildBookDraftStoryActivity, useLocalizedBookDraftWorkspace } from './book-draft-storybook'

interface BookDraftBottomDockStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  draftView?: 'read' | 'compare'
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  draftView = 'read',
}: BookDraftBottomDockStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })

  return (
    <BookDraftBottomDock
      summary={workspace.dockSummary}
      activity={buildBookDraftStoryActivity(locale, workspace, {
        quiet: variant === 'quiet-book' && draftView === 'read',
        draftView,
        checkpointTitle: compareData.selectedCheckpoint.title,
      })}
      activeDraftView={draftView}
      compareProblems={draftView === 'compare' ? compareData.compareProblems : null}
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
    draftView: 'read',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ReadDefault: Story = {}

export const CompareDefault: Story = {
  args: {
    draftView: 'compare',
  },
}

export const CompareTraceRegression: Story = {
  args: {
    draftView: 'compare',
    variant: 'signals-heavy',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareQuietCheckpoint: Story = {
  args: {
    draftView: 'compare',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBookDraft: Story = {
  args: {
    draftView: 'read',
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
