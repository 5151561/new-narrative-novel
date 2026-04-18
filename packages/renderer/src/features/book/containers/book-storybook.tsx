import type { ReactElement } from 'react'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type { BookStructureView } from '@/features/workbench/types/workbench-route'

import { BookBottomDock } from '../components/BookBottomDock'
import {
  BookStoryShell,
  buildBookStoryActivity,
  getDefaultBookStorySelectedChapterId,
  useLocalizedBookWorkspace,
  type BookStoryVariant,
} from '../components/book-storybook'
import { BookInspectorPane } from '../components/BookInspectorPane'
import { BookModeRail } from '../components/BookModeRail'
import { BookNavigatorPane } from '../components/BookNavigatorPane'
import { BookStructureStage } from '../components/BookStructureStage'

interface BookStoryParameters {
  bookStory?: {
    search?: string
  }
}

const defaultBookStorySearch = '?scope=book&id=book-storybook&lens=structure&view=sequence&selectedChapterId=chapter-signals-in-rain'

function getBookViewLabel(locale: 'en' | 'zh-CN', view: BookStructureView) {
  if (locale === 'zh-CN') {
    return view === 'sequence' ? '顺序' : view === 'outliner' ? '大纲' : '信号'
  }

  return view === 'sequence' ? 'Sequence' : view === 'outliner' ? 'Outliner' : 'Signals'
}

function applyBookStoryEnvironment(search = defaultBookStorySearch) {
  if (typeof window === 'undefined') {
    return
  }

  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`
  if (window.location.search !== search) {
    window.history.replaceState({}, '', nextUrl)
  }
}

export function getBookStorySearch(options?: {
  variant?: BookStoryVariant
  view?: BookStructureView
  selectedChapterId?: string
}) {
  const variant = options?.variant ?? 'default'
  const view = options?.view ?? 'sequence'
  const selectedChapterId = options?.selectedChapterId ?? getDefaultBookStorySelectedChapterId(variant)

  return `?scope=book&id=book-storybook&lens=structure&view=${view}&selectedChapterId=${selectedChapterId}`
}

function BookStoryTopBar({
  title,
  summary,
  view,
}: {
  title: string
  summary: string
  view: BookStructureView
}) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.narrativeWorkbench}</p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{locale === 'zh-CN' ? '书籍工作台' : 'Book workbench'}</h1>
          <Badge tone="neutral">{dictionary.common.book}</Badge>
          <Badge tone="accent">{getBookViewLabel(locale, view)}</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {title} / {getWorkbenchLensLabel(locale, 'structure')} / {getBookViewLabel(locale, view)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{getWorkbenchLensLabel(locale, 'structure')}</Badge>
        <Badge tone="neutral">{getBookViewLabel(locale, view)}</Badge>
      </div>
      <p className="w-full text-sm leading-6 text-text-muted">{summary}</p>
    </div>
  )
}

export function BookStructureWorkspaceStory({
  variant = 'default',
}: {
  variant?: BookStoryVariant
}) {
  const { locale } = useI18n()
  const { route, patchBookRoute } = useWorkbenchRouteState()
  const workspace = useLocalizedBookWorkspace({
    variant,
    selectedChapterId: route.scope === 'book' ? route.selectedChapterId : undefined,
  })

  if (route.scope !== 'book') {
    return null
  }

  return (
    <WorkbenchShell
      topBar={<BookStoryTopBar title={workspace.title} summary={workspace.summary} view={route.view} />}
      modeRail={
        <BookModeRail
          activeScope="book"
          activeLens="structure"
          onSelectScope={() => undefined}
          onSelectLens={() => undefined}
        />
      }
      navigator={
        <BookNavigatorPane
          chapters={workspace.chapters}
          selectedChapterId={workspace.selectedChapterId}
          onSelectChapter={(chapterId) => patchBookRoute({ selectedChapterId: chapterId })}
          onOpenChapter={() => undefined}
        />
      }
      mainStage={
        <BookStructureStage
          activeView={route.view}
          workspace={workspace}
          availableViews={workspace.viewsMeta?.availableViews}
          onViewChange={(view) => patchBookRoute({ view })}
          onSelectChapter={(chapterId) => patchBookRoute({ selectedChapterId: chapterId })}
          onOpenChapter={() => undefined}
        />
      }
      inspector={<BookInspectorPane bookTitle={workspace.title} inspector={workspace.inspector} />}
      bottomDock={
        <BookBottomDock
          summary={workspace.dockSummary}
          activity={buildBookStoryActivity(locale, workspace, {
            activeView: route.view,
            quiet: variant === 'quiet-book',
          })}
        />
      }
    />
  )
}

export function BookStoryWorkspaceShell({
  frameClassName,
  search,
  children,
}: {
  frameClassName: string
  search?: string
  children: ReactElement
}) {
  applyBookStoryEnvironment(search)

  return <BookStoryShell frameClassName={frameClassName}>{children}</BookStoryShell>
}

export function withBookStoryShell(frameClassName: string) {
  return function BookStoryDecorator(Story: () => ReactElement, context: { parameters: BookStoryParameters }) {
    return (
      <BookStoryWorkspaceShell frameClassName={frameClassName} search={context.parameters.bookStory?.search}>
        <Story />
      </BookStoryWorkspaceShell>
    )
  }
}
