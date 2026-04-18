import { describe, expect, it } from 'vitest'

import type { BookManuscriptCheckpointRecord } from '../api/book-manuscript-checkpoints'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import {
  buildCurrentManuscriptSnapshotFromBookDraft,
  buildSceneDelta,
  compareBookManuscriptSnapshots,
  normalizeBookManuscriptCheckpoint,
} from './book-manuscript-compare-mappers'

const currentWorkspace: BookDraftWorkspaceViewModel = {
  bookId: 'book-signal-arc',
  title: 'Signal Arc',
  summary: 'Current manuscript workspace',
  selectedChapterId: 'chapter-open-water-signals',
  assembledWordCount: 1420,
  draftedChapterCount: 2,
  missingDraftChapterCount: 1,
  selectedChapter: null,
  inspector: {
    selectedChapter: null,
    readiness: {
      draftedChapterCount: 2,
      missingDraftChapterCount: 1,
      assembledWordCount: 1420,
      warningHeavyChapterCount: 2,
      missingTraceChapterCount: 1,
    },
    signals: {
      topMissingScenes: [],
      latestDiffSummaries: [],
      traceCoverageNote: 'Trace note',
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
      summary: 'Open water chapter',
      sceneCount: 3,
      draftedSceneCount: 3,
      missingDraftCount: 0,
      assembledWordCount: 640,
      warningsCount: 2,
      queuedRevisionCount: 1,
      tracedSceneCount: 2,
      missingTraceSceneCount: 1,
      assembledProseSections: [],
      coverageStatus: 'attention',
      sections: [
        {
          sceneId: 'scene-warehouse-bridge',
          order: 1,
          title: 'Warehouse Bridge',
          summary: 'Bridge summary',
          proseDraft: '  Current warehouse handoff draft that changed beats.  ',
          draftWordCount: 7,
          isMissingDraft: false,
          warningsCount: 1,
          revisionQueueCount: 0,
          traceReady: true,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
        },
        {
          sceneId: 'scene-canal-watch',
          order: 2,
          title: 'Canal Watch',
          summary: 'Canal summary',
          proseDraft: 'Current canal prose remains stable.',
          draftWordCount: 5,
          isMissingDraft: false,
          warningsCount: 0,
          revisionQueueCount: 0,
          traceReady: true,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
        },
        {
          sceneId: 'scene-dawn-slip',
          order: 3,
          title: 'Dawn Slip',
          summary: 'Dawn summary',
          proseDraft: 'Current dawn prose now exists.',
          draftWordCount: 5,
          isMissingDraft: false,
          warningsCount: 0,
          revisionQueueCount: 1,
          traceReady: false,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
        },
      ],
    },
    {
      chapterId: 'chapter-signals-in-rain',
      order: 2,
      title: 'Signals in Rain',
      summary: 'Signals chapter',
      sceneCount: 3,
      draftedSceneCount: 2,
      missingDraftCount: 1,
      assembledWordCount: 780,
      warningsCount: 3,
      queuedRevisionCount: 0,
      tracedSceneCount: 2,
      missingTraceSceneCount: 1,
      assembledProseSections: [],
      coverageStatus: 'attention',
      sections: [
        {
          sceneId: 'scene-midnight-platform',
          order: 1,
          title: 'Midnight Platform',
          summary: 'Platform summary',
          proseDraft: 'Midnight platform draft is unchanged between versions.',
          draftWordCount: 8,
          isMissingDraft: false,
          warningsCount: 0,
          revisionQueueCount: 0,
          traceReady: true,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
        },
        {
          sceneId: 'scene-ticket-window',
          order: 2,
          title: 'Ticket Window',
          summary: 'Ticket summary',
          proseDraft: 'Ticket window is newly added in the current draft.',
          draftWordCount: 9,
          isMissingDraft: false,
          warningsCount: 1,
          revisionQueueCount: 0,
          traceReady: true,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
        },
        {
          sceneId: 'scene-departure-bell',
          order: 3,
          title: 'Departure Bell',
          summary: 'Departure summary',
          proseDraft: '   ',
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

currentWorkspace.selectedChapter = currentWorkspace.chapters[0]!

const checkpointRecord: BookManuscriptCheckpointRecord = {
  checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
  bookId: 'book-signal-arc',
  title: {
    en: 'PR11 Baseline',
    'zh-CN': 'PR11 基线',
  },
  summary: {
    en: 'Baseline manuscript before compare/review landed.',
    'zh-CN': 'compare/review 落地前的基线稿。',
  },
  chapters: [
    {
      chapterId: 'chapter-open-water-signals',
      order: 1,
      title: {
        en: 'Open Water Signals',
        'zh-CN': '开阔水域信号',
      },
      summary: {
        en: 'Open water checkpoint chapter',
        'zh-CN': '开阔水域 checkpoint 章节',
      },
      scenes: [
        {
          sceneId: 'scene-warehouse-bridge',
          order: 1,
          title: {
            en: 'Warehouse Bridge',
            'zh-CN': '仓桥交接',
          },
          summary: {
            en: 'Checkpoint bridge summary',
            'zh-CN': 'checkpoint 仓桥摘要',
          },
          proseDraft: 'Warehouse checkpoint draft before the updated handoff beat.',
          draftWordCount: 8,
          warningsCount: 0,
          traceReady: false,
        },
        {
          sceneId: 'scene-canal-watch',
          order: 2,
          title: {
            en: 'Canal Watch',
            'zh-CN': '运河哨位',
          },
          summary: {
            en: 'Checkpoint canal summary',
            'zh-CN': 'checkpoint 运河摘要',
          },
          proseDraft: 'Current canal prose remains stable.',
          draftWordCount: 5,
          warningsCount: 0,
          traceReady: true,
        },
        {
          sceneId: 'scene-river-ledger',
          order: 3,
          title: {
            en: 'River Ledger',
            'zh-CN': '河道账本',
          },
          summary: {
            en: 'Checkpoint-only scene',
            'zh-CN': '仅存在于 checkpoint 的场景',
          },
          proseDraft: 'Legacy scene that no longer exists in the current draft.',
          draftWordCount: 10,
          warningsCount: 1,
          traceReady: true,
        },
      ],
    },
    {
      chapterId: 'chapter-signals-in-rain',
      order: 2,
      title: {
        en: 'Signals in Rain',
        'zh-CN': '雨中信号',
      },
      summary: {
        en: 'Signals checkpoint chapter',
        'zh-CN': '雨中信号 checkpoint 章节',
      },
      scenes: [
        {
          sceneId: 'scene-midnight-platform',
          order: 1,
          title: {
            en: 'Midnight Platform',
            'zh-CN': '午夜站台',
          },
          summary: {
            en: 'Checkpoint platform summary',
            'zh-CN': 'checkpoint 站台摘要',
          },
          proseDraft: 'Midnight platform draft is unchanged between versions.',
          draftWordCount: 8,
          warningsCount: 0,
          traceReady: true,
        },
        {
          sceneId: 'scene-departure-bell',
          order: 2,
          title: {
            en: 'Departure Bell',
            'zh-CN': '发车钟',
          },
          summary: {
            en: 'Checkpoint departure summary',
            'zh-CN': 'checkpoint 发车钟摘要',
          },
          proseDraft: 'Departure bell checkpoint prose exists.',
          draftWordCount: 5,
          warningsCount: 1,
          traceReady: false,
        },
      ],
    },
  ],
}

describe('book manuscript compare mappers', () => {
  it('builds a current manuscript snapshot from the book draft workspace', () => {
    const snapshot = buildCurrentManuscriptSnapshotFromBookDraft(currentWorkspace)

    expect(snapshot.bookId).toBe('book-signal-arc')
    expect(snapshot.selectedChapterId).toBe('chapter-open-water-signals')
    expect(snapshot.chapters.map((chapter) => chapter.chapterId)).toEqual([
      'chapter-open-water-signals',
      'chapter-signals-in-rain',
    ])
    expect(snapshot.chapters[0]?.scenes[0]).toMatchObject({
      sceneId: 'scene-warehouse-bridge',
      order: 1,
      proseDraft: '  Current warehouse handoff draft that changed beats.  ',
      draftWordCount: 7,
      warningsCount: 1,
      traceReady: true,
    })
  })

  it('normalizes a manuscript checkpoint record into localized compare-ready data', () => {
    const checkpoint = normalizeBookManuscriptCheckpoint(checkpointRecord, 'zh-CN')

    expect(checkpoint).toMatchObject({
      checkpointId: 'checkpoint-book-signal-arc-pr11-baseline',
      title: 'PR11 基线',
      summary: 'compare/review 落地前的基线稿。',
      chapters: [
        expect.objectContaining({
          chapterId: 'chapter-open-water-signals',
          title: '开阔水域信号',
        }),
        expect.objectContaining({
          chapterId: 'chapter-signals-in-rain',
          title: '雨中信号',
        }),
      ],
    })
    expect(checkpoint.chapters[0]?.scenes[0]).toMatchObject({
      sceneId: 'scene-warehouse-bridge',
      title: '仓桥交接',
      summary: 'checkpoint 仓桥摘要',
    })
  })

  it('classifies compare deltas, falls back the selected chapter, and aggregates totals', () => {
    const current = buildCurrentManuscriptSnapshotFromBookDraft(currentWorkspace)
    const checkpoint = normalizeBookManuscriptCheckpoint(checkpointRecord, 'en')

    const compare = compareBookManuscriptSnapshots({
      current,
      checkpoint,
      selectedChapterId: 'chapter-missing',
    })

    expect(compare.selectedChapterId).toBe('chapter-open-water-signals')
    expect(compare.selectedChapter?.chapterId).toBe('chapter-open-water-signals')
    expect(compare.totals).toEqual({
      chapterCount: 2,
      sceneCount: 7,
      missingCount: 1,
      addedCount: 2,
      draftMissingCount: 1,
      changedCount: 1,
      unchangedCount: 2,
      wordDelta: -2,
      traceRegressionCount: 1,
      warningsDelta: 2,
    })

    const openWaterScenes = compare.chapters[0]?.scenes.map((scene) => [scene.sceneId, scene.delta])
    expect(openWaterScenes).toEqual([
      ['scene-warehouse-bridge', 'changed'],
      ['scene-canal-watch', 'unchanged'],
      ['scene-dawn-slip', 'added'],
      ['scene-river-ledger', 'missing'],
    ])

    const signalsScenes = compare.chapters[1]?.scenes.map((scene) => [scene.sceneId, scene.delta])
    expect(signalsScenes).toEqual([
      ['scene-midnight-platform', 'unchanged'],
      ['scene-ticket-window', 'added'],
      ['scene-departure-bell', 'draft_missing'],
    ])

    expect(compare.chapters[0]?.scenes[0]).toMatchObject({
      sceneId: 'scene-warehouse-bridge',
      currentWordCount: 7,
      checkpointWordCount: 8,
      wordDelta: -1,
      traceReadyChanged: true,
      warningsDelta: 1,
    })
    expect(compare.chapters[0]?.scenes[3]).toMatchObject({
      sceneId: 'scene-river-ledger',
      wordDelta: -10,
      traceReadyChanged: false,
      warningsDelta: -1,
    })
    expect(compare.chapters[1]?.scenes[2]).toMatchObject({
      sceneId: 'scene-departure-bell',
      wordDelta: -5,
      warningsDelta: 1,
    })

    expect(compare.chapters[0]?.totals).toEqual({
      sceneCount: 4,
      missingCount: 1,
      addedCount: 1,
      draftMissingCount: 0,
      changedCount: 1,
      unchangedCount: 1,
      wordDelta: -6,
      traceRegressionCount: 1,
      warningsDelta: 0,
    })
    expect(compare.chapters[0]).toMatchObject({
      wordDelta: -6,
      traceRegressionCount: 1,
      warningsDelta: 0,
    })
    expect(compare.chapters[1]?.totals).toEqual({
      sceneCount: 3,
      missingCount: 0,
      addedCount: 1,
      draftMissingCount: 1,
      changedCount: 0,
      unchangedCount: 1,
      wordDelta: 4,
      traceRegressionCount: 0,
      warningsDelta: 2,
    })
    expect(compare.chapters[1]).toMatchObject({
      wordDelta: 4,
      traceRegressionCount: 0,
      warningsDelta: 2,
    })
  })

  it('treats same prose with trace changes as changed and preserves delta metadata', () => {
    const delta = buildSceneDelta({
      currentScene: {
        sceneId: 'scene-midnight-platform',
        order: 1,
        title: 'Midnight Platform',
        summary: 'Summary',
        proseDraft: 'Identical prose',
        draftWordCount: 2,
        warningsCount: 0,
        traceReady: false,
      },
      checkpointScene: {
        sceneId: 'scene-midnight-platform',
        order: 1,
        title: 'Midnight Platform',
        summary: 'Summary',
        proseDraft: 'Identical prose',
        draftWordCount: 2,
        warningsCount: 0,
        traceReady: true,
      },
    })

    expect(delta).toMatchObject({
      delta: 'changed',
      currentWordCount: 2,
      checkpointWordCount: 2,
      wordDelta: 0,
      traceReadyChanged: true,
      warningsDelta: 0,
    })
  })

  it('classifies a current-only empty draft scene as draft_missing instead of added', () => {
    const delta = buildSceneDelta({
      currentScene: {
        sceneId: 'scene-ticket-window',
        order: 2,
        title: 'Ticket Window',
        summary: 'Summary',
        proseDraft: '   ',
        warningsCount: 1,
        traceReady: false,
      },
    })

    expect(delta).toMatchObject({
      delta: 'draft_missing',
      currentWordCount: undefined,
      checkpointWordCount: undefined,
      wordDelta: 0,
      traceReadyChanged: false,
      warningsDelta: 1,
    })
  })

  it('builds scene delta excerpts by trimming text and capping length', () => {
    const delta = buildSceneDelta({
      currentScene: {
        sceneId: 'scene-midnight-platform',
        order: 1,
        title: 'Midnight Platform',
        summary: 'Summary',
        proseDraft: ` ${'a'.repeat(220)} `,
        draftWordCount: 220,
        warningsCount: 0,
        traceReady: true,
      },
      checkpointScene: {
        sceneId: 'scene-midnight-platform',
        order: 1,
        title: 'Midnight Platform',
        summary: 'Summary',
        proseDraft: 'Checkpoint prose',
        draftWordCount: 2,
        warningsCount: 0,
        traceReady: true,
      },
    })

    expect(delta.delta).toBe('changed')
    expect(delta.currentExcerpt).toHaveLength(180)
    expect(delta.checkpointExcerpt).toBe('Checkpoint prose')
  })
})
