import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'
import type { BookStructureView } from '@/features/workbench/types/workbench-route'

import type { BookStructureWorkspaceViewModel } from '../types/book-view-models'
import { BookOutlinerView } from './BookOutlinerView'
import { BookSequenceView } from './BookSequenceView'
import { BookSignalsView } from './BookSignalsView'

const defaultAvailableViews: BookStructureView[] = ['sequence', 'outliner', 'signals']

interface BookStructureStageProps {
  activeView: BookStructureView
  workspace: BookStructureWorkspaceViewModel
  onViewChange: (view: BookStructureView) => void
  onSelectChapter?: (chapterId: string) => void
  onOpenChapter?: (chapterId: string, lens: 'structure' | 'draft') => void
  availableViews?: BookStructureView[]
}

function getViewLabel(locale: 'en' | 'zh-CN', view: BookStructureView) {
  if (locale === 'zh-CN') {
    return view === 'sequence' ? '顺序' : view === 'outliner' ? '大纲' : '信号'
  }

  return view === 'sequence' ? 'Sequence' : view === 'outliner' ? 'Outliner' : 'Signals'
}

export function BookStructureStage({
  activeView,
  workspace,
  onViewChange,
  onSelectChapter,
  onOpenChapter,
  availableViews = defaultAvailableViews,
}: BookStructureStageProps) {
  const { locale } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '书籍结构' : 'Book structure'}
        actions={
          <div className="flex flex-wrap gap-2">
            {availableViews.map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={activeView === view}
                onClick={() => onViewChange(view)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  activeView === view
                    ? 'border-line-strong bg-surface-1 text-text-main'
                    : 'border-line-soft bg-surface-2 text-text-muted'
                }`}
              >
                {getViewLabel(locale, view)}
              </button>
            ))}
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {activeView === 'sequence' ? (
          <BookSequenceView
            chapters={workspace.chapters}
            selectedChapterId={workspace.selectedChapterId}
            onSelectChapter={onSelectChapter}
            onOpenChapter={onOpenChapter}
          />
        ) : null}
        {activeView === 'outliner' ? (
          <BookOutlinerView
            chapters={workspace.chapters}
            selectedChapterId={workspace.selectedChapterId}
            onSelectChapter={onSelectChapter}
            onOpenChapter={onOpenChapter}
          />
        ) : null}
        {activeView === 'signals' ? (
          <BookSignalsView
            chapters={workspace.chapters}
            selectedChapterId={workspace.selectedChapterId}
            onSelectChapter={onSelectChapter}
            onOpenChapter={onOpenChapter}
          />
        ) : null}
      </div>
    </div>
  )
}
