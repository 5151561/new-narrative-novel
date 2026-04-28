import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import {
  getMockRunArtifact,
  resetMockRunDb,
  submitMockRunReviewDecision,
} from '@/features/run/api/mock-run-db'

import type { RunArtifactDetailRecord } from '../api/run-artifact-records'

import { RunArtifactInspectorPanel } from './RunArtifactInspectorPanel'

const runId = 'run-scene-midnight-platform-001'
const contextPacketId = 'ctx-scene-midnight-platform-run-001'
const proposalSetId = 'proposal-set-scene-midnight-platform-run-001'
const canonPatchId = 'canon-patch-scene-midnight-platform-001'
const proseDraftId = 'prose-draft-scene-midnight-platform-001'
const reviewId = 'review-scene-midnight-platform-001'

function acceptRun() {
  submitMockRunReviewDecision({
    runId,
    reviewId,
    decision: 'accept',
  })
}

function artifact(artifactId: string): RunArtifactDetailRecord {
  return getMockRunArtifact({ runId, artifactId }).artifact
}

function renderInspector(
  artifactDetail: RunArtifactDetailRecord | null,
  error: Error | null = null,
  props: Partial<React.ComponentProps<typeof RunArtifactInspectorPanel>> = {},
) {
  return render(
    <I18nProvider>
      <RunArtifactInspectorPanel artifact={artifactDetail} isLoading={false} error={error} {...props} />
    </I18nProvider>,
  )
}

describe('RunArtifactInspectorPanel', () => {
  beforeEach(() => {
    resetMockRunDb()
  })

  it('shows context packet sections, included assets, and excluded private facts', () => {
    renderInspector(artifact(contextPacketId))

    expect(screen.getByRole('heading', { name: 'Scene context packet' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Activation Summary' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Included Assets' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Excluded Assets' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Redacted Assets' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Target Agents' })).toBeInTheDocument()
    expect(screen.getByText('Scene brief')).toBeInTheDocument()
    expect(screen.getByText('Scene objective')).toBeInTheDocument()
    expect(screen.getAllByText('Ren Voss').length).toBeGreaterThan(0)
    expect(screen.getByText('Carries the primary point of view through the platform bargain.')).toBeInTheDocument()
    expect(screen.getAllByText('Mei Arden').length).toBeGreaterThan(0)
    expect(screen.getByText('Supplies the visible counter-pressure for the exchange.')).toBeInTheDocument()
    expect(screen.getAllByText('Midnight Platform').length).toBeGreaterThan(0)
    expect(screen.getByText('Keeps witness pressure and staging anchored to the platform.')).toBeInTheDocument()
    expect(screen.getByText('Deferred reveal')).toBeInTheDocument()
    expect(screen.getByText('Private reveal notes stay out until review lands.')).toBeInTheDocument()
    expect(screen.getByText('Scene context packet schema')).toBeInTheDocument()
    expect(screen.getByText('Target budget 1600 tokens')).toBeInTheDocument()
  })

  it('forwards context activation asset handoffs from context packet details', async () => {
    const user = userEvent.setup()
    const onOpenAssetContext = vi.fn()

    renderInspector(artifact(contextPacketId), null, { onOpenAssetContext })

    await user.click(screen.getByRole('button', { name: 'Open asset context for Ren Voss' }))

    expect(onOpenAssetContext).toHaveBeenCalledWith('asset-ren-voss')
  })

  it('shows proposal set proposals and review options', () => {
    renderInspector(artifact(proposalSetId))

    expect(screen.getByText('Editorial review')).toBeInTheDocument()
    expect(screen.getByText('Invocation 1')).toBeInTheDocument()
    expect(screen.getByText('Invocation 2')).toBeInTheDocument()
    expect(screen.getByText('agent-invocation-scene-midnight-platform-run-001-001, agent-invocation-scene-midnight-platform-run-001-002')).toBeInTheDocument()
    expect(screen.getByText('Anchor the arrival beat')).toBeInTheDocument()
    expect(screen.getAllByText('Low continuity risk').length).toBeGreaterThan(0)
    expect(screen.getByText('Stage the reveal through the setting')).toBeInTheDocument()
    expect(screen.getByText('Accept with edit')).toBeInTheDocument()
    expect(screen.getByText('Request rewrite')).toBeInTheDocument()
  })

  it('shows proposal variants and forwards selection changes while preserving flat proposals', async () => {
    const user = userEvent.setup()
    const onSelectProposalVariant = vi.fn()

    renderInspector(artifact(proposalSetId), null, {
      selectedVariants: {
        [`${proposalSetId}-proposal-001`]: 'variant-midnight-platform-default',
      },
      onSelectProposalVariant,
    })

    expect(screen.getByRole('radiogroup', { name: 'Proposal variants' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Balanced arrival/ })).toBeChecked()
    expect(screen.getByText('Keep the arrival beat steady and let the reveal wait until the setting is established.')).toBeInTheDocument()
    expect(screen.getByText('Higher conflict')).toBeInTheDocument()
    expect(screen.getByText('Stage the reveal through the setting')).toBeInTheDocument()
    expect(screen.queryByText('No proposal variants')).not.toBeInTheDocument()

    await user.click(screen.getByRole('radio', { name: /Higher conflict/ }))

    expect(onSelectProposalVariant).toHaveBeenCalledWith(
      `${proposalSetId}-proposal-001`,
      'variant-midnight-platform-raise-conflict',
    )
  })

  it('shows canon patch accepted facts', () => {
    submitMockRunReviewDecision({
      runId,
      reviewId,
      decision: 'accept',
      selectedVariants: [
        {
          proposalId: `${proposalSetId}-proposal-001`,
          variantId: 'variant-midnight-platform-raise-conflict',
        },
      ],
    })

    renderInspector(artifact(canonPatchId))

    expect(screen.getByRole('heading', { name: 'Canon patch' })).toBeInTheDocument()
    expect(screen.getByText('Accepted fact 1')).toBeInTheDocument()
    expect(screen.getByText('The scene now opens on a stable arrival beat.')).toBeInTheDocument()
    expect(screen.getByText('Accepted into canon')).toBeInTheDocument()
    expect(screen.getAllByText('Selected variants')).not.toHaveLength(0)
    expect(screen.getAllByText('Selected variant 1').length).toBeGreaterThan(0)
    expect(screen.queryByText(`${proposalSetId}-proposal-001 -> variant-midnight-platform-raise-conflict`)).not.toBeInTheDocument()
    expect(screen.getAllByTitle(`${proposalSetId}-proposal-001 -> variant-midnight-platform-raise-conflict`).length).toBeGreaterThan(0)
  })

  it('shows prose draft excerpt and source ids', () => {
    acceptRun()

    renderInspector(artifact(proseDraftId))

    expect(screen.getByRole('heading', { name: 'Prose draft' })).toBeInTheDocument()
    expect(screen.getByText('The scene settles into view before the next reveal turns visible.')).toBeInTheDocument()
    expect(screen.getByText('The scene opens from the accepted run artifact, keeping the selected review material visible in the draft.')).toBeInTheDocument()
    expect(screen.getByText('143 words')).toBeInTheDocument()
    expect(screen.getByText(canonPatchId)).toBeInTheDocument()
    expect(screen.getByText(contextPacketId)).toBeInTheDocument()
    expect(screen.getByText(`${proposalSetId}-proposal-001`)).toBeInTheDocument()
  })

  it('shows an artifact not found state without exposing raw backend error strings', () => {
    renderInspector(null, new Error('Run artifact missing-artifact was not found.'))

    expect(screen.getByText('Artifact not found')).toBeInTheDocument()
    expect(screen.getByText('The selected run artifact is no longer available for this run.')).toBeInTheDocument()
    expect(screen.queryByText('Run artifact missing-artifact was not found.')).not.toBeInTheDocument()
  })

  it('shows artifact-level failure detail, usage summary, and retry guidance for failed artifacts', () => {
    const failedArtifact: RunArtifactDetailRecord = {
      ...artifact(proposalSetId),
      usage: {
        inputTokens: 1420,
        outputTokens: 318,
        estimatedCostUsd: 0.0218,
        actualCostUsd: 0.0241,
        provider: 'openai',
        modelId: 'gpt-5.4',
      },
      failureDetail: {
        failureClass: 'invalid_output',
        message: 'Proposal normalization failed because no safe variant survived validation.',
        provider: 'openai',
        modelId: 'gpt-5.4',
        retryable: false,
        sourceEventIds: ['run-event-scene-midnight-platform-001-007', 'run-event-scene-midnight-platform-001-008'],
      },
    }

    renderInspector(failedArtifact)

    expect(screen.getByRole('heading', { name: 'Failure detail' })).toBeInTheDocument()
    expect(screen.getByText('invalid_output')).toBeInTheDocument()
    expect(screen.getByText('Proposal normalization failed because no safe variant survived validation.')).toBeInTheDocument()
    expect(screen.getByText('1,420 in / 318 out')).toBeInTheDocument()
    expect(screen.getByText('$0.0218 est. / $0.0241 actual')).toBeInTheDocument()
    expect(screen.getByText('Retryable')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.getByText('Check the source events before starting a new run.')).toBeInTheDocument()
    expect(screen.getByText('run-event-scene-midnight-platform-001-007')).toBeInTheDocument()
    expect(screen.getByText('run-event-scene-midnight-platform-001-008')).toBeInTheDocument()
  })
})
