import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'

import { createSceneClient } from '@/features/scene/api/scene-client'
import { useSceneExecutionQuery } from './useSceneExecutionQuery'
import { useProposalActions } from './useProposalActions'

const sceneId = 'scene-midnight-platform'

describe('useProposalActions', () => {
  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    const client = createSceneClient()

    return {
      queryClient,
      wrapper({ children }: PropsWithChildren) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
      client,
    }
  }

  it('accepts a proposal without introducing commit state into execution actions', async () => {
    const { wrapper, client } = createWrapper()
    const executionHook = renderHook(() => useSceneExecutionQuery(sceneId, client), { wrapper })

    await waitFor(() => {
      expect(executionHook.result.current.isLoading).toBe(false)
    })

    const pending = executionHook.result.current.proposals.find((proposal) => proposal.status === 'pending')
    expect(pending).toBeDefined()

    const actionHook = renderHook(() => useProposalActions(sceneId, client), { wrapper })

    await act(async () => {
      await actionHook.result.current.accept({ proposalId: pending!.id })
    })

    await waitFor(() => {
      const updated = executionHook.result.current.proposals.find((proposal) => proposal.id === pending!.id)
      expect(updated?.status).toBe('accepted')
    })

    expect(executionHook.result.current.acceptedSummary.patchCandidateCount).toBeGreaterThan(0)
    expect(executionHook.result.current.acceptedSummary.sceneSummary).toMatch(/accepted/i)
  })

  it('supports edit-then-accept with an edited summary while keeping commit separate', async () => {
    const { wrapper, client } = createWrapper()
    const executionHook = renderHook(() => useSceneExecutionQuery(sceneId, client), { wrapper })

    await waitFor(() => {
      expect(executionHook.result.current.isLoading).toBe(false)
    })

    const pending = executionHook.result.current.proposals.find((proposal) => proposal.status === 'pending')
    expect(pending).toBeDefined()

    const actionHook = renderHook(() => useProposalActions(sceneId, client), { wrapper })
    const editedSummary = 'Ren takes Mei\'s offer apart line by line before accepting the leverage change.'

    await act(async () => {
      await actionHook.result.current.editAccept({
        proposalId: pending!.id,
        editedSummary,
      })
    })

    await waitFor(() => {
      const updated = executionHook.result.current.proposals.find((proposal) => proposal.id === pending!.id)
      expect(updated?.status).toBe('accepted')
      expect(updated?.summary).toBe(editedSummary)
    })

    expect(executionHook.result.current.acceptedSummary.acceptedFacts[0]?.value).toBe(editedSummary)
    expect(executionHook.result.current.acceptedSummary.patchCandidateCount).toBeGreaterThan(0)
  })
})
