import { Badge } from '@/components/ui/Badge'
import { FactList } from '@/components/ui/FactList'
import { StickyFooter } from '@/components/ui/StickyFooter'

import type { SceneAcceptedSummaryModel } from '../types/scene-view-models'

interface AcceptedStateFooterProps {
  summary: SceneAcceptedSummaryModel
  canContinueRun: boolean
  canOpenProse: boolean
  onContinueRun: () => void
  onOpenPatchPreview: () => void
  onOpenProse: () => void
}

export function AcceptedStateFooter({
  summary,
  canContinueRun,
  canOpenProse,
  onContinueRun,
  onOpenPatchPreview,
  onOpenProse,
}: AcceptedStateFooterProps) {
  return (
    <StickyFooter className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Scene Summary</p>
          <p className="max-w-3xl text-sm leading-6 text-text-main">{summary.sceneSummary}</p>
          <p className="text-sm font-medium text-text-main">Ready for Prose</p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={summary.readiness === 'ready' ? 'success' : 'accent'}>Ready for Prose: {summary.readiness}</Badge>
            <Badge tone={summary.pendingProposalCount > 0 ? 'warn' : 'neutral'}>
              Pending proposals: {summary.pendingProposalCount}
            </Badge>
            <Badge tone={summary.warningCount > 0 ? 'warn' : 'neutral'}>Warnings: {summary.warningCount}</Badge>
            <Badge tone={summary.patchCandidateCount ? 'accent' : 'neutral'}>
              Patch Preview: {summary.patchCandidateCount ?? 0}
            </Badge>
          </div>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.05em] text-text-soft">Next actions</p>
            <p className="text-sm leading-6 text-text-muted">
              Continue review, inspect the patch preview, or move this accepted state into prose.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onContinueRun}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
            disabled={!canContinueRun}
          >
            Continue Run
          </button>
          <button
            type="button"
            onClick={onOpenPatchPreview}
            className="rounded-md border border-line-soft bg-surface-2 px-3 py-2 text-sm"
          >
            Patch Preview
          </button>
          <button
            type="button"
            onClick={onOpenProse}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={!canOpenProse}
          >
            Open Prose
          </button>
        </div>
        </div>
      </div>
      <FactList items={summary.acceptedFacts} />
    </StickyFooter>
  )
}
