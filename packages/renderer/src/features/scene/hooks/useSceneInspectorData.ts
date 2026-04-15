import { useQuery } from '@tanstack/react-query'

import { useI18n } from '@/app/i18n'
import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneInspectorData(sceneId: string, client: SceneClient = sceneClient) {
  const { locale } = useI18n()
  const query = useQuery({
    queryKey: sceneQueryKeys.inspector(sceneId, locale),
    queryFn: () => client.getSceneInspector(sceneId),
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
