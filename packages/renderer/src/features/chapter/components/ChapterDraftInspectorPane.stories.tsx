import type { Meta, StoryObj } from '@storybook/react'

import { ChapterDraftInspectorPane } from './ChapterDraftInspectorPane'
import { ChapterStoryShell, useLocalizedChapterDraftWorkspace, type ChapterDraftStoryVariant } from './chapter-storybook'

interface ChapterDraftInspectorPaneStoryProps {
  selectedSceneId: string
  variant?: ChapterDraftStoryVariant
}

function ChapterDraftInspectorPaneStory({
  selectedSceneId,
  variant = 'default',
}: ChapterDraftInspectorPaneStoryProps) {
  const workspace = useLocalizedChapterDraftWorkspace(selectedSceneId, variant)

  return (
    <ChapterDraftInspectorPane
      chapterTitle={workspace.title}
      chapterSummary={workspace.summary}
      inspector={workspace.inspector}
    />
  )
}

const meta = {
  title: 'Business/ChapterDraftInspectorPane',
  component: ChapterDraftInspectorPaneStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-sm">
      <ChapterDraftInspectorPaneStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
    variant: 'default',
  },
} satisfies Meta<typeof ChapterDraftInspectorPaneStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const MissingDrafts: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    variant: 'missing',
  },
}

export const SelectedMiddleScene: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
  },
}

export const QuietChapter: Story = {
  args: {
    selectedSceneId: 'scene-warehouse-bridge',
    variant: 'quiet',
  },
}
