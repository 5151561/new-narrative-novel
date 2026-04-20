import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type { BookExportArtifactFormat } from '../api/book-export-artifact-records'
import type {
  BookExportArtifactSummaryViewModel,
  BookExportArtifactWorkspaceViewModel,
} from '../types/book-export-artifact-view-models'
import { BookExportArtifactPanel } from './BookExportArtifactPanel'

const latestArtifact: BookExportArtifactSummaryViewModel = {
  artifactId: 'artifact-latest',
  format: 'markdown',
  filename: 'signal-arc-review.md',
  mimeType: 'text/markdown',
  title: 'Signal Arc',
  summary: 'Export artifact for Review Packet.',
  content: '# Signal Arc\n',
  createdAtLabel: 'Built in mock export session',
  createdByLabel: 'Narrative editor',
  sourceSignature: 'current-signature',
  isStale: false,
  chapterCount: 2,
  sceneCount: 5,
  wordCount: 1200,
  readinessStatus: 'ready',
}

function buildWorkspace(
  overrides?: Partial<BookExportArtifactWorkspaceViewModel>,
): BookExportArtifactWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    exportProfileId: 'export-review-packet',
    sourceSignature: 'current-signature',
    gate: {
      canBuild: true,
      status: 'ready',
      label: 'Artifact build ready',
      reasons: [],
      openBlockerCount: 0,
      checkedFixCount: 0,
      blockedFixCount: 0,
      staleFixCount: 0,
    },
    latestArtifact,
    artifacts: [
      latestArtifact,
      {
        ...latestArtifact,
        artifactId: 'artifact-second',
        filename: 'signal-arc-review-previous.md',
        createdAtLabel: 'Built before source update',
      },
    ],
    ...overrides,
  }
}

function renderPanel({
  artifactWorkspace = buildWorkspace(),
  selectedFormat = 'markdown',
  isBuilding = false,
  buildErrorMessage = null,
  onSelectFormat = vi.fn(),
  onBuildArtifact = vi.fn(),
  onCopyArtifact = vi.fn(),
  onDownloadArtifact = vi.fn(),
}: {
  artifactWorkspace?: BookExportArtifactWorkspaceViewModel | null
  selectedFormat?: BookExportArtifactFormat
  isBuilding?: boolean
  buildErrorMessage?: string | null
  onSelectFormat?: (format: BookExportArtifactFormat) => void
  onBuildArtifact?: () => void
  onCopyArtifact?: (artifact: BookExportArtifactSummaryViewModel) => void
  onDownloadArtifact?: (artifact: BookExportArtifactSummaryViewModel) => void
} = {}) {
  render(
    <AppProviders>
      <BookExportArtifactPanel
        artifactWorkspace={artifactWorkspace}
        selectedFormat={selectedFormat}
        isBuilding={isBuilding}
        buildErrorMessage={buildErrorMessage}
        onSelectFormat={onSelectFormat}
        onBuildArtifact={onBuildArtifact}
        onCopyArtifact={onCopyArtifact}
        onDownloadArtifact={onDownloadArtifact}
      />
    </AppProviders>,
  )
}

describe('BookExportArtifactPanel', () => {
  it('disables build when the gate is blocked', () => {
    renderPanel({
      artifactWorkspace: buildWorkspace({
        gate: {
          canBuild: false,
          status: 'blocked',
          label: 'Artifact build blocked',
          reasons: [
            {
              id: 'review-blocker',
              severity: 'blocker',
              title: 'Open review blocker',
              detail: 'Resolve this before building.',
              source: 'review-open-blocker',
            },
          ],
          openBlockerCount: 1,
          checkedFixCount: 0,
          blockedFixCount: 0,
          staleFixCount: 0,
        },
      }),
    })

    expect(screen.getByRole('button', { name: 'Build Markdown package' })).toBeDisabled()
    expect(screen.getByText('Open review blocker')).toBeInTheDocument()
  })

  it('calls onSelectFormat from the format switcher', async () => {
    const user = userEvent.setup()
    const onSelectFormat = vi.fn()
    renderPanel({ onSelectFormat })

    await user.click(screen.getByRole('button', { name: 'Plain text' }))

    expect(onSelectFormat).toHaveBeenCalledWith('plain_text')
  })

  it('disables build and format controls when the artifact workspace is unavailable', async () => {
    const user = userEvent.setup()
    const onSelectFormat = vi.fn()
    const onBuildArtifact = vi.fn()

    renderPanel({
      artifactWorkspace: null,
      onSelectFormat,
      onBuildArtifact,
    })

    expect(screen.getByRole('button', { name: 'Build Markdown package' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Markdown' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Plain text' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Plain text' }))
    await user.click(screen.getByRole('button', { name: 'Build Markdown package' }))

    expect(onSelectFormat).not.toHaveBeenCalled()
    expect(onBuildArtifact).not.toHaveBeenCalled()
  })

  it('renders latest artifact metadata and recent history', () => {
    renderPanel()

    const latest = screen.getByRole('heading', { name: 'Latest artifact' }).closest('section')
    expect(latest).not.toBeNull()
    expect(within(latest!).getByText('signal-arc-review.md')).toBeInTheDocument()
    expect(within(latest!).getByText('Signal Arc')).toBeInTheDocument()
    expect(within(latest!).getByText('Export artifact for Review Packet.')).toBeInTheDocument()
    expect(within(latest!).getByText('Markdown')).toBeInTheDocument()
    expect(within(latest!).getByText('Built in mock export session')).toBeInTheDocument()
    expect(within(latest!).getByText('Narrative editor')).toBeInTheDocument()
    expect(within(latest!).getByText('2 chapters')).toBeInTheDocument()
    expect(within(latest!).getByText('5 scenes')).toBeInTheDocument()
    expect(within(latest!).getByText('1200 words')).toBeInTheDocument()
    expect(screen.getByText('signal-arc-review-previous.md')).toBeInTheDocument()
  })

  it('renders stale state for the latest artifact', () => {
    renderPanel({
      artifactWorkspace: buildWorkspace({
        latestArtifact: { ...latestArtifact, isStale: true },
        artifacts: [{ ...latestArtifact, isStale: true }],
      }),
    })

    expect(screen.getByText('Stale')).toBeInTheDocument()
  })

  it('forwards copy and download callbacks for the latest artifact', async () => {
    const user = userEvent.setup()
    const onCopyArtifact = vi.fn()
    const onDownloadArtifact = vi.fn()
    renderPanel({ onCopyArtifact, onDownloadArtifact })

    const latest = screen.getByRole('heading', { name: 'Latest artifact' }).closest('section')
    expect(latest).not.toBeNull()

    await user.click(within(latest!).getByRole('button', { name: 'Copy package text' }))
    await user.click(within(latest!).getByRole('button', { name: 'Download .md' }))

    expect(onCopyArtifact).toHaveBeenCalledWith(latestArtifact)
    expect(onDownloadArtifact).toHaveBeenCalledWith(latestArtifact)
  })

  it('renders an empty state when no artifact exists', () => {
    renderPanel({
      artifactWorkspace: buildWorkspace({
        latestArtifact: null,
        artifacts: [],
      }),
    })

    expect(screen.getByText('No artifact built yet')).toBeInTheDocument()
  })

  it('renders build errors', () => {
    renderPanel({ buildErrorMessage: 'Artifact build failed in mock session.' })

    expect(screen.getByText('Artifact build failed in mock session.')).toBeInTheDocument()
  })
})
