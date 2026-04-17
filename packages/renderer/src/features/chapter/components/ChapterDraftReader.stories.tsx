import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import {
  buildChapterDraftMissingStoryWorkspace,
  buildChapterDraftStoryWorkspace,
  buildQuietChapterDraftStoryWorkspace,
} from './chapter-story-fixture'
import { ChapterDraftReader } from './ChapterDraftReader'

const meta = {
  title: 'Business/ChapterDraftReader',
  component: ChapterDraftReader,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[720px] bg-app p-6">
        <div className="rounded-md border border-line-soft bg-surface-1">
          <ChapterDraftReader {...args} />
        </div>
      </div>
    </AppProviders>
  ),
  args: {
    workspace: buildChapterDraftStoryWorkspace('scene-midnight-platform'),
    onSelectScene: () => undefined,
    onOpenScene: () => undefined,
  },
} satisfies Meta<typeof ChapterDraftReader>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const MissingDrafts: Story = {
  args: {
    workspace: buildChapterDraftMissingStoryWorkspace('scene-concourse-delay'),
  },
}

export const SelectedMiddleScene: Story = {
  args: {
    workspace: buildChapterDraftStoryWorkspace('scene-concourse-delay'),
  },
}

export const QuietChapter: Story = {
  args: {
    workspace: buildQuietChapterDraftStoryWorkspace('scene-warehouse-bridge'),
  },
}
