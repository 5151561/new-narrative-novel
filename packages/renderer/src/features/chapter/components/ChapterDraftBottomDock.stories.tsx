import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { ChapterDraftBottomDock } from './ChapterDraftBottomDock'
import {
  ChapterStoryShell,
  buildChapterDraftStoryActivity,
  useLocalizedChapterDraftWorkspace,
  type ChapterDraftStoryVariant,
} from './chapter-storybook'

interface ChapterDraftBottomDockStoryProps {
  selectedSceneId: string
  variant?: ChapterDraftStoryVariant
  quiet?: boolean
}

function ChapterDraftBottomDockStory({
  selectedSceneId,
  variant = 'default',
  quiet = false,
}: ChapterDraftBottomDockStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedChapterDraftWorkspace(selectedSceneId, variant)

  return (
    <ChapterDraftBottomDock
      summary={workspace.dockSummary}
      activity={quiet ? [] : buildChapterDraftStoryActivity(locale, workspace)}
    />
  )
}

const meta = {
  title: 'Business/ChapterDraftBottomDock',
  component: ChapterDraftBottomDockStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-6xl rounded-md border border-line-soft bg-surface-1">
      <ChapterDraftBottomDockStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
    variant: 'default',
    quiet: false,
  },
} satisfies Meta<typeof ChapterDraftBottomDockStory>

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
    quiet: true,
  },
}
