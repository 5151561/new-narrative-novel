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
  }, 20000)
})
