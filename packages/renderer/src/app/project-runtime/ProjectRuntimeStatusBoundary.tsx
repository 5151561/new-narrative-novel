import { useI18n } from '@/app/i18n'

import { ProjectRuntimeStatusBadge } from './ProjectRuntimeStatusBadge'
import type { ProjectRuntimeHealthStatus } from './project-runtime-info'
import { useProjectRuntimeHealthQuery } from './useProjectRuntimeHealthQuery'

const degradedStatuses = new Set<ProjectRuntimeHealthStatus>([
  'unavailable',
  'unauthorized',
  'forbidden',
  'not_found',
  'unknown',
])

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
      {showDegradedHint ? (
        <p className="px-1 text-xs leading-5 text-text-muted">{dictionary.shell.projectRuntimeDegradedHint}</p>
      ) : null}
    </div>
  )
}
