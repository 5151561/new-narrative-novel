import type { BookExperimentBranchWorkspaceViewModel } from '@/features/book/types/book-branch-view-models'
import type { BookManuscriptCompareSceneViewModel, BookManuscriptCompareWorkspaceViewModel } from '@/features/book/types/book-compare-view-models'
import type { BookDraftChapterViewModel, BookDraftSceneSectionViewModel, BookDraftWorkspaceViewModel } from '@/features/book/types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '@/features/book/types/book-export-view-models'
import type { BookReviewFilter, BookReviewStatusFilter } from '@/features/workbench/types/workbench-route'

import type { BookReviewSeedRecord } from '../api/book-review-seeds'
import type { ReviewIssueDecisionRecord } from '../api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '../api/review-fix-action-records'
import type {
  BookReviewInboxCountsViewModel,
  BookReviewInboxViewModel,
  ReviewIssueDecisionViewModel,
  ReviewIssueFixActionViewModel,
  ReviewIssueGroupsViewModel,
  ReviewIssueViewModel,
  ReviewSourceHandoffViewModel,
} from '../types/review-view-models'

interface BuildBookReviewInboxViewModelInput {
  bookId: string
  currentDraftWorkspace: BookDraftWorkspaceViewModel
  compareWorkspace?: BookManuscriptCompareWorkspaceViewModel | null
  exportWorkspace?: BookExportPreviewWorkspaceViewModel | null
  branchWorkspace?: BookExperimentBranchWorkspaceViewModel | null
  reviewSeeds?: BookReviewSeedRecord[]
  reviewFilter?: BookReviewFilter
  reviewStatusFilter?: BookReviewStatusFilter
  reviewIssueId?: string
  decisionRecords?: ReviewIssueDecisionRecord[]
  fixActions?: ReviewIssueFixActionRecord[]
}

type ReviewIssueBase = Omit<ReviewIssueViewModel, 'issueSignature' | 'decision' | 'fixAction' | 'primaryFixHandoff'>

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
  continuity: 4,
  'asset-consistency': 5,
  'stale-prose': 6,
  manuscript: 7,
  'scene-proposal': 8,
  'chapter-draft': 9,
} as const

function createHandoff(id: string, label: string, target: ReviewSourceHandoffViewModel['target']): ReviewSourceHandoffViewModel {
  return { id, label, target }
}

function createOpenDecision(): ReviewIssueDecisionViewModel {
  return {
    status: 'open',
    isStale: false,
  }
}

function createNotStartedFixAction(): ReviewIssueFixActionViewModel {
  return {
    status: 'not_started',
    isStale: false,
  }
}

export function createReviewIssueSignature(issue: Pick<
  ReviewIssueBase,
  'id' | 'kind' | 'source' | 'chapterId' | 'sceneId' | 'assetId' | 'title' | 'detail' | 'sourceExcerpt'
>) {
  return [
    issue.id,
    issue.kind,
    issue.source,
    issue.chapterId ?? '',
    issue.sceneId ?? '',
    issue.assetId ?? '',
    issue.title,
    issue.detail,
    issue.sourceExcerpt ?? '',
  ].join('::')
}

function findBookDraftHandoff(issue: ReviewIssueViewModel, draftView: 'compare' | 'export' | 'branch') {
  return issue.handoffs.find((handoff) => handoff.target.scope === 'book' && handoff.target.draftView === draftView)
}

function findBookReviewHandoff(issue: ReviewIssueViewModel) {
  return issue.handoffs.find((handoff) => handoff.target.scope === 'book' && handoff.target.draftView === 'review')
}

function findChapterDraftHandoff(issue: ReviewIssueViewModel) {
  return issue.handoffs.find((handoff) => handoff.target.scope === 'chapter' && handoff.target.lens === 'draft')
}

function findSceneFixHandoff(issue: ReviewIssueViewModel) {
  return issue.handoffs.find(
    (handoff) =>
      handoff.target.scope === 'scene' && (handoff.target.lens === 'orchestrate' || handoff.target.lens === 'draft'),
  )
}

function findSceneOrchestrateHandoff(issue: ReviewIssueViewModel) {
  return issue.handoffs.find((handoff) => handoff.target.scope === 'scene' && handoff.target.lens === 'orchestrate')
}

function findAssetKnowledgeHandoff(issue: ReviewIssueViewModel) {
  return issue.handoffs.find((handoff) => handoff.target.scope === 'asset' && handoff.target.lens === 'knowledge')
}

export function selectPrimaryReviewFixHandoff(issue: ReviewIssueViewModel): ReviewSourceHandoffViewModel | null {
  if (issue.source === 'export') {
    return findBookDraftHandoff(issue, 'export') ?? issue.handoffs[0] ?? null
  }

  if (issue.source === 'branch') {
    return findBookDraftHandoff(issue, 'branch') ?? issue.handoffs[0] ?? null
  }

  if (issue.source === 'compare') {
    return findBookDraftHandoff(issue, 'compare') ?? issue.handoffs[0] ?? null
  }

  if (issue.kind === 'missing_draft' || issue.source === 'chapter-draft') {
    return findChapterDraftHandoff(issue) ?? issue.handoffs[0] ?? null
  }

  if (issue.source === 'scene-proposal') {
    return findSceneOrchestrateHandoff(issue) ?? issue.handoffs[0] ?? null
  }

  if (issue.source === 'continuity') {
    return findBookReviewHandoff(issue) ?? issue.handoffs[0] ?? null
  }

  if (issue.kind === 'trace_gap' || issue.kind === 'missing_trace') {
    return findChapterDraftHandoff(issue) ?? findSceneFixHandoff(issue) ?? issue.handoffs[0] ?? null
  }

  if (issue.assetId) {
    return findAssetKnowledgeHandoff(issue) ?? issue.handoffs[0] ?? null
  }

  return issue.handoffs[0] ?? null
}

function hydrateReviewIssue(issue: ReviewIssueBase): ReviewIssueViewModel {
  const hydratedIssue: ReviewIssueViewModel = {
    ...issue,
    issueSignature: createReviewIssueSignature(issue),
    decision: createOpenDecision(),
    fixAction: createNotStartedFixAction(),
    primaryFixHandoff: null,
  }

  return {
    ...hydratedIssue,
    primaryFixHandoff: selectPrimaryReviewFixHandoff(hydratedIssue),
  }
}

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
    return issues.filter((issue) => issue.kind === 'trace_gap' || issue.kind === 'missing_trace')
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

export function filterReviewIssuesByStatus(issues: ReviewIssueViewModel[], statusFilter: BookReviewStatusFilter) {
  if (statusFilter === 'all') {
    return issues
  }

  if (statusFilter === 'open') {
    return issues.filter((issue) => issue.decision.status === 'open' || issue.decision.status === 'stale')
  }

  return issues.filter((issue) => issue.decision.status === statusFilter)
}

export function applyReviewDecisionsToIssues({
  issues,
  decisions,
}: {
  issues: ReviewIssueViewModel[]
  decisions: ReviewIssueDecisionRecord[]
}): ReviewIssueViewModel[] {
  const decisionsByIssueId = new Map(decisions.map((record) => [record.issueId, record]))

  return issues.map((issue) => {
    const decisionRecord = decisionsByIssueId.get(issue.id)
    if (!decisionRecord) {
      return issue
    }

    if (decisionRecord.issueSignature !== issue.issueSignature) {
      return {
        ...issue,
        decision: {
          status: 'stale',
          note: decisionRecord.note,
          updatedAtLabel: decisionRecord.updatedAtLabel,
          updatedByLabel: decisionRecord.updatedByLabel,
          isStale: true,
        },
      }
    }

    return {
      ...issue,
      decision: {
        status: decisionRecord.status,
        note: decisionRecord.note,
        updatedAtLabel: decisionRecord.updatedAtLabel,
        updatedByLabel: decisionRecord.updatedByLabel,
        isStale: false,
      },
    }
  })
}

export function applyReviewFixActionsToIssues({
  issues,
  fixActions,
}: {
  issues: ReviewIssueViewModel[]
  fixActions: ReviewIssueFixActionRecord[]
}): ReviewIssueViewModel[] {
  const fixActionsByIssueId = new Map(fixActions.map((record) => [record.issueId, record]))

  return issues.map((issue) => {
    const fixActionRecord = fixActionsByIssueId.get(issue.id)
    if (!fixActionRecord) {
      return issue
    }

    if (fixActionRecord.issueSignature !== issue.issueSignature) {
      return {
        ...issue,
        fixAction: {
          status: 'stale',
          sourceHandoffId: fixActionRecord.sourceHandoffId,
          sourceHandoffLabel: fixActionRecord.sourceHandoffLabel,
          targetScope: fixActionRecord.targetScope,
          note: fixActionRecord.note,
          rewriteRequestNote: fixActionRecord.rewriteRequestNote,
          rewriteTargetSceneId: fixActionRecord.rewriteTargetSceneId,
          rewriteRequestId: fixActionRecord.rewriteRequestId,
          startedAtLabel: fixActionRecord.startedAtLabel,
          updatedAtLabel: fixActionRecord.updatedAtLabel,
          updatedByLabel: fixActionRecord.updatedByLabel,
          isStale: true,
        },
      }
    }

    return {
      ...issue,
      fixAction: {
        status: fixActionRecord.status,
        sourceHandoffId: fixActionRecord.sourceHandoffId,
        sourceHandoffLabel: fixActionRecord.sourceHandoffLabel,
        targetScope: fixActionRecord.targetScope,
        note: fixActionRecord.note,
        rewriteRequestNote: fixActionRecord.rewriteRequestNote,
        rewriteTargetSceneId: fixActionRecord.rewriteTargetSceneId,
        rewriteRequestId: fixActionRecord.rewriteRequestId,
        startedAtLabel: fixActionRecord.startedAtLabel,
        updatedAtLabel: fixActionRecord.updatedAtLabel,
        updatedByLabel: fixActionRecord.updatedByLabel,
        isStale: false,
      },
    }
  })
}

function buildIssueGroups(issues: ReviewIssueViewModel[]): ReviewIssueGroupsViewModel {
  return {
    blockers: issues.filter((issue) => issue.severity === 'blocker'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
    info: issues.filter((issue) => issue.severity === 'info'),
  }
}

function buildCounts(issues: ReviewIssueViewModel[]): BookReviewInboxCountsViewModel {
  return {
    total: issues.length,
    blockers: issues.filter((issue) => issue.severity === 'blocker').length,
    warnings: issues.filter((issue) => issue.severity === 'warning').length,
    info: issues.filter((issue) => issue.severity === 'info').length,
    traceGaps: issues.filter((issue) => issue.kind === 'trace_gap').length,
    continuityConflicts: issues.filter((issue) => issue.kind === 'continuity_conflict').length,
    assetInconsistencies: issues.filter((issue) => issue.kind === 'asset_inconsistency').length,
    missingTrace: issues.filter((issue) => issue.kind === 'missing_trace').length,
    staleProse: issues.filter((issue) => issue.kind === 'stale_prose_after_canon_change').length,
    chapterGaps: issues.filter((issue) => issue.kind === 'chapter_gap').length,
    rewriteRequests: issues.filter((issue) => issue.kind === 'rewrite_request').length,
    missingDrafts: issues.filter((issue) => issue.kind === 'missing_draft').length,
    compareDeltas: issues.filter((issue) => issue.source === 'compare').length,
    exportReadiness: issues.filter((issue) => issue.source === 'export').length,
    branchReadiness: issues.filter((issue) => issue.source === 'branch').length,
    sceneProposals: issues.filter((issue) => issue.source === 'scene-proposal').length,
    open: issues.filter((issue) => issue.decision.status === 'open' || issue.decision.status === 'stale').length,
    reviewed: issues.filter((issue) => issue.decision.status === 'reviewed').length,
    deferred: issues.filter((issue) => issue.decision.status === 'deferred').length,
    dismissed: issues.filter((issue) => issue.decision.status === 'dismissed').length,
    stale: issues.filter((issue) => issue.decision.status === 'stale').length,
    fixStarted: issues.filter((issue) => issue.fixAction.status === 'started').length,
    fixChecked: issues.filter((issue) => issue.fixAction.status === 'checked').length,
    fixBlocked: issues.filter((issue) => issue.fixAction.status === 'blocked').length,
    fixStale: issues.filter((issue) => issue.fixAction.status === 'stale').length,
  }
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

function createChapterDraftHandoff(issueId: string, chapterId: string, sceneId?: string) {
  return createHandoff(`${issueId}::chapter-draft`, 'Open chapter draft', {
    scope: 'chapter',
    chapterId,
    lens: 'draft',
    view: 'sequence',
    sceneId,
  })
}

function createChapterStructureHandoff(issueId: string, chapterId: string, sceneId?: string) {
  return createHandoff(`${issueId}::chapter-structure`, 'Open chapter structure', {
    scope: 'chapter',
    chapterId,
    lens: 'structure',
    view: 'sequence',
    sceneId,
  })
}

function createCurrentDraftIssue(
  issueId: string,
  chapter: BookDraftChapterViewModel,
  section: BookDraftSceneSectionViewModel,
  overrides: Pick<
    ReviewIssueBase,
    'severity' | 'source' | 'kind' | 'title' | 'detail' | 'recommendation' | 'sourceLabel' | 'tags'
  >,
): ReviewIssueBase {
  return {
    id: issueId,
    chapterId: chapter.chapterId,
    chapterTitle: chapter.title,
    chapterOrder: chapter.order,
    sceneId: section.sceneId,
    sceneTitle: section.title,
    sceneOrder: section.order,
    sourceExcerpt: section.proseDraft ?? section.summary,
    handoffs: [createChapterDraftHandoff(issueId, chapter.chapterId, section.sceneId)],
    ...overrides,
  }
}

function buildDraftIssues(currentDraftWorkspace: BookDraftWorkspaceViewModel): ReviewIssueBase[] {
  const issues: ReviewIssueBase[] = []
  const readableSections = currentDraftWorkspace.readableManuscript?.sections ?? []
  const sourceManifest = currentDraftWorkspace.readableManuscript?.sourceManifest ?? []
  const readableSceneDraftSectionKindsByChapterId = readableSections.reduce<Record<string, number>>(
    (counts, section) => {
      if (section.kind === 'scene-draft') {
        counts[section.chapterId] = (counts[section.chapterId] ?? 0) + 1
      }
      return counts
    },
    {},
  )
  const acceptedFactsBySceneId = sourceManifest.reduce<Record<string, number>>((counts, entry) => {
    if (!entry.sceneId) {
      return counts
    }

    counts[entry.sceneId] = Math.max(counts[entry.sceneId] ?? 0, entry.acceptedFactIds.length)
    return counts
  }, {})

  for (const chapter of currentDraftWorkspace.chapters) {
    if ((readableSceneDraftSectionKindsByChapterId[chapter.chapterId] ?? 0) === 0) {
      const issueId = `chapter-gap-${chapter.chapterId}`
      issues.push({
        id: issueId,
        severity: 'warning',
        source: 'manuscript',
        kind: 'chapter_gap',
        title: 'Readable chapter gap',
        detail: `${chapter.title} has no readable scene draft sections in the current manuscript assembly.`,
        recommendation: 'Open chapter structure and the book draft reader to inspect why this chapter still assembles as a gap.',
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        sourceLabel: 'Readable manuscript',
        sourceExcerpt: chapter.summary,
        tags: ['Chapter gap', 'Readable manuscript'],
        handoffs: [
          createChapterStructureHandoff(issueId, chapter.chapterId),
          createHandoff(`${issueId}::book-read`, 'Open book draft read', {
            scope: 'book',
            lens: 'draft',
            view: 'sequence',
            draftView: 'read',
            selectedChapterId: chapter.chapterId,
            reviewIssueId: issueId,
          }),
        ],
      })
    }

    for (const section of chapter.sections) {
      if (section.isMissingDraft) {
        const issueId = `draft-missing-${chapter.chapterId}-${section.sceneId}`
        issues.push(
          createCurrentDraftIssue(issueId, chapter, section, {
            severity: 'blocker',
            source: 'manuscript',
            kind: 'missing_draft',
            title: 'Draft missing',
            detail: `${section.title} still needs current draft prose.`,
            recommendation: 'Open the chapter draft and complete the missing scene prose before the next manuscript review.',
            sourceLabel: 'Current manuscript',
            tags: ['Missing draft', 'Current manuscript'],
          }),
        )
      }

      if (!section.traceReady) {
        const issueId = `trace-gap-${chapter.chapterId}-${section.sceneId}`
        const hasTraceRefs =
          section.relatedAssetCount > 0 ||
          section.sourceProposalCount > 0 ||
          (acceptedFactsBySceneId[section.sceneId] ?? 0) > 0
        issues.push(
          createCurrentDraftIssue(issueId, chapter, section, {
            severity: 'warning',
            source: 'traceability',
            kind: hasTraceRefs ? 'trace_gap' : 'missing_trace',
            title: hasTraceRefs ? 'Trace gap' : 'Trace references missing',
            detail: hasTraceRefs
              ? `${section.title} still lacks trace coverage in the current draft.`
              : `${section.title} currently has no trace references in the current draft.`,
            recommendation: hasTraceRefs
              ? 'Open the chapter draft and add the missing trace coverage for this scene.'
              : 'Open the chapter draft and restore the missing trace references for this scene.',
            sourceLabel: 'Current trace coverage',
            tags: [hasTraceRefs ? 'Trace gap' : 'Missing trace', 'Current manuscript'],
          }),
        )
      }
    }

    if (chapter.warningsCount > 0) {
      const issueId = `draft-warning-pressure-${chapter.chapterId}`
      issues.push({
        id: issueId,
        severity: 'warning',
        source: 'chapter-draft',
        kind: 'chapter_annotation',
        title: 'Draft warnings need review',
        detail: `${chapter.title} still carries ${chapter.warningsCount} draft warning${chapter.warningsCount === 1 ? '' : 's'}.`,
        recommendation: 'Open the chapter draft and clear the remaining warning-heavy passages before moving on.',
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        sourceLabel: 'Current chapter draft',
        sourceExcerpt: chapter.summary,
        tags: ['Warnings', 'Chapter draft'],
        handoffs: [
          createChapterDraftHandoff(issueId, chapter.chapterId),
          createChapterStructureHandoff(issueId, chapter.chapterId),
        ],
      })
    }

    if (chapter.queuedRevisionCount > 0) {
      const issueId = `draft-queued-revision-${chapter.chapterId}`
      issues.push({
        id: issueId,
        severity: 'info',
        source: 'chapter-draft',
        kind: 'chapter_annotation',
        title: 'Queued revisions remain',
        detail: `${chapter.title} still has ${chapter.queuedRevisionCount} queued revision${chapter.queuedRevisionCount === 1 ? '' : 's'}.`,
        recommendation: 'Open the chapter draft and review the queued revisions before the next comparison pass.',
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        sourceLabel: 'Current chapter draft',
        sourceExcerpt: chapter.summary,
        tags: ['Queued revision', 'Chapter draft'],
        handoffs: [createChapterDraftHandoff(issueId, chapter.chapterId)],
      })
    }
  }

  return issues
}

function buildCompareSourceExcerpt(scene: BookManuscriptCompareSceneViewModel) {
  return scene.currentExcerpt ?? scene.checkpointExcerpt ?? scene.summary
}

function createCompareBookHandoff(
  issueId: string,
  compareWorkspace: BookManuscriptCompareWorkspaceViewModel,
  selectedChapterId?: string,
) {
  return createHandoff(`${issueId}::book-compare`, 'Open compare review', {
    scope: 'book',
    lens: 'draft',
    view: 'sequence',
    draftView: 'compare',
    checkpointId: compareWorkspace.checkpoint.checkpointId,
    selectedChapterId,
    reviewIssueId: issueId,
  })
}

function buildCompareIssues(compareWorkspace: BookManuscriptCompareWorkspaceViewModel | null | undefined): ReviewIssueBase[] {
  if (!compareWorkspace) {
    return []
  }

  const issues: ReviewIssueBase[] = []

  for (const chapter of compareWorkspace.chapters) {
    for (const scene of chapter.scenes) {
      if (scene.delta === 'draft_missing') {
        const issueId = `compare-draft-missing-${chapter.chapterId}-${scene.sceneId}`
        issues.push({
          id: issueId,
          severity: 'blocker',
          source: 'compare',
          kind: 'missing_draft',
          title: 'Compare draft missing',
          detail: `${scene.title} is still missing draft prose against the selected checkpoint.`,
          recommendation: 'Open compare review and reconcile the missing draft prose against the checkpoint before continuing.',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: scene.sceneId,
          sceneTitle: scene.title,
          sceneOrder: scene.order,
          sourceLabel: `Compare: ${compareWorkspace.checkpoint.title}`,
          sourceExcerpt: buildCompareSourceExcerpt(scene),
          tags: ['Missing draft', 'Compare delta'],
          handoffs: [
            createCompareBookHandoff(issueId, compareWorkspace, chapter.chapterId),
            createChapterDraftHandoff(issueId, chapter.chapterId, scene.sceneId),
          ],
        })
      }

      if (scene.delta !== 'unchanged' && scene.delta !== 'draft_missing') {
        const issueId = `compare-delta-${chapter.chapterId}-${scene.sceneId}`
        issues.push({
          id: issueId,
          severity: 'warning',
          source: 'compare',
          kind: 'compare_delta',
          title: 'Compare delta needs review',
          detail: `${scene.title} changed against the selected checkpoint.`,
          recommendation: 'Open compare review and verify whether the changed passage should be carried forward.',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: scene.sceneId,
          sceneTitle: scene.title,
          sceneOrder: scene.order,
          sourceLabel: `Compare: ${compareWorkspace.checkpoint.title}`,
          sourceExcerpt: buildCompareSourceExcerpt(scene),
          tags: ['Compare delta', scene.delta],
          handoffs: [
            createCompareBookHandoff(issueId, compareWorkspace, chapter.chapterId),
            createChapterDraftHandoff(issueId, chapter.chapterId, scene.sceneId),
          ],
        })
      }

      if (scene.traceReadyChanged) {
        const issueId = `compare-trace-gap-${chapter.chapterId}-${scene.sceneId}`
        issues.push({
          id: issueId,
          severity: 'warning',
          source: 'compare',
          kind: 'trace_gap',
          title: 'Compare trace regression',
          detail: `${scene.title} regressed in trace coverage against the selected checkpoint.`,
          recommendation: 'Open compare review and confirm whether the trace regression is intentional or needs correction.',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: scene.sceneId,
          sceneTitle: scene.title,
          sceneOrder: scene.order,
          sourceLabel: `Compare: ${compareWorkspace.checkpoint.title}`,
          sourceExcerpt: buildCompareSourceExcerpt(scene),
          tags: ['Trace gap', 'Compare delta'],
          handoffs: [
            createCompareBookHandoff(issueId, compareWorkspace, chapter.chapterId),
            createChapterDraftHandoff(issueId, chapter.chapterId, scene.sceneId),
          ],
        })
      }

      if (scene.warningsDelta > 0) {
        const issueId = `compare-warning-delta-${chapter.chapterId}-${scene.sceneId}`
        issues.push({
          id: issueId,
          severity: 'warning',
          source: 'compare',
          kind: 'compare_delta',
          title: 'Compare warnings increased',
          detail: `${scene.title} adds ${scene.warningsDelta} warning${scene.warningsDelta === 1 ? '' : 's'} against the selected checkpoint.`,
          recommendation: 'Open compare review and check whether the added warnings should block the current manuscript.',
          chapterId: chapter.chapterId,
          chapterTitle: chapter.title,
          chapterOrder: chapter.order,
          sceneId: scene.sceneId,
          sceneTitle: scene.title,
          sceneOrder: scene.order,
          sourceLabel: `Compare: ${compareWorkspace.checkpoint.title}`,
          sourceExcerpt: buildCompareSourceExcerpt(scene),
          tags: ['Compare delta', `Warnings +${scene.warningsDelta}`],
          handoffs: [
            createCompareBookHandoff(issueId, compareWorkspace, chapter.chapterId),
            createChapterDraftHandoff(issueId, chapter.chapterId, scene.sceneId),
          ],
        })
      }
    }
  }

  return issues
}

function createExportBookHandoff(
  issueId: string,
  exportWorkspace: BookExportPreviewWorkspaceViewModel,
  selectedChapterId?: string,
) {
  return createHandoff(`${issueId}::book-export`, 'Open export preview', {
    scope: 'book',
    lens: 'draft',
    view: 'sequence',
    draftView: 'export',
    exportProfileId: exportWorkspace.profile.exportProfileId,
    selectedChapterId,
    reviewIssueId: issueId,
  })
}

function buildExportIssues(exportWorkspace: BookExportPreviewWorkspaceViewModel | null | undefined): ReviewIssueBase[] {
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
      recommendation:
        issue.recommendedActionLabel?.trim()
          ? `${issue.recommendedActionLabel.trim()} in export preview, then clear the blocking source before packaging again.`
          : 'Open export preview and resolve the readiness issue before the next package review.',
      chapterId: issue.chapterId,
      chapterTitle: issue.chapterTitle,
      chapterOrder: chapter?.order,
      sceneId: issue.sceneId,
      sceneTitle: issue.sceneTitle,
      sceneOrder: scene?.order,
      sourceLabel: `Export readiness: ${exportWorkspace.profile.title}`,
      sourceExcerpt: scene?.proseDraft ?? scene?.summary ?? chapter?.summary,
      tags: [issue.severity === 'blocker' ? 'Export blocker' : 'Export warning', issue.kind],
      handoffs: [
        createExportBookHandoff(issue.id, exportWorkspace, issue.chapterId),
        ...(issue.chapterId ? [createChapterDraftHandoff(issue.id, issue.chapterId, issue.sceneId)] : []),
      ],
    } satisfies ReviewIssueBase
  })
}

function createBranchBookHandoff(
  issueId: string,
  branchWorkspace: BookExperimentBranchWorkspaceViewModel,
  selectedChapterId?: string,
) {
  return createHandoff(`${issueId}::book-branch`, 'Open branch review', {
    scope: 'book',
    lens: 'draft',
    view: 'sequence',
    draftView: 'branch',
    branchId: branchWorkspace.branch?.branchId,
    branchBaseline: branchWorkspace.baseline.kind,
    checkpointId: branchWorkspace.baseline.checkpointId,
    selectedChapterId,
    reviewIssueId: issueId,
  })
}

function buildBranchIssues(branchWorkspace: BookExperimentBranchWorkspaceViewModel | null | undefined): ReviewIssueBase[] {
  if (!branchWorkspace) {
    return []
  }

  const issues: ReviewIssueBase[] = branchWorkspace.readiness.issues.map((issue) => {
    const chapter = branchWorkspace.chapters.find((item) => item.chapterId === issue.chapterId)
    const scene = chapter?.sceneDeltas.find((item) => item.sceneId === issue.sceneId)

    return {
      id: issue.id,
      severity: issue.severity,
      source: 'branch',
      kind: issue.severity === 'blocker' ? 'branch_blocker' : 'branch_warning',
      title: issue.title,
      detail: issue.detail,
      recommendation:
        issue.severity === 'blocker'
          ? 'Open branch review and resolve the blocking branch delta before treating this branch as ready.'
          : 'Open branch review and confirm whether this branch warning still needs attention.',
      chapterId: issue.chapterId,
      chapterTitle: chapter?.title,
      chapterOrder: chapter?.order,
      sceneId: issue.sceneId,
      sceneTitle: scene?.title,
      sceneOrder: scene?.order,
      sourceLabel: `Branch readiness: ${branchWorkspace.branch?.title ?? branchWorkspace.title}`,
      sourceExcerpt:
        scene?.branchExcerpt ??
        scene?.baselineExcerpt ??
        scene?.branchScene?.proseDraft ??
        scene?.baselineScene?.proseDraft ??
        scene?.summary ??
        chapter?.summary,
      tags: [issue.severity === 'blocker' ? 'Branch blocker' : 'Branch warning'],
      handoffs: [
        createBranchBookHandoff(issue.id, branchWorkspace, issue.chapterId),
        ...(issue.chapterId ? [createChapterDraftHandoff(issue.id, issue.chapterId, issue.sceneId)] : []),
      ],
    } satisfies ReviewIssueBase
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
        recommendation: 'Open branch review and decide whether this added scene needs a supporting proposal before it can be kept.',
        chapterId: chapter.chapterId,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        sceneId: scene.sceneId,
        sceneTitle: scene.title,
        sceneOrder: scene.order,
        sourceLabel: `Branch readiness: ${branchWorkspace.branch?.title ?? branchWorkspace.title}`,
        sourceExcerpt: scene.branchExcerpt ?? scene.branchScene?.proseDraft ?? scene.summary,
        tags: ['Branch warning', 'Missing source proposal'],
        handoffs: [
          createBranchBookHandoff(derivedId, branchWorkspace, chapter.chapterId),
          createChapterDraftHandoff(derivedId, chapter.chapterId, scene.sceneId),
        ],
      })
    }
  }

  return issues
}

function buildSeedIssues(reviewSeeds: BookReviewSeedRecord[]): ReviewIssueBase[] {
  return reviewSeeds
    .filter((seed) => seed.source !== 'continuity' && seed.source !== 'asset-consistency' && seed.source !== 'stale-prose')
    .map((seed) => ({
      id: seed.id,
      severity: seed.severity,
      source: seed.source,
      kind: seed.kind,
      title: seed.title,
      detail: seed.detail,
      recommendation: seed.recommendation,
      chapterId: seed.chapterId,
      chapterTitle: seed.chapterTitle,
      chapterOrder: seed.chapterOrder,
      sceneId: seed.sceneId,
      sceneTitle: seed.sceneTitle,
      sceneOrder: seed.sceneOrder,
      assetId: seed.assetId,
      assetTitle: seed.assetTitle,
      sourceLabel: seed.sourceLabel,
      sourceExcerpt: seed.sourceExcerpt,
      tags: seed.tags,
      handoffs: seed.handoffs,
    }))
}

function buildContinuitySeedIssues(reviewSeeds: BookReviewSeedRecord[]): ReviewIssueBase[] {
  return reviewSeeds
    .filter((seed) => seed.source === 'continuity' || seed.source === 'asset-consistency' || seed.source === 'stale-prose')
    .map((seed) => ({
      id: seed.id,
      severity: seed.severity,
      source: seed.source,
    kind: seed.kind,
    title: seed.title,
    detail: seed.detail,
    recommendation: seed.recommendation,
    chapterId: seed.chapterId,
    chapterTitle: seed.chapterTitle,
    chapterOrder: seed.chapterOrder,
    sceneId: seed.sceneId,
    sceneTitle: seed.sceneTitle,
    sceneOrder: seed.sceneOrder,
    assetId: seed.assetId,
    assetTitle: seed.assetTitle,
    sourceLabel: seed.sourceLabel,
    sourceExcerpt: seed.sourceExcerpt,
    tags: seed.tags,
    handoffs: seed.handoffs,
    }))
}

export function buildBookReviewInboxViewModel({
  bookId,
  currentDraftWorkspace,
  compareWorkspace,
  exportWorkspace,
  branchWorkspace,
  reviewSeeds = [],
  reviewFilter = 'all',
  reviewStatusFilter = 'open',
  reviewIssueId,
  decisionRecords = [],
  fixActions = [],
}: BuildBookReviewInboxViewModelInput): BookReviewInboxViewModel {
  const hydratedIssues = [
    ...buildDraftIssues(currentDraftWorkspace),
    ...buildCompareIssues(compareWorkspace),
    ...buildExportIssues(exportWorkspace),
    ...buildBranchIssues(branchWorkspace),
    ...buildContinuitySeedIssues(reviewSeeds),
    ...buildSeedIssues(reviewSeeds),
  ]
    .map((issue) => hydrateReviewIssue(issue))
    .sort(sortReviewIssues)

  const issues = applyReviewFixActionsToIssues({
    issues: applyReviewDecisionsToIssues({
      issues: hydratedIssues,
      decisions: decisionRecords,
    }),
    fixActions,
  })

  const reviewFilteredIssues = filterReviewIssues(issues, reviewFilter)
  const filteredIssues = filterReviewIssuesByStatus(reviewFilteredIssues, reviewStatusFilter)
  const selectedIssue = filteredIssues.find((issue) => issue.id === reviewIssueId) ?? filteredIssues[0] ?? null
  const selectedChapterId = currentDraftWorkspace.selectedChapterId

  return {
    bookId,
    title: currentDraftWorkspace.title,
    selectedIssueId: selectedIssue?.id ?? null,
    selectedIssue,
    activeFilter: reviewFilter,
    activeStatusFilter: reviewStatusFilter,
    issues,
    filteredIssues,
    groupedIssues: buildIssueGroups(filteredIssues),
    counts: buildCounts(issues),
    visibleOpenCount: filterReviewIssuesByStatus(reviewFilteredIssues, 'open').length,
    selectedChapterIssueCount: selectedChapterId
      ? filteredIssues.filter((issue) => issue.chapterId === selectedChapterId).length
      : 0,
    annotationsByChapterId: buildAnnotationsByChapterId(issues),
  }
}
