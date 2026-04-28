import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import {
  getMockRunTrace,
  resetMockRunDb,
  submitMockRunReviewDecision,
} from '@/features/run/api/mock-run-db'

import { RunTracePanel } from './RunTracePanel'

const runId = 'run-scene-midnight-platform-001'
const reviewId = 'review-scene-midnight-platform-001'

function renderTrace() {
  return render(
    <I18nProvider>
      <RunTracePanel trace={getMockRunTrace({ runId })} isLoading={false} error={null} />
    </I18nProvider>,
  )
}

describe('RunTracePanel', () => {
  beforeEach(() => {
    resetMockRunDb()
    submitMockRunReviewDecision({
      runId,
      reviewId,
      decision: 'accept',
    })
  })

  it('shows summary counts and grouped relation links', () => {
    renderTrace()

    expect(screen.getByText('Proposal sets')).toBeInTheDocument()
    expect(screen.getByText('Canon patches')).toBeInTheDocument()
    expect(screen.getByText('Prose drafts')).toBeInTheDocument()
    expect(screen.getByText('Missing trace')).toBeInTheDocument()
    expect(screen.getByText('Used context')).toBeInTheDocument()
    expect(screen.getByText('Accepted into canon')).toBeInTheDocument()
    expect(screen.getByText('Rendered as prose')).toBeInTheDocument()
  })

  it('shows nodes referenced by the selected relation', () => {
    renderTrace()

    expect(screen.getByText('Nodes referenced by Used context')).toBeInTheDocument()
    expect(screen.getByText('Scene context packet')).toBeInTheDocument()
    expect(screen.getByText('Planner invocation')).toBeInTheDocument()
  })

  it('falls back to the first available relation when trace data changes', async () => {
    const user = userEvent.setup()
    const acceptedTrace = getMockRunTrace({ runId })
    resetMockRunDb()
    const pendingTrace = getMockRunTrace({ runId })
    const view = render(
      <I18nProvider>
        <RunTracePanel trace={acceptedTrace} isLoading={false} error={null} />
      </I18nProvider>,
    )

    await user.click(screen.getByRole('button', { name: /Rendered as prose/i }))
    expect(screen.getByText('Nodes referenced by Rendered as prose')).toBeInTheDocument()

    view.rerender(
      <I18nProvider>
        <RunTracePanel trace={pendingTrace} isLoading={false} error={null} />
      </I18nProvider>,
    )

    expect(screen.getByText('Nodes referenced by Used context')).toBeInTheDocument()
    expect(screen.getByText('Scene context packet')).toBeInTheDocument()
  })

  it('does not mark waiting-review traces as partial failure recovery by default', () => {
    resetMockRunDb()
    const pendingTrace = getMockRunTrace({ runId })

    render(
      <I18nProvider>
        <RunTracePanel trace={pendingTrace} isLoading={false} error={null} />
      </I18nProvider>,
    )

    expect(screen.queryByRole('heading', { name: 'Partial failure trace' })).not.toBeInTheDocument()
  })

  it('marks partial failure traces as support-only and avoids implying accepted canon', () => {
    const partialTrace = getMockRunTrace({ runId })
    partialTrace.summary.canonPatchCount = 0
    partialTrace.summary.proseDraftCount = 0
    partialTrace.isPartialFailure = true

    render(
      <I18nProvider>
        <RunTracePanel trace={partialTrace} isLoading={false} error={null} />
      </I18nProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Partial failure trace' })).toBeInTheDocument()
    expect(screen.getByText('This trace only shows the nodes that existed before the run stopped. It does not imply accepted canon or prose.')).toBeInTheDocument()
  })
})
