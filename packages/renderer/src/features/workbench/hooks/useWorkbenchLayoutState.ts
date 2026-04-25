import { useCallback, useEffect, useState } from 'react'

import {
  DEFAULT_WORKBENCH_LAYOUT_STATE,
  clampWorkbenchLayoutState,
  parseWorkbenchLayoutState,
  serializeWorkbenchLayoutState,
  type WorkbenchLayoutPart,
  type WorkbenchLayoutState,
} from '../types/workbench-layout'

export const DEFAULT_WORKBENCH_LAYOUT_STORAGE_KEY = 'narrative-workbench-layout:v1'

export interface WorkbenchLayoutController {
  state: WorkbenchLayoutState
  setPartVisible: (part: WorkbenchLayoutPart, visible: boolean) => void
  togglePart: (part: WorkbenchLayoutPart) => void
  resizePart: (part: WorkbenchLayoutPart, delta: number) => void
  setBottomDockMaximized: (maximized: boolean) => void
  toggleBottomDockMaximized: () => void
  resetLayout: () => void
}

interface StoredWorkbenchLayoutState {
  storageKey: string
  state: WorkbenchLayoutState
}

function getStorage() {
  return typeof window === 'undefined' ? undefined : window.localStorage
}

function readStoredWorkbenchLayoutState(storageKey: string) {
  try {
    return parseWorkbenchLayoutState(getStorage()?.getItem(storageKey) ?? null)
  } catch {
    return DEFAULT_WORKBENCH_LAYOUT_STATE
  }
}

function writeStoredWorkbenchLayoutState(storageKey: string, state: WorkbenchLayoutState) {
  try {
    getStorage()?.setItem(storageKey, serializeWorkbenchLayoutState(state))
  } catch {
    // Layout persistence should never block rendering or local state updates.
  }
}

export function resetWorkbenchLayoutStorage(storageKey = DEFAULT_WORKBENCH_LAYOUT_STORAGE_KEY): void {
  try {
    getStorage()?.removeItem(storageKey)
  } catch {
    // Storage may be unavailable in non-browser hosts.
  }
}

export function useWorkbenchLayoutState(
  storageKey = DEFAULT_WORKBENCH_LAYOUT_STORAGE_KEY,
): WorkbenchLayoutController {
  const [storedLayout, setStoredLayout] = useState<StoredWorkbenchLayoutState>(() => ({
    storageKey,
    state: readStoredWorkbenchLayoutState(storageKey),
  }))

  useEffect(() => {
    if (storedLayout.storageKey !== storageKey) {
      setStoredLayout({
        storageKey,
        state: readStoredWorkbenchLayoutState(storageKey),
      })
      return
    }

    writeStoredWorkbenchLayoutState(storedLayout.storageKey, storedLayout.state)
  }, [storageKey, storedLayout])

  const setPartVisible = useCallback((part: WorkbenchLayoutPart, visible: boolean) => {
    setStoredLayout((currentLayout) => {
      const currentState = currentLayout.state

      switch (part) {
        case 'navigator':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({ ...currentState, navigatorVisible: visible }),
          }
        case 'inspector':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({ ...currentState, inspectorVisible: visible }),
          }
        case 'bottomDock':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({ ...currentState, bottomDockVisible: visible }),
          }
      }
    })
  }, [])

  const togglePart = useCallback((part: WorkbenchLayoutPart) => {
    setStoredLayout((currentLayout) => {
      const currentState = currentLayout.state

      switch (part) {
        case 'navigator':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({
              ...currentState,
              navigatorVisible: !currentState.navigatorVisible,
            }),
          }
        case 'inspector':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({
              ...currentState,
              inspectorVisible: !currentState.inspectorVisible,
            }),
          }
        case 'bottomDock':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({
              ...currentState,
              bottomDockVisible: !currentState.bottomDockVisible,
            }),
          }
      }
    })
  }, [])

  const resizePart = useCallback((part: WorkbenchLayoutPart, delta: number) => {
    setStoredLayout((currentLayout) => {
      const currentState = currentLayout.state

      switch (part) {
        case 'navigator':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({
              ...currentState,
              navigatorWidth: currentState.navigatorWidth + delta,
            }),
          }
        case 'inspector':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({
              ...currentState,
              inspectorWidth: currentState.inspectorWidth + delta,
            }),
          }
        case 'bottomDock':
          return {
            ...currentLayout,
            state: clampWorkbenchLayoutState({
              ...currentState,
              bottomDockHeight: currentState.bottomDockHeight + delta,
            }),
          }
      }
    })
  }, [])

  const setBottomDockMaximized = useCallback((maximized: boolean) => {
    setStoredLayout((currentLayout) => ({
      ...currentLayout,
      state: clampWorkbenchLayoutState({ ...currentLayout.state, bottomDockMaximized: maximized }),
    }))
  }, [])

  const toggleBottomDockMaximized = useCallback(() => {
    setStoredLayout((currentLayout) => ({
      ...currentLayout,
      state: clampWorkbenchLayoutState({
        ...currentLayout.state,
        bottomDockMaximized: !currentLayout.state.bottomDockMaximized,
      }),
    }))
  }, [])

  const resetLayout = useCallback(() => {
    setStoredLayout((currentLayout) => {
      writeStoredWorkbenchLayoutState(currentLayout.storageKey, DEFAULT_WORKBENCH_LAYOUT_STATE)

      return {
        ...currentLayout,
        state: DEFAULT_WORKBENCH_LAYOUT_STATE,
      }
    })
  }, [])

  return {
    state: storedLayout.state,
    setPartVisible,
    togglePart,
    resizePart,
    setBottomDockMaximized,
    toggleBottomDockMaximized,
    resetLayout,
  }
}
