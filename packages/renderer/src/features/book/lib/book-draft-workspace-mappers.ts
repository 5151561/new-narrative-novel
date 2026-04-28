import type { Locale } from '@/app/i18n'
import { readLocalizedChapterText, type ChapterStructureWorkspaceRecord } from '@/features/chapter/api/chapter-records'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import type {
  BookDraftAssemblyChapterHeadingSectionRecord,
  BookDraftAssemblyChapterRecord,
  BookDraftAssemblyManuscriptSectionRecord,
  BookDraftAssemblyRecord,
  BookDraftAssemblyReadableManuscriptRecord,
  BookDraftAssemblySceneRecord,
  BookDraftAssemblySourceManifestEntryRecord,
  BookDraftAssemblyTransitionManuscriptSectionRecord,
} from '../api/book-draft-assembly-records'
import { readLocalizedBookText, type BookStructureRecord } from '../api/book-records'
import type { BookSceneTraceRollup } from '../types/book-view-models'
import type {
  BookDraftChapterViewModel,
  BookDraftDockSummaryItem,
  BookDraftDockSummaryViewModel,
  BookDraftInspectorSelectedChapterViewModel,
  BookDraftManuscriptSectionViewModel,
  BookDraftReadableManuscriptViewModel,
  BookDraftSceneSectionViewModel,
  BookDraftSourceManifestEntryViewModel,
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

function buildChapterHeadingLabel(locale: Locale, order: number, title: string) {
  return locale === 'zh-CN' ? `第 ${order} 章：${title}` : `Chapter ${order}: ${title}`
}

function buildSceneHeadingLabel(locale: Locale, order: number, title: string) {
  return locale === 'zh-CN' ? `场景 ${order}：${title}` : `Scene ${order}: ${title}`
}

function buildManuscriptGapLabel(locale: Locale, gapReason: string) {
  return locale === 'zh-CN' ? `缺稿：${gapReason}` : `Manuscript gap: ${gapReason}`
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

function buildChapterViewModelFromSections(input: {
  chapterId: string
  order: number
  title: string
  summary: string
  sections: BookDraftSceneSectionViewModel[]
}): BookDraftChapterViewModel {
  const { chapterId, order, title, summary, sections } = input
  const draftedSceneCount = sections.filter((section) => !section.isMissingDraft).length
  const tracedSceneCount = sections.filter((section) => section.traceReady).length
  const missingDraftCount = sections.filter((section) => section.isMissingDraft).length
  const warningsCount = sections.reduce((total, section) => total + section.warningsCount, 0)
  const queuedRevisionCount = sections.reduce((total, section) => total + (section.revisionQueueCount ?? 0), 0)
  const assembledWordCount = sections.reduce((total, section) => total + (section.draftWordCount ?? 0), 0)

  return {
    chapterId,
    order,
    title,
    summary,
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

  return buildChapterViewModelFromSections({
    chapterId: chapterRecord.chapterId,
    order,
    title: readLocalizedChapterText(chapterRecord.title, locale),
    summary: readLocalizedChapterText(chapterRecord.summary, locale),
    sections,
  })
}

function buildAssemblySectionViewModel(
  sceneRecord: BookDraftAssemblySceneRecord,
  locale: Locale,
): BookDraftSceneSectionViewModel {
  const proseDraft = sceneRecord.kind === 'draft' ? sceneRecord.proseDraft : undefined
  const draftWordCount = deriveWordCount(proseDraft, sceneRecord.draftWordCount)
  const latestDiffSummary =
    sceneRecord.kind === 'gap'
      ? readLocalizedBookText(sceneRecord.gapReason, locale)
      : sceneRecord.latestDiffSummary

  return {
    sceneId: sceneRecord.sceneId,
    order: sceneRecord.order,
    title: readLocalizedChapterText(sceneRecord.title, locale),
    summary: readLocalizedChapterText(sceneRecord.summary, locale),
    proseDraft,
    draftWordCount,
    isMissingDraft: sceneRecord.kind === 'gap' || !(proseDraft && proseDraft.trim().length > 0),
    warningsCount: sceneRecord.warningsCount,
    revisionQueueCount: sceneRecord.revisionQueueCount,
    traceReady: sceneRecord.traceReady,
    relatedAssetCount: sceneRecord.traceRollup.relatedAssetCount,
    sourceProposalCount: sceneRecord.traceRollup.sourceProposalCount,
    latestDiffSummary,
  }
}

function buildAssemblyChapterViewModel(
  chapterRecord: BookDraftAssemblyChapterRecord,
  locale: Locale,
): BookDraftChapterViewModel {
  const sections = [...chapterRecord.scenes]
    .sort((left, right) => left.order - right.order)
    .map((sceneRecord) => buildAssemblySectionViewModel(sceneRecord, locale))

  return buildChapterViewModelFromSections({
    chapterId: chapterRecord.chapterId,
    order: chapterRecord.order,
    title: readLocalizedChapterText(chapterRecord.title, locale),
    summary: readLocalizedChapterText(chapterRecord.summary, locale),
    sections,
  })
}

function mapReadableManuscriptSectionRecord(
  section: BookDraftAssemblyManuscriptSectionRecord,
  locale: Locale,
): BookDraftManuscriptSectionViewModel {
  if (section.kind === 'chapter-heading') {
    return {
      kind: section.kind,
      chapterId: section.chapterId,
      chapterOrder: section.chapterOrder,
      chapterTitle: readLocalizedBookText(section.chapterTitle, locale),
      summary: readLocalizedBookText(section.summary, locale),
      assembledWordCount: section.assembledWordCount,
      missingDraftCount: section.missingDraftCount,
    }
  }

  if (section.kind === 'scene-draft' || section.kind === 'scene-gap') {
    return {
      kind: section.kind,
      chapterId: section.chapterId,
      chapterOrder: section.chapterOrder,
      chapterTitle: readLocalizedBookText(section.chapterTitle, locale),
      sceneId: section.sceneId,
      sceneOrder: section.sceneOrder,
      sceneTitle: readLocalizedBookText(section.sceneTitle, locale),
      sceneSummary: readLocalizedBookText(section.sceneSummary, locale),
      proseDraft: section.proseDraft,
      gapReason: section.gapReason ? readLocalizedBookText(section.gapReason, locale) : undefined,
      draftWordCount: section.draftWordCount,
      traceReady: section.traceReady,
    }
  }

  return {
    kind: section.kind,
    chapterId: section.chapterId,
    chapterOrder: section.chapterOrder,
    chapterTitle: readLocalizedBookText(section.chapterTitle, locale),
    fromSceneId: section.fromSceneId,
    toSceneId: section.toSceneId,
    fromSceneTitle: readLocalizedBookText(section.fromSceneTitle, locale),
    toSceneTitle: readLocalizedBookText(section.toSceneTitle, locale),
    transitionProse: section.transitionProse,
    artifactId: section.artifactId,
    gapReason: section.gapReason ? readLocalizedBookText(section.gapReason, locale) : undefined,
  }
}

function mapSourceManifestEntryRecord(
  entry: BookDraftAssemblySourceManifestEntryRecord,
  locale: Locale,
): BookDraftSourceManifestEntryViewModel {
  return {
    kind: entry.kind,
    chapterId: entry.chapterId,
    chapterOrder: entry.chapterOrder,
    chapterTitle: readLocalizedBookText(entry.chapterTitle, locale),
    sceneId: entry.sceneId,
    sceneOrder: entry.sceneOrder,
    sceneTitle: entry.sceneTitle ? readLocalizedBookText(entry.sceneTitle, locale) : undefined,
    fromSceneId: entry.fromSceneId,
    toSceneId: entry.toSceneId,
    sourcePatchId: entry.sourcePatchId,
    sourceProposalIds: [...entry.sourceProposalIds],
    acceptedFactIds: [...entry.acceptedFactIds],
    artifactId: entry.artifactId,
    traceReady: entry.traceReady,
    draftWordCount: entry.draftWordCount,
    gapReason: entry.gapReason ? readLocalizedBookText(entry.gapReason, locale) : undefined,
  }
}

function mapReadableManuscriptRecord(
  record: BookDraftAssemblyReadableManuscriptRecord,
  locale: Locale,
): BookDraftReadableManuscriptViewModel {
  return {
    formatVersion: record.formatVersion,
    markdown: record.markdown,
    plainText: record.plainText,
    sections: record.sections.map((section) => mapReadableManuscriptSectionRecord(section, locale)),
    sourceManifest: record.sourceManifest.map((entry) => mapSourceManifestEntryRecord(entry, locale)),
  }
}

function buildFallbackReadableManuscript(input: {
  title: string
  summary: string
  chapters: BookDraftChapterViewModel[]
  locale: Locale
}): BookDraftReadableManuscriptViewModel {
  const { title, summary, chapters, locale } = input
  const sections: BookDraftManuscriptSectionViewModel[] = []
  const sourceManifest: BookDraftSourceManifestEntryViewModel[] = []
  const markdownLines = [`# ${title}`]
  const plainTextLines = [title]

  if (summary.trim()) {
    markdownLines.push('', summary)
    plainTextLines.push('', summary)
  }

  for (const chapter of chapters) {
    sections.push({
      kind: 'chapter-heading',
      chapterId: chapter.chapterId,
      chapterOrder: chapter.order,
      chapterTitle: chapter.title,
      summary: chapter.summary,
      assembledWordCount: chapter.assembledWordCount,
      missingDraftCount: chapter.missingDraftCount,
    })

    const chapterHeading = buildChapterHeadingLabel(locale, chapter.order, chapter.title)
    markdownLines.push('', `## ${chapterHeading}`)
    plainTextLines.push('', chapterHeading)

    if (chapter.summary.trim()) {
      markdownLines.push('', chapter.summary)
      plainTextLines.push(chapter.summary)
    }

    for (const section of chapter.sections) {
      const sceneHeading = buildSceneHeadingLabel(locale, section.order, section.title)
      const gapReason = section.latestDiffSummary?.trim() || buildMissingDraftCopy(locale)
      sections.push({
        kind: section.isMissingDraft ? 'scene-gap' : 'scene-draft',
        chapterId: chapter.chapterId,
        chapterOrder: chapter.order,
        chapterTitle: chapter.title,
        sceneId: section.sceneId,
        sceneOrder: section.order,
        sceneTitle: section.title,
        sceneSummary: section.summary,
        proseDraft: section.proseDraft,
        gapReason: section.isMissingDraft ? gapReason : undefined,
        draftWordCount: section.draftWordCount,
        traceReady: section.traceReady,
      })
      sourceManifest.push({
        kind: section.isMissingDraft ? 'scene-gap' : 'scene-draft',
        chapterId: chapter.chapterId,
        chapterOrder: chapter.order,
        chapterTitle: chapter.title,
        sceneId: section.sceneId,
        sceneOrder: section.order,
        sceneTitle: section.title,
        sourceProposalIds: [],
        acceptedFactIds: [],
        traceReady: section.traceReady,
        draftWordCount: section.draftWordCount,
        gapReason: section.isMissingDraft ? gapReason : undefined,
      })

      markdownLines.push('', `### ${sceneHeading}`)
      plainTextLines.push('', sceneHeading)
      if (section.isMissingDraft) {
        markdownLines.push('', `> ${buildManuscriptGapLabel(locale, gapReason)}`)
        plainTextLines.push(`[${buildManuscriptGapLabel(locale, gapReason)}]`)
      } else if (section.proseDraft?.trim()) {
        markdownLines.push('', section.proseDraft)
        plainTextLines.push(section.proseDraft)
      }
    }
  }

  return {
    formatVersion: 'book-manuscript-assembly-v1',
    markdown: markdownLines.join('\n').trim(),
    plainText: plainTextLines.join('\n').trim(),
    sections,
    sourceManifest,
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

function buildBookDraftWorkspaceFromChapters(input: {
  bookId: string
  title: string
  summary: string
  locale: Locale
  selectedChapterId?: string | null
  chapters: BookDraftChapterViewModel[]
  readableManuscript?: BookDraftReadableManuscriptViewModel
}): BookDraftWorkspaceViewModel {
  const { bookId, title, summary, locale, selectedChapterId, chapters } = input
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
    bookId,
    title,
    summary,
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
    readableManuscript: input.readableManuscript ?? buildFallbackReadableManuscript({
      title,
      summary,
      chapters,
      locale,
    }),
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

  return buildBookDraftWorkspaceFromChapters({
    bookId: record.bookId,
    title: readLocalizedBookText(record.title, locale),
    summary: readLocalizedBookText(record.summary, locale),
    locale,
    selectedChapterId,
    chapters,
  })
}

export function buildBookDraftWorkspaceViewModelFromAssemblyRecord({
  record,
  locale,
  selectedChapterId,
}: {
  record: BookDraftAssemblyRecord
  locale: Locale
  selectedChapterId?: string | null
}): BookDraftWorkspaceViewModel {
  const chapters = [...record.chapters]
    .sort((left, right) => left.order - right.order)
    .map((chapterRecord) => buildAssemblyChapterViewModel(chapterRecord, locale))

  return buildBookDraftWorkspaceFromChapters({
    bookId: record.bookId,
    title: readLocalizedBookText(record.title, locale),
    summary: readLocalizedBookText(record.summary, locale),
    locale,
    selectedChapterId,
    chapters,
    readableManuscript: mapReadableManuscriptRecord(record.readableManuscript, locale),
  })
}
