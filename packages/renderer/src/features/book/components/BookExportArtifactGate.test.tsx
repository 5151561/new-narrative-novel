import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { BookExportArtifactGateViewModel } from '../types/book-export-artifact-view-models'
import { BookExportArtifactGate } from './BookExportArtifactGate'

function renderGate(gate: BookExportArtifactGateViewModel) {
  render(
    <AppProviders>
      <BookExportArtifactGate gate={gate} />
    </AppProviders>,
  )
}

const readyGate: BookExportArtifactGateViewModel = {
  canBuild: true,
  status: 'ready',
  label: 'Artifact build ready',
  reasons: [],
  openBlockerCount: 0,
  checkedFixCount: 0,
  blockedFixCount: 0,
  staleFixCount: 0,
}

describe('BookExportArtifactGate', () => {
  it('renders ready state without reasons', () => {
    renderGate(readyGate)

    expect(screen.getByRole('heading', { name: 'Artifact gate' })).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('Artifact build ready')).toBeInTheDocument()
    expect(screen.getByText('No artifact blockers')).toBeInTheDocument()
  })

  it('renders attention state with warning reasons and source labels', () => {
    renderGate({
      ...readyGate,
      status: 'attention',
      label: 'Artifact build needs attention',
      checkedFixCount: 1,
      reasons: [
        {
          id: 'warning-trace-gap',
          severity: 'warning',
          title: 'Trace appendix has gaps',
          detail: 'One scene still has thin trace context.',
          source: 'export-readiness',
        },
      ],
    })

    expect(screen.getByText('Attention')).toBeInTheDocument()
    expect(screen.getByText('Trace appendix has gaps')).toBeInTheDocument()
    expect(screen.getByText('Export readiness')).toBeInTheDocument()
  })

  it('renders blocked state with export readiness reasons', () => {
    renderGate({
      ...readyGate,
      canBuild: false,
      status: 'blocked',
      label: 'Artifact build blocked',
      reasons: [
        {
          id: 'missing-draft',
          severity: 'blocker',
          title: 'Draft coverage incomplete',
          detail: 'Departure Bell still needs current draft prose.',
          source: 'export-readiness',
        },
      ],
    })

    expect(screen.getByText('Blocked')).toBeInTheDocument()
    expect(screen.getByText('Draft coverage incomplete')).toBeInTheDocument()
    expect(screen.getByText('Departure Bell still needs current draft prose.')).toBeInTheDocument()
    expect(screen.getByText('Export readiness')).toBeInTheDocument()
  })

  it('renders review blocker reasons and source-fix checked-not-resolved copy', () => {
    renderGate({
      ...readyGate,
      canBuild: false,
      status: 'blocked',
      label: 'Artifact build blocked',
      openBlockerCount: 1,
      checkedFixCount: 2,
      blockedFixCount: 1,
      staleFixCount: 3,
      reasons: [
        {
          id: 'review-blocker',
          severity: 'blocker',
          title: 'Open review blocker',
          detail: 'Resolve the review issue before building the artifact.',
          source: 'review-open-blocker',
        },
      ],
    })

    expect(screen.getByText('Review blocker')).toBeInTheDocument()
    expect(screen.getByText('Open review blocker')).toBeInTheDocument()
    expect(screen.getByText('Checked source-fix actions are not resolved yet.')).toBeInTheDocument()
    expect(screen.getByText('Checked fixes')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Blocked fixes')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Stale fixes')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })
})
