import type { BookDraftView } from '@/features/workbench/types/workbench-route'

import { useI18n } from '@/app/i18n'

import { BookDraftBottomDock, type BookDraftBranchProblems, type BookDraftExportProblems } from '../components/BookDraftBottomDock'
import { useBookWorkbenchActivity, type BookWorkbenchHandoffEvent } from '../hooks/useBookWorkbenchActivity'
import { buildBookDraftCompareProblems } from '../lib/book-draft-compare-presentation'
import type { BookExperimentBranchWorkspaceViewModel } from '../types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'

interface BookDraftDockContainerProps {
  workspace: BookDraftWorkspaceViewModel
  activeDraftView: BookDraftView
  compare?: BookManuscriptCompareWorkspaceViewModel | null
  branch?: BookExperimentBranchWorkspaceViewModel | null
  exportPreview?: BookExportPreviewWorkspaceViewModel | null
  exportError?: Error | null
  latestHandoff?: BookWorkbenchHandoffEvent | null
}

function buildExportProblems(exportPreview: BookExportPreviewWorkspaceViewModel | null): BookDraftExportProblems | null {
  if (!exportPreview) {
    return null
  }

  const blockers = exportPreview.readiness.issues.filter((issue) => issue.severity === 'blocker')
  const warnings = exportPreview.readiness.issues.filter((issue) => issue.severity === 'warning')
  const traceGaps = exportPreview.readiness.issues.filter((issue) => issue.kind === 'trace_gap')
  const missingDrafts = exportPreview.readiness.issues.filter((issue) => issue.kind === 'missing_draft')
  const compareRegressions = exportPreview.readiness.issues.filter((issue) => issue.kind === 'compare_regression')
  const toSummaryItems = (issues: typeof blockers) =>
    issues.map((issue) => ({
      chapterId: `${issue.chapterId ?? 'export'}:${issue.id}`,
      title: issue.chapterTitle ?? exportPreview.title,
      detail: issue.detail,
    }))

  return {
    blockerCount: blockers.length,
    warningCount: warnings.length,
    traceGapCount: traceGaps.length,
    missingDraftCount: missingDrafts.length,
    compareRegressionCount: compareRegressions.length,
    blockers: toSummaryItems(blockers),
    warnings: toSummaryItems(warnings),
    traceGaps: toSummaryItems(traceGaps),
    missingDrafts: toSummaryItems(missingDrafts),
    compareRegressions: toSummaryItems(compareRegressions),
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

export function BookDraftDockContainer({
  workspace,
  activeDraftView,
  compare = null,
  branch = null,
  exportPreview = null,
  exportError = null,
  latestHandoff = null,
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
    selectedChapter,
  })

  return (
    <BookDraftBottomDock
      summary={workspace.dockSummary}
      activity={activity}
      activeDraftView={activeDraftView}
      compareProblems={buildBookDraftCompareProblems(compare, locale)}
      branchProblems={buildBranchProblems(branch, locale)}
      exportProblems={buildExportProblems(exportPreview)}
      exportError={exportError}
    />
  )
}
