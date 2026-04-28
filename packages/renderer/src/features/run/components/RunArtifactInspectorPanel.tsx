import { useI18n } from '@/app/i18n'
import { FactList } from '@/components/ui/FactList'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'

import type { RunArtifactDetailRecord } from '../api/run-artifact-records'

import {
  AgentInvocationArtifactPanel,
  CanonPatchArtifactPanel,
  ContextPacketArtifactPanel,
  ProposalSetArtifactPanel,
  ProseDraftArtifactPanel,
} from './RunArtifactDetailSections'

function formatTokenSummary(inputTokens: number, outputTokens: number) {
  return `${new Intl.NumberFormat('en-US').format(inputTokens)} in / ${new Intl.NumberFormat('en-US').format(outputTokens)} out`
}

function formatCostSummary(estimatedCostUsd: number, actualCostUsd?: number) {
  return typeof actualCostUsd === 'number'
    ? `$${estimatedCostUsd.toFixed(4)} est. / $${actualCostUsd.toFixed(4)} actual`
    : `$${estimatedCostUsd.toFixed(4)} est.`
}

export interface RunArtifactInspectorPanelProps {
  artifact: RunArtifactDetailRecord | null
  isLoading?: boolean
  error?: Error | null
  selectedVariants?: Record<string, string>
  onSelectProposalVariant?: (proposalId: string, variantId: string) => void
  onOpenAssetContext?: (assetId: string) => void
}

export function RunArtifactInspectorPanel({
  artifact,
  isLoading = false,
  error = null,
  selectedVariants,
  onSelectProposalVariant,
  onOpenAssetContext,
}: RunArtifactInspectorPanelProps) {
  const { locale } = useI18n()

  if (isLoading) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
        <PaneHeader title={locale === 'zh-CN' ? 'Artifact 详情' : 'Artifact Detail'} description={locale === 'zh-CN' ? '正在读取运行产物。' : 'Loading the selected run artifact.'} />
        <div className="p-4">
          <EmptyState title={locale === 'zh-CN' ? '正在加载产物' : 'Loading artifact'} message={locale === 'zh-CN' ? '正在读取结构化产物详情。' : 'Reading structured artifact detail.'} />
        </div>
      </section>
    )
  }

  if (error || !artifact) {
    return (
      <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
        <PaneHeader title={locale === 'zh-CN' ? 'Artifact 详情' : 'Artifact Detail'} description={locale === 'zh-CN' ? '选择运行产物后在这里审阅。' : 'Select a run artifact to inspect it here.'} />
        <div className="p-4">
          <EmptyState
            title={locale === 'zh-CN' ? '找不到产物' : 'Artifact not found'}
            message={
              locale === 'zh-CN'
                ? '所选运行产物已不再属于这次运行。'
                : 'The selected run artifact is no longer available for this run.'
            }
          />
        </div>
      </section>
    )
  }

  const title = artifact.title[locale] ?? artifact.title.en
  const summary = artifact.summary[locale] ?? artifact.summary.en

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
      <PaneHeader title={title} description={summary} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {artifact.usage || ('failureDetail' in artifact && artifact.failureDetail) ? (
          <div className="grid gap-4 p-4 pb-0">
            {artifact.usage ? (
              <SectionCard eyebrow="Usage" title={locale === 'zh-CN' ? '令牌与成本' : 'Token and cost summary'}>
                <FactList
                  items={[
                    {
                      id: 'usage-tokens',
                      label: locale === 'zh-CN' ? '令牌' : 'Tokens',
                      value: formatTokenSummary(artifact.usage.inputTokens, artifact.usage.outputTokens),
                    },
                    {
                      id: 'usage-cost',
                      label: locale === 'zh-CN' ? '成本' : 'Cost',
                      value: formatCostSummary(artifact.usage.estimatedCostUsd, artifact.usage.actualCostUsd),
                    },
                    {
                      id: 'usage-provider',
                      label: locale === 'zh-CN' ? 'Provider / 模型' : 'Provider / model',
                      value: `${artifact.usage.provider} / ${artifact.usage.modelId}`,
                    },
                  ]}
                />
              </SectionCard>
            ) : null}
            {'failureDetail' in artifact && artifact.failureDetail ? (
              <SectionCard eyebrow="Failure" title={locale === 'zh-CN' ? '失败详情' : 'Failure detail'}>
                <div className="grid gap-3">
                  <FactList
                    items={[
                      {
                        id: 'failure-class',
                        label: locale === 'zh-CN' ? '失败分类' : 'Failure class',
                        value: artifact.failureDetail.failureClass,
                      },
                      {
                        id: 'failure-retryable',
                        label: locale === 'zh-CN' ? '可重试' : 'Retryable',
                        value: locale === 'zh-CN'
                          ? artifact.failureDetail.retryable ? '是' : '否'
                          : artifact.failureDetail.retryable ? 'Yes' : 'No',
                      },
                    ]}
                  />
                  <p className="text-sm leading-6 text-text-muted">{artifact.failureDetail.message}</p>
                  <p className="text-sm leading-6 text-text-muted">
                    {artifact.failureDetail.retryable
                      ? locale === 'zh-CN'
                        ? '确认来源事件和运行预算后，可以从支持区触发重试或恢复。'
                        : 'After checking source events and budget, you can retry or resume from the support surfaces.'
                      : locale === 'zh-CN'
                        ? '在启动新运行前，先检查来源事件。'
                        : 'Check the source events before starting a new run.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {artifact.failureDetail.sourceEventIds.map((sourceEventId) => (
                      <span key={sourceEventId} className="inline-flex rounded-md border border-line-soft bg-surface-2 px-2 py-1 text-xs text-text-muted">
                        {sourceEventId}
                      </span>
                    ))}
                  </div>
                </div>
              </SectionCard>
            ) : null}
          </div>
        ) : null}
        {artifact.kind === 'context-packet' ? (
          <ContextPacketArtifactPanel artifact={artifact} onOpenAssetContext={onOpenAssetContext} />
        ) : null}
        {artifact.kind === 'agent-invocation' ? <AgentInvocationArtifactPanel artifact={artifact} /> : null}
        {artifact.kind === 'proposal-set' ? (
          <ProposalSetArtifactPanel
            artifact={artifact}
            selectedVariants={selectedVariants}
            onSelectProposalVariant={onSelectProposalVariant}
          />
        ) : null}
        {artifact.kind === 'canon-patch' ? <CanonPatchArtifactPanel artifact={artifact} /> : null}
        {artifact.kind === 'prose-draft' ? <ProseDraftArtifactPanel artifact={artifact} /> : null}
      </div>
    </section>
  )
}
