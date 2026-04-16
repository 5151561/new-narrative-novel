import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'
import { buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterOutlinerView } from './ChapterOutlinerView'

const meta = {
  title: 'Business/ChapterOutlinerView',
  component: ChapterOutlinerView,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[720px] bg-app p-6">
        <div className="max-w-7xl">
          <ChapterOutlinerView {...args} />
        </div>
      </div>
    </AppProviders>
  ),
  args: {
    workspace: buildChapterStoryWorkspace('scene-midnight-platform'),
    onSelectScene: () => undefined,
  },
} satisfies Meta<typeof ChapterOutlinerView>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SelectedMiddleScene: Story = {
  args: {
    workspace: buildChapterStoryWorkspace('scene-concourse-delay'),
  },
}
