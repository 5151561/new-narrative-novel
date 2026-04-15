import { useQuery } from '@tanstack/react-query'

import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneProseQuery(sceneId: string, client: SceneClient = sceneClient) {
  const query = useQuery({
    queryKey: sceneQueryKeys.prose(sceneId),
    queryFn: () => client.getSceneProse(sceneId),
  })

  return {
    prose: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
