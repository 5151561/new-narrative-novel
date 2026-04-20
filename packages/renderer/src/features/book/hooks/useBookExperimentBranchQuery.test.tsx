import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'

import {
  DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
  mockBookManuscriptCheckpointSeeds,
  type BookManuscriptCheckpointRecord,
} from '../api/book-manuscript-checkpoints'
import {
  mockBookExperimentBranchSeeds,
  type BookExperimentBranchRecord,
} from '../api/book-experiment-branches'
import type { BookClient } from '../api/book-client'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import { bookQueryKeys } from './book-query-keys'
import { useBookExperimentBranchQuery } from './useBookExperimentBranchQuery'

const DEFAULT_BOOK_EXPERIMENT_BRANCH_ID = 'branch-book-signal-arc-quiet-ending'

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

function createWorkspace(selectedChapterId = 'chapter-open-water-signals'): BookDraftWorkspaceViewModel {
  const workspace: BookDraftWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Current draft workspace',
    selectedChapterId,
    assembledWordCount: 116,
    draftedChapterCount: 2,
    missingDraftChapterCount: 0,
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 2,
        missingDraftChapterCount: 0,
        assembledWordCount: 116,
        warningHeavyChapterCount: 2,
        missingTraceChapterCount: 1,
      },
      signals: {
        topMissingScenes: [],
        latestDiffSummaries: ['Warehouse handoff tightened'],
        traceCoverageNote: 'Current trace coverage is uneven in the handoff chapter.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 0,
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
        chapterId: 'chapter-signals-in-rain',
        order: 1,
        title: 'Signals in Rain',
        summary: 'Station pressure chapter',
        sceneCount: 3,
        draftedSceneCount: 3,
        missingDraftCount: 0,
        assembledWordCount: 61,
        warningsCount: 1,
        queuedRevisionCount: 0,
        tracedSceneCount: 3,
        missingTraceSceneCount: 0,
        assembledProseSections: [],
        coverageStatus: 'ready',
        sections: [
          {
            sceneId: 'scene-midnight-platform',
            order: 1,
            title: 'Midnight Platform',
            summary: 'Public bargaining at the platform edge.',
            proseDraft: 'Ren keeps the ledger in sight while Mei bargains in the rain and counts who is listening.',
            draftWordCount: 16,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 2,
            sourceProposalCount: 2,
          },
          {
            sceneId: 'scene-concourse-delay',
            order: 2,
            title: 'Concourse Delay',
            summary: 'Crowd pressure delays the exit.',
            proseDraft: 'The crowd slows the courier lane long enough for Mei to hide one last instruction inside the delay.',
            draftWordCount: 17,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-departure-bell',
            order: 3,
            title: 'Departure Bell',
            summary: 'The bell lands as a drafted exit beat.',
            proseDraft: 'The departure bell closes the platform scene with a clear drafted release instead of a placeholder.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 0,
            sourceProposalCount: 1,
          },
        ],
      },
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Waterfront handoff chapter',
        sceneCount: 3,
        draftedSceneCount: 3,
        missingDraftCount: 0,
        assembledWordCount: 55,
        warningsCount: 1,
        queuedRevisionCount: 1,
        tracedSceneCount: 2,
        missingTraceSceneCount: 1,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'The first handoff happens at the warehouse bridge.',
            proseDraft: 'Leya keeps the package moving and leaves the bridge before the owner can force a full confession.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 1,
            traceReady: false,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-canal-watch',
            order: 2,
            title: 'Canal Watch',
            summary: 'The watcher keeps the exchange visible.',
            proseDraft: 'The canal watcher tracks the package handoff and keeps the escape route exposed to everyone on the bridge.',
            draftWordCount: 17,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-dawn-slip',
            order: 3,
            title: 'Dawn Slip',
            summary: 'A quiet withdrawal before sunrise.',
            proseDraft: 'At dawn the crew clears the channel and hides the package trail before the harbor shifts awake.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: false,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
          },
        ],
      },
    ],
  }

  workspace.selectedChapter = workspace.chapters.find((chapter) => chapter.chapterId === selectedChapterId) ?? workspace.chapters[0]!

  return workspace
}

function createBookClient({
  branches = mockBookExperimentBranchSeeds['book-signal-arc'],
  checkpoints = mockBookManuscriptCheckpointSeeds['book-signal-arc'],
}: {
  branches?: BookExperimentBranchRecord[]
  checkpoints?: BookManuscriptCheckpointRecord[]
} = {}): Pick<BookClient, 'getBookExperimentBranches' | 'getBookExperimentBranch' | 'getBookManuscriptCheckpoint'> {
  return {
    async getBookExperimentBranches() {
      return structuredClone(branches)
    },
    async getBookExperimentBranch({ branchId }) {
      return structuredClone(branches.find((item) => item.branchId === branchId) ?? null)
    },
    async getBookManuscriptCheckpoint({ checkpointId }) {
      return structuredClone(checkpoints.find((item) => item.checkpointId === checkpointId) ?? null)
    },
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve
  })

  return { promise, resolve }
}

describe('useBookExperimentBranchQuery', () => {
  it('uses dedicated branch query keys', () => {
    expect(bookQueryKeys.branches('book-signal-arc', 'en')).toEqual(['book', 'branches', 'book-signal-arc', 'en'])
    expect(bookQueryKeys.branch('book-signal-arc', DEFAULT_BOOK_EXPERIMENT_BRANCH_ID, 'en')).toEqual([
      'book',
      'branch',
      'book-signal-arc',
      DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
      'en',
    ])
  })

  it('reads the branch list, falls back to the default branch id, and keeps the selected chapter aligned with the current workspace', async () => {
    const hook = renderHook(
      () =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createWorkspace('chapter-open-water-signals'),
            branchId: undefined,
            branchBaseline: 'current',
            checkpointId: undefined,
          },
          {
            bookClient: createBookClient(),
          },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.branches).toHaveLength(2)
    expect(hook.result.current.selectedBranch?.branchId).toBe(DEFAULT_BOOK_EXPERIMENT_BRANCH_ID)
    expect(hook.result.current.branchWorkspace).toMatchObject({
      branch: expect.objectContaining({ branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID }),
      baseline: expect.objectContaining({ kind: 'current' }),
      selectedChapterId: 'chapter-open-water-signals',
      selectedChapter: expect.objectContaining({
        chapterId: 'chapter-open-water-signals',
      }),
    })
  })

  it('only reads checkpoint data when the branch baseline is checkpoint', async () => {
    const currentBaselineClient = createBookClient()
    const currentCheckpointSpy = vi.spyOn(currentBaselineClient, 'getBookManuscriptCheckpoint')

    const currentHook = renderHook(
      () =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createWorkspace(),
            branchId: 'branch-book-signal-arc-high-pressure',
            branchBaseline: 'current',
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
          },
          { bookClient: currentBaselineClient },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(currentHook.result.current.isLoading).toBe(false)
    })

    expect(currentHook.result.current.branchWorkspace?.baseline.kind).toBe('current')
    expect(currentCheckpointSpy).not.toHaveBeenCalled()

    const checkpointBaselineClient = createBookClient()
    const checkpointSpy = vi.spyOn(checkpointBaselineClient, 'getBookManuscriptCheckpoint')

    const checkpointHook = renderHook(
      () =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createWorkspace(),
            branchId: 'branch-book-signal-arc-high-pressure',
            branchBaseline: 'checkpoint',
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
          },
          { bookClient: checkpointBaselineClient },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(checkpointHook.result.current.isLoading).toBe(false)
    })

    expect(checkpointSpy).toHaveBeenCalledWith({
      bookId: 'book-signal-arc',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
    })
    expect(checkpointHook.result.current.branchWorkspace?.baseline).toMatchObject({
      kind: 'checkpoint',
      checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
    })
  })

  it('surfaces a clear error and null workspace when the selected branch does not exist', async () => {
    const hook = renderHook(
      () =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createWorkspace(),
            branchId: 'branch-missing',
            branchBaseline: 'current',
            checkpointId: undefined,
          },
          { bookClient: createBookClient() },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.branchWorkspace).toBeNull()
    expect(hook.result.current.selectedBranch).toBeNull()
    expect(hook.result.current.error).toBeInstanceOf(Error)
    expect(hook.result.current.error?.message).toContain('branch-missing')
  })

  it('does not build a branch workspace when the branch list query fails, and surfaces the list error', async () => {
    const bookClient: Pick<BookClient, 'getBookExperimentBranches' | 'getBookExperimentBranch' | 'getBookManuscriptCheckpoint'> = {
      async getBookExperimentBranches() {
        throw new Error('Branch list failed')
      },
      async getBookExperimentBranch({ branchId }) {
        return structuredClone(
          mockBookExperimentBranchSeeds['book-signal-arc']!.find((item) => item.branchId === branchId) ?? null,
        )
      },
      async getBookManuscriptCheckpoint({ checkpointId }) {
        return structuredClone(
          mockBookManuscriptCheckpointSeeds['book-signal-arc']!.find((item) => item.checkpointId === checkpointId) ?? null,
        )
      },
    }

    const hook = renderHook(
      () =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createWorkspace(),
            branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
            branchBaseline: 'current',
            checkpointId: undefined,
          },
          { bookClient },
        ),
      { wrapper: createWrapper() },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.branchWorkspace).toBeUndefined()
    expect(hook.result.current.error).toBeInstanceOf(Error)
    expect(hook.result.current.error?.message).toBe('Branch list failed')
  })

  it('stays dormant without emitting an error while the current draft workspace is still loading', async () => {
    const hook = renderHook(
      () =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: undefined,
            branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
            branchBaseline: 'checkpoint',
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
          },
          { bookClient: createBookClient() },
        ),
      { wrapper: createWrapper() },
    )

    expect(hook.result.current.branches).toBeUndefined()
    expect(hook.result.current.selectedBranch).toBeUndefined()
    expect(hook.result.current.branchWorkspace).toBeUndefined()
    expect(hook.result.current.isLoading).toBe(true)
    expect(hook.result.current.error).toBeNull()
  })

  it('clears loaded branch metadata when rerendering from a loaded branch slice into a dormant slice', async () => {
    const hook = renderHook(
      ({ currentDraftWorkspace }) =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace,
            branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
            branchBaseline: 'checkpoint',
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
          },
          { bookClient: createBookClient() },
        ),
      {
        initialProps: { currentDraftWorkspace: createWorkspace() as BookDraftWorkspaceViewModel | undefined },
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.selectedBranch?.branchId).toBe(DEFAULT_BOOK_EXPERIMENT_BRANCH_ID)
    })

    hook.rerender({ currentDraftWorkspace: undefined })

    expect(hook.result.current.isLoading).toBe(true)
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.branches).toBeUndefined()
    expect(hook.result.current.selectedBranch).toBeUndefined()
    expect(hook.result.current.branchWorkspace).toBeUndefined()
  })

  it('clears loaded branch metadata when rerendering from a loaded branch slice into a null dormant slice', async () => {
    const hook = renderHook(
      ({ currentDraftWorkspace }) =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace,
            branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
            branchBaseline: 'checkpoint',
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
          },
          { bookClient: createBookClient() },
        ),
      {
        initialProps: { currentDraftWorkspace: createWorkspace() as BookDraftWorkspaceViewModel | null },
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.selectedBranch?.branchId).toBe(DEFAULT_BOOK_EXPERIMENT_BRANCH_ID)
    })

    hook.rerender({ currentDraftWorkspace: null })

    expect(hook.result.current.isLoading).toBe(false)
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.branches).toBeUndefined()
    expect(hook.result.current.selectedBranch).toBeUndefined()
    expect(hook.result.current.branchWorkspace).toBeUndefined()
  })

  it('clears missing-branch errors when rerendering from a failed branch slice into a dormant slice', async () => {
    const hook = renderHook(
      ({ currentDraftWorkspace }) =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace,
            branchId: 'branch-missing',
            branchBaseline: 'current',
            checkpointId: undefined,
          },
          { bookClient: createBookClient() },
        ),
      {
        initialProps: { currentDraftWorkspace: createWorkspace() as BookDraftWorkspaceViewModel | undefined },
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.error?.message).toContain('branch-missing')
    })

    hook.rerender({ currentDraftWorkspace: undefined })

    expect(hook.result.current.isLoading).toBe(true)
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.branches).toBeUndefined()
    expect(hook.result.current.selectedBranch).toBeUndefined()
    expect(hook.result.current.branchWorkspace).toBeUndefined()
  })

  it('clears missing-branch errors when rerendering from a failed branch slice into a null dormant slice', async () => {
    const hook = renderHook(
      ({ currentDraftWorkspace }) =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace,
            branchId: 'branch-missing',
            branchBaseline: 'current',
            checkpointId: undefined,
          },
          { bookClient: createBookClient() },
        ),
      {
        initialProps: { currentDraftWorkspace: createWorkspace() as BookDraftWorkspaceViewModel | null },
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.error?.message).toContain('branch-missing')
    })

    hook.rerender({ currentDraftWorkspace: null })

    expect(hook.result.current.isLoading).toBe(false)
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.branches).toBeUndefined()
    expect(hook.result.current.selectedBranch).toBeUndefined()
    expect(hook.result.current.branchWorkspace).toBeUndefined()
  })

  it('stays dormant when rerendered to null while branch queries are still in flight', async () => {
    const branches = createDeferred<BookExperimentBranchRecord[]>()
    const branch = createDeferred<BookExperimentBranchRecord | null>()
    const checkpoint = createDeferred<BookManuscriptCheckpointRecord | null>()
    const hook = renderHook(
      ({ currentDraftWorkspace }) =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace,
            branchId: DEFAULT_BOOK_EXPERIMENT_BRANCH_ID,
            branchBaseline: 'checkpoint',
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
          },
          {
            bookClient: {
              getBookExperimentBranches: () => branches.promise,
              getBookExperimentBranch: () => branch.promise,
              getBookManuscriptCheckpoint: () => checkpoint.promise,
            },
          },
        ),
      {
        initialProps: { currentDraftWorkspace: createWorkspace() as BookDraftWorkspaceViewModel | null },
        wrapper: createWrapper(),
      },
    )

    expect(hook.result.current.isLoading).toBe(true)

    hook.rerender({ currentDraftWorkspace: null })

    expect(hook.result.current.isLoading).toBe(false)
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.branches).toBeUndefined()
    expect(hook.result.current.selectedBranch).toBeUndefined()
    expect(hook.result.current.branchWorkspace).toBeUndefined()

    branches.resolve(mockBookExperimentBranchSeeds['book-signal-arc']!)
    branch.resolve(mockBookExperimentBranchSeeds['book-signal-arc']![0]!)
    checkpoint.resolve(mockBookManuscriptCheckpointSeeds['book-signal-arc']![0]!)
  })

  it('keeps selection synced when the route-owned selected chapter changes', async () => {
    const firstRender = renderHook(
      ({ selectedChapterId }) =>
        useBookExperimentBranchQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createWorkspace(selectedChapterId),
            branchId: 'branch-book-signal-arc-high-pressure',
            branchBaseline: 'current',
            checkpointId: undefined,
          },
          { bookClient: createBookClient() },
        ),
      {
        initialProps: { selectedChapterId: 'chapter-signals-in-rain' },
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(firstRender.result.current.isLoading).toBe(false)
    })

    expect(firstRender.result.current.branchWorkspace?.selectedChapterId).toBe('chapter-signals-in-rain')

    firstRender.rerender({ selectedChapterId: 'chapter-open-water-signals' })

    await waitFor(() => {
      expect(firstRender.result.current.branchWorkspace?.selectedChapterId).toBe('chapter-open-water-signals')
    })

    expect(firstRender.result.current.branchWorkspace?.selectedChapter?.chapterId).toBe('chapter-open-water-signals')
  })
})
