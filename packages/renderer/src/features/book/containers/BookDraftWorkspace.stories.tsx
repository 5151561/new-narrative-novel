import type { Meta, StoryObj } from '@storybook/react'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'

import { BookDraftBinderPane } from '../components/BookDraftBinderPane'
import { BookDraftBottomDock } from '../components/BookDraftBottomDock'
import { BookDraftInspectorPane } from '../components/BookDraftInspectorPane'
import { BookDraftReader } from '../components/BookDraftReader'
import { BookModeRail } from '../components/BookModeRail'
import {
  BookStoryShell,
  type BookStoryVariant,
} from '../components/book-storybook'
import { buildBookDraftStoryActivity, useLocalizedBookDraftWorkspace } from '../components/book-draft-storybook'

interface BookDraftWorkspaceStoryProps {
  variant?: BookStoryVariant
  selectedChapterId?: string
}

function WorkspacePreview({ variant = 'default', selectedChapterId }: BookDraftWorkspaceStoryProps) {
  const { locale } = useI18n()
  const workspace = useLocalizedBookDraftWorkspace({ variant, selectedChapterId })
  const activity = buildBookDraftStoryActivity(locale, workspace, { quiet: variant === 'quiet-book' })

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
      mainStage={<BookDraftReader workspace={workspace} onSelectChapter={() => undefined} onOpenChapter={() => undefined} />}
      inspector={<BookDraftInspectorPane bookTitle={workspace.title} inspector={workspace.inspector} />}
      bottomDock={<BookDraftBottomDock summary={workspace.dockSummary} activity={activity} />}
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
  },
} satisfies Meta<typeof WorkspacePreview>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SelectedSecondChapter: Story = {
  args: {
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const MissingDrafts: Story = {
  args: {
    variant: 'default',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const WarningsHeavy: Story = {
  args: {
    variant: 'signals-heavy',
    selectedChapterId: 'chapter-open-water-signals',
  },
}

export const QuietBookDraft: Story = {
  args: {
    variant: 'quiet-book',
    selectedChapterId: 'chapter-open-water-signals',
  },
}
