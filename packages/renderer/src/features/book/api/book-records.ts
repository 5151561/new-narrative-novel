import type { Locale } from '@/app/i18n'
import type { BookStructureView } from '@/features/workbench/types/workbench-route'

export interface BookLocalizedText {
  en: string
  'zh-CN': string
}

export interface BookStructureRecord {
  bookId: string
  title: BookLocalizedText
  summary: BookLocalizedText
  chapterIds: string[]
  viewsMeta?: {
    availableViews: BookStructureView[]
  }
}

export function readLocalizedBookText(value: BookLocalizedText, locale: Locale): string {
  return value[locale]
}
