import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import type { AssetKnowledgeView } from '@/features/workbench/types/workbench-route'

import {
  assetClient,
  type AssetClient,
  type GetAssetKnowledgeWorkspaceInput,
} from '../api/asset-client'
import {
  getAssetKindOrder,
  readLocalizedAssetText,
  type AssetChapterMentionRecord,
  type AssetKnowledgeWorkspaceRecord,
  type AssetSceneMentionRecord,
  type AssetProfileFactRecord,
  type AssetProfileSectionRecord,
  type AssetRecord,
} from '../api/asset-records'
import type {
  AssetDockActivityItem,
  AssetDockSummaryItem,
  AssetDockSummaryViewModel,
  AssetInspectorViewModel,
  AssetChapterMentionViewModel,
  AssetKnowledgeWorkspaceViewModel,
  AssetMentionHandoffActionViewModel,
  AssetMentionViewModel,
  AssetNavigatorItemViewModel,
  AssetProfileSectionViewModel,
  AssetRelationViewModel,
  AssetSceneMentionViewModel,
} from '../types/asset-view-models'
import { assetQueryKeys } from './asset-query-keys'

function localizeText(value: { en: string; 'zh-CN': string }, locale: 'en' | 'zh-CN') {
  return readLocalizedAssetText(value, locale)
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
      targetKind: target?.kind ?? 'rule',
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
    activity.unshift({
      id: 'view',
      kind: 'view',
      title:
        locale === 'zh-CN'
          ? `切换到${activeView === 'mentions' ? '提及' : '关系'}`
          : `Switched to ${activeView === 'mentions' ? 'Mentions' : 'Relations'}`,
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
  const warnings = (selected.warnings ?? []).map((warning) => localizeText(warning, locale))
  const notes = (selected.notes ?? []).map((note) => localizeText(note, locale))
  const missingFields = buildMissingFields(profileSections)
  const inspector: AssetInspectorViewModel = {
    kindLabel:
      selected.kind === 'character'
        ? locale === 'zh-CN'
          ? '角色'
          : 'Character'
        : selected.kind === 'location'
          ? locale === 'zh-CN'
            ? '地点'
            : 'Location'
          : locale === 'zh-CN'
            ? '规则'
            : 'Rule',
    summary: localizeText(selected.summary, locale),
    mentionCount: selected.mentions.length,
    relationCount: selected.relations.length,
    warnings,
    notes,
    isOrphan: selected.mentions.length === 0 && selected.relations.length === 0,
    missingFields,
  }
  const dockSummary: AssetDockSummaryViewModel = {
    problemItems: buildProblemItems(selected, inspector, locale),
    warningCount: warnings.length,
    missingFieldCount: missingFields.length,
    relationCount: selected.relations.length,
    mentionCount: selected.mentions.length,
    isOrphan: inspector.isOrphan,
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
      rules: sortNavigatorItems(navigatorItems.filter((item) => item.kind === 'rule')),
    },
    viewsMeta: record.viewsMeta,
    profile: {
      sections: profileSections,
    },
    mentions: mapMention(selected, locale),
    relations: mapRelations(selected, assetsById, locale),
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
  client: Pick<AssetClient, 'getAssetKnowledgeWorkspace'> = assetClient,
) {
  const { locale } = useI18n()
  const query = useQuery({
    queryKey: assetQueryKeys.workspace(input.assetId, locale),
    queryFn: () => client.getAssetKnowledgeWorkspace({ ...input, locale }),
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
