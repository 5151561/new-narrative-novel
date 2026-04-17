import type { Meta, StoryObj } from '@storybook/react'

import { AppProviders } from '@/app/providers'

import {
  buildChapterDraftMissingStoryWorkspace,
  buildChapterDraftStoryWorkspace,
  buildQuietChapterDraftStoryWorkspace,
} from './chapter-story-fixture'
import { ChapterDraftBottomDock } from './ChapterDraftBottomDock'

const meta = {
  title: 'Business/ChapterDraftBottomDock',
  component: ChapterDraftBottomDock,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <AppProviders>
      <div className="min-h-[360px] bg-app p-6">
        <div className="max-w-6xl rounded-md border border-line-soft bg-surface-1">
          <ChapterDraftBottomDock {...args} />
        </div>
      </div>
    </AppProviders>
  ),
} satisfies Meta<typeof ChapterDraftBottomDock>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    summary: buildChapterDraftStoryWorkspace('scene-midnight-platform').dockSummary,
    activity: [
      {
        id: 'lens-0',
        kind: 'lens',
        title: 'Entered chapter draft',
        detail: 'The reading surface stays aligned to the same chapter identity and route.sceneId.',
        tone: 'accent',
      },
      {
        id: 'scene-1',
        kind: 'scene',
        title: 'Focused Midnight Platform',
        detail: 'Keep the bargain public and constrained.',
        tone: 'neutral',
      },
    ],
  },
}

export const MissingDrafts: Story = {
  args: {
    summary: buildChapterDraftMissingStoryWorkspace('scene-concourse-delay').dockSummary,
    activity: [
      {
        id: 'lens-0',
        kind: 'lens',
        title: 'Entered chapter draft',
        detail: 'The reading surface stays aligned to the same chapter identity and route.sceneId.',
        tone: 'accent',
      },
      {
        id: 'scene-1',
        kind: 'scene',
        title: 'Focused Concourse Delay',
        detail: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
        tone: 'neutral',
      },
    ],
  },
}

export const SelectedMiddleScene: Story = {
  args: {
    summary: buildChapterDraftStoryWorkspace('scene-concourse-delay').dockSummary,
    activity: [
      {
        id: 'lens-0',
        kind: 'lens',
        title: 'Entered chapter draft',
        detail: 'The reading surface stays aligned to the same chapter identity and route.sceneId.',
        tone: 'accent',
      },
      {
        id: 'scene-1',
        kind: 'scene',
        title: 'Focused Concourse Delay',
        detail: 'Hold the crowd bottleneck long enough to keep platform pressure alive.',
        tone: 'neutral',
      },
    ],
  },
}

export const QuietChapter: Story = {
  args: {
    summary: buildQuietChapterDraftStoryWorkspace('scene-warehouse-bridge').dockSummary,
    activity: [],
  },
}
