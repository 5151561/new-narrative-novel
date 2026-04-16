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
  statusLabel: string
  proseStatusLabel: string
  runStatusLabel: string
  unresolvedCount: number
  lastRunLabel: string
}

export interface ChapterStructureInspectorData {
  chapterNotes: string[]
  problemsSummary: string
  assemblyHints: string[]
}

export interface ChapterStructureWorkspaceData {
  chapterId: string
  title: string
  summary: string
  sceneCount: number
  unresolvedCount: number
  scenes: ChapterStructureSceneViewModel[]
  inspector: ChapterStructureInspectorData
}

export interface ChapterStructureInspectorViewModel extends ChapterStructureInspectorData {
  selectedSceneTitle: string
  selectedSceneBrief: string
  unresolvedSummary: string
}

export interface ChapterStructureWorkspaceViewModel extends ChapterStructureWorkspaceData {
  activeView: ChapterStructureView
  currentSceneId: string
  inspector: ChapterStructureInspectorViewModel
}
