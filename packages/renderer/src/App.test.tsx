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
    setSceneBridge(undefined)
    window.localStorage.clear()
    setNavigatorLanguage(originalNavigatorLanguage)
  })

  it('restores scene execution route state from URL and keeps tab / beat / proposal in sync', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution&beatId=beat-bargain&proposalId=proposal-2')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Filtered to beat-bargain')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('proposalId')).toBe('proposal-2')

    const selectedProposalCard = screen
      .getByRole('heading', { name: 'Let Mei name the cost in private terms' })
      .closest('section')
    expect(selectedProposalCard).toHaveClass('border-line-strong')

    await user.click(screen.getAllByRole('button', { name: /Departure bell/i })[0]!)
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

    await user.click(screen.getAllByRole('button', { name: /Departure bell/i })[0]!)
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

  it('derives runtime source from the scene client instead of hard-coding a mock badge', async () => {
    setSceneBridge({})

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Preload Bridge')).toBeInTheDocument()
    expect(screen.queryByText('Mock Runtime')).not.toBeInTheDocument()
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

    await user.click(screen.getByRole('button', { name: /Warehouse Bridge/i }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('id')).toBe('scene-warehouse-bridge')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('tab')).toBe('prose')
    })

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()
  })

  it('derives shell metadata from the active scene workspace data', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('Signals in Rain / Midnight Platform / Orchestrate / Execution')).toBeInTheDocument()
    expect(screen.getAllByText('Run 07').length).toBeGreaterThan(0)
    expect(screen.getAllByText('review').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Warehouse Bridge/i }))

    await waitFor(() => {
      expect(screen.getByText('Open Water Signals / Warehouse Bridge / Orchestrate / Execution')).toBeInTheDocument()
    })
    expect(screen.getAllByText('Draft').length).toBeGreaterThan(0)
    expect(screen.getAllByText('draft').length).toBeGreaterThan(0)
  })

  it('supports open scene -> accept -> patch preview -> commit as a separated smoke flow', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText(/Patch Preview: 1/i)).toBeInTheDocument()
    expect(screen.queryAllByText('committed')).toHaveLength(0)

    const proposalCard = screen
      .getByRole('heading', { name: 'Let Mei name the cost in private terms' })
      .closest('section')
    expect(proposalCard).not.toBeNull()

    await user.click(within(proposalCard!).getByRole('button', { name: 'Accept' }))

    await waitFor(() => {
      expect(screen.getByText(/Patch Preview: 2/i)).toBeInTheDocument()
    })
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
  })

  it('defaults to the system locale on first launch for localized UI and mock data', async () => {
    setNavigatorLanguage('zh-CN')

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByRole('heading', { name: '场景驾驶舱' })).toBeInTheDocument()
    expect(screen.getByText('叙事工作台')).toBeInTheDocument()
    expect(screen.getAllByText('午夜站台').length).toBeGreaterThan(0)
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
})
