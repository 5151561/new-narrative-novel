import type { Meta, StoryObj } from '@storybook/react'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'

import { ChapterDraftBinderPane } from '../components/ChapterDraftBinderPane'
import { ChapterDraftBottomDock } from '../components/ChapterDraftBottomDock'
import { ChapterDraftInspectorPane } from '../components/ChapterDraftInspectorPane'
import { ChapterDraftReader } from '../components/ChapterDraftReader'
import { ChapterModeRail } from '../components/ChapterModeRail'
import {
  ChapterStoryShell,
  buildChapterDraftStoryActivity,
  useLocalizedChapterDraftWorkspace,
  type ChapterDraftStoryVariant,
} from '../components/chapter-storybook'
import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

function WorkspacePreview({ workspace }: { workspace: ChapterDraftWorkspaceViewModel }) {
  const { locale, dictionary } = useI18n()
  const activity = buildChapterDraftStoryActivity(locale, workspace)

  return (
    <WorkbenchShell
      topBar={
        <div className="flex h-full flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg leading-tight text-text-main">{dictionary.app.chapterWorkbench}</h1>
              <Badge tone="neutral">{dictionary.common.chapter}</Badge>
              <Badge tone="accent">{dictionary.app.chapterDraft}</Badge>
            </div>
            <p className="text-sm text-text-muted">
              {workspace.title} / {getWorkbenchLensLabel(locale, 'draft')} / {workspace.selectedScene?.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{locale === 'zh-CN' ? `已起草 ${workspace.draftedSceneCount}` : `Drafted ${workspace.draftedSceneCount}`}</Badge>
            <Badge tone={workspace.missingDraftCount > 0 ? 'warn' : 'success'}>
              {locale === 'zh-CN' ? `缺稿 ${workspace.missingDraftCount}` : `Missing ${workspace.missingDraftCount}`}
            </Badge>
            <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${workspace.assembledWordCount} 词` : `${workspace.assembledWordCount} words`}</Badge>
          </div>
        </div>
      }
      modeRail={<ChapterModeRail activeLens="draft" onSelectScope={() => undefined} onSelectLens={() => undefined} />}
      navigator={<ChapterDraftBinderPane workspace={workspace} onSelectScene={() => undefined} onOpenScene={() => undefined} />}
      mainStage={<ChapterDraftReader workspace={workspace} onSelectScene={() => undefined} onOpenScene={() => undefined} />}
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
