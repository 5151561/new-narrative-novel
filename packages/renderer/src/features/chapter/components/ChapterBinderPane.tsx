import {
  getChapterSceneCountLabel,
  getChapterSceneOrdinalLabel,
  getChapterStructureViewLabel,
  getChapterUnresolvedCountLabel,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { PaneHeader } from '@/components/ui/PaneHeader'
import type { ChapterStructureView, ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

interface ChapterBinderPaneProps {
  title: string
  description: string
  workspace: ChapterStructureWorkspaceViewModel
  activeView: ChapterStructureView
  onSelectScene?: (sceneId: string) => void
}

export function ChapterBinderPane({
  title,
  description,
  workspace,
  activeView,
  onSelectScene,
}: ChapterBinderPaneProps) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader title={title} description={description} />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-3">
        <section className="rounded-md border border-line-strong bg-surface-1 p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.chapterScaffold.currentChapter}</p>
              <h4 className="mt-1 text-base text-text-main">{workspace.title}</h4>
            </div>
            <Badge tone="accent">{getChapterStructureViewLabel(locale, activeView)}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="neutral">{getChapterSceneCountLabel(locale, workspace.sceneCount)}</Badge>
            <Badge tone={workspace.unresolvedCount > 0 ? 'warn' : 'success'}>
              {getChapterUnresolvedCountLabel(locale, workspace.unresolvedCount)}
            </Badge>
          </div>
        </section>
        <ul className="space-y-2">
          {workspace.scenes.map((scene) => {
            const active = scene.id === workspace.selectedSceneId

            return (
              <li key={scene.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectScene?.(scene.id)}
                  className={`w-full rounded-md border px-3 py-3 text-left transition-colors ${
                    active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-2/80'
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {getChapterSceneOrdinalLabel(locale, scene.order)}
                      </span>
                      <span className="block text-sm font-medium text-text-main">{scene.title}</span>
                    </span>
                    <span className="flex shrink-0 flex-wrap justify-end gap-2">
                      <Badge tone={active ? 'accent' : 'neutral'}>{scene.statusLabel}</Badge>
                      <Badge tone={scene.unresolvedCount > 0 ? 'warn' : 'success'}>
                        {getChapterUnresolvedCountLabel(locale, scene.unresolvedCount)}
                      </Badge>
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-text-muted">{scene.summary}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
