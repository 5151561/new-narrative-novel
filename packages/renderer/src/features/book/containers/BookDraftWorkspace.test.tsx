import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { resetRememberedBookWorkbenchHandoffs } from '../hooks/useBookWorkbenchActivity'
import { BookDraftWorkspace } from './BookDraftWorkspace'

function BookRouteHarness() {
  const { route } = useWorkbenchRouteState()

  return route.scope === 'book' ? <BookDraftWorkspace /> : <div>Non-book scope</div>
}

describe('BookDraftWorkspace', () => {
  afterEach(() => {
    resetRememberedBookWorkbenchHandoffs()
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
})
