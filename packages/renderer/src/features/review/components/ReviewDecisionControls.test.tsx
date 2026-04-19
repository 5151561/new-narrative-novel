import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { ReviewIssueViewModel } from '@/features/review/types/review-view-models'

import { ReviewDecisionControls } from './ReviewDecisionControls'

function createIssue(overrides: Partial<ReviewIssueViewModel> = {}): ReviewIssueViewModel {
  return {
    id: 'compare-delta-scene-1',
    severity: 'warning',
    source: 'compare',
    kind: 'compare_delta',
    title: 'Compare delta needs review',
    detail: 'Scene One changed against the selected checkpoint.',
    recommendation: 'Open compare review and verify the changed passage before carrying it forward.',
    chapterId: 'chapter-1',
    chapterTitle: 'Chapter One',
    chapterOrder: 1,
    sceneId: 'scene-1',
    sceneTitle: 'Scene One',
    sceneOrder: 1,
    sourceLabel: 'Compare checkpoint',
    sourceExcerpt: 'Checkpoint river excerpt.',
    tags: ['Compare delta', 'Warnings +1'],
    handoffs: [],
    issueSignature: 'compare-delta-scene-1::signature',
    decision: {
      status: 'open',
      isStale: false,
    },
    ...overrides,
  }
}

describe('ReviewDecisionControls', () => {
  it('renders the open status and dispatches review decisions with the current note', async () => {
    const user = userEvent.setup()
    const onSetDecision = vi.fn()

    render(
      <AppProviders>
        <ReviewDecisionControls issue={createIssue()} onSetDecision={onSetDecision} onClearDecision={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByText('Open')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Decision note'), 'Handle this after compare review')
    await user.click(screen.getByRole('button', { name: 'Mark reviewed' }))
    await user.click(screen.getByRole('button', { name: 'Defer' }))
    await user.click(screen.getByRole('button', { name: 'Dismiss for this pass' }))

    expect(onSetDecision).toHaveBeenNthCalledWith(1, {
      issueId: 'compare-delta-scene-1',
      issueSignature: 'compare-delta-scene-1::signature',
      status: 'reviewed',
      note: 'Handle this after compare review',
    })
    expect(onSetDecision).toHaveBeenNthCalledWith(2, {
      issueId: 'compare-delta-scene-1',
      issueSignature: 'compare-delta-scene-1::signature',
      status: 'deferred',
      note: 'Handle this after compare review',
    })
    expect(onSetDecision).toHaveBeenNthCalledWith(3, {
      issueId: 'compare-delta-scene-1',
      issueSignature: 'compare-delta-scene-1::signature',
      status: 'dismissed',
      note: 'Handle this after compare review',
    })
  })

  it('shows reopen for actioned issues and sends clear requests', async () => {
    const user = userEvent.setup()
    const onClearDecision = vi.fn()

    render(
      <AppProviders>
        <ReviewDecisionControls
          issue={createIssue({
            decision: {
              status: 'reviewed',
              note: 'Already handled.',
              updatedAtLabel: '2026-04-19 17:45',
              updatedByLabel: 'Editor',
              isStale: false,
            },
          })}
          onSetDecision={vi.fn()}
          onClearDecision={onClearDecision}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Reviewed')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Already handled.')).toHaveAttribute('readonly')

    await user.click(screen.getByRole('button', { name: 'Reopen' }))

    expect(onClearDecision).toHaveBeenCalledWith('compare-delta-scene-1')
  })
})
