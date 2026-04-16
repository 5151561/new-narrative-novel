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
}

export function ChapterSequenceView({ workspace, onSelectScene }: ChapterSequenceViewProps) {
  const { locale, dictionary } = useI18n()

  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {workspace.scenes.map((scene) => {
        const active = scene.id === workspace.selectedSceneId

        return (
          <li key={scene.id}>
            <button
              type="button"
              aria-current={active ? 'true' : undefined}
              onClick={() => onSelectScene?.(scene.id)}
              className={`w-full rounded-md border p-3 text-left transition-colors ${
                active ? 'border-line-strong bg-surface-1' : 'border-line-soft bg-surface-2'
              }`}
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
          </li>
        )
      })}
    </ul>
  )
}
