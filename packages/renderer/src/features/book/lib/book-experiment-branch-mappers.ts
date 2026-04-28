import type { Locale } from '@/app/i18n'
import type { BookBranchBaseline } from '@/features/workbench/types/workbench-route'

import type { BookExperimentBranchRecord } from '../api/book-experiment-branches'
import type { BookManuscriptCheckpointRecord } from '../api/book-manuscript-checkpoints'
import { readLocalizedBookText } from '../api/book-records'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type {
  BookBranchChapterDeltaViewModel,
  BookBranchDeltaKind,
  BookBranchSceneDeltaViewModel,
  BookExperimentBranchAdoptionRecord,
  BookExperimentBranchBaselineSnapshotViewModel,
  BookExperimentBranchComparisonViewModel,
  BookExperimentBranchReadinessIssueViewModel,
  BookExperimentBranchReadinessViewModel,
  BookExperimentBranchSnapshotChapterViewModel,
  BookExperimentBranchSnapshotSceneViewModel,
  BookExperimentBranchSnapshotViewModel,
  BookExperimentBranchSummaryViewModel,
  BookExperimentBranchWorkspaceTotalsViewModel,
  BookExperimentBranchWorkspaceViewModel,
} from '../types/book-branch-view-models'

interface BuildBranchBaselineSnapshotInput {
  currentDraftWorkspace: BookDraftWorkspaceViewModel
  checkpoint?: BookManuscriptCheckpointRecord | null
  baseline: BookBranchBaseline
  locale: Locale
}

interface CompareBookExperimentBranchToBaselineInput {
  branchSnapshot: BookExperimentBranchSnapshotViewModel
  baselineSnapshot: BookExperimentBranchBaselineSnapshotViewModel
  selectedChapterId?: string | null
}

interface BuildBookExperimentBranchWorkspaceInput {
  currentDraftWorkspace: BookDraftWorkspaceViewModel
  branch?: BookExperimentBranchRecord | null
  branches?: BookExperimentBranchRecord[]
  checkpoint?: BookManuscriptCheckpointRecord | null
  branchBaseline: BookBranchBaseline
  selectedChapterId?: string | null
  locale: Locale
}

interface DeriveBookExperimentBranchReadinessInput {
  chapters: BookBranchChapterDeltaViewModel[]
  branch: BookExperimentBranchSummaryViewModel | null
  baseline: BookExperimentBranchComparisonViewModel['baseline']
  locale: Locale
}

function trimText(value?: string) {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

function excerpt(text?: string) {
  return trimText(text)?.slice(0, 180)
}

function localizeText(locale: Locale, en: string, zhCN: string) {
  return locale === 'zh-CN' ? zhCN : en
}

function buildBranchLabel(locale: Locale, status: BookExperimentBranchSummaryViewModel['status']) {
  const labels = {
    active: localizeText(locale, 'Active branch', '进行中的实验稿'),
    review: localizeText(locale, 'Review branch', '审阅中的实验稿'),
    archived: localizeText(locale, 'Archived branch', '已归档实验稿'),
  } satisfies Record<BookExperimentBranchSummaryViewModel['status'], string>

  return labels[status]
}

function buildCurrentBaselineLabel(locale: Locale) {
  return localizeText(locale, 'Current manuscript', '当前正文')
}

function buildReadinessLabel(locale: Locale, status: BookExperimentBranchReadinessViewModel['status']) {
  if (status === 'blocked') {
    return localizeText(locale, 'Branch blocked', '实验稿已阻塞')
  }

  if (status === 'attention') {
    return localizeText(locale, 'Branch needs attention', '实验稿需要关注')
  }

  return localizeText(locale, 'Branch ready', '实验稿已就绪')
}

function buildEmptyTotals(): BookExperimentBranchWorkspaceTotalsViewModel {
  return {
    changedChapterCount: 0,
    changedSceneCount: 0,
    addedSceneCount: 0,
    missingSceneCount: 0,
    draftMissingSceneCount: 0,
    wordDelta: 0,
    traceRegressionCount: 0,
    traceImprovementCount: 0,
    warningsDelta: 0,
    sourceProposalDelta: 0,
    blockedChapterCount: 0,
    attentionChapterCount: 0,
  }
}

function normalizeBranchScene(
  scene: BookExperimentBranchRecord['chapterSnapshots'][number]['sceneSnapshots'][number],
  locale: Locale,
  order: number,
): BookExperimentBranchSnapshotSceneViewModel {
  return {
    sceneId: scene.sceneId,
    order,
    title: readLocalizedBookText(scene.title, locale),
    summary: readLocalizedBookText(scene.summary, locale),
    proseDraft: scene.proseDraft ? readLocalizedBookText(scene.proseDraft, locale) : undefined,
    draftWordCount: scene.draftWordCount,
    traceReady: scene.traceReady,
    warningsCount: scene.warningsCount,
    sourceProposalCount: scene.sourceProposalCount,
  }
}

function normalizeBranchAdoption(
  adoption: NonNullable<BookExperimentBranchRecord['adoptions']>[number],
  locale: Locale,
): BookExperimentBranchAdoptionRecord {
  return {
    adoptionId: adoption.adoptionId,
    branchId: adoption.branchId,
    bookId: adoption.bookId,
    chapterId: adoption.chapterId,
    sceneId: adoption.sceneId,
    kind: adoption.kind,
    status: adoption.status,
    summary: readLocalizedBookText(adoption.summary, locale),
    createdAtLabel: readLocalizedBookText(adoption.createdAtLabel, locale),
    sourceSignature: adoption.sourceSignature,
  }
}

function isTraceRegression(scene: BookBranchSceneDeltaViewModel) {
  return Boolean(scene.branchScene && scene.baselineScene && scene.baselineScene.traceReady && !scene.branchScene.traceReady)
}

function isTraceImprovement(scene: BookBranchSceneDeltaViewModel) {
  return Boolean(scene.branchScene && scene.baselineScene && scene.branchScene.traceReady && !scene.baselineScene.traceReady)
}

function computeSceneDelta(
  branchScene?: BookExperimentBranchSnapshotSceneViewModel,
  baselineScene?: BookExperimentBranchSnapshotSceneViewModel,
  adoptions: BookExperimentBranchAdoptionRecord[] = [],
): BookBranchSceneDeltaViewModel {
  const branchTrimmed = trimText(branchScene?.proseDraft)
  const baselineTrimmed = trimText(baselineScene?.proseDraft)
  const branchWordCount = branchScene?.draftWordCount
  const baselineWordCount = baselineScene?.draftWordCount
  const warningsDelta = (branchScene?.warningsCount ?? 0) - (baselineScene?.warningsCount ?? 0)
  const sourceProposalDelta =
    branchScene?.sourceProposalCount !== undefined && baselineScene?.sourceProposalCount !== undefined
      ? branchScene.sourceProposalCount - baselineScene.sourceProposalCount
      : 0
  const traceReadyChanged = Boolean(branchScene && baselineScene && branchScene.traceReady !== baselineScene.traceReady)
  const wordDelta = (branchWordCount ?? 0) - (baselineWordCount ?? 0)

  let delta: BookBranchDeltaKind
  if (baselineScene && !branchScene) {
    delta = 'missing'
  } else if (branchScene && !baselineScene) {
    delta = branchTrimmed ? 'added' : 'draft_missing'
  } else if (branchScene && !branchTrimmed) {
    delta = 'draft_missing'
  } else if (
    branchScene &&
    baselineScene &&
    (branchTrimmed !== baselineTrimmed ||
      branchWordCount !== baselineWordCount ||
      traceReadyChanged ||
      warningsDelta !== 0 ||
      (branchScene.sourceProposalCount !== undefined &&
        baselineScene.sourceProposalCount !== undefined &&
        sourceProposalDelta !== 0))
  ) {
    delta = 'changed'
  } else {
    delta = 'unchanged'
  }

  return {
    sceneId: branchScene?.sceneId ?? baselineScene?.sceneId ?? 'scene-missing',
    order: branchScene?.order ?? baselineScene?.order ?? 0,
    title: branchScene?.title ?? baselineScene?.title ?? '',
    summary: branchScene?.summary ?? baselineScene?.summary ?? '',
    delta,
    branchScene,
    baselineScene,
    branchExcerpt: excerpt(branchScene?.proseDraft),
    baselineExcerpt: excerpt(baselineScene?.proseDraft),
    branchWordCount,
    baselineWordCount,
    wordDelta,
    traceReadyChanged,
    warningsDelta,
    sourceProposalDelta,
    branchSourceProposalCount: branchScene?.sourceProposalCount,
    baselineSourceProposalCount: baselineScene?.sourceProposalCount,
    adoptions,
  }
}

function getChapterReadinessStatus(chapter: BookBranchChapterDeltaViewModel): BookBranchChapterDeltaViewModel['readinessStatus'] {
  const hasUntrackedAddedScene = chapter.sceneDeltas.some(
    (scene) => scene.delta === 'added' && (scene.branchSourceProposalCount ?? 0) === 0,
  )

  if (chapter.draftMissingSceneCount > 0) {
    return 'blocked'
  }

  if (chapter.traceRegressionCount > 0 || chapter.warningsDelta > 0 || hasUntrackedAddedScene) {
    return 'attention'
  }

  return 'ready'
}

function compareChapter(
  branchChapter: BookExperimentBranchSnapshotChapterViewModel | undefined,
  baselineChapter: BookExperimentBranchSnapshotChapterViewModel | undefined,
  adoptions: BookExperimentBranchAdoptionRecord[],
): BookBranchChapterDeltaViewModel {
  const orderedSceneIds = [
    ...(branchChapter?.scenes.map((scene) => scene.sceneId) ?? []),
    ...((baselineChapter?.scenes ?? [])
      .map((scene) => scene.sceneId)
      .filter((sceneId) => !(branchChapter?.scenes ?? []).some((scene) => scene.sceneId === sceneId))),
  ]

  const sceneDeltas = orderedSceneIds.map((sceneId) =>
    computeSceneDelta(
      branchChapter?.scenes.find((scene) => scene.sceneId === sceneId),
      baselineChapter?.scenes.find((scene) => scene.sceneId === sceneId),
      adoptions.filter(
        (adoption) =>
          adoption.chapterId === (branchChapter?.chapterId ?? baselineChapter?.chapterId) && adoption.sceneId === sceneId,
      ),
    ),
  )

  const chapter: BookBranchChapterDeltaViewModel = {
    chapterId: branchChapter?.chapterId ?? baselineChapter?.chapterId ?? 'chapter-missing',
    order: branchChapter?.order ?? baselineChapter?.order ?? 0,
    title: branchChapter?.title ?? baselineChapter?.title ?? '',
    summary: branchChapter?.summary ?? baselineChapter?.summary ?? '',
    sceneDeltas,
    changedSceneCount: sceneDeltas.filter((scene) => scene.delta === 'changed').length,
    addedSceneCount: sceneDeltas.filter((scene) => scene.delta === 'added').length,
    missingSceneCount: sceneDeltas.filter((scene) => scene.delta === 'missing').length,
    draftMissingSceneCount: sceneDeltas.filter((scene) => scene.delta === 'draft_missing').length,
    wordDelta: sceneDeltas.reduce((total, scene) => total + scene.wordDelta, 0),
    traceRegressionCount: sceneDeltas.filter(isTraceRegression).length,
    traceImprovementCount: sceneDeltas.filter(isTraceImprovement).length,
    warningsDelta: sceneDeltas.reduce((total, scene) => total + scene.warningsDelta, 0),
    sourceProposalDelta: sceneDeltas.reduce((total, scene) => total + scene.sourceProposalDelta, 0),
    readinessStatus: 'ready',
  }

  chapter.readinessStatus = getChapterReadinessStatus(chapter)
  return chapter
}

export function normalizeBookExperimentBranch(
  record: BookExperimentBranchRecord,
  locale: Locale,
): BookExperimentBranchSummaryViewModel {
  return {
    branchId: record.branchId,
    bookId: record.bookId,
    title: readLocalizedBookText(record.title, locale),
    summary: readLocalizedBookText(record.summary, locale),
    rationale: readLocalizedBookText(record.rationale, locale),
    createdAtLabel: record.createdAtLabel ? readLocalizedBookText(record.createdAtLabel, locale) : buildBranchLabel(locale, record.status),
    basedOnCheckpointId: record.basedOnCheckpointId,
    status: record.status,
    adoptions: (record.adoptions ?? []).map((adoption) => normalizeBranchAdoption(adoption, locale)),
  }
}

export function normalizeBookExperimentBranchSnapshot(
  record: BookExperimentBranchRecord,
  locale: Locale,
): BookExperimentBranchSnapshotViewModel {
  return {
    ...normalizeBookExperimentBranch(record, locale),
    selectedChapterId: null,
    chapters: record.chapterSnapshots.map((chapter, chapterIndex) => ({
      chapterId: chapter.chapterId,
      order: chapterIndex + 1,
      title: readLocalizedBookText(chapter.title, locale),
      summary: readLocalizedBookText(chapter.summary, locale),
      scenes: chapter.sceneSnapshots.map((scene, sceneIndex) => normalizeBranchScene(scene, locale, sceneIndex + 1)),
    })),
  }
}

export function buildBranchBaselineSnapshot({
  currentDraftWorkspace,
  checkpoint,
  baseline,
  locale,
}: BuildBranchBaselineSnapshotInput): BookExperimentBranchBaselineSnapshotViewModel {
  if (baseline === 'checkpoint') {
    if (!checkpoint) {
      throw new Error('Book manuscript checkpoint is required for checkpoint branch baseline.')
    }

    return {
      kind: 'checkpoint',
      label: readLocalizedBookText(checkpoint.title, locale),
      checkpointId: checkpoint.checkpointId,
      bookId: checkpoint.bookId,
      title: readLocalizedBookText(checkpoint.title, locale),
      summary: readLocalizedBookText(checkpoint.summary, locale),
      selectedChapterId: currentDraftWorkspace.selectedChapterId,
      chapters: checkpoint.chapters.map((chapter) => ({
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
          traceReady: scene.traceReady,
          warningsCount: scene.warningsCount,
        })),
      })),
    }
  }

  return {
    kind: 'current',
    label: buildCurrentBaselineLabel(locale),
    bookId: currentDraftWorkspace.bookId,
    title: currentDraftWorkspace.title,
    summary: currentDraftWorkspace.summary,
    selectedChapterId: currentDraftWorkspace.selectedChapterId,
    chapters: currentDraftWorkspace.chapters.map((chapter) => ({
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
        traceReady: section.traceReady,
        warningsCount: section.warningsCount,
        sourceProposalCount: section.sourceProposalCount,
      })),
    })),
  }
}

export function deriveBookExperimentBranchReadiness({
  chapters,
  branch,
  baseline,
  locale,
}: DeriveBookExperimentBranchReadinessInput): BookExperimentBranchReadinessViewModel {
  const issues: BookExperimentBranchReadinessIssueViewModel[] = []

  for (const chapter of chapters) {
    for (const scene of chapter.sceneDeltas) {
      if (scene.delta === 'draft_missing') {
        issues.push({
          id: `draft-missing-${chapter.chapterId}-${scene.sceneId}`,
          severity: 'blocker',
          chapterId: chapter.chapterId,
          sceneId: scene.sceneId,
          title: localizeText(locale, 'Draft is missing', '草稿缺失'),
          detail: localizeText(
            locale,
            `${scene.title} is blank in ${branch?.title ?? 'this branch'}.`,
            `${scene.title} 在${branch?.title ?? '该实验稿'}中仍为空白。`,
          ),
        })
      }

      if (isTraceRegression(scene)) {
        issues.push({
          id: `trace-regression-${chapter.chapterId}-${scene.sceneId}`,
          severity: 'warning',
          chapterId: chapter.chapterId,
          sceneId: scene.sceneId,
          title: localizeText(locale, 'Trace regressed', '溯源回退'),
          detail: localizeText(
            locale,
            `${scene.title} loses trace readiness compared with the ${baseline.label.toLowerCase()}.`,
            `${scene.title} 相比${baseline.label}出现了溯源回退。`,
          ),
        })
      }

      if (scene.warningsDelta > 0) {
        issues.push({
          id: `warning-pressure-${chapter.chapterId}-${scene.sceneId}`,
          severity: 'warning',
          chapterId: chapter.chapterId,
          sceneId: scene.sceneId,
          title: localizeText(locale, 'Warnings increased', '警告增加'),
          detail: localizeText(
            locale,
            `${scene.title} adds ${scene.warningsDelta} warning${scene.warningsDelta === 1 ? '' : 's'} against the baseline.`,
            `${scene.title} 相比基线新增了 ${scene.warningsDelta} 条警告。`,
          ),
        })
      }

      if (scene.delta === 'added' && (scene.branchSourceProposalCount ?? 0) === 0) {
        issues.push({
          id: `added-without-source-${chapter.chapterId}-${scene.sceneId}`,
          severity: 'warning',
          chapterId: chapter.chapterId,
          sceneId: scene.sceneId,
          title: localizeText(locale, 'Added scene lacks source proposals', '新增场景缺少来源提案'),
          detail: localizeText(
            locale,
            `${scene.title} is branch-only and still has no supporting source proposals.`,
            `${scene.title} 是实验稿新增场景，但仍没有配套来源提案。`,
          ),
        })
      }
    }
  }

  const status: BookExperimentBranchReadinessViewModel['status'] = issues.some((issue) => issue.severity === 'blocker')
    ? 'blocked'
    : issues.some((issue) => issue.severity === 'warning')
      ? 'attention'
      : 'ready'

  return {
    status,
    label: buildReadinessLabel(locale, status),
    issues,
  }
}

export function compareBookExperimentBranchToBaseline({
  branchSnapshot,
  baselineSnapshot,
  selectedChapterId,
}: CompareBookExperimentBranchToBaselineInput): BookExperimentBranchComparisonViewModel {
  const orderedChapterIds = [
    ...branchSnapshot.chapters.map((chapter) => chapter.chapterId),
    ...baselineSnapshot.chapters.map((chapter) => chapter.chapterId).filter(
      (chapterId) => !branchSnapshot.chapters.some((chapter) => chapter.chapterId === chapterId),
    ),
  ]

  const chapters = orderedChapterIds.map((chapterId) =>
    compareChapter(
      branchSnapshot.chapters.find((chapter) => chapter.chapterId === chapterId),
      baselineSnapshot.chapters.find((chapter) => chapter.chapterId === chapterId),
      branchSnapshot.adoptions,
    ),
  )

  const effectiveSelectedChapterId =
    selectedChapterId ??
    branchSnapshot.selectedChapterId ??
    baselineSnapshot.selectedChapterId ??
    chapters[0]?.chapterId ??
    null
  const selectedChapter = chapters.find((chapter) => chapter.chapterId === effectiveSelectedChapterId) ?? chapters[0] ?? null
  const totals = chapters.reduce<BookExperimentBranchWorkspaceTotalsViewModel>((accumulator, chapter) => {
    const chapterChanged =
      chapter.changedSceneCount > 0 ||
      chapter.addedSceneCount > 0 ||
      chapter.missingSceneCount > 0 ||
      chapter.draftMissingSceneCount > 0

    return {
      changedChapterCount: accumulator.changedChapterCount + (chapterChanged ? 1 : 0),
      changedSceneCount: accumulator.changedSceneCount + chapter.changedSceneCount,
      addedSceneCount: accumulator.addedSceneCount + chapter.addedSceneCount,
      missingSceneCount: accumulator.missingSceneCount + chapter.missingSceneCount,
      draftMissingSceneCount: accumulator.draftMissingSceneCount + chapter.draftMissingSceneCount,
      wordDelta: accumulator.wordDelta + chapter.wordDelta,
      traceRegressionCount: accumulator.traceRegressionCount + chapter.traceRegressionCount,
      traceImprovementCount: accumulator.traceImprovementCount + chapter.traceImprovementCount,
      warningsDelta: accumulator.warningsDelta + chapter.warningsDelta,
      sourceProposalDelta: accumulator.sourceProposalDelta + chapter.sourceProposalDelta,
      blockedChapterCount: accumulator.blockedChapterCount + (chapter.readinessStatus === 'blocked' ? 1 : 0),
      attentionChapterCount: accumulator.attentionChapterCount + (chapter.readinessStatus === 'attention' ? 1 : 0),
    }
  }, buildEmptyTotals())

  const readiness = deriveBookExperimentBranchReadiness({
    chapters,
    branch: branchSnapshot,
    baseline: {
      kind: baselineSnapshot.kind,
      label: baselineSnapshot.label,
      checkpointId: baselineSnapshot.checkpointId,
    },
    locale: 'en',
  })

  return {
    bookId: branchSnapshot.bookId,
    title: branchSnapshot.title,
    summary: branchSnapshot.summary,
    selectedChapterId: selectedChapter?.chapterId ?? null,
    selectedChapter,
    baseline: {
      kind: baselineSnapshot.kind,
      label: baselineSnapshot.label,
      checkpointId: baselineSnapshot.checkpointId,
    },
    chapters,
    totals,
    readiness,
  }
}

export function buildBookExperimentBranchWorkspace({
  currentDraftWorkspace,
  branch,
  branches = [],
  checkpoint,
  branchBaseline,
  selectedChapterId,
  locale,
}: BuildBookExperimentBranchWorkspaceInput): BookExperimentBranchWorkspaceViewModel {
  const normalizedBranch = branch ? normalizeBookExperimentBranch(branch, locale) : null
  const normalizedBranches = branches.map((record) => normalizeBookExperimentBranch(record, locale))
  const branchSnapshot = branch ? normalizeBookExperimentBranchSnapshot(branch, locale) : null
  const baselineSnapshot = buildBranchBaselineSnapshot({
    currentDraftWorkspace,
    checkpoint,
    baseline: branchBaseline,
    locale,
  })

  if (!branchSnapshot) {
    return {
      bookId: currentDraftWorkspace.bookId,
      title: currentDraftWorkspace.title,
      summary: currentDraftWorkspace.summary,
      selectedChapterId: selectedChapterId ?? currentDraftWorkspace.selectedChapterId,
      selectedChapter: null,
      branch: null,
      branches: normalizedBranches,
      adoptions: [],
      baseline: {
        kind: baselineSnapshot.kind,
        label: baselineSnapshot.label,
        checkpointId: baselineSnapshot.checkpointId,
      },
      chapters: [],
      totals: buildEmptyTotals(),
      readiness: {
        status: 'ready',
        label: buildReadinessLabel(locale, 'ready'),
        issues: [],
      },
    }
  }

  const comparison = compareBookExperimentBranchToBaseline({
    branchSnapshot,
    baselineSnapshot,
    selectedChapterId,
  })
  const readiness = deriveBookExperimentBranchReadiness({
    chapters: comparison.chapters,
    branch: normalizedBranch,
    baseline: comparison.baseline,
    locale,
  })

  return {
    ...comparison,
    title: currentDraftWorkspace.title,
    summary: currentDraftWorkspace.summary,
    branch: normalizedBranch,
    branches: normalizedBranches,
    adoptions: branchSnapshot.adoptions,
    readiness,
  }
}
