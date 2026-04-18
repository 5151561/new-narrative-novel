import type { Locale } from '@/app/i18n'
import {
  readLocalizedChapterText,
  type ChapterStructureSceneRecord,
  type ChapterStructureWorkspaceRecord,
} from '@/features/chapter/api/chapter-records'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import { readLocalizedBookText, type BookStructureRecord } from '../api/book-records'
import type {
  BookSceneTraceRollup,
  BookStructureChapterViewModel,
  BookStructureRiskSummaryViewModel,
  BookStructureTotalsViewModel,
  BookStructureWorkspaceViewModel,
} from '../types/book-view-models'

interface BuildBookStructureWorkspaceViewModelInput {
  record: BookStructureRecord
  locale: Locale
  selectedChapterId?: string | null
  chapterWorkspacesById: Record<string, ChapterStructureWorkspaceRecord | null | undefined>
  sceneProseBySceneId: Record<string, SceneProseViewModel | null | undefined>
  traceRollupsBySceneId: Record<string, BookSceneTraceRollup | null | undefined>
}

function localizeChapterText(
  value: Parameters<typeof readLocalizedChapterText>[0],
  locale: Locale,
) {
  return readLocalizedChapterText(value, locale)
}

function isSceneDrafted(prose: SceneProseViewModel | null | undefined) {
  if (!prose) {
    return false
  }

  return Boolean(prose.proseDraft?.trim()) || (prose.draftWordCount ?? 0) > 0
}

function isSceneTraced(trace: BookSceneTraceRollup | null | undefined) {
  if (!trace) {
    return false
  }

  return !trace.missingLinks.includes('trace')
}

function formatSceneCountLabel(count: number, locale: Locale, noun: 'draft' | 'trace') {
  if (locale === 'zh-CN') {
    return noun === 'draft' ? `${count} 个场景仍缺正文` : `${count} 个场景仍缺溯源`
  }

  const sceneLabel = count === 1 ? 'scene' : 'scenes'
  return noun === 'draft' ? `${count} ${sceneLabel} still missing draft` : `${count} ${sceneLabel} still missing trace`
}

function joinTitles(titles: string[], locale: Locale) {
  if (titles.length <= 1) {
    return titles[0] ?? ''
  }

  if (locale === 'zh-CN') {
    return titles.join('、')
  }

  if (titles.length === 2) {
    return `${titles[0]} and ${titles[1]}`
  }

  return `${titles.slice(0, -1).join(', ')}, and ${titles[titles.length - 1]}`
}

function formatMissingSceneDetail(titles: string[], locale: Locale, noun: 'draft' | 'trace') {
  const joinedTitles = joinTitles(titles, locale)
  if (locale === 'zh-CN') {
    return noun === 'draft' ? `${joinedTitles} 还没有正文草稿。` : `${joinedTitles} 还没有溯源汇总。`
  }

  const verb = titles.length > 1 ? 'have' : 'has'
  return noun === 'draft' ? `${joinedTitles} ${verb} no prose draft yet.` : `${joinedTitles} ${verb} no trace rollup yet.`
}

function compareByPriority(
  left: BookStructureChapterViewModel,
  right: BookStructureChapterViewModel,
  metric: 'unresolvedCount' | 'missingDraftCount' | 'missingTraceSceneCount',
) {
  if (right[metric] !== left[metric]) {
    return right[metric] - left[metric]
  }

  if (right.unresolvedCount !== left.unresolvedCount) {
    return right.unresolvedCount - left.unresolvedCount
  }

  return left.order - right.order
}

function preferUnusedChapter(
  chapters: BookStructureChapterViewModel[],
  usedChapterIds: Set<string>,
  predicate: (chapter: BookStructureChapterViewModel) => boolean,
  metric: 'unresolvedCount' | 'missingDraftCount' | 'missingTraceSceneCount',
) {
  const candidates = chapters.filter(predicate).sort((left, right) => compareByPriority(left, right, metric))
  return candidates.find((chapter) => !usedChapterIds.has(chapter.chapterId)) ?? candidates[0]
}

function buildCoverageStatus(
  sceneCount: number,
  draftedSceneCount: number,
  tracedSceneCount: number,
) {
  if (sceneCount === 0 || (draftedSceneCount === 0 && tracedSceneCount === 0)) {
    return 'missing' as const
  }

  if (draftedSceneCount < sceneCount || tracedSceneCount < sceneCount) {
    return 'attention' as const
  }

  return 'ready' as const
}

function buildChapterViewModel(
  record: ChapterStructureWorkspaceRecord,
  order: number,
  locale: Locale,
  sceneProseBySceneId: Record<string, SceneProseViewModel | null | undefined>,
  traceRollupsBySceneId: Record<string, BookSceneTraceRollup | null | undefined>,
): BookStructureChapterViewModel {
  const scenes = [...record.scenes].sort((left, right) => left.order - right.order)
  const draftedScenes = scenes.filter((scene) => isSceneDrafted(sceneProseBySceneId[scene.id]))
  const tracedScenes = scenes.filter((scene) => isSceneTraced(traceRollupsBySceneId[scene.id]))

  return {
    chapterId: record.chapterId,
    order,
    title: readLocalizedChapterText(record.title, locale),
    summary: readLocalizedChapterText(record.summary, locale),
    sceneCount: scenes.length,
    unresolvedCount: scenes.reduce((total, scene) => total + scene.unresolvedCount, 0),
    draftedSceneCount: draftedScenes.length,
    missingDraftCount: scenes.length - draftedScenes.length,
    assembledWordCount: scenes.reduce((total, scene) => total + (sceneProseBySceneId[scene.id]?.draftWordCount ?? 0), 0),
    warningsCount: scenes.reduce((total, scene) => total + (sceneProseBySceneId[scene.id]?.warningsCount ?? 0), 0),
    queuedRevisionCount: scenes.reduce((total, scene) => total + (sceneProseBySceneId[scene.id]?.revisionQueueCount ?? 0), 0),
    tracedSceneCount: tracedScenes.length,
    missingTraceSceneCount: scenes.length - tracedScenes.length,
    primaryProblemLabel: record.inspector.problemsSummary[0]
      ? readLocalizedChapterText(record.inspector.problemsSummary[0].label, locale)
      : undefined,
    primaryAssemblyHintLabel: record.inspector.assemblyHints[0]
      ? readLocalizedChapterText(record.inspector.assemblyHints[0].label, locale)
      : undefined,
    coverageStatus: buildCoverageStatus(scenes.length, draftedScenes.length, tracedScenes.length),
  }
}

export function buildBookStructureTotalsViewModel(
  chapters: BookStructureChapterViewModel[],
): BookStructureTotalsViewModel {
  return chapters.reduce<BookStructureTotalsViewModel>(
    (totals, chapter) => ({
      chapterCount: totals.chapterCount + 1,
      sceneCount: totals.sceneCount + chapter.sceneCount,
      unresolvedCount: totals.unresolvedCount + chapter.unresolvedCount,
      draftedSceneCount: totals.draftedSceneCount + chapter.draftedSceneCount,
      missingDraftCount: totals.missingDraftCount + chapter.missingDraftCount,
      tracedSceneCount: totals.tracedSceneCount + chapter.tracedSceneCount,
      missingTraceSceneCount: totals.missingTraceSceneCount + chapter.missingTraceSceneCount,
      assembledWordCount: totals.assembledWordCount + chapter.assembledWordCount,
      warningsCount: totals.warningsCount + chapter.warningsCount,
      queuedRevisionCount: totals.queuedRevisionCount + chapter.queuedRevisionCount,
    }),
    {
      chapterCount: 0,
      sceneCount: 0,
      unresolvedCount: 0,
      draftedSceneCount: 0,
      missingDraftCount: 0,
      tracedSceneCount: 0,
      missingTraceSceneCount: 0,
      assembledWordCount: 0,
      warningsCount: 0,
      queuedRevisionCount: 0,
    },
  )
}

function getMissingSceneTitles(
  scenes: ChapterStructureSceneRecord[],
  locale: Locale,
  predicate: (scene: ChapterStructureSceneRecord) => boolean,
) {
  return scenes
    .filter(predicate)
    .sort((left, right) => left.order - right.order)
    .map((scene) => localizeChapterText(scene.title, locale))
}

export function buildBookRiskHighlights(
  chapters: BookStructureChapterViewModel[],
  chapterRecordsById: Record<string, ChapterStructureWorkspaceRecord>,
  locale: Locale,
  sceneProseBySceneId: Record<string, SceneProseViewModel | null | undefined>,
  traceRollupsBySceneId: Record<string, BookSceneTraceRollup | null | undefined>,
): BookStructureRiskSummaryViewModel[] {
  const highlights: BookStructureRiskSummaryViewModel[] = []
  const usedChapterIds = new Set<string>()
  const topProblemChapter = preferUnusedChapter(
    chapters,
    usedChapterIds,
    (chapter) => Boolean(chapter.primaryProblemLabel),
    'unresolvedCount',
  )

  if (topProblemChapter) {
    const record = chapterRecordsById[topProblemChapter.chapterId]
    const problem = record?.inspector.problemsSummary[0]
    if (problem) {
      highlights.push({
        chapterId: topProblemChapter.chapterId,
        kind: 'problem',
        label: readLocalizedChapterText(problem.label, locale),
        detail: readLocalizedChapterText(problem.detail, locale),
      })
      usedChapterIds.add(topProblemChapter.chapterId)
    }
  }

  const topMissingDraftChapter = preferUnusedChapter(
    chapters,
    usedChapterIds,
    (chapter) => chapter.missingDraftCount > 0,
    'missingDraftCount',
  )

  if (topMissingDraftChapter) {
    const record = chapterRecordsById[topMissingDraftChapter.chapterId]
    const missingDraftTitles = getMissingSceneTitles(
      record?.scenes ?? [],
      locale,
      (scene) => !isSceneDrafted(sceneProseBySceneId[scene.id]),
    )
    highlights.push({
      chapterId: topMissingDraftChapter.chapterId,
      kind: 'missing_draft',
      label: formatSceneCountLabel(topMissingDraftChapter.missingDraftCount, locale, 'draft'),
      detail: formatMissingSceneDetail(missingDraftTitles, locale, 'draft'),
    })
    usedChapterIds.add(topMissingDraftChapter.chapterId)
  }

  const topMissingTraceChapter = preferUnusedChapter(
    chapters,
    usedChapterIds,
    (chapter) => chapter.missingTraceSceneCount > 0,
    'missingTraceSceneCount',
  )

  if (topMissingTraceChapter) {
    const record = chapterRecordsById[topMissingTraceChapter.chapterId]
    const missingTraceTitles = getMissingSceneTitles(
      record?.scenes ?? [],
      locale,
      (scene) => !isSceneTraced(traceRollupsBySceneId[scene.id]),
    )
    highlights.push({
      chapterId: topMissingTraceChapter.chapterId,
      kind: 'missing_trace',
      label: formatSceneCountLabel(topMissingTraceChapter.missingTraceSceneCount, locale, 'trace'),
      detail: formatMissingSceneDetail(missingTraceTitles, locale, 'trace'),
    })
  }

  return highlights
}

export function buildBookStructureWorkspaceViewModel({
  record,
  locale,
  selectedChapterId,
  chapterWorkspacesById,
  sceneProseBySceneId,
  traceRollupsBySceneId,
}: BuildBookStructureWorkspaceViewModelInput): BookStructureWorkspaceViewModel {
  const chapterRecords = record.chapterIds
    .map((chapterId) => chapterWorkspacesById[chapterId] ?? null)
    .filter((chapter): chapter is ChapterStructureWorkspaceRecord => chapter !== null)
  const chapterRecordsById = Object.fromEntries(chapterRecords.map((chapter) => [chapter.chapterId, chapter]))
  const chapters = chapterRecords.map((chapter, index) =>
    buildChapterViewModel(chapter, index + 1, locale, sceneProseBySceneId, traceRollupsBySceneId),
  )
  const resolvedSelectedChapterId =
    chapters.find((chapter) => chapter.chapterId === selectedChapterId)?.chapterId ?? chapters[0]?.chapterId ?? null
  const selectedChapter = chapters.find((chapter) => chapter.chapterId === resolvedSelectedChapterId) ?? null
  const totals = buildBookStructureTotalsViewModel(chapters)
  const riskHighlights = buildBookRiskHighlights(
    chapters,
    chapterRecordsById,
    locale,
    sceneProseBySceneId,
    traceRollupsBySceneId,
  )

  return {
    bookId: record.bookId,
    title: readLocalizedBookText(record.title, locale),
    summary: readLocalizedBookText(record.summary, locale),
    selectedChapterId: resolvedSelectedChapterId,
    chapters,
    selectedChapter,
    totals,
    inspector: {
      selectedChapter,
      overview: totals,
      riskHighlights,
    },
    dockSummary: {
      selectedChapter,
      unresolvedCount: totals.unresolvedCount,
      missingDraftCount: totals.missingDraftCount,
      missingTraceSceneCount: totals.missingTraceSceneCount,
      warningsCount: totals.warningsCount,
      problemItems: riskHighlights,
    },
    viewsMeta: record.viewsMeta,
  }
}
