import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AppProviders } from '@/app/providers'

import { SceneTraceabilityPanel } from './SceneTraceabilityPanel'
import type { SceneTraceabilityViewModel } from '@/features/traceability/types/traceability-view-models'

const traceabilityData: SceneTraceabilityViewModel = {
  sceneId: 'scene-midnight-platform',
  acceptedFacts: [
    {
      id: 'fact-1',
      label: 'Ledger leverage',
      value: 'Ren keeps the ledger shut until Mei names the public cost.',
      sourceProposals: [{ proposalId: 'proposal-1', title: 'Hold the ledger shut', sourceTraceId: 'trace-accepted-1' }],
      relatedAssets: [{ assetId: 'asset-ledger-stays-shut', title: 'Ledger stays shut', kind: 'rule' }],
    },
  ],
  latestPatch: {
    patchId: 'patch-1',
    label: 'Visible stalemate summary',
    summary: 'Semantic patch ready if the bargain stalemate is accepted into canon.',
    status: 'ready_for_commit',
    changes: [
      {
        id: 'change-1',
        label: 'Public pressure stays visible',
        detail: 'Keep the bell and witness line visible through the bargain beat.',
        sourceProposals: [{ proposalId: 'proposal-2', title: 'Carry witness pressure', sourceTraceId: 'trace-patch-2' }],
        relatedAssets: [{ assetId: 'asset-departure-bell-timing', title: 'Departure bell timing', kind: 'rule' }],
      },
    ],
    sourceProposals: [{ proposalId: 'proposal-2', title: 'Carry witness pressure', sourceTraceId: 'trace-patch-2' }],
    relatedAssets: [{ assetId: 'asset-departure-bell-timing', title: 'Departure bell timing', kind: 'rule' }],
  },
  proseOrigin: {
    statusLabel: 'Ready for revision pass',
    latestDiffSummary: 'No prose revision requested yet.',
    sourcePatchId: 'patch-1',
    acceptedFactIds: ['fact-1'],
    sourceProposals: [{ proposalId: 'proposal-1', title: 'Hold the ledger shut', sourceTraceId: 'trace-accepted-1' }],
    relatedAssets: [{ assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' }],
  },
  sourceProposals: [
    { proposalId: 'proposal-1', title: 'Hold the ledger shut', sourceTraceId: 'trace-accepted-1' },
    { proposalId: 'proposal-2', title: 'Carry witness pressure', sourceTraceId: 'trace-patch-2' },
  ],
  relatedAssets: [
    { assetId: 'asset-ledger-stays-shut', title: 'Ledger stays shut', kind: 'rule' },
    { assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' },
  ],
  missingLinks: [],
}

describe('SceneTraceabilityPanel', () => {
  it('renders accepted canon, latest patch, prose origin, and opens asset chips from each section', async () => {
    const user = userEvent.setup()
    const onOpenAsset = vi.fn()

    render(
      <AppProviders>
        <SceneTraceabilityPanel traceability={traceabilityData} isLoading={false} error={null} onOpenAsset={onOpenAsset} />
      </AppProviders>,
    )

    expect(screen.getByText('Accepted canon')).toBeInTheDocument()
    expect(screen.getByText('Ledger leverage')).toBeInTheDocument()
    expect(screen.getAllByText('Hold the ledger shut').length).toBeGreaterThan(0)
    expect(screen.getByText('Latest patch')).toBeInTheDocument()
    expect(screen.getByText('Visible stalemate summary')).toBeInTheDocument()
    expect(screen.getByText('Public pressure stays visible')).toBeInTheDocument()
    expect(screen.getByText('Prose origin')).toBeInTheDocument()
    expect(screen.getByText('No prose revision requested yet.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ren Voss' }))

    expect(onOpenAsset).toHaveBeenCalledWith('asset-ren-voss')
  })
})
