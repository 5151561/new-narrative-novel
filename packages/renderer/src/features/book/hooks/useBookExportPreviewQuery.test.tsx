import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'

import {
  DEFAULT_BOOK_EXPORT_PROFILE_ID,
  mockBookExportProfileSeeds,
  type BookExportProfileRecord,
} from '../api/book-export-profiles'
import type { BookClient } from '../api/book-client'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import { bookQueryKeys } from './book-query-keys'
import { useBookExportPreviewQuery } from './useBookExportPreviewQuery'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ProjectRuntimeProvider runtime={createMockProjectRuntime({
            persistence: {
              async loadProjectSnapshot() {
                return null
              },
              async saveProjectSnapshot() {},
              async clearProjectSnapshot() {},
            },
          })}
          >
            {children}
          </ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }
}

function createDraftWorkspace(): BookDraftWorkspaceViewModel {
  const workspace: BookDraftWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Current export-ready workspace',
    selectedChapterId: 'chapter-open-water-signals',
    assembledWordCount: 1200,
    draftedChapterCount: 1,
    missingDraftChapterCount: 1,
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 1,
        missingDraftChapterCount: 1,
        assembledWordCount: 1200,
        warningHeavyChapterCount: 2,
        missingTraceChapterCount: 1,
      },
      signals: {
        topMissingScenes: ['Departure Bell'],
        latestDiffSummaries: ['Warehouse Bridge timing tightened'],
        traceCoverageNote: 'Trace coverage still incomplete.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 1,
      missingTraceChapterCount: 1,
      warningsChapterCount: 2,
      queuedRevisionChapterCount: 1,
      highestPressureChapters: [],
      missingDraftChapters: [],
      missingTraceChapters: [],
      warningsChapters: [],
      queuedRevisionChapters: [],
    },
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 1,
        title: 'Open Water Signals',
        summary: 'Open water summary',
        sceneCount: 2,
        draftedSceneCount: 2,
        missingDraftCount: 0,
        assembledWordCount: 640,
        warningsCount: 1,
        queuedRevisionCount: 1,
        tracedSceneCount: 2,
        missingTraceSceneCount: 0,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Bridge summary',
            proseDraft: 'Current warehouse bridge draft.',
            draftWordCount: 4,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 1,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-canal-watch',
            order: 2,
            title: 'Canal Watch',
            summary: 'Canal summary',
            proseDraft: 'Current canal watch draft.',
            draftWordCount: 4,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
        ],
      },
      {
        chapterId: 'chapter-signals-in-rain',
        order: 2,
        title: 'Signals in Rain',
        summary: 'Signals summary',
        sceneCount: 2,
        draftedSceneCount: 1,
        missingDraftCount: 1,
        assembledWordCount: 560,
        warningsCount: 2,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 1,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-ticket-window',
            order: 1,
            title: 'Ticket Window',
            summary: 'Ticket summary',
            proseDraft: 'Current ticket window draft.',
            draftWordCount: 4,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-departure-bell',
            order: 2,
            title: 'Departure Bell',
            summary: 'Departure summary',
            proseDraft: undefined,
            isMissingDraft: true,
            warningsCount: 2,
            revisionQueueCount: 0,
            traceReady: false,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
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
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      bookId: 'book-signal-arc',
      title: 'PR11 Baseline',
      createdAtLabel: '2026-04-17 22:10',
      summary: 'Checkpoint summary',
    },
    selectedChapterId: 'chapter-open-water-signals',
    selectedChapter: null,
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 1,
        title: 'Open Water Signals',
        summary: 'Open water summary',
        totals: {
          sceneCount: 2,
          missingCount: 0,
          addedCount: 0,
          draftMissingCount: 0,
          changedCount: 1,
          unchangedCount: 1,
          wordDelta: -2,
          traceRegressionCount: 0,
          warningsDelta: 1,
        },
        wordDelta: -2,
        traceRegressionCount: 0,
        warningsDelta: 1,
        scenes: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Bridge summary',
            delta: 'changed',
            currentScene: {
              sceneId: 'scene-warehouse-bridge',
              order: 1,
              title: 'Warehouse Bridge',
              summary: 'Bridge summary',
              proseDraft: 'Current warehouse bridge draft.',
              draftWordCount: 4,
              warningsCount: 1,
              traceReady: true,
            },
            checkpointScene: {
              sceneId: 'scene-warehouse-bridge',
              order: 1,
              title: 'Warehouse Bridge',
              summary: 'Bridge summary',
              proseDraft: 'Older bridge draft.',
              draftWordCount: 6,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 4,
            checkpointWordCount: 6,
            wordDelta: -2,
            traceReadyChanged: false,
            warningsDelta: 1,
            currentExcerpt: 'Current warehouse bridge draft.',
            checkpointExcerpt: 'Older bridge draft.',
          },
          {
            sceneId: 'scene-canal-watch',
            order: 2,
            title: 'Canal Watch',
            summary: 'Canal summary',
            delta: 'unchanged',
            currentScene: {
              sceneId: 'scene-canal-watch',
              order: 2,
              title: 'Canal Watch',
              summary: 'Canal summary',
              proseDraft: 'Current canal watch draft.',
              draftWordCount: 4,
              warningsCount: 0,
              traceReady: true,
            },
            checkpointScene: {
              sceneId: 'scene-canal-watch',
              order: 2,
              title: 'Canal Watch',
              summary: 'Canal summary',
              proseDraft: 'Current canal watch draft.',
              draftWordCount: 4,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 4,
            checkpointWordCount: 4,
            wordDelta: 0,
            traceReadyChanged: false,
            warningsDelta: 0,
            currentExcerpt: 'Current canal watch draft.',
            checkpointExcerpt: 'Current canal watch draft.',
          },
        ],
      },
      {
        chapterId: 'chapter-signals-in-rain',
        order: 2,
        title: 'Signals in Rain',
        summary: 'Signals summary',
        totals: {
          sceneCount: 2,
          missingCount: 0,
          addedCount: 1,
          draftMissingCount: 1,
          changedCount: 0,
          unchangedCount: 0,
          wordDelta: -2,
          traceRegressionCount: 1,
          warningsDelta: 2,
        },
        wordDelta: -2,
        traceRegressionCount: 1,
        warningsDelta: 2,
        scenes: [
          {
            sceneId: 'scene-ticket-window',
            order: 1,
            title: 'Ticket Window',
            summary: 'Ticket summary',
            delta: 'added',
            currentScene: {
              sceneId: 'scene-ticket-window',
              order: 1,
              title: 'Ticket Window',
              summary: 'Ticket summary',
              proseDraft: 'Current ticket window draft.',
              draftWordCount: 4,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 4,
            checkpointWordCount: undefined,
            wordDelta: 4,
            traceReadyChanged: false,
            warningsDelta: 0,
            currentExcerpt: 'Current ticket window draft.',
          },
          {
            sceneId: 'scene-departure-bell',
            order: 2,
            title: 'Departure Bell',
            summary: 'Departure summary',
            delta: 'draft_missing',
            currentScene: {
              sceneId: 'scene-departure-bell',
              order: 2,
              title: 'Departure Bell',
              summary: 'Departure summary',
              warningsCount: 2,
              traceReady: false,
            },
            checkpointScene: {
              sceneId: 'scene-departure-bell',
              order: 2,
              title: 'Departure Bell',
              summary: 'Departure summary',
              proseDraft: 'Checkpoint departure bell draft.',
              draftWordCount: 6,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: undefined,
            checkpointWordCount: 6,
            wordDelta: -6,
            traceReadyChanged: true,
            warningsDelta: 2,
            checkpointExcerpt: 'Checkpoint departure bell draft.',
          },
        ],
      },
    ],
    totals: {
      chapterCount: 2,
      sceneCount: 4,
      missingCount: 0,
      addedCount: 1,
      draftMissingCount: 1,
      changedCount: 1,
      unchangedCount: 1,
      wordDelta: -2,
      traceRegressionCount: 1,
      warningsDelta: 3,
    },
  }
}

function createBookClient(
  exportProfiles: BookExportProfileRecord[] = mockBookExportProfileSeeds['book-signal-arc'],
): Pick<BookClient, 'getBookExportProfiles' | 'getBookExportProfile'> {
  return {
    async getBookExportProfiles() {
      return structuredClone(exportProfiles)
    },
    async getBookExportProfile({ exportProfileId }) {
      return structuredClone(exportProfiles.find((item) => item.exportProfileId === exportProfileId) ?? null)
    },
  }
}

function createTrackedBookClient(
  exportProfiles: BookExportProfileRecord[] = mockBookExportProfileSeeds['book-signal-arc'],
) {
  const calls = {
    list: 0,
    item: 0,
  }

  return {
    calls,
    client: {
      async getBookExportProfiles() {
        calls.list += 1
        return structuredClone(exportProfiles)
      },
      async getBookExportProfile({ exportProfileId }) {
        calls.item += 1
        return structuredClone(exportProfiles.find((item) => item.exportProfileId === exportProfileId) ?? null)
      },
    } satisfies Pick<BookClient, 'getBookExportProfiles' | 'getBookExportProfile'>,
  }
}

describe('useBookExportPreviewQuery', () => {
  it('uses dedicated export profile query keys', () => {
    expect(bookQueryKeys.exportProfiles('book-signal-arc', 'en')).toEqual([
      'book',
      'exportProfiles',
      'book-signal-arc',
      'en',
    ])
    expect(bookQueryKeys.exportProfile('book-signal-arc', DEFAULT_BOOK_EXPORT_PROFILE_ID, 'en')).toEqual([
      'book',
      'exportProfile',
      'book-signal-arc',
      DEFAULT_BOOK_EXPORT_PROFILE_ID,
      'en',
    ])
  })

  it('uses the default export profile id and builds an export preview workspace', async () => {
    const hook = renderHook(
      () =>
        useBookExportPreviewQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createDraftWorkspace(),
            compareWorkspace: createCompareWorkspace(),
            exportProfileId: undefined,
          },
          {
            bookClient: createBookClient(),
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.exportProfiles).toHaveLength(3)
    expect(hook.result.current.selectedExportProfile?.exportProfileId).toBe(DEFAULT_BOOK_EXPORT_PROFILE_ID)
    expect(hook.result.current.exportWorkspace).toMatchObject({
      bookId: 'book-signal-arc',
      profile: expect.objectContaining({
        exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
        kind: 'review_packet',
      }),
      selectedChapterId: 'chapter-open-water-signals',
      packageSummary: {
        includedSections: [
          'Manuscript body',
          'Chapter summaries',
          'Scene headings',
          'Trace appendix',
          'Compare summary',
          'Readiness checklist',
        ],
        excludedSections: [],
        estimatedPackageLabel: expect.any(String),
      },
    })
  })

  it('returns a real error and null export workspace when the export profile does not exist', async () => {
    const hook = renderHook(
      () =>
        useBookExportPreviewQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createDraftWorkspace(),
            compareWorkspace: createCompareWorkspace(),
            exportProfileId: 'export-missing',
          },
          {
            bookClient: createBookClient(),
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.exportWorkspace).toBeNull()
    expect(hook.result.current.selectedExportProfile).toBeNull()
    expect(hook.result.current.error).toBeInstanceOf(Error)
    expect(hook.result.current.error?.message).toContain('export-missing')
    expect(hook.result.current.exportProfiles).toHaveLength(3)
  })

  it('returns undefined export workspace while the current draft workspace is still undefined', async () => {
    const hook = renderHook(
      () =>
        useBookExportPreviewQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: undefined,
            compareWorkspace: undefined,
            exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
          },
          {
            bookClient: createBookClient(),
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    expect(hook.result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(hook.result.current.selectedExportProfile?.exportProfileId).toBe(DEFAULT_BOOK_EXPORT_PROFILE_ID)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.exportWorkspace).toBeUndefined()
  })

  it('returns null workspace instead of crashing when the current draft workspace is null', async () => {
    const hook = renderHook(
      () =>
        useBookExportPreviewQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: null,
            compareWorkspace: createCompareWorkspace(),
            exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
          },
          {
            bookClient: createBookClient(),
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.selectedExportProfile?.exportProfileId).toBe(DEFAULT_BOOK_EXPORT_PROFILE_ID)
    expect(hook.result.current.exportWorkspace).toBeNull()
  })

  it('stays dormant when disabled and does not fetch export profile data', async () => {
    const tracked = createTrackedBookClient()

    const hook = renderHook(
      () =>
        useBookExportPreviewQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createDraftWorkspace(),
            compareWorkspace: createCompareWorkspace(),
            exportProfileId: DEFAULT_BOOK_EXPORT_PROFILE_ID,
            enabled: false,
          },
          {
            bookClient: tracked.client,
          },
        ),
      {
        wrapper: createWrapper(),
      },
    )

    expect(hook.result.current.isLoading).toBe(false)
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.exportProfiles).toBeUndefined()
    expect(hook.result.current.selectedExportProfile).toBeUndefined()
    expect(hook.result.current.exportWorkspace).toBeUndefined()
    expect(tracked.calls.list).toBe(0)
    expect(tracked.calls.item).toBe(0)
  })
})
