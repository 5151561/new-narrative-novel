import type { Locale } from '@/app/i18n'

export const chapterQueryKeys = {
  all: ['chapter'] as const,
  workspace: (chapterId: string, locale?: Locale) =>
    locale ? ([...chapterQueryKeys.all, 'workspace', chapterId, locale] as const) : ([...chapterQueryKeys.all, 'workspace', chapterId] as const),
}
