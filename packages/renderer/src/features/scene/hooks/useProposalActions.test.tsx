import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'
import { vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createTestProjectRuntime } from '@/app/project-runtime'
import { createSceneClient } from '@/features/scene/api/scene-client'
import { applyProposalAction, createSceneMockDatabase, getSceneDockSummary } from '@/mock/scene-fixtures'
import { useSceneDockData } from './useSceneDockData'
import { useSceneExecutionQuery } from './useSceneExecutionQuery'
import { useSceneInspectorData } from './useSceneInspectorData'
import { useProposalActions } from './useProposalActions'

const sceneId = 'scene-midnight-platform'

describe('useProposalActions', () => {
  function createWrapper(runtime = createTestProjectRuntime()) {
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
            <I18nProvider>
              <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
            </I18nProvider>
          </QueryClientProvider>
        )
      },
      client,
    }
  }

  it('uses the runtime-injected scene client across execution, inspector, dock, and proposal actions', async () => {
    const baseClient = createSceneClient()
    const runtimeClient = {
      ...baseClient,
      getSceneExecution: vi.fn(baseClient.getSceneExecution),
      getSceneInspector: vi.fn(baseClient.getSceneInspector),
      getSceneDockSummary: vi.fn(baseClient.getSceneDockSummary),
      acceptProposal: vi.fn(baseClient.acceptProposal),
    }
    const { wrapper } = createWrapper(
      createTestProjectRuntime({
        sceneClient: runtimeClient,
      }),
    )
    const executionHook = renderHook(() => useSceneExecutionQuery(sceneId), { wrapper })
    const inspectorHook = renderHook(() => useSceneInspectorData(sceneId), { wrapper })
    const dockHook = renderHook(() => useSceneDockData(sceneId, 'events'), { wrapper })

    await waitFor(() => {
      expect(executionHook.result.current.isLoading).toBe(false)
      expect(inspectorHook.result.current.isLoading).toBe(false)
      expect(dockHook.result.current.isLoading).toBe(false)
    })

    const pending = executionHook.result.current.proposals.find((proposal) => proposal.status === 'pending')
    expect(pending).toBeDefined()

    const actionHook = renderHook(() => useProposalActions(sceneId), { wrapper })

    await act(async () => {
      await actionHook.result.current.accept({ proposalId: pending!.id })
    })

    await waitFor(() => {
      expect(executionHook.result.current.proposals.find((proposal) => proposal.id === pending!.id)?.status).toBe('accepted')
    })

    expect(runtimeClient.getSceneExecution).toHaveBeenCalled()
    expect(runtimeClient.getSceneInspector).toHaveBeenCalled()
    expect(runtimeClient.getSceneDockSummary).toHaveBeenCalled()
    expect(runtimeClient.acceptProposal).toHaveBeenCalled()
  })

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

  it('refetches bridge-backed execution, inspector, and dock data after acceptance without mutating fallback fixtures', async () => {
    const localDatabase = createSceneMockDatabase()
    const bridgeDatabase = createSceneMockDatabase()
    const client = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => ({
        getSceneExecution: async () => structuredClone(bridgeDatabase.scenes[sceneId]!.execution),
        getSceneInspector: async () => structuredClone(bridgeDatabase.scenes[sceneId]!.inspector),
        getSceneDockSummary: async () => getSceneDockSummary(bridgeDatabase, sceneId),
        acceptProposal: async (_sceneId, input) => {
          applyProposalAction(bridgeDatabase, sceneId, 'accept', input)
        },
      }),
    })
    const wrapper = createWrapper().wrapper
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

    const actionHook = renderHook(() => useProposalActions(sceneId, client), { wrapper })

    await act(async () => {
      await actionHook.result.current.accept({ proposalId: pending!.id })
    })

    await waitFor(() => {
      expect(executionHook.result.current.proposals.find((proposal) => proposal.id === pending!.id)?.status).toBe('accepted')
      expect(inspectorHook.result.current.context.acceptedFacts[0]?.label).toBe(pending!.title)
      expect(dockHook.result.current.events[0]?.title).toMatch(/accepted/i)
    })

    const fallbackClient = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => undefined,
    })
    const fallbackExecution = await fallbackClient.getSceneExecution(sceneId)
    expect(fallbackExecution.proposals.find((proposal) => proposal.id === pending!.id)?.status).toBe('pending')
  })
})
