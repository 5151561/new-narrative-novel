import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SceneInspectorPanel } from './SceneInspectorPanel'
import type { SceneInspectorViewModel } from '../types/scene-view-models'
import type { SceneTraceabilityViewModel } from '@/features/traceability/types/traceability-view-models'

const inspectorData: SceneInspectorViewModel = {
  context: {
    acceptedFacts: [{ id: 'fact-1', label: 'Ledger', value: 'Still closed.' }],
    privateInfoGuard: {
      summary: 'Keep the ledger contents and alias exposure guarded during review.',
      items: [
        { id: 'guard-1', label: 'Ledger contents', summary: 'Do not reveal what is written inside.', status: 'guarded' },
      ],
    },
    actorKnowledgeBoundaries: [
      {
        actor: { id: 'ren', name: 'Ren Voss', role: 'POV' },
        boundaries: [
          {
            id: 'boundary-1',
            label: 'Courier signal',
            summary: 'Ren can interpret it, but should not explain it aloud.',
            status: 'known',
          },
        ],
      },
      {
        actor: { id: 'conductor', name: 'Station Conductor', role: 'Witness' },
        boundaries: [
          {
            id: 'boundary-2',
            label: 'Ledger contents',
            summary: 'The conductor never decodes what the ledger means.',
            status: 'guarded',
          },
        ],
      },
    ],
    localState: [{ id: 'state-1', label: 'Witness pressure', value: 'Rising' }],
    overrides: [{ id: 'override-1', label: 'Witness bias', summary: 'Keep scrutiny public.', status: 'watching' }],
  },
  versions: {
    checkpoints: [{ id: 'checkpoint-1', label: 'Run 07', summary: 'Latest review checkpoint.', status: 'review' }],
    acceptanceTimeline: [{ id: 'timeline-1', title: 'Accepted leverage move', detail: 'Ren holds the ledger shut.', meta: 'Beat 2', tone: 'accent' }],
    patchCandidates: [{ id: 'patch-1', label: 'Patch preview', summary: 'One accepted fact ready for commit.', status: 'ready_for_commit' }],
  },
  runtime: {
    profile: { label: 'Measured Pressure', summary: 'Controlled escalation with witness pressure.' },
    runHealth: 'attention',
    metrics: { latencyLabel: '1.4s', tokenLabel: '2.3k', costLabel: '$0.19 est.' },
    latestFailure: 'One stalled branch during the bell beat.',
  },
}

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

describe('SceneInspectorPanel', () => {
  it('keeps the inspector bounded to context, versions, traceability, and runtime summaries while showing guard and actor-boundary detail', () => {
    render(
      <SceneInspectorPanel
        data={inspectorData}
        traceability={traceabilityData}
        traceabilityLoading={false}
        traceabilityError={null}
        activeTab="context"
        onTabChange={vi.fn()}
        onOpenAsset={vi.fn()}
      />,
    )

    expect(screen.getByText('Context / Versions / Traceability / Runtime')).toBeInTheDocument()
    expect(screen.getByText('Private Info Guard')).toBeInTheDocument()
    expect(screen.getByText('Actor Knowledge Boundaries')).toBeInTheDocument()
    expect(screen.getByText('Ren Voss')).toBeInTheDocument()
    expect(screen.getByText('Station Conductor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Traceability' })).toBeInTheDocument()
  })

  it('switches into traceability content and routes asset handoff through explicit chips', async () => {
    const user = userEvent.setup()
    const onTabChange = vi.fn()
    const onOpenAsset = vi.fn()

    render(
      <SceneInspectorPanel
        data={inspectorData}
        traceability={traceabilityData}
        traceabilityLoading={false}
        traceabilityError={null}
        activeTab="traceability"
        onTabChange={onTabChange}
        onOpenAsset={onOpenAsset}
      />,
    )

    expect(screen.getByText('Accepted canon')).toBeInTheDocument()
    expect(screen.getByText('Latest patch')).toBeInTheDocument()
    expect(screen.getByText('Prose origin')).toBeInTheDocument()
    expect(screen.getByText('Ledger leverage')).toBeInTheDocument()
    expect(screen.getByText('Visible stalemate summary')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ren Voss' }))
    await user.click(screen.getByRole('button', { name: 'Context' }))

    expect(onOpenAsset).toHaveBeenCalledWith('asset-ren-voss')
    expect(onTabChange).toHaveBeenCalledWith('context')
  })
})
