import { PaneHeader } from '@/components/ui/PaneHeader'
import type { ChapterStructureView, ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'
import { ChapterAssemblyView } from './ChapterAssemblyView'
import { ChapterOutlinerView } from './ChapterOutlinerView'
import { ChapterSequenceView } from './ChapterSequenceView'

const defaultAvailableViews: ChapterStructureView[] = ['sequence', 'outliner', 'assembly']

function getEffectiveChapterView(
  activeView: ChapterStructureView,
  availableViews: ChapterStructureView[],
): ChapterStructureView {
  if (availableViews.includes(activeView)) {
    return activeView
  }

  return availableViews[0] ?? defaultAvailableViews[0]
}

interface ChapterStructureStagePlaceholderProps {
  activeView: ChapterStructureView
  labels: Record<ChapterStructureView, string>
  workspace: ChapterStructureWorkspaceViewModel
  title: string
  onViewChange: (view: ChapterStructureView) => void
  onSelectScene?: (sceneId: string) => void
  availableViews?: ChapterStructureView[]
}

export function ChapterStructureStagePlaceholder({
  activeView,
  labels,
  workspace,
  title,
  onViewChange,
  onSelectScene,
  availableViews = defaultAvailableViews,
}: ChapterStructureStagePlaceholderProps) {
  const effectiveView = getEffectiveChapterView(activeView, availableViews)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={title}
        description={workspace.title}
        actions={
          <div className="flex flex-wrap gap-2">
            {availableViews.map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={effectiveView === view}
                onClick={() => onViewChange(view)}
                className={`rounded-md border px-3 py-2 text-sm ${
                  effectiveView === view
                    ? 'border-line-strong bg-surface-1 text-text-main'
                    : 'border-line-soft bg-surface-2 text-text-muted'
                }`}
              >
                {labels[view]}
              </button>
            ))}
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {effectiveView === 'sequence' ? (
          <ChapterSequenceView workspace={workspace} onSelectScene={onSelectScene} />
        ) : null}
        {effectiveView === 'outliner' ? (
          <ChapterOutlinerView workspace={workspace} onSelectScene={onSelectScene} />
        ) : null}
        {effectiveView === 'assembly' ? (
          <ChapterAssemblyView workspace={workspace} onSelectScene={onSelectScene} />
        ) : null}
      </div>
    </div>
  )
}
