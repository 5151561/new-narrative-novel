import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'
import { useI18n } from '@/app/i18n'
import type { BookStructureView } from '@/features/workbench/types/workbench-route'

import {
  resetRememberedBookWorkbenchHandoffs,
  useBookWorkbenchActivity,
  type BookWorkbenchHandoffEvent,
} from './useBookWorkbenchActivity'

interface ActivityTestSelectedChapter {
  id: string
  title: string
  summary: string
}

interface ActivityHookProps {
  activeView: BookStructureView
  selectedChapter: ActivityTestSelectedChapter | null
  latestHandoff?: BookWorkbenchHandoffEvent | null
}

describe('useBookWorkbenchActivity', () => {
  afterEach(() => {
    window.localStorage.clear()
    resetRememberedBookWorkbenchHandoffs()
  })

  it('dedupes repeated view and chapter inputs and caps the recent log', () => {
    const initialProps: ActivityHookProps = {
      activeView: 'outliner',
      selectedChapter: {
        id: 'chapter-signals-in-rain',
        title: 'Signals in Rain',
        summary: 'Platform pressure needs to hold until the departure bell.',
      },
    }

    const { result, rerender } = renderHook(
      ({ activeView, selectedChapter }: ActivityHookProps) =>
        useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeView,
          selectedChapter,
          maxItems: 3,
        }),
      {
        initialProps,
        wrapper: AppProviders,
      },
    )

    expect(result.current.map((item) => item.id)).toEqual(['view-0', 'chapter-1'])

    rerender({
      activeView: 'outliner',
      selectedChapter: {
        id: 'chapter-signals-in-rain',
        title: 'Signals in Rain',
        summary: 'Platform pressure needs to hold until the departure bell.',
      },
    })

    expect(result.current.map((item) => item.id)).toEqual(['view-0', 'chapter-1'])

    rerender({
      activeView: 'signals',
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current.map((item) => item.id)).toEqual(['view-2', 'chapter-3', 'view-0'])
  })

  it('records handoff activity and re-localizes existing entries without duplicating them', () => {
    const initialProps: ActivityHookProps = {
      activeView: 'sequence',
      selectedChapter: {
        id: 'chapter-signals-in-rain',
        title: 'Signals in Rain',
        summary: 'Platform pressure needs to hold until the departure bell.',
      },
      latestHandoff: null,
    }

    const { result, rerender } = renderHook(
      ({ activeView, selectedChapter, latestHandoff }: ActivityHookProps) => {
        const activity = useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeView,
          selectedChapter,
          latestHandoff,
          maxItems: 4,
        })
        const { setLocale, locale } = useI18n()

        return { activity, setLocale, locale }
      },
      {
        initialProps,
        wrapper: AppProviders,
      },
    )

    rerender({
      activeView: 'sequence',
      selectedChapter: {
        id: 'chapter-signals-in-rain',
        title: 'Signals in Rain',
        summary: 'Platform pressure needs to hold until the departure bell.',
      },
      latestHandoff: {
        id: 'handoff-1',
        bookId: 'book-signal-arc',
        chapterTitle: 'Signals in Rain',
        lens: 'draft' as const,
      },
    })

    expect(result.current.activity[0]).toMatchObject({
      kind: 'handoff',
      title: 'Opened Signals in Rain in Draft',
    })

    act(() => {
      result.current.setLocale('zh-CN')
    })

    rerender({
      activeView: 'sequence',
      selectedChapter: {
        id: 'chapter-signals-in-rain',
        title: '雨中信号',
        summary: '站台压力需要一直撑到离站铃声。',
      },
      latestHandoff: {
        id: 'handoff-1',
        bookId: 'book-signal-arc',
        chapterTitle: 'Signals in Rain',
        lens: 'draft' as const,
      },
    })

    expect(result.current.locale).toBe('zh-CN')
    expect(result.current.activity).toHaveLength(3)
    expect(result.current.activity[0]?.title).toBe('在成稿中打开 Signals in Rain')
    expect(result.current.activity[1]?.title).toBe('进入顺序')
    expect(result.current.activity[2]?.title).toBe('聚焦雨中信号')
  })
})
