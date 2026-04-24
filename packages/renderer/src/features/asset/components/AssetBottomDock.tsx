import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'
import { useI18n } from '@/app/i18n'

import type { AssetDockActivityItem, AssetDockSummaryViewModel } from '../types/asset-view-models'

interface AssetBottomDockProps {
  summary: AssetDockSummaryViewModel
  activity: AssetDockActivityItem[]
}

export function AssetBottomDock({ summary, activity }: AssetBottomDockProps) {
  const { locale } = useI18n()
  const traceabilityReady = !summary.traceabilityStatus

  return (
    <section
      aria-label={locale === 'zh-CN' ? '资产底部面板' : 'Asset bottom dock'}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      <PaneHeader
        title={locale === 'zh-CN' ? '问题 / 活动' : 'Problems / Activity'}
        description={
          locale === 'zh-CN'
            ? '底部面板继续只承接知识浏览的辅助判断和最近活动。'
            : 'The bottom dock keeps recent knowledge judgments and activity close without taking over the stage.'
        }
      />
      <div className="grid min-h-0 flex-1 gap-4 overflow-auto p-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
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
    </section>
  )
}
