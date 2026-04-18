import type { Locale } from '@/app/i18n'

import type { BookDraftDockSummaryItem } from '../types/book-draft-view-models'
import type {
  BookManuscriptCompareChapterViewModel,
  BookManuscriptCompareSceneViewModel,
  BookManuscriptCompareWorkspaceViewModel,
} from '../types/book-compare-view-models'

export type BookDraftCompareChapterStatus = 'attention' | 'changed' | 'stable'

export interface BookDraftCompareProblems {
  changedChapterCount: number
  draftMissingSceneCount: number
  traceRegressionCount: number
  warningsIncreasedChapterCount: number
  checkpointMissingSectionCount: number
  changedChapters: BookDraftDockSummaryItem[]
  missingDraftScenes: BookDraftDockSummaryItem[]
  traceRegressions: BookDraftDockSummaryItem[]
  warningsIncreasedChapters: BookDraftDockSummaryItem[]
  checkpointMissingSections: BookDraftDockSummaryItem[]
}

export interface BookDraftCompareReviewAttention {
  topChangedScenes: string[]
  missingScenes: string[]
  traceRegressionHints: string[]
}

function isTraceRegression(scene: Pick<BookManuscriptCompareSceneViewModel, 'checkpointScene' | 'currentScene'>) {
  return Boolean(scene.checkpointScene?.traceReady && !scene.currentScene?.traceReady)
}

export function getCompareChapterStatus(chapter: BookManuscriptCompareChapterViewModel): BookDraftCompareChapterStatus {
  if (chapter.totals.missingCount > 0 || chapter.totals.draftMissingCount > 0 || chapter.traceRegressionCount > 0) {
    return 'attention'
  }

  if (chapter.totals.changedCount > 0 || chapter.totals.addedCount > 0 || chapter.warningsDelta > 0) {
    return 'changed'
  }

  return 'stable'
}

export function getCompareChapterStatusBadge(
  status: BookDraftCompareChapterStatus,
  locale: Locale,
): { tone: 'warn' | 'accent' | 'success'; label: string } {
  if (status === 'attention') {
    return {
      tone: 'warn',
      label: locale === 'zh-CN' ? '需关注' : 'Attention',
    }
  }

  if (status === 'changed') {
    return {
      tone: 'accent',
      label: locale === 'zh-CN' ? '已变更' : 'Changed',
    }
  }

  return {
    tone: 'success',
    label: locale === 'zh-CN' ? '稳定' : 'Stable',
  }
}

export function buildCompareReviewAttention(
  chapter: BookManuscriptCompareChapterViewModel | null | undefined,
): BookDraftCompareReviewAttention {
  if (!chapter) {
    return {
      topChangedScenes: [],
      missingScenes: [],
      traceRegressionHints: [],
    }
  }

  return {
    topChangedScenes: chapter.scenes
      .filter((scene) => scene.delta === 'changed' || scene.delta === 'added')
      .map((scene) => scene.title)
      .slice(0, 3),
    missingScenes: chapter.scenes
      .filter((scene) => scene.delta === 'missing' || scene.delta === 'draft_missing')
      .map((scene) => scene.title)
      .slice(0, 3),
    traceRegressionHints: chapter.scenes.filter(isTraceRegression).map((scene) => scene.title).slice(0, 3),
  }
}

function formatCompareChapterDetail(chapter: BookManuscriptCompareChapterViewModel, locale: Locale) {
  return locale === 'zh-CN'
    ? `变更 ${chapter.totals.changedCount} / 新增 ${chapter.totals.addedCount} / 缺失 ${chapter.totals.missingCount}`
    : `Changed ${chapter.totals.changedCount} / Added ${chapter.totals.addedCount} / Missing ${chapter.totals.missingCount}`
}

export function buildBookDraftCompareProblems(
  compare: BookManuscriptCompareWorkspaceViewModel | null | undefined,
  locale: Locale,
): BookDraftCompareProblems | null {
  if (!compare) {
    return null
  }

  const changedChapters = compare.chapters.filter(
    (chapter) =>
      chapter.totals.changedCount > 0 ||
      chapter.totals.addedCount > 0 ||
      chapter.totals.missingCount > 0 ||
      chapter.totals.draftMissingCount > 0,
  )
  const draftMissingScenes = compare.chapters.flatMap((chapter) =>
    chapter.scenes
      .filter((scene) => scene.delta === 'draft_missing')
      .map((scene) => ({
        chapterId: `${chapter.chapterId}:${scene.sceneId}`,
        title: chapter.title,
        detail:
          locale === 'zh-CN'
            ? `${scene.title} 当前还没有成稿正文。`
            : `${scene.title} still has no current draft.`,
      })),
  )
  const traceRegressions = compare.chapters.flatMap((chapter) =>
    chapter.scenes.filter(isTraceRegression).map((scene) => ({
      chapterId: `${chapter.chapterId}:${scene.sceneId}`,
      title: chapter.title,
      detail:
        locale === 'zh-CN'
          ? `${scene.title} 的溯源就绪状态发生回退。`
          : `${scene.title} lost trace readiness.`,
    })),
  )
  const warningsIncreasedChapters = compare.chapters
    .filter((chapter) => chapter.warningsDelta > 0)
    .map((chapter) => ({
      chapterId: chapter.chapterId,
      title: chapter.title,
      detail:
        locale === 'zh-CN'
          ? `警告 +${chapter.warningsDelta}`
          : `Warnings +${chapter.warningsDelta}`,
    }))
  const checkpointMissingSections = compare.chapters.flatMap((chapter) =>
    chapter.scenes
      .filter((scene) => scene.delta === 'missing')
      .map((scene) => ({
        chapterId: `${chapter.chapterId}:${scene.sceneId}`,
        title: chapter.title,
        detail:
          locale === 'zh-CN'
            ? `${scene.title} 仅存在于 checkpoint 中。`
            : `${scene.title} only exists in the checkpoint.`,
      })),
  )

  return {
    changedChapterCount: changedChapters.length,
    draftMissingSceneCount: draftMissingScenes.length,
    traceRegressionCount: traceRegressions.length,
    warningsIncreasedChapterCount: warningsIncreasedChapters.length,
    checkpointMissingSectionCount: checkpointMissingSections.length,
    changedChapters: changedChapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      title: chapter.title,
      detail: formatCompareChapterDetail(chapter, locale),
    })),
    missingDraftScenes: draftMissingScenes,
    traceRegressions,
    warningsIncreasedChapters,
    checkpointMissingSections,
  }
}
