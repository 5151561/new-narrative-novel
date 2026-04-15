import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'

import { I18nProvider } from '@/app/i18n'
import { createSceneClient } from '@/features/scene/api/scene-client'
import { useSceneDockData } from './useSceneDockData'
import { useSceneExecutionQuery } from './useSceneExecutionQuery'
import { useSceneInspectorData } from './useSceneInspectorData'
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
            <I18nProvider>{children}</I18nProvider>
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

  it('keeps inspector and dock data in sync after proposal acceptance', async () => {
    const { wrapper, client } = createWrapper()
    const executionHook = renderHook(() => useSceneExecutionQuery(sceneId, client), { wrapper })
    const inspectorHook = renderHook(() => useSceneInspectorData(sceneId, client), { wrapper })
    const dockHook = renderHook(() => useSceneDockData(sceneId, 'events', client), { wrapper })

    await waitFor(() => {
      expect(executionHook.result.current.isLoading).toBe(false)
      expect(inspectorHook.result.current.isLoading).toBe(false)
      expect(dockHook.result.current.isLoading).toBe(false)
    })

    const pending = executionHook.result.current.proposals.find((proposal) => proposal.status === 'pending')
    expect(pending).toBeDefined()
    const acceptedFactsBefore = inspectorHook.result.current.context.acceptedFacts.length
    const initialDockEventTitle = dockHook.result.current.events[0]?.title

    const actionHook = renderHook(() => useProposalActions(sceneId, client), { wrapper })

    await act(async () => {
      await actionHook.result.current.accept({ proposalId: pending!.id })
    })

    await waitFor(() => {
      expect(inspectorHook.result.current.context.acceptedFacts.length).toBeGreaterThan(acceptedFactsBefore)
      expect(dockHook.result.current.events[0]?.title).not.toBe(initialDockEventTitle)
    })

    expect(inspectorHook.result.current.context.acceptedFacts[0]?.label).toBe(pending!.title)
    expect(dockHook.result.current.events[0]?.title).toMatch(/accepted/i)
  })
})
