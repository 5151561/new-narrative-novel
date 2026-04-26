import { getLocaleName, useI18n } from '@/app/i18n'

export function LocaleToggle() {
  const { locale, setLocale, dictionary } = useI18n()
  const nextLocale = locale === 'en' ? 'zh-CN' : 'en'
  const nextLocaleName = getLocaleName(locale, nextLocale)

  return (
    <button
      type="button"
      aria-label={`${dictionary.common.language}: ${nextLocaleName}`}
      onClick={() => setLocale(nextLocale)}
      className="rounded-md border border-line-soft bg-surface-2 px-3 py-1.5 text-xs font-medium text-text-main transition-colors hover:bg-surface-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {nextLocaleName}
    </button>
  )
}
