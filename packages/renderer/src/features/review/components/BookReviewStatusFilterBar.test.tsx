import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { BookReviewInboxViewModel } from '@/features/review/types/review-view-models'

import { BookReviewStatusFilterBar } from './BookReviewStatusFilterBar'

function createCounts(): BookReviewInboxViewModel['counts'] {
  return {
    total: 12,
    blockers: 3,
    warnings: 6,
    info: 3,
    traceGaps: 2,
    missingDrafts: 4,
    compareDeltas: 3,
    exportReadiness: 2,
    branchReadiness: 1,
    sceneProposals: 2,
    open: 6,
    reviewed: 3,
    deferred: 2,
    dismissed: 1,
    stale: 1,
  }
}

describe('BookReviewStatusFilterBar', () => {
  it('renders the expected status labels and counts', () => {
    render(
      <AppProviders>
        <BookReviewStatusFilterBar activeStatusFilter="reviewed" counts={createCounts()} onSelectStatusFilter={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Open 6' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reviewed 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deferred 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dismissed 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All 12' })).toBeInTheDocument()
  })

  it('marks the active status filter as selected', () => {
    render(
      <AppProviders>
        <BookReviewStatusFilterBar activeStatusFilter="reviewed" counts={createCounts()} onSelectStatusFilter={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Reviewed 3' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Open 6' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelectStatusFilter when the user chooses another status filter', async () => {
    const user = userEvent.setup()
    const onSelectStatusFilter = vi.fn()

    render(
      <AppProviders>
        <BookReviewStatusFilterBar activeStatusFilter="open" counts={createCounts()} onSelectStatusFilter={onSelectStatusFilter} />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Deferred 2' }))

    expect(onSelectStatusFilter).toHaveBeenCalledWith('deferred')
  })
})
