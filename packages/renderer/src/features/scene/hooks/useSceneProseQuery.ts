import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneProseQuery(sceneId: string, client: SceneClient = sceneClient) {
  const { locale } = useI18n()
  const query = useQuery({
    queryKey: sceneQueryKeys.prose(sceneId, locale),
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
