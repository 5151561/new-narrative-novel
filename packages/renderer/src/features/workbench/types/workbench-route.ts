import type { SceneTab } from '@/features/scene/types/scene-view-models'

export type SceneLens = 'structure' | 'orchestrate' | 'draft'
export type ChapterLens = 'structure' | 'draft'
export type AssetLens = 'knowledge'
export type BookLens = 'structure' | 'draft'
export type WorkbenchLens = SceneLens | ChapterLens | AssetLens | BookLens
export type WorkbenchScope = 'scene' | 'chapter' | 'asset' | 'book'
export type SceneRouteModal = 'export'
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly'
export type AssetKnowledgeView = 'profile' | 'mentions' | 'relations' | 'context'
export type BookStructureView = 'sequence' | 'outliner' | 'signals'
export type BookDraftView = 'read' | 'compare' | 'export' | 'branch' | 'review'
export type BookBranchBaseline = 'current' | 'checkpoint'
export type BookReviewFilter =
  | 'all'
  | 'blockers'
  | 'trace-gaps'
  | 'missing-drafts'
  | 'compare-deltas'
  | 'export-readiness'
  | 'branch-readiness'
  | 'scene-proposals'
export type BookReviewStatusFilter = 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'

export interface SceneRouteState {
  scope: 'scene'
  sceneId: string
  lens: SceneLens
  tab: SceneTab
  beatId?: string
  proposalId?: string
  modal?: SceneRouteModal
}

export interface ChapterRouteState {
  scope: 'chapter'
  chapterId: string
  lens: ChapterLens
  view: ChapterStructureView
  sceneId?: string
}

export interface AssetRouteState {
  scope: 'asset'
  assetId: string
  lens: AssetLens
  view: AssetKnowledgeView
}

export interface BookRouteState {
  scope: 'book'
  bookId: string
  lens: BookLens
  view: BookStructureView
  draftView?: BookDraftView
  branchId?: string
  branchBaseline?: BookBranchBaseline
  checkpointId?: string
  exportProfileId?: string
  reviewFilter?: BookReviewFilter
  reviewStatusFilter?: BookReviewStatusFilter
  reviewIssueId?: string
  selectedChapterId?: string
}

export type WorkbenchRouteState = SceneRouteState | ChapterRouteState | AssetRouteState | BookRouteState
