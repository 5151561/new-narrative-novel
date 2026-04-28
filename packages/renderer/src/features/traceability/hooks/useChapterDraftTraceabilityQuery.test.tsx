import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import type { ChapterDraftAssemblyRecord } from '@/features/chapter/api/chapter-draft-assembly-records'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { useChapterDraftTraceabilityQuery } from './useChapterDraftTraceabilityQuery'

function createWrapper(runtime = createMockProjectRuntime({
  persistence: {
    async loadProjectSnapshot() {
      return null
    },
    async saveProjectSnapshot() {},
    async clearProjectSnapshot() {},
  },
})) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('useChapterDraftTraceabilityQuery', () => {
  it('keeps traceability aligned to live chapter assembly scene ids and selected scene without inventing transition reads', async () => {
    const liveAssembly: ChapterDraftAssemblyRecord = {
      chapterId: 'chapter-signals-in-rain',
      title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
      summary: { en: 'Live assembly', 'zh-CN': '实时装配' },
      sceneCount: 2,
      draftedSceneCount: 1,
      missingDraftCount: 1,
      assembledWordCount: 4,
      warningsCount: 0,
      queuedRevisionCount: 0,
      tracedSceneCount: 1,
      missingTraceSceneCount: 1,
      scenes: [
        {
          kind: 'scene-draft',
          sceneId: 'scene-midnight-platform',
          order: 1,
          title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
          summary: { en: 'Drafted opener', 'zh-CN': '已成稿开场' },
          backlogStatus: 'drafted',
          proseStatusLabel: { en: 'Generated', 'zh-CN': '已生成' },
          proseDraft: 'Live draft prose.',
          warningsCount: 0,
          traceReady: true,
          traceRollup: {
            acceptedFactCount: 1,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
            missingLinks: [],
          },
          sourceProposals: [],
          acceptedFactIds: ['fact-1'],
          relatedAssets: [],
        },
        {
          kind: 'scene-gap',
          sceneId: 'scene-concourse-delay',
          order: 2,
          title: { en: 'Concourse Delay', 'zh-CN': '大厅延误' },
          summary: { en: 'Gap scene', 'zh-CN': '缺稿场景' },
          backlogStatus: 'planned',
          proseStatusLabel: { en: 'Waiting for prose artifact', 'zh-CN': '等待正文产物' },
          warningsCount: 0,
          traceReady: false,
          traceRollup: {
            acceptedFactCount: 0,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
            missingLinks: ['trace'],
          },
          gapReason: { en: 'Gap stays explicit.', 'zh-CN': '缺口保持显式。' },
        },
      ],
      sections: [
        {
          kind: 'scene-draft',
          sceneId: 'scene-midnight-platform',
          order: 1,
          title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
          summary: { en: 'Drafted opener', 'zh-CN': '已成稿开场' },
          backlogStatus: 'drafted',
          proseStatusLabel: { en: 'Generated', 'zh-CN': '已生成' },
          proseDraft: 'Live draft prose.',
          warningsCount: 0,
          traceReady: true,
          traceRollup: {
            acceptedFactCount: 1,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
            missingLinks: [],
          },
          sourceProposals: [],
          acceptedFactIds: ['fact-1'],
          relatedAssets: [],
        },
        {
          kind: 'transition-gap',
          fromSceneId: 'scene-midnight-platform',
          toSceneId: 'scene-concourse-delay',
          fromSceneTitle: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
          toSceneTitle: { en: 'Concourse Delay', 'zh-CN': '大厅延误' },
          gapReason: { en: 'No artifact-backed transition draft.', 'zh-CN': '没有带产物引用的过渡草稿。' },
        },
        {
          kind: 'scene-gap',
          sceneId: 'scene-concourse-delay',
          order: 2,
          title: { en: 'Concourse Delay', 'zh-CN': '大厅延误' },
          summary: { en: 'Gap scene', 'zh-CN': '缺稿场景' },
          backlogStatus: 'planned',
          proseStatusLabel: { en: 'Waiting for prose artifact', 'zh-CN': '等待正文产物' },
          warningsCount: 0,
          traceReady: false,
          traceRollup: {
            acceptedFactCount: 0,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
            missingLinks: ['trace'],
          },
          gapReason: { en: 'Gap stays explicit.', 'zh-CN': '缺口保持显式。' },
        },
      ],
    }

    const chapterClient: Pick<ChapterClient, 'getChapterDraftAssembly'> = {
      getChapterDraftAssembly: vi.fn(async () => structuredClone(liveAssembly)),
    }
    const sceneClient: Pick<SceneClient, 'getSceneExecution' | 'getSceneProse' | 'getSceneInspector' | 'previewAcceptedPatch'> = {
      getSceneExecution: vi.fn(async (sceneId) => ({
        runId: `run-${sceneId}`,
        objective: { goal: 'Goal', warningsCount: 0, unresolvedCount: 0, cast: [], constraintSummary: [] },
        beats: [],
        proposals: [],
        acceptedSummary: { sceneSummary: 'Summary', acceptedFacts: [], readiness: 'draftable', pendingProposalCount: 0, warningCount: 0, patchCandidateCount: 0 },
        runtimeSummary: { runHealth: 'stable', latencyLabel: '', tokenLabel: '', costLabel: '' },
        canContinueRun: false,
        canOpenProse: true,
      })),
      getSceneProse: vi.fn(async (sceneId) => ({
        sceneId,
        proseDraft: sceneId === 'scene-midnight-platform' ? 'Live draft prose.' : undefined,
        revisionModes: ['rewrite'],
        warningsCount: 0,
        focusModeAvailable: true,
        traceSummary: sceneId === 'scene-midnight-platform' ? { acceptedFactIds: ['fact-1'] } : undefined,
      })),
      getSceneInspector: vi.fn(async () => ({
        context: { acceptedFacts: [], privateInfoGuard: { summary: '', items: [] }, actorKnowledgeBoundaries: [], localState: [], overrides: [] },
        versions: { checkpoints: [], acceptanceTimeline: [], patchCandidates: [] },
        runtime: { profile: { label: '', summary: '' }, runHealth: 'stable', metrics: { latencyLabel: '', tokenLabel: '', costLabel: '' } },
      })),
      previewAcceptedPatch: vi.fn(async () => null),
    }

    const hook = renderHook(
      () =>
        useChapterDraftTraceabilityQuery(
          {
            chapterId: 'chapter-signals-in-rain',
            selectedSceneId: 'scene-concourse-delay',
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

    expect(hook.result.current.traceability?.selectedSceneId).toBe('scene-concourse-delay')
    expect(sceneClient.getSceneExecution).toHaveBeenCalledTimes(2)
    expect(sceneClient.getSceneExecution).toHaveBeenCalledWith('scene-midnight-platform')
    expect(sceneClient.getSceneExecution).toHaveBeenCalledWith('scene-concourse-delay')
    expect(sceneClient.getSceneExecution).not.toHaveBeenCalledWith('scene-midnight-platform::scene-concourse-delay')
  })

  it('uses runtime-injected chapter and traceability scene clients when no overrides are provided', async () => {
    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      getChapterStructureWorkspace: vi.fn(async () => structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain'])),
    }
    const sceneClient: Pick<SceneClient, 'getSceneExecution' | 'getSceneProse' | 'getSceneInspector' | 'previewAcceptedPatch'> = {
      getSceneExecution: vi.fn(async (sceneId) => ({
        runId: `run-${sceneId}`,
        objective: { goal: 'Goal', warningsCount: 0, unresolvedCount: 0, cast: [], constraintSummary: [] },
        beats: [],
        proposals: [],
        acceptedSummary: { sceneSummary: 'Summary', acceptedFacts: [], readiness: 'draftable', pendingProposalCount: 0, warningCount: 0, patchCandidateCount: 0 },
        runtimeSummary: { runHealth: 'stable', latencyLabel: '', tokenLabel: '', costLabel: '' },
        canContinueRun: false,
        canOpenProse: true,
      })),
      getSceneProse: vi.fn(async (sceneId) => ({
        sceneId,
        proseDraft: `${sceneId} draft`,
        revisionModes: ['rewrite'],
        latestDiffSummary: `${sceneId} diff`,
        warningsCount: 0,
        focusModeAvailable: true,
      })),
      getSceneInspector: vi.fn(async () => ({
        context: { acceptedFacts: [], privateInfoGuard: { summary: '', items: [] }, actorKnowledgeBoundaries: [], localState: [], overrides: [] },
        versions: { checkpoints: [], acceptanceTimeline: [], patchCandidates: [] },
        runtime: { profile: { label: '', summary: '' }, runHealth: 'stable', metrics: { latencyLabel: '', tokenLabel: '', costLabel: '' } },
      })),
      previewAcceptedPatch: vi.fn(async () => null),
    }

    const hook = renderHook(
      () =>
        useChapterDraftTraceabilityQuery({
          chapterId: 'chapter-signals-in-rain',
          selectedSceneId: null,
        }),
      {
        wrapper: createWrapper(createMockProjectRuntime({
          chapterClient: chapterClient as ChapterClient,
          traceabilitySceneClient: sceneClient,
          persistence: {
            async loadProjectSnapshot() {
              return null
            },
            async saveProjectSnapshot() {},
            async clearProjectSnapshot() {},
          },
        })),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(chapterClient.getChapterStructureWorkspace).toHaveBeenCalled()
    expect(sceneClient.getSceneExecution).toHaveBeenCalled()
    expect(sceneClient.getSceneInspector).toHaveBeenCalled()
    expect(sceneClient.previewAcceptedPatch).toHaveBeenCalled()
    expect(hook.result.current.traceability?.selectedSceneId).toBe('scene-midnight-platform')
  })

  it('falls back selectedSceneId to the first chapter section and returns chapter-draft-facing summaries plus trace coverage', async () => {
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
    expect(hook.result.current.traceability?.sceneSummariesBySceneId['scene-midnight-platform']).toMatchObject({
      sceneId: 'scene-midnight-platform',
      status: 'ready',
      sourceFactCount: 2,
      relatedAssetCount: 4,
    })
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
    expect(hook.result.current).not.toHaveProperty('sceneTraceBySceneId')
    expect(hook.result.current).not.toHaveProperty('sceneStateBySceneId')
  })

  it('keeps selected scene summaries and selected scene details available even when chapter coverage is still incomplete', async () => {
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
            selectedSceneId: 'scene-concourse-delay',
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.traceability?.sceneSummariesBySceneId['scene-concourse-delay']).toMatchObject({
        sceneId: 'scene-concourse-delay',
        status: 'ready',
        sourceFactCount: 1,
        relatedAssetCount: 1,
      })
    })
    expect(hook.result.current.traceability?.selectedSceneTrace).toMatchObject({
      sceneId: 'scene-concourse-delay',
      sourceProposalCount: 1,
      latestDiffSummary: 'scene-concourse-delay diff',
    })
    expect(hook.result.current.traceability?.chapterCoverage).toBeNull()
    expect(hook.result.current.selectedSceneTraceLoading).toBe(false)
    expect(hook.result.current.chapterCoverageLoading).toBe(true)

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
