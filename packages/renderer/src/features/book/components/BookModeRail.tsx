import { getWorkbenchLensLabel, useI18n } from '@/app/i18n'
import type { BookLens, WorkbenchScope } from '@/features/workbench/types/workbench-route'

interface BookModeRailProps {
  activeScope: WorkbenchScope
  activeLens: BookLens
  onSelectScope: (scope: WorkbenchScope) => void
  onSelectLens: (lens: BookLens) => void
}

function getBookLabel(locale: 'en' | 'zh-CN') {
  return locale === 'zh-CN' ? '书籍' : 'Book'
}

export function BookModeRail({
  activeScope,
  activeLens,
  onSelectScope,
  onSelectLens,
}: BookModeRailProps) {
  const { locale, dictionary } = useI18n()

  return (
    <div className="flex h-full flex-col gap-2 px-2 py-3">
      <div className="rounded-md border border-line-soft bg-surface-1 p-2">
        <p className="text-center text-[10px] uppercase tracking-[0.08em] text-text-soft">{dictionary.app.scope}</p>
        <div className="mt-2 grid gap-2">
          {([
            { scope: 'scene' as const, label: dictionary.common.scene },
            { scope: 'chapter' as const, label: dictionary.common.chapter },
            { scope: 'asset' as const, label: dictionary.common.asset },
            { scope: 'book' as const, label: getBookLabel(locale) },
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
