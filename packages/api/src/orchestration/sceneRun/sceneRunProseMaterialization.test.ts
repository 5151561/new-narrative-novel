import { describe, expect, it } from 'vitest'

import {
  createCanonPatchArtifact,
  createProposalSetArtifact,
  createProseDraftArtifact,
} from './sceneRunArtifacts.js'
import {
  buildCanonPatchDetail,
  buildProposalSetDetail,
  buildProseDraftDetail,
} from './sceneRunArtifactDetails.js'
import {
  buildAcceptedFactsFromCanonPatch,
  buildSceneProseFromProseDraftArtifact,
} from './sceneRunProseMaterialization.js'

describe('sceneRunProseMaterialization', () => {
  const runId = 'run-scene-midnight-platform-002'
  const sceneId = 'scene-midnight-platform'
  const selectedVariant = {
    proposalId: 'proposal-set-scene-midnight-platform-run-002-proposal-001',
    variantId: 'proposal-set-scene-midnight-platform-run-002-proposal-001-variant-002',
  }

  function buildAcceptedDetails() {
    const proposalSet = buildProposalSetDetail({
      artifact: createProposalSetArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-008'],
      selectedVariants: [selectedVariant],
    })
    const canonPatch = buildCanonPatchDetail({
      artifact: createCanonPatchArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-011'],
      decision: 'accept',
      sourceProposalSetId: proposalSet.id,
      selectedVariants: [selectedVariant],
    })
    const proseDraft = buildProseDraftDetail({
      artifact: createProseDraftArtifact({
        runId,
        sceneId,
        sequence: 2,
      }),
      sourceEventIds: ['run-event-scene-midnight-platform-002-012'],
      sourceCanonPatchId: canonPatch.id,
      sourceProposalIds: canonPatch.acceptedProposalIds,
      selectedVariants: canonPatch.selectedVariants,
    })

    return {
      proposalSet,
      canonPatch,
      proseDraft,
    }
  }

  it('maps prose body, source patch, selected variant provenance, assets, and accepted facts', () => {
    const { proposalSet, canonPatch, proseDraft } = buildAcceptedDetails()

    const materialized = buildSceneProseFromProseDraftArtifact({
      proseDraft,
      canonPatch,
      proposalSet,
    })

    expect(materialized.proseDraft).toContain('Midnight Platform opens from the accepted run artifact')
    expect(materialized.proseDraft).toContain(selectedVariant.variantId)
    expect(materialized.draftWordCount).toBe(146)
    expect(materialized.statusLabel).toBe('Generated')
    expect(materialized.latestDiffSummary).toBe('A fixture prose draft was rendered for Midnight Platform.')
    expect(materialized.traceSummary).toEqual({
      sourcePatchId: canonPatch.id,
      sourceProseDraftId: proseDraft.id,
      contextPacketId: proseDraft.contextPacketId,
      sourceProposals: [
        {
          proposalId: selectedVariant.proposalId,
          title: expect.stringContaining('Selected variant Reveal pressure'),
          sourceTraceId: selectedVariant.proposalId,
        },
      ],
      acceptedFactIds: ['canon-patch-scene-midnight-platform-002-fact-001'],
      relatedAssets: [
        {
          assetId: 'asset-scene-midnight-platform-lead',
          title: 'Midnight Platform lead',
          kind: 'character',
        },
        {
          assetId: 'asset-scene-midnight-platform-setting',
          title: 'Midnight Platform setting',
          kind: 'location',
        },
      ],
      missingLinks: [],
    })

    expect(buildAcceptedFactsFromCanonPatch(canonPatch)).toEqual([
      {
        id: 'canon-patch-scene-midnight-platform-002-fact-001',
        label: 'Accepted fact 1',
        value: 'Midnight Platform now opens on a stable arrival beat before any reveal escalates.',
        sourceProposals: [
          {
            proposalId: selectedVariant.proposalId,
            title: `Generated from ${selectedVariant.proposalId} - Selected variant ${selectedVariant.variantId}`,
            sourceTraceId: undefined,
          },
        ],
        relatedAssets: [
          {
            assetId: 'asset-scene-midnight-platform-lead',
            title: 'Midnight Platform lead',
            kind: 'character',
          },
        ],
      },
    ])
  })

  it('falls back to excerpt when prose body is absent and does not depend on run event payloads', () => {
    const { canonPatch, proseDraft } = buildAcceptedDetails()
    const proseDraftWithoutBody = {
      ...proseDraft,
      body: undefined,
      sourceEventIds: ['event-without-prose-payload'],
    }

    const materialized = buildSceneProseFromProseDraftArtifact({
      proseDraft: proseDraftWithoutBody,
      canonPatch,
    })

    expect(materialized.proseDraft).toBe('Midnight Platform settles into view before the next reveal turns visible.')
    expect(materialized.latestDiffSummary).toBe('A fixture prose draft was rendered for Midnight Platform.')
    expect(materialized.traceSummary?.sourceProposals).toEqual([
      {
        proposalId: selectedVariant.proposalId,
        title: `Generated from ${selectedVariant.proposalId} - Selected variant ${selectedVariant.variantId}`,
        sourceTraceId: undefined,
      },
    ])
  })
})
