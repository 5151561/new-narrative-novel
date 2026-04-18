import type { Locale } from '@/app/i18n'

export const bookQueryKeys = {
  all: ['book'] as const,
  workspace: (bookId: string, locale?: Locale) =>
    locale ? ([...bookQueryKeys.all, 'workspace', bookId, locale] as const) : ([...bookQueryKeys.all, 'workspace', bookId] as const),
  checkpoints: (bookId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.all, 'checkpoints', bookId, locale] as const)
      : ([...bookQueryKeys.all, 'checkpoints', bookId] as const),
  checkpoint: (bookId: string, checkpointId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.all, 'checkpoint', bookId, checkpointId, locale] as const)
      : ([...bookQueryKeys.all, 'checkpoint', bookId, checkpointId] as const),
  exportProfiles: (bookId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.all, 'exportProfiles', bookId, locale] as const)
      : ([...bookQueryKeys.all, 'exportProfiles', bookId] as const),
  exportProfile: (bookId: string, exportProfileId: string, locale?: Locale) =>
    locale
      ? ([...bookQueryKeys.all, 'exportProfile', bookId, exportProfileId, locale] as const)
      : ([...bookQueryKeys.all, 'exportProfile', bookId, exportProfileId] as const),
}
