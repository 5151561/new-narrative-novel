import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

import {
  EMPTY_WORKBENCH_EDITOR_STATE,
  getWorkbenchEditorContextId,
  type WorkbenchEditorContext,
  type WorkbenchEditorContextId,
  type WorkbenchEditorController,
  type WorkbenchEditorState,
} from './workbench-editor-context'
import {
  describeWorkbenchEditorContext,
  type WorkbenchEditorDescriptor,
  type WorkbenchEditorDictionary,
} from './workbench-editor-descriptors'
import {
  DEFAULT_WORKBENCH_EDITOR_STORAGE_KEY,
  MAX_WORKBENCH_EDITOR_CONTEXTS,
  readWorkbenchEditorStorage,
  resetWorkbenchEditorStorage,
  writeWorkbenchEditorStorage,
} from './workbench-editor-storage'

interface UseWorkbenchEditorStateOptions {
  storageKey?: string
  describeContext?: (route: WorkbenchRouteState) => WorkbenchEditorDescriptor
}

const fallbackDictionary: WorkbenchEditorDictionary = {
  shell: {
    sceneEditor: 'Scene',
    chapterEditor: 'Chapter',
    assetEditor: 'Asset',
    bookEditor: 'Book',
    structureLens: 'Structure',
    orchestrateLens: 'Orchestrate',
    draftLens: 'Draft',
    knowledgeLens: 'Knowledge',
  },
}

let lastIssuedTimestamp = 0

function getEditorTimestamp() {
  const now = Date.now()
  lastIssuedTimestamp = Math.max(now, lastIssuedTimestamp + 1)
  return lastIssuedTimestamp
}

function sortAndClampContexts(contexts: WorkbenchEditorContext[]) {
  return [...contexts]
    .sort((first, second) => second.lastActiveAt - first.lastActiveAt)
    .slice(0, MAX_WORKBENCH_EDITOR_CONTEXTS)
}

function getMostRecentContext(contexts: WorkbenchEditorContext[]) {
  return sortAndClampContexts(contexts)[0] ?? null
}

function normalizeState(state: WorkbenchEditorState): WorkbenchEditorState {
  const uniqueContexts = new Map<string, WorkbenchEditorContext>()
  for (const context of state.contexts) {
    uniqueContexts.set(context.id, context)
  }
  const retainedIds = new Set(sortAndClampContexts([...uniqueContexts.values()]).map((context) => context.id))
  const orderedIds = [...state.contextIds, ...state.contexts.map((context) => context.id)]
  const contextIds = [...new Set(orderedIds)].filter((id) => retainedIds.has(id))
  const contexts = contextIds
    .map((id) => uniqueContexts.get(id))
    .filter((context): context is WorkbenchEditorContext => Boolean(context))
  const activeContextId = contexts.some((context) => context.id === state.activeContextId)
    ? state.activeContextId
    : getMostRecentContext(contexts)?.id ?? null

  return {
    contexts,
    contextIds,
    activeContextId,
  }
}

export function useWorkbenchEditorState(
  options: UseWorkbenchEditorStateOptions = {},
): WorkbenchEditorController {
  const storageKey = options.storageKey ?? DEFAULT_WORKBENCH_EDITOR_STORAGE_KEY
  const describeContext = useMemo(
    () =>
      options.describeContext ??
      ((route: WorkbenchRouteState) => describeWorkbenchEditorContext(route, fallbackDictionary)),
    [options.describeContext],
  )
  const [state, setState] = useState<WorkbenchEditorState>(() => readWorkbenchEditorStorage(storageKey))
  const stateRef = useRef(state)

  useEffect(() => {
    const nextState = readWorkbenchEditorStorage(storageKey)
    stateRef.current = nextState
    setState(nextState)
  }, [storageKey])

  const persistState = useCallback(
    (nextState: WorkbenchEditorState) => {
      const normalizedState = normalizeState(nextState)
      writeWorkbenchEditorStorage(normalizedState, storageKey)
      stateRef.current = normalizedState
      setState(normalizedState)
      return normalizedState
    },
    [storageKey],
  )

  const openOrUpdateContext = useCallback(
    (route: WorkbenchRouteState) => {
      const id = getWorkbenchEditorContextId(route)
      const timestamp = getEditorTimestamp()
      const descriptor = describeContext(route)
      let nextContext: WorkbenchEditorContext = {
        id,
        route,
        title: descriptor.title,
        subtitle: descriptor.subtitle,
        updatedAt: timestamp,
        lastActiveAt: timestamp,
      }
      const currentState = stateRef.current
      const existingContext = currentState.contexts.find((context) => context.id === id)

      if (existingContext) {
        nextContext = {
          ...existingContext,
          route,
          title: descriptor.title,
          subtitle: descriptor.subtitle,
          updatedAt: timestamp,
          lastActiveAt: timestamp,
        }
      }

      persistState({
        contexts: [nextContext, ...currentState.contexts.filter((context) => context.id !== id)],
        contextIds: currentState.contextIds.includes(id)
          ? currentState.contextIds
          : [...currentState.contextIds, id],
        activeContextId: id,
      })

      return nextContext
    },
    [describeContext, persistState],
  )

  const activateContext = useCallback(
    (id: WorkbenchEditorContextId) => {
      const timestamp = getEditorTimestamp()
      const currentState = stateRef.current
      const targetContext = currentState.contexts.find((context) => context.id === id)

      if (!targetContext) {
        return null
      }

      persistState({
        contexts: currentState.contexts.map((context) =>
          context.id === id ? { ...context, lastActiveAt: timestamp } : context,
        ),
        contextIds: currentState.contextIds,
        activeContextId: id,
      })

      return targetContext.route
    },
    [persistState],
  )

  const closeContext = useCallback(
    (id: WorkbenchEditorContextId) => {
      const currentState = stateRef.current
      const isActiveContext = currentState.activeContextId === id
      const remainingContexts = currentState.contexts.filter((context) => context.id !== id)

      if (!isActiveContext) {
        persistState({
          contexts: remainingContexts,
          contextIds: currentState.contextIds.filter((contextId) => contextId !== id),
          activeContextId: currentState.activeContextId,
        })
        return null
      }

      const fallbackContext = getMostRecentContext(remainingContexts)

      persistState({
        contexts: remainingContexts,
        contextIds: currentState.contextIds.filter((contextId) => contextId !== id),
        activeContextId: fallbackContext?.id ?? null,
      })

      return fallbackContext?.route ?? null
    },
    [persistState],
  )

  const closeOtherContexts = useCallback(
    (id: WorkbenchEditorContextId) => {
      const timestamp = getEditorTimestamp()
      const currentState = stateRef.current
      const targetContext = currentState.contexts.find((context) => context.id === id)

      if (!targetContext) {
        return null
      }

      persistState({
        contexts: [{ ...targetContext, lastActiveAt: timestamp }],
        contextIds: [id],
        activeContextId: id,
      })

      return targetContext.route
    },
    [persistState],
  )

  const resetEditorContexts = useCallback(() => {
    resetWorkbenchEditorStorage(storageKey)
    stateRef.current = EMPTY_WORKBENCH_EDITOR_STATE
    setState(EMPTY_WORKBENCH_EDITOR_STATE)
  }, [storageKey])

  const activeContext = useMemo(
    () => state.contexts.find((context) => context.id === state.activeContextId) ?? null,
    [state.activeContextId, state.contexts],
  )

  return {
    state,
    activeContext,
    openOrUpdateContext,
    activateContext,
    closeContext,
    closeOtherContexts,
    resetEditorContexts,
  }
}
