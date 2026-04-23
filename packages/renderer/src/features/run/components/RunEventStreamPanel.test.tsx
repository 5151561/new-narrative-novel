import { render, screen } from '@testing-library/react'

import { I18nProvider } from '@/app/i18n'

import type { RunEventRecord } from '../api/run-records'

import { RunEventStreamPanel } from './RunEventStreamPanel'

const events: RunEventRecord[] = [
  {
    id: 'run-event-001',
    runId: 'run-scene-midnight-platform-001',
    order: 1,
    kind: 'context_packet_built',
    label: 'Context packet built',
    summary: 'Runtime assembled the context packet for the editorial pass.',
    createdAtLabel: '2026-04-21 10:03',
    severity: 'info',
    refs: [
      { kind: 'context-packet', id: 'ctx-scene-midnight-platform-001' },
      { kind: 'proposal-set', id: 'proposal-set-scene-midnight-platform-001' },
    ],
  },
  {
    id: 'run-event-002',
    runId: 'run-scene-midnight-platform-001',
    order: 2,
    kind: 'canon_patch_applied',
    label: 'Canon patch applied',
    summary: 'Accepted edits were folded into the canon patch candidate.',
    createdAtLabel: '2026-04-21 10:09',
    severity: 'warning',
    refs: [{ kind: 'canon-patch', id: 'canon-patch-scene-midnight-platform-001' }],
  },
]

function renderPanel(overrides: Partial<React.ComponentProps<typeof RunEventStreamPanel>> = {}) {
  return render(
    <I18nProvider>
      <RunEventStreamPanel events={events} isLoading={false} error={null} {...overrides} />
    </I18nProvider>,
  )
}

describe('RunEventStreamPanel', () => {
  it('renders event label, summary, severity, created-at label, and stable ref kinds', () => {
    renderPanel()

    expect(screen.getByText('Context packet built')).toBeInTheDocument()
    expect(screen.getByText('Runtime assembled the context packet for the editorial pass.')).toBeInTheDocument()
    expect(screen.getByText('2026-04-21 10:03')).toBeInTheDocument()
    expect(screen.getByText('Info')).toBeInTheDocument()
    expect(screen.getByText('Warning')).toBeInTheDocument()
    expect(screen.getByText('context-packet')).toBeInTheDocument()
    expect(screen.getByText('proposal-set')).toBeInTheDocument()
    expect(screen.getByText('canon-patch')).toBeInTheDocument()
  })

  it('renders a loading state while the event timeline is being prepared', () => {
    renderPanel({
      events: [],
      isLoading: true,
    })

    expect(screen.getByText('Loading run timeline')).toBeInTheDocument()
    expect(screen.getByText('Fetching the latest structured run events for this scene.')).toBeInTheDocument()
  })

  it('renders an error state when the timeline cannot be loaded', () => {
    renderPanel({
      events: [],
      error: new Error('Run run-07 was not found.'),
    })

    expect(screen.getByText('Run timeline unavailable')).toBeInTheDocument()
    expect(screen.getByText('The active run timeline is temporarily unavailable.')).toBeInTheDocument()
    expect(screen.queryByText('Run run-07 was not found.')).not.toBeInTheDocument()
  })

  it('renders an empty state when no run events are available', () => {
    renderPanel({
      events: [],
    })

    expect(screen.getByText('No run events yet')).toBeInTheDocument()
    expect(screen.getByText('Structured run events will appear here once the active run records product-level milestones.')).toBeInTheDocument()
  })
})
