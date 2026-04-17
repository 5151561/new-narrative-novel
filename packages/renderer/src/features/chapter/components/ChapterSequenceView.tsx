import {
  getChapterSequenceOrdinalLabel,
  getChapterUnresolvedCountLabel,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'

import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

interface ChapterSequenceViewProps {
  workspace: ChapterStructureWorkspaceViewModel
  onSelectScene?: (sceneId: string) => void
  onOpenScene?: (sceneId: string, lens: 'orchestrate' | 'draft') => void
}

export function ChapterSequenceView({ workspace, onSelectScene, onOpenScene }: ChapterSequenceViewProps) {
  const { locale, dictionary } = useI18n()

  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {workspace.scenes.map((scene) => {
        const active = scene.id === workspace.selectedSceneId
        const showOpenActions = onOpenScene !== undefined

        return (
          <li key={scene.id}>
            <div
              className={`rounded-md border p-3 transition-colors ${
                active ? 'border-line-strong bg-surface-1' : 'border-line-soft bg-surface-2'
              }`}
            >
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelectScene?.(scene.id)}
                className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                      {getChapterSequenceOrdinalLabel(locale, scene.order)}
                    </span>
                    <span className="mt-1 block text-base text-text-main">{scene.title}</span>
                  </span>
                  <span className="flex shrink-0 flex-wrap justify-end gap-2">
                    <Badge tone={active ? 'accent' : 'neutral'}>{scene.statusLabel}</Badge>
                    <Badge tone={scene.unresolvedCount > 0 ? 'warn' : 'success'}>
                      {getChapterUnresolvedCountLabel(locale, scene.unresolvedCount)}
                    </Badge>
                  </span>
                </span>
                <span className="mt-2 block text-sm leading-6 text-text-muted">{scene.summary}</span>
                <span className="mt-3 grid gap-2 text-sm leading-6 text-text-muted">
                  <span className="block">
                    <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                      {dictionary.app.chapterScaffold.purpose}
                    </span>
                    <span className="block">{scene.purpose}</span>
                  </span>
                  <span className="grid gap-2 sm:grid-cols-2">
                    <span className="block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {dictionary.app.chapterScaffold.pov}
                      </span>
                      <span className="block">{scene.pov}</span>
                    </span>
                    <span className="block">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {dictionary.app.chapterScaffold.location}
                      </span>
                      <span className="block">{scene.location}</span>
                    </span>
                  </span>
                </span>
                <span className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="neutral">{scene.proseStatusLabel}</Badge>
                  <Badge tone="neutral">{scene.lastRunLabel}</Badge>
                </span>
              </button>
              {showOpenActions ? (
                <div className="mt-3 flex flex-wrap justify-end gap-1.5 border-t border-line-soft pt-2">
                  <button
                    type="button"
                    aria-label={`${dictionary.app.chapterScaffold.openInOrchestrate}: ${scene.title}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenScene?.(scene.id, 'orchestrate')
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                  >
                    {dictionary.app.chapterScaffold.openInOrchestrate}
                  </button>
                  <button
                    type="button"
                    aria-label={`${dictionary.app.chapterScaffold.openInDraft}: ${scene.title}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onOpenScene?.(scene.id, 'draft')
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
                  >
                    {dictionary.app.chapterScaffold.openInDraft}
                  </button>
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
