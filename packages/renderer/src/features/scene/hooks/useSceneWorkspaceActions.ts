import { useCallback, useMemo, useState } from 'react'

import { QueryClient, useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'

import { useSceneUiStore } from '../store/scene-ui-store'
import type { SceneTab } from '../types/scene-view-models'
import { sceneQueryKeys } from './scene-query-keys'
import { useSceneRouteState } from './useSceneRouteState'

interface UseSceneWorkspaceActionsOptions {
  sceneId: string
  client?: SceneClient
}

async function invalidateSceneQueries(queryClient: QueryClient, sceneId: string) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.workspace(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.execution(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.prose(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.inspector(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.dock(sceneId) }),
    queryClient.invalidateQueries({ queryKey: sceneQueryKeys.patchPreview(sceneId) }),
  ])
}

export function useSceneWorkspaceActions({ sceneId, client }: UseSceneWorkspaceActionsOptions) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const { setRoute } = useSceneRouteState()
  const setInspectorTab = useSceneUiStore((state) => state.setInspectorTab)
  const setPatchPreviewOpen = useSceneUiStore((state) => state.setPatchPreviewOpen)
  const [isMutating, setIsMutating] = useState(false)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.sceneClient,
    'useSceneWorkspaceActions',
    'options.client',
  )

  const runMutation = useCallback(
    async (mutation: () => Promise<void>) => {
      setIsMutating(true)
      try {
        await mutation()
        await invalidateSceneQueries(queryClient, sceneId)
      } finally {
        setIsMutating(false)
      }
    },
    [queryClient, sceneId],
  )

  return useMemo(
    () => ({
      isMutating,
      openTab: (tab: SceneTab) => {
        setRoute({ sceneId, tab })
      },
      openProse: () => {
        setRoute({ sceneId, tab: 'prose' })
      },
      openVersions: () => {
        setInspectorTab('versions')
      },
      openPatchPreview: () => {
        setInspectorTab('versions')
        setPatchPreviewOpen(true)
      },
      closePatchPreview: () => {
        setPatchPreviewOpen(false)
      },
      openExport: () => {
        setRoute({ sceneId, modal: 'export' })
      },
      closeExport: () => {
        setRoute({ sceneId, modal: undefined }, { replace: true })
      },
      continueRun: async () => {
        await runMutation(async () => {
          await effectiveClient.continueSceneRun(sceneId)
        })
      },
      switchThread: async (threadId: string) => {
        await runMutation(async () => {
          await effectiveClient.switchSceneThread(sceneId, threadId)
        })
      },
      commitAcceptedPatch: async (patchId: string) => {
        await runMutation(async () => {
          await effectiveClient.commitAcceptedPatch(sceneId, patchId)
        })
        setPatchPreviewOpen(false)
      },
    }),
    [effectiveClient, isMutating, runMutation, sceneId, setInspectorTab, setPatchPreviewOpen, setRoute],
  )
}
