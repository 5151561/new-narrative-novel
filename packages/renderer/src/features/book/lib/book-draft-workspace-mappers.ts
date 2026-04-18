import type { Locale } from '@/app/i18n'
import { readLocalizedChapterText, type ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import { readLocalizedBookText, type BookStructureRecord } from '../api/book-records'
import type { BookSceneTraceRollup } from '../types/book-view-models'
import type {
  BookDraftChapterViewModel,
  BookDraftDockSummaryItem,
  BookDraftDockSummaryViewModel,
  BookDraftInspectorSelectedChapterViewModel,
  BookDraftSceneSectionViewModel,
  BookDraftWorkspaceViewModel,
} from '../types/book-draft-view-models'

interface BuildBookDraftWorkspaceViewModelInput {
  record: BookStructureRecord
  locale: Locale
  selectedChapterId?: string | null
  chapterWorkspacesById: Record<string, ChapterStructureWorkspaceRecord | null | undefined>
  sceneProseBySceneId: Record<string, SceneProseViewModel | null | undefined>
  sceneProseStateBySceneId: Record<string, { error: Error | null } | undefined>
  traceRollupsBySceneId: Record<string, BookSceneTraceRollup | null | undefined>
}

function deriveWordCount(proseDraft?: string, draftWordCount?: number) {
  if (draftWordCount !== undefined) {
    return draftWordCount
  }

  const trimmed = proseDraft?.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.split(/\s+/).length
}

function isSceneTraced(trace: BookSceneTraceRollup | null | undefined) {
  if (!trace) {
    return false
  }

  return !trace.missingLinks.includes('trace')
}

function buildCoverageStatus(
  sceneCount: number,
  draftedSceneCount: number,
  tracedSceneCount: number,
): BookDraftChapterViewModel['coverageStatus'] {
  if (sceneCount === 0 || (draftedSceneCount === 0 && tracedSceneCount === 0)) {
    return 'missing'
  }

  if (draftedSceneCount < sceneCount || tracedSceneCount < sceneCount) {
    return 'attention'
  }

  return 'ready'
}

function localizeCount(locale: Locale, count: number, singular: string, plural: string, zhUnit: string) {
  if (locale === 'zh-CN') {
    return `${count}${zhUnit}`
  }

  return `${count} ${count === 1 ? singular : plural}`
}

function buildMissingDraftCopy(locale: Locale) {
  return locale === 'zh-CN'
    ? '保持章节顺序不变，等 scene draft 准备好后再回到这里连续阅读。'
    : 'Keep the chapter order stable, then return here once the scene draft is ready.'
}

function buildTraceCoverageFallbackCopy(locale: Locale) {
  return locale === 'zh-CN'
    ? '当前还没有可汇总的溯源覆盖说明。'
    : 'No trace coverage note is available yet.'
}

function buildMissingSceneDetail(locale: Locale, titles: string[], noun: 'draft' | 'trace') {
  if (titles.length === 0) {
    return locale === 'zh-CN'
      ? noun === 'draft'
        ? '当前没有缺稿场景。'
        : '当前没有缺溯源场景。'
      : noun === 'draft'
        ? 'No scenes are currently missing draft.'
        : 'No scenes are currently missing trace.'
  }

  const joined = locale === 'zh-CN' ? titles.join('、') : titles.join(', ')
  if (locale === 'zh-CN') {
    return noun === 'draft' ? `${joined} 还没有正文草稿。` : `${joined} 还没有 trace rollup。`
  }

  return noun === 'draft' ? `${joined} still have no prose draft.` : `${joined} still have no trace rollup.`
}

function buildQueuedRevisionDetail(locale: Locale, count: number) {
  return locale === 'zh-CN' ? `待处理修订 ${count}` : `${count} queued ${count === 1 ? 'revision' : 'revisions'}`
}

function buildPressureDetail(locale: Locale, warningsCount: number, queuedRevisionCount: number) {
  if (locale === 'zh-CN') {
    return `警告 ${warningsCount} / 待处理修订 ${queuedRevisionCount}`
  }

  return `Warnings ${warningsCount} / Queued revisions ${queuedRevisionCount}`
}

function buildSectionViewModel(
  record: ChapterStructureWorkspaceRecord,
  locale: Locale,
  sceneId: string,
): (input: { sceneProseBySceneId: Record<string, SceneProseViewModel | null | undefined>; sceneProseStateBySceneId: Record<string, { error: Error | null } | undefined>; traceRollupsBySceneId: Record<string, BookSceneTraceRollup | null | undefined> }) => BookDraftSceneSectionViewModel {
  const scene = record.scenes.find((item) => item.id === sceneId)
  if (!scene) {
    throw new Error(`Unknown scene "${sceneId}" in chapter "${record.chapterId}"`)
  }

  return ({ sceneProseBySceneId, sceneProseStateBySceneId, traceRollupsBySceneId }) => {
    const prose = sceneProseBySceneId[scene.id]
    const proseState = sceneProseStateBySceneId[scene.id]
    const trace = traceRollupsBySceneId[scene.id]
    const proseDraft = prose?.proseDraft
    const draftWordCount = deriveWordCount(proseDraft, prose?.draftWordCount)
    const hasConcreteMissingDraft = prose ? !(prose.proseDraft && prose.proseDraft.trim().length > 0) : false

    return {
      sceneId: scene.id,
      order: scene.order,
      title: readLocalizedChapterText(scene.title, locale),
      summary: readLocalizedChapterText(scene.summary, locale),
      proseDraft,
      draftWordCount,
      isMissingDraft: hasConcreteMissingDraft,
      warningsCount: prose?.warningsCount ?? 0,
      revisionQueueCount: prose?.revisionQueueCount,
      traceReady: isSceneTraced(trace),
      relatedAssetCount: trace?.relatedAssetCount ?? 0,
      sourceProposalCount: trace?.sourceProposalCount ?? 0,
      latestDiffSummary: prose?.latestDiffSummary ?? proseState?.error?.message,
    }
  }
}

function buildChapterViewModel(
  chapterRecord: ChapterStructureWorkspaceRecord,
  order: number,
  locale: Locale,
  sceneProseBySceneId: Record<string, SceneProseViewModel | null | undefined>,
  sceneProseStateBySceneId: Record<string, { error: Error | null } | undefined>,
  traceRollupsBySceneId: Record<string, BookSceneTraceRollup | null | undefined>,
): BookDraftChapterViewModel {
  const sections = [...chapterRecord.scenes]
    .sort((left, right) => left.order - right.order)
    .map((scene) =>
      buildSectionViewModel(chapterRecord, locale, scene.id)({
        sceneProseBySceneId,
        sceneProseStateBySceneId,
        traceRollupsBySceneId,
      }),
    )
  const draftedSceneCount = sections.filter((section) => !section.isMissingDraft).length
  const tracedSceneCount = sections.filter((section) => section.traceReady).length
  const missingDraftCount = sections.filter((section) => section.isMissingDraft).length
  const warningsCount = sections.reduce((total, section) => total + section.warningsCount, 0)
  const queuedRevisionCount = sections.reduce((total, section) => total + (section.revisionQueueCount ?? 0), 0)
  const assembledWordCount = sections.reduce((total, section) => total + (section.draftWordCount ?? 0), 0)

  return {
    chapterId: chapterRecord.chapterId,
    order,
    title: readLocalizedChapterText(chapterRecord.title, locale),
    summary: readLocalizedChapterText(chapterRecord.summary, locale),
    sceneCount: sections.length,
    draftedSceneCount,
    missingDraftCount,
    assembledWordCount,
    warningsCount,
    queuedRevisionCount,
    tracedSceneCount,
    missingTraceSceneCount: sections.length - tracedSceneCount,
    sections,
    assembledProseSections: sections.map((section) => section.proseDraft?.trim()).filter(Boolean) as string[],
    coverageStatus: buildCoverageStatus(sections.length, draftedSceneCount, tracedSceneCount),
  }
}

function buildInspectorSelectedChapter(
  locale: Locale,
  selectedChapter: BookDraftChapterViewModel | null,
): BookDraftInspectorSelectedChapterViewModel | null {
  if (!selectedChapter) {
    return null
  }

  const topMissingSceneTitles = selectedChapter.sections
    .filter((section) => section.isMissingDraft || !section.traceReady)
    .slice(0, 3)
    .map((section) => section.title)
  const topLatestDiffSummary = selectedChapter.sections
    .map((section) => section.latestDiffSummary?.trim())
    .find(Boolean)
  const traceCoverageNote =
    selectedChapter.missingTraceSceneCount > 0
      ? locale === 'zh-CN'
        ? `${localizeCount(locale, selectedChapter.missingTraceSceneCount, 'scene', 'scenes', '个场景')} 还没有 trace rollup。`
        : `${localizeCount(locale, selectedChapter.missingTraceSceneCount, 'scene', 'scenes', ' scenes')} still need trace rollups.`
      : locale === 'zh-CN'
        ? '当前选中章节的 trace coverage 已就绪。'
        : 'Trace coverage is ready for the selected chapter.'

  return {
    chapterId: selectedChapter.chapterId,
    title: selectedChapter.title,
    summary: selectedChapter.summary,
    draftedSceneCount: selectedChapter.draftedSceneCount,
    missingDraftCount: selectedChapter.missingDraftCount,
    tracedSceneCount: selectedChapter.tracedSceneCount,
    missingTraceSceneCount: selectedChapter.missingTraceSceneCount,
    warningsCount: selectedChapter.warningsCount,
    queuedRevisionCount: selectedChapter.queuedRevisionCount,
    assembledWordCount: selectedChapter.assembledWordCount,
    topMissingSceneTitles,
    topLatestDiffSummary,
    traceCoverageNote,
  }
}

function buildDockItem(chapter: BookDraftChapterViewModel, detail: string): BookDraftDockSummaryItem {
  return {
    chapterId: chapter.chapterId,
    title: chapter.title,
    detail,
  }
}

export function buildBookDraftWorkspaceViewModel({
  record,
  locale,
  selectedChapterId,
  chapterWorkspacesById,
  sceneProseBySceneId,
  sceneProseStateBySceneId,
  traceRollupsBySceneId,
}: BuildBookDraftWorkspaceViewModelInput): BookDraftWorkspaceViewModel {
  const chapters = record.chapterIds.flatMap((chapterId, index) => {
    const chapterRecord = chapterWorkspacesById[chapterId]
    if (!chapterRecord) {
      return []
    }

    return [
      buildChapterViewModel(
        chapterRecord,
        index + 1,
        locale,
        sceneProseBySceneId,
        sceneProseStateBySceneId,
        traceRollupsBySceneId,
      ),
    ]
  })

  const selectedChapter = chapters.find((chapter) => chapter.chapterId === selectedChapterId) ?? chapters[0] ?? null
  const draftedChapterCount = chapters.filter((chapter) => chapter.draftedSceneCount > 0).length
  const missingDraftChapterCount = chapters.filter((chapter) => chapter.missingDraftCount > 0).length
  const assembledWordCount = chapters.reduce((total, chapter) => total + chapter.assembledWordCount, 0)
  const missingTraceChapterCount = chapters.filter((chapter) => chapter.missingTraceSceneCount > 0).length
  const warningHeavyChapterCount = chapters.filter((chapter) => chapter.warningsCount > 0).length
  const inspectorSelectedChapter = buildInspectorSelectedChapter(locale, selectedChapter)
  const allMissingSceneTitles = selectedChapter?.sections
    .filter((section) => section.isMissingDraft || !section.traceReady)
    .slice(0, 4)
    .map((section) => section.title) ?? []
  const latestDiffSummaries = selectedChapter?.sections
    .map((section) => section.latestDiffSummary?.trim())
    .filter((summary): summary is string => Boolean(summary))
    .slice(0, 3) ?? []

  const dockSummary: BookDraftDockSummaryViewModel = {
    missingDraftChapterCount,
    missingTraceChapterCount,
    warningsChapterCount: warningHeavyChapterCount,
    queuedRevisionChapterCount: chapters.filter((chapter) => chapter.queuedRevisionCount > 0).length,
    highestPressureChapters: chapters
      .filter((chapter) => chapter.warningsCount > 0 || chapter.queuedRevisionCount > 0)
      .sort((left, right) => right.warningsCount + right.queuedRevisionCount - (left.warningsCount + left.queuedRevisionCount))
      .slice(0, 3)
      .map((chapter) => buildDockItem(chapter, buildPressureDetail(locale, chapter.warningsCount, chapter.queuedRevisionCount))),
    missingDraftChapters: chapters
      .filter((chapter) => chapter.missingDraftCount > 0)
      .map((chapter) =>
        buildDockItem(
          chapter,
          buildMissingSceneDetail(
            locale,
            chapter.sections.filter((section) => section.isMissingDraft).map((section) => section.title),
            'draft',
          ),
        ),
      ),
    missingTraceChapters: chapters
      .filter((chapter) => chapter.missingTraceSceneCount > 0)
      .map((chapter) =>
        buildDockItem(
          chapter,
          buildMissingSceneDetail(
            locale,
            chapter.sections.filter((section) => !section.traceReady).map((section) => section.title),
            'trace',
          ),
        ),
      ),
    warningsChapters: chapters
      .filter((chapter) => chapter.warningsCount > 0)
      .map((chapter) => buildDockItem(chapter, buildPressureDetail(locale, chapter.warningsCount, chapter.queuedRevisionCount))),
    queuedRevisionChapters: chapters
      .filter((chapter) => chapter.queuedRevisionCount > 0)
      .map((chapter) => buildDockItem(chapter, buildQueuedRevisionDetail(locale, chapter.queuedRevisionCount))),
  }

  return {
    bookId: record.bookId,
    title: readLocalizedBookText(record.title, locale),
    summary: readLocalizedBookText(record.summary, locale),
    selectedChapterId: selectedChapter?.chapterId ?? null,
    chapters,
    selectedChapter,
    assembledWordCount,
    draftedChapterCount,
    missingDraftChapterCount,
    inspector: {
      selectedChapter: inspectorSelectedChapter,
      readiness: {
        draftedChapterCount,
        missingDraftChapterCount,
        assembledWordCount,
        warningHeavyChapterCount,
        missingTraceChapterCount,
      },
      signals: {
        topMissingScenes: allMissingSceneTitles,
        latestDiffSummaries,
        traceCoverageNote:
          inspectorSelectedChapter?.traceCoverageNote ??
          buildTraceCoverageFallbackCopy(locale),
      },
    },
    dockSummary,
  }
}
