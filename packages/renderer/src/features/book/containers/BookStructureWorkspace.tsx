import { useCallback, useEffect } from 'react'

import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type { BookStructureView } from '@/features/workbench/types/workbench-route'

import { getLocaleName, getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { BookInspectorPane } from '../components/BookInspectorPane'
import { BookModeRail } from '../components/BookModeRail'
import { BookNavigatorPane } from '../components/BookNavigatorPane'
import { BookStructureStage } from '../components/BookStructureStage'
import { BookDockContainer } from './BookDockContainer'
import { useBookStructureWorkspaceQuery } from '../hooks/useBookStructureWorkspaceQuery'
import { rememberBookWorkbenchHandoff } from '../hooks/useBookWorkbenchActivity'

const defaultBookViews: BookStructureView[] = ['sequence', 'outliner', 'signals']
let rememberedBookHandoffSequence = 0

function getBookViewLabel(locale: 'en' | 'zh-CN', view: BookStructureView) {
  if (locale === 'zh-CN') {
    return view === 'sequence' ? '顺序' : view === 'outliner' ? '大纲' : '信号'
  }

  return view === 'sequence' ? 'Sequence' : view === 'outliner' ? 'Outliner' : 'Signals'
}

function getEffectiveBookView(activeView: BookStructureView, availableViews: BookStructureView[]) {
  if (availableViews.includes(activeView)) {
    return activeView
  }

  return availableViews[0] ?? defaultBookViews[0]
}

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
          {getLocaleName(locale, value)}
        </button>
      ))}
    </div>
  )
}

function BookPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

function BookTopBar({
  title,
  summary,
  view,
}: {
  title?: string
  summary?: string
  view: BookStructureView
}) {
  const { locale } = useI18n()

  return (
    <div className="flex h-full flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
          {locale === 'zh-CN' ? '叙事工作台' : 'Narrative workbench'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg leading-tight text-text-main">{locale === 'zh-CN' ? '书籍工作台' : 'Book workbench'}</h1>
          <Badge tone="neutral">{locale === 'zh-CN' ? '书籍' : 'Book'}</Badge>
          <Badge tone="accent">{getBookViewLabel(locale, view)}</Badge>
        </div>
        <p className="text-sm text-text-muted">
          {title ?? (locale === 'zh-CN' ? '书籍' : 'Book')} / {getWorkbenchLensLabel(locale, 'structure')} / {getBookViewLabel(locale, view)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <LanguageToggle />
        <Badge tone="neutral">{getWorkbenchLensLabel(locale, 'structure')}</Badge>
        <Badge tone="neutral">{getBookViewLabel(locale, view)}</Badge>
      </div>
      {summary ? <p className="w-full text-sm leading-6 text-text-muted">{summary}</p> : null}
    </div>
  )
}

export function BookStructureWorkspace() {
  const { route, replaceRoute, patchBookRoute } = useWorkbenchRouteState()
  const { locale } = useI18n()

  if (route.scope !== 'book') {
    return null
  }

  const { workspace, isLoading, error } = useBookStructureWorkspaceQuery({
    bookId: route.bookId,
    selectedChapterId: route.selectedChapterId ?? null,
  })
  const availableViews = workspace?.viewsMeta?.availableViews ?? defaultBookViews
  const effectiveView = getEffectiveBookView(route.view, availableViews)

  useEffect(() => {
    if (error || isLoading || workspace === undefined || workspace === null) {
      return
    }

    if (route.view !== effectiveView) {
      patchBookRoute({ view: effectiveView }, { replace: true })
    }

    if (route.selectedChapterId !== workspace.selectedChapterId) {
      patchBookRoute({ selectedChapterId: workspace.selectedChapterId ?? undefined }, { replace: true })
    }
  }, [effectiveView, error, isLoading, patchBookRoute, route.selectedChapterId, route.view, workspace])

  const openChapterFromBook = useCallback(
    (chapterId: string, lens: 'structure' | 'draft') => {
      const chapterTitle =
        workspace?.chapters.find((chapter) => chapter.chapterId === chapterId)?.title ?? chapterId

      rememberBookWorkbenchHandoff({
        id: `handoff-${route.bookId}-${chapterId}-${lens}-${rememberedBookHandoffSequence++}`,
        bookId: route.bookId,
        chapterTitle,
        lens,
      })

      if (lens === 'structure') {
        replaceRoute({
          scope: 'chapter',
          chapterId,
          lens: 'structure',
          view: 'sequence',
          sceneId: undefined,
        })
        return
      }

      replaceRoute({
        scope: 'chapter',
        chapterId,
        lens: 'draft',
        sceneId: undefined,
      })
    },
    [replaceRoute, route.bookId, workspace],
  )

  const onSelectChapter = useCallback(
    (chapterId: string) => {
      if (route.selectedChapterId === chapterId) {
        return
      }

      patchBookRoute({ selectedChapterId: chapterId })
    },
    [patchBookRoute, route.selectedChapterId],
  )

  const modeRail = (
    <BookModeRail
      activeScope="book"
      activeLens="structure"
      onSelectScope={(scope) => {
        if (scope === 'book') {
          return
        }

        if (scope === 'chapter') {
          const chapterId = workspace?.selectedChapterId ?? route.selectedChapterId
          if (chapterId) {
            openChapterFromBook(chapterId, 'structure')
          }
          return
        }

        replaceRoute({ scope })
      }}
      onSelectLens={(lens) => {
        if (lens !== route.lens) {
          patchBookRoute({ lens })
        }
      }}
    />
  )

  if (error) {
    return (
      <WorkbenchShell
        topBar={<BookTopBar view={route.view} />}
        modeRail={modeRail}
        navigator={<BookPaneState title={locale === 'zh-CN' ? '书籍不可用' : 'Book unavailable'} message={error.message} />}
        mainStage={<BookPaneState title={locale === 'zh-CN' ? '书籍不可用' : 'Book unavailable'} message={error.message} />}
        inspector={<BookPaneState title={locale === 'zh-CN' ? '检查器不可用' : 'Inspector unavailable'} message={error.message} />}
        bottomDock={<BookPaneState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={error.message} />}
      />
    )
  }

  if (isLoading || workspace === undefined) {
    const message =
      locale === 'zh-CN'
        ? '正在准备书籍结构、章节汇总和底部信号面板。'
        : 'Preparing the book structure workspace, chapter rollups, and supporting dock signals.'

    return (
      <WorkbenchShell
        topBar={<BookTopBar view={route.view} title={workspace?.title} summary={workspace?.summary} />}
        modeRail={modeRail}
        navigator={<BookPaneState title={locale === 'zh-CN' ? '加载中' : 'Loading'} message={message} />}
        mainStage={<BookPaneState title={locale === 'zh-CN' ? '加载中' : 'Loading'} message={message} />}
        inspector={<BookPaneState title={locale === 'zh-CN' ? '加载中' : 'Loading'} message={message} />}
        bottomDock={<BookPaneState title={locale === 'zh-CN' ? '加载中' : 'Loading'} message={message} />}
      />
    )
  }

  if (workspace === null) {
    const message = locale === 'zh-CN' ? `未找到书籍 ${route.bookId}。` : `Book ${route.bookId} could not be found.`

    return (
      <WorkbenchShell
        topBar={<BookTopBar view={route.view} />}
        modeRail={modeRail}
        navigator={<BookPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        mainStage={<BookPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        inspector={<BookPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
        bottomDock={<BookPaneState title={locale === 'zh-CN' ? '书籍不存在' : 'Book not found'} message={message} />}
      />
    )
  }

  return (
    <WorkbenchShell
      topBar={<BookTopBar title={workspace.title} summary={workspace.summary} view={effectiveView} />}
      modeRail={modeRail}
      navigator={
        <BookNavigatorPane
          chapters={workspace.chapters}
          selectedChapterId={workspace.selectedChapterId}
          onSelectChapter={onSelectChapter}
          onOpenChapter={openChapterFromBook}
        />
      }
      mainStage={
        <BookStructureStage
          activeView={effectiveView}
          workspace={workspace}
          availableViews={availableViews}
          onViewChange={(view) => patchBookRoute({ view })}
          onSelectChapter={onSelectChapter}
          onOpenChapter={openChapterFromBook}
        />
      }
      inspector={<BookInspectorPane bookTitle={workspace.title} inspector={workspace.inspector} />}
      bottomDock={<BookDockContainer activeView={effectiveView} workspace={workspace} />}
    />
  )
}
