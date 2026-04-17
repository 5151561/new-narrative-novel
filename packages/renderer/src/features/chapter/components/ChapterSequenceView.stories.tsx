import type { Meta, StoryObj } from '@storybook/react'

import { ChapterSequenceView } from './ChapterSequenceView'
import { ChapterStoryShell, useLocalizedChapterStructureWorkspace } from './chapter-storybook'

interface ChapterSequenceViewStoryProps {
  selectedSceneId: string
}

function ChapterSequenceViewStory({ selectedSceneId }: ChapterSequenceViewStoryProps) {
  const workspace = useLocalizedChapterStructureWorkspace(selectedSceneId)

  return <ChapterSequenceView workspace={workspace} onSelectScene={() => undefined} onOpenScene={() => undefined} />
}

const meta = {
  title: 'Business/ChapterSequenceView',
  component: ChapterSequenceViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-6xl">
      <ChapterSequenceViewStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
  },
} satisfies Meta<typeof ChapterSequenceViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const NormalSequence: Story = {}

export const SelectedLastScene: Story = {
  args: {
    selectedSceneId: 'scene-ticket-window',
  },
}
