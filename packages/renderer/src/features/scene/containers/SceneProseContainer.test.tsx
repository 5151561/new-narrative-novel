import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type PropsWithChildren } from 'react'

import { createSceneClient } from '@/features/scene/api/scene-client'

import { SceneProseContainer } from './SceneProseContainer'

function wrapperFactory() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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

    await user.click(screen.getByRole('button', { name: 'Compress' }))
    await user.click(screen.getByRole('button', { name: 'Revise Draft' }))

    expect(await screen.findAllByText('Latest revise: compress pass applied locally.')).toHaveLength(2)
    expect(screen.getByText('1 mock revision queued')).toBeInTheDocument()
  })

  it('shows a prose toolbar and exposes focus mode only when prose focus is available', async () => {
    const user = userEvent.setup()
    const client = createSceneClient()
    const Wrapper = wrapperFactory()

    const { rerender } = render(<SceneProseContainer sceneId="scene-midnight-platform" client={client} />, {
      wrapper: Wrapper,
    })

    expect(await screen.findByText('Prose Toolbar')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Focus Mode' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Focus Mode' }))
    expect(screen.getByText('Focus mode active')).toBeInTheDocument()

    rerender(<SceneProseContainer sceneId="scene-warehouse-bridge" client={client} />)

    await waitFor(() => {
      expect(screen.getByText('No draft prose yet')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: 'Focus Mode' })).not.toBeInTheDocument()
  })
})
