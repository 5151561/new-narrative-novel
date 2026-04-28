import { Badge } from '@/components/ui/Badge'
import {
  getProjectRuntimeHealthStatusLabel,
  getProjectRuntimeSourceLabel,
  useI18n,
} from '@/app/i18n'
import { useDesktopModelSettingsSnapshot } from '@/features/settings/ModelSettingsProvider'

import type { ProjectRuntimeHealthStatus, ProjectRuntimeInfoRecord } from './project-runtime-info'

interface ProjectRuntimeStatusBadgeProps {
  info: ProjectRuntimeInfoRecord
  isChecking?: boolean
  onRetry?: () => void
}

const retryableStatuses = new Set<ProjectRuntimeHealthStatus>([
  'unavailable',
  'unauthorized',
  'forbidden',
  'not_found',
  'unknown',
])

const statusToneMap: Record<ProjectRuntimeHealthStatus, 'neutral' | 'accent' | 'success' | 'warn' | 'danger'> = {
  healthy: 'success',
  checking: 'neutral',
  unavailable: 'danger',
  unauthorized: 'warn',
  forbidden: 'warn',
  not_found: 'warn',
  unknown: 'warn',
}

export function ProjectRuntimeStatusBadge({
  info,
  isChecking = false,
  onRetry,
}: ProjectRuntimeStatusBadgeProps) {
  const { locale, dictionary } = useI18n()
  const modelSettingsSnapshot = useDesktopModelSettingsSnapshot()
  const visibleStatus: ProjectRuntimeHealthStatus = isChecking ? 'checking' : info.status
  const showRetry = !isChecking && retryableStatuses.has(info.status) && onRetry
  const showCapabilityLimitations = !isChecking && info.status === 'healthy'
  const capabilityLimitations = showCapabilityLimitations ? getCapabilityLimitations(info, dictionary) : []
  const projectIdentityLabel = info.projectTitle.trim() || info.projectId
  const projectBadgeLabel = getProjectBadgeLabel(info.runtimeKind, dictionary)
  const hasOpenAiBinding = Object.values(modelSettingsSnapshot?.bindings ?? {}).some((binding) => binding.provider === 'openai')
  const modelBadgeLabel = hasOpenAiBinding
    ? dictionary.shell.modelOpenAiLabel
    : dictionary.shell.modelFixtureLabel

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={dictionary.shell.projectRuntimeStatusLabel}
      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line-soft bg-surface-2/80 px-3 py-2"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span title={info.projectId} className="max-w-full truncate text-xs font-semibold text-text-main">
          {projectIdentityLabel}
        </span>
        {projectBadgeLabel ? (
          <Badge tone={info.runtimeKind === 'real-local-project' ? 'success' : 'accent'}>
            {projectBadgeLabel}
          </Badge>
        ) : null}
        <Badge tone={hasOpenAiBinding ? 'accent' : 'neutral'}>
          {modelBadgeLabel}
        </Badge>
        {modelSettingsSnapshot?.credentialStatus ? (
          <Badge tone={modelSettingsSnapshot.credentialStatus.configured ? 'success' : 'warn'}>
            {modelSettingsSnapshot.credentialStatus.configured
              ? dictionary.shell.keyConfigured
              : dictionary.shell.keyMissing}
          </Badge>
        ) : null}
        {modelSettingsSnapshot?.connectionTest.status === 'failed' ? (
          <Badge tone="danger">{dictionary.shell.testFailedLabel}</Badge>
        ) : null}
        <Badge tone={info.source === 'api' ? 'success' : 'accent'}>
          {getProjectRuntimeSourceLabel(locale, info.source)}
        </Badge>
        <Badge tone={statusToneMap[visibleStatus]}>
          {getProjectRuntimeHealthStatusLabel(locale, visibleStatus)}
        </Badge>
        {capabilityLimitations.map((limitation) => (
          <Badge key={limitation} tone="neutral">
            {limitation}
          </Badge>
        ))}
        <span className="min-w-0 flex-1 text-xs leading-5 text-text-muted">{info.summary}</span>
      </div>
      {showRetry ? (
        <button
          type="button"
          aria-label={dictionary.shell.projectRuntimeRetryLabel}
          onClick={onRetry}
          className="rounded-md border border-line-soft px-2 py-1 text-xs font-medium text-text-main transition hover:bg-surface-1"
        >
          {dictionary.shell.projectRuntimeRetry}
        </button>
      ) : null}
    </div>
  )
}

function getCapabilityLimitations(
  info: ProjectRuntimeInfoRecord,
  dictionary: ReturnType<typeof useI18n>['dictionary'],
) {
  const limitations: string[] = []

  if (info.capabilities.read && !info.capabilities.write) {
    limitations.push(dictionary.shell.projectRuntimeReadOnly)
  }

  if (!info.capabilities.runEvents) {
    limitations.push(dictionary.shell.projectRuntimeNoRunEvents)
  }

  if (!info.capabilities.reviewDecisions) {
    limitations.push(dictionary.shell.projectRuntimeNoReviewDecisions)
  }

  return limitations
}

function getProjectBadgeLabel(
  runtimeKind: ProjectRuntimeInfoRecord['runtimeKind'],
  dictionary: ReturnType<typeof useI18n>['dictionary'],
) {
  if (runtimeKind === 'real-local-project') {
    return dictionary.shell.realProjectLabel
  }

  if (runtimeKind === 'fixture-demo') {
    return dictionary.shell.demoFixtureProjectLabel
  }

  return undefined
}
