import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'
import { buildChapterStoryWorkspace } from './chapter-story-fixture'

import { ChapterBinderPane } from './ChapterBinderPane'

const meta = {
  title: 'Business/ChapterBinderPane',
  component: ChapterBinderPane,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[720px] bg-app p-6">
        <div className="max-w-sm">
          <ChapterBinderPane {...args} />
        </div>
      </div>
    </AppProviders>
  ),
  args: {
    title: 'Chapters',
    description: 'Keep chapter structure, placeholder scenes, and unresolved signals aligned.',
    activeView: 'sequence',
    workspace: buildChapterStoryWorkspace('scene-midnight-platform'),
    onSelectScene: () => undefined,
    onMoveScene: () => undefined,
    onOpenScene: () => undefined,
  },
} satisfies Meta<typeof ChapterBinderPane>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultSelectedFirstScene: Story = {}

export const SelectedMiddleScene: Story = {
  args: {
    workspace: buildChapterStoryWorkspace('scene-concourse-delay'),
  },
}

export const MovingSelectedScene: Story = {
  args: {
    workspace: buildChapterStoryWorkspace('scene-concourse-delay'),
    movingSceneId: 'scene-concourse-delay',
  },
}
