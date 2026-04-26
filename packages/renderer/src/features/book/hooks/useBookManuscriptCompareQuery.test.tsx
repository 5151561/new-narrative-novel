import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'

import {
  DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
  mockBookManuscriptCheckpointSeeds,
  type BookManuscriptCheckpointRecord,
} from '../api/book-manuscript-checkpoints'
import type { BookClient } from '../api/book-client'
import { bookQueryKeys } from './book-query-keys'
import { useBookManuscriptCompareQuery } from './useBookManuscriptCompareQuery'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'

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

function createWorkspace(): BookDraftWorkspaceViewModel {
  const workspace: BookDraftWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Current draft workspace',
    selectedChapterId: 'chapter-signals-in-rain',
    assembledWordCount: 900,
    draftedChapterCount: 2,
    missingDraftChapterCount: 1,
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 2,
        missingDraftChapterCount: 1,
        assembledWordCount: 900,
        warningHeavyChapterCount: 1,
        missingTraceChapterCount: 1,
      },
      signals: {
        topMissingScenes: [],
        latestDiffSummaries: [],
        traceCoverageNote: 'Trace note',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 1,
      missingTraceChapterCount: 1,
      warningsChapterCount: 1,
      queuedRevisionChapterCount: 0,
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
        summary: 'Signals summary',
        sceneCount: 2,
        draftedSceneCount: 1,
        missingDraftCount: 1,
        assembledWordCount: 420,
        warningsCount: 1,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 1,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-midnight-platform',
            order: 1,
            title: 'Midnight Platform',
            summary: 'Platform summary',
            proseDraft: 'Current midnight platform draft.',
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
            warningsCount: 1,
            revisionQueueCount: 0,
            traceReady: false,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
          },
        ],
      },
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Open water summary',
        sceneCount: 1,
        draftedSceneCount: 1,
        missingDraftCount: 0,
        assembledWordCount: 480,
        warningsCount: 0,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 0,
        assembledProseSections: [],
        coverageStatus: 'ready',
        sections: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Bridge summary',
            proseDraft: 'Current warehouse bridge draft.',
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
    ],
  }

  workspace.selectedChapter = workspace.chapters[0]!

  return workspace
}

function createBookClient(
  checkpointSeeds: BookManuscriptCheckpointRecord[] = mockBookManuscriptCheckpointSeeds['book-signal-arc'],
): Pick<BookClient, 'getBookManuscriptCheckpoints' | 'getBookManuscriptCheckpoint'> {
  return {
    async getBookManuscriptCheckpoints() {
      return structuredClone(checkpointSeeds)
    },
    async getBookManuscriptCheckpoint({ checkpointId }) {
      return structuredClone(checkpointSeeds.find((item) => item.checkpointId === checkpointId) ?? null)
    },
  }
}

describe('useBookManuscriptCompareQuery', () => {
  it('uses dedicated checkpoint query keys', () => {
    expect(bookQueryKeys.checkpoints('book-signal-arc', 'en')).toEqual([
      'book',
      'checkpoints',
      'book-signal-arc',
      'en',
    ])
    expect(bookQueryKeys.checkpoint('book-signal-arc', DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID, 'en')).toEqual([
      'book',
      'checkpoint',
      'book-signal-arc',
      DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      'en',
    ])
  })

  it('uses the default checkpoint id and keeps compare selection aligned with the route-owned selected chapter', async () => {
    const hook = renderHook(
      () =>
        useBookManuscriptCompareQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createWorkspace(),
            checkpointId: undefined,
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
    expect(hook.result.current.checkpoints).toHaveLength(1)
    expect(hook.result.current.selectedCheckpoint?.checkpointId).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
    expect(hook.result.current.compareWorkspace).toMatchObject({
      bookId: 'book-signal-arc',
      selectedChapterId: 'chapter-signals-in-rain',
      selectedChapter: expect.objectContaining({
        chapterId: 'chapter-signals-in-rain',
      }),
      checkpoint: expect.objectContaining({
        checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
      }),
    })
  })

  it('keeps compare identities canonical when chapter and scene display titles drift', async () => {
    const workspace = createWorkspace()
    workspace.selectedChapterId = 'chapter-open-water-signals'
    workspace.chapters[1] = {
      ...workspace.chapters[1]!,
      title: 'Open Water Signals (Current Draft)',
      sections: workspace.chapters[1]!.sections.map((section) =>
        section.sceneId === 'scene-warehouse-bridge'
          ? {
              ...section,
              title: 'Bridge Relay',
              summary: 'Current relay summary',
            }
          : section,
      ),
    }
    workspace.selectedChapter = workspace.chapters[1]!

    const hook = renderHook(
      () =>
        useBookManuscriptCompareQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: workspace,
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
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

    const openWaterChapter = hook.result.current.compareWorkspace?.chapters.find(
      (chapter) => chapter.chapterId === 'chapter-open-water-signals',
    )

    expect(hook.result.current.compareWorkspace?.selectedChapterId).toBe('chapter-open-water-signals')
    expect(openWaterChapter?.chapterId).toBe('chapter-open-water-signals')
    expect(openWaterChapter?.scenes.map((scene) => [scene.sceneId, scene.delta])).toEqual([
      ['scene-warehouse-bridge', 'changed'],
      ['scene-canal-watch', 'missing'],
      ['scene-river-ledger', 'missing'],
    ])
    expect(openWaterChapter?.scenes[0]).toMatchObject({
      sceneId: 'scene-warehouse-bridge',
      title: 'Bridge Relay',
      delta: 'changed',
      currentScene: expect.objectContaining({
        sceneId: 'scene-warehouse-bridge',
        title: 'Bridge Relay',
      }),
      checkpointScene: expect.objectContaining({
        sceneId: 'scene-warehouse-bridge',
        title: 'Warehouse Bridge',
      }),
    })
  })

  it('returns a real error and null compare workspace when the checkpoint does not exist', async () => {
    const hook = renderHook(
      () =>
        useBookManuscriptCompareQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: createWorkspace(),
            checkpointId: 'checkpoint-missing',
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

    expect(hook.result.current.compareWorkspace).toBeNull()
    expect(hook.result.current.selectedCheckpoint).toBeNull()
    expect(hook.result.current.error).toBeInstanceOf(Error)
    expect(hook.result.current.error?.message).toContain('checkpoint-missing')
    expect(hook.result.current.checkpoints).toHaveLength(1)
  })

  it('stays dormant without emitting a spurious error while the current draft workspace is still undefined', async () => {
    const hook = renderHook(
      () =>
        useBookManuscriptCompareQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace: undefined,
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
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
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.selectedCheckpoint).toBeUndefined()
    expect(hook.result.current.compareWorkspace).toBeUndefined()
  })

  it('clears loaded checkpoint metadata when rerendering from a loaded compare slice into a dormant slice', async () => {
    const hook = renderHook(
      ({ currentDraftWorkspace }) =>
        useBookManuscriptCompareQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace,
            checkpointId: DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
          },
          {
            bookClient: createBookClient(),
          },
        ),
      {
        initialProps: { currentDraftWorkspace: createWorkspace() as BookDraftWorkspaceViewModel | undefined },
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.selectedCheckpoint?.checkpointId).toBe(DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)
    })

    hook.rerender({ currentDraftWorkspace: undefined })

    expect(hook.result.current.isLoading).toBe(true)
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.checkpoints).toBeUndefined()
    expect(hook.result.current.selectedCheckpoint).toBeUndefined()
    expect(hook.result.current.compareWorkspace).toBeUndefined()
  })

  it('clears missing-checkpoint errors when rerendering from a failed compare slice into a dormant slice', async () => {
    const hook = renderHook(
      ({ currentDraftWorkspace }) =>
        useBookManuscriptCompareQuery(
          {
            bookId: 'book-signal-arc',
            currentDraftWorkspace,
            checkpointId: 'checkpoint-missing',
          },
          {
            bookClient: createBookClient(),
          },
        ),
      {
        initialProps: { currentDraftWorkspace: createWorkspace() as BookDraftWorkspaceViewModel | undefined },
        wrapper: createWrapper(),
      },
    )

    await waitFor(() => {
      expect(hook.result.current.error?.message).toContain('checkpoint-missing')
    })

    hook.rerender({ currentDraftWorkspace: undefined })

    expect(hook.result.current.isLoading).toBe(true)
    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.checkpoints).toBeUndefined()
    expect(hook.result.current.selectedCheckpoint).toBeUndefined()
    expect(hook.result.current.compareWorkspace).toBeUndefined()
  })
})
