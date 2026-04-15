import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

function setSceneBridge(bridge: Record<string, unknown> | undefined) {
  if (bridge) {
    Reflect.set(window, 'narrativeRuntimeBridge', { scene: bridge })
    return
  }

  Reflect.deleteProperty(window, 'narrativeRuntimeBridge')
}

async function renderFreshApp(search = '') {
  vi.resetModules()
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

describe('App scene workbench', () => {
  afterEach(() => {
    vi.clearAllMocks()
    setSceneBridge(undefined)
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

    await user.click(screen.getAllByRole('button', { name: 'Prose' })[1]!)
    expect(await screen.findByText('Prose Toolbar')).toBeInTheDocument()
    expect(new URLSearchParams(window.location.search).get('tab')).toBe('prose')
  })

  it('wires continue run, thread switching, versions, export, and open prose actions', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText('paused')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Continue Run' }))
    await waitFor(() => {
      expect(screen.queryByText('paused')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue Run' })).toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: 'Open Prose' }))
    expect(await screen.findByText('Prose Toolbar')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Execution' }))
    await user.click(screen.getAllByRole('button', { name: 'Versions' })[0]!)
    expect(await screen.findByText('Version Checkpoints')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox'), 'thread-branch-a')
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toHaveValue('thread-branch-a')
      expect(screen.getByText('Alternate thread keeps Mei on the stronger bargaining line while Ren yields no public ground.')).toBeInTheDocument()
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

    await user.click(screen.getAllByRole('button', { name: 'Prose' })[1]!)
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

  it('supports open scene -> accept -> patch preview -> commit as a separated smoke flow', async () => {
    const user = userEvent.setup()

    await renderFreshApp('?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    expect(screen.getByText(/Patch Preview: 1/i)).toBeInTheDocument()
    expect(screen.queryByText('committed')).not.toBeInTheDocument()

    const proposalCard = screen
      .getByRole('heading', { name: 'Let Mei name the cost in private terms' })
      .closest('section')
    expect(proposalCard).not.toBeNull()

    await user.click(within(proposalCard!).getByRole('button', { name: 'Accept' }))

    await waitFor(() => {
      expect(screen.getByText(/Patch Preview: 2/i)).toBeInTheDocument()
    })
    expect(screen.queryByText('committed')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Patch Preview' }))

    const patchPreview = await screen.findByRole('dialog', { name: 'Patch preview' })
    expect(patchPreview).toBeInTheDocument()
    expect(within(patchPreview).getByText('Let Mei name the cost in private terms')).toBeInTheDocument()
    expect(within(patchPreview).queryByText('Visible stalemate summary')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commit Patch' })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Commit Patch' }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Patch preview' })).not.toBeInTheDocument()
      expect(screen.getByText('committed')).toBeInTheDocument()
      expect(screen.getByText(/Patch Preview: 1/i)).toBeInTheDocument()
      expect(screen.getByText('Committed / Let Mei name the cost in private terms')).toBeInTheDocument()
    })
  })
})
