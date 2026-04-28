import { useMemo } from 'react'

import { useQueries } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import { type ChapterClient, type GetChapterStructureWorkspaceInput } from '../api/chapter-client'
import type {
  ChapterDraftDockSummaryItem,
  ChapterDraftDockSummaryViewModel,
  ChapterDraftSceneViewModel,
  ChapterDraftWorkspaceViewModel,
} from '../types/chapter-draft-view-models'
import type { ChapterStructureWorkspaceViewModel } from '../types/chapter-view-models'
import { useChapterStructureWorkspaceQuery } from './useChapterStructureWorkspaceQuery'

interface UseChapterDraftWorkspaceQueryInput extends GetChapterStructureWorkspaceInput {
  selectedSceneId?: string | null
}

interface ChapterDraftWorkspaceQueryDeps {
  chapterClient?: Pick<ChapterClient, 'getChapterStructureWorkspace'>
  sceneClient?: Pick<SceneClient, 'getSceneProse'>
}

interface ChapterDraftSceneProseState {
  prose?: SceneProseViewModel
  isLoading: boolean
  error: Error | null
}

export type { ChapterDraftSceneProseState }

function deriveWordCount(proseDraft?: string, draftWordCount?: number) {
  if (draftWordCount !== undefined) {
    return draftWordCount
  }

  const trimmed = proseDraft?.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.split(/\s+/).length
}

function buildQueueDetail(locale: 'en' | 'zh-CN', count: number) {
  return locale === 'zh-CN' ? `待处理修订 ${count}` : `${count} queued ${count === 1 ? 'revision' : 'revisions'}`
}

function buildDockItem(
  scene: ChapterDraftSceneViewModel,
  detail: string | undefined,
): ChapterDraftDockSummaryItem {
  return {
    sceneId: scene.sceneId,
    title: scene.title,
    detail: detail ?? scene.summary,
  }
}

function getLoadingDraftLabel(locale: 'en' | 'zh-CN') {
  return locale === 'zh-CN' ? '正在加载草稿' : 'Loading draft'
}

function getUnavailableDraftLabel(locale: 'en' | 'zh-CN') {
  return locale === 'zh-CN' ? '草稿不可用' : 'Draft unavailable'
}

function getMissingDraftDetail(locale: 'en' | 'zh-CN') {
  return locale === 'zh-CN' ? '当前场景还没有装配进章节手稿的正文。' : 'No chapter manuscript draft has been assembled for this scene yet.'
}

function buildWorkspaceModel(
  workspace: ChapterStructureWorkspaceViewModel | null | undefined,
  proseStateBySceneId: Record<string, ChapterDraftSceneProseState>,
  locale: 'en' | 'zh-CN',
): ChapterDraftWorkspaceViewModel | null | undefined {
  if (workspace === undefined) {
    return undefined
  }

  if (workspace === null) {
    return null
  }

  const scenes = workspace.scenes.map<ChapterDraftSceneViewModel>((scene) => {
    const proseState = proseStateBySceneId[scene.id]
    const prose = proseState?.prose
    const draftWordCount = deriveWordCount(prose?.proseDraft, prose?.draftWordCount)
    const isMissingDraft = prose ? !(prose.proseDraft && prose.proseDraft.trim().length > 0) : false
    const proseStatusLabel = prose
      ? prose.statusLabel ?? scene.proseStatusLabel
      : proseState?.error
        ? getUnavailableDraftLabel(locale)
        : proseState?.isLoading
          ? getLoadingDraftLabel(locale)
          : scene.proseStatusLabel
    const latestDiffSummary = prose
      ? prose.latestDiffSummary ?? (isMissingDraft ? getMissingDraftDetail(locale) : undefined)
      : proseState?.error
        ? proseState.error.message
        : undefined

    return {
      sceneId: scene.id,
      order: scene.order,
      title: scene.title,
      summary: scene.summary,
      proseDraft: prose?.proseDraft,
      draftWordCount,
      backlogStatus: scene.backlogStatus,
      backlogStatusLabel: scene.backlogStatusLabel,
      proseStatusLabel,
      sceneStatusLabel: scene.statusLabel,
      runStatusLabel: scene.runStatusLabel,
      latestDiffSummary,
      revisionQueueCount: prose?.revisionQueueCount,
      warningsCount: prose?.warningsCount ?? 0,
      isMissingDraft,
    }
  })

  const selectedScene = scenes.find((scene) => scene.sceneId === workspace.selectedSceneId) ?? scenes[0] ?? null
  const draftedSceneCount = scenes.filter((scene) => !scene.isMissingDraft).length
  const missingDraftCount = scenes.filter((scene) => scene.isMissingDraft).length
  const assembledWordCount = scenes.reduce((total, scene) => total + (scene.draftWordCount ?? 0), 0)
  const warningsCount = scenes.reduce((total, scene) => total + scene.warningsCount, 0)
  const queuedRevisionCount = scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0)

  const dockSummary: ChapterDraftDockSummaryViewModel = {
    missingDraftCount,
    warningsCount,
    queuedRevisionCount,
    waitingReviewCount: scenes.filter((scene) => scene.backlogStatus === 'needs_review').length,
    runnableScene: (() => {
      const runnableScene = scenes.find((scene) => scene.backlogStatus === 'planned')
      return runnableScene ? buildDockItem(runnableScene, runnableScene.summary) : undefined
    })(),
    missingDraftScenes: scenes
      .filter((scene) => scene.isMissingDraft)
      .map((scene) => buildDockItem(scene, scene.latestDiffSummary)),
    warningScenes: scenes
      .filter((scene) => scene.warningsCount > 0)
      .map((scene) => buildDockItem(scene, scene.latestDiffSummary)),
    queuedRevisionScenes: scenes
      .filter((scene) => (scene.revisionQueueCount ?? 0) > 0)
      .map((scene) => buildDockItem(scene, buildQueueDetail(locale, scene.revisionQueueCount ?? 0))),
    waitingReviewScenes: scenes
      .filter((scene) => scene.backlogStatus === 'needs_review')
      .map((scene) => buildDockItem(scene, scene.runStatusLabel)),
  }

  return {
    chapterId: workspace.chapterId,
    title: workspace.title,
    summary: workspace.summary,
    selectedSceneId: selectedScene?.sceneId ?? null,
    scenes,
    assembledWordCount,
    draftedSceneCount,
    missingDraftCount,
    selectedScene,
    inspector: {
      selectedScene: selectedScene
        ? {
            sceneId: selectedScene.sceneId,
            title: selectedScene.title,
            summary: selectedScene.summary,
            proseStatusLabel: selectedScene.proseStatusLabel,
            draftWordCount: selectedScene.draftWordCount,
            revisionQueueCount: selectedScene.revisionQueueCount,
            warningsCount: selectedScene.warningsCount,
            latestDiffSummary: selectedScene.latestDiffSummary,
          }
        : null,
      chapterReadiness: {
        draftedSceneCount,
        missingDraftCount,
        assembledWordCount,
        warningsCount,
        queuedRevisionCount,
      },
    },
    dockSummary,
  }
}

export function useChapterDraftWorkspaceQuery(
  { chapterId, selectedSceneId }: UseChapterDraftWorkspaceQueryInput,
  { chapterClient: customChapterClient, sceneClient: customSceneClient }: ChapterDraftWorkspaceQueryDeps = {},
) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveChapterClient = resolveProjectRuntimeDependency(
    customChapterClient,
    runtime?.chapterClient,
    'useChapterDraftWorkspaceQuery',
    'deps.chapterClient',
  )
  const effectiveSceneClient = resolveProjectRuntimeDependency(
    customSceneClient,
    runtime?.sceneClient,
    'useChapterDraftWorkspaceQuery',
    'deps.sceneClient',
  )
  const chapterWorkspaceQuery = useChapterStructureWorkspaceQuery(
    { chapterId, selectedSceneId },
    effectiveChapterClient,
  )
  const orderedScenes = chapterWorkspaceQuery.workspace?.scenes ?? []
  const proseQueries = useQueries({
    queries: orderedScenes.map((scene) => ({
      queryKey: sceneQueryKeys.prose(scene.id, locale),
      queryFn: () => effectiveSceneClient.getSceneProse(scene.id),
    })),
  })
  const proseStateBySceneId = useMemo(
    () =>
      Object.fromEntries(
        orderedScenes.map((scene, index) => {
          const query = proseQueries[index]

          return [
            scene.id,
            {
              prose: query?.data,
              isLoading: query?.isLoading ?? false,
              error: query?.error instanceof Error ? query.error : null,
            } satisfies ChapterDraftSceneProseState,
          ]
        }),
      ),
    [orderedScenes, proseQueries],
  )
  const workspace = useMemo(
    () => buildWorkspaceModel(chapterWorkspaceQuery.workspace, proseStateBySceneId, locale),
    [chapterWorkspaceQuery.workspace, locale, proseStateBySceneId],
  )

  return {
    workspace,
    sceneProseStateBySceneId: proseStateBySceneId,
    isLoading: chapterWorkspaceQuery.isLoading,
    error: chapterWorkspaceQuery.error,
    refetch: async () => {
      await chapterWorkspaceQuery.refetch()
      await Promise.all(proseQueries.map((query) => query.refetch()))
    },
  }
}
