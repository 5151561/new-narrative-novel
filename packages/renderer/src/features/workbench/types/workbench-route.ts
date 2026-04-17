import type { SceneTab } from '@/features/scene/types/scene-view-models'

export type SceneLens = 'structure' | 'orchestrate' | 'draft'
export type ChapterLens = 'structure' | 'draft'
export type AssetLens = 'knowledge'
export type WorkbenchLens = SceneLens | ChapterLens | AssetLens
export type WorkbenchScope = 'scene' | 'chapter' | 'asset'
export type SceneRouteModal = 'export'
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly'
export type AssetKnowledgeView = 'profile' | 'mentions' | 'relations'

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

export type WorkbenchRouteState = SceneRouteState | ChapterRouteState | AssetRouteState
