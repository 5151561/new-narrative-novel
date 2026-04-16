import { getChapterUnresolvedCountLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import type { ChapterStructureView } from '@/features/workbench/types/workbench-route'

import { ChapterStructureStagePlaceholder } from '../components/ChapterStructureStagePlaceholder'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

interface ChapterStructureWorkspaceProps {
  model: ChapterStructureWorkspaceViewModel
  onViewChange: (view: ChapterStructureView) => void
}

export function ChapterStructureInspectorPlaceholder({ model }: { model: ChapterStructureWorkspaceViewModel }) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={model.inspector.selectedSceneTitle} description={model.chapterId} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.selectedSceneBrief}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">{model.inspector.selectedSceneBrief}</p>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.unresolvedSummary}</p>
            <Badge tone={model.unresolvedCount > 0 ? 'warn' : 'success'}>
              {getChapterUnresolvedCountLabel(locale, model.unresolvedCount)}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-text-muted">{model.inspector.unresolvedSummary}</p>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.chapterNotes}</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-text-muted">
            {model.inspector.chapterNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.problems}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">{model.inspector.problemsSummary}</p>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.assemblyHints}</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-text-muted">
            {model.inspector.assemblyHints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export function ChapterStructureWorkspace({ model, onViewChange }: ChapterStructureWorkspaceProps) {
  const { dictionary } = useI18n()

  return (
    <ChapterStructureStagePlaceholder
      activeView={model.activeView}
      labels={{
        sequence: dictionary.app.sequence,
        outliner: dictionary.app.outliner,
        assembly: dictionary.app.assembly,
      }}
      model={model}
      title={dictionary.app.chapterStructure}
      onViewChange={onViewChange}
    />
  )
}
