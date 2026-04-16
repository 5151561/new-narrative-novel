import type { PropsWithChildren, ReactElement } from 'react'

import { AppProviders } from '@/app/providers'
import type { SceneRuntimeBridge } from '@/features/scene/api/scene-client'
import { useSceneUiStore } from '@/features/scene/store/scene-ui-store'
import type { SceneUiState } from '@/features/scene/store/scene-ui-store'

type SceneStoryUiState = Pick<SceneUiState, 'filters' | 'inspectorTab' | 'dockTab' | 'patchPreviewOpen'>

export interface SceneStoryParameters {
  sceneStory?: {
    search?: string
    uiState?: Partial<SceneStoryUiState>
    bridge?: SceneRuntimeBridge
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

export function SceneStoryShell({ children, frameClassName, parameters }: SceneStoryShellProps) {
  applySceneStoryEnvironment(parameters)

  return (
    <AppProviders>
      <div className="min-h-screen bg-app p-6">
        <div className={frameClassName}>{children}</div>
      </div>
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
