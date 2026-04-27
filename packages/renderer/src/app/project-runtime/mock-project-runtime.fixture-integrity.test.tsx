import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import {
  getSignalArcCanonicalSceneIdsForChapter,
  isSignalArcCanonicalSceneId,
  signalArcChapterIds,
  signalArcMockOnlyPreviewSceneIds,
} from '@narrative-novel/fixture-seed'

import { I18nProvider } from '@/app/i18n'
import { ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { createChapterClient } from '@/features/chapter/api/chapter-client'
import { createSceneClient } from '@/features/scene/api/scene-client'
import { useBookDraftWorkspaceQuery } from '@/features/book/hooks/useBookDraftWorkspaceQuery'

function createMockPersistence() {
  return {
    async loadProjectSnapshot() {
      return null
    },
    async saveProjectSnapshot() {},
    async clearProjectSnapshot() {},
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  const runtime = createMockProjectRuntime({
    persistence: createMockPersistence(),
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <ProjectRuntimeProvider runtime={runtime}>{children}</ProjectRuntimeProvider>
        </I18nProvider>
      </QueryClientProvider>
    )
  }
}

describe('mock project runtime fixture integrity', () => {
  it('keeps the canonical book fixture chapter ids reachable from the mock runtime', async () => {
    const runtime = createMockProjectRuntime({
      persistence: createMockPersistence(),
    })

    const book = await runtime.bookClient.getBookStructureRecord({ bookId: 'book-signal-arc' })

    expect(book?.chapterIds).toEqual(signalArcChapterIds)
  })

  it('keeps the canonical chapter scene ids reachable from mock chapter and scene clients', async () => {
    const chapterClient = createChapterClient()
    const sceneClient = createSceneClient()

    for (const chapterId of signalArcChapterIds) {
      const chapter = await chapterClient.getChapterStructureWorkspace({ chapterId })
      expect(chapter).not.toBeNull()

      const sceneIds = chapter?.scenes.map((scene) => scene.id) ?? []
      const expectedCanonicalSceneIds = getSignalArcCanonicalSceneIdsForChapter(chapterId)
      expect(sceneIds.slice(0, expectedCanonicalSceneIds.length)).toEqual(expectedCanonicalSceneIds)

      for (const sceneId of expectedCanonicalSceneIds) {
        expect(sceneIds).toContain(sceneId)
        await expect(sceneClient.getSceneWorkspace(sceneId)).resolves.toMatchObject({ id: sceneId })
      }
    }
  })

  it('keeps mock-only preview extras explicit and outside the canonical scene seed', async () => {
    const chapterClient = createChapterClient()
    const sceneClient = createSceneClient()

    const chapter = await chapterClient.getChapterStructureWorkspace({ chapterId: 'chapter-open-water-signals' })
    expect(chapter).not.toBeNull()

    const mockOnlyPreviewSceneIds = (chapter?.scenes.map((scene) => scene.id) ?? []).filter(
      (sceneId) => !isSignalArcCanonicalSceneId(sceneId),
    )

    expect(mockOnlyPreviewSceneIds).toEqual(signalArcMockOnlyPreviewSceneIds)

    for (const sceneId of signalArcMockOnlyPreviewSceneIds) {
      expect(isSignalArcCanonicalSceneId(sceneId)).toBe(false)
      await expect(sceneClient.getSceneWorkspace(sceneId)).resolves.toMatchObject({ id: sceneId })
    }
  })

  it('supports the legacy draft fallback path with explicit gaps instead of missing-object crashes', async () => {
    const runtime = createMockProjectRuntime({
      persistence: createMockPersistence(),
    })

    const hook = renderHook(
      () =>
        useBookDraftWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            selectedChapterId: 'chapter-open-water-signals',
          },
          {
            bookClient: runtime.bookClient,
            chapterClient: runtime.chapterClient,
            sceneClient: runtime.sceneClient,
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
    expect(hook.result.current.workspace?.chapters.map((chapter) => chapter.chapterId)).toEqual(signalArcChapterIds)
    const selectedChapterSections = hook.result.current.workspace?.selectedChapter?.sections ?? []
    const fallbackGapRow = selectedChapterSections.find((section) => section.sceneId === 'scene-warehouse-bridge')

    expect(selectedChapterSections.some((section) => section.sceneId === 'scene-warehouse-bridge')).toBe(true)
    expect(fallbackGapRow).toMatchObject({
      isMissingDraft: true,
      proseDraft: undefined,
      sceneId: 'scene-warehouse-bridge',
    })
    expect(fallbackGapRow?.latestDiffSummary).toEqual(expect.any(String))
  })
})
