import { Badge } from '@/components/ui/Badge'
import { FactList } from '@/components/ui/FactList'
import { StickyFooter } from '@/components/ui/StickyFooter'

import type { SceneAcceptedSummaryModel } from '../types/scene-view-models'

interface AcceptedStateFooterProps {
  summary: SceneAcceptedSummaryModel
  canContinueRun: boolean
  canOpenProse: boolean
}

export function AcceptedStateFooter({
  summary,
  canContinueRun,
  canOpenProse,
}: AcceptedStateFooterProps) {
  return (
    <StickyFooter className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Accepted state</p>
          <p className="max-w-3xl text-sm leading-6 text-text-main">{summary.sceneSummary}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={summary.readiness === 'ready' ? 'success' : 'accent'}>{summary.readiness}</Badge>
            <Badge tone={summary.pendingProposalCount > 0 ? 'warn' : 'neutral'}>
              Pending proposals: {summary.pendingProposalCount}
            </Badge>
            <Badge tone={summary.patchCandidateCount ? 'accent' : 'neutral'}>
              Patch Preview: {summary.patchCandidateCount ?? 0}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
            disabled={!canContinueRun}
          >
            Continue Run
          </button>
          <button
            type="button"
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
          >
            Patch Preview
          </button>
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={!canOpenProse}
          >
            Open Prose
          </button>
        </div>
      </div>
      <FactList items={summary.acceptedFacts} />
    </StickyFooter>
  )
}
