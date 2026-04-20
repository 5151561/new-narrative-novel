import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'
import { ApiRequestError, apiRouteContract } from '@/app/project-runtime'
import { createFakeApiRuntime } from '@/app/project-runtime/fake-api-runtime.test-utils'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'
import { useAssetTraceabilitySummaryQuery } from '@/features/traceability/hooks/useAssetTraceabilitySummaryQuery'

import { AssetKnowledgeWorkspace } from './AssetKnowledgeWorkspace'
import { AssetNotFound } from './AssetKnowledgeWorkspace.stories'

const API_NOT_FOUND_MESSAGE = 'API boundary reported missing asset detail for asset-missing.'

vi.mock('@/features/traceability/hooks/useAssetTraceabilitySummaryQuery', async () => {
  const actual = await vi.importActual<typeof import('@/features/traceability/hooks/useAssetTraceabilitySummaryQuery')>(
    '@/features/traceability/hooks/useAssetTraceabilitySummaryQuery',
  )

  return {
    ...actual,
    useAssetTraceabilitySummaryQuery: vi.fn(actual.useAssetTraceabilitySummaryQuery),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
  window.localStorage.clear()
})

const mockedUseAssetTraceabilitySummaryQuery = vi.mocked(useAssetTraceabilitySummaryQuery)

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
  it('renders asset knowledge deep links through the API runtime boundary and roundtrips scene and chapter handoffs', async () => {
    const user = userEvent.setup()
    const { projectId, requests, runtime } = createFakeApiRuntime()

    window.history.replaceState({}, '', '/workbench?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions')

    render(
      <AppProviders runtime={runtime}>
        <AssetRouteHarness />
      </AppProviders>,
    )

    const sceneDraftHandoff = await screen.findByRole('button', { name: 'Open in Draft: Midnight Platform' })
    const navigatorRen = screen.getByRole('button', { name: /Ren Voss/i })
    const inspectorSummary = screen.getByRole('heading', { name: 'Summary' }).closest('section')
    const dockRegion = screen.getByRole('region', { name: 'Asset bottom dock' })

    expect(navigatorRen).toHaveClass('border-line-strong')
    expect(screen.getByText('Primary POV')).toBeInTheDocument()
    expect(screen.getByText('Canon-backed')).toBeInTheDocument()
    expect(inspectorSummary).not.toBeNull()
    expect(within(inspectorSummary!).getByText('Ren Voss')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Focused Ren Voss')).toBeInTheDocument()
    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'GET',
        path: apiRouteContract.assetKnowledge({ projectId, assetId: 'asset-ren-voss' }),
      }),
    )

    await user.click(sceneDraftHandoff)

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

    await user.click(screen.getByRole('button', { name: 'Open in Structure: Signals in Rain' }))

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('chapter')
      expect(params.get('id')).toBe('chapter-signals-in-rain')
      expect(params.get('lens')).toBe('structure')
      expect(params.get('sceneId')).toBeNull()
    })

    expect(screen.getByText('Chapter scope placeholder')).toBeInTheDocument()

    window.history.back()

    await screen.findByRole('button', { name: 'Open in Draft: Midnight Platform' })
    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('asset')
      expect(params.get('id')).toBe('asset-ren-voss')
      expect(params.get('view')).toBe('mentions')
    })

    expect(screen.getByRole('button', { name: /Ren Voss/i })).toHaveClass('border-line-strong')
  })

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
    const inspectorConsistency = screen.getByRole('heading', { name: 'Consistency' }).closest('section')
    const dockRegion = screen.getByRole('region', { name: 'Asset bottom dock' })

    expect(navigatorRen).toHaveClass('border-line-strong')
    expect(screen.getByText('Primary POV')).toBeInTheDocument()
    expect(screen.getByText('Canon-backed')).toBeInTheDocument()
    expect(screen.getAllByText('Trace detail').length).toBeGreaterThan(0)
    expect(screen.getByText('Courier signal spotted')).toBeInTheDocument()
    expect(inspectorSummary).not.toBeNull()
    expect(inspectorConsistency).not.toBeNull()
    expect(within(inspectorSummary!).getByText('Ren Voss')).toBeInTheDocument()
    expect(within(inspectorConsistency!).getByText('Canon-backed mentions')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Switched to Mentions')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Focused Ren Voss')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Mentions without canon backing')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Relations present but no narrative backing')).toBeInTheDocument()

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
    expect(screen.getByText('Canon-backed')).toBeInTheDocument()
  })

  it('does not render trace-derived inspector and dock judgments while traceability is still loading', async () => {
    mockedUseAssetTraceabilitySummaryQuery.mockReturnValue({
      summary: null,
      isLoading: true,
      error: null,
      refetch: async () => undefined,
    })

    window.history.replaceState({}, '', '/workbench?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions')

    render(
      <AppProviders>
        <AssetRouteHarness />
      </AppProviders>,
    )

    const inspectorConsistencyHeading = await screen.findByRole('heading', { name: 'Consistency' })
    const inspectorConsistency = inspectorConsistencyHeading.closest('section')
    const dockRegion = screen.getByRole('region', { name: 'Asset bottom dock' })

    expect(screen.getByText('Canon-backed')).toBeInTheDocument()
    expect(screen.getAllByText('Loading trace detail').length).toBeGreaterThan(0)
    expect(inspectorConsistency).not.toBeNull()
    expect(within(inspectorConsistency!).getByText('Loading traceability')).toBeInTheDocument()
    expect(within(inspectorConsistency!).queryByText('Canon-backed mentions')).not.toBeInTheDocument()
    expect(within(dockRegion).getByText('Loading traceability')).toBeInTheDocument()
    expect(within(dockRegion).queryByText('Mentions without canon backing')).not.toBeInTheDocument()
    expect(within(dockRegion).queryByText('Without canon backing')).not.toBeInTheDocument()
  })

  it('surfaces traceability errors as unavailable state instead of fake trace judgments', async () => {
    mockedUseAssetTraceabilitySummaryQuery.mockReturnValue({
      summary: null,
      isLoading: false,
      error: new Error('Trace sources failed'),
      refetch: async () => undefined,
    })

    window.history.replaceState({}, '', '/workbench?scope=asset&id=asset-ren-voss&lens=knowledge&view=mentions')

    render(
      <AppProviders>
        <AssetRouteHarness />
      </AppProviders>,
    )

    const inspectorConsistencyHeading = await screen.findByRole('heading', { name: 'Consistency' })
    const inspectorConsistency = inspectorConsistencyHeading.closest('section')
    const dockRegion = screen.getByRole('region', { name: 'Asset bottom dock' })

    expect(screen.getByText('Canon-backed')).toBeInTheDocument()
    expect(screen.getAllByText('Traceability unavailable').length).toBeGreaterThan(0)
    expect(inspectorConsistency).not.toBeNull()
    expect(within(inspectorConsistency!).getByText('Trace sources failed')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Traceability unavailable')).toBeInTheDocument()
    expect(within(dockRegion).getByText('Trace sources failed')).toBeInTheDocument()
    expect(within(dockRegion).queryByText('Narrative backing gaps')).not.toBeInTheDocument()
  })

  it('treats API 404 asset detail failures as asset-not-found state instead of a generic unavailable pane', async () => {
    const { projectId, runtime } = createFakeApiRuntime({
      overrides: [
        {
          method: 'GET',
          path: apiRouteContract.assetKnowledge({ projectId: 'project-smoke', assetId: 'asset-missing' }),
          error: new ApiRequestError({
            status: 404,
            message: API_NOT_FOUND_MESSAGE,
            code: 'ASSET_NOT_FOUND',
          }),
        },
      ],
    })

    window.history.replaceState({}, '', '/workbench?scope=asset&id=asset-missing&lens=knowledge&view=profile')

    render(
      <AppProviders runtime={runtime}>
        <AssetRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findAllByText('Asset not found')).toHaveLength(4)
    expect(screen.getAllByText(API_NOT_FOUND_MESSAGE)).toHaveLength(4)
    expect(screen.queryByText('Asset unavailable')).not.toBeInTheDocument()
    expect(screen.queryByText('Asset asset-missing could not be found.')).not.toBeInTheDocument()
    expect(projectId).toBe('project-smoke')
  })

  it('renders the AssetNotFound story through the fake API 404 path', async () => {
    if (!AssetNotFound.render) {
      throw new Error('Expected AssetNotFound story to define a render function')
    }

    render(AssetNotFound.render(AssetNotFound.args ?? {}, {} as never))

    expect(await screen.findAllByText('Asset not found')).toHaveLength(4)
    expect(screen.getAllByText(API_NOT_FOUND_MESSAGE)).toHaveLength(4)
    expect(screen.queryByText('Asset asset-missing could not be found.')).not.toBeInTheDocument()
  })
})
