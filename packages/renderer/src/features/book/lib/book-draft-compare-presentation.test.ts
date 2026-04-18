import { describe, expect, it } from 'vitest'

import { normalizeBookManuscriptCheckpoint } from './book-manuscript-compare-mappers'
import { buildBookDraftCompareProblems, buildCompareReviewAttention, getCompareChapterStatus } from './book-draft-compare-presentation'
import { mockBookManuscriptCheckpointSeeds } from '../api/book-manuscript-checkpoints'
import { compareBookManuscriptSnapshots, buildCurrentManuscriptSnapshotFromBookDraft } from './book-manuscript-compare-mappers'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'

function buildWorkspace(): BookDraftWorkspaceViewModel {
  return {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Current draft workspace',
    selectedChapterId: 'chapter-open-water-signals',
    assembledWordCount: 44,
    draftedChapterCount: 2,
    missingDraftChapterCount: 1,
    chapters: [
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Carry the courier handoff into open water.',
        sceneCount: 2,
        draftedSceneCount: 1,
        missingDraftCount: 1,
        assembledWordCount: 24,
        warningsCount: 2,
        queuedRevisionCount: 1,
        tracedSceneCount: 0,
        missingTraceSceneCount: 2,
        coverageStatus: 'attention',
        assembledProseSections: ['Warehouse pressure stayed visible while the courier handoff slipped toward open water.'],
        sections: [
          {
            sceneId: 'scene-warehouse-bridge',
            order: 1,
            title: 'Warehouse Bridge',
            summary: 'Keep the handoff unstable.',
            proseDraft: 'Warehouse pressure stayed visible while the courier handoff slipped toward open water.',
            draftWordCount: 13,
            isMissingDraft: false,
            warningsCount: 2,
            revisionQueueCount: 1,
            traceReady: false,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-canal-watch',
            order: 2,
            title: 'Canal Watch',
            summary: 'Keep the exit exposed.',
            isMissingDraft: true,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: false,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
          },
        ],
      },
    ],
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 2,
        missingDraftChapterCount: 1,
        assembledWordCount: 44,
        warningHeavyChapterCount: 1,
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
      warningsChapterCount: 1,
      queuedRevisionChapterCount: 1,
      highestPressureChapters: [],
      missingDraftChapters: [],
      missingTraceChapters: [],
      warningsChapters: [],
      queuedRevisionChapters: [],
    },
  }
}

describe('book draft compare presentation', () => {
  it('builds localized compare dock details and shared chapter/attention semantics', () => {
    const workspace = buildWorkspace()
    const checkpoint = normalizeBookManuscriptCheckpoint(mockBookManuscriptCheckpointSeeds['book-signal-arc'][0]!, 'zh-CN')
    const compare = compareBookManuscriptSnapshots({
      current: buildCurrentManuscriptSnapshotFromBookDraft(workspace),
      checkpoint,
      selectedChapterId: 'chapter-open-water-signals',
    })

    const problems = buildBookDraftCompareProblems(compare, 'zh-CN')
    const attention = buildCompareReviewAttention(compare.selectedChapter)

    expect(getCompareChapterStatus(compare.selectedChapter!)).toBe('attention')
    expect(attention.topChangedScenes.length).toBeGreaterThan(0)
    expect(problems?.changedChapters[0]?.detail).toContain('变更')
    expect(problems?.warningsIncreasedChapters[0]?.detail).toContain('警告')
  })
})
