import { EmptyState } from '@/components/ui/EmptyState'

import { type SceneClient } from '@/features/scene/api/scene-client'

import { SceneBottomDock } from '../components/SceneBottomDock'
import { useSceneDockData } from '../hooks/useSceneDockData'
import { useSceneUiStore } from '../store/scene-ui-store'

interface SceneDockContainerProps {
  sceneId: string
  client?: SceneClient
}

export function SceneDockContainer({ sceneId, client }: SceneDockContainerProps) {
  const activeTab = useSceneUiStore((state) => state.dockTab)
  const setDockTab = useSceneUiStore((state) => state.setDockTab)
  const dock = useSceneDockData(sceneId, activeTab, client)

  if (dock.error) {
    return (
      <div className="p-4">
        <EmptyState title="Bottom dock unavailable" message={dock.error.message} />
      </div>
    )
  }

  if (dock.isLoading) {
    return (
      <div className="p-4">
        <EmptyState title="Loading bottom dock" message="Preparing structured scene events, trace, problems, and cost." />
      </div>
    )
  }

  return (
    <SceneBottomDock
      data={dock}
      activeTab={activeTab}
      isHydratingTab={dock.isHydratingTab}
      onTabChange={setDockTab}
    />
  )
}
