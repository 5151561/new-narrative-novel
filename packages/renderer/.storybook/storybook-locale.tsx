import type { Decorator } from '@storybook/react'

import { normalizeLocale, resolveAppLocale, writeStoredLocale, type Locale } from '@/app/i18n'

export const STORYBOOK_DEFAULT_LOCALE: Locale = resolveAppLocale()

export function getStorybookLocale(value: unknown, fallback: Locale = resolveAppLocale()): Locale {
  if (typeof value !== 'string') {
    return fallback
  }

  return normalizeLocale(value)
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
