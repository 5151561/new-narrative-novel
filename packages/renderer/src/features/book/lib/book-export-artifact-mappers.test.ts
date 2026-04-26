import { describe, expect, it } from 'vitest'

import type { BookExportArtifactRecord } from '../api/book-export-artifact-records'
import type { BookExportPreviewWorkspaceViewModel } from '../types/book-export-view-models'
import type { BookReviewInboxViewModel, ReviewIssueViewModel } from '@/features/review/types/review-view-models'
import {
  buildBookExportArtifactContent,
  buildBookExportArtifactGate,
  buildBookExportArtifactWorkspace,
  createBookExportArtifactSourceSignature,
  normalizeBookExportArtifactRecord,
} from './book-export-artifact-mappers'

function createExportPreview(
  overrides: Partial<BookExportPreviewWorkspaceViewModel> & {
    sceneProse?: string
    includeTraceAppendix?: boolean
    readinessBlocker?: boolean
    readinessWarning?: boolean
  } = {},
): BookExportPreviewWorkspaceViewModel {
  const includeTraceAppendix = overrides.includeTraceAppendix ?? true
  const hasSceneProseOverride = Object.prototype.hasOwnProperty.call(overrides, 'sceneProse')
  const sceneProse = hasSceneProseOverride ? overrides.sceneProse : 'Current warehouse bridge draft.'
  const isMissingDraft = hasSceneProseOverride && sceneProse === undefined
  const readinessIssues = [
    ...(overrides.readinessBlocker
      ? [
          {
            id: 'export-blocker-1',
            severity: 'blocker' as const,
            kind: 'missing_draft' as const,
            title: 'Draft coverage incomplete',
            detail: 'One scene is missing draft prose.',
          },
        ]
      : []),
    ...(overrides.readinessWarning
      ? [
          {
            id: 'export-warning-1',
            severity: 'warning' as const,
            kind: 'trace_gap' as const,
            title: 'Trace appendix is incomplete',
            detail: 'One scene is missing trace coverage.',
          },
        ]
      : []),
  ]

  const preview: BookExportPreviewWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'A relay team follows the signal through the flood district.',
    selectedChapterId: 'chapter-open-water-signals',
    selectedChapter: null,
    profile: {
      exportProfileId: 'profile-editorial-md',
      bookId: 'book-signal-arc',
      kind: 'editorial',
      title: 'Editorial Markdown',
      summary: 'Markdown package for editorial pass.',
      createdAtLabel: 'Updated for PR13 baseline',
      includes: {
        manuscriptBody: true,
        chapterSummaries: true,
        sceneHeadings: true,
        traceAppendix: includeTraceAppendix,
        compareSummary: true,
        readinessChecklist: true,
      },
      rules: {
        requireAllScenesDrafted: false,
        requireTraceReady: false,
        allowWarnings: true,
        allowDraftMissing: true,
      },
    },
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 1,
        title: 'Open Water Signals',
        summary: 'The first relay across the warehouse bridge.',
        isIncluded: true,
        assembledWordCount: 88,
        missingDraftCount: overrides.sceneProse === undefined ? 1 : 0,
        missingTraceCount: 0,
        warningCount: 0,
        readinessStatus: 'ready',
        scenes: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'The crew crosses the bridge.',
            proseDraft: sceneProse,
            draftWordCount: isMissingDraft ? undefined : 4,
            isIncluded: true,
            isMissingDraft,
            traceReady: true,
            warningsCount: 0,
            compareDelta: 'changed',
          },
        ],
      },
    ],
    totals: {
      includedChapterCount: 1,
      includedSceneCount: 1,
      assembledWordCount: 88,
      blockerCount: overrides.readinessBlocker ? 1 : 0,
      warningCount: overrides.readinessWarning ? 1 : 0,
      infoCount: 0,
      missingDraftCount: overrides.sceneProse === undefined ? 1 : 0,
      traceGapCount: 0,
      compareChangedSceneCount: 1,
    },
    readiness: {
      status: overrides.readinessBlocker ? 'blocked' : overrides.readinessWarning ? 'attention' : 'ready',
      label: overrides.readinessBlocker ? 'Export blocked' : overrides.readinessWarning ? 'Export needs attention' : 'Export ready',
      issues: readinessIssues,
      blockerCount: overrides.readinessBlocker ? 1 : 0,
      warningCount: overrides.readinessWarning ? 1 : 0,
      infoCount: 0,
    },
    packageSummary: {
      includedSections: ['Manuscript body', 'Chapter summaries'],
      excludedSections: includeTraceAppendix ? [] : ['Trace appendix'],
      estimatedPackageLabel: 'Approx. 1 manuscript pages',
    },
  }

  preview.selectedChapter = preview.chapters[0]!
  return { ...preview, ...overrides }
}

function createReviewIssue(overrides: Partial<ReviewIssueViewModel> = {}): ReviewIssueViewModel {
  return {
    id: 'review-issue-1',
    severity: 'blocker',
    source: 'manuscript',
    kind: 'missing_draft',
    title: 'Missing draft',
    detail: 'The scene still needs prose.',
    recommendation: 'Review the chapter draft.',
    sourceLabel: 'Manuscript',
    tags: [],
    handoffs: [],
    issueSignature: 'review-issue-1::missing_draft',
    decision: {
      status: 'open',
      isStale: false,
    },
    fixAction: {
      status: 'not_started',
      isStale: false,
    },
    primaryFixHandoff: null,
    ...overrides,
  }
}

function createReviewInbox(issues: ReviewIssueViewModel[] = []): BookReviewInboxViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    selectedIssueId: null,
    selectedIssue: null,
    activeFilter: 'all',
    activeStatusFilter: 'open',
    issues,
    filteredIssues: issues,
    groupedIssues: {
      blockers: issues.filter((issue) => issue.severity === 'blocker'),
      warnings: issues.filter((issue) => issue.severity === 'warning'),
      info: issues.filter((issue) => issue.severity === 'info'),
    },
    counts: {
      total: issues.length,
      blockers: issues.filter((issue) => issue.severity === 'blocker').length,
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
      info: issues.filter((issue) => issue.severity === 'info').length,
      traceGaps: 0,
      missingDrafts: issues.filter((issue) => issue.kind === 'missing_draft').length,
      compareDeltas: 0,
      exportReadiness: 0,
      branchReadiness: 0,
      sceneProposals: 0,
      open: issues.filter((issue) => issue.decision.status === 'open').length,
      reviewed: issues.filter((issue) => issue.decision.status === 'reviewed').length,
      deferred: issues.filter((issue) => issue.decision.status === 'deferred').length,
      dismissed: issues.filter((issue) => issue.decision.status === 'dismissed').length,
      stale: issues.filter((issue) => issue.decision.status === 'stale').length,
      fixStarted: issues.filter((issue) => issue.fixAction.status === 'started').length,
      fixChecked: issues.filter((issue) => issue.fixAction.status === 'checked').length,
      fixBlocked: issues.filter((issue) => issue.fixAction.status === 'blocked').length,
      fixStale: issues.filter((issue) => issue.fixAction.status === 'stale').length,
    },
    visibleOpenCount: issues.filter((issue) => issue.decision.status === 'open').length,
    selectedChapterIssueCount: 0,
    annotationsByChapterId: {},
  }
}

function createArtifactRecord(sourceSignature: string): BookExportArtifactRecord {
  return {
    id: 'book-export-artifact-book-signal-arc-profile-editorial-md-markdown-1',
    bookId: 'book-signal-arc',
    exportProfileId: 'profile-editorial-md',
    format: 'markdown',
    status: 'ready',
    filename: 'signal-arc-profile-editorial-md.md',
    mimeType: 'text/markdown',
    title: 'Signal Arc',
    summary: 'Artifact summary',
    content: '# Signal Arc',
    sourceSignature,
    chapterCount: 1,
    sceneCount: 1,
    wordCount: 88,
    readinessSnapshot: {
      status: 'ready',
      blockerCount: 0,
      warningCount: 0,
      infoCount: 0,
    },
    reviewGateSnapshot: {
      openBlockerCount: 0,
      checkedFixCount: 0,
      blockedFixCount: 0,
      staleFixCount: 0,
    },
    createdAtLabel: 'Built in mock export session',
    createdByLabel: 'Narrative editor',
  }
}

describe('book export artifact mappers', () => {
  it('creates a stable source signature for the same preview', () => {
    const exportPreview = createExportPreview()

    expect(createBookExportArtifactSourceSignature(exportPreview)).toBe(createBookExportArtifactSourceSignature(exportPreview))
  })

  it('does not change the source signature when only the selected preview chapter changes', () => {
    const exportPreview = createExportPreview()
    const baseSignature = createBookExportArtifactSourceSignature(exportPreview)
    const variant = structuredClone(exportPreview)

    variant.selectedChapterId = 'chapter-signals-in-rain'
    variant.selectedChapter = null

    expect(createBookExportArtifactSourceSignature(variant)).toBe(baseSignature)
  })

  it('does not change the source signature when excluded chapter or scene content changes', () => {
    const exportPreview = createExportPreview()
    exportPreview.chapters[0]!.scenes.push({
      sceneId: 'scene-excluded-canal',
      order: 2,
      title: 'Excluded Canal',
      summary: 'Excluded canal summary.',
      proseDraft: 'Excluded canal draft.',
      draftWordCount: 3,
      isIncluded: false,
      isMissingDraft: false,
      traceReady: false,
      warningsCount: 2,
      compareDelta: 'changed',
    })
    exportPreview.chapters.push({
      chapterId: 'chapter-excluded-rain',
      order: 2,
      title: 'Excluded Rain',
      summary: 'Excluded rain summary.',
      isIncluded: false,
      assembledWordCount: 21,
      missingDraftCount: 0,
      missingTraceCount: 1,
      warningCount: 2,
      readinessStatus: 'attention',
      scenes: [
        {
          sceneId: 'scene-excluded-rain',
          order: 1,
          title: 'Excluded Rain Scene',
          summary: 'Excluded rain scene summary.',
          proseDraft: 'Excluded rain draft.',
          draftWordCount: 3,
          isIncluded: false,
          isMissingDraft: false,
          traceReady: false,
          warningsCount: 2,
          compareDelta: 'added',
        },
      ],
    })
    const baseSignature = createBookExportArtifactSourceSignature(exportPreview)
    const variant = structuredClone(exportPreview)

    variant.chapters[0]!.scenes[1]!.title = 'Renamed Excluded Canal'
    variant.chapters[0]!.scenes[1]!.proseDraft = 'Changed excluded canal draft.'
    variant.chapters[1]!.title = 'Renamed Excluded Rain'
    variant.chapters[1]!.summary = 'Changed excluded rain summary.'
    variant.chapters[1]!.scenes[0]!.proseDraft = 'Changed excluded rain draft.'

    expect(createBookExportArtifactSourceSignature(variant)).toBe(baseSignature)
  })

  it('does not change the source signature when an included scene title is not emitted', () => {
    const exportPreview = createExportPreview()
    exportPreview.profile.includes.sceneHeadings = false
    exportPreview.profile.includes.traceAppendix = false
    exportPreview.profile.includes.compareSummary = false
    const baseSignature = createBookExportArtifactSourceSignature(exportPreview)
    const variant = structuredClone(exportPreview)

    variant.chapters[0]!.scenes[0]!.title = 'Unemitted Scene Title'

    expect(createBookExportArtifactSourceSignature(variant)).toBe(baseSignature)
  })

  it('changes the source signature when an included scene title is emitted by scene headings', () => {
    const exportPreview = createExportPreview()
    exportPreview.profile.includes.sceneHeadings = true
    exportPreview.profile.includes.traceAppendix = false
    exportPreview.profile.includes.compareSummary = false
    const baseSignature = createBookExportArtifactSourceSignature(exportPreview)
    const variant = structuredClone(exportPreview)

    variant.chapters[0]!.scenes[0]!.title = 'Emitted Scene Title'

    expect(createBookExportArtifactSourceSignature(variant)).not.toBe(baseSignature)
  })

  it('does not change the source signature when an included scene summary changes', () => {
    const exportPreview = createExportPreview()
    const baseSignature = createBookExportArtifactSourceSignature(exportPreview)
    const variant = structuredClone(exportPreview)

    variant.chapters[0]!.scenes[0]!.summary = 'Changed but unemitted scene summary.'

    expect(createBookExportArtifactSourceSignature(variant)).toBe(baseSignature)
  })

  it('changes the source signature when scene prose or readiness issues change', () => {
    const baseSignature = createBookExportArtifactSourceSignature(createExportPreview())
    const proseSignature = createBookExportArtifactSourceSignature(createExportPreview({ sceneProse: 'A revised bridge draft.' }))
    const readinessSignature = createBookExportArtifactSourceSignature(createExportPreview({ readinessWarning: true }))

    expect(proseSignature).not.toBe(baseSignature)
    expect(readinessSignature).not.toBe(baseSignature)
  })

  it('changes the source signature when content-affecting metadata changes', () => {
    const basePreview = createExportPreview({ readinessWarning: true })
    const baseSignature = createBookExportArtifactSourceSignature(basePreview)
    const createVariantSignature = (mutate: (preview: BookExportPreviewWorkspaceViewModel) => void) => {
      const preview = structuredClone(basePreview)
      mutate(preview)
      return createBookExportArtifactSourceSignature(preview)
    }

    expect(createVariantSignature((preview) => {
      preview.summary = 'A revised book summary.'
    })).not.toBe(baseSignature)
    expect(createVariantSignature((preview) => {
      preview.profile.title = 'Copyedit Text'
    })).not.toBe(baseSignature)
    expect(createVariantSignature((preview) => {
      preview.chapters[0]!.title = 'Renamed Chapter'
    })).not.toBe(baseSignature)
    expect(createVariantSignature((preview) => {
      preview.chapters[0]!.scenes[0]!.title = 'Renamed Scene'
    })).not.toBe(baseSignature)
    expect(createVariantSignature((preview) => {
      preview.chapters[0]!.scenes[0]!.traceReady = false
    })).not.toBe(baseSignature)
    expect(createVariantSignature((preview) => {
      preview.chapters[0]!.scenes[0]!.compareDelta = 'unchanged'
    })).not.toBe(baseSignature)
    expect(createVariantSignature((preview) => {
      preview.readiness.issues[0]!.detail = 'Updated readiness detail.'
    })).not.toBe(baseSignature)
  })

  it('blocks the gate when export readiness has blockers', () => {
    const gate = buildBookExportArtifactGate({
      exportPreview: createExportPreview({ readinessBlocker: true }),
      reviewInbox: createReviewInbox(),
    })

    expect(gate.canBuild).toBe(false)
    expect(gate.status).toBe('blocked')
    expect(gate.reasons).toContainEqual(expect.objectContaining({ source: 'export-readiness', severity: 'blocker' }))
  })

  it('blocks the gate when review has open non-branch blockers', () => {
    const gate = buildBookExportArtifactGate({
      exportPreview: createExportPreview(),
      reviewInbox: createReviewInbox([createReviewIssue()]),
    })

    expect(gate.canBuild).toBe(false)
    expect(gate.openBlockerCount).toBe(1)
    expect(gate.reasons).toContainEqual(expect.objectContaining({ source: 'review-open-blocker', severity: 'blocker' }))
  })

  it('keeps artifact gate reason ids unique when export readiness issues also appear in review', () => {
    const gate = buildBookExportArtifactGate({
      exportPreview: createExportPreview({ readinessBlocker: true }),
      reviewInbox: createReviewInbox([
        createReviewIssue({
          id: 'export-blocker-1',
          source: 'export',
          sourceLabel: 'Export readiness',
          title: 'Draft coverage incomplete',
          detail: 'One scene is missing draft prose.',
        }),
      ]),
    })
    const reasonIds = gate.reasons.map((reason) => reason.id)

    expect(reasonIds).toEqual(['export-readiness:export-blocker-1', 'review-open-blocker:export-blocker-1'])
    expect(new Set(reasonIds).size).toBe(reasonIds.length)
  })

  it('does not block for reviewed dismissed or deferred blockers', () => {
    for (const status of ['reviewed', 'dismissed', 'deferred'] as const) {
      const gate = buildBookExportArtifactGate({
        exportPreview: createExportPreview(),
        reviewInbox: createReviewInbox([createReviewIssue({ decision: { status, isStale: false } })]),
      })

      expect(gate.canBuild).toBe(true)
      expect(gate.status).toBe('ready')
    }
  })

  it('does not let a checked fix action unblock an open blocker', () => {
    const gate = buildBookExportArtifactGate({
      exportPreview: createExportPreview(),
      reviewInbox: createReviewInbox([
        createReviewIssue({
          fixAction: {
            status: 'checked',
            isStale: false,
          },
        }),
      ]),
    })

    expect(gate.canBuild).toBe(false)
    expect(gate.openBlockerCount).toBe(1)
    expect(gate.checkedFixCount).toBe(1)
  })

  it('counts blocked fix actions as warning detail while blockers come from review or export gates', () => {
    const attentionGate = buildBookExportArtifactGate({
      exportPreview: createExportPreview(),
      reviewInbox: createReviewInbox([
        createReviewIssue({
          severity: 'warning',
          fixAction: {
            status: 'blocked',
            isStale: false,
          },
        }),
      ]),
    })
    const blockedGate = buildBookExportArtifactGate({
      exportPreview: createExportPreview(),
      reviewInbox: createReviewInbox([
        createReviewIssue({
          fixAction: {
            status: 'blocked',
            isStale: false,
          },
        }),
      ]),
    })

    expect(attentionGate.canBuild).toBe(true)
    expect(attentionGate.status).toBe('attention')
    expect(attentionGate.blockedFixCount).toBe(1)
    expect(blockedGate.canBuild).toBe(false)
    expect(blockedGate.openBlockerCount).toBe(1)
  })

  it('builds markdown content with book title profile chapter and scene prose', () => {
    const content = buildBookExportArtifactContent({
      exportPreview: createExportPreview(),
      reviewInbox: createReviewInbox(),
      format: 'markdown',
    })

    expect(content).toContain('# Signal Arc')
    expect(content).toContain('- Profile: Editorial Markdown')
    expect(content).toContain('### Chapter 1: Open Water Signals')
    expect(content).toContain('#### Scene 1: Warehouse Bridge')
    expect(content).toContain('Current warehouse bridge draft.')
  })

  it('excludes the trace appendix when the profile does not include it', () => {
    const content = buildBookExportArtifactContent({
      exportPreview: createExportPreview({ includeTraceAppendix: false }),
      reviewInbox: createReviewInbox(),
      format: 'markdown',
    })

    expect(content).not.toContain('Trace appendix')
  })

  it('prints a missing draft placeholder for missing scene prose', () => {
    const content = buildBookExportArtifactContent({
      exportPreview: createExportPreview({ sceneProse: undefined }),
      reviewInbox: createReviewInbox(),
      format: 'plain_text',
    })

    expect(content).toContain('[Missing draft]')
  })

  it('marks normalized artifacts stale when the source signature differs', () => {
    const currentSourceSignature = createBookExportArtifactSourceSignature(createExportPreview())
    const artifact = normalizeBookExportArtifactRecord(createArtifactRecord('old-source-signature'), currentSourceSignature)

    expect(artifact.isStale).toBe(true)
  })

  it('builds an artifact workspace with latest artifact and current gate', () => {
    const exportPreview = createExportPreview()
    const currentSourceSignature = createBookExportArtifactSourceSignature(exportPreview)
    const workspace = buildBookExportArtifactWorkspace({
      exportPreview,
      reviewInbox: createReviewInbox(),
      artifactRecords: [createArtifactRecord(currentSourceSignature)],
    })

    expect(workspace.latestArtifact?.filename).toBe('signal-arc-profile-editorial-md.md')
    expect(workspace.latestArtifact?.isStale).toBe(false)
    expect(workspace.gate.status).toBe('ready')
  })
})
