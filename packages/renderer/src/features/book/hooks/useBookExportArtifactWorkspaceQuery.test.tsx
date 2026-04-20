import { QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createProjectRuntimeTestWrapper, createTestProjectRuntime } from '@/app/project-runtime'
import type { BookExportArtifactRecord } from '../api/book-export-artifact-records'
import { createBookClient } from '../api/book-client'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'
import { createBookExportArtifactSourceSignature } from '../lib/book-export-artifact-mappers'
import { useBookExportArtifactWorkspaceQuery } from './useBookExportArtifactWorkspaceQuery'

function createWrapper(
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  runtime = createTestProjectRuntime(),
) {
  return createProjectRuntimeTestWrapper({ queryClient, runtime })
}

function createExportPreview(): BookExportPreviewWorkspaceViewModel {
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
        readinessStatus: 'ready',
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
      blockerCount: 0,
      warningCount: 0,
      infoCount: 0,
      missingDraftCount: 0,
      traceGapCount: 0,
      compareChangedSceneCount: 0,
    },
    readiness: {
      status: 'ready',
      label: 'Export ready',
      issues: [],
      blockerCount: 0,
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

function createReviewIssue(overrides: Partial<ReviewIssueViewModel> = {}): ReviewIssueViewModel {
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
    ...overrides,
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
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
      info: issues.filter((issue) => issue.severity === 'info').length,
      traceGaps: 0,
      missingDrafts: 0,
      compareDeltas: 0,
      exportReadiness: 0,
      branchReadiness: 0,
      sceneProposals: 0,
      open: issues.filter((issue) => issue.decision.status === 'open').length,
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

function createArtifactRecord(sourceSignature: string, id = 'artifact-current'): BookExportArtifactRecord {
  return {
    id,
    bookId: 'book-signal-arc',
    exportProfileId: 'profile-editorial-md',
    format: 'markdown',
    status: 'ready',
    filename: `${id}.md`,
    mimeType: 'text/markdown',
    title: 'Signal Arc',
    summary: 'Artifact summary',
    content: '# Signal Arc',
    sourceSignature,
    chapterCount: 1,
    sceneCount: 1,
    wordCount: 88,
    readinessSnapshot: {
      status: 'ready',
      blockerCount: 0,
      warningCount: 0,
      infoCount: 0,
    },
    reviewGateSnapshot: {
      openBlockerCount: 0,
      checkedFixCount: 0,
      blockedFixCount: 0,
      staleFixCount: 0,
    },
    createdAtLabel: 'Built in mock export session',
    createdByLabel: 'Narrative editor',
  }
}

describe('useBookExportArtifactWorkspaceQuery', () => {
  it('returns undefined for undefined export preview and null for null export preview', async () => {
    const client = {
      getBookExportArtifacts: vi.fn(async () => []),
    }
    const hook = renderHook(
      ({ exportPreview }) =>
        useBookExportArtifactWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            exportPreview,
            reviewInbox: createReviewInbox(),
          },
          { bookClient: client },
        ),
      {
        initialProps: { exportPreview: undefined as BookExportPreviewWorkspaceViewModel | null | undefined },
        wrapper: createWrapper(),
      },
    )

    expect(hook.result.current.artifactWorkspace).toBeUndefined()
    expect(client.getBookExportArtifacts).not.toHaveBeenCalled()

    hook.rerender({ exportPreview: null })

    expect(hook.result.current.artifactWorkspace).toBeNull()
    expect(client.getBookExportArtifacts).not.toHaveBeenCalled()
  })

  it('derives latest artifact and stale state from fetched records', async () => {
    const exportPreview = createExportPreview()
    const currentSourceSignature = createBookExportArtifactSourceSignature(exportPreview)
    const client = {
      getBookExportArtifacts: vi.fn(async () => [
        createArtifactRecord('old-source-signature', 'artifact-stale'),
        createArtifactRecord(currentSourceSignature, 'artifact-current'),
      ]),
    }

    const hook = renderHook(
      () =>
        useBookExportArtifactWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            exportPreview,
            reviewInbox: createReviewInbox(),
            exportProfileId: 'profile-editorial-md',
          },
          { bookClient: client },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.artifactWorkspace?.latestArtifact?.artifactId).toBe('artifact-stale')
    })
    expect(hook.result.current.artifactWorkspace?.latestArtifact?.isStale).toBe(true)
    expect(hook.result.current.artifactWorkspace?.artifacts[1]?.isStale).toBe(false)
  })

  it('uses the project runtime book client when no override is provided', async () => {
    const exportPreview = createExportPreview()
    const reviewInbox = createReviewInbox([createReviewIssue()])
    const runtimeClient = {
      getBookExportArtifacts: vi.fn(async () => [
        createArtifactRecord(createBookExportArtifactSourceSignature(exportPreview), 'artifact-runtime'),
      ]),
    }
    const runtime = createTestProjectRuntime({
      bookClient: {
        ...createBookClient(),
        getBookExportArtifacts: runtimeClient.getBookExportArtifacts,
      },
    })
    const hook = renderHook(
      () =>
        useBookExportArtifactWorkspaceQuery({
          bookId: 'book-signal-arc',
          exportPreview,
          reviewInbox,
        }),
      {
        wrapper: createWrapper(new QueryClient({ defaultOptions: { queries: { retry: false } } }), runtime),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.artifactWorkspace?.latestArtifact?.artifactId).toBe('artifact-runtime')
    })

    expect(runtimeClient.getBookExportArtifacts).toHaveBeenCalledWith({
      bookId: 'book-signal-arc',
      exportProfileId: 'profile-editorial-md',
      checkpointId: undefined,
    })
  })

  it('prefers the explicit book client over the project runtime client when both are provided', async () => {
    const exportPreview = createExportPreview()
    const reviewInbox = createReviewInbox([createReviewIssue()])
    const runtimeClient = {
      getBookExportArtifacts: vi.fn(async () => [createArtifactRecord('runtime-source-signature', 'artifact-runtime')]),
    }
    const customClient = {
      getBookExportArtifacts: vi.fn(async () => [
        createArtifactRecord(createBookExportArtifactSourceSignature(exportPreview), 'artifact-custom'),
      ]),
    }
    const runtime = createTestProjectRuntime({
      bookClient: {
        ...createBookClient(),
        getBookExportArtifacts: runtimeClient.getBookExportArtifacts,
      },
    })
    const hook = renderHook(
      () =>
        useBookExportArtifactWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            exportPreview,
            reviewInbox,
          },
          { bookClient: customClient },
        ),
      {
        wrapper: createWrapper(new QueryClient({ defaultOptions: { queries: { retry: false } } }), runtime),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.artifactWorkspace?.latestArtifact?.artifactId).toBe('artifact-custom')
    })

    expect(customClient.getBookExportArtifacts).toHaveBeenCalledWith({
      bookId: 'book-signal-arc',
      exportProfileId: 'profile-editorial-md',
      checkpointId: undefined,
    })
    expect(runtimeClient.getBookExportArtifacts).not.toHaveBeenCalled()
  })

  it('uses review open blockers when deriving the artifact gate', async () => {
    const client = {
      getBookExportArtifacts: vi.fn(async () => []),
    }

    const hook = renderHook(
      () =>
        useBookExportArtifactWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            exportPreview: createExportPreview(),
            reviewInbox: createReviewInbox([createReviewIssue()]),
          },
          { bookClient: client },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.artifactWorkspace?.gate.canBuild).toBe(false)
    })
    expect(hook.result.current.artifactWorkspace?.gate.openBlockerCount).toBe(1)
  })
})
