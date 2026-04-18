import type { Locale } from '@/app/i18n'

import type { BookManuscriptCheckpointRecord } from '../api/book-manuscript-checkpoints'
import { readLocalizedBookText } from '../api/book-records'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type {
  BookManuscriptCheckpointViewModel,
  BookManuscriptCompareChapterViewModel,
  BookManuscriptCompareDelta,
  BookManuscriptCompareSceneViewModel,
  BookManuscriptCompareTotalsViewModel,
  BookManuscriptCompareWorkspaceViewModel,
  BookManuscriptSnapshotChapterViewModel,
  BookManuscriptSnapshotSceneViewModel,
  BookManuscriptSnapshotViewModel,
} from '../types/book-compare-view-models'

interface CompareBookManuscriptSnapshotsInput {
  current: BookManuscriptSnapshotViewModel
  checkpoint: BookManuscriptCheckpointViewModel
  selectedChapterId?: string | null
}

interface BuildSceneDeltaInput {
  currentScene?: BookManuscriptSnapshotSceneViewModel
  checkpointScene?: BookManuscriptSnapshotSceneViewModel
}

function trimText(value?: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function excerpt(text?: string) {
  return trimText(text)?.slice(0, 180)
}

function createEmptyTotals(): BookManuscriptCompareTotalsViewModel {
  return {
    sceneCount: 0,
    missingCount: 0,
    addedCount: 0,
    draftMissingCount: 0,
    changedCount: 0,
    unchangedCount: 0,
    wordDelta: 0,
    traceRegressionCount: 0,
    warningsDelta: 0,
  }
}

function isTraceRegression(scene: Pick<BookManuscriptCompareSceneViewModel, 'checkpointScene' | 'currentScene'>) {
  return Boolean(scene.checkpointScene?.traceReady && !scene.currentScene?.traceReady)
}

function accumulateDelta(totals: BookManuscriptCompareTotalsViewModel, scene: BookManuscriptCompareSceneViewModel) {
  totals.sceneCount += 1
  totals.wordDelta += scene.wordDelta
  totals.warningsDelta += scene.warningsDelta
  if (isTraceRegression(scene)) {
    totals.traceRegressionCount += 1
  }

  if (scene.delta === 'missing') {
    totals.missingCount += 1
  } else if (scene.delta === 'added') {
    totals.addedCount += 1
  } else if (scene.delta === 'draft_missing') {
    totals.draftMissingCount += 1
  } else if (scene.delta === 'changed') {
    totals.changedCount += 1
  } else {
    totals.unchangedCount += 1
  }
}

function buildChapterCompare(
  currentChapter: BookManuscriptSnapshotChapterViewModel | undefined,
  checkpointChapter: BookManuscriptSnapshotChapterViewModel | undefined,
): BookManuscriptCompareChapterViewModel {
  const orderedSceneIds = [
    ...(currentChapter?.scenes.map((scene) => scene.sceneId) ?? []),
    ...((checkpointChapter?.scenes ?? [])
      .map((scene) => scene.sceneId)
      .filter((sceneId) => !(currentChapter?.scenes ?? []).some((scene) => scene.sceneId === sceneId))),
  ]

  const scenes: BookManuscriptCompareSceneViewModel[] = orderedSceneIds.map((sceneId) =>
    buildSceneDelta({
      currentScene: currentChapter?.scenes.find((scene) => scene.sceneId === sceneId),
      checkpointScene: checkpointChapter?.scenes.find((scene) => scene.sceneId === sceneId),
    }),
  )

  const totals = createEmptyTotals()
  for (const scene of scenes) {
    accumulateDelta(totals, scene)
  }

  return {
    chapterId: currentChapter?.chapterId ?? checkpointChapter?.chapterId ?? 'chapter-missing',
    order: currentChapter?.order ?? checkpointChapter?.order ?? 0,
    title: currentChapter?.title ?? checkpointChapter?.title ?? '',
    summary: currentChapter?.summary ?? checkpointChapter?.summary ?? '',
    scenes,
    totals,
    wordDelta: totals.wordDelta,
    traceRegressionCount: totals.traceRegressionCount,
    warningsDelta: totals.warningsDelta,
  }
}

export function buildCurrentManuscriptSnapshotFromBookDraft(
  workspace: BookDraftWorkspaceViewModel,
): BookManuscriptSnapshotViewModel {
  return {
    bookId: workspace.bookId,
    title: workspace.title,
    summary: workspace.summary,
    selectedChapterId: workspace.selectedChapterId,
    chapters: workspace.chapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      order: chapter.order,
      title: chapter.title,
      summary: chapter.summary,
      scenes: chapter.sections.map((section) => ({
        sceneId: section.sceneId,
        order: section.order,
        title: section.title,
        summary: section.summary,
        proseDraft: section.proseDraft,
        draftWordCount: section.draftWordCount,
        warningsCount: section.warningsCount,
        traceReady: section.traceReady,
      })),
    })),
  }
}

export function normalizeBookManuscriptCheckpoint(
  record: BookManuscriptCheckpointRecord,
  locale: Locale,
): BookManuscriptCheckpointViewModel {
  return {
    checkpointId: record.checkpointId,
    bookId: record.bookId,
    title: readLocalizedBookText(record.title, locale),
    summary: readLocalizedBookText(record.summary, locale),
    chapters: record.chapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      order: chapter.order,
      title: readLocalizedBookText(chapter.title, locale),
      summary: readLocalizedBookText(chapter.summary, locale),
      scenes: chapter.scenes.map((scene) => ({
        sceneId: scene.sceneId,
        order: scene.order,
        title: readLocalizedBookText(scene.title, locale),
        summary: readLocalizedBookText(scene.summary, locale),
        proseDraft: scene.proseDraft,
        draftWordCount: scene.draftWordCount,
        warningsCount: scene.warningsCount,
        traceReady: scene.traceReady,
      })),
    })),
  }
}

export function buildSceneDelta({
  currentScene,
  checkpointScene,
}: BuildSceneDeltaInput): BookManuscriptCompareSceneViewModel {
  const currentTrimmed = trimText(currentScene?.proseDraft)
  const checkpointTrimmed = trimText(checkpointScene?.proseDraft)
  const currentWordCount = currentScene?.draftWordCount
  const checkpointWordCount = checkpointScene?.draftWordCount
  const traceReadyChanged = Boolean(
    currentScene &&
      checkpointScene &&
      currentScene.traceReady !== checkpointScene.traceReady,
  )
  const warningsDelta = (currentScene?.warningsCount ?? 0) - (checkpointScene?.warningsCount ?? 0)
  const wordDelta = (currentWordCount ?? 0) - (checkpointWordCount ?? 0)

  let delta: BookManuscriptCompareDelta
  if (checkpointScene && !currentScene) {
    delta = 'missing'
  } else if (currentScene && !currentTrimmed) {
    delta = 'draft_missing'
  } else if (currentScene && !checkpointScene) {
    delta = 'added'
  } else if (
    currentScene &&
    checkpointScene &&
    (currentTrimmed !== checkpointTrimmed ||
      currentWordCount !== checkpointWordCount ||
      traceReadyChanged ||
      warningsDelta !== 0)
  ) {
    delta = 'changed'
  } else {
    delta = 'unchanged'
  }

  return {
    sceneId: currentScene?.sceneId ?? checkpointScene?.sceneId ?? 'scene-missing',
    order: currentScene?.order ?? checkpointScene?.order ?? 0,
    title: currentScene?.title ?? checkpointScene?.title ?? '',
    summary: currentScene?.summary ?? checkpointScene?.summary ?? '',
    delta,
    currentScene,
    checkpointScene,
    currentWordCount,
    checkpointWordCount,
    wordDelta,
    traceReadyChanged,
    warningsDelta,
    currentExcerpt: excerpt(currentScene?.proseDraft),
    checkpointExcerpt: excerpt(checkpointScene?.proseDraft),
  }
}

export function compareBookManuscriptSnapshots({
  current,
  checkpoint,
  selectedChapterId,
}: CompareBookManuscriptSnapshotsInput): BookManuscriptCompareWorkspaceViewModel {
  const orderedChapterIds = [
    ...current.chapters.map((chapter) => chapter.chapterId),
    ...checkpoint.chapters.map((chapter) => chapter.chapterId).filter((chapterId) => !current.chapters.some((chapter) => chapter.chapterId === chapterId)),
  ]

  const chapters = orderedChapterIds.map((chapterId) =>
    buildChapterCompare(
      current.chapters.find((chapter) => chapter.chapterId === chapterId),
      checkpoint.chapters.find((chapter) => chapter.chapterId === chapterId),
    ),
  )

  const fallbackSelectedChapterId = selectedChapterId ?? current.selectedChapterId ?? chapters[0]?.chapterId ?? null
  const selectedChapter = chapters.find((chapter) => chapter.chapterId === fallbackSelectedChapterId) ?? chapters[0] ?? null
  const totals = chapters.reduce<BookManuscriptCompareWorkspaceViewModel['totals']>(
    (accumulator, chapter) => ({
      chapterCount: accumulator.chapterCount + 1,
      sceneCount: accumulator.sceneCount + chapter.totals.sceneCount,
      missingCount: accumulator.missingCount + chapter.totals.missingCount,
      addedCount: accumulator.addedCount + chapter.totals.addedCount,
      draftMissingCount: accumulator.draftMissingCount + chapter.totals.draftMissingCount,
      changedCount: accumulator.changedCount + chapter.totals.changedCount,
      unchangedCount: accumulator.unchangedCount + chapter.totals.unchangedCount,
      wordDelta: accumulator.wordDelta + chapter.totals.wordDelta,
      traceRegressionCount: accumulator.traceRegressionCount + chapter.totals.traceRegressionCount,
      warningsDelta: accumulator.warningsDelta + chapter.totals.warningsDelta,
    }),
    {
      chapterCount: 0,
      ...createEmptyTotals(),
    },
  )

  return {
    bookId: current.bookId,
    title: current.title,
    summary: current.summary,
    checkpoint: {
      checkpointId: checkpoint.checkpointId,
      bookId: checkpoint.bookId,
      title: checkpoint.title,
      summary: checkpoint.summary,
    },
    selectedChapterId: selectedChapter?.chapterId ?? null,
    chapters,
    selectedChapter,
    totals,
  }
}
