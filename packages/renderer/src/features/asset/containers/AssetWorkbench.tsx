import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { AssetKnowledgeWorkspace } from './AssetKnowledgeWorkspace'

export function AssetWorkbench() {
  const { route } = useWorkbenchRouteState()

  if (route.scope !== 'asset') {
    return null
  }

  return <AssetKnowledgeWorkspace />
}
