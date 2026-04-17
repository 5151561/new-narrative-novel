import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { ChapterBinderPane } from './ChapterBinderPane'
import { ChapterStoryShell, useLocalizedChapterStructureWorkspace } from './chapter-storybook'

interface ChapterBinderPaneStoryProps {
  selectedSceneId: string
  movingSceneId?: string | null
}

function ChapterBinderPaneStory({ selectedSceneId, movingSceneId = null }: ChapterBinderPaneStoryProps) {
  const { dictionary } = useI18n()
  const workspace = useLocalizedChapterStructureWorkspace(selectedSceneId)

  return (
    <ChapterBinderPane
      title={dictionary.app.chapters}
      description={dictionary.app.chapterNavigatorDescription}
      activeView="sequence"
      workspace={workspace}
      movingSceneId={movingSceneId}
      onSelectScene={() => undefined}
      onMoveScene={() => undefined}
      onOpenScene={() => undefined}
    />
  )
}

const meta = {
  title: 'Business/ChapterBinderPane',
  component: ChapterBinderPaneStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-sm">
      <ChapterBinderPaneStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
    movingSceneId: null,
  },
} satisfies Meta<typeof ChapterBinderPaneStory>

export default meta

type Story = StoryObj<typeof meta>

export const DefaultSelectedFirstScene: Story = {}

export const SelectedMiddleScene: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
  },
}

export const MovingSelectedScene: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    movingSceneId: 'scene-concourse-delay',
  },
}
