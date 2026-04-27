import { getDockTabLabel, getGenericStatusLabel, useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { FactList } from '@/components/ui/FactList'
import { SectionCard } from '@/components/ui/SectionCard'
import { TimelineList } from '@/components/ui/TimelineList'

import type { RunArtifactDetailRecord, RunArtifactSummaryRecord } from '@/features/run/api/run-artifact-records'
import type {
  RunEventRecord,
  RunRecord,
} from '@/features/run/api/run-records'
import type { RunTraceResponse } from '@/features/run/api/run-trace-records'
import { RunEventInspectorPanel, type RunEventInspectorMode } from '@/features/run/components/RunEventInspectorPanel'
import { RunEventStreamPanel } from '@/features/run/components/RunEventStreamPanel'
import { WorkbenchBottomDockFrame } from '@/features/workbench/components/WorkbenchBottomDockFrame'

import type { SceneDockTabId, SceneDockViewModel } from '../types/scene-view-models'

const dockTabs: SceneDockTabId[] = ['events', 'trace', 'consistency', 'problems', 'cost']

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

interface SceneBottomDockRunSupport {
  activeRunId?: string | null
  run: RunRecord | null
  events: RunEventRecord[]
  isLoading: boolean
  error: Error | null
  isReviewPending: boolean
  artifacts: RunArtifactSummaryRecord[]
  artifactsError?: Error | null
  isArtifactsLoading?: boolean
  selectedArtifactId?: string | null
  selectedArtifact?: RunArtifactDetailRecord | null
  artifactError?: Error | null
  isArtifactLoading?: boolean
  trace: RunTraceResponse | null
  traceError?: Error | null
  isTraceLoading?: boolean
  inspectorMode?: RunEventInspectorMode
  onInspectorModeChange?: (mode: RunEventInspectorMode) => void
  onSelectArtifact?: (artifactId: string) => void
  selectedVariants?: Record<string, string>
  onSelectProposalVariant?: (proposalId: string, variantId: string) => void
  onOpenAssetContext?: (assetId: string) => void
}

const dockProductMilestoneKinds = new Set<RunEventRecord['kind']>([
  'context_packet_built',
  'agent_invocation_completed',
  'proposal_created',
  'review_requested',
  'review_decision_submitted',
  'canon_patch_applied',
  'prose_generated',
  'run_completed',
  'run_failed',
])

function ActiveRunSupport({
  run,
  events,
  isLoading,
  error,
  isReviewPending,
  artifacts,
  artifactsError,
  isArtifactsLoading = false,
  selectedArtifactId,
  selectedArtifact,
  artifactError,
  isArtifactLoading = false,
  trace,
  traceError,
  isTraceLoading = false,
  inspectorMode,
  onInspectorModeChange,
  onSelectArtifact,
  selectedVariants = {},
  onSelectProposalVariant,
  onOpenAssetContext,
}: SceneBottomDockRunSupport) {
  const { locale } = useI18n()
  const recentEvents = events.filter((event) => dockProductMilestoneKinds.has(event.kind))
  const isRewriteRequestedTerminal =
    run?.status === 'completed' && recentEvents.at(-1)?.kind === 'review_decision_submitted'
  const hasRunSupport = Boolean(run) || isLoading || Boolean(error) || recentEvents.length > 0
  const selectedVariantCount = Object.keys(selectedVariants).length

  if (!hasRunSupport) {
    return null
  }

  return (
    <div className="grid gap-4">
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
              {artifactsError ? (
                <Badge tone="warn">{locale === 'zh-CN' ? '产物列表不可用' : 'Artifacts unavailable'}</Badge>
              ) : null}
            </div>
          ) : null}
        </div>
      </SectionCard>
      {run?.status === 'waiting_review' && run.pendingReviewId ? (
        <SectionCard
          eyebrow={locale === 'zh-CN' ? '评审交接' : 'Review Handoff'}
          title={locale === 'zh-CN' ? '等待主舞台评审' : 'Waiting for Main Stage Review'}
          actions={
            <Badge tone="warn">
              {locale === 'zh-CN'
                ? `${selectedVariantCount} 个候选版本`
                : `${selectedVariantCount} selected variant${selectedVariantCount === 1 ? '' : 's'}`}
            </Badge>
          }
        >
          <p className="text-sm leading-6 text-text-muted">
            {locale === 'zh-CN'
              ? '这里保留事件、产物和追踪支持。候选版本选择只是草稿上下文；请回到 Scene / Orchestrate 主舞台提交评审决定，随后才会进入 canon patch 与 prose draft。'
              : 'Events, artifacts, and trace stay here as support context. Variant choices are draft context; submit the review decision from the Scene / Orchestrate Main Stage before canon patch and prose draft are written.'}
          </p>
        </SectionCard>
      ) : null}
      {isRewriteRequestedTerminal ? (
        <SectionCard
          eyebrow={locale === 'zh-CN' ? '重写结果' : 'Rewrite Outcome'}
          title={locale === 'zh-CN' ? '需要新运行' : 'New run required'}
          actions={<Badge tone="neutral">{locale === 'zh-CN' ? '支持上下文' : 'Support context'}</Badge>}
        >
          <div className="space-y-2">
            <p className="text-sm leading-6 text-text-muted">
              {locale === 'zh-CN'
                ? '当前运行已经关闭。等重写说明准备好后，请从主舞台显式启动一次新运行。'
                : 'This run is closed. Start a new run from the Main Stage when the rewrite brief is ready.'}
            </p>
            <p className="text-sm leading-6 text-text-muted">
              {locale === 'zh-CN'
                ? '底部 Dock 继续只提供这次已关闭运行的事件、产物和追踪支持。'
                : 'The dock remains read-only support for events, artifacts, and trace from the closed run.'}
            </p>
          </div>
        </SectionCard>
      ) : null}
      <div className="grid min-h-[360px] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.95fr)]">
        <RunEventStreamPanel
          events={recentEvents}
          isLoading={isLoading}
          error={error}
          selectedArtifactId={selectedArtifactId}
          onSelectArtifact={onSelectArtifact}
        />
        <RunEventInspectorPanel
          artifacts={artifacts}
          artifactsError={artifactsError ?? null}
          isArtifactsLoading={isArtifactsLoading}
          selectedArtifactId={selectedArtifactId}
          selectedArtifact={selectedArtifact ?? null}
          artifactError={artifactError ?? null}
          isArtifactLoading={isArtifactLoading}
          trace={trace}
          traceError={traceError}
          isTraceLoading={isTraceLoading}
          mode={inspectorMode}
          onModeChange={onInspectorModeChange}
          onSelectArtifact={onSelectArtifact}
          selectedVariants={selectedVariants}
          onSelectProposalVariant={onSelectProposalVariant}
          onOpenAssetContext={onOpenAssetContext}
        />
      </div>
    </div>
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
    <WorkbenchBottomDockFrame
      ariaLabel={locale === 'zh-CN' ? '场景底部面板' : 'Scene bottom dock'}
      tabs={dockTabs.map((id) => ({ id, label: getDockTabLabel(locale, id) }))}
      activeTab={activeTab}
      onTabChange={onTabChange}
    >
      {isHydratingTab ? (
        <div className="p-4">
          <EmptyState
            title={locale === 'zh-CN' ? `正在加载${getDockTabLabel(locale, activeTab)}` : `Loading ${getDockTabLabel(locale, activeTab)}`}
            message={locale === 'zh-CN' ? '正在读取当前底部标签内容。' : 'Reading the active dock tab.'}
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
    </WorkbenchBottomDockFrame>
  )
}
