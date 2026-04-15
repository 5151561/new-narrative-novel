import { render, screen } from '@testing-library/react'

import { SceneBottomDock } from './SceneBottomDock'
import type { SceneDockViewModel } from '../types/scene-view-models'

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

describe('SceneBottomDock', () => {
  it('labels the dock by its supported secondary tabs instead of presenting as another stage', () => {
    render(<SceneBottomDock data={dockData} activeTab="events" onTabChange={vi.fn()} />)

    expect(screen.getByText('Events / Trace / Consistency / Problems / Cost')).toBeInTheDocument()
  })
})
