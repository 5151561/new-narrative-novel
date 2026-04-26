import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'

import { ChapterBottomDock } from './ChapterBottomDock'
import {
  ChapterStoryShell,
  buildChapterBottomDockProblems,
  buildChapterStructureStoryActivity,
  useLocalizedChapterStructureWorkspace,
  type ChapterStructureStoryVariant,
} from './chapter-storybook'

interface ChapterBottomDockStoryProps {
  selectedSceneId: string
  variant?: ChapterStructureStoryVariant
  quiet?: boolean
  longActivity?: boolean
}

function ChapterBottomDockStory({
  selectedSceneId,
  variant = 'problems-heavy',
  quiet = false,
  longActivity = false,
}: ChapterBottomDockStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedChapterStructureWorkspace(selectedSceneId, variant)
  const activity = quiet
    ? []
    : buildChapterStructureStoryActivity(locale, workspace, {
        activeView: 'outliner',
        includeAssemblySwitch: true,
        movedSceneTitle: locale === 'zh-CN' ? '售票窗' : 'Ticket Window',
      })
  const storyActivity = longActivity
    ? Array.from({ length: 8 }, (_, batch) =>
        activity.map((item) => ({
          ...item,
          id: `${item.id}-${batch}`,
          title: `${item.title} ${batch + 1}`,
        })),
      ).flat()
    : activity

  return (
    <ChapterBottomDock
      problems={buildChapterBottomDockProblems(workspace)}
      activity={storyActivity}
    />
  )
}

const meta = {
  title: 'Business/ChapterBottomDock',
  component: ChapterBottomDockStory,
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="max-w-6xl rounded-md border border-line-soft bg-surface-1">
      <ChapterBottomDockStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
    variant: 'problems-heavy',
    quiet: false,
  },
} satisfies Meta<typeof ChapterBottomDockStory>

export default meta

type Story = StoryObj<typeof meta>

export const WithRecentActivity: Story = {}

export const QuietSession: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    variant: 'default',
    quiet: true,
  },
}

export const LongActivity: Story = {
  args: {
    selectedSceneId: 'scene-midnight-platform',
    variant: 'problems-heavy',
    longActivity: true,
  },
}
