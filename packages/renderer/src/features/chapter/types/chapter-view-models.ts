export type { ChapterStructureView } from '@/features/workbench/types/workbench-route'

import type { ChapterStructureView } from '@/features/workbench/types/workbench-route'

export interface ChapterStructureSceneViewModel {
  id: string
  order: number
  title: string
  summary: string
  purpose: string
  pov: string
  location: string
  conflict: string
  reveal: string
  backlogStatus: string
  backlogStatusLabel: string
  statusLabel: string
  proseStatusLabel: string
  runStatusLabel: string
  unresolvedCount: number
  lastRunLabel: string
}

export interface ChapterBacklogConstraintViewModel {
  id: string
  label: string
  detail: string
}

export interface ChapterBacklogProposalSceneViewModel {
  proposalSceneId: string
  sceneId: string
  order: number
  title: string
  summary: string
  purpose: string
  pov: string
  location: string
  conflict: string
  reveal: string
  backlogStatus: string
  backlogStatusLabel: string
  plannerNotes: string
}

export interface ChapterBacklogProposalViewModel {
  proposalId: string
  chapterId: string
  goalSnapshot: string
  constraintSnapshot: ChapterBacklogConstraintViewModel[]
  scenes: ChapterBacklogProposalSceneViewModel[]
  status: 'draft' | 'accepted'
}

export interface ChapterBacklogPlanningViewModel {
  goal: string
  constraints: ChapterBacklogConstraintViewModel[]
  proposals: ChapterBacklogProposalViewModel[]
  acceptedProposalId?: string
}

export interface ChapterStructureSelectedSceneBrief {
  sceneId: string
  title: string
  summary: string
  unresolvedCount: number
  unresolvedLabel: string
}

export interface ChapterStructureProblemSummaryItem {
  id: string
  label: string
  detail: string
}

export interface ChapterStructureAssemblyHintItem {
  id: string
  label: string
  detail: string
}

export interface ChapterStructureInspectorViewModel {
  selectedSceneBrief: ChapterStructureSelectedSceneBrief | null
  chapterNotes: string[]
  problemsSummary: ChapterStructureProblemSummaryItem[]
  assemblyHints: ChapterStructureAssemblyHintItem[]
}

export interface ChapterStructureViewsMeta {
  availableViews: ChapterStructureView[]
}

export interface ChapterStructureWorkspaceViewModel {
  chapterId: string
  title: string
  summary: string
  sceneCount: number
  unresolvedCount: number
  selectedSceneId: string | null
  planning: ChapterBacklogPlanningViewModel
  scenes: ChapterStructureSceneViewModel[]
  inspector: ChapterStructureInspectorViewModel
  viewsMeta?: ChapterStructureViewsMeta
}
