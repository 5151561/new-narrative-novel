import { type FormEvent, useState } from 'react'

import { Badge } from '@/components/ui/Badge'
import { SectionCard } from '@/components/ui/SectionCard'
import { cn } from '@/lib/cn'

import type { ProposalCardModel } from '../types/scene-view-models'

interface ProposalCardProps {
  proposal: ProposalCardModel
  selected?: boolean
  onSelect: (proposalId: string) => void
  onAccept: (proposalId: string) => void
  onEditAccept: (proposalId: string, editedSummary: string) => void
  onRequestRewrite: (proposalId: string) => void
  onReject: (proposalId: string) => void
}

const statusTone = {
  pending: 'accent',
  accepted: 'success',
  rejected: 'danger',
  'rewrite-requested': 'warn',
} as const

export function ProposalCard({
  proposal,
  selected,
  onSelect,
  onAccept,
  onEditAccept,
  onRequestRewrite,
  onReject,
}: ProposalCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftSummary, setDraftSummary] = useState(proposal.summary)

  function handleToggleEdit() {
    setDraftSummary(proposal.summary)
    setIsEditing((current) => !current)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onEditAccept(proposal.id, draftSummary.trim() || proposal.summary)
    setIsEditing(false)
  }

  return (
    <SectionCard
      className={cn(selected && 'border-line-strong bg-surface-2')}
      eyebrow={proposal.kind}
      title={proposal.title}
      actions={<Badge tone={statusTone[proposal.status]}>{proposal.status}</Badge>}
    >
      <button type="button" className="w-full text-left" onClick={() => onSelect(proposal.id)}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{proposal.actor.name}</Badge>
          {proposal.impactTags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
        <p className="mt-3 text-sm leading-6 text-text-main">{proposal.summary}</p>
        {proposal.detail ? <p className="mt-2 text-sm leading-6 text-text-muted">{proposal.detail}</p> : null}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Affected state</p>
            {proposal.affects.map((affected) => (
              <div key={affected.path} className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
                <p className="text-sm font-medium text-text-main">{affected.label}</p>
                <p className="mt-1 text-sm leading-6 text-text-muted">{affected.deltaSummary}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Evidence & risks</p>
            <div className="rounded-md border border-line-soft bg-surface-2 px-3 py-3">
              <ul className="space-y-2 text-sm leading-6 text-text-muted">
                {proposal.evidencePeek?.map((line) => <li key={line}>{line}</li>)}
                {proposal.risks?.map((risk) => <li key={risk.message}>{risk.severity}: {risk.message}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onAccept(proposal.id)}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={proposal.status === 'accepted'}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={handleToggleEdit}
          className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
        >
          Edit Then Accept
        </button>
        <button
          type="button"
          onClick={() => onRequestRewrite(proposal.id)}
          className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
        >
          Request Rewrite
        </button>
        <button
          type="button"
          onClick={() => onReject(proposal.id)}
          className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-muted"
        >
          Reject
        </button>
      </div>
      {isEditing ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-md border border-line-soft bg-surface-2 px-3 py-3">
          <div className="space-y-2">
            <label htmlFor={`edited-summary-${proposal.id}`} className="text-xs uppercase tracking-[0.05em] text-text-soft">
              Edited proposal summary
            </label>
            <textarea
              id={`edited-summary-${proposal.id}`}
              value={draftSummary}
              onChange={(event) => setDraftSummary(event.target.value)}
              rows={4}
              className="w-full rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm leading-6 text-text-main focus:border-line-strong focus:ring-0"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white"
            >
              Save Edited Acceptance
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftSummary(proposal.summary)
                setIsEditing(false)
              }}
              className="rounded-md border border-line-soft bg-surface-1 px-3 py-2 text-sm text-text-muted"
            >
              Cancel Edit
            </button>
          </div>
        </form>
      ) : null}
    </SectionCard>
  )
}
