import { useQuery } from '@tanstack/react-query'

import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import { sceneQueryKeys } from './scene-query-keys'

export function useSceneInspectorData(sceneId: string, client: SceneClient = sceneClient) {
  const query = useQuery({
    queryKey: sceneQueryKeys.inspector(sceneId),
    queryFn: () => client.getSceneInspector(sceneId),
  })

  return {
    context: query.data?.context ?? {
      acceptedFacts: [],
      knowledgeBoundaries: [],
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
