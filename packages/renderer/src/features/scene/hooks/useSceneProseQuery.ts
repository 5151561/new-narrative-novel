import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneProseQuery(sceneId: string, client?: SceneClient) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.sceneClient,
    'useSceneProseQuery',
    'client',
  )
  const query = useQuery({
    queryKey: sceneQueryKeys.prose(sceneId, locale),
    queryFn: () => effectiveClient.getSceneProse(sceneId),
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
