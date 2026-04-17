import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'

import type { ChapterLens, WorkbenchScope } from '@/features/workbench/types/workbench-route'

interface ChapterModeRailProps {
  activeLens: ChapterLens
  onSelectScope: (scope: WorkbenchScope) => void
  onSelectLens: (lens: ChapterLens) => void
}

export function ChapterModeRail({ activeLens, onSelectScope, onSelectLens }: ChapterModeRailProps) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex h-full flex-col gap-2 px-2 py-3">
      <div className="rounded-md border border-line-soft bg-surface-1 p-2">
        <p className="text-center text-[10px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.scope}</p>
        <div className="mt-2 grid gap-2">
          <button
            type="button"
            aria-pressed="false"
            onClick={() => onSelectScope('scene')}
            className="rounded-md border border-transparent px-2 py-2 text-sm text-text-muted hover:border-line-soft hover:bg-surface-2"
          >
            {dictionary.common.scene}
          </button>
          <button
            type="button"
            aria-pressed="true"
            className="rounded-md border border-line-strong bg-surface-1 px-2 py-2 text-sm text-text-main"
          >
            {dictionary.common.chapter}
          </button>
          <button
            type="button"
            aria-pressed="false"
            onClick={() => onSelectScope('asset')}
            className="rounded-md border border-transparent px-2 py-2 text-sm text-text-muted hover:border-line-soft hover:bg-surface-2"
          >
            {dictionary.common.asset}
          </button>
        </div>
      </div>
      {(['structure', 'draft'] as const).map((lens) => (
        <button
          key={lens}
          type="button"
          aria-pressed={activeLens === lens}
          onClick={() => onSelectLens(lens)}
          className={`rounded-md border px-2 py-3 text-left ${
            activeLens === lens
              ? 'border-line-strong bg-surface-1 text-text-main'
              : 'border-transparent text-text-muted hover:border-line-soft hover:bg-surface-1'
          }`}
        >
          <span className="block text-sm font-medium">{getWorkbenchLensLabel(locale, lens)}</span>
        </button>
      ))}
    </div>
  )
}
