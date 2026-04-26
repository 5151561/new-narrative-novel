import { createElement } from 'react'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SceneBottomDock } from './SceneBottomDock'
import type { SceneDockViewModel } from '../types/scene-view-models'
import type { RunEventRecord, RunRecord } from '@/features/run/api/run-records'
import { getMockRunArtifact, resetMockRunDb } from '@/features/run/api/mock-run-db'

const dockData: SceneDockViewModel = {
  events: [{ id: 'event-1', title: 'Beat review opened', detail: 'Execution promoted Beat 2 into review.' }],
  trace: [{ id: 'trace-1', title: 'Trace summary', detail: 'Structured trace stays docked.', meta: 'Run 07' }],
  consistency: {
    summary: 'One continuity warning needs review.',
    checks: [{ id: 'check-1', label: 'Ledger continuity', status: 'warn', detail: 'Witness timing may jump the bell.' }],
  },
  problems: {
    summary: 'No blocking failures.',
    items: [{ id: 'problem-1', title: 'Witness timing', severity: 'warn', recommendation: 'Tighten the bell trigger in Beat 3.' }],
  },
  cost: {
    currentWindowLabel: '$0.19 est.',
    trendLabel: 'Stable versus the previous pass.',
    breakdown: [{ id: 'cost-1', label: 'Run 07', value: '$0.19' }],
  },
}

const activeRun: RunRecord = {
  id: 'run-scene-midnight-platform-002',
  scope: 'scene',
  scopeId: 'scene-midnight-platform',
  status: 'waiting_review',
  title: 'Midnight platform rewrite run',
  summary: 'Planner and writer output are ready for editorial review.',
  startedAtLabel: '2026-04-23 10:00',
  pendingReviewId: 'review-scene-midnight-platform-002',
  latestEventId: 'run-event-scene-midnight-platform-002-009',
  eventCount: 3,
}

const activeRunEvents: RunEventRecord[] = [
  {
    id: 'run-event-scene-midnight-platform-002-003',
    runId: activeRun.id,
    order: 3,
    kind: 'context_packet_built',
    label: 'Context packet built',
    summary: 'Runtime assembled the scene context packet.',
    createdAtLabel: '2026-04-23 10:03',
    severity: 'info',
    refs: [{ kind: 'context-packet', id: 'ctx-scene-midnight-platform-run-002' }],
  },
  {
    id: 'run-event-scene-midnight-platform-002-004',
    runId: activeRun.id,
    order: 4,
    kind: 'agent_invocation_started',
    label: 'Planner invocation started',
    summary: 'Planning agent invocation started.',
    createdAtLabel: '2026-04-23 10:04',
    severity: 'info',
    refs: [{ kind: 'agent-invocation', id: 'agent-invocation-scene-midnight-platform-run-002-001' }],
  },
  {
    id: 'run-event-scene-midnight-platform-002-005',
    runId: activeRun.id,
    order: 5,
    kind: 'agent_invocation_completed',
    label: 'Planner invocation completed',
    summary: 'Planning agent returned proposal candidates.',
    createdAtLabel: '2026-04-23 10:05',
    severity: 'info',
    refs: [{ kind: 'agent-invocation', id: 'agent-invocation-scene-midnight-platform-run-002-001' }],
  },
  {
    id: 'run-event-scene-midnight-platform-002-007',
    runId: activeRun.id,
    order: 7,
    kind: 'proposal_created',
    label: 'Proposal set created',
    summary: 'A proposal set is ready for review.',
    createdAtLabel: '2026-04-23 10:07',
    severity: 'info',
    refs: [{ kind: 'proposal-set', id: 'proposal-set-scene-midnight-platform-run-002' }],
  },
  {
    id: 'run-event-scene-midnight-platform-002-008',
    runId: activeRun.id,
    order: 8,
    kind: 'review_requested',
    label: 'Review requested',
    summary: 'Editorial review is waiting on the proposal set.',
    createdAtLabel: '2026-04-23 10:08',
    severity: 'warning',
    refs: [{ kind: 'review', id: activeRun.pendingReviewId! }],
  },
]

describe('SceneBottomDock', () => {
  it('renders the shared dock frame without the old combined explanatory title', () => {
    render(<SceneBottomDock data={dockData} activeTab="events" onTabChange={vi.fn()} />)

    expect(screen.getByTestId('workbench-bottom-dock-frame')).toBeInTheDocument()
    expect(screen.getByTestId('workbench-bottom-dock-frame-scroll-body')).toBeInTheDocument()
    expect(screen.queryByText('Events / Trace / Consistency / Problems / Cost')).not.toBeInTheDocument()
  })

  it('surfaces active run support in the events area without turning the dock into a raw debugger', async () => {
    const user = userEvent.setup()
    const onSelectArtifact = vi.fn()

    render(
      createElement(SceneBottomDock as unknown as typeof SceneBottomDock, {
        data: dockData,
        activeTab: 'events',
        onTabChange: vi.fn(),
        runSupport: {
          run: activeRun,
          events: activeRunEvents,
          isLoading: false,
          error: null,
          isReviewPending: true,
          artifacts: [],
          selectedArtifactId: null,
          selectedArtifact: null,
          trace: null,
          onSelectArtifact,
          selectedVariants: {
            'proposal-set-scene-midnight-platform-run-002-proposal-001': 'variant-midnight-platform-raise-conflict',
          },
        },
      }),
    )

    expect(screen.getByText('Active Run Support')).toBeInTheDocument()
    expect(screen.getAllByText('Midnight platform rewrite run')).toHaveLength(1)
    expect(screen.getByRole('heading', { name: 'Waiting for Main Stage Review' })).toBeInTheDocument()
    expect(screen.getByText('1 selected variant')).toBeInTheDocument()
    expect(screen.getByText(/submit the review decision from the Scene \/ Orchestrate Main Stage/)).toBeInTheDocument()
    expect(screen.getByText('Waiting Review')).toBeInTheDocument()
    expect(screen.getByText('Run Timeline')).toBeInTheDocument()
    expect(screen.getByText('Run Inspector')).toBeInTheDocument()
    expect(screen.getByText('Context packet built')).toBeInTheDocument()
    expect(screen.getByText('Planner invocation completed')).toBeInTheDocument()
    expect(screen.getByText('Review requested')).toBeInTheDocument()
    expect(screen.queryByText('Planner invocation started')).not.toBeInTheDocument()
    expect(screen.queryByText('run-scene-midnight-platform-002')).not.toBeInTheDocument()
    expect(screen.queryByText('review-scene-midnight-platform-002')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Accept With Edit' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Request Rewrite' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open agent-invocation' }))
    expect(onSelectArtifact).toHaveBeenCalledWith('agent-invocation-scene-midnight-platform-run-002-001')
  })

  it('forwards context activation asset handoffs from selected artifact detail', async () => {
    const user = userEvent.setup()
    resetMockRunDb()
    const artifactId = 'ctx-scene-midnight-platform-run-001'
    const selectedArtifact = getMockRunArtifact({
      runId: 'run-scene-midnight-platform-001',
      artifactId,
    }).artifact
    const onOpenAssetContext = vi.fn()

    render(
      createElement(SceneBottomDock as unknown as typeof SceneBottomDock, {
        data: dockData,
        activeTab: 'events',
        onTabChange: vi.fn(),
        runSupport: {
          run: activeRun,
          events: activeRunEvents,
          isLoading: false,
          error: null,
          isReviewPending: true,
          artifacts: [],
          artifactsError: new Error('list unavailable'),
          selectedArtifactId: artifactId,
          selectedArtifact,
          artifactError: null,
          trace: null,
          onOpenAssetContext,
        },
      }),
    )

    expect(screen.getByRole('heading', { name: 'Scene context packet' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Open asset context for Ren Voss' }))
    expect(onOpenAssetContext).toHaveBeenCalledWith('asset-ren-voss')
  })

  it('does not let artifact list errors mask selected artifact detail', () => {
    resetMockRunDb()
    const artifactId = 'ctx-scene-midnight-platform-run-001'
    const selectedArtifact = getMockRunArtifact({
      runId: 'run-scene-midnight-platform-001',
      artifactId,
    }).artifact

    render(
      createElement(SceneBottomDock as unknown as typeof SceneBottomDock, {
        data: dockData,
        activeTab: 'events',
        onTabChange: vi.fn(),
        runSupport: {
          run: activeRun,
          events: activeRunEvents,
          isLoading: false,
          error: null,
          isReviewPending: true,
          artifacts: [],
          artifactsError: new Error('list unavailable'),
          selectedArtifactId: artifactId,
          selectedArtifact,
          artifactError: null,
          trace: null,
        },
      }),
    )

    expect(screen.getAllByText('Artifacts unavailable').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Scene context packet' })).toBeInTheDocument()
    expect(screen.queryByText('Artifact not found')).not.toBeInTheDocument()
  })
})
