import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { useI18n } from '@/app/i18n'
import type { ReviewIssueSeverity, ReviewIssueViewModel, ReviewSourceHandoffViewModel } from '@/features/review/types/review-view-models'

interface ReviewIssueDetailProps {
  issue: ReviewIssueViewModel | null
  onOpenHandoff: (handoff: ReviewSourceHandoffViewModel) => void
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

export function ReviewIssueDetail({ issue, onOpenHandoff }: ReviewIssueDetailProps) {
  const { locale } = useI18n()

  if (!issue) {
    return (
      <EmptyState
        title={locale === 'zh-CN' ? '选择一个问题' : 'Choose an issue'}
        message={
          locale === 'zh-CN'
            ? '从左侧队列中选择一个问题，继续阅读详情与跳转建议。'
            : 'Choose an issue from the queue to read its detail and source handoffs.'
        }
      />
    )
  }

  const severity = getSeverityBadge(issue.severity)
  const relatedFacts = [
    issue.chapterTitle ? { id: 'chapter', label: locale === 'zh-CN' ? '章节' : 'Chapter', value: issue.chapterTitle } : null,
    issue.sceneTitle ? { id: 'scene', label: locale === 'zh-CN' ? '场景' : 'Scene', value: issue.sceneTitle } : null,
    issue.assetTitle ? { id: 'asset', label: locale === 'zh-CN' ? '资产' : 'Asset', value: issue.assetTitle } : null,
  ].filter(Boolean) as Array<{ id: string; label: string; value: string }>

  return (
    <section className="space-y-4 rounded-md border border-line-soft bg-surface-1 p-4">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone={severity.tone}>{severity.label}</Badge>
          <Badge tone="neutral">{issue.sourceLabel}</Badge>
        </div>
        <div>
          <h3 className="text-lg text-text-main">{issue.title}</h3>
          <p className="mt-2 text-sm leading-6 text-text-muted">{issue.detail}</p>
        </div>
      </div>

      <div className="space-y-2 rounded-md border border-line-soft bg-surface-2 p-4">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
          {locale === 'zh-CN' ? '建议动作' : 'Recommendation'}
        </p>
        <p className="text-sm leading-6 text-text-main">{issue.recommendation}</p>
      </div>

      <div className="space-y-2 rounded-md border border-line-soft bg-surface-2 p-4">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
          {locale === 'zh-CN' ? '来源摘录' : 'Source excerpt'}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-6 text-text-main">{issue.sourceExcerpt ?? '—'}</p>
      </div>

      {relatedFacts.length > 0 ? <FactList items={relatedFacts} /> : null}

      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
          {locale === 'zh-CN' ? '跳转动作' : 'Handoff actions'}
        </p>
        <div className="flex flex-wrap gap-2">
          {issue.handoffs.map((handoff) => (
            <button
              key={handoff.id}
              type="button"
              onClick={() => onOpenHandoff(handoff)}
              className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-main hover:bg-surface-1"
            >
              {handoff.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
