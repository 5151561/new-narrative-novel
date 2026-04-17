import type { ChapterLens, SceneLens } from '@/features/workbench/types/workbench-route'
import type { AssetKnowledgeView } from '@/features/workbench/types/workbench-route'

export type { AssetKind } from '@/features/asset/api/asset-records'
import type { AssetKind, AssetMentionBackingRecord } from '@/features/asset/api/asset-records'

export interface AssetNavigatorItemViewModel {
  id: string
  kind: AssetKind
  title: string
  summary: string
  mentionCount: number
  relationCount: number
  hasWarnings: boolean
  isOrphan: boolean
}

export interface AssetProfileFactViewModel {
  id: string
  label: string
  value: string
}

export interface AssetProfileSectionViewModel {
  id: string
  title: string
  facts: AssetProfileFactViewModel[]
}

export interface AssetProfileViewModel {
  sections: AssetProfileSectionViewModel[]
}

interface AssetMentionViewModelBase {
  id: string
  targetScope: 'scene' | 'chapter'
  targetId: string
  title: string
  relationLabel: string
  excerpt: string
  backing?: AssetMentionBackingRecord
}

export interface AssetSceneMentionViewModel extends AssetMentionViewModelBase {
  targetScope: 'scene'
  chapterId?: string
  sceneId: string
  recommendedLens?: Extract<SceneLens, 'draft' | 'orchestrate'>
  handoffActions: Extract<AssetMentionHandoffActionViewModel, { targetScope: 'scene' }>[]
}

export interface AssetChapterMentionViewModel extends AssetMentionViewModelBase {
  targetScope: 'chapter'
  chapterId: string
  sceneId?: undefined
  recommendedLens?: Extract<ChapterLens, 'structure' | 'draft'>
  handoffActions: Extract<AssetMentionHandoffActionViewModel, { targetScope: 'chapter' }>[]
}

export type AssetMentionViewModel = AssetSceneMentionViewModel | AssetChapterMentionViewModel

export type AssetMentionHandoffActionViewModel =
  | {
      id: string
      targetScope: 'scene'
      targetId: string
      lens: Extract<SceneLens, 'draft' | 'orchestrate'>
      label: string
      recommended: boolean
    }
  | {
      id: string
      targetScope: 'chapter'
      targetId: string
      lens: Extract<ChapterLens, 'structure' | 'draft'>
      label: string
      recommended: boolean
    }

export interface AssetRelationViewModel {
  id: string
  targetAssetId: string
  targetTitle: string
  targetKind: AssetKind
  relationLabel: string
  summary: string
}

export interface AssetInspectorViewModel {
  kindLabel: string
  summary: string
  mentionCount: number
  relationCount: number
  warnings: string[]
  notes: string[]
  isOrphan: boolean
  missingFields: string[]
}

export interface AssetDockSummaryItem {
  id: string
  label: string
  detail: string
}

export interface AssetDockSummaryViewModel {
  problemItems: AssetDockSummaryItem[]
  warningCount: number
  missingFieldCount: number
  relationCount: number
  mentionCount: number
  isOrphan: boolean
}

export interface AssetDockActivityItem {
  id: string
  kind: 'lens' | 'view' | 'asset'
  title: string
  detail: string
  tone: 'accent' | 'neutral'
}

export interface AssetKnowledgeWorkspaceViewModel {
  assetId: string
  kind: AssetKind
  title: string
  summary: string
  navigator: {
    characters: AssetNavigatorItemViewModel[]
    locations: AssetNavigatorItemViewModel[]
    rules: AssetNavigatorItemViewModel[]
  }
  viewsMeta: {
    availableViews: AssetKnowledgeView[]
  }
  profile: AssetProfileViewModel
  mentions: AssetMentionViewModel[]
  relations: AssetRelationViewModel[]
  inspector: AssetInspectorViewModel
  dockSummary: AssetDockSummaryViewModel
  dockActivity: AssetDockActivityItem[]
}
