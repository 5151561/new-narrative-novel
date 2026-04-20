import { useMemo } from 'react'

import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import { useChapterDraftWorkspaceQuery } from '@/features/chapter/hooks/useChapterDraftWorkspaceQuery'

import { buildChapterDraftTraceabilityViewModel } from '../lib/traceability-mappers'
import { useTraceabilitySceneSources, type TraceabilitySceneClient } from './useTraceabilitySceneSources'

interface UseChapterDraftTraceabilityQueryInput {
  chapterId: string
  selectedSceneId?: string | null
}

interface ChapterDraftTraceabilityQueryDeps {
  chapterClient?: Pick<ChapterClient, 'getChapterStructureWorkspace'>
  sceneClient?: TraceabilitySceneClient
}

export function useChapterDraftTraceabilityQuery(
  { chapterId, selectedSceneId }: UseChapterDraftTraceabilityQueryInput,
  { chapterClient: customChapterClient, sceneClient }: ChapterDraftTraceabilityQueryDeps = {},
) {
  const chapterWorkspaceQuery = useChapterDraftWorkspaceQuery(
    { chapterId, selectedSceneId },
    {
      chapterClient: customChapterClient,
      sceneClient,
    },
  )
  const sceneIds = chapterWorkspaceQuery.workspace?.scenes.map((scene) => scene.sceneId) ?? []
  const sceneSources = useTraceabilitySceneSources(sceneIds, sceneClient, {
    sceneSourceSeedsBySceneId: Object.fromEntries(
      Object.entries(chapterWorkspaceQuery.sceneProseStateBySceneId ?? {}).map(([sceneId, proseState]) => [
        sceneId,
        { proseState },
      ]),
    ),
  })
  const traceability = useMemo(() => {
    if (!chapterWorkspaceQuery.workspace) {
      return null
    }

    const baseModel = buildChapterDraftTraceabilityViewModel({
      chapterId,
      selectedSceneId: chapterWorkspaceQuery.workspace.selectedSceneId,
      scenes: chapterWorkspaceQuery.workspace.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        title: scene.title,
      })),
      sceneTraceBySceneId: sceneSources.traceBySceneId,
    })
    const resolvedSelectedSceneId = baseModel.selectedSceneId
    const selectedSceneState = resolvedSelectedSceneId ? sceneSources.sceneStateBySceneId[resolvedSelectedSceneId] : null

    return {
      ...baseModel,
      selectedSceneTrace: selectedSceneState?.isComplete ? baseModel.selectedSceneTrace : null,
      chapterCoverage: sceneSources.isComplete ? baseModel.chapterCoverage : null,
    }
  }, [chapterId, chapterWorkspaceQuery.workspace, sceneSources.isComplete, sceneSources.sceneStateBySceneId, sceneSources.traceBySceneId])

  const selectedSceneTraceLoading = useMemo(() => {
    if (!traceability?.selectedSceneId) {
      return false
    }

    const selectedSceneState = sceneSources.sceneStateBySceneId[traceability.selectedSceneId]
    return !selectedSceneState?.isComplete && selectedSceneState?.error === null
  }, [sceneSources.sceneStateBySceneId, traceability?.selectedSceneId])

  const chapterCoverageLoading = useMemo(() => {
    if (!chapterWorkspaceQuery.workspace) {
      return false
    }

    return !sceneSources.isComplete && sceneSources.error === null
  }, [chapterWorkspaceQuery.workspace, sceneSources.error, sceneSources.isComplete])

  return {
    traceability,
    selectedSceneTraceLoading,
    chapterCoverageLoading,
    isLoading: chapterWorkspaceQuery.isLoading || sceneSources.isLoading,
    error: chapterWorkspaceQuery.error ?? sceneSources.error,
    refetch: async () => {
      await chapterWorkspaceQuery.refetch()
      await sceneSources.refetch()
    },
  }
}
