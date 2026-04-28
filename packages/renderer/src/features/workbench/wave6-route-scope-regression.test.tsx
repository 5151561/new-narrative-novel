import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'
import {
  createTestProjectRuntime,
  resetProjectRuntimeMockState,
} from '@/app/project-runtime/project-runtime-test-utils'
import {
  exportMockRunSnapshot,
  importMockRunSnapshot,
  resetMockRunDb,
} from '@/features/run/api/mock-run-db'

import App from '@/App'

const LAYOUT_KEYS = [
  'bottomDockHeight',
  'bottomDockMaximized',
  'bottomDockVisible',
  'inspectorVisible',
  'inspectorWidth',
  'navigatorVisible',
  'navigatorWidth',
]

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function expectNoLayoutKeysInUrl() {
  const params = new URLSearchParams(window.location.search)
  for (const key of LAYOUT_KEYS) {
    expect(params.has(key)).toBe(false)
  }
}

function renderWorkbenchAt(search: string) {
  window.history.replaceState({}, '', search)

  return render(
    <AppProviders runtime={createTestProjectRuntime()} queryClient={createQueryClient()}>
      <App />
    </AppProviders>,
  )
}

describe('Wave 6 route and scope regression', () => {
  beforeEach(() => {
    window.localStorage.clear()
    resetProjectRuntimeMockState()
  })

  afterEach(() => {
    window.localStorage.clear()
    resetProjectRuntimeMockState()
  })

  it('restores the selected review issue from the book draft review route without writing layout keys to the URL', async () => {
    const user = userEvent.setup()

    renderWorkbenchAt(
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&reviewStatusFilter=open&reviewIssueId=continuity-conflict-ledger-public-proof&selectedChapterId=chapter-signals-in-rain',
    )

    expect(await screen.findByText('Review inbox')).toBeInTheDocument()
    expect(screen.getAllByText('Ledger visibility conflicts with the public-proof beat').length).toBeGreaterThan(0)

    const params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('book')
    expect(params.get('id')).toBe('book-signal-arc')
    expect(params.get('draftView')).toBe('review')
    expect(params.get('reviewIssueId')).toBe('continuity-conflict-ledger-public-proof')
    expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')

    await user.click(screen.getByRole('button', { name: 'Toggle Navigator' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Inspector' }))
    expectNoLayoutKeysInUrl()
  })

  it('restores the asset context view without leaking shell layout state into the route', async () => {
    const user = userEvent.setup()

    renderWorkbenchAt('/workbench?scope=asset&id=asset-closed-ledger&lens=knowledge&view=context')

    expect(await screen.findAllByText('Closed Ledger')).not.toHaveLength(0)

    const params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('asset')
    expect(params.get('id')).toBe('asset-closed-ledger')
    expect(params.get('lens')).toBe('knowledge')
    expect(params.get('view')).toBe('context')

    await user.click(screen.getByRole('button', { name: 'Toggle Bottom Dock' }))
    await user.click(screen.getByRole('button', { name: 'Toggle Bottom Dock' }))
    expectNoLayoutKeysInUrl()
  })

  it('restores branch, checkpoint, and selected chapter from the book draft branch route', async () => {
    renderWorkbenchAt(
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-high-pressure&branchBaseline=checkpoint&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-signals-in-rain',
    )

    expect(await screen.findByText('Book experiment branch')).toBeInTheDocument()
    expect(screen.getAllByText('High Pressure').length).toBeGreaterThan(0)

    const params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('book')
    expect(params.get('id')).toBe('book-signal-arc')
    expect(params.get('draftView')).toBe('branch')
    expect(params.get('branchId')).toBe('branch-book-signal-arc-high-pressure')
    expect(params.get('branchBaseline')).toBe('checkpoint')
    expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
    expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    expectNoLayoutKeysInUrl()
  })

  it('keeps failure recovery state in the bottom dock instead of turning it into the main-stage primary task', async () => {
    resetMockRunDb()
    const snapshot = exportMockRunSnapshot()
    const runState = snapshot.runStatesByProjectId['book-signal-arc']?.find(
      (entry) => entry.run.id === 'run-scene-midnight-platform-001',
    )

    if (!runState) {
      throw new Error('Expected seeded midnight platform run state for Wave 6 regression coverage.')
    }

    runState.run.status = 'waiting_review'
    runState.run.summary = 'Planner packaging stalled after a provider retry; review can inspect the partial output.'
    runState.run.failureClass = 'provider_error'
    runState.run.failureMessage = 'Provider returned 502 while proposal packaging was being finalized.'
    runState.run.usage = {
      inputTokens: 8200,
      outputTokens: 1100,
      estimatedCostUsd: 0.19,
      provider: 'openai',
      modelId: 'gpt-5.4',
    }
    runState.run.runtimeSummary = {
      health: 'attention',
      tokenLabel: '8.2k tokens',
      costLabel: '$0.19 est.',
      failureClassLabel: 'Watching provider retries',
      nextActionLabel: 'Review proposals before retrying the writer path.',
    }
    importMockRunSnapshot(snapshot)

    renderWorkbenchAt('/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    const mainStage = screen.getByTestId('workbench-main-stage')
    const bottomDock = screen.getByRole('region', { name: 'Bottom Dock' })

    await waitFor(() => {
      expect(within(bottomDock).getByText('Waiting for Main Stage Review')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Review proposals before retrying the writer path.')).toBeInTheDocument()
    })

    expect(within(mainStage).getByText('Proposal Review')).toBeInTheDocument()
    expect(within(mainStage).queryByText('Review proposals before retrying the writer path.')).toBeNull()
  })
})
