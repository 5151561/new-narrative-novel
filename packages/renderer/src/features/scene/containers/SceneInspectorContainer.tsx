import { EmptyState } from '@/components/ui/EmptyState'

import { type SceneClient } from '@/features/scene/api/scene-client'

import { SceneInspectorPanel } from '../components/SceneInspectorPanel'
import { useSceneInspectorData } from '../hooks/useSceneInspectorData'
import { useSceneUiStore } from '../store/scene-ui-store'

interface SceneInspectorContainerProps {
  sceneId: string
  client?: SceneClient
}

export function SceneInspectorContainer({ sceneId, client }: SceneInspectorContainerProps) {
  const inspector = useSceneInspectorData(sceneId, client)
  const activeTab = useSceneUiStore((state) => state.inspectorTab)
  const setInspectorTab = useSceneUiStore((state) => state.setInspectorTab)

  if (inspector.error) {
    return (
      <div className="p-4">
        <EmptyState title="Inspector unavailable" message={inspector.error.message} />
      </div>
    )
  }

  if (inspector.isLoading) {
    return (
      <div className="p-4">
        <EmptyState title="Loading inspector" message="Gathering scene context, versions, and runtime summaries." />
      </div>
    )
  }

  return <SceneInspectorPanel data={inspector} activeTab={activeTab} onTabChange={setInspectorTab} />
}
