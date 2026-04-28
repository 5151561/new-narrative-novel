import type { Meta, StoryObj } from '@storybook/react'

import { ChapterStoryShell } from './chapter-storybook'
import { ChapterRunOrchestrationPanel } from './ChapterRunOrchestrationPanel'

const meta = {
  title: 'Mockups/Chapter/ChapterRunOrchestrationPanel',
  component: ChapterRunOrchestrationPanel,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-4xl">
      <ChapterRunOrchestrationPanel {...args} />
    </ChapterStoryShell>
  ),
  args: {
    title: 'Chapter orchestration',
    description: 'Advance the next accepted backlog scene and stop at review before prose materializes.',
    waitingReviewScenes: [],
    draftedSceneCount: 1,
    missingDraftCount: 2,
  },
} satisfies Meta<typeof ChapterRunOrchestrationPanel>

export default meta

type Story = StoryObj<typeof meta>

export const RunnableNextScene: Story = {
  args: {
    nextScene: {
      sceneId: 'scene-concourse-delay',
      title: 'Concourse Delay',
      order: 2,
      summary: 'Carry witness pressure into the concourse without resolving courier ownership.',
      backlogStatusLabel: 'Planned',
      runStatusLabel: 'Idle',
    },
  },
}

export const WaitingReviewGate: Story = {
  args: {
    nextScene: undefined,
    waitingReviewScenes: [
      {
        sceneId: 'scene-concourse-delay',
        title: 'Concourse Delay',
        order: 2,
        backlogStatus: 'needs_review',
        runStatusLabel: 'Run waiting for review',
      },
    ],
  },
}

export const ChapterComplete: Story = {
  args: {
    nextScene: undefined,
    waitingReviewScenes: [],
    draftedSceneCount: 3,
    missingDraftCount: 0,
  },
}
