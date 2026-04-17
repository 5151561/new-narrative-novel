import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { useSceneTraceabilityQuery } from './useSceneTraceabilityQuery'

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

describe('useSceneTraceabilityQuery', () => {
  it('combines scene prose origin, latest patch, and related assets from existing scene payloads', async () => {
    const hook = renderHook(() => useSceneTraceabilityQuery('scene-midnight-platform'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.trace).not.toBeNull()
    expect(hook.result.current.trace?.proseOrigin).toMatchObject({
      sourcePatchId: 'patch-1',
      latestDiffSummary: 'No prose revision requested yet.',
    })
    expect(hook.result.current.trace?.latestPatch).toMatchObject({
      patchId: 'patch-1',
      label: 'Visible stalemate summary',
    })
    expect(hook.result.current.trace?.relatedAssets.map((asset) => asset.assetId)).toEqual(
      expect.arrayContaining(['asset-ren-voss', 'asset-ledger-stays-shut']),
    )
    expect(hook.result.current.trace?.sourceProposals).toEqual(
      expect.arrayContaining([expect.objectContaining({ proposalId: 'proposal-1' })]),
    )
  })

  it('does not publish a partial trace model while required scene sources are still loading', async () => {
    let resolveProse: ((value: Awaited<ReturnType<SceneClient['getSceneProse']>>) => void) | undefined
    const prosePromise = new Promise<Awaited<ReturnType<SceneClient['getSceneProse']>>>((resolve) => {
      resolveProse = resolve
    })
    const client: Pick<SceneClient, 'getSceneExecution' | 'getSceneProse' | 'getSceneInspector' | 'previewAcceptedPatch'> = {
      async getSceneExecution() {
        return {
          runId: 'run-1',
          objective: { goal: 'Goal', warningsCount: 0, unresolvedCount: 0, cast: [], constraintSummary: [] },
          beats: [],
          proposals: [{ id: 'proposal-1', actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' }, kind: 'dialogue', title: 'Loaded proposal', summary: 'Loaded proposal', status: 'accepted', impactTags: [], affects: [] }],
          acceptedSummary: {
            sceneSummary: 'Summary',
            acceptedFacts: [{ id: 'fact-1', label: 'Fact 1', value: 'Value 1', sourceProposals: [{ proposalId: 'proposal-1' }], relatedAssets: [] }],
            readiness: 'draftable',
            pendingProposalCount: 0,
            warningCount: 0,
            patchCandidateCount: 1,
          },
          runtimeSummary: { runHealth: 'stable', latencyLabel: '', tokenLabel: '', costLabel: '' },
          canContinueRun: false,
          canOpenProse: true,
        }
      },
      async getSceneProse() {
        return prosePromise
      },
      async getSceneInspector() {
        return {
          context: { acceptedFacts: [], privateInfoGuard: { summary: '', items: [] }, actorKnowledgeBoundaries: [], localState: [], overrides: [] },
          versions: { checkpoints: [], acceptanceTimeline: [], patchCandidates: [] },
          runtime: { profile: { label: '', summary: '' }, runHealth: 'stable', metrics: { latencyLabel: '', tokenLabel: '', costLabel: '' } },
        }
      },
      async previewAcceptedPatch() {
        return { patchId: 'patch-1', label: 'Patch', summary: 'Patch', status: 'ready_for_commit', sceneSummary: 'Summary', acceptedFacts: [], changes: [] }
      },
    }

    const hook = renderHook(() => useSceneTraceabilityQuery('scene-partial', client), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(true)
    })

    expect(hook.result.current.trace).toBeNull()

    await act(async () => {
      resolveProse?.({
        sceneId: 'scene-partial',
        proseDraft: 'Resolved draft.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Resolved diff.',
        warningsCount: 0,
        focusModeAvailable: true,
        traceSummary: {
          acceptedFactIds: ['fact-1'],
        },
      })
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.trace).toMatchObject({
      sceneId: 'scene-partial',
      proseOrigin: expect.objectContaining({
        acceptedFactIds: ['fact-1'],
      }),
    })
  })
})
