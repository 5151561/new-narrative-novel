import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { cn } from '@/lib/cn'

import type {
  RunContextActivationSummaryRecord,
  RunContextAssetActivationDecisionRecord,
  RunContextAssetActivationRecord,
} from '../api/run-artifact-records'
import type { RunEventRefRecord } from '../api/run-records'

interface RunContextAssetActivationListProps {
  activations?: RunContextAssetActivationRecord[]
  summary?: RunContextActivationSummaryRecord
  onOpenAssetContext?: (assetId: string) => void
}

const decisionTone: Record<RunContextAssetActivationDecisionRecord, 'success' | 'warn' | 'danger'> = {
  included: 'success',
  excluded: 'warn',
  redacted: 'danger',
}

const decisionLabels: Record<Locale, Record<RunContextAssetActivationDecisionRecord, string>> = {
  en: {
    included: 'included',
    excluded: 'excluded',
    redacted: 'redacted',
  },
  'zh-CN': {
    included: '已纳入',
    excluded: '已排除',
    redacted: '已遮蔽',
  },
}

const visibilityLabels: Record<Locale, Record<RunContextAssetActivationRecord['visibility'], string>> = {
  en: {
    public: 'Public',
    'character-known': 'Character-known',
    private: 'Private',
    spoiler: 'Spoiler',
    'editor-only': 'Editor-only',
  },
  'zh-CN': {
    public: '公开',
    'character-known': '角色已知',
    private: '私密',
    spoiler: '剧透',
    'editor-only': '仅编辑',
  },
}

const budgetLabels: Record<Locale, Record<RunContextAssetActivationRecord['budget'], string>> = {
  en: {
    'summary-only': 'Summary only',
    'selected-facts': 'Selected facts',
    'mentions-excerpts': 'Mention excerpts',
    'full-profile': 'Full profile',
  },
  'zh-CN': {
    'summary-only': '仅摘要',
    'selected-facts': '筛选事实',
    'mentions-excerpts': '提及摘录',
    'full-profile': '完整资料',
  },
}

const targetAgentLabels: Record<Locale, Record<RunContextAssetActivationRecord['targetAgents'][number], string>> = {
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

function t(value: { en: string; 'zh-CN': string }, locale: Locale) {
  return value[locale] ?? value.en
}

function joinLabels(values: string[], fallback: string) {
  return values.length > 0 ? values.join(', ') : fallback
}

function getRefLabel(ref: RunEventRefRecord) {
  return ref.label ?? ref.kind
}

function ActivationCard({
  activation,
  onOpenAssetContext,
}: {
  activation: RunContextAssetActivationRecord
  onOpenAssetContext?: (assetId: string) => void
}) {
  const { locale } = useI18n()
  const emptyLabel = locale === 'zh-CN' ? '无' : 'None'
  const sourceRefs = activation.sourceRefs ?? []
  const assetTitle = t(activation.assetTitle, locale)
  const openAssetContextLabel =
    locale === 'zh-CN' ? `打开 ${assetTitle} 的资产上下文` : `Open asset context for ${assetTitle}`

  return (
    <article className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-sm font-medium text-text-main">{assetTitle}</h5>
            <Badge>{activation.assetKind}</Badge>
            <Badge tone={decisionTone[activation.decision]}>{decisionLabels[locale][activation.decision]}</Badge>
          </div>
          <p className="text-sm leading-6 text-text-muted">{t(activation.reasonLabel, locale)}</p>
          {activation.note ? <p className="text-sm leading-6 text-text-muted">{t(activation.note, locale)}</p> : null}
        </div>
        {onOpenAssetContext ? (
          <button
            type="button"
            aria-label={openAssetContextLabel}
            onClick={() => onOpenAssetContext(activation.assetId)}
            className={cn(
              'rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main transition-colors',
              'hover:border-line-strong hover:bg-surface-2',
            )}
          >
            {locale === 'zh-CN' ? '打开资产上下文' : 'Open asset context'}
          </button>
        ) : null}
      </div>
      <div className="mt-3">
        <FactList
          items={[
            {
              id: `${activation.id}-reason`,
              label: locale === 'zh-CN' ? '原因' : 'Reason',
              value: t(activation.reasonLabel, locale),
            },
            {
              id: `${activation.id}-visibility`,
              label: locale === 'zh-CN' ? '可见性' : 'Visibility',
              value: visibilityLabels[locale][activation.visibility],
            },
            {
              id: `${activation.id}-budget`,
              label: locale === 'zh-CN' ? '预算' : 'Budget',
              value: budgetLabels[locale][activation.budget],
            },
            {
              id: `${activation.id}-target-agents`,
              label: locale === 'zh-CN' ? '目标代理' : 'Target agents',
              value: joinLabels(
                activation.targetAgents.map((agent) => targetAgentLabels[locale][agent]),
                emptyLabel,
              ),
            },
          ]}
        />
      </div>
      {sourceRefs.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {sourceRefs.map((ref) => (
            <Badge key={`${activation.id}-${ref.kind}-${ref.id}`} title={ref.id}>
              {getRefLabel(ref)}
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function ActivationSection({
  title,
  activations,
  onOpenAssetContext,
}: {
  title: string
  activations: RunContextAssetActivationRecord[]
  onOpenAssetContext?: (assetId: string) => void
}) {
  const { locale } = useI18n()

  return (
    <SectionCard title={title} eyebrow={locale === 'zh-CN' ? '资产决策' : 'Asset Decisions'}>
      {activations.length > 0 ? (
        <div className="grid gap-3">
          {activations.map((activation) => (
            <ActivationCard key={activation.id} activation={activation} onOpenAssetContext={onOpenAssetContext} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? '没有资产' : 'No assets'}
          message={locale === 'zh-CN' ? '这个决策分组没有资产。' : 'No assets are in this decision group.'}
          className="min-h-0"
        />
      )}
    </SectionCard>
  )
}

export function RunContextAssetActivationList({
  activations = [],
  summary,
  onOpenAssetContext,
}: RunContextAssetActivationListProps) {
  const { locale } = useI18n()
  const emptyLabel = locale === 'zh-CN' ? '无' : 'None'

  if (activations.length === 0 && !summary) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '没有上下文激活数据' : 'No context activation data'}
        message={
          locale === 'zh-CN'
            ? '这个 context packet 没有记录资产级激活决策。'
            : 'This context packet has no asset-level activation decisions.'
        }
        className="min-h-0"
      />
    )
  }

  const included = activations.filter((activation) => activation.decision === 'included')
  const excluded = activations.filter((activation) => activation.decision === 'excluded')
  const redacted = activations.filter((activation) => activation.decision === 'redacted')
  const targetAgents = Array.from(new Set(activations.flatMap((activation) => activation.targetAgents)))

  return (
    <div className="grid gap-4">
      <SectionCard title={locale === 'zh-CN' ? '激活摘要' : 'Activation Summary'} eyebrow="Context Activation">
        <FactList
          items={[
            {
              id: 'included-assets',
              label: locale === 'zh-CN' ? '已纳入资产' : 'Included assets',
              value: `${summary?.includedAssetCount ?? included.length}`,
            },
            {
              id: 'excluded-assets',
              label: locale === 'zh-CN' ? '已排除资产' : 'Excluded assets',
              value: `${summary?.excludedAssetCount ?? excluded.length}`,
            },
            {
              id: 'redacted-assets',
              label: locale === 'zh-CN' ? '已遮蔽资产' : 'Redacted assets',
              value: `${summary?.redactedAssetCount ?? redacted.length}`,
            },
            {
              id: 'target-agents',
              label: locale === 'zh-CN' ? '目标代理' : 'Target agents',
              value: `${summary?.targetAgentCount ?? targetAgents.length}`,
            },
            {
              id: 'warnings',
              label: locale === 'zh-CN' ? '警告' : 'Warnings',
              value: `${summary?.warningCount ?? 0}`,
            },
          ]}
        />
      </SectionCard>
      <SectionCard title={locale === 'zh-CN' ? '目标代理' : 'Target Agents'} eyebrow={locale === 'zh-CN' ? '覆盖范围' : 'Coverage'}>
        <div className="flex flex-wrap gap-2">
          {targetAgents.length > 0 ? (
            targetAgents.map((agent) => <Badge key={agent}>{targetAgentLabels[locale][agent]}</Badge>)
          ) : (
            <p className="text-sm text-text-muted">{emptyLabel}</p>
          )}
        </div>
      </SectionCard>
      <ActivationSection
        title={locale === 'zh-CN' ? '已纳入资产' : 'Included Assets'}
        activations={included}
        onOpenAssetContext={onOpenAssetContext}
      />
      <ActivationSection
        title={locale === 'zh-CN' ? '已排除资产' : 'Excluded Assets'}
        activations={excluded}
        onOpenAssetContext={onOpenAssetContext}
      />
      <ActivationSection
        title={locale === 'zh-CN' ? '已遮蔽资产' : 'Redacted Assets'}
        activations={redacted}
        onOpenAssetContext={onOpenAssetContext}
      />
    </div>
  )
}
