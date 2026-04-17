import type { Meta, StoryObj } from '@storybook/react'

import { ChapterDraftBinderPane } from './ChapterDraftBinderPane'
import { ChapterStoryShell, useLocalizedChapterDraftWorkspace, type ChapterDraftStoryVariant } from './chapter-storybook'

interface ChapterDraftBinderPaneStoryProps {
  selectedSceneId: string
  variant?: ChapterDraftStoryVariant
}

function ChapterDraftBinderPaneStory({
  selectedSceneId,
  variant = 'default',
}: ChapterDraftBinderPaneStoryProps) {
  const workspace = useLocalizedChapterDraftWorkspace(selectedSceneId, variant)

  return <ChapterDraftBinderPane workspace={workspace} onSelectScene={() => undefined} onOpenScene={() => undefined} />
}

const meta = {
  title: 'Business/ChapterDraftBinderPane',
  component: ChapterDraftBinderPaneStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-sm">
      <ChapterDraftBinderPaneStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
    variant: 'default',
  },
} satisfies Meta<typeof ChapterDraftBinderPaneStory>

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
