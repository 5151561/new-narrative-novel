import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'

import { SceneHeader } from '../components/SceneHeader'
import { SceneTabBar } from '../components/SceneTabBar'
import { useSceneWorkspaceQuery } from '../hooks/useSceneWorkspaceQuery'
import type { SceneTab } from '../types/scene-view-models'
import { SceneExecutionContainer } from './SceneExecutionContainer'
import { SceneProseContainer } from './SceneProseContainer'
import { SceneSetupContainer } from './SceneSetupContainer'

interface SceneWorkspaceProps {
  sceneId: string
  defaultTab?: SceneTab
}

export function SceneWorkspace({ sceneId, defaultTab = 'execution' }: SceneWorkspaceProps) {
  const workspaceQuery = useSceneWorkspaceQuery(sceneId)
  const [activeTab, setActiveTab] = useState<SceneTab>(defaultTab)

  const tabPanel = useMemo(() => {
    if (activeTab === 'setup') {
      return <SceneSetupContainer sceneId={sceneId} onSaveAndRun={() => setActiveTab('execution')} />
    }

    if (activeTab === 'prose') {
      return <SceneProseContainer sceneId={sceneId} />
    }

    return <SceneExecutionContainer sceneId={sceneId} />
  }, [activeTab, sceneId])

  if (workspaceQuery.error) {
    return (
      <div className="p-5">
        <EmptyState title="Scene unavailable" message={workspaceQuery.error.message} />
      </div>
    )
  }

  if (workspaceQuery.isLoading || !workspaceQuery.scene) {
    return (
      <div className="p-5">
        <EmptyState title="Loading scene" message="Preparing scene workspace shell and execution summary." />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <SceneHeader scene={workspaceQuery.scene} onSwitchThread={() => undefined} />
      <SceneTabBar activeTab={activeTab} onChange={setActiveTab} />
      <div className="min-h-0 flex-1 overflow-hidden">{tabPanel}</div>
    </div>
  )
}
