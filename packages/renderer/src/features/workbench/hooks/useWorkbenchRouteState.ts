import { useCallback, useSyncExternalStore } from 'react'

import { DEFAULT_BOOK_EXPORT_PROFILE_ID } from '@/features/book/api/book-export-profiles'
import { DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID } from '@/features/book/api/book-manuscript-checkpoints'
import type {
  AssetKnowledgeView,
  AssetLens,
  AssetRouteState,
  BookBranchBaseline,
  BookDraftView,
  BookLens,
  BookReviewFilter,
  BookReviewStatusFilter,
  BookRouteState,
  BookStructureView,
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
type BookRoutePatch = Partial<Omit<BookRouteState, 'scope'>>
type WorkbenchRouteInput =
  | ({ scope: 'scene' } & SceneRoutePatch)
  | ({ scope: 'chapter' } & ChapterRoutePatch)
  | ({ scope: 'asset' } & AssetRoutePatch)
  | ({ scope: 'book' } & BookRoutePatch)

interface WorkbenchSearchState {
  scope: WorkbenchScope
  route: WorkbenchRouteState
  scene: SceneRouteState
  chapter: ChapterRouteState
  asset: AssetRouteState
  book: BookRouteState
}

const DEFAULT_SCENE_ID = 'scene-midnight-platform'
const DEFAULT_CHAPTER_ID = 'chapter-signals-in-rain'
const DEFAULT_ASSET_ID = 'asset-ren-voss'
const DEFAULT_BOOK_ID = 'book-signal-arc'
const DEFAULT_BOOK_EXPERIMENT_BRANCH_ID = 'branch-book-signal-arc-quiet-ending'
const ROUTE_CHANGE_EVENT = 'workbench-route-change'
const CANONICAL_ROUTE_KEYS = [
  'scope',
  'id',
  'lens',
  'tab',
  'beatId',
  'proposalId',
  'modal',
  'view',
  'draftView',
  'branchId',
  'branchBaseline',
  'checkpointId',
  'exportProfileId',
  'reviewFilter',
  'reviewStatusFilter',
  'reviewIssueId',
  'sceneId',
  'selectedChapterId',
] as const
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
const VALID_CHAPTER_VIEWS = new Set<ChapterStructureView>(['sequence', 'outliner', 'assembly', 'backlog'])
const VALID_CHAPTER_LENSES = new Set<ChapterLens>(['structure', 'draft'])
const VALID_ASSET_VIEWS = new Set<AssetKnowledgeView>(['profile', 'mentions', 'relations', 'context'])
const VALID_ASSET_LENSES = new Set<AssetLens>(['knowledge'])
const VALID_BOOK_VIEWS = new Set<BookStructureView>(['sequence', 'outliner', 'signals'])
const VALID_BOOK_LENSES = new Set<BookLens>(['structure', 'draft'])
const VALID_BOOK_DRAFT_VIEWS = new Set<BookDraftView>(['read', 'compare', 'export', 'branch', 'review'])
const VALID_BOOK_BRANCH_BASELINES = new Set<BookBranchBaseline>(['current', 'checkpoint'])
const VALID_BOOK_REVIEW_FILTERS = new Set<BookReviewFilter>([
  'all',
  'blockers',
  'trace-gaps',
  'missing-drafts',
  'compare-deltas',
  'export-readiness',
  'branch-readiness',
  'scene-proposals',
])
const VALID_BOOK_REVIEW_STATUS_FILTERS = new Set<BookReviewStatusFilter>([
  'open',
  'reviewed',
  'deferred',
  'dismissed',
  'all',
])

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

function isBookLens(value: string | null): value is BookLens {
  return value !== null && VALID_BOOK_LENSES.has(value as BookLens)
}

function readBookLensParam(value: string | null) {
  return isBookLens(value) ? value : undefined
}

function isBookStructureView(value: string | null): value is BookStructureView {
  return value !== null && VALID_BOOK_VIEWS.has(value as BookStructureView)
}

function readBookViewParam(value: string | null) {
  return isBookStructureView(value) ? value : undefined
}

function isBookDraftView(value: string | null): value is BookDraftView {
  return value !== null && VALID_BOOK_DRAFT_VIEWS.has(value as BookDraftView)
}

function readBookDraftViewParam(value: string | null) {
  return isBookDraftView(value) ? value : undefined
}

function isBookBranchBaseline(value: string | null): value is BookBranchBaseline {
  return value !== null && VALID_BOOK_BRANCH_BASELINES.has(value as BookBranchBaseline)
}

function readBookBranchBaselineParam(value: string | null) {
  return isBookBranchBaseline(value) ? value : undefined
}

function isBookReviewFilter(value: string | null): value is BookReviewFilter {
  return value !== null && VALID_BOOK_REVIEW_FILTERS.has(value as BookReviewFilter)
}

function readBookReviewFilterParam(value: string | null) {
  return isBookReviewFilter(value) ? value : undefined
}

function isBookReviewStatusFilter(value: string | null): value is BookReviewStatusFilter {
  return value !== null && VALID_BOOK_REVIEW_STATUS_FILTERS.has(value as BookReviewStatusFilter)
}

function readBookReviewStatusFilterParam(value: string | null) {
  return isBookReviewStatusFilter(value) ? value : undefined
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
    view: route.view && VALID_CHAPTER_VIEWS.has(route.view) ? route.view : 'backlog',
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

function normalizeBookRoute(route: Partial<BookRouteState>): BookRouteState {
  const lens = route.lens && VALID_BOOK_LENSES.has(route.lens) ? route.lens : 'structure'
  const draftView =
    route.draftView && VALID_BOOK_DRAFT_VIEWS.has(route.draftView)
      ? route.draftView
      : lens === 'draft'
        ? 'read'
        : undefined
  const branchId = route.branchId?.trim() || undefined
  const branchBaseline =
    route.branchBaseline && VALID_BOOK_BRANCH_BASELINES.has(route.branchBaseline) ? route.branchBaseline : undefined
  const checkpointId = route.checkpointId?.trim() || undefined
  const exportProfileId = route.exportProfileId?.trim() || undefined
  const reviewFilter =
    route.reviewFilter && VALID_BOOK_REVIEW_FILTERS.has(route.reviewFilter)
      ? route.reviewFilter
      : draftView === 'review'
        ? 'all'
        : undefined
  const reviewStatusFilter =
    route.reviewStatusFilter && VALID_BOOK_REVIEW_STATUS_FILTERS.has(route.reviewStatusFilter)
      ? route.reviewStatusFilter
      : draftView === 'review'
        ? 'open'
        : undefined
  const reviewIssueId = route.reviewIssueId?.trim() || undefined

  return {
    scope: 'book',
    bookId: route.bookId ?? DEFAULT_BOOK_ID,
    lens,
    view: route.view && VALID_BOOK_VIEWS.has(route.view) ? route.view : 'sequence',
    draftView,
    branchId: draftView === 'branch' ? branchId ?? DEFAULT_BOOK_EXPERIMENT_BRANCH_ID : branchId,
    branchBaseline: draftView === 'branch' ? branchBaseline ?? 'current' : branchBaseline,
    checkpointId:
      draftView === 'compare' || (draftView === 'branch' && (branchBaseline ?? 'current') === 'checkpoint')
        ? checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID
        : checkpointId,
    exportProfileId: draftView === 'export' ? exportProfileId ?? DEFAULT_BOOK_EXPORT_PROFILE_ID : exportProfileId,
    reviewFilter,
    reviewStatusFilter,
    reviewIssueId,
    selectedChapterId: route.selectedChapterId,
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

function readBookSnapshot(params: URLSearchParams) {
  const activeLens = readBookLensParam(params.get('lens'))
  const activeView = readBookViewParam(params.get('view'))
  const activeDraftView = readBookDraftViewParam(params.get('draftView'))
  const activeBranchBaseline = readBookBranchBaselineParam(params.get('branchBaseline'))
  const activeReviewFilter = readBookReviewFilterParam(params.get('reviewFilter'))
  const activeReviewStatusFilter = readBookReviewStatusFilterParam(params.get('reviewStatusFilter'))

  return normalizeBookRoute({
    bookId: readTextParam(params, 'id'),
    lens: activeLens,
    view: activeView,
    draftView: activeDraftView,
    branchId: readTextParam(params, 'branchId'),
    branchBaseline: activeBranchBaseline,
    checkpointId: readTextParam(params, 'checkpointId'),
    exportProfileId: readTextParam(params, 'exportProfileId'),
    reviewFilter: activeReviewFilter,
    reviewStatusFilter: activeReviewStatusFilter,
    reviewIssueId: readTextParam(params, 'reviewIssueId'),
    selectedChapterId: readTextParam(params, 'selectedChapterId'),
  })
}

function resolveActiveRoute(state: WorkbenchSearchState): WorkbenchRouteState {
  if (state.scope === 'chapter') {
    return state.chapter
  }

  if (state.scope === 'asset') {
    return state.asset
  }

  if (state.scope === 'book') {
    return state.book
  }

  return state.scene
}

function readWorkbenchSearchState(search = typeof window === 'undefined' ? '' : window.location.search): WorkbenchSearchState {
  if (lastRouteSnapshot && search === lastRouteSearch) {
    return lastRouteSnapshot
  }

  const params = new URLSearchParams(search)
  const rawScope = params.get('scope')
  const scope: WorkbenchScope =
    rawScope === 'chapter' ? 'chapter' : rawScope === 'asset' ? 'asset' : rawScope === 'book' ? 'book' : 'scene'
  const previous = lastRouteSnapshot
  const scene = scope === 'scene' ? readSceneSnapshot(params) : previous?.scene ?? normalizeSceneRoute({})
  const chapter = scope === 'chapter' ? readChapterSnapshot(params) : previous?.chapter ?? normalizeChapterRoute({})
  const asset = scope === 'asset' ? readAssetSnapshot(params) : previous?.asset ?? normalizeAssetRoute({})
  const book = scope === 'book' ? readBookSnapshot(params) : previous?.book ?? normalizeBookRoute({})
  const snapshot: WorkbenchSearchState = {
    scope,
    scene,
    chapter,
    asset,
    book,
    route: scope === 'chapter' ? chapter : scope === 'asset' ? asset : scope === 'book' ? book : scene,
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
  } else if (state.scope === 'asset') {
    params.set('id', state.asset.assetId)
    params.set('lens', state.asset.lens)
    params.set('view', state.asset.view)
  } else {
    params.set('id', state.book.bookId)
    params.set('lens', state.book.lens)
    params.set('view', state.book.view)
    if (state.book.draftView) {
      params.set('draftView', state.book.draftView)
    }
    if (state.book.branchId) {
      params.set('branchId', state.book.branchId)
    }
    if (state.book.branchBaseline) {
      params.set('branchBaseline', state.book.branchBaseline)
    }
    if (state.book.checkpointId) {
      params.set('checkpointId', state.book.checkpointId)
    }
    if (state.book.exportProfileId) {
      params.set('exportProfileId', state.book.exportProfileId)
    }
    if (state.book.reviewFilter) {
      params.set('reviewFilter', state.book.reviewFilter)
    }
    if (state.book.reviewStatusFilter) {
      params.set('reviewStatusFilter', state.book.reviewStatusFilter)
    }
    if (state.book.reviewIssueId) {
      params.set('reviewIssueId', state.book.reviewIssueId)
    }
    if (state.book.selectedChapterId) {
      params.set('selectedChapterId', state.book.selectedChapterId)
    }
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
    route: resolveActiveRoute(state),
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
          : next.scope === 'book'
            ? {
                ...current,
                scope: 'book',
                book: normalizeBookRoute({ ...current.book, ...next, scope: 'book' }),
                route: current.book,
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
        route: resolveActiveRoute(nextState),
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
        route: resolveActiveRoute(nextState),
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
        route: resolveActiveRoute(nextState),
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
        route: resolveActiveRoute(nextState),
      }
      return
    }

    writeWorkbenchRouteState(nextState, options)
  }, [])

  const patchBookRoute = useCallback((patch: BookRoutePatch, options?: SetWorkbenchRouteOptions) => {
    const current = readWorkbenchSearchState()
    const baseSearch = typeof window === 'undefined' ? lastRouteSearch : window.location.search
    const nextBook = normalizeBookRoute({ ...current.book, ...patch, scope: 'book' })
    const nextState: WorkbenchSearchState = {
      ...current,
      book: nextBook,
      route: current.scope === 'book' ? nextBook : current.route,
    }

    const currentSearch = buildWorkbenchSearch(current, baseSearch)
    const nextSearch = buildWorkbenchSearch(nextState, baseSearch)

    if (currentSearch === nextSearch) {
      lastRouteSearch = nextSearch
      lastRouteSnapshot = {
        ...nextState,
        route: resolveActiveRoute(nextState),
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
    patchBookRoute,
  }
}
