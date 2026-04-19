import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'

import { useI18n } from '@/app/i18n'
import { BookReviewFilterBar } from '@/features/review/components/BookReviewFilterBar'
import { BookReviewStatusFilterBar } from '@/features/review/components/BookReviewStatusFilterBar'
import { ReviewIssueDetail } from '@/features/review/components/ReviewIssueDetail'
import { ReviewIssueList } from '@/features/review/components/ReviewIssueList'
import type { BookReviewInboxViewModel, ReviewSourceHandoffViewModel } from '@/features/review/types/review-view-models'

interface BookDraftReviewViewProps {
  inbox: BookReviewInboxViewModel | null
  errorMessage?: string | null
  decisionErrorMessage?: string | null
  onSelectFilter: (filter: BookReviewInboxViewModel['activeFilter']) => void
  onSelectStatusFilter: (statusFilter: BookReviewInboxViewModel['activeStatusFilter']) => void
  onSelectIssue: (issueId: string) => void
  onSetDecision: (input: {
    issueId: string
    issueSignature: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
  }) => void
  onClearDecision: (issueId: string) => void
  isDecisionSaving?: boolean
  onOpenReviewSource: (handoff: ReviewSourceHandoffViewModel) => void
}

export function BookDraftReviewView({
  inbox,
  errorMessage = null,
  decisionErrorMessage = null,
  onSelectFilter,
  onSelectStatusFilter,
  onSelectIssue,
  onSetDecision,
  onClearDecision,
  isDecisionSaving = false,
  onOpenReviewSource,
}: BookDraftReviewViewProps) {
  const { locale } = useI18n()

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <PaneHeader
        title={locale === 'zh-CN' ? '审阅收件箱' : 'Review inbox'}
        description={
          locale === 'zh-CN'
            ? '集中阅读 manuscript readiness、compare delta、导出阻塞与实验稿信号。'
            : 'Read manuscript readiness, compare deltas, export blockers, branch warnings, and proposal signals in one queue.'
        }
        actions={
          inbox ? (
            <>
              <Badge tone={inbox.counts.blockers > 0 ? 'danger' : 'neutral'}>
                {locale === 'zh-CN' ? `阻塞 ${inbox.counts.blockers}` : `Blockers ${inbox.counts.blockers}`}
              </Badge>
              <Badge tone={inbox.counts.warnings > 0 ? 'warn' : 'neutral'}>
                {locale === 'zh-CN' ? `警告 ${inbox.counts.warnings}` : `Warnings ${inbox.counts.warnings}`}
              </Badge>
              <Badge tone="neutral">{locale === 'zh-CN' ? `Open ${inbox.visibleOpenCount}` : `Open ${inbox.visibleOpenCount}`}</Badge>
              <Badge tone="neutral">
                {locale === 'zh-CN'
                  ? `当前章节问题 ${inbox.selectedChapterIssueCount}`
                  : `Chapter issues ${inbox.selectedChapterIssueCount}`}
              </Badge>
            </>
          ) : null
        }
      />

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div className="space-y-4">
          {inbox && errorMessage ? (
            <section className="rounded-md border border-[rgba(156,122,58,0.28)] bg-[rgba(156,122,58,0.08)] p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                {locale === 'zh-CN' ? '审阅来源不可用' : 'Review sources unavailable'}
              </p>
              <p className="mt-2 text-sm leading-6 text-text-main">{errorMessage}</p>
            </section>
          ) : null}

          {inbox && decisionErrorMessage ? (
            <section className="rounded-md border border-[rgba(156,122,58,0.28)] bg-[rgba(156,122,58,0.08)] p-4">
              <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                {locale === 'zh-CN' ? 'Review decisions unavailable' : 'Review decisions unavailable'}
              </p>
              <p className="mt-2 text-sm leading-6 text-text-main">{decisionErrorMessage}</p>
            </section>
          ) : null}

          {inbox ? (
            <div className="space-y-3">
              <BookReviewFilterBar
                activeFilter={inbox.activeFilter}
                counts={inbox.counts}
                onSelectFilter={onSelectFilter}
              />
              <BookReviewStatusFilterBar
                activeStatusFilter={inbox.activeStatusFilter}
                counts={inbox.counts}
                onSelectStatusFilter={onSelectStatusFilter}
              />
            </div>
          ) : null}

          {!inbox ? (
            <EmptyState
              title={locale === 'zh-CN' ? '审阅收件箱不可用' : 'Review inbox unavailable'}
              message={
                errorMessage ??
                (locale === 'zh-CN'
                  ? '当前还没有可读取的审阅数据。'
                  : 'The current review data is unavailable right now.')
              }
            />
          ) : inbox.filteredIssues.length === 0 ? (
            <EmptyState
              title={locale === 'zh-CN' ? '当前筛选器下没有问题' : 'No issues in this filter'}
              message={
                locale === 'zh-CN'
                  ? '这一组目前是干净的。可以切换筛选器继续审阅。'
                  : 'This queue is clear for now. Choose another filter to continue the review pass.'
              }
            />
          ) : (
            <div className="grid gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
              <section className="space-y-4">
                <div className="rounded-md border border-line-soft bg-surface-1 p-4">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                    {locale === 'zh-CN' ? '审阅队列' : 'Review queue'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">
                    {locale === 'zh-CN'
                      ? `${inbox.title} 当前共有 ${inbox.filteredIssues.length} 条可见问题。`
                      : `${inbox.title} currently shows ${inbox.filteredIssues.length} visible issues in this pass.`}
                  </p>
                </div>
                <ReviewIssueList
                  groupedIssues={inbox.groupedIssues}
                  selectedIssueId={inbox.selectedIssueId}
                  onSelectIssue={onSelectIssue}
                />
              </section>
              <ReviewIssueDetail
                issue={inbox.selectedIssue}
                isDecisionSaving={isDecisionSaving}
                onSetDecision={onSetDecision}
                onClearDecision={onClearDecision}
                onOpenHandoff={onOpenReviewSource}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
