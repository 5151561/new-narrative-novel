import { describe, expect, it } from 'vitest'

import { mockBookRecordSeeds } from '../api/mock-book-db'
import { mockChapterRecordSeeds } from '@/features/chapter/api/mock-chapter-db'
import { buildBookDraftWorkspaceViewModel } from './book-draft-workspace-mappers'

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
})
