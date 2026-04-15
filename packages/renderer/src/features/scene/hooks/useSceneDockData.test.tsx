import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { type PropsWithChildren } from 'react'

import type { SceneClient } from '@/features/scene/api/scene-client'
import type { SceneDockTabId } from '@/features/scene/types/scene-view-models'

import { useSceneDockData } from './useSceneDockData'

const sceneId = 'scene-midnight-platform'

describe('useSceneDockData', () => {
  function createWrapper() {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    return function Wrapper({ children }: PropsWithChildren) {
      return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    }
  }

  it('hydrates only the active dock tab after the summary query resolves', async () => {
    const getSceneDockSummary = vi.fn(async () => ({
      events: [{ id: 'event-1', title: 'Dock summary ready', detail: 'Summary event' }],
      trace: [],
      consistency: {
        summary: 'Summary only',
        checks: [],
      },
      problems: {
        summary: 'Summary only',
        items: [],
      },
      cost: {
        currentWindowLabel: '$0.00',
        trendLabel: 'Summary only',
        breakdown: [],
      },
    }))
    const getSceneDockTab = vi.fn(async (_sceneId: string, tab: 'events' | 'trace' | 'consistency' | 'problems' | 'cost') => {
      if (tab === 'trace') {
        return {
          trace: [{ id: 'trace-1', title: 'Trace hydrated', detail: 'Deferred trace detail' }],
        }
      }

      return {
        events: [{ id: 'event-1', title: 'Dock summary ready', detail: 'Summary event' }],
      }
    })
    const client = {
      getSceneDockSummary,
      getSceneDockTab,
    } as Pick<SceneClient, 'getSceneDockSummary' | 'getSceneDockTab'> as SceneClient

    const wrapper = createWrapper()
    const initialProps: { activeTab: SceneDockTabId } = { activeTab: 'events' }
    const dockHook = renderHook(({ activeTab }: { activeTab: SceneDockTabId }) => useSceneDockData(sceneId, activeTab, client), {
      initialProps,
      wrapper,
    })

    await waitFor(() => {
      expect(dockHook.result.current.isLoading).toBe(false)
    })

    expect(getSceneDockSummary).toHaveBeenCalledWith(sceneId)
    expect(getSceneDockTab).not.toHaveBeenCalled()
    expect(dockHook.result.current.events[0]?.title).toBe('Dock summary ready')
    expect(dockHook.result.current.trace).toHaveLength(0)

    dockHook.rerender({ activeTab: 'trace' as const })

    await waitFor(() => {
      expect(dockHook.result.current.trace[0]?.title).toBe('Trace hydrated')
    })

    expect(getSceneDockTab).toHaveBeenCalledWith(sceneId, 'trace')
  })
})
