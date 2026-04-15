import { EmptyState } from '@/components/ui/EmptyState'

import { type SceneClient } from '@/features/scene/api/scene-client'

import { SceneInspectorPanel } from '../components/SceneInspectorPanel'
import { useSceneInspectorData } from '../hooks/useSceneInspectorData'

interface SceneInspectorContainerProps {
  sceneId: string
  client?: SceneClient
}

export function SceneInspectorContainer({ sceneId, client }: SceneInspectorContainerProps) {
  const inspector = useSceneInspectorData(sceneId, client)

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

  return <SceneInspectorPanel data={inspector} />
}
