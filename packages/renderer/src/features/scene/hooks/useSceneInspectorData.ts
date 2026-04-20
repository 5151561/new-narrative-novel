import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneInspectorData(sceneId: string, client?: SceneClient) {
  const runtime = useOptionalProjectRuntime()
  const { locale } = useI18n()
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.sceneClient,
    'useSceneInspectorData',
    'client',
  )
  const query = useQuery({
    queryKey: sceneQueryKeys.inspector(sceneId, locale),
    queryFn: () => effectiveClient.getSceneInspector(sceneId),
  })

  return {
    context: query.data?.context ?? {
      acceptedFacts: [],
      privateInfoGuard: {
        summary: '',
        items: [],
      },
      actorKnowledgeBoundaries: [],
      localState: [],
      overrides: [],
    },
    versions: query.data?.versions ?? {
      checkpoints: [],
      acceptanceTimeline: [],
      patchCandidates: [],
    },
    runtime: query.data?.runtime ?? {
      profile: {
        label: '',
        summary: '',
      },
      runHealth: 'stable' as const,
      metrics: {
        latencyLabel: '',
        tokenLabel: '',
        costLabel: '',
      },
      latestFailure: undefined,
    },
    isLoading: query.isLoading,
    error: query.error,
  }
}
