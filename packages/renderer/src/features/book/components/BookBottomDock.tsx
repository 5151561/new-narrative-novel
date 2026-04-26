import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import { useI18n } from '@/app/i18n'
import { WorkbenchBottomDockFrame } from '@/features/workbench/components/WorkbenchBottomDockFrame'
import type { BookStructureDockSummaryViewModel } from '../types/book-view-models'
import type { BookWorkbenchActivityItem } from '../hooks/useBookWorkbenchActivity'

interface BookBottomDockProps {
  summary: BookStructureDockSummaryViewModel
  activity: BookWorkbenchActivityItem[]
}

type BookBottomDockTab = 'problems' | 'activity'

export function BookBottomDock({ summary, activity }: BookBottomDockProps) {
  const { locale } = useI18n()
  const [activeTab, setActiveTab] = useState<BookBottomDockTab>('problems')
  const timelineItems = activity.map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    meta:
      item.kind === 'view'
        ? locale === 'zh-CN'
          ? '视图'
          : 'View'
        : item.kind === 'chapter'
          ? locale === 'zh-CN'
            ? '章节'
            : 'Chapter'
          : locale === 'zh-CN'
            ? '跳转'
            : 'Handoff',
    tone: item.tone,
  }))

  const issueCount = summary.unresolvedCount + summary.missingDraftCount + summary.missingTraceSceneCount

  return (
    <WorkbenchBottomDockFrame
      ariaLabel={locale === 'zh-CN' ? '书籍底部面板' : 'Book bottom dock'}
      tabs={[
        {
          id: 'problems',
          label: locale === 'zh-CN' ? '问题' : 'Problems',
          badge: issueCount,
          tone: issueCount > 0 ? 'warn' : 'success',
        },
        {
          id: 'activity',
          label: locale === 'zh-CN' ? '活动' : 'Activity',
          badge: activity.length,
        },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      <div className="p-4">
        <div hidden={activeTab !== 'problems'} aria-hidden={activeTab !== 'problems'}>
          <SectionCard title={locale === 'zh-CN' ? '问题' : 'Problems'} eyebrow={locale === 'zh-CN' ? '判断支持' : 'Judgment Support'}>
            <div className="space-y-4">
              <FactList
                items={[
                  {
                    id: 'selected-chapter',
                    label: locale === 'zh-CN' ? '当前章节' : 'Selected chapter',
                    value: summary.selectedChapter?.title ?? (locale === 'zh-CN' ? '未选中' : 'Not selected'),
                  },
                  {
                    id: 'unresolved',
                    label: locale === 'zh-CN' ? '总未决' : 'Total unresolved',
                    value: `${summary.unresolvedCount}`,
                  },
                  {
                    id: 'missing-draft',
                    label: locale === 'zh-CN' ? '缺正文' : 'Missing draft',
                    value: `${summary.missingDraftCount}`,
                  },
                  {
                    id: 'missing-trace',
                    label: locale === 'zh-CN' ? '缺溯源' : 'Missing trace',
                    value: `${summary.missingTraceSceneCount}`,
                  },
                ]}
              />
              {summary.problemItems.length > 0 ? (
                <ul className="space-y-3">
                  {summary.problemItems.map((item) => (
                    <li key={`${item.chapterId}-${item.kind}`} className="rounded-md border border-line-soft bg-surface-2 p-3">
                      <p className="font-medium text-text-main">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-text-muted">{item.detail}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.05em] text-text-soft">{item.chapterId}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title={locale === 'zh-CN' ? '还没有风险摘要' : 'No risk summaries'}
                  message={
                    locale === 'zh-CN'
                      ? '当章节级问题、缺正文或缺溯源出现时，会在这里保持聚合摘要。'
                      : 'Chapter-level problems, missing drafts, and missing trace rollups will stay summarized here.'
                  }
                />
              )}
            </div>
          </SectionCard>
        </div>
        <div hidden={activeTab !== 'activity'} aria-hidden={activeTab !== 'activity'}>
          <SectionCard title={locale === 'zh-CN' ? '活动' : 'Activity'} eyebrow={locale === 'zh-CN' ? '会话日志' : 'Session Log'}>
            {timelineItems.length > 0 ? (
              <TimelineList items={timelineItems} />
            ) : (
              <EmptyState
                title={locale === 'zh-CN' ? '会话很安静' : 'Quiet session'}
                message={
                  locale === 'zh-CN'
                    ? '切换视图、聚焦章节或发起 handoff 之后，最近活动会出现在这里。'
                    : 'Recent view changes, chapter focus changes, and handoffs will appear here during this session.'
                }
              />
            )}
          </SectionCard>
        </div>
      </div>
    </WorkbenchBottomDockFrame>
  )
}
