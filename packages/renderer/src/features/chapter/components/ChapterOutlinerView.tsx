import {
  getChapterBeatLineLabel,
  getChapterUnresolvedCountLabel,
  useI18n,
} from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'

import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'

interface ChapterOutlinerViewProps {
  workspace: ChapterStructureWorkspaceViewModel
  onSelectScene?: (sceneId: string) => void
  onOpenScene?: (sceneId: string, lens: 'orchestrate' | 'draft') => void
}

interface OutlinerFieldProps {
  label: string
  value: string
}

function OutlinerField({ label, value }: OutlinerFieldProps) {
  return (
    <span className="block min-w-0">
      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">{label}</span>
      <span className="mt-1 block break-words text-sm leading-5 text-text-muted">{value}</span>
    </span>
  )
}

export function ChapterOutlinerView({ workspace, onSelectScene, onOpenScene }: ChapterOutlinerViewProps) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="overflow-hidden rounded-md border border-line-soft bg-surface-2">
      <ul className="divide-y divide-line-soft">
        {workspace.scenes.map((scene) => {
          const active = scene.id === workspace.selectedSceneId
          const showOpenActions = onOpenScene !== undefined

          return (
            <li key={scene.id}>
              <div
                className={`border-l-2 px-3 py-3 transition-colors ${
                  active
                    ? 'border-l-accent bg-surface-1 shadow-ringwarm'
                    : 'border-l-transparent bg-surface-2 hover:bg-surface-1'
                }`}
              >
                <button
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => onSelectScene?.(scene.id)}
                  className="w-full rounded-md text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <span className="grid gap-3 lg:grid-cols-[88px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {getChapterBeatLineLabel(locale, scene.order)}
                      </span>
                      <span className="mt-1 block break-words text-sm font-medium text-text-main">{scene.title}</span>
                    </span>
                    <OutlinerField label={dictionary.app.chapterScaffold.purpose} value={scene.purpose} />
                    <OutlinerField label={dictionary.app.chapterScaffold.pov} value={scene.pov} />
                    <OutlinerField label={dictionary.app.chapterScaffold.location} value={scene.location} />
                    <OutlinerField label={dictionary.app.chapterScaffold.conflict} value={scene.conflict} />
                    <OutlinerField label={dictionary.app.chapterScaffold.reveal} value={scene.reveal} />
                    <span className="block min-w-0">
                      <span className="block text-[11px] uppercase tracking-[0.08em] text-text-soft">
                        {dictionary.app.chapterScaffold.statusSnapshot}
                      </span>
                      <span className="mt-1 flex flex-wrap gap-2">
                        <Badge tone={active ? 'accent' : 'neutral'}>{scene.statusLabel}</Badge>
                        <Badge tone="neutral">{scene.proseStatusLabel}</Badge>
                        <Badge tone="neutral">{scene.runStatusLabel}</Badge>
                        <Badge tone={scene.unresolvedCount > 0 ? 'warn' : 'success'}>
                          {getChapterUnresolvedCountLabel(locale, scene.unresolvedCount)}
                        </Badge>
                        <Badge tone="neutral">{scene.lastRunLabel}</Badge>
                      </span>
                    </span>
                  </span>
                </button>
                {showOpenActions ? (
                  <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                    <button
                      type="button"
                      aria-label={`${dictionary.app.chapterScaffold.openInOrchestrate}: ${scene.title}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        onOpenScene?.(scene.id, 'orchestrate')
                      }}
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
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
                      className="rounded-md px-2 py-1 text-[11px] font-medium text-text-muted hover:bg-surface-1 hover:text-text-main"
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
    </div>
  )
}
