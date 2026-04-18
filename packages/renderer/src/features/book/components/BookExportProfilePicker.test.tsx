import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { BookExportProfileSummaryViewModel } from '../types/book-export-view-models'
import { BookExportProfilePicker } from './BookExportProfilePicker'

const profiles: BookExportProfileSummaryViewModel[] = [
  {
    exportProfileId: 'export-review-packet',
    bookId: 'book-signal-arc',
    kind: 'review_packet',
    title: 'Review Packet',
    summary: 'Full manuscript packet with compare and trace context.',
    createdAtLabel: 'Updated for PR13 baseline',
    includes: {
      manuscriptBody: true,
      chapterSummaries: true,
      sceneHeadings: true,
      traceAppendix: true,
      compareSummary: true,
      readinessChecklist: true,
    },
    rules: {
      requireAllScenesDrafted: true,
      requireTraceReady: true,
      allowWarnings: false,
      allowDraftMissing: false,
    },
  },
  {
    exportProfileId: 'export-archive-snapshot',
    bookId: 'book-signal-arc',
    kind: 'archive_snapshot',
    title: 'Archive Snapshot',
    summary: 'Snapshot package for preserving a draft state.',
    createdAtLabel: 'Snapshot policy active',
    includes: {
      manuscriptBody: true,
      chapterSummaries: true,
      sceneHeadings: false,
      traceAppendix: false,
      compareSummary: false,
      readinessChecklist: true,
    },
    rules: {
      requireAllScenesDrafted: false,
      requireTraceReady: false,
      allowWarnings: true,
      allowDraftMissing: true,
    },
  },
]

describe('BookExportProfilePicker', () => {
  it('renders export profile options and highlights the selected profile', () => {
    render(
      <AppProviders>
        <BookExportProfilePicker
          profiles={profiles}
          selectedExportProfileId="export-review-packet"
          onSelectExportProfile={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Export profile' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Review Packet/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Archive Snapshot/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Full manuscript packet with compare and trace context.')).toBeInTheDocument()
  })

  it('calls onSelectExportProfile when picking a different profile', async () => {
    const user = userEvent.setup()
    const onSelectExportProfile = vi.fn()

    render(
      <AppProviders>
        <BookExportProfilePicker
          profiles={profiles}
          selectedExportProfileId="export-review-packet"
          onSelectExportProfile={onSelectExportProfile}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: /Archive Snapshot/i }))

    expect(onSelectExportProfile).toHaveBeenCalledWith('export-archive-snapshot')
  })
})
