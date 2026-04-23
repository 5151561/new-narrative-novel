import { getDockTabLabel, getGenericStatusLabel, useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import { cn } from '@/lib/cn'

import type { RunEventRecord, RunRecord } from '@/features/run/api/run-records'

import type { SceneDockTabId, SceneDockViewModel } from '../types/scene-view-models'

const dockTabs: Array<{ id: SceneDockTabId; label: string }> = [
  { id: 'events', label: 'Events' },
  { id: 'trace', label: 'Trace' },
  { id: 'consistency', label: 'Consistency' },
  { id: 'problems', label: 'Problems' },
  { id: 'cost', label: 'Cost' },
]

function DockTabs({
  activeTab,
  onChange,
}: {
  activeTab: SceneDockTabId
  onChange: (tab: SceneDockTabId) => void
}) {
  const { locale } = useI18n()

  return (
    <div className="flex flex-wrap gap-2 border-b border-line-soft px-4 py-3">
      {dockTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'rounded-md px-3 py-2 text-sm',
            activeTab === tab.id ? 'bg-surface-2 text-text-main shadow-ringwarm' : 'text-text-muted hover:bg-surface-2',
          )}
        >
          {getDockTabLabel(locale, tab.id)}
        </button>
      ))}
    </div>
  )
}

function EventsTab({ items }: { items: SceneDockViewModel['events'] }) {
  const { locale } = useI18n()

  return items.length > 0 ? (
    <TimelineList items={items} />
  ) : (
    <div className="p-4">
      <EmptyState
        title={locale === 'zh-CN' ? '还没有事件' : 'No events yet'}
        message={
          locale === 'zh-CN'
            ? '当执行流程产出结构化事件摘要时，它们会出现在这里。'
            : 'Structured event summaries will appear here when execution emits them.'
        }
      />
    </div>
  )
}

const runStatusTone: Record<RunRecord['status'], 'neutral' | 'accent' | 'warn' | 'success' | 'danger'> = {
  queued: 'neutral',
  running: 'accent',
  waiting_review: 'warn',
  completed: 'success',
  failed: 'danger',
  cancelled: 'neutral',
}

const runSeverityTone = {
  info: 'neutral',
  warning: 'warn',
  error: 'danger',
} as const

const runStatusLabels: Record<Locale, Record<RunRecord['status'], string>> = {
  en: {
    queued: 'Queued',
    running: 'Running',
    waiting_review: 'Waiting Review',
    completed: 'Completed',
    failed: 'Failed',
    cancelled: 'Cancelled',
  },
  'zh-CN': {
    queued: '已排队',
    running: '运行中',
    waiting_review: '待评审',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消',
  },
}

const runSeverityLabels: Record<Locale, Record<keyof typeof runSeverityTone, string>> = {
  en: {
    info: 'Info',
    warning: 'Warning',
    error: 'Error',
  },
  'zh-CN': {
    info: '提示',
    warning: '警告',
    error: '错误',
  },
}

interface SceneBottomDockRunSupport {
  run: RunRecord | null
  events: RunEventRecord[]
  isLoading: boolean
  error: Error | null
  isReviewPending: boolean
}

const dockProductMilestoneKinds = new Set<RunEventRecord['kind']>([
  'proposal_created',
  'review_requested',
  'review_decision_submitted',
  'canon_patch_applied',
  'prose_generated',
  'run_completed',
  'run_failed',
])

function formatRunRefLabel(ref: NonNullable<RunEventRecord['refs']>[number]) {
  return ref.kind
}

function ActiveRunSupport({
  run,
  events,
  isLoading,
  error,
  isReviewPending,
}: SceneBottomDockRunSupport) {
  const { locale } = useI18n()
  const recentEvents = events.filter((event) => dockProductMilestoneKinds.has(event.kind)).slice(-4)
  const hasRunSupport = Boolean(run) || isLoading || Boolean(error) || recentEvents.length > 0

  if (!hasRunSupport) {
    return null
  }

  return (
    <SectionCard
      eyebrow={locale === 'zh-CN' ? '当前运行支持' : 'Active Run Support'}
      title={run?.title ?? (locale === 'zh-CN' ? '当前没有活动运行' : 'No active run')}
      actions={run ? <Badge tone={runStatusTone[run.status]}>{runStatusLabels[locale][run.status]}</Badge> : null}
    >
      <div className="space-y-4">
        <p className="text-sm leading-6 text-text-muted">
          {run
            ? run.summary
            : locale === 'zh-CN'
              ? '当前场景一旦产生运行，会在这里显示最近一次产品级里程碑。'
              : 'Recent product-level run milestones will appear here once the scene has an active run.'}
        </p>
        {run ? (
          <div className="flex flex-wrap gap-2">
            {isReviewPending ? <Badge tone="warn">{locale === 'zh-CN' ? '待评审' : 'Pending review'}</Badge> : null}
            {run.status === 'completed' ? <Badge tone="success">{locale === 'zh-CN' ? '已完成' : 'Completed'}</Badge> : null}
            {run.status === 'failed' ? <Badge tone="danger">{locale === 'zh-CN' ? '运行失败' : 'Run failed'}</Badge> : null}
          </div>
        ) : null}
        {isLoading ? (
          <EmptyState
            title={locale === 'zh-CN' ? '正在加载最近运行事件' : 'Loading recent run events'}
            message={
              locale === 'zh-CN'
                ? '正在为底部支持面板拉取当前场景最近一次运行的产品级事件。'
                : 'Fetching recent product-level events for the current scene run.'
            }
          />
        ) : error ? (
          <EmptyState
            title={locale === 'zh-CN' ? '运行时间线不可用' : 'Run timeline unavailable'}
            message={
              locale === 'zh-CN'
                ? '运行支持区域暂时无法读取最近事件。'
                : 'The run support area cannot load recent events right now.'
            }
          />
        ) : recentEvents.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.08em] text-text-soft">{locale === 'zh-CN' ? '最近运行事件' : 'Recent Run Events'}</p>
            <TimelineList
              items={recentEvents.map((event) => {
                const severity = event.severity ?? 'info'

                return {
                  id: event.id,
                  title: event.label,
                  detail: event.summary,
                  meta: event.createdAtLabel,
                  tone: runSeverityTone[severity],
                  trailing:
                    event.refs?.length || severity ? (
                      <div className="flex max-w-[180px] flex-wrap justify-end gap-1">
                        <Badge tone={runSeverityTone[severity]}>{runSeverityLabels[locale][severity]}</Badge>
                        {event.refs?.map((ref) => (
                          <Badge key={`${event.id}-${ref.kind}-${ref.id}`} title={ref.label ?? ref.id}>
                            {formatRunRefLabel(ref)}
                          </Badge>
                        ))}
                      </div>
                    ) : null,
                }
              })}
            />
          </div>
        ) : (
          <EmptyState
            title={locale === 'zh-CN' ? '还没有运行事件' : 'No run events yet'}
            message={
              locale === 'zh-CN'
                ? '当运行记录到产品级里程碑后，这里会显示最近几条事件。'
                : 'Recent run milestones will appear here once the active scene run advances.'
            }
          />
        )}
      </div>
    </SectionCard>
  )
}

function EventsSupportArea({
  items,
  runSupport,
}: {
  items: SceneDockViewModel['events']
  runSupport?: SceneBottomDockRunSupport
}) {
  const { locale } = useI18n()
  const supportBlock = runSupport ? <ActiveRunSupport {...runSupport} /> : null

  if (!supportBlock && items.length === 0) {
    return <EventsTab items={items} />
  }

  return (
    <div className="grid gap-4 p-4">
      {supportBlock}
      {items.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.08em] text-text-soft">{locale === 'zh-CN' ? '场景支持事件' : 'Scene Support Events'}</p>
          <TimelineList items={items} />
        </div>
      ) : null}
      {!supportBlock && items.length === 0 ? (
        <EmptyState
          title={locale === 'zh-CN' ? '还没有事件' : 'No events yet'}
          message={
            locale === 'zh-CN'
              ? '当执行流程产出结构化事件摘要时，它们会出现在这里。'
              : 'Structured event summaries will appear here when execution emits them.'
          }
        />
      ) : null}
    </div>
  )
}

function TraceTab({ items }: { items: SceneDockViewModel['trace'] }) {
  const { locale } = useI18n()

  return items.length > 0 ? (
    <div className="grid gap-3 p-4 md:grid-cols-2">
      {items.map((item) => (
        <SectionCard key={item.id} eyebrow={item.meta} title={item.title}>
          <p className="text-sm leading-6 text-text-muted">{item.detail}</p>
        </SectionCard>
      ))}
    </div>
  ) : (
    <div className="p-4">
      <EmptyState
        title={locale === 'zh-CN' ? '还没有追踪摘要' : 'No trace summaries'}
        message={
          locale === 'zh-CN'
            ? '追踪信息会在这里保持结构化，而不会把主舞台变成日志墙。'
            : 'Trace stays structured here and never turns the stage into a log wall.'
        }
      />
    </div>
  )
}

function ConsistencyTab({ consistency }: { consistency: SceneDockViewModel['consistency'] }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow={locale === 'zh-CN' ? '摘要' : 'Summary'} title={locale === 'zh-CN' ? '一致性检查' : 'Consistency Checks'}>
        <p className="text-sm leading-6 text-text-muted">{consistency.summary}</p>
      </SectionCard>
      {consistency.checks.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          {consistency.checks.map((check) => (
            <SectionCard
              key={check.id}
              eyebrow={locale === 'zh-CN' ? getGenericStatusLabel(locale, check.status) : check.status.toUpperCase()}
              title={check.label}
            >
              <p className="text-sm leading-6 text-text-muted">{check.detail}</p>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? '还没有检查项' : 'No checks yet'}
          message={
            locale === 'zh-CN'
              ? '当运行轮次开始后，一致性摘要就会出现在这里。'
              : 'Consistency summaries will appear once runtime passes begin.'
          }
        />
      )}
    </div>
  )
}

function ProblemsTab({ problems }: { problems: SceneDockViewModel['problems'] }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4">
      <SectionCard eyebrow={locale === 'zh-CN' ? '摘要' : 'Summary'} title={locale === 'zh-CN' ? '问题' : 'Problems'}>
        <p className="text-sm leading-6 text-text-muted">{problems.summary}</p>
      </SectionCard>
      {problems.items.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {problems.items.map((problem) => (
            <SectionCard
              key={problem.id}
              eyebrow={locale === 'zh-CN' ? getGenericStatusLabel(locale, problem.severity) : problem.severity.toUpperCase()}
              title={problem.title}
            >
              <p className="text-sm leading-6 text-text-muted">{problem.recommendation}</p>
            </SectionCard>
          ))}
        </div>
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? '还没有记录到问题' : 'No problems recorded'}
          message={
            locale === 'zh-CN'
              ? '即便后面出现问题，它们也会留在这里做摘要，不会淹没主画布。'
              : 'When problems do appear, they stay summarized here rather than flooding the main canvas.'
          }
        />
      )}
    </div>
  )
}

function CostTab({ cost }: { cost: SceneDockViewModel['cost'] }) {
  const { locale } = useI18n()

  return (
    <div className="grid gap-4 p-4 md:grid-cols-[320px_minmax(0,1fr)]">
      <SectionCard eyebrow={locale === 'zh-CN' ? '当前窗口' : 'Current Window'} title={locale === 'zh-CN' ? '成本概览' : 'Cost Overview'}>
        <div className="space-y-2">
          <Badge tone="accent">{cost.currentWindowLabel}</Badge>
          <p className="text-sm leading-6 text-text-muted">{cost.trendLabel}</p>
        </div>
      </SectionCard>
      {cost.breakdown.length > 0 ? (
        <SectionCard eyebrow={locale === 'zh-CN' ? '拆分' : 'Breakdown'} title={locale === 'zh-CN' ? '用量快照' : 'Usage Snapshot'}>
          <FactList items={cost.breakdown} />
        </SectionCard>
      ) : (
        <EmptyState
          title={locale === 'zh-CN' ? '还没有成本数据' : 'No cost data'}
          message={locale === 'zh-CN' ? '在执行流程真正运行前，用量区域会保持为空。' : 'Usage stays empty until execution actually runs.'}
        />
      )}
    </div>
  )
}

interface SceneBottomDockProps {
  data: SceneDockViewModel
  activeTab: SceneDockTabId
  isHydratingTab?: boolean
  runSupport?: SceneBottomDockRunSupport
  onTabChange: (tab: SceneDockTabId) => void
}

export function SceneBottomDock({ data, activeTab, isHydratingTab = false, runSupport, onTabChange }: SceneBottomDockProps) {
  const { locale } = useI18n()

  return (
    <>
      <PaneHeader
        title={
          locale === 'zh-CN' ? '事件 / 追踪 / 一致性 / 问题 / 成本' : 'Events / Trace / Consistency / Problems / Cost'
        }
        description={
          locale === 'zh-CN'
            ? '这个底部面板承接事件流、追踪、一致性问题、故障与成本，让评审舞台保持在编辑态。'
            : 'This dock owns the event stream, trace, consistency issues, problems, and cost so the review stage can stay editorial.'
        }
      />
      <DockTabs activeTab={activeTab} onChange={onTabChange} />
      <div className="min-h-0 overflow-y-auto">
        {isHydratingTab ? (
          <div className="p-4">
            <EmptyState
              title={locale === 'zh-CN' ? `正在加载${getDockTabLabel(locale, activeTab)}` : `Loading ${activeTab}`}
              message={
                locale === 'zh-CN'
                  ? '正在为当前底部标签补齐内容，而不会一次把全部细节拉上来。'
                  : 'Hydrating the active dock tab without pulling every detail up front.'
              }
            />
          </div>
        ) : activeTab === 'events' ? (
          <EventsSupportArea items={data.events} runSupport={runSupport} />
        ) : activeTab === 'trace' ? (
          <TraceTab items={data.trace} />
        ) : activeTab === 'consistency' ? (
          <ConsistencyTab consistency={data.consistency} />
        ) : activeTab === 'problems' ? (
          <ProblemsTab problems={data.problems} />
        ) : (
          <CostTab cost={data.cost} />
        )}
      </div>
    </>
  )
}
