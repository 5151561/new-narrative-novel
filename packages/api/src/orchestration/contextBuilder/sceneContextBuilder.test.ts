import { describe, expect, it } from 'vitest'

import { createFixtureDataSnapshot } from '../../repositories/fixture-data.js'
import {
  buildSceneContextPacket,
  isSceneContextPacketRecord,
  renderSceneContextPacketForPlanner,
  renderSceneContextPacketForWriter,
} from './sceneContextBuilder.js'

describe('sceneContextBuilder', () => {
  it('builds a first-class context packet from current fixture project truth', () => {
    const snapshot = createFixtureDataSnapshot('http://127.0.0.1:4174/api')
    const packet = buildSceneContextPacket({
      project: snapshot.projects['book-signal-arc'],
      sceneId: 'scene-midnight-platform',
      sequence: 2,
    })

    expect(isSceneContextPacketRecord(packet)).toBe(true)
    expect(packet).toMatchObject({
      version: 'scene-context-v1',
      packetId: 'ctx-scene-midnight-platform-run-002',
      sceneId: 'scene-midnight-platform',
      narrative: {
        bookPremise: {
          en: 'Fixture-backed project root for the BE-PR1 API server skeleton.',
        },
        chapterGoal: {
          en: 'Re-cut the same chapter through order, density, and assembly pressure without leaving the workbench.',
        },
        sceneObjective: {
          en: 'Lock the bargain before the witness can turn the ledger into public leverage.',
        },
        sceneSetup: {
          en: 'The platform scene keeps every negotiation beat public.',
        },
        currentState: {
          en: 'The platform bargain remains public while Ren keeps the ledger unread.',
        },
      },
      outputSchemaLabel: {
        en: 'Scene context packet schema',
      },
      tokenBudgetLabel: {
        en: 'Target budget 1700 tokens',
      },
      activationSummary: {
        includedAssetCount: 3,
        excludedAssetCount: 1,
        redactedAssetCount: 1,
        targetAgentCount: 4,
        warningCount: 1,
      },
    })
    expect(packet.includedCanonFacts.map((fact) => fact.label.en)).toEqual([
      'Scene objective',
      'Current scene state',
      'Ledger remains closed',
    ])
    expect(packet.includedAssets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        assetId: 'asset-ren-voss',
        reason: expect.objectContaining({
          en: expect.stringContaining('Courier-side negotiator'),
        }),
      }),
      expect.objectContaining({
        assetId: 'asset-midnight-platform',
        reason: expect.objectContaining({
          en: expect.stringContaining('Open platform where every hesitation'),
        }),
      }),
    ]))
  })

  it('preserves redaction and exclusion explanations without leaking hidden content', () => {
    const snapshot = createFixtureDataSnapshot('http://127.0.0.1:4174/api')
    const packet = buildSceneContextPacket({
      project: snapshot.projects['book-signal-arc'],
      sceneId: 'scene-midnight-platform',
      sequence: 1,
    })

    expect(packet.assetActivations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        assetId: 'asset-ledger-stays-shut',
        decision: 'excluded',
        visibility: 'spoiler',
        policyRuleIds: ['ledger-rule-dependency'],
      }),
      expect.objectContaining({
        assetId: 'asset-departure-bell-timing',
        decision: 'redacted',
        visibility: 'editor-only',
        note: expect.objectContaining({
          en: 'Departure Bell Timing stays redacted; only the guardrail and warning count remain visible.',
        }),
      }),
    ]))
    expect(packet.excludedPrivateFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.objectContaining({
          en: 'Courier signal private key',
        }),
      }),
      expect.objectContaining({
        label: expect.objectContaining({
          en: 'Full ledger proof',
        }),
      }),
      expect.objectContaining({
        label: expect.objectContaining({
          en: 'Editor timing guardrail',
        }),
      }),
    ]))
    expect(JSON.stringify(packet)).not.toContain('courier signal meaning')
    expect(JSON.stringify(packet)).not.toContain('exact bell placement')
  })

  it('retains the real unresolved departure-bell warning for scene-midnight-platform', () => {
    const snapshot = createFixtureDataSnapshot('http://127.0.0.1:4174/api')
    const packet = buildSceneContextPacket({
      project: snapshot.projects['book-signal-arc'],
      sceneId: 'scene-midnight-platform',
      sequence: 1,
    })

    expect(packet.assetActivations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        assetId: 'asset-departure-bell-timing',
        decision: 'redacted',
        visibility: 'editor-only',
      }),
    ]))
    expect(packet.activationSummary).toMatchObject({
      redactedAssetCount: 1,
      warningCount: 1,
    })
    expect(packet.excludedPrivateFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: expect.objectContaining({
          en: 'Editor timing guardrail',
        }),
      }),
    ]))
  })

  it('does not inject unrelated review-issue assets into scene packets for other scenes', () => {
    const snapshot = createFixtureDataSnapshot('http://127.0.0.1:4174/api')
    const packet = buildSceneContextPacket({
      project: snapshot.projects['book-signal-arc'],
      sceneId: 'scene-ticket-window',
      sequence: 1,
    })

    expect(packet.assetActivations.some((activation) => activation.assetId === 'asset-departure-bell-timing')).toBe(false)
    expect(packet.excludedPrivateFacts.some((fact) => fact.label.en === 'Editor timing guardrail')).toBe(false)
    expect(packet.activationSummary.redactedAssetCount).toBe(0)
    expect(packet.activationSummary.warningCount).toBe(0)
  })

  it('renders the same persisted packet into planner and writer prompts', () => {
    const snapshot = createFixtureDataSnapshot('http://127.0.0.1:4174/api')
    const packet = buildSceneContextPacket({
      project: snapshot.projects['book-signal-arc'],
      sceneId: 'scene-midnight-platform',
      sequence: 1,
    })

    const plannerInput = renderSceneContextPacketForPlanner(packet, {
      mode: 'rewrite',
      note: 'Tighten the ending beat.',
    })
    const writerInput = renderSceneContextPacketForWriter(packet, {
      decision: 'accept',
      acceptedProposalIds: ['proposal-set-scene-midnight-platform-run-001-proposal-001'],
      selectedVariantIds: ['proposal-set-scene-midnight-platform-run-001-proposal-001-variant-002'],
      note: 'Ship the stronger conflict turn.',
    })

    expect(plannerInput).toContain(`Context packet ${packet.packetId}.`)
    expect(plannerInput).toContain('Book premise: Fixture-backed project root for the BE-PR1 API server skeleton.')
    expect(plannerInput).toContain('Requested mode: rewrite.')
    expect(writerInput).toContain(`Context packet ${packet.packetId}.`)
    expect(writerInput).toContain('Accepted decision: accept.')
    expect(writerInput).toContain('Selected variants: proposal-set-scene-midnight-platform-run-001-proposal-001-variant-002.')
  })
})
