import { createElement } from 'react'

import { render, screen } from '@testing-library/react'

import { SceneBottomDock } from './SceneBottomDock'
import type { SceneDockViewModel } from '../types/scene-view-models'
import type { RunEventRecord, RunRecord } from '@/features/run/api/run-records'

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
  it('labels the dock by its supported secondary tabs instead of presenting as another stage', () => {
    render(<SceneBottomDock data={dockData} activeTab="events" onTabChange={vi.fn()} />)

    expect(screen.getByText('Events / Trace / Consistency / Problems / Cost')).toBeInTheDocument()
  })

  it('surfaces active run support in the events area without turning the dock into a raw debugger', () => {
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
        },
      }),
    )

    expect(screen.getByText('Active Run Support')).toBeInTheDocument()
    expect(screen.getByText('Midnight platform rewrite run')).toBeInTheDocument()
    expect(screen.getByText('Waiting Review')).toBeInTheDocument()
    expect(screen.getByText('Recent Run Events')).toBeInTheDocument()
    expect(screen.getByText('Review requested')).toBeInTheDocument()
    expect(screen.queryByText('Context packet built')).not.toBeInTheDocument()
    expect(screen.queryByText('Planner invocation started')).not.toBeInTheDocument()
    expect(screen.queryByText('run-scene-midnight-platform-002')).not.toBeInTheDocument()
    expect(screen.queryByText('review-scene-midnight-platform-002')).not.toBeInTheDocument()
  })
})
