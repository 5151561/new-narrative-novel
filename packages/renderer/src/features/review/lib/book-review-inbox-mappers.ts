import type { BookExperimentBranchWorkspaceViewModel } from '@/features/book/types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '@/features/book/types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '@/features/book/types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '@/features/book/types/book-export-view-models'
import type { BookReviewFilter } from '@/features/workbench/types/workbench-route'

import type { BookReviewSeedRecord } from '../api/book-review-seeds'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '../types/review-view-models'

interface BuildBookReviewInboxViewModelInput {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel
  compareWorkspace?: BookManuscriptCompareWorkspaceViewModel | null
  exportWorkspace?: BookExportPreviewWorkspaceViewModel | null
  branchWorkspace?: BookExperimentBranchWorkspaceViewModel | null
  reviewSeeds?: BookReviewSeedRecord[]
  reviewFilter?: BookReviewFilter
  reviewIssueId?: string
}

const SEVERITY_RANK = {
  blocker: 0,
  warning: 1,
  info: 2,
} as const

const SOURCE_RANK = {
  export: 0,
  branch: 1,
  compare: 2,
  traceability: 3,
  manuscript: 4,
  'scene-proposal': 5,
  'chapter-draft': 6,
} as const

function sortReviewIssues(left: ReviewIssueViewModel, right: ReviewIssueViewModel) {
  return (
    SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity] ||
    SOURCE_RANK[left.source] - SOURCE_RANK[right.source] ||
    (left.chapterOrder ?? Number.MAX_SAFE_INTEGER) - (right.chapterOrder ?? Number.MAX_SAFE_INTEGER) ||
    (left.sceneOrder ?? Number.MAX_SAFE_INTEGER) - (right.sceneOrder ?? Number.MAX_SAFE_INTEGER) ||
    left.id.localeCompare(right.id)
  )
}

function filterReviewIssues(issues: ReviewIssueViewModel[], reviewFilter: BookReviewFilter) {
  if (reviewFilter === 'all') {
    return issues
  }

  if (reviewFilter === 'blockers') {
    return issues.filter((issue) => issue.severity === 'blocker')
  }

  if (reviewFilter === 'trace-gaps') {
    return issues.filter((issue) => issue.kind === 'trace_gap')
  }

  if (reviewFilter === 'missing-drafts') {
    return issues.filter((issue) => issue.kind === 'missing_draft')
  }

  if (reviewFilter === 'compare-deltas') {
    return issues.filter((issue) => issue.source === 'compare')
  }

  if (reviewFilter === 'export-readiness') {
    return issues.filter((issue) => issue.source === 'export')
  }

  if (reviewFilter === 'branch-readiness') {
    return issues.filter((issue) => issue.source === 'branch')
  }

  return issues.filter((issue) => issue.source === 'scene-proposal')
}

function buildDraftIssues(currentDraftWorkspace: BookDraftWorkspaceViewModel): ReviewIssueViewModel[] {
  const issues: ReviewIssueViewModel[] = []

  for (const chapter of currentDraftWorkspace.chapters) {
    for (const section of chapter.sections) {
      if (section.isMissingDraft) {
        issues.push({
          id: `draft-missing-${chapter.chapterId}-${section.sceneId}`,
          severity: 'blocker',
          source: 'manuscript',
          kind: 'missing_draft',
          title: 'Draft missing',
          detail: `${section.title} still needs current draft prose.`,
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: section.sceneId,
          sceneTitle: section.title,
          sceneOrder: section.order,
          handoff: {
            label: 'Open draft workspace',
            draftView: 'read',
            reviewIssueId: `draft-missing-${chapter.chapterId}-${section.sceneId}`,
          },
        })
      }

      if (!section.traceReady) {
        issues.push({
          id: `trace-gap-${chapter.chapterId}-${section.sceneId}`,
          severity: 'warning',
          source: 'traceability',
          kind: 'trace_gap',
          title: 'Trace gap',
          detail: `${section.title} still lacks trace coverage in the current draft.`,
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: section.sceneId,
          sceneTitle: section.title,
          sceneOrder: section.order,
          handoff: {
            label: 'Open draft workspace',
            draftView: 'read',
            reviewIssueId: `trace-gap-${chapter.chapterId}-${section.sceneId}`,
          },
        })
      }
    }

    if (chapter.warningsCount > 0) {
      issues.push({
        id: `draft-warning-pressure-${chapter.chapterId}`,
        severity: 'warning',
        source: 'chapter-draft',
        kind: 'chapter_annotation',
        title: 'Draft warnings need review',
        detail: `${chapter.title} still carries ${chapter.warningsCount} draft warning${chapter.warningsCount === 1 ? '' : 's'}.`,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        handoff: {
          label: 'Open draft workspace',
          draftView: 'read',
          reviewIssueId: `draft-warning-pressure-${chapter.chapterId}`,
        },
      })
    }

    if (chapter.queuedRevisionCount > 0) {
      issues.push({
        id: `draft-queued-revision-${chapter.chapterId}`,
        severity: 'info',
        source: 'chapter-draft',
        kind: 'chapter_annotation',
        title: 'Queued revisions remain',
        detail: `${chapter.title} still has ${chapter.queuedRevisionCount} queued revision${chapter.queuedRevisionCount === 1 ? '' : 's'}.`,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        handoff: {
          label: 'Open draft workspace',
          draftView: 'read',
          reviewIssueId: `draft-queued-revision-${chapter.chapterId}`,
        },
      })
    }
  }

  return issues
}

function buildCompareIssues(compareWorkspace: BookManuscriptCompareWorkspaceViewModel | null | undefined): ReviewIssueViewModel[] {
  if (!compareWorkspace) {
    return []
  }

  const issues: ReviewIssueViewModel[] = []

  for (const chapter of compareWorkspace.chapters) {
    for (const scene of chapter.scenes) {
      if (scene.delta === 'draft_missing') {
        issues.push({
          id: `compare-draft-missing-${chapter.chapterId}-${scene.sceneId}`,
          severity: 'blocker',
          source: 'compare',
          kind: 'missing_draft',
          title: 'Compare draft missing',
          detail: `${scene.title} is still missing draft prose against the selected checkpoint.`,
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: scene.sceneId,
          sceneTitle: scene.title,
          sceneOrder: scene.order,
          handoff: {
            label: 'Open compare workspace',
            draftView: 'compare',
            checkpointId: compareWorkspace.checkpoint.checkpointId,
            reviewIssueId: `compare-draft-missing-${chapter.chapterId}-${scene.sceneId}`,
          },
        })
      }

      if (scene.delta !== 'unchanged' && scene.delta !== 'draft_missing') {
        issues.push({
          id: `compare-delta-${chapter.chapterId}-${scene.sceneId}`,
          severity: 'warning',
          source: 'compare',
          kind: 'compare_delta',
          title: 'Compare delta needs review',
          detail: `${scene.title} changed against the selected checkpoint.`,
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: scene.sceneId,
          sceneTitle: scene.title,
          sceneOrder: scene.order,
          handoff: {
            label: 'Open compare workspace',
            draftView: 'compare',
            checkpointId: compareWorkspace.checkpoint.checkpointId,
            reviewIssueId: `compare-delta-${chapter.chapterId}-${scene.sceneId}`,
          },
        })
      }

      if (scene.traceReadyChanged) {
        issues.push({
          id: `compare-trace-gap-${chapter.chapterId}-${scene.sceneId}`,
          severity: 'warning',
          source: 'compare',
          kind: 'trace_gap',
          title: 'Compare trace regression',
          detail: `${scene.title} regressed in trace coverage against the selected checkpoint.`,
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: scene.sceneId,
          sceneTitle: scene.title,
          sceneOrder: scene.order,
          handoff: {
            label: 'Open compare workspace',
            draftView: 'compare',
            checkpointId: compareWorkspace.checkpoint.checkpointId,
            reviewIssueId: `compare-trace-gap-${chapter.chapterId}-${scene.sceneId}`,
          },
        })
      }

      if (scene.warningsDelta > 0) {
        issues.push({
          id: `compare-warning-delta-${chapter.chapterId}-${scene.sceneId}`,
          severity: 'warning',
          source: 'compare',
          kind: 'compare_delta',
          title: 'Compare warnings increased',
          detail: `${scene.title} adds ${scene.warningsDelta} warning${scene.warningsDelta === 1 ? '' : 's'} against the selected checkpoint.`,
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: scene.sceneId,
          sceneTitle: scene.title,
          sceneOrder: scene.order,
          handoff: {
            label: 'Open compare workspace',
            draftView: 'compare',
            checkpointId: compareWorkspace.checkpoint.checkpointId,
            reviewIssueId: `compare-warning-delta-${chapter.chapterId}-${scene.sceneId}`,
          },
        })
      }
    }
  }

  return issues
}

function buildExportIssues(exportWorkspace: BookExportPreviewWorkspaceViewModel | null | undefined): ReviewIssueViewModel[] {
  if (!exportWorkspace) {
    return []
  }

  return exportWorkspace.readiness.issues.map((issue) => {
    const chapter = exportWorkspace.chapters.find((item) => item.chapterId === issue.chapterId)
    const scene = chapter?.scenes.find((item) => item.sceneId === issue.sceneId)

    return {
      id: issue.id,
      severity: issue.severity,
      source: 'export',
      kind: issue.severity === 'blocker' ? 'export_blocker' : 'export_warning',
      title: issue.title,
      detail: issue.detail,
      chapterId: issue.chapterId,
      chapterTitle: issue.chapterTitle,
      chapterOrder: chapter?.order,
      sceneId: issue.sceneId,
      sceneTitle: issue.sceneTitle,
      sceneOrder: scene?.order,
      handoff: {
        label: 'Open export preview',
        draftView: 'export',
        exportProfileId: exportWorkspace.profile.exportProfileId,
        reviewIssueId: issue.id,
      },
    } satisfies ReviewIssueViewModel
  })
}

function buildBranchIssues(branchWorkspace: BookExperimentBranchWorkspaceViewModel | null | undefined): ReviewIssueViewModel[] {
  if (!branchWorkspace) {
    return []
  }

  const issues: ReviewIssueViewModel[] = branchWorkspace.readiness.issues.map((issue) => {
    const chapter = branchWorkspace.chapters.find((item) => item.chapterId === issue.chapterId)
    const scene = chapter?.sceneDeltas.find((item) => item.sceneId === issue.sceneId)

    return {
      id: issue.id,
      severity: issue.severity,
      source: 'branch',
      kind: issue.severity === 'blocker' ? 'branch_blocker' : 'branch_warning',
      title: issue.title,
      detail: issue.detail,
      chapterId: issue.chapterId,
      chapterTitle: chapter?.title,
      chapterOrder: chapter?.order,
      sceneId: issue.sceneId,
      sceneTitle: scene?.title,
      sceneOrder: scene?.order,
      handoff: {
        label: 'Open branch workspace',
        draftView: 'branch',
        branchId: branchWorkspace.branch?.branchId,
        branchBaseline: branchWorkspace.baseline.kind,
        checkpointId: branchWorkspace.baseline.checkpointId,
        reviewIssueId: issue.id,
      },
    } satisfies ReviewIssueViewModel
  })

  const seenIds = new Set(issues.map((issue) => issue.id))

  for (const chapter of branchWorkspace.chapters) {
    for (const scene of chapter.sceneDeltas) {
      const derivedId = `branch-warning-added-without-source-${chapter.chapterId}-${scene.sceneId}`
      if (scene.delta !== 'added' || (scene.branchSourceProposalCount ?? 0) > 0 || seenIds.has(derivedId)) {
        continue
      }

      issues.push({
        id: derivedId,
        severity: 'warning',
        source: 'branch',
        kind: 'branch_warning',
        title: 'Added scene lacks source proposal',
        detail: `${scene.title} was added in the branch without a supporting source proposal.`,
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        sceneId: scene.sceneId,
        sceneTitle: scene.title,
        sceneOrder: scene.order,
        handoff: {
          label: 'Open branch workspace',
          draftView: 'branch',
          branchId: branchWorkspace.branch?.branchId,
          branchBaseline: branchWorkspace.baseline.kind,
          checkpointId: branchWorkspace.baseline.checkpointId,
          reviewIssueId: derivedId,
        },
      })
    }
  }

  return issues
}

function buildSeedIssues(reviewSeeds: BookReviewSeedRecord[]): ReviewIssueViewModel[] {
  return reviewSeeds.map((seed) => ({
    id: seed.id,
    severity: seed.severity,
    source: seed.source,
    kind: seed.kind,
    title: seed.title,
    detail: seed.detail,
    chapterId: seed.chapterId,
    chapterTitle: seed.chapterTitle,
    chapterOrder: seed.chapterOrder,
    sceneId: seed.sceneId,
    sceneTitle: seed.sceneTitle,
    sceneOrder: seed.sceneOrder,
    assetId: seed.assetId,
    assetTitle: seed.assetTitle,
    handoff: {
      ...seed.handoff,
      reviewIssueId: seed.handoff.reviewIssueId ?? seed.id,
    },
  }))
}

function buildAnnotationsByChapterId(issues: ReviewIssueViewModel[]) {
  return issues.reduce<Record<string, ReviewIssueViewModel[]>>((groups, issue) => {
    if (issue.kind !== 'chapter_annotation' || !issue.chapterId) {
      return groups
    }

    const current = groups[issue.chapterId] ?? []
    groups[issue.chapterId] = [...current, issue]
    return groups
  }, {})
}

export function buildBookReviewInboxViewModel({
  bookId,
  currentDraftWorkspace,
  compareWorkspace,
  exportWorkspace,
  branchWorkspace,
  reviewSeeds = [],
  reviewFilter = 'all',
  reviewIssueId,
}: BuildBookReviewInboxViewModelInput): BookReviewInboxViewModel {
  const issues = [
    ...buildDraftIssues(currentDraftWorkspace),
    ...buildCompareIssues(compareWorkspace),
    ...buildExportIssues(exportWorkspace),
    ...buildBranchIssues(branchWorkspace),
    ...buildSeedIssues(reviewSeeds),
  ].sort(sortReviewIssues)

  const filteredIssues = filterReviewIssues(issues, reviewFilter)
  const selectedIssue = filteredIssues.find((issue) => issue.id === reviewIssueId) ?? filteredIssues[0] ?? null

  return {
    bookId,
    reviewFilter,
    issues,
    filteredIssues,
    selectedIssueId: selectedIssue?.id ?? null,
    selectedIssue,
    annotationsByChapterId: buildAnnotationsByChapterId(issues),
  }
}
