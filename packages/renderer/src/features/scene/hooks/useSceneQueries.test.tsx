import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'

import { createSceneClient } from '@/features/scene/api/scene-client'
import { useSceneExecutionQuery } from './useSceneExecutionQuery'
import { useSceneWorkspaceQuery } from './useSceneWorkspaceQuery'

describe('scene query hooks', () => {
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

  it('hydrates workspace summary and defaults to execution-oriented data', async () => {
    const client = createSceneClient()
    const wrapper = wrapperFactory()

    const workspaceHook = renderHook(() => useSceneWorkspaceQuery('scene-midnight-platform', client), {
      wrapper,
    })

    await waitFor(() => {
      expect(workspaceHook.result.current.isLoading).toBe(false)
    })

    expect(workspaceHook.result.current.scene?.title).toBeTruthy()
    expect(workspaceHook.result.current.scene?.pendingProposalCount).toBeGreaterThan(0)

    const executionHook = renderHook(() => useSceneExecutionQuery('scene-midnight-platform', client), {
      wrapper,
    })

    await waitFor(() => {
      expect(executionHook.result.current.isLoading).toBe(false)
    })

    expect(executionHook.result.current.objective.goal).toBeTruthy()
    expect(executionHook.result.current.beats.length).toBeGreaterThan(0)
    expect(executionHook.result.current.proposals.length).toBeGreaterThan(0)
  })
})
