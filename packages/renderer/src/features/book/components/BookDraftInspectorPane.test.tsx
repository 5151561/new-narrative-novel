import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { APP_LOCALE_STORAGE_KEY } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'

import type { BookExperimentBranchWorkspaceViewModel } from '../types/book-branch-view-models'
import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftInspectorViewModel } from '../types/book-draft-view-models'
import type { BookExportArtifactWorkspaceViewModel } from '../types/book-export-artifact-view-models'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'
import { BookDraftInspectorPane } from './BookDraftInspectorPane'

function createReviewIssue(overrides: Partial<ReviewIssueViewModel> = {}): ReviewIssueViewModel {
  return {
    id: 'export-blocker-open-water-signals',
    severity: 'blocker',
    source: 'export',
    kind: 'export_blocker',
    title: 'Export packet is blocked',
    detail: 'One included scene still needs current draft prose before the packet can ship.',
    recommendation: 'Open export readiness and resolve the missing chapter draft before the next pass.',
    chapterId: 'chapter-open-water-signals',
    chapterTitle: 'Open Water Signals',
    chapterOrder: 2,
    sceneId: 'scene-dawn-slip',
    sceneTitle: 'Dawn Slip',
    sceneOrder: 3,
    sourceLabel: 'Export readiness',
    sourceExcerpt: 'Review Packet still excludes Dawn Slip because the current manuscript is incomplete.',
    tags: ['Export readiness', 'Missing draft'],
    issueSignature: 'export-blocker-open-water-signals::signature',
    decision: {
      status: 'open',
      isStale: false,
    },
    fixAction: {
      status: 'not_started',
      isStale: false,
    },
    handoffs: [
      {
        id: 'review-source-export',
        label: 'Open export readiness',
        target: {
          scope: 'book',
          lens: 'draft',
          view: 'signals',
          draftView: 'export',
          exportProfileId: 'export-review-packet',
          selectedChapterId: 'chapter-open-water-signals',
          reviewIssueId: 'export-blocker-open-water-signals',
        },
      },
      {
        id: 'review-source-chapter',
        label: 'Open chapter draft',
        target: {
          scope: 'chapter',
          chapterId: 'chapter-open-water-signals',
          lens: 'draft',
          view: 'sequence',
          sceneId: 'scene-dawn-slip',
        },
      },
    ],
    primaryFixHandoff: {
      id: 'review-source-export',
      label: 'Open export readiness',
      target: {
        scope: 'book',
        lens: 'draft',
        view: 'signals',
        draftView: 'export',
        exportProfileId: 'export-review-packet',
        selectedChapterId: 'chapter-open-water-signals',
        reviewIssueId: 'export-blocker-open-water-signals',
      },
    },
    ...overrides,
  }
}

function createReviewInbox(): BookReviewInboxViewModel {
  const selectedIssue = createReviewIssue()

  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    selectedIssueId: selectedIssue.id,
    selectedIssue,
    activeFilter: 'export-readiness',
    activeStatusFilter: 'open',
    issues: [selectedIssue],
    filteredIssues: [selectedIssue],
    groupedIssues: {
      blockers: [selectedIssue],
      warnings: [],
      info: [],
    },
    counts: {
      total: 6,
      blockers: 2,
      warnings: 3,
      info: 1,
      traceGaps: 1,
      missingDrafts: 2,
      compareDeltas: 1,
      exportReadiness: 2,
      branchReadiness: 1,
      sceneProposals: 0,
      open: 1,
      reviewed: 0,
      deferred: 0,
      dismissed: 0,
      stale: 0,
    },
    visibleOpenCount: 1,
    selectedChapterIssueCount: 3,
    annotationsByChapterId: {
      'chapter-open-water-signals': [selectedIssue],
    },
  }
}

const inspector: BookDraftInspectorViewModel = {
  selectedChapter: {
    chapterId: 'chapter-open-water-signals',
    title: 'Open Water Signals',
    summary: 'Carry the courier handoff into open water.',
    draftedSceneCount: 2,
    missingDraftCount: 1,
    tracedSceneCount: 1,
    missingTraceSceneCount: 1,
    warningsCount: 2,
    queuedRevisionCount: 1,
    assembledWordCount: 320,
    topMissingSceneTitles: ['Dawn Slip'],
    topLatestDiffSummary: 'Carry the courier leverage through the canal release.',
    traceCoverageNote: 'Trace coverage still has one visible gap.',
  },
  readiness: {
    draftedChapterCount: 2,
    missingDraftChapterCount: 1,
    assembledWordCount: 680,
    warningHeavyChapterCount: 1,
    missingTraceChapterCount: 1,
  },
  signals: {
    topMissingScenes: ['Dawn Slip'],
    latestDiffSummaries: ['Carry the courier leverage through the canal release.'],
    traceCoverageNote: 'Trace coverage still has one visible gap.',
  },
}

const compare: BookManuscriptCompareWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  title: 'Signal Arc',
  summary: 'Compare current draft against the checkpoint.',
  checkpoint: {
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
    bookId: 'book-signal-arc',
    title: 'PR11 Baseline',
    summary: 'Baseline manuscript snapshot.',
  },
  selectedChapterId: 'chapter-open-water-signals',
  chapters: [],
  selectedChapter: {
    chapterId: 'chapter-open-water-signals',
    order: 2,
    title: 'Open Water Signals',
    summary: 'Carry the courier handoff into open water.',
    totals: {
      sceneCount: 3,
      missingCount: 1,
      addedCount: 1,
      draftMissingCount: 0,
      changedCount: 1,
      unchangedCount: 0,
      wordDelta: 9,
      traceRegressionCount: 1,
      warningsDelta: 2,
    },
    wordDelta: 9,
    traceRegressionCount: 1,
    warningsDelta: 2,
    scenes: [
      {
        sceneId: 'scene-dawn-slip',
        order: 2,
        title: 'Dawn Slip',
        summary: 'New release beat.',
        delta: 'added',
        currentScene: {
          sceneId: 'scene-dawn-slip',
          order: 2,
          title: 'Dawn Slip',
          summary: 'New release beat.',
          proseDraft: 'Current dawn excerpt',
          draftWordCount: 11,
          warningsCount: 0,
          traceReady: true,
        },
        currentWordCount: 11,
        wordDelta: 11,
        traceReadyChanged: false,
        warningsDelta: 0,
        currentExcerpt: 'Current dawn excerpt',
      },
      {
        sceneId: 'scene-river-ledger',
        order: 3,
        title: 'River Ledger',
        summary: 'Legacy checkpoint scene.',
        delta: 'missing',
        checkpointScene: {
          sceneId: 'scene-river-ledger',
          order: 3,
          title: 'River Ledger',
          summary: 'Legacy checkpoint scene.',
          proseDraft: 'Checkpoint river excerpt',
          draftWordCount: 8,
          warningsCount: 0,
          traceReady: true,
        },
        checkpointWordCount: 8,
        wordDelta: -8,
        traceReadyChanged: false,
        warningsDelta: 0,
        checkpointExcerpt: 'Checkpoint river excerpt',
      },
    ],
  },
  totals: {
    chapterCount: 1,
    sceneCount: 3,
    missingCount: 1,
    addedCount: 1,
    draftMissingCount: 0,
    changedCount: 1,
    unchangedCount: 0,
    wordDelta: 9,
    traceRegressionCount: 1,
    warningsDelta: 2,
  },
}

const exportPreview: BookExportPreviewWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  title: 'Signal Arc',
  summary: 'Export preview workspace',
  selectedChapterId: 'chapter-open-water-signals',
  selectedChapter: {
    chapterId: 'chapter-open-water-signals',
    order: 2,
    title: 'Open Water Signals',
    summary: 'Carry the courier handoff into open water.',
    isIncluded: true,
    assembledWordCount: 320,
    missingDraftCount: 1,
    missingTraceCount: 1,
    warningCount: 2,
    scenes: [],
    readinessStatus: 'attention',
  },
  profile: {
    exportProfileId: 'export-review-packet',
    bookId: 'book-signal-arc',
    kind: 'review_packet',
    title: 'Review Packet',
    summary: 'Full manuscript packet with compare and trace context attached.',
    createdAtLabel: 'Updated for PR13 baseline',
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
    includedSceneCount: 5,
    assembledWordCount: 680,
    blockerCount: 1,
    warningCount: 2,
    infoCount: 1,
    missingDraftCount: 1,
    traceGapCount: 1,
    compareChangedSceneCount: 2,
  },
  readiness: {
    status: 'blocked',
    label: 'Blocked by missing draft coverage',
    issues: [
      {
        id: 'issue-missing-draft',
        severity: 'blocker',
        kind: 'missing_draft',
        chapterId: 'chapter-open-water-signals',
        chapterTitle: 'Open Water Signals',
        title: 'Draft coverage incomplete',
        detail: 'One included scene still needs current draft prose.',
      },
      {
        id: 'issue-trace-gap',
        severity: 'warning',
        kind: 'trace_gap',
        chapterId: 'chapter-open-water-signals',
        chapterTitle: 'Open Water Signals',
        title: 'Trace appendix is incomplete',
        detail: 'One included scene still lacks trace coverage.',
      },
    ],
  },
  packageSummary: {
    includedSections: ['Manuscript body', 'Trace appendix', 'Compare summary', 'Readiness checklist'],
    excludedSections: ['Scene headings'],
    estimatedPackageLabel: 'Approx. 8 manuscript pages',
  },
}

const artifactWorkspace: BookExportArtifactWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  exportProfileId: 'export-review-packet',
  checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  sourceSignature: 'current-source-signature',
  gate: {
    canBuild: false,
    status: 'blocked',
    label: 'Blocked by export readiness and review blockers',
    reasons: [],
    openBlockerCount: 2,
    checkedFixCount: 1,
    blockedFixCount: 1,
    staleFixCount: 0,
  },
  latestArtifact: {
    artifactId: 'artifact-review-packet',
    format: 'markdown',
    filename: 'signal-arc-review-packet.md',
    mimeType: 'text/markdown',
    title: 'Signal Arc Review Packet',
    summary: 'Markdown package generated from the current export preview.',
    content: '# Signal Arc',
    createdAtLabel: '2026-04-20 10:15',
    createdByLabel: 'Mock builder',
    sourceSignature: 'previous-source-signature',
    isStale: true,
    chapterCount: 2,
    sceneCount: 5,
    wordCount: 680,
    readinessStatus: 'attention',
  },
  artifacts: [],
}

const branchWorkspace: BookExperimentBranchWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  title: 'Signal Arc',
  summary: 'Experimental branch workspace',
  branch: {
    branchId: 'branch-book-signal-arc-high-pressure',
    bookId: 'book-signal-arc',
    title: 'High Pressure',
    summary: 'Push the platform pressure higher before the release.',
    rationale: 'Stress the witness line and hold the courier cost in public view.',
    createdAtLabel: '2026-04-18 10:00',
    status: 'active',
    basedOnCheckpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  },
  branches: [],
  selectedChapterId: 'chapter-open-water-signals',
  baseline: {
    kind: 'checkpoint',
    label: 'Checkpoint baseline',
    checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  },
  chapters: [
    {
      chapterId: 'chapter-open-water-signals',
      order: 2,
      title: 'Open Water Signals',
      summary: 'Carry the courier handoff into open water.',
      changedSceneCount: 1,
      addedSceneCount: 1,
      missingSceneCount: 0,
      draftMissingSceneCount: 1,
      wordDelta: 42,
      traceRegressionCount: 1,
      traceImprovementCount: 2,
      warningsDelta: 1,
      sourceProposalDelta: -1,
      readinessStatus: 'blocked',
      sceneDeltas: [],
    },
  ],
  selectedChapter: {
    chapterId: 'chapter-open-water-signals',
    order: 2,
    title: 'Open Water Signals',
    summary: 'Carry the courier handoff into open water.',
    changedSceneCount: 1,
    addedSceneCount: 1,
    missingSceneCount: 0,
    draftMissingSceneCount: 1,
    wordDelta: 42,
    traceRegressionCount: 1,
    traceImprovementCount: 2,
    warningsDelta: 1,
    sourceProposalDelta: -1,
    readinessStatus: 'blocked',
    sceneDeltas: [],
  },
  totals: {
    changedChapterCount: 1,
    changedSceneCount: 1,
    addedSceneCount: 1,
    missingSceneCount: 0,
    draftMissingSceneCount: 1,
    wordDelta: 42,
    traceRegressionCount: 1,
    traceImprovementCount: 2,
    warningsDelta: 1,
    sourceProposalDelta: -1,
    blockedChapterCount: 1,
    attentionChapterCount: 0,
  },
  readiness: {
    status: 'blocked',
    label: 'Blocked by draft gaps',
    issues: [
      {
        id: 'branch-blocker-1',
        severity: 'blocker',
        chapterId: 'chapter-open-water-signals',
        sceneId: 'scene-dawn-slip',
        title: 'Draft gap still visible',
        detail: 'Dawn Slip still has no branch draft.',
      },
      {
        id: 'branch-warning-1',
        severity: 'warning',
        chapterId: 'chapter-open-water-signals',
        sceneId: 'scene-warehouse-bridge',
        title: 'Warnings increased',
        detail: 'Warehouse Bridge carries one additional warning.',
      },
    ],
  },
}

describe('BookDraftInspectorPane', () => {
  it('shows the selected review issue summary in review mode', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="review"
          reviewInbox={createReviewInbox()}
          onOpenReviewSource={() => undefined}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Selected review issue')).toBeInTheDocument()
    expect(screen.getByText('Blocker')).toBeInTheDocument()
    expect(screen.getByText('Export packet is blocked')).toBeInTheDocument()
    expect(screen.getAllByText('Export readiness').length).toBeGreaterThan(0)
    expect(screen.getByText('Open Water Signals / Dawn Slip')).toBeInTheDocument()
    expect(
      screen.getAllByText('Open export readiness and resolve the missing chapter draft before the next pass.').length,
    ).toBeGreaterThan(0)
  })

  it('shows the review queue summary and source handoff in review mode', async () => {
    const user = userEvent.setup()
    const onOpenReviewSource = vi.fn()

    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="review"
          reviewInbox={createReviewInbox()}
          onOpenReviewSource={onOpenReviewSource}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Review queue summary')).toBeInTheDocument()
    expect(screen.getByText('Blockers')).toBeInTheDocument()
    expect(screen.getByText('Warnings')).toBeInTheDocument()
    expect(screen.getByText('Trace gaps')).toBeInTheDocument()
    expect(screen.getAllByText('Export readiness').length).toBeGreaterThan(0)
    expect(screen.getByText('Branch readiness')).toBeInTheDocument()
    expect(screen.getByText('Source handoff')).toBeInTheDocument()
    expect(screen.getByText('Recommended source action')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inspector source action Open export readiness' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Inspector source action Open chapter draft' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start source fix' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark source checked' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear fix action' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Inspector source action Open export readiness' }))

    expect(onOpenReviewSource).toHaveBeenCalledWith(createReviewInbox().selectedIssue?.handoffs[0])
  })

  it('shows review decision status, note, stale warning, and next action in review mode', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="review"
          reviewInbox={{
            ...createReviewInbox(),
            selectedIssue: createReviewIssue({
              decision: {
                status: 'deferred',
                note: 'Carry this after export baseline is clean.',
                updatedAtLabel: '2026-04-19 18:20',
                updatedByLabel: 'Editor',
                isStale: true,
              },
            }),
          }}
          onOpenReviewSource={() => undefined}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Decision status')).toBeInTheDocument()
    expect(screen.getByText('Deferred')).toBeInTheDocument()
    expect(screen.getByText('Carry this after export baseline is clean.')).toBeInTheDocument()
    expect(screen.getByText('Decision stale')).toBeInTheDocument()
    expect(screen.getByText('Recommendation')).toBeInTheDocument()
  })

  it('shows fix status primary target stale warning note and next source action in review mode', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="review"
          reviewInbox={{
            ...createReviewInbox(),
            selectedIssue: createReviewIssue({
              fixAction: {
                status: 'stale',
                sourceHandoffId: 'review-source-export',
                sourceHandoffLabel: 'Open export readiness',
                targetScope: 'book',
                note: 'Recheck export readiness after draft coverage changes.',
                startedAtLabel: 'Started yesterday',
                updatedAtLabel: 'Updated today',
                updatedByLabel: 'Editor',
                isStale: true,
              },
            }),
          }}
          onOpenReviewSource={() => undefined}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Selected issue fix action')).toBeInTheDocument()
    expect(screen.getAllByText('Fix stale').length).toBeGreaterThan(0)
    expect(screen.getByText('Open export readiness · book')).toBeInTheDocument()
    expect(screen.getByText('This source fix is stale because the review issue changed after the fix action was recorded.')).toBeInTheDocument()
    expect(screen.getByText('Recheck export readiness after draft coverage changes.')).toBeInTheDocument()
    expect(screen.getByText('Next recommended source action')).toBeInTheDocument()
  })

  it.each([
    { draftView: 'read' as const },
    { draftView: 'compare' as const, compare },
    { draftView: 'export' as const, exportPreview },
    { draftView: 'branch' as const, branch: branchWorkspace },
  ])('does not show review-only sections in $draftView mode', ({ draftView, compare, exportPreview, branch }) => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView={draftView}
          compare={compare ?? null}
          exportPreview={exportPreview ?? null}
          branch={branch ?? null}
          reviewInbox={createReviewInbox()}
          onOpenReviewSource={() => undefined}
        />
      </AppProviders>,
    )

    expect(screen.queryByText('Selected review issue')).not.toBeInTheDocument()
    expect(screen.queryByText('Review queue summary')).not.toBeInTheDocument()
    expect(screen.queryByText('Source handoff')).not.toBeInTheDocument()
  })
  it('keeps read-mode content intact when compare mode is inactive', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane bookTitle="Signal Arc" inspector={inspector} activeDraftView="read" />
      </AppProviders>,
    )

    expect(screen.getByText('Manuscript Readiness')).toBeInTheDocument()
    expect(screen.queryByText('Checkpoint')).not.toBeInTheDocument()
  })

  it('shows compare summary, checkpoint, and review attention in compare mode', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="compare"
          compare={compare}
          checkpointMeta={{
            title: 'PR11 Baseline',
            createdAtLabel: '2026-04-17 22:10',
            summary: 'Baseline manuscript snapshot.',
          }}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Selected chapter compare summary')).toBeInTheDocument()
    expect(screen.getByText('Checkpoint')).toBeInTheDocument()
    expect(screen.getByText('Review attention')).toBeInTheDocument()
    expect(screen.getByText('Changed scenes')).toBeInTheDocument()
    expect(screen.getAllByText('Dawn Slip').length).toBeGreaterThan(0)
    expect(screen.getAllByText('River Ledger').length).toBeGreaterThan(0)
    expect(screen.getByText('PR11 Baseline')).toBeInTheDocument()
  })

  it('shows export profile, readiness summary, and selected chapter export facts in export mode', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="export"
          exportPreview={exportPreview}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Export Profile')).toBeInTheDocument()
    expect(screen.getByText('Review Packet')).toBeInTheDocument()
    expect(screen.getByText('Readiness')).toBeInTheDocument()
    expect(screen.getByText('Blocked by missing draft coverage')).toBeInTheDocument()
    expect(screen.getByText('Selected chapter export')).toBeInTheDocument()
    expect(screen.getByText('Approx. 8 manuscript pages')).toBeInTheDocument()
  })

  it('shows artifact status in export mode without adding inspector build actions', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="export"
          exportPreview={exportPreview}
          artifactWorkspace={artifactWorkspace}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Artifact')).toBeInTheDocument()
    expect(screen.getByText('signal-arc-review-packet.md')).toBeInTheDocument()
    expect(screen.getAllByText('Stale').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Blocked by export readiness and review blockers').length).toBeGreaterThan(0)
    expect(screen.getByText('Open blockers')).toBeInTheDocument()
    expect(screen.getByText('Last build')).toBeInTheDocument()
    expect(screen.getByText('2026-04-20 10:15')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Build Markdown package/i })).not.toBeInTheDocument()
  })

  it('shows an export-baseline error state instead of generic manuscript support when export mode is broken', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="export"
          exportPreview={null}
          exportError={new Error('Book manuscript checkpoint "checkpoint-missing" could not be found for "book-signal-arc".')}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Export baseline unavailable')).toBeInTheDocument()
    expect(screen.getByText('Export readiness unavailable')).toBeInTheDocument()
    expect(screen.getByText('Book manuscript checkpoint "checkpoint-missing" could not be found for "book-signal-arc".')).toBeInTheDocument()
    expect(screen.queryByText('Manuscript Readiness')).not.toBeInTheDocument()
  })

  it('shows branch summary, selected chapter branch delta, and readiness support in branch mode', () => {
    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="branch"
          branch={branchWorkspace}
        />
      </AppProviders>,
    )

    expect(screen.getByText('Selected branch')).toBeInTheDocument()
    expect(screen.getByText('High Pressure')).toBeInTheDocument()
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    expect(screen.getByText('Checkpoint baseline')).toBeInTheDocument()
    expect(screen.getByText('Selected chapter branch summary')).toBeInTheDocument()
    expect(screen.getByText('Draft missing')).toBeInTheDocument()
    expect(screen.getByText('Trace improvements')).toBeInTheDocument()
    expect(screen.getByText('Branch readiness')).toBeInTheDocument()
    expect(screen.getByText('Blocked by draft gaps')).toBeInTheDocument()
    expect(screen.getAllByText('Draft gap still visible').length).toBeGreaterThan(0)
  })

  it('uses the same zh-CN review status wording as the branch picker', () => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, 'zh-CN')

    render(
      <AppProviders>
        <BookDraftInspectorPane
          bookTitle="Signal Arc"
          inspector={inspector}
          activeDraftView="branch"
          branch={{
            ...branchWorkspace,
            branch: branchWorkspace.branch
              ? {
                  ...branchWorkspace.branch,
                  status: 'review',
                }
              : null,
          }}
        />
      </AppProviders>,
    )

    expect(screen.getAllByText('审阅中').length).toBeGreaterThan(0)
  })
})
