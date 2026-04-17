import type { Meta, StoryObj } from '@storybook/react'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
import { Badge } from '@/components/ui/Badge'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'

import { ChapterDraftBinderPane } from '../components/ChapterDraftBinderPane'
import { ChapterDraftBottomDock } from '../components/ChapterDraftBottomDock'
import { ChapterDraftInspectorPane } from '../components/ChapterDraftInspectorPane'
import { ChapterDraftReader } from '../components/ChapterDraftReader'
import { ChapterModeRail } from '../components/ChapterModeRail'
import {
  buildChapterDraftStoryActivity,
  useLocalizedChapterDraftWorkspace,
  type ChapterDraftStoryVariant,
} from '../components/chapter-storybook'
import type { ChapterDraftWorkspaceViewModel } from '../types/chapter-draft-view-models'

function LanguageToggle() {
  const { locale, setLocale, dictionary } = useI18n()

  return (
    <div className="flex items-center gap-1 rounded-md border border-line-soft bg-surface-2 p-1">
      <span className="px-2 text-[11px] uppercase tracking-[0.05em] text-text-soft">{dictionary.common.language}</span>
      {(['en', 'zh-CN'] as const).map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={locale === value}
          onClick={() => setLocale(value)}
          className={`rounded-md px-2 py-1 text-xs font-medium ${
            locale === value ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
          }`}
        >
          {value === 'zh-CN' ? '中文' : 'EN'}
        </button>
      ))}
    </div>
  )
}

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
            <LanguageToggle />
            <Badge tone="neutral">{locale === 'zh-CN' ? `已起草 ${workspace.draftedSceneCount}` : `Drafted ${workspace.draftedSceneCount}`}</Badge>
            <Badge tone={workspace.missingDraftCount > 0 ? 'warn' : 'success'}>
              {locale === 'zh-CN' ? `缺稿 ${workspace.missingDraftCount}` : `Missing ${workspace.missingDraftCount}`}
            </Badge>
            <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${workspace.assembledWordCount} 词` : `${workspace.assembledWordCount} words`}</Badge>
          </div>
        </div>
      }
      modeRail={<ChapterModeRail activeLens="draft" onSwitchScope={() => undefined} onSelectLens={() => undefined} />}
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
    <AppProviders>
      <ChapterDraftWorkspaceStory {...args} />
    </AppProviders>
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
