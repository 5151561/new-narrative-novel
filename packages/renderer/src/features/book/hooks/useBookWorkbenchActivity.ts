import { useEffect, useMemo, useRef, useState } from 'react'

import { useI18n } from '@/app/i18n'
import type { BookLens, BookStructureView } from '@/features/workbench/types/workbench-route'

interface BookWorkbenchActivityChapter {
  id: string
  title: string
  summary: string
}

export interface BookWorkbenchHandoffEvent {
  id: string
  bookId: string
  chapterTitle: string
  lens: 'structure' | 'draft'
}

export type BookWorkbenchActivityKind = 'lens' | 'view' | 'chapter' | 'handoff'

interface BookWorkbenchActivityEntry {
  id: string
  kind: BookWorkbenchActivityKind
  tone: 'accent' | 'neutral'
  action:
    | 'entered-lens'
    | 'switched-lens'
    | 'entered-view'
    | 'switched-view'
    | 'focused-chapter'
    | 'opened-structure'
    | 'opened-draft'
  lens?: BookLens
  view?: BookStructureView
  chapterTitle?: string
  chapterSummary?: string
}

export interface BookWorkbenchActivityItem {
  id: string
  kind: BookWorkbenchActivityKind
  title: string
  detail: string
  tone: 'accent' | 'neutral'
}

interface UseBookWorkbenchActivityOptions {
  bookId: string
  activeLens?: BookLens
  activeView: BookStructureView
  selectedChapter: BookWorkbenchActivityChapter | null
  latestHandoff?: BookWorkbenchHandoffEvent | null
  maxItems?: number
}

const rememberedBookHandoffsByBookId = new Map<string, BookWorkbenchActivityEntry[]>()

function buildHandoffActivityEntry(event: BookWorkbenchHandoffEvent): BookWorkbenchActivityEntry {
  return {
    id: event.id,
    kind: 'handoff',
    tone: 'accent',
    action: event.lens === 'structure' ? 'opened-structure' : 'opened-draft',
    chapterTitle: event.chapterTitle,
  }
}

export function rememberBookWorkbenchHandoff(event: BookWorkbenchHandoffEvent, maxItems = 6) {
  const nextEntry = buildHandoffActivityEntry(event)
  const currentEntries = rememberedBookHandoffsByBookId.get(event.bookId) ?? []
  const dedupedEntries = currentEntries.filter((entry) => entry.id !== nextEntry.id)

  rememberedBookHandoffsByBookId.set(event.bookId, [nextEntry, ...dedupedEntries].slice(0, maxItems))
}

export function resetRememberedBookWorkbenchHandoffs() {
  rememberedBookHandoffsByBookId.clear()
}

function getViewLabel(locale: 'en' | 'zh-CN', view: BookStructureView) {
  if (locale === 'zh-CN') {
    return view === 'sequence' ? '顺序' : view === 'outliner' ? '大纲' : '信号'
  }

  return view === 'sequence' ? 'Sequence' : view === 'outliner' ? 'Outliner' : 'Signals'
}

function getLensLabel(locale: 'en' | 'zh-CN', lens: 'structure' | 'draft') {
  if (locale === 'zh-CN') {
    return lens === 'structure' ? '结构' : '成稿'
  }

  return lens === 'structure' ? 'Structure' : 'Draft'
}

function localizeActivityEntry(
  entry: BookWorkbenchActivityEntry,
  locale: 'en' | 'zh-CN',
): BookWorkbenchActivityItem {
  if (entry.kind === 'lens' && entry.lens) {
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `${entry.action === 'entered-lens' ? '进入' : '切换到'}${getLensLabel(locale, entry.lens)}`
          : `${entry.action === 'entered-lens' ? 'Entered' : 'Switched to'} ${getLensLabel(locale, entry.lens)}`,
      detail:
        locale === 'zh-CN'
          ? '书籍工作区继续保持 lens 与章节焦点都由路由拥有。'
          : 'The book workspace keeps the active lens and selected chapter route-owned.',
    }
  }

  if (entry.kind === 'view' && entry.view) {
    const viewLabel = getViewLabel(locale, entry.view)
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `${entry.action === 'entered-view' ? '进入' : '切换到'}${viewLabel}`
          : `${entry.action === 'entered-view' ? 'Entered' : 'Switched to'} ${viewLabel}`,
      detail:
        locale === 'zh-CN'
          ? '底部日志只记录书籍工作区里的视图切换，不接管路由。'
          : 'The dock records book-stage switches without owning route state.',
    }
  }

  if (entry.kind === 'handoff') {
    const lens = entry.action === 'opened-structure' ? 'structure' : 'draft'
    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title:
        locale === 'zh-CN'
          ? `在${getLensLabel(locale, lens)}中打开 ${entry.chapterTitle ?? ''}`
          : `Opened ${entry.chapterTitle ?? ''} in ${getLensLabel(locale, lens)}`,
      detail:
        locale === 'zh-CN'
          ? 'Chapter handoff 仍由路由接管，底部面板只保留本次会话日志。'
          : 'Chapter handoff stays route-owned while the dock keeps only session-local history.',
    }
  }

  return {
    id: entry.id,
    kind: entry.kind,
    tone: entry.tone,
    title: locale === 'zh-CN' ? `聚焦${entry.chapterTitle ?? ''}` : `Focused ${entry.chapterTitle ?? ''}`,
    detail: entry.chapterSummary ?? '',
  }
}

export function useBookWorkbenchActivity({
  bookId,
  activeLens = 'structure',
  activeView,
  selectedChapter,
  latestHandoff = null,
  maxItems = 6,
}: UseBookWorkbenchActivityOptions) {
  const { locale } = useI18n()
  const [activity, setActivity] = useState<BookWorkbenchActivityEntry[]>([])
  const lastBookIdRef = useRef<string | null>(null)
  const lastLocaleRef = useRef<'en' | 'zh-CN' | null>(null)
  const lastLensRef = useRef<BookLens | null>(null)
  const lastViewRef = useRef<BookStructureView | null>(null)
  const lastChapterIdRef = useRef<string | null>(null)
  const seenHandoffIdsRef = useRef<Set<string>>(new Set())
  const sequenceRef = useRef(0)

  useEffect(() => {
    const bookChanged = lastBookIdRef.current !== bookId
    const localeInitialized = lastLocaleRef.current !== null
    const localeChanged = localeInitialized && lastLocaleRef.current !== locale
    const nextEntries: BookWorkbenchActivityEntry[] = []

    if (lastLocaleRef.current === null) {
      lastLocaleRef.current = locale
    }

    if (bookChanged || localeChanged) {
      lastBookIdRef.current = bookId
      lastLocaleRef.current = locale
      lastLensRef.current = null
      lastViewRef.current = null
      lastChapterIdRef.current = null
      seenHandoffIdsRef.current = new Set()
      sequenceRef.current = 0

      if (localeChanged) {
        setActivity([])
        return
      }
    }

    if (activeLens === 'draft') {
      if (lastLensRef.current !== activeLens) {
        nextEntries.push({
          id: `lens-${sequenceRef.current++}`,
          kind: 'lens',
          tone: 'accent',
          action: lastLensRef.current === null ? 'entered-lens' : 'switched-lens',
          lens: activeLens,
        })
      }
      lastLensRef.current = activeLens
      lastViewRef.current = activeView
    } else {
      lastLensRef.current = activeLens
      if (lastViewRef.current !== activeView) {
        nextEntries.push({
          id: `view-${sequenceRef.current++}`,
          kind: 'view',
          tone: 'accent',
          action: lastViewRef.current === null ? 'entered-view' : 'switched-view',
          view: activeView,
        })
        lastViewRef.current = activeView
      }
    }

    const selectedChapterId = selectedChapter?.id ?? null
    if (lastChapterIdRef.current !== selectedChapterId && selectedChapter) {
      nextEntries.push({
        id: `chapter-${sequenceRef.current++}`,
        kind: 'chapter',
        tone: 'neutral',
        action: 'focused-chapter',
        chapterTitle: selectedChapter.title,
        chapterSummary: selectedChapter.summary,
      })
      lastChapterIdRef.current = selectedChapterId
    }

    const rememberedHandoffs = rememberedBookHandoffsByBookId.get(bookId) ?? []
    for (const handoffEntry of [...rememberedHandoffs].reverse()) {
      if (seenHandoffIdsRef.current.has(handoffEntry.id)) {
        continue
      }

      nextEntries.unshift(handoffEntry)
      seenHandoffIdsRef.current.add(handoffEntry.id)
    }

    if (latestHandoff && latestHandoff.bookId === bookId && !seenHandoffIdsRef.current.has(latestHandoff.id)) {
      nextEntries.unshift(buildHandoffActivityEntry(latestHandoff))
      seenHandoffIdsRef.current.add(latestHandoff.id)
    }

    if (nextEntries.length === 0) {
      return
    }

    setActivity((current) => (bookChanged ? nextEntries : [...nextEntries, ...current]).slice(0, maxItems))
  }, [activeLens, activeView, bookId, latestHandoff, locale, maxItems, selectedChapter])

  return useMemo(
    () => activity.map((item) => localizeActivityEntry(item, locale)),
    [activity, locale],
  )
}
