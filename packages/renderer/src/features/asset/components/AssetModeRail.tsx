import { getAssetLensLabel, useI18n } from '@/app/i18n'
import type { AssetLens, WorkbenchScope } from '@/features/workbench/types/workbench-route'

interface AssetModeRailProps {
  activeScope: WorkbenchScope
  activeLens: AssetLens
  onSelectScope: (scope: WorkbenchScope) => void
  onSelectLens: (lens: AssetLens) => void
}

export function AssetModeRail({
  activeScope,
  activeLens,
  onSelectScope,
  onSelectLens,
}: AssetModeRailProps) {
  const { dictionary, locale } = useI18n()

  return (
    <div className="flex h-full flex-col gap-2 px-2 py-3">
      <div className="rounded-md border border-line-soft bg-surface-1 p-2">
        <p className="text-center text-[10px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.scope}</p>
        <div className="mt-2 grid gap-2">
          {([
            { scope: 'scene' as const, label: dictionary.common.scene },
            { scope: 'chapter' as const, label: dictionary.common.chapter },
            { scope: 'asset' as const, label: dictionary.common.asset },
            { scope: 'book' as const, label: dictionary.common.book },
          ]).map((item) => (
            <button
              key={item.scope}
              type="button"
              aria-pressed={activeScope === item.scope}
              onClick={() => onSelectScope(item.scope)}
              className={`rounded-md border px-2 py-2 text-sm ${
                activeScope === item.scope
                  ? 'border-line-strong bg-surface-1 text-text-main'
                  : 'border-transparent text-text-muted hover:border-line-soft hover:bg-surface-2'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-pressed={activeLens === 'knowledge'}
        onClick={() => onSelectLens('knowledge')}
        title={dictionary.app.modeRailDetails.knowledge}
        className={`rounded-md border px-2 py-3 text-left ${
          activeLens === 'knowledge'
            ? 'border-line-strong bg-surface-1 text-text-main'
            : 'border-transparent text-text-muted hover:border-line-soft hover:bg-surface-1'
        }`}
      >
        <span className="block text-sm font-medium">{getAssetLensLabel(locale, 'knowledge')}</span>
      </button>
    </div>
  )
}
