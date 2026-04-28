import { useCallback, useEffect } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { WorkbenchShell } from '@/features/workbench/components/WorkbenchShell'
import { WorkbenchStatusTopBar } from '@/features/workbench/components/WorkbenchStatusTopBar'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import type { BookStructureView } from '@/features/workbench/types/workbench-route'

import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import { BookInspectorPane } from '../components/BookInspectorPane'
import { BookModeRail } from '../components/BookModeRail'
import { BookNavigatorPane } from '../components/BookNavigatorPane'
import { BookStructureStage } from '../components/BookStructureStage'
import { BookDockContainer } from './BookDockContainer'
import { useBookStructureWorkspaceQuery } from '../hooks/useBookStructureWorkspaceQuery'
import { rememberBookWorkbenchHandoff } from '../hooks/useBookWorkbenchActivity'

const defaultBookViews: BookStructureView[] = ['sequence', 'outliner', 'signals']
let rememberedBookHandoffSequence = 0

function getEffectiveBookView(activeView: BookStructureView, availableViews: BookStructureView[]) {
  if (availableViews.includes(activeView)) {
    return activeView
  }

  return availableViews[0] ?? defaultBookViews[0]
}

function BookPaneState({ title, message }: { title: string; message: string }) {
  return (
    <div className="p-4">
      <EmptyState title={title} message={message} />
    </div>
  )
}

function getBookViewLabel(locale: 'en' | 'zh-CN', view: BookStructureView) {
  if (locale === 'zh-CN') {
    return view === 'sequence' ? '顺序' : view === 'outliner' ? '大纲' : '信号'
  }

  return view === 'sequence' ? 'Sequence' : view === 'outliner' ? 'Outliner' : 'Signals'
}

function BookTopBar({ view }: { view: BookStructureView }) {
  const { locale } = useI18n()

  return (
    <WorkbenchStatusTopBar
      title={locale === 'zh-CN' ? '书籍工作台' : 'Book workbench'}
      subtitle={`${locale === 'zh-CN' ? '书籍' : 'Book'} / ${getWorkbenchLensLabel(locale, 'structure')} / ${getBookViewLabel(locale, view)}`}
    />
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
        topBar={<BookTopBar view={route.view} />}
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
      topBar={<BookTopBar view={effectiveView} />}
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
