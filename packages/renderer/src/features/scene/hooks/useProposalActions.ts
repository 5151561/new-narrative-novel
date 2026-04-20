import { useCallback, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { resolveProjectRuntimeDependency, useOptionalProjectRuntime } from '@/app/project-runtime'
import type { SceneClient } from '@/features/scene/api/scene-client'

import type { ProposalActionInput } from '../types/scene-view-models'
import { sceneQueryKeys } from './scene-query-keys'

export function useProposalActions(sceneId: string, client?: SceneClient) {
  const runtime = useOptionalProjectRuntime()
  const queryClient = useQueryClient()
  const [isMutating, setIsMutating] = useState(false)
  const effectiveClient = resolveProjectRuntimeDependency(
    client,
    runtime?.sceneClient,
    'useProposalActions',
    'client',
  )

  const runAction = useCallback(
    async (action: (sceneId: string, input: ProposalActionInput) => Promise<void>, input: ProposalActionInput) => {
      setIsMutating(true)
      try {
        await action(sceneId, input)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: sceneQueryKeys.workspace(sceneId) }),
          queryClient.invalidateQueries({ queryKey: sceneQueryKeys.execution(sceneId) }),
          queryClient.invalidateQueries({ queryKey: sceneQueryKeys.inspector(sceneId) }),
          queryClient.invalidateQueries({ queryKey: sceneQueryKeys.dock(sceneId) }),
          queryClient.invalidateQueries({ queryKey: sceneQueryKeys.patchPreview(sceneId) }),
        ])
      } finally {
        setIsMutating(false)
      }
    },
    [queryClient, sceneId],
  )

  return {
    accept: (input: ProposalActionInput) => runAction(effectiveClient.acceptProposal, input),
    editAccept: (input: ProposalActionInput) => runAction(effectiveClient.editAcceptProposal, input),
    requestRewrite: (input: ProposalActionInput) => runAction(effectiveClient.requestRewrite, input),
    reject: (input: ProposalActionInput) => runAction(effectiveClient.rejectProposal, input),
    isMutating,
  }
}
