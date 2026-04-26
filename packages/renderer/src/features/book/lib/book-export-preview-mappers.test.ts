import { describe, expect, it } from 'vitest'

import type { BookManuscriptCompareWorkspaceViewModel } from '../types/book-compare-view-models'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import { mockBookExportProfileSeeds } from '../api/book-export-profiles'
import {
  buildBookExportPreviewWorkspace,
  normalizeBookExportProfile,
} from './book-export-preview-mappers'

function createDraftWorkspace(): BookDraftWorkspaceViewModel {
  const workspace: BookDraftWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Current export-ready workspace',
    selectedChapterId: 'chapter-does-not-exist',
    assembledWordCount: 1200,
    draftedChapterCount: 1,
    missingDraftChapterCount: 1,
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 1,
        missingDraftChapterCount: 1,
        assembledWordCount: 1200,
        warningHeavyChapterCount: 2,
        missingTraceChapterCount: 1,
      },
      signals: {
        topMissingScenes: ['Departure Bell'],
        latestDiffSummaries: ['Warehouse Bridge timing tightened'],
        traceCoverageNote: 'Trace coverage still incomplete.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 1,
      missingTraceChapterCount: 1,
      warningsChapterCount: 2,
      queuedRevisionChapterCount: 1,
      highestPressureChapters: [],
      missingDraftChapters: [],
      missingTraceChapters: [],
      warningsChapters: [],
      queuedRevisionChapters: [],
    },
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 1,
        title: 'Open Water Signals',
        summary: 'Open water summary',
        sceneCount: 2,
        draftedSceneCount: 2,
        missingDraftCount: 0,
        assembledWordCount: 640,
        warningsCount: 1,
        queuedRevisionCount: 1,
        tracedSceneCount: 2,
        missingTraceSceneCount: 0,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Bridge summary',
            proseDraft: 'Current warehouse bridge draft.',
            draftWordCount: 4,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 1,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-canal-watch',
            order: 2,
            title: 'Canal Watch',
            summary: 'Canal summary',
            proseDraft: 'Current canal watch draft.',
            draftWordCount: 4,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
        ],
      },
      {
        chapterId: 'chapter-signals-in-rain',
        order: 2,
        title: 'Signals in Rain',
        summary: 'Signals summary',
        sceneCount: 2,
        draftedSceneCount: 1,
        missingDraftCount: 1,
        assembledWordCount: 560,
        warningsCount: 2,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 1,
        assembledProseSections: [],
        coverageStatus: 'attention',
        sections: [
          {
            sceneId: 'scene-ticket-window',
            order: 1,
            title: 'Ticket Window',
            summary: 'Ticket summary',
            proseDraft: 'Current ticket window draft.',
            draftWordCount: 4,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-departure-bell',
            order: 2,
            title: 'Departure Bell',
            summary: 'Departure summary',
            proseDraft: undefined,
            isMissingDraft: true,
            warningsCount: 2,
            revisionQueueCount: 0,
            traceReady: false,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
          },
        ],
      },
    ],
  }

  workspace.selectedChapter = workspace.chapters[0]!

  return workspace
}

function createCompareWorkspace(): BookManuscriptCompareWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Compare workspace',
    checkpoint: {
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      bookId: 'book-signal-arc',
      title: 'PR11 Baseline',
      createdAtLabel: '2026-04-17 22:10',
      summary: 'Checkpoint summary',
    },
    selectedChapterId: 'chapter-signals-in-rain',
    selectedChapter: null,
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 1,
        title: 'Open Water Signals',
        summary: 'Open water summary',
        totals: {
          sceneCount: 3,
          missingCount: 1,
          addedCount: 0,
          draftMissingCount: 0,
          changedCount: 1,
          unchangedCount: 1,
          wordDelta: -2,
          traceRegressionCount: 0,
          warningsDelta: 1,
        },
        wordDelta: -2,
        traceRegressionCount: 0,
        warningsDelta: 1,
        scenes: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Bridge summary',
            delta: 'changed',
            currentScene: {
              sceneId: 'scene-warehouse-bridge',
              order: 1,
              title: 'Warehouse Bridge',
              summary: 'Bridge summary',
              proseDraft: 'Current warehouse bridge draft.',
              draftWordCount: 4,
              warningsCount: 1,
              traceReady: true,
            },
            checkpointScene: {
              sceneId: 'scene-warehouse-bridge',
              order: 1,
              title: 'Warehouse Bridge',
              summary: 'Bridge summary',
              proseDraft: 'Older bridge draft.',
              draftWordCount: 6,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 4,
            checkpointWordCount: 6,
            wordDelta: -2,
            traceReadyChanged: false,
            warningsDelta: 1,
            currentExcerpt: 'Current warehouse bridge draft.',
            checkpointExcerpt: 'Older bridge draft.',
          },
          {
            sceneId: 'scene-canal-watch',
            order: 2,
            title: 'Canal Watch',
            summary: 'Canal summary',
            delta: 'unchanged',
            currentScene: {
              sceneId: 'scene-canal-watch',
              order: 2,
              title: 'Canal Watch',
              summary: 'Canal summary',
              proseDraft: 'Current canal watch draft.',
              draftWordCount: 4,
              warningsCount: 0,
              traceReady: true,
            },
            checkpointScene: {
              sceneId: 'scene-canal-watch',
              order: 2,
              title: 'Canal Watch',
              summary: 'Canal summary',
              proseDraft: 'Current canal watch draft.',
              draftWordCount: 4,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 4,
            checkpointWordCount: 4,
            wordDelta: 0,
            traceReadyChanged: false,
            warningsDelta: 0,
            currentExcerpt: 'Current canal watch draft.',
            checkpointExcerpt: 'Current canal watch draft.',
          },
          {
            sceneId: 'scene-river-ledger',
            order: 3,
            title: 'River Ledger',
            summary: 'River summary',
            delta: 'missing',
            checkpointScene: {
              sceneId: 'scene-river-ledger',
              order: 3,
              title: 'River Ledger',
              summary: 'River summary',
              proseDraft: 'Legacy river ledger draft.',
              draftWordCount: 5,
              warningsCount: 0,
              traceReady: true,
            },
            checkpointWordCount: 5,
            currentWordCount: undefined,
            wordDelta: -5,
            traceReadyChanged: false,
            warningsDelta: 0,
            checkpointExcerpt: 'Legacy river ledger draft.',
          },
        ],
      },
      {
        chapterId: 'chapter-signals-in-rain',
        order: 2,
        title: 'Signals in Rain',
        summary: 'Signals summary',
        totals: {
          sceneCount: 2,
          missingCount: 0,
          addedCount: 1,
          draftMissingCount: 1,
          changedCount: 0,
          unchangedCount: 0,
          wordDelta: 4,
          traceRegressionCount: 1,
          warningsDelta: 2,
        },
        wordDelta: 4,
        traceRegressionCount: 1,
        warningsDelta: 2,
        scenes: [
          {
            sceneId: 'scene-ticket-window',
            order: 1,
            title: 'Ticket Window',
            summary: 'Ticket summary',
            delta: 'added',
            currentScene: {
              sceneId: 'scene-ticket-window',
              order: 1,
              title: 'Ticket Window',
              summary: 'Ticket summary',
              proseDraft: 'Current ticket window draft.',
              draftWordCount: 4,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: 4,
            checkpointWordCount: undefined,
            wordDelta: 4,
            traceReadyChanged: false,
            warningsDelta: 0,
            currentExcerpt: 'Current ticket window draft.',
          },
          {
            sceneId: 'scene-departure-bell',
            order: 2,
            title: 'Departure Bell',
            summary: 'Departure summary',
            delta: 'draft_missing',
            currentScene: {
              sceneId: 'scene-departure-bell',
              order: 2,
              title: 'Departure Bell',
              summary: 'Departure summary',
              warningsCount: 2,
              traceReady: false,
            },
            checkpointScene: {
              sceneId: 'scene-departure-bell',
              order: 2,
              title: 'Departure Bell',
              summary: 'Departure summary',
              proseDraft: 'Checkpoint departure bell draft.',
              draftWordCount: 6,
              warningsCount: 0,
              traceReady: true,
            },
            currentWordCount: undefined,
            checkpointWordCount: 6,
            wordDelta: -6,
            traceReadyChanged: true,
            warningsDelta: 2,
            checkpointExcerpt: 'Checkpoint departure bell draft.',
          },
        ],
      },
    ],
    totals: {
      chapterCount: 2,
      sceneCount: 5,
      missingCount: 1,
      addedCount: 1,
      draftMissingCount: 1,
      changedCount: 1,
      unchangedCount: 1,
      wordDelta: -3,
      traceRegressionCount: 1,
      warningsDelta: 3,
    },
  }
}

describe('book-export-preview-mappers', () => {
  it('normalizes localized export profiles', () => {
    const profile = normalizeBookExportProfile(mockBookExportProfileSeeds['book-signal-arc']![0]!, 'zh-CN')

    expect(profile).toMatchObject({
      exportProfileId: 'export-review-packet',
      kind: 'review_packet',
      title: '审阅包',
      summary: '用于编辑审阅的完整稿件包，附带 compare 与 trace 上下文。',
    })
  })

  it('builds export preview workspace with chapter/scene granularity and readiness issues from compare + draft state', () => {
    const workspace = createDraftWorkspace()
    const compareWorkspace = createCompareWorkspace()
    compareWorkspace.selectedChapter = compareWorkspace.chapters[1]!
    const profile = normalizeBookExportProfile(mockBookExportProfileSeeds['book-signal-arc']![0]!, 'en')

    const exportWorkspace = buildBookExportPreviewWorkspace({
      currentDraftWorkspace: workspace,
      compareWorkspace,
      profile,
    })

    expect(exportWorkspace.selectedChapterId).toBe('chapter-open-water-signals')
    expect(exportWorkspace.selectedChapter?.chapterId).toBe('chapter-open-water-signals')
    expect(exportWorkspace.chapters).toHaveLength(2)
    expect(exportWorkspace.chapters[0]?.scenes.map((scene) => scene.sceneId)).toEqual([
      'scene-warehouse-bridge',
      'scene-canal-watch',
    ])
    expect(exportWorkspace.packageSummary).toMatchObject({
      includedSections: [
        'Manuscript body',
        'Chapter summaries',
        'Scene headings',
        'Trace appendix',
        'Compare summary',
        'Readiness checklist',
      ],
      excludedSections: [],
      estimatedPackageLabel: expect.any(String),
    })
    expect(exportWorkspace.readiness).toMatchObject({
      blockerCount: 5,
      warningCount: 4,
      infoCount: 0,
      status: 'blocked',
    })
    expect(exportWorkspace.readiness.issues.map((issue) => issue.kind)).toContain('missing_draft')
    expect(exportWorkspace.readiness.issues.map((issue) => issue.kind)).toContain('trace_gap')
    expect(exportWorkspace.readiness.issues.map((issue) => issue.kind)).toContain('compare_regression')
  })

  it('degrades gracefully without compare workspace and keeps profile-only info rules', () => {
    const workspace = createDraftWorkspace()
    const profile = normalizeBookExportProfile(mockBookExportProfileSeeds['book-signal-arc']![2]!, 'en')

    const exportWorkspace = buildBookExportPreviewWorkspace({
      currentDraftWorkspace: workspace,
      compareWorkspace: undefined,
      profile,
    })

    expect(exportWorkspace.selectedChapterId).toBe('chapter-open-water-signals')
    expect(exportWorkspace.readiness).toMatchObject({
      blockerCount: 0,
      warningCount: 1,
      infoCount: 3,
      status: 'attention',
    })
    expect(exportWorkspace.readiness.issues.map((issue) => issue.kind)).toEqual([
      'queued_revision',
      'profile_rule',
      'profile_rule',
      'profile_rule',
    ])
    expect(exportWorkspace.packageSummary).toMatchObject({
      includedSections: ['Manuscript body', 'Chapter summaries', 'Readiness checklist'],
      excludedSections: ['Scene headings', 'Trace appendix', 'Compare summary'],
      estimatedPackageLabel: expect.any(String),
    })
  })

  it('keeps compare draft-missing as a blocker even when the profile allows missing current draft scenes', () => {
    const workspace = createDraftWorkspace()
    const compareWorkspace = createCompareWorkspace()
    compareWorkspace.selectedChapter = compareWorkspace.chapters[1]!
    const profile = normalizeBookExportProfile(mockBookExportProfileSeeds['book-signal-arc']![2]!, 'en')

    const exportWorkspace = buildBookExportPreviewWorkspace({
      currentDraftWorkspace: workspace,
      compareWorkspace,
      profile,
    })

    expect(profile.rules.requireAllScenesDrafted).toBe(false)
    expect(exportWorkspace.readiness.issues.map((issue) => issue.kind)).toContain('compare_regression')
    expect(exportWorkspace.readiness.blockerCount).toBe(1)
    expect(exportWorkspace.readiness.status).toBe('blocked')
  })

  it('keeps export readiness issue ids stable when chapter and scene display labels change', () => {
    const originalWorkspace = createDraftWorkspace()
    const originalCompareWorkspace = createCompareWorkspace()
    const profile = normalizeBookExportProfile(mockBookExportProfileSeeds['book-signal-arc']![0]!, 'en')

    const renamedWorkspace = createDraftWorkspace()
    renamedWorkspace.chapters[1] = {
      ...renamedWorkspace.chapters[1]!,
      title: 'Signals in Rain (Current Draft)',
      sections: renamedWorkspace.chapters[1]!.sections.map((section) =>
        section.sceneId === 'scene-departure-bell'
          ? {
              ...section,
              title: 'Bell Aftermath',
            }
          : section,
      ),
    }
    renamedWorkspace.selectedChapter = renamedWorkspace.chapters[0]!

    const renamedCompareWorkspace = createCompareWorkspace()
    renamedCompareWorkspace.chapters[1] = {
      ...renamedCompareWorkspace.chapters[1]!,
      title: 'Signals in Rain (Checkpoint)',
      scenes: renamedCompareWorkspace.chapters[1]!.scenes.map((scene) =>
        scene.sceneId === 'scene-departure-bell'
          ? {
              ...scene,
              title: 'Checkpoint Bell Aftermath',
            }
          : scene,
      ),
    }
    renamedCompareWorkspace.selectedChapter = renamedCompareWorkspace.chapters[0]!

    const originalExportWorkspace = buildBookExportPreviewWorkspace({
      currentDraftWorkspace: originalWorkspace,
      compareWorkspace: originalCompareWorkspace,
      profile,
    })
    const renamedExportWorkspace = buildBookExportPreviewWorkspace({
      currentDraftWorkspace: renamedWorkspace,
      compareWorkspace: renamedCompareWorkspace,
      profile,
    })

    expect(renamedExportWorkspace.readiness.issues.map((issue) => issue.id)).toEqual(
      originalExportWorkspace.readiness.issues.map((issue) => issue.id),
    )
    expect(renamedExportWorkspace.readiness.issues.map((issue) => issue.id)).toContain(
      'missing-draft-chapter-signals-in-rain-scene-departure-bell',
    )
    expect(renamedExportWorkspace.readiness.issues.map((issue) => issue.id)).toContain(
      'trace-gap-chapter-signals-in-rain-scene-departure-bell',
    )
    expect(renamedExportWorkspace.readiness.issues.map((issue) => issue.id)).toContain(
      'compare-draft-missing-chapter-signals-in-rain',
    )
    expect(renamedExportWorkspace.readiness.issues.map((issue) => issue.id)).toContain(
      'compare-missing-chapter-open-water-signals',
    )
  })

  it('localizes export readiness labels and issue copy for zh-CN', () => {
    const workspace = createDraftWorkspace()
    const compareWorkspace = createCompareWorkspace()
    compareWorkspace.selectedChapter = compareWorkspace.chapters[1]!
    const profile = normalizeBookExportProfile(mockBookExportProfileSeeds['book-signal-arc']![0]!, 'zh-CN')

    const exportWorkspace = buildBookExportPreviewWorkspace({
      currentDraftWorkspace: workspace,
      compareWorkspace,
      profile,
      locale: 'zh-CN',
    })

    expect(exportWorkspace.packageSummary.includedSections).toContain('正文主体')
    expect(exportWorkspace.packageSummary.includedSections).toContain('对比摘要')
    expect(exportWorkspace.readiness.label).toBe('当前导出预检存在阻塞项')
    expect(exportWorkspace.readiness.issues.some((issue) => issue.title.includes('缺稿'))).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.detail.includes('仍缺少当前正文草稿'))).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.title === '对比基线仍有缺稿场景')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.detail === 'Signals in Rain 相对所选检查点仍然存在缺稿的对比条目。')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.title === '仍有仅存在于检查点的场景')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.detail === 'Open Water Signals 仍有只存在于所选检查点的场景。')).toBe(true)
  })

  it('localizes remaining compare/profile readiness strings for zh-CN', () => {
    const workspace = createDraftWorkspace()
    const compareWorkspace = createCompareWorkspace()
    compareWorkspace.selectedChapter = compareWorkspace.chapters[0]!
    compareWorkspace.chapters[0] = {
      ...compareWorkspace.chapters[0]!,
      totals: {
        ...compareWorkspace.chapters[0]!.totals,
        traceRegressionCount: 1,
      },
      traceRegressionCount: 1,
    }
    const submissionProfile = normalizeBookExportProfile(mockBookExportProfileSeeds['book-signal-arc']![1]!, 'zh-CN')

    const exportWorkspace = buildBookExportPreviewWorkspace({
      currentDraftWorkspace: workspace,
      compareWorkspace,
      profile: submissionProfile,
      locale: 'zh-CN',
    })

    expect(exportWorkspace.packageSummary.excludedSections).toContain('对比摘要')
    expect(exportWorkspace.readiness.issues.some((issue) => issue.title === '对比基线中的溯源回退阻塞导出准备度')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.detail === 'Open Water Signals 相对所选检查点仍然存在溯源回退。')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.title === '未包含对比摘要')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.detail === '当前导出配置不包含对比摘要。')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.title === '变更场景仍需复核')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.detail === 'Open Water Signals 相对所选检查点仍有场景变更。')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.title === '新增场景需要确认')).toBe(true)
    expect(exportWorkspace.readiness.issues.some((issue) => issue.detail === 'Signals in Rain 仍有在所选检查点之后新增的场景。')).toBe(true)
  })
})
