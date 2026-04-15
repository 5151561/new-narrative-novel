import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useScenePatchPreview(sceneId: string, enabled: boolean, client: SceneClient = sceneClient) {
  const { locale } = useI18n()
  const query = useQuery({
    queryKey: sceneQueryKeys.patchPreview(sceneId, locale),
    queryFn: () => client.previewAcceptedPatch(sceneId),
    enabled,
  })

  return {
    preview: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
