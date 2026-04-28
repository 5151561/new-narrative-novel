import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createProjectRuntimeTestWrapper, createTestProjectRuntime } from '@/app/project-runtime'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'
import {
  getMockBookExportArtifacts,
  resetMockBookExportArtifactDb,
} from '../api/mock-book-export-artifact-db'
import { createBookClient } from '../api/book-client'
import { bookQueryKeys } from './book-query-keys'
import { useBuildBookExportArtifactMutation } from './useBuildBookExportArtifactMutation'

function createWrapper(
  queryClient: QueryClient,
  runtime = createTestProjectRuntime(),
) {
  return createProjectRuntimeTestWrapper({ queryClient, runtime })
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
    readableManuscript: {
      formatVersion: 'book-manuscript-assembly-v1',
      markdown: [
        '# Signal Arc',
        '',
        'A relay team follows the signal.',
        '',
        '## Chapter 1: Open Water Signals',
        '',
        'Open water summary.',
        '',
        '### Scene 1: Warehouse Bridge',
        '',
        'Current warehouse bridge draft.',
      ].join('\n'),
      plainText: [
        'Signal Arc',
        '',
        'A relay team follows the signal.',
        '',
        'Chapter 1: Open Water Signals',
        'Open water summary.',
        '',
        'Scene 1: Warehouse Bridge',
        'Current warehouse bridge draft.',
      ].join('\n'),
      sections: [
        {
          kind: 'chapter-heading',
          chapterId: 'chapter-open-water-signals',
          chapterOrder: 1,
          chapterTitle: 'Open Water Signals',
          summary: 'Open water summary.',
          assembledWordCount: 88,
          missingDraftCount: 0,
        },
        {
          kind: 'scene-draft',
          chapterId: 'chapter-open-water-signals',
          chapterOrder: 1,
          chapterTitle: 'Open Water Signals',
          sceneId: 'scene-warehouse-bridge',
          sceneOrder: 1,
          sceneTitle: 'Warehouse Bridge',
          sceneSummary: 'Bridge summary.',
          proseDraft: 'Current warehouse bridge draft.',
          draftWordCount: 4,
          traceReady: true,
        },
      ],
      sourceManifest: [
        {
          kind: 'scene-draft',
          chapterId: 'chapter-open-water-signals',
          chapterOrder: 1,
          chapterTitle: 'Open Water Signals',
          sceneId: 'scene-warehouse-bridge',
          sceneOrder: 1,
          sceneTitle: 'Warehouse Bridge',
          sourcePatchId: 'canon-patch-001',
          sourceProposalIds: ['proposal-001'],
          acceptedFactIds: ['fact-001'],
          traceReady: true,
          draftWordCount: 4,
        },
      ],
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
  it('uses the project runtime book client when no override is provided', async () => {
    resetMockBookExportArtifactDb()
    const buildBookExportArtifact = vi.fn(async (input: Parameters<ReturnType<typeof createBookClient>['buildBookExportArtifact']>[0]) => ({
      id: 'artifact-runtime-default',
      ...input,
      status: 'ready' as const,
      createdAtLabel: '2026-04-20 14:00',
      createdByLabel: 'Runtime client',
    }))
    const runtime = createTestProjectRuntime({
      bookClient: {
        ...createBookClient(),
        buildBookExportArtifact,
      },
    })
    const hook = renderHook(() => useBuildBookExportArtifactMutation(), {
      wrapper: createWrapper(createQueryClient(), runtime),
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        exportPreview: createExportPreview(),
        reviewInbox: createReviewInbox(),
        format: 'markdown',
      })
    })

    expect(buildBookExportArtifact).toHaveBeenCalledTimes(1)
  })

  it('prefers the explicit book client over the project runtime client when both are provided', async () => {
    resetMockBookExportArtifactDb()
    const runtimeBuildBookExportArtifact = vi.fn(async (input: Parameters<ReturnType<typeof createBookClient>['buildBookExportArtifact']>[0]) => ({
      id: 'artifact-runtime-default',
      ...input,
      status: 'ready' as const,
      createdAtLabel: '2026-04-20 14:00',
      createdByLabel: 'Runtime client',
    }))
    const customBuildBookExportArtifact = vi.fn(async (input: Parameters<ReturnType<typeof createBookClient>['buildBookExportArtifact']>[0]) => ({
      id: 'artifact-custom',
      ...input,
      status: 'ready' as const,
      createdAtLabel: '2026-04-20 14:30',
      createdByLabel: 'Custom client',
    }))
    const runtime = createTestProjectRuntime({
      bookClient: {
        ...createBookClient(),
        buildBookExportArtifact: runtimeBuildBookExportArtifact,
      },
    })
    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          bookClient: {
            buildBookExportArtifact: customBuildBookExportArtifact,
          },
        }),
      { wrapper: createWrapper(createQueryClient(), runtime) },
    )

    await act(async () => {
      await hook.result.current.mutateAsync({
        exportPreview: createExportPreview(),
        reviewInbox: createReviewInbox(),
        format: 'markdown',
      })
    })

    expect(customBuildBookExportArtifact).toHaveBeenCalledTimes(1)
    expect(runtimeBuildBookExportArtifact).not.toHaveBeenCalled()
  })

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
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]?.content).toContain('## Source manifest')
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]?.content).toContain(
      '- Chapter 1 / Scene 1 / Warehouse Bridge: scene-draft (patch canon-patch-001)',
    )
  })

  it('does not persist excluded readable manuscript content into the built artifact', async () => {
    resetMockBookExportArtifactDb()
    const queryClient = createQueryClient()
    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          bookClient: createBookClient(),
        }),
      { wrapper: createWrapper(queryClient) },
    )
    const exportPreview = createExportPreview()
    exportPreview.chapters[0]!.scenes.push({
      sceneId: 'scene-excluded-canal',
      order: 2,
      title: 'Excluded Canal',
      summary: 'Excluded canal summary.',
      proseDraft: 'Excluded canal draft.',
      draftWordCount: 3,
      isIncluded: false,
      isMissingDraft: false,
      traceReady: true,
      warningsCount: 0,
    })
    exportPreview.readableManuscript.sections.push({
      kind: 'scene-draft',
      chapterId: 'chapter-open-water-signals',
      chapterOrder: 1,
      chapterTitle: 'Open Water Signals',
      sceneId: 'scene-excluded-canal',
      sceneOrder: 2,
      sceneTitle: 'Excluded Canal',
      sceneSummary: 'Excluded canal summary.',
      proseDraft: 'Excluded canal draft.',
      draftWordCount: 3,
      traceReady: true,
    })
    exportPreview.readableManuscript.sourceManifest.push({
      kind: 'scene-draft',
      chapterId: 'chapter-open-water-signals',
      chapterOrder: 1,
      chapterTitle: 'Open Water Signals',
      sceneId: 'scene-excluded-canal',
      sceneOrder: 2,
      sceneTitle: 'Excluded Canal',
      sourcePatchId: 'canon-patch-excluded',
      sourceProposalIds: ['proposal-excluded'],
      acceptedFactIds: ['fact-excluded'],
      traceReady: true,
      draftWordCount: 3,
    })

    await act(async () => {
      await hook.result.current.mutateAsync({
        exportPreview,
        reviewInbox: createReviewInbox(),
        format: 'markdown',
      })
    })

    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]?.content).not.toContain('Excluded Canal')
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]?.content).not.toContain('Excluded canal draft.')
    expect(getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]?.sourceSignature).not.toContain('canon-patch-excluded')
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

  it('keeps chapter summaries and scene headings out of built artifacts when the export profile disables them', async () => {
    resetMockBookExportArtifactDb()
    const hook = renderHook(
      () =>
        useBuildBookExportArtifactMutation({
          bookClient: createBookClient(),
        }),
      { wrapper: createWrapper(createQueryClient()) },
    )
    const exportPreview = createExportPreview()
    exportPreview.profile.includes.chapterSummaries = false
    exportPreview.profile.includes.sceneHeadings = false

    await act(async () => {
      await hook.result.current.mutateAsync({
        exportPreview,
        reviewInbox: createReviewInbox(),
        format: 'markdown',
      })
    })

    const content = getMockBookExportArtifacts({ bookId: 'book-signal-arc' })[0]?.content ?? ''
    expect(content).toContain('## Chapter 1: Open Water Signals')
    expect(content).not.toContain('Open water summary.')
    expect(content).not.toContain('### Scene 1: Warehouse Bridge')
    expect(content).toContain('Current warehouse bridge draft.')
  })
})
