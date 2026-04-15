import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { Toolbar } from '@/components/ui/Toolbar'

import type { ProposalCardModel, ProposalFilters } from '../types/scene-view-models'
import { ProposalCard } from './ProposalCard'

const proposalStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'rewrite-requested', label: 'Rewrite Requested' },
] as const

const proposalKindOptions = [
  { value: 'action', label: 'Action' },
  { value: 'intent', label: 'Intent' },
  { value: 'conflict', label: 'Conflict' },
  { value: 'state-change', label: 'State Change' },
  { value: 'dialogue', label: 'Dialogue' },
] as const

const proposalSeverityOptions = [
  { value: 'info', label: 'Info' },
  { value: 'warn', label: 'Warn' },
  { value: 'high', label: 'High' },
] as const

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
  const activeFilterLabel = filters.beatId ? `Filtered to ${filters.beatId}` : 'All beats visible'
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
        title="Review Cockpit"
        description="Proposal Review"
        actions={<span className="text-sm text-text-muted">{proposals.length} in stack</span>}
      />
      <div className="border-b border-line-soft bg-surface-2/70 px-4 py-3">
        <div className="space-y-3">
          <Toolbar>
            <span className="text-sm text-text-muted">{activeFilterLabel}</span>
            <span className="text-sm text-text-muted">Beat filters keep the stack structural.</span>
            <span className="text-sm text-text-muted">Trace and deep diagnostics stay in the dock.</span>
            <button type="button" onClick={onClearFilters} className="rounded-md border border-line-soft bg-surface-1 px-3 py-1.5 text-sm">
              Reset Filters
            </button>
          </Toolbar>
          <div className="grid gap-3 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.05em] text-text-soft">Status</span>
              <select
                aria-label="Status"
                value={filters.status ?? ''}
                onChange={(event) => updateFilter('status', (event.target.value || undefined) as ProposalFilters['status'])}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
              >
                <option value="">All statuses</option>
                {proposalStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.05em] text-text-soft">Kind</span>
              <select
                aria-label="Kind"
                value={filters.kind ?? ''}
                onChange={(event) => updateFilter('kind', (event.target.value || undefined) as ProposalFilters['kind'])}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
              >
                <option value="">All kinds</option>
                {proposalKindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.05em] text-text-soft">Actor</span>
              <select
                aria-label="Actor"
                value={filters.actorId ?? ''}
                onChange={(event) => updateFilter('actorId', event.target.value || undefined)}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
              >
                <option value="">All actors</option>
                {actorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs uppercase tracking-[0.05em] text-text-soft">Risk</span>
              <select
                aria-label="Risk"
                value={filters.severity ?? ''}
                onChange={(event) => updateFilter('severity', (event.target.value || undefined) as ProposalFilters['severity'])}
                className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-main"
              >
                <option value="">All risks</option>
                {proposalSeverityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="text-sm text-text-muted">
              {hasActiveReviewFilters ? 'Review filters active' : 'Review filters idle'}
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {proposals.length === 0 ? (
          <EmptyState
            title="No proposals in this slice"
            message="The execution view keeps context filtered by beat and proposal state. Clear filters or switch beats to review a different stack."
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
