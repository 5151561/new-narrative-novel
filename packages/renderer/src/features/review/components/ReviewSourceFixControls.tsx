import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { useI18n } from '@/app/i18n'
import type {
  ReviewIssueViewModel,
  ReviewSourceHandoffViewModel,
} from '@/features/review/types/review-view-models'

interface ReviewSourceFixControlsProps {
  issue: ReviewIssueViewModel
  isSaving?: boolean
  onStartFix: (input: {
    issueId: string
    issueSignature: string
    handoff: ReviewSourceHandoffViewModel
    note?: string
  }) => void
  onSetFixStatus: (input: {
    issueId: string
    issueSignature: string
    status: 'checked' | 'blocked'
    handoff: ReviewSourceHandoffViewModel
    note?: string
  }) => void
  onClearFix: (issueId: string) => void
}

function getFixTone(status: ReviewIssueViewModel['fixAction']['status']) {
  if (status === 'checked') {
    return 'success' as const
  }
  if (status === 'blocked') {
    return 'danger' as const
  }
  if (status === 'stale') {
    return 'warn' as const
  }
  if (status === 'started') {
    return 'accent' as const
  }

  return 'neutral' as const
}

function getFixLabel(locale: 'en' | 'zh-CN', status: ReviewIssueViewModel['fixAction']['status']) {
  if (status === 'started') {
    return locale === 'zh-CN' ? 'Fix started' : 'Fix started'
  }
  if (status === 'checked') {
    return locale === 'zh-CN' ? 'Checked' : 'Checked'
  }
  if (status === 'blocked') {
    return locale === 'zh-CN' ? 'Blocked' : 'Blocked'
  }
  if (status === 'stale') {
    return locale === 'zh-CN' ? 'Fix stale' : 'Fix stale'
  }

  return locale === 'zh-CN' ? 'Not started' : 'Not started'
}

function getTargetScopeLabel(locale: 'en' | 'zh-CN', issue: ReviewIssueViewModel) {
  const handoff = issue.primaryFixHandoff
  if (!handoff) {
    return locale === 'zh-CN' ? 'No recommended source target' : 'No recommended source target'
  }

  return `${handoff.label} · ${handoff.target.scope}`
}

export function ReviewSourceFixControls({
  issue,
  isSaving = false,
  onStartFix,
  onSetFixStatus,
  onClearFix,
}: ReviewSourceFixControlsProps) {
  const { locale } = useI18n()
  const [note, setNote] = useState(issue.fixAction.note ?? '')
  const handoff = issue.primaryFixHandoff
  const normalizedNote = note.trim() ? note.trim() : undefined
  const canSubmit = Boolean(handoff) && !isSaving
  const isCompleted = issue.fixAction.status === 'checked' || issue.fixAction.status === 'blocked'

  useEffect(() => {
    setNote(issue.fixAction.note ?? '')
  }, [issue.id, issue.fixAction.note, issue.fixAction.status])

  const startFix = () => {
    if (!handoff) {
      return
    }

    onStartFix({
      issueId: issue.id,
      issueSignature: issue.issueSignature,
      handoff,
      note: normalizedNote,
    })
  }

  const setFixStatus = (status: 'checked' | 'blocked') => {
    if (!handoff) {
      return
    }

    onSetFixStatus({
      issueId: issue.id,
      issueSignature: issue.issueSignature,
      status,
      handoff,
      note: normalizedNote,
    })
  }

  return (
    <div className="space-y-3 rounded-md border border-line-soft bg-surface-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={getFixTone(issue.fixAction.status)}>{getFixLabel(locale, issue.fixAction.status)}</Badge>
        {issue.fixAction.updatedAtLabel ? (
          <p className="text-xs text-text-soft">
            {issue.fixAction.updatedAtLabel}
            {issue.fixAction.updatedByLabel ? ` · ${issue.fixAction.updatedByLabel}` : ''}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
          {locale === 'zh-CN' ? 'Primary fix target' : 'Primary fix target'}
        </p>
        <p className="text-sm leading-6 text-text-main">{getTargetScopeLabel(locale, issue)}</p>
        {!handoff ? (
          <p className="text-xs leading-5 text-text-soft">
            {locale === 'zh-CN'
              ? 'No recommended source target is available for this issue.'
              : 'No recommended source target is available for this issue.'}
          </p>
        ) : null}
      </div>

      {issue.fixAction.status === 'checked' ? (
        <p className="text-sm leading-6 text-text-muted">
          {locale === 'zh-CN'
            ? `Source checked from ${issue.fixAction.sourceHandoffLabel ?? getTargetScopeLabel(locale, issue)}.`
            : `Source checked from ${issue.fixAction.sourceHandoffLabel ?? getTargetScopeLabel(locale, issue)}.`}
        </p>
      ) : null}

      {issue.fixAction.status === 'blocked' ? (
        <p className="text-sm leading-6 text-text-muted">
          {locale === 'zh-CN'
            ? `Source fix blocked at ${issue.fixAction.sourceHandoffLabel ?? getTargetScopeLabel(locale, issue)}.`
            : `Source fix blocked at ${issue.fixAction.sourceHandoffLabel ?? getTargetScopeLabel(locale, issue)}.`}
        </p>
      ) : null}

      {issue.fixAction.status === 'stale' ? (
        <p className="rounded-md border border-[rgba(156,122,58,0.28)] bg-[rgba(156,122,58,0.08)] px-3 py-2 text-sm leading-6 text-text-main">
          {locale === 'zh-CN'
            ? 'This source fix is stale because the review issue changed after the fix action was recorded.'
            : 'This source fix is stale because the review issue changed after the fix action was recorded.'}
        </p>
      ) : null}

      <div className="space-y-2">
        <label htmlFor={`review-source-fix-note-${issue.id}`} className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
          {locale === 'zh-CN' ? 'Source fix note' : 'Source fix note'}
        </label>
        <textarea
          id={`review-source-fix-note-${issue.id}`}
          aria-label={locale === 'zh-CN' ? 'Source fix note' : 'Source fix note'}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          readOnly={isCompleted}
          rows={3}
          className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main outline-none transition-colors focus:border-line-strong read-only:text-text-muted"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {issue.fixAction.status === 'not_started' ? (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={startFix}
            className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
          >
            {locale === 'zh-CN' ? 'Start source fix' : 'Start source fix'}
          </button>
        ) : null}

        {issue.fixAction.status === 'started' ? (
          <>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => setFixStatus('checked')}
              className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
            >
              {locale === 'zh-CN' ? 'Mark source checked' : 'Mark source checked'}
            </button>
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() => setFixStatus('blocked')}
              className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
            >
              {locale === 'zh-CN' ? 'Mark blocked' : 'Mark blocked'}
            </button>
          </>
        ) : null}

        {issue.fixAction.status === 'stale' ? (
          <button
            type="button"
            disabled={!canSubmit}
            onClick={startFix}
            className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
          >
            {locale === 'zh-CN' ? 'Restart source fix' : 'Restart source fix'}
          </button>
        ) : null}

        {issue.fixAction.status !== 'not_started' ? (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onClearFix(issue.id)}
            className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main hover:bg-surface-1 disabled:cursor-not-allowed disabled:text-text-soft"
          >
            {locale === 'zh-CN' ? 'Clear fix action' : 'Clear fix action'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
