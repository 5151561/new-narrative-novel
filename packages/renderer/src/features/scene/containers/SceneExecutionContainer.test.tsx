import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'

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
    vi.unmock('../hooks/useSceneExecutionQuery')
    vi.unmock('../hooks/useProposalActions')
    vi.unmock('../components/SceneExecutionTab')
    vi.unmock('../hooks/useSceneWorkspaceActions')
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
    vi.doMock('../hooks/useSceneWorkspaceActions', () => ({
      useSceneWorkspaceActions: () => ({
        continueRun: vi.fn(),
        openPatchPreview: vi.fn(),
        openProse: vi.fn(),
        openTab: vi.fn(),
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
          <I18nProvider>
            <SceneExecutionContainer sceneId="scene-midnight-platform" />
          </I18nProvider>
        </QueryClientProvider>,
      ),
    ).not.toThrow()
    expect(screen.getByText('execution tab')).toBeInTheDocument()
    expect(consoleError.mock.calls.some((call) => String(call[0]).includes('Maximum update depth exceeded'))).toBe(false)
  })

  it('filters proposals through the execution review controls', async () => {
    const user = userEvent.setup()

    window.history.replaceState({}, '', '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')
    vi.doUnmock('../components/SceneExecutionTab')

    vi.doMock('../hooks/useSceneExecutionQuery', () => ({
      useSceneExecutionQuery: () => ({
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
})
