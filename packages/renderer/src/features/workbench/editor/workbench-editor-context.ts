import type { WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

export type WorkbenchEditorContextId = string

export interface WorkbenchEditorContext {
  id: WorkbenchEditorContextId
  route: WorkbenchRouteState
  title: string
  subtitle: string
  updatedAt: number
  lastActiveAt: number
}

export interface WorkbenchEditorState {
  contexts: WorkbenchEditorContext[]
  contextIds: WorkbenchEditorContextId[]
  activeContextId: WorkbenchEditorContextId | null
}

export interface WorkbenchEditorController {
  state: WorkbenchEditorState
  activeContext: WorkbenchEditorContext | null
  openOrUpdateContext: (route: WorkbenchRouteState) => WorkbenchEditorContext
  activateContext: (id: WorkbenchEditorContextId) => WorkbenchRouteState | null
  closeContext: (id: WorkbenchEditorContextId) => WorkbenchRouteState | null
  closeOtherContexts: (id: WorkbenchEditorContextId) => WorkbenchRouteState | null
  resetEditorContexts: () => void
}

export const EMPTY_WORKBENCH_EDITOR_STATE: WorkbenchEditorState = {
  contexts: [],
  contextIds: [],
  activeContextId: null,
}

export function getWorkbenchEditorContextId(route: WorkbenchRouteState): WorkbenchEditorContextId {
  if (route.scope === 'chapter') {
    return `chapter:${route.chapterId}:${route.lens}`
  }

  if (route.scope === 'asset') {
    return `asset:${route.assetId}:knowledge`
  }

  if (route.scope === 'book') {
    return `book:${route.bookId}:${route.lens}`
  }

  return `scene:${route.sceneId}:${route.lens}`
}
