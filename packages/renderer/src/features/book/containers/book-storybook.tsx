import type { ReactElement } from 'react'

import { useI18n } from '@/app/i18n'
import { LocaleToggle } from '@/features/workbench/components/LocaleToggle'
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

function BookStoryTopBar() {
  return (
    <div className="flex h-full flex-wrap items-center justify-end gap-2">
      <LocaleToggle />
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
      topBar={<BookStoryTopBar />}
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
