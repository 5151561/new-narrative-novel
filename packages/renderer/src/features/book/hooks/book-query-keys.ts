import type { Locale } from '@/app/i18n'

export const bookQueryKeys = {
  all: ['book'] as const,
  workspace: (bookId: string, locale?: Locale) =>
    locale ? ([...bookQueryKeys.all, 'workspace', bookId, locale] as const) : ([...bookQueryKeys.all, 'workspace', bookId] as const),
}
