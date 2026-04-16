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

export function ChapterOutlinerView({ workspace, onSelectScene }: ChapterOutlinerViewProps) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="overflow-hidden rounded-md border border-line-soft bg-surface-2">
      <ul className="divide-y divide-line-soft">
        {workspace.scenes.map((scene) => {
          const active = scene.id === workspace.selectedSceneId

          return (
            <li key={scene.id}>
              <button
                type="button"
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelectScene?.(scene.id)}
                className={`w-full border-l-2 px-3 py-3 text-left transition-colors focus:outline-none focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent active:bg-surface-1 ${
                  active
                    ? 'border-l-accent bg-surface-1 shadow-ringwarm'
                    : 'border-l-transparent bg-surface-2 hover:bg-surface-1 focus-visible:bg-surface-1'
                }`}
              >
                <span className="grid gap-3 lg:grid-cols-[88px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] 2xl:grid-cols-[88px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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
                  <span className="block min-w-0 2xl:pl-2">
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
            </li>
          )
        })}
      </ul>
    </div>
  )
}
