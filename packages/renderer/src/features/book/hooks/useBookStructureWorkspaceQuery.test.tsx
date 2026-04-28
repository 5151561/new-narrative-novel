import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useEffect, type PropsWithChildren } from 'react'
import { afterEach, describe, expect, it } from 'vitest'

import { APP_LOCALE_STORAGE_KEY, I18nProvider, type Locale, useI18n } from '@/app/i18n'
import { ApiRequestError, ProjectRuntimeProvider, createMockProjectRuntime } from '@/app/project-runtime'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import { mockBookRecordSeeds } from '../api/mock-book-db'

import { bookQueryKeys } from './book-query-keys'
import { useBookStructureWorkspaceQuery } from './useBookStructureWorkspaceQuery'

afterEach(() => {
  window.localStorage.clear()
})

function wrapperFactory() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  const runtime = createMockProjectRuntime({
    persistence: {
      async loadProjectSnapshot() {
        return null
      },
      async saveProjectSnapshot() {},
      async clearProjectSnapshot() {},
    },
  })
  let setLocaleRef: ((locale: Locale) => void) | undefined

  function LocaleControl() {
    const { setLocale } = useI18n()

    useEffect(() => {
      setLocaleRef = setLocale
    }, [setLocale])

    return null
  }

  return {
    wrapper: function Wrapper({ children }: PropsWithChildren) {
      return (
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <ProjectRuntimeProvider runtime={runtime}>
              <LocaleControl />
              {children}
            </ProjectRuntimeProvider>
          </I18nProvider>
        </QueryClientProvider>
      )
    },
    setLocale(nextLocale: Locale) {
      act(() => {
        setLocaleRef?.(nextLocale)
      })
    },
  }
}

describe('useBookStructureWorkspaceQuery', () => {
  it('uses book id and locale for the workspace query key', () => {
    expect(bookQueryKeys.workspace('book-signal-arc', 'en')).toEqual(['book', 'workspace', 'book-signal-arc', 'en'])
  })

  it('hydrates the book structure workspace with chapter rollups, inspector data, and dock summary', async () => {
    const { wrapper } = wrapperFactory()

    const hook = renderHook(
      () =>
        useBookStructureWorkspaceQuery({
          bookId: 'book-signal-arc',
          selectedChapterId: 'chapter-missing',
        }),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.workspace).toMatchObject({
      bookId: 'book-signal-arc',
      title: 'Signal Arc',
      selectedChapterId: 'chapter-signals-in-rain',
      selectedChapter: expect.objectContaining({
        chapterId: 'chapter-signals-in-rain',
        title: 'Signals in Rain',
      }),
      chapters: [
        expect.objectContaining({
          chapterId: 'chapter-signals-in-rain',
          order: 1,
          coverageStatus: 'attention',
        }),
        expect.objectContaining({
          chapterId: 'chapter-open-water-signals',
          order: 2,
        }),
      ],
      totals: expect.objectContaining({
        chapterCount: 2,
        sceneCount: 7,
      }),
      inspector: expect.objectContaining({
        selectedChapter: expect.objectContaining({
          chapterId: 'chapter-signals-in-rain',
        }),
        riskHighlights: expect.arrayContaining([
          expect.objectContaining({
            chapterId: 'chapter-signals-in-rain',
            kind: 'problem',
          }),
        ]),
      }),
      dockSummary: expect.objectContaining({
        unresolvedCount: 12,
        missingDraftCount: 1,
        missingTraceSceneCount: 4,
        problemItems: expect.arrayContaining([
          expect.objectContaining({
            chapterId: 'chapter-signals-in-rain',
          }),
        ]),
      }),
    })
  })

  it('re-localizes the aggregated workspace while keeping the same book identity and selected chapter fallback', async () => {
    const { wrapper, setLocale } = wrapperFactory()

    const hook = renderHook(
      () =>
        useBookStructureWorkspaceQuery({
          bookId: 'book-signal-arc',
          selectedChapterId: null,
        }),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.workspace?.title).toBe('Signal Arc')
    })

    act(() => {
      window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'zh-CN')
    })
    setLocale('zh-CN')

    await waitFor(() => {
    expect(hook.result.current.workspace?.title).toBe('信号弧线')
    })

    expect(hook.result.current.workspace).toMatchObject({
      selectedChapterId: 'chapter-signals-in-rain',
      selectedChapter: expect.objectContaining({
        title: '雨中信号',
      }),
    })
  })

  it('starts from the default English locale in the next test', async () => {
    const { wrapper } = wrapperFactory()

    const hook = renderHook(
      () =>
        useBookStructureWorkspaceQuery({
          bookId: 'book-signal-arc',
          selectedChapterId: null,
        }),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.workspace?.title).toBe('Signal Arc')
    })

    expect(hook.result.current.workspace).toMatchObject({
      selectedChapter: expect.objectContaining({
        title: 'Signals in Rain',
      }),
    })
  })

  it('surfaces a data error when the book references a chapter workspace that resolves null', async () => {
    const { wrapper } = wrapperFactory()

    const hook = renderHook(
      () =>
        useBookStructureWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            selectedChapterId: 'chapter-open-water-signals',
          },
          {
            bookClient: {
              async getBookStructureRecord() {
                return structuredClone(mockBookRecordSeeds['book-signal-arc'])
              },
            },
            chapterClient: {
              async getChapterStructureWorkspace({ chapterId }) {
                if (chapterId === 'chapter-open-water-signals') {
                  return null
                }

                return {
                  chapterId: 'chapter-signals-in-rain',
                  title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
                  summary: {
                    en: 'Re-cut the same chapter through order, density, and assembly pressure without leaving the workbench.',
                    'zh-CN': '在同一章节里重切顺序、密度和装配压力，不离开工作台。',
                  },
                  scenes: [],
                  inspector: {
                    chapterNotes: [],
                    problemsSummary: [],
                    assemblyHints: [],
                  },
                  viewsMeta: {
                    availableViews: ['sequence', 'outliner', 'assembly'],
                  },
                }
              },
            },
          },
        ),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.workspace).toBeUndefined()
    expect(hook.result.current.error).toBeInstanceOf(Error)
    expect(hook.result.current.error?.message).toContain('chapter-open-water-signals')
  })

  it('keeps the book structure workspace available when one scene prose path is explicitly missing', async () => {
    const { wrapper } = wrapperFactory()

    const hook = renderHook(
      () =>
        useBookStructureWorkspaceQuery(
          {
            bookId: 'book-signal-arc',
            selectedChapterId: 'chapter-signals-in-rain',
          },
          {
            bookClient: {
              async getBookStructureRecord() {
                return structuredClone(mockBookRecordSeeds['book-signal-arc'])
              },
            },
            chapterClient: {
              async getChapterStructureWorkspace({ chapterId }) {
                return structuredClone(mockChapterRecordSeeds[chapterId])
              },
            },
            sceneClient: {
              async getSceneProse(sceneId) {
                if (sceneId === 'scene-concourse-delay') {
                  throw new ApiRequestError({
                    status: 404,
                    code: 'SCENE_NOT_FOUND',
                    message: `Scene ${sceneId} was not found.`,
                    detail: { sceneId },
                  })
                }

                const runtime = createMockProjectRuntime()
                return runtime.sceneClient.getSceneProse(sceneId)
              },
            },
            traceabilitySceneClient: {
              async getSceneExecution(sceneId) {
                if (sceneId === 'scene-concourse-delay') {
                  throw new ApiRequestError({
                    status: 404,
                    code: 'SCENE_NOT_FOUND',
                    message: `Scene ${sceneId} was not found.`,
                    detail: { sceneId },
                  })
                }

                const runtime = createMockProjectRuntime()
                return runtime.traceabilitySceneClient.getSceneExecution(sceneId)
              },
              async getSceneProse(sceneId) {
                if (sceneId === 'scene-concourse-delay') {
                  throw new ApiRequestError({
                    status: 404,
                    code: 'SCENE_NOT_FOUND',
                    message: `Scene ${sceneId} was not found.`,
                    detail: { sceneId },
                  })
                }

                const runtime = createMockProjectRuntime()
                return runtime.traceabilitySceneClient.getSceneProse(sceneId)
              },
              async getSceneInspector(sceneId) {
                if (sceneId === 'scene-concourse-delay') {
                  throw new ApiRequestError({
                    status: 404,
                    code: 'SCENE_NOT_FOUND',
                    message: `Scene ${sceneId} was not found.`,
                    detail: { sceneId },
                  })
                }

                const runtime = createMockProjectRuntime()
                return runtime.traceabilitySceneClient.getSceneInspector(sceneId)
              },
              async previewAcceptedPatch(sceneId) {
                if (sceneId === 'scene-concourse-delay') {
                  throw new ApiRequestError({
                    status: 404,
                    code: 'SCENE_NOT_FOUND',
                    message: `Scene ${sceneId} was not found.`,
                    detail: { sceneId },
                  })
                }

                const runtime = createMockProjectRuntime()
                return runtime.traceabilitySceneClient.previewAcceptedPatch(sceneId)
              },
            },
          },
        ),
      {
        wrapper,
      },
    )

    await waitFor(() => {
      expect(hook.result.current.isLoading).toBe(false)
    })

    expect(hook.result.current.error).toBeNull()
    expect(hook.result.current.workspace).toMatchObject({
      bookId: 'book-signal-arc',
      selectedChapterId: 'chapter-signals-in-rain',
      chapters: [
        expect.objectContaining({
          chapterId: 'chapter-signals-in-rain',
          missingDraftCount: 1,
          tracedSceneCount: 2,
          missingTraceSceneCount: 2,
        }),
        expect.objectContaining({
          chapterId: 'chapter-open-water-signals',
          missingDraftCount: 1,
          tracedSceneCount: 0,
          missingTraceSceneCount: 3,
        }),
      ],
      totals: expect.objectContaining({
        missingDraftCount: 2,
        missingTraceSceneCount: 5,
      }),
    })
  })
})
