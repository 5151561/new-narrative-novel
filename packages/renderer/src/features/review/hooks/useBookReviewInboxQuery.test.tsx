import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import type { BookExperimentBranchWorkspaceViewModel } from '@/features/book/types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '@/features/book/types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '@/features/book/types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '@/features/book/types/book-export-view-models'
import { createReviewClient } from '../api/review-client'
import type { ReviewIssueDecisionRecord } from '../api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '../api/review-fix-action-records'
import { reviewQueryKeys } from './review-query-keys'

import { useBookReviewInboxQuery } from './useBookReviewInboxQuery'

function createCurrentDraftWorkspace(): BookDraftWorkspaceViewModel {
  const workspace: BookDraftWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Draft workspace',
    selectedChapterId: 'chapter-1',
    assembledWordCount: 1800,
    draftedChapterCount: 2,
    missingDraftChapterCount: 1,
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 2,
        missingDraftChapterCount: 1,
        assembledWordCount: 1800,
        warningHeavyChapterCount: 1,
        missingTraceChapterCount: 1,
      },
      signals: {
        topMissingScenes: ['Scene One'],
        latestDiffSummaries: ['Scene Two tightened'],
        traceCoverageNote: 'One scene still needs trace coverage.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 1,
      missingTraceChapterCount: 1,
      warningsChapterCount: 1,
      queuedRevisionChapterCount: 1,
      highestPressureChapters: [],
      missingDraftChapters: [],
      missingTraceChapters: [],
      warningsChapters: [],
      queuedRevisionChapters: [],
    },
    chapters: [
      {
        chapterId: 'chapter-1',
        order: 1,
        title: 'Chapter One',
        summary: 'Opening chapter',
        sceneCount: 2,
        draftedSceneCount: 1,
        missingDraftCount: 1,
        assembledWordCount: 900,
        warningsCount: 2,
        queuedRevisionCount: 1,
        tracedSceneCount: 1,
        missingTraceSceneCount: 1,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-1',
            order: 1,
            title: 'Scene One',
            summary: 'Missing prose',
            proseDraft: undefined,
            isMissingDraft: true,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-2',
            order: 2,
            title: 'Scene Two',
            summary: 'Trace gap scene',
            proseDraft: 'Draft text.',
            draftWordCount: 2,
            isMissingDraft: false,
            warningsCount: 2,
            revisionQueueCount: 1,
            traceReady: false,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
        ],
      },
      {
        chapterId: 'chapter-2',
        order: 2,
        title: 'Chapter Two',
        summary: 'Middle chapter',
        sceneCount: 1,
        draftedSceneCount: 1,
        missingDraftCount: 0,
        assembledWordCount: 900,
        warningsCount: 0,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 0,
        assembledProseSections: [],
        coverageStatus: 'ready',
        sections: [
          {
            sceneId: 'scene-3',
            order: 1,
            title: 'Scene Three',
            summary: 'Compare change scene',
            proseDraft: 'Draft text.',
            draftWordCount: 2,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
        ],
      },
    ],
  }

  workspace.selectedChapter = workspace.chapters[0]!

  return workspace
}

function createCompareWorkspace(): BookManuscriptCompareWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Compare workspace',
    checkpoint: {
      checkpointId: 'checkpoint-1',
      bookId: 'book-signal-arc',
      title: 'Checkpoint One',
      createdAtLabel: '2026-04-18 20:10',
      summary: 'Checkpoint summary',
    },
    selectedChapterId: 'chapter-2',
    selectedChapter: null,
    totals: {
      chapterCount: 2,
      sceneCount: 3,
      missingCount: 0,
      addedCount: 0,
      draftMissingCount: 1,
      changedCount: 1,
      unchangedCount: 1,
      wordDelta: 12,
      traceRegressionCount: 0,
      warningsDelta: 0,
    },
    chapters: [
      {
        chapterId: 'chapter-1',
        order: 1,
        title: 'Chapter One',
        summary: 'Opening chapter',
        scenes: [
          {
            sceneId: 'scene-1',
            order: 1,
            title: 'Scene One',
            summary: 'Missing draft in compare',
            delta: 'draft_missing',
            currentWordCount: 0,
            checkpointWordCount: 120,
            wordDelta: -120,
            traceReadyChanged: false,
            warningsDelta: 0,
          },
        ],
        totals: {
          sceneCount: 1,
          missingCount: 0,
          addedCount: 0,
          draftMissingCount: 1,
          changedCount: 0,
          unchangedCount: 0,
          wordDelta: -120,
          traceRegressionCount: 0,
          warningsDelta: 0,
        },
        wordDelta: -120,
        traceRegressionCount: 0,
        warningsDelta: 0,
      },
      {
        chapterId: 'chapter-2',
        order: 2,
        title: 'Chapter Two',
        summary: 'Middle chapter',
        scenes: [
          {
            sceneId: 'scene-3',
            order: 1,
            title: 'Scene Three',
            summary: 'Changed scene',
            delta: 'changed',
            currentWordCount: 200,
            checkpointWordCount: 150,
            wordDelta: 50,
            traceReadyChanged: false,
            warningsDelta: 0,
          },
        ],
        totals: {
          sceneCount: 1,
          missingCount: 0,
          addedCount: 0,
          draftMissingCount: 0,
          changedCount: 1,
          unchangedCount: 0,
          wordDelta: 50,
          traceRegressionCount: 0,
          warningsDelta: 0,
        },
        wordDelta: 50,
        traceRegressionCount: 0,
        warningsDelta: 0,
      },
    ],
  }
}

function createExportWorkspace(): BookExportPreviewWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Export workspace',
    selectedChapterId: 'chapter-1',
    selectedChapter: null,
    profile: {
      exportProfileId: 'export-1',
      bookId: 'book-signal-arc',
      kind: 'review_packet',
      title: 'Review Packet',
      summary: 'Export review packet',
      createdAtLabel: '2026-04-18 20:12',
      includes: {
        manuscriptBody: true,
        chapterSummaries: true,
        sceneHeadings: true,
        traceAppendix: true,
        compareSummary: true,
        readinessChecklist: true,
      },
      rules: {
        requireAllScenesDrafted: true,
        requireTraceReady: true,
        allowWarnings: false,
        allowDraftMissing: false,
      },
    },
    chapters: [],
    totals: {
      includedChapterCount: 2,
      includedSceneCount: 3,
      assembledWordCount: 1800,
      blockerCount: 1,
      warningCount: 0,
      infoCount: 0,
      missingDraftCount: 1,
      traceGapCount: 1,
      compareChangedSceneCount: 1,
    },
    readiness: {
      status: 'blocked',
      label: 'Blocked',
      blockerCount: 1,
      warningCount: 0,
      infoCount: 0,
      issues: [
        {
          id: 'export-blocker-scene-1',
          severity: 'blocker',
          kind: 'missing_draft',
          chapterId: 'chapter-1',
          chapterTitle: 'Chapter One',
          sceneId: 'scene-1',
          sceneTitle: 'Scene One',
          title: 'Export blocker',
          detail: 'Scene One is still missing draft prose.',
        },
      ],
    },
    packageSummary: {
      includedSections: ['Manuscript'],
      excludedSections: [],
      estimatedPackageLabel: '12 pages',
    },
  }
}

function createBranchWorkspace(): BookExperimentBranchWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Branch workspace',
    selectedChapterId: 'chapter-2',
    selectedChapter: null,
    baseline: {
      kind: 'current',
      label: 'Current manuscript',
    },
    branch: {
      branchId: 'branch-1',
      bookId: 'book-signal-arc',
      title: 'Branch One',
      summary: 'Branch summary',
      rationale: 'Try a harder turn.',
      createdAtLabel: '2026-04-18 20:14',
      status: 'review',
    },
    branches: [],
    totals: {
      changedChapterCount: 1,
      changedSceneCount: 0,
      addedSceneCount: 1,
      missingSceneCount: 0,
      draftMissingSceneCount: 0,
      wordDelta: 14,
      traceRegressionCount: 0,
      traceImprovementCount: 0,
      warningsDelta: 0,
      sourceProposalDelta: -1,
      blockedChapterCount: 0,
      attentionChapterCount: 1,
    },
    readiness: {
      status: 'attention',
      label: 'Branch attention',
      issues: [
        {
          id: 'branch-warning-scene-3',
          severity: 'warning',
          chapterId: 'chapter-2',
          sceneId: 'scene-3',
          title: 'Branch warning',
          detail: 'Scene Three needs extra review.',
        },
      ],
    },
    chapters: [
      {
        chapterId: 'chapter-2',
        order: 2,
        title: 'Chapter Two',
        summary: 'Middle chapter',
        changedSceneCount: 0,
        addedSceneCount: 1,
        missingSceneCount: 0,
        draftMissingSceneCount: 0,
        wordDelta: 14,
        traceRegressionCount: 0,
        traceImprovementCount: 0,
        warningsDelta: 0,
        sourceProposalDelta: -1,
        readinessStatus: 'attention',
        sceneDeltas: [
          {
            sceneId: 'scene-4',
            order: 2,
            title: 'Scene Four',
            summary: 'Added without source',
            delta: 'added',
            wordDelta: 14,
            traceReadyChanged: false,
            warningsDelta: 0,
            sourceProposalDelta: -1,
            branchSourceProposalCount: 0,
            baselineSourceProposalCount: 1,
          },
        ],
      },
    ],
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

function createWrapper(
  queryClient = createQueryClient(),
  runtime = createMockProjectRuntime({
    persistence: {
      async loadProjectSnapshot() {
        return null
      },
      async saveProjectSnapshot() {},
      async clearProjectSnapshot() {},
    },
  }),
) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
      </QueryClientProvider>
    )
  }
}

function createReviewClient({
  decisions = [],
  decisionError,
  fixActions = [],
  fixActionError,
}: {
  decisions?: ReviewIssueDecisionRecord[]
  decisionError?: Error
  fixActions?: ReviewIssueFixActionRecord[]
  fixActionError?: Error
} = {}) {
  return {
    getBookReviewDecisions: vi.fn(async () => {
      if (decisionError) {
        throw decisionError
      }

      return structuredClone(decisions)
    }),
    getBookReviewFixActions: vi.fn(async () => {
      if (fixActionError) {
        throw fixActionError
      }

      return structuredClone(fixActions)
    }),
  }
}

function createDecisionSignature(issue: {
  id: string
  kind: string
  source: string
  chapterId?: string
  sceneId?: string
  assetId?: string
  title: string
  detail: string
  sourceExcerpt?: string
}) {
  return [
    issue.id,
    issue.kind,
    issue.source,
    issue.chapterId ?? '',
    issue.sceneId ?? '',
    issue.assetId ?? '',
    issue.title,
    issue.detail,
    issue.sourceExcerpt ?? '',
  ].join('::')
}

function renderReviewInboxHook(
  input: Parameters<typeof useBookReviewInboxQuery>[0],
  reviewClient = createReviewClient(),
) {
  return renderHook(() => useBookReviewInboxQuery(input, { reviewClient }), {
    wrapper: createWrapper(),
  })
}

function buildHookIssueForDecision() {
  return {
    id: 'compare-delta-chapter-2-scene-3',
    issueSignature: createDecisionSignature({
      id: 'compare-delta-chapter-2-scene-3',
      kind: 'compare_delta',
      source: 'compare',
      chapterId: 'chapter-2',
      sceneId: 'scene-3',
      title: 'Compare delta needs review',
      detail: 'Scene Three changed against the selected checkpoint.',
      sourceExcerpt: 'Changed scene',
    }),
  }
}

describe('useBookReviewInboxQuery', () => {
  it('uses the project runtime review client when no override is provided', async () => {
    const baseReviewClient = createReviewClient()
    const reviewClient = {
      ...baseReviewClient,
      getBookReviewDecisions: vi.fn(baseReviewClient.getBookReviewDecisions),
      getBookReviewFixActions: vi.fn(baseReviewClient.getBookReviewFixActions),
    }
    const runtime = createMockProjectRuntime({
      reviewClient,
      persistence: {
        async loadProjectSnapshot() {
          return null
        },
        async saveProjectSnapshot() {},
        async clearProjectSnapshot() {},
      },
    })

    const { result } = renderHook(
      () =>
        useBookReviewInboxQuery({
          bookId: 'book-signal-arc',
          currentDraftWorkspace: createCurrentDraftWorkspace(),
          compareStatus: 'idle',
          exportStatus: 'idle',
          branchStatus: 'idle',
          reviewFilter: 'all',
        }),
      {
        wrapper: createWrapper(createQueryClient(), runtime),
      },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(reviewClient.getBookReviewDecisions).toHaveBeenCalledWith({ bookId: 'book-signal-arc' })
    expect(reviewClient.getBookReviewFixActions).toHaveBeenCalledWith({ bookId: 'book-signal-arc' })
  })

  it('combines current compare export and branch workspaces into a review inbox', async () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: createCurrentDraftWorkspace(),
      compareWorkspace: createCompareWorkspace(),
      compareStatus: 'ready',
      exportWorkspace: createExportWorkspace(),
      exportStatus: 'ready',
      branchWorkspace: createBranchWorkspace(),
      branchStatus: 'ready',
      reviewFilter: 'all',
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.inbox?.issues.some((issue) => issue.source === 'manuscript')).toBe(true)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'compare')).toBe(true)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'export')).toBe(true)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'branch')).toBe(true)
    expect(result.current.inbox?.counts.total).toBe(result.current.inbox?.issues.length)
    expect(result.current.inbox?.groupedIssues.blockers.length).toBeGreaterThan(0)
    expect(result.current.inbox?.activeFilter).toBe('all')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isEmpty).toBe(false)
  })

  it('returns loading with undefined inbox while current draft workspace is still loading', () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: undefined,
      compareStatus: 'idle',
      exportStatus: 'idle',
      branchStatus: 'idle',
      reviewFilter: 'all',
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.inbox).toBeUndefined()
    expect(result.current.isEmpty).toBe(false)
  })

  it('returns a loaded null inbox immediately when the current draft workspace resolved to null', async () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: null,
      compareStatus: 'idle',
      exportStatus: 'idle',
      branchStatus: 'idle',
      reviewFilter: 'all',
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.inbox).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.decisionError).toBeNull()
  })

  it('keeps the null inbox contract even when optional sources are still marked loading', async () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: null,
      compareStatus: 'loading',
      exportStatus: 'idle',
      branchStatus: 'idle',
      reviewFilter: 'all',
    })

    await waitFor(() => {
      expect(result.current.inbox).toBeNull()
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('clears stale decisionError when the hook rerenders into a null inbox state', async () => {
    const reviewError = new Error('Decision failed')
    const { result, rerender } = renderHook(
      (props: { currentDraftWorkspace: BookDraftWorkspaceViewModel | null }) =>
        useBookReviewInboxQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: props.currentDraftWorkspace,
            compareWorkspace: createCompareWorkspace(),
            compareStatus: 'ready',
            exportWorkspace: createExportWorkspace(),
            exportStatus: 'ready',
            branchWorkspace: createBranchWorkspace(),
            branchStatus: 'ready',
            reviewFilter: 'all',
          },
          { reviewClient: createReviewClient({ decisionError: reviewError }) },
        ),
      {
        wrapper: createWrapper(),
        initialProps: {
          currentDraftWorkspace: createCurrentDraftWorkspace(),
        },
      },
    )

    await waitFor(() => {
      expect(result.current.decisionError?.message).toBe('Decision failed')
    })

    rerender({
      currentDraftWorkspace: null,
    })

    await waitFor(() => {
      expect(result.current.inbox).toBeNull()
    })

    expect(result.current.decisionError).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('still returns current and compare issues when export and branch sources are idle', async () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: createCurrentDraftWorkspace(),
      compareWorkspace: createCompareWorkspace(),
      compareStatus: 'ready',
      exportStatus: 'idle',
      branchStatus: 'idle',
      reviewFilter: 'all',
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'manuscript')).toBe(true)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'compare')).toBe(true)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'export')).toBe(false)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'branch')).toBe(false)
  })

  it('keeps loading with undefined inbox while an optional source is still loading', () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: createCurrentDraftWorkspace(),
      compareStatus: 'loading',
      exportStatus: 'idle',
      branchStatus: 'idle',
      reviewFilter: 'all',
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.inbox).toBeUndefined()
    expect(result.current.isEmpty).toBe(false)
  })

  it('surfaces upstream optional-source errors while still returning a partial inbox from available sources', async () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: createCurrentDraftWorkspace(),
      compareError: new Error('Compare failed'),
      exportWorkspace: createExportWorkspace(),
      exportStatus: 'ready',
      branchWorkspace: createBranchWorkspace(),
      branchStatus: 'ready',
      reviewFilter: 'all',
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error?.message).toBe('Compare failed')
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'manuscript')).toBe(true)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'compare')).toBe(false)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'export')).toBe(true)
    expect(result.current.inbox?.issues.some((issue) => issue.source === 'branch')).toBe(true)
  })

  it('syncs selectedIssue with reviewIssueId when the issue exists in the filtered result', async () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: createCurrentDraftWorkspace(),
      compareWorkspace: createCompareWorkspace(),
      compareStatus: 'ready',
      exportWorkspace: createExportWorkspace(),
      exportStatus: 'ready',
      branchWorkspace: createBranchWorkspace(),
      branchStatus: 'ready',
      reviewFilter: 'all',
      reviewIssueId: 'compare-delta-chapter-2-scene-3',
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.inbox?.selectedIssue?.id).toBe('compare-delta-chapter-2-scene-3')
  })

  it('falls back selectedIssue when the filter change removes the requested issue', async () => {
    const { result, rerender } = renderHook(
      (props: {
        reviewFilter: 'all' | 'blockers'
        reviewIssueId?: string
      }) =>
        useBookReviewInboxQuery({
          bookId: 'book-signal-arc',
          currentDraftWorkspace: createCurrentDraftWorkspace(),
          compareWorkspace: createCompareWorkspace(),
          compareStatus: 'ready',
          exportWorkspace: createExportWorkspace(),
          exportStatus: 'ready',
          branchWorkspace: createBranchWorkspace(),
          branchStatus: 'ready',
          reviewFilter: props.reviewFilter,
          reviewIssueId: props.reviewIssueId,
        }, { reviewClient: createReviewClient() }),
      {
        wrapper: createWrapper(),
        initialProps: {
          reviewFilter: 'all',
          reviewIssueId: 'compare-delta-chapter-2-scene-3',
        },
      },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.inbox?.selectedIssue?.id).toBe('compare-delta-chapter-2-scene-3')

    rerender({
      reviewFilter: 'blockers',
      reviewIssueId: 'compare-delta-chapter-2-scene-3',
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.inbox?.selectedIssue?.severity).toBe('blocker')
    expect(result.current.inbox?.selectedIssue?.id).toBe(result.current.inbox?.filteredIssues[0]?.id)
  })

  it('keeps the selected issue detail handoffs available for review detail rendering', async () => {
    const { result } = renderReviewInboxHook({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: createCurrentDraftWorkspace(),
      compareWorkspace: createCompareWorkspace(),
      compareStatus: 'ready',
      exportWorkspace: createExportWorkspace(),
      exportStatus: 'ready',
      branchWorkspace: createBranchWorkspace(),
      branchStatus: 'ready',
      reviewFilter: 'scene-proposals',
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.inbox?.selectedIssue?.handoffs[0]).toMatchObject({
      label: 'Open scene proposal',
      target: {
        scope: 'scene',
        sceneId: 'scene-5',
        lens: 'orchestrate',
        tab: 'execution',
      },
    })
  })

  it('keeps selectedChapterIssueCount aligned with the active filter', async () => {
    const { result, rerender } = renderHook(
      (props: { reviewFilter: 'all' | 'scene-proposals' }) =>
        useBookReviewInboxQuery({
          bookId: 'book-signal-arc',
          currentDraftWorkspace: createCurrentDraftWorkspace(),
          compareWorkspace: createCompareWorkspace(),
          compareStatus: 'ready',
          exportWorkspace: createExportWorkspace(),
          exportStatus: 'ready',
          branchWorkspace: createBranchWorkspace(),
          branchStatus: 'ready',
          reviewFilter: props.reviewFilter,
        }, { reviewClient: createReviewClient() }),
      {
        wrapper: createWrapper(),
        initialProps: {
          reviewFilter: 'all',
        },
      },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.inbox?.selectedChapterIssueCount).toBeGreaterThan(0)

    rerender({
      reviewFilter: 'scene-proposals',
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.inbox?.selectedChapterIssueCount).toBe(0)
  })

  it('surfaces decision query errors while keeping the inbox available with open-state issues', async () => {
    const { result } = renderReviewInboxHook(
      {
        bookId: 'book-signal-arc',
        currentDraftWorkspace: createCurrentDraftWorkspace(),
        compareWorkspace: createCompareWorkspace(),
        compareStatus: 'ready',
        exportWorkspace: createExportWorkspace(),
        exportStatus: 'ready',
        branchWorkspace: createBranchWorkspace(),
        branchStatus: 'ready',
        reviewFilter: 'all',
      },
      createReviewClient({ decisionError: new Error('Decision failed') }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.decisionError?.message).toBe('Decision failed')
    expect(result.current.inbox?.issues.every((issue) => issue.decision.status === 'open')).toBe(true)
  })

  it('ignores cached decision overlays when the decision query errors and falls back to open-state issues', async () => {
    const reviewedIssue = buildHookIssueForDecision()
    const queryClient = createQueryClient()
    queryClient.setQueryData(reviewQueryKeys.decisions('book-signal-arc'), [
      {
        id: 'decision-reviewed',
        bookId: 'book-signal-arc',
        issueId: reviewedIssue.id,
        issueSignature: reviewedIssue.issueSignature,
        status: 'reviewed',
        updatedAtLabel: '2026-04-19 17:20',
        updatedByLabel: 'Editor',
      },
    ])

    const { result } = renderHook(
      () =>
        useBookReviewInboxQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createCurrentDraftWorkspace(),
            compareWorkspace: createCompareWorkspace(),
            compareStatus: 'ready',
            exportWorkspace: createExportWorkspace(),
            exportStatus: 'ready',
            branchWorkspace: createBranchWorkspace(),
            branchStatus: 'ready',
            reviewFilter: 'all',
          },
          { reviewClient: createReviewClient({ decisionError: new Error('Decision failed') }) },
        ),
      { wrapper: createWrapper(queryClient) },
    )

    await waitFor(() => {
      expect(result.current.decisionError?.message).toBe('Decision failed')
    })

    expect(result.current.inbox?.issues.find((issue) => issue.id === reviewedIssue.id)?.decision.status).toBe('open')
  })

  it('filters the visible queue with reviewStatusFilter after decision overlay is applied', async () => {
    const reviewedIssue = buildHookIssueForDecision()

    const { result } = renderReviewInboxHook(
      {
        bookId: 'book-signal-arc',
        currentDraftWorkspace: createCurrentDraftWorkspace(),
        compareWorkspace: createCompareWorkspace(),
        compareStatus: 'ready',
        exportWorkspace: createExportWorkspace(),
        exportStatus: 'ready',
        branchWorkspace: createBranchWorkspace(),
        branchStatus: 'ready',
        reviewFilter: 'all',
        reviewStatusFilter: 'reviewed',
      },
      createReviewClient({
        decisions: [
          {
            id: 'decision-reviewed',
            bookId: 'book-signal-arc',
            issueId: reviewedIssue.id,
            issueSignature: reviewedIssue.issueSignature,
            status: 'reviewed',
            updatedAtLabel: '2026-04-19 17:20',
            updatedByLabel: 'Editor',
          },
        ],
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.inbox?.activeStatusFilter).toBe('reviewed')
    expect(result.current.inbox?.filteredIssues.map((issue) => issue.id)).toEqual([reviewedIssue.id])
  })

  it('merges fix action records into the inbox while keeping decision status filters separate', async () => {
    const issue = buildHookIssueForDecision()

    const { result } = renderReviewInboxHook(
      {
        bookId: 'book-signal-arc',
        currentDraftWorkspace: createCurrentDraftWorkspace(),
        compareWorkspace: createCompareWorkspace(),
        compareStatus: 'ready',
        exportWorkspace: createExportWorkspace(),
        exportStatus: 'ready',
        branchWorkspace: createBranchWorkspace(),
        branchStatus: 'ready',
        reviewFilter: 'all',
      },
      createReviewClient({
        fixActions: [
          {
            id: 'fix-action-1',
            bookId: 'book-signal-arc',
            issueId: issue.id,
            issueSignature: issue.issueSignature,
            sourceHandoffId: `${issue.id}::book-compare`,
            sourceHandoffLabel: 'Open compare review',
            targetScope: 'book',
            status: 'checked',
            startedAtLabel: '2026-04-19 17:30',
            updatedAtLabel: '2026-04-19 17:35',
            updatedByLabel: 'Editor',
          },
        ],
      }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.fixActionError).toBeNull()
    expect(result.current.inbox?.issues.find((item) => item.id === issue.id)?.fixAction).toMatchObject({
      status: 'checked',
      sourceHandoffLabel: 'Open compare review',
      isStale: false,
    })
    expect(result.current.inbox?.counts.fixChecked).toBe(1)
  })

  it('surfaces fix action query errors while keeping the inbox available with empty fix action overlays', async () => {
    const { result } = renderReviewInboxHook(
      {
        bookId: 'book-signal-arc',
        currentDraftWorkspace: createCurrentDraftWorkspace(),
        compareWorkspace: createCompareWorkspace(),
        compareStatus: 'ready',
        exportWorkspace: createExportWorkspace(),
        exportStatus: 'ready',
        branchWorkspace: createBranchWorkspace(),
        branchStatus: 'ready',
        reviewFilter: 'all',
      },
      createReviewClient({ fixActionError: new Error('Fix actions failed') }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.decisionError).toBeNull()
    expect(result.current.fixActionError?.message).toBe('Fix actions failed')
    expect(result.current.inbox?.issues.every((issue) => issue.fixAction.status === 'not_started')).toBe(true)
  })
})
