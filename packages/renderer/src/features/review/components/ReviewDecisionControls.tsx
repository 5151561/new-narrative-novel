import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { useI18n } from '@/app/i18n'
import type { ReviewIssueViewModel } from '@/features/review/types/review-view-models'

interface ReviewDecisionControlsProps {
  issue: ReviewIssueViewModel
  isSaving?: boolean
  onSetDecision: (input: {
    issueId: string
    issueSignature: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
  }) => void
  onClearDecision: (issueId: string) => void
}

function getDecisionTone(status: ReviewIssueViewModel['decision']['status']) {
  if (status === 'reviewed') {
    return 'accent' as const
  }
  if (status === 'deferred') {
    return 'warn' as const
  }
  if (status === 'dismissed') {
    return 'neutral' as const
  }
  if (status === 'stale') {
    return 'danger' as const
  }

  return 'neutral' as const
}

function getDecisionLabel(locale: 'en' | 'zh-CN', status: ReviewIssueViewModel['decision']['status']) {
  if (status === 'reviewed') {
    return locale === 'zh-CN' ? 'Reviewed' : 'Reviewed'
  }
  if (status === 'deferred') {
    return locale === 'zh-CN' ? 'Deferred' : 'Deferred'
  }
  if (status === 'dismissed') {
    return locale === 'zh-CN' ? 'Dismissed' : 'Dismissed'
  }
  if (status === 'stale') {
    return locale === 'zh-CN' ? 'Decision stale' : 'Decision stale'
  }

  return locale === 'zh-CN' ? 'Open' : 'Open'
}

export function ReviewDecisionControls({
  issue,
  isSaving = false,
  onSetDecision,
  onClearDecision,
}: ReviewDecisionControlsProps) {
  const { locale } = useI18n()
  const [note, setNote] = useState(issue.decision.note ?? '')
  const actioned = issue.decision.status === 'reviewed' || issue.decision.status === 'deferred' || issue.decision.status === 'dismissed'

  useEffect(() => {
    setNote(issue.decision.note ?? '')
  }, [issue.id, issue.decision.note, issue.decision.status])

  const normalizedNote = note.trim() ? note.trim() : undefined

  return (
    <div className="space-y-3 rounded-md border border-line-soft bg-surface-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={getDecisionTone(issue.decision.status)}>{getDecisionLabel(locale, issue.decision.status)}</Badge>
        {issue.decision.isStale ? <Badge tone="danger">{locale === 'zh-CN' ? 'Decision stale' : 'Decision stale'}</Badge> : null}
        {issue.decision.updatedAtLabel ? (
          <p className="text-xs text-text-soft">
            {issue.decision.updatedAtLabel}
            {issue.decision.updatedByLabel ? ` · ${issue.decision.updatedByLabel}` : ''}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor={`review-decision-note-${issue.id}`} className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
          {locale === 'zh-CN' ? 'Decision note' : 'Decision note'}
        </label>
        <textarea
          id={`review-decision-note-${issue.id}`}
          aria-label={locale === 'zh-CN' ? 'Decision note' : 'Decision note'}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          readOnly={actioned}
          rows={3}
          className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none transition-colors focus:border-line-strong read-only:text-text-muted"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {!actioned ? (
          <>
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                onSetDecision({
                  issueId: issue.id,
                  issueSignature: issue.issueSignature,
                  status: 'reviewed',
                  note: normalizedNote,
                })
              }
              className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
            >
              {locale === 'zh-CN' ? 'Mark reviewed' : 'Mark reviewed'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                onSetDecision({
                  issueId: issue.id,
                  issueSignature: issue.issueSignature,
                  status: 'deferred',
                  note: normalizedNote,
                })
              }
              className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
            >
              {locale === 'zh-CN' ? 'Defer' : 'Defer'}
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() =>
                onSetDecision({
                  issueId: issue.id,
                  issueSignature: issue.issueSignature,
                  status: 'dismissed',
                  note: normalizedNote,
                })
              }
              className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
            >
              {locale === 'zh-CN' ? 'Dismiss for this pass' : 'Dismiss for this pass'}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onClearDecision(issue.id)}
            className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
          >
            {locale === 'zh-CN' ? 'Reopen' : 'Reopen'}
          </button>
        )}
      </div>
    </div>
  )
}
