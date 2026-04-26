import { useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'
import { useI18n } from '@/app/i18n'
import { WorkbenchBottomDockFrame } from '@/features/workbench/components/WorkbenchBottomDockFrame'

import type { AssetDockActivityItem, AssetDockSummaryViewModel } from '../types/asset-view-models'

interface AssetBottomDockProps {
  summary: AssetDockSummaryViewModel
  activity: AssetDockActivityItem[]
}

type AssetBottomDockTab = 'problems' | 'activity'

export function AssetBottomDock({ summary, activity }: AssetBottomDockProps) {
  const { locale } = useI18n()
  const [activeTab, setActiveTab] = useState<AssetBottomDockTab>('problems')
  const traceabilityReady = !summary.traceabilityStatus
  const issueCount = summary.warningCount + summary.missingFieldCount + summary.problemItems.length

  return (
    <WorkbenchBottomDockFrame
      ariaLabel={locale === 'zh-CN' ? '资产底部面板' : 'Asset bottom dock'}
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
                  { id: 'mentions', label: locale === 'zh-CN' ? '提及' : 'Mentions', value: `${summary.mentionCount}` },
                  { id: 'relations', label: locale === 'zh-CN' ? '关系' : 'Relations', value: `${summary.relationCount}` },
                  { id: 'warnings', label: locale === 'zh-CN' ? '警告' : 'Warnings', value: `${summary.warningCount}` },
                  {
                    id: 'missing-fields',
                    label: locale === 'zh-CN' ? '缺失字段' : 'Missing fields',
                    value: `${summary.missingFieldCount}`,
                  },
                  {
                    id: 'context-policy-status',
                    label: locale === 'zh-CN' ? '上下文策略' : 'Context policy',
                    value: summary.contextPolicy.statusLabel,
                  },
                  {
                    id: 'context-policy-rules',
                    label: locale === 'zh-CN' ? '策略规则' : 'Policy rules',
                    value: `${summary.contextPolicy.activationRuleCount}`,
                  },
                  {
                    id: 'context-policy-warnings',
                    label: locale === 'zh-CN' ? '策略警告' : 'Policy warnings',
                    value: `${summary.contextPolicy.warningCount}`,
                  },
                  ...(traceabilityReady
                    ? [
                        {
                          id: 'without-canon-backing',
                          label: locale === 'zh-CN' ? '无正典支撑' : 'Without canon backing',
                          value: `${summary.mentionsWithoutCanonBackingCount ?? 0}`,
                        },
                        {
                          id: 'missing-scene-trace',
                          label: locale === 'zh-CN' ? '缺失场景来源链' : 'Missing scene trace',
                          value: `${summary.mentionsWithMissingSceneTraceCount ?? 0}`,
                        },
                        {
                          id: 'narrative-backing-gaps',
                          label: locale === 'zh-CN' ? '叙事支撑缺口' : 'Narrative backing gaps',
                          value: `${summary.relationsWithoutNarrativeBackingCount ?? 0}`,
                        },
                      ]
                    : []),
                ]}
              />
              {summary.traceabilityStatus ? (
                <EmptyState title={summary.traceabilityStatus.title} message={summary.traceabilityStatus.message} className="min-h-0" />
              ) : null}
              {summary.problemItems.length > 0 ? (
                <ul className="space-y-3">
                  {summary.problemItems.map((item) => (
                    <li key={item.id} className="rounded-md border border-line-soft bg-surface-2 p-3">
                      <p className="font-medium text-text-main">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-text-muted">{item.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title={locale === 'zh-CN' ? '没有额外问题' : 'No extra problems'}
                  message={
                    locale === 'zh-CN'
                      ? '当前资产的 warnings、关系和字段都保持在可读范围内。'
                      : 'Warnings, relations, and profile coverage are all within the current reading threshold.'
                  }
                />
              )}
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
                    item.kind === 'asset'
                      ? locale === 'zh-CN'
                        ? '资产'
                        : 'Asset'
                      : locale === 'zh-CN'
                        ? 'Knowledge'
                        : 'Knowledge',
                }))}
              />
            ) : (
              <EmptyState
                title={locale === 'zh-CN' ? '会话很安静' : 'Quiet session'}
                message={
                  locale === 'zh-CN'
                    ? '切换资产或视图之后，最近活动会出现在这里。'
                    : 'Recent asset focus and view changes will appear here.'
                }
              />
            )}
          </SectionCard>
        </div>
      </div>
    </WorkbenchBottomDockFrame>
  )
}
