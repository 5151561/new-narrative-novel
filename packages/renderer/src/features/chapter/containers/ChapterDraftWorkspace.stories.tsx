import type { Meta, StoryObj } from '@storybook/react'

import { useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { LocaleToggle } from '@/features/workbench/components/LocaleToggle'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'

import { ChapterDraftBinderPane } from '../components/ChapterDraftBinderPane'
import { ChapterDraftBottomDock } from '../components/ChapterDraftBottomDock'
import { ChapterDraftInspectorPane } from '../components/ChapterDraftInspectorPane'
import { ChapterDraftReader } from '../components/ChapterDraftReader'
import { ChapterModeRail } from '../components/ChapterModeRail'
import { ChapterRunOrchestrationPanel } from '../components/ChapterRunOrchestrationPanel'
import {
  ChapterStoryShell,
  buildChapterDraftStoryActivity,
  useLocalizedChapterDraftWorkspace,
  type ChapterDraftStoryVariant,
} from '../components/chapter-storybook'
import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

function resolveChapterRunGate(
  scenes: Array<{
    sceneId: string
    title: string
    order: number
    summary: string
    backlogStatus: 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'
    backlogStatusLabel: string
    runStatusLabel: string
  }>,
) {
  const orderedScenes = [...scenes].sort((left, right) => left.order - right.order)
  const blockingScenes: Array<{
    sceneId: string
    title: string
    order: number
    backlogStatus: 'running' | 'needs_review'
    runStatusLabel: string
  }> = []

  for (const scene of orderedScenes) {
    if (scene.backlogStatus === 'running' || scene.backlogStatus === 'needs_review') {
      blockingScenes.push({
        sceneId: scene.sceneId,
        title: scene.title,
        order: scene.order,
        backlogStatus: scene.backlogStatus,
        runStatusLabel: scene.runStatusLabel,
      })
      break
    }

    if (scene.backlogStatus === 'planned') {
      return {
        nextScene: scene,
        blockingScenes,
      }
    }
  }

  return {
    nextScene: undefined,
    blockingScenes,
  }
}

function WorkspacePreview({ workspace }: { workspace: ChapterDraftWorkspaceViewModel }) {
  const { locale } = useI18n()
  const activity = buildChapterDraftStoryActivity(locale, workspace)
  const { nextScene, blockingScenes } = resolveChapterRunGate(workspace.scenes)

  return (
    <WorkbenchShell
      topBar={
        <div className="flex h-full flex-wrap items-center justify-end gap-2">
          <LocaleToggle />
          <Badge tone="neutral">{locale === 'zh-CN' ? `已起草 ${workspace.draftedSceneCount}` : `Drafted ${workspace.draftedSceneCount}`}</Badge>
          <Badge tone={workspace.missingDraftCount > 0 ? 'warn' : 'success'}>
            {locale === 'zh-CN' ? `缺稿 ${workspace.missingDraftCount}` : `Missing ${workspace.missingDraftCount}`}
          </Badge>
          <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${workspace.assembledWordCount} 词` : `${workspace.assembledWordCount} words`}</Badge>
        </div>
      }
      modeRail={<ChapterModeRail activeLens="draft" onSelectScope={() => undefined} onSelectLens={() => undefined} />}
      navigator={<ChapterDraftBinderPane workspace={workspace} onSelectScene={() => undefined} onOpenScene={() => undefined} />}
      mainStage={
        <ChapterDraftReader
          workspace={workspace}
          runOrchestrationPanel={
            <ChapterRunOrchestrationPanel
              title={locale === 'zh-CN' ? '章节编排' : 'Chapter orchestration'}
              description={
                locale === 'zh-CN'
                  ? '继续按 accepted backlog 顺序推进下一场，并在 review 处停下。'
                  : 'Keep advancing the accepted backlog one scene at a time and stop at review.'
              }
              nextScene={nextScene ? {
                sceneId: nextScene.sceneId,
                title: nextScene.title,
                order: nextScene.order,
                summary: nextScene.summary,
                backlogStatusLabel: nextScene.backlogStatusLabel,
                runStatusLabel: nextScene.runStatusLabel,
              } : undefined}
              waitingReviewScenes={blockingScenes}
              draftedSceneCount={workspace.draftedSceneCount}
              missingDraftCount={workspace.missingDraftCount}
            />
          }
          onSelectScene={() => undefined}
          onOpenScene={() => undefined}
        />
      }
      inspector={<ChapterDraftInspectorPane chapterTitle={workspace.title} chapterSummary={workspace.summary} inspector={workspace.inspector} />}
      bottomDock={<ChapterDraftBottomDock summary={workspace.dockSummary} activity={activity} />}
    />
  )
}

interface ChapterDraftWorkspaceStoryProps {
  selectedSceneId: string
  variant?: ChapterDraftStoryVariant
}

function ChapterDraftWorkspaceStory({
  selectedSceneId,
  variant = 'default',
}: ChapterDraftWorkspaceStoryProps) {
  const workspace = useLocalizedChapterDraftWorkspace(selectedSceneId, variant)
  return <WorkspacePreview workspace={workspace} />
}

const meta = {
  title: 'Mockups/Chapter/ChapterDraftWorkspace',
  component: ChapterDraftWorkspaceStory,
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="min-h-[720px]">
      <ChapterDraftWorkspaceStory {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-midnight-platform',
    variant: 'default',
  },
} satisfies Meta<typeof ChapterDraftWorkspaceStory>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const TransitionReady: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    variant: 'transition-ready',
  },
}

export const TransitionGap: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    variant: 'transition-gap',
  },
}

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

export const WaitingReviewGate: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    variant: 'waiting-review',
  },
}

export const RunningGate: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    variant: 'running-gate',
  },
}

export const LongDraftKeepsDockVisible: Story = {
  args: {
    selectedSceneId: 'scene-concourse-delay',
    variant: 'long-draft',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="h-screen min-h-[720px] overflow-hidden">
      <ChapterDraftWorkspaceStory {...args} />
    </ChapterStoryShell>
  ),
}
