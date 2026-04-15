import { useQuery } from '@tanstack/react-query'

import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneWorkspaceQuery(sceneId: string, client: SceneClient = sceneClient) {
  const query = useQuery({
    queryKey: sceneQueryKeys.workspace(sceneId),
    queryFn: () => client.getSceneWorkspace(sceneId),
  })

  return {
    scene: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: async () => {
      await query.refetch()
    },
  }
}
