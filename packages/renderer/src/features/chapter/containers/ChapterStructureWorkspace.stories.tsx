import type { Meta, StoryObj } from '@storybook/react'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { LocaleToggle } from '@/features/workbench/components/LocaleToggle'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useI18n } from '@/app/i18n'

import { ChapterBinderPane } from '../components/ChapterBinderPane'
import { ChapterModeRail } from '../components/ChapterModeRail'
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
