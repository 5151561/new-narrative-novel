import { act, renderHook } from '@testing-library/react'

import { useI18n } from '@/app/i18n'
import { AppProviders } from '@/app/providers'

import { useChapterWorkbenchActivity } from './useChapterWorkbenchActivity'

describe('useChapterWorkbenchActivity', () => {
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
      ({ chapterId, activeView, selectedScene }) => {
        const activity = useChapterWorkbenchActivity({
          chapterId,
          activeView,
          selectedScene,
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
    })

    expect(result.current.activity).toHaveLength(2)
    expect(result.current.activity.map((item) => item.id)).toEqual(['view-0', 'scene-1'])
    expect(result.current.activity[0]?.title).toBe('进入装配')
    expect(result.current.activity[1]?.title).toBe('聚焦Ticket Window')
  })
})
