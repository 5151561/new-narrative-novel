import { render, screen } from '@testing-library/react'

import { SceneInspectorPanel } from './SceneInspectorPanel'
import type { SceneInspectorViewModel } from '../types/scene-view-models'

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

describe('SceneInspectorPanel', () => {
  it('keeps the inspector bounded to context, versions, and runtime summaries while showing guard and actor-boundary detail', () => {
    render(<SceneInspectorPanel data={inspectorData} activeTab="context" onTabChange={vi.fn()} />)

    expect(screen.getByText('Context / Versions / Runtime')).toBeInTheDocument()
    expect(screen.getByText('Private Info Guard')).toBeInTheDocument()
    expect(screen.getByText('Actor Knowledge Boundaries')).toBeInTheDocument()
    expect(screen.getByText('Ren Voss')).toBeInTheDocument()
    expect(screen.getByText('Station Conductor')).toBeInTheDocument()
    expect(screen.queryByText('Trace')).not.toBeInTheDocument()
  })
})
