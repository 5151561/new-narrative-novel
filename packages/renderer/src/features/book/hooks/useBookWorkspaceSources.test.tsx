import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'

import { useBookWorkspaceSources } from './useBookWorkspaceSources'

function createWrapper() {
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

describe('useBookWorkspaceSources', () => {
  it('collects ordered chapter workspaces, ordered scene prose, and trace rollups from shared book sources', async () => {
    const hook = renderHook(() => useBookWorkspaceSources({ bookId: 'book-signal-arc' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.bookRecord).toMatchObject({
      bookId: 'book-signal-arc',
      chapterIds: ['chapter-signals-in-rain', 'chapter-open-water-signals'],
    })
    expect(hook.result.current.orderedChapterIds).toEqual([
      'chapter-signals-in-rain',
      'chapter-open-water-signals',
    ])
    expect(hook.result.current.chapterWorkspacesById['chapter-signals-in-rain']).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
    })
    expect(hook.result.current.chapterWorkspacesById['chapter-open-water-signals']).toMatchObject({
      chapterId: 'chapter-open-water-signals',
    })
    expect(hook.result.current.orderedSceneIds).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
      'scene-departure-bell',
      'scene-warehouse-bridge',
      'scene-canal-watch',
      'scene-dawn-slip',
    ])
    expect(hook.result.current.sceneProseBySceneId['scene-midnight-platform']).toMatchObject({
      sceneId: 'scene-midnight-platform',
      proseDraft: expect.any(String),
    })
    expect(hook.result.current.sceneProseBySceneId['scene-dawn-slip']).toMatchObject({
      sceneId: 'scene-dawn-slip',
    })
    expect(hook.result.current.traceRollupsBySceneId['scene-midnight-platform']).toMatchObject({
      sceneId: 'scene-midnight-platform',
      acceptedFactCount: expect.any(Number),
      sourceProposalCount: expect.any(Number),
    })
  })
})
