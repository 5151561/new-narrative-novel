import { useEffect, useMemo, useRef, useState } from 'react'

import { getChapterStructureViewLabel, useI18n } from '@/app/i18n'

import type { ChapterStructureView } from '../types/chapter-view-models'

interface ChapterWorkbenchActivityScene {
  id: string
  title: string
  summary: string
}

type ChapterWorkbenchActivityKind = 'view' | 'scene'

interface ChapterWorkbenchActivityEntry {
  id: string
  kind: ChapterWorkbenchActivityKind
  tone: 'accent' | 'neutral'
  action: 'entered-view' | 'switched-view' | 'focused-scene'
  view?: ChapterStructureView
  sceneTitle?: string
  sceneSummary?: string
}

export interface ChapterWorkbenchActivityItem {
  id: string
  kind: ChapterWorkbenchActivityKind
  title: string
  detail: string
  tone: 'accent' | 'neutral'
}

interface UseChapterWorkbenchActivityOptions {
  chapterId: string
  activeView: ChapterStructureView
  selectedScene: ChapterWorkbenchActivityScene | null
  maxItems?: number
}

function localizeActivityEntry(
  entry: ChapterWorkbenchActivityEntry,
  locale: 'en' | 'zh-CN',
): ChapterWorkbenchActivityItem {
  if (entry.kind === 'view' && entry.view) {
    const viewLabel = getChapterStructureViewLabel(locale, entry.view)
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
          ? '底部日志只记录工作区切换，不接管视图状态。'
          : 'The dock records the workspace transition without owning view state.',
    }
  }

  return {
    id: entry.id,
    kind: entry.kind,
    tone: entry.tone,
    title: locale === 'zh-CN' ? `聚焦${entry.sceneTitle ?? ''}` : `Focused ${entry.sceneTitle ?? ''}`,
    detail: entry.sceneSummary ?? '',
  }
}

export function useChapterWorkbenchActivity({
  chapterId,
  activeView,
  selectedScene,
  maxItems = 6,
}: UseChapterWorkbenchActivityOptions) {
  const { locale } = useI18n()
  const [activity, setActivity] = useState<ChapterWorkbenchActivityEntry[]>([])
  const lastChapterIdRef = useRef<string | null>(null)
  const lastLocaleRef = useRef<'en' | 'zh-CN' | null>(null)
  const lastViewRef = useRef<ChapterStructureView | null>(null)
  const lastSceneIdRef = useRef<string | null>(null)
  const sequenceRef = useRef(0)

  useEffect(() => {
    const chapterChanged = lastChapterIdRef.current !== chapterId
    const localeInitialized = lastLocaleRef.current !== null
    const localeChanged = localeInitialized && lastLocaleRef.current !== locale
    const nextEntries: ChapterWorkbenchActivityEntry[] = []

    if (lastLocaleRef.current === null) {
      lastLocaleRef.current = locale
    }

    if (chapterChanged || localeChanged) {
      lastChapterIdRef.current = chapterId
      lastLocaleRef.current = locale
      lastViewRef.current = null
      lastSceneIdRef.current = null
      sequenceRef.current = 0

      if (localeChanged) {
        setActivity([])
        return
      }
    }

    if (lastViewRef.current !== activeView) {
      nextEntries.push(
        {
          id: `view-${sequenceRef.current++}`,
          kind: 'view',
          tone: 'accent',
          action: lastViewRef.current === null ? 'entered-view' : 'switched-view',
          view: activeView,
        } satisfies ChapterWorkbenchActivityEntry,
      )
      lastViewRef.current = activeView
    }

    const selectedSceneId = selectedScene?.id ?? null
    if (lastSceneIdRef.current !== selectedSceneId && selectedScene) {
      nextEntries.push(
        {
          id: `scene-${sequenceRef.current++}`,
          kind: 'scene',
          tone: 'neutral',
          action: 'focused-scene',
          sceneTitle: selectedScene.title,
          sceneSummary: selectedScene.summary,
        } satisfies ChapterWorkbenchActivityEntry,
      )
      lastSceneIdRef.current = selectedSceneId
    }

    if (nextEntries.length === 0) {
      return
    }

    setActivity((current) => (chapterChanged ? nextEntries : [...nextEntries, ...current]).slice(0, maxItems))
  }, [activeView, chapterId, locale, maxItems, selectedScene])

  return useMemo(
    () => activity.map((item) => localizeActivityEntry(item, locale)),
    [activity, locale],
  )
}
