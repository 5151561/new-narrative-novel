import { useCallback, useSyncExternalStore } from 'react'

import type { SceneTab } from '../types/scene-view-models'

export type SceneLens = 'orchestrate' | 'draft' | 'structure'
export type SceneRouteModal = 'export'

export interface SceneRouteState {
  scope: 'scene'
  sceneId: string
  lens: SceneLens
  tab: SceneTab
  beatId?: string
  proposalId?: string
  modal?: SceneRouteModal
}

interface SetSceneRouteOptions {
  replace?: boolean
}

const DEFAULT_SCENE_ID = 'scene-midnight-platform'
const ROUTE_CHANGE_EVENT = 'scene-route-change'
const VALID_TABS = new Set<SceneTab>(['setup', 'execution', 'prose'])
const VALID_LENSES = new Set<SceneLens>(['orchestrate', 'draft', 'structure'])
const VALID_MODALS = new Set<SceneRouteModal>(['export'])
const SCENE_ROUTE_KEYS = ['scope', 'id', 'lens', 'tab', 'beatId', 'proposalId', 'modal'] as const
let lastRouteSearch = ''
let lastRouteSnapshot: SceneRouteState | undefined

function isSceneTab(value: string | null): value is SceneTab {
  return value !== null && VALID_TABS.has(value as SceneTab)
}

function isSceneLens(value: string | null): value is SceneLens {
  return value !== null && VALID_LENSES.has(value as SceneLens)
}

function isSceneModal(value: string | null): value is SceneRouteModal {
  return value !== null && VALID_MODALS.has(value as SceneRouteModal)
}

function readTextParam(params: URLSearchParams, key: string) {
  const value = params.get(key)
  return value && value.trim().length > 0 ? value : undefined
}

export function readSceneRouteState(search = typeof window === 'undefined' ? '' : window.location.search): SceneRouteState {
  if (lastRouteSnapshot && search === lastRouteSearch) {
    return lastRouteSnapshot
  }

  const params = new URLSearchParams(search)
  const lensParam = params.get('lens')
  const tabParam = params.get('tab')
  const modalParam = params.get('modal')
  const snapshot: SceneRouteState = {
    scope: 'scene',
    sceneId: readTextParam(params, 'id') ?? DEFAULT_SCENE_ID,
    lens: isSceneLens(lensParam) ? lensParam : 'orchestrate',
    tab: isSceneTab(tabParam) ? tabParam : 'execution',
    beatId: readTextParam(params, 'beatId'),
    proposalId: readTextParam(params, 'proposalId'),
    modal: isSceneModal(modalParam) ? modalParam : undefined,
  }

  lastRouteSearch = search
  lastRouteSnapshot = snapshot
  return snapshot
}

function buildSceneSearch(route: SceneRouteState, baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search) {
  const params = new URLSearchParams(baseSearch)

  for (const key of SCENE_ROUTE_KEYS) {
    params.delete(key)
  }

  params.set('scope', route.scope)
  params.set('id', route.sceneId)
  params.set('lens', route.lens)
  params.set('tab', route.tab)

  if (route.beatId) {
    params.set('beatId', route.beatId)
  }
  if (route.proposalId) {
    params.set('proposalId', route.proposalId)
  }
  if (route.modal) {
    params.set('modal', route.modal)
  }

  return `?${params.toString()}`
}

function writeSceneRouteState(route: SceneRouteState, options?: SetSceneRouteOptions) {
  const nextSearch = buildSceneSearch(route)
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`

  lastRouteSearch = nextSearch
  lastRouteSnapshot = route

  if (options?.replace) {
    window.history.replaceState({}, '', nextUrl)
  } else {
    window.history.pushState({}, '', nextUrl)
  }

  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  window.addEventListener(ROUTE_CHANGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('popstate', onStoreChange)
    window.removeEventListener(ROUTE_CHANGE_EVENT, onStoreChange)
  }
}

export function useSceneRouteState() {
  const route = useSyncExternalStore(subscribe, readSceneRouteState, () => readSceneRouteState(''))

  const setRoute = useCallback((patch: Partial<SceneRouteState>, options?: SetSceneRouteOptions) => {
    const current = readSceneRouteState()
    const baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search
    const next: SceneRouteState = {
      ...current,
      ...patch,
      scope: 'scene',
      sceneId: patch.sceneId ?? current.sceneId,
      lens: patch.lens ?? current.lens,
      tab: patch.tab ?? current.tab,
    }

    if (buildSceneSearch(current, baseSearch) === buildSceneSearch(next, baseSearch)) {
      return
    }

    writeSceneRouteState(next, options)
  }, [])

  return {
    route,
    setRoute,
  }
}
