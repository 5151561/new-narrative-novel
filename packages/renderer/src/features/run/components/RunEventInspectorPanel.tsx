import { useMemo, useState } from 'react'

import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { cn } from '@/lib/cn'

import type { LocalizedTextRecord, RunArtifactDetailRecord, RunArtifactSummaryRecord } from '../api/run-artifact-records'
import type { RunTraceResponse } from '../api/run-trace-records'

import { RunArtifactInspectorPanel } from './RunArtifactInspectorPanel'
import { RunTracePanel } from './RunTracePanel'

export type RunEventInspectorMode = 'artifact' | 'trace'

export interface RunEventInspectorPanelProps {
  artifacts: RunArtifactSummaryRecord[]
  artifactsError?: Error | null
  isArtifactsLoading?: boolean
  selectedArtifactId?: string | null
  selectedArtifact?: RunArtifactDetailRecord | null
  artifactError?: Error | null
  isArtifactLoading?: boolean
  trace: RunTraceResponse | null
  traceError?: Error | null
  isTraceLoading?: boolean
  mode?: RunEventInspectorMode
  onModeChange?: (mode: RunEventInspectorMode) => void
  onSelectArtifact?: (artifactId: string) => void
  selectedVariants?: Record<string, string>
  onSelectProposalVariant?: (proposalId: string, variantId: string) => void
  onOpenAssetContext?: (assetId: string) => void
}

function t(value: LocalizedTextRecord, locale: Locale) {
  return value[locale] ?? value.en
}

function formatTokenSummary(inputTokens: number, outputTokens: number) {
  return `${new Intl.NumberFormat('en-US').format(inputTokens)} in / ${new Intl.NumberFormat('en-US').format(outputTokens)} out`
}

function formatCostSummary(estimatedCostUsd: number, actualCostUsd?: number) {
  return typeof actualCostUsd === 'number'
    ? `$${estimatedCostUsd.toFixed(4)} est. / $${actualCostUsd.toFixed(4)} actual`
    : `$${estimatedCostUsd.toFixed(4)} est.`
}

function ArtifactList({
  artifacts,
  isLoading = false,
  error = null,
  selectedArtifactId,
  onSelectArtifact,
}: {
  artifacts: RunArtifactSummaryRecord[]
  isLoading?: boolean
  error?: Error | null
  selectedArtifactId?: string | null
  onSelectArtifact?: (artifactId: string) => void
}) {
  const { locale } = useI18n()

  if (isLoading) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '正在加载运行产物' : 'Loading run artifacts'}
        message={locale === 'zh-CN' ? '正在读取这次运行的产物列表。' : 'Reading the artifact list for this run.'}
      />
    )
  }

  if (error) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '产物列表不可用' : 'Artifacts unavailable'}
        message={
          locale === 'zh-CN'
            ? '产物列表暂时无法读取。事件时间线与已选产物详情仍可继续查看。'
            : 'The artifact list could not be loaded. The event timeline and selected artifact detail remain available.'
        }
      />
    )
  }

  if (artifacts.length === 0) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '暂无运行产物' : 'No run artifacts'}
        message={locale === 'zh-CN' ? '事件引用可打开后，运行产物会出现在这里。' : 'Run artifacts will appear here once event refs resolve.'}
      />
    )
  }

  return (
    <div className="grid gap-2">
      {artifacts.map((artifact) => (
        <button
          key={artifact.id}
          type="button"
          aria-pressed={selectedArtifactId === artifact.id}
          onClick={() => onSelectArtifact?.(artifact.id)}
          className={cn(
            'rounded-md border px-3 py-3 text-left transition-colors',
            selectedArtifactId === artifact.id
              ? 'border-line-strong bg-surface-1 text-text-main shadow-ringwarm'
              : 'border-line-soft bg-surface-2 text-text-muted hover:bg-surface-1 hover:text-text-main',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium">{t(artifact.title, locale)}</span>
            <Badge>{t(artifact.statusLabel, locale)}</Badge>
          </div>
          <p className="mt-1 text-sm leading-6">{t(artifact.summary, locale)}</p>
        </button>
      ))}
    </div>
  )
}

export function RunEventInspectorPanel({
  artifacts,
  artifactsError = null,
  isArtifactsLoading = false,
  selectedArtifactId,
  selectedArtifact,
  artifactError = null,
  isArtifactLoading = false,
  trace,
  traceError = null,
  isTraceLoading = false,
  mode,
  onModeChange,
  onSelectArtifact,
  selectedVariants,
  onSelectProposalVariant,
  onOpenAssetContext,
}: RunEventInspectorPanelProps) {
  const { locale } = useI18n()
  const [internalMode, setInternalMode] = useState<RunEventInspectorMode>('artifact')
  const activeMode = mode ?? internalMode
  const selectedSummary = useMemo(
    () => artifacts.find((artifact) => artifact.id === selectedArtifactId) ?? null,
    [artifacts, selectedArtifactId],
  )
  const setMode = (nextMode: RunEventInspectorMode) => {
    if (mode === undefined) {
      setInternalMode(nextMode)
    }
    onModeChange?.(nextMode)
  }

  return (
    <section
      role="region"
      aria-label={locale === 'zh-CN' ? '运行检查器' : 'Run Inspector'}
      className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm"
    >
      <PaneHeader
        title={locale === 'zh-CN' ? '运行检查器' : 'Run Inspector'}
        description={locale === 'zh-CN' ? '审阅事件产物与来源链。' : 'Inspect event artifacts and grouped trace links.'}
      />
      <div className="flex flex-wrap gap-2 border-b border-line-soft px-4 py-3">
        {[
          { id: 'artifact' as const, label: locale === 'zh-CN' ? 'Artifact' : 'Artifact' },
          { id: 'trace' as const, label: locale === 'zh-CN' ? 'Trace' : 'Trace' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeMode === tab.id}
            onClick={() => setMode(tab.id)}
            className={cn(
              'rounded-md px-3 py-2 text-sm',
              activeMode === tab.id ? 'bg-surface-2 text-text-main shadow-ringwarm' : 'text-text-muted hover:bg-surface-2',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-app/40 p-4">
        {activeMode === 'trace' ? (
          <RunTracePanel trace={trace} isLoading={isTraceLoading} error={traceError} />
        ) : (
          <div className="grid gap-4">
            {selectedArtifact && (selectedArtifact.usage || ('failureDetail' in selectedArtifact && selectedArtifact.failureDetail)) ? (
              <SectionCard eyebrow="Support" title={locale === 'zh-CN' ? '已选产物支持摘要' : 'Selected artifact support summary'}>
                <div className="grid gap-2 text-sm leading-6 text-text-muted">
                  {'failureDetail' in selectedArtifact && selectedArtifact.failureDetail ? (
                    <>
                      <p>{selectedArtifact.failureDetail.failureClass}</p>
                      <p>{selectedArtifact.failureDetail.retryable ? (locale === 'zh-CN' ? '可重试' : 'Retryable') : (locale === 'zh-CN' ? '不可重试' : 'Not retryable')}</p>
                      <p>{selectedArtifact.failureDetail.message}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedArtifact.failureDetail.sourceEventIds.map((sourceEventId) => (
                          <Badge key={sourceEventId}>{sourceEventId}</Badge>
                        ))}
                      </div>
                    </>
                  ) : null}
                  {selectedArtifact.usage ? (
                    <>
                      <p>{formatTokenSummary(selectedArtifact.usage.inputTokens, selectedArtifact.usage.outputTokens)}</p>
                      <p>{formatCostSummary(selectedArtifact.usage.estimatedCostUsd, selectedArtifact.usage.actualCostUsd)}</p>
                    </>
                  ) : null}
                </div>
              </SectionCard>
            ) : null}
            <ArtifactList
              artifacts={artifacts}
              isLoading={isArtifactsLoading}
              error={artifactsError}
              selectedArtifactId={selectedArtifactId}
              onSelectArtifact={onSelectArtifact}
            />
            {selectedArtifactId ? (
              selectedArtifact || isArtifactLoading || artifactError ? (
                <RunArtifactInspectorPanel
                  artifact={selectedArtifact ?? null}
                  isLoading={isArtifactLoading}
                  error={artifactError}
                  selectedVariants={selectedVariants}
                  onSelectProposalVariant={onSelectProposalVariant}
                  onOpenAssetContext={onOpenAssetContext}
                />
              ) : (
                <EmptyState
                  title={locale === 'zh-CN' ? '产物详情待加载' : 'Artifact detail pending'}
                  message={
                    selectedSummary
                      ? locale === 'zh-CN'
                        ? '已选择产物，等待容器传入详情。'
                        : 'The artifact is selected and waiting for container-provided detail.'
                      : locale === 'zh-CN'
                        ? '请选择一个运行产物。'
                        : 'Select a run artifact.'
                  }
                />
              )
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
