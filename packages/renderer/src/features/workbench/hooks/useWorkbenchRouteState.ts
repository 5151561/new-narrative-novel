import { useCallback, useSyncExternalStore } from 'react'

import type {
  AssetKnowledgeView,
  AssetLens,
  AssetRouteState,
  ChapterLens,
  ChapterRouteState,
  ChapterStructureView,
  SceneLens,
  SceneRouteModal,
  SceneRouteState,
  WorkbenchRouteState,
  WorkbenchScope,
} from '../types/workbench-route'
import type { SceneTab } from '@/features/scene/types/scene-view-models'

interface SetWorkbenchRouteOptions {
  replace?: boolean
}

type SceneRoutePatch = Partial<Omit<SceneRouteState, 'scope'>>
type ChapterRoutePatch = Partial<Omit<ChapterRouteState, 'scope'>>
type AssetRoutePatch = Partial<Omit<AssetRouteState, 'scope'>>
type WorkbenchRouteInput =
  | ({ scope: 'scene' } & SceneRoutePatch)
  | ({ scope: 'chapter' } & ChapterRoutePatch)
  | ({ scope: 'asset' } & AssetRoutePatch)

interface WorkbenchSearchState {
  scope: WorkbenchScope
  route: WorkbenchRouteState
  scene: SceneRouteState
  chapter: ChapterRouteState
  asset: AssetRouteState
}

const DEFAULT_SCENE_ID = 'scene-midnight-platform'
const DEFAULT_CHAPTER_ID = 'chapter-signals-in-rain'
const DEFAULT_ASSET_ID = 'asset-ren-voss'
const ROUTE_CHANGE_EVENT = 'workbench-route-change'
const CANONICAL_ROUTE_KEYS = ['scope', 'id', 'lens', 'tab', 'beatId', 'proposalId', 'modal', 'view', 'sceneId'] as const
const LEGACY_INACTIVE_SCOPE_KEYS = [
  'sceneId',
  'sceneLens',
  'sceneTab',
  'sceneBeatId',
  'sceneProposalId',
  'sceneModal',
  'chapterId',
  'chapterView',
] as const
const VALID_SCENE_TABS = new Set<SceneTab>(['setup', 'execution', 'prose'])
const VALID_SCENE_LENSES = new Set<SceneLens>(['structure', 'orchestrate', 'draft'])
const VALID_MODALS = new Set<SceneRouteModal>(['export'])
const VALID_CHAPTER_VIEWS = new Set<ChapterStructureView>(['sequence', 'outliner', 'assembly'])
const VALID_CHAPTER_LENSES = new Set<ChapterLens>(['structure', 'draft'])
const VALID_ASSET_VIEWS = new Set<AssetKnowledgeView>(['profile', 'mentions', 'relations'])
const VALID_ASSET_LENSES = new Set<AssetLens>(['knowledge'])

let lastRouteSearch = ''
let lastRouteSnapshot: WorkbenchSearchState | undefined

function readTextParam(params: URLSearchParams, key: string) {
  const value = params.get(key)
  return value && value.trim().length > 0 ? value : undefined
}

function isSceneTab(value: string | null): value is SceneTab {
  return value !== null && VALID_SCENE_TABS.has(value as SceneTab)
}

function isSceneLens(value: string | null): value is SceneLens {
  return value !== null && VALID_SCENE_LENSES.has(value as SceneLens)
}

function isSceneModal(value: string | null): value is SceneRouteModal {
  return value !== null && VALID_MODALS.has(value as SceneRouteModal)
}

function isChapterStructureView(value: string | null): value is ChapterStructureView {
  return value !== null && VALID_CHAPTER_VIEWS.has(value as ChapterStructureView)
}

function readLensParam(value: string | null) {
  return isSceneLens(value) ? value : undefined
}

function readSceneTabParam(value: string | null) {
  return isSceneTab(value) ? value : undefined
}

function readSceneModalParam(value: string | null) {
  return isSceneModal(value) ? value : undefined
}

function readChapterViewParam(value: string | null) {
  return isChapterStructureView(value) ? value : undefined
}

function isChapterLens(value: string | null): value is ChapterLens {
  return value !== null && VALID_CHAPTER_LENSES.has(value as ChapterLens)
}

function readChapterLensParam(value: string | null) {
  return isChapterLens(value) ? value : undefined
}

function isAssetLens(value: string | null): value is AssetLens {
  return value !== null && VALID_ASSET_LENSES.has(value as AssetLens)
}

function readAssetLensParam(value: string | null) {
  return isAssetLens(value) ? value : undefined
}

function isAssetKnowledgeView(value: string | null): value is AssetKnowledgeView {
  return value !== null && VALID_ASSET_VIEWS.has(value as AssetKnowledgeView)
}

function readAssetViewParam(value: string | null) {
  return isAssetKnowledgeView(value) ? value : undefined
}

function normalizeSceneRoute(route: Partial<SceneRouteState>): SceneRouteState {
  return {
    scope: 'scene',
    sceneId: route.sceneId ?? DEFAULT_SCENE_ID,
    lens: route.lens && VALID_SCENE_LENSES.has(route.lens) ? route.lens : 'orchestrate',
    tab: route.tab && VALID_SCENE_TABS.has(route.tab) ? route.tab : 'execution',
    beatId: route.beatId,
    proposalId: route.proposalId,
    modal: route.modal && VALID_MODALS.has(route.modal) ? route.modal : undefined,
  }
}

function normalizeChapterRoute(route: Partial<ChapterRouteState>): ChapterRouteState {
  return {
    scope: 'chapter',
    chapterId: route.chapterId ?? DEFAULT_CHAPTER_ID,
    lens: route.lens && VALID_CHAPTER_LENSES.has(route.lens) ? route.lens : 'structure',
    view: route.view && VALID_CHAPTER_VIEWS.has(route.view) ? route.view : 'sequence',
    sceneId: route.sceneId,
  }
}

function normalizeAssetRoute(route: Partial<AssetRouteState>): AssetRouteState {
  return {
    scope: 'asset',
    assetId: route.assetId ?? DEFAULT_ASSET_ID,
    lens: route.lens && VALID_ASSET_LENSES.has(route.lens) ? route.lens : 'knowledge',
    view: route.view && VALID_ASSET_VIEWS.has(route.view) ? route.view : 'profile',
  }
}

function readSceneSnapshot(params: URLSearchParams) {
  const activeLens = readLensParam(params.get('lens'))
  const activeTab = readSceneTabParam(params.get('tab'))
  const activeModal = readSceneModalParam(params.get('modal'))

  return normalizeSceneRoute({
    sceneId: readTextParam(params, 'id'),
    lens: activeLens,
    tab: activeTab,
    beatId: readTextParam(params, 'beatId'),
    proposalId: readTextParam(params, 'proposalId'),
    modal: activeModal,
  })
}

function readChapterSnapshot(params: URLSearchParams) {
  const activeLens = readChapterLensParam(params.get('lens'))
  const activeView = readChapterViewParam(params.get('view'))

  return normalizeChapterRoute({
    chapterId: readTextParam(params, 'id'),
    lens: activeLens,
    view: activeView,
    sceneId: readTextParam(params, 'sceneId'),
  })
}

function readAssetSnapshot(params: URLSearchParams) {
  const activeLens = readAssetLensParam(params.get('lens'))
  const activeView = readAssetViewParam(params.get('view'))

  return normalizeAssetRoute({
    assetId: readTextParam(params, 'id'),
    lens: activeLens,
    view: activeView,
  })
}

function readWorkbenchSearchState(search = typeof window === 'undefined' ? '' : window.location.search): WorkbenchSearchState {
  if (lastRouteSnapshot && search === lastRouteSearch) {
    return lastRouteSnapshot
  }

  const params = new URLSearchParams(search)
  const rawScope = params.get('scope')
  const scope: WorkbenchScope = rawScope === 'chapter' ? 'chapter' : rawScope === 'asset' ? 'asset' : 'scene'
  const previous = lastRouteSnapshot
  const scene = scope === 'scene' ? readSceneSnapshot(params) : previous?.scene ?? normalizeSceneRoute({})
  const chapter = scope === 'chapter' ? readChapterSnapshot(params) : previous?.chapter ?? normalizeChapterRoute({})
  const asset = scope === 'asset' ? readAssetSnapshot(params) : previous?.asset ?? normalizeAssetRoute({})
  const snapshot: WorkbenchSearchState = {
    scope,
    scene,
    chapter,
    asset,
    route: scope === 'chapter' ? chapter : scope === 'asset' ? asset : scene,
  }

  lastRouteSearch = search
  lastRouteSnapshot = snapshot
  return snapshot
}

export function readWorkbenchRouteState(search = typeof window === 'undefined' ? '' : window.location.search): WorkbenchRouteState {
  return readWorkbenchSearchState(search).route
}

function buildWorkbenchSearch(
  state: WorkbenchSearchState,
  baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search,
) {
  const params = new URLSearchParams(baseSearch)

  for (const key of CANONICAL_ROUTE_KEYS) {
    params.delete(key)
  }
  for (const key of LEGACY_INACTIVE_SCOPE_KEYS) {
    params.delete(key)
  }

  params.set('scope', state.scope)
  if (state.scope === 'scene') {
    params.set('id', state.scene.sceneId)
    params.set('lens', state.scene.lens)
    params.set('tab', state.scene.tab)
    if (state.scene.beatId) {
      params.set('beatId', state.scene.beatId)
    }
    if (state.scene.proposalId) {
      params.set('proposalId', state.scene.proposalId)
    }
    if (state.scene.modal) {
      params.set('modal', state.scene.modal)
    }
  } else if (state.scope === 'chapter') {
    params.set('id', state.chapter.chapterId)
    params.set('lens', state.chapter.lens)
    params.set('view', state.chapter.view)
    if (state.chapter.sceneId) {
      params.set('sceneId', state.chapter.sceneId)
    }
  } else {
    params.set('id', state.asset.assetId)
    params.set('lens', state.asset.lens)
    params.set('view', state.asset.view)
  }

  const nextSearch = params.toString()
  return nextSearch.length > 0 ? `?${nextSearch}` : ''
}

function writeWorkbenchRouteState(state: WorkbenchSearchState, options?: SetWorkbenchRouteOptions) {
  const nextSearch = buildWorkbenchSearch(state)
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`

  lastRouteSearch = nextSearch
  lastRouteSnapshot = {
    ...state,
    route: state.scope === 'chapter' ? state.chapter : state.scope === 'asset' ? state.asset : state.scene,
  }

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

export function useWorkbenchRouteState() {
  const route = useSyncExternalStore(subscribe, readWorkbenchRouteState, () => readWorkbenchRouteState(''))

  const replaceRoute = useCallback((next: WorkbenchRouteInput, options?: SetWorkbenchRouteOptions) => {
    const current = readWorkbenchSearchState()
    const baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search

    const nextState: WorkbenchSearchState =
      next.scope === 'scene'
        ? {
            ...current,
            scope: 'scene',
            scene: normalizeSceneRoute({ ...current.scene, ...next, scope: 'scene' }),
            route: current.scene,
          }
        : next.scope === 'asset'
          ? {
              ...current,
              scope: 'asset',
              asset: normalizeAssetRoute({ ...current.asset, ...next, scope: 'asset' }),
              route: current.asset,
            }
        : {
            ...current,
            scope: 'chapter',
            chapter: normalizeChapterRoute({ ...current.chapter, ...next, scope: 'chapter' }),
            route: current.chapter,
          }

    const currentSearch = buildWorkbenchSearch(current, baseSearch)
    const nextSearch = buildWorkbenchSearch(nextState, baseSearch)

    if (currentSearch === nextSearch) {
      lastRouteSearch = nextSearch
      lastRouteSnapshot = {
        ...nextState,
        route: nextState.scope === 'chapter' ? nextState.chapter : nextState.scope === 'asset' ? nextState.asset : nextState.scene,
      }
      return
    }

    writeWorkbenchRouteState(nextState, options)
  }, [])

  const patchSceneRoute = useCallback((patch: SceneRoutePatch, options?: SetWorkbenchRouteOptions) => {
    const current = readWorkbenchSearchState()
    const baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search
    const nextScene = normalizeSceneRoute({ ...current.scene, ...patch, scope: 'scene' })
    const nextState: WorkbenchSearchState = {
      ...current,
      scene: nextScene,
      route: current.scope === 'scene' ? nextScene : current.route,
    }

    const currentSearch = buildWorkbenchSearch(current, baseSearch)
    const nextSearch = buildWorkbenchSearch(nextState, baseSearch)

    if (currentSearch === nextSearch) {
      lastRouteSearch = nextSearch
      lastRouteSnapshot = {
        ...nextState,
        route: nextState.scope === 'chapter' ? nextState.chapter : nextState.scope === 'asset' ? nextState.asset : nextState.scene,
      }
      return
    }

    writeWorkbenchRouteState(nextState, options)
  }, [])

  const patchChapterRoute = useCallback((patch: ChapterRoutePatch, options?: SetWorkbenchRouteOptions) => {
    const current = readWorkbenchSearchState()
    const baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search
    const nextChapter = normalizeChapterRoute({ ...current.chapter, ...patch, scope: 'chapter' })
    const nextState: WorkbenchSearchState = {
      ...current,
      chapter: nextChapter,
      route: current.scope === 'chapter' ? nextChapter : current.route,
    }

    const currentSearch = buildWorkbenchSearch(current, baseSearch)
    const nextSearch = buildWorkbenchSearch(nextState, baseSearch)

    if (currentSearch === nextSearch) {
      lastRouteSearch = nextSearch
      lastRouteSnapshot = {
        ...nextState,
        route: nextState.scope === 'chapter' ? nextState.chapter : nextState.scope === 'asset' ? nextState.asset : nextState.scene,
      }
      return
    }

    writeWorkbenchRouteState(nextState, options)
  }, [])

  const patchAssetRoute = useCallback((patch: AssetRoutePatch, options?: SetWorkbenchRouteOptions) => {
    const current = readWorkbenchSearchState()
    const baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search
    const nextAsset = normalizeAssetRoute({ ...current.asset, ...patch, scope: 'asset' })
    const nextState: WorkbenchSearchState = {
      ...current,
      asset: nextAsset,
      route: current.scope === 'asset' ? nextAsset : current.route,
    }

    const currentSearch = buildWorkbenchSearch(current, baseSearch)
    const nextSearch = buildWorkbenchSearch(nextState, baseSearch)

    if (currentSearch === nextSearch) {
      lastRouteSearch = nextSearch
      lastRouteSnapshot = {
        ...nextState,
        route: nextState.scope === 'chapter' ? nextState.chapter : nextState.scope === 'asset' ? nextState.asset : nextState.scene,
      }
      return
    }

    writeWorkbenchRouteState(nextState, options)
  }, [])

  return {
    route,
    replaceRoute,
    patchSceneRoute,
    patchChapterRoute,
    patchAssetRoute,
  }
}
