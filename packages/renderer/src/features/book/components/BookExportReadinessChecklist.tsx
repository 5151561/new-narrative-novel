import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

import { useI18n } from '@/app/i18n'

import type { BookExportReadinessIssueViewModel } from '../types/book-export-view-models'

interface BookExportReadinessChecklistProps {
  issues: BookExportReadinessIssueViewModel[]
  onSelectChapter: (chapterId: string) => void
}

function groupLabel(locale: 'en' | 'zh-CN', severity: BookExportReadinessIssueViewModel['severity']) {
  if (locale === 'zh-CN') {
    return severity === 'blocker' ? '阻塞项' : severity === 'warning' ? '警告' : '信息'
  }

  return severity === 'blocker' ? 'Blockers' : severity === 'warning' ? 'Warnings' : 'Info'
}

function toneForSeverity(severity: BookExportReadinessIssueViewModel['severity']) {
  return severity === 'blocker' ? 'danger' : severity === 'warning' ? 'warn' : 'neutral'
}

export function BookExportReadinessChecklist({
  issues,
  onSelectChapter,
}: BookExportReadinessChecklistProps) {
  const { locale } = useI18n()
  const groups: Array<BookExportReadinessIssueViewModel['severity']> = ['blocker', 'warning', 'info']

  if (issues.length === 0) {
    return (
      <section className="rounded-md border border-line-soft bg-surface-1 p-4">
        <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '准备度清单' : 'Readiness checklist'}</h4>
        <div className="mt-4">
          <EmptyState
            title={locale === 'zh-CN' ? '当前没有额外问题' : 'No readiness issues'}
            message={locale === 'zh-CN' ? '这个导出预览当前没有额外阻塞项。' : 'This export preview currently has no extra blockers to review.'}
          />
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-md border border-line-soft bg-surface-1 p-4">
      <h4 className="text-base text-text-main">{locale === 'zh-CN' ? '准备度清单' : 'Readiness checklist'}</h4>
      <div className="mt-4 space-y-4">
        {groups.map((severity) => {
          const groupIssues = issues.filter((issue) => issue.severity === severity)
          if (groupIssues.length === 0) {
            return null
          }

          return (
            <div key={severity} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge tone={toneForSeverity(severity)}>{groupLabel(locale, severity)}</Badge>
                <span className="text-sm text-text-muted">{groupIssues.length}</span>
              </div>
              <ul className="space-y-3">
                {groupIssues.map((issue) => {
                  const label = [issue.chapterTitle, issue.sceneTitle].filter(Boolean).join(' / ')

                  return (
                    <li key={issue.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
                      {issue.chapterId ? (
                        <button
                          type="button"
                          onClick={() => onSelectChapter(issue.chapterId!)}
                          aria-label={issue.title}
                          className="w-full text-left"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-text-main">{issue.title}</p>
                              {label ? <p className="mt-1 text-sm text-text-muted">{label}</p> : null}
                              <p className="mt-2 text-sm leading-6 text-text-muted">{issue.detail}</p>
                            </div>
                            <Badge tone={toneForSeverity(issue.severity)}>{groupLabel(locale, issue.severity)}</Badge>
                          </div>
                        </button>
                      ) : (
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-main">{issue.title}</p>
                            <p className="mt-2 text-sm leading-6 text-text-muted">{issue.detail}</p>
                          </div>
                          <Badge tone={toneForSeverity(issue.severity)}>{groupLabel(locale, issue.severity)}</Badge>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}
