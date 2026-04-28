import { describe, expect, it } from 'vitest'

import type { BookExperimentBranchWorkspaceViewModel } from '@/features/book/types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '@/features/book/types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '@/features/book/types/book-draft-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '@/features/book/types/book-export-view-models'

import { getBookReviewSeeds } from '../api/book-review-seeds'
import { buildBookReviewInboxViewModel, selectPrimaryReviewFixHandoff } from './book-review-inbox-mappers'

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
    readableManuscript: {
      formatVersion: 'book-manuscript-assembly-v1',
      markdown: '# Signal Arc',
      plainText: 'Signal Arc',
      sections: [
        {
          kind: 'chapter-heading',
          chapterId: 'chapter-1',
          chapterOrder: 1,
          chapterTitle: 'Chapter One',
          summary: 'Opening chapter',
          assembledWordCount: 900,
          missingDraftCount: 1,
        },
        {
          kind: 'scene-gap',
          chapterId: 'chapter-1',
          chapterOrder: 1,
          chapterTitle: 'Chapter One',
          sceneId: 'scene-1',
          sceneOrder: 1,
          sceneTitle: 'Scene One',
          sceneSummary: 'Missing prose',
          gapReason: 'No prose artifact yet.',
          traceReady: true,
        },
        {
          kind: 'scene-draft',
          chapterId: 'chapter-1',
          chapterOrder: 1,
          chapterTitle: 'Chapter One',
          sceneId: 'scene-2',
          sceneOrder: 2,
          sceneTitle: 'Scene Two',
          sceneSummary: 'Trace gap scene',
          proseDraft: 'Draft text.',
          draftWordCount: 2,
          traceReady: false,
        },
        {
          kind: 'chapter-heading',
          chapterId: 'chapter-2',
          chapterOrder: 2,
          chapterTitle: 'Chapter Two',
          summary: 'Middle chapter',
          assembledWordCount: 900,
          missingDraftCount: 0,
        },
        {
          kind: 'scene-draft',
          chapterId: 'chapter-2',
          chapterOrder: 2,
          chapterTitle: 'Chapter Two',
          sceneId: 'scene-3',
          sceneOrder: 1,
          sceneTitle: 'Scene Three',
          sceneSummary: 'Compare change scene',
          proseDraft: 'Draft text.',
          draftWordCount: 2,
          traceReady: true,
        },
        {
          kind: 'scene-draft',
          chapterId: 'chapter-2',
          chapterOrder: 2,
          chapterTitle: 'Chapter Two',
          sceneId: 'scene-4',
          sceneOrder: 2,
          sceneTitle: 'Scene Four',
          sceneSummary: 'Branch warning scene',
          proseDraft: 'Draft text.',
          draftWordCount: 2,
          traceReady: true,
        },
      ],
      sourceManifest: [],
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

function buildInboxFromWorkspaces({
  currentDraftWorkspace,
  compareWorkspace,
  branchWorkspace,
}: {
  currentDraftWorkspace: BookDraftWorkspaceViewModel
  compareWorkspace: BookManuscriptCompareWorkspaceViewModel | null
  branchWorkspace: BookExperimentBranchWorkspaceViewModel | null
}) {
  return buildBookReviewInboxViewModel({
    bookId: 'book-signal-arc',
    currentDraftWorkspace,
    compareWorkspace,
    branchWorkspace,
    reviewSeeds: getBookReviewSeeds('book-signal-arc'),
  })
}

function createDecisionSignature(issue: {
  id: string
  kind: string
  source: string
  chapterId?: string
  sceneId?: string
  assetId?: string
  title: string
  detail: string
  sourceExcerpt?: string
}) {
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

function buildInboxWithDecisions({
  reviewFilter = 'all',
  reviewStatusFilter = 'all',
  reviewIssueId,
  decisionRecords = [],
}: {
  reviewFilter?: 'all' | 'blockers' | 'branch-readiness' | 'scene-proposals'
  reviewStatusFilter?: 'open' | 'reviewed' | 'deferred' | 'dismissed' | 'all'
  reviewIssueId?: string
  decisionRecords?: Array<{
    id: string
    bookId: string
    issueId: string
    issueSignature: string
    status: 'reviewed' | 'deferred' | 'dismissed'
    note?: string
    updatedAtLabel: string
    updatedByLabel: string
  }>
}) {
  return buildBookReviewInboxViewModel({
    bookId: 'book-signal-arc',
    currentDraftWorkspace: createCurrentDraftWorkspace(),
    compareWorkspace: createCompareWorkspace(),
    exportWorkspace: createExportWorkspace(),
    branchWorkspace: createBranchWorkspace(),
    reviewSeeds: getBookReviewSeeds('book-signal-arc'),
    reviewFilter,
    reviewStatusFilter,
    reviewIssueId,
    decisionRecords,
  } as any)
}

function buildInboxWithFixActions({
  fixActions = [],
}: {
  fixActions?: Array<{
    id: string
    bookId: string
    issueId: string
    issueSignature: string
    sourceHandoffId: string
    sourceHandoffLabel: string
    targetScope: 'book' | 'chapter' | 'scene' | 'asset'
    status: 'started' | 'checked' | 'blocked'
    note?: string
    startedAtLabel: string
    updatedAtLabel: string
    updatedByLabel: string
  }>
}) {
  return buildBookReviewInboxViewModel({
    bookId: 'book-signal-arc',
    currentDraftWorkspace: createCurrentDraftWorkspace(),
    compareWorkspace: createCompareWorkspace(),
    exportWorkspace: createExportWorkspace(),
    branchWorkspace: createBranchWorkspace(),
    reviewSeeds: getBookReviewSeeds('book-signal-arc'),
    fixActions,
  } as any)
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
    expect((issue as any)?.issueSignature).toBe(
      createDecisionSignature(issue as {
        id: string
        kind: string
        source: string
        chapterId?: string
        sceneId?: string
        assetId?: string
        title: string
        detail: string
        sourceExcerpt?: string
      }),
    )
    expect((issue as any)?.decision).toMatchObject({
      status: 'open',
      isStale: false,
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

  it('maps a missing trace reference into a missing_trace warning issue', () => {
    const currentDraftWorkspace = createCurrentDraftWorkspace()
    currentDraftWorkspace.chapters[1]!.sections[0] = {
      ...currentDraftWorkspace.chapters[1]!.sections[0]!,
      traceReady: false,
      relatedAssetCount: 0,
      sourceProposalCount: 0,
    }

    const inbox = buildBookReviewInboxViewModel({
      bookId: 'book-signal-arc',
      currentDraftWorkspace,
      compareWorkspace: createCompareWorkspace(),
      exportWorkspace: createExportWorkspace(),
      branchWorkspace: createBranchWorkspace(),
      reviewSeeds: getBookReviewSeeds('book-signal-arc'),
    })

    expect(inbox.issues.find((item) => item.id === 'trace-gap-chapter-2-scene-3')).toMatchObject({
      kind: 'missing_trace',
      severity: 'warning',
      source: 'traceability',
      chapterId: 'chapter-2',
      sceneId: 'scene-3',
    })
  })

  it('keeps accepted-facts-only trace coverage in the partial trace_gap bucket', () => {
    const currentDraftWorkspace = createCurrentDraftWorkspace()
    currentDraftWorkspace.chapters[1]!.sections[0] = {
      ...currentDraftWorkspace.chapters[1]!.sections[0]!,
      traceReady: false,
      relatedAssetCount: 0,
      sourceProposalCount: 0,
    }
    currentDraftWorkspace.readableManuscript.sourceManifest = [
      {
        kind: 'scene-draft',
        chapterId: 'chapter-2',
        chapterOrder: 2,
        chapterTitle: 'Chapter Two',
        sceneId: 'scene-3',
        sceneOrder: 1,
        sceneTitle: 'Scene Three',
        sourceProposalIds: [],
        acceptedFactIds: ['fact-accepted-only'],
        traceReady: false,
      },
    ]

    const inbox = buildBookReviewInboxViewModel({
      bookId: 'book-signal-arc',
      currentDraftWorkspace,
      compareWorkspace: createCompareWorkspace(),
      exportWorkspace: createExportWorkspace(),
      branchWorkspace: createBranchWorkspace(),
      reviewSeeds: getBookReviewSeeds('book-signal-arc'),
    })

    expect(inbox.issues.find((item) => item.id === 'trace-gap-chapter-2-scene-3')).toMatchObject({
      kind: 'trace_gap',
      severity: 'warning',
      source: 'traceability',
      chapterId: 'chapter-2',
      sceneId: 'scene-3',
    })
  })

  it('maps a chapter with no readable scene draft sections into a chapter_gap issue', () => {
    const currentDraftWorkspace = createCurrentDraftWorkspace()
    currentDraftWorkspace.readableManuscript.sections = currentDraftWorkspace.readableManuscript.sections.filter(
      (section) => !(section.chapterId === 'chapter-2' && section.kind === 'scene-draft'),
    )

    const inbox = buildBookReviewInboxViewModel({
      bookId: 'book-signal-arc',
      currentDraftWorkspace,
      compareWorkspace: createCompareWorkspace(),
      exportWorkspace: createExportWorkspace(),
      branchWorkspace: createBranchWorkspace(),
      reviewSeeds: getBookReviewSeeds('book-signal-arc'),
    })

    expect(inbox.issues.find((item) => item.id === 'chapter-gap-chapter-2')).toMatchObject({
      kind: 'chapter_gap',
      source: 'manuscript',
      chapterId: 'chapter-2',
      severity: 'warning',
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

  it('keeps review issue ids stable across chapter and scene relabeling', () => {
    const originalDraftWorkspace = createCurrentDraftWorkspace()
    const originalCompareWorkspace = createCompareWorkspace()
    const originalBranchWorkspace = createBranchWorkspace()

    const relabeledDraftWorkspace = createCurrentDraftWorkspace()
    relabeledDraftWorkspace.chapters[0] = {
      ...relabeledDraftWorkspace.chapters[0]!,
      title: 'Chapter One Relabeled',
      sections: relabeledDraftWorkspace.chapters[0]!.sections.map((section) =>
        section.sceneId === 'scene-1'
          ? {
              ...section,
              title: 'Scene One Relabeled',
              summary: 'Relabeled missing prose summary',
            }
          : section.sceneId === 'scene-2'
            ? {
                ...section,
                title: 'Scene Two Relabeled',
                summary: 'Relabeled trace gap summary',
              }
            : section,
      ),
    }
    relabeledDraftWorkspace.selectedChapter = relabeledDraftWorkspace.chapters[0]!
    relabeledDraftWorkspace.inspector.selectedChapter = {
      ...relabeledDraftWorkspace.inspector.selectedChapter!,
      title: 'Chapter One Relabeled',
      topMissingSceneTitles: ['Scene One Relabeled'],
    }

    const relabeledCompareWorkspace = createCompareWorkspace()
    relabeledCompareWorkspace.chapters[1] = {
      ...relabeledCompareWorkspace.chapters[1]!,
      title: 'Chapter Two Relabeled',
      scenes: relabeledCompareWorkspace.chapters[1]!.scenes.map((scene) =>
        scene.sceneId === 'scene-3'
          ? {
              ...scene,
              title: 'Scene Three Relabeled',
              summary: 'Relabeled compare change scene',
            }
          : scene.sceneId === 'scene-4'
            ? {
                ...scene,
                title: 'Scene Four Relabeled',
                summary: 'Relabeled trace regression scene',
              }
            : scene,
      ),
    }
    relabeledCompareWorkspace.selectedChapter = relabeledCompareWorkspace.chapters[1]!

    const relabeledBranchWorkspace = createBranchWorkspace()
    relabeledBranchWorkspace.chapters[1] = {
      ...relabeledBranchWorkspace.chapters[1]!,
      title: 'Chapter Two Branch Relabeled',
      sceneDeltas: relabeledBranchWorkspace.chapters[1]!.sceneDeltas.map((scene) =>
        scene.sceneId === 'scene-4'
          ? {
              ...scene,
              title: 'Scene Four Branch Relabeled',
              summary: 'Relabeled branch warning scene',
            }
          : scene.sceneId === 'scene-5'
            ? {
                ...scene,
                title: 'Scene Five Branch Relabeled',
                summary: 'Relabeled added-without-source scene',
              }
            : scene,
      ),
    }
    relabeledBranchWorkspace.selectedChapter = relabeledBranchWorkspace.chapters[1]!

    const originalInbox = buildInboxFromWorkspaces({
      currentDraftWorkspace: originalDraftWorkspace,
      compareWorkspace: originalCompareWorkspace,
      branchWorkspace: originalBranchWorkspace,
    })
    const relabeledInbox = buildInboxFromWorkspaces({
      currentDraftWorkspace: relabeledDraftWorkspace,
      compareWorkspace: relabeledCompareWorkspace,
      branchWorkspace: relabeledBranchWorkspace,
    })

    expect(relabeledInbox.issues.map((issue) => issue.id)).toEqual(
      originalInbox.issues.map((issue) => issue.id),
    )

    const originalDraftIssue = originalInbox.issues.find((issue) => issue.id === 'draft-missing-chapter-1-scene-1')
    const relabeledDraftIssue = relabeledInbox.issues.find((issue) => issue.id === 'draft-missing-chapter-1-scene-1')
    expect(relabeledDraftIssue).toMatchObject({
      id: 'draft-missing-chapter-1-scene-1',
      chapterId: 'chapter-1',
      sceneId: 'scene-1',
      chapterTitle: 'Chapter One Relabeled',
      sceneTitle: 'Scene One Relabeled',
    })
    expect(relabeledDraftIssue?.issueSignature).not.toBe(originalDraftIssue?.issueSignature)

    const relabeledCompareIssue = relabeledInbox.issues.find((issue) => issue.id === 'compare-delta-chapter-2-scene-3')
    expect(relabeledCompareIssue).toMatchObject({
      id: 'compare-delta-chapter-2-scene-3',
      chapterId: 'chapter-2',
      sceneId: 'scene-3',
      chapterTitle: 'Chapter Two Relabeled',
      sceneTitle: 'Scene Three Relabeled',
    })

    const relabeledBranchIssue = relabeledInbox.issues.find((issue) => issue.id === 'branch-warning-scene-4')
    expect(relabeledBranchIssue).toMatchObject({
      id: 'branch-warning-scene-4',
      chapterId: 'chapter-2',
      sceneId: 'scene-4',
      chapterTitle: 'Chapter Two Branch Relabeled',
      sceneTitle: 'Scene Four Branch Relabeled',
    })
  })

  it('includes explicit scene proposal seeds', () => {
    const issue = buildInbox().issues.find((item) => item.kind === 'scene_proposal')

    expect(issue?.source).toBe('scene-proposal')
    expect(issue?.severity).toBe('warning')
    expect(issue?.recommendation).toBe(
      'Review the scene proposal execution notes before settling it into the manuscript draft.',
    )
    expect(issue?.sourceLabel).toBe('Scene proposal')
    expect(issue?.handoffs[0]).toMatchObject({
      label: 'Open scene proposal',
      target: {
        scope: 'scene',
        sceneId: 'scene-5',
        lens: 'orchestrate',
        tab: 'execution',
      },
    })
  })

  it('includes seeded continuity qa issues with stable ids and locator handoffs', () => {
    const inbox = buildInbox()

    expect(inbox.issues.find((item) => item.id === 'continuity-conflict-ledger-public-proof')).toMatchObject({
      source: 'continuity',
      kind: 'continuity_conflict',
      sceneId: 'scene-midnight-platform',
      assetId: 'asset-ledger',
    })
    expect(inbox.issues.find((item) => item.id === 'missing-trace-departure-bell')).toMatchObject({
      source: 'traceability',
      kind: 'missing_trace',
      sceneId: 'scene-departure-bell',
    })
    expect(inbox.issues.find((item) => item.id === 'stale-prose-after-canon-midnight-platform')).toMatchObject({
      source: 'stale-prose',
      kind: 'stale_prose_after_canon_change',
      sceneId: 'scene-midnight-platform',
    })
    expect(inbox.issues.find((item) => item.id === 'chapter-gap-open-water-bridge')).toMatchObject({
      source: 'manuscript',
      kind: 'chapter_gap',
      chapterId: 'chapter-open-water-signals',
    })
    expect(inbox.issues.find((item) => item.id === 'asset-inconsistency-ledger-rule')).toMatchObject({
      source: 'asset-consistency',
      kind: 'asset_inconsistency',
      assetId: 'asset-ledger-rule',
    })
  })

  it('maps source handoffs toward real routing targets for later stage wiring', () => {
    const inbox = buildInbox()

    expect(inbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')?.handoffs[0]).toMatchObject({
      label: 'Open compare review',
      target: {
        scope: 'book',
        lens: 'draft',
        view: 'sequence',
        draftView: 'compare',
        checkpointId: 'checkpoint-1',
        selectedChapterId: 'chapter-2',
        reviewIssueId: 'compare-delta-chapter-2-scene-3',
      },
    })

    expect(inbox.issues.find((item) => item.id === 'export-blocker-scene-1')?.handoffs[0]).toMatchObject({
      label: 'Open export preview',
      target: {
        scope: 'book',
        lens: 'draft',
        view: 'sequence',
        draftView: 'export',
        exportProfileId: 'export-1',
        selectedChapterId: 'chapter-1',
        reviewIssueId: 'export-blocker-scene-1',
      },
    })

    expect(inbox.issues.find((item) => item.id === 'branch-warning-scene-4')?.handoffs[0]).toMatchObject({
      label: 'Open branch review',
      target: {
        scope: 'book',
        lens: 'draft',
        view: 'sequence',
        draftView: 'branch',
        branchId: 'branch-1',
        branchBaseline: 'checkpoint',
        checkpointId: 'checkpoint-1',
        selectedChapterId: 'chapter-2',
        reviewIssueId: 'branch-warning-scene-4',
      },
    })

    expect(inbox.issues.find((item) => item.id === 'chapter-annotation-seed-chapter-1')?.handoffs[0]).toMatchObject({
      label: 'Open chapter draft',
      target: {
        scope: 'chapter',
        chapterId: 'chapter-1',
        lens: 'draft',
        view: 'sequence',
      },
    })

    expect(inbox.issues.find((item) => item.id === 'trace-gap-seed-asset-ledger')?.handoffs[0]).toMatchObject({
      label: 'Open asset profile',
      target: {
        scope: 'asset',
        assetId: 'asset-ledger',
        lens: 'knowledge',
        view: 'profile',
      },
    })
  })

  it('adds not-started fix action state and primary fix handoffs to every issue', () => {
    const inbox = buildInbox()
    const issue = inbox.issues.find((item) => item.id === 'draft-missing-chapter-1-scene-1')

    expect(issue?.fixAction).toMatchObject({
      status: 'not_started',
      isStale: false,
    })
    expect(issue?.primaryFixHandoff).toMatchObject({
      label: 'Open chapter draft',
      target: {
        scope: 'chapter',
        chapterId: 'chapter-1',
        lens: 'draft',
      },
    })
  })

  it('selects primary fix handoffs for export branch compare missing draft scene proposal asset and fallback issues', () => {
    const inbox = buildInbox()

    expect(inbox.issues.find((item) => item.id === 'export-blocker-scene-1')?.primaryFixHandoff).toMatchObject({
      target: {
        scope: 'book',
        draftView: 'export',
      },
    })
    expect(inbox.issues.find((item) => item.id === 'branch-warning-scene-4')?.primaryFixHandoff).toMatchObject({
      target: {
        scope: 'book',
        draftView: 'branch',
      },
    })
    expect(inbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')?.primaryFixHandoff).toMatchObject({
      target: {
        scope: 'book',
        draftView: 'compare',
      },
    })
    expect(inbox.issues.find((item) => item.id === 'draft-missing-chapter-1-scene-1')?.primaryFixHandoff).toMatchObject({
      target: {
        scope: 'chapter',
        lens: 'draft',
      },
    })
    expect(inbox.issues.find((item) => item.id === 'scene-proposal-seed-scene-5')?.primaryFixHandoff).toMatchObject({
      target: {
        scope: 'scene',
        lens: 'orchestrate',
      },
    })
    expect(inbox.issues.find((item) => item.id === 'trace-gap-seed-asset-ledger')?.primaryFixHandoff).toMatchObject({
      target: {
        scope: 'chapter',
        lens: 'draft',
      },
    })
    expect(inbox.issues.find((item) => item.id === 'continuity-conflict-ledger-public-proof')?.primaryFixHandoff).toMatchObject({
      target: {
        scope: 'book',
        draftView: 'review',
      },
    })

    const sceneDraftHandoff = {
      id: 'scene-proposal::scene-draft',
      label: 'Open scene draft',
      target: {
        scope: 'scene' as const,
        sceneId: 'scene-5',
        lens: 'draft' as const,
        tab: 'prose' as const,
      },
    }
    const sceneOrchestrateHandoff = {
      id: 'scene-proposal::scene-orchestrate',
      label: 'Open scene proposal',
      target: {
        scope: 'scene' as const,
        sceneId: 'scene-5',
        lens: 'orchestrate' as const,
        tab: 'execution' as const,
      },
    }
    expect(
      selectPrimaryReviewFixHandoff({
        id: 'scene-proposal-with-draft-first',
        severity: 'warning',
        source: 'scene-proposal',
        kind: 'scene_proposal',
        title: 'Scene proposal needs review',
        detail: 'Scene Five is still waiting for proposal review.',
        recommendation: 'Review the proposal notes.',
        sourceLabel: 'Scene proposal',
        tags: [],
        handoffs: [sceneDraftHandoff, sceneOrchestrateHandoff],
        issueSignature: 'scene-proposal-signature',
        decision: {
          status: 'open',
          isStale: false,
        },
        fixAction: {
          status: 'not_started',
          isStale: false,
        },
        primaryFixHandoff: null,
      }),
    ).toBe(sceneOrchestrateHandoff)

    const fallbackHandoff = {
      id: 'fallback::chapter',
      label: 'Fallback first',
      target: {
        scope: 'chapter' as const,
        chapterId: 'chapter-1',
        lens: 'structure' as const,
        view: 'sequence' as const,
      },
    }
    expect(
      selectPrimaryReviewFixHandoff({
        id: 'fallback',
        severity: 'info',
        source: 'manuscript',
        kind: 'chapter_annotation',
        title: 'Fallback',
        detail: 'Fallback detail',
        recommendation: 'Fallback recommendation',
        sourceLabel: 'Fallback source',
        tags: [],
        handoffs: [fallbackHandoff],
        issueSignature: 'fallback-signature',
        decision: {
          status: 'open',
          isStale: false,
        },
        fixAction: {
          status: 'not_started',
          isStale: false,
        },
        primaryFixHandoff: fallbackHandoff,
      }),
    ).toBe(fallbackHandoff)
  })

  it('applies started checked blocked and stale fix action overlays with independent counts', () => {
    const baseInbox = buildInbox()
    const startedIssue = baseInbox.issues.find((item) => item.id === 'draft-missing-chapter-1-scene-1')!
    const checkedIssue = baseInbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')!
    const blockedIssue = baseInbox.issues.find((item) => item.id === 'branch-warning-scene-4')!
    const staleIssue = baseInbox.issues.find((item) => item.id === 'export-blocker-scene-1')!

    const inbox = buildInboxWithFixActions({
      fixActions: [
        {
          id: 'fix-started',
          bookId: 'book-signal-arc',
          issueId: startedIssue.id,
          issueSignature: createDecisionSignature(startedIssue),
          sourceHandoffId: startedIssue.primaryFixHandoff!.id,
          sourceHandoffLabel: startedIssue.primaryFixHandoff!.label,
          targetScope: startedIssue.primaryFixHandoff!.target.scope,
          status: 'started',
          note: 'Started',
          startedAtLabel: '2026-04-19 17:00',
          updatedAtLabel: '2026-04-19 17:00',
          updatedByLabel: 'Editor',
        },
        {
          id: 'fix-checked',
          bookId: 'book-signal-arc',
          issueId: checkedIssue.id,
          issueSignature: createDecisionSignature(checkedIssue),
          sourceHandoffId: checkedIssue.primaryFixHandoff!.id,
          sourceHandoffLabel: checkedIssue.primaryFixHandoff!.label,
          targetScope: checkedIssue.primaryFixHandoff!.target.scope,
          status: 'checked',
          startedAtLabel: '2026-04-19 17:05',
          updatedAtLabel: '2026-04-19 17:05',
          updatedByLabel: 'Editor',
        },
        {
          id: 'fix-blocked',
          bookId: 'book-signal-arc',
          issueId: blockedIssue.id,
          issueSignature: createDecisionSignature(blockedIssue),
          sourceHandoffId: blockedIssue.primaryFixHandoff!.id,
          sourceHandoffLabel: blockedIssue.primaryFixHandoff!.label,
          targetScope: blockedIssue.primaryFixHandoff!.target.scope,
          status: 'blocked',
          startedAtLabel: '2026-04-19 17:10',
          updatedAtLabel: '2026-04-19 17:10',
          updatedByLabel: 'Editor',
        },
        {
          id: 'fix-stale',
          bookId: 'book-signal-arc',
          issueId: staleIssue.id,
          issueSignature: 'stale-signature',
          sourceHandoffId: staleIssue.primaryFixHandoff!.id,
          sourceHandoffLabel: staleIssue.primaryFixHandoff!.label,
          targetScope: staleIssue.primaryFixHandoff!.target.scope,
          status: 'started',
          startedAtLabel: '2026-04-19 17:15',
          updatedAtLabel: '2026-04-19 17:15',
          updatedByLabel: 'Editor',
        },
      ],
    })

    expect(inbox.issues.find((item) => item.id === startedIssue.id)?.fixAction).toMatchObject({
      status: 'started',
      note: 'Started',
      isStale: false,
    })
    expect(inbox.issues.find((item) => item.id === checkedIssue.id)?.fixAction.status).toBe('checked')
    expect(inbox.issues.find((item) => item.id === blockedIssue.id)?.fixAction.status).toBe('blocked')
    expect(inbox.issues.find((item) => item.id === staleIssue.id)?.fixAction).toMatchObject({
      status: 'stale',
      isStale: true,
    })
    expect(inbox.counts.fixStarted).toBe(1)
    expect(inbox.counts.fixChecked).toBe(1)
    expect(inbox.counts.fixBlocked).toBe(1)
    expect(inbox.counts.fixStale).toBe(1)
  })

  it('keeps decision status filters independent from fix action overlays', () => {
    const baseInbox = buildInbox()
    const issue = baseInbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')!

    const inbox = buildBookReviewInboxViewModel({
      bookId: 'book-signal-arc',
      currentDraftWorkspace: createCurrentDraftWorkspace(),
      compareWorkspace: createCompareWorkspace(),
      exportWorkspace: createExportWorkspace(),
      branchWorkspace: createBranchWorkspace(),
      reviewSeeds: getBookReviewSeeds('book-signal-arc'),
      reviewStatusFilter: 'reviewed',
      fixActions: [
        {
          id: 'fix-checked',
          bookId: 'book-signal-arc',
          issueId: issue.id,
          issueSignature: createDecisionSignature(issue),
          sourceHandoffId: issue.primaryFixHandoff!.id,
          sourceHandoffLabel: issue.primaryFixHandoff!.label,
          targetScope: issue.primaryFixHandoff!.target.scope,
          status: 'checked',
          startedAtLabel: '2026-04-19 17:05',
          updatedAtLabel: '2026-04-19 17:05',
          updatedByLabel: 'Editor',
        },
      ],
    } as any)

    expect(inbox.filteredIssues).toEqual([])
    expect(inbox.issues.find((item) => item.id === issue.id)?.fixAction.status).toBe('checked')
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

  it('applies reviewed, deferred, and dismissed decisions as overlay statuses', () => {
    const baseInbox = buildInbox()
    const reviewedIssue = baseInbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')
    const deferredIssue = baseInbox.issues.find((item) => item.id === 'draft-missing-chapter-1-scene-1')
    const dismissedIssue = baseInbox.issues.find((item) => item.id === 'trace-gap-chapter-1-scene-2')

    const inbox = buildInboxWithDecisions({
      decisionRecords: [
        {
          id: 'decision-reviewed',
          bookId: 'book-signal-arc',
          issueId: reviewedIssue!.id,
          issueSignature: createDecisionSignature(reviewedIssue!),
          status: 'reviewed',
          note: 'Reviewed in this pass.',
          updatedAtLabel: '2026-04-19 16:00',
          updatedByLabel: 'Editor',
        },
        {
          id: 'decision-deferred',
          bookId: 'book-signal-arc',
          issueId: deferredIssue!.id,
          issueSignature: createDecisionSignature(deferredIssue!),
          status: 'deferred',
          updatedAtLabel: '2026-04-19 16:10',
          updatedByLabel: 'Editor',
        },
        {
          id: 'decision-dismissed',
          bookId: 'book-signal-arc',
          issueId: dismissedIssue!.id,
          issueSignature: createDecisionSignature(dismissedIssue!),
          status: 'dismissed',
          updatedAtLabel: '2026-04-19 16:20',
          updatedByLabel: 'Editor',
        },
      ],
    })

    expect((inbox.issues.find((item) => item.id === reviewedIssue!.id) as any)?.decision).toMatchObject({
      status: 'reviewed',
      note: 'Reviewed in this pass.',
      isStale: false,
    })
    expect((inbox.issues.find((item) => item.id === deferredIssue!.id) as any)?.decision).toMatchObject({
      status: 'deferred',
      isStale: false,
    })
    expect((inbox.issues.find((item) => item.id === dismissedIssue!.id) as any)?.decision).toMatchObject({
      status: 'dismissed',
      isStale: false,
    })
  })

  it('marks mismatched decision signatures as stale and keeps them visible in the open queue', () => {
    const baseInbox = buildInbox()
    const issue = baseInbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')

    const inbox = buildInboxWithDecisions({
      reviewStatusFilter: 'open',
      decisionRecords: [
        {
          id: 'decision-stale',
          bookId: 'book-signal-arc',
          issueId: issue!.id,
          issueSignature: 'stale-signature',
          status: 'reviewed',
          updatedAtLabel: '2026-04-19 16:30',
          updatedByLabel: 'Editor',
        },
      ],
    })

    expect((inbox.issues.find((item) => item.id === issue!.id) as any)?.decision).toMatchObject({
      status: 'stale',
      isStale: true,
    })
    expect(inbox.filteredIssues.some((item) => item.id === issue!.id)).toBe(true)
  })

  it('keeps stale issues in the all queue and excludes them from reviewed deferred and dismissed filters', () => {
    const baseInbox = buildInbox()
    const issue = baseInbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')
    const decisionRecord = {
      id: 'decision-stale',
      bookId: 'book-signal-arc',
      issueId: issue!.id,
      issueSignature: 'stale-signature',
      status: 'reviewed' as const,
      updatedAtLabel: '2026-04-19 16:30',
      updatedByLabel: 'Editor',
    }

    expect(
      buildInboxWithDecisions({
        reviewStatusFilter: 'all',
        decisionRecords: [decisionRecord],
      }).filteredIssues.some((item) => item.id === issue!.id),
    ).toBe(true)

    expect(
      buildInboxWithDecisions({
        reviewStatusFilter: 'reviewed',
        decisionRecords: [decisionRecord],
      }).filteredIssues.some((item) => item.id === issue!.id),
    ).toBe(false)

    expect(
      buildInboxWithDecisions({
        reviewStatusFilter: 'deferred',
        decisionRecords: [decisionRecord],
      }).filteredIssues.some((item) => item.id === issue!.id),
    ).toBe(false)

    expect(
      buildInboxWithDecisions({
        reviewStatusFilter: 'dismissed',
        decisionRecords: [decisionRecord],
      }).filteredIssues.some((item) => item.id === issue!.id),
    ).toBe(false)
  })

  it('combines reviewFilter and reviewStatusFilter when producing the visible queue', () => {
    const baseInbox = buildInbox()
    const branchIssue = baseInbox.issues.find((item) => item.id === 'branch-warning-scene-4')

    const inbox = buildInboxWithDecisions({
      reviewFilter: 'branch-readiness',
      reviewStatusFilter: 'reviewed',
      decisionRecords: [
        {
          id: 'decision-branch-reviewed',
          bookId: 'book-signal-arc',
          issueId: branchIssue!.id,
          issueSignature: createDecisionSignature(branchIssue!),
          status: 'reviewed',
          updatedAtLabel: '2026-04-19 16:40',
          updatedByLabel: 'Editor',
        },
      ],
    })

    expect(inbox.filteredIssues.map((item) => item.id)).toEqual([branchIssue!.id])
    expect((inbox as any).activeStatusFilter).toBe('reviewed')
  })

  it('tracks open and actioned counts after decisions are applied', () => {
    const baseInbox = buildInbox()
    const reviewedIssue = baseInbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')
    const deferredIssue = baseInbox.issues.find((item) => item.id === 'draft-missing-chapter-1-scene-1')
    const dismissedIssue = baseInbox.issues.find((item) => item.id === 'trace-gap-chapter-1-scene-2')
    const staleIssue = baseInbox.issues.find((item) => item.id === 'branch-warning-scene-4')

    const inbox = buildInboxWithDecisions({
      decisionRecords: [
        {
          id: 'decision-reviewed',
          bookId: 'book-signal-arc',
          issueId: reviewedIssue!.id,
          issueSignature: createDecisionSignature(reviewedIssue!),
          status: 'reviewed',
          updatedAtLabel: '2026-04-19 16:00',
          updatedByLabel: 'Editor',
        },
        {
          id: 'decision-deferred',
          bookId: 'book-signal-arc',
          issueId: deferredIssue!.id,
          issueSignature: createDecisionSignature(deferredIssue!),
          status: 'deferred',
          updatedAtLabel: '2026-04-19 16:10',
          updatedByLabel: 'Editor',
        },
        {
          id: 'decision-dismissed',
          bookId: 'book-signal-arc',
          issueId: dismissedIssue!.id,
          issueSignature: createDecisionSignature(dismissedIssue!),
          status: 'dismissed',
          updatedAtLabel: '2026-04-19 16:20',
          updatedByLabel: 'Editor',
        },
        {
          id: 'decision-stale',
          bookId: 'book-signal-arc',
          issueId: staleIssue!.id,
          issueSignature: 'stale-signature',
          status: 'reviewed',
          updatedAtLabel: '2026-04-19 16:30',
          updatedByLabel: 'Editor',
        },
      ],
    })

    expect((inbox.counts as any).reviewed).toBe(1)
    expect((inbox.counts as any).deferred).toBe(1)
    expect((inbox.counts as any).dismissed).toBe(1)
    expect((inbox.counts as any).stale).toBe(1)
    expect((inbox.counts as any).open).toBe(inbox.issues.length - 3)
    expect((inbox as any).visibleOpenCount).toBe(
      inbox.filteredIssues.filter((item) => {
        const status = (item as any).decision?.status
        return status === 'open' || status === 'stale'
      }).length,
    )
  })

  it('falls back to the first visible status-filtered issue when the requested issue is filtered away', () => {
    const baseInbox = buildInbox()
    const reviewedIssue = baseInbox.issues.find((item) => item.id === 'compare-delta-chapter-2-scene-3')

    const inbox = buildInboxWithDecisions({
      reviewStatusFilter: 'reviewed',
      reviewIssueId: 'draft-missing-chapter-1-scene-1',
      decisionRecords: [
        {
          id: 'decision-reviewed',
          bookId: 'book-signal-arc',
          issueId: reviewedIssue!.id,
          issueSignature: createDecisionSignature(reviewedIssue!),
          status: 'reviewed',
          updatedAtLabel: '2026-04-19 16:00',
          updatedByLabel: 'Editor',
        },
      ],
    })

    expect(inbox.selectedIssue?.id).toBe(reviewedIssue!.id)
    expect((inbox as any).activeStatusFilter).toBe('reviewed')
  })

  it('sorts issues deterministically by severity source chapter scene and id', () => {
    const ids = buildInbox().issues.map((item) => item.id)

    expect(ids.slice(0, 6)).toEqual([
      'export-blocker-scene-1',
      'branch-blocker-scene-2',
      'compare-draft-missing-chapter-1-scene-1',
      'continuity-conflict-ledger-public-proof',
      'draft-missing-chapter-1-scene-1',
      'export-warning-chapter-2',
    ])
  })

  it('builds grouped issues and counts for the review inbox surface', () => {
    const inbox = buildInbox()

    expect(inbox.activeFilter).toBe('all')
    expect(inbox.title).toBe('Signal Arc')
    expect(inbox.counts.total).toBe(inbox.issues.length)
    expect(inbox.counts.blockers).toBeGreaterThan(0)
    expect(inbox.counts.traceGaps).toBeGreaterThan(0)
    expect(inbox.counts.continuityConflicts).toBeGreaterThan(0)
    expect(inbox.counts.assetInconsistencies).toBeGreaterThan(0)
    expect(inbox.counts.missingTrace).toBeGreaterThan(0)
    expect(inbox.counts.staleProse).toBeGreaterThan(0)
    expect(inbox.counts.chapterGaps).toBeGreaterThan(0)
    expect(inbox.counts.rewriteRequests).toBe(0)
    expect(inbox.counts.compareDeltas).toBeGreaterThan(0)
    expect(inbox.counts.exportReadiness).toBeGreaterThan(0)
    expect(inbox.counts.branchReadiness).toBeGreaterThan(0)
    expect(inbox.counts.sceneProposals).toBeGreaterThan(0)
    expect(inbox.groupedIssues.blockers.every((item) => item.severity === 'blocker')).toBe(true)
    expect(inbox.groupedIssues.warnings.every((item) => item.severity === 'warning')).toBe(true)
    expect(inbox.groupedIssues.info.every((item) => item.severity === 'info')).toBe(true)
    expect(inbox.selectedChapterIssueCount).toBeGreaterThan(0)
  })

  it('keeps selectedChapterIssueCount aligned to the filtered review queue', () => {
    expect(buildInbox('scene-proposals').selectedChapterIssueCount).toBe(0)
    expect(buildInbox('blockers').selectedChapterIssueCount).toBe(
      buildInbox('blockers').filteredIssues.filter((item) => item.chapterId === 'chapter-1').length,
    )
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
