import { QueryClient } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'
import { createFakeApiRuntime } from '@/app/project-runtime/fake-api-runtime.test-utils'
import { apiRouteContract } from '@/app/project-runtime/api-route-contract'
import { resetMockBookExportArtifactDb } from '@/features/book/api/mock-book-export-artifact-db'
import { BookDraftWorkspace } from '@/features/book/containers/BookDraftWorkspace'
import { resetMockReviewDecisionDb } from '@/features/review/api/mock-review-decision-db'
import { resetMockReviewFixActionDb } from '@/features/review/api/mock-review-fix-action-db'
import { reviewQueryKeys } from '@/features/review/hooks/review-query-keys'
import { useWorkbenchRouteState } from '@/features/workbench/hooks/useWorkbenchRouteState'

import {
  API_READ_SLICE_BOOK_ID,
  API_READ_SLICE_BRANCH_ID,
  API_READ_SLICE_CHECKPOINT_ID,
  API_READ_SLICE_CHAPTER_IDS,
  API_READ_SLICE_EXPORT_PROFILE_ID,
  API_READ_SLICE_PROJECT_ID,
  API_READ_SLICE_ROUTE,
  buildApiReadSliceExpectedQueryKeys,
  buildApiReadSliceExpectedRequests,
  buildLegacyApiReadSliceExpectedQueryKeys,
  buildLegacyApiReadSliceExpectedRequests,
} from './api-read-slice-fixtures'

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

function normalizeRequestQuery(query: Record<string, unknown> | undefined) {
  if (!query) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  )
}

function serializeRequest(request: { method: string; path: string; query?: Record<string, string> }) {
  const queryEntries = Object.entries(request.query ?? {}).sort(([left], [right]) => left.localeCompare(right))
  return JSON.stringify({
    method: request.method,
    path: request.path,
    query: queryEntries,
  })
}

function serializeQueryKey(queryKey: readonly unknown[]) {
  return JSON.stringify(queryKey)
}

function expectQueryKeysToMatchContract(
  queryKeys: readonly (readonly unknown[])[],
  expectedQueryKeys: readonly (readonly unknown[])[],
  allowedExtraQueryKeys: readonly (readonly unknown[])[] = [],
) {
  const serializedQueryKeys = queryKeys.map(serializeQueryKey)
  const serializedExpectedQueryKeys = expectedQueryKeys.map(serializeQueryKey)
  const serializedAllowedExtraQueryKeys = allowedExtraQueryKeys.map(serializeQueryKey)

  expect(serializedQueryKeys).toEqual(
    expect.arrayContaining(serializedExpectedQueryKeys),
  )

  const unexpectedQueryKeys = serializedQueryKeys.filter(
    (queryKey) =>
      !serializedExpectedQueryKeys.includes(queryKey) &&
      !serializedAllowedExtraQueryKeys.includes(queryKey),
  )

  expect(unexpectedQueryKeys).toEqual([])
}

function getResolvedQueryKeys(queryClient: QueryClient) {
  return queryClient
    .getQueryCache()
    .getAll()
    .filter((query) => query.state.status === 'success')
    .map((query) => query.queryKey)
}

describe('api read-slice contract', () => {
  afterEach(() => {
    window.localStorage.clear()
    resetMockReviewDecisionDb()
    resetMockReviewFixActionDb()
    resetMockBookExportArtifactDb()
  })

  it('renders the book draft review deep link through the API runtime and keeps the read graph on stable GET-only query keys', async () => {
    const queryClient = createQueryClient()
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
    })

    window.history.replaceState({}, '', API_READ_SLICE_ROUTE)

    render(
      <AppProviders runtime={runtime} queryClient={queryClient}>
        <BookRouteHarness />
      </AppProviders>,
    )

    await screen.findByRole('heading', { name: 'Review inbox' })

    await waitFor(() => {
      expect(
        queryClient.getQueryState(
          reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID),
        )?.status,
      ).toBe('success')
      expect(
        queryClient.getQueryState(
          reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID),
        )?.status,
      ).toBe('success')
    })

    await waitFor(() => {
      const exportArtifactsState = queryClient.getQueryState([
        'book',
        'exportArtifacts',
        API_READ_SLICE_BOOK_ID,
        API_READ_SLICE_EXPORT_PROFILE_ID,
        API_READ_SLICE_CHECKPOINT_ID,
      ])
      expect(exportArtifactsState?.status).toBe('success')
    })

    const reviewQueue = screen.getByText('Review queue').closest('section')
    expect(reviewQueue).not.toBeNull()
    expect(within(reviewQueue!).getByText(/Signal Arc currently shows/i)).toBeInTheDocument()

    const inspector = screen.getByRole('heading', { name: 'Selected review issue' }).closest('section')
    expect(inspector).not.toBeNull()
    expect(within(inspector!).getByText('Selected issue fix action')).toBeInTheDocument()

    const bottomDock = screen.getByRole('region', { name: 'Book draft bottom dock' })
    expect(within(bottomDock).getAllByText('Warehouse Bridge still needs current draft prose.').length).toBeGreaterThan(0)
    expect(within(bottomDock).getAllByText('Departure Bell still lacks trace readiness for this export profile.').length).toBeGreaterThan(0)

    // Query dependency graph for this read-only review route:
    // draft assembly + compare/export/branch support reads + review inbox, with no legacy scene fanout on the live path.
    const normalizedRequests = requests.map((request) => ({
      method: request.method,
      path: request.path,
      query: normalizeRequestQuery(request.query as Record<string, unknown> | undefined),
    }))

    const expectedRequests = buildApiReadSliceExpectedRequests(API_READ_SLICE_PROJECT_ID)
    expect(requests.every((request) => request.method === 'GET')).toBe(true)
    expect(normalizedRequests).toHaveLength(expectedRequests.length)
    expect(normalizedRequests.map(serializeRequest).sort()).toEqual(
      expectedRequests.map(serializeRequest).sort(),
    )
    expect(normalizedRequests).toContainEqual({
      method: 'GET',
      path: apiRouteContract.bookDraftAssembly({
        projectId: API_READ_SLICE_PROJECT_ID,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
      query: undefined,
    })
    expect(normalizedRequests).not.toContainEqual({
      method: 'GET',
      path: apiRouteContract.bookStructure({
        projectId: API_READ_SLICE_PROJECT_ID,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
      query: undefined,
    })
    for (const chapterId of API_READ_SLICE_CHAPTER_IDS) {
      expect(normalizedRequests).not.toContainEqual({
        method: 'GET',
        path: apiRouteContract.chapterStructure({
          projectId: API_READ_SLICE_PROJECT_ID,
          chapterId,
        }),
        query: undefined,
      })
    }

    const queryKeys = getResolvedQueryKeys(queryClient)
    const expectedQueryKeys = [
      ['project-runtime', API_READ_SLICE_PROJECT_ID, 'health'],
      ...buildApiReadSliceExpectedQueryKeys(),
    ]

    expectQueryKeysToMatchContract(queryKeys, expectedQueryKeys)
    expect(queryKeys).toContainEqual(['book', 'draftAssembly', API_READ_SLICE_BOOK_ID, 'en'])
    expect(queryKeys).not.toContainEqual(['book', 'workspace', API_READ_SLICE_BOOK_ID, 'en'])
    expect(queryKeys).not.toContainEqual(['chapter', 'workspace', API_READ_SLICE_CHAPTER_IDS[0]])
    expect(queryKeys).not.toContainEqual(['chapter', 'workspace', API_READ_SLICE_CHAPTER_IDS[1]])

    const params = new URLSearchParams(window.location.search)
    expect(params.get('selectedChapterId')).toBeTruthy()
    expect(params.get('reviewFilter')).toBe('all')
    expect(params.get('reviewStatusFilter')).toBe('open')
    expect(params.get('checkpointId')).toBe(API_READ_SLICE_CHECKPOINT_ID)
    expect(params.get('exportProfileId')).toBe(API_READ_SLICE_EXPORT_PROFILE_ID)
    expect(params.get('branchId')).toBe(API_READ_SLICE_BRANCH_ID)
  })

  it('falls back to the legacy book/chapter/scene read graph when draft assembly is unsupported', async () => {
    const queryClient = createQueryClient()
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
    })
    const { getBookDraftAssembly: _getBookDraftAssembly, ...legacyBookClient } = runtime.bookClient
    const fallbackRuntime = {
      ...runtime,
      bookClient: legacyBookClient,
    }

    window.history.replaceState({}, '', API_READ_SLICE_ROUTE)

    render(
      <AppProviders runtime={fallbackRuntime} queryClient={queryClient}>
        <BookRouteHarness />
      </AppProviders>,
    )

    await screen.findByRole('heading', { name: 'Review inbox' })

    await waitFor(() => {
      expect(
        queryClient.getQueryState(
          reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID),
        )?.status,
      ).toBe('success')
      expect(
        queryClient.getQueryState(
          reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID),
        )?.status,
      ).toBe('success')
    })

    await waitFor(() => {
      const exportArtifactsState = queryClient.getQueryState([
        'book',
        'exportArtifacts',
        API_READ_SLICE_BOOK_ID,
        API_READ_SLICE_EXPORT_PROFILE_ID,
        API_READ_SLICE_CHECKPOINT_ID,
      ])
      expect(exportArtifactsState?.status).toBe('success')
    })

    const normalizedRequests = requests.map((request) => ({
      method: request.method,
      path: request.path,
      query: normalizeRequestQuery(request.query as Record<string, unknown> | undefined),
    }))

    const expectedRequests = [
      {
        method: 'GET' as const,
        path: apiRouteContract.projectRuntimeInfo({
          projectId: API_READ_SLICE_PROJECT_ID,
        }),
      },
      ...buildLegacyApiReadSliceExpectedRequests(API_READ_SLICE_PROJECT_ID),
    ]
    expect(requests.every((request) => request.method === 'GET')).toBe(true)
    expect(normalizedRequests).toHaveLength(expectedRequests.length)
    expect(normalizedRequests.map(serializeRequest).sort()).toEqual(
      expectedRequests.map(serializeRequest).sort(),
    )
    expect(normalizedRequests).not.toContainEqual({
      method: 'GET',
      path: apiRouteContract.bookDraftAssembly({
        projectId: API_READ_SLICE_PROJECT_ID,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
      query: undefined,
    })
    expect(normalizedRequests).toContainEqual({
      method: 'GET',
      path: apiRouteContract.bookStructure({
        projectId: API_READ_SLICE_PROJECT_ID,
        bookId: API_READ_SLICE_BOOK_ID,
      }),
      query: undefined,
    })

    const queryKeys = getResolvedQueryKeys(queryClient)
    const expectedQueryKeys = [
      ['project-runtime', API_READ_SLICE_PROJECT_ID, 'health'],
      ...buildLegacyApiReadSliceExpectedQueryKeys(),
    ]

    expectQueryKeysToMatchContract(queryKeys, expectedQueryKeys)
    expect(queryKeys).toContainEqual(['book', 'workspace', API_READ_SLICE_BOOK_ID, 'en'])
    expect(queryKeys).not.toContainEqual(['book', 'draftAssembly', API_READ_SLICE_BOOK_ID, 'en'])
  })
})
