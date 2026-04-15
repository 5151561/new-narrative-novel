import type {
  BeatRailItemModel,
  ProposalCardModel,
  ProposalFilters,
  SceneAcceptedSummaryModel,
  SceneObjectiveModel,
} from '../types/scene-view-models'

import { AcceptedStateFooter } from './AcceptedStateFooter'
import { BeatRail } from './BeatRail'
import { ProposalReviewStack } from './ProposalReviewStack'
import { SceneObjectiveStrip } from './SceneObjectiveStrip'

interface SceneExecutionTabProps {
  objective: SceneObjectiveModel
  beats: BeatRailItemModel[]
  proposals: ProposalCardModel[]
  selectedBeatId?: string
  selectedProposalId?: string
  filters: ProposalFilters
  acceptedSummary: SceneAcceptedSummaryModel
  canContinueRun: boolean
  canOpenProse: boolean
  onContinueRun: () => void
  onOpenPatchPreview: () => void
  onOpenProse: () => void
  onSelectBeat: (beatId: string) => void
  onSelectProposal: (proposalId: string) => void
  onAccept: (proposalId: string) => void
  onEditAccept: (proposalId: string, editedSummary: string) => void
  onRequestRewrite: (proposalId: string) => void
  onReject: (proposalId: string) => void
  onClearFilters: () => void
}

export function SceneExecutionTab({
  objective,
  beats,
  proposals,
  selectedBeatId,
  selectedProposalId,
  filters,
  acceptedSummary,
  canContinueRun,
  canOpenProse,
  onContinueRun,
  onOpenPatchPreview,
  onOpenProse,
  onSelectBeat,
  onSelectProposal,
  onAccept,
  onEditAccept,
  onRequestRewrite,
  onReject,
  onClearFilters,
}: SceneExecutionTabProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SceneObjectiveStrip objective={objective} />
      <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)] overflow-hidden">
        <BeatRail beats={beats} selectedBeatId={selectedBeatId} onSelectBeat={onSelectBeat} />
        <ProposalReviewStack
          proposals={proposals}
          selectedProposalId={selectedProposalId}
          filters={filters}
          onSelectProposal={onSelectProposal}
          onAccept={onAccept}
          onEditAccept={onEditAccept}
          onRequestRewrite={onRequestRewrite}
          onReject={onReject}
          onClearFilters={onClearFilters}
        />
      </div>
      <AcceptedStateFooter
        summary={acceptedSummary}
        canContinueRun={canContinueRun}
        canOpenProse={canOpenProse}
        onContinueRun={onContinueRun}
        onOpenPatchPreview={onOpenPatchPreview}
        onOpenProse={onOpenProse}
      />
    </div>
  )
}
