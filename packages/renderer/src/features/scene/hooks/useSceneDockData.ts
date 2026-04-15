import { useQuery } from '@tanstack/react-query'

import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneDockData(sceneId: string, client: SceneClient = sceneClient) {
  const query = useQuery({
    queryKey: sceneQueryKeys.dock(sceneId),
    queryFn: () => client.getSceneDock(sceneId),
  })

  return {
    events: query.data?.events ?? [],
    trace: query.data?.trace ?? [],
    consistency: query.data?.consistency ?? {
      summary: '',
      checks: [],
    },
    problems: query.data?.problems ?? {
      summary: '',
      items: [],
    },
    cost: query.data?.cost ?? {
      currentWindowLabel: '',
      trendLabel: '',
      breakdown: [],
    },
    isLoading: query.isLoading,
    error: query.error,
  }
}
