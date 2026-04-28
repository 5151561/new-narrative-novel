import { useEffect, useMemo, useRef, useState } from 'react'

import { getChapterStructureViewLabel, useI18n } from '@/app/i18n'

import type { ChapterStructureView } from '../types/chapter-view-models'

interface ChapterWorkbenchActivityScene {
  id: string
  title: string
  summary: string
}

export type ChapterWorkbenchActivityKind = 'view' | 'scene' | 'mutation'

export interface ChapterWorkbenchMutationEvent {
  id: string
  chapterId: string
  action:
    | 'moved-scene'
    | 'updated-structure'
    | 'saved-backlog-input'
    | 'generated-backlog-proposal'
    | 'updated-backlog-proposal-scene'
    | 'accepted-backlog-proposal'
    | 'started-next-scene-run'
  sceneTitle: string
  direction?: 'up' | 'down'
}

interface ChapterWorkbenchActivityEntry {
  id: string
  kind: ChapterWorkbenchActivityKind
  tone: 'accent' | 'neutral'
  action:
    | 'entered-view'
    | 'switched-view'
    | 'focused-scene'
    | 'moved-scene'
    | 'updated-structure'
    | 'saved-backlog-input'
    | 'generated-backlog-proposal'
    | 'updated-backlog-proposal-scene'
    | 'accepted-backlog-proposal'
    | 'started-next-scene-run'
  view?: ChapterStructureView
  sceneTitle?: string
  sceneSummary?: string
  direction?: 'up' | 'down'
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
  latestMutation?: ChapterWorkbenchMutationEvent | null
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

  if (entry.kind === 'mutation') {
    if (entry.action === 'moved-scene') {
      const movedEarlier = entry.direction === 'up'
      return {
        id: entry.id,
        kind: entry.kind,
        tone: entry.tone,
        title:
          locale === 'zh-CN'
            ? `${movedEarlier ? '前移' : '后移'}${entry.sceneTitle ?? ''}`
            : `Moved ${entry.sceneTitle ?? ''} ${movedEarlier ? 'earlier' : 'later'}`,
        detail:
          locale === 'zh-CN'
            ? '章节顺序已更新，当前选中场景保持不变。'
            : 'Chapter order changed without changing the selected scene.',
      }
    }

    if (entry.action === 'saved-backlog-input') {
      return {
        id: entry.id,
        kind: entry.kind,
        tone: entry.tone,
        title: locale === 'zh-CN' ? '已保存 backlog 输入' : 'Saved backlog input',
        detail:
          locale === 'zh-CN'
            ? '章节目标和约束已写回共享 chapter workspace。'
            : 'The chapter goal and constraints were written back to the shared chapter workspace.',
      }
    }

    if (entry.action === 'generated-backlog-proposal') {
      return {
        id: entry.id,
        kind: entry.kind,
        tone: entry.tone,
        title: locale === 'zh-CN' ? '已生成 backlog 提案' : 'Generated backlog proposal',
        detail:
          locale === 'zh-CN'
            ? '主舞台现在可以审阅并编辑 scene backlog。'
            : 'The main stage can now review and edit the scene backlog.',
      }
    }

    if (entry.action === 'updated-backlog-proposal-scene') {
      return {
        id: entry.id,
        kind: entry.kind,
        tone: entry.tone,
        title: locale === 'zh-CN' ? `已更新${entry.sceneTitle ?? ''}的 backlog 场景计划` : `Updated backlog scene plan for ${entry.sceneTitle ?? ''}`,
        detail:
          locale === 'zh-CN'
            ? '提案场景卡片已更新，但 canonical scene 顺序仍要等接受后才会生效。'
            : 'The proposal scene card was updated, but canonical scene order waits for acceptance.',
      }
    }

    if (entry.action === 'accepted-backlog-proposal') {
      return {
        id: entry.id,
        kind: entry.kind,
        tone: entry.tone,
        title: locale === 'zh-CN' ? '已接受 backlog 提案' : 'Accepted backlog proposal',
        detail:
          locale === 'zh-CN'
            ? 'canonical scene 顺序和 backlog 状态已经稳定下来。'
            : 'Canonical scene order and backlog status are now stable.',
      }
    }

    if (entry.action === 'started-next-scene-run') {
      return {
        id: entry.id,
        kind: entry.kind,
        tone: entry.tone,
        title: locale === 'zh-CN' ? '已启动下一场运行' : 'Started next scene run',
        detail:
          locale === 'zh-CN'
            ? '章节编排已启动 accepted backlog 中的下一场，并停在 review。'
            : 'Chapter orchestration launched the next accepted backlog scene and stopped at review.',
      }
    }

    return {
      id: entry.id,
      kind: entry.kind,
      tone: entry.tone,
      title: locale === 'zh-CN' ? `已更新${entry.sceneTitle ?? ''}的结构` : `Updated structure for ${entry.sceneTitle ?? ''}`,
      detail:
        locale === 'zh-CN'
          ? '结构字段已保存，相关视图会沿用同一份工作区数据刷新。'
          : 'Structure fields were saved and the shared chapter workspace refreshed in place.',
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
  latestMutation = null,
  maxItems = 6,
}: UseChapterWorkbenchActivityOptions) {
  const { locale } = useI18n()
  const [activity, setActivity] = useState<ChapterWorkbenchActivityEntry[]>([])
  const lastChapterIdRef = useRef<string | null>(null)
  const lastLocaleRef = useRef<'en' | 'zh-CN' | null>(null)
  const lastViewRef = useRef<ChapterStructureView | null>(null)
  const lastSceneIdRef = useRef<string | null>(null)
  const lastMutationIdRef = useRef<string | null>(null)
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
      lastMutationIdRef.current = null
      sequenceRef.current = 0

      if (localeChanged) {
        setActivity([])
        return
      }
    }

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

    const selectedSceneId = selectedScene?.id ?? null
    if (lastSceneIdRef.current !== selectedSceneId && selectedScene) {
      nextEntries.push({
        id: `scene-${sequenceRef.current++}`,
        kind: 'scene',
        tone: 'neutral',
        action: 'focused-scene',
        sceneTitle: selectedScene.title,
        sceneSummary: selectedScene.summary,
      })
      lastSceneIdRef.current = selectedSceneId
    }

    if (
      latestMutation &&
      latestMutation.chapterId === chapterId &&
      lastMutationIdRef.current !== latestMutation.id
    ) {
      nextEntries.unshift({
        id: latestMutation.id,
        kind: 'mutation',
        tone: 'accent',
        action: latestMutation.action,
        sceneTitle: latestMutation.sceneTitle,
        direction: latestMutation.direction,
      })
      lastMutationIdRef.current = latestMutation.id
    }

    if (nextEntries.length === 0) {
      return
    }

    setActivity((current) => (chapterChanged ? nextEntries : [...nextEntries, ...current]).slice(0, maxItems))
  }, [activeView, chapterId, latestMutation, locale, maxItems, selectedScene])

  return useMemo(
    () => activity.map((item) => localizeActivityEntry(item, locale)),
    [activity, locale],
  )
}
