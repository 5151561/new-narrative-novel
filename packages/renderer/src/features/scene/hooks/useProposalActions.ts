import { useCallback, useState } from 'react'

import { useQueryClient } from '@tanstack/react-query'

import { sceneClient, type SceneClient } from '@/features/scene/api/scene-client'

import type { ProposalActionInput } from '../types/scene-view-models'
import { sceneQueryKeys } from './scene-query-keys'

export function useProposalActions(sceneId: string, client: SceneClient = sceneClient) {
  const queryClient = useQueryClient()
  const [isMutating, setIsMutating] = useState(false)

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
    accept: (input: ProposalActionInput) => runAction(client.acceptProposal, input),
    editAccept: (input: ProposalActionInput) => runAction(client.editAcceptProposal, input),
    requestRewrite: (input: ProposalActionInput) => runAction(client.requestRewrite, input),
    reject: (input: ProposalActionInput) => runAction(client.rejectProposal, input),
    isMutating,
  }
}
