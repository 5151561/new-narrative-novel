import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneWorkspaceQuery(sceneId: string, client: SceneClient = sceneClient) {
  const { locale } = useI18n()
  const query = useQuery({
    queryKey: sceneQueryKeys.workspace(sceneId, locale),
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
