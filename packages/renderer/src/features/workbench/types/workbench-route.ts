import type { SceneTab } from '@/features/scene/types/scene-view-models'

export type WorkbenchScope = 'scene' | 'chapter'
export type WorkbenchLens = 'structure' | 'orchestrate' | 'draft'
export type SceneRouteModal = 'export'
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly'
export type ChapterLens = 'structure' | 'draft'

export interface SceneRouteState {
  scope: 'scene'
  sceneId: string
  lens: WorkbenchLens
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

export type WorkbenchRouteState = SceneRouteState | ChapterRouteState
