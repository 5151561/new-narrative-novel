import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'
import {
  buildChapterProblemsHeavyStoryWorkspace,
  buildChapterStoryWorkspace,
} from './chapter-story-fixture'

import { ChapterStructureInspectorPane } from './ChapterStructureInspectorPane'

const meta = {
  title: 'Business/ChapterStructureInspectorPane',
  component: ChapterStructureInspectorPane,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[720px] bg-app p-6">
        <div className="max-w-sm">
          <ChapterStructureInspectorPane {...args} />
        </div>
      </div>
    </AppProviders>
  ),
  args: {
    chapterId: 'chapter-signals-in-rain',
    unresolvedCount: 6,
    inspector: buildChapterStoryWorkspace('scene-midnight-platform').inspector,
  },
} satisfies Meta<typeof ChapterStructureInspectorPane>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ProblemsHeavy: Story = {
  args: {
    unresolvedCount: 9,
    inspector: buildChapterProblemsHeavyStoryWorkspace('scene-concourse-delay').inspector,
  },
}
