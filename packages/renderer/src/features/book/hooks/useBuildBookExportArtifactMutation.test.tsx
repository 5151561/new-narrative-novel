import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'
import {
  getMockBookExportArtifacts,
  resetMockBookExportArtifactDb,
} from '../api/mock-book-export-artifact-db'
import { createBookClient } from '../api/book-client'
import { bookQueryKeys } from './book-query-keys'
import { useBuildBookExportArtifactMutation } from './useBuildBookExportArtifactMutation'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

function createExportPreview(readinessBlocker = false): BookExportPreviewWorkspaceViewModel {
  const preview: BookExportPreviewWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'A relay team follows the signal.',
    selectedChapterId: 'chapter-open-water-signals',
    selectedChapter: null,
    profile: {
      exportProfileId: 'profile-editorial-md',
      bookId: 'book-signal-arc',
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
        readinessStatus: readinessBlocker ? 'blocked' : 'ready',
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
      blockerCount: readinessBlocker ? 1 : 0,
      warningCount: 0,
      infoCount: 0,
      missingDraftCount: 0,
      traceGapCount: 0,
      compareChangedSceneCount: 0,
    },
    readiness: {
      status: readinessBlocker ? 'blocked' : 'ready',
      label: readinessBlocker ? 'Export blocked' : 'Export ready',
      issues: readinessBlocker
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
      blockerCount: readinessBlocker ? 1 : 0,
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

function createReviewIssue(): ReviewIssueViewModel {
  return {
    id: 'review-issue-1',
    severity: 'blocker',
    source: 'manuscript',
    kind: 'missing_draft',
    title: 'Missing draft',
    detail: 'The scene still needs prose.',
    recommendation: 'Review the chapter draft.',
    sourceLabel: 'Manuscript',
    tags: [],
    handoffs: [],
    issueSignature: 'review-issue-1::missing_draft',
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
    bookId: 'book-signal-arc',
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
      compareDeltas: 0,
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
    selectedChapterIssueCount: 0,
    annotationsByChapterId: {},
  }
}

describe('useBuildBookExportArtifactMutation', () => {
  it('builds a ready artifact through the book client', async () => {
    resetMockBookExportArtifactDb()
    const queryClient = createQueryClient()
    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          bookClient: createBookClient(),
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        exportPreview: createExportPreview(),
        reviewInbox: createReviewInbox(),
        format: 'markdown',
      })
    })

    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]).toMatchObject({
      filename: 'signal-arc-profile-editorial-md.md',
      mimeType: 'text/markdown',
      content: expect.stringContaining('# Signal Arc'),
    })
  })

  it('throws and does not write when the gate is blocked', async () => {
    resetMockBookExportArtifactDb()
    const buildBookExportArtifact = vi.fn()
    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          bookClient: {
            buildBookExportArtifact,
          },
        }),
      { wrapper: createWrapper(createQueryClient()) },
    )

    await expect(
      act(async () =>
        hook.result.current.mutateAsync({
          exportPreview: createExportPreview(),
          reviewInbox: createReviewInbox([createReviewIssue()]),
          format: 'markdown',
        }),
      ),
    ).rejects.toThrow('Book export artifact build is blocked')

    expect(buildBookExportArtifact).not.toHaveBeenCalled()
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })).toEqual([])
  })

  it('invalidates the export artifacts query key after a successful build', async () => {
    resetMockBookExportArtifactDb()
    const queryClient = createQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          checkpointId: 'checkpoint-1',
          bookClient: createBookClient(),
        }),
      { wrapper: createWrapper(queryClient) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        exportPreview: createExportPreview(),
        reviewInbox: createReviewInbox(),
        format: 'markdown',
      })
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: bookQueryKeys.exportArtifacts('book-signal-arc', 'profile-editorial-md', 'checkpoint-1'),
      })
    })
  })

  it('builds plain text content with the plain text filename and mime type', async () => {
    resetMockBookExportArtifactDb()
    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          bookClient: createBookClient(),
        }),
      { wrapper: createWrapper(createQueryClient()) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        exportPreview: createExportPreview(),
        reviewInbox: null,
        format: 'plain_text',
      })
    })

    const artifact = getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]!
    expect(artifact.filename).toBe('signal-arc-profile-editorial-md.txt')
    expect(artifact.mimeType).toBe('text/plain')
    expect(artifact.content).toContain('Signal Arc')
    expect(artifact.content).not.toContain('# Signal Arc')
  })
})
