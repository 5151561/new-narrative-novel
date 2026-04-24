import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

function createNoopPersistence() {
  return {
    async loadProjectSnapshot() {
      return null
    },
    async saveProjectSnapshot() {},
    async clearProjectSnapshot() {},
  }
}

function mockRunArtifactQueries() {
  vi.doMock('@/features/run/hooks/useRunArtifactsQuery', () => ({
    useRunArtifactsQuery: () => ({
      artifacts: [],
      error: null,
      isLoading: false,
    }),
  }))
  vi.doMock('@/features/run/hooks/useRunArtifactDetailQuery', () => ({
    useRunArtifactDetailQuery: () => ({
      artifact: null,
      error: null,
      isLoading: false,
    }),
  }))
  vi.doMock('@/features/run/hooks/useRunTraceQuery', () => ({
    useRunTraceQuery: () => ({
      trace: null,
      error: null,
      isLoading: false,
    }),
  }))
}

describe('SceneDockContainer', () => {
  beforeEach(async () => {
    vi.resetModules()
    const { useSceneUiStore } = await import('../store/scene-ui-store')
    useSceneUiStore.setState({
      filters: {},
      inspectorTab: 'context',
      dockTab: 'events',
      patchPreviewOpen: false,
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unmock('../hooks/useSceneDockData')
    vi.unmock('./scene-run-session-context')
    vi.unmock('@/features/run/hooks/useSceneRunSession')
    vi.unmock('@/features/run/hooks/useRunArtifactsQuery')
    vi.unmock('@/features/run/hooks/useRunArtifactDetailQuery')
    vi.unmock('@/features/run/hooks/useRunTraceQuery')
    vi.unmock('../components/SceneBottomDock')
  })

  it('reads active run support from the shared scene run session when the events support area is open', async () => {
    const useSharedSceneRunSession = vi.fn(() => ({
      run: {
        id: 'run-scene-midnight-platform-002',
        scope: 'scene',
        scopeId: 'scene-midnight-platform',
        status: 'waiting_review',
        title: 'Midnight platform rewrite run',
        summary: 'Waiting for review.',
        startedAtLabel: '2026-04-23 10:00',
        pendingReviewId: 'review-scene-midnight-platform-002',
        latestEventId: 'run-event-002',
        eventCount: 2,
      },
      events: [
        {
          id: 'run-event-002',
          runId: 'run-scene-midnight-platform-002',
          order: 2,
          kind: 'review_requested',
          label: 'Review requested',
          summary: 'Editorial review is waiting on the proposal set.',
          createdAtLabel: '2026-04-23 10:09',
          severity: 'warning' as const,
          refs: [{ kind: 'review' as const, id: 'review-scene-midnight-platform-002' }],
        },
      ],
      pendingReviewId: 'review-scene-midnight-platform-002',
      isReviewPending: true,
      canSubmitDecision: true,
      isPolling: true,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      startRun: vi.fn(),
      isStartingRun: false,
      submitDecision: vi.fn(),
      isSubmittingDecision: false,
    }))
    const forbiddenUseSceneRunSession = vi.fn(() => {
      throw new Error('SceneDockContainer should consume the shared scene run session, not mount its own.')
    })
    let dockProps: Record<string, unknown> | undefined

    vi.doMock('../hooks/useSceneDockData', () => ({
      useSceneDockData: () => ({
        events: [],
        trace: [],
        consistency: { summary: '', checks: [] },
        problems: { summary: '', items: [] },
        cost: { currentWindowLabel: '', trendLabel: '', breakdown: [] },
        isLoading: false,
        isHydratingTab: false,
        error: null,
      }),
    }))
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession,
    }))
    mockRunArtifactQueries()
    vi.doMock('@/features/run/hooks/useSceneRunSession', () => ({
      useSceneRunSession: forbiddenUseSceneRunSession,
    }))
    vi.doMock('../components/SceneBottomDock', () => ({
      SceneBottomDock: (props: Record<string, unknown>) => {
        dockProps = props
        return <div>scene dock</div>
      },
    }))

    const { SceneDockContainer } = await import('./SceneDockContainer')

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <I18nProvider>
          <SceneDockContainer sceneId="scene-midnight-platform" />
        </I18nProvider>
      </QueryClientProvider>,
    )

    expect(screen.getByText('scene dock')).toBeInTheDocument()
    expect(useSharedSceneRunSession).toHaveBeenCalled()
    expect(dockProps).toMatchObject({
      runSupport: expect.objectContaining({
        isReviewPending: true,
      }),
    })
  })

  it('keeps dock support disabled for non-events tabs while still using the shared session path', async () => {
    const { useSceneUiStore } = await import('../store/scene-ui-store')
    useSceneUiStore.setState({ dockTab: 'trace' })
    const useSharedSceneRunSession = vi.fn(() => ({
      run: {
        id: 'run-scene-midnight-platform-002',
        scope: 'scene',
        scopeId: 'scene-midnight-platform',
        status: 'waiting_review',
        title: 'Midnight platform rewrite run',
        summary: 'Waiting for review.',
        startedAtLabel: '2026-04-23 10:00',
        pendingReviewId: 'review-scene-midnight-platform-002',
        latestEventId: 'run-event-002',
        eventCount: 2,
      },
      events: [],
      pendingReviewId: 'review-scene-midnight-platform-002',
      isReviewPending: true,
      canSubmitDecision: true,
      isPolling: true,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      startRun: vi.fn(),
      isStartingRun: false,
      submitDecision: vi.fn(),
      isSubmittingDecision: false,
    }))
    let dockProps: Record<string, unknown> | undefined

    vi.doMock('../hooks/useSceneDockData', () => ({
      useSceneDockData: () => ({
        events: [],
        trace: [],
        consistency: { summary: '', checks: [] },
        problems: { summary: '', items: [] },
        cost: { currentWindowLabel: '', trendLabel: '', breakdown: [] },
        isLoading: false,
        isHydratingTab: false,
        error: null,
      }),
    }))
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession,
    }))
    mockRunArtifactQueries()
    vi.doMock('../components/SceneBottomDock', () => ({
      SceneBottomDock: (props: Record<string, unknown>) => {
        dockProps = props
        return <div>scene dock</div>
      },
    }))

    const { SceneDockContainer } = await import('./SceneDockContainer')

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <I18nProvider>
          <SceneDockContainer sceneId="scene-midnight-platform" />
        </I18nProvider>
      </QueryClientProvider>,
    )

    expect(useSharedSceneRunSession).toHaveBeenCalled()
    expect(dockProps).toMatchObject({
      activeTab: 'trace',
      runSupport: undefined,
    })
  })

  it('preserves selected artifact and inspector mode across non-events dock tabs for the same run', async () => {
    const user = userEvent.setup()
    const useSharedSceneRunSession = vi.fn(() => ({
      activeRunId: 'run-scene-midnight-platform-002',
      run: {
        id: 'run-scene-midnight-platform-002',
        scope: 'scene',
        scopeId: 'scene-midnight-platform',
        status: 'waiting_review',
        title: 'Midnight platform rewrite run',
        summary: 'Waiting for review.',
        startedAtLabel: '2026-04-23 10:00',
        pendingReviewId: 'review-scene-midnight-platform-002',
        latestEventId: 'run-event-002',
        eventCount: 2,
      },
      events: [],
      pendingReviewId: 'review-scene-midnight-platform-002',
      isReviewPending: true,
      canSubmitDecision: true,
      isPolling: true,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      startRun: vi.fn(),
      isStartingRun: false,
      submitDecision: vi.fn(),
      isSubmittingDecision: false,
    }))

    vi.doMock('../hooks/useSceneDockData', () => ({
      useSceneDockData: () => ({
        events: [],
        trace: [],
        consistency: { summary: '', checks: [] },
        problems: { summary: '', items: [] },
        cost: { currentWindowLabel: '', trendLabel: '', breakdown: [] },
        isLoading: false,
        isHydratingTab: false,
        error: null,
      }),
    }))
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession,
    }))
    mockRunArtifactQueries()
    vi.doMock('../components/SceneBottomDock', () => ({
      SceneBottomDock: (props: {
        activeTab: string
        runSupport?: {
          selectedArtifactId?: string | null
          inspectorMode?: string
          onInspectorModeChange?: (mode: 'artifact' | 'trace') => void
          onSelectArtifact?: (artifactId: string) => void
        }
        onTabChange: (tab: 'events' | 'trace') => void
      }) => (
        <div>
          <div data-testid="active-tab">{props.activeTab}</div>
          <div data-testid="selected-artifact">{props.runSupport?.selectedArtifactId ?? 'none'}</div>
          <div data-testid="inspector-mode">{props.runSupport?.inspectorMode ?? 'none'}</div>
          <button type="button" onClick={() => props.runSupport?.onSelectArtifact?.('ctx-scene-midnight-platform-run-002')}>
            Select artifact
          </button>
          <button type="button" onClick={() => props.runSupport?.onInspectorModeChange?.('trace')}>
            Open trace inspector
          </button>
          <button type="button" onClick={() => props.onTabChange('trace')}>
            Open trace dock tab
          </button>
          <button type="button" onClick={() => props.onTabChange('events')}>
            Open events dock tab
          </button>
        </div>
      ),
    }))

    const { SceneDockContainer } = await import('./SceneDockContainer')

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <I18nProvider>
          <SceneDockContainer sceneId="scene-midnight-platform" />
        </I18nProvider>
      </QueryClientProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Select artifact' }))
    await user.click(screen.getByRole('button', { name: 'Open trace inspector' }))

    expect(screen.getByTestId('selected-artifact')).toHaveTextContent('ctx-scene-midnight-platform-run-002')
    expect(screen.getByTestId('inspector-mode')).toHaveTextContent('trace')

    await user.click(screen.getByRole('button', { name: 'Open trace dock tab' }))
    expect(screen.getByTestId('active-tab')).toHaveTextContent('trace')
    expect(screen.getByTestId('selected-artifact')).toHaveTextContent('none')

    await user.click(screen.getByRole('button', { name: 'Open events dock tab' }))
    expect(screen.getByTestId('active-tab')).toHaveTextContent('events')
    expect(screen.getByTestId('selected-artifact')).toHaveTextContent('ctx-scene-midnight-platform-run-002')
    expect(screen.getByTestId('inspector-mode')).toHaveTextContent('trace')
  })

  it('opens run event refs, refreshes accepted artifacts, and exposes trace links inside the events dock', async () => {
    const user = userEvent.setup()
    vi.resetModules()
    vi.unmock('../hooks/useSceneDockData')
    vi.unmock('./scene-run-session-context')
    vi.unmock('../components/SceneBottomDock')
    vi.unmock('@/features/run/hooks/useSceneRunSession')
    vi.unmock('@/features/run/hooks/useRunArtifactsQuery')
    vi.unmock('@/features/run/hooks/useRunArtifactDetailQuery')
    vi.unmock('@/features/run/hooks/useRunTraceQuery')
    vi.doUnmock('../hooks/useSceneDockData')
    vi.doUnmock('./scene-run-session-context')
    vi.doUnmock('../components/SceneBottomDock')
    vi.doUnmock('@/features/run/hooks/useSceneRunSession')
    vi.doUnmock('@/features/run/hooks/useRunArtifactsQuery')
    vi.doUnmock('@/features/run/hooks/useRunArtifactDetailQuery')
    vi.doUnmock('@/features/run/hooks/useRunTraceQuery')
    const { useSceneUiStore } = await import('../store/scene-ui-store')
    useSceneUiStore.setState({
      filters: {},
      inspectorTab: 'context',
      dockTab: 'events',
      patchPreviewOpen: false,
    })
    const { AppProviders } = await import('@/app/providers')
    const { createMockProjectRuntime } = await import('@/app/project-runtime')
    const { resetMockRunDb } = await import('@/features/run/api/mock-run-db')
    const { SceneRunSessionProvider, useSharedSceneRunSession } = await import('./scene-run-session-context')
    const { SceneDockContainer } = await import('./SceneDockContainer')

    resetMockRunDb()

    function SubmitAcceptControl() {
      const session = useSharedSceneRunSession()

      return (
        <button type="button" onClick={() => void session.submitDecision({ decision: 'accept' })}>
          Submit accept
        </button>
      )
    }

    render(
      <AppProviders
        runtime={createMockProjectRuntime({ persistence: createNoopPersistence() })}
        queryClient={new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })}
      >
        <SceneRunSessionProvider
          sceneId="scene-midnight-platform"
          latestRunId="run-scene-midnight-platform-001"
        >
          <SceneDockContainer sceneId="scene-midnight-platform" />
          <SubmitAcceptControl />
        </SceneRunSessionProvider>
      </AppProviders>,
    )

    await waitFor(() => {
      expect(screen.getByText('Active Run Support')).toBeInTheDocument()
      expect(screen.getByText('Context packet built')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Open context-packet' }))

    expect(await screen.findByText('Included Assets And Reasons')).toBeInTheDocument()
    expect(screen.getByText('Excluded Private Facts And Reasons')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Submit accept' }))

    await waitFor(() => {
      expect(screen.getByText('Canon patch applied')).toBeInTheDocument()
      expect(screen.getByText('Prose generated')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Open canon-patch' }))
    expect(await screen.findByText('Accepted Facts')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open prose-draft' }))
    expect(await screen.findByText('The scene settles into view before the next reveal turns visible.')).toBeInTheDocument()

    const inspector = screen.getByRole('region', { name: 'Run Inspector' })
    await user.click(within(inspector).getByRole('button', { name: 'Trace' }))

    expect(await within(inspector).findByText('Accepted into canon')).toBeInTheDocument()
    expect(within(inspector).getByText('Rendered as prose')).toBeInTheDocument()
  })
})
