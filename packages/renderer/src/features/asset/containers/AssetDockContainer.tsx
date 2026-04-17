import { AssetBottomDock } from '../components/AssetBottomDock'
import type { AssetKnowledgeWorkspaceViewModel } from '../types/asset-view-models'

interface AssetDockContainerProps {
  workspace: AssetKnowledgeWorkspaceViewModel
}

export function AssetDockContainer({ workspace }: AssetDockContainerProps) {
  return <AssetBottomDock summary={workspace.dockSummary} activity={workspace.dockActivity} />
}
