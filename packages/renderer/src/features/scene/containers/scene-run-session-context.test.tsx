import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

describe('SceneRunSessionProvider', () => {
  it('prepares one shared scene run session for multiple consumers in the same scene scope', async () => {
    const sharedSession = {
      run: {
        id: 'run-scene-midnight-platform-002',
        scope: 'scene' as const,
        scopeId: 'scene-midnight-platform',
        status: 'waiting_review' as const,
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
    }
    const useSceneRunSession = vi.fn(() => sharedSession)

    vi.doMock('@/features/run/hooks/useSceneRunSession', () => ({
      useSceneRunSession,
    }))

    const { SceneRunSessionProvider, useSharedSceneRunSession } = await import('./scene-run-session-context')

    function RunTitleConsumer() {
      return <div>{useSharedSceneRunSession().run?.title}</div>
    }

    function RunStatusConsumer() {
      return <div>{useSharedSceneRunSession().run?.status}</div>
    }

    render(
      <SceneRunSessionProvider
        sceneId="scene-midnight-platform"
        runId="run-from-execution-surface"
        latestRunId="run-from-workspace-surface"
      >
        <RunTitleConsumer />
        <RunStatusConsumer />
      </SceneRunSessionProvider>,
    )

    expect(screen.getByText('Midnight platform rewrite run')).toBeInTheDocument()
    expect(screen.getByText('waiting_review')).toBeInTheDocument()
    expect(useSceneRunSession).toHaveBeenCalledTimes(1)
    expect(useSceneRunSession).toHaveBeenCalledWith({
      sceneId: 'scene-midnight-platform',
      runId: 'run-from-execution-surface',
      latestRunId: 'run-from-workspace-surface',
    })
  })
})
