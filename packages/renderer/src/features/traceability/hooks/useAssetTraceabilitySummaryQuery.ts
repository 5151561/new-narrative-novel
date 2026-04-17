import { useMemo } from 'react'

import { assetClient, type AssetClient } from '@/features/asset/api/asset-client'
import { useAssetKnowledgeWorkspaceQuery } from '@/features/asset/hooks/useAssetKnowledgeWorkspaceQuery'

import { buildAssetTraceabilitySummaryViewModel } from '../lib/traceability-mappers'
import { useTraceabilitySceneSources, type TraceabilitySceneClient } from './useTraceabilitySceneSources'

interface AssetTraceabilitySummaryQueryDeps {
  assetClient?: Pick<AssetClient, 'getAssetKnowledgeWorkspace'>
  sceneClient?: TraceabilitySceneClient
}

export function useAssetTraceabilitySummaryQuery(
  assetId: string,
  { assetClient: customAssetClient = assetClient, sceneClient }: AssetTraceabilitySummaryQueryDeps = {},
) {
  const assetWorkspaceQuery = useAssetKnowledgeWorkspaceQuery({ assetId }, customAssetClient)
  const sceneIds = useMemo(
    () =>
      Array.from(
        new Set(
          (assetWorkspaceQuery.workspace?.mentions ?? [])
            .map((mention) => mention.backing?.sceneId ?? (mention.targetScope === 'scene' ? mention.sceneId : undefined))
            .filter((sceneId): sceneId is string => Boolean(sceneId)),
        ),
      ),
    [assetWorkspaceQuery.workspace?.mentions],
  )
  const sceneSources = useTraceabilitySceneSources(sceneIds, sceneClient)
  const summary = useMemo(() => {
    if (!assetWorkspaceQuery.workspace) {
      return null
    }

    if (!sceneSources.isComplete) {
      return null
    }

    return buildAssetTraceabilitySummaryViewModel({
      assetId,
      mentions: assetWorkspaceQuery.workspace.mentions,
      sceneTraceBySceneId: sceneSources.traceBySceneId,
      getMentionTitle: (mention) => mention.title,
    })
  }, [assetId, assetWorkspaceQuery.workspace, sceneSources.isComplete, sceneSources.traceBySceneId])

  return {
    summary,
    isLoading: assetWorkspaceQuery.isLoading || sceneSources.isLoading,
    error: assetWorkspaceQuery.error ?? sceneSources.error,
    refetch: async () => {
      await assetWorkspaceQuery.refetch()
      await sceneSources.refetch()
    },
  }
}
