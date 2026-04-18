import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookExportReadinessChecklist } from './BookExportReadinessChecklist'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { buildBookDraftExportStoryData } from './book-draft-storybook'

interface StoryProps {
  variant?: BookStoryVariant
  checkpointId?: string
  exportProfileId?: string
}

function StoryComponent({ variant = 'default', checkpointId, exportProfileId }: StoryProps) {
  const { locale } = useI18n()
  const exportData = buildBookDraftExportStoryData(locale, { variant, checkpointId, exportProfileId })

  return (
    <BookExportReadinessChecklist
      issues={exportData.exportWorkspace.readiness.issues}
      onSelectChapter={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookExportReadinessChecklist',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-3xl rounded-md border border-line-soft bg-surface-1">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: { variant: 'default' },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const BlockedByMissingDraft: Story = {}

export const BlockedByTraceGap: Story = {
  args: {
    variant: 'missing-trace-attention',
  },
}

export const Ready: Story = {
  args: {
    variant: 'quiet-book',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    exportProfileId: 'export-review-packet',
  },
}
