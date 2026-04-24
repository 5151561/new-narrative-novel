import { useEffect, useMemo, useState } from 'react'

import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { cn } from '@/lib/cn'

import type { LocalizedTextRecord, RunArtifactDetailRecord, RunArtifactSummaryRecord } from '../api/run-artifact-records'
import type { RunTraceResponse } from '../api/run-trace-records'

import { RunArtifactInspectorPanel } from './RunArtifactInspectorPanel'
import { RunTracePanel } from './RunTracePanel'

export type RunEventInspectorMode = 'artifact' | 'trace'

export interface RunEventInspectorPanelProps {
  artifacts: RunArtifactSummaryRecord[]
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
}

function t(value: LocalizedTextRecord, locale: Locale) {
  return value[locale] ?? value.en
}

function ArtifactList({
  artifacts,
  selectedArtifactId,
  onSelectArtifact,
}: {
  artifacts: RunArtifactSummaryRecord[]
  selectedArtifactId?: string | null
  onSelectArtifact?: (artifactId: string) => void
}) {
  const { locale } = useI18n()

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

  useEffect(() => {
    if (selectedArtifactId && activeMode !== 'artifact') {
      setMode('artifact')
    }
  }, [activeMode, selectedArtifactId])

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-md border border-line-soft bg-surface-1 shadow-ringwarm">
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
        ) : selectedArtifactId ? (
          selectedArtifact || isArtifactLoading || artifactError ? (
            <RunArtifactInspectorPanel artifact={selectedArtifact ?? null} isLoading={isArtifactLoading} error={artifactError} />
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
        ) : (
          <ArtifactList artifacts={artifacts} selectedArtifactId={selectedArtifactId} onSelectArtifact={onSelectArtifact} />
        )}
      </div>
    </section>
  )
}
