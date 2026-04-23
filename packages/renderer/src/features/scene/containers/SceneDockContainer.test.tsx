import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

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
})
