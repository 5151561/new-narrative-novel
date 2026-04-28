import { type FormEvent, useState } from 'react'

import { useI18n } from '@/app/i18n'
import { Badge } from '@/components/ui/Badge'
import { SectionCard } from '@/components/ui/SectionCard'

import type { RunReviewDecisionKind, RunSelectedProposalVariantRecord } from '../api/run-records'

interface RunReviewGateSubmitInput {
  decision: RunReviewDecisionKind
  note?: string
  patchId?: string
  selectedVariants?: RunSelectedProposalVariantRecord[]
}

interface RunReviewGateProps {
  runTitle: string
  pendingReviewId: string
  isSubmitting: boolean
  selectedVariants?: RunSelectedProposalVariantRecord[]
  variantSelectionSummary?: string
  initialDraftDecision?: DraftDecision | null
  supportActions?: {
    canRetry?: boolean
    canCancel?: boolean
    canResume?: boolean
    onRetry?: () => Promise<void> | void
    onCancel?: () => Promise<void> | void
    onResume?: () => Promise<void> | void
  }
  onSubmitDecision: (input: RunReviewGateSubmitInput) => Promise<void> | void
}

type DraftDecision = Exclude<RunReviewDecisionKind, 'accept'>

const draftDecisionLabels: Record<DraftDecision, string> = {
  'accept-with-edit': 'Accept With Edit',
  'request-rewrite': 'Request Rewrite',
  reject: 'Reject',
}

export function RunReviewGate({
  runTitle,
  pendingReviewId,
  isSubmitting,
  selectedVariants = [],
  variantSelectionSummary,
  initialDraftDecision = null,
  supportActions,
  onSubmitDecision,
}: RunReviewGateProps) {
  const { locale } = useI18n()
  const [draftDecision, setDraftDecision] = useState<DraftDecision | null>(initialDraftDecision)
  const [note, setNote] = useState('')
  const [patchId, setPatchId] = useState('')
  const [isLocallySubmitting, setIsLocallySubmitting] = useState(false)

  const isBusy = isSubmitting || isLocallySubmitting

  async function submitDecision(input: RunReviewGateSubmitInput) {
    if (isBusy) {
      return
    }

    const shouldCarryVariants =
      selectedVariants.length > 0 && (input.decision === 'accept' || input.decision === 'accept-with-edit')
    const submitInput = shouldCarryVariants
      ? {
          ...input,
          selectedVariants,
        }
      : input

    setIsLocallySubmitting(true)
    try {
      await Promise.resolve(onSubmitDecision(submitInput))
      setDraftDecision(null)
      setNote('')
      setPatchId('')
    } finally {
      setIsLocallySubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draftDecision) {
      return
    }

    const trimmedNote = note.trim()
    const trimmedPatchId = patchId.trim()

    void submitDecision({
      decision: draftDecision,
      note: trimmedNote || undefined,
      patchId: draftDecision === 'accept-with-edit' ? trimmedPatchId || undefined : undefined,
    })
  }

  const noteLabel = draftDecision === 'accept-with-edit'
    ? locale === 'zh-CN'
      ? '编辑说明 / 补丁说明'
      : 'Edited note / patch explanation'
    : locale === 'zh-CN'
      ? '评审说明'
      : 'Review note'

  const submitLabel =
    draftDecision === 'accept-with-edit'
      ? locale === 'zh-CN'
        ? '提交编辑后采纳'
        : 'Submit Accept With Edit'
      : draftDecision === 'request-rewrite'
        ? locale === 'zh-CN'
          ? '提交重写请求'
          : 'Submit Rewrite Request'
        : locale === 'zh-CN'
          ? '提交拒绝'
          : 'Submit Rejection'
  const rewriteDecisionNote =
    draftDecision === 'request-rewrite'
      ? locale === 'zh-CN'
        ? '提交重写请求会关闭当前运行。等重写说明准备好后，需要你显式启动一次新运行；这次决策不会在后台继续。'
        : 'Submitting Request Rewrite closes this run. Start a new run explicitly when the rewrite brief is ready; this decision does not continue in the background.'
      : null
  const rewriteVariantNote =
    draftDecision === 'request-rewrite' && selectedVariants.length > 0
      ? locale === 'zh-CN'
        ? '已选 variant 只保留为评审上下文，不会自动延续到这次运行之后。'
        : 'Selected variants stay as review context only and will not continue this run automatically.'
      : null

  return (
    <SectionCard
      eyebrow={locale === 'zh-CN' ? '运行评审闸门' : 'Run Review Gate'}
      title={runTitle}
      actions={<Badge tone="warn">{locale === 'zh-CN' ? '待评审' : 'Pending review'}</Badge>}
    >
      <div className="space-y-3">
        <p className="text-sm leading-6 text-text-muted">
          {locale === 'zh-CN'
            ? '当前运行正等待产品评审决策。选择一个结论，再按需要补充说明。'
            : 'This run is waiting on a product review decision.'}
        </p>
        {supportActions ? (
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
            <p className="text-sm leading-6 text-text-muted">
              {locale === 'zh-CN'
                ? '这些动作只负责恢复或停止运行链路；最终评审仍然属于 Scene / Orchestrate 主舞台。'
                : 'These actions only recover or stop the runtime path. Final review still belongs on the Scene / Orchestrate main stage.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {supportActions.canRetry ? (
                <button
                  type="button"
                  className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm disabled:opacity-60"
                  disabled={isBusy}
                  onClick={() => {
                    void Promise.resolve(supportActions.onRetry?.())
                  }}
                >
                  {locale === 'zh-CN' ? '重试运行' : 'Retry Run'}
                </button>
              ) : null}
              {supportActions.canCancel ? (
                <button
                  type="button"
                  className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm disabled:opacity-60"
                  disabled={isBusy}
                  onClick={() => {
                    void Promise.resolve(supportActions.onCancel?.())
                  }}
                >
                  {locale === 'zh-CN' ? '取消运行' : 'Cancel Run'}
                </button>
              ) : null}
              {supportActions.canResume ? (
                <button
                  type="button"
                  className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm disabled:opacity-60"
                  disabled={isBusy}
                  onClick={() => {
                    void Promise.resolve(supportActions.onResume?.())
                  }}
                >
                  {locale === 'zh-CN' ? '恢复运行' : 'Resume Run'}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
        {selectedVariants.length > 0 ? (
          <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
            <p className="text-sm font-medium text-text-main">
              {variantSelectionSummary
                ?? (locale === 'zh-CN'
                  ? `${selectedVariants.length} 个 variant 将随采纳决策提交。`
                  : `${selectedVariants.length} selected variant${selectedVariants.length === 1 ? '' : 's'} will travel with Accept.`)}
            </p>
            <p className="mt-1 text-sm leading-6 text-text-muted">
              {locale === 'zh-CN'
                ? 'Variant 选择仍需要这次 review decision，本身不会直接写入 canon。'
                : 'Variant choices still require this review decision and do not write canon on their own.'}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isBusy}
            onClick={() => {
              void submitDecision({ decision: 'accept' })
            }}
          >
            {locale === 'zh-CN' ? '采纳' : 'Accept'}
          </button>
          <button
            type="button"
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm disabled:opacity-60"
            disabled={isBusy}
            onClick={() => {
              setDraftDecision('accept-with-edit')
              setNote('')
              setPatchId('')
            }}
          >
            {locale === 'zh-CN' ? '编辑后采纳' : 'Accept With Edit'}
          </button>
          <button
            type="button"
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm disabled:opacity-60"
            disabled={isBusy}
            onClick={() => {
              setDraftDecision('request-rewrite')
              setNote('')
              setPatchId('')
            }}
          >
            {locale === 'zh-CN' ? '请求重写' : 'Request Rewrite'}
          </button>
          <button
            type="button"
            className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-muted disabled:opacity-60"
            disabled={isBusy}
            onClick={() => {
              setDraftDecision('reject')
              setNote('')
              setPatchId('')
            }}
          >
            {locale === 'zh-CN' ? '拒绝' : 'Reject'}
          </button>
        </div>
        {draftDecision ? (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-line-soft bg-surface-2 px-3 py-3">
            {rewriteDecisionNote ? (
              <div className="rounded-md border border-line-soft bg-surface-1 px-3 py-3">
                <p className="text-sm leading-6 text-text-muted">{rewriteDecisionNote}</p>
                {rewriteVariantNote ? (
                  <p className="mt-2 text-sm leading-6 text-text-muted">{rewriteVariantNote}</p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.05em] text-text-soft" htmlFor={`run-review-note-${pendingReviewId}`}>
                {noteLabel}
              </label>
              <textarea
                id={`run-review-note-${pendingReviewId}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm leading-6 text-text-main focus:border-line-strong focus:ring-0"
              />
            </div>
            {draftDecision === 'accept-with-edit' ? (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.05em] text-text-soft" htmlFor={`run-review-patch-${pendingReviewId}`}>
                  {locale === 'zh-CN' ? '补丁 ID' : 'Patch ID'}
                </label>
                <input
                  id={`run-review-patch-${pendingReviewId}`}
                  value={patchId}
                  onChange={(event) => setPatchId(event.target.value)}
                  className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main focus:border-line-strong focus:ring-0"
                />
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={isBusy}
              >
                {submitLabel}
              </button>
              <button
                type="button"
                className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-muted disabled:opacity-60"
                disabled={isBusy}
                onClick={() => {
                  setDraftDecision(null)
                  setNote('')
                  setPatchId('')
                }}
              >
                {locale === 'zh-CN' ? '取消' : 'Cancel'}
              </button>
            </div>
            <p className="text-xs text-text-soft">
              {locale === 'zh-CN'
                ? `待提交决策：${draftDecisionLabels[draftDecision]}`
                : `Pending decision: ${draftDecisionLabels[draftDecision]}`}
            </p>
          </form>
        ) : null}
      </div>
    </SectionCard>
  )
}
