export type { BookStructureView } from '@/features/workbench/types/workbench-route'

import type { BookStructureView } from '@/features/workbench/types/workbench-route'

export interface BookSceneTraceRollup {
  sceneId: string
  acceptedFactCount: number
  relatedAssetCount: number
  sourceProposalCount: number
  missingLinks: string[]
}

export interface BookStructureChapterViewModel {
  chapterId: string
  order: number
  title: string
  summary: string
  sceneCount: number
  unresolvedCount: number
  draftedSceneCount: number
  missingDraftCount: number
  assembledWordCount: number
  warningsCount: number
  queuedRevisionCount: number
  tracedSceneCount: number
  missingTraceSceneCount: number
  primaryProblemLabel?: string
  primaryAssemblyHintLabel?: string
  coverageStatus: 'ready' | 'attention' | 'missing'
}

export interface BookStructureTotalsViewModel {
  chapterCount: number
  sceneCount: number
  unresolvedCount: number
  draftedSceneCount: number
  missingDraftCount: number
  tracedSceneCount: number
  missingTraceSceneCount: number
  assembledWordCount: number
  warningsCount: number
  queuedRevisionCount: number
}

export interface BookStructureRiskSummaryViewModel {
  chapterId: string
  kind: 'problem' | 'missing_draft' | 'missing_trace'
  label: string
  detail: string
}

export interface BookStructureInspectorViewModel {
  selectedChapter: BookStructureChapterViewModel | null
  overview: BookStructureTotalsViewModel
  riskHighlights: BookStructureRiskSummaryViewModel[]
}

export interface BookStructureDockSummaryViewModel {
  selectedChapter: BookStructureChapterViewModel | null
  unresolvedCount: number
  missingDraftCount: number
  missingTraceSceneCount: number
  warningsCount: number
  problemItems: BookStructureRiskSummaryViewModel[]
}

export interface BookStructureWorkspaceViewModel {
  bookId: string
  title: string
  summary: string
  selectedChapterId: string | null
  chapters: BookStructureChapterViewModel[]
  selectedChapter: BookStructureChapterViewModel | null
  totals: BookStructureTotalsViewModel
  inspector: BookStructureInspectorViewModel
  dockSummary: BookStructureDockSummaryViewModel
  viewsMeta?: {
    availableViews: BookStructureView[]
  }
}
