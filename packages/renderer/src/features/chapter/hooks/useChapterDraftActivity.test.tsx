import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useI18n } from '@/app/i18n'
import { AppProviders } from '@/app/providers'

import { useChapterDraftActivity } from './useChapterDraftActivity'

describe('useChapterDraftActivity', () => {
  afterEach(() => {
    window.localStorage.clear()
  })

  it('records a started-next-scene activity once per scene and relocalizes on locale change', () => {
    const { result, rerender } = renderHook(
      ({ lastStartedRun, selectedScene }) => {
        const activity = useChapterDraftActivity({
          chapterId: 'chapter-signals-in-rain',
          selectedScene,
          lastStartedRun,
          locale: useI18n().locale,
        })
        const { setLocale } = useI18n()
        return { activity, setLocale }
      },
      {
        initialProps: {
          lastStartedRun: null as { sceneId: string; title: string } | null,
          selectedScene: {
            id: 'scene-concourse-delay',
            title: 'Concourse Delay',
            summary: 'Hold witness pressure at the edge of the exit.',
          },
        },
        wrapper: AppProviders,
      },
    )

    rerender({
      lastStartedRun: {
        sceneId: 'scene-concourse-delay',
        title: 'Concourse Delay',
      },
      selectedScene: {
        id: 'scene-concourse-delay',
        title: 'Concourse Delay',
        summary: 'Hold witness pressure at the edge of the exit.',
      },
    })

    expect(result.current.activity[0]).toMatchObject({
      title: 'Started next scene run',
      detail: 'Stopped at review for Concourse Delay.',
    })

    rerender({
      lastStartedRun: {
        sceneId: 'scene-concourse-delay',
        title: 'Concourse Delay',
      },
      selectedScene: {
        id: 'scene-concourse-delay',
        title: 'Concourse Delay',
        summary: 'Hold witness pressure at the edge of the exit.',
      },
    })
    expect(result.current.activity.filter((item) => item.title === 'Started next scene run')).toHaveLength(1)

    act(() => {
      result.current.setLocale('zh-CN')
    })

    rerender({
      lastStartedRun: {
        sceneId: 'scene-concourse-delay',
        title: '候车厅延误',
      },
      selectedScene: {
        id: 'scene-concourse-delay',
        title: '候车厅延误',
        summary: '把见证压力继续压在出口边缘。',
      },
    })
    rerender({
      lastStartedRun: {
        sceneId: 'scene-concourse-delay',
        title: '候车厅延误',
      },
      selectedScene: {
        id: 'scene-concourse-delay',
        title: '候车厅延误',
        summary: '把见证压力继续压在出口边缘。',
      },
    })

    expect(result.current.activity[0]).toMatchObject({
      title: '已启动下一场运行',
      detail: '候车厅延误 已停在 review。',
    })
  })
})
