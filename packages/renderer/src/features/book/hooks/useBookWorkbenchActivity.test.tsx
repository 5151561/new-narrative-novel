import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AppProviders } from '@/app/providers'
import { useI18n } from '@/app/i18n'
import type { BookDraftView, BookReviewFilter, BookStructureView } from '@/features/workbench/types/workbench-route'

import {
  rememberBookWorkbenchReviewSourceOpen,
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
  activeDraftView?: BookDraftView
  selectedReviewFilter?: BookReviewFilter
  selectedReviewIssue?: {
    id: string
    title: string
    sourceLabel: string
    chapterTitle?: string
    sceneTitle?: string
  } | null
  selectedCheckpoint?: {
    id: string
    title: string
    summary: string
  } | null
  selectedBranch?: {
    id: string
    title: string
    summary: string
  } | null
  selectedBranchBaseline?: {
    id: string
    title: string
    kind: 'current' | 'checkpoint'
    checkpointId?: string
  } | null
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
          activeDraftView: 'read',
          selectedCheckpoint: null,
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
          activeDraftView: 'read',
          selectedCheckpoint: null,
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

  it('records compare entry, checkpoint selection, and returning to read', () => {
    const { result, rerender } = renderHook(
      ({ activeDraftView = 'read', selectedCheckpoint = null, selectedChapter }: ActivityHookProps) =>
        useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeLens: 'draft',
          activeView: 'sequence',
          activeDraftView,
          selectedCheckpoint,
          selectedChapter,
          maxItems: 6,
        }),
      {
        initialProps: {
          activeView: 'sequence',
          activeDraftView: 'read',
          selectedCheckpoint: null,
          selectedChapter: {
            id: 'chapter-open-water-signals',
            title: 'Open Water Signals',
            summary: 'Warehouse pressure should stay legible as the exit opens.',
          },
        },
        wrapper: AppProviders,
      },
    )

    rerender({
      activeView: 'sequence',
      activeDraftView: 'compare',
      selectedCheckpoint: {
        id: 'checkpoint-book-signal-arc-pr11-baseline',
        title: 'PR11 Baseline',
        summary: 'Baseline manuscript snapshot.',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current.map((item) => item.title)).toEqual([
      'Entered Compare',
      'Selected checkpoint PR11 Baseline',
      'Entered Draft',
      'Focused Open Water Signals',
    ])

    rerender({
      activeView: 'sequence',
      activeDraftView: 'read',
      selectedCheckpoint: {
        id: 'checkpoint-book-signal-arc-pr11-baseline',
        title: 'PR11 Baseline',
        summary: 'Baseline manuscript snapshot.',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current[0]?.title).toBe('Returned to Read')
  })

  it('records export entry, export profile selection, and switching away from export', () => {
    const { result, rerender } = renderHook(
      ({ activeDraftView = 'read', selectedChapter, selectedExportProfile = null }: ActivityHookProps & { selectedExportProfile?: { id: string; title: string; summary: string } | null }) =>
        useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeLens: 'draft',
          activeView: 'sequence',
          activeDraftView,
          selectedCheckpoint: null,
          selectedExportProfile,
          selectedChapter,
          maxItems: 6,
        }),
      {
        initialProps: {
          activeView: 'sequence',
          activeDraftView: 'read',
          selectedChapter: {
            id: 'chapter-open-water-signals',
            title: 'Open Water Signals',
            summary: 'Warehouse pressure should stay legible as the exit opens.',
          },
          selectedExportProfile: null,
        },
        wrapper: AppProviders,
      },
    )

    rerender({
      activeView: 'sequence',
      activeDraftView: 'export',
      selectedExportProfile: {
        id: 'export-review-packet',
        title: 'Review Packet',
        summary: 'Full manuscript packet with compare and trace context attached.',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current.map((item) => item.title)).toEqual([
      'Entered Export Preview',
      'Selected export profile Review Packet',
      'Entered Draft',
      'Focused Open Water Signals',
    ])

    rerender({
      activeView: 'sequence',
      activeDraftView: 'compare',
      selectedExportProfile: {
        id: 'export-review-packet',
        title: 'Review Packet',
        summary: 'Full manuscript packet with compare and trace context attached.',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current[0]?.title).toBe('Returned to Compare')
  })

  it('records export -> branch as branch entry instead of returning to read', () => {
    const { result, rerender } = renderHook(
      ({
        activeDraftView = 'read',
        selectedChapter,
        selectedExportProfile = null,
        selectedBranch = null,
        selectedBranchBaseline = null,
      }: ActivityHookProps & {
        selectedExportProfile?: { id: string; title: string; summary: string } | null
      }) =>
        useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeLens: 'draft',
          activeView: 'sequence',
          activeDraftView,
          selectedCheckpoint: null,
          selectedExportProfile,
          selectedBranch,
          selectedBranchBaseline,
          selectedChapter,
          maxItems: 7,
        }),
      {
        initialProps: {
          activeView: 'sequence',
          activeDraftView: 'export',
          selectedExportProfile: {
            id: 'export-review-packet',
            title: 'Review Packet',
            summary: 'Full manuscript packet with compare and trace context attached.',
          },
          selectedBranch: null,
          selectedBranchBaseline: null,
          selectedChapter: {
            id: 'chapter-open-water-signals',
            title: 'Open Water Signals',
            summary: 'Warehouse pressure should stay legible as the exit opens.',
          },
        },
        wrapper: AppProviders,
      },
    )

    rerender({
      activeView: 'sequence',
      activeDraftView: 'branch',
      selectedExportProfile: {
        id: 'export-review-packet',
        title: 'Review Packet',
        summary: 'Full manuscript packet with compare and trace context attached.',
      },
      selectedBranch: {
        id: 'branch-book-signal-arc-high-pressure',
        title: 'High Pressure',
        summary: 'Stress the witness line and hold the courier cost in public view.',
      },
      selectedBranchBaseline: {
        id: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
        title: 'Checkpoint baseline',
        kind: 'checkpoint',
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current[0]?.title).toBe('Entered Branch Review')
    expect(result.current[0]?.detail).toBe('Branch review keeps branch selection and baseline route-owned.')
    expect(result.current[2]).toMatchObject({
      title: 'Selected checkpoint baseline',
      detail: 'Review branch deltas against Checkpoint baseline (checkpoint-book-signal-arc-pr11-baseline).',
    })
  })

  it('records branch entry, branch selection, and checkpoint baseline selection', () => {
    const { result, rerender } = renderHook(
      ({
        activeDraftView = 'read',
        selectedChapter,
        selectedBranch = null,
        selectedBranchBaseline = null,
      }: ActivityHookProps) =>
        useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeLens: 'draft',
          activeView: 'sequence',
          activeDraftView,
          selectedCheckpoint: null,
          selectedExportProfile: null,
          selectedBranch,
          selectedBranchBaseline,
          selectedChapter,
          maxItems: 7,
        }),
      {
        initialProps: {
          activeView: 'sequence',
          activeDraftView: 'read',
          selectedBranch: null,
          selectedBranchBaseline: null,
          selectedChapter: {
            id: 'chapter-open-water-signals',
            title: 'Open Water Signals',
            summary: 'Warehouse pressure should stay legible as the exit opens.',
          },
        },
        wrapper: AppProviders,
      },
    )

    rerender({
      activeView: 'sequence',
      activeDraftView: 'branch',
      selectedBranch: {
        id: 'branch-book-signal-arc-high-pressure',
        title: 'High Pressure',
        summary: 'Stress the witness line and hold the courier cost in public view.',
      },
      selectedBranchBaseline: {
        id: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
        title: 'Checkpoint baseline',
        kind: 'checkpoint',
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current.map((item) => item.title)).toEqual([
      'Entered Branch Review',
      'Selected branch High Pressure',
      'Selected checkpoint baseline',
      'Entered Draft',
      'Focused Open Water Signals',
    ])

    rerender({
      activeView: 'sequence',
      activeDraftView: 'read',
      selectedBranch: {
        id: 'branch-book-signal-arc-high-pressure',
        title: 'High Pressure',
        summary: 'Stress the witness line and hold the courier cost in public view.',
      },
      selectedBranchBaseline: {
        id: 'checkpoint:checkpoint-book-signal-arc-pr11-baseline',
        title: 'Checkpoint baseline',
        kind: 'checkpoint',
        checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current[0]?.title).toBe('Returned to Read')
  })

  it('localizes current baseline activity detail without inventing caller summary text', () => {
    const { result } = renderHook(
      () =>
        useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeLens: 'draft',
          activeView: 'sequence',
          activeDraftView: 'branch',
          selectedCheckpoint: null,
          selectedExportProfile: null,
          selectedBranch: {
            id: 'branch-book-signal-arc-quiet-ending',
            title: 'Quiet Ending',
            summary: 'A lower-conflict ending branch.',
          },
          selectedBranchBaseline: {
            id: 'current:current',
            title: 'Current baseline',
            kind: 'current',
          },
          selectedChapter: {
            id: 'chapter-open-water-signals',
            title: 'Open Water Signals',
            summary: 'Warehouse pressure should stay legible as the exit opens.',
          },
          maxItems: 6,
        }),
      {
        wrapper: AppProviders,
      },
    )

    expect(result.current.find((item) => item.kind === 'branch-baseline')).toMatchObject({
      title: 'Selected current baseline',
      detail: 'Keep the current manuscript as the branch review baseline.',
    })
  })

  it('records review entry, filter changes, and issue selection with localized copy', () => {
    const { result, rerender } = renderHook(
      ({
        activeDraftView = 'read',
        selectedReviewFilter = 'all',
        selectedReviewIssue = null,
        selectedChapter,
      }: ActivityHookProps) => {
        const activity = useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeLens: 'draft',
          activeView: 'sequence',
          activeDraftView,
          selectedReviewFilter,
          selectedReviewIssue,
          selectedCheckpoint: null,
          selectedChapter,
          maxItems: 8,
        })
        const { setLocale, locale } = useI18n()

        return { activity, setLocale, locale }
      },
      {
        initialProps: {
          activeView: 'sequence',
          activeDraftView: 'read',
          selectedReviewFilter: 'all',
          selectedReviewIssue: null,
          selectedChapter: {
            id: 'chapter-open-water-signals',
            title: 'Open Water Signals',
            summary: 'Warehouse pressure should stay legible as the exit opens.',
          },
        },
        wrapper: AppProviders,
      },
    )

    rerender({
      activeView: 'sequence',
      activeDraftView: 'review',
      selectedReviewFilter: 'export-readiness',
      selectedReviewIssue: {
        id: 'export-blocker-open-water-signals',
        title: 'Export packet is blocked',
        sourceLabel: 'Export readiness',
        chapterTitle: 'Open Water Signals',
        sceneTitle: 'Dawn Slip',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    })

    expect(result.current.activity.map((item) => item.title)).toEqual([
      'Entered Review',
      'Selected review filter Export readiness',
      'Selected review issue Export packet is blocked',
      'Entered Draft',
      'Focused Open Water Signals',
    ])

    act(() => {
      result.current.setLocale('zh-CN')
    })

    rerender({
      activeView: 'sequence',
      activeDraftView: 'review',
      selectedReviewFilter: 'export-readiness',
      selectedReviewIssue: {
        id: 'export-blocker-open-water-signals',
        title: '导出包仍被阻塞',
        sourceLabel: '导出准备度',
        chapterTitle: '开阔水域信号',
        sceneTitle: '黎明滑移',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: '开阔水域信号',
        summary: '货仓压力要一直撑到出口真正打开。',
      },
    })

    expect(result.current.locale).toBe('zh-CN')
    expect(result.current.activity.map((item) => item.title)).toEqual(
      expect.arrayContaining(['进入 Review', '选择筛选器 导出准备度', '选择审阅问题 导出包仍被阻塞']),
    )
  })

  it('records returning to read when leaving review mode', () => {
    const { result, rerender } = renderHook(
      ({
        activeDraftView = 'read',
        selectedReviewFilter = 'all',
        selectedReviewIssue = null,
        selectedChapter,
      }: ActivityHookProps) =>
        useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeLens: 'draft',
          activeView: 'sequence',
          activeDraftView,
          selectedReviewFilter,
          selectedReviewIssue,
          selectedCheckpoint: null,
          selectedChapter,
          maxItems: 8,
        }),
      {
        initialProps: {
          activeView: 'sequence',
          activeDraftView: 'review',
          selectedReviewFilter: 'blockers',
          selectedReviewIssue: {
            id: 'missing-draft-signals-in-rain',
            title: 'Signals in Rain still misses one scene draft',
            sourceLabel: 'Current manuscript',
            chapterTitle: 'Signals in Rain',
            sceneTitle: 'Departure Bell',
          },
          selectedChapter: {
            id: 'chapter-signals-in-rain',
            title: 'Signals in Rain',
            summary: 'Platform pressure needs to hold until the departure bell.',
          },
        },
        wrapper: AppProviders,
      },
    )

    rerender({
      activeView: 'sequence',
      activeDraftView: 'read',
      selectedReviewFilter: 'blockers',
      selectedReviewIssue: {
        id: 'missing-draft-signals-in-rain',
        title: 'Signals in Rain still misses one scene draft',
        sourceLabel: 'Current manuscript',
        chapterTitle: 'Signals in Rain',
        sceneTitle: 'Departure Bell',
      },
      selectedChapter: {
        id: 'chapter-signals-in-rain',
        title: 'Signals in Rain',
        summary: 'Platform pressure needs to hold until the departure bell.',
      },
    })

    expect(result.current[0]).toMatchObject({
      kind: 'draft-view',
      title: 'Returned to Read',
      detail: 'Read mode restores the manuscript reader without taking over the dormant structure view.',
    })
  })

  it('records opened review sources and re-localizes the remembered entry', () => {
    const initialProps: ActivityHookProps = {
      activeView: 'sequence',
      activeDraftView: 'review',
      selectedReviewFilter: 'export-readiness',
      selectedReviewIssue: {
        id: 'export-blocker-open-water-signals',
        title: 'Export packet is blocked',
        sourceLabel: 'Export readiness',
        chapterTitle: 'Open Water Signals',
        sceneTitle: 'Dawn Slip',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
    }

    const { result, rerender } = renderHook(
      ({ activeDraftView = 'review', selectedReviewFilter = 'export-readiness', selectedReviewIssue, selectedChapter }: ActivityHookProps) => {
        const activity = useBookWorkbenchActivity({
          bookId: 'book-signal-arc',
          activeLens: 'draft',
          activeView: 'sequence',
          activeDraftView,
          selectedReviewFilter,
          selectedReviewIssue,
          selectedCheckpoint: null,
          selectedChapter,
          maxItems: 8,
        })
        const { setLocale, locale } = useI18n()

        return { activity, setLocale, locale }
      },
      {
        initialProps,
        wrapper: AppProviders,
      },
    )

    act(() => {
      rememberBookWorkbenchReviewSourceOpen({
        id: 'review-source-book-signal-arc-review-source-export',
        bookId: 'book-signal-arc',
        issueTitle: 'Export packet is blocked',
        sourceActionLabel: 'Open export readiness',
      })
    })

    rerender({
      ...initialProps,
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: 'Open Water Signals',
        summary: 'Warehouse pressure should stay legible as the exit opens.',
      },
      selectedReviewIssue: {
        id: 'export-blocker-open-water-signals',
        title: 'Export packet is blocked',
        sourceLabel: 'Export readiness',
        chapterTitle: 'Open Water Signals',
        sceneTitle: 'Dawn Slip',
      },
    })

    expect(result.current.activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'review-source',
          title: 'Opened issue source Open export readiness',
          detail: 'Export packet is blocked',
        }),
      ]),
    )

    act(() => {
      result.current.setLocale('zh-CN')
    })

    rerender({
      ...initialProps,
      selectedReviewIssue: {
        id: 'export-blocker-open-water-signals',
        title: '导出包仍被阻塞',
        sourceLabel: '导出准备度',
        chapterTitle: '开阔水域信号',
        sceneTitle: '黎明滑移',
      },
      selectedChapter: {
        id: 'chapter-open-water-signals',
        title: '开阔水域信号',
        summary: '货仓压力要一直撑到出口真正打开。',
      },
    })

    expect(result.current.locale).toBe('zh-CN')
    expect(result.current.activity).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'review-source',
          title: '打开问题来源 Open export readiness',
          detail: 'Export packet is blocked',
        }),
      ]),
    )
  })
})
