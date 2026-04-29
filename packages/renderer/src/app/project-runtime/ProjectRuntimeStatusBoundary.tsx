import { useI18n } from '@/app/i18n'

import { ProjectRuntimeStatusBadge } from './ProjectRuntimeStatusBadge'
import type { ProjectRuntimeHealthStatus, ProjectRuntimeRecoveryNotice } from './project-runtime-info'
import { useProjectRuntimeHealthQuery } from './useProjectRuntimeHealthQuery'

const degradedStatuses = new Set<ProjectRuntimeHealthStatus>([
  'unavailable',
  'unauthorized',
  'forbidden',
  'not_found',
  'unknown',
])

function RecoveryNoticeBanner({ notice }: { notice: ProjectRuntimeRecoveryNotice }) {
  const { locale } = useI18n()

  if (!notice.recovered) {
    return null
  }

  return (
    <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-2">
      <p className="text-xs font-medium text-text-main">
        {locale === 'zh-CN'
          ? '项目已从备份中恢复'
          : 'Project recovered from backup'}
      </p>
      {notice.recoveredFrom ? (
        <p className="mt-1 text-[11px] leading-4 text-text-muted">
          {locale === 'zh-CN'
            ? `恢复自: ${notice.recoveredFrom}`
            : `Recovered from: ${notice.recoveredFrom}`}
        </p>
      ) : null}
      {notice.brokenFileMovedTo ? (
        <p className="mt-1 text-[11px] leading-4 text-text-muted">
          {locale === 'zh-CN'
            ? `损坏文件已移至: ${notice.brokenFileMovedTo}`
            : `Broken file moved to: ${notice.brokenFileMovedTo}`}
        </p>
      ) : null}
    </div>
  )
}

export function ProjectRuntimeStatusBoundary() {
  const { dictionary } = useI18n()
  const { info, isChecking, refetch } = useProjectRuntimeHealthQuery()
  const showDegradedHint = degradedStatuses.has(info.status)

  return (
    <div className="max-w-[560px] space-y-1">
      <ProjectRuntimeStatusBadge
        info={info}
        isChecking={isChecking}
        onRetry={showDegradedHint ? () => void refetch() : undefined}
      />
      {info.recoveryNotice?.recovered ? (
        <RecoveryNoticeBanner notice={info.recoveryNotice} />
      ) : null}
      {showDegradedHint ? (
        <p className="px-1 text-xs leading-5 text-text-muted">{dictionary.shell.projectRuntimeDegradedHint}</p>
      ) : null}
    </div>
  )
}
