import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'
import { useI18n } from '@/app/i18n'
import { WorkbenchBottomDockFrame } from '@/features/workbench/components/WorkbenchBottomDockFrame'

import type { ChapterDraftActivityItem } from '../hooks/useChapterDraftActivity'
import type { ChapterDraftDockSummaryItem, ChapterDraftDockSummaryViewModel } from '../types/chapter-draft-view-models'

interface ChapterDraftBottomDockProps {
  summary: ChapterDraftDockSummaryViewModel
  activity: ChapterDraftActivityItem[]
}

type ChapterDraftBottomDockTab = 'problems' | 'activity'

function SupportList({
  title,
  items,
  emptyTitle,
  emptyMessage,
}: {
  title: string
  items: ChapterDraftDockSummaryItem[]
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
          <li key={item.sceneId} className="rounded-md border border-line-soft bg-surface-2 p-3">
            <p className="font-medium text-text-main">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-text-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChapterDraftBottomDock({ summary, activity }: ChapterDraftBottomDockProps) {
  const { locale } = useI18n()
  const [activeTab, setActiveTab] = useState<ChapterDraftBottomDockTab>('problems')
  const issueCount = summary.missingDraftCount + summary.warningsCount + summary.queuedRevisionCount + summary.waitingReviewCount

  return (
    <WorkbenchBottomDockFrame
      ariaLabel={locale === 'zh-CN' ? '章节草稿底部面板' : 'Chapter draft bottom dock'}
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
          <SectionCard title={locale === 'zh-CN' ? '问题' : 'Problems'} eyebrow={locale === 'zh-CN' ? '阅读支持' : 'Reading Support'}>
            <div className="space-y-4">
              <FactList
                items={[
                  {
                    id: 'missing-draft-count',
                    label: locale === 'zh-CN' ? '缺稿场景' : 'Missing drafts',
                    value: `${summary.missingDraftCount}`,
                  },
                  {
                    id: 'warnings-count',
                    label: locale === 'zh-CN' ? '警告场景' : 'Warnings',
                    value: `${summary.warningsCount}`,
                  },
                  {
                    id: 'queued-revisions-count',
                    label: locale === 'zh-CN' ? '待处理修订' : 'Queued revisions',
                    value: `${summary.queuedRevisionCount}`,
                  },
                  {
                    id: 'waiting-review-count',
                    label: locale === 'zh-CN' ? '等待 Review' : 'Waiting review',
                    value: `${summary.waitingReviewCount}`,
                  },
                ]}
              />
              {summary.runnableScene ? (
                <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                    {locale === 'zh-CN' ? '下一场可运行' : 'Next runnable scene'}
                  </p>
                  <p className="mt-2 text-sm font-medium text-text-main">{summary.runnableScene.title}</p>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{summary.runnableScene.detail}</p>
                </div>
              ) : null}
              <SupportList
                title={locale === 'zh-CN' ? '缺稿' : 'Missing drafts'}
                items={summary.missingDraftScenes}
                emptyTitle={locale === 'zh-CN' ? '没有缺稿场景' : 'No missing drafts'}
                emptyMessage={locale === 'zh-CN' ? '当前章节的每个场景都有阅读稿。' : 'Every scene currently has draft prose.'}
              />
              <SupportList
                title={locale === 'zh-CN' ? '警告' : 'Warnings'}
                items={summary.warningScenes}
                emptyTitle={locale === 'zh-CN' ? '没有警告' : 'No warnings'}
                emptyMessage={locale === 'zh-CN' ? '当前章节没有额外警告。' : 'No warning scenes need attention right now.'}
              />
              <SupportList
                title={locale === 'zh-CN' ? '待处理修订' : 'Queued revisions'}
                items={summary.queuedRevisionScenes}
                emptyTitle={locale === 'zh-CN' ? '没有待处理修订' : 'No queued revisions'}
                emptyMessage={locale === 'zh-CN' ? '当前章节没有排队中的 prose 修订。' : 'No scene currently has queued prose revisions.'}
              />
              <SupportList
                title={locale === 'zh-CN' ? '等待 Review' : 'Waiting review'}
                items={summary.waitingReviewScenes}
                emptyTitle={locale === 'zh-CN' ? '没有等待 Review 的场景' : 'No review gates waiting'}
                emptyMessage={locale === 'zh-CN' ? '当前章节没有停在 review 的场景。' : 'No chapter scenes are currently stopped at review.'}
              />
            </div>
          </SectionCard>
        </div>
        <div hidden={activeTab !== 'activity'} aria-hidden={activeTab !== 'activity'}>
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
                      : locale === 'zh-CN'
                        ? '场景'
                        : 'Scene',
                }))}
              />
            ) : (
              <EmptyState
                title={locale === 'zh-CN' ? '会话很安静' : 'Quiet session'}
                message={
                  locale === 'zh-CN'
                    ? '进入 draft lens 或切换场景时，最近活动会在这里出现。'
                    : 'Recent draft-lens and scene focus changes will appear here.'
                }
              />
            )}
          </SectionCard>
        </div>
      </div>
    </WorkbenchBottomDockFrame>
  )
}
