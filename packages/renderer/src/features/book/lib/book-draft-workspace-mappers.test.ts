import { describe, expect, it } from 'vitest'

import type { BookDraftAssemblyRecord } from '../api/book-draft-assembly-records'
import { mockBookRecordSeeds } from '../api/mock-book-db'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import {
  buildBookDraftWorkspaceViewModel,
  buildBookDraftWorkspaceViewModelFromAssemblyRecord,
} from './book-draft-workspace-mappers'

function createDraftAssemblyRecord(): BookDraftAssemblyRecord {
  return {
    bookId: 'book-signal-arc',
    title: { en: 'Signal Arc', 'zh-CN': '信号弧' },
    summary: { en: 'Current live manuscript assembly', 'zh-CN': '当前实时正文装配' },
    chapterCount: 2,
    sceneCount: 3,
    draftedSceneCount: 2,
    missingDraftSceneCount: 1,
    assembledWordCount: 19,
    chapters: [
      {
        chapterId: 'chapter-signals-in-rain',
        order: 1,
        title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
        summary: { en: 'First chapter', 'zh-CN': '第一章' },
        sceneCount: 2,
        draftedSceneCount: 1,
        missingDraftCount: 1,
        assembledWordCount: 9,
        warningsCount: 1,
        queuedRevisionCount: 1,
        tracedSceneCount: 1,
        missingTraceSceneCount: 1,
        scenes: [
          {
            kind: 'draft',
            sceneId: 'scene-midnight-platform',
            order: 1,
            title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
            summary: { en: 'Accepted prose', 'zh-CN': '已采纳正文' },
            proseStatusLabel: { en: 'Ready', 'zh-CN': '已就绪' },
            proseDraft: 'Accepted platform prose now reflects the selected review variant.',
            latestDiffSummary: 'Accepted review decision propagated the selected platform variant.',
            warningsCount: 0,
            revisionQueueCount: 0,
            draftWordCount: 9,
            traceReady: true,
            traceRollup: {
              acceptedFactCount: 3,
              relatedAssetCount: 1,
              sourceProposalCount: 1,
              missingLinks: [],
            },
            sourcePatchId: 'patch-1',
            sourceProposals: [],
            acceptedFactIds: ['fact-1'],
            relatedAssets: [],
          },
          {
            kind: 'gap',
            sceneId: 'scene-departure-bell',
            order: 2,
            title: { en: 'Departure Bell', 'zh-CN': '离站钟声' },
            summary: { en: 'Gap scene', 'zh-CN': '缺稿场景' },
            proseStatusLabel: { en: 'Waiting for prose artifact', 'zh-CN': '等待正文产物' },
            latestDiffSummary: 'This should not override the explicit gap reason.',
            warningsCount: 1,
            revisionQueueCount: 1,
            traceReady: false,
            traceRollup: {
              acceptedFactCount: 0,
              relatedAssetCount: 0,
              sourceProposalCount: 0,
              missingLinks: ['trace'],
            },
            gapReason: {
              en: 'No prose artifact has been materialized for this scene yet.',
              'zh-CN': '该场景的正文产物尚未生成。',
            },
          },
        ],
      },
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: { en: 'Open Water Signals', 'zh-CN': '开阔水域信号' },
        summary: { en: 'Second chapter', 'zh-CN': '第二章' },
        sceneCount: 1,
        draftedSceneCount: 1,
        missingDraftCount: 0,
        assembledWordCount: 10,
        warningsCount: 0,
        queuedRevisionCount: 0,
        tracedSceneCount: 1,
        missingTraceSceneCount: 0,
        scenes: [
          {
            kind: 'draft',
            sceneId: 'scene-dawn-slip',
            order: 1,
            title: { en: 'Dawn Slip', 'zh-CN': '黎明滑道' },
            summary: { en: 'Current prose', 'zh-CN': '当前正文' },
            proseStatusLabel: { en: 'Ready', 'zh-CN': '已就绪' },
            proseDraft: 'Dawn slip prose now lands the revised harbor exit beat.',
            latestDiffSummary: 'Revised harbor exit beat is now part of the manuscript.',
            warningsCount: 0,
            revisionQueueCount: 0,
            draftWordCount: 10,
            traceReady: true,
            traceRollup: {
              acceptedFactCount: 2,
              relatedAssetCount: 1,
              sourceProposalCount: 1,
              missingLinks: [],
            },
            sourceProposals: [],
            acceptedFactIds: ['fact-2'],
            relatedAssets: [],
          },
        ],
      },
    ],
  }
}

describe('buildBookDraftWorkspaceViewModel', () => {
  it('treats draftWordCount without prose text as missing draft and excludes it from drafted counts', () => {
    const workspace = buildBookDraftWorkspaceViewModel({
      record: structuredClone(mockBookRecordSeeds['book-signal-arc']),
      locale: 'en',
      selectedChapterId: 'chapter-signals-in-rain',
      chapterWorkspacesById: {
        'chapter-signals-in-rain': structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain']),
        'chapter-open-water-signals': structuredClone(mockChapterRecordSeeds['chapter-open-water-signals']),
      },
      sceneProseBySceneId: {
        'scene-midnight-platform': {
          sceneId: 'scene-midnight-platform',
          proseDraft: '',
          draftWordCount: 42,
          revisionModes: ['rewrite'],
          latestDiffSummary: 'Word count exists but prose text is empty.',
          warningsCount: 0,
          focusModeAvailable: true,
          revisionQueueCount: 0,
          statusLabel: 'Ready',
        },
      },
      sceneProseStateBySceneId: {
        'scene-midnight-platform': {
          error: null,
        },
      },
      traceRollupsBySceneId: {},
    })

    const chapter = workspace.chapters.find((item) => item.chapterId === 'chapter-signals-in-rain')
    const section = chapter?.sections.find((item) => item.sceneId === 'scene-midnight-platform')

    expect(section).toMatchObject({
      sceneId: 'scene-midnight-platform',
      draftWordCount: 42,
      isMissingDraft: true,
    })
    expect(chapter).toMatchObject({
      draftedSceneCount: 3,
      missingDraftCount: 1,
    })
  })

  it('assembles accepted and revised scene prose into stable chapter sections while leaving missing prose as explicit gaps', () => {
    const workspace = buildBookDraftWorkspaceViewModel({
      record: structuredClone(mockBookRecordSeeds['book-signal-arc']),
      locale: 'en',
      selectedChapterId: 'chapter-signals-in-rain',
      chapterWorkspacesById: {
        'chapter-signals-in-rain': structuredClone(mockChapterRecordSeeds['chapter-signals-in-rain']),
        'chapter-open-water-signals': structuredClone(mockChapterRecordSeeds['chapter-open-water-signals']),
      },
      sceneProseBySceneId: {
        'scene-midnight-platform': {
          sceneId: 'scene-midnight-platform',
          proseDraft: 'Accepted platform prose now reflects the selected review variant.',
          draftWordCount: 9,
          revisionModes: ['rewrite'],
          latestDiffSummary: 'Accepted review decision propagated the selected platform variant.',
          warningsCount: 0,
          focusModeAvailable: true,
          revisionQueueCount: 0,
          statusLabel: 'Accepted variant propagated',
        },
        'scene-concourse-delay': {
          sceneId: 'scene-concourse-delay',
          proseDraft: 'Edited concourse prose keeps the witness pressure visible after acceptance.',
          draftWordCount: 10,
          revisionModes: ['rewrite'],
          latestDiffSummary: 'Accept-with-edit preserved the revised witness handoff wording.',
          warningsCount: 1,
          focusModeAvailable: true,
          revisionQueueCount: 0,
          statusLabel: 'Accepted with edit',
        },
        'scene-ticket-window': {
          sceneId: 'scene-ticket-window',
          proseDraft: 'Ticket-window prose now carries the revised courier reveal.',
          draftWordCount: 8,
          revisionModes: ['rewrite'],
          latestDiffSummary: 'Current prose now includes the revised courier reveal.',
          warningsCount: 0,
          focusModeAvailable: true,
          revisionQueueCount: 0,
          statusLabel: 'Ready',
        },
        'scene-departure-bell': {
          sceneId: 'scene-departure-bell',
          revisionModes: ['rewrite'],
          latestDiffSummary: 'No prose artifact has been materialized for this scene yet.',
          warningsCount: 0,
          focusModeAvailable: true,
          revisionQueueCount: 1,
          statusLabel: 'Waiting for prose artifact',
        },
      },
      sceneProseStateBySceneId: {
        'scene-midnight-platform': { error: null },
        'scene-concourse-delay': { error: null },
        'scene-ticket-window': { error: null },
        'scene-departure-bell': { error: null },
      },
      traceRollupsBySceneId: {},
    })

    const chapter = workspace.chapters.find((item) => item.chapterId === 'chapter-signals-in-rain')

    expect(chapter?.sections.map((section) => section.sceneId)).toEqual([
      'scene-midnight-platform',
      'scene-concourse-delay',
      'scene-ticket-window',
      'scene-departure-bell',
    ])
    expect(chapter?.sections[0]).toMatchObject({
      sceneId: 'scene-midnight-platform',
      proseDraft: 'Accepted platform prose now reflects the selected review variant.',
      isMissingDraft: false,
    })
    expect(chapter?.sections[1]).toMatchObject({
      sceneId: 'scene-concourse-delay',
      proseDraft: 'Edited concourse prose keeps the witness pressure visible after acceptance.',
      isMissingDraft: false,
    })
    expect(chapter?.sections[3]).toMatchObject({
      sceneId: 'scene-departure-bell',
      proseDraft: undefined,
      isMissingDraft: true,
      latestDiffSummary: 'No prose artifact has been materialized for this scene yet.',
    })
    expect(chapter).toMatchObject({
      sceneCount: 4,
      draftedSceneCount: 3,
      missingDraftCount: 1,
      assembledWordCount: 27,
    })
    expect(workspace).toMatchObject({
      selectedChapterId: 'chapter-signals-in-rain',
      draftedChapterCount: 2,
      missingDraftChapterCount: 1,
    })
  })

  it('maps a live draft assembly record into the existing book draft workspace shape while keeping gaps explicit', () => {
    const workspace = buildBookDraftWorkspaceViewModelFromAssemblyRecord({
      record: createDraftAssemblyRecord(),
      locale: 'en',
      selectedChapterId: 'chapter-open-water-signals',
    })

    expect(workspace).toMatchObject({
      bookId: 'book-signal-arc',
      selectedChapterId: 'chapter-open-water-signals',
      selectedChapter: {
        chapterId: 'chapter-open-water-signals',
        assembledProseSections: ['Dawn slip prose now lands the revised harbor exit beat.'],
      },
      draftedChapterCount: 2,
      missingDraftChapterCount: 1,
      assembledWordCount: 19,
      inspector: {
        selectedChapter: {
          chapterId: 'chapter-open-water-signals',
        },
      },
    })
    expect(workspace.chapters.map((chapter) => chapter.chapterId)).toEqual([
      'chapter-signals-in-rain',
      'chapter-open-water-signals',
    ])
    expect(workspace.chapters[0]?.sections[0]).toMatchObject({
      sceneId: 'scene-midnight-platform',
      proseDraft: 'Accepted platform prose now reflects the selected review variant.',
      isMissingDraft: false,
      traceReady: true,
    })
    expect(workspace.chapters[0]?.sections[1]).toMatchObject({
      sceneId: 'scene-departure-bell',
      proseDraft: undefined,
      draftWordCount: undefined,
      isMissingDraft: true,
      latestDiffSummary: 'No prose artifact has been materialized for this scene yet.',
      traceReady: false,
    })
    expect(workspace.chapters[0]?.assembledProseSections).toEqual([
      'Accepted platform prose now reflects the selected review variant.',
    ])
  })
})
