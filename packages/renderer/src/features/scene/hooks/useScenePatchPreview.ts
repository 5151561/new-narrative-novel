import { useQuery } from '@tanstack/react-query'

import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useScenePatchPreview(sceneId: string, enabled: boolean, client: SceneClient = sceneClient) {
  const query = useQuery({
    queryKey: sceneQueryKeys.patchPreview(sceneId),
    queryFn: () => client.previewAcceptedPatch(sceneId),
    enabled,
  })

  return {
    preview: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
