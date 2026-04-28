import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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
const proposalSetId = 'proposal-set-scene-midnight-platform-run-001'

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

  it('forwards context activation asset handoffs from the selected artifact detail', async () => {
    const user = userEvent.setup()
    const onOpenAssetContext = vi.fn()
    const artifacts = getMockRunArtifacts({ runId }).artifacts
    const trace = getMockRunTrace({ runId })
    const contextPacket = getMockRunArtifact({ runId, artifactId: contextPacketId }).artifact

    render(
      <I18nProvider>
        <RunEventInspectorPanel
          artifacts={artifacts}
          selectedArtifactId={contextPacketId}
          selectedArtifact={contextPacket}
          trace={trace}
          onOpenAssetContext={onOpenAssetContext}
        />
      </I18nProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Open asset context for Ren Voss' }))

    expect(onOpenAssetContext).toHaveBeenCalledWith('asset-ren-voss')
  })

  it('surfaces failure class, retryability, usage summary, and source refs from the selected artifact detail', () => {
    const artifacts = getMockRunArtifacts({ runId }).artifacts
    const trace = getMockRunTrace({ runId })
    const failedArtifact = {
      ...getMockRunArtifact({ runId, artifactId: proposalSetId }).artifact,
      usage: {
        inputTokens: 1420,
        outputTokens: 318,
        estimatedCostUsd: 0.0218,
        provider: 'openai',
        modelId: 'gpt-5.4',
      },
      failureDetail: {
        failureClass: 'provider_error' as const,
        message: 'Provider returned 502 while proposal packaging was being finalized.',
        provider: 'openai',
        modelId: 'gpt-5.4',
        retryable: true,
        sourceEventIds: ['run-event-scene-midnight-platform-001-007'],
      },
    }

    render(
      <I18nProvider>
        <RunEventInspectorPanel
          artifacts={artifacts}
          selectedArtifactId={proposalSetId}
          selectedArtifact={failedArtifact}
          trace={trace}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Selected artifact support summary' })).toBeInTheDocument()
    expect(screen.getAllByText('provider_error').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Retryable').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1,420 in / 318 out').length).toBeGreaterThan(0)
    expect(screen.getAllByText('$0.0218 est.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('run-event-scene-midnight-platform-001-007').length).toBeGreaterThan(0)
  })
})
