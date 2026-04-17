import type { Meta, StoryObj } from '@storybook/react'

import { ChapterOutlinerView } from './ChapterOutlinerView'
import { ChapterStoryShell, useLocalizedChapterStructureWorkspace } from './chapter-storybook'

interface ChapterOutlinerViewStoryProps {
  selectedSceneId: string
  savingSceneId?: string
}

function ChapterOutlinerViewStory({ selectedSceneId, savingSceneId }: ChapterOutlinerViewStoryProps) {
  const workspace = useLocalizedChapterStructureWorkspace(selectedSceneId)

  return (
    <ChapterOutlinerView
      workspace={workspace}
      savingSceneId={savingSceneId}
      onSelectScene={() => undefined}
      onSaveScenePatch={() => undefined}
      onOpenScene={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/ChapterOutlinerView',
  component: ChapterOutlinerViewStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-7xl">
      <ChapterOutlinerViewStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
  },
} satisfies Meta<typeof ChapterOutlinerViewStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SelectedMiddleScene: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
  },
}

export const SavingSelectedScene: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    savingSceneId: 'scene-concourse-delay',
  },
}
