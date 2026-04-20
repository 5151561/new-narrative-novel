import { Badge } from '@/components/ui/Badge'
import { FactList } from '@/components/ui/FactList'

import { useI18n } from '@/app/i18n'

import type { BookExportArtifactGateReasonViewModel, BookExportArtifactGateViewModel } from '../types/book-export-artifact-view-models'

export interface BookExportArtifactGateProps {
  gate: BookExportArtifactGateViewModel
}

function statusMeta(locale: 'en' | 'zh-CN', status: BookExportArtifactGateViewModel['status']) {
  if (status === 'blocked') {
    return { tone: 'danger' as const, label: locale === 'zh-CN' ? '阻塞' : 'Blocked' }
  }
  if (status === 'attention') {
    return { tone: 'warn' as const, label: locale === 'zh-CN' ? '需关注' : 'Attention' }
  }

  return { tone: 'success' as const, label: locale === 'zh-CN' ? '已就绪' : 'Ready' }
}

function sourceLabel(locale: 'en' | 'zh-CN', source: BookExportArtifactGateReasonViewModel['source']) {
  if (source === 'export-readiness') {
    return locale === 'zh-CN' ? '导出准备度' : 'Export readiness'
  }

  return locale === 'zh-CN' ? 'Review 阻塞项' : 'Review blocker'
}

function reasonTone(severity: BookExportArtifactGateReasonViewModel['severity']) {
  return severity === 'blocker' ? 'danger' : 'warn'
}

export function BookExportArtifactGate({ gate }: BookExportArtifactGateProps) {
  const { locale } = useI18n()
  const status = statusMeta(locale, gate.status)
  const fixCounts = [
    {
      id: 'checked-fixes',
      label: locale === 'zh-CN' ? '已检查 fix' : 'Checked fixes',
      value: `${gate.checkedFixCount}`,
      visible: gate.checkedFixCount > 0,
    },
    {
      id: 'blocked-fixes',
      label: locale === 'zh-CN' ? '受阻 fix' : 'Blocked fixes',
      value: `${gate.blockedFixCount}`,
      visible: gate.blockedFixCount > 0,
    },
    {
      id: 'stale-fixes',
      label: locale === 'zh-CN' ? '过期 fix' : 'Stale fixes',
      value: `${gate.staleFixCount}`,
      visible: gate.staleFixCount > 0,
    },
  ].filter((item) => item.visible)

  return (
    <section className="rounded-md border border-line-soft bg-surface-1 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-base text-text-main">{locale === 'zh-CN' ? 'Artifact gate' : 'Artifact gate'}</h4>
          <p className="mt-1 text-sm leading-6 text-text-muted">{gate.label}</p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      {gate.checkedFixCount > 0 ? (
        <p className="mt-3 rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm leading-6 text-text-muted">
          {locale === 'zh-CN'
            ? '已检查的 source-fix action 还不等于已解决，仍需要 review decision。'
            : 'Checked source-fix actions are not resolved yet.'}
        </p>
      ) : null}

      {fixCounts.length > 0 ? (
        <div className="mt-3">
          <FactList items={fixCounts.map(({ id, label, value }) => ({ id, label, value }))} />
        </div>
      ) : null}

      {gate.reasons.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {gate.reasons.map((reason) => (
            <li key={reason.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-main">{reason.title}</p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{reason.detail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={reasonTone(reason.severity)}>
                    {reason.severity === 'blocker'
                      ? locale === 'zh-CN'
                        ? '阻塞'
                        : 'Blocker'
                      : locale === 'zh-CN'
                        ? '警告'
                        : 'Warning'}
                  </Badge>
                  <Badge tone="neutral">{sourceLabel(locale, reason.source)}</Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-text-muted">{locale === 'zh-CN' ? '没有 artifact 阻塞项。' : 'No artifact blockers'}</p>
      )}
    </section>
  )
}
