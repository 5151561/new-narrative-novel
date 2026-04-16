import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type PropsWithChildren } from 'react'

import { I18nProvider } from '@/app/i18n'
import { createSceneClient } from '@/features/scene/api/scene-client'
import { applyProseRevision, createSceneMockDatabase } from '@/mock/scene-fixtures'

import { SceneProseContainer } from './SceneProseContainer'

function wrapperFactory() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>{children}</I18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('SceneProseContainer', () => {
  it('applies a mock revision request and updates the prose status footer', async () => {
    const user = userEvent.setup()
    const client = createSceneClient()
    const Wrapper = wrapperFactory()

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('Current Draft')).toBeInTheDocument()
    })
    expect(screen.queryByText('Local Mock')).not.toBeInTheDocument()
    expect(screen.queryByText(/local mock state/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    await user.click(screen.getByRole('button', { name: 'Revise Draft' }))

    expect(await screen.findAllByText('Latest revision: compress pass prepared for review.')).toHaveLength(2)
    expect(screen.getByText('1 revision queued')).toBeInTheDocument()
  })

  it('shows a prose toolbar and exposes focus mode only when prose focus is available', async () => {
    const user = userEvent.setup()
    const client = createSceneClient()
    const Wrapper = wrapperFactory()

    const { rerender } = render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('Scene Prose Workbench')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Focus Mode' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Focus Mode' }))
    expect(screen.getByText('Focus mode active')).toBeInTheDocument()

    rerender(<SceneProseContainer sceneId="scene-warehouse-bridge" client={client} />)

    await waitFor(() => {
      expect(screen.getByText('No draft prose yet')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Focus Mode' })).not.toBeInTheDocument()
  })

  it('refetches bridge-backed prose after revise without mutating fallback fixtures', async () => {
    const user = userEvent.setup()
    const localDatabase = createSceneMockDatabase()
    const bridgeDatabase = createSceneMockDatabase()
    const client = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => ({
        getSceneProse: async () => structuredClone(bridgeDatabase.scenes['scene-midnight-platform']!.prose),
        reviseSceneProse: async (_sceneId, revisionMode) => {
          applyProseRevision(bridgeDatabase, 'scene-midnight-platform', revisionMode)
        },
      }),
    })
    const fallbackClient = createSceneClient({
      database: localDatabase,
      bridgeResolver: () => undefined,
    })
    const Wrapper = wrapperFactory()

    render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    await waitFor(() => {
      expect(screen.getByText('Current Draft')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    await user.click(screen.getByRole('button', { name: 'Revise Draft' }))

    expect(await screen.findAllByText('Latest revision: compress pass prepared for review.')).toHaveLength(2)
    expect(screen.getByText('1 revision queued')).toBeInTheDocument()

    const fallbackProse = await fallbackClient.getSceneProse('scene-midnight-platform')
    expect(fallbackProse.latestDiffSummary).not.toBe('Latest revision: compress pass prepared for review.')
    expect(fallbackProse.revisionQueueCount ?? 0).toBe(0)
  })
})
