import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'
import { createApiProjectRuntime } from '@/app/project-runtime'
import { createApiTransport } from '@/app/project-runtime/api-transport'

import { createTestServer } from '../../api/src/test/support/test-server'

const originalNavigatorLanguage = window.navigator.language
const projectId = 'book-signal-arc'
const sceneRoute = '/workbench?scope=scene&id=scene-midnight-platform&lens=orchestrate&tab=execution'

function nonEditorCloseButtonName(label: string) {
  return new RegExp(`^(?!Close Editor:).*${label}`, 'i')
}

function expectNavigatorSceneOrder(navigator: ReturnType<typeof within>, labels: string[]) {
  for (let index = 0; index < labels.length - 1; index += 1) {
    const currentButton = navigator.getByRole('button', { name: nonEditorCloseButtonName(labels[index]!) })
    const nextButton = navigator.getByRole('button', { name: nonEditorCloseButtonName(labels[index + 1]!) })
    expect(currentButton.compareDocumentPosition(nextButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  }
}

vi.mock('@/features/scene/containers/SceneInspectorContainer', () => ({
  SceneInspectorContainer: ({ sceneId }: { sceneId: string }) => <div data-testid="scene-inspector">{sceneId}</div>,
}))

function setNavigatorLanguage(language: string) {
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    value: language,
  })
}

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

async function renderSceneApp(baseUrl: string) {
  window.history.replaceState({}, '', sceneRoute)
  const runtime = createApiProjectRuntime({
    projectId,
    transport: createApiTransport({ baseUrl }),
  })
  const { default: App } = await import('./App')

  return render(
    <AppProviders runtime={runtime} queryClient={createQueryClient()}>
      <App />
    </AppProviders>,
  )
}

describe('App scene runtime smoke', () => {
  const servers: Array<ReturnType<typeof createTestServer>> = []

  beforeEach(() => {
    setNavigatorLanguage('en-US')
    window.localStorage.clear()
  })

  afterEach(async () => {
    setNavigatorLanguage(originalNavigatorLanguage)
    window.localStorage.clear()

    while (servers.length > 0) {
      await servers.pop()?.app.close()
    }
  })

  it('drives the HTTP runtime through Run Scene, waiting review, accept, and scene refresh surfaces', async () => {
    const user = userEvent.setup()
    const server = createTestServer()
    servers.push(server)

    await server.app.listen({
      host: server.config.host,
      port: 0,
    })

    const address = server.app.server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Expected a TCP address from the test API server.')
    }

    await renderSceneApp(`http://${server.config.host}:${address.port}`)

    const initialParams = new URLSearchParams(window.location.search)
    expect(initialParams.get('scope')).toBe('scene')
    expect(initialParams.get('id')).toBe('scene-midnight-platform')
    expect(initialParams.get('lens')).toBe('orchestrate')
    expect(initialParams.get('tab')).toBe('execution')

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    const navigator = screen.getByRole('region', { name: 'Navigator' })
    await waitFor(() => {
      expect(within(navigator).getByRole('button', { name: nonEditorCloseButtonName('Midnight Platform') })).toBeInTheDocument()
      expect(within(navigator).getByRole('button', { name: nonEditorCloseButtonName('Concourse Delay') })).toBeInTheDocument()
      expect(within(navigator).getByRole('button', { name: nonEditorCloseButtonName('Ticket Window') })).toBeInTheDocument()
      expect(within(navigator).getByRole('button', { name: nonEditorCloseButtonName('Departure Bell') })).toBeInTheDocument()
    })
    expectNavigatorSceneOrder(within(navigator), [
      'Midnight Platform',
      'Concourse Delay',
      'Ticket Window',
      'Departure Bell',
    ])
    expect(within(navigator).queryByRole('button', { name: /Canal Watch/i })).not.toBeInTheDocument()
    expect(within(navigator).queryByRole('button', { name: /Dawn Slip/i })).not.toBeInTheDocument()

    expect(screen.getAllByRole('button', { name: 'Run Scene' }).length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole('button', { name: 'Run Scene' })[0]!)

    const bottomDock = screen.getByRole('region', { name: 'Bottom Dock' })

    await waitFor(() => {
      expect(within(bottomDock).getByText('Active Run Support')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Midnight platform scene run')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(within(bottomDock).getByText('Waiting Review')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Context packet built')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Proposal set created')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Review requested')).toBeInTheDocument()
    })

    await user.click(within(bottomDock).getByRole('button', { name: 'Open Scene proposal set' }))
    await waitFor(() => {
      expect(within(bottomDock).getAllByText('Proposals').length).toBeGreaterThan(0)
      expect(within(bottomDock).getAllByText('Review Options').length).toBeGreaterThan(0)
    })

    const runReviewGate = screen.getAllByText('Run Review Gate')[0]?.closest('section')
    if (!runReviewGate) {
      throw new Error('Expected the run review gate to be visible before submitting acceptance.')
    }

    await user.click(within(runReviewGate).getByRole('button', { name: 'Accept With Edit' }))
    await user.click(within(runReviewGate).getByRole('button', { name: 'Submit Accept With Edit' }))

    await waitFor(() => {
      expect(within(bottomDock).queryByText('Pending review')).not.toBeInTheDocument()
      expect(within(bottomDock).getAllByText('Completed').length).toBeGreaterThan(0)
      expect(within(bottomDock).getByText('Review decision submitted')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Canon patch applied')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Prose generated')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Run completed')).toBeInTheDocument()
    })

    const inspector = within(bottomDock).getByRole('region', { name: 'Run Inspector' })
    await user.click(within(inspector).getByRole('button', { name: 'Trace' }))

    await waitFor(() => {
      expect(within(inspector).getByText('Canon patches')).toBeInTheDocument()
      expect(within(inspector).getByText('Prose drafts')).toBeInTheDocument()
      expect(within(inspector).getByText('Accepted into canon')).toBeInTheDocument()
      expect(within(inspector).getByText('Rendered as prose')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Open Prose' })).toBeEnabled()
    })

    await user.click(screen.getByRole('button', { name: 'Open Prose' }))

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()
    expect(within(bottomDock).getByText('Active Run Support')).toBeInTheDocument()
    expect(within(bottomDock).getAllByText('Proposal set accepted with editor adjustments applied to canon and prose.').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Midnight Platform opens from the accepted run artifact/i).length).toBeGreaterThan(0)
    const proseSearch = window.location.search
    const revisionBrief = 'Keep the witness pressure public.'

    await user.click(screen.getByRole('button', { name: 'Expand' }))
    expect(window.location.search).toBe(proseSearch)
    await user.type(screen.getByLabelText('Revision brief'), revisionBrief)
    expect(window.location.search).toBe(proseSearch)
    await user.click(screen.getByRole('button', { name: 'Request Revision' }))

    await waitFor(() => {
      expect(screen.getByText('Pending revision candidate')).toBeInTheDocument()
      expect(screen.getAllByText(/Expanded witness-facing beats while preserving accepted provenance\./).length).toBeGreaterThan(0)
      expect(screen.getByText(new RegExp(`Editorial instruction: ${revisionBrief.replace('.', '\\.')}`))).toBeInTheDocument()
    })

    expect(screen.getAllByText(/Midnight Platform opens from the accepted run artifact/i).length).toBeGreaterThan(0)
    expect(window.location.search).toBe(proseSearch)

    await user.click(screen.getByRole('button', { name: 'Accept Revision' }))

    await waitFor(() => {
      expect(screen.queryByText('Pending revision candidate')).not.toBeInTheDocument()
      expect(screen.getByText(new RegExp(`Editorial instruction: ${revisionBrief.replace('.', '\\.')}`))).toBeInTheDocument()
    })

    expect(window.location.search).toBe(proseSearch)

    await user.click(screen.getByRole('button', { name: 'Chapter' }))
    await user.click(screen.getByRole('button', { name: 'Draft' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
    })

    expect(await screen.findByRole('heading', { name: 'Chapter draft' })).toBeInTheDocument()

    const midnightDraftButtons = await screen.findAllByRole('button', { name: /Scene 1 Midnight Platform/i })
    await user.click(midnightDraftButtons.at(-1)!)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Selected section' })).toBeInTheDocument()
    })

    const selectedSection = screen.getByRole('heading', { name: 'Selected section' }).closest('section')
    if (!selectedSection) {
      throw new Error('Expected the selected chapter section to be visible.')
    }

    expect(
      within(screen.getByTestId('workbench-main-stage-scroll-body')).getByText(
        new RegExp(`Editorial instruction: ${revisionBrief.replace('.', '\\.')}`),
      ),
    ).toBeInTheDocument()
    expect(within(selectedSection).getByText('Expanded witness-facing beats while preserving accepted provenance.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Book' }))
    await user.click(screen.getByRole('button', { name: 'Draft' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
    })

    expect(await screen.findAllByText('Book manuscript')).not.toHaveLength(0)

    await user.click(screen.getAllByRole('button', { name: 'Chapter 1 Signals in Rain' })[0]!)

    expect(
      within(screen.getByTestId('workbench-main-stage-scroll-body')).getByText(
        new RegExp(`Editorial instruction: ${revisionBrief.replace('.', '\\.')}`),
      ),
    ).toBeInTheDocument()
    const selectedDestination = screen.getByRole('region', { name: 'Selected manuscript destination' })
    expect(within(selectedDestination).getByText('Keep the chapter order stable, then return here once the scene draft is ready.')).toBeInTheDocument()
    expect(within(selectedDestination).getByText('Concourse Delay')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Book draft bottom dock' })).getByText('Focused Signals in Rain')).toBeInTheDocument()
  }, 20000)

  it('keeps request-rewrite terminal, explicit, and route-stable in the API-backed scene flow', async () => {
    const user = userEvent.setup()
    const server = createTestServer()
    servers.push(server)

    await server.app.listen({
      host: server.config.host,
      port: 0,
    })

    const address = server.app.server.address()
    if (!address || typeof address === 'string') {
      throw new Error('Expected a TCP address from the test API server.')
    }

    await renderSceneApp(`http://${server.config.host}:${address.port}`)

    expect(await screen.findByText('Proposal Review')).toBeInTheDocument()
    const initialParams = new URLSearchParams(window.location.search)
    expect(initialParams.get('scope')).toBe('scene')
    expect(initialParams.get('id')).toBe('scene-midnight-platform')
    expect(initialParams.get('lens')).toBe('orchestrate')
    expect(initialParams.get('tab')).toBe('execution')

    await user.click(screen.getAllByRole('button', { name: 'Run Scene' })[0]!)

    const bottomDock = screen.getByRole('region', { name: 'Bottom Dock' })
    await waitFor(() => {
      expect(within(bottomDock).getByText('Waiting Review')).toBeInTheDocument()
    })

    const runReviewGate = screen.getAllByText('Run Review Gate')[0]?.closest('section')
    if (!runReviewGate) {
      throw new Error('Expected the run review gate to be visible before submitting request rewrite.')
    }

    await user.click(within(runReviewGate).getByRole('button', { name: 'Request Rewrite' }))
    expect(
      within(runReviewGate).getByText(
        'Submitting Request Rewrite closes this run. Start a new run explicitly when the rewrite brief is ready; this decision does not continue in the background.',
      ),
    ).toBeInTheDocument()
    await user.type(within(runReviewGate).getByLabelText('Review note'), 'Rebuild the witness handoff before the next pass.')
    await user.click(within(runReviewGate).getByRole('button', { name: 'Submit Rewrite Request' }))

    await waitFor(() => {
      expect(screen.getAllByText('Rewrite requested. Start a new run to continue.').length).toBeGreaterThan(0)
      expect(screen.getAllByText('This run is closed. Start a new run explicitly to continue from the rewrite brief.').length).toBeGreaterThan(0)
      expect(within(bottomDock).getByRole('heading', { name: 'New run required' })).toBeInTheDocument()
      expect(within(bottomDock).getByText('This run is closed. Start a new run from the Main Stage when the rewrite brief is ready.')).toBeInTheDocument()
      expect(within(bottomDock).getByText('Review decision submitted')).toBeInTheDocument()
    })

    expect(screen.queryByText('Pending review')).not.toBeInTheDocument()
    expect(screen.queryByText('Run Review Gate')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Prose' })).toBeDisabled()
    const finalParams = new URLSearchParams(window.location.search)
    expect(finalParams.get('scope')).toBe('scene')
    expect(finalParams.get('id')).toBe('scene-midnight-platform')
    expect(finalParams.get('lens')).toBe('orchestrate')
    expect(finalParams.get('tab')).toBe('execution')
  }, 20000)
})
