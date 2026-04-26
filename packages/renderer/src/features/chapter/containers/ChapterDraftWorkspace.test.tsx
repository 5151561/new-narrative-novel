import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { createMockProjectRuntime } from '@/app/project-runtime'
import type { ChapterClient } from '@/features/chapter/api/chapter-client'
import { useChapterDraftTraceabilityQuery } from '@/features/traceability/hooks/useChapterDraftTraceabilityQuery'
import type { SceneClient } from '@/features/scene/api/scene-client'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { resetMockChapterDb } from '../api/mock-chapter-db'
import { mockChapterRecordSeeds } from '../api/mock-chapter-db'
import { ChapterDraftWorkspace } from './ChapterDraftWorkspace'

vi.mock('@/features/traceability/hooks/useChapterDraftTraceabilityQuery', async () => {
  const actual = await vi.importActual<typeof import('@/features/traceability/hooks/useChapterDraftTraceabilityQuery')>(
    '@/features/traceability/hooks/useChapterDraftTraceabilityQuery',
  )

  return {
    ...actual,
    useChapterDraftTraceabilityQuery: vi.fn(actual.useChapterDraftTraceabilityQuery),
  }
})

const mockedUseChapterDraftTraceabilityQuery = vi.mocked(useChapterDraftTraceabilityQuery)

afterEach(() => {
  resetMockChapterDb()
  window.localStorage.clear()
  mockedUseChapterDraftTraceabilityQuery.mockReset()
})

function ChapterRouteHarness() {
  const { route } = useWorkbenchRouteState()

  return route.scope === 'chapter' ? <ChapterDraftWorkspace /> : <div data-testid="route-scope">{route.scope}</div>
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })
}

describe('ChapterDraftWorkspace', () => {
  it('keeps binder, reader, inspector, and dock aligned to route.sceneId and roundtrips through scene draft', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-ticket-window',
    )

    render(
      <AppProviders>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    const ticketWindowButtons = await screen.findAllByRole('button', { name: /Scene 3 Ticket Window Ready for prose pass/i })
    expect(ticketWindowButtons.some((button) => button.getAttribute('aria-pressed') === 'true')).toBe(true)
    expect(ticketWindowButtons.some((button) => button.getAttribute('aria-current') === 'true')).toBe(true)
    const selectedSceneSection = screen.getByRole('heading', { name: 'Selected section' }).closest('section')
    expect(selectedSceneSection).not.toBeNull()
    expect(within(selectedSceneSection!).getAllByText('Ticket Window').length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Chapter draft bottom dock' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Scene 2 Concourse Delay Draft handoff ready/i })[1]!)

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('sceneId')).toBe('scene-concourse-delay')
    })

    const concourseButtons = screen.getAllByRole('button', { name: /Scene 2 Concourse Delay Draft handoff ready/i })
    expect(concourseButtons.some((button) => button.getAttribute('aria-pressed') === 'true')).toBe(true)
    expect(concourseButtons.some((button) => button.getAttribute('aria-current') === 'true')).toBe(true)
    expect(within(screen.getByRole('region', { name: 'Chapter draft bottom dock' })).getByText('Concourse Delay')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Concourse Delay' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-concourse-delay')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('tab')).toBe('prose')
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('assembly')
      expect(params.get('sceneId')).toBe('scene-concourse-delay')
    })

    const restoredConcourseButtons = await screen.findAllByRole('button', { name: /Scene 2 Concourse Delay Draft handoff ready/i })
    expect(restoredConcourseButtons.some((button) => button.getAttribute('aria-current') === 'true')).toBe(true)
  })

  it('opens asset knowledge from chapter traceability and browser back restores the same chapter scene focus', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-concourse-delay',
    )

    render(
      <AppProviders>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    const relatedAssetsSection = (await screen.findByRole('heading', { name: 'Related assets' })).closest('section')
    expect(relatedAssetsSection).not.toBeNull()

    await user.click(within(relatedAssetsSection!).getByRole('button', { name: 'Mei Arden' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-mei-arden')
      expect(params.get('lens')).toBe('knowledge')
      expect(params.get('view')).toBe('profile')
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('assembly')
      expect(params.get('sceneId')).toBe('scene-concourse-delay')
    })

    const restoredConcourseButtons = await screen.findAllByRole('button', { name: /Scene 2 Concourse Delay Draft handoff ready/i })
    expect(restoredConcourseButtons.some((button) => button.getAttribute('aria-current') === 'true')).toBe(true)
  })

  it('routes to book scope instead of falling through to scene when clicking Book from chapter draft', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-concourse-delay',
    )

    render(
      <AppProviders>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    await screen.findAllByRole('button', { name: /Scene 2 Concourse Delay Draft handoff ready/i })

    await user.click(screen.getByRole('button', { name: 'Book' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
    })

    expect(screen.getByTestId('route-scope')).toHaveTextContent('book')
  })

  it('keeps trace header signals visible with missing fallback counts while chapter traceability is still incomplete', async () => {
    mockedUseChapterDraftTraceabilityQuery.mockReturnValue({
      traceability: {
        chapterId: 'chapter-signals-in-rain',
        selectedSceneId: 'scene-midnight-platform',
        sceneSummariesBySceneId: {
          'scene-midnight-platform': {
            sceneId: 'scene-midnight-platform',
            sourceFactCount: 0,
            relatedAssetCount: 0,
            status: 'missing',
          },
          'scene-concourse-delay': {
            sceneId: 'scene-concourse-delay',
            sourceFactCount: 0,
            relatedAssetCount: 0,
            status: 'missing',
          },
        },
        selectedSceneTrace: null,
        chapterCoverage: null,
      },
      selectedSceneTraceLoading: true,
      chapterCoverageLoading: true,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-midnight-platform',
    )

    render(
      <AppProviders>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    await screen.findByRole('heading', { name: 'Chapter draft' })

    expect(screen.getAllByText('Trace missing').length).toBeGreaterThan(0)
    expect(screen.getAllByText('0 facts').length).toBeGreaterThan(0)
    expect(screen.getAllByText('0 assets').length).toBeGreaterThan(0)
  })

  it('keeps selected-scene reader and inspector trace semantics aligned while chapter coverage is still loading', async () => {
    mockedUseChapterDraftTraceabilityQuery.mockReturnValue({
      traceability: {
        chapterId: 'chapter-signals-in-rain',
        selectedSceneId: 'scene-concourse-delay',
        sceneSummariesBySceneId: {
          'scene-midnight-platform': {
            sceneId: 'scene-midnight-platform',
            sourceFactCount: 0,
            relatedAssetCount: 0,
            status: 'missing',
          },
          'scene-concourse-delay': {
            sceneId: 'scene-concourse-delay',
            sourceFactCount: 1,
            relatedAssetCount: 1,
            status: 'ready',
          },
        },
        selectedSceneTrace: {
          sceneId: 'scene-concourse-delay',
          acceptedFacts: [
            {
              id: 'fact-crowd-pressure',
              label: 'Crowd pressure stays visible',
              value: 'Keep the bottleneck public so the platform pressure does not dissolve.',
              sourceProposals: [{ proposalId: 'proposal-1', title: 'Carry witness pressure' }],
              relatedAssets: [{ assetId: 'asset-mei-arden', title: 'Mei Arden', kind: 'character' }],
            },
          ],
          relatedAssets: [{ assetId: 'asset-mei-arden', title: 'Mei Arden', kind: 'character' }],
          latestPatchSummary: 'Patch the public bottleneck through the ticket-window handoff.',
          latestDiffSummary: 'Carry the witness pressure forward without resolving courier ownership.',
          sourceProposalCount: 1,
          missingLinks: [],
        },
        chapterCoverage: null,
      },
      selectedSceneTraceLoading: false,
      chapterCoverageLoading: true,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-concourse-delay',
    )

    render(
      <AppProviders>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    await screen.findByRole('heading', { name: 'Selected section' })

    expect(screen.getAllByText('Trace ready').length).toBeGreaterThan(0)
    expect(screen.getByText('1 facts')).toBeInTheDocument()
    expect(screen.getByText('1 assets')).toBeInTheDocument()
    expect(screen.getByText('Crowd pressure stays visible')).toBeInTheDocument()
    expect(screen.getByText('Loading coverage')).toBeInTheDocument()
  })

  it('renders accepted prose, accept-with-edit prose, and explicit missing-draft gaps from the current chapter assembly', async () => {
    mockedUseChapterDraftTraceabilityQuery.mockReturnValue({
      traceability: {
        chapterId: 'chapter-signals-in-rain',
        selectedSceneId: 'scene-concourse-delay',
        sceneSummariesBySceneId: {
          'scene-midnight-platform': {
            sceneId: 'scene-midnight-platform',
            sourceFactCount: 2,
            relatedAssetCount: 1,
            status: 'ready',
          },
          'scene-concourse-delay': {
            sceneId: 'scene-concourse-delay',
            sourceFactCount: 1,
            relatedAssetCount: 1,
            status: 'ready',
          },
          'scene-ticket-window': {
            sceneId: 'scene-ticket-window',
            sourceFactCount: 0,
            relatedAssetCount: 0,
            status: 'missing',
          },
        },
        selectedSceneTrace: {
          sceneId: 'scene-concourse-delay',
          acceptedFacts: [],
          relatedAssets: [{ assetId: 'asset-mei-arden', title: 'Mei Arden', kind: 'character' }],
          latestPatchSummary: 'Edited acceptance now drives the concourse handoff.',
          latestDiffSummary: 'Witness pressure stays visible after the acceptance edit.',
          sourceProposalCount: 1,
          missingLinks: [],
        },
        chapterCoverage: {
          chapterId: 'chapter-signals-in-rain',
          tracedSceneCount: 2,
          missingTraceSceneCount: 1,
          sceneIdsMissingTrace: ['scene-ticket-window'],
          sceneIdsMissingAssets: ['scene-ticket-window'],
        },
      },
      selectedSceneTraceLoading: false,
      chapterCoverageLoading: false,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const chapterRecord = structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain'])
    chapterRecord.scenes = chapterRecord.scenes.slice(0, 3).map((scene) => structuredClone(scene))

    const chapterClient: Pick<ChapterClient, 'getChapterStructureWorkspace'> = {
      async getChapterStructureWorkspace() {
        return structuredClone(chapterRecord)
      },
    }
    const sceneClient: Pick<SceneClient, 'getSceneProse'> = {
      async getSceneProse(sceneId: string) {
        if (sceneId === 'scene-midnight-platform') {
          return {
            sceneId,
            proseDraft: 'Accepted platform prose now reflects the selected review variant.',
            revisionModes: ['rewrite'],
            latestDiffSummary: 'Accepted review decision propagated the selected platform variant.',
            warningsCount: 0,
            focusModeAvailable: true,
            revisionQueueCount: 0,
            draftWordCount: 9,
            statusLabel: 'Accepted variant propagated',
          }
        }

        if (sceneId === 'scene-concourse-delay') {
          return {
            sceneId,
            proseDraft: 'Edited concourse prose keeps the witness pressure visible after acceptance.',
            revisionModes: ['rewrite'],
            latestDiffSummary: 'Accept-with-edit preserved the revised witness handoff wording.',
            warningsCount: 1,
            focusModeAvailable: true,
            revisionQueueCount: 0,
            draftWordCount: 10,
            statusLabel: 'Accepted with edit',
          }
        }

        return {
          sceneId,
          revisionModes: ['rewrite'],
          latestDiffSummary: 'No prose artifact has been materialized for this scene yet.',
          warningsCount: 0,
          focusModeAvailable: true,
          revisionQueueCount: 1,
          statusLabel: 'Waiting for prose artifact',
        }
      },
    }

    const runtime = createMockProjectRuntime({
      chapterClient: chapterClient as ChapterClient,
      sceneClient: sceneClient as SceneClient,
      traceabilitySceneClient: sceneClient as SceneClient,
      persistence: {
        async loadProjectSnapshot() {
          return null
        },
        async saveProjectSnapshot() {},
        async clearProjectSnapshot() {},
      },
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=chapter&id=chapter-signals-in-rain&lens=draft&view=assembly&sceneId=scene-concourse-delay',
    )

    render(
      <AppProviders runtime={runtime} queryClient={createQueryClient()}>
        <ChapterRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Chapter draft' })).toBeInTheDocument()
    expect(screen.getByText('Accepted platform prose now reflects the selected review variant.')).toBeInTheDocument()
    expect(screen.getByText('Edited concourse prose keeps the witness pressure visible after acceptance.')).toBeInTheDocument()
    expect(screen.getAllByText('No prose artifact has been materialized for this scene yet.').length).toBeGreaterThan(0)
    expect(screen.getByText('Draft not started yet.')).toBeInTheDocument()
    expect(screen.getAllByText('Accepted with edit').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Waiting for prose artifact').length).toBeGreaterThan(0)
  })
})
