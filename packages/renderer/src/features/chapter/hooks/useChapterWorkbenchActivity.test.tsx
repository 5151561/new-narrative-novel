import { act, renderHook } from '@testing-library/react'
import { afterEach } from 'vitest'

import { useI18n } from '@/app/i18n'
import { AppProviders } from '@/app/providers'

import { useChapterWorkbenchActivity } from './useChapterWorkbenchActivity'

describe('useChapterWorkbenchActivity', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('dedupes repeated view and scene inputs and caps the recent log', () => {
    const { result, rerender } = renderHook(
      ({ chapterId, activeView, selectedScene }) =>
        useChapterWorkbenchActivity({
          chapterId,
          activeView,
          selectedScene,
          maxItems: 3,
        }),
      {
        initialProps: {
          chapterId: 'chapter-signals-in-rain',
          activeView: 'outliner' as const,
          selectedScene: {
            id: 'scene-midnight-platform',
            title: 'Midnight Platform',
            summary: 'Keep public witness pressure alive at the edge of the scene.',
          },
        },
        wrapper: AppProviders,
      },
    )

    expect(result.current.map((item) => item.id)).toEqual(['view-0', 'scene-1'])

    rerender({
      chapterId: 'chapter-signals-in-rain',
      activeView: 'outliner',
      selectedScene: {
        id: 'scene-midnight-platform',
        title: 'Midnight Platform',
        summary: 'Keep public witness pressure alive at the edge of the scene.',
      },
    })

    expect(result.current.map((item) => item.id)).toEqual(['view-0', 'scene-1'])

    rerender({
      chapterId: 'chapter-signals-in-rain',
      activeView: 'outliner',
      selectedScene: {
        id: 'scene-concourse-delay',
        title: 'Concourse Delay',
        summary: 'Hold witness pressure at the edge of the exit.',
      },
    })

    expect(result.current.map((item) => item.id)).toEqual(['scene-2', 'view-0', 'scene-1'])

    rerender({
      chapterId: 'chapter-signals-in-rain',
      activeView: 'assembly',
      selectedScene: {
        id: 'scene-concourse-delay',
        title: 'Concourse Delay',
        summary: 'Hold witness pressure at the edge of the exit.',
      },
    })

    expect(result.current.map((item) => item.id)).toEqual(['view-3', 'scene-2', 'view-0'])
  })

  it('re-localizes entries without appending duplicates and resets on chapter change', () => {
    const { result, rerender } = renderHook(
      ({ chapterId, activeView, selectedScene, latestMutation }) => {
        const activity = useChapterWorkbenchActivity({
          chapterId,
          activeView,
          selectedScene,
          latestMutation,
          maxItems: 4,
        })
        const { locale, setLocale } = useI18n()

        return { activity, locale, setLocale }
      },
      {
        initialProps: {
          chapterId: 'chapter-signals-in-rain',
          activeView: 'outliner' as const,
          selectedScene: {
            id: 'scene-midnight-platform',
            title: 'Midnight Platform',
            summary: 'Keep public witness pressure alive at the edge of the scene.',
          },
          latestMutation: null,
        },
        wrapper: AppProviders,
      },
    )

    expect(result.current.activity).toHaveLength(2)
    expect(result.current.activity[0]?.title).toBe('Entered Outliner')

    act(() => {
      result.current.setLocale('zh-CN')
    })

    rerender({
      chapterId: 'chapter-signals-in-rain',
      activeView: 'outliner',
        selectedScene: {
          id: 'scene-midnight-platform',
          title: '午夜站台',
          summary: '让公众目击压力继续停留在场景边缘。',
        },
        latestMutation: null,
      })

    expect(result.current.locale).toBe('zh-CN')
    expect(result.current.activity).toHaveLength(2)
    expect(result.current.activity[0]?.title).toBe('进入大纲')
    expect(result.current.activity[1]?.title).toBe('聚焦午夜站台')
    expect(result.current.activity[1]?.detail).toBe('让公众目击压力继续停留在场景边缘。')
    expect(result.current.activity[1]?.title).not.toContain('Midnight Platform')
    expect(result.current.activity[1]?.detail).not.toContain('Keep public witness pressure alive at the edge of the scene.')

    rerender({
      chapterId: 'chapter-other',
      activeView: 'assembly',
        selectedScene: {
          id: 'scene-ticket-window',
          title: 'Ticket Window',
          summary: 'Keep the alias offstage while the trade-off tightens.',
        },
        latestMutation: null,
      })

    expect(result.current.activity).toHaveLength(2)
    expect(result.current.activity.map((item) => item.id)).toEqual(['view-0', 'scene-1'])
    expect(result.current.activity[0]?.title).toBe('进入装配')
    expect(result.current.activity[1]?.title).toBe('聚焦Ticket Window')
  })

  it('records mutation activity alongside view and scene changes', () => {
    const { result, rerender } = renderHook(
      ({ latestMutation }) =>
        useChapterWorkbenchActivity({
          chapterId: 'chapter-signals-in-rain',
          activeView: 'outliner',
          selectedScene: {
            id: 'scene-concourse-delay',
            title: 'Concourse Delay',
            summary: 'Hold witness pressure at the edge of the exit.',
          },
          latestMutation,
          maxItems: 5,
        }),
      {
        initialProps: {
          latestMutation: null,
        },
        wrapper: AppProviders,
      },
    )

    expect(result.current.map((item) => item.kind)).toEqual(['view', 'scene'])

    rerender({
      latestMutation: {
        id: 'mutation-1',
        chapterId: 'chapter-signals-in-rain',
        action: 'moved-scene',
        sceneTitle: 'Ticket Window',
        direction: 'up' as const,
      },
    })

    expect(result.current[0]).toMatchObject({
      id: 'mutation-1',
      kind: 'mutation',
      title: 'Moved Ticket Window earlier',
    })

    rerender({
      latestMutation: {
        id: 'mutation-2',
        chapterId: 'chapter-signals-in-rain',
        action: 'updated-structure',
        sceneTitle: 'Concourse Delay',
      },
    })

    expect(result.current.slice(0, 2)).toEqual([
      expect.objectContaining({
        id: 'mutation-2',
        kind: 'mutation',
        title: 'Updated structure for Concourse Delay',
      }),
      expect.objectContaining({
        id: 'mutation-1',
        kind: 'mutation',
        title: 'Moved Ticket Window earlier',
      }),
    ])

    rerender({
      latestMutation: {
        id: 'mutation-3',
        chapterId: 'chapter-signals-in-rain',
        action: 'started-next-scene-run',
        sceneTitle: 'Concourse Delay',
      },
    })

    expect(result.current[0]).toMatchObject({
      id: 'mutation-3',
      kind: 'mutation',
      title: 'Started next scene run',
    })
  })

  it('ignores stale mutation events from another chapter', () => {
    const { result, rerender } = renderHook(
      ({ chapterId, latestMutation }) =>
        useChapterWorkbenchActivity({
          chapterId,
          activeView: 'outliner',
          selectedScene: {
            id: 'scene-concourse-delay',
            title: 'Concourse Delay',
            summary: 'Hold witness pressure at the edge of the exit.',
          },
          latestMutation,
          maxItems: 5,
        }),
      {
        initialProps: {
          chapterId: 'chapter-open-water-signals',
          latestMutation: {
            id: 'mutation-stale',
            chapterId: 'chapter-signals-in-rain',
            action: 'moved-scene' as const,
            sceneTitle: 'Ticket Window',
            direction: 'up' as const,
          },
        },
        wrapper: AppProviders,
      },
    )

    expect(result.current.map((item) => item.kind)).toEqual(['view', 'scene'])
    expect(result.current.some((item) => item.id === 'mutation-stale')).toBe(false)

    rerender({
      chapterId: 'chapter-open-water-signals',
      latestMutation: {
        id: 'mutation-fresh',
        chapterId: 'chapter-open-water-signals',
        action: 'updated-structure' as const,
        sceneTitle: 'Canal Watch',
      },
    })

    expect(result.current[0]).toMatchObject({
      id: 'mutation-fresh',
      kind: 'mutation',
      title: 'Updated structure for Canal Watch',
    })
  })
})
