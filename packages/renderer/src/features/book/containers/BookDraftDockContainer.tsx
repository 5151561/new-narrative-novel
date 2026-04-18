import { BookDraftBottomDock } from '../components/BookDraftBottomDock'
import { useBookWorkbenchActivity, type BookWorkbenchHandoffEvent } from '../hooks/useBookWorkbenchActivity'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'

interface BookDraftDockContainerProps {
  workspace: BookDraftWorkspaceViewModel
  latestHandoff?: BookWorkbenchHandoffEvent | null
}

export function BookDraftDockContainer({
  workspace,
  latestHandoff = null,
}: BookDraftDockContainerProps) {
  const selectedChapter = workspace.selectedChapter
  const activity = useBookWorkbenchActivity({
    bookId: workspace.bookId,
    activeLens: 'draft',
    activeView: 'sequence',
    latestHandoff,
    selectedChapter: selectedChapter
      ? {
          id: selectedChapter.chapterId,
          title: selectedChapter.title,
          summary: selectedChapter.summary,
        }
      : null,
  })

  return <BookDraftBottomDock summary={workspace.dockSummary} activity={activity} />
}
