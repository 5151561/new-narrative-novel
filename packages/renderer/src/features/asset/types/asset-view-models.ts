import type { ChapterLens, SceneLens } from '@/features/workbench/types/workbench-route'
import type { AssetKnowledgeView } from '@/features/workbench/types/workbench-route'

export type { AssetKind } from '@/features/asset/api/asset-records'
import type { AssetKind, AssetMentionBackingKind, AssetMentionBackingRecord } from '@/features/asset/api/asset-records'

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

export interface AssetTraceabilityStatusViewModel {
  state: 'ready' | 'loading' | 'unavailable'
  title: string
  message: string
}

interface AssetMentionViewModelBase {
  id: string
  targetScope: 'scene' | 'chapter'
  targetId: string
  title: string
  relationLabel: string
  excerpt: string
  backing?: AssetMentionBackingRecord
  traceDetail?: AssetMentionTraceDetailViewModel | null
  traceDetailStatus?: AssetTraceabilityStatusViewModel | null
}

export interface AssetMentionTraceDetailViewModel {
  backingKind: AssetMentionBackingKind
  factLabels: string[]
  proposalTitles: string[]
  patchId?: string
  sceneTraceMissing: boolean
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

export interface AssetContextActivationRuleViewModel {
  id: string
  label: string
  summary: string
  reasonKindLabel: string
  visibilityLabel: string
  budgetLabel: string
  targetAgentLabels: string[]
  priorityLabel?: string
  guardrailLabel?: string
}

export interface AssetContextPolicyNoteViewModel {
  id: string
  label: string
  summary: string
}

export interface AssetContextPolicyViewModel {
  hasContextPolicy: boolean
  statusLabel: string
  summary: string
  defaultVisibilityLabel: string
  defaultBudgetLabel: string
  activationRules: AssetContextActivationRuleViewModel[]
  exclusions: AssetContextPolicyNoteViewModel[]
  warnings: string[]
}

export interface AssetContextPolicySummaryViewModel {
  hasContextPolicy: boolean
  statusLabel: string
  defaultVisibilityLabel: string
  defaultBudgetLabel: string
  activationRuleCount: number
  warningCount: number
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
  canonBackedMentionCount?: number
  draftContextMentionCount?: number
  unlinkedMentionCount?: number
  traceabilityStatus?: AssetTraceabilityStatusViewModel | null
  contextPolicy: AssetContextPolicySummaryViewModel
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
  mentionsWithoutCanonBackingCount?: number
  mentionsWithMissingSceneTraceCount?: number
  relationsWithoutNarrativeBackingCount?: number
  traceabilityStatus?: AssetTraceabilityStatusViewModel | null
  contextPolicy: AssetContextPolicySummaryViewModel
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
  contextPolicy: AssetContextPolicyViewModel
  inspector: AssetInspectorViewModel
  dockSummary: AssetDockSummaryViewModel
  dockActivity: AssetDockActivityItem[]
}
