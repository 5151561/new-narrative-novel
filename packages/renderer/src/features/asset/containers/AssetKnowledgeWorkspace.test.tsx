import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { AssetKnowledgeWorkspace } from './AssetKnowledgeWorkspace'

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

function AssetRouteHarness() {
  const { route } = useWorkbenchRouteState()

  if (route.scope === 'asset') {
    return <AssetKnowledgeWorkspace />
  }

  if (route.scope === 'scene') {
    return <div>Scene scope placeholder</div>
  }

  return <div>Chapter scope placeholder</div>
}

describe('AssetKnowledgeWorkspace', () => {
  it('keeps navigator, stage, inspector, dock, route handoff, and browser back in sync', async () => {
    const user = userEvent.setup()

    window.history.replaceState({}, '', '/workbench?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions')

    render(
      <AppProviders>
        <AssetRouteHarness />
      </AppProviders>,
    )

    const draftHandoff = await screen.findByRole('button', { name: 'Open in Draft: Midnight Platform' })
    const navigatorRen = screen.getByRole('button', { name: /Ren Voss/i })
    const inspectorSummary = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    const dockRegion = screen.getByRole('region', { name: 'Asset bottom dock' })

    expect(navigatorRen).toHaveClass('border-line-strong')
    expect(screen.getByText('Primary POV')).toBeInTheDocument()
    expect(inspectorSummary).not.toBeNull()
    expect(within(inspectorSummary!).getByText('Ren Voss')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Switched to Mentions')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Focused Ren Voss')).toBeInTheDocument()

    await user.click(draftHandoff)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('scene')
      expect(params.get('id')).toBe('scene-midnight-platform')
      expect(params.get('lens')).toBe('draft')
      expect(params.get('tab')).toBe('prose')
    })

    expect(screen.getByText('Scene scope placeholder')).toBeInTheDocument()

    window.history.back()

    await screen.findByRole('button', { name: 'Open in Draft: Midnight Platform' })
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-ren-voss')
      expect(params.get('view')).toBe('mentions')
    })

    await user.click(screen.getByRole('button', { name: 'Relations' }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('view')).toBe('relations')
    })

    const relationButton = await screen.findByRole('button', { name: /Relates to: Mei Arden/i })
    await user.click(relationButton)

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-mei-arden')
      expect(params.get('view')).toBe('relations')
    })

    const navigatorMei = screen.getByRole('button', { name: /Mei Arden/i })
    const meiSummary = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    const updatedDockRegion = screen.getByRole('region', { name: 'Asset bottom dock' })

    expect(navigatorMei).toHaveClass('border-line-strong')
    expect(screen.getByText('Pressures')).toBeInTheDocument()
    expect(meiSummary).not.toBeNull()
    expect(within(meiSummary!).getByText('Mei Arden')).toBeInTheDocument()
    expect(within(updatedDockRegion).getByText('Focused Mei Arden')).toBeInTheDocument()

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-ren-voss')
      expect(params.get('view')).toBe('relations')
    })

    expect(screen.getByRole('button', { name: /Ren Voss/i })).toHaveClass('border-line-strong')

    window.history.back()

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-ren-voss')
      expect(params.get('view')).toBe('mentions')
    })

    expect(screen.getByRole('button', { name: 'Open in Draft: Midnight Platform' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ren Voss/i })).toHaveClass('border-line-strong')
  })
})
