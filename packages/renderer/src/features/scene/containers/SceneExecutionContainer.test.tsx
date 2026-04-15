import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('SceneExecutionContainer', () => {
  beforeEach(async () => {
    vi.resetModules()
    const { useSceneUiStore } = await import('../store/scene-ui-store')
    useSceneUiStore.setState({
      selectedProposalId: undefined,
      selectedBeatId: undefined,
      filters: {},
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unmock('../hooks/useSceneExecutionQuery')
    vi.unmock('../hooks/useProposalActions')
    vi.unmock('../components/SceneExecutionTab')
  })

  it('stays stable when execution loads without any visible proposals', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    vi.doMock('../hooks/useSceneExecutionQuery', () => ({
      useSceneExecutionQuery: () => ({
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
    vi.doMock('../components/SceneExecutionTab', () => ({
      SceneExecutionTab: () => <div>execution tab</div>,
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
          <SceneExecutionContainer sceneId="scene-midnight-platform" />
        </QueryClientProvider>,
      ),
    ).not.toThrow()
    expect(screen.getByText('execution tab')).toBeInTheDocument()
    expect(consoleError.mock.calls.some((call) => String(call[0]).includes('Maximum update depth exceeded'))).toBe(false)
  })
})
