import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { BookDraftExportView } from './BookDraftExportView'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { buildBookDraftExportBaselineError, buildBookDraftExportStoryData } from './book-draft-storybook'

interface StoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  exportProfileId?: string
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  exportProfileId,
}: StoryProps) {
  const { locale } = useI18n()
  const exportData = buildBookDraftExportStoryData(locale, {
    variant,
    selectedChapterId,
    checkpointId,
    exportProfileId,
  })

  return (
    <BookDraftExportView
      exportPreview={exportData.exportWorkspace}
      exportProfiles={exportData.exportProfiles}
      selectedExportProfileId={exportData.selectedExportProfile.exportProfileId}
      onSelectChapter={() => undefined}
      onOpenChapter={() => undefined}
      onSelectExportProfile={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookDraftExportView',
  component: StoryComponent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[820px]">
      <StoryComponent {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
    exportProfileId: 'export-review-packet',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const ExportReviewPacket: Story = {}

export const ExportSubmissionPreview: Story = {
  args: {
    exportProfileId: 'export-submission-preview',
  },
}

export const ExportArchiveSnapshot: Story = {
  args: {
    exportProfileId: 'export-archive-snapshot',
  },
}

export const ExportBaselineUnavailable: Story = {
  render: (args) => {
    const { locale } = useI18n()
    const exportData = buildBookDraftExportStoryData(locale, {
      variant: args.variant,
      selectedChapterId: args.selectedChapterId,
      checkpointId: args.checkpointId,
      exportProfileId: args.exportProfileId,
    })

    return (
      <BookStoryShell frameClassName="min-h-[820px]">
        <BookDraftExportView
          exportPreview={null}
          exportProfiles={exportData.exportProfiles}
          selectedExportProfileId={exportData.selectedExportProfile.exportProfileId}
          errorMessage={buildBookDraftExportBaselineError().message}
          onSelectChapter={() => undefined}
          onOpenChapter={() => undefined}
          onSelectExportProfile={() => undefined}
        />
      </BookStoryShell>
    )
  },
}
