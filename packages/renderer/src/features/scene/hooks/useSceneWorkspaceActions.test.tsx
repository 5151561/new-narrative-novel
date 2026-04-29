import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'
import { vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createTestProjectRuntime } from '@/app/project-runtime'
import { createSceneClient } from '@/features/scene/api/scene-client'
import {
  commitAcceptedPatch,
  continueSceneRun,
  createSceneMockDatabase,
  getSceneDockSummary,
  getSceneDockTab,
  previewAcceptedPatch,
  switchSceneThread,
} from '@/mock/scene-fixtures'

import { useSceneUiStore } from '../store/scene-ui-store'
import { useSceneExecutionQuery } from './useSceneExecutionQuery'
import { useScenePatchPreview } from './useScenePatchPreview'
import { useSceneProseQuery } from './useSceneProseQuery'
import { useSceneRouteState } from './useSceneRouteState'
import { useSceneWorkspaceActions } from './useSceneWorkspaceActions'
import { useSceneWorkspaceQuery } from './useSceneWorkspaceQuery'

const sceneId = 'scene-midnight-platform'

describe('useSceneWorkspaceActions', () => {
  afterEach(() => {
    useSceneUiStore.setState({
      filters: {},
      inspectorTab: 'context',
      dockTab: 'events',
      patchPreviewOpen: false,
    })
  })

  function createWrapper(runtime = createTestProjectRuntime()) {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

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
    }
  }

  function createBridgeClient() {
    const localDatabase = createSceneMockDatabase()
    const bridgeDatabase = createSceneMockDatabase()
    const bridgeClient = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => ({
        getSceneWorkspace: async () => structuredClone(bridgeDatabase.scenes[sceneId]!.workspace),
        getSceneExecution: async () => structuredClone(bridgeDatabase.scenes[sceneId]!.execution),
        getSceneProse: async () => structuredClone(bridgeDatabase.scenes[sceneId]!.prose),
        getSceneInspector: async () => structuredClone(bridgeDatabase.scenes[sceneId]!.inspector),
        getSceneDockSummary: async () => getSceneDockSummary(bridgeDatabase, sceneId),
        getSceneDockTab: async (_sceneId, tab) => getSceneDockTab(bridgeDatabase, sceneId, tab),
        previewAcceptedPatch: async () => previewAcceptedPatch(bridgeDatabase, sceneId),
        continueSceneRun: async () => {
          continueSceneRun(bridgeDatabase, sceneId)
        },
        switchSceneThread: async (_sceneId, threadId) => {
          switchSceneThread(bridgeDatabase, sceneId, threadId)
        },
        commitAcceptedPatch: async (_sceneId, patchId) => {
          commitAcceptedPatch(bridgeDatabase, sceneId, patchId)
        },
      }),
    })

    const fallbackClient = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => undefined,
    })

    return { bridgeClient, fallbackClient }
  }

  it('uses the runtime-injected scene client for workspace, prose, patch preview, and workspace actions', async () => {
    const { bridgeClient } = createBridgeClient()
    const runtimeClient = {
      ...bridgeClient,
      getSceneWorkspace: vi.fn(bridgeClient.getSceneWorkspace),
      getSceneProse: vi.fn(bridgeClient.getSceneProse),
      previewAcceptedPatch: vi.fn(bridgeClient.previewAcceptedPatch),
      commitAcceptedPatch: vi.fn(bridgeClient.commitAcceptedPatch),
    }
    const { wrapper } = createWrapper(
      createTestProjectRuntime({
        sceneClient: runtimeClient,
      }),
    )
    useSceneUiStore.getState().setPatchPreviewOpen(true)

    const workspaceHook = renderHook(() => useSceneWorkspaceQuery(sceneId), { wrapper })
    const proseHook = renderHook(() => useSceneProseQuery(sceneId), { wrapper })
    const patchPreviewHook = renderHook(() => useScenePatchPreview(sceneId, true), { wrapper })
    const actionsHook = renderHook(() => useSceneWorkspaceActions({ sceneId }), { wrapper })

    await waitFor(() => {
      expect(workspaceHook.result.current.isLoading).toBe(false)
      expect(proseHook.result.current.isLoading).toBe(false)
      expect(patchPreviewHook.result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await actionsHook.result.current.commitAcceptedPatch(patchPreviewHook.result.current.preview!.patchId)
    })

    await waitFor(() => {
      expect(patchPreviewHook.result.current.preview).toBeNull()
    })

    expect(runtimeClient.getSceneWorkspace).toHaveBeenCalled()
    expect(runtimeClient.getSceneProse).toHaveBeenCalled()
    expect(runtimeClient.previewAcceptedPatch).toHaveBeenCalled()
    expect(runtimeClient.commitAcceptedPatch).toHaveBeenCalled()
  })

  it('keeps scene lens and tab aligned when workspace actions switch tabs', async () => {
    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=structure&tab=setup')

    const { wrapper } = createWrapper()
    const routeHook = renderHook(() => useSceneRouteState(), { wrapper })
    const actionsHook = renderHook(() => useSceneWorkspaceActions({ sceneId }), { wrapper })

    act(() => {
      actionsHook.result.current.openTab('execution')
    })

    await waitFor(() => {
      expect(routeHook.result.current.route.lens).toBe('orchestrate')
      expect(routeHook.result.current.route.tab).toBe('execution')
    })

    act(() => {
      actionsHook.result.current.openTab('prose')
    })

    await waitFor(() => {
      expect(routeHook.result.current.route.lens).toBe('draft')
      expect(routeHook.result.current.route.tab).toBe('prose')
    })

    act(() => {
      actionsHook.result.current.openTab('setup')
    })

    await waitFor(() => {
      expect(routeHook.result.current.route.lens).toBe('structure')
      expect(routeHook.result.current.route.tab).toBe('setup')
    })
  })

  it('refetches bridge-backed execution after continue run without mutating fallback fixtures', async () => {
    const { bridgeClient, fallbackClient } = createBridgeClient()
    const { wrapper } = createWrapper()
    const workspaceHook = renderHook(() => useSceneWorkspaceQuery(sceneId, bridgeClient), { wrapper })
    const executionHook = renderHook(() => useSceneExecutionQuery(sceneId, bridgeClient), { wrapper })
    const actionsHook = renderHook(() => useSceneWorkspaceActions({ sceneId, client: bridgeClient }), { wrapper })

    await waitFor(() => {
      expect(workspaceHook.result.current.isLoading).toBe(false)
      expect(executionHook.result.current.isLoading).toBe(false)
    })

    expect(workspaceHook.result.current.scene?.runStatus).toBe('paused')
    expect(executionHook.result.current.canContinueRun).toBe(true)

    await act(async () => {
      await actionsHook.result.current.continueRun()
    })

    await waitFor(() => {
      expect(workspaceHook.result.current.scene?.runStatus).toBe('running')
      expect(executionHook.result.current.canContinueRun).toBe(false)
    })

    const fallbackWorkspace = await fallbackClient.getSceneWorkspace(sceneId)
    const fallbackExecution = await fallbackClient.getSceneExecution(sceneId)
    expect(fallbackWorkspace.runStatus).toBe('paused')
    expect(fallbackExecution.canContinueRun).toBe(true)
  })

  it('refetches bridge-backed workspace and prose after thread switching without mutating fallback fixtures', async () => {
    const { bridgeClient, fallbackClient } = createBridgeClient()
    const { wrapper } = createWrapper()
    const workspaceHook = renderHook(() => useSceneWorkspaceQuery(sceneId, bridgeClient), { wrapper })
    const proseHook = renderHook(() => useSceneProseQuery(sceneId, bridgeClient), { wrapper })
    const actionsHook = renderHook(() => useSceneWorkspaceActions({ sceneId, client: bridgeClient }), { wrapper })

    await waitFor(() => {
      expect(workspaceHook.result.current.isLoading).toBe(false)
      expect(proseHook.result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await actionsHook.result.current.switchThread('thread-branch-a')
    })

    await waitFor(() => {
      expect(workspaceHook.result.current.scene?.activeThreadId).toBe('thread-branch-a')
      expect(workspaceHook.result.current.scene?.objective).toBe(
        'Alternate thread keeps Mei on the stronger bargaining line while Ren yields no public ground.',
      )
      expect(proseHook.result.current.prose?.statusLabel).toBe('Alt Beat thread ready for revision pass')
    })

    const fallbackWorkspace = await fallbackClient.getSceneWorkspace(sceneId)
    const fallbackProse = await fallbackClient.getSceneProse(sceneId)
    expect(fallbackWorkspace.activeThreadId).toBe('thread-main')
    expect(fallbackProse.statusLabel).not.toBe('Branch thread draft retains the sharper bargaining cadence.')
  })

  it('refetches bridge-backed patch preview and prose after commit while keeping commit separate from accept state', async () => {
    const { bridgeClient, fallbackClient } = createBridgeClient()
    const { wrapper } = createWrapper()
    useSceneUiStore.getState().setPatchPreviewOpen(true)

    const workspaceHook = renderHook(() => useSceneWorkspaceQuery(sceneId, bridgeClient), { wrapper })
    const executionHook = renderHook(() => useSceneExecutionQuery(sceneId, bridgeClient), { wrapper })
    const proseHook = renderHook(() => useSceneProseQuery(sceneId, bridgeClient), { wrapper })
    const patchPreviewHook = renderHook(() => useScenePatchPreview(sceneId, true, bridgeClient), { wrapper })
    const actionsHook = renderHook(() => useSceneWorkspaceActions({ sceneId, client: bridgeClient }), { wrapper })

    await waitFor(() => {
      expect(workspaceHook.result.current.isLoading).toBe(false)
      expect(proseHook.result.current.isLoading).toBe(false)
      expect(patchPreviewHook.result.current.isLoading).toBe(false)
    })

    const previewBeforeCommit = patchPreviewHook.result.current.preview
    expect(previewBeforeCommit).not.toBeNull()
    expect(workspaceHook.result.current.scene?.status).toBe('review')
    expect(executionHook.result.current.acceptedSummary.patchCandidateCount).toBeGreaterThan(0)

    await act(async () => {
      await actionsHook.result.current.commitAcceptedPatch(previewBeforeCommit!.patchId)
    })

    await waitFor(() => {
      expect(workspaceHook.result.current.scene?.status).toBe('committed')
      expect(proseHook.result.current.prose?.latestDiffSummary).toBeTruthy()
      expect(patchPreviewHook.result.current.preview).toBeNull()
      expect(useSceneUiStore.getState().patchPreviewOpen).toBe(false)
    })

    expect(executionHook.result.current.acceptedSummary.patchCandidateCount).toBe(0)
    expect(executionHook.result.current.acceptedSummary.acceptedFacts.length).toBeGreaterThan(0)

    const fallbackWorkspace = await fallbackClient.getSceneWorkspace(sceneId)
    const fallbackProse = await fallbackClient.getSceneProse(sceneId)
    const fallbackPreview = await fallbackClient.previewAcceptedPatch(sceneId)
    expect(fallbackWorkspace.status).toBe('review')
    expect(fallbackProse.latestDiffSummary).not.toBe(proseHook.result.current.prose?.latestDiffSummary)
    expect(fallbackPreview?.patchId).toBe(previewBeforeCommit!.patchId)
  })
})
