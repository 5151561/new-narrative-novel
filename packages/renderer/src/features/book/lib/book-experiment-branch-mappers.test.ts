import { describe, expect, it } from 'vitest'

import { mockBookExperimentBranchSeeds } from '../api/book-experiment-branches'
import { mockBookManuscriptCheckpointSeeds } from '../api/book-manuscript-checkpoints'
import type { BookDraftWorkspaceViewModel } from '../types/book-draft-view-models'
import {
  buildBookExperimentBranchWorkspace,
  buildBranchBaselineSnapshot,
  compareBookExperimentBranchToBaseline,
  deriveBookExperimentBranchReadiness,
  normalizeBookExperimentBranch,
  normalizeBookExperimentBranchSnapshot,
} from './book-experiment-branch-mappers'

function createCurrentDraftWorkspace(): BookDraftWorkspaceViewModel {
  const workspace: BookDraftWorkspaceViewModel = {
    bookId: 'book-signal-arc',
    title: 'Signal Arc',
    summary: 'Current draft workspace',
    selectedChapterId: 'chapter-open-water-signals',
    assembledWordCount: 116,
    draftedChapterCount: 2,
    missingDraftChapterCount: 0,
    selectedChapter: null,
    inspector: {
      selectedChapter: null,
      readiness: {
        draftedChapterCount: 2,
        missingDraftChapterCount: 0,
        assembledWordCount: 116,
        warningHeavyChapterCount: 2,
        missingTraceChapterCount: 1,
      },
      signals: {
        topMissingScenes: [],
        latestDiffSummaries: ['Warehouse handoff tightened'],
        traceCoverageNote: 'Current trace coverage is uneven in the handoff chapter.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: 0,
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
        chapterId: 'chapter-signals-in-rain',
        order: 1,
        title: 'Signals in Rain',
        summary: 'Station pressure chapter',
        sceneCount: 3,
        draftedSceneCount: 3,
        missingDraftCount: 0,
        assembledWordCount: 61,
        warningsCount: 1,
        queuedRevisionCount: 0,
        tracedSceneCount: 3,
        missingTraceSceneCount: 0,
        assembledProseSections: [],
        coverageStatus: 'ready',
        sections: [
          {
            sceneId: 'scene-midnight-platform',
            order: 1,
            title: 'Midnight Platform',
            summary: 'Public bargaining at the platform edge.',
            proseDraft: 'Ren keeps the ledger in sight while Mei bargains in the rain and counts who is listening.',
            draftWordCount: 16,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 2,
            sourceProposalCount: 2,
          },
          {
            sceneId: 'scene-concourse-delay',
            order: 2,
            title: 'Concourse Delay',
            summary: 'Crowd pressure delays the exit.',
            proseDraft: 'The crowd slows the courier lane long enough for Mei to hide one last instruction inside the delay.',
            draftWordCount: 17,
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
            summary: 'The bell lands as a drafted exit beat.',
            proseDraft: 'The departure bell closes the platform scene with a clear drafted release instead of a placeholder.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 0,
            traceReady: true,
            relatedAssetCount: 0,
            sourceProposalCount: 1,
          },
        ],
      },
      {
        chapterId: 'chapter-open-water-signals',
        order: 2,
        title: 'Open Water Signals',
        summary: 'Waterfront handoff chapter',
        sceneCount: 3,
        draftedSceneCount: 3,
        missingDraftCount: 0,
        assembledWordCount: 55,
        warningsCount: 1,
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
            summary: 'The first handoff happens at the warehouse bridge.',
            proseDraft: 'Leya keeps the package moving and leaves the bridge before the owner can force a full confession.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 1,
            revisionQueueCount: 1,
            traceReady: false,
            relatedAssetCount: 1,
            sourceProposalCount: 1,
          },
          {
            sceneId: 'scene-canal-watch',
            order: 2,
            title: 'Canal Watch',
            summary: 'The watcher keeps the exchange visible.',
            proseDraft: 'The canal watcher tracks the package handoff and keeps the escape route exposed to everyone on the bridge.',
            draftWordCount: 17,
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
            summary: 'A quiet withdrawal before sunrise.',
            proseDraft: 'At dawn the crew clears the channel and hides the package trail before the harbor shifts awake.',
            draftWordCount: 15,
            isMissingDraft: false,
            warningsCount: 0,
            revisionQueueCount: 0,
            traceReady: false,
            relatedAssetCount: 0,
            sourceProposalCount: 0,
          },
        ],
      },
    ],
  }

  workspace.selectedChapter = workspace.chapters[1]!

  return workspace
}

describe('book-experiment-branch-mappers', () => {
  it('normalizes branch summaries and localized snapshots', () => {
    const quietBranch = mockBookExperimentBranchSeeds['book-signal-arc']![0]!

    const summary = normalizeBookExperimentBranch(quietBranch, 'zh-CN')
    const snapshot = normalizeBookExperimentBranchSnapshot(quietBranch, 'zh-CN')

    expect(summary).toMatchObject({
      branchId: 'branch-book-signal-arc-quiet-ending',
      status: 'review',
      title: '静默收束稿',
    })
    expect(summary.rationale).toContain('低冲突')
    expect(snapshot.chapters[0]?.scenes[0]).toMatchObject({
      sceneId: 'scene-midnight-platform',
      title: '午夜站台',
      sourceProposalCount: 2,
    })
    expect(snapshot.chapters[0]?.scenes[0]?.proseDraft).toContain('收得更轻')
  })

  it('compares the quiet branch to the current baseline and stays ready while preserving selected chapter fallback', () => {
    const workspace = createCurrentDraftWorkspace()
    const quietBranch = normalizeBookExperimentBranchSnapshot(mockBookExperimentBranchSeeds['book-signal-arc']![0]!, 'en')
    const baseline = buildBranchBaselineSnapshot({
      currentDraftWorkspace: workspace,
      checkpoint: null,
      baseline: 'current',
      locale: 'en',
    })

    const compare = compareBookExperimentBranchToBaseline({
      branchSnapshot: quietBranch,
      baselineSnapshot: baseline,
      selectedChapterId: 'chapter-missing',
    })

    expect(compare.selectedChapterId).toBe('chapter-signals-in-rain')
    expect(compare.selectedChapter?.readinessStatus).toBe('ready')
    expect(compare.totals).toMatchObject({
      changedSceneCount: 3,
      missingSceneCount: 1,
      addedSceneCount: 0,
      draftMissingSceneCount: 0,
      traceImprovementCount: 1,
      traceRegressionCount: 0,
      blockedChapterCount: 0,
      attentionChapterCount: 0,
    })
    expect(compare.readiness.status).toBe('ready')
    expect(compare.chapters[1]?.sceneDeltas.find((scene) => scene.sceneId === 'scene-canal-watch')?.delta).toBe('missing')
  })

  it('builds a checkpoint-based workspace and flags attention for added scenes without source proposals', () => {
    const workspace = createCurrentDraftWorkspace()
    const quietBranchRecord = mockBookExperimentBranchSeeds['book-signal-arc']![0]!
    const quietBranch = normalizeBookExperimentBranch(quietBranchRecord, 'en')
    const branches = mockBookExperimentBranchSeeds['book-signal-arc']!.map((record) =>
      normalizeBookExperimentBranch(record, 'en'),
    )
    const checkpoint = mockBookManuscriptCheckpointSeeds['book-signal-arc']![0]!

    const branchWorkspace = buildBookExperimentBranchWorkspace({
      currentDraftWorkspace: workspace,
      branch: quietBranchRecord,
      branches: mockBookExperimentBranchSeeds['book-signal-arc']!,
      checkpoint,
      branchBaseline: 'checkpoint',
      selectedChapterId: 'chapter-unknown',
      locale: 'en',
    })

    expect(branchWorkspace.branch).toEqual(quietBranch)
    expect(branchWorkspace.branches).toEqual(branches)
    expect(branchWorkspace.baseline).toMatchObject({
      kind: 'checkpoint',
      checkpointId: checkpoint.checkpointId,
    })
    expect(branchWorkspace.selectedChapterId).toBe('chapter-signals-in-rain')
    expect(branchWorkspace.totals.addedSceneCount).toBe(1)
    expect(branchWorkspace.readiness.status).toBe('attention')
    expect(branchWorkspace.readiness.issues.some((issue) => issue.sceneId === 'scene-dawn-slip')).toBe(true)
  })

  it('blocks the high-pressure branch and aggregates draft-missing, trace regression, warning growth, and added scenes', () => {
    const workspace = createCurrentDraftWorkspace()
    const highPressureBranch = normalizeBookExperimentBranchSnapshot(
      mockBookExperimentBranchSeeds['book-signal-arc']![1]!,
      'en',
    )
    const baseline = buildBranchBaselineSnapshot({
      currentDraftWorkspace: workspace,
      checkpoint: mockBookManuscriptCheckpointSeeds['book-signal-arc']![0]!,
      baseline: 'current',
      locale: 'en',
    })

    const compare = compareBookExperimentBranchToBaseline({
      branchSnapshot: highPressureBranch,
      baselineSnapshot: baseline,
      selectedChapterId: 'chapter-open-water-signals',
    })
    const readiness = deriveBookExperimentBranchReadiness({
      chapters: compare.chapters,
      branch: normalizeBookExperimentBranch(mockBookExperimentBranchSeeds['book-signal-arc']![1]!, 'en'),
      baseline: compare.baseline,
      locale: 'en',
    })

    expect(compare.selectedChapterId).toBe('chapter-open-water-signals')
    expect(compare.totals).toMatchObject({
      changedSceneCount: 3,
      addedSceneCount: 1,
      missingSceneCount: 1,
      draftMissingSceneCount: 1,
      traceRegressionCount: 1,
      warningsDelta: 5,
      blockedChapterCount: 1,
      attentionChapterCount: 1,
    })
    expect(compare.chapters[0]?.sceneDeltas.find((scene) => scene.sceneId === 'scene-departure-bell')?.delta).toBe('draft_missing')
    expect(compare.chapters[1]?.sceneDeltas.find((scene) => scene.sceneId === 'scene-pressure-slip')?.delta).toBe('added')
    expect(readiness.status).toBe('blocked')
    expect(readiness.issues.some((issue) => issue.severity === 'blocker' && issue.sceneId === 'scene-departure-bell')).toBe(true)
  })

  it('does not mark checkpoint-baseline scenes as changed when only source proposal metadata is unavailable', () => {
    const workspace = createCurrentDraftWorkspace()
    const checkpoint = mockBookManuscriptCheckpointSeeds['book-signal-arc']![0]!
    const matchingBranchRecord = {
      branchId: 'branch-book-signal-arc-checkpoint-match',
      bookId: checkpoint.bookId,
      title: {
        en: 'Checkpoint Match',
        'zh-CN': '检查点对齐稿',
      },
      summary: {
        en: 'Matches checkpoint prose and signals while branch metadata still carries source proposals.',
        'zh-CN': '正文与信号和检查点一致，但分支元数据仍保留来源提案数。',
      },
      rationale: {
        en: 'Prove that unavailable checkpoint proposal counts do not create false deltas.',
        'zh-CN': '证明检查点缺少来源提案计数时不会制造伪差异。',
      },
      createdAtLabel: {
        en: 'Created for checkpoint parity',
        'zh-CN': '为检查点对齐创建',
      },
      basedOnCheckpointId: checkpoint.checkpointId,
      status: 'review' as const,
      chapterSnapshots: checkpoint.chapters.map((chapter) => ({
        chapterId: chapter.chapterId,
        title: chapter.title,
        summary: chapter.summary,
        sceneSnapshots: chapter.scenes.map((scene) => ({
          sceneId: scene.sceneId,
          title: scene.title,
          summary: scene.summary,
          proseDraft: scene.proseDraft
            ? {
                en: scene.proseDraft,
                'zh-CN': scene.proseDraft,
              }
            : undefined,
          draftWordCount: scene.draftWordCount,
          traceReady: scene.traceReady,
          warningsCount: scene.warningsCount,
          sourceProposalCount: 3,
        })),
      })),
    }

    const branchSnapshot = normalizeBookExperimentBranchSnapshot(matchingBranchRecord, 'en')
    const baseline = buildBranchBaselineSnapshot({
      currentDraftWorkspace: workspace,
      checkpoint,
      baseline: 'checkpoint',
      locale: 'en',
    })

    const compare = compareBookExperimentBranchToBaseline({
      branchSnapshot,
      baselineSnapshot: baseline,
      selectedChapterId: 'chapter-open-water-signals',
    })

    const warehouseScene = compare.chapters[1]?.sceneDeltas.find((scene) => scene.sceneId === 'scene-warehouse-bridge')
    expect(warehouseScene?.delta).toBe('unchanged')
    expect(warehouseScene?.sourceProposalDelta).toBe(0)
    expect(compare.totals.changedSceneCount).toBe(0)
  })

  it('localizes checkpoint baseline fallback chapter and scene content for zh-CN compare paths', () => {
    const workspace = createCurrentDraftWorkspace()
    const checkpoint = mockBookManuscriptCheckpointSeeds['book-signal-arc']![0]!

    const branchWorkspace = buildBookExperimentBranchWorkspace({
      currentDraftWorkspace: workspace,
      branch: mockBookExperimentBranchSeeds['book-signal-arc']![0]!,
      branches: mockBookExperimentBranchSeeds['book-signal-arc']!,
      checkpoint,
      branchBaseline: 'checkpoint',
      selectedChapterId: 'chapter-open-water-signals',
      locale: 'zh-CN',
    })

    expect(branchWorkspace.baseline.label).toBe('PR11 基线')
    expect(branchWorkspace.chapters[1]?.title).toBe('开阔水域信号')
    expect(branchWorkspace.chapters[1]?.sceneDeltas.find((scene) => scene.sceneId === 'scene-river-ledger')?.title).toBe('河道账本')
    expect(branchWorkspace.chapters[1]?.sceneDeltas.find((scene) => scene.sceneId === 'scene-river-ledger')?.summary).toContain('只存在于基线')
  })
})
