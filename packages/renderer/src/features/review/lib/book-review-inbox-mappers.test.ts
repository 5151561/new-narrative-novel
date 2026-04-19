import { describe, expect, it } from 'vitest'

import type { BookExperimentBranchWorkspaceViewModel } from '@/features/book/types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '@/features/book/types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '@/features/book/types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '@/features/book/types/book-export-view-models'

import { getBookReviewSeeds } from '../api/book-review-seeds'
import { buildBookReviewInboxViewModel } from './book-review-inbox-mappers'

function createCurrentDraftWorkspace(): BookDraftWorkspaceViewModel {
  const workspace: BookDraftWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Draft workspace',
    selectedChapterId: 'chapter-1',
    assembledWordCount: 1800,
    draftedChapterCount: 2,
    missingDraftChapterCount: 1,
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 2,
        missingDraftChapterCount: 1,
        assembledWordCount: 1800,
        warningHeavyChapterCount: 1,
        missingTraceChapterCount: 1,
      },
      signals: {
        topMissingScenes: ['Scene One'],
        latestDiffSummaries: ['Scene Two tightened'],
        traceCoverageNote: 'One scene still needs trace coverage.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 1,
      missingTraceChapterCount: 1,
      warningsChapterCount: 1,
      queuedRevisionChapterCount: 1,
      highestPressureChapters: [],
      missingDraftChapters: [],
      missingTraceChapters: [],
      warningsChapters: [],
      queuedRevisionChapters: [],
    },
    chapters: [
      {
        chapterId: 'chapter-1',
        order: 1,
        title: 'Chapter One',
        summary: 'Opening chapter',
        sceneCount: 2,
        draftedSceneCount: 1,
        missingDraftCount: 1,
        assembledWordCount: 900,
        warningsCount: 2,
        queuedRevisionCount: 1,
        tracedSceneCount: 1,
        missingTraceSceneCount: 1,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-1',
            order: 1,
            title: 'Scene One',
            summary: 'Missing prose',
            proseDraft: undefined,
            isMissingDraft: true,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-2',
            order: 2,
            title: 'Scene Two',
            summary: 'Trace gap scene',
            proseDraft: 'Draft text.',
            draftWordCount: 2,
            isMissingDraft: false,
            warningsCount: 2,
            revisionQueueCount: 1,
            traceReady: false,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
        ],
      },
      {
        chapterId: 'chapter-2',
        order: 2,
        title: 'Chapter Two',
        summary: 'Middle chapter',
        sceneCount: 2,
        draftedSceneCount: 2,
        missingDraftCount: 0,
        assembledWordCount: 900,
        warningsCount: 0,
        queuedRevisionCount: 0,
        tracedSceneCount: 2,
        missingTraceSceneCount: 0,
        assembledProseSections: [],
        coverageStatus: 'ready',
        sections: [
          {
            sceneId: 'scene-3',
            order: 1,
            title: 'Scene Three',
            summary: 'Compare change scene',
            proseDraft: 'Draft text.',
            draftWordCount: 2,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-4',
            order: 2,
            title: 'Scene Four',
            summary: 'Branch warning scene',
            proseDraft: 'Draft text.',
            draftWordCount: 2,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
        ],
      },
    ],
  }

  workspace.selectedChapter = workspace.chapters[0]!
  workspace.inspector.selectedChapter = {
    chapterId: 'chapter-1',
    title: 'Chapter One',
    summary: 'Opening chapter',
    draftedSceneCount: 1,
    missingDraftCount: 1,
    tracedSceneCount: 1,
    missingTraceSceneCount: 1,
    warningsCount: 2,
    queuedRevisionCount: 1,
    assembledWordCount: 900,
    topMissingSceneTitles: ['Scene One'],
    traceCoverageNote: 'One scene still needs trace coverage.',
  }

  return workspace
}

function createCompareWorkspace(): BookManuscriptCompareWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Compare workspace',
    checkpoint: {
      checkpointId: 'checkpoint-1',
      bookId: 'book-signal-arc',
      title: 'Checkpoint One',
      createdAtLabel: '2026-04-18 20:10',
      summary: 'Checkpoint summary',
    },
    selectedChapterId: 'chapter-2',
    selectedChapter: null,
    totals: {
      chapterCount: 2,
      sceneCount: 4,
      missingCount: 0,
      addedCount: 0,
      draftMissingCount: 1,
      changedCount: 1,
      unchangedCount: 2,
      wordDelta: 12,
      traceRegressionCount: 1,
      warningsDelta: 1,
    },
    chapters: [
      {
        chapterId: 'chapter-1',
        order: 1,
        title: 'Chapter One',
        summary: 'Opening chapter',
        scenes: [
          {
            sceneId: 'scene-1',
            order: 1,
            title: 'Scene One',
            summary: 'Missing draft in compare',
            delta: 'draft_missing',
            currentWordCount: 0,
            checkpointWordCount: 120,
            wordDelta: -120,
            traceReadyChanged: false,
            warningsDelta: 0,
          },
        ],
        totals: {
          sceneCount: 1,
          missingCount: 0,
          addedCount: 0,
          draftMissingCount: 1,
          changedCount: 0,
          unchangedCount: 0,
          wordDelta: -120,
          traceRegressionCount: 0,
          warningsDelta: 0,
        },
        wordDelta: -120,
        traceRegressionCount: 0,
        warningsDelta: 0,
      },
      {
        chapterId: 'chapter-2',
        order: 2,
        title: 'Chapter Two',
        summary: 'Middle chapter',
        scenes: [
          {
            sceneId: 'scene-3',
            order: 1,
            title: 'Scene Three',
            summary: 'Changed scene',
            delta: 'changed',
            currentWordCount: 200,
            checkpointWordCount: 150,
            wordDelta: 50,
            traceReadyChanged: false,
            warningsDelta: 0,
          },
          {
            sceneId: 'scene-4',
            order: 2,
            title: 'Scene Four',
            summary: 'Trace regression scene',
            delta: 'changed',
            currentWordCount: 180,
            checkpointWordCount: 170,
            wordDelta: 10,
            traceReadyChanged: true,
            warningsDelta: 1,
          },
        ],
        totals: {
          sceneCount: 2,
          missingCount: 0,
          addedCount: 0,
          draftMissingCount: 0,
          changedCount: 2,
          unchangedCount: 0,
          wordDelta: 60,
          traceRegressionCount: 1,
          warningsDelta: 1,
        },
        wordDelta: 60,
        traceRegressionCount: 1,
        warningsDelta: 1,
      },
    ],
  }
}

function createExportWorkspace(): BookExportPreviewWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Export workspace',
    selectedChapterId: 'chapter-1',
    selectedChapter: null,
    profile: {
      exportProfileId: 'export-1',
      bookId: 'book-signal-arc',
      kind: 'review_packet',
      title: 'Review Packet',
      summary: 'Export review packet',
      createdAtLabel: '2026-04-18 20:12',
      includes: {
        manuscriptBody: true,
        chapterSummaries: true,
        sceneHeadings: true,
        traceAppendix: true,
        compareSummary: true,
        readinessChecklist: true,
      },
      rules: {
        requireAllScenesDrafted: true,
        requireTraceReady: true,
        allowWarnings: false,
        allowDraftMissing: false,
      },
    },
    chapters: [],
    totals: {
      includedChapterCount: 2,
      includedSceneCount: 4,
      assembledWordCount: 1800,
      blockerCount: 1,
      warningCount: 1,
      infoCount: 0,
      missingDraftCount: 1,
      traceGapCount: 1,
      compareChangedSceneCount: 2,
    },
    readiness: {
      status: 'blocked',
      label: 'Blocked',
      blockerCount: 1,
      warningCount: 1,
      infoCount: 0,
      issues: [
        {
          id: 'export-blocker-scene-1',
          severity: 'blocker',
          kind: 'missing_draft',
          chapterId: 'chapter-1',
          chapterTitle: 'Chapter One',
          sceneId: 'scene-1',
          sceneTitle: 'Scene One',
          title: 'Export blocker',
          detail: 'Scene One is still missing draft prose.',
        },
        {
          id: 'export-warning-chapter-2',
          severity: 'warning',
          kind: 'warning_delta',
          chapterId: 'chapter-2',
          chapterTitle: 'Chapter Two',
          title: 'Export warning',
          detail: 'Warnings still need review.',
        },
      ],
    },
    packageSummary: {
      includedSections: ['Manuscript'],
      excludedSections: [],
      estimatedPackageLabel: '12 pages',
    },
  }
}

function createBranchWorkspace(): BookExperimentBranchWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Branch workspace',
    selectedChapterId: 'chapter-2',
    selectedChapter: null,
    baseline: {
      kind: 'checkpoint',
      label: 'Checkpoint',
      checkpointId: 'checkpoint-1',
    },
    branch: {
      branchId: 'branch-1',
      bookId: 'book-signal-arc',
      title: 'Branch One',
      summary: 'Branch summary',
      rationale: 'Try a harder turn.',
      createdAtLabel: '2026-04-18 20:14',
      basedOnCheckpointId: 'checkpoint-1',
      status: 'review',
    },
    branches: [],
    totals: {
      changedChapterCount: 2,
      changedSceneCount: 1,
      addedSceneCount: 1,
      missingSceneCount: 0,
      draftMissingSceneCount: 1,
      wordDelta: 14,
      traceRegressionCount: 0,
      traceImprovementCount: 0,
      warningsDelta: 1,
      sourceProposalDelta: -1,
      blockedChapterCount: 1,
      attentionChapterCount: 1,
    },
    readiness: {
      status: 'blocked',
      label: 'Branch blocked',
      issues: [
        {
          id: 'branch-blocker-scene-2',
          severity: 'blocker',
          chapterId: 'chapter-1',
          sceneId: 'scene-2',
          title: 'Branch blocker',
          detail: 'Scene Two has no approved draft in branch.',
        },
        {
          id: 'branch-warning-scene-4',
          severity: 'warning',
          chapterId: 'chapter-2',
          sceneId: 'scene-4',
          title: 'Branch warning',
          detail: 'Scene Four increases warning pressure.',
        },
      ],
    },
    chapters: [
      {
        chapterId: 'chapter-1',
        order: 1,
        title: 'Chapter One',
        summary: 'Opening chapter',
        changedSceneCount: 0,
        addedSceneCount: 0,
        missingSceneCount: 0,
        draftMissingSceneCount: 1,
        wordDelta: -40,
        traceRegressionCount: 0,
        traceImprovementCount: 0,
        warningsDelta: 0,
        sourceProposalDelta: 0,
        readinessStatus: 'blocked',
        sceneDeltas: [
          {
            sceneId: 'scene-2',
            order: 2,
            title: 'Scene Two',
            summary: 'Missing branch draft',
            delta: 'draft_missing',
            wordDelta: -40,
            traceReadyChanged: false,
            warningsDelta: 0,
            sourceProposalDelta: 0,
          },
        ],
      },
      {
        chapterId: 'chapter-2',
        order: 2,
        title: 'Chapter Two',
        summary: 'Middle chapter',
        changedSceneCount: 1,
        addedSceneCount: 1,
        missingSceneCount: 0,
        draftMissingSceneCount: 0,
        wordDelta: 54,
        traceRegressionCount: 0,
        traceImprovementCount: 0,
        warningsDelta: 1,
        sourceProposalDelta: -1,
        readinessStatus: 'attention',
        sceneDeltas: [
          {
            sceneId: 'scene-4',
            order: 2,
            title: 'Scene Four',
            summary: 'Warning scene',
            delta: 'changed',
            wordDelta: 14,
            traceReadyChanged: false,
            warningsDelta: 1,
            sourceProposalDelta: 0,
            branchSourceProposalCount: 1,
            baselineSourceProposalCount: 1,
          },
          {
            sceneId: 'scene-5',
            order: 3,
            title: 'Scene Five',
            summary: 'Added without source',
            delta: 'added',
            wordDelta: 40,
            traceReadyChanged: false,
            warningsDelta: 0,
            sourceProposalDelta: -1,
            branchSourceProposalCount: 0,
            baselineSourceProposalCount: 1,
          },
        ],
      },
    ],
  }
}

function buildInbox(reviewFilter: 'all' | 'blockers' | 'branch-readiness' | 'scene-proposals' = 'all', reviewIssueId?: string) {
  return buildBookReviewInboxViewModel({
    bookId: 'book-signal-arc',
    currentDraftWorkspace: createCurrentDraftWorkspace(),
    compareWorkspace: createCompareWorkspace(),
    exportWorkspace: createExportWorkspace(),
    branchWorkspace: createBranchWorkspace(),
    reviewSeeds: getBookReviewSeeds('book-signal-arc'),
    reviewFilter,
    reviewIssueId,
  })
}

describe('buildBookReviewInboxViewModel', () => {
  it('maps a current draft missing scene into a missing_draft blocker', () => {
    const issue = buildInbox().issues.find((item) => item.id === 'draft-missing-chapter-1-scene-1')

    expect(issue).toMatchObject({
      kind: 'missing_draft',
      severity: 'blocker',
      source: 'manuscript',
      chapterId: 'chapter-1',
      sceneId: 'scene-1',
    })
  })

  it('maps a trace gap into a warning issue', () => {
    const issue = buildInbox().issues.find((item) => item.id === 'trace-gap-chapter-1-scene-2')

    expect(issue).toMatchObject({
      kind: 'trace_gap',
      severity: 'warning',
      source: 'traceability',
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
    })
  })

  it('maps a compare changed scene into a compare_delta issue', () => {
    const issue = buildInbox().issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')

    expect(issue).toMatchObject({
      kind: 'compare_delta',
      severity: 'warning',
      source: 'compare',
      chapterId: 'chapter-2',
      sceneId: 'scene-3',
    })
  })

  it('maps export blockers into export_blocker issues', () => {
    const issue = buildInbox().issues.find((item) => item.id === 'export-blocker-scene-1')

    expect(issue).toMatchObject({
      kind: 'export_blocker',
      severity: 'blocker',
      source: 'export',
      chapterId: 'chapter-1',
      sceneId: 'scene-1',
    })
  })

  it('maps branch blockers into branch_blocker issues', () => {
    const issue = buildInbox().issues.find((item) => item.id === 'branch-blocker-scene-2')

    expect(issue).toMatchObject({
      kind: 'branch_blocker',
      severity: 'blocker',
      source: 'branch',
      chapterId: 'chapter-1',
      sceneId: 'scene-2',
    })
  })

  it('maps branch warnings into branch_warning issues', () => {
    const issue = buildInbox().issues.find((item) => item.id === 'branch-warning-scene-4')

    expect(issue).toMatchObject({
      kind: 'branch_warning',
      severity: 'warning',
      source: 'branch',
      chapterId: 'chapter-2',
      sceneId: 'scene-4',
    })
  })

  it('includes explicit scene proposal seeds', () => {
    const issue = buildInbox().issues.find((item) => item.kind === 'scene_proposal')

    expect(issue).toMatchObject({
      source: 'scene-proposal',
      severity: 'warning',
      handoff: {
        label: 'Open draft workspace',
        draftView: 'read',
        reviewIssueId: 'scene-proposal-seed-scene-5',
      },
    })
  })

  it('keeps seed handoffs constrained to draft read routing', () => {
    const seeds = getBookReviewSeeds('book-signal-arc')

    expect(seeds).not.toHaveLength(0)
    expect(
      seeds.every(
        (seed) =>
          seed.handoff.draftView === 'read' &&
          !('checkpointId' in seed.handoff) &&
          !('exportProfileId' in seed.handoff) &&
          !('branchId' in seed.handoff) &&
          !('branchBaseline' in seed.handoff),
      ),
    ).toBe(true)
  })

  it('filters blockers to blocker severity only', () => {
    const inbox = buildInbox('blockers')

    expect(inbox.filteredIssues.length).toBeGreaterThan(0)
    expect(inbox.filteredIssues.every((item) => item.severity === 'blocker')).toBe(true)
  })

  it('filters branch-readiness to branch source only', () => {
    const inbox = buildInbox('branch-readiness')

    expect(inbox.filteredIssues.length).toBeGreaterThan(0)
    expect(inbox.filteredIssues.every((item) => item.source === 'branch')).toBe(true)
  })

  it('falls back to the first filtered issue when reviewIssueId is missing from the filtered result', () => {
    const inbox = buildInbox('blockers', 'missing-issue')

    expect(inbox.selectedIssue).toBe(inbox.filteredIssues[0] ?? null)
  })

  it('sorts issues deterministically by severity source chapter scene and id', () => {
    const ids = buildInbox().issues.map((item) => item.id)

    expect(ids.slice(0, 6)).toEqual([
      'export-blocker-scene-1',
      'branch-blocker-scene-2',
      'compare-draft-missing-chapter-1-scene-1',
      'draft-missing-chapter-1-scene-1',
      'export-warning-chapter-2',
      'branch-warning-scene-4',
    ])
  })

  it('aggregates chapter annotations by chapter id', () => {
    const inbox = buildInbox()

    expect(inbox.annotationsByChapterId['chapter-1']?.map((item) => item.id)).toEqual([
      'chapter-annotation-seed-chapter-1',
      'draft-warning-pressure-chapter-1',
      'draft-queued-revision-chapter-1',
    ])
  })
})
