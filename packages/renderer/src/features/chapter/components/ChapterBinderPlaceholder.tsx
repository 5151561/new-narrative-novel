import {
  getChapterSceneCountLabel,
  getChapterSceneOrdinalLabel,
  getChapterStructureViewLabel,
  getChapterUnresolvedCountLabel,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

interface ChapterBinderPlaceholderProps {
  title: string
  description: string
  model: ChapterStructureWorkspaceViewModel
  onSelectScene?: (sceneId: string) => void
}

export function ChapterBinderPlaceholder({ title, description, model, onSelectScene }: ChapterBinderPlaceholderProps) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={title} description={description} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        <section className="rounded-md border border-line-strong bg-surface-1 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.currentChapter}</p>
              <h4 className="mt-1 text-base text-text-main">{model.title}</h4>
            </div>
            <Badge tone="accent">{getChapterStructureViewLabel(locale, model.activeView)}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">{getChapterSceneCountLabel(locale, model.sceneCount)}</Badge>
            <Badge tone={model.unresolvedCount > 0 ? 'warn' : 'success'}>
              {getChapterUnresolvedCountLabel(locale, model.unresolvedCount)}
            </Badge>
          </div>
        </section>
        <div className="space-y-2">
          {model.scenes.map((scene, index) => {
            const active = scene.id === model.currentSceneId

            return (
              <button
                key={scene.id}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectScene?.(scene.id)}
                className={`w-full rounded-md border px-3 py-3 text-left ${
                  active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-2/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                      {getChapterSceneOrdinalLabel(locale, index + 1)}
                    </p>
                    <p className="text-sm font-medium text-text-main">{scene.title}</p>
                  </div>
                  <Badge tone={active ? 'accent' : 'neutral'}>{scene.statusLabel}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-text-muted">{scene.summary}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
