import type { Meta, StoryObj } from '@storybook/react'

import { ChapterDraftReader } from './ChapterDraftReader'
import { ChapterStoryShell, useLocalizedChapterDraftWorkspace, type ChapterDraftStoryVariant } from './chapter-storybook'

interface ChapterDraftReaderStoryProps {
  selectedSceneId: string
  variant?: ChapterDraftStoryVariant
}

function ChapterDraftReaderStory({ selectedSceneId, variant = 'default' }: ChapterDraftReaderStoryProps) {
  const workspace = useLocalizedChapterDraftWorkspace(selectedSceneId, variant)

  return <ChapterDraftReader workspace={workspace} onSelectScene={() => undefined} onOpenScene={() => undefined} />
}

const meta = {
  title: 'Business/ChapterDraftReader',
  component: ChapterDraftReaderStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="rounded-md border border-line-soft bg-surface-1">
      <ChapterDraftReaderStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
    variant: 'default',
  },
} satisfies Meta<typeof ChapterDraftReaderStory>

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
