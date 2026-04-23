import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { RunReviewGate } from './RunReviewGate'

function createDeferred() {
  let resolve!: () => void
  const promise = new Promise<void>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

function renderGate(overrides: Partial<React.ComponentProps<typeof RunReviewGate>> = {}) {
  const onSubmitDecision = vi.fn(async () => {})

  render(
    <I18nProvider>
      <RunReviewGate
        runTitle="Midnight platform scene run"
        pendingReviewId="review-scene-midnight-platform-001"
        isSubmitting={false}
        onSubmitDecision={onSubmitDecision}
        {...overrides}
      />
    </I18nProvider>,
  )

  return {
    onSubmitDecision,
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('RunReviewGate', () => {
  it('shows four decision actions when a waiting review is active', () => {
    renderGate()

    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accept With Edit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Request Rewrite' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    expect(screen.queryByText('review-scene-midnight-platform-001')).not.toBeInTheDocument()
  })

  it('submits accept-with-edit with note and patch id payload', async () => {
    const user = userEvent.setup()
    const { onSubmitDecision } = renderGate()

    await user.click(screen.getByRole('button', { name: 'Accept With Edit' }))
    await user.type(screen.getByLabelText('Edited note / patch explanation'), 'Tighten the rewritten leverage beat.')
    await user.type(screen.getByLabelText('Patch ID'), 'canon-patch-scene-midnight-platform-002')
    await user.click(screen.getByRole('button', { name: 'Submit Accept With Edit' }))

    await waitFor(() => {
      expect(onSubmitDecision).toHaveBeenCalledWith({
        decision: 'accept-with-edit',
        note: 'Tighten the rewritten leverage beat.',
        patchId: 'canon-patch-scene-midnight-platform-002',
      })
    })
  })

  it('submits request-rewrite with a note', async () => {
    const user = userEvent.setup()
    const { onSubmitDecision } = renderGate()

    await user.click(screen.getByRole('button', { name: 'Request Rewrite' }))
    await user.type(screen.getByLabelText('Review note'), 'Rebuild the witness handoff before the next pass.')
    await user.click(screen.getByRole('button', { name: 'Submit Rewrite Request' }))

    await waitFor(() => {
      expect(onSubmitDecision).toHaveBeenCalledWith({
        decision: 'request-rewrite',
        note: 'Rebuild the witness handoff before the next pass.',
      })
    })
  })

  it('submits reject with a note', async () => {
    const user = userEvent.setup()
    const { onSubmitDecision } = renderGate()

    await user.click(screen.getByRole('button', { name: 'Reject' }))
    await user.type(screen.getByLabelText('Review note'), 'This run drifts too far from the scene contract.')
    await user.click(screen.getByRole('button', { name: 'Submit Rejection' }))

    await waitFor(() => {
      expect(onSubmitDecision).toHaveBeenCalledWith({
        decision: 'reject',
        note: 'This run drifts too far from the scene contract.',
      })
    })
  })

  it('blocks duplicate submits while a review decision is in flight', async () => {
    const deferred = createDeferred()
    const user = userEvent.setup()
    const onSubmitDecision = vi.fn(() => deferred.promise)

    renderGate({
      onSubmitDecision,
    })

    await user.click(screen.getByRole('button', { name: 'Request Rewrite' }))
    await user.type(screen.getByLabelText('Review note'), 'Tighten continuity before resubmitting.')

    const submitButton = screen.getByRole('button', { name: 'Submit Rewrite Request' })
    await user.click(submitButton)
    await user.click(submitButton)

    expect(onSubmitDecision).toHaveBeenCalledTimes(1)
    expect(submitButton).toBeDisabled()

    deferred.resolve()

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Submit Rewrite Request' })).not.toBeInTheDocument()
    })
  })
})
