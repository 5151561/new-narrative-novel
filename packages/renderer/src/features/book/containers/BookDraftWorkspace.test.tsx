import { useRef, type PropsWithChildren } from 'react'

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
import { resetMockReviewDecisionDb } from '@/features/review/api/mock-review-decision-db'
import { resetMockReviewFixActionDb } from '@/features/review/api/mock-review-fix-action-db'
import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { createReviewClient } from '@/features/review/api/review-client'
import { reviewQueryKeys } from '@/features/review/hooks/review-query-keys'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { resetMockBookExportArtifactDb } from '../api/mock-book-export-artifact-db'
import * as bookExperimentBranchQueryModule from '../hooks/useBookExperimentBranchQuery'
import { resetRememberedBookWorkbenchHandoffs } from '../hooks/useBookWorkbenchActivity'
import { BookDraftWorkspace } from './BookDraftWorkspace'

function createReadyArtifactReviewInbox() {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    selectedIssueId: null,
    selectedIssue: null,
    activeFilter: 'all',
    activeStatusFilter: 'open',
    issues: [],
    filteredIssues: [],
    groupedIssues: {
      blockers: [],
      warnings: [],
      info: [],
    },
    counts: {
      total: 0,
      blockers: 0,
      warnings: 0,
      info: 0,
      traceGaps: 0,
      missingDrafts: 0,
      compareDeltas: 0,
      exportReadiness: 0,
      branchReadiness: 0,
      sceneProposals: 0,
      open: 0,
      reviewed: 0,
      deferred: 0,
      dismissed: 0,
      stale: 0,
      fixStarted: 0,
      fixChecked: 0,
      fixBlocked: 0,
      fixStale: 0,
    },
    visibleOpenCount: 0,
    selectedChapterIssueCount: 0,
    annotationsByChapterId: {},
  }
}

function BookRouteHarness() {
  const { route } = useWorkbenchRouteState()
  const queryClient = useQueryClient()
  const resetReviewCacheRef = useRef(false)

  if (!resetReviewCacheRef.current && route.scope === 'book') {
    queryClient.removeQueries({ queryKey: reviewQueryKeys.decisions(route.bookId) })
    queryClient.removeQueries({ queryKey: reviewQueryKeys.fixActions(route.bookId) })
    resetReviewCacheRef.current = true
  }

  return route.scope === 'book' ? <BookDraftWorkspace /> : <div>Non-book scope</div>
}

function createNoopPersistence() {
  return {
    async loadProjectSnapshot() {
      return null
    },
    async saveProjectSnapshot() {},
    async clearProjectSnapshot() {},
  }
}

function createInjectedProviders(runtime = createMockProjectRuntime({ persistence: createNoopPersistence() })) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  })

  return function InjectedProviders({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('BookDraftWorkspace', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.doUnmock('@/features/review/hooks/useBookReviewInboxQuery')
    vi.doUnmock('@/features/book/hooks/useBookExportPreviewQuery')
    vi.doUnmock('../hooks/useBookExportPreviewQuery')
    vi.doUnmock('@/features/book/hooks/useBookExportArtifactWorkspaceQuery')
    vi.doUnmock('../hooks/useBookExportArtifactWorkspaceQuery')
    vi.doUnmock('@/app/project-runtime')
    vi.unstubAllGlobals()
    window.localStorage.clear()
    resetRememberedBookWorkbenchHandoffs()
    resetMockReviewDecisionDb()
    resetMockReviewFixActionDb()
    resetMockBookExportArtifactDb()
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

  it('shows artifact gate blocked and disables build when export readiness and review blockers are open', async () => {
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
    expect((await screen.findAllByText('Artifact build blocked')).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Build Markdown package' })).toBeDisabled()
    expect(screen.getByText('Artifact builder')).toBeInTheDocument()
    expect(screen.getByText('No artifact built yet')).toBeInTheDocument()

    const bottomDock = screen.getByLabelText('Book draft bottom dock')
    expect(within(bottomDock).getByText('Artifact readiness blockers')).toBeInTheDocument()
    expect(within(bottomDock).getByText('Artifact review blockers')).toBeInTheDocument()
  })

  it('builds a ready markdown artifact, copies it, downloads it, and records dock activity', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockResolvedValue(undefined)
    const createObjectURL = vi.fn(() => 'blob:book-export-artifact')
    const revokeObjectURL = vi.fn()
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

    vi.resetModules()
    const [{ buildBookDraftExportStoryData }, artifactDb, bookClientModule] = await Promise.all([
      import('../components/book-draft-storybook'),
      import('../api/mock-book-export-artifact-db'),
      import('../api/book-client'),
    ])
    const { buildBookExportArtifactWorkspace } = await import('../lib/book-export-artifact-mappers')
    artifactDb.resetMockBookExportArtifactDb()
    vi.spyOn(bookClientModule.bookClient, 'getBookExportArtifacts').mockImplementation(async (input) =>
      artifactDb.getMockBookExportArtifacts({
        bookId: input.bookId,
        exportProfileId: input.exportProfileId ?? undefined,
        checkpointId: input.checkpointId ?? undefined,
      }),
    )
    const buildBookExportArtifact = vi
      .spyOn(bookClientModule.bookClient, 'buildBookExportArtifact')
      .mockImplementation(async (input) => artifactDb.buildMockBookExportArtifact(input))
    const readyExportData = buildBookDraftExportStoryData('en', {
      variant: 'quiet-book',
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      exportProfileId: 'export-archive-snapshot',
      selectedChapterId: 'chapter-open-water-signals',
    })
    const exportWorkspace = {
      ...readyExportData.exportWorkspace,
      bookId: 'book-signal-arc',
      title: 'Signal Arc',
      profile: {
        ...readyExportData.exportWorkspace.profile,
        bookId: 'book-signal-arc',
      },
    }
    const readyReviewInbox = createReadyArtifactReviewInbox()

    vi.doMock('@/features/review/hooks/useBookReviewInboxQuery', () => ({
      useBookReviewInboxQuery: () => ({
        inbox: readyReviewInbox,
        isLoading: false,
        error: null,
        decisionError: null,
        fixActionError: null,
        isEmpty: true,
      }),
    }))
    vi.doMock('@/features/book/hooks/useBookExportArtifactWorkspaceQuery', () => ({
      useBookExportArtifactWorkspaceQuery: () => ({
        artifactWorkspace: buildBookExportArtifactWorkspace({
          exportPreview: exportWorkspace,
          reviewInbox: readyReviewInbox,
          artifactRecords: artifactDb.getMockBookExportArtifacts({
            bookId: 'book-signal-arc',
            exportProfileId: 'export-archive-snapshot',
            checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
          }),
          checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
        }),
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useBookExportArtifactWorkspaceQuery', () => ({
      useBookExportArtifactWorkspaceQuery: () => ({
        artifactWorkspace: buildBookExportArtifactWorkspace({
          exportPreview: exportWorkspace,
          reviewInbox: readyReviewInbox,
          artifactRecords: artifactDb.getMockBookExportArtifacts({
            bookId: 'book-signal-arc',
            exportProfileId: 'export-archive-snapshot',
            checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
          }),
          checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
        }),
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('@/features/book/hooks/useBookExportPreviewQuery', () => ({
      useBookExportPreviewQuery: () => ({
        exportWorkspace,
        exportProfiles: readyExportData.exportProfiles,
        selectedExportProfile: readyExportData.selectedExportProfile,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useBookExportPreviewQuery', () => ({
      useBookExportPreviewQuery: () => ({
        exportWorkspace,
        exportProfiles: readyExportData.exportProfiles,
        selectedExportProfile: readyExportData.selectedExportProfile,
        isLoading: false,
        error: null,
      }),
    }))
    const [
      { I18nProvider: FreshI18nProvider },
      freshProjectRuntimeModule,
      routeModule,
      { BookDraftWorkspace: FreshBookDraftWorkspace },
    ] = await Promise.all([
      import('@/app/i18n'),
      import('@/app/project-runtime'),
      import('@/features/workbench/hooks/useWorkbenchRouteState'),
      import('./BookDraftWorkspace'),
    ])
    const freshQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          retry: false,
          refetchOnWindowFocus: false,
        },
      },
    })
    const runtime = freshProjectRuntimeModule.createMockProjectRuntime({
      bookClient: bookClientModule.bookClient,
      persistence: createNoopPersistence(),
    })
    function FreshBookRouteHarness() {
      const { route } = routeModule.useWorkbenchRouteState()

      return route.scope === 'book' ? <FreshBookDraftWorkspace /> : <div>Non-book scope</div>
    }
    function FreshProviders({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={freshQueryClient}>
          <FreshI18nProvider>
            <freshProjectRuntimeModule.ProjectRuntimeProvider runtime={runtime}>
              {children}
            </freshProjectRuntimeModule.ProjectRuntimeProvider>
          </FreshI18nProvider>
        </QueryClientProvider>
      )
    }

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectURL,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectURL,
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-archive-snapshot&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <FreshProviders>
        <FreshBookRouteHarness />
      </FreshProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
    const buildButton = await screen.findByRole('button', { name: 'Build Markdown package' })
    await waitFor(() => {
      expect(buildButton).toBeEnabled()
    })

    await user.click(buildButton)

    await waitFor(() => {
      expect(buildBookExportArtifact).toHaveBeenCalledTimes(1)
      expect(buildBookExportArtifact).toHaveBeenCalledWith(
        expect.objectContaining({
          bookId: 'book-signal-arc',
          exportProfileId: 'export-archive-snapshot',
          format: 'markdown',
        }),
      )
    })
    await user.click(screen.getByRole('button', { name: 'Plain text' }))
    await user.click(screen.getByRole('button', { name: 'Markdown' }))
    expect((await screen.findAllByText('signal-arc-export-archive-snapshot.md')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Narrative editor').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Current').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Copy package text' }))
    await user.click(screen.getByRole('button', { name: 'Download .md' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Signal Arc'))
      expect(createObjectURL).toHaveBeenCalledTimes(1)
      expect(anchorClick).toHaveBeenCalledTimes(1)
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:book-export-artifact')
    })

    const bottomDock = screen.getByLabelText('Book draft bottom dock')
    await waitFor(() => {
      expect(within(bottomDock).getByText(/Built Markdown package signal-arc-export-archive-snapshot\.md/)).toBeInTheDocument()
      expect(within(bottomDock).getByText(/Copied artifact signal-arc-export-archive-snapshot\.md/)).toBeInTheDocument()
      expect(within(bottomDock).getByText(/Downloaded artifact signal-arc-export-archive-snapshot\.md/)).toBeInTheDocument()
    })
  })

  it('does not record copied artifact activity when clipboard write rejects', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard denied'))

    vi.resetModules()
    const [{ buildBookDraftArtifactStoryData, buildBookDraftExportStoryData }] = await Promise.all([
      import('../components/book-draft-storybook'),
    ])
    const readyExportData = buildBookDraftExportStoryData('en', {
      variant: 'quiet-book',
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      exportProfileId: 'export-archive-snapshot',
      selectedChapterId: 'chapter-open-water-signals',
    })
    const artifactWorkspace = buildBookDraftArtifactStoryData('en', {
      variant: 'quiet-book',
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      exportProfileId: 'export-archive-snapshot',
      selectedChapterId: 'chapter-open-water-signals',
      artifactScenario: 'latest',
    })
    const readyReviewInbox = createReadyArtifactReviewInbox()

    vi.doMock('@/features/review/hooks/useBookReviewInboxQuery', () => ({
      useBookReviewInboxQuery: () => ({
        inbox: readyReviewInbox,
        isLoading: false,
        error: null,
        decisionError: null,
        fixActionError: null,
        isEmpty: true,
      }),
    }))
    vi.doMock('@/features/book/hooks/useBookExportPreviewQuery', () => ({
      useBookExportPreviewQuery: () => ({
        exportWorkspace: readyExportData.exportWorkspace,
        exportProfiles: readyExportData.exportProfiles,
        selectedExportProfile: readyExportData.selectedExportProfile,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useBookExportPreviewQuery', () => ({
      useBookExportPreviewQuery: () => ({
        exportWorkspace: readyExportData.exportWorkspace,
        exportProfiles: readyExportData.exportProfiles,
        selectedExportProfile: readyExportData.selectedExportProfile,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('@/features/book/hooks/useBookExportArtifactWorkspaceQuery', () => ({
      useBookExportArtifactWorkspaceQuery: () => ({
        artifactWorkspace,
        isLoading: false,
        error: null,
      }),
    }))
    vi.doMock('../hooks/useBookExportArtifactWorkspaceQuery', () => ({
      useBookExportArtifactWorkspaceQuery: () => ({
        artifactWorkspace,
        isLoading: false,
        error: null,
      }),
    }))

    const [{ AppProviders: FreshAppProviders }, { BookDraftWorkspace: FreshBookDraftWorkspace }, routeModule] = await Promise.all([
      import('@/app/providers'),
      import('./BookDraftWorkspace'),
      import('@/features/workbench/hooks/useWorkbenchRouteState'),
    ])
    function FreshBookRouteHarness() {
      const { route } = routeModule.useWorkbenchRouteState()

      return route.scope === 'book' ? <FreshBookDraftWorkspace /> : <div>Non-book scope</div>
    }

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=export&checkpointId=checkpoint-book-signal-arc-pr11-baseline&exportProfileId=export-archive-snapshot&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <FreshAppProviders>
        <FreshBookRouteHarness />
      </FreshAppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
    expect((await screen.findAllByText(/export-archive-snapshot\.md/)).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Copy package text' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1)
    })
    await Promise.resolve()
    await Promise.resolve()

    const bottomDock = screen.getByLabelText('Book draft bottom dock')
    expect(within(bottomDock).queryByText(/Copied artifact .*export-archive-snapshot\.md/)).not.toBeInTheDocument()
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
    expect(screen.getByRole('textbox', { name: 'Decision note' })).toHaveDisplayValue('')
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
    const baseReviewClient = createReviewClient()
    const setReviewIssueDecisionSpy = vi.fn(baseReviewClient.setReviewIssueDecision).mockRejectedValueOnce(new Error('Decision failed'))
    const runtime = createMockProjectRuntime({
      reviewClient: {
        ...baseReviewClient,
        setReviewIssueDecision: setReviewIssueDecisionSpy,
      },
      persistence: createNoopPersistence(),
    })
    const InjectedProviders = createInjectedProviders(runtime)

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=all&reviewStatusFilter=open&reviewIssueId=compare-delta-chapter-2-scene-3&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <InjectedProviders>
        <BookRouteHarness />
      </InjectedProviders>,
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

  it('starts a source fix before opening the target source and keeps checked status independent from review decision', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=scene-proposals&reviewStatusFilter=open&reviewIssueId=scene-proposal-seed-scene-5&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()
    expect(screen.getAllByText('Not started').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Start source fix' }))

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
      expect(params.get('draftView')).toBe('review')
      expect(params.get('reviewIssueId')).toBe('scene-proposal-seed-scene-5')
    })

    let detail = screen.getByRole('heading', { name: 'Scene proposal needs review' }).closest('section')
    expect(detail).not.toBeNull()
    await waitFor(() => {
      expect(within(detail!).getAllByText('Fix started').length).toBeGreaterThan(0)
    })

    await user.click(screen.getByRole('button', { name: 'Mark source checked' }))

    await waitFor(() => {
      detail = screen.getByRole('heading', { name: 'Scene proposal needs review' }).closest('section')
      expect(detail).not.toBeNull()
      expect(within(detail!).getAllByText('Checked').length).toBeGreaterThan(0)
    })
    expect(within(detail!).getByText('Open')).toBeInTheDocument()

    const bottomDock = screen.getByLabelText('Book draft bottom dock')
    expect(within(bottomDock).getByText(/Started source fix/)).toBeInTheDocument()
    expect(within(bottomDock).getByText(/Marked source checked/)).toBeInTheDocument()
  })

  it('marks a source fix blocked with a note and mirrors it in row detail and inspector without changing decision', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=scene-proposals&reviewStatusFilter=open&reviewIssueId=scene-proposal-seed-scene-5&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Source fix note' }), 'Blocked until proposal ownership is resolved.')
    await user.click(screen.getByRole('button', { name: 'Start source fix' }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('scope')).toBe('scene')
    })

    window.history.back()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark blocked' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Mark blocked' }))

    let detail = screen.getByRole('heading', { name: 'Scene proposal needs review' }).closest('section')
    expect(detail).not.toBeNull()
    await waitFor(() => {
      detail = screen.getByRole('heading', { name: 'Scene proposal needs review' }).closest('section')
      expect(detail).not.toBeNull()
      expect(within(detail!).getAllByText('Blocked').length).toBeGreaterThan(0)
    })
    const reviewQueue = screen.getByText('Review queue').closest('section')
    expect(reviewQueue).not.toBeNull()
    expect(within(reviewQueue!).getByRole('button', { name: /Fix note: Blocked until proposal ownership is resolved/i })).toBeInTheDocument()

    expect(within(detail!).getByRole('textbox', { name: 'Source fix note' })).toHaveValue(
      'Blocked until proposal ownership is resolved.',
    )

    const inspector = screen.getByRole('heading', { name: 'Selected review issue' }).closest('section')
    expect(inspector).not.toBeNull()
    expect(within(inspector!).getByText('Blocked until proposal ownership is resolved.')).toBeInTheDocument()
    expect(within(detail!).getByText('Open')).toBeInTheDocument()
    expect(within(inspector!).getByText('Selected issue fix action')).toBeInTheDocument()
  })

  it('clears a source fix action without clearing the review decision state', async () => {
    const user = userEvent.setup()

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=scene-proposals&reviewStatusFilter=open&reviewIssueId=scene-proposal-seed-scene-5&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <AppProviders>
        <BookRouteHarness />
      </AppProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start source fix' }))

    await waitFor(() => {
      expect(new URLSearchParams(window.location.search).get('scope')).toBe('scene')
    })

    window.history.back()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Clear fix action' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Clear fix action' }))

    const detail = screen.getByRole('heading', { name: 'Scene proposal needs review' }).closest('section')
    expect(detail).not.toBeNull()
    await waitFor(() => {
      expect(within(detail!).getAllByText('Not started').length).toBeGreaterThan(0)
    })
    expect(within(detail!).getByText('Open')).toBeInTheDocument()

    const bottomDock = screen.getByLabelText('Book draft bottom dock')
    expect(within(bottomDock).getByText(/Cleared source fix action/)).toBeInTheDocument()
  })

  it('does not open a review source target when starting the source fix action fails', async () => {
    const user = userEvent.setup()
    const baseReviewClient = createReviewClient()
    const setReviewIssueFixActionSpy = vi
      .fn(baseReviewClient.setReviewIssueFixAction)
      .mockRejectedValueOnce(new Error('Fix action failed'))
    const runtime = createMockProjectRuntime({
      reviewClient: {
        ...baseReviewClient,
        setReviewIssueFixAction: setReviewIssueFixActionSpy,
      },
      persistence: createNoopPersistence(),
    })
    const InjectedProviders = createInjectedProviders(runtime)

    window.history.replaceState(
      {},
      '',
      '/workbench?scope=book&id=book-signal-arc&lens=draft&view=signals&draftView=review&reviewFilter=scene-proposals&reviewStatusFilter=open&reviewIssueId=scene-proposal-seed-scene-5&selectedChapterId=chapter-open-water-signals',
    )

    render(
      <InjectedProviders>
        <BookRouteHarness />
      </InjectedProviders>,
    )

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Start source fix' }))

    await waitFor(() => {
      expect(setReviewIssueFixActionSpy).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      const params = new URLSearchParams(window.location.search)
      expect(params.get('scope')).toBe('book')
      expect(params.get('draftView')).toBe('review')
      expect(params.get('reviewIssueId')).toBe('scene-proposal-seed-scene-5')
    })
    const detail = screen.getByRole('heading', { name: 'Scene proposal needs review' }).closest('section')
    expect(detail).not.toBeNull()
    expect(within(detail!).queryByText('Fix started')).not.toBeInTheDocument()
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
