import type { Locale } from '@/app/i18n'
import type {
  AssetKnowledgeView,
  ChapterLens,
  SceneLens,
} from '@/features/workbench/types/workbench-route'

export type AssetKind = 'character' | 'location' | 'rule'
export type AssetContextVisibilityRecord =
  | 'public'
  | 'character-known'
  | 'private'
  | 'spoiler'
  | 'editor-only'
export type AssetContextBudgetRecord =
  | 'summary-only'
  | 'selected-facts'
  | 'mentions-excerpts'
  | 'full-profile'
export type AssetContextTargetAgentRecord =
  | 'scene-manager'
  | 'character-agent'
  | 'continuity-reviewer'
  | 'prose-agent'
export type AssetContextActivationReasonKindRecord =
  | 'explicit-link'
  | 'scene-cast'
  | 'scene-location'
  | 'rule-dependency'
  | 'review-issue'
  | 'proposal-variant'
  | 'manual-pin'

export interface AssetLocalizedText {
  en: string
  'zh-CN': string
}

export interface AssetContextActivationRuleRecord {
  id: string
  reasonKind: AssetContextActivationReasonKindRecord
  label: AssetLocalizedText
  summary: AssetLocalizedText
  targetAgents: AssetContextTargetAgentRecord[]
  visibility: AssetContextVisibilityRecord
  budget: AssetContextBudgetRecord
  priorityLabel?: AssetLocalizedText
  guardrailLabel?: AssetLocalizedText
}

export interface AssetContextPolicyRecord {
  assetId: string
  status: 'active' | 'limited' | 'blocked' | 'draft'
  summary: AssetLocalizedText
  defaultVisibility: AssetContextVisibilityRecord
  defaultBudget: AssetContextBudgetRecord
  activationRules: AssetContextActivationRuleRecord[]
  exclusions?: Array<{ id: string; label: AssetLocalizedText; summary: AssetLocalizedText }>
  warnings?: AssetLocalizedText[]
}

export interface AssetProfileFactRecord {
  id: string
  label: AssetLocalizedText
  value: AssetLocalizedText
}

export interface AssetProfileSectionRecord {
  id: string
  title: AssetLocalizedText
  facts: AssetProfileFactRecord[]
}

export interface AssetProfileRecord {
  sections: AssetProfileSectionRecord[]
}

export type AssetMentionBackingKind = 'canon' | 'draft_context' | 'unlinked'

export interface AssetMentionBackingRecord {
  kind: AssetMentionBackingKind
  sceneId?: string
  acceptedFactIds?: string[]
  proposalIds?: string[]
  patchId?: string
}

interface AssetMentionRecordBase {
  id: string
  targetScope: 'scene' | 'chapter'
  targetId: string
  targetLabel: AssetLocalizedText
  relationLabel: AssetLocalizedText
  excerpt: AssetLocalizedText
  backing?: AssetMentionBackingRecord
}

export interface AssetSceneMentionRecord extends AssetMentionRecordBase {
  targetScope: 'scene'
  chapterId?: string
  sceneId: string
  recommendedLens?: Extract<SceneLens, 'draft' | 'orchestrate'>
}

export interface AssetChapterMentionRecord extends AssetMentionRecordBase {
  targetScope: 'chapter'
  chapterId: string
  sceneId?: undefined
  recommendedLens?: Extract<ChapterLens, 'structure' | 'draft'>
}

export type AssetMentionRecord = AssetSceneMentionRecord | AssetChapterMentionRecord

export interface AssetRelationRecord {
  id: string
  targetAssetId: string
  relationLabel: AssetLocalizedText
  summary: AssetLocalizedText
}

export interface AssetRecord {
  id: string
  kind: AssetKind
  title: AssetLocalizedText
  summary: AssetLocalizedText
  profile: AssetProfileRecord
  mentions: AssetMentionRecord[]
  relations: AssetRelationRecord[]
  contextPolicy?: AssetContextPolicyRecord
  warnings?: AssetLocalizedText[]
  notes?: AssetLocalizedText[]
}

export interface AssetKnowledgeWorkspaceRecord {
  assetId: string
  assets: AssetRecord[]
  viewsMeta: {
    availableViews: AssetKnowledgeView[]
  }
}

export function getAssetKindOrder(kind: AssetKind) {
  return kind === 'character' ? 0 : kind === 'location' ? 1 : 2
}

export function readLocalizedAssetText(value: AssetLocalizedText, locale: Locale): string {
  return value[locale]
}
