import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ApiRequestError, apiRouteContract } from '@/app/project-runtime'
import {
  API_READ_SLICE_BOOK_ID,
  API_READ_SLICE_PROJECT_ID,
  API_READ_SLICE_ROUTE,
} from '@/app/project-runtime/api-read-slice-fixtures'
import { AppProviders } from '@/app/providers'
import { createFakeApiRuntime } from '@/app/project-runtime/fake-api-runtime.test-utils'
import { resetMockBookExportArtifactDb } from '@/features/book/api/mock-book-export-artifact-db'
import {
  importMockReviewDecisionSnapshot,
  resetMockReviewDecisionDb,
} from '@/features/review/api/mock-review-decision-db'
import {
  importMockReviewFixActionSnapshot,
  resetMockReviewFixActionDb,
} from '@/features/review/api/mock-review-fix-action-db'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import { BookDraftWorkspace } from './BookDraftWorkspace'

function BookRouteHarness() {
  const { route } = useWorkbenchRouteState()

  return route.scope === 'book' ? <BookDraftWorkspace /> : null
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function renderReviewRoute({
  route = API_READ_SLICE_ROUTE,
  overrides = [],
}: {
  route?: string
  overrides?: unknown[]
} = {}) {
  const queryClient = createQueryClient()
  const runtimeState = createFakeApiRuntime({
    projectId: API_READ_SLICE_PROJECT_ID,
    overrides: overrides as never,
  })

  window.history.replaceState({}, '', route)

  render(
    <AppProviders runtime={runtimeState.runtime} queryClient={queryClient}>
      <BookRouteHarness />
    </AppProviders>,
  )

  return {
    queryClient,
    ...runtimeState,
  }
}

function createCompareDecisionSignature() {
  return [
    'compare-delta-chapter-2-scene-3',
    'compare_delta',
    'compare',
    'chapter-2',
    'scene-3',
    '',
    'Compare delta needs review',
    'Scene Three changed against the selected checkpoint.',
    'Changed scene',
  ].join('::')
}

function seedReviewState() {
  const issueId = 'compare-delta-chapter-2-scene-3'
  const issueSignature = createCompareDecisionSignature()

  importMockReviewDecisionSnapshot({
    [API_READ_SLICE_BOOK_ID]: [
      {
        id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
        bookId: API_READ_SLICE_BOOK_ID,
        issueId,
        issueSignature,
        status: 'reviewed',
        updatedAtLabel: 'Reviewed in fixture',
        updatedByLabel: 'Fixture reviewer',
      },
    ],
  })
  importMockReviewFixActionSnapshot({
    [API_READ_SLICE_BOOK_ID]: [
      {
        id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
        bookId: API_READ_SLICE_BOOK_ID,
        issueId,
        issueSignature,
        sourceHandoffId: `${issueId}::book-compare`,
        sourceHandoffLabel: 'Open compare review',
        targetScope: 'book',
        status: 'checked',
        startedAtLabel: 'Started in fixture',
        updatedAtLabel: 'Checked in fixture',
        updatedByLabel: 'Fixture reviewer',
      },
    ],
  })
}

describe('BookDraftWorkspace API read-slice review states', () => {
  afterEach(() => {
    window.localStorage.clear()
    resetMockReviewDecisionDb()
    resetMockReviewFixActionDb()
    resetMockBookExportArtifactDb()
  })

  it('shows book not found and stops chapter scene and review reads when book structure resolves to null', async () => {
    const { requests } = renderReviewRoute({
      overrides: [
        {
          method: 'GET',
          path: apiRouteContract.bookStructure({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
          }),
          response: null,
        },
      ],
    })

    expect(await screen.findAllByText('Book not found')).toHaveLength(4)
    expect(screen.getAllByText(`Book ${API_READ_SLICE_BOOK_ID} could not be found.`)).toHaveLength(4)
    expect(requests.some((request) => request.path.includes('/chapters/'))).toBe(false)
    expect(requests.some((request) => request.path.includes('/scenes/'))).toBe(false)
    expect(requests.some((request) => request.path.includes('/manuscript-checkpoints'))).toBe(false)
    expect(requests.some((request) => request.path.includes('/export-profiles'))).toBe(false)
    expect(requests.some((request) => request.path.includes('/export-artifacts'))).toBe(false)
    expect(requests.some((request) => request.path.includes('/experiment-branches'))).toBe(false)
    expect(requests.some((request) => request.path.includes('/review-'))).toBe(false)
  })

  it('treats empty review decisions and fix actions as empty state instead of an error', async () => {
    seedReviewState()

    renderReviewRoute({
      route: `${API_READ_SLICE_ROUTE}&reviewIssueId=compare-delta-chapter-2-scene-3`,
      overrides: [
        {
          method: 'GET',
          path: apiRouteContract.reviewDecisions({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
          }),
          response: [],
        },
        {
          method: 'GET',
          path: apiRouteContract.reviewFixActions({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
          }),
          response: [],
        },
      ],
    })

    expect((await screen.findAllByText('Compare delta needs review')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Not started').length).toBeGreaterThan(0)
    expect(screen.queryByText('Review decisions unavailable')).not.toBeInTheDocument()
    expect(screen.queryByText('Review fix actions unavailable')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reviewed 0' })).toBeInTheDocument()
  })

  it('keeps the review surface visible when review decisions fail with a 500 response', async () => {
    renderReviewRoute({
      route: `${API_READ_SLICE_ROUTE}&reviewIssueId=compare-delta-chapter-2-scene-3`,
      overrides: [
        {
          method: 'GET',
          path: apiRouteContract.reviewDecisions({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
          }),
          error: new ApiRequestError({
            status: 500,
            message: 'Review decisions unavailable from API',
            code: 'review-decisions-unavailable',
          }),
        },
      ],
    })

    expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()
    expect(screen.getByText('Review decisions unavailable')).toBeInTheDocument()
    expect(screen.getByText('Review decisions unavailable from API')).toBeInTheDocument()
    expect(screen.getAllByText('Compare delta needs review').length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Selected review issue' })).toBeInTheDocument()
    expect(screen.queryByText('Review inbox unavailable')).not.toBeInTheDocument()
  })

  it.each([
    {
      label: 'checkpoint',
      routeSuffix: '&checkpointId=checkpoint-missing',
      message: 'Book manuscript checkpoint "checkpoint-missing" could not be found for "book-signal-arc".',
    },
    {
      label: 'export profile',
      routeSuffix: '&exportProfileId=export-profile-missing',
      message: 'Book export profile "export-profile-missing" could not be found for "book-signal-arc".',
    },
    {
      label: 'branch',
      routeSuffix: '&branchId=branch-missing',
      message: 'Book experiment branch "branch-missing" could not be found for "book-signal-arc".',
    },
  ])(
    'shows an explicit fallback when the selected $label id is missing',
    async ({ routeSuffix, message }) => {
      renderReviewRoute({
        route: `${API_READ_SLICE_ROUTE}${routeSuffix}`,
      })

      expect(await screen.findByRole('heading', { name: 'Review inbox' })).toBeInTheDocument()
      expect(screen.getByText('Review sources unavailable')).toBeInTheDocument()
      expect(screen.getByText(message)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Selected review issue' })).toBeInTheDocument()

      const bottomDock = screen.getByRole('region', { name: 'Book draft bottom dock' })
      expect(within(bottomDock).getAllByText(/Focused/i).length).toBeGreaterThan(0)

      await waitFor(() => {
        expect(screen.queryByText('Loading manuscript')).not.toBeInTheDocument()
      })
    },
  )
})
