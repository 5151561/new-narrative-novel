import type { Meta, StoryObj } from '@storybook/react'

import { ChapterStructureInspectorPane } from './ChapterStructureInspectorPane'
import { ChapterStoryShell, useLocalizedChapterStructureWorkspace, type ChapterStructureStoryVariant } from './chapter-storybook'

interface ChapterStructureInspectorPaneStoryProps {
  selectedSceneId: string
  variant?: ChapterStructureStoryVariant
}

function ChapterStructureInspectorPaneStory({
  selectedSceneId,
  variant = 'default',
}: ChapterStructureInspectorPaneStoryProps) {
  const workspace = useLocalizedChapterStructureWorkspace(selectedSceneId, variant)

  return (
    <ChapterStructureInspectorPane
      chapterTitle={workspace.title}
      chapterSummary={workspace.summary}
      unresolvedCount={workspace.unresolvedCount}
      inspector={workspace.inspector}
    />
  )
}

const meta = {
  title: 'Business/ChapterStructureInspectorPane',
  component: ChapterStructureInspectorPaneStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-sm">
      <ChapterStructureInspectorPaneStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
    variant: 'default',
  },
} satisfies Meta<typeof ChapterStructureInspectorPaneStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ProblemsHeavy: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    variant: 'problems-heavy',
  },
}
