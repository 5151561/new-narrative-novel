import type { BookDraftView } from '@/features/workbench/types/workbench-route'

import { useI18n } from '@/app/i18n'

import { BookDraftBottomDock } from '../components/BookDraftBottomDock'
import { useBookWorkbenchActivity, type BookWorkbenchHandoffEvent } from '../hooks/useBookWorkbenchActivity'
import { buildBookDraftCompareProblems } from '../lib/book-draft-compare-presentation'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'

interface BookDraftDockContainerProps {
  workspace: BookDraftWorkspaceViewModel
  activeDraftView: BookDraftView
  compare?: BookManuscriptCompareWorkspaceViewModel | null
  latestHandoff?: BookWorkbenchHandoffEvent | null
}

export function BookDraftDockContainer({
  workspace,
  activeDraftView,
  compare = null,
  latestHandoff = null,
}: BookDraftDockContainerProps) {
  const { locale } = useI18n()
  const selectedChapter = workspace.selectedChapter
  const activity = useBookWorkbenchActivity({
    bookId: workspace.bookId,
    activeLens: 'draft',
    activeView: 'sequence',
    activeDraftView,
    selectedCheckpoint:
      activeDraftView === 'compare' && compare
        ? {
            id: compare.checkpoint.checkpointId,
            title: compare.checkpoint.title,
            summary: compare.checkpoint.summary,
          }
        : null,
    latestHandoff,
    selectedChapter: selectedChapter
      ? {
          id: selectedChapter.chapterId,
          title: selectedChapter.title,
          summary: selectedChapter.summary,
        }
      : null,
  })

  return (
    <BookDraftBottomDock
      summary={workspace.dockSummary}
      activity={activity}
      activeDraftView={activeDraftView}
      compareProblems={buildBookDraftCompareProblems(compare, locale)}
    />
  )
}
