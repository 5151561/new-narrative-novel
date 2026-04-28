import { describe, expect, it } from 'vitest'

import { getMockAssetKnowledgeWorkspace } from '@/features/asset/api/mock-asset-db'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import { createSceneMockDatabase } from '@/mock/scene-fixtures'

import {
  buildAssetTraceabilitySummaryViewModel,
  buildChapterDraftTraceabilityViewModel,
  buildSceneTraceabilityViewModel,
} from './traceability-mappers'

describe('traceability mappers', () => {
  it('maps scene prose origin, latest patch, source proposals, and related assets into one traceability view-model', () => {
    const database = createSceneMockDatabase()
    const scene = database.scenes['scene-midnight-platform']
    const patchPreview = {
      patchId: 'patch-1',
      label: 'Visible stalemate summary',
      summary: 'Semantic patch ready if the bargain stalemate is accepted into canon.',
      status: 'ready_for_commit' as const,
      sceneSummary: scene.execution.acceptedSummary.sceneSummary,
      acceptedFacts: structuredClone(scene.execution.acceptedSummary.acceptedFacts),
      changes: structuredClone(scene.execution.acceptedSummary.acceptedFacts).map((fact) => ({
        id: `change-${fact.id}`,
        label: fact.label,
        detail: fact.value,
        sourceProposals: fact.sourceProposals,
        relatedAssets: fact.relatedAssets,
      })),
    }

    const trace = buildSceneTraceabilityViewModel({
      sceneId: 'scene-midnight-platform',
      execution: scene.execution,
      prose: scene.prose,
      inspector: scene.inspector,
      patchPreview,
    })

    expect(trace.acceptedFacts[0]).toMatchObject({
      id: 'fact-1',
      sourceProposals: [expect.objectContaining({ proposalId: 'proposal-1', sourceTraceId: 'trace-41' })],
      relatedAssets: expect.arrayContaining([expect.objectContaining({ assetId: 'asset-ren-voss' })]),
    })
    expect(trace.latestPatch).toMatchObject({
      patchId: 'patch-1',
      changes: expect.arrayContaining([
        expect.objectContaining({
          id: 'change-fact-1',
          sourceProposals: [expect.objectContaining({ proposalId: 'proposal-1' })],
        }),
      ]),
    })
    expect(trace.proseOrigin).toMatchObject({
      sourcePatchId: 'patch-1',
      acceptedFactIds: ['fact-1', 'fact-2'],
      sourceProposals: expect.arrayContaining([
        expect.objectContaining({ proposalId: 'proposal-1' }),
        expect.objectContaining({ proposalId: 'proposal-2' }),
      ]),
      relatedAssets: expect.arrayContaining([
        expect.objectContaining({ assetId: 'asset-ren-voss' }),
        expect.objectContaining({ assetId: 'asset-ledger-stays-shut' }),
      ]),
    })
    expect(trace.relatedAssets.map((asset) => asset.assetId)).toEqual(
      expect.arrayContaining(['asset-ren-voss', 'asset-mei-arden', 'asset-midnight-platform', 'asset-ledger-stays-shut']),
    )
  })

  it('classifies asset mention backing as canon, draft-context, and unlinked while aggregating fact and proposal labels', () => {
    const database = createSceneMockDatabase()
    const renWorkspace = getMockAssetKnowledgeWorkspace('asset-ren-voss')
    if (!renWorkspace) {
      throw new Error('Expected asset-ren-voss workspace fixture')
    }

    const traceBySceneId = {
      'scene-midnight-platform': buildSceneTraceabilityViewModel({
        sceneId: 'scene-midnight-platform',
        execution: database.scenes['scene-midnight-platform'].execution,
        prose: database.scenes['scene-midnight-platform'].prose,
        inspector: database.scenes['scene-midnight-platform'].inspector,
        patchPreview: {
          patchId: 'patch-1',
          label: 'Visible stalemate summary',
          summary: 'Semantic patch ready if the bargain stalemate is accepted into canon.',
          status: 'ready_for_commit',
          sceneSummary: database.scenes['scene-midnight-platform'].execution.acceptedSummary.sceneSummary,
          acceptedFacts: structuredClone(database.scenes['scene-midnight-platform'].execution.acceptedSummary.acceptedFacts),
          changes: structuredClone(database.scenes['scene-midnight-platform'].execution.acceptedSummary.acceptedFacts).map((fact) => ({
            id: `change-${fact.id}`,
            label: fact.label,
            detail: fact.value,
            sourceProposals: fact.sourceProposals,
            relatedAssets: fact.relatedAssets,
          })),
        },
      }),
      'scene-ticket-window': buildSceneTraceabilityViewModel({
        sceneId: 'scene-ticket-window',
        execution: database.scenes['scene-ticket-window'].execution,
        prose: database.scenes['scene-ticket-window'].prose,
        inspector: database.scenes['scene-ticket-window'].inspector,
        patchPreview: null,
      }),
    }

    const summary = buildAssetTraceabilitySummaryViewModel({
      assetId: 'asset-ren-voss',
      mentions: renWorkspace.assets.find((asset) => asset.id === 'asset-ren-voss')?.mentions ?? [],
      relationTargetAssetIds:
        renWorkspace.assets.find((asset) => asset.id === 'asset-ren-voss')?.relations.map((relation) => relation.targetAssetId) ?? [],
      sceneTraceBySceneId: traceBySceneId,
      getMentionTitle: (mention) => mention.targetLabel.en,
    })

    expect(summary).toMatchObject({
      canonBackedMentions: 1,
      draftContextMentions: 1,
      unlinkedMentions: 1,
      mentionsWithMissingSceneTrace: 1,
      relationsWithoutNarrativeBackingCount: 0,
      relationTargetAssetIdsWithNarrativeBacking: expect.arrayContaining(['asset-mei-arden']),
      relationTargetAssetIdsWithoutNarrativeBacking: [],
    })
    expect(summary.mentionSummaries).toEqual([
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
        mentionId: 'mention-ren-ticket-window',
        title: 'Ticket Window',
        backingKind: 'draft_context',
        factLabels: [],
        proposalTitles: ['Force the trade-off into one visible exchange'],
        patchId: undefined,
        sceneId: 'scene-ticket-window',
        sceneTraceMissing: false,
      },
      {
        mentionId: 'mention-ren-signals-in-rain',
        title: 'Signals in Rain',
        backingKind: 'unlinked',
        factLabels: [],
        proposalTitles: [],
        patchId: undefined,
        sceneId: undefined,
        sceneTraceMissing: true,
      },
    ])
  })

  it('limits patch-derived provenance to the mention-linked proposal and accepted fact set', () => {
    const summary = buildAssetTraceabilitySummaryViewModel({
      assetId: 'asset-test',
      mentions: [
        {
          id: 'mention-1',
          targetScope: 'scene' as const,
          sceneId: 'scene-1',
          backing: {
            kind: 'canon' as const,
            sceneId: 'scene-1',
            patchId: 'patch-1',
            proposalIds: ['proposal-1'],
            acceptedFactIds: ['fact-2'],
          },
        },
      ],
      relationTargetAssetIds: ['asset-1'],
      sceneTraceBySceneId: {
        'scene-1': {
          sceneId: 'scene-1',
          acceptedFacts: [
            {
              id: 'fact-1',
              label: 'Fact 1',
              value: 'Value 1',
              sourceProposals: [{ proposalId: 'proposal-3', title: 'Unrelated patch proposal' }],
              relatedAssets: [],
            },
            {
              id: 'fact-2',
              label: 'Fact 2',
              value: 'Value 2',
              sourceProposals: [{ proposalId: 'proposal-2', title: 'Accepted fact proposal' }],
              relatedAssets: [],
            },
          ],
          latestPatch: {
            patchId: 'patch-1',
            label: 'Patch 1',
            summary: 'Patch summary',
            status: 'ready_for_commit',
            changes: [],
            sourceProposals: [
              { proposalId: 'proposal-1', title: 'Direct mention proposal' },
              { proposalId: 'proposal-2', title: 'Accepted fact proposal' },
              { proposalId: 'proposal-3', title: 'Unrelated patch proposal' },
            ],
            relatedAssets: [],
          },
          proseOrigin: null,
          sourceProposals: [
            { proposalId: 'proposal-1', title: 'Direct mention proposal' },
            { proposalId: 'proposal-2', title: 'Accepted fact proposal' },
            { proposalId: 'proposal-3', title: 'Unrelated patch proposal' },
          ],
          relatedAssets: [],
          missingLinks: [],
        },
      },
      getMentionTitle: () => 'Mention 1',
    })

    expect(summary.mentionSummaries).toEqual([
      {
        mentionId: 'mention-1',
        title: 'Mention 1',
        backingKind: 'canon',
        factLabels: ['Fact 2'],
        proposalTitles: ['Direct mention proposal', 'Accepted fact proposal'],
        patchId: 'patch-1',
        sceneId: 'scene-1',
        sceneTraceMissing: false,
      },
    ])
  })

  it('counts chapter trace coverage and reports scenes that still miss trace data', () => {
    const chapter = mockChapterRecordSeeds['chapter-signals-in-rain']
    const traceBySceneId = {
      'scene-midnight-platform': buildSceneTraceabilityViewModel({
        sceneId: 'scene-midnight-platform',
        execution: createSceneMockDatabase().scenes['scene-midnight-platform'].execution,
        prose: createSceneMockDatabase().scenes['scene-midnight-platform'].prose,
        inspector: createSceneMockDatabase().scenes['scene-midnight-platform'].inspector,
        patchPreview: null,
      }),
      'scene-concourse-delay': buildSceneTraceabilityViewModel({
        sceneId: 'scene-concourse-delay',
        execution: createSceneMockDatabase().scenes['scene-concourse-delay'].execution,
        prose: createSceneMockDatabase().scenes['scene-concourse-delay'].prose,
        inspector: createSceneMockDatabase().scenes['scene-concourse-delay'].inspector,
        patchPreview: null,
      }),
      'scene-ticket-window': buildSceneTraceabilityViewModel({
        sceneId: 'scene-ticket-window',
        execution: createSceneMockDatabase().scenes['scene-ticket-window'].execution,
        prose: createSceneMockDatabase().scenes['scene-ticket-window'].prose,
        inspector: createSceneMockDatabase().scenes['scene-ticket-window'].inspector,
        patchPreview: null,
      }),
    }

    const model = buildChapterDraftTraceabilityViewModel({
      chapterId: chapter.chapterId,
      selectedSceneId: null,
      scenes: chapter.scenes.map((scene) => ({
        sceneId: scene.id,
        title: scene.title.en,
      })),
      sceneTraceBySceneId: traceBySceneId,
    })

    expect(model.selectedSceneId).toBe('scene-midnight-platform')
    expect(model.chapterCoverage).toMatchObject({
      tracedSceneCount: 3,
      missingTraceSceneCount: 1,
      sceneIdsMissingTrace: ['scene-departure-bell'],
    })
  })
})
