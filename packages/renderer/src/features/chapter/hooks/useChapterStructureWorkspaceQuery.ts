import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import type { ChapterRouteState } from '@/features/workbench/types/workbench-route'

import { chapterClient, type ChapterClient } from '../api/chapter-client'
import type {
  ChapterStructureInspectorViewModel,
  ChapterStructureSceneViewModel,
  ChapterStructureWorkspaceData,
  ChapterStructureWorkspaceViewModel,
} from '../types/chapter-view-models'
import { chapterQueryKeys } from './chapter-query-keys'

function buildUnresolvedSummary(selectedScene: ChapterStructureSceneViewModel | undefined, locale: 'en' | 'zh-CN') {
  if (!selectedScene) {
    return locale === 'zh-CN' ? '当前场景仍有未决结构信号。' : 'The current scene still carries unresolved structure signals.'
  }

  return locale === 'zh-CN'
    ? `${selectedScene.title} 仍有 ${selectedScene.unresolvedCount} 个未决结构信号。`
    : `${selectedScene.title} still carries ${selectedScene.unresolvedCount} unresolved structure signals.`
}

function buildChapterStructureWorkspaceModel(
  data: ChapterStructureWorkspaceData | undefined,
  route: ChapterRouteState,
  locale: 'en' | 'zh-CN',
): ChapterStructureWorkspaceViewModel | undefined {
  if (!data) {
    return undefined
  }

  const selectedScene = data.scenes.find((scene) => scene.id === route.sceneId) ?? data.scenes[0]
  const inspector: ChapterStructureInspectorViewModel = {
    ...data.inspector,
    selectedSceneTitle: selectedScene?.title ?? data.title,
    selectedSceneBrief: selectedScene?.summary ?? data.summary,
    unresolvedSummary: buildUnresolvedSummary(selectedScene, locale),
  }

  return {
    ...data,
    activeView: route.view,
    currentSceneId: selectedScene?.id ?? '',
    inspector,
  }
}

export function useChapterStructureWorkspaceQuery(route: ChapterRouteState, client: ChapterClient = chapterClient) {
  const { locale } = useI18n()
  const query = useQuery({
    queryKey: chapterQueryKeys.workspace(route.chapterId, locale),
    queryFn: () => client.getChapterStructureWorkspace(route.chapterId),
  })

  const model = useMemo(
    () => buildChapterStructureWorkspaceModel(query.data, route, locale),
    [locale, query.data, route],
  )

  return {
    model,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
