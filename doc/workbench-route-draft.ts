import { useCallback, useSyncExternalStore } from 'react'

import type { SceneTab } from '@/features/scene/types/scene-view-models'

export type WorkbenchScope = 'scene' | 'chapter'
export type WorkbenchLens = 'structure' | 'orchestrate' | 'draft'
export type SceneRouteModal = 'export'
export type ChapterStructureView = 'sequence' | 'outliner' | 'assembly'

export interface SceneRouteState {
  scope: 'scene'
  sceneId: string
  lens: WorkbenchLens
  tab: SceneTab
  beatId?: string
  proposalId?: string
  modal?: SceneRouteModal
}

export interface ChapterRouteState {
  scope: 'chapter'
  chapterId: string
  lens: 'structure'
  view: ChapterStructureView
  sceneId?: string
}

export type WorkbenchRouteState = SceneRouteState | ChapterRouteState

interface SetRouteOptions {
  replace?: boolean
}

const DEFAULT_SCENE_ID = 'scene-midnight-platform'
const DEFAULT_CHAPTER_ID = 'chapter-01'
const ROUTE_CHANGE_EVENT = 'workbench-route-change'

const VALID_SCOPES = new Set<WorkbenchScope>(['scene', 'chapter'])
const VALID_LENSES = new Set<WorkbenchLens>(['structure', 'orchestrate', 'draft'])
const VALID_SCENE_TABS = new Set<SceneTab>(['setup', 'execution', 'prose'])
const VALID_SCENE_MODALS = new Set<SceneRouteModal>(['export'])
const VALID_CHAPTER_VIEWS = new Set<ChapterStructureView>(['sequence', 'outliner', 'assembly'])
const ROUTE_KEYS = ['scope', 'id', 'lens', 'tab', 'view', 'sceneId', 'beatId', 'proposalId', 'modal'] as const

let lastRouteSearch = ''
let lastRouteSnapshot: WorkbenchRouteState | undefined

function readTextParam(params: URLSearchParams, key: string) {
  const value = params.get(key)
  return value && value.trim().length > 0 ? value : undefined
}

function isWorkbenchScope(value: string | null): value is WorkbenchScope {
  return value !== null && VALID_SCOPES.has(value as WorkbenchScope)
}

function isWorkbenchLens(value: string | null): value is WorkbenchLens {
  return value !== null && VALID_LENSES.has(value as WorkbenchLens)
}

function isSceneTab(value: string | null): value is SceneTab {
  return value !== null && VALID_SCENE_TABS.has(value as SceneTab)
}

function isSceneModal(value: string | null): value is SceneRouteModal {
  return value !== null && VALID_SCENE_MODALS.has(value as SceneRouteModal)
}

function isChapterView(value: string | null): value is ChapterStructureView {
  return value !== null && VALID_CHAPTER_VIEWS.has(value as ChapterStructureView)
}

export function readWorkbenchRouteState(search = typeof window === 'undefined' ? '' : window.location.search): WorkbenchRouteState {
  if (lastRouteSnapshot && search === lastRouteSearch) {
    return lastRouteSnapshot
  }

  const params = new URLSearchParams(search)
  const scope = isWorkbenchScope(params.get('scope')) ? params.get('scope') : 'scene'

  const snapshot: WorkbenchRouteState = scope === 'chapter'
    ? {
        scope: 'chapter',
        chapterId: readTextParam(params, 'id') ?? DEFAULT_CHAPTER_ID,
        lens: 'structure',
        view: isChapterView(params.get('view')) ? params.get('view') : 'sequence',
        sceneId: readTextParam(params, 'sceneId'),
      }
    : {
        scope: 'scene',
        sceneId: readTextParam(params, 'id') ?? DEFAULT_SCENE_ID,
        lens: isWorkbenchLens(params.get('lens')) ? params.get('lens') : 'orchestrate',
        tab: isSceneTab(params.get('tab')) ? params.get('tab') : 'execution',
        beatId: readTextParam(params, 'beatId'),
        proposalId: readTextParam(params, 'proposalId'),
        modal: isSceneModal(params.get('modal')) ? params.get('modal') : undefined,
      }

  lastRouteSearch = search
  lastRouteSnapshot = snapshot
  return snapshot
}

function buildWorkbenchSearch(
  route: WorkbenchRouteState,
  baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search,
) {
  const params = new URLSearchParams(baseSearch)

  for (const key of ROUTE_KEYS) {
    params.delete(key)
  }

  params.set('scope', route.scope)

  if (route.scope === 'scene') {
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

  params.set('id', route.chapterId)
  params.set('lens', 'structure')
  params.set('view', route.view)

  if (route.sceneId) {
    params.set('sceneId', route.sceneId)
  }

  return `?${params.toString()}`
}

function writeWorkbenchRouteState(route: WorkbenchRouteState, options?: SetRouteOptions) {
  const nextSearch = buildWorkbenchSearch(route)
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

function patchSceneState(current: WorkbenchRouteState, patch: Partial<SceneRouteState>): SceneRouteState {
  const base = current.scope === 'scene'
    ? current
    : {
        scope: 'scene' as const,
        sceneId: DEFAULT_SCENE_ID,
        lens: 'orchestrate' as const,
        tab: 'execution' as const,
      }

  return {
    ...base,
    ...patch,
    scope: 'scene',
    sceneId: patch.sceneId ?? base.sceneId,
    lens: patch.lens ?? base.lens,
    tab: patch.tab ?? base.tab,
  }
}

function patchChapterState(current: WorkbenchRouteState, patch: Partial<ChapterRouteState>): ChapterRouteState {
  const base = current.scope === 'chapter'
    ? current
    : {
        scope: 'chapter' as const,
        chapterId: DEFAULT_CHAPTER_ID,
        lens: 'structure' as const,
        view: 'sequence' as const,
      }

  return {
    ...base,
    ...patch,
    scope: 'chapter',
    chapterId: patch.chapterId ?? base.chapterId,
    lens: 'structure',
    view: patch.view ?? base.view,
  }
}

export function useWorkbenchRouteState() {
  const route = useSyncExternalStore(subscribe, readWorkbenchRouteState, () => readWorkbenchRouteState(''))

  const replaceRoute = useCallback((next: WorkbenchRouteState, options?: SetRouteOptions) => {
    const baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search

    if (buildWorkbenchSearch(route, baseSearch) === buildWorkbenchSearch(next, baseSearch)) {
      return
    }

    writeWorkbenchRouteState(next, options)
  }, [route])

  const patchSceneRoute = useCallback((patch: Partial<SceneRouteState>, options?: SetRouteOptions) => {
    const next = patchSceneState(readWorkbenchRouteState(), patch)
    replaceRoute(next, options)
  }, [replaceRoute])

  const patchChapterRoute = useCallback((patch: Partial<ChapterRouteState>, options?: SetRouteOptions) => {
    const next = patchChapterState(readWorkbenchRouteState(), patch)
    replaceRoute(next, options)
  }, [replaceRoute])

  return {
    route,
    replaceRoute,
    patchSceneRoute,
    patchChapterRoute,
  }
}
