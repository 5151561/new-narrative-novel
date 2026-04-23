import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { SectionCard } from '@/components/ui/SectionCard'

import type { RunEventRecord, RunMode, RunRecord, RunReviewDecisionKind } from '@/features/run/api/run-records'
import { RunEventStreamPanel } from '@/features/run/components/RunEventStreamPanel'
import { RunReviewGate } from '@/features/run/components/RunReviewGate'

import type {
  BeatRailItemModel,
  ProposalCardModel,
  ProposalFilters,
  SceneAcceptedSummaryModel,
  SceneObjectiveModel,
} from '../types/scene-view-models'

import { AcceptedStateFooter } from './AcceptedStateFooter'
import { BeatRail } from './BeatRail'
import { ProposalReviewStack } from './ProposalReviewStack'
import { SceneObjectiveStrip } from './SceneObjectiveStrip'

export interface SceneExecutionRunSessionViewModel {
  run: RunRecord | null
  events: RunEventRecord[]
  pendingReviewId: string | null
  isReviewPending: boolean
  isLoading: boolean
  error: Error | null
  isStartingRun: boolean
  isSubmittingDecision: boolean
  onStartRun: (mode: RunMode) => Promise<void> | void
  onSubmitDecision: (input: {
    decision: RunReviewDecisionKind
    note?: string
    patchId?: string
  }) => Promise<void> | void
}

interface SceneExecutionTabProps {
  objective: SceneObjectiveModel
  beats: BeatRailItemModel[]
  proposals: ProposalCardModel[]
  actorOptions: Array<{ id: string; label: string }>
  selectedBeatId?: string
  selectedProposalId?: string
  filters: ProposalFilters
  acceptedSummary: SceneAcceptedSummaryModel
  runSession: SceneExecutionRunSessionViewModel
  canContinueRun: boolean
  canOpenProse: boolean
  onOpenSetup?: () => void
  onContinueRun: () => void
  onOpenPatchPreview: () => void
  onOpenProse: () => void
  onSelectBeat: (beatId: string) => void
  onSelectProposal: (proposalId: string) => void
  onAccept: (proposalId: string) => void
  onEditAccept: (proposalId: string, editedSummary: string) => void
  onRequestRewrite: (proposalId: string) => void
  onReject: (proposalId: string) => void
  onChangeFilters: (next: ProposalFilters) => void
  onClearFilters: () => void
}

export function SceneExecutionTab({
  objective,
  beats,
  proposals,
  actorOptions,
  selectedBeatId,
  selectedProposalId,
  filters,
  acceptedSummary,
  runSession,
  canContinueRun,
  canOpenProse,
  onOpenSetup,
  onContinueRun,
  onOpenPatchPreview,
  onOpenProse,
  onSelectBeat,
  onSelectProposal,
  onAccept,
  onEditAccept,
  onRequestRewrite,
  onReject,
  onChangeFilters,
  onClearFilters,
}: SceneExecutionTabProps) {
  const { locale } = useI18n()
  const activeRun = runSession.run
  const latestEvent = runSession.events.at(-1)
  const isRunBusy = runSession.isStartingRun || runSession.isSubmittingDecision

  const runStatusLabels: Record<Locale, Record<NonNullable<RunRecord['status']>, string>> = {
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
  const runStatusTone = {
    queued: 'neutral',
    running: 'accent',
    waiting_review: 'warn',
    completed: 'success',
    failed: 'danger',
    cancelled: 'neutral',
  } as const

  function renderRunSupport() {
    return (
      <div className="space-y-4">
        <SectionCard
          eyebrow={locale === 'zh-CN' ? '运行会话' : 'Run Session'}
          title={activeRun?.title ?? (locale === 'zh-CN' ? '运行控制' : 'Run Controls')}
          actions={
            activeRun ? (
              <Badge tone={runStatusTone[activeRun.status]}>{runStatusLabels[locale][activeRun.status]}</Badge>
            ) : null
          }
        >
          <div className="space-y-3">
            <p className="text-sm leading-6 text-text-muted">
              {activeRun
                ? activeRun.summary
                : locale === 'zh-CN'
                  ? '通过继续、重写或从头开始来驱动当前场景运行。'
                  : 'Start a fresh scene run, continue the current thread, or request a rewrite pass.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm disabled:opacity-60"
                disabled={!canContinueRun || isRunBusy}
                onClick={() => {
                  void runSession.onStartRun('continue')
                }}
              >
                {locale === 'zh-CN' ? '继续当前运行' : 'Continue Active Run'}
              </button>
              <button
                type="button"
                className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm disabled:opacity-60"
                disabled={isRunBusy}
                onClick={() => {
                  void runSession.onStartRun('rewrite')
                }}
              >
                {locale === 'zh-CN' ? '重写运行' : 'Rewrite Run'}
              </button>
              <button
                type="button"
                className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main disabled:opacity-60"
                disabled={isRunBusy}
                onClick={() => {
                  void runSession.onStartRun('from-scratch')
                }}
              >
                {locale === 'zh-CN' ? '从头运行' : 'Run From Scratch'}
              </button>
            </div>
            {activeRun ? (
              <div className="grid gap-3 text-sm text-text-muted">
                <div className="flex flex-wrap items-center gap-2">
                  {runSession.isReviewPending ? (
                    <Badge tone="warn">{locale === 'zh-CN' ? '待评审' : 'Pending review'}</Badge>
                  ) : null}
                </div>
                {latestEvent ? (
                  <p>
                    {locale === 'zh-CN' ? '最新事件：' : 'Latest event: '}
                    <span className="font-medium text-text-main">{latestEvent.label}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </SectionCard>
        <RunEventStreamPanel
          events={runSession.events}
          isLoading={runSession.isLoading}
          error={runSession.error}
        />
        {activeRun?.status === 'waiting_review' && runSession.pendingReviewId ? (
          <RunReviewGate
            runTitle={activeRun.title}
            pendingReviewId={runSession.pendingReviewId}
            isSubmitting={runSession.isSubmittingDecision}
            onSubmitDecision={runSession.onSubmitDecision}
          />
        ) : null}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SceneObjectiveStrip objective={objective} onOpenSetup={onOpenSetup} />
      <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)] overflow-hidden xl:grid-cols-[240px_minmax(0,1fr)_360px]">
        <BeatRail beats={beats} selectedBeatId={selectedBeatId} onSelectBeat={onSelectBeat} />
        <ProposalReviewStack
          proposals={proposals}
          actorOptions={actorOptions}
          selectedProposalId={selectedProposalId}
          filters={filters}
          onSelectProposal={onSelectProposal}
          onAccept={onAccept}
          onEditAccept={onEditAccept}
          onRequestRewrite={onRequestRewrite}
          onReject={onReject}
          onChangeFilters={onChangeFilters}
          onClearFilters={onClearFilters}
        />
        <aside className="hidden min-h-0 border-l border-line-soft bg-surface-2/40 xl:block xl:overflow-y-auto xl:p-4">
          {renderRunSupport()}
        </aside>
      </div>
      <div className="border-t border-line-soft bg-surface-2/40 p-4 xl:hidden">{renderRunSupport()}</div>
      <AcceptedStateFooter
        summary={acceptedSummary}
        canContinueRun={canContinueRun}
        canOpenProse={canOpenProse}
        onContinueRun={onContinueRun}
        onOpenPatchPreview={onOpenPatchPreview}
        onOpenProse={onOpenProse}
      />
    </div>
  )
}
