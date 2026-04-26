import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.resetModules()
  vi.clearAllMocks()
  vi.unmock('@/features/run/hooks/useSceneRunSession')
  vi.unmock('@/features/run/hooks/useRunArtifactsQuery')
  vi.unmock('@/features/run/hooks/useRunArtifactDetailQuery')
})

describe('SceneRunSessionProvider', () => {
  it('prepares one shared scene run session for multiple consumers in the same scene scope', async () => {
    const sharedSession = {
      activeRunId: 'run-scene-midnight-platform-002',
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

  it('shares local proposal variant draft state without writing variant choices into route state', async () => {
    const user = userEvent.setup()
    const runId = 'run-scene-midnight-platform-001'
    const proposalSetId = 'proposal-set-scene-midnight-platform-run-001'
    const proposalId = `${proposalSetId}-proposal-001`
    const initialUrl = '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution'
    window.history.replaceState({}, '', initialUrl)

    vi.doMock('@/features/run/hooks/useSceneRunSession', () => ({
      useSceneRunSession: () => ({
        activeRunId: runId,
        run: {
          id: runId,
          scope: 'scene' as const,
          scopeId: 'scene-midnight-platform',
          status: 'waiting_review' as const,
          title: 'Midnight platform rewrite run',
          summary: 'Waiting for review.',
          pendingReviewId: 'review-scene-midnight-platform-001',
          latestEventId: 'run-event-001',
          eventCount: 2,
        },
        events: [],
        pendingReviewId: 'review-scene-midnight-platform-001',
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
      }),
    }))
    vi.doMock('@/features/run/hooks/useRunArtifactsQuery', () => ({
      useRunArtifactsQuery: () => ({
        artifacts: [
          {
            id: proposalSetId,
            runId,
            kind: 'proposal-set',
          },
        ],
        error: null,
        isLoading: false,
      }),
    }))
    vi.doMock('@/features/run/hooks/useRunArtifactDetailQuery', () => ({
      useRunArtifactDetailQuery: () => ({
        artifact: {
          id: proposalSetId,
          runId,
          kind: 'proposal-set',
          title: { en: 'Scene proposal set', 'zh-CN': '场景提案集' },
          summary: { en: 'Proposal candidates are ready.', 'zh-CN': '候选提案已就绪。' },
          statusLabel: { en: 'Ready for review', 'zh-CN': '待评审' },
          createdAtLabel: { en: '2026-04-21 10:07', 'zh-CN': '2026-04-21 10:07' },
          sourceEventIds: [],
          reviewId: 'review-scene-midnight-platform-001',
          sourceInvocationIds: [],
          proposals: [
            {
              id: proposalId,
              title: { en: 'Anchor the arrival beat', 'zh-CN': '锚定入场节拍' },
              summary: { en: 'Open on the scene first.', 'zh-CN': '先打开场景。' },
              changeKind: 'action',
              riskLabel: { en: 'Low continuity risk', 'zh-CN': '低连续性风险' },
              relatedAssets: [],
              defaultVariantId: 'variant-midnight-platform-default',
              variants: [
                {
                  id: 'variant-midnight-platform-default',
                  label: { en: 'Balanced arrival', 'zh-CN': '平衡入场' },
                  summary: { en: 'Keep the arrival steady.', 'zh-CN': '保持入场稳定。' },
                  rationale: { en: 'Easy to trace.', 'zh-CN': '易于追溯。' },
                },
                {
                  id: 'variant-midnight-platform-raise-conflict',
                  label: { en: 'Higher conflict', 'zh-CN': '提高冲突' },
                  summary: { en: 'Raise pressure immediately.', 'zh-CN': '立刻抬高压力。' },
                  rationale: { en: 'Sharper alternative.', 'zh-CN': '更锐利的候选。' },
                },
              ],
            },
          ],
          reviewOptions: [],
        },
        error: null,
        isLoading: false,
      }),
    }))

    const { SceneRunSessionProvider, useSharedSceneRunSession } = await import('./scene-run-session-context')

    function MainStageSummary() {
      const { reviewVariants } = useSharedSceneRunSession()
      const selected = reviewVariants.selectedVariantsForSubmit[0]

      return <div data-testid="main-stage-variant-summary">{selected ? `${selected.proposalId}:${selected.variantId}` : 'none'}</div>
    }

    function DockVariantSupport() {
      const { reviewVariants } = useSharedSceneRunSession()

      return (
        <button
          type="button"
          onClick={() => reviewVariants.selectVariant(proposalId, 'variant-midnight-platform-raise-conflict')}
        >
          Prepare higher-conflict variant
        </button>
      )
    }

    render(
      <SceneRunSessionProvider sceneId="scene-midnight-platform" latestRunId={runId}>
        <MainStageSummary />
        <DockVariantSupport />
      </SceneRunSessionProvider>,
    )

    expect(screen.getByTestId('main-stage-variant-summary')).toHaveTextContent(`${proposalId}:variant-midnight-platform-default`)

    await user.click(screen.getByRole('button', { name: 'Prepare higher-conflict variant' }))

    expect(screen.getByTestId('main-stage-variant-summary')).toHaveTextContent(`${proposalId}:variant-midnight-platform-raise-conflict`)
    expect(window.location.search).toBe('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')
  })
})
