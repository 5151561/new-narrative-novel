import type { Meta, StoryObj } from '@storybook/react'

import { ChapterAssemblyView } from './ChapterAssemblyView'
import { ChapterStoryShell, useLocalizedChapterStructureWorkspace } from './chapter-storybook'

interface ChapterAssemblyViewStoryProps {
  selectedSceneId: string
}

function ChapterAssemblyViewStory({ selectedSceneId }: ChapterAssemblyViewStoryProps) {
  const workspace = useLocalizedChapterStructureWorkspace(selectedSceneId)

  return <ChapterAssemblyView workspace={workspace} onSelectScene={() => undefined} onOpenScene={() => undefined} />
}

const meta = {
  title: 'Business/ChapterAssemblyView',
  component: ChapterAssemblyViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-6xl">
      <ChapterAssemblyViewStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
  },
} satisfies Meta<typeof ChapterAssemblyViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const SelectedFirstScene: Story = {}

export const SelectedMiddleScene: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
  },
}
