import { useMemo, type PropsWithChildren, type ReactElement } from 'react'

import { AppProviders } from '@/app/providers'
import { createStoryProjectRuntimeEnvironment } from '@/app/project-runtime'
import type { SceneRuntimeBridge } from '@/features/scene/api/scene-client'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import { useSceneUiStore } from '@/features/scene/store/scene-ui-store'
import type { SceneUiState } from '@/features/scene/store/scene-ui-store'
import { useSceneExecutionQuery } from '../hooks/useSceneExecutionQuery'
import { useSceneWorkspaceQuery } from '../hooks/useSceneWorkspaceQuery'
import { SceneRunSessionProvider } from './scene-run-session-context'

type SceneStoryUiState = Pick<SceneUiState, 'filters' | 'inspectorTab' | 'dockTab' | 'patchPreviewOpen'>

export interface SceneStoryParameters {
  sceneStory?: {
    search?: string
    uiState?: Partial<SceneStoryUiState>
    bridge?: SceneRuntimeBridge
    prepareEnvironment?: () => void
  }
}

const defaultSceneStorySearch = '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution'

const defaultSceneUiState: SceneStoryUiState = {
  filters: {},
  inspectorTab: 'context',
  dockTab: 'events',
  patchPreviewOpen: false,
}

function applySceneStoryEnvironment(parameters?: SceneStoryParameters['sceneStory']) {
  if (typeof window === 'undefined') {
    return
  }

  const search = parameters?.search ?? defaultSceneStorySearch
  const nextUrl = `${window.location.pathname}${search}${window.location.hash}`
  if (window.location.search !== search) {
    window.history.replaceState({}, '', nextUrl)
  }

  useSceneUiStore.setState({
    ...defaultSceneUiState,
    ...parameters?.uiState,
    filters: parameters?.uiState?.filters ?? defaultSceneUiState.filters,
  })

  if (parameters?.bridge) {
    Reflect.set(window, 'narrativeRuntimeBridge', { scene: parameters.bridge })
    return
  }

  Reflect.deleteProperty(window, 'narrativeRuntimeBridge')
}

interface SceneStoryShellProps extends PropsWithChildren {
  frameClassName: string
  parameters?: SceneStoryParameters['sceneStory']
}

function SceneStorySessionBridge({ children }: PropsWithChildren) {
  const { route } = useWorkbenchRouteState()
  const sceneId = route.scope === 'scene' ? route.sceneId : null
  const executionQuery = useSceneExecutionQuery(sceneId ?? '__storybook-scene__')
  const workspaceQuery = useSceneWorkspaceQuery(sceneId ?? '__storybook-scene__')

  if (!sceneId) {
    return children
  }

  return (
    <SceneRunSessionProvider
      sceneId={sceneId}
      runId={executionQuery.runId}
      latestRunId={workspaceQuery.scene?.latestRunId ?? null}
    >
      {children}
    </SceneRunSessionProvider>
  )
}

export function SceneStoryShell({ children, frameClassName, parameters }: SceneStoryShellProps) {
  applySceneStoryEnvironment(parameters)
  const storyEnvironment = useMemo(() => {
    const environment = createStoryProjectRuntimeEnvironment()
    parameters?.prepareEnvironment?.()
    return environment
  }, [])

  return (
    <AppProviders runtime={storyEnvironment.runtime} queryClient={storyEnvironment.queryClient}>
      <SceneStorySessionBridge>
        <div className="min-h-screen bg-app p-6">
          <div className={frameClassName}>{children}</div>
        </div>
      </SceneStorySessionBridge>
    </AppProviders>
  )
}

export function withSceneStoryShell(frameClassName: string) {
  return function SceneStoryDecorator(Story: () => ReactElement, context: { parameters: SceneStoryParameters }) {
    return (
      <SceneStoryShell frameClassName={frameClassName} parameters={context.parameters.sceneStory}>
        <Story />
      </SceneStoryShell>
    )
  }
}
