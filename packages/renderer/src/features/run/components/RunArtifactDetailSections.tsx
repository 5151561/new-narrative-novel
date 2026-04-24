import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'

import type {
  AgentInvocationArtifactDetailRecord,
  CanonPatchArtifactDetailRecord,
  ContextPacketArtifactDetailRecord,
  LocalizedTextRecord,
  ProposalSetArtifactDetailRecord,
  ProseDraftArtifactDetailRecord,
  RunArtifactRelatedAssetRecord,
} from '../api/run-artifact-records'
import type { RunSelectedProposalVariantRecord } from '../api/run-records'

import { RunProposalVariantSelector } from './RunProposalVariantSelector'
import { RunContextAssetActivationList } from './RunContextAssetActivationList'

function t(value: LocalizedTextRecord, locale: Locale) {
  return value[locale] ?? value.en
}

function EmptyList({ title }: { title: string }) {
  return <EmptyState title={title} message="No entries are linked to this artifact." className="min-h-0" />
}

function RelatedAssets({ assets }: { assets: RunArtifactRelatedAssetRecord[] }) {
  const { locale } = useI18n()

  if (assets.length === 0) {
    return <EmptyList title={locale === 'zh-CN' ? '暂无相关资产' : 'No related assets'} />
  }

  return (
    <div className="flex flex-wrap gap-2">
      {assets.map((asset) => (
        <Badge key={asset.assetId} title={asset.assetId}>
          {t(asset.label, locale)}
        </Badge>
      ))}
    </div>
  )
}

function IdList({ ids }: { ids: string[] }) {
  if (ids.length === 0) {
    return <p className="text-sm text-text-muted">None</p>
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ids.map((id) => (
        <Badge key={id}>{id}</Badge>
      ))}
    </div>
  )
}

function SelectedVariantList({ selectedVariants }: { selectedVariants?: RunSelectedProposalVariantRecord[] }) {
  const { locale } = useI18n()

  if (!selectedVariants?.length) {
    return null
  }

  return (
    <div className="mt-3 grid gap-2">
      <p className="text-xs uppercase tracking-[0.05em] text-text-soft">
        {locale === 'zh-CN' ? 'Selected variants' : 'Selected variants'}
      </p>
      <div className="flex flex-wrap gap-2">
        {selectedVariants.map((selectedVariant, index) => (
          <Badge
            key={`${selectedVariant.proposalId}-${selectedVariant.variantId}`}
            title={`${selectedVariant.proposalId} -> ${selectedVariant.variantId}`}
          >
            {locale === 'zh-CN' ? `候选版本 ${index + 1}` : `Selected variant ${index + 1}`}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function agentRoleLabel(role: AgentInvocationArtifactDetailRecord['agentRole'], locale: Locale) {
  if (locale === 'zh-CN') {
    return role === 'scene-writer' ? '场景写作代理' : '场景规划代理'
  }

  return role === 'scene-writer' ? 'Scene writer' : 'Scene planner'
}

function invocationLabel(index: number) {
  return `Invocation ${index + 1}`
}

export function ContextPacketArtifactPanel({
  artifact,
  onOpenAssetContext,
}: {
  artifact: ContextPacketArtifactDetailRecord
  onOpenAssetContext?: (assetId: string) => void
}) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Contract" title={locale === 'zh-CN' ? '输出约束' : 'Output Contract'}>
        <FactList
          items={[
            { id: 'output-schema', label: locale === 'zh-CN' ? '输出 Schema' : 'Output schema', value: t(artifact.outputSchemaLabel, locale) },
            { id: 'token-budget', label: locale === 'zh-CN' ? 'Token 预算' : 'Token budget', value: t(artifact.tokenBudgetLabel, locale) },
          ]}
        />
      </SectionCard>
      <SectionCard eyebrow="Sections" title={locale === 'zh-CN' ? '上下文分区' : 'Sections'}>
        <div className="grid gap-2">
          {artifact.sections.map((section) => (
            <div key={section.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text-main">{t(section.title, locale)}</p>
                <Badge>{section.itemCount} items</Badge>
              </div>
              <p className="mt-1 text-sm leading-6 text-text-muted">{t(section.summary, locale)}</p>
            </div>
          ))}
        </div>
      </SectionCard>
      <RunContextAssetActivationList
        activations={artifact.assetActivations}
        summary={artifact.activationSummary}
        onOpenAssetContext={onOpenAssetContext}
      />
      <SectionCard eyebrow="Canon" title={locale === 'zh-CN' ? '已纳入 Canon 事实' : 'Included Canon Facts'}>
        {artifact.includedCanonFacts.length > 0 ? (
          <FactList items={artifact.includedCanonFacts.map((fact) => ({ id: fact.id, label: t(fact.label, locale), value: t(fact.value, locale) }))} />
        ) : (
          <EmptyList title={locale === 'zh-CN' ? '暂无 Canon 事实' : 'No canon facts'} />
        )}
      </SectionCard>
      <SectionCard eyebrow="Assets" title={locale === 'zh-CN' ? '已纳入资产与原因' : 'Included Assets And Reasons'}>
        <div className="grid gap-2">
          {artifact.includedAssets.map((asset) => (
            <div key={asset.assetId} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text-main">{t(asset.label, locale)}</p>
                <Badge>{asset.kind}</Badge>
              </div>
              <p className="mt-1 text-sm leading-6 text-text-muted">{t(asset.reason, locale)}</p>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard eyebrow="Guard" title={locale === 'zh-CN' ? '排除的私密事实与原因' : 'Excluded Private Facts And Reasons'}>
        <div className="grid gap-2">
          {artifact.excludedPrivateFacts.map((fact) => (
            <div key={fact.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <p className="text-sm font-medium text-text-main">{t(fact.label, locale)}</p>
              <p className="mt-1 text-sm leading-6 text-text-muted">{t(fact.reason, locale)}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

export function AgentInvocationArtifactPanel({ artifact }: { artifact: AgentInvocationArtifactDetailRecord }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Invocation" title={locale === 'zh-CN' ? '代理调用' : 'Agent Invocation'}>
        <FactList
          items={[
            { id: 'agent-role', label: locale === 'zh-CN' ? '代理角色' : 'Agent role', value: agentRoleLabel(artifact.agentRole, locale) },
            { id: 'model', label: locale === 'zh-CN' ? '模型标签' : 'Model label', value: t(artifact.modelLabel, locale) },
            { id: 'context-packet', label: locale === 'zh-CN' ? 'Context packet id' : 'Context packet id', value: artifact.contextPacketId ?? 'None' },
            { id: 'output-schema', label: locale === 'zh-CN' ? '输出 Schema' : 'Output schema', value: t(artifact.outputSchemaLabel, locale) },
          ]}
        />
      </SectionCard>
      <SectionCard eyebrow="Input" title={locale === 'zh-CN' ? '输入摘要' : 'Input Summary'}>
        <p className="text-sm leading-6 text-text-muted">{t(artifact.inputSummary, locale)}</p>
      </SectionCard>
      <SectionCard eyebrow="Output" title={locale === 'zh-CN' ? '输出摘要' : 'Output Summary'}>
        <p className="text-sm leading-6 text-text-muted">{t(artifact.outputSummary, locale)}</p>
      </SectionCard>
      <SectionCard eyebrow="Generated" title={locale === 'zh-CN' ? '生成引用' : 'Generated Refs'}>
        <div className="flex flex-wrap gap-2">
          {artifact.generatedRefs.map((ref) => (
            <Badge key={`${ref.kind}-${ref.id}`} title={ref.id}>
              {t(ref.label, locale)}
            </Badge>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

export function ProposalSetArtifactPanel({
  artifact,
  selectedVariants,
  onSelectProposalVariant,
}: {
  artifact: ProposalSetArtifactDetailRecord
  selectedVariants?: Record<string, string>
  onSelectProposalVariant?: (proposalId: string, variantId: string) => void
}) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Review" title={locale === 'zh-CN' ? '评审入口' : 'Editorial review'}>
        <FactList
          items={[
            { id: 'review-id', label: locale === 'zh-CN' ? 'Review id' : 'Review id', value: artifact.reviewId },
            { id: 'source-invocations', label: locale === 'zh-CN' ? 'Source invocation ids' : 'Source invocation ids', value: artifact.sourceInvocationIds.join(', ') || 'None' },
          ]}
        />
      </SectionCard>
      <SectionCard eyebrow="Proposals" title={locale === 'zh-CN' ? '候选提案' : 'Proposals'}>
        {artifact.sourceInvocationIds.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {artifact.sourceInvocationIds.map((id, index) => (
              <Badge key={id} title={id}>
                {invocationLabel(index)}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="grid gap-3">
          {artifact.proposals.map((proposal) => (
            <div key={proposal.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-text-main">{t(proposal.title, locale)}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge>{proposal.changeKind}</Badge>
                  <Badge tone="warn">{t(proposal.riskLabel, locale)}</Badge>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-text-muted">{t(proposal.summary, locale)}</p>
              <div className="mt-3">
                <RelatedAssets assets={proposal.relatedAssets} />
              </div>
              {proposal.variants?.length ? (
                <RunProposalVariantSelector
                  proposalId={proposal.id}
                  variants={proposal.variants}
                  selectedVariantId={selectedVariants?.[proposal.id] ?? proposal.selectedVariantId}
                  defaultVariantId={proposal.defaultVariantId}
                  onSelectVariant={onSelectProposalVariant}
                />
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard eyebrow="Options" title={locale === 'zh-CN' ? '评审选项' : 'Review Options'}>
        <div className="grid gap-2">
          {artifact.reviewOptions.map((option) => (
            <div key={option.decision} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <p className="text-sm font-medium text-text-main">{t(option.label, locale)}</p>
              <p className="mt-1 text-sm leading-6 text-text-muted">{t(option.description, locale)}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

export function CanonPatchArtifactPanel({ artifact }: { artifact: CanonPatchArtifactDetailRecord }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Decision" title={locale === 'zh-CN' ? '采纳决策' : 'Accepted into canon'}>
        <FactList
          items={[
            { id: 'decision', label: locale === 'zh-CN' ? '决策' : 'Decision', value: artifact.decision },
            { id: 'source-proposal-set', label: locale === 'zh-CN' ? 'Source proposal set id' : 'Source proposal set id', value: artifact.sourceProposalSetId },
            { id: 'accepted-proposals', label: locale === 'zh-CN' ? 'Accepted proposal ids' : 'Accepted proposal ids', value: artifact.acceptedProposalIds.join(', ') },
          ]}
        />
        <SelectedVariantList selectedVariants={artifact.selectedVariants} />
      </SectionCard>
      <SectionCard eyebrow="Facts" title={locale === 'zh-CN' ? '已采纳事实' : 'Accepted Facts'}>
        <div className="grid gap-3">
          {artifact.acceptedFacts.map((fact) => (
            <div key={fact.id} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <p className="text-sm font-medium text-text-main">{t(fact.label, locale)}</p>
              <p className="mt-1 text-sm leading-6 text-text-muted">{t(fact.value, locale)}</p>
              <SelectedVariantList selectedVariants={fact.selectedVariants} />
              <div className="mt-3">
                <RelatedAssets assets={fact.relatedAssets} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard eyebrow="Trace" title={locale === 'zh-CN' ? 'Trace link ids' : 'Trace link ids'}>
        <IdList ids={artifact.traceLinkIds} />
      </SectionCard>
    </div>
  )
}

export function ProseDraftArtifactPanel({ artifact }: { artifact: ProseDraftArtifactDetailRecord }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow="Sources" title={locale === 'zh-CN' ? '来源' : 'Sources'}>
        <FactList
          items={[
            { id: 'source-canon-patch', label: locale === 'zh-CN' ? 'Source canon patch id' : 'Source canon patch id', value: artifact.sourceCanonPatchId },
            { id: 'source-proposals', label: locale === 'zh-CN' ? 'Source proposal ids' : 'Source proposal ids', value: artifact.sourceProposalIds.join(', ') },
            { id: 'word-count', label: locale === 'zh-CN' ? '字数' : 'Word count', value: `${artifact.wordCount} words` },
          ]}
        />
        <SelectedVariantList selectedVariants={artifact.selectedVariants} />
      </SectionCard>
      <SectionCard eyebrow="Excerpt" title={locale === 'zh-CN' ? '正文摘录' : 'Excerpt'}>
        <p className="text-sm leading-6 text-text-main">{t(artifact.excerpt, locale)}</p>
      </SectionCard>
      <SectionCard eyebrow="Assets" title={locale === 'zh-CN' ? '相关资产' : 'Related Assets'}>
        <RelatedAssets assets={artifact.relatedAssets} />
      </SectionCard>
      <SectionCard eyebrow="Trace" title={locale === 'zh-CN' ? 'Trace link ids' : 'Trace link ids'}>
        <IdList ids={artifact.traceLinkIds} />
      </SectionCard>
    </div>
  )
}
