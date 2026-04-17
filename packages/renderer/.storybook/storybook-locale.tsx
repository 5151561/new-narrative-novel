import type { Decorator } from '@storybook/react'

import { readStoredLocale, writeStoredLocale, type Locale } from '@/app/i18n'

export const STORYBOOK_DEFAULT_LOCALE: Locale = readStoredLocale() ?? 'zh-CN'

export function getStorybookLocale(value: unknown): Locale {
  if (typeof value !== 'string') {
    return 'en'
  }

  return value.toLowerCase().startsWith('zh') ? 'zh-CN' : value === 'en' ? 'en' : 'en'
}

export function applyStorybookLocale(value: unknown): Locale {
  const locale = getStorybookLocale(value)

  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }

  writeStoredLocale(locale)
  return locale
}

export const withStorybookLocale: Decorator = (Story, context) => {
  const locale = applyStorybookLocale(context.globals.locale)

  return (
    <div key={locale}>
      <Story />
    </div>
  )
}
