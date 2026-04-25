import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react'

import { useI18n } from '@/app/i18n'
import type { WorkbenchRouteState } from '@/features/workbench/types/workbench-route'

import type { WorkbenchEditorContextId, WorkbenchEditorController } from './workbench-editor-context'
import { describeWorkbenchEditorContext } from './workbench-editor-descriptors'
import { useWorkbenchEditorState } from './useWorkbenchEditorState'

interface WorkbenchEditorProviderProps extends PropsWithChildren {
  route: WorkbenchRouteState
  replaceRoute: (route: WorkbenchRouteState) => void
  storageKey?: string
}

const WorkbenchEditorContext = createContext<WorkbenchEditorController | null>(null)

export function WorkbenchEditorProvider({
  route,
  replaceRoute,
  storageKey,
  children,
}: WorkbenchEditorProviderProps) {
  const { dictionary } = useI18n()
  const describeContext = useCallback(
    (nextRoute: WorkbenchRouteState) => describeWorkbenchEditorContext(nextRoute, dictionary),
    [dictionary],
  )
  const editorState = useWorkbenchEditorState({
    storageKey,
    describeContext,
  })

  useEffect(() => {
    editorState.openOrUpdateContext(route)
  }, [editorState.openOrUpdateContext, route])

  const controller = useMemo<WorkbenchEditorController>(() => {
    const activateContext = (id: WorkbenchEditorContextId) => {
      const nextRoute = editorState.activateContext(id)
      if (nextRoute) {
        replaceRoute(nextRoute)
      }

      return nextRoute
    }

    const closeContext = (id: WorkbenchEditorContextId) => {
      const nextRoute = editorState.closeContext(id)
      if (nextRoute) {
        replaceRoute(nextRoute)
      }

      return nextRoute
    }

    const closeOtherContexts = (id: WorkbenchEditorContextId) => {
      const nextRoute = editorState.closeOtherContexts(id)
      if (nextRoute) {
        replaceRoute(nextRoute)
      }

      return nextRoute
    }

    return {
      ...editorState,
      activateContext,
      closeContext,
      closeOtherContexts,
    }
  }, [editorState, replaceRoute])

  return <WorkbenchEditorContext.Provider value={controller}>{children}</WorkbenchEditorContext.Provider>
}

export function useOptionalWorkbenchEditor() {
  return useContext(WorkbenchEditorContext)
}

export function useWorkbenchEditor() {
  return useOptionalWorkbenchEditor()
}
