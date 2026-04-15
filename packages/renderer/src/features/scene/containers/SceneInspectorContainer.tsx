import { useI18n } from '@/app/i18n'
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
  const { locale } = useI18n()
  const inspector = useSceneInspectorData(sceneId, client)
  const activeTab = useSceneUiStore((state) => state.inspectorTab)
  const setInspectorTab = useSceneUiStore((state) => state.setInspectorTab)

  if (inspector.error) {
    return (
      <div className="p-4">
        <EmptyState title={locale === 'zh-CN' ? '检查器不可用' : 'Inspector unavailable'} message={inspector.error.message} />
      </div>
    )
  }

  if (inspector.isLoading) {
    return (
      <div className="p-4">
        <EmptyState
          title={locale === 'zh-CN' ? '正在加载检查器' : 'Loading inspector'}
          message={
            locale === 'zh-CN'
              ? '正在汇总场景上下文、版本信息和运行态摘要。'
              : 'Gathering scene context, versions, and runtime summaries.'
          }
        />
      </div>
    )
  }

  return <SceneInspectorPanel data={inspector} activeTab={activeTab} onTabChange={setInspectorTab} />
}
