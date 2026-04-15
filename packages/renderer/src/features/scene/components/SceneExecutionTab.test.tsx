import { render, screen } from '@testing-library/react'

import { SceneExecutionTab } from './SceneExecutionTab'
import type {
  BeatRailItemModel,
  ProposalCardModel,
  SceneAcceptedSummaryModel,
  SceneObjectiveModel,
} from '../types/scene-view-models'

const objective: SceneObjectiveModel = {
  goal: 'Keep the ledger closed while forcing Mei to show her leverage.',
  tensionLabel: 'Escalating',
  pacingLabel: 'Measured',
  cast: [
    { id: 'ren', name: 'Ren Voss', role: 'POV' },
    { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
  ],
  location: { id: 'platform', name: 'Rain-soaked platform' },
  warningsCount: 2,
  unresolvedCount: 3,
  constraintSummary: ['Ledger stays shut.', 'Alias stays private.'],
}

const beats: BeatRailItemModel[] = [
  {
    id: 'beat-bargain',
    index: 2,
    title: 'Bargain over the ledger',
    status: 'review',
    proposalCount: 2,
    warningCount: 1,
    summary: 'The bargaining beat is carrying the review load.',
  },
]

const proposals: ProposalCardModel[] = [
  {
    id: 'proposal-1',
    beatId: 'beat-bargain',
    actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' },
    kind: 'conflict',
    title: 'Force the bargain into a stalemate',
    summary: 'Ren refuses the first price and drags the courier into view as leverage.',
    status: 'pending',
    impactTags: ['stakes'],
    affects: [
      {
        path: 'scene.summary.conflict',
        label: 'Conflict temperature',
        deltaSummary: 'Escalates toward brinkmanship.',
      },
    ],
  },
]

const acceptedSummary: SceneAcceptedSummaryModel = {
  sceneSummary: 'Ren has accepted one leverage move but the bell beat is still pending.',
  acceptedFacts: [{ id: 'fact-1', label: 'Ledger', value: 'Still closed.' }],
  readiness: 'draftable',
  pendingProposalCount: 1,
  warningCount: 1,
  patchCandidateCount: 1,
}

describe('SceneExecutionTab', () => {
  it('frames execution as a review cockpit with a directing brief and stable prose-readiness footer', () => {
    render(
      <SceneExecutionTab
        objective={objective}
        beats={beats}
        proposals={proposals}
        actorOptions={[{ id: 'scene-manager', label: 'Scene Manager' }]}
        filters={{ beatId: 'beat-bargain' }}
        acceptedSummary={acceptedSummary}
        canContinueRun
        canOpenProse
        onContinueRun={vi.fn()}
        onOpenPatchPreview={vi.fn()}
        onOpenProse={vi.fn()}
        onSelectBeat={vi.fn()}
        onSelectProposal={vi.fn()}
        onAccept={vi.fn()}
        onEditAccept={vi.fn()}
        onRequestRewrite={vi.fn()}
        onReject={vi.fn()}
        onChangeFilters={vi.fn()}
        onClearFilters={vi.fn()}
      />,
    )

    expect(screen.getByText('Directing Brief')).toBeInTheDocument()
    expect(screen.getByText('Review Cockpit')).toBeInTheDocument()
    expect(screen.getByText('Ready for Prose')).toBeInTheDocument()
  })
})
