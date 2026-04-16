import {
  getChapterBeatLineLabel,
  getChapterSequenceOrdinalLabel,
  getChapterUnresolvedCountLabel,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'
import type { ChapterStructureView } from '@/features/workbench/types/workbench-route'

interface ChapterStructureStagePlaceholderProps {
  activeView: ChapterStructureView
  labels: Record<ChapterStructureView, string>
  model: ChapterStructureWorkspaceViewModel
  title: string
  onViewChange: (view: ChapterStructureView) => void
}

export function ChapterStructureStagePlaceholder({
  activeView,
  labels,
  model,
  title,
  onViewChange,
}: ChapterStructureStagePlaceholderProps) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={title}
        description={model.title}
        actions={
          <div className="flex flex-wrap gap-2">
            {(Object.keys(labels) as ChapterStructureView[]).map((view) => (
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
                {labels[view]}
              </button>
            ))}
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {activeView === 'sequence' ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {model.scenes.map((scene) => (
              <section
                key={scene.id}
                className={`rounded-md border p-3 ${
                  scene.id === model.currentSceneId ? 'border-line-strong bg-surface-1' : 'border-line-soft bg-surface-2'
                }`}
              >
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                  {getChapterSequenceOrdinalLabel(locale, scene.order)}
                </p>
                <h4 className="mt-1 text-base text-text-main">{scene.title}</h4>
                <p className="mt-2 text-sm leading-6 text-text-muted">{scene.summary}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="neutral">{scene.statusLabel}</Badge>
                  <Badge tone={scene.unresolvedCount > 0 ? 'warn' : 'success'}>
                    {getChapterUnresolvedCountLabel(locale, scene.unresolvedCount)}
                  </Badge>
                </div>
              </section>
            ))}
          </div>
        ) : null}
        {activeView === 'outliner' ? (
          <div className="space-y-3">
            {model.scenes.map((scene) => (
              <section
                key={scene.id}
                className={`rounded-md border p-3 ${
                  scene.id === model.currentSceneId ? 'border-line-strong bg-surface-1' : 'border-line-soft bg-surface-2'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                      {getChapterBeatLineLabel(locale, scene.order)}
                    </p>
                    <h4 className="mt-1 text-base text-text-main">{scene.title}</h4>
                  </div>
                  <Badge tone="neutral">{scene.statusLabel}</Badge>
                </div>
                <dl className="mt-2 grid gap-2 text-sm leading-6 text-text-muted md:grid-cols-2">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.purpose}</dt>
                    <dd>{scene.purpose}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.pov}</dt>
                    <dd>{scene.pov}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.location}</dt>
                    <dd>{scene.location}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.reveal}</dt>
                    <dd>{scene.reveal}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.conflict}</dt>
                    <dd>{scene.conflict}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="neutral">{scene.proseStatusLabel}</Badge>
                  <Badge tone="neutral">{scene.runStatusLabel}</Badge>
                  <Badge tone={scene.unresolvedCount > 0 ? 'warn' : 'success'}>
                    {getChapterUnresolvedCountLabel(locale, scene.unresolvedCount)}
                  </Badge>
                </div>
              </section>
            ))}
          </div>
        ) : null}
        {activeView === 'assembly' ? (
          <div className="space-y-4">
            <section className="rounded-md border border-line-soft bg-surface-2 p-4">
              <h4 className="text-base text-text-main">{dictionary.app.chapterScaffold.assemblyLanes}</h4>
              <p className="mt-2 text-sm leading-6 text-text-muted">{dictionary.app.chapterScaffold.assemblyDescription}</p>
            </section>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <section className="rounded-md border border-line-soft bg-surface-2 p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.incoming}</p>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {model.scenes.slice(0, Math.max(model.scenes.findIndex((scene) => scene.id === model.currentSceneId), 1)).map((scene) => (
                    <li key={scene.id} className="rounded-md border border-line-soft bg-surface-1 px-3 py-2">
                      {scene.title}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-md border border-line-soft bg-surface-2 p-3">
                <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.currentAssembly}</p>
                <ul className="mt-3 space-y-2 text-sm text-text-muted">
                  {model.scenes
                    .slice(Math.max(model.scenes.findIndex((scene) => scene.id === model.currentSceneId), 0))
                    .map((scene) => (
                    <li key={scene.id} className="rounded-md border border-line-soft bg-surface-1 px-3 py-2">
                      {scene.title}
                    </li>
                    ))}
                </ul>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
