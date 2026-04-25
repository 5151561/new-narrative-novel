import type {
  AssetKnowledgeView,
  AssetRouteState,
  BookBranchBaseline,
  BookDraftView,
  BookReviewFilter,
  BookReviewStatusFilter,
  BookRouteState,
  BookStructureView,
  ChapterRouteState,
  ChapterStructureView,
  SceneRouteModal,
  SceneRouteState,
  WorkbenchRouteState,
} from '@/features/workbench/types/workbench-route'
import type { SceneTab } from '@/features/scene/types/scene-view-models'

import {
  EMPTY_WORKBENCH_EDITOR_STATE,
  getWorkbenchEditorContextId,
  type WorkbenchEditorContext,
  type WorkbenchEditorState,
} from './workbench-editor-context'

export const DEFAULT_WORKBENCH_EDITOR_STORAGE_KEY = 'narrative-workbench-editors:v1'
export const MAX_WORKBENCH_EDITOR_CONTEXTS = 12

const VALID_SCENE_TABS = new Set<SceneTab>(['setup', 'execution', 'prose'])
const VALID_SCENE_LENSES = new Set<SceneRouteState['lens']>(['structure', 'orchestrate', 'draft'])
const VALID_SCENE_MODALS = new Set<SceneRouteModal>(['export'])
const VALID_CHAPTER_LENSES = new Set<ChapterRouteState['lens']>(['structure', 'draft'])
const VALID_CHAPTER_VIEWS = new Set<ChapterStructureView>(['sequence', 'outliner', 'assembly'])
const VALID_ASSET_LENSES = new Set<AssetRouteState['lens']>(['knowledge'])
const VALID_ASSET_VIEWS = new Set<AssetKnowledgeView>(['profile', 'mentions', 'relations', 'context'])
const VALID_BOOK_LENSES = new Set<BookRouteState['lens']>(['structure', 'draft'])
const VALID_BOOK_VIEWS = new Set<BookStructureView>(['sequence', 'outliner', 'signals'])
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readRequiredString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function readOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined
}

function parseSceneRoute(value: Record<string, unknown>): SceneRouteState | null {
  const sceneId = readRequiredString(value.sceneId)
  const lens = value.lens
  const tab = value.tab
  const modal = value.modal

  if (!sceneId || !VALID_SCENE_LENSES.has(lens as SceneRouteState['lens']) || !VALID_SCENE_TABS.has(tab as SceneTab)) {
    return null
  }

  return {
    scope: 'scene',
    sceneId,
    lens: lens as SceneRouteState['lens'],
    tab: tab as SceneTab,
    beatId: readOptionalString(value.beatId),
    proposalId: readOptionalString(value.proposalId),
    modal: VALID_SCENE_MODALS.has(modal as SceneRouteModal) ? (modal as SceneRouteModal) : undefined,
  }
}

function parseChapterRoute(value: Record<string, unknown>): ChapterRouteState | null {
  const chapterId = readRequiredString(value.chapterId)
  const lens = value.lens
  const view = value.view

  if (
    !chapterId ||
    !VALID_CHAPTER_LENSES.has(lens as ChapterRouteState['lens']) ||
    !VALID_CHAPTER_VIEWS.has(view as ChapterStructureView)
  ) {
    return null
  }

  return {
    scope: 'chapter',
    chapterId,
    lens: lens as ChapterRouteState['lens'],
    view: view as ChapterStructureView,
    sceneId: readOptionalString(value.sceneId),
  }
}

function parseAssetRoute(value: Record<string, unknown>): AssetRouteState | null {
  const assetId = readRequiredString(value.assetId)
  const lens = value.lens
  const view = value.view

  if (
    !assetId ||
    !VALID_ASSET_LENSES.has(lens as AssetRouteState['lens']) ||
    !VALID_ASSET_VIEWS.has(view as AssetKnowledgeView)
  ) {
    return null
  }

  return {
    scope: 'asset',
    assetId,
    lens: 'knowledge',
    view: view as AssetKnowledgeView,
  }
}

function parseBookRoute(value: Record<string, unknown>): BookRouteState | null {
  const bookId = readRequiredString(value.bookId)
  const lens = value.lens
  const view = value.view
  const draftView = value.draftView
  const branchBaseline = value.branchBaseline
  const reviewFilter = value.reviewFilter
  const reviewStatusFilter = value.reviewStatusFilter

  if (
    !bookId ||
    !VALID_BOOK_LENSES.has(lens as BookRouteState['lens']) ||
    !VALID_BOOK_VIEWS.has(view as BookStructureView)
  ) {
    return null
  }

  return {
    scope: 'book',
    bookId,
    lens: lens as BookRouteState['lens'],
    view: view as BookStructureView,
    draftView: VALID_BOOK_DRAFT_VIEWS.has(draftView as BookDraftView) ? (draftView as BookDraftView) : undefined,
    branchId: readOptionalString(value.branchId),
    branchBaseline: VALID_BOOK_BRANCH_BASELINES.has(branchBaseline as BookBranchBaseline)
      ? (branchBaseline as BookBranchBaseline)
      : undefined,
    checkpointId: readOptionalString(value.checkpointId),
    exportProfileId: readOptionalString(value.exportProfileId),
    reviewFilter: VALID_BOOK_REVIEW_FILTERS.has(reviewFilter as BookReviewFilter)
      ? (reviewFilter as BookReviewFilter)
      : undefined,
    reviewStatusFilter: VALID_BOOK_REVIEW_STATUS_FILTERS.has(reviewStatusFilter as BookReviewStatusFilter)
      ? (reviewStatusFilter as BookReviewStatusFilter)
      : undefined,
    reviewIssueId: readOptionalString(value.reviewIssueId),
    selectedChapterId: readOptionalString(value.selectedChapterId),
  }
}

export function parseWorkbenchEditorRoute(value: unknown): WorkbenchRouteState | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.scope === 'chapter') {
    return parseChapterRoute(value)
  }

  if (value.scope === 'asset') {
    return parseAssetRoute(value)
  }

  if (value.scope === 'book') {
    return parseBookRoute(value)
  }

  if (value.scope === 'scene') {
    return parseSceneRoute(value)
  }

  return null
}

function parseWorkbenchEditorContext(value: unknown): WorkbenchEditorContext | null {
  if (!isRecord(value)) {
    return null
  }

  const route = parseWorkbenchEditorRoute(value.route)
  const id = readRequiredString(value.id)
  const updatedAt = typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt) ? value.updatedAt : undefined
  const lastActiveAt =
    typeof value.lastActiveAt === 'number' && Number.isFinite(value.lastActiveAt) ? value.lastActiveAt : undefined

  if (!route || !id || updatedAt == null || lastActiveAt == null || id !== getWorkbenchEditorContextId(route)) {
    return null
  }

  return {
    id,
    route,
    title: readRequiredString(value.title) ?? id,
    subtitle: readRequiredString(value.subtitle) ?? id,
    updatedAt,
    lastActiveAt,
  }
}

function normalizeWorkbenchEditorState(value: unknown): WorkbenchEditorState {
  if (!isRecord(value) || !Array.isArray(value.contexts)) {
    return EMPTY_WORKBENCH_EDITOR_STATE
  }

  const uniqueContexts = new Map<string, WorkbenchEditorContext>()

  for (const rawContext of value.contexts) {
    const context = parseWorkbenchEditorContext(rawContext)

    if (!context) {
      continue
    }

    const existing = uniqueContexts.get(context.id)
    if (!existing || existing.lastActiveAt <= context.lastActiveAt) {
      uniqueContexts.set(context.id, context)
    }
  }

  const retainedIds = new Set(
    [...uniqueContexts.values()]
    .sort((first, second) => second.lastActiveAt - first.lastActiveAt)
      .slice(0, MAX_WORKBENCH_EDITOR_CONTEXTS)
      .map((context) => context.id),
  )
  const storedContextIds = Array.isArray(value.contextIds)
    ? value.contextIds.filter((id): id is string => typeof id === 'string')
    : []
  const orderedIds = [...storedContextIds, ...value.contexts.map((context) => (isRecord(context) ? context.id : null))]
  const contextIds = [...new Set(orderedIds)].filter(
    (id): id is string => typeof id === 'string' && retainedIds.has(id),
  )
  const contexts = contextIds.map((id) => uniqueContexts.get(id)).filter((context): context is WorkbenchEditorContext => Boolean(context))
  const requestedActiveContextId = readOptionalString(value.activeContextId) ?? null
  const activeContextId = contexts.some((context) => context.id === requestedActiveContextId)
    ? requestedActiveContextId
    : [...contexts].sort((first, second) => second.lastActiveAt - first.lastActiveAt)[0]?.id ?? null

  return {
    contexts,
    contextIds,
    activeContextId,
  }
}

export function readWorkbenchEditorStorage(
  storageKey = DEFAULT_WORKBENCH_EDITOR_STORAGE_KEY,
): WorkbenchEditorState {
  if (typeof window === 'undefined') {
    return EMPTY_WORKBENCH_EDITOR_STATE
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey)
    if (!storedValue) {
      return EMPTY_WORKBENCH_EDITOR_STATE
    }

    return normalizeWorkbenchEditorState(JSON.parse(storedValue))
  } catch {
    return EMPTY_WORKBENCH_EDITOR_STATE
  }
}

export function writeWorkbenchEditorStorage(
  state: WorkbenchEditorState,
  storageKey = DEFAULT_WORKBENCH_EDITOR_STORAGE_KEY,
) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const normalizedState = normalizeWorkbenchEditorState(state)
    window.localStorage.setItem(storageKey, JSON.stringify(normalizedState))
  } catch {
    // Editor persistence is local preference state and must not block in-memory updates.
  }
}

export function resetWorkbenchEditorStorage(storageKey = DEFAULT_WORKBENCH_EDITOR_STORAGE_KEY) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Storage may be unavailable or denied by the host.
  }
}
