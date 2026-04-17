import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { resetMockChapterDb } from '../api/mock-chapter-db'
import { ChapterDraftWorkspace } from './ChapterDraftWorkspace'

afterEach(() => {
  resetMockChapterDb()
  window.localStorage.clear()
})

function ChapterRouteHarness() {
  const { route } = useWorkbenchRouteState()

  return route.scope === 'chapter' ? <ChapterDraftWorkspace /> : <div>Scene scope placeholder</div>
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
    const selectedSceneSection = screen.getByRole('heading', { name: 'Selected Scene' }).closest('section')
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
})
