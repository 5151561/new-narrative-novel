import type { PropsWithChildren } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApiRequestError, ProjectRuntimeProvider, apiRouteContract } from '@/app/project-runtime'
import { createFakeApiRuntime } from '@/app/project-runtime/fake-api-runtime.test-utils'
import {
  buildBookExportArtifactInput,
} from '@/features/book/lib/book-export-artifact-mappers'
import {
  getMockBookExportArtifacts,
  resetMockBookExportArtifactDb,
} from '@/features/book/api/mock-book-export-artifact-db'
import { bookQueryKeys } from '@/features/book/hooks/book-query-keys'
import { useBuildBookExportArtifactMutation } from '@/features/book/hooks/useBuildBookExportArtifactMutation'
import { chapterQueryKeys } from '@/features/chapter/hooks/chapter-query-keys'
import { useReorderChapterSceneMutation } from '@/features/chapter/hooks/useReorderChapterSceneMutation'
import { useUpdateChapterSceneStructureMutation } from '@/features/chapter/hooks/useUpdateChapterSceneStructureMutation'
import { resetMockChapterDb } from '@/features/chapter/api/mock-chapter-db'
import { createChapterClient } from '@/features/chapter/api/chapter-client'
import {
  API_READ_SLICE_BOOK_ID,
  API_READ_SLICE_PROJECT_ID,
} from '@/app/project-runtime/api-read-slice-fixtures'
import { reviewQueryKeys } from '@/features/review/hooks/review-query-keys'
import {
  useClearReviewIssueDecisionMutation,
} from '@/features/review/hooks/useClearReviewIssueDecisionMutation'
import {
  useClearReviewIssueFixActionMutation,
} from '@/features/review/hooks/useClearReviewIssueFixActionMutation'
import {
  useSetReviewIssueDecisionMutation,
} from '@/features/review/hooks/useSetReviewIssueDecisionMutation'
import {
  useSetReviewIssueFixActionMutation,
} from '@/features/review/hooks/useSetReviewIssueFixActionMutation'
import {
  resetMockReviewDecisionDb,
} from '@/features/review/api/mock-review-decision-db'
import {
  resetMockReviewFixActionDb,
} from '@/features/review/api/mock-review-fix-action-db'
import type { BookExportPreviewWorkspaceViewModel } from '@/features/book/types/book-export-view-models'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

function createWrapper(queryClient: QueryClient, runtime: ReturnType<typeof createFakeApiRuntime>['runtime']) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
      </QueryClientProvider>
    )
  }
}

function createDeferredPromise<T>() {
  let resolve: ((value: T) => void) | undefined
  let reject: ((error: Error) => void) | undefined
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve
    reject = nextReject
  })

  return {
    promise,
    resolve: (value: T) => resolve?.(value),
    reject: (error: Error) => reject?.(error),
  }
}

function createReviewIssue(issueId = 'compare-delta-chapter-2-scene-3'): ReviewIssueViewModel {
  return {
    id: issueId,
    severity: 'blocker',
    source: 'compare',
    kind: 'compare_delta',
    title: 'Compare delta needs review',
    detail: 'Scene Three changed against the selected checkpoint.',
    recommendation: 'Review the compare delta.',
    sourceLabel: 'Compare delta',
    tags: [],
    handoffs: [],
    issueSignature: `${issueId}::compare_delta`,
    chapterId: 'chapter-open-water-signals',
    decision: {
      status: 'open',
      isStale: false,
    },
    fixAction: {
      status: 'not_started',
      isStale: false,
    },
    primaryFixHandoff: null,
  }
}

function createReviewInbox(issues: ReviewIssueViewModel[] = []): BookReviewInboxViewModel {
  return {
    bookId: API_READ_SLICE_BOOK_ID,
    title: 'Signal Arc',
    selectedIssueId: null,
    selectedIssue: null,
    activeFilter: 'all',
    activeStatusFilter: 'open',
    issues,
    filteredIssues: issues,
    groupedIssues: {
      blockers: issues.filter((issue) => issue.severity === 'blocker'),
      warnings: issues.filter((issue) => issue.severity === 'warning'),
      info: issues.filter((issue) => issue.severity === 'info'),
    },
    counts: {
      total: issues.length,
      blockers: issues.filter((issue) => issue.severity === 'blocker').length,
      warnings: 0,
      info: 0,
      traceGaps: 0,
      missingDrafts: 0,
      compareDeltas: issues.length,
      exportReadiness: 0,
      branchReadiness: 0,
      sceneProposals: 0,
      open: issues.length,
      reviewed: 0,
      deferred: 0,
      dismissed: 0,
      stale: 0,
      fixStarted: 0,
      fixChecked: 0,
      fixBlocked: 0,
      fixStale: 0,
    },
    visibleOpenCount: issues.length,
    selectedChapterIssueCount: issues.length,
    annotationsByChapterId: {},
  }
}

function createExportPreview(readinessBlocked = false): BookExportPreviewWorkspaceViewModel {
  const preview: BookExportPreviewWorkspaceViewModel = {
    bookId: API_READ_SLICE_BOOK_ID,
    title: 'Signal Arc',
    summary: 'A relay team follows the signal.',
    selectedChapterId: 'chapter-open-water-signals',
    selectedChapter: null,
    profile: {
      exportProfileId: 'profile-editorial-md',
      bookId: API_READ_SLICE_BOOK_ID,
      kind: 'editorial',
      title: 'Editorial Markdown',
      summary: 'Markdown package for editorial pass.',
      createdAtLabel: 'Updated for PR13 baseline',
      includes: {
        manuscriptBody: true,
        chapterSummaries: true,
        sceneHeadings: true,
        traceAppendix: true,
        compareSummary: true,
        readinessChecklist: true,
      },
      rules: {
        requireAllScenesDrafted: false,
        requireTraceReady: false,
        allowWarnings: true,
        allowDraftMissing: true,
      },
    },
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 1,
        title: 'Open Water Signals',
        summary: 'Open water summary.',
        isIncluded: true,
        assembledWordCount: 88,
        missingDraftCount: 0,
        missingTraceCount: 0,
        warningCount: 0,
        readinessStatus: readinessBlocked ? 'blocked' : 'ready',
        scenes: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Bridge summary.',
            proseDraft: 'Current warehouse bridge draft.',
            draftWordCount: 4,
            isIncluded: true,
            isMissingDraft: false,
            traceReady: true,
            warningsCount: 0,
          },
        ],
      },
    ],
    totals: {
      includedChapterCount: 1,
      includedSceneCount: 1,
      assembledWordCount: 88,
      blockerCount: readinessBlocked ? 1 : 0,
      warningCount: 0,
      infoCount: 0,
      missingDraftCount: 0,
      traceGapCount: 0,
      compareChangedSceneCount: 0,
    },
    readiness: {
      status: readinessBlocked ? 'blocked' : 'ready',
      label: readinessBlocked ? 'Export blocked' : 'Export ready',
      issues: readinessBlocked
        ? [
            {
              id: 'export-blocker-1',
              severity: 'blocker',
              kind: 'missing_draft',
              title: 'Draft coverage incomplete',
              detail: 'One scene is missing draft prose.',
            },
          ]
        : [],
      blockerCount: readinessBlocked ? 1 : 0,
      warningCount: 0,
      infoCount: 0,
    },
    packageSummary: {
      includedSections: ['Manuscript body'],
      excludedSections: [],
      estimatedPackageLabel: 'Approx. 1 manuscript pages',
    },
  }

  preview.selectedChapter = preview.chapters[0]!
  return preview
}

describe('api write-slice contract', () => {
  afterEach(() => {
    window.localStorage.clear()
    resetMockReviewDecisionDb()
    resetMockReviewFixActionDb()
    resetMockBookExportArtifactDb()
    resetMockChapterDb()
  })

  it('sends PUT review decision through the API runtime, settles optimistic state, and invalidates the original review key', async () => {
    const deferred = createDeferredPromise<{
      id: string
      bookId: string
      issueId: string
      issueSignature: string
      status: 'reviewed'
      note?: string
      updatedAtLabel: string
      updatedByLabel: string
    }>()
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const issueId = 'compare-delta-chapter-2-scene-3'
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'PUT',
          path: apiRouteContract.reviewIssueDecision({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
            issueId,
          }),
          response: async () => deferred.promise,
        },
      ],
    })
    queryClient.setQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID), [])

    const hook = renderHook(
      () =>
        useSetReviewIssueDecisionMutation({
          bookId: API_READ_SLICE_BOOK_ID,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    let mutationPromise: Promise<unknown> | undefined
    await act(async () => {
      mutationPromise = hook.result.current.mutateAsync({
        issueId,
        issueSignature: `${issueId}::compare_delta`,
        status: 'reviewed',
        note: 'Ship it',
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID))).toEqual([
        expect.objectContaining({
          issueId,
          status: 'reviewed',
          note: 'Ship it',
        }),
      ])
    })
    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'PUT',
        path: apiRouteContract.reviewIssueDecision({
          projectId: API_READ_SLICE_PROJECT_ID,
          bookId: API_READ_SLICE_BOOK_ID,
          issueId,
        }),
        body: {
          bookId: API_READ_SLICE_BOOK_ID,
          issueId,
          issueSignature: `${issueId}::compare_delta`,
          status: 'reviewed',
          note: 'Ship it',
        },
      }),
    )

    deferred.resolve({
      id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
      bookId: API_READ_SLICE_BOOK_ID,
      issueId,
      issueSignature: `${issueId}::compare_delta`,
      status: 'reviewed',
      note: 'Ship it',
      updatedAtLabel: '2026-04-21 10:00',
      updatedByLabel: 'API reviewer',
    })

    await act(async () => {
      await mutationPromise
    })

    expect(queryClient.getQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID))).toEqual([
      expect.objectContaining({
        issueId,
        updatedByLabel: 'API reviewer',
      }),
    ])
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID),
        refetchType: 'active',
      })
    })
  })

  it('rolls back a 422 review decision set through the API runtime', async () => {
    const issueId = 'compare-delta-chapter-2-scene-3'
    const existingRecord = {
      id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
      bookId: API_READ_SLICE_BOOK_ID,
      issueId,
      issueSignature: `${issueId}::compare_delta`,
      status: 'deferred' as const,
      updatedAtLabel: '2026-04-21 09:00',
      updatedByLabel: 'Existing reviewer',
    }
    const queryClient = createQueryClient()
    queryClient.setQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID), [existingRecord])
    const { runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'PUT',
          path: apiRouteContract.reviewIssueDecision({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
            issueId,
          }),
          error: new ApiRequestError({
            status: 422,
            message: 'Review decision note is invalid.',
            code: 'review-decision-invalid',
          }),
        },
      ],
    })

    const hook = renderHook(
      () =>
        useSetReviewIssueDecisionMutation({
          bookId: API_READ_SLICE_BOOK_ID,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          issueId,
          issueSignature: `${issueId}::compare_delta`,
          status: 'reviewed',
          note: 'bad note',
        }),
      ),
    ).rejects.toMatchObject({
      status: 422,
      message: 'Review decision note is invalid.',
    })

    expect(queryClient.getQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID))).toEqual([existingRecord])
  })

  it('sends DELETE review decision through the API runtime and invalidates the original review key', async () => {
    const issueId = 'compare-delta-chapter-2-scene-3'
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID), [
      {
        id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
        bookId: API_READ_SLICE_BOOK_ID,
        issueId,
        issueSignature: `${issueId}::compare_delta`,
        status: 'deferred',
        updatedAtLabel: '2026-04-21 09:00',
        updatedByLabel: 'Existing reviewer',
      },
    ])
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
    })

    const hook = renderHook(
      () =>
        useClearReviewIssueDecisionMutation({
          bookId: API_READ_SLICE_BOOK_ID,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({ issueId })
    })

    expect(queryClient.getQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID))).toEqual([])
    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'DELETE',
        path: apiRouteContract.reviewIssueDecision({
          projectId: API_READ_SLICE_PROJECT_ID,
          bookId: API_READ_SLICE_BOOK_ID,
          issueId,
        }),
      }),
    )
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID),
        refetchType: 'active',
      })
    })
  })

  it('rolls back a 500 review decision clear through the API runtime', async () => {
    const issueId = 'compare-delta-chapter-2-scene-3'
    const existingRecord = {
      id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
      bookId: API_READ_SLICE_BOOK_ID,
      issueId,
      issueSignature: `${issueId}::compare_delta`,
      status: 'deferred' as const,
      updatedAtLabel: '2026-04-21 09:00',
      updatedByLabel: 'Existing reviewer',
    }
    const queryClient = createQueryClient()
    queryClient.setQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID), [existingRecord])
    const { runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'DELETE',
          path: apiRouteContract.reviewIssueDecision({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
            issueId,
          }),
          error: new ApiRequestError({
            status: 500,
            message: 'Review decision clear failed.',
            code: 'review-decision-clear-failed',
          }),
        },
      ],
    })

    const hook = renderHook(
      () =>
        useClearReviewIssueDecisionMutation({
          bookId: API_READ_SLICE_BOOK_ID,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await expect(
      act(async () => hook.result.current.mutateAsync({ issueId })),
    ).rejects.toMatchObject({
      status: 500,
      message: 'Review decision clear failed.',
    })

    expect(queryClient.getQueryData(reviewQueryKeys.decisions(API_READ_SLICE_BOOK_ID))).toEqual([existingRecord])
  })

  it('sends PUT review fix action through the API runtime, settles optimistic state, and invalidates the original review key', async () => {
    const deferred = createDeferredPromise<{
      id: string
      bookId: string
      issueId: string
      issueSignature: string
      sourceHandoffId: string
      sourceHandoffLabel: string
      targetScope: 'scene'
      status: 'started'
      note?: string
      startedAtLabel: string
      updatedAtLabel: string
      updatedByLabel: string
    }>()
    const issueId = 'scene-proposal-seed-scene-5'
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID), [])
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'PUT',
          path: apiRouteContract.reviewIssueFixAction({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
            issueId,
          }),
          response: async () => deferred.promise,
        },
      ],
    })

    const hook = renderHook(
      () =>
        useSetReviewIssueFixActionMutation({
          bookId: API_READ_SLICE_BOOK_ID,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    let mutationPromise: Promise<unknown> | undefined
    await act(async () => {
      mutationPromise = hook.result.current.mutateAsync({
        issueId,
        issueSignature: `${issueId}::scene_proposal`,
        sourceHandoffId: 'scene-proposal-handoff',
        sourceHandoffLabel: 'Open scene proposal',
        targetScope: 'scene',
        status: 'started',
        note: 'Follow proposal branch',
      })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID))).toEqual([
        expect.objectContaining({
          issueId,
          sourceHandoffId: 'scene-proposal-handoff',
          status: 'started',
        }),
      ])
    })
    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'PUT',
        path: apiRouteContract.reviewIssueFixAction({
          projectId: API_READ_SLICE_PROJECT_ID,
          bookId: API_READ_SLICE_BOOK_ID,
          issueId,
        }),
        body: {
          bookId: API_READ_SLICE_BOOK_ID,
          issueId,
          issueSignature: `${issueId}::scene_proposal`,
          sourceHandoffId: 'scene-proposal-handoff',
          sourceHandoffLabel: 'Open scene proposal',
          targetScope: 'scene',
          status: 'started',
          note: 'Follow proposal branch',
        },
      }),
    )

    deferred.resolve({
      id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
      bookId: API_READ_SLICE_BOOK_ID,
      issueId,
      issueSignature: `${issueId}::scene_proposal`,
      sourceHandoffId: 'scene-proposal-handoff',
      sourceHandoffLabel: 'Open scene proposal',
      targetScope: 'scene',
      status: 'started',
      note: 'Follow proposal branch',
      startedAtLabel: '2026-04-21 10:30',
      updatedAtLabel: '2026-04-21 10:30',
      updatedByLabel: 'API reviewer',
    })

    await act(async () => {
      await mutationPromise
    })

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID))).toEqual([
      expect.objectContaining({
        issueId,
        updatedByLabel: 'API reviewer',
      }),
    ])
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID),
        refetchType: 'active',
      })
    })
  })

  it('rolls back a 409 review fix action set through the API runtime', async () => {
    const issueId = 'scene-proposal-seed-scene-5'
    const existingRecord = {
      id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
      bookId: API_READ_SLICE_BOOK_ID,
      issueId,
      issueSignature: `${issueId}::scene_proposal`,
      sourceHandoffId: 'existing-handoff',
      sourceHandoffLabel: 'Open existing source',
      targetScope: 'scene' as const,
      status: 'checked' as const,
      startedAtLabel: '2026-04-21 09:30',
      updatedAtLabel: '2026-04-21 09:40',
      updatedByLabel: 'Existing reviewer',
    }
    const queryClient = createQueryClient()
    queryClient.setQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID), [existingRecord])
    const { runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'PUT',
          path: apiRouteContract.reviewIssueFixAction({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
            issueId,
          }),
          error: new ApiRequestError({
            status: 409,
            message: 'Fix action is stale.',
            code: 'review-fix-action-conflict',
          }),
        },
      ],
    })

    const hook = renderHook(
      () =>
        useSetReviewIssueFixActionMutation({
          bookId: API_READ_SLICE_BOOK_ID,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          issueId,
          issueSignature: `${issueId}::scene_proposal`,
          sourceHandoffId: 'new-handoff',
          sourceHandoffLabel: 'Open scene proposal',
          targetScope: 'scene',
          status: 'started',
        }),
      ),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Fix action is stale.',
    })

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID))).toEqual([existingRecord])
  })

  it('sends DELETE review fix action through the API runtime and invalidates the original review key', async () => {
    const issueId = 'scene-proposal-seed-scene-5'
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    queryClient.setQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID), [
      {
        id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
        bookId: API_READ_SLICE_BOOK_ID,
        issueId,
        issueSignature: `${issueId}::scene_proposal`,
        sourceHandoffId: 'scene-proposal-handoff',
        sourceHandoffLabel: 'Open scene proposal',
        targetScope: 'scene',
        status: 'blocked',
        startedAtLabel: '2026-04-21 09:30',
        updatedAtLabel: '2026-04-21 09:40',
        updatedByLabel: 'Existing reviewer',
      },
    ])
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
    })

    const hook = renderHook(
      () =>
        useClearReviewIssueFixActionMutation({
          bookId: API_READ_SLICE_BOOK_ID,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({ issueId })
    })

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID))).toEqual([])
    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'DELETE',
        path: apiRouteContract.reviewIssueFixAction({
          projectId: API_READ_SLICE_PROJECT_ID,
          bookId: API_READ_SLICE_BOOK_ID,
          issueId,
        }),
      }),
    )
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID),
        refetchType: 'active',
      })
    })
  })

  it('rolls back a 500 review fix action clear through the API runtime', async () => {
    const issueId = 'scene-proposal-seed-scene-5'
    const existingRecord = {
      id: `${API_READ_SLICE_BOOK_ID}::${issueId}`,
      bookId: API_READ_SLICE_BOOK_ID,
      issueId,
      issueSignature: `${issueId}::scene_proposal`,
      sourceHandoffId: 'scene-proposal-handoff',
      sourceHandoffLabel: 'Open scene proposal',
      targetScope: 'scene' as const,
      status: 'blocked' as const,
      startedAtLabel: '2026-04-21 09:30',
      updatedAtLabel: '2026-04-21 09:40',
      updatedByLabel: 'Existing reviewer',
    }
    const queryClient = createQueryClient()
    queryClient.setQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID), [existingRecord])
    const { runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'DELETE',
          path: apiRouteContract.reviewIssueFixAction({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
            issueId,
          }),
          error: new ApiRequestError({
            status: 500,
            message: 'Review fix action clear failed.',
            code: 'review-fix-action-clear-failed',
          }),
        },
      ],
    })

    const hook = renderHook(
      () =>
        useClearReviewIssueFixActionMutation({
          bookId: API_READ_SLICE_BOOK_ID,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await expect(
      act(async () => hook.result.current.mutateAsync({ issueId })),
    ).rejects.toMatchObject({
      status: 500,
      message: 'Review fix action clear failed.',
    })

    expect(queryClient.getQueryData(reviewQueryKeys.fixActions(API_READ_SLICE_BOOK_ID))).toEqual([existingRecord])
  })

  it('sends chapter reorder through the API runtime and invalidates chapterQueryKeys.workspace(chapterId)', async () => {
    const chapterId = 'chapter-signals-in-rain'
    const sceneId = 'scene-ticket-window'
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId })
    expect(seedRecord).not.toBeNull()
    if (!seedRecord) {
      return
    }
    queryClient.setQueryData(chapterQueryKeys.workspace(chapterId), seedRecord)
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
    })

    const hook = renderHook(
      () =>
        useReorderChapterSceneMutation({
          chapterId,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        sceneId,
        targetIndex: 0,
      })
    })

    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'POST',
        path: apiRouteContract.chapterSceneReorder({
          projectId: API_READ_SLICE_PROJECT_ID,
          chapterId,
          sceneId,
        }),
        body: {
          targetIndex: 0,
        },
      }),
    )
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: chapterQueryKeys.workspace(chapterId),
        refetchType: 'active',
      })
    })
  })

  it('rolls back a 409 chapter reorder through the API runtime', async () => {
    const chapterId = 'chapter-signals-in-rain'
    const sceneId = 'scene-ticket-window'
    const queryClient = createQueryClient()
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId })
    expect(seedRecord).not.toBeNull()
    if (!seedRecord) {
      return
    }
    queryClient.setQueryData(chapterQueryKeys.workspace(chapterId), seedRecord)
    const { runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'POST',
          path: apiRouteContract.chapterSceneReorder({
            projectId: API_READ_SLICE_PROJECT_ID,
            chapterId,
            sceneId,
          }),
          body: {
            targetIndex: 0,
          },
          error: new ApiRequestError({
            status: 409,
            message: 'Chapter reorder conflict.',
            code: 'chapter-scene-reorder-conflict',
          }),
        },
      ],
    })

    const hook = renderHook(
      () =>
        useReorderChapterSceneMutation({
          chapterId,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          sceneId,
          targetIndex: 0,
        }),
      ),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Chapter reorder conflict.',
    })

    expect(queryClient.getQueryData(chapterQueryKeys.workspace(chapterId))).toEqual(seedRecord)
  })

  it('sends chapter structure patch through the API runtime and invalidates chapterQueryKeys.workspace(chapterId)', async () => {
    const chapterId = 'chapter-signals-in-rain'
    const sceneId = 'scene-concourse-delay'
    const patch = {
      summary: 'Updated summary through API runtime',
      conflict: 'Updated conflict through API runtime',
    }
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId })
    expect(seedRecord).not.toBeNull()
    if (!seedRecord) {
      return
    }
    queryClient.setQueryData(chapterQueryKeys.workspace(chapterId), seedRecord)
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
    })

    const hook = renderHook(
      () =>
        useUpdateChapterSceneStructureMutation({
          chapterId,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        sceneId,
        locale: 'en',
        patch,
      })
    })

    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'PATCH',
        path: apiRouteContract.chapterSceneStructure({
          projectId: API_READ_SLICE_PROJECT_ID,
          chapterId,
          sceneId,
        }),
        body: {
          locale: 'en',
          patch,
        },
      }),
    )
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: chapterQueryKeys.workspace(chapterId),
        refetchType: 'active',
      })
    })
  })

  it('rolls back a 422 chapter structure patch through the API runtime', async () => {
    const chapterId = 'chapter-signals-in-rain'
    const sceneId = 'scene-concourse-delay'
    const queryClient = createQueryClient()
    const seedRecord = await createChapterClient().getChapterStructureWorkspace({ chapterId })
    expect(seedRecord).not.toBeNull()
    if (!seedRecord) {
      return
    }
    queryClient.setQueryData(chapterQueryKeys.workspace(chapterId), seedRecord)
    const { runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'PATCH',
          path: apiRouteContract.chapterSceneStructure({
            projectId: API_READ_SLICE_PROJECT_ID,
            chapterId,
            sceneId,
          }),
          body: {
            locale: 'en',
            patch: {
              summary: 'Bad patch',
            },
          },
          error: new ApiRequestError({
            status: 422,
            message: 'Chapter structure patch is invalid.',
            code: 'chapter-scene-structure-invalid',
          }),
        },
      ],
    })

    const hook = renderHook(
      () =>
        useUpdateChapterSceneStructureMutation({
          chapterId,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          sceneId,
          locale: 'en',
          patch: {
            summary: 'Bad patch',
          },
        }),
      ),
    ).rejects.toMatchObject({
      status: 422,
      message: 'Chapter structure patch is invalid.',
    })

    expect(queryClient.getQueryData(chapterQueryKeys.workspace(chapterId))).toEqual(seedRecord)
  })

  it('does not POST a book export artifact build when the artifact gate is blocked', async () => {
    const queryClient = createQueryClient()
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
    })

    const hook = renderHook(() => useBuildBookExportArtifactMutation(), {
      wrapper: createWrapper(queryClient, runtime),
    })

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          exportPreview: createExportPreview(),
          reviewInbox: createReviewInbox([createReviewIssue()]),
          format: 'markdown',
        }),
      ),
    ).rejects.toThrow('Book export artifact build is blocked')

    expect(requests.some((request) => request.method === 'POST')).toBe(false)
  })

  it('POSTs a gate-allowed book export artifact build with buildBookExportArtifactInput shape and updates the scoped artifact key', async () => {
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const exportPreview = createExportPreview()
    const reviewInbox = createReviewInbox()
    const checkpointId = 'checkpoint-api-write'
    const { requests, runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
    })

    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          checkpointId,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        exportPreview,
        reviewInbox,
        format: 'markdown',
      })
    })

    expect(requests).toContainEqual(
      expect.objectContaining({
        method: 'POST',
        path: apiRouteContract.bookExportArtifacts({
          projectId: API_READ_SLICE_PROJECT_ID,
          bookId: API_READ_SLICE_BOOK_ID,
        }),
        body: buildBookExportArtifactInput({
          exportPreview,
          reviewInbox,
          format: 'markdown',
          checkpointId,
        }),
      }),
    )
    expect(
      queryClient.getQueryData(
        bookQueryKeys.exportArtifacts(API_READ_SLICE_BOOK_ID, exportPreview.profile.exportProfileId, checkpointId),
      ),
    ).toEqual([
      expect.objectContaining({
        bookId: API_READ_SLICE_BOOK_ID,
        exportProfileId: exportPreview.profile.exportProfileId,
        checkpointId,
      }),
    ])
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: bookQueryKeys.exportArtifacts(API_READ_SLICE_BOOK_ID, exportPreview.profile.exportProfileId, checkpointId),
      })
    })
  })

  it('keeps the export artifact cache clean when the API runtime returns a 500 build failure', async () => {
    const queryClient = createQueryClient()
    const exportPreview = createExportPreview()
    const reviewInbox = createReviewInbox()
    const checkpointId = 'checkpoint-api-write'
    const existingArtifacts = getMockBookExportArtifacts({
      bookId: API_READ_SLICE_BOOK_ID,
      exportProfileId: exportPreview.profile.exportProfileId,
      checkpointId,
    })
    queryClient.setQueryData(
      bookQueryKeys.exportArtifacts(API_READ_SLICE_BOOK_ID, exportPreview.profile.exportProfileId, checkpointId),
      existingArtifacts,
    )
    const { runtime } = createFakeApiRuntime({
      projectId: API_READ_SLICE_PROJECT_ID,
      overrides: [
        {
          method: 'POST',
          path: apiRouteContract.bookExportArtifacts({
            projectId: API_READ_SLICE_PROJECT_ID,
            bookId: API_READ_SLICE_BOOK_ID,
          }),
          error: new ApiRequestError({
            status: 500,
            message: 'Export artifact build failed.',
            code: 'book-export-artifact-build-failed',
          }),
        },
      ],
    })

    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          checkpointId,
        }),
      { wrapper: createWrapper(queryClient, runtime) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          exportPreview,
          reviewInbox,
          format: 'markdown',
        }),
      ),
    ).rejects.toMatchObject({
      status: 500,
      message: 'Export artifact build failed.',
    })

    expect(
      queryClient.getQueryData(
        bookQueryKeys.exportArtifacts(API_READ_SLICE_BOOK_ID, exportPreview.profile.exportProfileId, checkpointId),
      ),
    ).toEqual(existingArtifacts)
  })
})
