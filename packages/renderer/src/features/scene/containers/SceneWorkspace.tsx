import { useMemo } from 'react'

import { useI18n } from '@/app/i18n'
import { EmptyState } from '@/components/ui/EmptyState'

import { SceneExportSheet } from '../components/SceneExportSheet'
import { SceneHeader } from '../components/SceneHeader'
import { ScenePatchPreviewSheet } from '../components/ScenePatchPreviewSheet'
import { SceneTabBar } from '../components/SceneTabBar'
import { useScenePatchPreview } from '../hooks/useScenePatchPreview'
import { useSceneRouteState } from '../hooks/useSceneRouteState'
import { useSceneWorkspaceQuery } from '../hooks/useSceneWorkspaceQuery'
import { useSceneWorkspaceActions } from '../hooks/useSceneWorkspaceActions'
import { useSceneUiStore } from '../store/scene-ui-store'
import type { SceneTab } from '../types/scene-view-models'
import { SceneExecutionContainer } from './SceneExecutionContainer'
import { SceneProseContainer } from './SceneProseContainer'
import { SceneSetupContainer } from './SceneSetupContainer'

interface SceneWorkspaceProps {
  sceneId: string
  defaultTab?: SceneTab
}

function deriveLensFromTab(tab: SceneTab) {
  if (tab === 'setup') {
    return 'structure'
  }

  if (tab === 'prose') {
    return 'draft'
  }

  return 'orchestrate'
}

export function SceneWorkspace({ sceneId, defaultTab = 'execution' }: SceneWorkspaceProps) {
  const { locale } = useI18n()
  const workspaceQuery = useSceneWorkspaceQuery(sceneId)
  const { route } = useSceneRouteState()
  const actions = useSceneWorkspaceActions({ sceneId })
  const patchPreviewOpen = useSceneUiStore((state) => state.patchPreviewOpen)
  const isActiveSceneRoute = route.sceneId === sceneId
  const activeTab: SceneTab = isActiveSceneRoute ? route.tab : defaultTab
  const activeLens = isActiveSceneRoute ? route.lens : deriveLensFromTab(activeTab)
  const patchPreview = useScenePatchPreview(sceneId, patchPreviewOpen)

  const tabPanel = useMemo(() => {
    if (activeTab === 'setup') {
      return <SceneSetupContainer sceneId={sceneId} onSaveAndRun={() => actions.openTab('execution')} />
    }

    if (activeTab === 'prose') {
      return <SceneProseContainer sceneId={sceneId} />
    }

    return <SceneExecutionContainer sceneId={sceneId} />
  }, [actions, activeTab, sceneId])

  if (workspaceQuery.error) {
    return (
      <div className="p-5">
        <EmptyState title={locale === 'zh-CN' ? '场景不可用' : 'Scene unavailable'} message={workspaceQuery.error.message} />
      </div>
    )
  }

  if (workspaceQuery.isLoading || !workspaceQuery.scene) {
    return (
      <div className="p-5">
        <EmptyState
          title={locale === 'zh-CN' ? '正在加载场景' : 'Loading scene'}
          message={
            locale === 'zh-CN'
              ? '正在准备场景工作区外壳和执行摘要。'
              : 'Preparing scene workspace shell and execution summary.'
          }
        />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <SceneHeader
        scene={workspaceQuery.scene}
        lens={activeLens}
        onOpenExport={actions.openExport}
        onSwitchThread={(threadId) => void actions.switchThread(threadId)}
        onOpenVersions={actions.openVersions}
      />
      <SceneTabBar activeTab={activeTab} onChange={actions.openTab} />
      <div className="min-h-0 flex-1 overflow-hidden">{tabPanel}</div>
      {route.sceneId === sceneId && route.modal === 'export' ? (
        <SceneExportSheet
          sceneTitle={workspaceQuery.scene.title}
          currentVersionLabel={workspaceQuery.scene.currentVersionLabel}
          onClose={actions.closeExport}
        />
      ) : null}
      {patchPreviewOpen ? (
        <ScenePatchPreviewSheet
          preview={patchPreview.preview}
          isLoading={patchPreview.isLoading}
          error={patchPreview.error}
          onClose={actions.closePatchPreview}
          onCommit={(patchId) => void actions.commitAcceptedPatch(patchId)}
        />
      ) : null}
    </div>
  )
}
