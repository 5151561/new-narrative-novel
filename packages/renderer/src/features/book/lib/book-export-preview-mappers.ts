import type { Locale } from '@/app/i18n'

import type { BookExportProfileRecord } from '../api/book-export-profiles'
import { readLocalizedBookText } from '../api/book-records'
import type { BookManuscriptCompareChapterViewModel, BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftChapterViewModel, BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type {
  BookExportChapterPreviewViewModel,
  BookExportPackageSummaryViewModel,
  BookExportPreviewWorkspaceViewModel,
  BookExportProfileViewModel,
  BookExportReadinessIssueViewModel,
  BookExportReadinessViewModel,
  BookExportScenePreviewViewModel,
} from '../types/book-export-view-models'

export interface BuildBookExportPreviewWorkspaceInput {
  currentDraftWorkspace: BookDraftWorkspaceViewModel
  compareWorkspace?: BookManuscriptCompareWorkspaceViewModel | null
  profile: BookExportProfileViewModel
  locale?: Locale
}

interface DeriveReadinessIssuesInput extends BuildBookExportPreviewWorkspaceInput {
  chapters: BookExportChapterPreviewViewModel[]
}

function localizeText(locale: Locale, en: string, zhCN: string) {
  return locale === 'zh-CN' ? zhCN : en
}

function localizePackageSection(locale: Locale, key: keyof BookExportProfileViewModel['includes']) {
  const labels: Record<keyof BookExportProfileViewModel['includes'], { en: string; 'zh-CN': string }> = {
    manuscriptBody: { en: 'Manuscript body', 'zh-CN': '正文主体' },
    chapterSummaries: { en: 'Chapter summaries', 'zh-CN': '章节摘要' },
    sceneHeadings: { en: 'Scene headings', 'zh-CN': '场景标题' },
    traceAppendix: { en: 'Trace appendix', 'zh-CN': '溯源附录' },
    compareSummary: { en: 'Compare summary', 'zh-CN': '对比摘要' },
    readinessChecklist: { en: 'Readiness checklist', 'zh-CN': '准备度清单' },
  }

  return labels[key][locale]
}

function estimatePackageLabel(locale: Locale, assembledWordCount: number, includedChapterCount: number) {
  const estimatedPages = Math.max(1, Math.round(assembledWordCount / 100))

  return locale === 'zh-CN'
    ? `约 ${estimatedPages} 页 / ${includedChapterCount} 个章节包`
    : `Approx. ${estimatedPages} manuscript pages`
}

function createIssue(input: BookExportReadinessIssueViewModel): BookExportReadinessIssueViewModel {
  return input
}

function buildScenePreview(
  chapter: BookDraftChapterViewModel,
  compareChapter: BookManuscriptCompareChapterViewModel | null | undefined,
  profile: BookExportProfileViewModel,
): BookExportScenePreviewViewModel[] {
  return chapter.sections.map((section) => ({
    sceneId: section.sceneId,
    order: section.order,
    title: section.title,
    summary: section.summary,
    proseDraft: section.proseDraft,
    draftWordCount: section.draftWordCount,
    isIncluded: profile.includes.manuscriptBody,
    isMissingDraft: section.isMissingDraft,
    traceReady: section.traceReady,
    warningsCount: section.warningsCount,
    compareDelta: compareChapter?.scenes.find((scene) => scene.sceneId === section.sceneId)?.delta,
  }))
}

function getChapterReadinessStatus(
  chapter: BookDraftChapterViewModel,
  compareChapter: BookManuscriptCompareChapterViewModel | null | undefined,
  profile: BookExportProfileViewModel,
) {
  const hasTraceGap = chapter.missingTraceSceneCount > 0 || (compareChapter?.traceRegressionCount ?? 0) > 0
  const hasWarningPressure = chapter.warningsCount > 0 || (compareChapter?.warningsDelta ?? 0) > 0
  const hasCompareRegression =
    (compareChapter?.totals.changedCount ?? 0) > 0 ||
    (compareChapter?.totals.addedCount ?? 0) > 0 ||
    (compareChapter?.totals.missingCount ?? 0) > 0 ||
    (compareChapter?.totals.draftMissingCount ?? 0) > 0

  if (
    (!profile.rules.allowDraftMissing && chapter.missingDraftCount > 0) ||
    (profile.rules.requireTraceReady && hasTraceGap) ||
    (!profile.rules.allowWarnings && hasWarningPressure) ||
    (compareChapter?.totals.draftMissingCount ?? 0) > 0
  ) {
    return 'blocked' as const
  }

  if (hasTraceGap || hasWarningPressure || hasCompareRegression || chapter.queuedRevisionCount > 0) {
    return 'attention' as const
  }

  return 'ready' as const
}

export function buildBookExportChapterPreview({
  chapter,
  compareChapter,
  profile,
}: {
  chapter: BookDraftChapterViewModel
  compareChapter?: BookManuscriptCompareChapterViewModel | null
  profile: BookExportProfileViewModel
}): BookExportChapterPreviewViewModel {
  return {
    chapterId: chapter.chapterId,
    order: chapter.order,
    title: chapter.title,
    summary: chapter.summary,
    isIncluded: profile.includes.manuscriptBody,
    assembledWordCount: chapter.assembledWordCount,
    missingDraftCount: chapter.missingDraftCount,
    missingTraceCount: chapter.missingTraceSceneCount,
    warningCount: chapter.warningsCount + Math.max(compareChapter?.warningsDelta ?? 0, 0),
    scenes: buildScenePreview(chapter, compareChapter, profile),
    readinessStatus: getChapterReadinessStatus(chapter, compareChapter, profile),
  }
}

export function deriveBookExportReadinessIssues({
  currentDraftWorkspace,
  compareWorkspace,
  profile,
  chapters,
  locale = 'en',
}: DeriveReadinessIssuesInput): BookExportReadinessIssueViewModel[] {
  const issues: BookExportReadinessIssueViewModel[] = []

  for (const chapter of currentDraftWorkspace.chapters) {
    const compareChapter = compareWorkspace?.chapters.find((item) => item.chapterId === chapter.chapterId)

    for (const section of chapter.sections) {
      if (section.isMissingDraft && !profile.rules.allowDraftMissing) {
        issues.push(
          createIssue({
            id: `missing-draft-${chapter.chapterId}-${section.sceneId}`,
            severity: 'blocker',
            kind: 'missing_draft',
            chapterId: chapter.chapterId,
            chapterTitle: chapter.title,
            sceneId: section.sceneId,
            sceneTitle: section.title,
            title: localizeText(locale, 'Draft coverage incomplete', '缺稿覆盖未完成'),
            detail: localizeText(locale, `${section.title} still needs current draft prose.`, `${section.title} 仍缺少当前正文草稿。`),
            recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
          }),
        )
      }

      if (!section.traceReady && profile.rules.requireTraceReady) {
        issues.push(
          createIssue({
            id: `trace-gap-${chapter.chapterId}-${section.sceneId}`,
            severity: 'blocker',
            kind: 'trace_gap',
            chapterId: chapter.chapterId,
            chapterTitle: chapter.title,
            sceneId: section.sceneId,
            sceneTitle: section.title,
            title: localizeText(locale, 'Trace coverage incomplete', '溯源覆盖未完成'),
            detail: localizeText(locale, `${section.title} still lacks trace readiness for this export profile.`, `${section.title} 在当前导出配置下仍缺少溯源就绪状态。`),
            recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
          }),
        )
      } else if (!section.traceReady && profile.includes.traceAppendix) {
        issues.push(
          createIssue({
            id: `trace-gap-warning-${chapter.chapterId}-${section.sceneId}`,
            severity: 'warning',
            kind: 'trace_gap',
            chapterId: chapter.chapterId,
            chapterTitle: chapter.title,
            sceneId: section.sceneId,
            sceneTitle: section.title,
            title: localizeText(locale, 'Trace appendix is incomplete', '溯源附录不完整'),
            detail: localizeText(locale, `${section.title} is still missing trace coverage.`, `${section.title} 仍缺少溯源覆盖。`),
            recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
          }),
        )
      }
    }

    if (!profile.rules.allowWarnings && (chapter.warningsCount > 0 || (compareChapter?.warningsDelta ?? 0) > 0)) {
      issues.push(
        createIssue({
          id: `warnings-${chapter.chapterId}`,
          severity: 'blocker',
          kind: 'warning_delta',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          title: localizeText(locale, 'Warnings must be cleared', '警告必须先清空'),
          detail: localizeText(locale, `${chapter.title} still carries warning pressure that this export profile does not allow.`, `${chapter.title} 仍带有当前导出配置不允许保留的警告压力。`),
          recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
        }),
      )
    }

    if (chapter.queuedRevisionCount > 0) {
      issues.push(
        createIssue({
          id: `queued-revision-${chapter.chapterId}`,
          severity: 'warning',
          kind: 'queued_revision',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          title: localizeText(locale, 'Queued revisions remain', '仍有待处理修订'),
          detail: localizeText(locale, `${chapter.title} still has ${chapter.queuedRevisionCount} queued revisions.`, `${chapter.title} 仍有 ${chapter.queuedRevisionCount} 条待处理修订。`),
          recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
        }),
      )
    }

    if (!compareChapter) {
      continue
    }

    if (compareChapter.totals.draftMissingCount > 0) {
      issues.push(
        createIssue({
          id: `compare-draft-missing-${chapter.chapterId}`,
          severity: 'blocker',
          kind: 'compare_regression',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          title: localizeText(locale, 'Compare baseline still has draft-missing scenes', '对比基线仍有缺稿场景'),
          detail: localizeText(locale, `${chapter.title} still contains draft-missing compare rows against the selected checkpoint.`, `${chapter.title} 相对所选检查点仍然存在缺稿的对比条目。`),
          recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
        }),
      )
    }

    if (profile.rules.requireTraceReady && compareChapter.traceRegressionCount > 0 && chapter.missingTraceSceneCount === 0) {
      issues.push(
        createIssue({
          id: `compare-trace-regression-${chapter.chapterId}`,
          severity: 'blocker',
          kind: 'compare_regression',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          title: localizeText(locale, 'Compare trace regressions block export readiness', '对比基线中的溯源回退阻塞导出准备度'),
          detail: localizeText(locale, `${chapter.title} still shows trace regressions against the selected checkpoint.`, `${chapter.title} 相对所选检查点仍然存在溯源回退。`),
          recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
        }),
      )
    }

    if (compareChapter.totals.changedCount > 0) {
      issues.push(
        createIssue({
          id: `compare-changed-${chapter.chapterId}`,
          severity: 'warning',
          kind: 'compare_regression',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          title: localizeText(locale, 'Changed scenes still need review', '变更场景仍需复核'),
          detail: localizeText(locale, `${chapter.title} still has scene changes against the selected checkpoint.`, `${chapter.title} 相对所选检查点仍有场景变更。`),
          recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
        }),
      )
    }

    if (compareChapter.totals.addedCount > 0) {
      issues.push(
        createIssue({
          id: `compare-added-${chapter.chapterId}`,
          severity: 'warning',
          kind: 'compare_regression',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          title: localizeText(locale, 'Added scenes should be acknowledged', '新增场景需要确认'),
          detail: localizeText(locale, `${chapter.title} still has scenes that were added after the selected checkpoint.`, `${chapter.title} 仍有在所选检查点之后新增的场景。`),
          recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
        }),
      )
    }

    if (compareChapter.totals.missingCount > 0) {
      issues.push(
        createIssue({
          id: `compare-missing-${chapter.chapterId}`,
          severity: 'warning',
          kind: 'compare_regression',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          title: localizeText(locale, 'Checkpoint-only scenes remain', '仍有仅存在于检查点的场景'),
          detail: localizeText(locale, `${chapter.title} still has scenes that only exist in the selected checkpoint.`, `${chapter.title} 仍有只存在于所选检查点的场景。`),
          recommendedActionLabel: localizeText(locale, 'Review chapter', '检查章节'),
        }),
      )
    }
  }

  if (!profile.includes.traceAppendix) {
    issues.push(
      createIssue({
        id: `profile-rule-trace-${profile.exportProfileId}`,
        severity: 'info',
        kind: 'profile_rule',
        title: localizeText(locale, 'Trace appendix omitted', '未包含溯源附录'),
        detail: localizeText(locale, 'This export profile excludes the trace appendix section.', '当前导出配置不包含溯源附录。'),
      }),
    )
  }

  if (!profile.includes.compareSummary) {
    issues.push(
      createIssue({
        id: `profile-rule-compare-${profile.exportProfileId}`,
        severity: 'info',
        kind: 'profile_rule',
        title: localizeText(locale, 'Compare summary omitted', '未包含对比摘要'),
        detail: localizeText(locale, 'This export profile excludes the compare summary section.', '当前导出配置不包含对比摘要。'),
      }),
    )
  }

  if (profile.kind === 'archive_snapshot') {
    issues.push(
      createIssue({
        id: `profile-rule-archive-${profile.exportProfileId}`,
        severity: 'info',
        kind: 'profile_rule',
        title: localizeText(locale, 'Archive snapshot keeps the current draft state', '归档快照保留当前草稿状态'),
        detail: localizeText(locale, 'Archive snapshot packages do not require a clean publish-ready baseline.', '归档快照包不要求达到干净的发布就绪基线。'),
      }),
    )
  }

  const includedChapterCount = chapters.filter((chapter) => chapter.isIncluded).length
  if (includedChapterCount === 0) {
    issues.push(
      createIssue({
        id: `profile-rule-empty-${profile.exportProfileId}`,
        severity: 'blocker',
        kind: 'profile_rule',
        title: localizeText(locale, 'Package would be empty', '当前导出包将为空'),
        detail: localizeText(locale, 'The selected export profile does not include manuscript content for this package.', '所选导出配置没有把正文内容纳入当前导出包。'),
      }),
    )
  }

  return issues
}

export function deriveBookExportReadinessStatus(
  issues: BookExportReadinessIssueViewModel[],
  locale: Locale = 'en',
): BookExportReadinessViewModel {
  const blockerCount = issues.filter((issue) => issue.severity === 'blocker').length
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length
  const infoCount = issues.filter((issue) => issue.severity === 'info').length

  return {
    status: blockerCount > 0 ? 'blocked' : warningCount > 0 ? 'attention' : 'ready',
    label: blockerCount > 0
      ? localizeText(locale, 'Blocked by missing draft coverage', '当前导出预检存在阻塞项')
      : warningCount > 0
        ? localizeText(locale, 'Needs export attention', '当前导出预检仍需关注')
        : localizeText(locale, 'Ready for export preview', '当前导出预检已就绪'),
    issues,
    blockerCount,
    warningCount,
    infoCount,
  }
}

export function normalizeBookExportProfile(record: BookExportProfileRecord, locale: Locale): BookExportProfileViewModel {
  return {
    exportProfileId: record.exportProfileId,
    bookId: record.bookId,
    kind: record.kind,
    title: readLocalizedBookText(record.title, locale),
    summary: readLocalizedBookText(record.summary, locale),
    createdAtLabel: readLocalizedBookText(record.createdAtLabel, locale),
    includes: structuredClone(record.includes),
    rules: structuredClone(record.rules),
  }
}

function buildPackageSummary(
  profile: BookExportProfileViewModel,
  locale: Locale,
  assembledWordCount: number,
  includedChapterCount: number,
): BookExportPackageSummaryViewModel {
  const includeKeys = Object.keys(profile.includes) as Array<keyof BookExportProfileViewModel['includes']>

  return {
    includedSections: includeKeys.filter((key) => profile.includes[key]).map((key) => localizePackageSection(locale, key)),
    excludedSections: includeKeys.filter((key) => !profile.includes[key]).map((key) => localizePackageSection(locale, key)),
    estimatedPackageLabel: estimatePackageLabel(locale, assembledWordCount, includedChapterCount),
  }
}

export function buildBookExportPreviewWorkspace({
  currentDraftWorkspace,
  compareWorkspace,
  profile,
  locale = 'en',
}: BuildBookExportPreviewWorkspaceInput): BookExportPreviewWorkspaceViewModel {
  const chapters = currentDraftWorkspace.chapters.map((chapter) =>
    buildBookExportChapterPreview({
      chapter,
      compareChapter: compareWorkspace?.chapters.find((item) => item.chapterId === chapter.chapterId),
      profile,
    }),
  )
  const selectedChapter =
    chapters.find((chapter) => chapter.chapterId === currentDraftWorkspace.selectedChapterId) ?? chapters[0] ?? null
  const selectedChapterId = selectedChapter?.chapterId ?? null
  const issues = deriveBookExportReadinessIssues({
    currentDraftWorkspace,
    compareWorkspace,
    profile,
    chapters,
    locale,
  })
  const readiness = deriveBookExportReadinessStatus(issues, locale)
  const includedChapterCount = chapters.filter((chapter) => chapter.isIncluded).length
  const includedSceneCount = chapters.reduce(
    (total, chapter) => total + chapter.scenes.filter((scene) => scene.isIncluded).length,
    0,
  )
  const assembledWordCount = chapters.reduce((total, chapter) => total + chapter.assembledWordCount, 0)

  return {
    bookId: currentDraftWorkspace.bookId,
    title: currentDraftWorkspace.title,
    summary: currentDraftWorkspace.summary,
    selectedChapterId,
    selectedChapter,
    profile,
    chapters,
    totals: {
      includedChapterCount,
      includedSceneCount,
      assembledWordCount,
      blockerCount: readiness.blockerCount,
      warningCount: readiness.warningCount,
      infoCount: readiness.infoCount,
      missingDraftCount: chapters.reduce((total, chapter) => total + chapter.missingDraftCount, 0),
      traceGapCount: chapters.reduce((total, chapter) => total + chapter.missingTraceCount, 0),
      compareChangedSceneCount: compareWorkspace?.totals.changedCount ?? 0,
    },
    readiness,
    packageSummary: buildPackageSummary(profile, locale, assembledWordCount, includedChapterCount),
  }
}
