import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import {
  getMockRunArtifact,
  getMockRunArtifacts,
  getMockRunTrace,
  resetMockRunDb,
  submitMockRunReviewDecision,
} from '@/features/run/api/mock-run-db'

import { RunEventInspectorPanel } from './RunEventInspectorPanel'

const runId = 'run-scene-midnight-platform-001'
const reviewId = 'review-scene-midnight-platform-001'
const contextPacketId = 'ctx-scene-midnight-platform-run-001'

describe('RunEventInspectorPanel', () => {
  beforeEach(() => {
    resetMockRunDb()
    submitMockRunReviewDecision({ runId, reviewId, decision: 'accept' })
  })

  it('keeps trace open when selectedArtifactId changes while trace is active', async () => {
    const user = userEvent.setup()
    const artifacts = getMockRunArtifacts({ runId }).artifacts
    const trace = getMockRunTrace({ runId })
    const contextPacket = getMockRunArtifact({ runId, artifactId: contextPacketId }).artifact
    const view = render(
      <I18nProvider>
        <RunEventInspectorPanel artifacts={artifacts} selectedArtifactId={null} selectedArtifact={null} trace={trace} />
      </I18nProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Trace' }))
    expect(screen.getByRole('heading', { name: 'Run Trace' })).toBeInTheDocument()

    view.rerender(
      <I18nProvider>
        <RunEventInspectorPanel
          artifacts={artifacts}
          selectedArtifactId={contextPacketId}
          selectedArtifact={contextPacket}
          trace={trace}
        />
      </I18nProvider>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Run Trace' })).toBeInTheDocument()
    })
  })

  it('keeps the artifact list accessible while an artifact detail is selected', async () => {
    const user = userEvent.setup()
    const artifacts = getMockRunArtifacts({ runId }).artifacts
    const trace = getMockRunTrace({ runId })
    function StatefulInspector() {
      const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(contextPacketId)
      const selectedArtifact = selectedArtifactId
        ? getMockRunArtifact({ runId, artifactId: selectedArtifactId }).artifact
        : null

      return (
        <RunEventInspectorPanel
          artifacts={artifacts}
          selectedArtifactId={selectedArtifactId}
          selectedArtifact={selectedArtifact}
          trace={trace}
          onSelectArtifact={setSelectedArtifactId}
        />
      )
    }

    render(
      <I18nProvider>
        <StatefulInspector />
      </I18nProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Scene context packet' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Canon patch/ }))

    expect(screen.getByRole('heading', { name: 'Canon patch' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Prose draft/ })).toBeInTheDocument()
  })

  it('keeps artifact list loading and error state separate from selected artifact detail', () => {
    const artifacts = getMockRunArtifacts({ runId }).artifacts
    const trace = getMockRunTrace({ runId })
    const contextPacket = getMockRunArtifact({ runId, artifactId: contextPacketId }).artifact
    const view = render(
      <I18nProvider>
        <RunEventInspectorPanel artifacts={[]} isArtifactsLoading selectedArtifactId={null} selectedArtifact={null} trace={trace} />
      </I18nProvider>,
    )

    expect(screen.getByText('Loading run artifacts')).toBeInTheDocument()

    view.rerender(
      <I18nProvider>
        <RunEventInspectorPanel
          artifacts={artifacts}
          artifactsError={new Error('list unavailable')}
          selectedArtifactId={contextPacketId}
          selectedArtifact={contextPacket}
          trace={trace}
        />
      </I18nProvider>,
    )

    expect(screen.getByText('Artifacts unavailable')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Scene context packet' })).toBeInTheDocument()
    expect(screen.queryByText('Artifact not found')).not.toBeInTheDocument()
  })
})
