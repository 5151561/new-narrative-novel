import {
  getProposalKindLabel,
  getProposalSeverityLabel,
  getProposalStatusOptionLabel,
  useI18n,
} from '@/app/i18n'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { Toolbar } from '@/components/ui/Toolbar'

import type { ProposalCardModel, ProposalFilters } from '../types/scene-view-models'
import { ProposalCard } from './ProposalCard'

const proposalStatusOptions = ['pending', 'accepted', 'rejected', 'rewrite-requested'] as const
const proposalKindOptions = ['action', 'intent', 'conflict', 'state-change', 'dialogue'] as const
const proposalSeverityOptions = ['info', 'warn', 'high'] as const

interface ProposalReviewStackProps {
  proposals: ProposalCardModel[]
  actorOptions: Array<{ id: string; label: string }>
  selectedProposalId?: string
  filters: ProposalFilters
  onSelectProposal: (proposalId: string) => void
  onAccept: (proposalId: string) => void
  onEditAccept: (proposalId: string, editedSummary: string) => void
  onRequestRewrite: (proposalId: string) => void
  onReject: (proposalId: string) => void
  onChangeFilters: (next: ProposalFilters) => void
  onClearFilters: () => void
}

export function ProposalReviewStack({
  proposals,
  actorOptions,
  selectedProposalId,
  filters,
  onSelectProposal,
  onAccept,
  onEditAccept,
  onRequestRewrite,
  onReject,
  onChangeFilters,
  onClearFilters,
}: ProposalReviewStackProps) {
  const { locale } = useI18n()
  const activeFilterLabel = filters.beatId
    ? locale === 'zh-CN'
      ? `已筛到 ${filters.beatId}`
      : `Filtered to ${filters.beatId}`
    : locale === 'zh-CN'
      ? '显示全部节拍'
      : 'All beats visible'
  const hasActiveReviewFilters = Boolean(filters.status || filters.kind || filters.actorId || filters.severity)

  function updateFilter<Key extends keyof ProposalFilters>(key: Key, value: ProposalFilters[Key] | undefined) {
    const next: ProposalFilters = {
      ...filters,
      [key]: value,
    }

    if (value === undefined) {
      delete next[key]
    }

    onChangeFilters(next)
  }

  return (
    <div className="flex min-h-0 flex-col bg-surface-1">
      <PaneHeader
        title={locale === 'zh-CN' ? '评审驾驶舱' : 'Review Cockpit'}
        description={locale === 'zh-CN' ? '提案评审' : 'Proposal Review'}
        actions={
          <span className="text-sm text-text-muted">
            {locale === 'zh-CN' ? `栈内 ${proposals.length} 条` : `${proposals.length} in stack`}
          </span>
        }
      />
      <div className="border-b border-line-soft bg-surface-2/70 px-4 py-3">
        <div className="space-y-3">
          <Toolbar>
            <span className="text-sm text-text-muted">{activeFilterLabel}</span>
            <span className="text-sm text-text-muted">
              {locale === 'zh-CN' ? '节拍筛选会让提案栈保持在结构层。' : 'Beat filters keep the stack structural.'}
            </span>
            <span className="text-sm text-text-muted">
              {locale === 'zh-CN' ? '追踪和深层诊断继续留在底部面板。' : 'Trace and deep diagnostics stay in the dock.'}
            </span>
            <button type="button" onClick={onClearFilters} className="rounded-md border border-line-soft bg-surface-1 px-3 py-1.5 text-sm">
              {locale === 'zh-CN' ? '重置筛选' : 'Reset Filters'}
            </button>
          </Toolbar>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '状态' : 'Status'}</span>
              <select
                aria-label={locale === 'zh-CN' ? '状态' : 'Status'}
                value={filters.status ?? ''}
                onChange={(event) => updateFilter('status', (event.target.value || undefined) as ProposalFilters['status'])}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
              >
                <option value="">{locale === 'zh-CN' ? '全部状态' : 'All statuses'}</option>
                {proposalStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {getProposalStatusOptionLabel(locale, option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '类型' : 'Kind'}</span>
              <select
                aria-label={locale === 'zh-CN' ? '类型' : 'Kind'}
                value={filters.kind ?? ''}
                onChange={(event) => updateFilter('kind', (event.target.value || undefined) as ProposalFilters['kind'])}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
              >
                <option value="">{locale === 'zh-CN' ? '全部类型' : 'All kinds'}</option>
                {proposalKindOptions.map((option) => (
                  <option key={option} value={option}>
                    {getProposalKindLabel(locale, option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '角色' : 'Actor'}</span>
              <select
                aria-label={locale === 'zh-CN' ? '角色' : 'Actor'}
                value={filters.actorId ?? ''}
                onChange={(event) => updateFilter('actorId', event.target.value || undefined)}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
              >
                <option value="">{locale === 'zh-CN' ? '全部角色' : 'All actors'}</option>
                {actorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.05em] text-text-soft">{locale === 'zh-CN' ? '风险' : 'Risk'}</span>
              <select
                aria-label={locale === 'zh-CN' ? '风险' : 'Risk'}
                value={filters.severity ?? ''}
                onChange={(event) => updateFilter('severity', (event.target.value || undefined) as ProposalFilters['severity'])}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
              >
                <option value="">{locale === 'zh-CN' ? '全部风险' : 'All risks'}</option>
                {proposalSeverityOptions.map((option) => (
                  <option key={option} value={option}>
                    {getProposalSeverityLabel(locale, option)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="text-sm text-text-muted">
            {hasActiveReviewFilters
              ? locale === 'zh-CN'
                ? '评审筛选已启用'
                : 'Review filters active'
              : locale === 'zh-CN'
                ? '评审筛选未启用'
                : 'Review filters idle'}
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {proposals.length === 0 ? (
          <EmptyState
            title={locale === 'zh-CN' ? '这个切片里没有提案' : 'No proposals in this slice'}
            message={
              locale === 'zh-CN'
                ? '执行视图会按节拍和提案状态过滤上下文。可以清空筛选，或者切换节拍去看另一组栈。'
                : 'The execution view keeps context filtered by beat and proposal state. Clear filters or switch beats to review a different stack.'
            }
          />
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                selected={selectedProposalId === proposal.id}
                onSelect={onSelectProposal}
                onAccept={onAccept}
                onEditAccept={onEditAccept}
                onRequestRewrite={onRequestRewrite}
                onReject={onReject}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
