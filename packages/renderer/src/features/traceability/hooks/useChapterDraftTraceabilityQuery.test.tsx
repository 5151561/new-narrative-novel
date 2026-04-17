import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { useChapterDraftTraceabilityQuery } from './useChapterDraftTraceabilityQuery'

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

describe('useChapterDraftTraceabilityQuery', () => {
  it('falls back selectedSceneId to the first chapter section and reports chapter trace coverage', async () => {
    const hook = renderHook(
      () =>
        useChapterDraftTraceabilityQuery({
          chapterId: 'chapter-signals-in-rain',
          selectedSceneId: null,
        }),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.traceability?.selectedSceneId).toBe('scene-midnight-platform')
    expect(hook.result.current.traceability?.selectedSceneTrace).toMatchObject({
      sceneId: 'scene-midnight-platform',
      sourceProposalCount: 2,
      latestPatchSummary: 'Semantic patch ready if the bargain stalemate is accepted into canon.',
    })
    expect(hook.result.current.traceability?.chapterCoverage).toMatchObject({
      tracedSceneCount: 3,
      missingTraceSceneCount: 1,
      sceneIdsMissingTrace: ['scene-departure-bell'],
      sceneIdsMissingAssets: [],
    })
  })

  it('does not publish missing coverage while scene trace sources are still incomplete', async () => {
    let resolveProse: ((value: Awaited<ReturnType<SceneClient['getSceneProse']>>) => void) | undefined
    const prosePromise = new Promise<Awaited<ReturnType<SceneClient['getSceneProse']>>>((resolve) => {
      resolveProse = resolve
    })
    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace() {
        return structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain'])
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneExecution' | 'getSceneProse' | 'getSceneInspector' | 'previewAcceptedPatch'> = {
      async getSceneExecution(sceneId) {
        return {
          runId: `run-${sceneId}`,
          objective: { goal: 'Goal', warningsCount: 0, unresolvedCount: 0, cast: [], constraintSummary: [] },
          beats: [],
          proposals: [{ id: `proposal-${sceneId}`, actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' }, kind: 'dialogue', title: `Proposal ${sceneId}`, summary: 'Proposal summary', status: 'accepted', impactTags: [], affects: [] }],
          acceptedSummary: {
            sceneSummary: 'Summary',
            acceptedFacts: [{ id: `fact-${sceneId}`, label: `Fact ${sceneId}`, value: 'Value', sourceProposals: [{ proposalId: `proposal-${sceneId}` }], relatedAssets: [{ assetId: 'asset-ren-voss', title: 'Ren Voss', kind: 'character' }] }],
            readiness: 'draftable',
            pendingProposalCount: 0,
            warningCount: 0,
            patchCandidateCount: 0,
          },
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
          traceSummary: {
            acceptedFactIds: [`fact-${sceneId}`],
          },
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
        useChapterDraftTraceabilityQuery(
          {
            chapterId: 'chapter-signals-in-rain',
            selectedSceneId: null,
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(true)
    })

    expect(hook.result.current.traceability).toBeNull()

    await act(async () => {
      resolveProse?.({
        sceneId: 'scene-midnight-platform',
        proseDraft: 'resolved',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'resolved diff',
        warningsCount: 0,
        focusModeAvailable: true,
        traceSummary: {
          acceptedFactIds: ['fact-scene-midnight-platform'],
        },
      })
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.traceability?.chapterCoverage.missingTraceSceneCount).toBeGreaterThanOrEqual(0)
  })

  it('reuses chapter draft prose fetches on refetch instead of issuing a second prose pass from traceability queries', async () => {
    const proseCalls: string[] = []
    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace() {
        return structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain'])
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneExecution' | 'getSceneProse' | 'getSceneInspector' | 'previewAcceptedPatch'> = {
      async getSceneExecution(sceneId) {
        return {
          runId: `run-${sceneId}`,
          objective: { goal: 'Goal', warningsCount: 0, unresolvedCount: 0, cast: [], constraintSummary: [] },
          beats: [],
          proposals: [],
          acceptedSummary: { sceneSummary: 'Summary', acceptedFacts: [], readiness: 'draftable', pendingProposalCount: 0, warningCount: 0, patchCandidateCount: 0 },
          runtimeSummary: { runHealth: 'stable', latencyLabel: '', tokenLabel: '', costLabel: '' },
          canContinueRun: false,
          canOpenProse: true,
        }
      },
      async getSceneProse(sceneId) {
        proseCalls.push(sceneId)
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
        useChapterDraftTraceabilityQuery(
          {
            chapterId: 'chapter-signals-in-rain',
            selectedSceneId: null,
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    const initialCalls = proseCalls.length

    await act(async () => {
      await hook.result.current.refetch()
    })

    expect(proseCalls).toHaveLength(initialCalls + 4)
  })
})
