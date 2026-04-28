import type { Locale } from '@/app/i18n'
import type { ChapterStructureView } from '@/features/chapter/types/chapter-view-models'
import type { RunMode, RunRecord } from '@/features/run/api/run-records'

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

export type ChapterSceneBacklogStatus = 'planned' | 'running' | 'needs_review' | 'drafted' | 'revised'

export interface ChapterBacklogConstraintRecord {
  id: string
  label: ChapterLocalizedText
  detail: ChapterLocalizedText
}

export interface ChapterBacklogProposalSceneRecord {
  proposalSceneId: string
  sceneId: string
  order: number
  title: ChapterLocalizedText
  summary: ChapterLocalizedText
  purpose: ChapterLocalizedText
  pov: ChapterLocalizedText
  location: ChapterLocalizedText
  conflict: ChapterLocalizedText
  reveal: ChapterLocalizedText
  backlogStatus: ChapterSceneBacklogStatus
  plannerNotes: ChapterLocalizedText
}

export interface ChapterBacklogProposalRecord {
  proposalId: string
  chapterId: string
  goalSnapshot: ChapterLocalizedText
  constraintSnapshot: ChapterBacklogConstraintRecord[]
  scenes: ChapterBacklogProposalSceneRecord[]
  status: 'draft' | 'accepted'
}

export interface ChapterBacklogPlanningRecord {
  goal: ChapterLocalizedText
  constraints: ChapterBacklogConstraintRecord[]
  proposals: ChapterBacklogProposalRecord[]
  acceptedProposalId?: string
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
  backlogStatus: ChapterSceneBacklogStatus
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
  planning: ChapterBacklogPlanningRecord
  scenes: ChapterStructureSceneRecord[]
  inspector: ChapterStructureInspectorRecord
  viewsMeta?: {
    availableViews: ChapterStructureView[]
  }
}

export interface StartNextChapterSceneRunInput {
  chapterId: string
  locale: Locale
  mode?: RunMode
  note?: string
}

export interface ChapterRunNextSceneRecord {
  chapterId: string
  sceneId: string
  order: number
  title: ChapterLocalizedText
  backlogStatus: ChapterSceneBacklogStatus
}

export interface StartNextChapterSceneRunRecord {
  chapter: ChapterStructureWorkspaceRecord
  run: RunRecord
  selectedScene: ChapterRunNextSceneRecord
}

export function readLocalizedChapterText(value: ChapterLocalizedText, locale: Locale): string {
  return value[locale]
}
