import {
  readWorkbenchRouteState,
  useWorkbenchRouteState,
} from '@/features/workbench/hooks/useWorkbenchRouteState'
import type {
  SceneRouteModal,
  SceneRouteState,
  WorkbenchLens,
} from '@/features/workbench/types/workbench-route'

export type SceneLens = WorkbenchLens
export type { SceneRouteModal, SceneRouteState }

export function readSceneRouteState(search = typeof window === 'undefined' ? '' : window.location.search): SceneRouteState {
  const route = readWorkbenchRouteState(search)

  if (route.scope !== 'scene') {
    throw new Error('readSceneRouteState must be used with a scene route.')
  }

  return route
}

export function useSceneRouteState() {
  const { route, patchSceneRoute } = useWorkbenchRouteState()

  if (route.scope !== 'scene') {
    throw new Error('useSceneRouteState must be used within scene scope.')
  }

  return {
    route,
    setRoute: patchSceneRoute,
  }
}
