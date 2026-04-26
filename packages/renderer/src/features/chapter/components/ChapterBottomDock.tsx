import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import { useI18n } from '@/app/i18n'
import { WorkbenchBottomDockFrame } from '@/features/workbench/components/WorkbenchBottomDockFrame'
import type { ChapterWorkbenchActivityItem } from '../hooks/useChapterWorkbenchActivity'

interface ChapterBottomDockSelectedScene {
  title: string
  summary: string
  unresolvedLabel: string
}

interface ChapterBottomDockListItem {
  id: string
  label: string
  detail: string
}

interface ChapterBottomDockProblems {
  unresolvedCount: number
  selectedScene: ChapterBottomDockSelectedScene | null
  problemsSummary: ChapterBottomDockListItem[]
  assemblyHints: ChapterBottomDockListItem[]
}

interface ChapterBottomDockProps {
  problems: ChapterBottomDockProblems
  activity: ChapterWorkbenchActivityItem[]
}

type ChapterBottomDockTab = 'problems' | 'activity'

function SupportList({
  title,
  items,
  emptyTitle,
  emptyMessage,
}: {
  title: string
  items: ChapterBottomDockListItem[]
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
          <li key={item.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
            <p className="font-medium text-text-main">{item.label}</p>
            <p className="mt-2 text-sm leading-6 text-text-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ChapterBottomDock({ problems, activity }: ChapterBottomDockProps) {
  const { locale } = useI18n()
  const [activeTab, setActiveTab] = useState<ChapterBottomDockTab>('problems')
  const timelineItems = activity.map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    meta:
      item.kind === 'view'
        ? locale === 'zh-CN'
          ? '视图'
          : 'View'
        : item.kind === 'scene'
          ? locale === 'zh-CN'
            ? '场景'
            : 'Scene'
          : locale === 'zh-CN'
            ? '变更'
            : 'Mutation',
    tone: item.tone,
  }))
  const selectedSceneLabel = problems.selectedScene
    ? `${problems.selectedScene.title} · ${problems.selectedScene.unresolvedLabel}`
    : locale === 'zh-CN'
      ? '当前还没有选中场景。'
      : 'No scene is selected yet.'

  const tabs = [
    {
      id: 'problems' as const,
      label: locale === 'zh-CN' ? '问题' : 'Problems',
      badge: problems.unresolvedCount,
      tone: problems.unresolvedCount > 0 ? ('warn' as const) : ('success' as const),
    },
    {
      id: 'activity' as const,
      label: locale === 'zh-CN' ? '活动' : 'Activity',
      badge: activity.length,
      tone: 'neutral' as const,
    },
  ]

  return (
    <WorkbenchBottomDockFrame
      ariaLabel={locale === 'zh-CN' ? '章节底部面板' : 'Chapter bottom dock'}
      tabs={tabs}
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
                    id: 'total-unresolved',
                    label: locale === 'zh-CN' ? '章节未决' : 'Chapter unresolved',
                    value: locale === 'zh-CN' ? `未决 ${problems.unresolvedCount}` : `Unresolved ${problems.unresolvedCount}`,
                  },
                  {
                    id: 'selected-scene',
                    label: locale === 'zh-CN' ? '当前场景' : 'Selected scene',
                    value: selectedSceneLabel,
                  },
                  {
                    id: 'problem-count',
                    label: locale === 'zh-CN' ? '问题摘要' : 'Problem summaries',
                    value: `${problems.problemsSummary.length}`,
                  },
                  {
                    id: 'hint-count',
                    label: locale === 'zh-CN' ? '装配提示' : 'Assembly hints',
                    value: `${problems.assemblyHints.length}`,
                  },
                ]}
              />
              {problems.selectedScene ? (
                <div className="rounded-md border border-line-soft bg-surface-2 p-3">
                  <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
                    {locale === 'zh-CN' ? '当前场景摘要' : 'Selected scene summary'}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-text-muted">{problems.selectedScene.summary}</p>
                </div>
              ) : null}
              <SupportList
                title={locale === 'zh-CN' ? '问题摘要' : 'Problem summaries'}
                items={problems.problemsSummary}
                emptyTitle={locale === 'zh-CN' ? '还没有结构问题' : 'No structural problems'}
                emptyMessage={
                  locale === 'zh-CN'
                    ? '章节层面的结构问题会在这里保持成摘要。'
                    : 'Chapter-level structural problems stay summarized here.'
                }
              />
              <SupportList
                title={locale === 'zh-CN' ? '装配提示' : 'Assembly hints'}
                items={problems.assemblyHints}
                emptyTitle={locale === 'zh-CN' ? '还没有装配提示' : 'No assembly hints'}
                emptyMessage={
                  locale === 'zh-CN'
                    ? '装配提示会在这里补充接缝判断。'
                    : 'Assembly hints will appear here when seam guidance is available.'
                }
              />
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
                    ? '当你切换视图或聚焦其他场景时，最近活动会出现在这里。'
                    : 'Recent view and scene changes will appear here during this session.'
                }
              />
            )}
          </SectionCard>
        </div>
      </div>
    </WorkbenchBottomDockFrame>
  )
}
