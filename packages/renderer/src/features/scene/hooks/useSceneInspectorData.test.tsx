import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'

import { I18nProvider } from '@/app/i18n'
import { createSceneClient } from '@/features/scene/api/scene-client'

import { useSceneInspectorData } from './useSceneInspectorData'

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

describe('useSceneInspectorData', () => {
  it('exposes scene-aware context, versions, and runtime summaries for the inspector tabs', async () => {
    const client = createSceneClient()
    const wrapper = wrapperFactory()

    const hook = renderHook(() => useSceneInspectorData('scene-midnight-platform', client), {
      wrapper,
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.context.acceptedFacts.length).toBeGreaterThan(0)
    expect(hook.result.current.context.privateInfoGuard.summary).toContain('guard')
    expect(hook.result.current.context.actorKnowledgeBoundaries[0]?.actor.name).toBeTruthy()
    expect(hook.result.current.context.actorKnowledgeBoundaries[0]?.boundaries.length).toBeGreaterThan(0)
    expect(hook.result.current.versions.checkpoints.length).toBeGreaterThan(0)
    expect(hook.result.current.versions.patchCandidates[0]?.status).toBe('ready_for_commit')
    expect(hook.result.current.runtime.profile.label).toBe('Measured Pressure')
    expect(hook.result.current.runtime.metrics.costLabel).toBe('$0.19 est.')
  })
})
