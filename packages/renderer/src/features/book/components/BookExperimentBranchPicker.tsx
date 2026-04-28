import { Badge } from '@/components/ui/Badge'

import { useI18n } from '@/app/i18n'
import type { BookBranchBaseline } from '@/features/workbench/types/workbench-route'

import type { BookExperimentBranchSummaryViewModel } from '../types/book-branch-view-models'

interface BookExperimentBranchPickerProps {
  branches: BookExperimentBranchSummaryViewModel[]
  selectedBranchId: string
  branchBaseline: BookBranchBaseline
  onSelectBranch: (branchId: string) => void
  onSelectBranchBaseline: (baseline: BookBranchBaseline) => void
  onArchiveBranch?: (branchId: string) => void
}

function getStatusBadge(locale: 'en' | 'zh-CN', status: BookExperimentBranchSummaryViewModel['status']) {
  if (status === 'active') {
    return { tone: 'accent' as const, label: locale === 'zh-CN' ? '进行中' : 'Active' }
  }

  if (status === 'review') {
    return { tone: 'warn' as const, label: locale === 'zh-CN' ? '审阅中' : 'Review' }
  }

  return { tone: 'neutral' as const, label: locale === 'zh-CN' ? '已归档' : 'Archived' }
}

export function BookExperimentBranchPicker({
  branches,
  selectedBranchId,
  branchBaseline,
  onSelectBranch,
  onSelectBranchBaseline,
  onArchiveBranch,
}: BookExperimentBranchPickerProps) {
  const { locale } = useI18n()
  const selectedBranch = branches.find((branch) => branch.branchId === selectedBranchId) ?? null
  const archiveDisabledReason =
    selectedBranch?.status === 'archived'
      ? locale === 'zh-CN'
        ? '已归档实验稿不能再次归档。'
        : 'Archived branches cannot be archived again.'
      : !selectedBranch
        ? locale === 'zh-CN'
          ? '请先选择一个实验稿。'
          : 'Select a branch first.'
        : !onArchiveBranch
          ? locale === 'zh-CN'
            ? '归档接线将在后续 bundle 中连通。'
            : 'Archive wiring will connect in a later bundle.'
          : null
  const archiveDisabled = Boolean(archiveDisabledReason)

  return (
    <section className="space-y-4 rounded-md border border-line-soft bg-surface-1 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.08em] text-text-soft">
            {locale === 'zh-CN' ? '实验稿' : 'Experiment branch'}
          </p>
          <h4 className="text-base text-text-main">{selectedBranch?.title ?? selectedBranchId}</h4>
          {selectedBranch?.createdAtLabel ? <p className="text-sm text-text-muted">{selectedBranch.createdAtLabel}</p> : null}
        </div>
        <div className="inline-flex rounded-md border border-line-soft bg-surface-2 p-1">
          <button
            type="button"
            aria-pressed={branchBaseline === 'current'}
            onClick={() => onSelectBranchBaseline('current')}
            className={`rounded-md px-3 py-2 text-sm ${
              branchBaseline === 'current' ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
            }`}
          >
            {locale === 'zh-CN' ? '当前正文基线' : 'Current baseline'}
          </button>
          <button
            type="button"
            aria-pressed={branchBaseline === 'checkpoint'}
            onClick={() => onSelectBranchBaseline('checkpoint')}
            className={`rounded-md px-3 py-2 text-sm ${
              branchBaseline === 'checkpoint' ? 'bg-surface-1 text-text-main shadow-ringwarm' : 'text-text-muted'
            }`}
          >
            {locale === 'zh-CN' ? 'Checkpoint 基线' : 'Checkpoint baseline'}
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {selectedBranch?.rationale ? <p className="text-sm leading-6 text-text-muted">{selectedBranch.rationale}</p> : <span />}
        <div className="flex min-w-[220px] flex-col items-end gap-2">
          <button
            type="button"
            aria-label={locale === 'zh-CN' ? '归档实验稿' : 'Archive branch'}
            disabled={archiveDisabled}
            onClick={() => {
              if (!archiveDisabled && selectedBranch) {
                onArchiveBranch?.(selectedBranch.branchId)
              }
            }}
            className="rounded-md border border-line-soft px-3 py-2 text-sm text-text-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {locale === 'zh-CN' ? '归档实验稿' : 'Archive branch'}
          </button>
          {archiveDisabledReason ? <p className="text-xs leading-5 text-text-soft">{archiveDisabledReason}</p> : null}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {branches.map((branch) => {
          const active = branch.branchId === selectedBranchId
          const status = getStatusBadge(locale, branch.status)

          return (
            <button
              key={branch.branchId}
              type="button"
              aria-pressed={active}
              onClick={() => onSelectBranch(branch.branchId)}
              className={`rounded-md border px-4 py-4 text-left ${
                active ? 'border-line-strong bg-surface-1 shadow-sm' : 'border-line-soft bg-surface-2'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-main">{branch.title}</p>
                  <p className="mt-1 text-sm leading-6 text-text-muted">{branch.summary}</p>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              {branch.rationale ? <p className="mt-3 text-sm leading-6 text-text-muted">{branch.rationale}</p> : null}
              <p className="mt-3 text-xs uppercase tracking-[0.05em] text-text-soft">{branch.createdAtLabel}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
