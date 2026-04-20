import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'

import type {
  BookExportArtifactFormat,
  BookExportArtifactRecord,
  BuildBookExportArtifactInput,
} from '../api/book-export-artifact-records'
import type {
  BookExportArtifactGateReasonViewModel,
  BookExportArtifactGateViewModel,
  BookExportArtifactSummaryViewModel,
  BookExportArtifactWorkspaceViewModel,
} from '../types/book-export-artifact-view-models'
import type { BookExportPreviewWorkspaceViewModel, BookExportScenePreviewViewModel } from '../types/book-export-view-models'

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableSerialize(item)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function getOpenStatus(issue: ReviewIssueViewModel) {
  return issue.decision.status === 'open' || issue.decision.status === 'stale'
}

function getBuildableReviewBlockers(reviewInbox: BookReviewInboxViewModel | null | undefined) {
  return (reviewInbox?.issues ?? []).filter(
    (issue) => issue.severity === 'blocker' && getOpenStatus(issue) && issue.source !== 'branch',
  )
}

function getOpenReviewWarnings(reviewInbox: BookReviewInboxViewModel | null | undefined) {
  return (reviewInbox?.issues ?? []).filter(
    (issue) => issue.severity === 'warning' && getOpenStatus(issue) && issue.source !== 'branch',
  )
}

function getFixActionCount(reviewInbox: BookReviewInboxViewModel | null | undefined, status: 'checked' | 'blocked' | 'stale') {
  return (reviewInbox?.issues ?? []).filter((issue) => issue.fixAction.status === status).length
}

function getIncludedChapters(exportPreview: BookExportPreviewWorkspaceViewModel) {
  return exportPreview.chapters.filter((chapter) => chapter.isIncluded)
}

function getIncludedScenes(chapter: BookExportPreviewWorkspaceViewModel['chapters'][number]) {
  return chapter.scenes.filter((scene) => scene.isIncluded)
}

function getSceneProse(scene: BookExportScenePreviewViewModel) {
  if (scene.isMissingDraft) {
    return '[Missing draft]'
  }

  const trimmed = scene.proseDraft?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : '[Missing draft]'
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'book-export'
}

function getArtifactFilename(exportPreview: BookExportPreviewWorkspaceViewModel, format: BookExportArtifactFormat) {
  const extension = format === 'markdown' ? 'md' : 'txt'
  return `${slugify(exportPreview.title)}-${exportPreview.profile.exportProfileId}.${extension}`
}

function getArtifactMimeType(format: BookExportArtifactFormat) {
  return format === 'markdown' ? 'text/markdown' : 'text/plain'
}

function shouldIncludeChapterTitleInSignature(
  exportPreview: BookExportPreviewWorkspaceViewModel,
  chapter: BookExportPreviewWorkspaceViewModel['chapters'][number],
) {
  return (
    exportPreview.profile.includes.manuscriptBody ||
    exportPreview.profile.includes.traceAppendix ||
    (exportPreview.profile.includes.compareSummary && getIncludedScenes(chapter).some((scene) => scene.compareDelta !== undefined))
  )
}

function shouldIncludeSceneTitleInSignature(
  exportPreview: BookExportPreviewWorkspaceViewModel,
  scene: BookExportScenePreviewViewModel,
) {
  return (
    (exportPreview.profile.includes.manuscriptBody && exportPreview.profile.includes.sceneHeadings) ||
    exportPreview.profile.includes.traceAppendix ||
    (exportPreview.profile.includes.compareSummary && scene.compareDelta !== undefined)
  )
}

export function createBookExportArtifactSourceSignature(exportPreview: BookExportPreviewWorkspaceViewModel): string {
  return stableSerialize({
    bookId: exportPreview.bookId,
    title: exportPreview.title,
    summary: exportPreview.summary,
    profile: {
      exportProfileId: exportPreview.profile.exportProfileId,
      bookId: exportPreview.profile.bookId,
      kind: exportPreview.profile.kind,
      title: exportPreview.profile.title,
      summary: exportPreview.profile.summary,
      includes: exportPreview.profile.includes,
      rules: exportPreview.profile.rules,
    },
    chapters: getIncludedChapters(exportPreview).map((chapter) => ({
      chapterId: chapter.chapterId,
      order: exportPreview.profile.includes.manuscriptBody ? chapter.order : undefined,
      title: shouldIncludeChapterTitleInSignature(exportPreview, chapter) ? chapter.title : undefined,
      summary:
        exportPreview.profile.includes.manuscriptBody && exportPreview.profile.includes.chapterSummaries
          ? chapter.summary
          : undefined,
      scenes: getIncludedScenes(chapter).map((scene) => ({
        sceneId: scene.sceneId,
        order:
          exportPreview.profile.includes.manuscriptBody && exportPreview.profile.includes.sceneHeadings
            ? scene.order
            : undefined,
        title: shouldIncludeSceneTitleInSignature(exportPreview, scene) ? scene.title : undefined,
        proseDraft: exportPreview.profile.includes.manuscriptBody ? (scene.proseDraft ?? '') : undefined,
        isMissingDraft: exportPreview.profile.includes.manuscriptBody ? scene.isMissingDraft : undefined,
        traceReady: exportPreview.profile.includes.traceAppendix ? scene.traceReady : undefined,
        compareDelta: exportPreview.profile.includes.compareSummary ? (scene.compareDelta ?? '') : undefined,
      })),
    })),
    totals: exportPreview.totals,
    readiness: {
      status: exportPreview.readiness.status,
      label: exportPreview.readiness.label,
      blockerCount: exportPreview.readiness.blockerCount,
      warningCount: exportPreview.readiness.warningCount,
      infoCount: exportPreview.readiness.infoCount,
    },
    readinessIssues: exportPreview.readiness.issues.map((issue) => ({
      id: issue.id,
      severity: issue.severity,
      kind: issue.kind,
      chapterId: issue.chapterId ?? '',
      chapterTitle: issue.chapterTitle ?? '',
      sceneId: issue.sceneId ?? '',
      sceneTitle: issue.sceneTitle ?? '',
      title: issue.title,
      detail: issue.detail,
      recommendedActionLabel: issue.recommendedActionLabel ?? '',
    })),
    packageSummary: {
      includedSections: exportPreview.packageSummary.includedSections,
      excludedSections: exportPreview.packageSummary.excludedSections,
      estimatedPackageLabel: exportPreview.packageSummary.estimatedPackageLabel,
    },
  })
}

export function buildBookExportArtifactGate({
  exportPreview,
  reviewInbox,
}: {
  exportPreview: BookExportPreviewWorkspaceViewModel
  reviewInbox: BookReviewInboxViewModel | null | undefined
}): BookExportArtifactGateViewModel {
  const reasons: BookExportArtifactGateReasonViewModel[] = []
  const exportBlockers = exportPreview.readiness.issues.filter((issue) => issue.severity === 'blocker')
  const reviewBlockers = getBuildableReviewBlockers(reviewInbox)
  const checkedFixCount = getFixActionCount(reviewInbox, 'checked')
  const blockedFixCount = getFixActionCount(reviewInbox, 'blocked')
  const staleFixCount = getFixActionCount(reviewInbox, 'stale')

  if (exportPreview.readiness.blockerCount > 0) {
    if (exportBlockers.length === 0) {
      reasons.push({
        id: 'export-readiness-blockers',
        severity: 'blocker',
        title: 'Export readiness blockers remain',
        detail: `${exportPreview.readiness.blockerCount} export readiness blocker(s) must be cleared before building an artifact.`,
        source: 'export-readiness',
      })
    } else {
      reasons.push(
        ...exportBlockers.map((issue) => ({
          id: issue.id,
          severity: 'blocker' as const,
          title: issue.title,
          detail: issue.detail,
          source: 'export-readiness' as const,
        })),
      )
    }
  }

  reasons.push(
    ...reviewBlockers.map((issue) => ({
      id: issue.id,
      severity: 'blocker' as const,
      title: issue.title,
      detail: issue.detail,
      source: 'review-open-blocker' as const,
    })),
  )

  const hasBlockers = reasons.some((reason) => reason.severity === 'blocker')
  if (hasBlockers) {
    return {
      canBuild: false,
      status: 'blocked',
      label: 'Artifact build blocked',
      reasons,
      openBlockerCount: reviewBlockers.length,
      checkedFixCount,
      blockedFixCount,
      staleFixCount,
    }
  }

  const exportWarnings = exportPreview.readiness.issues.filter((issue) => issue.severity === 'warning')
  const reviewWarnings = getOpenReviewWarnings(reviewInbox)
  reasons.push(
    ...exportWarnings.map((issue) => ({
      id: issue.id,
      severity: 'warning' as const,
      title: issue.title,
      detail: issue.detail,
      source: 'export-readiness' as const,
    })),
  )
  reasons.push(
    ...reviewWarnings.map((issue) => ({
      id: issue.id,
      severity: 'warning' as const,
      title: issue.title,
      detail: issue.detail,
      source: 'review-open-blocker' as const,
    })),
  )

  if (checkedFixCount > 0) {
    reasons.push({
      id: 'review-fix-checked',
      severity: 'warning',
      title: 'Checked source fixes need review',
      detail: `${checkedFixCount} checked source-fix action(s) still need review decisions.`,
      source: 'review-open-blocker',
    })
  }

  if (blockedFixCount > 0) {
    reasons.push({
      id: 'review-fix-blocked',
      severity: 'warning',
      title: 'Blocked source fixes need attention',
      detail: `${blockedFixCount} source-fix action(s) are blocked.`,
      source: 'review-open-blocker',
    })
  }

  if (staleFixCount > 0) {
    reasons.push({
      id: 'review-fix-stale',
      severity: 'warning',
      title: 'Stale source fixes need attention',
      detail: `${staleFixCount} source-fix action(s) are stale.`,
      source: 'review-open-blocker',
    })
  }

  const needsAttention = exportPreview.readiness.warningCount > 0 || reasons.length > 0

  return {
    canBuild: true,
    status: needsAttention ? 'attention' : 'ready',
    label: needsAttention ? 'Artifact build needs attention' : 'Artifact build ready',
    reasons,
    openBlockerCount: 0,
    checkedFixCount,
    blockedFixCount,
    staleFixCount,
  }
}

function appendMarkdownPackageSummary(lines: string[], exportPreview: BookExportPreviewWorkspaceViewModel) {
  lines.push('## Export package', '')
  lines.push(`- Profile: ${exportPreview.profile.title}`)
  lines.push(`- Readiness: ${exportPreview.readiness.label}`)
  lines.push(`- Chapters: ${exportPreview.totals.includedChapterCount}`)
  lines.push(`- Scenes: ${exportPreview.totals.includedSceneCount}`)
  lines.push(`- Words: ${exportPreview.totals.assembledWordCount}`)
  lines.push(`- Estimated package: ${exportPreview.packageSummary.estimatedPackageLabel}`, '')
}

function appendPlainTextPackageSummary(lines: string[], exportPreview: BookExportPreviewWorkspaceViewModel) {
  lines.push('Export package', '')
  lines.push(`Profile: ${exportPreview.profile.title}`)
  lines.push(`Readiness: ${exportPreview.readiness.label}`)
  lines.push(`Chapters: ${exportPreview.totals.includedChapterCount}`)
  lines.push(`Scenes: ${exportPreview.totals.includedSceneCount}`)
  lines.push(`Words: ${exportPreview.totals.assembledWordCount}`)
  lines.push(`Estimated package: ${exportPreview.packageSummary.estimatedPackageLabel}`, '')
}

function appendMarkdownManuscript(lines: string[], exportPreview: BookExportPreviewWorkspaceViewModel) {
  if (!exportPreview.profile.includes.manuscriptBody) {
    return
  }

  lines.push('## Manuscript', '')
  for (const chapter of getIncludedChapters(exportPreview)) {
    lines.push(`### Chapter ${chapter.order}: ${chapter.title}`, '')
    if (exportPreview.profile.includes.chapterSummaries && chapter.summary.trim()) {
      lines.push(chapter.summary, '')
    }

    for (const scene of getIncludedScenes(chapter)) {
      if (exportPreview.profile.includes.sceneHeadings) {
        lines.push(`#### Scene ${scene.order}: ${scene.title}`, '')
      }
      lines.push(getSceneProse(scene), '')
    }
  }
}

function appendPlainTextManuscript(lines: string[], exportPreview: BookExportPreviewWorkspaceViewModel) {
  if (!exportPreview.profile.includes.manuscriptBody) {
    return
  }

  lines.push('Manuscript', '')
  for (const chapter of getIncludedChapters(exportPreview)) {
    lines.push(`Chapter ${chapter.order}: ${chapter.title}`, '')
    if (exportPreview.profile.includes.chapterSummaries && chapter.summary.trim()) {
      lines.push(chapter.summary, '')
    }

    for (const scene of getIncludedScenes(chapter)) {
      if (exportPreview.profile.includes.sceneHeadings) {
        lines.push(`Scene ${scene.order}: ${scene.title}`, '')
      }
      lines.push(getSceneProse(scene), '')
    }
  }
}

function appendTraceAppendix(lines: string[], exportPreview: BookExportPreviewWorkspaceViewModel, format: BookExportArtifactFormat) {
  if (!exportPreview.profile.includes.traceAppendix) {
    return
  }

  lines.push(format === 'markdown' ? '## Trace appendix' : 'Trace appendix', '')
  for (const chapter of getIncludedChapters(exportPreview)) {
    for (const scene of getIncludedScenes(chapter)) {
      const prefix = format === 'markdown' ? '-' : ''
      const status = scene.traceReady ? 'trace ready' : 'trace missing'
      lines.push(`${prefix} ${chapter.title} / ${scene.title}: ${status}`.trim())
    }
  }
  lines.push('')
}

function appendCompareSummary(lines: string[], exportPreview: BookExportPreviewWorkspaceViewModel, format: BookExportArtifactFormat) {
  if (!exportPreview.profile.includes.compareSummary) {
    return
  }

  lines.push(format === 'markdown' ? '## Compare summary' : 'Compare summary', '')
  const comparedScenes = getIncludedChapters(exportPreview).flatMap((chapter) =>
    getIncludedScenes(chapter)
      .filter((scene) => scene.compareDelta !== undefined)
      .map((scene) => `${chapter.title} / ${scene.title}: ${scene.compareDelta}`),
  )

  if (comparedScenes.length === 0) {
    lines.push('No compare changes included.')
  } else {
    for (const scene of comparedScenes) {
      lines.push(`${format === 'markdown' ? '- ' : ''}${scene}`)
    }
  }
  lines.push('')
}

function appendReadinessChecklist(lines: string[], exportPreview: BookExportPreviewWorkspaceViewModel, format: BookExportArtifactFormat) {
  if (!exportPreview.profile.includes.readinessChecklist) {
    return
  }

  lines.push(format === 'markdown' ? '## Readiness checklist' : 'Readiness checklist', '')
  if (exportPreview.readiness.issues.length === 0) {
    lines.push('No readiness issues.')
  } else {
    for (const issue of exportPreview.readiness.issues) {
      lines.push(`${format === 'markdown' ? '- ' : ''}${issue.severity}: ${issue.title} - ${issue.detail}`)
    }
  }
  lines.push('')
}

export function buildBookExportArtifactContent({
  exportPreview,
  format,
}: {
  exportPreview: BookExportPreviewWorkspaceViewModel
  reviewInbox: BookReviewInboxViewModel | null | undefined
  format: BookExportArtifactFormat
}): string {
  const lines: string[] = []

  if (format === 'markdown') {
    lines.push(`# ${exportPreview.title}`, '')
    if (exportPreview.summary.trim()) {
      lines.push(exportPreview.summary, '')
    }
    appendMarkdownPackageSummary(lines, exportPreview)
    appendMarkdownManuscript(lines, exportPreview)
  } else {
    lines.push(exportPreview.title, '')
    if (exportPreview.summary.trim()) {
      lines.push(exportPreview.summary, '')
    }
    appendPlainTextPackageSummary(lines, exportPreview)
    appendPlainTextManuscript(lines, exportPreview)
  }

  appendTraceAppendix(lines, exportPreview, format)
  appendCompareSummary(lines, exportPreview, format)
  appendReadinessChecklist(lines, exportPreview, format)

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`
}

export function buildBookExportArtifactInput({
  exportPreview,
  reviewInbox,
  format,
  checkpointId,
}: {
  exportPreview: BookExportPreviewWorkspaceViewModel
  reviewInbox: BookReviewInboxViewModel | null | undefined
  format: BookExportArtifactFormat
  checkpointId?: string | null
}): BuildBookExportArtifactInput {
  const gate = buildBookExportArtifactGate({ exportPreview, reviewInbox })

  return {
    bookId: exportPreview.bookId,
    exportProfileId: exportPreview.profile.exportProfileId,
    checkpointId: checkpointId ?? undefined,
    format,
    filename: getArtifactFilename(exportPreview, format),
    mimeType: getArtifactMimeType(format),
    title: exportPreview.title,
    summary: `Export artifact for ${exportPreview.profile.title}.`,
    content: buildBookExportArtifactContent({ exportPreview, reviewInbox, format }),
    sourceSignature: createBookExportArtifactSourceSignature(exportPreview),
    chapterCount: exportPreview.totals.includedChapterCount,
    sceneCount: exportPreview.totals.includedSceneCount,
    wordCount: exportPreview.totals.assembledWordCount,
    readinessSnapshot: {
      status: exportPreview.readiness.status,
      blockerCount: exportPreview.readiness.blockerCount,
      warningCount: exportPreview.readiness.warningCount,
      infoCount: exportPreview.readiness.infoCount,
    },
    reviewGateSnapshot: {
      openBlockerCount: gate.openBlockerCount,
      checkedFixCount: gate.checkedFixCount,
      blockedFixCount: gate.blockedFixCount,
      staleFixCount: gate.staleFixCount,
    },
  }
}

export function normalizeBookExportArtifactRecord(
  record: BookExportArtifactRecord,
  currentSourceSignature: string,
): BookExportArtifactSummaryViewModel {
  return {
    artifactId: record.id,
    format: record.format,
    filename: record.filename,
    mimeType: record.mimeType,
    title: record.title,
    summary: record.summary,
    content: record.content,
    createdAtLabel: record.createdAtLabel,
    createdByLabel: record.createdByLabel,
    sourceSignature: record.sourceSignature,
    isStale: record.sourceSignature !== currentSourceSignature,
    chapterCount: record.chapterCount,
    sceneCount: record.sceneCount,
    wordCount: record.wordCount,
    readinessStatus: record.readinessSnapshot.status,
  }
}

export function buildBookExportArtifactWorkspace({
  exportPreview,
  reviewInbox,
  artifactRecords,
  checkpointId,
}: {
  exportPreview: BookExportPreviewWorkspaceViewModel
  reviewInbox: BookReviewInboxViewModel | null | undefined
  artifactRecords: BookExportArtifactRecord[]
  checkpointId?: string | null
}): BookExportArtifactWorkspaceViewModel {
  const sourceSignature = createBookExportArtifactSourceSignature(exportPreview)
  const artifacts = artifactRecords.map((record) => normalizeBookExportArtifactRecord(record, sourceSignature))

  return {
    bookId: exportPreview.bookId,
    exportProfileId: exportPreview.profile.exportProfileId,
    checkpointId: checkpointId ?? undefined,
    sourceSignature,
    gate: buildBookExportArtifactGate({ exportPreview, reviewInbox }),
    latestArtifact: artifacts[0] ?? null,
    artifacts,
  }
}
