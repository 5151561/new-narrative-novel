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
})
