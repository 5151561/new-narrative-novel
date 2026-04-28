import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import { mockBookExperimentBranchSeeds } from '../api/book-experiment-branches'
import { normalizeBookExperimentBranch } from '../lib/book-experiment-branch-mappers'
import { BookExperimentBranchPicker } from './BookExperimentBranchPicker'

const branches = mockBookExperimentBranchSeeds['book-signal-arc']!.map((record) => normalizeBookExperimentBranch(record, 'en'))

describe('BookExperimentBranchPicker', () => {
  it('renders branch metadata and lets the user switch branch and baseline', async () => {
    const user = userEvent.setup()
    const onSelectBranch = vi.fn()
    const onSelectBranchBaseline = vi.fn()

    render(
      <AppProviders>
        <BookExperimentBranchPicker
          branches={branches}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          onSelectBranch={onSelectBranch}
          onSelectBranchBaseline={onSelectBranchBaseline}
        />
      </AppProviders>,
    )

    expect(screen.getAllByText('Quiet Ending').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Prepared for quiet-ending review').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/low-conflict landing/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Current baseline' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: /High Pressure/i }))
    await user.click(screen.getByRole('button', { name: 'Checkpoint baseline' }))

    expect(onSelectBranch).toHaveBeenCalledWith('branch-book-signal-arc-high-pressure')
    expect(onSelectBranchBaseline).toHaveBeenCalledWith('checkpoint')
  })

  it('does not pretend the first branch is selected when selectedBranchId is invalid', () => {
    render(
      <AppProviders>
        <BookExperimentBranchPicker
          branches={branches}
          selectedBranchId="branch-missing"
          branchBaseline="checkpoint"
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
        />
      </AppProviders>,
    )

    const header = screen.getByRole('heading', { name: 'branch-missing' }).closest('div')
    expect(header).not.toBeNull()
    expect(within(header!).queryByText('Prepared for quiet-ending review')).not.toBeInTheDocument()
    expect(within(header!).queryByText(/low-conflict landing/i)).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Checkpoint baseline' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows archive state and disables archive action for archived branches', () => {
    render(
      <AppProviders>
        <BookExperimentBranchPicker
          branches={branches.map((branch) =>
            branch.branchId === 'branch-book-signal-arc-quiet-ending' ? { ...branch, status: 'archived' } : branch,
          )}
          selectedBranchId="branch-book-signal-arc-quiet-ending"
          branchBaseline="current"
          onSelectBranch={vi.fn()}
          onSelectBranchBaseline={vi.fn()}
          onArchiveBranch={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getAllByText('Archived').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Archive branch' })).toBeDisabled()
    expect(screen.getByText('Archived branches cannot be archived again.')).toBeInTheDocument()
  })
})
