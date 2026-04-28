import { useMemo } from 'react'

import { useQueries, useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'
import { sceneQueryKeys } from '@/features/scene/hooks/scene-query-keys'

import { type ChapterClient, type GetChapterStructureWorkspaceInput } from '../api/chapter-client'
import { type ChapterDraftAssemblyRecord } from '../api/chapter-draft-assembly-records'
import {
  mapChapterDraftAssemblyRecord,
  mapLegacyChapterDraftWorkspace,
  type LegacyChapterDraftProseState,
} from '../lib/chapter-draft-assembly-mappers'
import { chapterQueryKeys } from './chapter-query-keys'
import { useChapterStructureWorkspaceQuery } from './useChapterStructureWorkspaceQuery'

interface UseChapterDraftWorkspaceQueryInput extends GetChapterStructureWorkspaceInput {
  selectedSceneId?: string | null
}

interface ChapterDraftWorkspaceQueryDeps {
  chapterClient?: Pick<ChapterClient, 'getChapterStructureWorkspace' | 'getChapterDraftAssembly'>
  sceneClient?: Pick<SceneClient, 'getSceneProse'>
}

export type ChapterDraftSceneProseState = LegacyChapterDraftProseState

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
  const supportsLiveAssembly = typeof effectiveChapterClient.getChapterDraftAssembly === 'function'
  const chapterDraftAssemblyQuery = useQuery({
    queryKey: chapterQueryKeys.draftAssembly(chapterId, locale),
    enabled: supportsLiveAssembly,
    queryFn: () => effectiveChapterClient.getChapterDraftAssembly!({ chapterId }),
  })
  const chapterWorkspaceQuery = useChapterStructureWorkspaceQuery(
    { chapterId, selectedSceneId },
    effectiveChapterClient,
    { enabled: !supportsLiveAssembly },
  )
  const orderedScenes = supportsLiveAssembly ? [] : (chapterWorkspaceQuery.workspace?.scenes ?? [])
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
            } satisfies LegacyChapterDraftProseState,
          ]
        }),
      ),
    [orderedScenes, proseQueries],
  )
  const workspace = useMemo(
    () => {
      if (supportsLiveAssembly) {
        const record = chapterDraftAssemblyQuery.data as ChapterDraftAssemblyRecord | null | undefined
        if (record === undefined) {
          return undefined
        }
        if (record === null) {
          return null
        }
        return mapChapterDraftAssemblyRecord(record, selectedSceneId, locale)
      }

      if (!chapterWorkspaceQuery.workspace) {
        return chapterWorkspaceQuery.workspace
      }

      return mapLegacyChapterDraftWorkspace(chapterWorkspaceQuery.workspace, proseStateBySceneId, selectedSceneId, locale)
    },
    [supportsLiveAssembly, chapterDraftAssemblyQuery.data, selectedSceneId, locale, chapterWorkspaceQuery.workspace, proseStateBySceneId],
  )

  return {
    workspace,
    sceneProseStateBySceneId: proseStateBySceneId,
    isLoading: supportsLiveAssembly ? chapterDraftAssemblyQuery.isLoading : chapterWorkspaceQuery.isLoading,
    error: supportsLiveAssembly ? chapterDraftAssemblyQuery.error : chapterWorkspaceQuery.error,
    refetch: async () => {
      if (supportsLiveAssembly) {
        await chapterDraftAssemblyQuery.refetch()
        return
      }

      await chapterWorkspaceQuery.refetch()
      await Promise.all(proseQueries.map((query) => query.refetch()))
    },
  }
}
