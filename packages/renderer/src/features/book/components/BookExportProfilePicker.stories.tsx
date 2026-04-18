import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookExportProfilePicker } from './BookExportProfilePicker'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { buildBookDraftExportStoryData } from './book-draft-storybook'

interface StoryProps {
  variant?: BookStoryVariant
  exportProfileId?: string
}

function StoryComponent({ variant = 'default', exportProfileId }: StoryProps) {
  const { locale } = useI18n()
  const exportData = buildBookDraftExportStoryData(locale, { variant, exportProfileId })

  return (
    <BookExportProfilePicker
      profiles={exportData.exportProfiles}
      selectedExportProfileId={exportData.selectedExportProfile.exportProfileId}
      onSelectExportProfile={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookExportProfilePicker',
  component: StoryComponent,
  parameters: { layout: 'padded' },
  render: (args) => (
    <BookStoryShell frameClassName="max-w-6xl rounded-md border border-line-soft bg-surface-1">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: { variant: 'default' },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ReviewPacket: Story = {}

export const SubmissionPreview: Story = {
  args: {
    exportProfileId: 'export-submission-preview',
  },
}

export const ArchiveSnapshot: Story = {
  args: {
    exportProfileId: 'export-archive-snapshot',
  },
}
