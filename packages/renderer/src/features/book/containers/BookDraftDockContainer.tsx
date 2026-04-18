import type { BookDraftView } from '@/features/workbench/types/workbench-route'

import { useI18n } from '@/app/i18n'

import { BookDraftBottomDock, type BookDraftExportProblems } from '../components/BookDraftBottomDock'
import { useBookWorkbenchActivity, type BookWorkbenchHandoffEvent } from '../hooks/useBookWorkbenchActivity'
import { buildBookDraftCompareProblems } from '../lib/book-draft-compare-presentation'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'

interface BookDraftDockContainerProps {
  workspace: BookDraftWorkspaceViewModel
  activeDraftView: BookDraftView
  compare?: BookManuscriptCompareWorkspaceViewModel | null
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

export function BookDraftDockContainer({
  workspace,
  activeDraftView,
  compare = null,
  exportPreview = null,
  exportError = null,
  latestHandoff = null,
}: BookDraftDockContainerProps) {
  const { locale } = useI18n()
  const selectedChapter = workspace.selectedChapter
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
    latestHandoff,
    selectedChapter: selectedChapter
      ? {
          id: selectedChapter.chapterId,
          title: selectedChapter.title,
          summary: selectedChapter.summary,
        }
      : null,
  })

  return (
    <BookDraftBottomDock
      summary={workspace.dockSummary}
      activity={activity}
      activeDraftView={activeDraftView}
      compareProblems={buildBookDraftCompareProblems(compare, locale)}
      exportProblems={buildExportProblems(exportPreview)}
      exportError={exportError}
    />
  )
}
