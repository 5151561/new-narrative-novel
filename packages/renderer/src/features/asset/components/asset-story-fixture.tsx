import { useMemo } from 'react'

import type { Locale } from '@/app/i18n'
import { useI18n } from '@/app/i18n'
import type { AssetKnowledgeView } from '@/features/workbench/types/workbench-route'

import { useAssetKnowledgeWorkspaceQuery } from '../hooks/useAssetKnowledgeWorkspaceQuery'
import type { AssetKnowledgeWorkspaceViewModel, AssetNavigatorItemViewModel } from '../types/asset-view-models'

export type AssetStoryVariant = 'character' | 'location' | 'rule' | 'orphan' | 'warnings-heavy' | 'missing-policy'

function text(locale: Locale, values: { en: string; 'zh-CN': string }) {
  return values[locale]
}

export function getAssetStoryVariantAssetId(variant: AssetStoryVariant) {
  switch (variant) {
    case 'location':
      return 'asset-midnight-platform'
    case 'rule':
      return 'asset-ledger-stays-shut'
    case 'warnings-heavy':
      return 'asset-departure-bell-timing'
    case 'missing-policy':
      return 'asset-ticket-window'
    case 'orphan':
    case 'character':
    default:
      return 'asset-ren-voss'
  }
}

function withSelectedRule(
  rules: AssetNavigatorItemViewModel[],
  item: AssetNavigatorItemViewModel,
  selectedId: string,
) {
  return [item, ...rules.filter((rule) => rule.id !== item.id && rule.id !== selectedId)]
}

function applyOrphanVariant(
  workspace: AssetKnowledgeWorkspaceViewModel,
  locale: Locale,
): AssetKnowledgeWorkspaceViewModel {
  const title = text(locale, {
    en: 'Unmapped Handoff',
    'zh-CN': '未接线交接',
  })
  const summary = text(locale, {
    en: 'A placeholder rule that has not been anchored to any scene, chapter, or other asset yet.',
    'zh-CN': '一条尚未挂到任何场景、章节或其他资产上的占位规则。',
  })
  const warning = text(locale, {
    en: 'This rule still needs its first narrative anchor before it can guide revisions.',
    'zh-CN': '这条规则还需要第一个叙事锚点，才能真正指导修订。',
  })
  const missingField = text(locale, {
    en: 'Implications',
    'zh-CN': '影响',
  })

  return {
    ...workspace,
    assetId: 'asset-unmapped-handoff',
    kind: 'rule',
    title,
    summary,
    navigator: {
      ...workspace.navigator,
      rules: withSelectedRule(
        workspace.navigator.rules,
        {
          id: 'asset-unmapped-handoff',
          kind: 'rule',
          title,
          summary,
          mentionCount: 0,
          relationCount: 0,
          hasWarnings: true,
          isOrphan: true,
        },
        workspace.assetId,
      ),
    },
    profile: {
      sections: [
        {
          id: 'constraint',
          title: text(locale, { en: 'Constraint', 'zh-CN': '约束' }),
          facts: [
            {
              id: 'status',
              label: text(locale, { en: 'Status', 'zh-CN': '状态' }),
              value: text(locale, { en: 'Needs first mention', 'zh-CN': '待首次提及' }),
            },
          ],
        },
      ],
    },
    mentions: [],
    relations: [],
    contextPolicy: {
      hasContextPolicy: false,
      statusLabel: text(locale, { en: 'Not configured', 'zh-CN': '未配置' }),
      summary: text(locale, {
        en: 'This asset does not have a context policy yet.',
        'zh-CN': '这个资产还没有上下文策略。',
      }),
      defaultVisibilityLabel: text(locale, { en: 'None', 'zh-CN': '无' }),
      defaultBudgetLabel: text(locale, { en: 'None', 'zh-CN': '无' }),
      activationRules: [],
      exclusions: [],
      warnings: [],
    },
    inspector: {
      kindLabel: text(locale, { en: 'Rule', 'zh-CN': '规则' }),
      summary,
      mentionCount: 0,
      relationCount: 0,
      warnings: [warning],
      notes: [text(locale, { en: 'Keep it parked in the sidebar until a real scene uses it.', 'zh-CN': '在真实场景使用它之前，先把它停留在辅助面板里。' })],
      isOrphan: true,
      missingFields: [missingField],
      contextPolicy: {
        hasContextPolicy: false,
        statusLabel: text(locale, { en: 'Not configured', 'zh-CN': '未配置' }),
        defaultVisibilityLabel: text(locale, { en: 'None', 'zh-CN': '无' }),
        defaultBudgetLabel: text(locale, { en: 'None', 'zh-CN': '无' }),
        activationRuleCount: 0,
        warningCount: 0,
      },
    },
    dockSummary: {
      problemItems: [
        {
          id: 'orphan',
          label: text(locale, { en: 'Orphan asset', 'zh-CN': '孤立资产' }),
          detail: text(locale, {
            en: 'This rule has no mentions or relations yet and still needs a narrative anchor.',
            'zh-CN': '这条规则还没有任何提及或关系，仍需要叙事锚点。',
          }),
        },
        {
          id: 'warning-0',
          label: text(locale, { en: 'Warning', 'zh-CN': '警告' }),
          detail: warning,
        },
        {
          id: 'missing-0',
          label: text(locale, { en: 'Missing profile section', 'zh-CN': '缺失字段' }),
          detail: missingField,
        },
      ],
      warningCount: 1,
      missingFieldCount: 1,
      relationCount: 0,
      mentionCount: 0,
      isOrphan: true,
      contextPolicy: {
        hasContextPolicy: false,
        statusLabel: text(locale, { en: 'Not configured', 'zh-CN': '未配置' }),
        defaultVisibilityLabel: text(locale, { en: 'None', 'zh-CN': '无' }),
        defaultBudgetLabel: text(locale, { en: 'None', 'zh-CN': '无' }),
        activationRuleCount: 0,
        warningCount: 0,
      },
    },
    dockActivity: [
      {
        id: 'lens',
        kind: 'lens',
        title: text(locale, { en: 'Entered Knowledge', 'zh-CN': '进入 Knowledge' }),
        detail: text(locale, {
          en: 'The dock keeps the orphan review local to the knowledge workspace.',
          'zh-CN': '底部面板把孤立资产的判断留在知识工作区内。',
        }),
        tone: 'accent',
      },
      {
        id: 'asset',
        kind: 'asset',
        title: text(locale, { en: `Focused ${title}`, 'zh-CN': `聚焦${title}` }),
        detail: summary,
        tone: 'neutral',
      },
    ],
  }
}

function applyWarningsHeavyVariant(
  workspace: AssetKnowledgeWorkspaceViewModel,
  locale: Locale,
): AssetKnowledgeWorkspaceViewModel {
  const warnings = [
    workspace.inspector.warnings[0],
    text(locale, {
      en: 'The final bell beat still lands before the platform standoff fully hardens.',
      'zh-CN': '最后的铃点仍早于月台僵局真正站稳的时刻。',
    }),
    text(locale, {
      en: 'The current ending still risks draining witness pressure before the chapter closes.',
      'zh-CN': '当前结尾仍可能在章节收束前提前抽干目击压力。',
    }),
  ]
  const missingFields = [
    ...workspace.inspector.missingFields,
    text(locale, { en: 'Failure mode', 'zh-CN': '失效条件' }),
  ]

  return {
    ...workspace,
    inspector: {
      ...workspace.inspector,
      warnings,
      missingFields,
    },
    dockSummary: {
      ...workspace.dockSummary,
      warningCount: warnings.length,
      missingFieldCount: missingFields.length,
      problemItems: [
        ...workspace.dockSummary.problemItems,
        {
          id: 'timing-drift',
          label: text(locale, { en: 'Timing drift', 'zh-CN': '节奏漂移' }),
          detail: text(locale, {
            en: 'Bell timing, scene exit, and witness pressure still do not resolve on the same beat.',
            'zh-CN': '铃点、离场动作和目击压力仍没有落在同一个节拍上。',
          }),
        },
        {
          id: 'anchor-gap',
          label: text(locale, { en: 'Anchor gap', 'zh-CN': '锚点缺口' }),
          detail: text(locale, {
            en: 'The rule needs one more explicit downstream consequence before revision can rely on it.',
            'zh-CN': '这条规则还需要一个更明确的后续后果，修订时才能真正依赖它。',
          }),
        },
      ],
    },
    dockActivity: [
      {
        id: 'view',
        kind: 'view',
        title: text(locale, { en: 'Switched to Relations', 'zh-CN': '切换到关系' }),
        detail: text(locale, {
          en: 'The dock keeps the warning review next to the current rule relationships.',
          'zh-CN': '底部面板把告警复核留在当前规则关系旁边。',
        }),
        tone: 'accent',
      },
      ...workspace.dockActivity,
    ],
  }
}

export function getAssetStorySearch(variant: Exclude<AssetStoryVariant, 'orphan' | 'warnings-heavy'>, view: AssetKnowledgeView) {
  return `?scope=asset&id=${getAssetStoryVariantAssetId(variant)}&lens=knowledge&view=${view}`
}

export function getAssetStoryVariantSearch(variant: AssetStoryVariant, view: AssetKnowledgeView) {
  return `?scope=asset&id=${getAssetStoryVariantAssetId(variant)}&lens=knowledge&view=${view}`
}

export function useAssetStoryWorkspace(variant: AssetStoryVariant, activeView: AssetKnowledgeView = 'profile') {
  const { locale } = useI18n()
  const { workspace } = useAssetKnowledgeWorkspaceQuery({
    assetId: getAssetStoryVariantAssetId(variant),
    activeView,
  })

  return useMemo(() => {
    if (!workspace) {
      return workspace
    }

    if (variant === 'orphan') {
      return applyOrphanVariant(structuredClone(workspace), locale)
    }

    if (variant === 'warnings-heavy') {
      return applyWarningsHeavyVariant(structuredClone(workspace), locale)
    }

    return workspace
  }, [locale, variant, workspace])
}
