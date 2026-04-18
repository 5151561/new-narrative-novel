import type { Meta, StoryObj } from '@storybook/react'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'

import { BookDraftBinderPane } from '../components/BookDraftBinderPane'
import { BookDraftInspectorPane } from '../components/BookDraftInspectorPane'
import { BookDraftBottomDock } from '../components/BookDraftBottomDock'
import { BookDraftStage } from '../components/BookDraftStage'
import { BookModeRail } from '../components/BookModeRail'
import {
  BookStoryShell,
  type BookStoryVariant,
} from '../components/book-storybook'
import { buildBookDraftCompareStoryData, buildBookDraftStoryActivity, useLocalizedBookDraftWorkspace } from '../components/book-draft-storybook'

interface BookDraftWorkspaceStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
  checkpointId?: string
  draftView?: 'read' | 'compare'
}

function WorkspacePreview({
  variant = 'default',
  selectedChapterId,
  checkpointId,
  draftView = 'read',
}: BookDraftWorkspaceStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const compareData = buildBookDraftCompareStoryData(locale, { variant, selectedChapterId, checkpointId })
  const activity = buildBookDraftStoryActivity(locale, workspace, {
    quiet: variant === 'quiet-book' && draftView === 'read',
    draftView,
    checkpointTitle: compareData.selectedCheckpoint.title,
  })

  return (
    <WorkbenchShell
      topBar={
        <div className="flex h-full flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
              {locale === 'zh-CN' ? '叙事工作台' : 'Narrative workbench'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg leading-tight text-text-main">{locale === 'zh-CN' ? '书籍手稿' : 'Book manuscript'}</h1>
              <Badge tone="neutral">{locale === 'zh-CN' ? '书籍' : 'Book'}</Badge>
              <Badge tone="accent">{getWorkbenchLensLabel(locale, 'draft')}</Badge>
            </div>
            <p className="text-sm text-text-muted">
              {workspace.title} / {getWorkbenchLensLabel(locale, 'draft')} / {workspace.selectedChapter?.title}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{locale === 'zh-CN' ? `合计 ${workspace.assembledWordCount} 词` : `${workspace.assembledWordCount} words`}</Badge>
            <Badge tone={workspace.missingDraftChapterCount > 0 ? 'warn' : 'success'}>
              {locale === 'zh-CN' ? `缺稿 ${workspace.missingDraftChapterCount}` : `Missing ${workspace.missingDraftChapterCount}`}
            </Badge>
          </div>
        </div>
      }
      modeRail={<BookModeRail activeScope="book" activeLens="draft" onSelectScope={() => undefined} onSelectLens={() => undefined} />}
      navigator={<BookDraftBinderPane workspace={workspace} onSelectChapter={() => undefined} onOpenChapter={() => undefined} />}
      mainStage={
        <BookDraftStage
          draftView={draftView}
          workspace={workspace}
          compare={compareData.compare}
          checkpoints={compareData.checkpoints}
          selectedCheckpointId={compareData.selectedCheckpoint.checkpointId}
          onSelectDraftView={() => undefined}
          onSelectChapter={() => undefined}
          onOpenChapter={() => undefined}
          onSelectCheckpoint={() => undefined}
        />
      }
      inspector={
        <BookDraftInspectorPane
          bookTitle={workspace.title}
          inspector={workspace.inspector}
          activeDraftView={draftView}
          compare={draftView === 'compare' ? compareData.compare : null}
          checkpointMeta={draftView === 'compare' ? compareData.selectedCheckpoint : null}
        />
      }
      bottomDock={
        <BookDraftBottomDock
          summary={workspace.dockSummary}
          activity={activity}
          activeDraftView={draftView}
          compareProblems={draftView === 'compare' ? compareData.compareProblems : null}
        />
      }
    />
  )
}

const meta = {
  title: 'Mockups/Book/BookDraftWorkspace',
  component: WorkspacePreview,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <BookStoryShell frameClassName="min-h-[780px]">
      <WorkspacePreview {...args} />
    </BookStoryShell>
  ),
  args: {
    variant: 'default',
    draftView: 'read',
  },
} satisfies Meta<typeof WorkspacePreview>

export default meta

type Story = StoryObj<typeof meta>

export const ReadDefault: Story = {}

export const CompareDefault: Story = {
  args: {
    draftView: 'compare',
  },
}

export const CompareSelectedSecondChapter: Story = {
  args: {
    draftView: 'compare',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareMissingDrafts: Story = {
  args: {
    draftView: 'compare',
    variant: 'default',
    selectedChapterId: 'chapter-signals-in-rain',
  },
}

export const CompareTraceRegression: Story = {
  args: {
    draftView: 'compare',
    variant: 'missing-trace-attention',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const CompareQuietCheckpoint: Story = {
  args: {
    draftView: 'compare',
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBookDraft: Story = {
  args: {
    draftView: 'read',
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
