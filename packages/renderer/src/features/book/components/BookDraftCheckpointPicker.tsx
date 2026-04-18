import { useMemo } from 'react'

import { useI18n } from '@/app/i18n'

import type { BookManuscriptCheckpointSummaryViewModel } from '../types/book-compare-view-models'

interface BookDraftCheckpointPickerProps {
  checkpoints: BookManuscriptCheckpointSummaryViewModel[]
  selectedCheckpointId: string
  checkpointMeta?: {
    title: string
    createdAtLabel: string
    summary: string
  } | null
  onSelectCheckpoint: (checkpointId: string) => void
}

export function BookDraftCheckpointPicker({
  checkpoints,
  selectedCheckpointId,
  checkpointMeta = null,
  onSelectCheckpoint,
}: BookDraftCheckpointPickerProps) {
  const { locale } = useI18n()
  const selectedCheckpoint = useMemo(
    () => checkpoints.find((checkpoint) => checkpoint.checkpointId === selectedCheckpointId) ?? checkpoints[0] ?? null,
    [checkpoints, selectedCheckpointId],
  )
  const summary = checkpointMeta ?? selectedCheckpoint

  return (
    <section className="rounded-md border border-line-soft bg-surface-1 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
            {locale === 'zh-CN' ? '手稿 checkpoint' : 'Manuscript checkpoint'}
          </p>
          <h3 className="text-base text-text-main">{summary?.title ?? selectedCheckpoint?.title ?? selectedCheckpointId}</h3>
          {summary?.createdAtLabel ? <p className="text-sm text-text-muted">{summary.createdAtLabel}</p> : null}
        </div>
        <label className="min-w-[220px] text-sm text-text-muted">
          <span className="sr-only">{locale === 'zh-CN' ? '手稿 checkpoint' : 'Manuscript checkpoint'}</span>
          <select
            aria-label={locale === 'zh-CN' ? '手稿 checkpoint' : 'Manuscript checkpoint'}
            value={selectedCheckpointId}
            onChange={(event) => onSelectCheckpoint(event.target.value)}
            className="w-full rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm text-text-main outline-none focus:border-line-strong"
          >
            {checkpoints.map((checkpoint) => (
              <option key={checkpoint.checkpointId} value={checkpoint.checkpointId}>
                {checkpoint.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      {summary?.summary ? <p className="mt-3 text-sm leading-6 text-text-muted">{summary.summary}</p> : null}
    </section>
  )
}
