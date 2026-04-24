import { beforeEach, describe, expect, it } from 'vitest'

import {
  exportMockRunSnapshot,
  getMockRun,
  getMockRunArtifact,
  getMockRunEvents,
  importMockRunSnapshot,
  resetMockRunDb,
  submitMockRunReviewDecision,
} from './mock-run-db'
import type { ProposalSetArtifactDetailRecord } from './run-artifact-records'
import type { RunSelectedProposalVariantRecord } from './run-records'

const runId = 'run-scene-midnight-platform-001'
const reviewId = 'review-scene-midnight-platform-001'
const proposalSetId = 'proposal-set-scene-midnight-platform-run-001'
const proposalOneId = `${proposalSetId}-proposal-001`
const proposalTwoId = `${proposalSetId}-proposal-002`
const selectedVariants: RunSelectedProposalVariantRecord[] = [
  {
    proposalId: proposalOneId,
    variantId: 'variant-midnight-platform-raise-conflict',
  },
]

function getProposalSetArtifact() {
  return getMockRunArtifact({
    runId,
    artifactId: proposalSetId,
  }).artifact as ProposalSetArtifactDetailRecord
}

describe('mock run db proposal variants', () => {
  beforeEach(() => {
    resetMockRunDb()
  })

  it('exposes proposal variants while keeping no-variant proposals valid', () => {
    const proposalSet = getProposalSetArtifact()
    const [proposalWithVariants, proposalWithoutVariants] = proposalSet.proposals

    expect(proposalWithVariants.variants).toEqual([
      expect.objectContaining({
        id: 'variant-midnight-platform-default',
        label: {
          en: expect.any(String),
          'zh-CN': expect.any(String),
        },
        summary: {
          en: expect.any(String),
          'zh-CN': expect.any(String),
        },
        rationale: {
          en: expect.any(String),
          'zh-CN': expect.any(String),
        },
      }),
      expect.objectContaining({
        id: 'variant-midnight-platform-raise-conflict',
        tradeoffLabel: {
          en: expect.any(String),
          'zh-CN': expect.any(String),
        },
        riskLabel: {
          en: expect.any(String),
          'zh-CN': expect.any(String),
        },
      }),
    ])
    expect(proposalWithVariants.defaultVariantId).toBe('variant-midnight-platform-default')
    expect(proposalWithoutVariants.id).toBe(proposalTwoId)
    expect(proposalWithoutVariants.variants).toBeUndefined()
  })

  it('persists selected variants and keeps review events lightweight', () => {
    submitMockRunReviewDecision({
      runId,
      reviewId,
      decision: 'accept',
      selectedVariants,
    })

    const eventPage = getMockRunEvents({
      runId,
      cursor: 'run-event-scene-midnight-platform-001-009',
    })
    const reviewDecisionEvent = eventPage.events.find((event) => event.kind === 'review_decision_submitted')
    const proposalSet = getProposalSetArtifact()

    expect(reviewDecisionEvent?.metadata).toEqual({
      selectedVariantCount: 1,
    })
    expect(reviewDecisionEvent).not.toHaveProperty('selectedVariants')
    expect(reviewDecisionEvent?.metadata).not.toHaveProperty('selectedVariants')
    expect(proposalSet.proposals[0]?.selectedVariantId).toBe('variant-midnight-platform-raise-conflict')
  })

  it('surfaces selected variant provenance in canon patch and prose detail', () => {
    submitMockRunReviewDecision({
      runId,
      reviewId,
      decision: 'accept',
      selectedVariants,
    })

    const canonPatch = getMockRunArtifact({
      runId,
      artifactId: 'canon-patch-scene-midnight-platform-001',
    }).artifact
    const proseDraft = getMockRunArtifact({
      runId,
      artifactId: 'prose-draft-scene-midnight-platform-001',
    }).artifact

    expect(canonPatch).toMatchObject({
      kind: 'canon-patch',
      selectedVariants,
      acceptedFacts: [
        expect.objectContaining({
          selectedVariants,
        }),
      ],
    })
    expect(proseDraft).toMatchObject({
      kind: 'prose-draft',
      selectedVariants,
    })
  })

  it('rejects invalid selected variants before mutating the run', () => {
    const cases: RunSelectedProposalVariantRecord[][] = [
      [
        { proposalId: proposalOneId, variantId: 'variant-midnight-platform-default' },
        { proposalId: proposalOneId, variantId: 'variant-midnight-platform-raise-conflict' },
      ],
      [{ proposalId: 'proposal-missing', variantId: 'variant-midnight-platform-default' }],
      [{ proposalId: proposalOneId, variantId: 'variant-missing' }],
      [{ proposalId: proposalTwoId, variantId: 'variant-midnight-platform-default' }],
    ]

    for (const invalidSelectedVariants of cases) {
      resetMockRunDb()

      expect(() =>
        submitMockRunReviewDecision({
          runId,
          reviewId,
          decision: 'accept',
          selectedVariants: invalidSelectedVariants,
        }),
      ).toThrowError(expect.objectContaining({ status: 400 }))
      expect(getMockRun(runId)).toMatchObject({
        status: 'waiting_review',
        pendingReviewId: reviewId,
        eventCount: 9,
      })
    }
  })

  it('preserves selected variant state through snapshots without shared mutation leaks', () => {
    submitMockRunReviewDecision({
      runId,
      reviewId,
      decision: 'accept',
      selectedVariants,
    })

    const snapshot = exportMockRunSnapshot()
    const projectState = snapshot.runStatesByProjectId['book-signal-arc']?.[0]
    projectState?.selectedVariantsByReviewId?.[reviewId]?.push({
      proposalId: proposalOneId,
      variantId: 'variant-mutated-after-export',
    })

    const exportedAgain = exportMockRunSnapshot()
    expect(exportedAgain.runStatesByProjectId['book-signal-arc']?.[0]?.selectedVariantsByReviewId?.[reviewId]).toEqual(
      selectedVariants,
    )

    importMockRunSnapshot(exportedAgain)
    const canonPatch = getMockRunArtifact({
      runId,
      artifactId: 'canon-patch-scene-midnight-platform-001',
    }).artifact

    expect(canonPatch).toMatchObject({
      kind: 'canon-patch',
      selectedVariants,
    })

    if (canonPatch.kind === 'canon-patch') {
      canonPatch.selectedVariants?.push({
        proposalId: proposalOneId,
        variantId: 'variant-mutated-after-detail-read',
      })
    }

    expect(
      getMockRunArtifact({
        runId,
        artifactId: 'canon-patch-scene-midnight-platform-001',
      }).artifact,
    ).toMatchObject({
      kind: 'canon-patch',
      selectedVariants,
    })
  })
})
