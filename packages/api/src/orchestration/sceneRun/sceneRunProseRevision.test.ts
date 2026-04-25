import { describe, expect, it } from 'vitest'

import type { SceneProseViewModel } from '../../contracts/api-records.js'
import { applySceneProseRevisionRequest } from './sceneRunProseRevision.js'

describe('sceneRunProseRevision', () => {
  function buildProse(overrides: Partial<SceneProseViewModel> = {}): SceneProseViewModel {
    return {
      sceneId: 'scene-midnight-platform',
      proseDraft: 'Ren keeps the ledger in sight while Mei keeps the bargain public.',
      revisionModes: ['rewrite', 'compress', 'expand', 'tone_adjust', 'continuity_fix'],
      latestDiffSummary: 'Previous fixture diff summary.',
      warningsCount: 1,
      focusModeAvailable: true,
      revisionQueueCount: 1,
      draftWordCount: 12,
      statusLabel: 'Draft ready for review',
      traceSummary: {
        sourcePatchId: 'patch-midnight-platform-001',
        sourceProposals: [
          {
            proposalId: 'proposal-midnight-platform-001',
            title: 'Raise the price in public',
            sourceTraceId: 'trace-platform-001',
          },
        ],
        acceptedFactIds: ['fact-ledger-closed'],
        relatedAssets: [
          {
            assetId: 'asset-ren-voss',
            title: 'Ren Voss',
            kind: 'character',
          },
        ],
        missingLinks: ['Departure bell timing'],
      },
      ...overrides,
    }
  }

  it('increments revisionQueueCount for a requested revision mode', () => {
    const revised = applySceneProseRevisionRequest({
      prose: buildProse({ revisionQueueCount: 2 }),
      revisionMode: 'compress',
    })

    expect(revised.revisionQueueCount).toBe(3)
  })

  it('treats a missing revisionQueueCount as 0 before incrementing', () => {
    const revised = applySceneProseRevisionRequest({
      prose: buildProse({ revisionQueueCount: undefined }),
      revisionMode: 'rewrite',
    })

    expect(revised.revisionQueueCount).toBe(1)
  })

  it('updates latestDiffSummary for expand revisions', () => {
    const revised = applySceneProseRevisionRequest({
      prose: buildProse(),
      revisionMode: 'expand',
    })

    expect(revised.latestDiffSummary).toBe(
      'Revision queued: expand pass will add supporting beats while keeping trace links intact.',
    )
    expect(revised.statusLabel).toBe('Revision queued')
  })

  it('preserves traceSummary for continuity fixes', () => {
    const prose = buildProse()
    const revised = applySceneProseRevisionRequest({
      prose,
      revisionMode: 'continuity_fix',
    })

    expect(revised.traceSummary).toEqual(prose.traceSummary)
  })

  it('does not modify proseDraft body', () => {
    const prose = buildProse()
    const revised = applySceneProseRevisionRequest({
      prose,
      revisionMode: 'tone_adjust',
    })

    expect(revised.proseDraft).toBe(prose.proseDraft)
  })

  it('does not modify source patch, source proposals, or accepted facts', () => {
    const prose = buildProse()
    const revised = applySceneProseRevisionRequest({
      prose,
      revisionMode: 'compress',
    })

    expect(revised.traceSummary?.sourcePatchId).toBe('patch-midnight-platform-001')
    expect(revised.traceSummary?.sourceProposals).toEqual(prose.traceSummary?.sourceProposals)
    expect(revised.traceSummary?.acceptedFactIds).toEqual(['fact-ledger-closed'])
  })
})
