import type { BookDraftView } from '@/features/workbench/types/workbench-route'
import type { BookReviewInboxViewModel } from '@/features/review/types/review-view-models'

import { useI18n } from '@/app/i18n'

import {
  BookDraftBottomDock,
  type BookDraftBranchProblems,
  type BookDraftExportProblems,
  type BookDraftReviewProblems,
} from '../components/BookDraftBottomDock'
import { useBookWorkbenchActivity, type BookWorkbenchHandoffEvent } from '../hooks/useBookWorkbenchActivity'
import { buildBookDraftCompareProblems } from '../lib/book-draft-compare-presentation'
import type { BookExperimentBranchWorkspaceViewModel } from '../types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type { BookExportArtifactWorkspaceViewModel } from '../types/book-export-artifact-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'

interface BookDraftDockContainerProps {
  workspace: BookDraftWorkspaceViewModel
  activeDraftView: BookDraftView
  compare?: BookManuscriptCompareWorkspaceViewModel | null
  branch?: BookExperimentBranchWorkspaceViewModel | null
  exportPreview?: BookExportPreviewWorkspaceViewModel | null
  artifactWorkspace?: BookExportArtifactWorkspaceViewModel | null
  reviewInbox?: BookReviewInboxViewModel | null
  exportError?: Error | null
  latestHandoff?: BookWorkbenchHandoffEvent | null
  activityRevision?: number
}

function buildExportProblems(
  exportPreview: BookExportPreviewWorkspaceViewModel | null,
  artifactWorkspace: BookExportArtifactWorkspaceViewModel | null,
  locale: 'en' | 'zh-CN',
): BookDraftExportProblems | null {
  if (!exportPreview) {
    return null
  }

  const blockers = exportPreview.readiness.issues.filter((issue) => issue.severity === 'blocker')
  const warnings = exportPreview.readiness.issues.filter((issue) => issue.severity === 'warning')
  const traceGaps = exportPreview.readiness.issues.filter((issue) => issue.kind === 'trace_gap')
  const missingDrafts = exportPreview.readiness.issues.filter((issue) => issue.kind === 'missing_draft')
  const compareRegressions = exportPreview.readiness.issues.filter((issue) => issue.kind === 'compare_regression')
  const artifactReadinessBlockers =
    artifactWorkspace?.gate.reasons.filter((reason) => reason.severity === 'blocker' && reason.source === 'export-readiness') ?? []
  const artifactReviewBlockers =
    artifactWorkspace?.gate.reasons.filter((reason) => reason.severity === 'blocker' && reason.source === 'review-open-blocker') ?? []
  const artifactWarnings = artifactWorkspace?.gate.reasons.filter((reason) => reason.severity === 'warning') ?? []
  const staleArtifact = artifactWorkspace?.latestArtifact?.isStale ? artifactWorkspace.latestArtifact : null
  const toSummaryItems = (issues: typeof blockers) =>
    issues.map((issue) => ({
      chapterId: `${issue.chapterId ?? 'export'}:${issue.id}`,
      title: issue.chapterTitle ?? exportPreview.title,
      detail: issue.detail,
    }))
  const artifactGateProblems = [
    ...artifactReadinessBlockers.map((reason, index) => ({
      chapterId: `artifact-readiness:${reason.id}:${index}`,
      title: locale === 'zh-CN' ? 'Artifact blocked by export readiness' : 'Artifact blocked by export readiness',
      detail: reason.title,
    })),
    ...artifactReviewBlockers.map((reason, index) => ({
      chapterId: `artifact-review:${reason.id}:${index}`,
      title: locale === 'zh-CN' ? 'Artifact blocked by review open blockers' : 'Artifact blocked by review open blockers',
      detail: reason.detail,
    })),
    ...artifactWarnings.map((reason, index) => ({
      chapterId: `artifact-warning:${reason.id}:${index}`,
      title: locale === 'zh-CN' ? 'Artifact gate needs attention' : 'Artifact gate needs attention',
      detail: reason.detail || reason.title,
    })),
    ...(staleArtifact
      ? [
          {
            chapterId: `artifact-stale:${staleArtifact.artifactId}`,
            title: locale === 'zh-CN' ? 'Latest artifact stale' : 'Latest artifact stale',
            detail:
              locale === 'zh-CN'
                ? `${staleArtifact.filename} no longer matches the current export source.`
                : `${staleArtifact.filename} no longer matches the current export source.`,
          },
        ]
      : []),
  ]

  return {
    blockerCount: blockers.length,
    warningCount: warnings.length,
    traceGapCount: traceGaps.length,
    missingDraftCount: missingDrafts.length,
    compareRegressionCount: compareRegressions.length,
    artifactReadinessBlockerCount: artifactReadinessBlockers.length,
    artifactReviewBlockerCount: artifactReviewBlockers.length,
    artifactWarningCount: artifactWarnings.length,
    staleArtifactCount: staleArtifact ? 1 : 0,
    blockers: toSummaryItems(blockers),
    warnings: toSummaryItems(warnings),
    traceGaps: toSummaryItems(traceGaps),
    missingDrafts: toSummaryItems(missingDrafts),
    compareRegressions: toSummaryItems(compareRegressions),
    artifactGateProblems,
  }
}

function buildBranchProblems(
  branchWorkspace: BookExperimentBranchWorkspaceViewModel | null,
  locale: 'en' | 'zh-CN',
): BookDraftBranchProblems | null {
  if (!branchWorkspace) {
    return null
  }

  const blockers = branchWorkspace.readiness.issues.filter((issue) => issue.severity === 'blocker')
  const warnings = branchWorkspace.readiness.issues.filter((issue) => issue.severity === 'warning')
  const sceneRows = branchWorkspace.chapters.flatMap((chapter) =>
    chapter.sceneDeltas.map((scene) => ({ chapter, scene })),
  )
  const draftMissingScenes = sceneRows.filter(({ scene }) => scene.delta === 'draft_missing')
  const traceRegressions = sceneRows.filter(
    ({ scene }) => scene.traceReadyChanged && scene.baselineScene?.traceReady && !scene.branchScene?.traceReady,
  )
  const warningIncreases = sceneRows.filter(({ scene }) => scene.warningsDelta > 0)
  const addedWithoutSource = sceneRows.filter(
    ({ scene }) => scene.delta === 'added' && (scene.branchSourceProposalCount ?? 0) <= 0,
  )
  const toIssueItems = (issues: typeof blockers) =>
    issues.map((issue) => ({
      chapterId: `${issue.chapterId ?? 'branch'}:${issue.id}`,
      title: issue.chapterId
        ? branchWorkspace.chapters.find((chapter) => chapter.chapterId === issue.chapterId)?.title ?? branchWorkspace.title
        : branchWorkspace.title,
      detail: issue.detail,
    }))
  const toSceneItems = (rows: typeof draftMissingScenes, buildDetail: (sceneTitle: string, chapterTitle: string) => string) =>
    rows.map(({ chapter, scene }) => ({
      chapterId: `${chapter.chapterId}:${scene.sceneId}`,
      title: chapter.title,
      detail: buildDetail(scene.title, chapter.title),
    }))

  return {
    blockerCount: blockers.length,
    warningCount: warnings.length,
    draftMissingSceneCount: draftMissingScenes.length,
    traceRegressionCount: traceRegressions.length,
    warningIncreaseCount: warningIncreases.length,
    addedWithoutSourceCount: addedWithoutSource.length,
    blockers: toIssueItems(blockers),
    warnings: toIssueItems(warnings),
    draftMissingScenes: toSceneItems(draftMissingScenes, (sceneTitle) =>
      locale === 'zh-CN' ? `${sceneTitle} 仍然缺少分支正文。` : `${sceneTitle} is still draft-missing in the branch.`,
    ),
    traceRegressions: toSceneItems(traceRegressions, (sceneTitle) =>
      locale === 'zh-CN' ? `${sceneTitle} 相对基线失去了溯源就绪。` : `${sceneTitle} lost trace readiness against the baseline.`,
    ),
    warningIncreases: toSceneItems(warningIncreases, (sceneTitle) =>
      locale === 'zh-CN' ? `${sceneTitle} 的警告继续上升。` : `${sceneTitle} increases warning pressure against the baseline.`,
    ),
    addedWithoutSource: toSceneItems(addedWithoutSource, (sceneTitle) =>
      locale === 'zh-CN' ? `${sceneTitle} 是没有来源提案的新增场景。` : `${sceneTitle} was added without a source proposal.`,
    ),
  }
}

export function buildReviewProblems(reviewInbox: BookReviewInboxViewModel | null): BookDraftReviewProblems | null {
  if (!reviewInbox) {
    return null
  }

  const blockers = reviewInbox.issues.filter((issue) => issue.severity === 'blocker')
  const traceGaps = reviewInbox.issues.filter((issue) => issue.kind === 'trace_gap')
  const missingDrafts = reviewInbox.issues.filter((issue) => issue.kind === 'missing_draft')
  const exportBlockers = reviewInbox.issues.filter((issue) => issue.source === 'export' && issue.severity === 'blocker')
  const branchBlockers = reviewInbox.issues.filter((issue) => issue.source === 'branch' && issue.severity === 'blocker')
  const openIssues = reviewInbox.issues.filter(
    (issue) => issue.decision.status === 'open' || issue.decision.status === 'stale',
  )
  const toItems = (issues: typeof blockers) =>
    issues.map((issue) => ({
      chapterId: `${issue.chapterId ?? 'review'}:${issue.id}`,
      title: issue.chapterTitle ?? reviewInbox.title,
      detail: issue.detail,
    }))

  return {
    blockerCount: blockers.length,
    traceGapCount: traceGaps.length,
    missingDraftCount: missingDrafts.length,
    exportBlockerCount: exportBlockers.length,
    branchBlockerCount: branchBlockers.length,
    openCount: reviewInbox.counts.open,
    actionedCount: reviewInbox.counts.reviewed + reviewInbox.counts.deferred + reviewInbox.counts.dismissed,
    staleCount: reviewInbox.counts.stale,
    openWithoutFixStartedCount: openIssues.filter((issue) => issue.fixAction.status === 'not_started').length,
    blockedFixCount: reviewInbox.issues.filter((issue) => issue.fixAction.status === 'blocked').length,
    staleFixCount: reviewInbox.issues.filter((issue) => issue.fixAction.status === 'stale').length,
    checkedStillOpenCount: openIssues.filter((issue) => issue.fixAction.status === 'checked').length,
    blockers: toItems(blockers),
    traceGaps: toItems(traceGaps),
    missingDrafts: toItems(missingDrafts),
    exportBlockers: toItems(exportBlockers),
    branchBlockers: toItems(branchBlockers),
  }
}

export function BookDraftDockContainer({
  workspace,
  activeDraftView,
  compare = null,
  branch = null,
  exportPreview = null,
  artifactWorkspace = null,
  reviewInbox = null,
  exportError = null,
  latestHandoff = null,
  activityRevision = 0,
}: BookDraftDockContainerProps) {
  const { locale } = useI18n()
  const selectedChapter =
    activeDraftView === 'branch' && branch?.selectedChapter
      ? {
          id: branch.selectedChapter.chapterId,
          title: branch.selectedChapter.title,
          summary: branch.selectedChapter.summary,
        }
      : workspace.selectedChapter
        ? {
            id: workspace.selectedChapter.chapterId,
            title: workspace.selectedChapter.title,
            summary: workspace.selectedChapter.summary,
          }
        : null
  const activity = useBookWorkbenchActivity({
    bookId: workspace.bookId,
    activeLens: 'draft',
    activeView: 'sequence',
    activeDraftView,
    selectedReviewFilter: activeDraftView === 'review' ? reviewInbox?.activeFilter ?? 'all' : 'all',
    selectedReviewIssue:
      activeDraftView === 'review' && reviewInbox?.selectedIssue
        ? {
            id: reviewInbox.selectedIssue.id,
            title: reviewInbox.selectedIssue.title,
            sourceLabel: reviewInbox.selectedIssue.sourceLabel,
            chapterTitle: reviewInbox.selectedIssue.chapterTitle,
            sceneTitle: reviewInbox.selectedIssue.sceneTitle,
          }
        : null,
    selectedCheckpoint:
      activeDraftView === 'compare' && compare
        ? {
            id: compare.checkpoint.checkpointId,
            title: compare.checkpoint.title,
            summary: compare.checkpoint.summary,
          }
        : null,
    selectedExportProfile:
      activeDraftView === 'export' && exportPreview
        ? {
            id: exportPreview.profile.exportProfileId,
            title: exportPreview.profile.title,
            summary: exportPreview.profile.summary,
          }
        : null,
    selectedBranch:
      activeDraftView === 'branch' && branch?.branch
        ? {
            id: branch.branch.branchId,
            title: branch.branch.title,
            summary: branch.branch.rationale || branch.branch.summary,
          }
        : null,
    selectedBranchBaseline:
      activeDraftView === 'branch' && branch
        ? {
            id: `${branch.baseline.kind}:${branch.baseline.checkpointId ?? 'current'}`,
            title: branch.baseline.label,
            kind: branch.baseline.kind,
            checkpointId: branch.baseline.checkpointId,
          }
        : null,
    latestHandoff,
    activityRevision,
    selectedChapter,
  })

  return (
    <BookDraftBottomDock
      summary={workspace.dockSummary}
      activity={activity}
      activeDraftView={activeDraftView}
      compareProblems={buildBookDraftCompareProblems(compare, locale)}
      branchProblems={buildBranchProblems(branch, locale)}
      exportProblems={buildExportProblems(exportPreview, artifactWorkspace, locale)}
      reviewProblems={buildReviewProblems(reviewInbox)}
      exportError={exportError}
    />
  )
}
