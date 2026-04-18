import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import { useI18n } from '@/app/i18n'
import type { BookWorkbenchActivityItem } from '../hooks/useBookWorkbenchActivity'
import type { BookDraftDockSummaryItem, BookDraftDockSummaryViewModel } from '../types/book-draft-view-models'

interface BookDraftBottomDockProps {
  summary: BookDraftDockSummaryViewModel
  activity: BookWorkbenchActivityItem[]
}

function SupportList({
  title,
  items,
  emptyTitle,
  emptyMessage,
}: {
  title: string
  items: BookDraftDockSummaryItem[]
  emptyTitle: string
  emptyMessage: string
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">{title}</p>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.chapterId} className="rounded-md border border-line-soft bg-surface-2 p-3">
            <p className="font-medium text-text-main">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-text-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BookDraftBottomDock({ summary, activity }: BookDraftBottomDockProps) {
  const { locale } = useI18n()

  return (
    <section
      aria-label={locale === 'zh-CN' ? '书籍草稿底部面板' : 'Book draft bottom dock'}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <PaneHeader
        title={locale === 'zh-CN' ? '问题 / 活动' : 'Problems / Activity'}
        description={
          locale === 'zh-CN'
            ? '底部面板继续只承接书籍级判断支持和会话活动，不复制主阅读区。'
            : 'The dock keeps book-level judgment support and session activity close without duplicating the manuscript reader.'
        }
      />
      <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SectionCard title={locale === 'zh-CN' ? '问题' : 'Problems'} eyebrow={locale === 'zh-CN' ? '阅读支持' : 'Reading Support'}>
          <div className="space-y-4">
            <FactList
              items={[
                { id: 'missing-draft-count', label: locale === 'zh-CN' ? '缺稿章节' : 'Missing draft chapters', value: `${summary.missingDraftChapterCount}` },
                { id: 'missing-trace-count', label: locale === 'zh-CN' ? '缺溯源章节' : 'Missing trace chapters', value: `${summary.missingTraceChapterCount}` },
                { id: 'warnings-count', label: locale === 'zh-CN' ? '警告章节' : 'Warning chapters', value: `${summary.warningsChapterCount}` },
                { id: 'queued-count', label: locale === 'zh-CN' ? '待处理修订章节' : 'Queued revision chapters', value: `${summary.queuedRevisionChapterCount}` },
              ]}
            />
            <SupportList
              title={locale === 'zh-CN' ? '缺稿' : 'Missing drafts'}
              items={summary.missingDraftChapters}
              emptyTitle={locale === 'zh-CN' ? '没有缺稿章节' : 'No missing draft chapters'}
              emptyMessage={locale === 'zh-CN' ? '当前每个章节都有可读正文。' : 'Every chapter currently has readable draft prose.'}
            />
            <SupportList
              title={locale === 'zh-CN' ? '缺溯源' : 'Missing trace'}
              items={summary.missingTraceChapters}
              emptyTitle={locale === 'zh-CN' ? '没有缺溯源章节' : 'No missing trace chapters'}
              emptyMessage={locale === 'zh-CN' ? '当前每个章节都已有 trace rollup。' : 'Every chapter currently has a trace rollup.'}
            />
            <SupportList
              title={locale === 'zh-CN' ? '高压章节' : 'Highest pressure'}
              items={summary.highestPressureChapters}
              emptyTitle={locale === 'zh-CN' ? '当前没有高压章节' : 'No high-pressure chapters'}
              emptyMessage={locale === 'zh-CN' ? '当前阅读轮次比较平稳。' : 'The current manuscript pass is relatively calm.'}
            />
          </div>
        </SectionCard>
        <SectionCard title={locale === 'zh-CN' ? '活动' : 'Activity'} eyebrow={locale === 'zh-CN' ? '会话日志' : 'Session Log'}>
          {activity.length > 0 ? (
            <TimelineList
              items={activity.map((item) => ({
                id: item.id,
                title: item.title,
                detail: item.detail,
                tone: item.tone,
                meta:
                  item.kind === 'lens'
                    ? locale === 'zh-CN'
                      ? 'Lens'
                      : 'Lens'
                    : item.kind === 'chapter'
                      ? locale === 'zh-CN'
                        ? '章节'
                        : 'Chapter'
                      : locale === 'zh-CN'
                        ? '跳转'
                        : 'Handoff',
              }))}
            />
          ) : (
            <EmptyState
              title={locale === 'zh-CN' ? '会话很安静' : 'Quiet session'}
              message={
                locale === 'zh-CN'
                  ? '进入 draft lens、聚焦章节或发起 handoff 后，最近活动会在这里出现。'
                  : 'Recent draft-lens entries, chapter focus changes, and handoffs will appear here.'
              }
            />
          )}
        </SectionCard>
      </div>
    </section>
  )
}
