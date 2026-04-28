import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AppProviders } from '@/app/providers'

import type {
  BookExportArtifactSummaryViewModel,
  BookExportArtifactWorkspaceViewModel,
} from '../types/book-export-artifact-view-models'
import type { BookExportPreviewWorkspaceViewModel, BookExportProfileSummaryViewModel } from '../types/book-export-view-models'
import { BookDraftExportView } from './BookDraftExportView'

const profiles: BookExportProfileSummaryViewModel[] = [
  {
    exportProfileId: 'export-review-packet',
    bookId: 'book-signal-arc',
    kind: 'review_packet',
    title: 'Review Packet',
    summary: 'Full manuscript packet with compare and trace context.',
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
  {
    exportProfileId: 'export-submission-preview',
    bookId: 'book-signal-arc',
    kind: 'submission_preview',
    title: 'Submission Preview',
    summary: 'Submission-oriented package without internal appendices.',
    createdAtLabel: 'Prepared for external preview',
    includes: {
      manuscriptBody: true,
      chapterSummaries: true,
      sceneHeadings: true,
      traceAppendix: false,
      compareSummary: false,
      readinessChecklist: true,
    },
    rules: {
      requireAllScenesDrafted: true,
      requireTraceReady: true,
      allowWarnings: false,
      allowDraftMissing: false,
    },
  },
]

const exportWorkspace: BookExportPreviewWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  title: 'Signal Arc',
  summary: 'Export preview workspace for manuscript packaging.',
  selectedChapterId: 'chapter-open-water-signals',
  selectedChapter: {
    chapterId: 'chapter-open-water-signals',
    order: 2,
    title: 'Open Water Signals',
    summary: 'Carry the courier handoff into open water.',
    isIncluded: true,
    assembledWordCount: 640,
    missingDraftCount: 0,
    missingTraceCount: 1,
    warningCount: 2,
    scenes: [
      {
        sceneId: 'scene-warehouse-bridge',
        order: 1,
        title: 'Warehouse Bridge',
        summary: 'Keep the handoff unstable.',
        proseDraft: 'Warehouse pressure stayed visible while the courier handoff slipped toward open water.',
        draftWordCount: 13,
        isIncluded: true,
        isMissingDraft: false,
        traceReady: true,
        warningsCount: 1,
        compareDelta: 'changed',
      },
      {
        sceneId: 'scene-dawn-slip',
        order: 2,
        title: 'Dawn Slip',
        summary: 'Let the release move while the witness line stays attached.',
        draftWordCount: undefined,
        isIncluded: true,
        isMissingDraft: true,
        traceReady: false,
        warningsCount: 1,
        compareDelta: 'draft_missing',
      },
    ],
    readinessStatus: 'attention',
  },
  profile: profiles[0]!,
  chapters: [
    {
      chapterId: 'chapter-signals-in-rain',
      order: 1,
      title: 'Signals in Rain',
      summary: 'Keep platform pressure audible.',
      isIncluded: true,
      assembledWordCount: 560,
      missingDraftCount: 1,
      missingTraceCount: 0,
      warningCount: 1,
      scenes: [],
      readinessStatus: 'blocked',
    },
    {
      chapterId: 'chapter-open-water-signals',
      order: 2,
      title: 'Open Water Signals',
      summary: 'Carry the courier handoff into open water.',
      isIncluded: true,
      assembledWordCount: 640,
      missingDraftCount: 0,
      missingTraceCount: 1,
      warningCount: 2,
      scenes: [
        {
          sceneId: 'scene-warehouse-bridge',
          order: 1,
          title: 'Warehouse Bridge',
          summary: 'Keep the handoff unstable.',
          proseDraft: 'Warehouse pressure stayed visible while the courier handoff slipped toward open water.',
          draftWordCount: 13,
          isIncluded: true,
          isMissingDraft: false,
          traceReady: true,
          warningsCount: 1,
          compareDelta: 'changed',
        },
        {
          sceneId: 'scene-dawn-slip',
          order: 2,
          title: 'Dawn Slip',
          summary: 'Let the release move while the witness line stays attached.',
          isIncluded: true,
          isMissingDraft: true,
          traceReady: false,
          warningsCount: 1,
          compareDelta: 'draft_missing',
        },
      ],
      readinessStatus: 'attention',
    },
  ],
  totals: {
    includedChapterCount: 2,
    includedSceneCount: 5,
    assembledWordCount: 1200,
    blockerCount: 1,
    warningCount: 3,
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
        chapterId: 'chapter-signals-in-rain',
        chapterTitle: 'Signals in Rain',
        sceneId: 'scene-departure-bell',
        sceneTitle: 'Departure Bell',
        title: 'Draft coverage incomplete',
        detail: 'Departure Bell still needs current draft prose.',
        recommendedActionLabel: 'Review chapter',
      },
    ],
  },
  packageSummary: {
    includedSections: ['Manuscript body', 'Chapter summaries', 'Trace appendix', 'Compare summary', 'Readiness checklist'],
    excludedSections: ['Scene headings'],
    estimatedPackageLabel: 'Approx. 12 manuscript pages',
  },
  readableManuscript: {
    formatVersion: 'book-manuscript-assembly-v1',
    markdown: '# Signal Arc',
    plainText: 'Signal Arc',
    sections: [],
    sourceManifest: [
      {
        kind: 'scene-draft',
        chapterId: 'chapter-open-water-signals',
        chapterOrder: 2,
        chapterTitle: 'Open Water Signals',
        sceneId: 'scene-warehouse-bridge',
        sceneOrder: 1,
        sceneTitle: 'Warehouse Bridge',
        sourcePatchId: 'canon-patch-004',
        sourceProposalIds: ['proposal-004'],
        acceptedFactIds: ['fact-004'],
        traceReady: true,
      },
      {
        kind: 'scene-gap',
        chapterId: 'chapter-open-water-signals',
        chapterOrder: 2,
        chapterTitle: 'Open Water Signals',
        sceneId: 'scene-dawn-slip',
        sceneOrder: 2,
        sceneTitle: 'Dawn Slip',
        sourceProposalIds: [],
        acceptedFactIds: [],
        traceReady: false,
        gapReason: 'Draft still missing.',
      },
    ],
  },
}

const latestArtifact: BookExportArtifactSummaryViewModel = {
  artifactId: 'artifact-latest',
  format: 'markdown',
  filename: 'signal-arc-review.md',
  mimeType: 'text/markdown',
  title: 'Signal Arc',
  summary: 'Export artifact for Review Packet.',
  content: '# Signal Arc\n',
  createdAtLabel: 'Built in mock export session',
  createdByLabel: 'Narrative editor',
  sourceSignature: 'current-signature',
  isStale: false,
  chapterCount: 2,
  sceneCount: 5,
  wordCount: 1200,
  readinessStatus: 'ready',
}

const artifactWorkspace: BookExportArtifactWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  exportProfileId: 'export-review-packet',
  checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  sourceSignature: 'current-signature',
  gate: {
    canBuild: true,
    status: 'ready',
    label: 'Artifact build ready',
    reasons: [],
    openBlockerCount: 0,
    checkedFixCount: 0,
    blockedFixCount: 0,
    staleFixCount: 0,
  },
  latestArtifact,
  artifacts: [latestArtifact],
}

describe('BookDraftExportView', () => {
  it('renders the export profile, readiness, package summary, chapter list, and selected chapter detail', () => {
    render(
      <AppProviders>
        <BookDraftExportView
          exportPreview={exportWorkspace}
          exportProfiles={profiles}
          selectedExportProfileId="export-review-packet"
          artifactWorkspace={artifactWorkspace}
          selectedArtifactFormat="markdown"
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectArtifactFormat={vi.fn()}
          onBuildArtifact={vi.fn()}
          onCopyArtifact={vi.fn()}
          onDownloadArtifact={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Book export preview' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Export profile' })).toBeInTheDocument()
    expect(screen.getByText('Blocked by missing draft coverage')).toBeInTheDocument()
    expect(screen.getByText('Approx. 12 manuscript pages')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chapter 2 Open Water Signals' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('heading', { name: 'Selected chapter package' })).toBeInTheDocument()
    expect(screen.getByText('Warehouse Bridge')).toBeInTheDocument()
    expect(screen.getByText('Dawn Slip')).toBeInTheDocument()
    expect(screen.getByText('Source manifest')).toBeInTheDocument()
    expect(screen.getAllByText(/scene-draft/i).length).toBeGreaterThan(0)
  })

  it('uses chapter clicks and secondary actions to preserve chapter-focused behavior', async () => {
    const user = userEvent.setup()
    const onSelectChapter = vi.fn()
    const onOpenChapter = vi.fn()

    render(
      <AppProviders>
        <BookDraftExportView
          exportPreview={exportWorkspace}
          exportProfiles={profiles}
          selectedExportProfileId="export-review-packet"
          artifactWorkspace={artifactWorkspace}
          selectedArtifactFormat="markdown"
          onSelectChapter={onSelectChapter}
          onOpenChapter={onOpenChapter}
          onSelectExportProfile={vi.fn()}
          onSelectArtifactFormat={vi.fn()}
          onBuildArtifact={vi.fn()}
          onCopyArtifact={vi.fn()}
          onDownloadArtifact={vi.fn()}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Chapter 1 Signals in Rain' }))
    expect(onSelectChapter).toHaveBeenCalledWith('chapter-signals-in-rain')

    const chapterDetail = screen.getByRole('heading', { name: 'Selected chapter package' }).closest('section')
    expect(chapterDetail).not.toBeNull()

    await user.click(within(chapterDetail!).getByRole('button', { name: 'Open in Draft: Open Water Signals' }))
    await user.click(within(chapterDetail!).getByRole('button', { name: 'Open in Structure: Open Water Signals' }))

    expect(onOpenChapter).toHaveBeenNthCalledWith(1, 'chapter-open-water-signals', 'draft')
    expect(onOpenChapter).toHaveBeenNthCalledWith(2, 'chapter-open-water-signals', 'structure')
  })

  it('renders the artifact gate and artifact panel', () => {
    render(
      <AppProviders>
        <BookDraftExportView
          exportPreview={exportWorkspace}
          exportProfiles={profiles}
          selectedExportProfileId="export-review-packet"
          artifactWorkspace={artifactWorkspace}
          selectedArtifactFormat="markdown"
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectArtifactFormat={vi.fn()}
          onBuildArtifact={vi.fn()}
          onCopyArtifact={vi.fn()}
          onDownloadArtifact={vi.fn()}
        />
      </AppProviders>,
    )

    expect(screen.getByRole('heading', { name: 'Artifact builder' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Artifact gate' })).toBeInTheDocument()
    expect(screen.getByText('signal-arc-review.md')).toBeInTheDocument()
  })

  it('forwards artifact build action', async () => {
    const user = userEvent.setup()
    const onBuildArtifact = vi.fn()

    render(
      <AppProviders>
        <BookDraftExportView
          exportPreview={exportWorkspace}
          exportProfiles={profiles}
          selectedExportProfileId="export-review-packet"
          artifactWorkspace={artifactWorkspace}
          selectedArtifactFormat="plain_text"
          onSelectChapter={vi.fn()}
          onOpenChapter={vi.fn()}
          onSelectExportProfile={vi.fn()}
          onSelectArtifactFormat={vi.fn()}
          onBuildArtifact={onBuildArtifact}
          onCopyArtifact={vi.fn()}
          onDownloadArtifact={vi.fn()}
        />
      </AppProviders>,
    )

    await user.click(screen.getByRole('button', { name: 'Build plain text package' }))

    expect(onBuildArtifact).toHaveBeenCalledTimes(1)
  })
})
