import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, vi } from 'vitest'

import { APP_LOCALE_STORAGE_KEY, I18nProvider } from '@/app/i18n'

import { RequestRewriteSelected } from './RunReviewGate.stories'
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
  it('renders the request-rewrite-selected story in the explicit rewrite warning state under zh-CN', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'zh-CN')
    const storyArgs = {
      runTitle: 'Midnight platform scene run',
      pendingReviewId: 'review-scene-midnight-platform-001',
      isSubmitting: false,
      onSubmitDecision: async () => {},
      ...RequestRewriteSelected.args,
    }

    render(
      <I18nProvider>
        <RunReviewGate {...storyArgs} />
      </I18nProvider>,
    )

    expect(screen.getByText('提交重写请求会关闭当前运行。等重写说明准备好后，需要你显式启动一次新运行；这次决策不会在后台继续。')).toBeInTheDocument()
    expect(screen.getByText('已选 variant 只保留为评审上下文，不会自动延续到这次运行之后。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '提交重写请求' })).toBeInTheDocument()
    window.localStorage.removeItem(APP_LOCALE_STORAGE_KEY)
  })

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

  it('submits accept with selected variants when provided', async () => {
    const user = userEvent.setup()
    const selectedVariants = [
      {
        proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
        variantId: 'variant-midnight-platform-raise-conflict',
      },
    ]
    const { onSubmitDecision } = renderGate({
      selectedVariants,
      variantSelectionSummary: '1 selected variant will travel with Accept.',
    })

    expect(screen.getByText('1 selected variant will travel with Accept.')).toBeInTheDocument()
    expect(screen.getByText('Variant choices still require this review decision and do not write canon on their own.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Accept' }))

    await waitFor(() => {
      expect(onSubmitDecision).toHaveBeenCalledWith({
        decision: 'accept',
        selectedVariants,
      })
    })
  })

  it('submits accept-with-edit with selected variants when provided', async () => {
    const user = userEvent.setup()
    const selectedVariants = [
      {
        proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
        variantId: 'variant-midnight-platform-raise-conflict',
      },
    ]
    const { onSubmitDecision } = renderGate({ selectedVariants })

    await user.click(screen.getByRole('button', { name: 'Accept With Edit' }))
    await user.type(screen.getByLabelText('Edited note / patch explanation'), 'Keep the sharper beat but smooth the handoff.')
    await user.click(screen.getByRole('button', { name: 'Submit Accept With Edit' }))

    await waitFor(() => {
      expect(onSubmitDecision).toHaveBeenCalledWith({
        decision: 'accept-with-edit',
        note: 'Keep the sharper beat but smooth the handoff.',
        patchId: undefined,
        selectedVariants,
      })
    })
  })

  it('submits request-rewrite with a note', async () => {
    const user = userEvent.setup()
    const { onSubmitDecision } = renderGate({
      selectedVariants: [
        {
          proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
          variantId: 'variant-midnight-platform-raise-conflict',
        },
      ],
    })

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

  it('makes request-rewrite explicit about closing the current run and requiring a manual restart', async () => {
    const user = userEvent.setup()
    renderGate({
      selectedVariants: [
        {
          proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
          variantId: 'variant-midnight-platform-raise-conflict',
        },
      ],
    })

    await user.click(screen.getByRole('button', { name: 'Request Rewrite' }))

    expect(
      screen.getByText(
        'Submitting Request Rewrite closes this run. Start a new run explicitly when the rewrite brief is ready; this decision does not continue in the background.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Selected variants stay as review context only and will not continue this run automatically.')).toBeInTheDocument()
  })

  it('submits reject with a note', async () => {
    const user = userEvent.setup()
    const { onSubmitDecision } = renderGate({
      selectedVariants: [
        {
          proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
          variantId: 'variant-midnight-platform-raise-conflict',
        },
      ],
    })

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

  it('renders retry, cancel, and resume as support actions without replacing scene review', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    const onCancel = vi.fn()
    const onResume = vi.fn()
    renderGate({
      supportActions: {
        canRetry: true,
        canCancel: true,
        canResume: true,
        onRetry,
        onCancel,
        onResume,
      },
    })

    expect(screen.getByText('These actions only recover or stop the runtime path. Final review still belongs on the Scene / Orchestrate main stage.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry Run' }))
    await user.click(screen.getByRole('button', { name: 'Cancel Run' }))
    await user.click(screen.getByRole('button', { name: 'Resume Run' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onResume).toHaveBeenCalledTimes(1)
  })
})
