import { useI18n, type Locale } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { SectionCard } from '@/components/ui/SectionCard'

import type {
  RunEventRecord,
  RunMode,
  RunRecord,
  RunReviewDecisionKind,
  RunSelectedProposalVariantRecord,
} from '@/features/run/api/run-records'
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
  selectedVariantsForSubmit: RunSelectedProposalVariantRecord[]
  variantSelectionSummary?: string
  isLoading: boolean
  error: Error | null
  isStartingRun: boolean
  isSubmittingDecision: boolean
  onStartRun: (mode: RunMode) => Promise<void> | void
  onRetryRun?: () => Promise<void> | void
  onSubmitDecision: (input: {
    decision: RunReviewDecisionKind
    note?: string
    patchId?: string
    selectedVariants?: RunSelectedProposalVariantRecord[]
  }) => Promise<void> | void
}

interface SceneExecutionRunStartGuard {
  message: string
  ctaLabel: string
  onRepair: () => void
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
  runStartGuard?: SceneExecutionRunStartGuard
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
  runStartGuard,
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
  const { dictionary, locale } = useI18n()
  const activeRun = runSession.run
  const latestEvent = runSession.events.at(-1)
  const isRewriteRequestedTerminal =
    activeRun?.status === 'completed' && latestEvent?.kind === 'review_decision_submitted'
  const isRunBusy = runSession.isStartingRun || runSession.isSubmittingDecision
  const areRunStartControlsDisabled = isRunBusy || runSession.isReviewPending || Boolean(runStartGuard)
  const isFailedRun = activeRun?.status === 'failed'

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
            {runStartGuard ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                <p className="leading-6">{runStartGuard.message}</p>
                <div className="mt-3">
                  <button
                    type="button"
                    className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white"
                    onClick={runStartGuard.onRepair}
                  >
                    {runStartGuard.ctaLabel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={areRunStartControlsDisabled}
                  onClick={() => {
                    void runSession.onStartRun('continue')
                  }}
                >
                  {locale === 'zh-CN' ? '运行场景' : 'Run Scene'}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm disabled:opacity-60"
                  disabled={areRunStartControlsDisabled}
                  onClick={() => {
                    void runSession.onStartRun('rewrite')
                  }}
                >
                  {locale === 'zh-CN' ? '重写运行' : 'Rewrite Run'}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main disabled:opacity-60"
                  disabled={areRunStartControlsDisabled}
                  onClick={() => {
                    void runSession.onStartRun('from-scratch')
                  }}
                >
                  {locale === 'zh-CN' ? '从头运行' : 'Run From Scratch'}
                </button>
              </div>
            )}
            {runSession.error && !runStartGuard && !isFailedRun ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-950">
                <p className="font-medium">
                  {locale === 'zh-CN' ? '运行启动失败' : 'Run start failed'}
                </p>
                <p className="mt-1 leading-6">{runSession.error.message}</p>
                {!activeRun ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      className="rounded-md border border-line-soft bg-white px-3 py-2 text-sm font-medium text-text-main"
                      onClick={onOpenSetup}
                    >
                      {dictionary.shell.openModelSettings}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
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
                {isFailedRun ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-950">
                    <p className="font-medium">
                      {activeRun.summary}
                    </p>
                    {activeRun.failureMessage ? (
                      <p className="mt-1 leading-6">{activeRun.failureMessage}</p>
                    ) : null}
                    {activeRun.runtimeSummary?.nextActionLabel ? (
                      <p className="mt-1 leading-6">{activeRun.runtimeSummary.nextActionLabel}</p>
                    ) : null}
                    {runSession.onRetryRun ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-950"
                          onClick={() => {
                            void runSession.onRetryRun?.()
                          }}
                        >
                          {locale === 'zh-CN' ? '重试运行' : 'Retry Run'}
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {isRewriteRequestedTerminal ? (
                  <div className="rounded-md border border-line-soft bg-surface-1 px-3 py-3">
                    <p className="text-sm font-medium text-text-main">
                      {locale === 'zh-CN' ? '需要显式启动新运行' : 'New run required'}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-text-muted">
                      {locale === 'zh-CN'
                        ? '当前运行已经关闭。请基于新的重写说明显式启动下一次运行；不会有隐藏的后台续跑。'
                        : 'This run is closed. Start a new run explicitly to continue from the rewrite brief.'}
                    </p>
                  </div>
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
            selectedVariants={runSession.selectedVariantsForSubmit}
            variantSelectionSummary={runSession.variantSelectionSummary}
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
