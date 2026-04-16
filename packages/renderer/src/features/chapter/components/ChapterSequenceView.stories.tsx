import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'
import { buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterSequenceView } from './ChapterSequenceView'

const meta = {
  title: 'Business/ChapterSequenceView',
  component: ChapterSequenceView,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[720px] bg-app p-6">
        <div className="max-w-6xl">
          <ChapterSequenceView {...args} />
        </div>
      </div>
    </AppProviders>
  ),
  args: {
    workspace: buildChapterStoryWorkspace('scene-midnight-platform'),
    onSelectScene: () => undefined,
  },
} satisfies Meta<typeof ChapterSequenceView>

export default meta

type Story = StoryObj<typeof meta>

export const NormalSequence: Story = {}

export const SelectedLastScene: Story = {
  args: {
    workspace: buildChapterStoryWorkspace('scene-ticket-window'),
  },
}
