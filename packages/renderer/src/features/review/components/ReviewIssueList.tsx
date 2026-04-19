import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useI18n } from '@/app/i18n'
import type { ReviewIssueGroupsViewModel, ReviewIssueSeverity, ReviewIssueViewModel } from '@/features/review/types/review-view-models'
import { cn } from '@/lib/cn'

interface ReviewIssueListProps {
  groupedIssues: ReviewIssueGroupsViewModel
  selectedIssueId: string | null
  onSelectIssue: (issueId: string) => void
}

function getSeverityBadge(severity: ReviewIssueSeverity) {
  if (severity === 'blocker') {
    return { tone: 'danger' as const, label: 'Blocker' }
  }
  if (severity === 'warning') {
    return { tone: 'warn' as const, label: 'Warning' }
  }

  return { tone: 'neutral' as const, label: 'Info' }
}

function getGroupLabel(locale: 'en' | 'zh-CN', key: keyof ReviewIssueGroupsViewModel) {
  if (locale === 'zh-CN') {
    return key === 'blockers' ? '阻塞项' : key === 'warnings' ? '警告' : '信息'
  }

  return key === 'blockers' ? 'Blockers' : key === 'warnings' ? 'Warnings' : 'Info'
}

function getFixActionBadge(status: ReviewIssueViewModel['fixAction']['status']) {
  if (status === 'started') {
    return { tone: 'accent' as const, label: 'Fix started' }
  }
  if (status === 'checked') {
    return { tone: 'success' as const, label: 'Checked' }
  }
  if (status === 'blocked') {
    return { tone: 'danger' as const, label: 'Blocked' }
  }
  if (status === 'stale') {
    return { tone: 'warn' as const, label: 'Fix stale' }
  }

  return null
}

function renderIssueRow(issue: ReviewIssueViewModel, selectedIssueId: string | null, onSelectIssue: (issueId: string) => void) {
  const active = issue.id === selectedIssueId
  const severity = getSeverityBadge(issue.severity)
  const fixActionBadge = getFixActionBadge(issue.fixAction.status)
  const decisionLabel =
    issue.decision.status === 'reviewed'
      ? 'Reviewed'
      : issue.decision.status === 'deferred'
        ? 'Deferred'
        : issue.decision.status === 'dismissed'
          ? 'Dismissed'
          : issue.decision.status === 'stale'
            ? 'Decision stale'
            : null

  return (
    <article key={issue.id} className="rounded-md border border-line-soft bg-surface-1">
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onSelectIssue(issue.id)}
        className={cn(
          'w-full rounded-md px-4 py-4 text-left transition-colors',
          active ? 'bg-surface-1 ring-1 ring-inset ring-line-strong' : 'hover:bg-surface-2',
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge tone={severity.tone}>{severity.label}</Badge>
              <Badge tone="neutral">{issue.sourceLabel}</Badge>
              {decisionLabel ? <Badge tone={issue.decision.status === 'stale' ? 'danger' : 'accent'}>{decisionLabel}</Badge> : null}
              {fixActionBadge ? <Badge tone={fixActionBadge.tone}>{fixActionBadge.label}</Badge> : null}
              {issue.decision.note ? <Badge tone="neutral">Decision note</Badge> : null}
            </div>
            <div>
              <p className="text-sm font-medium text-text-main">{issue.title}</p>
              <p className="mt-1 text-sm leading-6 text-text-muted">
                {[issue.chapterTitle, issue.sceneTitle].filter(Boolean).join(' / ') || '—'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {issue.tags.map((tag) => (
              <span
                key={`${issue.id}-${tag}`}
                className="rounded-sm bg-surface-2 px-2 py-1 text-[11px] uppercase tracking-[0.04em] text-text-soft"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>
    </article>
  )
}

export function ReviewIssueList({ groupedIssues, selectedIssueId, onSelectIssue }: ReviewIssueListProps) {
  const { locale } = useI18n()
  const entries = Object.entries(groupedIssues) as Array<[keyof ReviewIssueGroupsViewModel, ReviewIssueViewModel[]]>
  const nonEmptyEntries = entries.filter(([, issues]) => issues.length > 0)

  if (nonEmptyEntries.length === 0) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '当前筛选器下没有问题' : 'No issues in this filter'}
        message={
          locale === 'zh-CN'
            ? '这一组目前是干净的。可以切换筛选器继续审阅。'
            : 'This queue is clear for now. Choose another filter to continue the review pass.'
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {nonEmptyEntries.map(([groupKey, issues]) => (
        <section key={groupKey} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base text-text-main">{getGroupLabel(locale, groupKey)}</h3>
            <span className="text-sm text-text-soft">{issues.length}</span>
          </div>
          <div className="space-y-3">{issues.map((issue) => renderIssueRow(issue, selectedIssueId, onSelectIssue))}</div>
        </section>
      ))}
    </div>
  )
}
