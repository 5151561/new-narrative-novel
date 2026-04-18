import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { resetRememberedBookWorkbenchHandoffs } from '../hooks/useBookWorkbenchActivity'
import * as bookWorkspaceQuery from '../hooks/useBookStructureWorkspaceQuery'
import { BookStructureWorkspace } from './BookStructureWorkspace'

function BookRouteHarness() {
  const { route } = useWorkbenchRouteState()

  return route.scope === 'book' ? <BookStructureWorkspace /> : <div>Non-book scope</div>
}

describe('BookStructureWorkspace', () => {
  afterEach(() => {
    resetRememberedBookWorkbenchHandoffs()
  })

  it('keeps navigator, stage, inspector, and bottom dock in sync with the selected chapter route', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=signals&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('button', { name: 'Chapter 2 Open Water Signals' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Warehouse to canal carry-through')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Book bottom dock' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Open in Structure: Open Water Signals' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-open-water-signals')
      expect(params.get('lens')).toBe('structure')
      expect(params.get('view')).toBe('sequence')
      expect(params.get('sceneId')).toBeNull()
    })
  })

  it('shows the handoff activity after a real book to chapter roundtrip back into the book workspace', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=signals&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    await screen.findByRole('button', { name: 'Chapter 2 Open Water Signals' })

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Open Water Signals' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-open-water-signals')
      expect(params.get('lens')).toBe('draft')
    })

    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('selectedChapterId')).toBe('chapter-open-water-signals')
    })

    expect(await screen.findByText('Opened Open Water Signals in Draft')).toBeInTheDocument()
  })

  it('records repeated handoffs to the same chapter and lens as distinct session-local activity entries', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=signals&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    await screen.findByRole('button', { name: 'Chapter 2 Open Water Signals' })

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Open Water Signals' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-open-water-signals')
      expect(params.get('lens')).toBe('draft')
    })

    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))

    await screen.findByText('Opened Open Water Signals in Draft')

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Open Water Signals' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-open-water-signals')
      expect(params.get('lens')).toBe('draft')
    })

    window.history.back()
    window.dispatchEvent(new PopStateEvent('popstate'))

    await waitFor(() => {
      expect(screen.getAllByText('Opened Open Water Signals in Draft')).toHaveLength(2)
    })
  })

  it('normalizes unsupported book view metadata and syncs the fallback selectedChapterId back into the route', async () => {
    vi.spyOn(bookWorkspaceQuery, 'useBookStructureWorkspaceQuery').mockReturnValue({
      workspace: {
        bookId: 'book-signal-arc',
        title: 'Signal Arc',
        summary: 'Roll up chapter pressure into one route-first book workspace.',
        selectedChapterId: 'chapter-signals-in-rain',
        chapters: [
          {
            chapterId: 'chapter-signals-in-rain',
            order: 1,
            title: 'Signals in Rain',
            summary: 'Platform pressure needs to hold until the departure bell.',
            sceneCount: 4,
            unresolvedCount: 8,
            draftedSceneCount: 3,
            missingDraftCount: 1,
            assembledWordCount: 1091,
            warningsCount: 6,
            queuedRevisionCount: 1,
            tracedSceneCount: 3,
            missingTraceSceneCount: 1,
            coverageStatus: 'attention',
            primaryProblemLabel: 'Departure bell timing',
            primaryAssemblyHintLabel: 'Carry platform pressure',
          },
        ],
        selectedChapter: {
          chapterId: 'chapter-signals-in-rain',
          order: 1,
          title: 'Signals in Rain',
          summary: 'Platform pressure needs to hold until the departure bell.',
          sceneCount: 4,
          unresolvedCount: 8,
          draftedSceneCount: 3,
          missingDraftCount: 1,
          assembledWordCount: 1091,
          warningsCount: 6,
          queuedRevisionCount: 1,
          tracedSceneCount: 3,
          missingTraceSceneCount: 1,
          coverageStatus: 'attention',
          primaryProblemLabel: 'Departure bell timing',
          primaryAssemblyHintLabel: 'Carry platform pressure',
        },
        totals: {
          chapterCount: 1,
          sceneCount: 4,
          unresolvedCount: 8,
          draftedSceneCount: 3,
          missingDraftCount: 1,
          tracedSceneCount: 3,
          missingTraceSceneCount: 1,
          assembledWordCount: 1091,
          warningsCount: 6,
          queuedRevisionCount: 1,
        },
        inspector: {
          selectedChapter: null,
          overview: {
            chapterCount: 1,
            sceneCount: 4,
            unresolvedCount: 8,
            draftedSceneCount: 3,
            missingDraftCount: 1,
            tracedSceneCount: 3,
            missingTraceSceneCount: 1,
            assembledWordCount: 1091,
            warningsCount: 6,
            queuedRevisionCount: 1,
          },
          riskHighlights: [
            {
              chapterId: 'chapter-signals-in-rain',
              kind: 'problem',
              label: 'Departure bell timing',
              detail: 'The bell still lands before the last negotiation beat resolves.',
            },
          ],
        },
        dockSummary: {
          selectedChapter: null,
          unresolvedCount: 8,
          missingDraftCount: 1,
          missingTraceSceneCount: 1,
          warningsCount: 6,
          problemItems: [
            {
              chapterId: 'chapter-signals-in-rain',
              kind: 'problem',
              label: 'Departure bell timing',
              detail: 'The bell still lands before the last negotiation beat resolves.',
            },
          ],
        },
        viewsMeta: {
          availableViews: ['outliner'],
        },
      },
      isLoading: false,
      error: null,
      refetch: async () => undefined,
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=structure&view=sequence&selectedChapterId=chapter-missing',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('view')).toBe('outliner')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })
  })
})
