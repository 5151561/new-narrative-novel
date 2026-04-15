import { EmptyState } from '@/components/ui/EmptyState'
import { PaneHeader } from '@/components/ui/PaneHeader'
import { Toolbar } from '@/components/ui/Toolbar'

import type { ProposalCardModel, ProposalFilters } from '../types/scene-view-models'
import { ProposalCard } from './ProposalCard'

interface ProposalReviewStackProps {
  proposals: ProposalCardModel[]
  selectedProposalId?: string
  filters: ProposalFilters
  onSelectProposal: (proposalId: string) => void
  onAccept: (proposalId: string) => void
  onEditAccept: (proposalId: string, editedSummary: string) => void
  onRequestRewrite: (proposalId: string) => void
  onReject: (proposalId: string) => void
  onClearFilters: () => void
}

export function ProposalReviewStack({
  proposals,
  selectedProposalId,
  filters,
  onSelectProposal,
  onAccept,
  onEditAccept,
  onRequestRewrite,
  onReject,
  onClearFilters,
}: ProposalReviewStackProps) {
  return (
    <div className="flex min-h-0 flex-col">
      <PaneHeader
        title="Proposal Review"
        description="Accept only advances candidates into accepted state and patch preview. Commit does not happen here."
      />
      <div className="border-b border-line-soft px-4 py-3">
        <Toolbar>
          <span className="text-sm text-text-muted">
            {filters.beatId ? `Filtered to ${filters.beatId}` : 'All beats visible'}
          </span>
          {filters.status ? <span className="text-sm text-text-muted">Status: {filters.status}</span> : null}
          <button type="button" onClick={onClearFilters} className="rounded-md border border-line-soft bg-surface-1 px-3 py-1.5 text-sm">
            Reset Filters
          </button>
        </Toolbar>
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
