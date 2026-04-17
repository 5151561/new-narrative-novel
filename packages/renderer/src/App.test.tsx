import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

const originalNavigatorLanguage = window.navigator.language

function setSceneBridge(bridge: Record<string, unknown> | undefined) {
  if (bridge) {
    Reflect.set(window, 'narrativeRuntimeBridge', { scene: bridge })
    return
  }

  Reflect.deleteProperty(window, 'narrativeRuntimeBridge')
}

async function renderFreshApp(search = '') {
  vi.resetModules()
  vi.doMock('@/features/scene/containers/SceneInspectorContainer', () => ({
    SceneInspectorContainer: ({ sceneId }: { sceneId: string }) => {
      const { useState } = require('react') as typeof import('react')
      const [activeTab, setActiveTab] = useState<'context' | 'versions' | 'runtime'>('context')

      return (
        <div data-testid="scene-inspector">
          <div>{sceneId}</div>
          <button type="button" onClick={() => setActiveTab('context')}>
            Context
          </button>
          <button type="button" onClick={() => setActiveTab('versions')}>
            Versions
          </button>
          <button type="button" onClick={() => setActiveTab('runtime')}>
            Runtime
          </button>
          {activeTab === 'context' ? <div>Accepted Facts</div> : null}
          {activeTab === 'versions' ? <div>Version Checkpoints</div> : null}
          {activeTab === 'runtime' ? <div>Runtime Profile</div> : null}
        </div>
      )
    },
  }))
  window.history.replaceState({}, '', `/workbench${search}`)

  const [{ default: App }, { AppProviders }] = await Promise.all([
    import('./App'),
    import('./app/providers'),
  ])

  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  )
}

function setNavigatorLanguage(language: string) {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: language,
  })
}

describe('App scene workbench', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unmock('@tanstack/react-query')
    setSceneBridge(undefined)
    window.localStorage.clear()
    setNavigatorLanguage(originalNavigatorLanguage)
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
    expect(screen.getByText('Preload Bridge')).toBeInTheDocument()
    expect(screen.getByText('Scene runtime capability "getSceneWorkspace" is unavailable for preload-bridge.')).toBeInTheDocument()
    expect(screen.queryByText('Proposal Review')).not.toBeInTheDocument()
  })

  it('keeps fallback runtime messaging product-facing when no bridge is available', async () => {
    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Preview Data')).toBeInTheDocument()
    expect(screen.queryByText('Mock Fallback')).not.toBeInTheDocument()
  })

  it('keeps the active lens and tab when selecting a different scene from the navigator', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=draft&tab=prose')

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Ticket Window/i }))

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
    expect(screen.getByRole('button', { name: /Midnight Platform/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Concourse Delay/i })).toHaveClass('border-line-strong')
    expect(screen.getByRole('button', { name: /Ticket Window/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Departure Bell/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Warehouse Bridge/i })).not.toBeInTheDocument()
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
    expect(screen.getByRole('button', { name: /Midnight Platform/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Concourse Delay/i })).toHaveClass('border-line-strong')
    expect(screen.getByRole('button', { name: /Ticket Window/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Departure Bell/i })).toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: /Ticket Window/i }))

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
    expect(screen.getByText('叙事工作台')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText('午夜站台').length).toBeGreaterThan(0)
    })
    expect(screen.getByText('预览数据')).toBeInTheDocument()
  })

  it('switches between English and Chinese without disturbing scene route state and remembers the choice', async () => {
    const user = userEvent.setup()

    setNavigatorLanguage('en-US')
    const firstRender = await renderFreshApp(
      '?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&proposalId=proposal-2',
    )

    expect(await screen.findByRole('heading', { name: 'Scene cockpit' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '中文' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '场景驾驶舱' })).toBeInTheDocument()
      expect(screen.getByText('叙事工作台')).toBeInTheDocument()
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
    expect(screen.getByText('叙事工作台')).toBeInTheDocument()
  })

  it('rebuilds setup form data in the active locale after switching languages', async () => {
    const user = userEvent.setup()

    setNavigatorLanguage('en-US')
    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=structure&tab=setup')

    expect(await screen.findByDisplayValue('Midnight Platform')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '中文' }))

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
    expect(screen.getByRole('button', { name: /Ticket Window/i })).toHaveClass('border-line-strong')

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
})
