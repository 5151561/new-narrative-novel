import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'

import { I18nProvider } from '@/app/i18n'
import { createSceneClient } from '@/features/scene/api/scene-client'
import { createSceneMockDatabase, getSceneDockSummary, getSceneDockTab } from '@/mock/scene-fixtures'
import { useSceneDockData } from './useSceneDockData'
import { useSceneInspectorData } from './useSceneInspectorData'
import { useSceneProseQuery } from './useSceneProseQuery'
import { useSceneExecutionQuery } from './useSceneExecutionQuery'
import { useSceneWorkspaceQuery } from './useSceneWorkspaceQuery'

describe('scene query hooks', () => {
  function wrapperFactory() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    return function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          <I18nProvider>{children}</I18nProvider>
        </QueryClientProvider>
      )
    }
  }

  it('hydrates workspace summary and defaults to execution-oriented data', async () => {
    const client = createSceneClient()
    const wrapper = wrapperFactory()

    const workspaceHook = renderHook(() => useSceneWorkspaceQuery('scene-midnight-platform', client), {
      wrapper,
    })

    await waitFor(() => {
      expect(workspaceHook.result.current.isLoading).toBe(false)
    })

    expect(workspaceHook.result.current.scene?.title).toBeTruthy()
    expect(workspaceHook.result.current.scene?.pendingProposalCount).toBeGreaterThan(0)

    const executionHook = renderHook(() => useSceneExecutionQuery('scene-midnight-platform', client), {
      wrapper,
    })

    await waitFor(() => {
      expect(executionHook.result.current.isLoading).toBe(false)
    })

    expect(executionHook.result.current.objective.goal).toBeTruthy()
    expect(executionHook.result.current.beats.length).toBeGreaterThan(0)
    expect(executionHook.result.current.proposals.length).toBeGreaterThan(0)
  })

  it('hydrates bridge-backed workspace, execution, prose, inspector, and dock queries and refetches from the same bridge source', async () => {
    const localDatabase = createSceneMockDatabase()
    const bridgeDatabase = createSceneMockDatabase()
    const getSceneWorkspace = vi.fn(async () => structuredClone(bridgeDatabase.scenes['scene-midnight-platform']!.workspace))
    const client = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => ({
        getSceneWorkspace,
        getSceneExecution: async () => structuredClone(bridgeDatabase.scenes['scene-midnight-platform']!.execution),
        getSceneProse: async () => structuredClone(bridgeDatabase.scenes['scene-midnight-platform']!.prose),
        getSceneInspector: async () => structuredClone(bridgeDatabase.scenes['scene-midnight-platform']!.inspector),
        getSceneDockSummary: async () => getSceneDockSummary(bridgeDatabase, 'scene-midnight-platform'),
        getSceneDockTab: async (_sceneId, tab) => getSceneDockTab(bridgeDatabase, 'scene-midnight-platform', tab),
      }),
    })
    const wrapper = wrapperFactory()

    bridgeDatabase.scenes['scene-midnight-platform']!.workspace.title = 'Bridge Workspace'
    bridgeDatabase.scenes['scene-midnight-platform']!.execution.objective.goal = 'Bridge Objective'
    bridgeDatabase.scenes['scene-midnight-platform']!.prose.statusLabel = 'Bridge prose status'
    bridgeDatabase.scenes['scene-midnight-platform']!.inspector.runtime.profile.label = 'Bridge runtime'
    bridgeDatabase.scenes['scene-midnight-platform']!.dock.trace[0]!.label = 'Bridge trace entry'

    const workspaceHook = renderHook(() => useSceneWorkspaceQuery('scene-midnight-platform', client), { wrapper })
    const executionHook = renderHook(() => useSceneExecutionQuery('scene-midnight-platform', client), { wrapper })
    const proseHook = renderHook(() => useSceneProseQuery('scene-midnight-platform', client), { wrapper })
    const inspectorHook = renderHook(() => useSceneInspectorData('scene-midnight-platform', client), { wrapper })
    const dockHook = renderHook(() => useSceneDockData('scene-midnight-platform', 'trace', client), { wrapper })

    await waitFor(() => {
      expect(workspaceHook.result.current.isLoading).toBe(false)
      expect(proseHook.result.current.isLoading).toBe(false)
      expect(inspectorHook.result.current.isLoading).toBe(false)
      expect(dockHook.result.current.isLoading).toBe(false)
      expect(dockHook.result.current.isHydratingTab).toBe(false)
    })

    expect(workspaceHook.result.current.scene?.title).toBe('Bridge Workspace')
    expect(executionHook.result.current.objective.goal).toBe('Bridge Objective')
    expect(proseHook.result.current.prose?.statusLabel).toBe('Bridge prose status')
    expect(inspectorHook.result.current.runtime.profile.label).toBe('Bridge runtime')
    expect(dockHook.result.current.trace[0]?.label).toBe('Bridge trace entry')

    bridgeDatabase.scenes['scene-midnight-platform']!.workspace.title = 'Bridge Workspace Reloaded'

    await act(async () => {
      await workspaceHook.result.current.refetch()
    })

    await waitFor(() => {
      expect(workspaceHook.result.current.scene?.title).toBe('Bridge Workspace Reloaded')
    })
    expect(getSceneWorkspace).toHaveBeenCalledTimes(2)
  })
})
