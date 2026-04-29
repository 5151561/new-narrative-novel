import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

function createReviewVariants(overrides: Partial<{
  proposalSetArtifactId: string | null
  selectedVariantsByProposalId: Record<string, string>
  selectedVariantsForSubmit: Array<{ proposalId: string; variantId: string }>
}> = {}) {
  return {
    proposalSetArtifactId: null,
    selectedVariantsByProposalId: {},
    selectedVariantsForSubmit: [],
    selectVariant: vi.fn(),
    resetVariants: vi.fn(),
    isLoadingProposalSet: false,
    proposalSetError: null,
    ...overrides,
  }
}

describe('SceneExecutionContainer', () => {
  beforeEach(async () => {
    vi.resetModules()
    const { useSceneUiStore } = await import('../store/scene-ui-store')
    useSceneUiStore.setState({
      filters: {},
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unmock('@/app/project-runtime/ProjectRuntimeProvider')
    vi.unmock('@/features/settings/ModelSettingsProvider')
    vi.unmock('../hooks/useSceneExecutionQuery')
    vi.unmock('../hooks/useProposalActions')
    vi.unmock('../components/SceneExecutionTab')
    vi.unmock('./scene-run-session-context')
    vi.unmock('../hooks/useSceneWorkspaceActions')
  })

  it('stays stable when execution loads without any visible proposals', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const startRun = vi.fn()
    const continueRun = vi.fn()
    const useSharedSceneRunSession = vi.fn(() => ({
      run: null,
      events: [],
      pendingReviewId: null,
      isReviewPending: false,
      isLoading: false,
      error: null,
      isStartingRun: false,
      isSubmittingDecision: false,
      startRun,
      submitDecision: vi.fn(),
      reviewVariants: createReviewVariants(),
    }))
    let sceneExecutionTabProps: Record<string, unknown> | undefined

    vi.doMock('../hooks/useSceneExecutionQuery', () => ({
      useSceneExecutionQuery: () => ({
        runId: 'run-from-execution-surface',
        objective: {
          goal: '',
          warningsCount: 0,
          unresolvedCount: 0,
          cast: [],
          constraintSummary: [],
        },
        beats: [],
        proposals: [],
        acceptedSummary: {
          sceneSummary: '',
          acceptedFacts: [],
          readiness: 'not-ready' as const,
          pendingProposalCount: 0,
          warningCount: 0,
          patchCandidateCount: 0,
        },
        canContinueRun: false,
        canOpenProse: false,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useProposalActions', () => ({
      useProposalActions: () => ({
        accept: vi.fn(),
        editAccept: vi.fn(),
        requestRewrite: vi.fn(),
        reject: vi.fn(),
        isMutating: false,
      }),
    }))
    vi.doMock('../hooks/useSceneWorkspaceActions', () => ({
      useSceneWorkspaceActions: () => ({
        continueRun,
        openPatchPreview: vi.fn(),
        openProse: vi.fn(),
        openTab: vi.fn(),
      }),
    }))
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession,
    }))
    vi.doMock('../components/SceneExecutionTab', () => ({
      SceneExecutionTab: (props: Record<string, unknown>) => {
        sceneExecutionTabProps = props
        return <div>execution tab</div>
      },
    }))

    const { SceneExecutionContainer } = await import('./SceneExecutionContainer')
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    expect(() =>
      render(
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <SceneExecutionContainer sceneId="scene-midnight-platform" />
          </I18nProvider>
        </QueryClientProvider>,
      ),
    ).not.toThrow()
    expect(screen.getByText('execution tab')).toBeInTheDocument()
    expect(consoleError.mock.calls.some((call) => String(call[0]).includes('Maximum update depth exceeded'))).toBe(false)
    expect(useSharedSceneRunSession).toHaveBeenCalled()
    expect(sceneExecutionTabProps).toMatchObject({
      runSession: expect.objectContaining({
        run: null,
        events: [],
      }),
    })

    await waitFor(async () => {
      await (sceneExecutionTabProps?.onContinueRun as (() => Promise<void> | void) | undefined)?.()
    })

    expect(startRun).toHaveBeenCalledWith({
      mode: 'continue',
    })
    expect(continueRun).not.toHaveBeenCalled()
  })

  it('filters proposals through the execution review controls', async () => {
    const user = userEvent.setup()

    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')
    vi.doUnmock('../components/SceneExecutionTab')
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession: () => ({
        run: {
          id: 'run-from-execution-surface',
          scope: 'scene',
          scopeId: 'scene-midnight-platform',
          status: 'waiting_review',
          title: 'Midnight platform scene run',
          summary: 'Planner and writer output are ready for review.',
          startedAtLabel: '2026-04-21 10:00',
          pendingReviewId: 'review-scene-midnight-platform-001',
          latestEventId: 'run-event-001',
          eventCount: 1,
        },
        events: [
          {
            id: 'run-event-001',
            runId: 'run-from-execution-surface',
            order: 1,
            kind: 'review_requested',
            label: 'Review requested',
            summary: 'Editorial review is waiting on the proposal set.',
            createdAtLabel: '2026-04-21 10:09',
            severity: 'warning' as const,
            refs: [{ kind: 'review' as const, id: 'review-scene-midnight-platform-001' }],
          },
        ],
        pendingReviewId: 'review-scene-midnight-platform-001',
        isReviewPending: true,
        isLoading: false,
        error: null,
        isStartingRun: false,
        isSubmittingDecision: false,
        startRun: vi.fn(),
        submitDecision: vi.fn(),
        reviewVariants: createReviewVariants({
          proposalSetArtifactId: 'proposal-set-scene-midnight-platform-run-001',
          selectedVariantsByProposalId: {
            'proposal-set-scene-midnight-platform-run-001-proposal-001': 'variant-midnight-platform-raise-conflict',
          },
          selectedVariantsForSubmit: [
            {
              proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
              variantId: 'variant-midnight-platform-raise-conflict',
            },
          ],
        }),
      }),
    }))

    vi.doMock('../hooks/useSceneExecutionQuery', () => ({
      useSceneExecutionQuery: () => ({
        runId: 'run-from-execution-surface',
        objective: {
          goal: 'Keep the ledger closed while forcing Mei to show her leverage.',
          warningsCount: 2,
          unresolvedCount: 1,
          cast: [
            { id: 'ren', name: 'Ren Voss', role: 'POV' },
            { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
          ],
          constraintSummary: ['Ledger stays shut.'],
          location: { id: 'platform', name: 'Rain-soaked platform' },
        },
        beats: [
          {
            id: 'beat-bargain',
            index: 2,
            title: 'Bargain over the ledger',
            status: 'review' as const,
            proposalCount: 3,
            warningCount: 1,
            summary: 'Primary review beat.',
          },
        ],
        proposals: [
          {
            id: 'proposal-pending',
            beatId: 'beat-bargain',
            actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' as const },
            kind: 'conflict' as const,
            title: 'Pending conflict proposal',
            summary: 'Pending proposal stays visible before filtering.',
            status: 'pending' as const,
            impactTags: ['stakes'],
            affects: [{ path: 'scene.conflict', label: 'Conflict', deltaSummary: 'Escalates pressure.' }],
            risks: [{ severity: 'warn' as const, message: 'Could crowd the witness beat.' }],
          },
          {
            id: 'proposal-accepted',
            beatId: 'beat-bargain',
            actor: { id: 'mei', name: 'Mei Arden', type: 'character' as const },
            kind: 'dialogue' as const,
            title: 'Accepted dialogue proposal',
            summary: 'Accepted proposal should survive the accepted filter.',
            status: 'accepted' as const,
            impactTags: ['history'],
            affects: [{ path: 'scene.dialogue', label: 'Dialogue', deltaSummary: 'Names the price directly.' }],
            risks: [{ severity: 'info' as const, message: 'Shared history gets sharper.' }],
          },
          {
            id: 'proposal-rewrite',
            beatId: 'beat-bargain',
            actor: { id: 'system', name: 'Consistency Watch', type: 'system' as const },
            kind: 'state-change' as const,
            title: 'Rewrite state-change proposal',
            summary: 'Rewrite-requested proposal should disappear under accepted filter.',
            status: 'rewrite-requested' as const,
            impactTags: ['timing'],
            affects: [{ path: 'scene.exit', label: 'Exit beat', deltaSummary: 'Delays the bell.' }],
            risks: [{ severity: 'high' as const, message: 'Bell timing can break continuity.' }],
          },
        ],
        acceptedSummary: {
          sceneSummary: 'One accepted proposal is ready for prose review.',
          acceptedFacts: [{ id: 'fact-1', label: 'Ledger', value: 'Still closed.' }],
          readiness: 'draftable' as const,
          pendingProposalCount: 2,
          warningCount: 1,
          patchCandidateCount: 1,
        },
        canContinueRun: true,
        canOpenProse: true,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useProposalActions', () => ({
      useProposalActions: () => ({
        accept: vi.fn(),
        editAccept: vi.fn(),
        requestRewrite: vi.fn(),
        reject: vi.fn(),
        isMutating: false,
      }),
    }))
    vi.doMock('../hooks/useSceneWorkspaceActions', () => ({
      useSceneWorkspaceActions: () => ({
        continueRun: vi.fn(),
        openPatchPreview: vi.fn(),
        openProse: vi.fn(),
        openTab: vi.fn(),
      }),
    }))

    const { SceneExecutionContainer } = await import('./SceneExecutionContainer')
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <SceneExecutionContainer sceneId="scene-midnight-platform" />
        </I18nProvider>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Pending conflict proposal')).toBeInTheDocument()
    expect(screen.getByText('Accepted dialogue proposal')).toBeInTheDocument()
    expect(screen.getByText('Rewrite state-change proposal')).toBeInTheDocument()
    expect(screen.getAllByText('Midnight platform scene run').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Review requested').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1 proposal variant prepared as draft context for this Main Stage review decision.').length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('Status'), 'accepted')

    await waitFor(() => {
      expect(screen.queryByText('Pending conflict proposal')).not.toBeInTheDocument()
      expect(screen.getByText('Accepted dialogue proposal')).toBeInTheDocument()
      expect(screen.queryByText('Rewrite state-change proposal')).not.toBeInTheDocument()
      expect(screen.getByText('Review filters active')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Reset Filters' }))

    await waitFor(() => {
      expect(screen.getByText('Pending conflict proposal')).toBeInTheDocument()
      expect(screen.getByText('Rewrite state-change proposal')).toBeInTheDocument()
      expect(screen.getByText('Review filters idle')).toBeInTheDocument()
    })
  })

  it('surfaces one primary Run Scene CTA while keeping review-gate-first behavior during waiting review', async () => {
    const startRun = vi.fn()

    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')
    vi.doUnmock('../components/SceneExecutionTab')
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession: () => ({
        run: {
          id: 'run-from-execution-surface',
          scope: 'scene',
          scopeId: 'scene-midnight-platform',
          status: 'waiting_review',
          title: 'Midnight platform scene run',
          summary: 'Planner and writer output are ready for review.',
          startedAtLabel: '2026-04-21 10:00',
          pendingReviewId: 'review-scene-midnight-platform-001',
          latestEventId: 'run-event-001',
          eventCount: 1,
        },
        events: [
          {
            id: 'run-event-001',
            runId: 'run-from-execution-surface',
            order: 1,
            kind: 'review_requested',
            label: 'Review requested',
            summary: 'Editorial review is waiting on the proposal set.',
            createdAtLabel: '2026-04-21 10:09',
            severity: 'warning' as const,
            refs: [{ kind: 'review' as const, id: 'review-scene-midnight-platform-001' }],
          },
        ],
        pendingReviewId: 'review-scene-midnight-platform-001',
        isReviewPending: true,
        isLoading: false,
        error: null,
        isStartingRun: false,
        isSubmittingDecision: false,
        startRun,
        submitDecision: vi.fn(),
        reviewVariants: createReviewVariants({
          selectedVariantsForSubmit: [
            {
              proposalId: 'proposal-set-scene-midnight-platform-run-001-proposal-001',
              variantId: 'variant-midnight-platform-raise-conflict',
            },
          ],
        }),
      }),
    }))
    vi.doMock('../hooks/useSceneExecutionQuery', () => ({
      useSceneExecutionQuery: () => ({
        runId: 'run-from-execution-surface',
        objective: {
          goal: 'Keep the ledger closed while forcing Mei to show her leverage.',
          warningsCount: 2,
          unresolvedCount: 1,
          cast: [
            { id: 'ren', name: 'Ren Voss', role: 'POV' },
            { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
          ],
          constraintSummary: ['Ledger stays shut.'],
          location: { id: 'platform', name: 'Rain-soaked platform' },
        },
        beats: [
          {
            id: 'beat-bargain',
            index: 2,
            title: 'Bargain over the ledger',
            status: 'review' as const,
            proposalCount: 3,
            warningCount: 1,
            summary: 'Primary review beat.',
          },
        ],
        proposals: [
          {
            id: 'proposal-pending',
            beatId: 'beat-bargain',
            actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' as const },
            kind: 'conflict' as const,
            title: 'Pending conflict proposal',
            summary: 'Pending proposal stays visible before filtering.',
            status: 'pending' as const,
            impactTags: ['stakes'],
            affects: [{ path: 'scene.conflict', label: 'Conflict', deltaSummary: 'Escalates pressure.' }],
            risks: [{ severity: 'warn' as const, message: 'Could crowd the witness beat.' }],
          },
        ],
        acceptedSummary: {
          sceneSummary: 'One accepted proposal is ready for prose review.',
          acceptedFacts: [{ id: 'fact-1', label: 'Ledger', value: 'Still closed.' }],
          readiness: 'draftable' as const,
          pendingProposalCount: 1,
          warningCount: 1,
          patchCandidateCount: 1,
        },
        canContinueRun: false,
        canOpenProse: true,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useProposalActions', () => ({
      useProposalActions: () => ({
        accept: vi.fn(),
        editAccept: vi.fn(),
        requestRewrite: vi.fn(),
        reject: vi.fn(),
        isMutating: false,
      }),
    }))
    vi.doMock('../hooks/useSceneWorkspaceActions', () => ({
      useSceneWorkspaceActions: () => ({
        continueRun: vi.fn(),
        openPatchPreview: vi.fn(),
        openProse: vi.fn(),
        openTab: vi.fn(),
      }),
    }))

    const { SceneExecutionContainer } = await import('./SceneExecutionContainer')
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <SceneExecutionContainer sceneId="scene-midnight-platform" />
        </I18nProvider>
      </QueryClientProvider>,
    )

    expect(screen.getAllByRole('button', { name: 'Run Scene' }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Continue Active Run' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Review requested').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Run Review Gate').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: 'Run Scene' })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Rewrite Run' })[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Run From Scratch' })[0]).toBeDisabled()
    expect(startRun).not.toHaveBeenCalled()
  })

  it('opens model settings instead of exposing Run Scene when the real-project provider bindings are incomplete', async () => {
    const user = userEvent.setup()
    const setOpen = vi.fn()

    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')
    vi.doUnmock('../components/SceneExecutionTab')
    vi.doMock('@/app/project-runtime/ProjectRuntimeProvider', async () => {
      const actual = await vi.importActual<typeof import('@/app/project-runtime/ProjectRuntimeProvider')>('@/app/project-runtime/ProjectRuntimeProvider')
      return {
        ...actual,
        getProjectRuntimeKind: () => 'real-local-project' as const,
        useOptionalProjectRuntime: () => ({
          projectId: 'local-project-alpha',
          projectTitle: 'Local Project Alpha',
        }),
      }
    })
    vi.doMock('@/features/settings/ModelSettingsProvider', async () => {
      const actual = await vi.importActual<typeof import('@/features/settings/ModelSettingsProvider')>('@/features/settings/ModelSettingsProvider')
      return {
        ...actual,
        useOptionalModelSettingsController: () => ({
          supported: true,
          setOpen,
          snapshot: {
            providers: [
              { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
            ],
            bindings: {
              continuityReviewer: { provider: 'fixture' },
              planner: { provider: 'openai-compatible', providerId: 'deepseek', modelId: '' },
              sceneProseWriter: { modelId: 'deepseek-chat', provider: 'openai-compatible', providerId: 'deepseek' },
              sceneRevision: { provider: 'fixture' },
              summary: { provider: 'fixture' },
            },
            credentialStatuses: [{
              configured: false,
              provider: 'openai-compatible',
              providerId: 'deepseek',
            }],
            connectionTest: {
              status: 'never',
            },
          },
        }),
      }
    })
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession: () => ({
        run: null,
        events: [],
        pendingReviewId: null,
        isReviewPending: false,
        isLoading: false,
        error: null,
        isStartingRun: false,
        isSubmittingDecision: false,
        startRun: vi.fn(),
        retry: vi.fn(),
        submitDecision: vi.fn(),
        reviewVariants: createReviewVariants(),
      }),
    }))
    vi.doMock('../hooks/useSceneExecutionQuery', () => ({
      useSceneExecutionQuery: () => ({
        runId: undefined,
        objective: {
          goal: 'Keep the ledger closed while forcing Mei to show her leverage.',
          warningsCount: 2,
          unresolvedCount: 1,
          cast: [
            { id: 'ren', name: 'Ren Voss', role: 'POV' },
            { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
          ],
          constraintSummary: ['Ledger stays shut.'],
          location: { id: 'platform', name: 'Rain-soaked platform' },
        },
        beats: [
          {
            id: 'beat-bargain',
            index: 2,
            title: 'Bargain over the ledger',
            status: 'review' as const,
            proposalCount: 3,
            warningCount: 1,
            summary: 'Primary review beat.',
          },
        ],
        proposals: [
          {
            id: 'proposal-pending',
            beatId: 'beat-bargain',
            actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' as const },
            kind: 'conflict' as const,
            title: 'Pending conflict proposal',
            summary: 'Pending proposal stays visible before filtering.',
            status: 'pending' as const,
            impactTags: ['stakes'],
            affects: [{ path: 'scene.conflict', label: 'Conflict', deltaSummary: 'Escalates pressure.' }],
            risks: [{ severity: 'warn' as const, message: 'Could crowd the witness beat.' }],
          },
        ],
        acceptedSummary: {
          sceneSummary: 'One accepted proposal is ready for prose review.',
          acceptedFacts: [{ id: 'fact-1', label: 'Ledger', value: 'Still closed.' }],
          readiness: 'draftable' as const,
          pendingProposalCount: 1,
          warningCount: 1,
          patchCandidateCount: 1,
        },
        canContinueRun: false,
        canOpenProse: false,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useProposalActions', () => ({
      useProposalActions: () => ({
        accept: vi.fn(),
        editAccept: vi.fn(),
        requestRewrite: vi.fn(),
        reject: vi.fn(),
        isMutating: false,
      }),
    }))
    vi.doMock('../hooks/useSceneWorkspaceActions', () => ({
      useSceneWorkspaceActions: () => ({
        continueRun: vi.fn(),
        openPatchPreview: vi.fn(),
        openProse: vi.fn(),
        openTab: vi.fn(),
      }),
    }))

    const { SceneExecutionContainer } = await import('./SceneExecutionContainer')
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <SceneExecutionContainer sceneId="scene-midnight-platform" />
        </I18nProvider>
      </QueryClientProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Run Scene' })).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Model Settings' })[0]!)
    expect(setOpen).toHaveBeenCalledWith(true)
  })

  it('opens model settings instead of exposing Run Scene when the last real-project connection test failed', async () => {
    const user = userEvent.setup()
    const setOpen = vi.fn()

    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')
    vi.doUnmock('../components/SceneExecutionTab')
    vi.doMock('@/app/project-runtime/ProjectRuntimeProvider', async () => {
      const actual = await vi.importActual<typeof import('@/app/project-runtime/ProjectRuntimeProvider')>('@/app/project-runtime/ProjectRuntimeProvider')
      return {
        ...actual,
        getProjectRuntimeKind: () => 'real-local-project' as const,
        useOptionalProjectRuntime: () => ({
          projectId: 'local-project-alpha',
          projectTitle: 'Local Project Alpha',
        }),
      }
    })
    vi.doMock('@/features/settings/ModelSettingsProvider', async () => {
      const actual = await vi.importActual<typeof import('@/features/settings/ModelSettingsProvider')>('@/features/settings/ModelSettingsProvider')
      return {
        ...actual,
        useOptionalModelSettingsController: () => ({
          supported: true,
          setOpen,
          snapshot: {
            providers: [
              { id: 'deepseek', label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
            ],
            bindings: {
              continuityReviewer: { provider: 'fixture' },
              planner: { provider: 'openai-compatible', providerId: 'deepseek', modelId: 'deepseek-reasoner' },
              sceneProseWriter: { modelId: 'deepseek-chat', provider: 'openai-compatible', providerId: 'deepseek' },
              sceneRevision: { provider: 'fixture' },
              summary: { provider: 'fixture' },
            },
            credentialStatuses: [{
              configured: true,
              provider: 'openai-compatible',
              providerId: 'deepseek',
            }],
            connectionTest: {
              status: 'failed',
              errorCode: 'network_error',
              summary: 'The last connection test failed for DeepSeek.',
            },
          },
        }),
      }
    })
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession: () => ({
        run: null,
        events: [],
        pendingReviewId: null,
        isReviewPending: false,
        isLoading: false,
        error: null,
        isStartingRun: false,
        isSubmittingDecision: false,
        startRun: vi.fn(),
        retry: vi.fn(),
        submitDecision: vi.fn(),
        reviewVariants: createReviewVariants(),
      }),
    }))
    vi.doMock('../hooks/useSceneExecutionQuery', () => ({
      useSceneExecutionQuery: () => ({
        runId: undefined,
        objective: {
          goal: 'Keep the ledger closed while forcing Mei to show her leverage.',
          warningsCount: 2,
          unresolvedCount: 1,
          cast: [
            { id: 'ren', name: 'Ren Voss', role: 'POV' },
            { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
          ],
          constraintSummary: ['Ledger stays shut.'],
          location: { id: 'platform', name: 'Rain-soaked platform' },
        },
        beats: [
          {
            id: 'beat-bargain',
            index: 2,
            title: 'Bargain over the ledger',
            status: 'review' as const,
            proposalCount: 3,
            warningCount: 1,
            summary: 'Primary review beat.',
          },
        ],
        proposals: [
          {
            id: 'proposal-pending',
            beatId: 'beat-bargain',
            actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' as const },
            kind: 'conflict' as const,
            title: 'Pending conflict proposal',
            summary: 'Pending proposal stays visible before filtering.',
            status: 'pending' as const,
            impactTags: ['stakes'],
            affects: [{ path: 'scene.conflict', label: 'Conflict', deltaSummary: 'Escalates pressure.' }],
            risks: [{ severity: 'warn' as const, message: 'Could crowd the witness beat.' }],
          },
        ],
        acceptedSummary: {
          sceneSummary: 'One accepted proposal is ready for prose review.',
          acceptedFacts: [{ id: 'fact-1', label: 'Ledger', value: 'Still closed.' }],
          readiness: 'draftable' as const,
          pendingProposalCount: 1,
          warningCount: 1,
          patchCandidateCount: 1,
        },
        canContinueRun: false,
        canOpenProse: false,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useProposalActions', () => ({
      useProposalActions: () => ({
        accept: vi.fn(),
        editAccept: vi.fn(),
        requestRewrite: vi.fn(),
        reject: vi.fn(),
        isMutating: false,
      }),
    }))
    vi.doMock('../hooks/useSceneWorkspaceActions', () => ({
      useSceneWorkspaceActions: () => ({
        continueRun: vi.fn(),
        openPatchPreview: vi.fn(),
        openProse: vi.fn(),
        openTab: vi.fn(),
      }),
    }))

    const { SceneExecutionContainer } = await import('./SceneExecutionContainer')
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <SceneExecutionContainer sceneId="scene-midnight-platform" />
        </I18nProvider>
      </QueryClientProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Run Scene' })).not.toBeInTheDocument()
    expect((await screen.findAllByText('The last connection test failed for DeepSeek.')).length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: 'Model Settings' })[0]!)
    expect(setOpen).toHaveBeenCalledWith(true)
  })

  it('keeps Run Scene locked while real-project model settings are still hydrating', async () => {
    const user = userEvent.setup()
    const setOpen = vi.fn()

    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')
    vi.doUnmock('../components/SceneExecutionTab')
    vi.doMock('@/app/project-runtime/ProjectRuntimeProvider', async () => {
      const actual = await vi.importActual<typeof import('@/app/project-runtime/ProjectRuntimeProvider')>('@/app/project-runtime/ProjectRuntimeProvider')
      return {
        ...actual,
        getProjectRuntimeKind: () => 'real-local-project' as const,
        useOptionalProjectRuntime: () => ({
          projectId: 'local-project-alpha',
          projectTitle: 'Local Project Alpha',
        }),
      }
    })
    vi.doMock('@/features/settings/ModelSettingsProvider', async () => {
      const actual = await vi.importActual<typeof import('@/features/settings/ModelSettingsProvider')>('@/features/settings/ModelSettingsProvider')
      return {
        ...actual,
        useOptionalModelSettingsController: () => ({
          supported: true,
          loading: true,
          setOpen,
          snapshot: null,
        }),
      }
    })
    vi.doMock('./scene-run-session-context', () => ({
      useSharedSceneRunSession: () => ({
        run: null,
        events: [],
        pendingReviewId: null,
        isReviewPending: false,
        isLoading: false,
        error: null,
        isStartingRun: false,
        isSubmittingDecision: false,
        startRun: vi.fn(),
        retry: vi.fn(),
        submitDecision: vi.fn(),
        reviewVariants: createReviewVariants(),
      }),
    }))
    vi.doMock('../hooks/useSceneExecutionQuery', () => ({
      useSceneExecutionQuery: () => ({
        runId: undefined,
        objective: {
          goal: 'Keep the ledger closed while forcing Mei to show her leverage.',
          warningsCount: 2,
          unresolvedCount: 1,
          cast: [
            { id: 'ren', name: 'Ren Voss', role: 'POV' },
            { id: 'mei', name: 'Mei Arden', role: 'Counterforce' },
          ],
          constraintSummary: ['Ledger stays shut.'],
          location: { id: 'platform', name: 'Rain-soaked platform' },
        },
        beats: [
          {
            id: 'beat-bargain',
            index: 2,
            title: 'Bargain over the ledger',
            status: 'review' as const,
            proposalCount: 3,
            warningCount: 1,
            summary: 'Primary review beat.',
          },
        ],
        proposals: [
          {
            id: 'proposal-pending',
            beatId: 'beat-bargain',
            actor: { id: 'scene-manager', name: 'Scene Manager', type: 'scene-manager' as const },
            kind: 'conflict' as const,
            title: 'Pending conflict proposal',
            summary: 'Pending proposal stays visible before filtering.',
            status: 'pending' as const,
            impactTags: ['stakes'],
            affects: [{ path: 'scene.conflict', label: 'Conflict', deltaSummary: 'Escalates pressure.' }],
            risks: [{ severity: 'warn' as const, message: 'Could crowd the witness beat.' }],
          },
        ],
        acceptedSummary: {
          sceneSummary: 'One accepted proposal is ready for prose review.',
          acceptedFacts: [{ id: 'fact-1', label: 'Ledger', value: 'Still closed.' }],
          readiness: 'draftable' as const,
          pendingProposalCount: 1,
          warningCount: 1,
          patchCandidateCount: 1,
        },
        canContinueRun: false,
        canOpenProse: false,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useProposalActions', () => ({
      useProposalActions: () => ({
        accept: vi.fn(),
        editAccept: vi.fn(),
        requestRewrite: vi.fn(),
        reject: vi.fn(),
        isMutating: false,
      }),
    }))
    vi.doMock('../hooks/useSceneWorkspaceActions', () => ({
      useSceneWorkspaceActions: () => ({
        continueRun: vi.fn(),
        openPatchPreview: vi.fn(),
        openProse: vi.fn(),
        openTab: vi.fn(),
      }),
    }))

    const { SceneExecutionContainer } = await import('./SceneExecutionContainer')
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <SceneExecutionContainer sceneId="scene-midnight-platform" />
        </I18nProvider>
      </QueryClientProvider>,
    )

    expect(screen.queryByRole('button', { name: 'Run Scene' })).not.toBeInTheDocument()
    expect((await screen.findAllByText('Loading model settings for this real project. Run Scene stays locked until planner, prose writer, and connection status are confirmed.')).length).toBeGreaterThan(0)
    await user.click(screen.getAllByRole('button', { name: 'Model Settings' })[0]!)
    expect(setOpen).toHaveBeenCalledWith(true)
  })
})
