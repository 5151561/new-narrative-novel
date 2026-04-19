import { useI18n } from '@/app/i18n'
import type { BookReviewFilter } from '@/features/workbench/types/workbench-route'
import type { BookReviewInboxCountsViewModel } from '@/features/review/types/review-view-models'
import { cn } from '@/lib/cn'

interface BookReviewFilterBarProps {
  activeFilter: BookReviewFilter
  counts: BookReviewInboxCountsViewModel
  onSelectFilter: (filter: BookReviewFilter) => void
}

interface ReviewFilterItem {
  filter: BookReviewFilter
  label: { en: string; zh: string }
  getCount: (counts: BookReviewInboxCountsViewModel) => number
}

export const BOOK_REVIEW_FILTER_ITEMS: ReviewFilterItem[] = [
  {
    filter: 'all',
    label: { en: 'All', zh: '全部' },
    getCount: (counts) => counts.total,
  },
  {
    filter: 'blockers',
    label: { en: 'Blockers', zh: '阻塞项' },
    getCount: (counts) => counts.blockers,
  },
  {
    filter: 'trace-gaps',
    label: { en: 'Trace gaps', zh: '溯源缺口' },
    getCount: (counts) => counts.traceGaps,
  },
  {
    filter: 'missing-drafts',
    label: { en: 'Missing drafts', zh: '缺稿' },
    getCount: (counts) => counts.missingDrafts,
  },
  {
    filter: 'compare-deltas',
    label: { en: 'Compare deltas', zh: 'Compare 差异' },
    getCount: (counts) => counts.compareDeltas,
  },
  {
    filter: 'export-readiness',
    label: { en: 'Export readiness', zh: '导出准备度' },
    getCount: (counts) => counts.exportReadiness,
  },
  {
    filter: 'branch-readiness',
    label: { en: 'Branch readiness', zh: '实验稿准备度' },
    getCount: (counts) => counts.branchReadiness,
  },
  {
    filter: 'scene-proposals',
    label: { en: 'Scene proposals', zh: '场景提案' },
    getCount: (counts) => counts.sceneProposals,
  },
]

export function BookReviewFilterBar({ activeFilter, counts, onSelectFilter }: BookReviewFilterBarProps) {
  const { locale } = useI18n()

  return (
    <div className="flex flex-wrap gap-2" aria-label={locale === 'zh-CN' ? '审阅筛选器' : 'Review filters'}>
      {BOOK_REVIEW_FILTER_ITEMS.map((item) => {
        const active = item.filter === activeFilter
        const label = locale === 'zh-CN' ? item.label.zh : item.label.en
        const count = item.getCount(counts)

        return (
          <button
            key={item.filter}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectFilter(item.filter)}
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
