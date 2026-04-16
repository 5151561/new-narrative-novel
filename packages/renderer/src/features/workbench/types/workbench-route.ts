import type { SceneTab } from '@/features/scene/types/scene-view-models'

export type WorkbenchScope = 'scene' | 'chapter'
export type WorkbenchLens = 'structure' | 'orchestrate' | 'draft'
export type SceneRouteModal = 'export'
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly'

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
  lens: 'structure'
  view: ChapterStructureView
  sceneId?: string
}

export type WorkbenchRouteState = SceneRouteState | ChapterRouteState
