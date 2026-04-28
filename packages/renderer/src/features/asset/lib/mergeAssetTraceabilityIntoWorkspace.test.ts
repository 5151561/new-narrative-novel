import { describe, expect, it } from 'vitest'

import type { AssetKnowledgeWorkspaceViewModel } from '../types/asset-view-models'
import { mergeAssetTraceabilityIntoWorkspace } from './mergeAssetTraceabilityIntoWorkspace'

const workspace: AssetKnowledgeWorkspaceViewModel = {
  assetId: 'asset-ren-voss',
  kind: 'character',
  title: 'Ren Voss',
  summary: 'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
  navigator: {
    characters: [],
    locations: [],
    organizations: [],
    objects: [],
    lore: [],
  },
  viewsMeta: {
    availableViews: ['profile', 'mentions', 'relations', 'context'],
  },
  profile: {
    sections: [],
  },
  storyBible: {
    canonFacts: [],
    privateFacts: [],
    stateTimeline: [],
  },
  mentions: [
    {
      id: 'mention-ren-midnight-platform',
      targetScope: 'scene',
      targetId: 'scene-midnight-platform',
      chapterId: 'chapter-signals-in-rain',
      sceneId: 'scene-midnight-platform',
      title: 'Midnight Platform',
      relationLabel: 'Primary POV',
      excerpt: 'Ren holds the line on the platform and refuses to turn the ledger into a public prop.',
      backing: {
        kind: 'canon',
        sceneId: 'scene-midnight-platform',
        patchId: 'patch-1',
      },
      handoffActions: [],
    },
    {
      id: 'mention-ren-signals-in-rain',
      targetScope: 'chapter',
      targetId: 'chapter-signals-in-rain',
      chapterId: 'chapter-signals-in-rain',
      title: 'Signals in Rain',
      relationLabel: 'Carries the bargaining line',
      excerpt: 'Ren stays at the center of every leverage exchange in the chapter.',
      backing: {
        kind: 'draft_context',
      },
      handoffActions: [],
    },
  ],
  relations: [
    {
      id: 'relation-ren-mei',
      targetAssetId: 'asset-mei-arden',
      targetTitle: 'Mei Arden',
      targetKind: 'character',
      targetKindLabel: 'Character',
      relationshipScopeLabel: 'Same-kind relation',
      reciprocalStatusLabel: 'Reciprocal',
      hasReciprocalRelation: true,
      relationLabel: 'Bargains against',
      summary: 'Ren needs Mei’s timing.',
    },
    {
      id: 'relation-ren-ledger',
      targetAssetId: 'asset-public-witness-rule',
      targetTitle: 'Public witness rule',
      targetKind: 'lore',
      targetKindLabel: 'Lore',
      relationshipScopeLabel: 'Cross-kind relation',
      reciprocalStatusLabel: 'One-way',
      hasReciprocalRelation: false,
      relationLabel: 'Protects',
      summary: 'Ren keeps the ledger closed.',
    },
  ],
  contextPolicy: {
    hasContextPolicy: true,
    statusLabel: 'Active',
    summary: 'Ren may enter run context when he is in cast.',
    defaultVisibilityLabel: 'Character-known',
    defaultBudgetLabel: 'Selected facts',
    activationRules: [],
    participation: [],
    exclusions: [],
    warnings: [],
  },
  inspector: {
    kindLabel: 'Character',
    summary: 'Courier-side negotiator who keeps the ledger closed while trying to buy time in public.',
    visibilityLabel: 'Character-known',
    mentionCount: 2,
    relationCount: 2,
    canonFactCount: 0,
    privateFactCount: 0,
    timelineEntryCount: 0,
    warnings: [],
    notes: ['Keep Ren’s refusal legible before any exit bell cue lands.'],
    isOrphan: false,
    missingFields: ['Implications'],
    contextPolicy: {
      hasContextPolicy: true,
      statusLabel: 'Active',
      defaultVisibilityLabel: 'Character-known',
      defaultBudgetLabel: 'Selected facts',
      activationRuleCount: 0,
      warningCount: 0,
    },
  },
  dockSummary: {
    problemItems: [
      {
        id: 'missing-0',
        label: 'Missing profile section',
        detail: 'Implications',
      },
    ],
    warningCount: 0,
    missingFieldCount: 1,
    relationCount: 2,
    mentionCount: 2,
    timelineEntryCount: 0,
    isOrphan: false,
    contextPolicy: {
      hasContextPolicy: true,
      statusLabel: 'Active',
      defaultVisibilityLabel: 'Character-known',
      defaultBudgetLabel: 'Selected facts',
      activationRuleCount: 0,
      warningCount: 0,
    },
  },
  dockActivity: [],
}

describe('mergeAssetTraceabilityIntoWorkspace', () => {
  it('merges ready traceability into mentions, inspector, and dock using ui-facing output only', () => {
    const merged = mergeAssetTraceabilityIntoWorkspace({
      workspace,
      traceability: {
        summary: {
          assetId: 'asset-ren-voss',
          canonBackedMentions: 1,
          draftContextMentions: 1,
          unlinkedMentions: 0,
          mentionsWithMissingSceneTrace: 0,
          relationsWithoutNarrativeBackingCount: 1,
          relationTargetAssetIdsWithNarrativeBacking: ['asset-mei-arden'],
          relationTargetAssetIdsWithoutNarrativeBacking: ['asset-public-witness-rule'],
          mentionSummaries: [
            {
              mentionId: 'mention-ren-midnight-platform',
              title: 'Midnight Platform',
              backingKind: 'canon',
              factLabels: ['Courier signal spotted'],
              proposalTitles: ['Force the bargain into a visible stalemate'],
              patchId: 'patch-1',
              sceneId: 'scene-midnight-platform',
              sceneTraceMissing: false,
            },
            {
              mentionId: 'mention-ren-signals-in-rain',
              title: 'Signals in Rain',
              backingKind: 'draft_context',
              factLabels: [],
              proposalTitles: ['Force the trade-off into one visible exchange'],
              sceneId: undefined,
              patchId: undefined,
              sceneTraceMissing: false,
            },
          ],
        },
        isLoading: false,
        error: null,
      },
      locale: 'en',
    })

    expect(merged.mentions[0].traceDetail).toMatchObject({
      factLabels: ['Courier signal spotted'],
      proposalTitles: ['Force the bargain into a visible stalemate'],
    })
    expect(merged.inspector).toMatchObject({
      canonBackedMentionCount: 1,
      draftContextMentionCount: 1,
      unlinkedMentionCount: 0,
    })
    expect(merged.relations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          targetAssetId: 'asset-mei-arden',
          hasNarrativeBacking: true,
          narrativeBackingStatusLabel: 'Narrative-backed',
        }),
        expect.objectContaining({
          targetAssetId: 'asset-public-witness-rule',
          hasNarrativeBacking: false,
          narrativeBackingStatusLabel: 'Missing narrative backing',
        }),
      ]),
    )
    expect(merged.dockSummary).toMatchObject({
      mentionsWithoutCanonBackingCount: 1,
      mentionsWithMissingSceneTraceCount: 0,
      relationsWithoutNarrativeBackingCount: 1,
    })
    expect(merged.dockSummary.problemItems).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'relations-without-narrative-backing' })]),
    )
  })

  it('keeps stable badges but marks traceability loading as non-judgmental output', () => {
    const merged = mergeAssetTraceabilityIntoWorkspace({
      workspace,
      traceability: {
        summary: null,
        isLoading: true,
        error: null,
      },
      locale: 'en',
    })

    expect(merged.mentions[0].traceDetail).toBeUndefined()
    expect(merged.mentions[0].traceDetailStatus).toMatchObject({
      state: 'loading',
      title: 'Loading trace detail',
    })
    expect(merged.inspector.traceabilityStatus).toMatchObject({
      state: 'loading',
      title: 'Loading traceability',
    })
    expect(merged.inspector.canonBackedMentionCount).toBeUndefined()
    expect(merged.dockSummary.traceabilityStatus).toMatchObject({
      state: 'loading',
      title: 'Loading traceability',
    })
    expect(merged.dockSummary.mentionsWithoutCanonBackingCount).toBeUndefined()
    expect(merged.dockSummary.problemItems).toEqual(workspace.dockSummary.problemItems)
  })
})
