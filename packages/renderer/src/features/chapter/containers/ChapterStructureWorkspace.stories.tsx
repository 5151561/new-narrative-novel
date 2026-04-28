import type { Meta, StoryObj } from '@storybook/react'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LocaleToggle } from '@/features/workbench/components/LocaleToggle'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useI18n } from '@/app/i18n'

import { ChapterBinderPane } from '../components/ChapterBinderPane'
import { ChapterModeRail } from '../components/ChapterModeRail'
import { ChapterRunOrchestrationPanel } from '../components/ChapterRunOrchestrationPanel'
import { ChapterStructureInspectorPane } from '../components/ChapterStructureInspectorPane'
import { ChapterStructureStage } from '../components/ChapterStructureStage'
import {
  ChapterStoryShell,
  buildChapterBottomDockProblems,
  buildChapterStructureStoryActivity,
} from '../components/chapter-storybook'
import {
  buildChapterBacklogAcceptedStoryWorkspace,
  buildChapterStoryWorkspace,
} from '../components/chapter-story-fixture'
import { ChapterBottomDock } from '../components/ChapterBottomDock'

type WorkspaceState = 'proposal' | 'accepted' | 'empty' | 'loading' | 'error'

interface ChapterStructureWorkspaceStoryProps {
  selectedSceneId: string
  state: WorkspaceState
  hideInspector?: boolean
  hideDock?: boolean
}

function resolveChapterRunGate(
  scenes: Array<{
    id: string
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
        sceneId: scene.id,
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

function buildWorkspace(selectedSceneId: string, state: WorkspaceState) {
  if (state === 'accepted') {
    return buildChapterBacklogAcceptedStoryWorkspace(selectedSceneId)
  }

  const workspace = buildChapterStoryWorkspace(selectedSceneId)
  if (state === 'empty') {
    return {
      ...workspace,
      planning: {
        ...workspace.planning,
        proposals: [],
        acceptedProposalId: undefined,
      },
    }
  }

  return workspace
}

function WorkspacePreview({ selectedSceneId, state, hideInspector = false, hideDock = false }: ChapterStructureWorkspaceStoryProps) {
  const { locale, dictionary } = useI18n()

  if (state === 'error') {
    return (
      <WorkbenchShell
        topBar={<div className="flex h-full items-center justify-end"><LocaleToggle /></div>}
        modeRail={<ChapterModeRail activeLens="structure" onSelectScope={() => undefined} onSelectLens={() => undefined} />}
        navigator={<EmptyState title="Chapter unavailable" message="Backlog workspace failed to load." />}
        mainStage={<EmptyState title="Chapter unavailable" message="Backlog workspace failed to load." />}
        inspector={<EmptyState title="Inspector unavailable" message="Backlog workspace failed to load." />}
        bottomDock={<EmptyState title="Bottom dock unavailable" message="Backlog workspace failed to load." />}
      />
    )
  }

  const workspace = buildWorkspace(selectedSceneId, state)
  const activity = buildChapterStructureStoryActivity(locale, workspace, {
    activeView: 'backlog',
  })
  const { nextScene, blockingScenes } = resolveChapterRunGate(workspace.scenes)

  return (
    <WorkbenchShell
      topBar={
        <div className="flex h-full flex-wrap items-center justify-end gap-2">
          <LocaleToggle />
          <Badge tone="neutral">{workspace.planning.proposals.length}</Badge>
          <Badge tone="neutral">{workspace.planning.acceptedProposalId ?? (locale === 'zh-CN' ? '未接受' : 'Not accepted')}</Badge>
        </div>
      }
      modeRail={<ChapterModeRail activeLens="structure" onSelectScope={() => undefined} onSelectLens={() => undefined} />}
      navigator={
        <ChapterBinderPane
          title={dictionary.app.chapters}
          description={dictionary.app.chapterNavigatorDescription}
          workspace={workspace}
          activeView="backlog"
          onSelectScene={() => undefined}
          onOpenScene={() => undefined}
        />
      }
      mainStage={
        state === 'loading' ? (
          <EmptyState title={dictionary.common.loading} message={locale === 'zh-CN' ? '正在准备 backlog 工作区。' : 'Preparing the backlog workspace.'} />
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <ChapterRunOrchestrationPanel
              title={locale === 'zh-CN' ? '章节编排' : 'Chapter orchestration'}
              description={
                locale === 'zh-CN'
                  ? '按 accepted backlog 顺序推进下一场，并在 review 处停下。'
                  : 'Advance the next accepted backlog scene in order and stop at review.'
              }
              nextScene={nextScene ? {
                sceneId: nextScene.id,
                title: nextScene.title,
                order: nextScene.order,
                summary: nextScene.summary,
                backlogStatusLabel: nextScene.backlogStatusLabel,
                runStatusLabel: nextScene.runStatusLabel,
              } : undefined}
              waitingReviewScenes={blockingScenes}
              draftedSceneCount={workspace.scenes.filter((scene) => scene.backlogStatus === 'drafted' || scene.backlogStatus === 'revised').length}
              missingDraftCount={workspace.scenes.length - workspace.scenes.filter((scene) => scene.backlogStatus === 'drafted' || scene.backlogStatus === 'revised').length}
            />
            <ChapterStructureStage
              activeView="backlog"
              labels={{
                backlog: dictionary.app.backlog,
                sequence: dictionary.app.sequence,
                outliner: dictionary.app.outliner,
                assembly: dictionary.app.assembly,
              }}
              availableViews={workspace.viewsMeta?.availableViews}
              workspace={workspace}
              title={dictionary.app.chapterStructure}
              onViewChange={() => undefined}
              onSelectScene={() => undefined}
              savingPlanning={state === 'loading'}
              generatingProposal={state === 'loading'}
            />
          </div>
        )
      }
      inspector={
        hideInspector ? (
          <EmptyState title={locale === 'zh-CN' ? '检查器已隐藏' : 'Inspector hidden'} message="" />
        ) : (
          <ChapterStructureInspectorPane
            chapterTitle={workspace.title}
            chapterSummary={workspace.summary}
            unresolvedCount={workspace.unresolvedCount}
            inspector={workspace.inspector}
            planning={workspace.planning}
            selectedSceneBacklogStatusLabel={workspace.scenes.find((scene) => scene.id === workspace.selectedSceneId)?.backlogStatusLabel}
          />
        )
      }
      bottomDock={
        hideDock ? (
          <EmptyState title={locale === 'zh-CN' ? '底部面板已隐藏' : 'Bottom dock hidden'} message="" />
        ) : (
          <ChapterBottomDock problems={buildChapterBottomDockProblems(workspace)} activity={activity} />
        )
      }
    />
  )
}

const meta = {
  title: 'Mockups/Chapter/ChapterStructureWorkspace',
  component: WorkspacePreview,
  parameters: {
    layout: 'fullscreen',
  },
  render: (args) => (
    <ChapterStoryShell frameClassName="min-h-[720px]">
      <WorkspacePreview {...args} />
    </ChapterStoryShell>
  ),
  args: {
    selectedSceneId: 'scene-concourse-delay',
    state: 'proposal',
    hideInspector: false,
    hideDock: false,
  },
} satisfies Meta<typeof WorkspacePreview>

export default meta

type Story = StoryObj<typeof meta>

export const BacklogProposal: Story = {}

export const AcceptedPlan: Story = {
  args: {
    state: 'accepted',
  },
}

export const EmptyProposal: Story = {
  args: {
    state: 'empty',
  },
}

export const LoadingWorkspace: Story = {
  args: {
    state: 'loading',
  },
}

export const ErrorWorkspace: Story = {
  args: {
    state: 'error',
  },
}

export const InspectorHidden: Story = {
  args: {
    hideInspector: true,
  },
}

export const DockHidden: Story = {
  args: {
    hideDock: true,
  },
}
