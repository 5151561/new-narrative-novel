import { useEffect, useState } from 'react'

import { useI18n } from '@/app/i18n'
import { EmptyState } from '@/components/ui/EmptyState'

import { type SceneClient } from '@/features/scene/api/scene-client'
import { useRunArtifactDetailQuery } from '@/features/run/hooks/useRunArtifactDetailQuery'
import { useRunArtifactsQuery } from '@/features/run/hooks/useRunArtifactsQuery'
import { useRunTraceQuery } from '@/features/run/hooks/useRunTraceQuery'
import type { RunEventInspectorMode } from '@/features/run/components/RunEventInspectorPanel'

import { SceneBottomDock } from '../components/SceneBottomDock'
import { useSceneDockData } from '../hooks/useSceneDockData'
import { useSceneUiStore } from '../store/scene-ui-store'
import { useSharedSceneRunSession } from './scene-run-session-context'

interface SceneDockContainerProps {
  sceneId: string
  client?: SceneClient
  initialSelectedArtifactId?: string | null
  initialInspectorMode?: RunEventInspectorMode
}

export function SceneDockContainer({
  sceneId,
  client,
  initialSelectedArtifactId = null,
  initialInspectorMode = 'artifact',
}: SceneDockContainerProps) {
  const { locale } = useI18n()
  const activeTab = useSceneUiStore((state) => state.dockTab)
  const setDockTab = useSceneUiStore((state) => state.setDockTab)
  const dock = useSceneDockData(sceneId, activeTab, client)
  const runSession = useSharedSceneRunSession()
  const [selectedArtifactId, setSelectedArtifactId] = useState<string | null>(initialSelectedArtifactId)
  const [inspectorMode, setInspectorMode] = useState<RunEventInspectorMode>(initialInspectorMode)
  const activeRunIdentity = runSession.activeRunId ?? null
  const activeEventsRunId = activeTab === 'events' ? activeRunIdentity : null
  const artifactsQuery = useRunArtifactsQuery(activeEventsRunId)
  const artifactDetailQuery = useRunArtifactDetailQuery({
    runId: activeEventsRunId,
    artifactId: selectedArtifactId,
  })
  const traceQuery = useRunTraceQuery(activeEventsRunId)

  useEffect(() => {
    setSelectedArtifactId(initialSelectedArtifactId)
    setInspectorMode(initialInspectorMode)
  }, [activeRunIdentity, initialSelectedArtifactId, initialInspectorMode])

  const handleSelectArtifact = (artifactId: string) => {
    setSelectedArtifactId(artifactId)
    setInspectorMode('artifact')
  }

  const runSupport =
    activeTab === 'events'
      ? {
          activeRunId: runSession.activeRunId,
          run: runSession.run,
          events: runSession.events,
          isLoading: runSession.isLoading,
          error: runSession.error,
          isReviewPending: runSession.isReviewPending,
          artifacts: artifactsQuery.artifacts,
          artifactsError: artifactsQuery.error,
          isArtifactsLoading: artifactsQuery.isLoading,
          selectedArtifactId,
          selectedArtifact: artifactDetailQuery.artifact,
          artifactError: artifactDetailQuery.error,
          isArtifactLoading: artifactDetailQuery.isLoading,
          trace: traceQuery.trace,
          traceError: traceQuery.error,
          isTraceLoading: traceQuery.isLoading,
          inspectorMode,
          onInspectorModeChange: setInspectorMode,
          onSelectArtifact: handleSelectArtifact,
        }
      : undefined

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
      runSupport={runSupport}
      onTabChange={setDockTab}
    />
  )
}
