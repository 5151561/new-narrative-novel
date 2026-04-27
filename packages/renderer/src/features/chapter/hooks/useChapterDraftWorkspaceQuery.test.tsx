import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import type { ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import type { SceneClient } from '@/features/scene/api/scene-client'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import { useChapterDraftWorkspaceQuery } from './useChapterDraftWorkspaceQuery'

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
          <ProjectRuntimeProvider runtime={runtime}>
            {children}
          </ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('useChapterDraftWorkspaceQuery', () => {
  it('uses runtime-injected chapter and scene clients when no overrides are provided', async () => {
    const runtimeChapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      getChapterStructureWorkspace: vi.fn(async () => structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain'])),
    }
    const runtimeSceneClient: Pick<SceneClient, 'getSceneProse'> = {
      getSceneProse: vi.fn(async (sceneId: string) => ({
        sceneId,
        proseDraft: `${sceneId} draft`,
        revisionModes: ['rewrite'],
        latestDiffSummary: `${sceneId} diff`,
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 3,
        statusLabel: 'Ready',
      })),
    }

    const hook = renderHook(
      () =>
        useChapterDraftWorkspaceQuery({
          chapterId: 'chapter-signals-in-rain',
          selectedSceneId: null,
        }),
      {
        wrapper: createWrapper(createMockProjectRuntime({
          chapterClient: runtimeChapterClient as ChapterClient,
          sceneClient: runtimeSceneClient as SceneClient,
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

    expect(runtimeChapterClient.getChapterStructureWorkspace).toHaveBeenCalledWith({
      chapterId: 'chapter-signals-in-rain',
    })
    expect(runtimeSceneClient.getSceneProse).toHaveBeenCalled()
    expect(hook.result.current.workspace?.chapterId).toBe('chapter-signals-in-rain')
  })

  it('assembles scenes in chapter order, flags missing drafts, and falls back the selection to the first scene', async () => {
    const chapterRecord = structuredClone(
      mockChapterRecordSeeds['chapter-signals-in-rain'],
    ) as ChapterStructureWorkspaceRecord
    chapterRecord.scenes = [
      structuredClone(chapterRecord.scenes[2]!),
      structuredClone(chapterRecord.scenes[0]!),
      structuredClone(chapterRecord.scenes[1]!),
    ]

    const proseByScene: Record<string, SceneProseViewModel> = {
      'scene-midnight-platform': {
        sceneId: 'scene-midnight-platform',
        proseDraft: 'Rain held the platform in place while Ren refused to blink first.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'No prose revision requested yet.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 11,
        statusLabel: 'Ready for revision pass',
      },
      'scene-concourse-delay': {
        sceneId: 'scene-concourse-delay',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'First prose pass still missing.',
        warningsCount: 2,
        focusModeAvailable: true,
        revisionQueueCount: 1,
        statusLabel: 'Missing draft',
      },
      'scene-ticket-window': {
        sceneId: 'scene-ticket-window',
        proseDraft: 'The ticket stalled halfway out while Mei waited for a cleaner answer.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Tighten the visible cost before the clerk notices too much.',
        warningsCount: 1,
        focusModeAvailable: true,
        revisionQueueCount: 2,
        draftWordCount: 11,
        statusLabel: 'Ready for prose pass',
      },
    }

    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace() {
        return structuredClone(chapterRecord)
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneProse'> = {
      async getSceneProse(sceneId: string) {
        return structuredClone(proseByScene[sceneId]!)
      },
    }

    const hook = renderHook(
      () =>
        useChapterDraftWorkspaceQuery(
          {
            chapterId: 'chapter-signals-in-rain',
            selectedSceneId: null,
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      selectedSceneId: 'scene-midnight-platform',
      draftedSceneCount: 2,
      missingDraftCount: 1,
      assembledWordCount: 22,
      selectedScene: expect.objectContaining({
        sceneId: 'scene-midnight-platform',
        proseStatusLabel: 'Ready for revision pass',
        isMissingDraft: false,
      }),
      inspector: expect.objectContaining({
        selectedScene: expect.objectContaining({
          sceneId: 'scene-midnight-platform',
          draftWordCount: 11,
        }),
        chapterReadiness: expect.objectContaining({
          draftedSceneCount: 2,
          missingDraftCount: 1,
          assembledWordCount: 22,
          warningsCount: 3,
          queuedRevisionCount: 3,
        }),
      }),
      dockSummary: expect.objectContaining({
        missingDraftCount: 1,
        warningsCount: 3,
        queuedRevisionCount: 3,
      }),
    })

    expect(hook.result.current.workspace?.scenes.map((scene) => scene.sceneId)).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
    ])
    expect(hook.result.current.workspace?.scenes[1]).toMatchObject({
      sceneId: 'scene-concourse-delay',
      isMissingDraft: true,
      warningsCount: 2,
      revisionQueueCount: 1,
    })
    expect(hook.result.current.workspace?.scenes[1]?.latestDiffSummary).toBeTruthy()
  })

  it('surfaces accepted and accept-with-edit prose in chapter draft assembly while keeping canonical scene ids and explicit gaps', async () => {
    const chapterRecord = structuredClone(
      mockChapterRecordSeeds['chapter-signals-in-rain'],
    ) as ChapterStructureWorkspaceRecord
    chapterRecord.scenes = chapterRecord.scenes.slice(0, 3).map((scene) => structuredClone(scene))

    const proseByScene: Record<string, SceneProseViewModel> = {
      'scene-midnight-platform': {
        sceneId: 'scene-midnight-platform',
        proseDraft: 'Accepted platform prose now reflects the selected review variant.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Accepted review decision propagated the selected platform variant.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 9,
        statusLabel: 'Accepted variant propagated',
      },
      'scene-concourse-delay': {
        sceneId: 'scene-concourse-delay',
        proseDraft: 'Edited concourse prose keeps the witness pressure visible after acceptance.',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'Accept-with-edit preserved the revised witness handoff wording.',
        warningsCount: 1,
        focusModeAvailable: true,
        revisionQueueCount: 0,
        draftWordCount: 10,
        statusLabel: 'Accepted with edit',
      },
      'scene-ticket-window': {
        sceneId: 'scene-ticket-window',
        revisionModes: ['rewrite'],
        latestDiffSummary: 'No prose artifact has been materialized for this scene yet.',
        warningsCount: 0,
        focusModeAvailable: true,
        revisionQueueCount: 1,
        statusLabel: 'Waiting for prose artifact',
      },
    }

    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace() {
        return structuredClone(chapterRecord)
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneProse'> = {
      async getSceneProse(sceneId: string) {
        return structuredClone(proseByScene[sceneId]!)
      },
    }

    const hook = renderHook(
      () =>
        useChapterDraftWorkspaceQuery(
          {
            chapterId: 'chapter-signals-in-rain',
            selectedSceneId: 'scene-concourse-delay',
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      selectedSceneId: 'scene-concourse-delay',
      draftedSceneCount: 2,
      missingDraftCount: 1,
      assembledWordCount: 19,
      selectedScene: {
        sceneId: 'scene-concourse-delay',
        proseDraft: 'Edited concourse prose keeps the witness pressure visible after acceptance.',
        proseStatusLabel: 'Accepted with edit',
        latestDiffSummary: 'Accept-with-edit preserved the revised witness handoff wording.',
        isMissingDraft: false,
      },
      inspector: {
        selectedScene: {
          sceneId: 'scene-concourse-delay',
          draftWordCount: 10,
        },
        chapterReadiness: {
          draftedSceneCount: 2,
          missingDraftCount: 1,
          assembledWordCount: 19,
        },
      },
    })

    expect(hook.result.current.workspace?.scenes.map((scene) => scene.sceneId)).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
    ])
    expect(hook.result.current.workspace?.scenes[0]).toMatchObject({
      sceneId: 'scene-midnight-platform',
      proseDraft: 'Accepted platform prose now reflects the selected review variant.',
      proseStatusLabel: 'Accepted variant propagated',
      isMissingDraft: false,
    })
    expect(hook.result.current.workspace?.scenes[2]).toMatchObject({
      sceneId: 'scene-ticket-window',
      proseDraft: undefined,
      isMissingDraft: true,
      draftWordCount: undefined,
      latestDiffSummary: 'No prose artifact has been materialized for this scene yet.',
    })
  })

  it('keeps the chapter draft workspace available while one prose query is slow and another fails', async () => {
    let resolveSlowScene: ((value: SceneProseViewModel) => void) | undefined
    const slowScenePromise = new Promise<SceneProseViewModel>((resolve) => {
      resolveSlowScene = resolve
    })

    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace() {
        return structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain'])
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneProse'> = {
      async getSceneProse(sceneId: string) {
        if (sceneId === 'scene-midnight-platform') {
          return {
            sceneId,
            proseDraft: 'Rain held the platform in place while Ren refused to blink first.',
            revisionModes: ['rewrite'],
            latestDiffSummary: 'No prose revision requested yet.',
            warningsCount: 0,
            focusModeAvailable: true,
            revisionQueueCount: 0,
            draftWordCount: 11,
            statusLabel: 'Ready for revision pass',
          }
        }

        if (sceneId === 'scene-concourse-delay') {
          return slowScenePromise
        }

        throw new Error('Scene prose unavailable')
      },
    }

    const hook = renderHook(
      () =>
        useChapterDraftWorkspaceQuery(
          {
            chapterId: 'chapter-signals-in-rain',
            selectedSceneId: 'scene-concourse-delay',
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.workspace).not.toBeUndefined()
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.isLoading).toBe(false)
    expect(hook.result.current.workspace?.selectedSceneId).toBe('scene-concourse-delay')
    expect(hook.result.current.workspace?.scenes[0]).toMatchObject({
      sceneId: 'scene-midnight-platform',
      proseStatusLabel: 'Ready for revision pass',
      draftWordCount: 11,
    })
    expect(hook.result.current.workspace?.scenes[1]).toMatchObject({
      sceneId: 'scene-concourse-delay',
      proseStatusLabel: 'Loading draft',
      draftWordCount: undefined,
      isMissingDraft: false,
    })
    expect(hook.result.current.workspace?.scenes[2]).toMatchObject({
      sceneId: 'scene-ticket-window',
      proseStatusLabel: 'Draft unavailable',
      latestDiffSummary: 'Scene prose unavailable',
      isMissingDraft: false,
    })

    resolveSlowScene?.({
      sceneId: 'scene-concourse-delay',
      proseDraft: 'The concourse tightened by inches instead of steps.',
      revisionModes: ['rewrite'],
      latestDiffSummary: 'Carry the witness pressure forward without resolving courier ownership.',
      warningsCount: 1,
      focusModeAvailable: true,
      revisionQueueCount: 1,
      draftWordCount: 8,
      statusLabel: 'Draft handoff ready',
    })

    await waitFor(() => {
      expect(hook.result.current.workspace?.scenes[1]).toMatchObject({
        sceneId: 'scene-concourse-delay',
        proseStatusLabel: 'Draft handoff ready',
        draftWordCount: 8,
      })
    })
  })

  it('synthesizes an explicit manuscript gap reason when a scene is missing prose text without a readable diff summary', async () => {
    const chapterRecord = structuredClone(
      mockChapterRecordSeeds['chapter-signals-in-rain'],
    ) as ChapterStructureWorkspaceRecord
    chapterRecord.scenes = chapterRecord.scenes.slice(0, 2).map((scene) => structuredClone(scene))

    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace() {
        return structuredClone(chapterRecord)
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneProse'> = {
      async getSceneProse(sceneId: string) {
        if (sceneId === 'scene-midnight-platform') {
          return {
            sceneId,
            proseDraft: 'Accepted platform prose stays readable.',
            revisionModes: ['rewrite'],
            latestDiffSummary: 'Accepted review decision already propagated.',
            warningsCount: 0,
            focusModeAvailable: true,
            revisionQueueCount: 0,
            draftWordCount: 5,
            statusLabel: 'Accepted manuscript draft',
          }
        }

        return {
          sceneId,
          revisionModes: ['rewrite'],
          warningsCount: 0,
          focusModeAvailable: true,
          revisionQueueCount: 0,
          statusLabel: 'Waiting for prose artifact',
        }
      },
    }

    const hook = renderHook(
      () =>
        useChapterDraftWorkspaceQuery(
          {
            chapterId: 'chapter-signals-in-rain',
            selectedSceneId: 'scene-concourse-delay',
          },
          {
            chapterClient,
            sceneClient,
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace?.selectedScene).toMatchObject({
      sceneId: 'scene-concourse-delay',
      isMissingDraft: true,
      proseStatusLabel: 'Waiting for prose artifact',
    })
    expect(hook.result.current.workspace?.selectedScene?.latestDiffSummary).toBeTruthy()
    expect(
      hook.result.current.workspace?.dockSummary.missingDraftScenes.find((scene) => scene.sceneId === 'scene-concourse-delay')?.detail,
    ).toBeTruthy()
  })
})
