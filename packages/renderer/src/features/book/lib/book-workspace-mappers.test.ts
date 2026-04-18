import { describe, expect, it } from 'vitest'

import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'

import type { BookStructureRecord } from '../api/book-records'
import { buildBookStructureWorkspaceViewModel } from './book-workspace-mappers'

function makeBookRecord(): BookStructureRecord {
  return {
    bookId: 'book-signal-arc',
    title: {
      en: 'Signal Arc',
      'zh-CN': '信号弧线',
    },
    summary: {
      en: 'Roll up chapter pressure into one book-level structure view.',
      'zh-CN': '把章节压力汇总成一本书级别的结构视图。',
    },
    chapterIds: ['chapter-open-water-signals', 'chapter-signals-in-rain'],
    viewsMeta: {
      availableViews: ['sequence', 'outliner', 'signals'],
    },
  }
}

describe('book workspace mappers', () => {
  it('preserves explicit book chapter order, aggregates totals, and falls back selectedChapterId to the first chapter', () => {
    const workspace = buildBookStructureWorkspaceViewModel({
      record: makeBookRecord(),
      locale: 'en',
      selectedChapterId: 'chapter-missing',
      chapterWorkspacesById: {
        'chapter-signals-in-rain': structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain']),
        'chapter-open-water-signals': structuredClone(mockChapterRecordSeeds['chapter-open-water-signals']),
      },
      sceneProseBySceneId: {
        'scene-warehouse-bridge': {
          sceneId: 'scene-warehouse-bridge',
          proseDraft: 'Warehouse Bridge draft',
          revisionModes: [],
          warningsCount: 1,
          focusModeAvailable: true,
          draftWordCount: 320,
        },
        'scene-canal-watch': {
          sceneId: 'scene-canal-watch',
          proseDraft: 'Canal Watch draft',
          revisionModes: [],
          warningsCount: 2,
          focusModeAvailable: true,
          draftWordCount: 210,
          revisionQueueCount: 1,
        },
        'scene-dawn-slip': {
          sceneId: 'scene-dawn-slip',
          proseDraft: 'Dawn Slip draft',
          revisionModes: [],
          warningsCount: 1,
          focusModeAvailable: true,
          draftWordCount: 262,
        },
        'scene-midnight-platform': {
          sceneId: 'scene-midnight-platform',
          proseDraft: 'Midnight Platform draft',
          revisionModes: [],
          warningsCount: 2,
          focusModeAvailable: true,
          draftWordCount: 401,
          revisionQueueCount: 1,
        },
        'scene-concourse-delay': {
          sceneId: 'scene-concourse-delay',
          proseDraft: 'Concourse Delay draft',
          revisionModes: [],
          warningsCount: 1,
          focusModeAvailable: true,
          draftWordCount: 310,
        },
        'scene-ticket-window': {
          sceneId: 'scene-ticket-window',
          proseDraft: 'Ticket Window draft',
          revisionModes: [],
          warningsCount: 1,
          focusModeAvailable: true,
          draftWordCount: 380,
        },
        'scene-departure-bell': {
          sceneId: 'scene-departure-bell',
          revisionModes: [],
          warningsCount: 2,
          focusModeAvailable: true,
        },
      },
      traceRollupsBySceneId: {
        'scene-warehouse-bridge': {
          sceneId: 'scene-warehouse-bridge',
          acceptedFactCount: 2,
          relatedAssetCount: 3,
          sourceProposalCount: 2,
          missingLinks: [],
        },
        'scene-canal-watch': {
          sceneId: 'scene-canal-watch',
          acceptedFactCount: 1,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
          missingLinks: ['related_assets'],
        },
        'scene-dawn-slip': {
          sceneId: 'scene-dawn-slip',
          acceptedFactCount: 0,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          missingLinks: ['trace'],
        },
        'scene-midnight-platform': {
          sceneId: 'scene-midnight-platform',
          acceptedFactCount: 3,
          relatedAssetCount: 4,
          sourceProposalCount: 3,
          missingLinks: [],
        },
        'scene-concourse-delay': {
          sceneId: 'scene-concourse-delay',
          acceptedFactCount: 1,
          relatedAssetCount: 2,
          sourceProposalCount: 1,
          missingLinks: ['draft'],
        },
        'scene-ticket-window': {
          sceneId: 'scene-ticket-window',
          acceptedFactCount: 1,
          relatedAssetCount: 2,
          sourceProposalCount: 2,
          missingLinks: [],
        },
      },
    })

    expect(workspace.chapters.map((chapter) => chapter.chapterId)).toEqual([
      'chapter-open-water-signals',
      'chapter-signals-in-rain',
    ])
    expect(workspace.selectedChapterId).toBe('chapter-open-water-signals')
    expect(workspace.selectedChapter?.chapterId).toBe('chapter-open-water-signals')
    expect(workspace.chapters[0]).toMatchObject({
      chapterId: 'chapter-open-water-signals',
      order: 1,
      sceneCount: 3,
      unresolvedCount: 4,
      draftedSceneCount: 3,
      missingDraftCount: 0,
      tracedSceneCount: 2,
      missingTraceSceneCount: 1,
      assembledWordCount: 792,
      warningsCount: 4,
      queuedRevisionCount: 1,
      primaryProblemLabel: 'Handoff bridge',
      primaryAssemblyHintLabel: 'Warehouse to canal carry-through',
      coverageStatus: 'attention',
    })
    expect(workspace.chapters[1]).toMatchObject({
      chapterId: 'chapter-signals-in-rain',
      order: 2,
      sceneCount: 4,
      unresolvedCount: 8,
      draftedSceneCount: 3,
      missingDraftCount: 1,
      tracedSceneCount: 3,
      missingTraceSceneCount: 1,
      assembledWordCount: 1091,
      warningsCount: 6,
      queuedRevisionCount: 1,
      primaryProblemLabel: 'Departure bell timing',
      primaryAssemblyHintLabel: 'Carry platform pressure',
      coverageStatus: 'attention',
    })
    expect(workspace.totals).toEqual({
      chapterCount: 2,
      sceneCount: 7,
      unresolvedCount: 12,
      draftedSceneCount: 6,
      missingDraftCount: 1,
      tracedSceneCount: 5,
      missingTraceSceneCount: 2,
      assembledWordCount: 1883,
      warningsCount: 10,
      queuedRevisionCount: 2,
    })
    expect(workspace.inspector.riskHighlights).toEqual([
      {
        chapterId: 'chapter-signals-in-rain',
        kind: 'problem',
        label: 'Departure bell timing',
        detail:
          'The exit bell still lands too early and drains confrontation pressure before the chapter closes.',
      },
      {
        chapterId: 'chapter-signals-in-rain',
        kind: 'missing_draft',
        label: '1 scene still missing draft',
        detail: 'Departure Bell has no prose draft yet.',
      },
      {
        chapterId: 'chapter-open-water-signals',
        kind: 'missing_trace',
        label: '1 scene still missing trace',
        detail: 'Dawn Slip has no trace rollup yet.',
      },
    ])
  })

  it('derives missing draft and missing trace summaries from plain inputs when chapter problems are absent', () => {
    const chapter = structuredClone(mockChapterRecordSeeds['chapter-open-water-signals'])
    chapter.inspector.problemsSummary = []
    chapter.inspector.assemblyHints = []

    const workspace = buildBookStructureWorkspaceViewModel({
      record: {
        ...makeBookRecord(),
        chapterIds: ['chapter-open-water-signals'],
      },
      locale: 'en',
      selectedChapterId: null,
      chapterWorkspacesById: {
        'chapter-open-water-signals': chapter,
      },
      sceneProseBySceneId: {
        'scene-warehouse-bridge': {
          sceneId: 'scene-warehouse-bridge',
          revisionModes: [],
          warningsCount: 0,
          focusModeAvailable: true,
          draftWordCount: 320,
        },
        'scene-canal-watch': {
          sceneId: 'scene-canal-watch',
          revisionModes: [],
          warningsCount: 1,
          focusModeAvailable: true,
        },
        'scene-dawn-slip': {
          sceneId: 'scene-dawn-slip',
          revisionModes: [],
          warningsCount: 0,
          focusModeAvailable: true,
          proseDraft: 'Ready draft',
          draftWordCount: 240,
        },
      },
      traceRollupsBySceneId: {
        'scene-warehouse-bridge': {
          sceneId: 'scene-warehouse-bridge',
          acceptedFactCount: 1,
          relatedAssetCount: 1,
          sourceProposalCount: 1,
          missingLinks: [],
        },
        'scene-canal-watch': {
          sceneId: 'scene-canal-watch',
          acceptedFactCount: 0,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          missingLinks: ['trace'],
        },
        'scene-dawn-slip': {
          sceneId: 'scene-dawn-slip',
          acceptedFactCount: 0,
          relatedAssetCount: 0,
          sourceProposalCount: 0,
          missingLinks: ['trace'],
        },
      },
    })

    expect(workspace.selectedChapterId).toBe('chapter-open-water-signals')
    expect(workspace.selectedChapter).toMatchObject({
      chapterId: 'chapter-open-water-signals',
      missingDraftCount: 1,
      missingTraceSceneCount: 2,
      primaryProblemLabel: undefined,
      primaryAssemblyHintLabel: undefined,
      coverageStatus: 'attention',
    })
    expect(workspace.inspector.riskHighlights).toEqual([
      {
        chapterId: 'chapter-open-water-signals',
        kind: 'missing_draft',
        label: '1 scene still missing draft',
        detail: 'Canal Watch has no prose draft yet.',
      },
      {
        chapterId: 'chapter-open-water-signals',
        kind: 'missing_trace',
        label: '2 scenes still missing trace',
        detail: 'Canal Watch and Dawn Slip have no trace rollup yet.',
      },
    ])
  })
})
