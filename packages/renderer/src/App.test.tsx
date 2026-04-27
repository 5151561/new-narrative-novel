import { act, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiRequestError, type ProjectRuntime } from '@/app/project-runtime'
import { resetMockBookExportArtifactDb } from '@/features/book/api/mock-book-export-artifact-db'
import { resetRememberedBookWorkbenchHandoffs } from '@/features/book/hooks/useBookWorkbenchActivity'
import { resetMockChapterDb } from '@/features/chapter/api/mock-chapter-db'
import type { BookReviewInboxViewModel } from '@/features/review/types/review-view-models'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

const originalNavigatorLanguage = window.navigator.language
let latestReplaceRoute: ReturnType<typeof useWorkbenchRouteState>['replaceRoute'] | null = null

function nonEditorCloseButtonName(label: string) {
  return new RegExp(`^(?!Close Editor:).*${label}`, 'i')
}

function getNavigatorSceneButton(label: string) {
  return within(screen.getByRole('region', { name: 'Navigator' })).getByRole('button', {
    name: nonEditorCloseButtonName(label),
  })
}

function expectNavigatorSceneOrder(labels: string[]) {
  for (let index = 0; index < labels.length - 1; index += 1) {
    const currentButton = getNavigatorSceneButton(labels[index]!)
    const nextButton = getNavigatorSceneButton(labels[index + 1]!)
    expect(currentButton.compareDocumentPosition(nextButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  }
}

function setSceneBridge(bridge: Record<string, unknown> | undefined) {
  if (bridge) {
    Reflect.set(window, 'narrativeRuntimeBridge', { scene: bridge })
    return
  }

  Reflect.deleteProperty(window, 'narrativeRuntimeBridge')
}

async function renderFreshApp(
  search = '',
  {
    resetModules = true,
    primeRouteSearches = [],
    runtime,
  }: { resetModules?: boolean; primeRouteSearches?: string[]; runtime?: ProjectRuntime } = {},
) {
  if (resetModules) {
    vi.resetModules()
  }
  vi.doMock('@/features/scene/containers/SceneInspectorContainer', () => ({
    SceneInspectorContainer: ({ sceneId }: { sceneId: string }) => {
      const { useState } = require('react') as typeof import('react')
      const { replaceRoute } = useWorkbenchRouteState()
      const [activeTab, setActiveTab] = useState<'context' | 'versions' | 'traceability' | 'runtime'>(
        () =>
          (window.localStorage.getItem('scene-inspector-tab') as 'context' | 'versions' | 'traceability' | 'runtime' | null) ??
          'context',
      )

      const selectTab = (tab: 'context' | 'versions' | 'traceability' | 'runtime') => {
        window.localStorage.setItem('scene-inspector-tab', tab)
        setActiveTab(tab)
      }

      return (
        <div data-testid="scene-inspector">
          <div>{sceneId}</div>
          <button type="button" onClick={() => selectTab('context')}>
            Context
          </button>
          <button type="button" onClick={() => selectTab('versions')}>
            Versions
          </button>
          <button type="button" onClick={() => selectTab('traceability')}>
            Traceability
          </button>
          <button type="button" onClick={() => selectTab('runtime')}>
            Runtime
          </button>
          {activeTab === 'context' ? <div>Accepted Facts</div> : null}
          {activeTab === 'versions' ? <div>Version Checkpoints</div> : null}
          {activeTab === 'traceability' ? (
            <div>
              <div>Traceability Links</div>
              <button
                type="button"
                onClick={() =>
                  replaceRoute({
                    scope: 'asset',
                    assetId: 'asset-ren-voss',
                    lens: 'knowledge',
                    view: 'profile',
                  })
                }
              >
                Ren Voss
              </button>
            </div>
          ) : null}
          {activeTab === 'runtime' ? <div>Runtime Profile</div> : null}
        </div>
      )
    },
  }))
  if (primeRouteSearches.length > 0) {
    const routeModule = await import('@/features/workbench/hooks/useWorkbenchRouteState')
    for (const routeSearch of primeRouteSearches) {
      routeModule.readWorkbenchRouteState(routeSearch)
    }
  }

  window.history.replaceState({}, '', `/workbench${search}`)

  const { default: App } = await import('./App')
  const { AppProviders } = await import('./app/providers')
  const routeModule = await import('@/features/workbench/hooks/useWorkbenchRouteState')

  function RouteControl() {
    const { replaceRoute } = routeModule.useWorkbenchRouteState()

    latestReplaceRoute = replaceRoute
    return null
  }

  if (!runtime) {
    return render(
      <AppProviders>
        <RouteControl />
        <App />
      </AppProviders>,
    )
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })

  const [{ I18nProvider }, projectRuntimeModule] = await Promise.all([
    import('@/app/i18n'),
    import('@/app/project-runtime'),
  ])

  function RuntimeProviders({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <projectRuntimeModule.ProjectRuntimeProvider runtime={runtime}>{children}</projectRuntimeModule.ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }

  return render(
    <RuntimeProviders>
      <RouteControl />
      <App />
    </RuntimeProviders>,
  )
}

function restoreDormantScope(scope: 'scene' | 'chapter' | 'asset' | 'book') {
  act(() => {
    latestReplaceRoute?.({ scope })
  })
}

function pushExternalRoute(search: string) {
  act(() => {
    window.history.pushState({}, '', `/workbench${search}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

function setNavigatorLanguage(language: string) {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: language,
  })
}

function expectNoEditorUrlParams() {
  const params = new URLSearchParams(window.location.search)
  const forbiddenEditorParamPatterns = [
    /^tabs$/i,
    /^activeEditor$/i,
    /^group$/i,
    /^opened/i,
    /^activeContext$/i,
    /^contexts?$/i,
    /editor/i,
  ]

  for (const key of params.keys()) {
    expect(forbiddenEditorParamPatterns.some((pattern) => pattern.test(key))).toBe(false)
  }
}

function expectBusinessSearchParams(expected: Record<string, string>) {
  const params = new URLSearchParams(window.location.search)

  expectNoEditorUrlParams()
  expect(Object.fromEntries(params.entries())).toEqual(expected)
}

function createReadyArtifactReviewInbox(): BookReviewInboxViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    selectedIssueId: null,
    selectedIssue: null,
    activeFilter: 'all',
    activeStatusFilter: 'open',
    issues: [],
    filteredIssues: [],
    groupedIssues: {
      blockers: [],
      warnings: [],
      info: [],
    },
    counts: {
      total: 0,
      blockers: 0,
      warnings: 0,
      info: 0,
      traceGaps: 0,
      missingDrafts: 0,
      compareDeltas: 0,
      exportReadiness: 0,
      branchReadiness: 0,
      sceneProposals: 0,
      open: 0,
      reviewed: 0,
      deferred: 0,
      dismissed: 0,
      stale: 0,
      fixStarted: 0,
      fixChecked: 0,
      fixBlocked: 0,
      fixStale: 0,
    },
    visibleOpenCount: 0,
    selectedChapterIssueCount: 0,
    annotationsByChapterId: {},
  }
}

describe('App scene workbench', () => {
  beforeEach(() => {
    setNavigatorLanguage('en-US')
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.doUnmock('@/features/review/hooks/useBookReviewInboxQuery')
    vi.doUnmock('@/features/book/api/book-client')
    vi.doUnmock('@/features/book/hooks/useBookDraftWorkspaceQuery')
    vi.doUnmock('@/features/book/hooks/useBookExportPreviewQuery')
    vi.doUnmock('@/features/book/hooks/useBookExportArtifactWorkspaceQuery')
    vi.doUnmock('/Users/changlepan/new-narrative-novel/packages/renderer/src/features/book/hooks/useBookExportArtifactWorkspaceQuery.ts')
    vi.doUnmock('@/features/book/hooks/useBookManuscriptCompareQuery')
    vi.doUnmock('./features/book/hooks/useBookExportArtifactWorkspaceQuery')
    vi.doUnmock('./features/book/hooks/useBookDraftWorkspaceQuery')
    vi.doUnmock('./features/book/hooks/useBookExportPreviewQuery')
    vi.doUnmock('./features/book/hooks/useBookManuscriptCompareQuery')
    vi.unmock('@tanstack/react-query')
    setSceneBridge(undefined)
    latestReplaceRoute = null
    window.localStorage.clear()
    setNavigatorLanguage(originalNavigatorLanguage)
    resetMockChapterDb()
    resetMockBookExportArtifactDb()
    resetRememberedBookWorkbenchHandoffs()
  })

  it('restores scene execution route state from URL and keeps tab / beat / proposal in sync', async () => {
    const user = userEvent.setup()

    const firstRender = await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
    )

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Filtered to beat-bargain')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('proposalId')).toBe('proposal-2')

    const selectedProposalCard = screen
      .getByRole('heading', { name: 'Let Mei name the cost in private terms' })
      .closest('section')
    expect(selectedProposalCard).toHaveClass('border-line-strong')

    const refreshSearch = window.location.search
    firstRender.unmount()

    await renderFreshApp(refreshSearch)

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Filtered to beat-bargain')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('proposalId')).toBe('proposal-2')
    expect(
      screen.getByRole('heading', { name: 'Let Mei name the cost in private terms' }).closest('section'),
    ).toHaveClass('border-line-strong')

    await user.click(
      within(screen.getByRole('heading', { name: 'Beat Filters' }).closest('aside')!).getByRole('button', {
        name: /Departure bell/i,
      }),
    )
    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('beatId')).toBe('beat-departure')
    })

    await user.click(screen.getByRole('button', { name: 'Open Prose' }))
    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('tab')).toBe('prose')
  })

  it('wires continue run, thread switching, versions, export, and open prose actions', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getAllByText('paused').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Continue Run' }))
    await waitFor(() => {
      expect(screen.queryAllByText('paused')).toHaveLength(0)
      expect(screen.getByRole('button', { name: 'Continue Run' })).toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Open Prose' }))
    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Execution' }))
    const inspector = screen.getByTestId('scene-inspector')
    await user.click(within(inspector).getByRole('button', { name: 'Versions' }))
    expect(await within(inspector).findByText('Version Checkpoints')).toBeInTheDocument()

    const threadSelect = screen.getByDisplayValue('Mainline')
    await user.selectOptions(threadSelect, 'thread-branch-a')
    await waitFor(() => {
      expect(threadSelect).toHaveValue('thread-branch-a')
      expect(screen.getAllByText('Alternate thread keeps Mei on the stronger bargaining line while Ren yields no public ground.').length).toBeGreaterThan(0)
    })

    await user.click(screen.getByRole('button', { name: 'Export' }))
    expect(screen.getByRole('dialog', { name: 'Export scene workspace' })).toBeInTheDocument()
  })

  it('preserves unrelated search params while scene route state changes', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&utm=keep-me')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('utm')).toBe('keep-me')

    await user.click(
      within(screen.getByRole('heading', { name: 'Beat Filters' }).closest('aside')!).getByRole('button', {
        name: /Departure bell/i,
      }),
    )
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('beatId')).toBe('beat-departure')
      expect(params.get('utm')).toBe('keep-me')
    })

    await user.click(screen.getByRole('button', { name: 'Open Prose' }))
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('tab')).toBe('prose')
      expect(params.get('utm')).toBe('keep-me')
    })

    await user.click(screen.getByRole('button', { name: 'Export' }))
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('modal')).toBe('export')
      expect(params.get('utm')).toBe('keep-me')
    })
  })

  it('shows an explicit capability failure when a preload bridge is present but scene reads are unavailable', async () => {
    setSceneBridge({})

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Scene unavailable')).toBeInTheDocument()
    expect(screen.getByText('Scene runtime capability "getSceneWorkspace" is unavailable for preload-bridge.')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Mock')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Healthy')
    expect(screen.queryByText('Proposal Review')).not.toBeInTheDocument()
  })

  it('keeps fallback runtime messaging product-facing when no bridge is available', async () => {
    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Mock')
    expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Healthy')
    expect(screen.queryByText('Preview Data')).not.toBeInTheDocument()
    expect(screen.queryByText('Mock Fallback')).not.toBeInTheDocument()
  })

  it('keeps the active lens and tab when selecting a different scene from the navigator', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose')

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()

    await user.click(getNavigatorSceneButton('Ticket Window'))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('id')).toBe('scene-ticket-window')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('tab')).toBe('prose')
    })

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()
  })

  it('derives scene navigator items from the active scene chapter', async () => {
    await renderFreshApp('?scope=scene&id=scene-concourse-delay&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Signals in Rain / Concourse Delay / Orchestrate / Execution')).toBeInTheDocument()
    expect(getNavigatorSceneButton('Midnight Platform')).toBeInTheDocument()
    expect(getNavigatorSceneButton('Concourse Delay')).toHaveClass(
      'border-line-strong',
    )
    expect(getNavigatorSceneButton('Ticket Window')).toBeInTheDocument()
    expect(getNavigatorSceneButton('Departure Bell')).toBeInTheDocument()
    expectNavigatorSceneOrder(['Midnight Platform', 'Concourse Delay', 'Ticket Window', 'Departure Bell'])
    expect(screen.queryByRole('button', { name: /Warehouse Bridge/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Canal Watch/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Dawn Slip/i })).not.toBeInTheDocument()
  })

  it('keeps preview-only open-water scenes out of the canonical navigator path', async () => {
    await renderFreshApp('?scope=scene&id=scene-warehouse-bridge&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Open Water Signals / Warehouse Bridge / Orchestrate / Execution')).toBeInTheDocument()
    expect(getNavigatorSceneButton('Warehouse Bridge')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Canal Watch/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Dawn Slip/i })).not.toBeInTheDocument()
  })

  it('keeps chapter-derived navigator placeholders while scene cards are still loading', async () => {
    vi.doMock('@tanstack/react-query', async () => {
      const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')

      return {
        ...actual,
        useQueries: () => [{ data: undefined }, { data: undefined }, { data: undefined }, { data: undefined }],
      }
    })

    await renderFreshApp('?scope=scene&id=scene-concourse-delay&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(getNavigatorSceneButton('Midnight Platform')).toBeInTheDocument()
    expect(getNavigatorSceneButton('Concourse Delay')).toHaveClass(
      'border-line-strong',
    )
    expect(getNavigatorSceneButton('Ticket Window')).toBeInTheDocument()
    expect(getNavigatorSceneButton('Departure Bell')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Warehouse Bridge/i })).not.toBeInTheDocument()
    expect(screen.getByText('A crowd bottleneck should slow the exit without resolving who controls the courier line.')).toBeInTheDocument()
  })

  it('derives shell metadata from the active scene workspace data', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Signals in Rain / Midnight Platform / Orchestrate / Execution')).toBeInTheDocument()
    expect(screen.getAllByText('Run 07').length).toBeGreaterThan(0)
    expect(screen.getAllByText('review').length).toBeGreaterThan(0)

    await user.click(getNavigatorSceneButton('Ticket Window'))

    await waitFor(() => {
      expect(screen.getByText('Signals in Rain / Ticket Window / Orchestrate / Execution')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Run 03').length).toBeGreaterThan(0)
    expect(screen.getAllByText('review').length).toBeGreaterThan(0)
  })

  it('supports open scene -> execution -> accept / rewrite / reject -> patch preview -> commit -> prose', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText(/Patch Preview: 1/i)).toBeInTheDocument()
    expect(screen.queryAllByText('committed')).toHaveLength(0)

    const proposalCard = screen
      .getByRole('heading', { name: 'Let Mei name the cost in private terms' })
      .closest('section')
    expect(proposalCard).not.toBeNull()

    const rewriteCard = screen
      .getByRole('heading', { name: 'Force the bargain into a visible stalemate' })
      .closest('section')
    expect(rewriteCard).not.toBeNull()

    const rejectCard = screen
      .getByRole('heading', { name: 'Hold the train bell until Ren commits to a choice' })
      .closest('section')
    expect(rejectCard).not.toBeNull()

    await user.click(within(proposalCard!).getByRole('button', { name: 'Accept' }))
    await user.click(within(rewriteCard!).getByRole('button', { name: 'Request Rewrite' }))
    await user.click(within(rejectCard!).getByRole('button', { name: 'Reject' }))

    await waitFor(() => {
      expect(screen.getByText(/Patch Preview: 2/i)).toBeInTheDocument()
    })
    expect(within(rewriteCard!).getByText(/rewrite-requested/i)).toBeInTheDocument()
    expect(within(rejectCard!).getByText(/rejected/i)).toBeInTheDocument()
    expect(screen.queryAllByText('committed')).toHaveLength(0)

    await user.click(screen.getByRole('button', { name: 'Patch Preview' }))

    const patchPreview = await screen.findByRole('dialog', { name: 'Patch preview' })
    expect(patchPreview).toBeInTheDocument()
    expect(within(patchPreview).getByText('Let Mei name the cost in private terms')).toBeInTheDocument()
    expect(within(patchPreview).queryByText('Visible stalemate summary')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commit Patch' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Commit Patch' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Patch preview' })).not.toBeInTheDocument()
      expect(screen.getAllByText('committed').length).toBeGreaterThan(0)
      expect(screen.getByText(/Patch Preview: 1/i)).toBeInTheDocument()
      expect(screen.getAllByText('Committed / Let Mei name the cost in private terms').length).toBeGreaterThan(0)
    })

    await user.click(screen.getByRole('button', { name: 'Open Prose' }))
    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('tab')).toBe('prose')
  })

  it('defaults to the system locale on first launch for localized UI and mock data', async () => {
    setNavigatorLanguage('zh-CN')

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByRole('heading', { name: '场景驾驶舱' })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText('午夜站台').length).toBeGreaterThan(0)
    })
    expect(screen.getByRole('status', { name: '项目运行时状态' })).toHaveTextContent('Mock')
    expect(screen.getByRole('status', { name: '项目运行时状态' })).toHaveTextContent('健康')
  })

  it('switches between English and Chinese without disturbing scene route state and remembers the choice', async () => {
    const user = userEvent.setup()

    setNavigatorLanguage('en-US')
    const firstRender = await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&proposalId=proposal-2',
    )

    expect(await screen.findByRole('heading', { name: 'Scene cockpit' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /中文/ }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '场景驾驶舱' })).toBeInTheDocument()
      expect(screen.getAllByText('午夜站台').length).toBeGreaterThan(0)
      expect(new URLSearchParams(window.location.search).get('id')).toBe('scene-midnight-platform')
      expect(new URLSearchParams(window.location.search).get('lens')).toBe('orchestrate')
      expect(new URLSearchParams(window.location.search).get('tab')).toBe('execution')
      expect(new URLSearchParams(window.location.search).get('proposalId')).toBe('proposal-2')
    })
    expect(screen.getAllByText('午夜站台').length).toBeGreaterThan(0)

    firstRender.unmount()
    setNavigatorLanguage('en-US')

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByRole('heading', { name: '场景驾驶舱' })).toBeInTheDocument()
  })

  it('rebuilds setup form data in the active locale after switching languages', async () => {
    const user = userEvent.setup()

    setNavigatorLanguage('en-US')
    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=structure&tab=setup')

    expect(await screen.findByDisplayValue('Midnight Platform')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /中文/ }))

    await waitFor(() => {
      expect(screen.getByDisplayValue('午夜站台')).toBeInTheDocument()
      expect(screen.getByText('场景设定简报')).toBeInTheDocument()
    })
  })

  it('enters the chapter structure scaffold from a direct deep link and restores the selected scene with the view after refresh', async () => {
    const user = userEvent.setup()

    const firstRender = await renderFreshApp(
      '?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=sequence&sceneId=scene-ticket-window',
    )

    const binderTicketWindow = await screen.findByRole('button', { name: /Scene 3 Ticket Window/i })
    const sequenceTicketWindow = await screen.findByRole('button', { name: /Sequence 3 Ticket Window/i })

    expect(binderTicketWindow).toBeInTheDocument()
    expect(sequenceTicketWindow).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chapter workbench' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chapters' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sequence' })).toHaveAttribute('aria-pressed', 'true')
    expect(binderTicketWindow).toHaveAttribute('aria-pressed', 'true')
    expect(sequenceTicketWindow).toHaveAttribute('aria-current', 'true')
    expect(screen.getAllByText('Ticket Window').length).toBeGreaterThanOrEqual(2)
    expect(
      screen.getAllByText(/The alias stays offstage while Mei tests whether Ren will trade certainty for speed\./i).length,
    ).toBeGreaterThanOrEqual(2)

    await user.click(screen.getByRole('button', { name: 'Assembly' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('structure')
      expect(params.get('view')).toBe('assembly')
      expect(params.get('sceneId')).toBe('scene-ticket-window')
    })

    const refreshSearch = window.location.search
    firstRender.unmount()

    await renderFreshApp(refreshSearch)

    expect(await screen.findByRole('button', { name: /Scene 3 Ticket Window/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Chapter workbench' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Assembly' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Scene 3 Ticket Window/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('heading', { name: 'Ticket Window' }).length).toBeGreaterThanOrEqual(1)
  })

  it('supports chapter outliner -> orchestrate -> back without losing the chapter view or selected scene', async () => {
    const user = userEvent.setup()

    await renderFreshApp(
      '?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-midnight-platform',
    )

    const targetRow = (await screen.findByRole('button', { name: /Beat line 3 Ticket Window/i })).closest('li')
    await user.click(within(targetRow!).getByRole('button', { name: 'Open in Orchestrate: Ticket Window' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-ticket-window')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
    })

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(getNavigatorSceneButton('Ticket Window')).toHaveClass(
      'border-line-strong',
    )

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('view')).toBe('outliner')
      expect(params.get('sceneId')).toBe('scene-ticket-window')
    })

    expect(await screen.findByRole('button', { name: /Beat line 3 Ticket Window/i })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: /Scene 3 Ticket Window/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('supports chapter assembly -> draft -> back without losing the chapter view or selected scene', async () => {
    const user = userEvent.setup()

    await renderFreshApp(
      '?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=assembly&sceneId=scene-concourse-delay',
    )

    const currentSeamSection = (await screen.findByRole('heading', { name: 'Current seam' })).closest('section')
    await user.click(within(currentSeamSection!).getByRole('button', { name: 'Open in Draft: Concourse Delay' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-concourse-delay')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('tab')).toBe('prose')
    })

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('view')).toBe('assembly')
      expect(params.get('sceneId')).toBe('scene-concourse-delay')
    })

    expect(await screen.findByRole('button', { name: /Scene 2 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByText('Concourse Delay').length).toBeGreaterThan(0)
  })

  it('reorders a chapter scene before opening orchestrate and the scene navigator keeps the new order', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=outliner&sceneId=scene-concourse-delay')

    const ticketWindowBinderItem = (await screen.findByRole('button', { name: /Scene 3 Ticket Window/i })).closest('li')
    await user.click(within(ticketWindowBinderItem!).getByRole('button', { name: 'Move earlier: Ticket Window' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Scene 2 Ticket Window/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Scene 3 Concourse Delay/i })).toHaveAttribute('aria-pressed', 'true')
    })

    const reorderedTicketWindowItem = screen.getByRole('button', { name: /Scene 2 Ticket Window/i }).closest('li')
    await user.click(within(reorderedTicketWindowItem!).getByRole('button', { name: 'Open in Orchestrate: Ticket Window' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-ticket-window')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
    })

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()

    const midnightButton = getNavigatorSceneButton('Midnight Platform')
    const ticketButton = getNavigatorSceneButton('Ticket Window')
    const concourseButton = getNavigatorSceneButton('Concourse Delay')
    const departureButton = getNavigatorSceneButton('Departure Bell')

    expect(midnightButton.compareDocumentPosition(ticketButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(ticketButton.compareDocumentPosition(concourseButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(concourseButton.compareDocumentPosition(departureButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('enters the asset workbench from a direct deep link and restores the asset mention view after a scene handoff', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions')

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mentions' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Relations' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open in Draft: Midnight Platform' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('tab')).toBe('prose')
    })

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-ren-voss')
      expect(params.get('lens')).toBe('knowledge')
      expect(params.get('view')).toBe('mentions')
    })

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mentions' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('navigates asset relations without leaving the asset scope', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=asset&id=asset-ren-voss&lens=knowledge&view=relations')

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Relations' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Relates to: Mei Arden' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-mei-arden')
      expect(params.get('lens')).toBe('knowledge')
      expect(params.get('view')).toBe('relations')
    })

    expect(await screen.findAllByText('Mei Arden')).not.toHaveLength(0)
  })

  it('enters book scope when clicking Book from the asset rail and can restore the asset snapshot afterward', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions')

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mentions' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Book' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('view')).toBe('sequence')
    })

    expect(await screen.findByRole('heading', { name: 'Book workbench' })).toBeInTheDocument()

    restoreDormantScope('asset')

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-ren-voss')
      expect(params.get('lens')).toBe('knowledge')
      expect(params.get('view')).toBe('mentions')
    })

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mentions' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('supports scene orchestrate -> asset -> back while restoring the scene scope, lens, tab, and traceability selection', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Traceability' }))

    expect(await screen.findByText('Traceability Links')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ren Voss' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-ren-voss')
      expect(params.get('lens')).toBe('knowledge')
      expect(params.get('view')).toBe('profile')
    })

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Profile' })).toHaveAttribute('aria-pressed', 'true')

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
    })

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Traceability Links')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ren Voss' })).toBeInTheDocument()
  })

  it('enters the book workbench from a direct deep link and restores the selected chapter with the active view after refresh', async () => {
    const firstRender = await renderFreshApp(
      '?scope=book&id=book-signal-arc&lens=structure&view=signals&selectedChapterId=chapter-open-water-signals',
    )

    expect(await screen.findByRole('heading', { name: 'Book workbench' })).toBeInTheDocument()
    expect(screen.getByText('Book / Structure / Signals')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('selectedChapterId')).toBe('chapter-open-water-signals')

    const refreshSearch = window.location.search
    firstRender.unmount()

    await renderFreshApp(refreshSearch)

    expect(await screen.findByRole('heading', { name: 'Book workbench' })).toBeInTheDocument()
    expect(screen.getByText('Book / Structure / Signals')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('selectedChapterId')).toBe('chapter-open-water-signals')
  })

  it('supports book structure -> book draft -> structure while restoring the dormant structure view', async () => {
    const user = userEvent.setup()

    await renderFreshApp(
      '?scope=book&id=book-signal-arc&lens=structure&view=signals&selectedChapterId=chapter-open-water-signals',
    )

    expect(await screen.findByRole('heading', { name: 'Book workbench' })).toBeInTheDocument()
    expect(screen.getByText('Book / Structure / Signals')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Draft' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('signals')
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Structure' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('lens')).toBe('structure')
      expect(params.get('view')).toBe('signals')
    })

    expect(await screen.findByRole('heading', { name: 'Book workbench' })).toBeInTheDocument()
    expect(screen.getByText('Book / Structure / Signals')).toBeInTheDocument()
  })

  it('supports book draft -> chapter draft -> browser back while restoring the selected chapter', async () => {
    await renderFreshApp('?scope=book&id=book-signal-arc&lens=draft&view=signals&selectedChapterId=chapter-open-water-signals')

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()

    act(() => {
      latestReplaceRoute?.({
        scope: 'chapter',
        chapterId: 'chapter-open-water-signals',
        lens: 'draft',
        sceneId: undefined,
      })
    })

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-open-water-signals')
      expect(params.get('lens')).toBe('draft')
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('selectedChapterId')).toBe('chapter-open-water-signals')
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('selectedChapterId')).toBe('chapter-open-water-signals')
  })

  it('supports scene -> book draft compare -> scene without breaking dormant state', async () => {
    const user = userEvent.setup()

    await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
    )

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()

    pushExternalRoute(
      '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=compare&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-open-water-signals',
    )

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('draftView')).toBe('compare')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('selectedChapterId')).toBe('chapter-open-water-signals')

    await user.click(screen.getByRole('button', { name: 'Scene' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
      expect(params.get('beatId')).toBe('beat-bargain')
      expect(params.get('proposalId')).toBe('proposal-2')
    })

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
  })

  it('supports scene -> book draft export -> scene without breaking dormant snapshots', async () => {
    const user = userEvent.setup()
    vi.resetModules()

    const [{ buildBookDraftExportStoryData }, artifactDb, bookClientModule] = await Promise.all([
      import('@/features/book/components/book-draft-storybook'),
      import('@/features/book/api/mock-book-export-artifact-db'),
      import('@/features/book/api/book-client'),
    ])
    const { buildBookExportArtifactInput, buildBookExportArtifactWorkspace } = await import('@/features/book/lib/book-export-artifact-mappers')
    artifactDb.resetMockBookExportArtifactDb()
    vi.spyOn(bookClientModule.bookClient, 'getBookExportArtifacts').mockImplementation(async (input) =>
      artifactDb.getMockBookExportArtifacts({
        bookId: input.bookId,
        exportProfileId: input.exportProfileId ?? undefined,
        checkpointId: input.checkpointId ?? undefined,
      }),
    )
    const runtimeBookClient = {
      ...bookClientModule.createBookClient(),
      getBookExportArtifacts: vi.fn(async (input: { bookId: string; exportProfileId?: string | null; checkpointId?: string | null }) =>
        artifactDb.getMockBookExportArtifacts({
          bookId: input.bookId,
          exportProfileId: input.exportProfileId ?? undefined,
          checkpointId: input.checkpointId ?? undefined,
        }),
      ),
      buildBookExportArtifact: vi.fn(async (input) => artifactDb.buildMockBookExportArtifact(input)),
    }
    const readyExportData = buildBookDraftExportStoryData('en', {
      variant: 'quiet-book',
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      exportProfileId: 'export-archive-snapshot',
      selectedChapterId: 'chapter-open-water-signals',
    })
    const readyReviewInbox = createReadyArtifactReviewInbox()
    const exportWorkspace = {
      ...readyExportData.exportWorkspace,
      bookId: 'book-signal-arc',
      profile: {
        ...readyExportData.exportWorkspace.profile,
        bookId: 'book-signal-arc',
      },
    }
    artifactDb.buildMockBookExportArtifact(
      buildBookExportArtifactInput({
        exportPreview: exportWorkspace,
        reviewInbox: readyReviewInbox,
        format: 'markdown',
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      }),
    )
    const readyDraftWorkspaceQuery = () => ({
      workspace: readyExportData.workspace,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })
    const readyExportPreviewQuery = () => ({
      exportWorkspace,
      exportProfiles: readyExportData.exportProfiles,
      selectedExportProfile: readyExportData.selectedExportProfile,
      isLoading: false,
      error: null,
    })
    const readyCompareQuery = () => ({
      compareWorkspace: readyExportData.compare,
      checkpoints: [],
      selectedCheckpoint: null,
      isLoading: false,
      error: null,
    })
    const readyArtifactWorkspaceQuery = () => ({
      artifactWorkspace: buildBookExportArtifactWorkspace({
        exportPreview: exportWorkspace,
        reviewInbox: readyReviewInbox,
        artifactRecords: artifactDb.getMockBookExportArtifacts({
          bookId: 'book-signal-arc',
          exportProfileId: 'export-archive-snapshot',
          checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
        }),
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      }),
      isLoading: false,
      error: null,
    })

    vi.doMock('@/features/book/hooks/useBookDraftWorkspaceQuery', () => ({
      useBookDraftWorkspaceQuery: readyDraftWorkspaceQuery,
    }))
    vi.doMock('./features/book/hooks/useBookDraftWorkspaceQuery', () => ({
      useBookDraftWorkspaceQuery: readyDraftWorkspaceQuery,
    }))
    vi.doMock('@/features/book/hooks/useBookExportPreviewQuery', () => ({
      useBookExportPreviewQuery: readyExportPreviewQuery,
    }))
    vi.doMock('./features/book/hooks/useBookExportPreviewQuery', () => ({
      useBookExportPreviewQuery: readyExportPreviewQuery,
    }))
    vi.doMock('@/features/book/hooks/useBookManuscriptCompareQuery', () => ({
      useBookManuscriptCompareQuery: readyCompareQuery,
    }))
    vi.doMock('./features/book/hooks/useBookManuscriptCompareQuery', () => ({
      useBookManuscriptCompareQuery: readyCompareQuery,
    }))
    vi.doMock('/Users/changlepan/new-narrative-novel/packages/renderer/src/features/book/hooks/useBookExportArtifactWorkspaceQuery.ts', () => ({
      useBookExportArtifactWorkspaceQuery: readyArtifactWorkspaceQuery,
    }))
    vi.doMock('@/features/review/hooks/useBookReviewInboxQuery', () => ({
      useBookReviewInboxQuery: () => ({
        inbox: readyReviewInbox,
        isLoading: false,
        error: null,
        decisionError: null,
        fixActionError: null,
        isEmpty: true,
      }),
    }))

    const { createMockProjectRuntime } = await import('@/app/project-runtime')
    const runtime = createMockProjectRuntime({
      bookClient: runtimeBookClient,
      persistence: {
        async loadProjectSnapshot() {
          return null
        },
        async saveProjectSnapshot() {},
        async clearProjectSnapshot() {},
      },
    })

    await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
      { resetModules: false, runtime },
    )

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()

    pushExternalRoute(
      '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-archive-snapshot&selectedChapterId=chapter-open-water-signals',
    )

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('draftView')).toBe('export')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('exportProfileId')).toBe('export-archive-snapshot')
      expect(params.get('selectedChapterId')).toBe('chapter-open-water-signals')
    })

    expect(await screen.findByRole('heading', { name: 'Book export preview' }, { timeout: 5000 })).toBeInTheDocument()
    const buildButton = screen.getByRole('button', { name: 'Build Markdown package' })
    expect(buildButton).toBeEnabled()

    await user.click(buildButton)

    await waitFor(() => {
      expect(runtimeBookClient.buildBookExportArtifact).toHaveBeenCalledWith(
        expect.objectContaining({
          exportProfileId: 'export-archive-snapshot',
          format: 'markdown',
        }),
      )
    })
    await user.click(screen.getByRole('button', { name: 'Plain text' }))
    await user.click(screen.getByRole('button', { name: 'Markdown' }))
    const artifactFilenameNodes = await screen.findAllByText(/export-archive-snapshot\.md/)
    expect(artifactFilenameNodes.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Narrative editor').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Built in mock export session').length).toBeGreaterThan(0)
    expect(
      await within(screen.getByRole('region', { name: 'Book draft bottom dock' })).findByText(
        'Entered Export Preview',
      ),
    ).toBeInTheDocument()

    act(() => {
      window.history.back()
    })

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
      expect(params.get('beatId')).toBe('beat-bargain')
      expect(params.get('proposalId')).toBe('proposal-2')
    })

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
  }, 15000)

  it('supports scene -> book draft branch -> scene without breaking dormant state', async () => {
    const user = userEvent.setup()

    await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
    )

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()

    pushExternalRoute(
      '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-high-pressure&branchBaseline=checkpoint&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-open-water-signals',
    )

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('draftView')).toBe('branch')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-high-pressure')
      expect(params.get('branchBaseline')).toBe('checkpoint')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('selectedChapterId')).toBe('chapter-open-water-signals')

    await user.click(screen.getByRole('button', { name: 'Scene' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
      expect(params.get('beatId')).toBe('beat-bargain')
      expect(params.get('proposalId')).toBe('proposal-2')
    })

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
  })


  it('supports scene -> book -> scene without losing the dormant scene snapshot', async () => {
    const user = userEvent.setup()

    await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
    )

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Filtered to beat-bargain')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Book' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('view')).toBe('sequence')
    })

    expect(await screen.findByRole('heading', { name: 'Book workbench' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Scene' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
      expect(params.get('beatId')).toBe('beat-bargain')
      expect(params.get('proposalId')).toBe('proposal-2')
    })

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Filtered to beat-bargain')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Let Mei name the cost in private terms' }).closest('section'),
    ).toHaveClass('border-line-strong')
  })

  it('preserves exportProfileId and branch routing boundaries when switching export snapshot -> branch -> export', async () => {
    await renderFreshApp('?scope=book&id=book-signal-arc&lens=draft&view=signals&selectedChapterId=chapter-open-water-signals')

    pushExternalRoute(
      '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-archive-snapshot&selectedChapterId=chapter-open-water-signals',
    )

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('export')
      expect(params.get('exportProfileId')).toBe('export-archive-snapshot')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
    })

    pushExternalRoute(
      '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-high-pressure&branchBaseline=current&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-archive-snapshot&selectedChapterId=chapter-open-water-signals',
    )

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('branch')
      expect(params.get('exportProfileId')).toBe('export-archive-snapshot')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-high-pressure')
      expect(params.get('branchBaseline')).toBe('current')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
    })

    pushExternalRoute(
      '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-book-signal-arc-pr11-baseline&branchId=branch-book-signal-arc-high-pressure&branchBaseline=current&exportProfileId=export-archive-snapshot&selectedChapterId=chapter-open-water-signals',
    )

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('export')
      expect(params.get('exportProfileId')).toBe('export-archive-snapshot')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-high-pressure')
      expect(params.get('branchBaseline')).toBe('current')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
    })

    expect(screen.queryByText('Book unavailable')).not.toBeInTheDocument()
  }, 10000)

  it('keeps scene chapter and asset dormant snapshots restorable after book compare routing', async () => {
    await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
    )

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Filtered to beat-bargain')).toBeInTheDocument()

    pushExternalRoute('?scope=chapter&id=chapter-signals-in-rain&lens=structure&view=assembly&sceneId=scene-concourse-delay')

    expect(await screen.findByRole('heading', { name: 'Chapter workbench' })).toBeInTheDocument()

    pushExternalRoute('?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions')

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()

    pushExternalRoute(
      '?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=compare&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-open-water-signals',
    )

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('signals')
      expect(params.get('draftView')).toBe('compare')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('selectedChapterId')).toBe('chapter-open-water-signals')
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()

    restoreDormantScope('scene')

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
      expect(params.get('beatId')).toBe('beat-bargain')
      expect(params.get('proposalId')).toBe('proposal-2')
    })

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Filtered to beat-bargain')).toBeInTheDocument()

    restoreDormantScope('chapter')

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('structure')
      expect(params.get('view')).toBe('assembly')
      expect(params.get('sceneId')).toBe('scene-concourse-delay')
    })

    expect(await screen.findByRole('heading', { name: 'Chapter workbench' })).toBeInTheDocument()

    restoreDormantScope('asset')

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-ren-voss')
      expect(params.get('lens')).toBe('knowledge')
      expect(params.get('view')).toBe('mentions')
    })

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
  })

  it('opens workbench editor tabs as local preference without writing editor state into the URL', async () => {
    const user = userEvent.setup()

    const firstRender = await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
    )

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(await screen.findByRole('tablist', { name: 'Open Editors' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Scene.*Orchestrate.*Execution/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expectNoEditorUrlParams()

    act(() => {
      latestReplaceRoute?.({
        scope: 'asset',
        assetId: 'asset-ren-voss',
        lens: 'knowledge',
        view: 'mentions',
      })
    })

    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Scene.*Orchestrate.*Execution/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Asset.*Knowledge.*Mentions/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expectNoEditorUrlParams()

    await user.click(screen.getByRole('tab', { name: /Scene.*Orchestrate.*Execution/i }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
      expect(params.get('beatId')).toBe('beat-bargain')
      expect(params.get('proposalId')).toBe('proposal-2')
    })
    expectNoEditorUrlParams()

    act(() => {
      latestReplaceRoute?.({
        scope: 'book',
        bookId: 'book-signal-arc',
        lens: 'draft',
        view: 'signals',
        draftView: 'review',
        reviewFilter: 'all',
        reviewStatusFilter: 'open',
        selectedChapterId: 'chapter-open-water-signals',
      })
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Book.*Draft.*Review/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: /Asset.*Knowledge.*Mentions/i })).toBeInTheDocument()
    expectNoEditorUrlParams()

    const refreshSearch = window.location.search
    firstRender.unmount()
    await renderFreshApp(refreshSearch)

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()
    expect(await screen.findByRole('tablist', { name: 'Open Editors' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Scene.*Orchestrate.*Execution/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Asset.*Knowledge.*Mentions/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Book.*Draft.*Review/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.click(screen.getByRole('button', { name: /Close Editor: Asset.*Knowledge/i }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('draftView')).toBe('review')
    })
    expect(screen.queryByRole('tab', { name: /Asset.*Knowledge.*Mentions/i })).not.toBeInTheDocument()
    expectNoEditorUrlParams()
  }, 10000)

  it('closes the active editor tab through the shell and restores the most recent remaining route', async () => {
    const user = userEvent.setup()

    await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2',
    )

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()

    act(() => {
      latestReplaceRoute?.({
        scope: 'asset',
        assetId: 'asset-ren-voss',
        lens: 'knowledge',
        view: 'mentions',
      })
    })
    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()

    act(() => {
      latestReplaceRoute?.({
        scope: 'chapter',
        chapterId: 'chapter-signals-in-rain',
        lens: 'structure',
        view: 'assembly',
        sceneId: 'scene-concourse-delay',
      })
    })
    expect(await screen.findByRole('heading', { name: 'Chapter workbench' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: /Asset.*Knowledge.*Mentions/i }))
    await waitFor(() => {
      expectBusinessSearchParams({
        scope: 'asset',
        id: 'asset-ren-voss',
        lens: 'knowledge',
        view: 'mentions',
      })
    })

    act(() => {
      latestReplaceRoute?.({
        scope: 'book',
        bookId: 'book-signal-arc',
        lens: 'draft',
        view: 'signals',
        draftView: 'compare',
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
        selectedChapterId: 'chapter-open-water-signals',
      })
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Book.*Draft.*Compare/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await user.click(screen.getByRole('button', { name: /Close Editor: Book.*Draft/i }))

    await waitFor(() => {
      expectBusinessSearchParams({
        scope: 'asset',
        id: 'asset-ren-voss',
        lens: 'knowledge',
        view: 'mentions',
      })
    })
    expect(await screen.findByRole('heading', { name: 'Asset knowledge' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Asset.*Knowledge.*Mentions/i })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('tab', { name: /Scene.*Orchestrate.*Execution/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Chapter.*Structure.*Assembly/i })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Book.*Draft.*Compare/i })).not.toBeInTheDocument()
  }, 10000)

  it('keeps the header runtime status stable across scope changes for the mock runtime', async () => {
    const initialSearch = '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution'
    const { createTestProjectRuntime } = await import('@/app/project-runtime')
    const runtime = createTestProjectRuntime({
      projectId: 'project-status-mock',
    })

    await renderFreshApp(initialSearch, {
      runtime,
    })

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Mock')
      expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Healthy')
    })

    const sceneParams = new URLSearchParams(window.location.search)
    expect(sceneParams.get('scope')).toBe('scene')
    expect(sceneParams.get('id')).toBe('scene-midnight-platform')
    expect(sceneParams.get('lens')).toBe('orchestrate')
    expect(sceneParams.get('tab')).toBe('execution')
    expect(sceneParams.get('proposalId')).toBe('proposal-1')
    expect([...sceneParams.keys()].some((key) => /runtime|health/i.test(key))).toBe(false)

    restoreDormantScope('chapter')

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Mock')
      expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Healthy')
    })

    const params = new URLSearchParams(window.location.search)
    expect(params.get('scope')).toBe('chapter')
    expect([...params.keys()].some((key) => /runtime|health/i.test(key))).toBe(false)
  })

  it('shows degraded API runtime status without breaking the workbench shell', async () => {
    const initialSearch = '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution'
    const { createFakeApiRuntime } = await import('@/app/project-runtime/fake-api-runtime.test-utils')
    const { runtime } = createFakeApiRuntime({
      projectId: 'project-status-api',
      overrides: [
        {
          method: 'GET',
          path: '/api/projects/project-status-api/runtime-info',
          error: new ApiRequestError({
            status: 503,
            message: 'runtime gateway unavailable',
          }),
        },
      ],
    })

    await renderFreshApp(initialSearch, {
      runtime,
    })

    expect(await screen.findByRole('heading', { name: 'Scene cockpit' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chapter' })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('API')
      expect(screen.getByRole('status', { name: 'Project runtime status' })).toHaveTextContent('Unavailable')
    })

    expect(screen.getByText('Workbench stays available while the runtime health recovers.')).toBeInTheDocument()
    expect(window.location.search).toBe(initialSearch)
  })
})
