import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'

import type { SceneDockTabId } from '../types/scene-view-models'
import { sceneQueryKeys } from './scene-query-keys'

export function useSceneDockData(sceneId: string, activeTab: SceneDockTabId, client?: SceneClient) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.sceneClient,
    'useSceneDockData',
    'client',
  )
  const summaryQuery = useQuery({
    queryKey: sceneQueryKeys.dockSummary(sceneId, locale),
    queryFn: () => effectiveClient.getSceneDockSummary(sceneId),
  })

  const detailQuery = useQuery({
    queryKey: sceneQueryKeys.dockTab(sceneId, activeTab, locale),
    queryFn: () => effectiveClient.getSceneDockTab(sceneId, activeTab),
    enabled: activeTab !== 'events',
  })

  const summary = summaryQuery.data
  const detail = detailQuery.data

  return {
    events: detail?.events ?? summary?.events ?? [],
    trace: detail?.trace ?? [],
    consistency: detail?.consistency ?? summary?.consistency ?? {
      summary: '',
      checks: [],
    },
    problems: detail?.problems ?? summary?.problems ?? {
      summary: '',
      items: [],
    },
    cost: detail?.cost ?? summary?.cost ?? {
      currentWindowLabel: '',
      trendLabel: '',
      breakdown: [],
    },
    isLoading: summaryQuery.isLoading,
    isHydratingTab: activeTab !== 'events' && detailQuery.isLoading,
    error: summaryQuery.error ?? detailQuery.error,
  }
}
