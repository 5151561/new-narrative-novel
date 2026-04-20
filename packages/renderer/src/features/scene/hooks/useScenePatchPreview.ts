import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useScenePatchPreview(sceneId: string, enabled: boolean, client?: SceneClient) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.sceneClient,
    'useScenePatchPreview',
    'client',
  )
  const query = useQuery({
    queryKey: sceneQueryKeys.patchPreview(sceneId, locale),
    queryFn: () => effectiveClient.previewAcceptedPatch(sceneId),
    enabled,
  })

  return {
    preview: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  }
}
