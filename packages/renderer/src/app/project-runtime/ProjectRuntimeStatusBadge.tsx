import { Badge } from '@/components/ui/Badge'
import {
  getProjectRuntimeHealthStatusLabel,
  getProjectRuntimeSourceLabel,
  useI18n,
} from '@/app/i18n'
import {
  useDesktopModelSettingsSnapshot,
  useOptionalModelSettingsController,
  type DesktopModelBindingRole,
} from '@/features/settings/ModelSettingsProvider'

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

const requiredRealProjectRoles: DesktopModelBindingRole[] = ['planner', 'sceneProseWriter']

export function ProjectRuntimeStatusBadge({
  info,
  isChecking = false,
  onRetry,
}: ProjectRuntimeStatusBadgeProps) {
  const { locale, dictionary } = useI18n()
  const modelSettingsController = useOptionalModelSettingsController()
  const modelSettingsSnapshot = useDesktopModelSettingsSnapshot()
  const visibleStatus: ProjectRuntimeHealthStatus = isChecking ? 'checking' : info.status
  const showRetry = !isChecking && retryableStatuses.has(info.status) && onRetry
  const showCapabilityLimitations = !isChecking && info.status === 'healthy'
  const capabilityLimitations = showCapabilityLimitations ? getCapabilityLimitations(info, dictionary) : []
  const projectIdentityLabel = info.projectTitle.trim() || info.projectId
  const runtimeIsRealProject = info.projectMode === 'real-project'
  const projectBadgeLabel = getProjectBadgeLabel(info, dictionary, locale)
  const modelAssessment = getModelAssessment({
    info,
    snapshot: modelSettingsSnapshot,
    isModelSettingsLoading: Boolean(modelSettingsController?.supported && modelSettingsController.loading && !modelSettingsSnapshot),
    dictionary,
    locale,
  })
  const showModelSettingsRepair = runtimeIsRealProject
    && Boolean(modelSettingsController?.supported)
    && modelAssessment.needsAttention

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
          <Badge tone={runtimeIsRealProject ? 'success' : 'accent'}>
            {projectBadgeLabel}
          </Badge>
        ) : null}
        <Badge tone={modelAssessment.providerTone}>
          {modelAssessment.providerLabel}
        </Badge>
        <Badge tone={modelAssessment.statusTone}>
          {modelAssessment.statusLabel}
        </Badge>
        {modelAssessment.hasFailedConnection ? (
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
      <div className="flex items-center gap-2">
        {showModelSettingsRepair ? (
          <button
            type="button"
            aria-label={dictionary.shell.openModelSettings}
            onClick={() => modelSettingsController?.setOpen(true)}
            className="rounded-md border border-line-soft px-2 py-1 text-xs font-medium text-text-main transition hover:bg-surface-1"
          >
            {dictionary.shell.openModelSettings}
          </button>
        ) : null}
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
  info: ProjectRuntimeInfoRecord,
  dictionary: ReturnType<typeof useI18n>['dictionary'],
  locale: ReturnType<typeof useI18n>['locale'],
) {
  if (info.projectMode === 'real-project') {
    return dictionary.shell.realProjectLabel
  }

  if (info.runtimeKind === 'mock-storybook') {
    return dictionary.shell.mockStorybookProjectLabel
  }

  return locale === 'zh-CN' ? '演示项目' : 'Demo Project'
}

function getModelAssessment({
  info,
  snapshot,
  isModelSettingsLoading,
  dictionary,
  locale,
}: {
  info: ProjectRuntimeInfoRecord
  snapshot: ReturnType<typeof useDesktopModelSettingsSnapshot>
  isModelSettingsLoading: boolean
  dictionary: ReturnType<typeof useI18n>['dictionary']
  locale: ReturnType<typeof useI18n>['locale']
}) {
  const runtimeIsRealProject = info.projectMode === 'real-project'
  if (!runtimeIsRealProject) {
    return {
      providerLabel: dictionary.shell.modelFixtureLabel,
      providerTone: 'neutral' as const,
      statusLabel: locale === 'zh-CN' ? '演示 Fixture 已就绪' : 'Fixture Ready',
      statusTone: 'success' as const,
      needsAttention: false,
      hasFailedConnection: false,
    }
  }

  if (isModelSettingsLoading) {
    return {
      providerLabel: locale === 'zh-CN'
        ? `${dictionary.shell.modelProviderLabel} 读取中`
        : `${dictionary.shell.modelProviderLabel} Loading`,
      providerTone: 'neutral' as const,
      statusLabel: locale === 'zh-CN' ? '模型设置读取中' : 'Loading Model Settings',
      statusTone: 'neutral' as const,
      needsAttention: true,
      hasFailedConnection: false,
    }
  }

  const requiredBindings = snapshot
    ? requiredRealProjectRoles.map((role) => snapshot.bindings[role])
    : []
  const configuredProviderIds = new Set(
    snapshot?.credentialStatuses.filter((status) => status.configured).map((status) => status.providerId) ?? [],
  )
  const providerLabels = getBoundProviders(snapshot)
  const hasFixtureBinding = requiredBindings.some((binding) => binding.provider === 'fixture')
  const hasMissingModelId = requiredBindings.some((binding) => (
    binding.provider === 'openai-compatible' && !binding.modelId?.trim()
  ))
  const hasUnknownProviderBinding = requiredBindings.some((binding) => (
    binding.provider === 'openai-compatible'
      && !snapshot?.providers.some((provider) => provider.id === binding.providerId)
  ))
  const hasMissingCredential = requiredBindings.some((binding) => (
    binding.provider === 'openai-compatible' && !configuredProviderIds.has(binding.providerId)
  ))
  const hasFailedConnection = snapshot?.connectionTest.status === 'failed'
  const needsAttention = runtimeIsRealProject && (
    !info.modelBindings.usable
    || hasFixtureBinding
    || hasMissingModelId
    || hasUnknownProviderBinding
    || hasMissingCredential
    || hasFailedConnection
  )

  return {
    providerLabel: providerLabels[0]
      ? `${dictionary.shell.modelProviderLabel} ${providerLabels.join(', ')}`
      : locale === 'zh-CN'
        ? `${dictionary.shell.modelProviderLabel} 未配置`
        : `${dictionary.shell.modelProviderLabel} Not configured`,
    providerTone: providerLabels[0] ? 'accent' as const : 'warn' as const,
    statusLabel: needsAttention
      ? locale === 'zh-CN' ? '模型设置待修复' : 'Model Settings Needed'
      : locale === 'zh-CN' ? '模型已就绪' : 'Model Ready',
    statusTone: needsAttention ? 'warn' as const : 'success' as const,
    needsAttention,
    hasFailedConnection,
  }
}

function getBoundProviders(snapshot: ReturnType<typeof useDesktopModelSettingsSnapshot>) {
  if (!snapshot) {
    return []
  }

  const labels = new Map(snapshot.providers.map((provider) => [provider.id, provider.label]))
  const providerIds = new Set(
    requiredRealProjectRoles
      .map((role) => snapshot.bindings[role])
      .filter((binding) => binding.provider === 'openai-compatible')
      .map((binding) => binding.providerId),
  )

  return Array.from(providerIds).map((providerId) => labels.get(providerId) ?? providerId)
}
