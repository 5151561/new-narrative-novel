import { useEffect, useMemo, useRef, useState } from 'react'

export interface ChapterDraftActivityItem {
  id: string
  kind: 'lens' | 'scene'
  title: string
  detail: string
  tone: 'accent' | 'neutral'
}

interface ChapterDraftActivityScene {
  id: string
  title: string
  summary: string
}

interface ChapterDraftActivityEntry {
  id: string
  kind: 'lens' | 'scene'
  title: string
  detail: string
  tone: 'accent' | 'neutral'
}

interface UseChapterDraftActivityOptions {
  chapterId: string
  selectedScene: ChapterDraftActivityScene | null
  maxItems?: number
  locale: 'en' | 'zh-CN'
}

export function useChapterDraftActivity({
  chapterId,
  selectedScene,
  maxItems = 6,
  locale,
}: UseChapterDraftActivityOptions) {
  const [activity, setActivity] = useState<ChapterDraftActivityEntry[]>([])
  const lastChapterIdRef = useRef<string | null>(null)
  const lastSceneIdRef = useRef<string | null>(null)
  const lastLocaleRef = useRef<'en' | 'zh-CN' | null>(null)
  const sequenceRef = useRef(0)

  useEffect(() => {
    const chapterChanged = lastChapterIdRef.current !== chapterId
    const localeChanged = lastLocaleRef.current !== null && lastLocaleRef.current !== locale
    const nextEntries: ChapterDraftActivityEntry[] = []

    if (chapterChanged || localeChanged) {
      lastChapterIdRef.current = chapterId
      lastSceneIdRef.current = null
      lastLocaleRef.current = locale
      sequenceRef.current = 0

      nextEntries.push({
        id: `lens-${sequenceRef.current++}`,
        kind: 'lens',
        tone: 'accent',
        title: locale === 'zh-CN' ? '进入章节 Draft' : 'Entered chapter draft',
        detail:
          locale === 'zh-CN'
            ? '阅读稿会继续围绕同一个 chapter identity 和 route.sceneId 对齐。'
            : 'The reading surface stays aligned to the same chapter identity and route.sceneId.',
      })
    }

    if (selectedScene && lastSceneIdRef.current !== selectedScene.id) {
      nextEntries.push({
        id: `scene-${sequenceRef.current++}`,
        kind: 'scene',
        tone: 'neutral',
        title: locale === 'zh-CN' ? `聚焦${selectedScene.title}` : `Focused ${selectedScene.title}`,
        detail: selectedScene.summary,
      })
      lastSceneIdRef.current = selectedScene.id
    }

    if (nextEntries.length === 0) {
      return
    }

    setActivity((current) => (chapterChanged || localeChanged ? nextEntries : [...nextEntries, ...current]).slice(0, maxItems))
  }, [chapterId, locale, maxItems, selectedScene])

  return useMemo(() => activity, [activity])
}
