import { useTraceabilitySceneSources, type TraceabilitySceneClient } from './useTraceabilitySceneSources'

export function useSceneTraceabilityQuery(sceneId: string, client?: TraceabilitySceneClient) {
  const sceneSources = useTraceabilitySceneSources([sceneId], client)

  return {
    trace: sceneSources.traceBySceneId[sceneId] ?? null,
    isLoading: sceneSources.isLoading,
    error: sceneSources.error,
    refetch: sceneSources.refetch,
  }
}
