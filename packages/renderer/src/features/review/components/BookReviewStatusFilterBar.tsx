import { useI18n } from '@/app/i18n'
import type { BookReviewStatusFilter } from '@/features/workbench/types/workbench-route'
import type { BookReviewInboxCountsViewModel } from '@/features/review/types/review-view-models'
import { cn } from '@/lib/cn'

interface BookReviewStatusFilterBarProps {
  activeStatusFilter: BookReviewStatusFilter
  counts: BookReviewInboxCountsViewModel
  onSelectStatusFilter: (statusFilter: BookReviewStatusFilter) => void
}

interface ReviewStatusFilterItem {
  statusFilter: BookReviewStatusFilter
  label: { en: string; zh: string }
  getCount: (counts: BookReviewInboxCountsViewModel) => number
}

const BOOK_REVIEW_STATUS_FILTER_ITEMS: ReviewStatusFilterItem[] = [
  {
    statusFilter: 'open',
    label: { en: 'Open', zh: 'Open' },
    getCount: (counts) => counts.open,
  },
  {
    statusFilter: 'reviewed',
    label: { en: 'Reviewed', zh: 'Reviewed' },
    getCount: (counts) => counts.reviewed,
  },
  {
    statusFilter: 'deferred',
    label: { en: 'Deferred', zh: 'Deferred' },
    getCount: (counts) => counts.deferred,
  },
  {
    statusFilter: 'dismissed',
    label: { en: 'Dismissed', zh: 'Dismissed' },
    getCount: (counts) => counts.dismissed,
  },
  {
    statusFilter: 'all',
    label: { en: 'All', zh: 'All' },
    getCount: (counts) => counts.total,
  },
]

export function BookReviewStatusFilterBar({
  activeStatusFilter,
  counts,
  onSelectStatusFilter,
}: BookReviewStatusFilterBarProps) {
  const { locale } = useI18n()

  return (
    <div className="flex flex-wrap gap-2" aria-label={locale === 'zh-CN' ? '审阅状态筛选器' : 'Review status filters'}>
      {BOOK_REVIEW_STATUS_FILTER_ITEMS.map((item) => {
        const active = item.statusFilter === activeStatusFilter
        const label = locale === 'zh-CN' ? item.label.zh : item.label.en
        const count = item.getCount(counts)

        return (
          <button
            key={item.statusFilter}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectStatusFilter(item.statusFilter)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              active
                ? 'border-line-strong bg-surface-1 text-text-main shadow-sm'
                : 'border-line-soft bg-surface-2 text-text-muted hover:bg-surface-1 hover:text-text-main',
            )}
          >
            <span>{label}</span>
            <span className="rounded-sm bg-surface-1 px-1.5 py-0.5 text-xs text-text-soft">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
