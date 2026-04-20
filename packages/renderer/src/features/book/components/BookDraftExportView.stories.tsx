import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import type { BookExportArtifactFormat, BookExportArtifactRecord, BuildBookExportArtifactInput } from '../api/book-export-artifact-records'
import { buildBookExportArtifactInput, buildBookExportArtifactWorkspace } from '../lib/book-export-artifact-mappers'
import type { BookExportArtifactWorkspaceViewModel } from '../types/book-export-artifact-view-models'
import { BookDraftExportView } from './BookDraftExportView'
import { BookStoryShell, type BookStoryVariant } from './book-storybook'
import { buildBookDraftExportBaselineError, buildBookDraftExportStoryData } from './book-draft-storybook'

interface StoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  exportProfileId?: string
  artifactScenario?: 'empty' | 'latest' | 'readiness-blocked'
  selectedArtifactFormat?: BookExportArtifactFormat
}

function StoryComponent({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  exportProfileId,
  artifactScenario = 'empty',
  selectedArtifactFormat = 'markdown',
}: StoryProps) {
  const { locale } = useI18n()
  const exportData = buildBookDraftExportStoryData(locale, {
    variant,
    selectedChapterId,
    checkpointId,
    exportProfileId,
  })
  const artifactWorkspace = buildArtifactWorkspace(locale, {
    variant,
    selectedChapterId,
    checkpointId,
    exportProfileId,
    artifactScenario,
    selectedArtifactFormat,
  })

  return (
    <BookDraftExportView
      exportPreview={exportData.exportWorkspace}
      exportProfiles={exportData.exportProfiles}
      selectedExportProfileId={exportData.selectedExportProfile.exportProfileId}
      artifactWorkspace={artifactWorkspace}
      selectedArtifactFormat={selectedArtifactFormat}
      onSelectChapter={() => undefined}
      onOpenChapter={() => undefined}
      onSelectExportProfile={() => undefined}
      onSelectArtifactFormat={() => undefined}
      onBuildArtifact={() => undefined}
      onCopyArtifact={() => undefined}
      onDownloadArtifact={() => undefined}
    />
  )
}

function toRecord(input: BuildBookExportArtifactInput, overrides?: Partial<BookExportArtifactRecord>): BookExportArtifactRecord {
  return {
    ...input,
    id: overrides?.id ?? `story-export-artifact-${input.format}`,
    status: 'ready',
    createdAtLabel: overrides?.createdAtLabel ?? 'Built in story session',
    createdByLabel: overrides?.createdByLabel ?? 'Narrative editor',
    ...overrides,
  }
}

function buildArtifactWorkspace(
  locale: 'en' | 'zh-CN',
  options: Required<Pick<StoryProps, 'artifactScenario' | 'selectedArtifactFormat'>> &
    Pick<StoryProps, 'variant' | 'selectedChapterId' | 'checkpointId' | 'exportProfileId'>,
): BookExportArtifactWorkspaceViewModel {
  const exportData = buildBookDraftExportStoryData(locale, {
    variant: options.variant,
    selectedChapterId: options.selectedChapterId,
    checkpointId: options.checkpointId,
    exportProfileId: options.exportProfileId,
  })
  const input = buildBookExportArtifactInput({
    exportPreview: exportData.exportWorkspace,
    reviewInbox: null,
    format: options.selectedArtifactFormat,
    checkpointId: options.checkpointId ?? 'checkpoint-book-signal-arc-pr11-baseline',
  })
  const records =
    options.artifactScenario === 'latest'
      ? [
          toRecord(input, {
            id: 'story-export-artifact-latest',
          }),
          toRecord(input, {
            id: 'story-export-artifact-previous',
            filename: `signal-arc-previous.${input.format === 'markdown' ? 'md' : 'txt'}`,
            createdAtLabel: 'Built before story refresh',
          }),
        ]
      : []

  return buildBookExportArtifactWorkspace({
    exportPreview: exportData.exportWorkspace,
    reviewInbox: null,
    artifactRecords: records,
    checkpointId: options.checkpointId ?? 'checkpoint-book-signal-arc-pr11-baseline',
  })
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
    artifactScenario: 'empty',
    selectedArtifactFormat: 'markdown',
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

export const ExportViewWithArtifactReady: Story = {
  args: {
    variant: 'quiet-book',
    exportProfileId: 'export-archive-snapshot',
    artifactScenario: 'latest',
    selectedArtifactFormat: 'markdown',
  },
}

export const ExportViewWithBlockedGate: Story = {
  args: {
    variant: 'default',
    artifactScenario: 'readiness-blocked',
    selectedArtifactFormat: 'plain_text',
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
          artifactWorkspace={null}
          selectedArtifactFormat={args.selectedArtifactFormat ?? 'markdown'}
          errorMessage={buildBookDraftExportBaselineError().message}
          onSelectChapter={() => undefined}
          onOpenChapter={() => undefined}
          onSelectExportProfile={() => undefined}
          onSelectArtifactFormat={() => undefined}
          onBuildArtifact={() => undefined}
          onCopyArtifact={() => undefined}
          onDownloadArtifact={() => undefined}
        />
      </BookStoryShell>
    )
  },
}
