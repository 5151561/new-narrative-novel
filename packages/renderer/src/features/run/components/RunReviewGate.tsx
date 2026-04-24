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
  onSubmitDecision,
}: RunReviewGateProps) {
  const { locale } = useI18n()
  const [draftDecision, setDraftDecision] = useState<DraftDecision | null>(null)
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
