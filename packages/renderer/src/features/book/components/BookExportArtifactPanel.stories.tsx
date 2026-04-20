import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import type { BookExportArtifactFormat, BookExportArtifactRecord, BuildBookExportArtifactInput } from '../api/book-export-artifact-records'
import { buildBookExportArtifactInput, buildBookExportArtifactWorkspace } from '../lib/book-export-artifact-mappers'
import type { BookExportArtifactWorkspaceViewModel } from '../types/book-export-artifact-view-models'
import { BookStoryShell } from './book-storybook'
import { buildBookDraftExportStoryData } from './book-draft-storybook'
import { BookExportArtifactPanel } from './BookExportArtifactPanel'

interface StoryProps {
  state: 'latest' | 'stale' | 'empty'
  selectedFormat: BookExportArtifactFormat
}

function toRecord(input: BuildBookExportArtifactInput, overrides?: Partial<BookExportArtifactRecord>): BookExportArtifactRecord {
  return {
    ...input,
    id: overrides?.id ?? `story-artifact-${input.format}`,
    status: 'ready',
    createdAtLabel: overrides?.createdAtLabel ?? 'Built in story session',
    createdByLabel: overrides?.createdByLabel ?? 'Narrative editor',
    ...overrides,
  }
}

function buildWorkspace(state: StoryProps['state'], locale: 'en' | 'zh-CN'): BookExportArtifactWorkspaceViewModel {
  const exportData = buildBookDraftExportStoryData(locale, {
    variant: 'quiet-book',
    exportProfileId: 'export-archive-snapshot',
  })
  const input = buildBookExportArtifactInput({
    exportPreview: exportData.exportWorkspace,
    reviewInbox: null,
    format: 'markdown',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  })
  const records =
    state === 'empty'
      ? []
      : [
          toRecord(input, {
            id: 'story-artifact-latest',
            sourceSignature: state === 'stale' ? 'story-stale-signature' : input.sourceSignature,
          }),
          toRecord(input, {
            id: 'story-artifact-previous',
            filename: 'signal-arc-previous.md',
            createdAtLabel: 'Built before the latest story pass',
          }),
        ]

  return buildBookExportArtifactWorkspace({
    exportPreview: exportData.exportWorkspace,
    reviewInbox: null,
    artifactRecords: records,
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  })
}

function StoryComponent({ state, selectedFormat }: StoryProps) {
  const { locale } = useI18n()

  return (
    <BookExportArtifactPanel
      artifactWorkspace={buildWorkspace(state, locale)}
      selectedFormat={selectedFormat}
      onSelectFormat={() => undefined}
      onBuildArtifact={() => undefined}
      onCopyArtifact={() => undefined}
      onDownloadArtifact={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/BookExportArtifactPanel',
  component: StoryComponent,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[760px]">
      <div className="max-w-4xl p-4">
        <StoryComponent {...args} />
      </div>
    </BookStoryShell>
  ),
  args: {
    state: 'latest',
    selectedFormat: 'markdown',
  },
} satisfies Meta<typeof StoryComponent>

export default meta

type Story = StoryObj<typeof meta>

export const LatestMarkdownArtifact: Story = {}

export const LatestArtifactStale: Story = {
  args: {
    state: 'stale',
  },
}

export const NoArtifactsYet: Story = {
  args: {
    state: 'empty',
    selectedFormat: 'plain_text',
  },
}
