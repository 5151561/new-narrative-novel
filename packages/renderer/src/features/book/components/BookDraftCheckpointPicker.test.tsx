import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { BookManuscriptCheckpointSummaryViewModel } from '../types/book-compare-view-models'
import { BookDraftCheckpointPicker } from './BookDraftCheckpointPicker'

const checkpoints: BookManuscriptCheckpointSummaryViewModel[] = [
  {
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    bookId: 'book-signal-arc',
    title: 'PR11 Baseline',
    summary: 'Baseline manuscript snapshot.',
  },
  {
    checkpointId: 'checkpoint-book-signal-arc-quiet',
    bookId: 'book-signal-arc',
    title: 'Quiet Checkpoint',
    summary: 'Steady-state checkpoint.',
  },
]

describe('BookDraftCheckpointPicker', () => {
  it('renders checkpoint label and summary', () => {
    render(
      <AppProviders>
        <BookDraftCheckpointPicker
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          checkpointMeta={{
            title: 'PR11 Baseline',
            createdAtLabel: '2026-04-17 22:10',
            summary: 'Baseline manuscript snapshot.',
          }}
          onSelectCheckpoint={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByLabelText('Manuscript checkpoint')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'PR11 Baseline' })).toBeInTheDocument()
    expect(screen.getByText('2026-04-17 22:10')).toBeInTheDocument()
    expect(screen.getByText('Baseline manuscript snapshot.')).toBeInTheDocument()
  })

  it('selection changes trigger the callback', async () => {
    const user = userEvent.setup()
    const onSelectCheckpoint = vi.fn()

    render(
      <AppProviders>
        <BookDraftCheckpointPicker
          checkpoints={checkpoints}
          selectedCheckpointId="checkpoint-book-signal-arc-pr11-baseline"
          checkpointMeta={{
            title: 'PR11 Baseline',
            createdAtLabel: '2026-04-17 22:10',
            summary: 'Baseline manuscript snapshot.',
          }}
          onSelectCheckpoint={onSelectCheckpoint}
        />
      </AppProviders>,
    )

    await user.selectOptions(screen.getByLabelText('Manuscript checkpoint'), 'checkpoint-book-signal-arc-quiet')

    expect(onSelectCheckpoint).toHaveBeenCalledWith('checkpoint-book-signal-arc-quiet')
  })
})
