import type { Locale } from '@/app/i18n'
import type { ChapterStructureView } from '@/features/chapter/types/chapter-view-models'

export interface ChapterLocalizedText {
  en: string
  'zh-CN': string
}

export interface ChapterStructureProblemSummaryRecord {
  id: string
  label: ChapterLocalizedText
  detail: ChapterLocalizedText
}

export interface ChapterStructureAssemblyHintRecord {
  id: string
  label: ChapterLocalizedText
  detail: ChapterLocalizedText
}

export interface ChapterStructureSceneRecord {
  id: string
  order: number
  title: ChapterLocalizedText
  summary: ChapterLocalizedText
  purpose: ChapterLocalizedText
  pov: ChapterLocalizedText
  location: ChapterLocalizedText
  conflict: ChapterLocalizedText
  reveal: ChapterLocalizedText
  statusLabel: ChapterLocalizedText
  proseStatusLabel: ChapterLocalizedText
  runStatusLabel: ChapterLocalizedText
  unresolvedCount: number
  lastRunLabel: ChapterLocalizedText
}

export interface ChapterStructureInspectorRecord {
  chapterNotes: ChapterLocalizedText[]
  problemsSummary: ChapterStructureProblemSummaryRecord[]
  assemblyHints: ChapterStructureAssemblyHintRecord[]
}

export interface ChapterStructureWorkspaceRecord {
  chapterId: string
  title: ChapterLocalizedText
  summary: ChapterLocalizedText
  scenes: ChapterStructureSceneRecord[]
  inspector: ChapterStructureInspectorRecord
  viewsMeta?: {
    availableViews: ChapterStructureView[]
  }
}

export function readLocalizedChapterText(value: ChapterLocalizedText, locale: Locale): string {
  return value[locale]
}
