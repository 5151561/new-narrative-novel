import type { ChapterStructureView } from '@/features/workbench/types/workbench-route'

export interface ChapterScenePlaceholderViewModel {
  id: string
  title: string
  statusLabel: string
  summary: string
  unresolvedCount: number
}

export interface ChapterInspectorPlaceholderViewModel {
  selectedSceneTitle: string
  selectedSceneBrief: string
  unresolvedSummary: string
  chapterNotes: string[]
}

export interface ChapterStructureWorkspaceViewModel {
  chapterId: string
  title: string
  sceneCount: number
  unresolvedCount: number
  activeView: ChapterStructureView
  currentSceneId: string
  scenes: ChapterScenePlaceholderViewModel[]
  inspector: ChapterInspectorPlaceholderViewModel
}
