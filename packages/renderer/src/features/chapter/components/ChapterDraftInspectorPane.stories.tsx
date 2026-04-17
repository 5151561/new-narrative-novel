import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import {
  buildChapterDraftMissingStoryWorkspace,
  buildChapterDraftStoryWorkspace,
  buildQuietChapterDraftStoryWorkspace,
} from './chapter-story-fixture'
import { ChapterDraftInspectorPane } from './ChapterDraftInspectorPane'

const meta = {
  title: 'Business/ChapterDraftInspectorPane',
  component: ChapterDraftInspectorPane,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[720px] bg-app p-6">
        <div className="max-w-sm">
          <ChapterDraftInspectorPane {...args} />
        </div>
      </div>
    </AppProviders>
  ),
} satisfies Meta<typeof ChapterDraftInspectorPane>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    chapterTitle: 'Signals in Rain',
    chapterSummary: 'Read the chapter as one continuous draft surface while route.sceneId keeps the focus stable.',
    inspector: buildChapterDraftStoryWorkspace('scene-midnight-platform').inspector,
  },
}

export const MissingDrafts: Story = {
  args: {
    chapterTitle: 'Signals in Rain',
    chapterSummary: 'Read the chapter as one continuous draft surface while route.sceneId keeps the focus stable.',
    inspector: buildChapterDraftMissingStoryWorkspace('scene-concourse-delay').inspector,
  },
}

export const SelectedMiddleScene: Story = {
  args: {
    chapterTitle: 'Signals in Rain',
    chapterSummary: 'Read the chapter as one continuous draft surface while route.sceneId keeps the focus stable.',
    inspector: buildChapterDraftStoryWorkspace('scene-concourse-delay').inspector,
  },
}

export const QuietChapter: Story = {
  args: {
    chapterTitle: 'Open Water Signals',
    chapterSummary: 'A quieter chapter draft with one stable handoff scene.',
    inspector: buildQuietChapterDraftStoryWorkspace('scene-warehouse-bridge').inspector,
  },
}
