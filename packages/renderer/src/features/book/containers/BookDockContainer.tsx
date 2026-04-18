import { BookBottomDock } from '../components/BookBottomDock'
import { useBookWorkbenchActivity, type BookWorkbenchHandoffEvent } from '../hooks/useBookWorkbenchActivity'
import type { BookStructureView } from '@/features/workbench/types/workbench-route'
import type { BookStructureWorkspaceViewModel } from '../types/book-view-models'

interface BookDockContainerProps {
  activeView: BookStructureView
  workspace: BookStructureWorkspaceViewModel
  latestHandoff?: BookWorkbenchHandoffEvent | null
}

export function BookDockContainer({
  activeView,
  workspace,
  latestHandoff = null,
}: BookDockContainerProps) {
  const selectedChapter = workspace.selectedChapter
  const activity = useBookWorkbenchActivity({
    bookId: workspace.bookId,
    activeView,
    latestHandoff,
    selectedChapter: selectedChapter
      ? {
          id: selectedChapter.chapterId,
          title: selectedChapter.title,
          summary: selectedChapter.summary,
        }
      : null,
  })

  return <BookBottomDock summary={workspace.dockSummary} activity={activity} />
}
