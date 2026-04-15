import { useI18n } from '@/app/i18n'
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
  const { locale } = useI18n()
  const activeTab = useSceneUiStore((state) => state.dockTab)
  const setDockTab = useSceneUiStore((state) => state.setDockTab)
  const dock = useSceneDockData(sceneId, activeTab, client)

  if (dock.error) {
    return (
      <div className="p-4">
        <EmptyState title={locale === 'zh-CN' ? '底部面板不可用' : 'Bottom dock unavailable'} message={dock.error.message} />
      </div>
    )
  }

  if (dock.isLoading) {
    return (
      <div className="p-4">
        <EmptyState
          title={locale === 'zh-CN' ? '正在加载底部面板' : 'Loading bottom dock'}
          message={
            locale === 'zh-CN'
              ? '正在准备结构化场景事件、追踪、问题与成本。'
              : 'Preparing structured scene events, trace, problems, and cost.'
          }
        />
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
