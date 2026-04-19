import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import type { BookReviewInboxViewModel } from '@/features/review/types/review-view-models'

import { BookReviewFilterBar } from './BookReviewFilterBar'

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
  }
}

describe('BookReviewFilterBar', () => {
  it('renders the expected labels and counts', () => {
    render(
      <AppProviders>
        <BookReviewFilterBar activeFilter="compare-deltas" counts={createCounts()} onSelectFilter={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'All 12' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Blockers 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Trace gaps 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Missing drafts 4' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Compare deltas 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export readiness 2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Branch readiness 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Scene proposals 2' })).toBeInTheDocument()
  })

  it('marks the active filter as selected', () => {
    render(
      <AppProviders>
        <BookReviewFilterBar activeFilter="compare-deltas" counts={createCounts()} onSelectFilter={vi.fn()} />
      </AppProviders>,
    )

    expect(screen.getByRole('button', { name: 'Compare deltas 3' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'All 12' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onSelectFilter when the user chooses another filter', async () => {
    const user = userEvent.setup()
    const onSelectFilter = vi.fn()

    render(
      <AppProviders>
        <BookReviewFilterBar activeFilter="all" counts={createCounts()} onSelectFilter={onSelectFilter} />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Branch readiness 1' }))

    expect(onSelectFilter).toHaveBeenCalledWith('branch-readiness')
  })
})
