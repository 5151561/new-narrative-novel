import { useCallback } from 'react'

import { useI18n } from '@/app/i18n'
import { EmptyState } from '@/components/ui/EmptyState'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { type SceneClient } from '@/features/scene/api/scene-client'
import { useSceneTraceabilityQuery } from '@/features/traceability/hooks/useSceneTraceabilityQuery'

import { SceneInspectorPanel } from '../components/SceneInspectorPanel'
import { useSceneInspectorData } from '../hooks/useSceneInspectorData'
import { useSceneUiStore } from '../store/scene-ui-store'

interface SceneInspectorContainerProps {
  sceneId: string
  client?: SceneClient
}

export function SceneInspectorContainer({ sceneId, client }: SceneInspectorContainerProps) {
  const { locale } = useI18n()
  const { replaceRoute } = useWorkbenchRouteState()
  const inspector = useSceneInspectorData(sceneId, client)
  const traceability = useSceneTraceabilityQuery(sceneId, client)
  const activeTab = useSceneUiStore((state) => state.inspectorTab)
  const setInspectorTab = useSceneUiStore((state) => state.setInspectorTab)
  const openAsset = useCallback(
    (assetId: string) => {
      replaceRoute({
        scope: 'asset',
        assetId,
        lens: 'knowledge',
        view: 'profile',
      })
    },
    [replaceRoute],
  )

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
              ? '正在汇总场景上下文、版本信息、traceability 来源链和运行态摘要。'
              : 'Gathering scene context, versions, traceability, and runtime summaries.'
          }
        />
      </div>
    )
  }

  return (
    <SceneInspectorPanel
      data={inspector}
      traceability={traceability.trace}
      traceabilityLoading={traceability.isLoading}
      traceabilityError={traceability.error}
      activeTab={activeTab}
      onTabChange={setInspectorTab}
      onOpenAsset={openAsset}
    />
  )
}
