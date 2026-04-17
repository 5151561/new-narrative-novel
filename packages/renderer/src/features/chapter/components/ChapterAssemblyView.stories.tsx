import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'
import { buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterAssemblyView } from './ChapterAssemblyView'

const meta = {
  title: 'Business/ChapterAssemblyView',
  component: ChapterAssemblyView,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[720px] bg-app p-6">
        <div className="max-w-6xl">
          <ChapterAssemblyView {...args} />
        </div>
      </div>
    </AppProviders>
  ),
  args: {
    workspace: buildChapterStoryWorkspace('scene-midnight-platform'),
    onSelectScene: () => undefined,
    onOpenScene: () => undefined,
  },
} satisfies Meta<typeof ChapterAssemblyView>

export default meta

type Story = StoryObj<typeof meta>

export const SelectedFirstScene: Story = {}

export const SelectedMiddleScene: Story = {
  args: {
    workspace: buildChapterStoryWorkspace('scene-concourse-delay'),
  },
}
