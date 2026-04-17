import { useMemo } from 'react'

import { chapterClient, type ChapterClient } from '@/features/chapter/api/chapter-client'
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
  { chapterClient: customChapterClient = chapterClient, sceneClient }: ChapterDraftTraceabilityQueryDeps = {},
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

    if (!sceneSources.isComplete) {
      return null
    }

    return buildChapterDraftTraceabilityViewModel({
      chapterId,
      selectedSceneId: chapterWorkspaceQuery.workspace.selectedSceneId,
      scenes: chapterWorkspaceQuery.workspace.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        title: scene.title,
      })),
      sceneTraceBySceneId: sceneSources.traceBySceneId,
    })
  }, [chapterId, chapterWorkspaceQuery.workspace, sceneSources.isComplete, sceneSources.traceBySceneId])

  return {
    traceability,
    isLoading: chapterWorkspaceQuery.isLoading || sceneSources.isLoading,
    error: chapterWorkspaceQuery.error ?? sceneSources.error,
    refetch: async () => {
      await chapterWorkspaceQuery.refetch()
      await sceneSources.refetch()
    },
  }
}
