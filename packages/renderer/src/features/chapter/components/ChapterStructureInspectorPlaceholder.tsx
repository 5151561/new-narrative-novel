import { getChapterUnresolvedCountLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'

import type { ChapterStructureInspectorViewModel } from '../types/chapter-view-models'

interface ChapterStructureInspectorPlaceholderProps {
  chapterId: string
  unresolvedCount: number
  inspector: ChapterStructureInspectorViewModel
}

export function ChapterStructureInspectorPlaceholder({
  chapterId,
  unresolvedCount,
  inspector,
}: ChapterStructureInspectorPlaceholderProps) {
  const { locale, dictionary } = useI18n()
  const selectedSceneBrief = inspector.selectedSceneBrief

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={selectedSceneBrief?.title ?? dictionary.app.chapterWorkbench} description={chapterId} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.selectedSceneBrief}</p>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {selectedSceneBrief?.summary ?? dictionary.app.chapterNavigatorDescription}
          </p>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.unresolvedSummary}</p>
            <Badge tone={unresolvedCount > 0 ? 'warn' : 'success'}>{getChapterUnresolvedCountLabel(locale, unresolvedCount)}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            {selectedSceneBrief ? `${selectedSceneBrief.title} · ${selectedSceneBrief.unresolvedLabel}` : dictionary.common.loading}
          </p>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.chapterNotes}</p>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-text-muted">
            {inspector.chapterNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.problems}</p>
          <ul className="mt-2 space-y-3 text-sm leading-6 text-text-muted">
            {inspector.problemsSummary.map((problem) => (
              <li key={problem.id}>
                <p className="font-medium text-text-main">{problem.label}</p>
                <p className="mt-1">{problem.detail}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-md border border-line-soft bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.assemblyHints}</p>
          <ul className="mt-2 space-y-3 text-sm leading-6 text-text-muted">
            {inspector.assemblyHints.map((hint) => (
              <li key={hint.id}>
                <p className="font-medium text-text-main">{hint.label}</p>
                <p className="mt-1">{hint.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
