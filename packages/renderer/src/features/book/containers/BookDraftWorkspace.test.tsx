import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { resetMockReviewDecisionDb } from '@/features/review/api/mock-review-decision-db'
import { reviewClient } from '@/features/review/api/review-client'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import * as bookExperimentBranchQueryModule from '../hooks/useBookExperimentBranchQuery'
import { resetRememberedBookWorkbenchHandoffs } from '../hooks/useBookWorkbenchActivity'
import { BookDraftWorkspace } from './BookDraftWorkspace'

function BookRouteHarness() {
  const { route } = useWorkbenchRouteState()

  return route.scope === 'book' ? <BookDraftWorkspace /> : <div>Non-book scope</div>
}

describe('BookDraftWorkspace', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetRememberedBookWorkbenchHandoffs()
    resetMockReviewDecisionDb()
  })

  it('keeps binder reader inspector and dock aligned to route.selectedChapterId and roundtrips through chapter draft', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect((await screen.findAllByRole('button', { name: 'Chapter 2 Open Water Signals' })).some((button) => button.getAttribute('aria-pressed') === 'true')).toBe(true)
    expect(screen.getAllByRole('button', { name: 'Open in Draft: Open Water Signals' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Book draft bottom dock' })).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Chapter 1 Signals in Rain' })[0]!)

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    expect(screen.getAllByRole('button', { name: 'Chapter 1 Signals in Rain' }).some((button) => button.getAttribute('aria-pressed') === 'true')).toBe(true)
    expect(within(screen.getByRole('region', { name: 'Book draft bottom dock' })).getByText('Focused Signals in Rain')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Signals in Rain' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('sceneId')).toBeNull()
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    expect((await screen.findAllByRole('button', { name: 'Chapter 1 Signals in Rain' })).some((button) => button.getAttribute('aria-pressed') === 'true')).toBe(true)
  })

  it('roundtrips a deep-linked compare session while preserving checkpoint and dormant structure view', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=compare&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Book manuscript compare' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Chapter 2 Open Water Signals' }).some((button) => button.getAttribute('aria-pressed') === 'true'),
    ).toBe(true)
    expect(screen.getAllByText('PR11 Baseline').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Changed scenes/i).length).toBeGreaterThan(0)
    expect(within(screen.getByRole('region', { name: 'Book draft bottom dock' })).getByText(/Focused Open Water Signals/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Chapter 1 Signals in Rain' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
      expect(params.get('draftView')).toBe('compare')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
    })

    expect(
      screen.getAllByRole('button', { name: 'Chapter 1 Signals in Rain' }).some((button) => button.getAttribute('aria-pressed') === 'true'),
    ).toBe(true)
    expect(screen.getAllByText('Signals in Rain').length).toBeGreaterThan(0)

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Signals in Rain' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('signals')
      expect(params.get('draftView')).toBe('compare')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript compare' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Read' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('read')
      expect(params.get('view')).toBe('signals')
    })

    await user.click(screen.getByRole('button', { name: 'Structure' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('lens')).toBe('structure')
      expect(params.get('view')).toBe('signals')
    })
  })

  it('keeps the draft workspace mounted on a missing-checkpoint deep link and recovers through the picker', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=compare&checkpointId=checkpoint-missing&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Book manuscript' })).toBeInTheDocument()
    expect(await screen.findByLabelText('Manuscript checkpoint')).toBeInTheDocument()
    expect(await screen.findByText('Compare unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Book unavailable')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Chapter 2 Open Water Signals' }).length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('Manuscript checkpoint'), 'checkpoint-book-signal-arc-pr11-baseline')

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('draftView')).toBe('compare')
    })

    expect(await screen.findByRole('heading', { name: 'Book manuscript compare' })).toBeInTheDocument()
    expect(screen.getAllByText('PR11 Baseline').length).toBeGreaterThan(0)
  })

  it('roundtrips a deep-linked export session while preserving exportProfileId checkpointId and dormant structure view', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-review-packet&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export' })).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getAllByRole('button', { name: 'Chapter 2 Open Water Signals' }).some((button) => button.getAttribute('aria-pressed') === 'true'),
    ).toBe(true)
    expect(within(screen.getByRole('region', { name: 'Book draft bottom dock' })).getByText('Entered Export Preview')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Chapter 1 Signals in Rain' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('export')
      expect(params.get('exportProfileId')).toBe('export-review-packet')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
      expect(params.get('view')).toBe('signals')
    })

    await user.click(screen.getByRole('button', { name: /Submission Preview/i }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('export')
      expect(params.get('exportProfileId')).toBe('export-submission-preview')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Signals in Rain' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('signals')
      expect(params.get('draftView')).toBe('export')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('exportProfileId')).toBe('export-submission-preview')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    expect(await screen.findByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
  })

  it('surfaces a broken checkpoint baseline in export mode instead of rendering baseline-less readiness', async () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-missing&exportProfileId=export-review-packet&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
    expect(screen.getByText('Export preview unavailable')).toBeInTheDocument()
    expect(screen.getAllByText('Book manuscript checkpoint "checkpoint-missing" could not be found for "book-signal-arc".').length).toBeGreaterThan(0)
    expect(screen.queryByText('Readiness checklist')).not.toBeInTheDocument()
    expect(screen.getAllByText('Export baseline unavailable').length).toBeGreaterThan(0)
    expect(screen.getByText('Export readiness unavailable')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Book draft bottom dock' })).getByText('Export baseline unavailable')).toBeInTheDocument()
    expect(screen.queryByText('Manuscript Readiness')).not.toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Book draft bottom dock' })).queryByText('Missing draft chapters')).not.toBeInTheDocument()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('export')
      expect(params.get('checkpointId')).toBe('checkpoint-missing')
      expect(params.get('exportProfileId')).toBe('export-review-packet')
    })
  })

  it('roundtrips a deep-linked branch session while keeping binder, branch panels, draft/export handoff, and dormant view state aligned', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-high-pressure&branchBaseline=checkpoint&checkpointId=checkpoint-book-signal-arc-pr11-baseline&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Book experiment branch' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Branch' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Checkpoint baseline' })).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getAllByRole('button', { name: 'Chapter 2 Open Water Signals' }).some((button) => button.getAttribute('aria-pressed') === 'true'),
    ).toBe(true)
    expect(screen.getByText('Selected chapter branch summary')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Book draft bottom dock' })).getByText(/Entered Branch Review/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Chapter 1 Signals in Rain' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('branch')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-high-pressure')
      expect(params.get('branchBaseline')).toBe('checkpoint')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    await user.click(screen.getByRole('button', { name: 'Current baseline' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('branch')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-high-pressure')
      expect(params.get('branchBaseline')).toBe('current')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    await user.click(screen.getAllByRole('button', { name: /Quiet Ending/i })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('branch')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-quiet-ending')
      expect(params.get('branchBaseline')).toBe('current')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    expect(screen.getAllByText('Quiet Ending').length).toBeGreaterThan(0)
    expect(screen.getByText('Selected branch')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Checkpoint baseline' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('branch')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-quiet-ending')
      expect(params.get('branchBaseline')).toBe('checkpoint')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    await user.click(screen.getAllByRole('button', { name: 'Open in Draft: Signals in Rain' })[0]!)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('sceneId')).toBeNull()
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('signals')
      expect(params.get('draftView')).toBe('branch')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-quiet-ending')
      expect(params.get('branchBaseline')).toBe('checkpoint')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    expect(await screen.findByRole('heading', { name: 'Book experiment branch' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Export' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('export')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    await user.click(screen.getByRole('button', { name: /Submission Preview/i }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('export')
      expect(params.get('exportProfileId')).toBe('export-submission-preview')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })

    await user.click(screen.getByRole('button', { name: 'Structure' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('lens')).toBe('structure')
      expect(params.get('view')).toBe('signals')
      expect(params.get('draftView')).toBe('export')
      expect(params.get('exportProfileId')).toBe('export-submission-preview')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-quiet-ending')
      expect(params.get('branchBaseline')).toBe('checkpoint')
    })
  })

  it('renders branch unavailable instead of the loading shell when the branch list query fails', async () => {
    vi.spyOn(bookExperimentBranchQueryModule, 'useBookExperimentBranchQuery').mockReturnValue({
      branchWorkspace: undefined,
      branches: [],
      selectedBranch: undefined,
      isLoading: false,
      error: new Error('Branch list failed'),
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=branch&branchId=branch-book-signal-arc-high-pressure&branchBaseline=current&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Book experiment branch' })).toBeInTheDocument()
    expect(await screen.findByText('Branch unavailable')).toBeInTheDocument()
    expect(screen.getByText('Branch list failed')).toBeInTheDocument()
    expect(screen.queryByText('Loading manuscript')).not.toBeInTheDocument()
  })

  it('renders a deep-linked review route instead of falling through to the reader', async () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=scene-proposals&reviewIssueId=scene-proposal-seed-scene-5&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Scene proposals/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('canonicalizes deep-linked review routes with effective checkpoint export and branch defaults', async () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('review')
      expect(params.get('checkpointId')).toBe('checkpoint-book-signal-arc-pr11-baseline')
      expect(params.get('exportProfileId')).toBe('export-review-packet')
      expect(params.get('branchId')).toBe('branch-book-signal-arc-quiet-ending')
      expect(params.get('branchBaseline')).toBe('current')
      expect(params.get('view')).toBe('signals')
    })
  })

  it('surfaces review upstream failures instead of showing a silently healthy queue', async () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&checkpointId=checkpoint-missing&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()
    expect(screen.getByText('Review sources unavailable')).toBeInTheDocument()
    expect(screen.getByText('Book manuscript checkpoint "checkpoint-missing" could not be found for "book-signal-arc".')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Warnings' })).toBeInTheDocument()
  })

  it('updates reviewFilter in the URL when the filter changes', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Blockers/i }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('review')
      expect(params.get('reviewFilter')).toBe('blockers')
      expect(params.get('view')).toBe('signals')
    })
  })

  it('moves review issues between open and deferred queues and records review decision activity', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&reviewStatusFilter=open&reviewIssueId=compare-delta-chapter-2-scene-3&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument()
    const deferredIssueId = new URLSearchParams(window.location.search).get('reviewIssueId')

    await user.click(screen.getByRole('button', { name: 'Defer' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('reviewStatusFilter')).toBe('open')
      expect(params.get('reviewIssueId')).not.toBe('compare-delta-chapter-2-scene-3')
    })

    await user.click(screen.getByRole('button', { name: 'Deferred 1' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('reviewStatusFilter')).toBe('deferred')
      expect(params.get('reviewIssueId')).toBe(deferredIssueId)
    })

    expect(screen.getAllByText('Deferred').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Reopen' }))

    await waitFor(() => {
      expect(screen.getByText('No issues in this filter')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /^Open \d+$/ }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('reviewStatusFilter')).toBe('open')
      expect(params.get('reviewIssueId')).toBe(deferredIssueId)
    })

    const bottomDock = screen.getByLabelText('Book draft bottom dock')
    expect(within(bottomDock).getByText(/Deferred issue/)).toBeInTheDocument()
    expect(within(bottomDock).getByText(/Reopened issue/)).toBeInTheDocument()
  })

  it('does not record review decision activity when deferring fails', async () => {
    const user = userEvent.setup()
    const setReviewIssueDecisionSpy = vi.spyOn(reviewClient, 'setReviewIssueDecision').mockRejectedValueOnce(new Error('Decision failed'))

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&reviewStatusFilter=open&reviewIssueId=compare-delta-chapter-2-scene-3&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Defer' }))

    await waitFor(() => {
      expect(setReviewIssueDecisionSpy).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Defer' })).toBeInTheDocument()
    })

    const bottomDock = screen.getByLabelText('Book draft bottom dock')
    expect(within(bottomDock).queryByText(/Deferred issue/)).not.toBeInTheDocument()
  })

  it('derives review problems for the bottom dock from the runtime review inbox', async () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=export-readiness&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    const bottomDock = screen.getByLabelText('Book draft bottom dock')

    expect(within(bottomDock).getAllByText('Export blockers').length).toBeGreaterThan(0)
    expect(within(bottomDock).getAllByText('Branch blockers').length).toBeGreaterThan(0)
    expect(within(bottomDock).getAllByText('Missing drafts').length).toBeGreaterThan(0)
    expect(within(bottomDock).getAllByText('Warehouse Bridge still needs current draft prose.').length).toBeGreaterThan(0)
    expect(within(bottomDock).getAllByText('Departure Bell still lacks trace readiness for this export profile.').length).toBeGreaterThan(0)
  })

  it('settles stale reviewIssueId onto the effective blocker and aligns selectedChapterId to that issue chapter', async () => {
    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=blockers&reviewIssueId=scene-proposal-seed-scene-5&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('review')
      expect(params.get('reviewFilter')).toBe('blockers')
      expect(params.get('reviewIssueId')).not.toBe('scene-proposal-seed-scene-5')
      expect(params.get('selectedChapterId')).toBe('chapter-signals-in-rain')
    })
  })

  it('opens a book-scope review handoff into export mode while preserving book scope and dormant view', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=export-readiness&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Open export preview' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('draftView')).toBe('export')
      expect(params.get('view')).toBe('signals')
      expect(params.get('exportProfileId')).not.toBeNull()
    })

    expect(await screen.findByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
  })

  it('opens a scene handoff into scene orchestrate and browser back returns to the prior review route state', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=scene-proposals&reviewIssueId=scene-proposal-seed-scene-5&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open scene proposal' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-5')
      expect(params.get('lens')).toBe('orchestrate')
      expect(params.get('tab')).toBe('execution')
    })

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('id')).toBe('book-signal-arc')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('view')).toBe('signals')
      expect(params.get('draftView')).toBe('review')
      expect(params.get('reviewFilter')).toBe('scene-proposals')
      expect(params.get('reviewIssueId')).toBe('scene-proposal-seed-scene-5')
      expect(params.get('selectedChapterId')).toBe('chapter-open-water-signals')
    })

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()
  })

  it('keeps the dormant structure view through review roundtrips back to read and into review again', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Read' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('read')
      expect(params.get('view')).toBe('signals')
    })

    await user.click(screen.getByRole('button', { name: 'Review' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('draftView')).toBe('review')
      expect(params.get('view')).toBe('signals')
    })
  })
})
