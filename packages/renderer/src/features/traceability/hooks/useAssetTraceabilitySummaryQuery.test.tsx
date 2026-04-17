import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { AssetClient } from '@/features/asset/api/asset-client'
import { getMockAssetKnowledgeWorkspace } from '@/features/asset/api/mock-asset-db'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { useAssetTraceabilitySummaryQuery } from './useAssetTraceabilitySummaryQuery'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>{children}</I18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('useAssetTraceabilitySummaryQuery', () => {
  it('aggregates mention backing kinds and proposal/fact summaries from scene traceability anchors', async () => {
    const hook = renderHook(() => useAssetTraceabilitySummaryQuery('asset-ren-voss'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.summary).toMatchObject({
      assetId: 'asset-ren-voss',
      canonBackedMentions: 1,
      draftContextMentions: 1,
      unlinkedMentions: 1,
    })
    expect(hook.result.current.summary?.mentionSummaries).toEqual([
      {
        mentionId: 'mention-ren-midnight-platform',
        title: 'Midnight Platform',
        backingKind: 'canon',
        factLabels: ['Courier signal spotted'],
        proposalTitles: ['Force the bargain into a visible stalemate'],
      },
      {
        mentionId: 'mention-ren-ticket-window',
        title: 'Ticket Window',
        backingKind: 'draft_context',
        factLabels: [],
        proposalTitles: ['Force the trade-off into one visible exchange'],
      },
      {
        mentionId: 'mention-ren-signals-in-rain',
        title: 'Signals in Rain',
        backingKind: 'unlinked',
        factLabels: [],
        proposalTitles: [],
      },
    ])
  })

  it('does not publish summary counts while scene traceability anchors are still incomplete', async () => {
    let resolveProse: ((value: Awaited<ReturnType<SceneClient['getSceneProse']>>) => void) | undefined
    const prosePromise = new Promise<Awaited<ReturnType<SceneClient['getSceneProse']>>>((resolve) => {
      resolveProse = resolve
    })
    const assetClient: Pick<AssetClient, 'getAssetKnowledgeWorkspace'> = {
      async getAssetKnowledgeWorkspace() {
        return structuredClone(getMockAssetKnowledgeWorkspace('asset-ren-voss'))
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneExecution' | 'getSceneProse' | 'getSceneInspector' | 'previewAcceptedPatch'> = {
      async getSceneExecution(sceneId) {
        return {
          runId: `run-${sceneId}`,
          objective: { goal: 'Goal', warningsCount: 0, unresolvedCount: 0, cast: [], constraintSummary: [] },
          beats: [],
          proposals: [{ id: 'proposal-1', actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' }, kind: 'dialogue', title: 'Proposal 1', summary: 'Proposal 1', status: 'accepted', impactTags: [], affects: [] }],
          acceptedSummary: { sceneSummary: 'Summary', acceptedFacts: [{ id: 'fact-1', label: 'Fact 1', value: 'Value 1', sourceProposals: [{ proposalId: 'proposal-1' }], relatedAssets: [] }], readiness: 'draftable', pendingProposalCount: 0, warningCount: 0, patchCandidateCount: 0 },
          runtimeSummary: { runHealth: 'stable', latencyLabel: '', tokenLabel: '', costLabel: '' },
          canContinueRun: false,
          canOpenProse: true,
        }
      },
      async getSceneProse(sceneId) {
        if (sceneId === 'scene-midnight-platform') {
          return prosePromise
        }

        return {
          sceneId,
          proseDraft: `${sceneId} draft`,
          revisionModes: ['rewrite'],
          latestDiffSummary: `${sceneId} diff`,
          warningsCount: 0,
          focusModeAvailable: true,
        }
      },
      async getSceneInspector() {
        return {
          context: { acceptedFacts: [], privateInfoGuard: { summary: '', items: [] }, actorKnowledgeBoundaries: [], localState: [], overrides: [] },
          versions: { checkpoints: [], acceptanceTimeline: [], patchCandidates: [] },
          runtime: { profile: { label: '', summary: '' }, runHealth: 'stable', metrics: { latencyLabel: '', tokenLabel: '', costLabel: '' } },
        }
      },
      async previewAcceptedPatch() {
        return null
      },
    }

    const hook = renderHook(
      () =>
        useAssetTraceabilitySummaryQuery('asset-ren-voss', {
          assetClient,
          sceneClient,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(true)
    })

    expect(hook.result.current.summary).toBeNull()

    await act(async () => {
      resolveProse?.({
        sceneId: 'scene-midnight-platform',
        proseDraft: 'resolved',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'resolved diff',
        warningsCount: 0,
        focusModeAvailable: true,
      })
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.summary?.canonBackedMentions).toBeGreaterThanOrEqual(0)
  })
})
