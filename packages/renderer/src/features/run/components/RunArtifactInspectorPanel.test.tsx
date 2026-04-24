import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

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

function renderInspector(artifactDetail: RunArtifactDetailRecord | null, error: Error | null = null) {
  return render(
    <I18nProvider>
      <RunArtifactInspectorPanel artifact={artifactDetail} isLoading={false} error={error} />
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
    expect(screen.getByText('Scene brief')).toBeInTheDocument()
    expect(screen.getByText('Scene objective')).toBeInTheDocument()
    expect(screen.getByText('midnight platform lead')).toBeInTheDocument()
    expect(screen.getByText('Carries the primary point of view through the run.')).toBeInTheDocument()
    expect(screen.getByText('Deferred reveal')).toBeInTheDocument()
    expect(screen.getByText('Private reveal notes stay out until review lands.')).toBeInTheDocument()
    expect(screen.getByText('Scene context packet schema')).toBeInTheDocument()
    expect(screen.getByText('Target budget 1600 tokens')).toBeInTheDocument()
  })

  it('shows proposal set proposals and review options', () => {
    renderInspector(artifact(proposalSetId))

    expect(screen.getByText('Editorial review')).toBeInTheDocument()
    expect(screen.getByText('Invocation 1')).toBeInTheDocument()
    expect(screen.getByText('Invocation 2')).toBeInTheDocument()
    expect(screen.getByText('agent-invocation-scene-midnight-platform-run-001-001, agent-invocation-scene-midnight-platform-run-001-002')).toBeInTheDocument()
    expect(screen.getByText('Anchor the arrival beat')).toBeInTheDocument()
    expect(screen.getByText('Low continuity risk')).toBeInTheDocument()
    expect(screen.getByText('Stage the reveal through the setting')).toBeInTheDocument()
    expect(screen.getByText('Accept with edit')).toBeInTheDocument()
    expect(screen.getByText('Request rewrite')).toBeInTheDocument()
  })

  it('shows canon patch accepted facts', () => {
    acceptRun()

    renderInspector(artifact(canonPatchId))

    expect(screen.getByRole('heading', { name: 'Canon patch' })).toBeInTheDocument()
    expect(screen.getByText('Accepted fact 1')).toBeInTheDocument()
    expect(screen.getByText('The scene now opens on a stable arrival beat.')).toBeInTheDocument()
    expect(screen.getByText('Accepted into canon')).toBeInTheDocument()
  })

  it('shows prose draft excerpt and source ids', () => {
    acceptRun()

    renderInspector(artifact(proseDraftId))

    expect(screen.getByRole('heading', { name: 'Prose draft' })).toBeInTheDocument()
    expect(screen.getByText('The scene settles into view before the next reveal turns visible.')).toBeInTheDocument()
    expect(screen.getByText('143 words')).toBeInTheDocument()
    expect(screen.getByText(canonPatchId)).toBeInTheDocument()
    expect(screen.getByText(`${proposalSetId}-proposal-001`)).toBeInTheDocument()
  })

  it('shows an artifact not found state without exposing raw backend error strings', () => {
    renderInspector(null, new Error('Run artifact missing-artifact was not found.'))

    expect(screen.getByText('Artifact not found')).toBeInTheDocument()
    expect(screen.getByText('The selected run artifact is no longer available for this run.')).toBeInTheDocument()
    expect(screen.queryByText('Run artifact missing-artifact was not found.')).not.toBeInTheDocument()
  })
})
