import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { AssetKnowledgeView } from '@/features/workbench/types/workbench-route'

import {
  type AssetClient,
  type GetAssetKnowledgeWorkspaceInput,
} from '../api/asset-client'
import {
  getAssetKindOrder,
  readLocalizedAssetText,
  type CanonicalAssetKind,
  type AssetChapterMentionRecord,
  type AssetContextActivationReasonKindRecord,
  type AssetContextBudgetRecord,
  type AssetContextActivationRuleRecord,
  type AssetContextPolicyRecord,
  type AssetContextTargetAgentRecord,
  type AssetContextVisibilityRecord,
  type AssetKind,
  type AssetKnowledgeWorkspaceRecord,
  type AssetProfileFactRecord,
  type AssetProfileSectionRecord,
  type AssetRecord,
  type AssetSceneMentionRecord,
  type AssetStateTimelineEntryRecord,
  type AssetStoryBibleFactRecord,
} from '../api/asset-records'
import type {
  AssetDockActivityItem,
  AssetDockSummaryItem,
  AssetDockSummaryViewModel,
  AssetInspectorViewModel,
  AssetChapterMentionViewModel,
  AssetContextActivationRuleViewModel,
  AssetContextParticipationSummaryViewModel,
  AssetContextPolicySummaryViewModel,
  AssetContextPolicyViewModel,
  AssetKnowledgeWorkspaceViewModel,
  AssetMentionHandoffActionViewModel,
  AssetMentionViewModel,
  AssetNavigatorItemViewModel,
  AssetProfileSectionViewModel,
  AssetRelationViewModel,
  AssetSceneMentionViewModel,
  AssetStateTimelineEntryViewModel,
  AssetStoryBibleFactViewModel,
  AssetStoryBibleViewModel,
} from '../types/asset-view-models'
import { assetQueryKeys } from './asset-query-keys'

function localizeText(value: { en: string; 'zh-CN': string }, locale: 'en' | 'zh-CN') {
  return readLocalizedAssetText(value, locale)
}

function getContextPolicyStatusLabel(status: AssetContextPolicyRecord['status'] | 'missing', locale: 'en' | 'zh-CN') {
  const labels: Record<'en' | 'zh-CN', Record<AssetContextPolicyRecord['status'] | 'missing', string>> = {
    en: {
      active: 'Active',
      limited: 'Limited',
      blocked: 'Blocked',
      draft: 'Draft',
      missing: 'Not configured',
    },
    'zh-CN': {
      active: '启用',
      limited: '受限',
      blocked: '阻断',
      draft: '草稿',
      missing: '未配置',
    },
  }

  return labels[locale][status]
}

function getContextVisibilityLabel(visibility: AssetContextVisibilityRecord | 'missing', locale: 'en' | 'zh-CN') {
  const labels: Record<'en' | 'zh-CN', Record<AssetContextVisibilityRecord | 'missing', string>> = {
    en: {
      public: 'Public',
      'character-known': 'Character-known',
      private: 'Private',
      spoiler: 'Spoiler',
      'editor-only': 'Editor-only',
      missing: 'None',
    },
    'zh-CN': {
      public: '公开',
      'character-known': '角色已知',
      private: '私密',
      spoiler: '剧透',
      'editor-only': '仅编辑',
      missing: '无',
    },
  }

  return labels[locale][visibility]
}

function getAssetKindLabel(kind: CanonicalAssetKind, locale: 'en' | 'zh-CN') {
  const labels: Record<'en' | 'zh-CN', Record<CanonicalAssetKind, string>> = {
    en: {
      character: 'Character',
      location: 'Location',
      organization: 'Organization',
      object: 'Object',
      lore: 'Lore',
    },
    'zh-CN': {
      character: '角色',
      location: '地点',
      organization: '组织',
      object: '物件',
      lore: 'Lore',
    },
  }

  return labels[locale][kind]
}

function getTimelineStatusLabel(status: AssetStateTimelineEntryRecord['status'], locale: 'en' | 'zh-CN') {
  const labels: Record<'en' | 'zh-CN', Record<AssetStateTimelineEntryRecord['status'], string>> = {
    en: {
      established: 'Established',
      watch: 'Watch',
      'at-risk': 'At risk',
      spoiler: 'Spoiler',
    },
    'zh-CN': {
      established: '已建立',
      watch: '持续观察',
      'at-risk': '有风险',
      spoiler: '剧透',
    },
  }

  return labels[locale][status]
}

const visibilityRank: Record<AssetContextVisibilityRecord, number> = {
  public: 0,
  'character-known': 1,
  private: 2,
  spoiler: 3,
  'editor-only': 4,
}

const canonicalVisibleVisibilityRank = visibilityRank['character-known']

function canReadFactVisibility(
  factVisibility: AssetContextVisibilityRecord,
  requestedVisibility: AssetContextVisibilityRecord,
) {
  return visibilityRank[factVisibility] <= visibilityRank[requestedVisibility]
}

function getContextBudgetLabel(budget: AssetContextBudgetRecord | 'missing', locale: 'en' | 'zh-CN') {
  const labels: Record<'en' | 'zh-CN', Record<AssetContextBudgetRecord | 'missing', string>> = {
    en: {
      'summary-only': 'Summary only',
      'selected-facts': 'Selected facts',
      'mentions-excerpts': 'Mention excerpts',
      'full-profile': 'Full profile',
      missing: 'None',
    },
    'zh-CN': {
      'summary-only': '仅摘要',
      'selected-facts': '筛选事实',
      'mentions-excerpts': '提及摘录',
      'full-profile': '完整资料',
      missing: '无',
    },
  }

  return labels[locale][budget]
}

function getContextAgentLabel(agent: AssetContextTargetAgentRecord, locale: 'en' | 'zh-CN') {
  const labels: Record<'en' | 'zh-CN', Record<AssetContextTargetAgentRecord, string>> = {
    en: {
      'scene-manager': 'Scene manager',
      'character-agent': 'Character agent',
      'continuity-reviewer': 'Continuity reviewer',
      'prose-agent': 'Prose agent',
    },
    'zh-CN': {
      'scene-manager': '场景管理',
      'character-agent': '角色代理',
      'continuity-reviewer': '连续性审阅',
      'prose-agent': '成稿代理',
    },
  }

  return labels[locale][agent]
}

function getContextReasonKindLabel(reasonKind: AssetContextActivationReasonKindRecord, locale: 'en' | 'zh-CN') {
  const labels: Record<'en' | 'zh-CN', Record<AssetContextActivationReasonKindRecord, string>> = {
    en: {
      'explicit-link': 'Explicit link',
      'scene-cast': 'Scene cast',
      'scene-location': 'Scene location',
      'rule-dependency': 'Rule dependency',
      'review-issue': 'Review issue',
      'proposal-variant': 'Proposal variant',
      'manual-pin': 'Manual pin',
    },
    'zh-CN': {
      'explicit-link': '显式引用',
      'scene-cast': '场景登场',
      'scene-location': '场景地点',
      'rule-dependency': '规则依赖',
      'review-issue': '审阅问题',
      'proposal-variant': '提案变体',
      'manual-pin': '手动固定',
    },
  }

  return labels[locale][reasonKind]
}

function getRelationScopeLabel(
  currentKind: AssetKind,
  targetKind: AssetKind,
  locale: 'en' | 'zh-CN',
) {
  if (currentKind === targetKind) {
    return locale === 'zh-CN' ? '同类关系' : 'Same-kind relation'
  }

  return locale === 'zh-CN' ? '跨类关系' : 'Cross-kind relation'
}

function getReciprocalStatusLabel(hasReciprocalRelation: boolean, locale: 'en' | 'zh-CN') {
  return hasReciprocalRelation
    ? locale === 'zh-CN' ? '双向可读' : 'Reciprocal'
    : locale === 'zh-CN' ? '单向关系' : 'One-way'
}

function getNarrativeBackingStatusLabel(
  hasNarrativeBacking: boolean | undefined,
  locale: 'en' | 'zh-CN',
) {
  if (hasNarrativeBacking === undefined) {
    return locale === 'zh-CN' ? '来源链待加载' : 'Traceability pending'
  }

  return hasNarrativeBacking
    ? locale === 'zh-CN' ? '已有叙事支撑' : 'Narrative-backed'
    : locale === 'zh-CN' ? '缺少叙事支撑' : 'Missing narrative backing'
}

function emptyContextPolicy(locale: 'en' | 'zh-CN'): AssetContextPolicyViewModel {
  return {
    hasContextPolicy: false,
    statusLabel: getContextPolicyStatusLabel('missing', locale),
    summary:
      locale === 'zh-CN'
        ? '这个资产还没有上下文策略。'
        : 'This asset does not have a context policy yet.',
    defaultVisibilityLabel: getContextVisibilityLabel('missing', locale),
    defaultBudgetLabel: getContextBudgetLabel('missing', locale),
    activationRules: [],
    participation: [],
    exclusions: [],
    warnings: [],
  }
}

function mapContextActivationRule(
  rule: AssetContextPolicyRecord['activationRules'][number],
  locale: 'en' | 'zh-CN',
): AssetContextActivationRuleViewModel {
  return {
    id: rule.id,
    label: localizeText(rule.label, locale),
    summary: localizeText(rule.summary, locale),
    reasonKindLabel: getContextReasonKindLabel(rule.reasonKind, locale),
    visibilityLabel: getContextVisibilityLabel(rule.visibility, locale),
    budgetLabel: getContextBudgetLabel(rule.budget, locale),
    targetAgentLabels: rule.targetAgents.map((agent) => getContextAgentLabel(agent, locale)),
    priorityLabel: rule.priorityLabel ? localizeText(rule.priorityLabel, locale) : undefined,
    guardrailLabel: rule.guardrailLabel ? localizeText(rule.guardrailLabel, locale) : undefined,
  }
}

function buildContextParticipation(
  record: AssetRecord,
  policy: AssetContextPolicyRecord,
  locale: 'en' | 'zh-CN',
): AssetContextParticipationSummaryViewModel[] {
  const allFacts = [...record.canonFacts, ...record.privateFacts]

  return policy.activationRules.flatMap((rule: AssetContextActivationRuleRecord) =>
    rule.targetAgents.map((agent) => {
      const allowedFacts = allFacts.filter((fact) => canReadFactVisibility(fact.visibility, rule.visibility))
      const visibleFacts = allowedFacts
        .filter((fact) => visibilityRank[fact.visibility] <= canonicalVisibleVisibilityRank)
        .map((fact) => localizeText(fact.label, locale))
      const redactedFacts = agent === 'continuity-reviewer'
        ? allowedFacts
          .filter((fact) => visibilityRank[fact.visibility] > canonicalVisibleVisibilityRank)
          .map((fact) => localizeText(fact.label, locale))
        : []
      const excludedFactCount = allFacts.length - visibleFacts.length - redactedFacts.length

      return {
        id: `${rule.id}-${agent}`,
        label: localizeText(rule.label, locale),
        summary: localizeText(rule.summary, locale),
        visibilityLabel: getContextVisibilityLabel(rule.visibility, locale),
        budgetLabel: getContextBudgetLabel(rule.budget, locale),
        targetAgentLabel: getContextAgentLabel(agent, locale),
        visibleFacts,
        redactedFacts,
        excludedFactCount,
        guardrailLabel: rule.guardrailLabel ? localizeText(rule.guardrailLabel, locale) : undefined,
      }
    }),
  )
}

function mapContextPolicy(
  record: AssetRecord,
  policy: AssetContextPolicyRecord | undefined,
  locale: 'en' | 'zh-CN',
): AssetContextPolicyViewModel {
  if (!policy) {
    return emptyContextPolicy(locale)
  }

  return {
    hasContextPolicy: true,
    statusLabel: getContextPolicyStatusLabel(policy.status, locale),
    summary: localizeText(policy.summary, locale),
    defaultVisibilityLabel: getContextVisibilityLabel(policy.defaultVisibility, locale),
    defaultBudgetLabel: getContextBudgetLabel(policy.defaultBudget, locale),
    activationRules: policy.activationRules.map((rule) => mapContextActivationRule(rule, locale)),
    participation: buildContextParticipation(record, policy, locale),
    exclusions: (policy.exclusions ?? []).map((exclusion) => ({
      id: exclusion.id,
      label: localizeText(exclusion.label, locale),
      summary: localizeText(exclusion.summary, locale),
    })),
    warnings: (policy.warnings ?? []).map((warning) => localizeText(warning, locale)),
  }
}

function summarizeContextPolicy(policy: AssetContextPolicyViewModel): AssetContextPolicySummaryViewModel {
  return {
    hasContextPolicy: policy.hasContextPolicy,
    statusLabel: policy.statusLabel,
    defaultVisibilityLabel: policy.defaultVisibilityLabel,
    defaultBudgetLabel: policy.defaultBudgetLabel,
    activationRuleCount: policy.activationRules.length,
    warningCount: policy.warnings.length,
  }
}

function mapProfileSection(
  section: AssetProfileSectionRecord,
  locale: 'en' | 'zh-CN',
): AssetProfileSectionViewModel {
  return {
    id: section.id,
    title: localizeText(section.title, locale),
    facts: section.facts
      .map((fact: AssetProfileFactRecord) => ({
        id: fact.id,
        label: localizeText(fact.label, locale),
        value: localizeText(fact.value, locale).trim(),
      }))
      .filter((fact) => fact.value.length > 0),
  }
}

function mapStoryBibleFact(
  fact: AssetStoryBibleFactRecord,
  locale: 'en' | 'zh-CN',
): AssetStoryBibleFactViewModel {
  return {
    id: fact.id,
    label: localizeText(fact.label, locale),
    value: localizeText(fact.value, locale),
    visibilityLabel: getContextVisibilityLabel(fact.visibility, locale),
    sourceRefs: fact.sourceRefs.map((sourceRef) => ({
      id: sourceRef.id,
      kind: sourceRef.kind,
      label: localizeText(sourceRef.label, locale),
    })),
    lastReviewedAtLabel: fact.lastReviewedAtLabel,
  }
}

function mapTimelineEntry(
  entry: AssetStateTimelineEntryRecord,
  locale: 'en' | 'zh-CN',
): AssetStateTimelineEntryViewModel {
  return {
    id: entry.id,
    label: localizeText(entry.label, locale),
    summary: localizeText(entry.summary, locale),
    sceneId: entry.sceneId,
    chapterId: entry.chapterId,
    statusLabel: getTimelineStatusLabel(entry.status, locale),
    sourceRefs: entry.sourceRefs.map((sourceRef) => ({
      id: sourceRef.id,
      kind: sourceRef.kind,
      label: localizeText(sourceRef.label, locale),
    })),
  }
}

function mapStoryBible(
  record: AssetRecord,
  locale: 'en' | 'zh-CN',
  requestedVisibility?: AssetContextVisibilityRecord,
): AssetStoryBibleViewModel {
  const canRead = (visibility: AssetContextVisibilityRecord) =>
    requestedVisibility === undefined || canReadFactVisibility(visibility, requestedVisibility)

  return {
    canonFacts: record.canonFacts.filter((fact) => canRead(fact.visibility)).map((fact) => mapStoryBibleFact(fact, locale)),
    privateFacts: record.privateFacts.filter((fact) => canRead(fact.visibility)).map((fact) => mapStoryBibleFact(fact, locale)),
    stateTimeline: record.stateTimeline.map((entry) => mapTimelineEntry(entry, locale)),
  }
}

function mapNavigatorItem(record: AssetRecord, locale: 'en' | 'zh-CN'): AssetNavigatorItemViewModel {
  const mentionCount = record.mentions.length
  const relationCount = record.relations.length

  return {
    id: record.id,
    kind: record.kind,
    title: localizeText(record.title, locale),
    summary: localizeText(record.summary, locale),
    mentionCount,
    relationCount,
    hasWarnings: (record.warnings?.length ?? 0) > 0,
    isOrphan: mentionCount === 0 && relationCount === 0,
  }
}

function sortNavigatorItems(items: AssetNavigatorItemViewModel[]) {
  return [...items].sort((left, right) => left.title.localeCompare(right.title, 'en'))
}

function buildMentionHandoffActions(
  mention: AssetSceneMentionRecord | AssetChapterMentionRecord,
  title: string,
  locale: 'en' | 'zh-CN',
): AssetMentionHandoffActionViewModel[] {
  if (mention.targetScope === 'scene') {
    return [
      {
        id: `${mention.id}-draft`,
        targetScope: 'scene',
        targetId: mention.sceneId,
        lens: 'draft',
        label: locale === 'zh-CN' ? `在 Draft 中打开: ${title}` : `Open in Draft: ${title}`,
        recommended: mention.recommendedLens === 'draft',
      },
      {
        id: `${mention.id}-orchestrate`,
        targetScope: 'scene',
        targetId: mention.sceneId,
        lens: 'orchestrate',
        label: locale === 'zh-CN' ? `在 Orchestrate 中打开: ${title}` : `Open in Orchestrate: ${title}`,
        recommended: mention.recommendedLens === 'orchestrate',
      },
    ]
  }

  return [
    {
      id: `${mention.id}-structure`,
      targetScope: 'chapter',
      targetId: mention.chapterId,
      lens: 'structure',
      label: locale === 'zh-CN' ? `在 Structure 中打开: ${title}` : `Open in Structure: ${title}`,
      recommended: mention.recommendedLens === 'structure',
    },
    {
      id: `${mention.id}-draft`,
      targetScope: 'chapter',
      targetId: mention.chapterId,
      lens: 'draft',
      label: locale === 'zh-CN' ? `在 Draft 中打开: ${title}` : `Open in Draft: ${title}`,
      recommended: mention.recommendedLens === 'draft',
    },
  ]
}

function mapMention(record: AssetRecord, locale: 'en' | 'zh-CN'): AssetMentionViewModel[] {
  return record.mentions.map((mention) => {
    const title = localizeText(mention.targetLabel, locale)
    const common = {
      id: mention.id,
      targetScope: mention.targetScope,
      targetId: mention.targetId,
      title,
      relationLabel: localizeText(mention.relationLabel, locale),
      excerpt: localizeText(mention.excerpt, locale),
      backing: mention.backing,
    }

    if (mention.targetScope === 'scene') {
      const handoffActions = buildMentionHandoffActions(mention, title, locale) as Extract<
        AssetMentionHandoffActionViewModel,
        { targetScope: 'scene' }
      >[]

      return {
        ...common,
        targetScope: 'scene',
        chapterId: mention.chapterId,
        sceneId: mention.sceneId,
        recommendedLens: mention.recommendedLens,
        handoffActions,
      } satisfies AssetSceneMentionViewModel
    }

    const handoffActions = buildMentionHandoffActions(mention, title, locale) as Extract<
      AssetMentionHandoffActionViewModel,
      { targetScope: 'chapter' }
    >[]

    return {
      ...common,
      targetScope: 'chapter',
      chapterId: mention.chapterId,
      recommendedLens: mention.recommendedLens,
      handoffActions,
    } satisfies AssetChapterMentionViewModel
  })
}

function mapRelations(
  record: AssetRecord,
  assetsById: Map<string, AssetRecord>,
  locale: 'en' | 'zh-CN',
): AssetRelationViewModel[] {
  return record.relations.map((relation) => {
    const target = assetsById.get(relation.targetAssetId)

    return {
      id: relation.id,
      targetAssetId: relation.targetAssetId,
      targetTitle: target ? localizeText(target.title, locale) : relation.targetAssetId,
      targetKind: target?.kind ?? 'lore',
      targetKindLabel: getAssetKindLabel(target?.kind ?? 'lore', locale),
      relationshipScopeLabel: getRelationScopeLabel(record.kind, target?.kind ?? 'lore', locale),
      reciprocalStatusLabel: getReciprocalStatusLabel(
        Boolean(target?.relations.some((candidate) => candidate.targetAssetId === record.id)),
        locale,
      ),
      hasReciprocalRelation: Boolean(target?.relations.some((candidate) => candidate.targetAssetId === record.id)),
      relationLabel: localizeText(relation.relationLabel, locale),
      summary: localizeText(relation.summary, locale),
    }
  })
}

function buildMissingFields(sections: AssetProfileSectionViewModel[]): string[] {
  return sections
    .filter((section) => section.facts.length === 0)
    .map((section) => section.title)
}

function buildProblemItems(
  record: AssetRecord,
  inspector: AssetInspectorViewModel,
  rawContextPolicy: AssetContextPolicyRecord | undefined,
  contextPolicy: AssetContextPolicyViewModel,
  locale: 'en' | 'zh-CN',
): AssetDockSummaryItem[] {
  const items: AssetDockSummaryItem[] = []

  if (inspector.isOrphan) {
    items.push({
      id: 'orphan',
      label: locale === 'zh-CN' ? '孤立资产' : 'Orphan asset',
      detail:
        locale === 'zh-CN'
          ? '当前资产还没有 mentions 或 relations，后续接线前需要先挂到现有章节或规则上。'
          : 'This asset has no mentions or relations yet and needs a narrative anchor before future edits.',
    })
  }

  for (const [index, warning] of inspector.warnings.entries()) {
    items.push({
      id: `warning-${index}`,
      label: locale === 'zh-CN' ? '警告' : 'Warning',
      detail: warning,
    })
  }

  for (const [index, missingField] of inspector.missingFields.entries()) {
    items.push({
      id: `missing-${index}`,
      label: locale === 'zh-CN' ? '缺失字段' : 'Missing profile section',
      detail: missingField,
    })
  }

  if (record.relations.length === 0) {
    items.push({
      id: 'no-relations',
      label: locale === 'zh-CN' ? '缺少关系' : 'No relations yet',
      detail:
        locale === 'zh-CN'
          ? '这个知识页还没有建立任何 asset-to-asset 关系。'
          : 'This knowledge workspace has not established any asset-to-asset relations yet.',
    })
  }

  if (rawContextPolicy) {
    if (rawContextPolicy.status === 'blocked') {
      items.push({
        id: 'blocked-context-policy',
        label: locale === 'zh-CN' ? '上下文策略已阻断' : 'Context policy blocked',
        detail: contextPolicy.summary,
      })
    }

    if (rawContextPolicy.activationRules.length === 0) {
      items.push({
        id: 'no-context-activation-rules',
        label: locale === 'zh-CN' ? '缺少激活规则' : 'No activation rules',
        detail:
          locale === 'zh-CN'
            ? '策略存在，但没有任何激活规则可说明何时进入上下文。'
            : 'The policy exists, but no activation rules explain when it should enter context.',
      })
    }

    const requiresCaution =
      rawContextPolicy.defaultVisibility === 'private' ||
      rawContextPolicy.defaultVisibility === 'spoiler' ||
      rawContextPolicy.activationRules.some((rule) => rule.visibility === 'private' || rule.visibility === 'spoiler')

    if (requiresCaution) {
      items.push({
        id: 'context-policy-caution',
        label: locale === 'zh-CN' ? '私密/剧透策略需谨慎' : 'Private/spoiler policy requires caution',
        detail:
          locale === 'zh-CN'
            ? '至少一条上下文策略使用私密或剧透可见性，进入运行上下文前需要保持护栏。'
            : 'At least one context policy path uses private or spoiler visibility and needs guardrails before run context.',
      })
    }
  }

  return items
}

function buildDockActivity(
  assetTitle: string,
  assetSummary: string,
  activeView: AssetKnowledgeView,
  locale: 'en' | 'zh-CN',
): AssetDockActivityItem[] {
  const activity: AssetDockActivityItem[] = [
    {
      id: 'lens',
      kind: 'lens',
      title: locale === 'zh-CN' ? '进入 Knowledge' : 'Entered Knowledge',
      detail:
        locale === 'zh-CN'
          ? '底部面板只记录当前知识工作区里的最近上下文变化。'
          : 'The dock records recent knowledge-workspace context without owning route state.',
      tone: 'accent',
    },
    {
      id: 'asset',
      kind: 'asset',
      title: locale === 'zh-CN' ? `聚焦${assetTitle}` : `Focused ${assetTitle}`,
      detail: assetSummary,
      tone: 'neutral',
    },
  ]

  if (activeView !== 'profile') {
    const viewLabel =
      activeView === 'mentions'
        ? locale === 'zh-CN'
          ? '提及'
          : 'Mentions'
        : activeView === 'relations'
          ? locale === 'zh-CN'
            ? '关系'
            : 'Relations'
          : locale === 'zh-CN'
            ? '上下文'
            : 'Context'

    activity.unshift({
      id: 'view',
      kind: 'view',
      title: locale === 'zh-CN' ? `切换到${viewLabel}` : `Switched to ${viewLabel}`,
      detail:
        locale === 'zh-CN'
          ? '底部面板只记录当前知识工作区里的最近上下文变化。'
          : 'The dock records recent knowledge-workspace context without owning route state.',
      tone: 'accent',
    })
  }

  return activity
}

function buildAssetKnowledgeWorkspaceModel(
  record: AssetKnowledgeWorkspaceRecord | null | undefined,
  activeView: AssetKnowledgeView,
  locale: 'en' | 'zh-CN',
): AssetKnowledgeWorkspaceViewModel | null | undefined {
  if (record === undefined) {
    return undefined
  }

  if (record === null) {
    return null
  }

  const assets = [...record.assets].sort((left, right) => {
    const kindDelta = getAssetKindOrder(left.kind) - getAssetKindOrder(right.kind)
    if (kindDelta !== 0) {
      return kindDelta
    }

    return localizeText(left.title, locale).localeCompare(localizeText(right.title, locale), 'en')
  })
  const assetsById = new Map(assets.map((asset) => [asset.id, asset]))
  const selected = assetsById.get(record.assetId)
  if (!selected) {
    return null
  }

  const profileSections = selected.profile.sections.map((section) => mapProfileSection(section, locale))
  const storyBible = mapStoryBible(selected, locale, record.requestedVisibility)
  const warnings = (selected.warnings ?? []).map((warning) => localizeText(warning, locale))
  const notes = (selected.notes ?? []).map((note) => localizeText(note, locale))
  const missingFields = buildMissingFields(profileSections)
  const contextPolicy = mapContextPolicy(selected, selected.contextPolicy, locale)
  const contextPolicySummary = summarizeContextPolicy(contextPolicy)
  const inspector: AssetInspectorViewModel = {
    kindLabel: getAssetKindLabel(selected.kind, locale),
    summary: localizeText(selected.summary, locale),
    visibilityLabel: getContextVisibilityLabel(selected.visibility, locale),
    mentionCount: selected.mentions.length,
    relationCount: selected.relations.length,
    canonFactCount: storyBible.canonFacts.length,
    privateFactCount: storyBible.privateFacts.length,
    timelineEntryCount: storyBible.stateTimeline.length,
    warnings,
    notes,
    isOrphan: selected.mentions.length === 0 && selected.relations.length === 0,
    missingFields,
    contextPolicy: contextPolicySummary,
  }
  const dockSummary: AssetDockSummaryViewModel = {
    problemItems: buildProblemItems(selected, inspector, selected.contextPolicy, contextPolicy, locale),
      warningCount: warnings.length,
      missingFieldCount: missingFields.length,
      relationCount: selected.relations.length,
      mentionCount: selected.mentions.length,
      timelineEntryCount: storyBible.stateTimeline.length,
      isOrphan: inspector.isOrphan,
      contextPolicy: contextPolicySummary,
  }

  const navigatorItems = assets.map((asset) => mapNavigatorItem(asset, locale))

  return {
    assetId: selected.id,
    kind: selected.kind,
    title: localizeText(selected.title, locale),
    summary: localizeText(selected.summary, locale),
    navigator: {
      characters: sortNavigatorItems(navigatorItems.filter((item) => item.kind === 'character')),
      locations: sortNavigatorItems(navigatorItems.filter((item) => item.kind === 'location')),
      organizations: sortNavigatorItems(navigatorItems.filter((item) => item.kind === 'organization')),
      objects: sortNavigatorItems(navigatorItems.filter((item) => item.kind === 'object')),
      lore: sortNavigatorItems(navigatorItems.filter((item) => item.kind === 'lore')),
    },
    viewsMeta: record.viewsMeta,
    profile: {
      sections: profileSections,
    },
    storyBible,
    mentions: mapMention(selected, locale),
    relations: mapRelations(selected, assetsById, locale),
    contextPolicy,
    inspector,
    dockSummary,
    dockActivity: buildDockActivity(
      localizeText(selected.title, locale),
      localizeText(selected.summary, locale),
      activeView,
      locale,
    ),
  }
}

export function useAssetKnowledgeWorkspaceQuery(
  input: GetAssetKnowledgeWorkspaceInput & { activeView?: AssetKnowledgeView },
  client?: Pick<AssetClient, 'getAssetKnowledgeWorkspace'>,
) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.assetClient,
    'useAssetKnowledgeWorkspaceQuery',
    'client',
  )
  const query = useQuery({
    queryKey: assetQueryKeys.workspace(input.assetId, locale),
    queryFn: () => effectiveClient.getAssetKnowledgeWorkspace({ ...input, locale }),
  })

  const workspace = useMemo(
    () => buildAssetKnowledgeWorkspaceModel(query.data, input.activeView ?? 'profile', locale),
    [input.activeView, locale, query.data],
  )

  return {
    workspace,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
