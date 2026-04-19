import { useMemo } from 'react'

import { useI18n, type Locale } from '@/app/i18n'
import type { BookDraftBranchProblems } from '@/features/book/components/BookDraftBottomDock'
import type { BookWorkbenchActivityItem } from '@/features/book/hooks/useBookWorkbenchActivity'
import { buildReviewProblems } from '@/features/book/containers/BookDraftDockContainer'
import type { BookReviewFilter, BookReviewStatusFilter } from '@/features/workbench/types/workbench-route'
import { getBookReviewSeeds } from '@/features/review/api/book-review-seeds'
import type { ReviewIssueDecisionRecord } from '@/features/review/api/review-decision-records'
import type { ReviewIssueFixActionRecord } from '@/features/review/api/review-fix-action-records'
import { buildBookReviewInboxViewModel } from '@/features/review/lib/book-review-inbox-mappers'
import type { BookReviewInboxViewModel } from '@/features/review/types/review-view-models'

import {
  DEFAULT_BOOK_EXPORT_PROFILE_ID,
  mockBookExportProfileSeeds,
} from '../api/book-export-profiles'
import { mockBookExperimentBranchSeeds } from '../api/book-experiment-branches'
import {
  DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID,
  mockBookManuscriptCheckpointSeeds,
} from '../api/book-manuscript-checkpoints'
import {
  buildBookExperimentBranchWorkspace,
  normalizeBookExperimentBranch,
} from '../lib/book-experiment-branch-mappers'
import {
  buildBookExportPreviewWorkspace,
  normalizeBookExportProfile,
} from '../lib/book-export-preview-mappers'
import type {
  BookExperimentBranchSummaryViewModel,
  BookExperimentBranchWorkspaceViewModel,
} from '../types/book-branch-view-models'
import {
  buildCurrentManuscriptSnapshotFromBookDraft,
  compareBookManuscriptSnapshots,
  normalizeBookManuscriptCheckpoint,
} from '../lib/book-manuscript-compare-mappers'
import type {
  BookManuscriptCheckpointSummaryViewModel,
  BookManuscriptCheckpointViewModel,
  BookManuscriptCompareWorkspaceViewModel,
} from '../types/book-compare-view-models'
import type {
  BookDraftChapterViewModel,
  BookDraftSceneSectionViewModel,
  BookDraftWorkspaceViewModel,
} from '../types/book-draft-view-models'
import type {
  BookExportPreviewWorkspaceViewModel,
  BookExportProfileSummaryViewModel,
  BookExportProfileViewModel,
} from '../types/book-export-view-models'
import { buildBookStoryWorkspace, type BookStoryVariant } from './book-storybook'

const DEFAULT_BOOK_EXPERIMENT_BRANCH_ID = 'branch-book-signal-arc-quiet-ending'

type LocalizedText = {
  en: string
  'zh-CN': string
}

function localize(locale: Locale, text: LocalizedText) {
  return text[locale]
}

const draftSectionSeedMap: Record<
  string,
  Array<{
    sceneId: string
    title: LocalizedText
    summary: LocalizedText
    prose: LocalizedText
    diff: LocalizedText
  }>
> = {
  'chapter-signals-in-rain': [
    {
      sceneId: 'scene-midnight-platform',
      title: { en: 'Midnight Platform', 'zh-CN': '午夜站台' },
      summary: {
        en: 'Keep the bargain public and slow enough to show the pressure on the platform.',
        'zh-CN': '让谈判留在公开场域里，并且慢到足以看见站台压力。',
      },
      prose: {
        en: 'Rain held the platform in place while Ren refused to blink first.',
        'zh-CN': '雨把站台压在原地，而任仍然不肯先眨眼。',
      },
      diff: {
        en: 'Keep the witness pressure audible.',
        'zh-CN': '让目击者压力保持可感。',
      },
    },
    {
      sceneId: 'scene-concourse-delay',
      title: { en: 'Concourse Delay', 'zh-CN': '站厅迟滞' },
      summary: {
        en: 'Stretch the bottleneck without resolving the courier line too early.',
        'zh-CN': '把瓶颈继续拉长，但不要过早解决信使线。',
      },
      prose: {
        en: 'The crowd tightened by inches while the courier line refused to clear.',
        'zh-CN': '人群一寸寸收紧，而信使线迟迟没有松开。',
      },
      diff: {
        en: 'Hold the bottleneck for one more beat.',
        'zh-CN': '让瓶颈再多撑一个节拍。',
      },
    },
    {
      sceneId: 'scene-ticket-window',
      title: { en: 'Ticket Window', 'zh-CN': '售票窗' },
      summary: {
        en: 'Force speed and certainty into the same beat without surfacing the alias.',
        'zh-CN': '把速度与确定性压进同一个节拍里，但不要把化名翻出来。',
      },
      prose: {
        en: 'The ticket stalled halfway out while Mei waited for a cleaner answer.',
        'zh-CN': '票据抽到一半停住，梅在等一个更干净的答案。',
      },
      diff: {
        en: 'Tighten the visible cost before the clerk notices too much.',
        'zh-CN': '在职员察觉过多之前，先收紧可见代价。',
      },
    },
  ],
  'chapter-open-water-signals': [
    {
      sceneId: 'scene-warehouse-bridge',
      title: { en: 'Warehouse Bridge', 'zh-CN': '货仓桥' },
      summary: {
        en: 'Carry the courier leverage from the warehouse into the canal edge.',
        'zh-CN': '把信使筹码从货仓一直带到运河边缘。',
      },
      prose: {
        en: 'Warehouse pressure stayed visible while the courier handoff slipped toward open water.',
        'zh-CN': '货仓压力保持可见，而信使 handoff 正在滑向开阔水域。',
      },
      diff: {
        en: 'Carry the courier leverage through the canal release.',
        'zh-CN': '把信使筹码一直带到运河放行。',
      },
    },
    {
      sceneId: 'scene-canal-watch',
      title: { en: 'Canal Watch', 'zh-CN': '运河监视' },
      summary: {
        en: 'Keep the exit exposed without letting the ledger settle too soon.',
        'zh-CN': '让出口保持暴露，但不要让账本太早落定。',
      },
      prose: {
        en: 'The canal remained open just long enough for the ledger to stay dangerous.',
        'zh-CN': '运河只开了刚好够长的时间，让账本继续维持危险。',
      },
      diff: {
        en: 'Keep the ledger exposed during the release.',
        'zh-CN': '在放行时持续暴露账本。',
      },
    },
    {
      sceneId: 'scene-dawn-slip',
      title: { en: 'Dawn Slip', 'zh-CN': '黎明滑移' },
      summary: {
        en: 'Let the release move while the witness line stays barely attached.',
        'zh-CN': '让放行继续前进，同时让目击者线勉强挂住。',
      },
      prose: {
        en: 'Dawn release stayed light on its feet while the witness line almost vanished.',
        'zh-CN': '黎明放行脚步很轻，而目击者线几乎要消失。',
      },
      diff: {
        en: 'Rebuild the witness spine before final review.',
        'zh-CN': '终审前先把目击者主干补回来。',
      },
    },
  ],
  'chapter-dawn-slip': [
    {
      sceneId: 'scene-dawn-slip-1',
      title: { en: 'Dawn Release', 'zh-CN': '黎明放行' },
      summary: {
        en: 'Keep the release calm without pretending the trace is complete.',
        'zh-CN': '让放行保持平静，但不要假装溯源已经完整。',
      },
      prose: {
        en: 'Dawn release read smoothly while the supporting trace stayed thin.',
        'zh-CN': '黎明放行读起来已经顺了，但支撑溯源仍然很薄。',
      },
      diff: {
        en: 'Do not mark the dawn release ready yet.',
        'zh-CN': '先不要把黎明放行标成 ready。',
      },
    },
  ],
}

function buildDraftSections(
  locale: Locale,
  chapter: {
    chapterId: string
    title: string
    summary: string
    sceneCount: number
    missingDraftCount: number
    warningsCount: number
    queuedRevisionCount: number
    tracedSceneCount: number
    missingTraceSceneCount: number
  },
): BookDraftSceneSectionViewModel[] {
  const seeds = draftSectionSeedMap[chapter.chapterId] ?? [
    {
      sceneId: `${chapter.chapterId}-scene-1`,
      title: { en: 'Section 1', 'zh-CN': '段落 1' },
      summary: { en: chapter.summary, 'zh-CN': chapter.summary },
      prose: { en: chapter.summary, 'zh-CN': chapter.summary },
      diff: { en: chapter.summary, 'zh-CN': chapter.summary },
    },
  ]

  return seeds.slice(0, chapter.sceneCount).map((seed, index) => {
    const isMissingDraft = index >= seeds.length - chapter.missingDraftCount
    const traceReady = index < seeds.length - chapter.missingTraceSceneCount

    return {
      sceneId: seed.sceneId,
      order: index + 1,
      title: localize(locale, seed.title),
      summary: localize(locale, seed.summary),
      proseDraft: isMissingDraft ? undefined : localize(locale, seed.prose),
      draftWordCount: isMissingDraft ? undefined : localize(locale, seed.prose).split(/\s+/).length,
      isMissingDraft,
      warningsCount: Math.max(chapter.warningsCount - index, 0),
      revisionQueueCount: chapter.queuedRevisionCount > index ? 1 : 0,
      traceReady,
      relatedAssetCount: traceReady ? Math.max(1, chapter.tracedSceneCount - index) : 0,
      sourceProposalCount: traceReady ? Math.max(1, chapter.tracedSceneCount - index) : 0,
      latestDiffSummary: localize(locale, seed.diff),
    }
  })
}

function buildBookDraftStoryWorkspace(
  locale: Locale,
  options?: {
    variant?: BookStoryVariant
    selectedChapterId?: string
  },
): BookDraftWorkspaceViewModel {
  const structureWorkspace = buildBookStoryWorkspace(locale, options)
  const chapters = structureWorkspace.chapters.map<BookDraftChapterViewModel>((chapter) => ({
    chapterId: chapter.chapterId,
    order: chapter.order,
    title: chapter.title,
    summary: chapter.summary,
    sceneCount: chapter.sceneCount,
    draftedSceneCount: chapter.draftedSceneCount,
    missingDraftCount: chapter.missingDraftCount,
    assembledWordCount: chapter.assembledWordCount,
    warningsCount: chapter.warningsCount,
    queuedRevisionCount: chapter.queuedRevisionCount,
    tracedSceneCount: chapter.tracedSceneCount,
    missingTraceSceneCount: chapter.missingTraceSceneCount,
    coverageStatus: chapter.coverageStatus,
    sections: buildDraftSections(locale, chapter),
    assembledProseSections: buildDraftSections(locale, chapter)
      .map((section) => section.proseDraft)
      .filter((value): value is string => Boolean(value)),
  }))
  const selectedChapter =
    chapters.find((chapter) => chapter.chapterId === structureWorkspace.selectedChapterId) ?? chapters[0] ?? null

  return {
    bookId: structureWorkspace.bookId,
    title: structureWorkspace.title,
    summary: structureWorkspace.summary,
    selectedChapterId: selectedChapter?.chapterId ?? null,
    chapters,
    selectedChapter,
    assembledWordCount: structureWorkspace.totals.assembledWordCount,
    draftedChapterCount: chapters.filter((chapter) => chapter.draftedSceneCount > 0).length,
    missingDraftChapterCount: chapters.filter((chapter) => chapter.missingDraftCount > 0).length,
    inspector: {
      selectedChapter: selectedChapter
        ? {
            chapterId: selectedChapter.chapterId,
            title: selectedChapter.title,
            summary: selectedChapter.summary,
            draftedSceneCount: selectedChapter.draftedSceneCount,
            missingDraftCount: selectedChapter.missingDraftCount,
            tracedSceneCount: selectedChapter.tracedSceneCount,
            missingTraceSceneCount: selectedChapter.missingTraceSceneCount,
            warningsCount: selectedChapter.warningsCount,
            queuedRevisionCount: selectedChapter.queuedRevisionCount,
            assembledWordCount: selectedChapter.assembledWordCount,
            topMissingSceneTitles: selectedChapter.sections.filter((section) => section.isMissingDraft).map((section) => section.title),
            topLatestDiffSummary: selectedChapter.sections[0]?.latestDiffSummary,
            traceCoverageNote:
              selectedChapter.missingTraceSceneCount > 0
                ? locale === 'zh-CN'
                  ? '当前选中章节仍有溯源缺口。'
                  : 'The selected chapter still has trace gaps.'
                : locale === 'zh-CN'
                  ? '当前选中章节的溯源已就绪。'
                  : 'Trace coverage is ready for the selected chapter.',
          }
        : null,
      readiness: {
        draftedChapterCount: chapters.filter((chapter) => chapter.draftedSceneCount > 0).length,
        missingDraftChapterCount: chapters.filter((chapter) => chapter.missingDraftCount > 0).length,
        assembledWordCount: structureWorkspace.totals.assembledWordCount,
        warningHeavyChapterCount: chapters.filter((chapter) => chapter.warningsCount > 0).length,
        missingTraceChapterCount: chapters.filter((chapter) => chapter.missingTraceSceneCount > 0).length,
      },
      signals: {
        topMissingScenes: selectedChapter?.sections.filter((section) => section.isMissingDraft).map((section) => section.title) ?? [],
        latestDiffSummaries:
          selectedChapter?.sections
            .map((section) => section.latestDiffSummary)
            .filter((value): value is string => Boolean(value))
            .slice(0, 3) ?? [],
        traceCoverageNote:
          selectedChapter?.missingTraceSceneCount
            ? locale === 'zh-CN'
              ? '当前选中章节仍有溯源缺口。'
              : 'The selected chapter still has trace gaps.'
            : locale === 'zh-CN'
              ? '当前选中章节的溯源已就绪。'
              : 'Trace coverage is ready for the selected chapter.',
      },
    },
    dockSummary: {
      missingDraftChapterCount: chapters.filter((chapter) => chapter.missingDraftCount > 0).length,
      missingTraceChapterCount: chapters.filter((chapter) => chapter.missingTraceSceneCount > 0).length,
      warningsChapterCount: chapters.filter((chapter) => chapter.warningsCount > 0).length,
      queuedRevisionChapterCount: chapters.filter((chapter) => chapter.queuedRevisionCount > 0).length,
      highestPressureChapters: chapters.slice(0, 2).map((chapter) => ({
        chapterId: chapter.chapterId,
        title: chapter.title,
        detail:
          locale === 'zh-CN'
            ? `警告 ${chapter.warningsCount} / 待处理修订 ${chapter.queuedRevisionCount}`
            : `Warnings ${chapter.warningsCount} / Queued revisions ${chapter.queuedRevisionCount}`,
      })),
      missingDraftChapters: chapters
        .filter((chapter) => chapter.missingDraftCount > 0)
        .map((chapter) => ({
          chapterId: chapter.chapterId,
          title: chapter.title,
          detail:
            locale === 'zh-CN'
              ? `${chapter.sections.filter((section) => section.isMissingDraft).map((section) => section.title).join('、')} 还没有正文草稿。`
              : `${chapter.sections.filter((section) => section.isMissingDraft).map((section) => section.title).join(', ')} still need draft prose.`,
        })),
      missingTraceChapters: chapters
        .filter((chapter) => chapter.missingTraceSceneCount > 0)
        .map((chapter) => ({
          chapterId: chapter.chapterId,
          title: chapter.title,
          detail:
            locale === 'zh-CN'
              ? `${chapter.missingTraceSceneCount} 个场景仍缺溯源。`
              : `${chapter.missingTraceSceneCount} scenes still need trace rollups.`,
        })),
      warningsChapters: chapters
        .filter((chapter) => chapter.warningsCount > 0)
        .map((chapter) => ({
          chapterId: chapter.chapterId,
          title: chapter.title,
          detail:
            locale === 'zh-CN'
              ? `警告 ${chapter.warningsCount}`
              : `Warnings ${chapter.warningsCount}`,
        })),
      queuedRevisionChapters: chapters
        .filter((chapter) => chapter.queuedRevisionCount > 0)
        .map((chapter) => ({
          chapterId: chapter.chapterId,
          title: chapter.title,
          detail:
            locale === 'zh-CN'
              ? `待处理修订 ${chapter.queuedRevisionCount}`
              : `${chapter.queuedRevisionCount} queued revisions`,
        })),
    },
  }
}

function buildQuietCheckpoint(workspace: BookDraftWorkspaceViewModel): BookManuscriptCheckpointViewModel {
  const snapshot = buildCurrentManuscriptSnapshotFromBookDraft(workspace)

  return {
    checkpointId: 'checkpoint-book-signal-arc-quiet-pass',
    bookId: snapshot.bookId,
    title: 'Quiet Checkpoint',
    createdAtLabel: '2026-04-18 09:00',
    summary: 'Quiet snapshot aligned with the current story workspace.',
    chapters: snapshot.chapters,
  }
}

export function buildBookDraftCompareStoryData(
  locale: Locale,
  options?: {
    variant?: BookStoryVariant
    selectedChapterId?: string
    checkpointId?: string
  },
) {
  const workspace = buildBookDraftStoryWorkspace(locale, options)
  const defaultCheckpointRecord = mockBookManuscriptCheckpointSeeds['book-signal-arc']?.[0]
  const checkpoints = [
    defaultCheckpointRecord ? normalizeBookManuscriptCheckpoint(defaultCheckpointRecord, locale) : null,
    buildQuietCheckpoint(workspace),
  ].filter((value): value is BookManuscriptCheckpointViewModel => value !== null)
  const selectedCheckpoint =
    checkpoints.find((checkpoint) => checkpoint.checkpointId === (options?.checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID)) ??
    checkpoints[0] ??
    buildQuietCheckpoint(workspace)
  const compare = compareBookManuscriptSnapshots({
    current: buildCurrentManuscriptSnapshotFromBookDraft(workspace),
    checkpoint: selectedCheckpoint,
    selectedChapterId: options?.selectedChapterId ?? workspace.selectedChapterId,
  })

  const compareProblems = {
    changedChapterCount: compare.chapters.filter(
      (chapter) =>
        chapter.totals.changedCount > 0 ||
        chapter.totals.addedCount > 0 ||
        chapter.totals.missingCount > 0 ||
        chapter.totals.draftMissingCount > 0,
    ).length,
    draftMissingSceneCount: compare.chapters.flatMap((chapter) => chapter.scenes.filter((scene) => scene.delta === 'draft_missing')).length,
    traceRegressionCount: compare.chapters.flatMap((chapter) => chapter.scenes.filter((scene) => scene.checkpointScene?.traceReady && !scene.currentScene?.traceReady)).length,
    warningsIncreasedChapterCount: compare.chapters.filter((chapter) => chapter.warningsDelta > 0).length,
    checkpointMissingSectionCount: compare.chapters.flatMap((chapter) => chapter.scenes.filter((scene) => scene.delta === 'missing')).length,
    changedChapters: compare.chapters
      .filter((chapter) => chapter.totals.changedCount > 0 || chapter.totals.addedCount > 0 || chapter.totals.missingCount > 0)
      .map((chapter) => ({
        chapterId: chapter.chapterId,
        title: chapter.title,
        detail: `Changed ${chapter.totals.changedCount} / Added ${chapter.totals.addedCount} / Missing ${chapter.totals.missingCount}`,
      })),
    missingDraftScenes: compare.chapters.flatMap((chapter) =>
      chapter.scenes
        .filter((scene) => scene.delta === 'draft_missing')
        .map((scene) => ({
          chapterId: `${chapter.chapterId}:${scene.sceneId}`,
          title: chapter.title,
          detail: `${scene.title} still has no current draft.`,
        })),
    ),
    traceRegressions: compare.chapters.flatMap((chapter) =>
      chapter.scenes
        .filter((scene) => scene.checkpointScene?.traceReady && !scene.currentScene?.traceReady)
        .map((scene) => ({
          chapterId: `${chapter.chapterId}:${scene.sceneId}`,
          title: chapter.title,
          detail: `${scene.title} lost trace readiness.`,
        })),
    ),
    warningsIncreasedChapters: compare.chapters
      .filter((chapter) => chapter.warningsDelta > 0)
      .map((chapter) => ({
        chapterId: chapter.chapterId,
        title: chapter.title,
        detail: `Warnings +${chapter.warningsDelta}`,
      })),
    checkpointMissingSections: compare.chapters.flatMap((chapter) =>
      chapter.scenes
        .filter((scene) => scene.delta === 'missing')
        .map((scene) => ({
          chapterId: `${chapter.chapterId}:${scene.sceneId}`,
          title: chapter.title,
          detail: `${scene.title} only exists in the checkpoint.`,
        })),
    ),
  }

  return {
    workspace,
    compare,
    checkpoints: checkpoints.map<BookManuscriptCheckpointSummaryViewModel>((checkpoint) => ({
      checkpointId: checkpoint.checkpointId,
      bookId: checkpoint.bookId,
      title: checkpoint.title,
      createdAtLabel: checkpoint.createdAtLabel,
      summary: checkpoint.summary,
    })),
    selectedCheckpoint,
    compareProblems,
  }
}

export function buildBookDraftExportStoryData(
  locale: Locale,
  options?: {
    variant?: BookStoryVariant
    selectedChapterId?: string
    checkpointId?: string
    exportProfileId?: string
  },
): {
  workspace: BookDraftWorkspaceViewModel
  compare: BookManuscriptCompareWorkspaceViewModel
  exportWorkspace: BookExportPreviewWorkspaceViewModel
  exportProfiles: BookExportProfileSummaryViewModel[]
  selectedExportProfile: BookExportProfileViewModel
} {
  const workspace = buildBookDraftStoryWorkspace(locale, options)
  const compareData = buildBookDraftCompareStoryData(locale, {
    variant: options?.variant,
    selectedChapterId: options?.selectedChapterId,
    checkpointId: options?.checkpointId,
  })
  const exportProfileRecords = (mockBookExportProfileSeeds['book-signal-arc'] ?? []).map((record) => ({
    ...record,
    bookId: workspace.bookId,
  }))
  const exportProfiles = exportProfileRecords.map((record) =>
    normalizeBookExportProfile(record, locale) satisfies BookExportProfileSummaryViewModel,
  )
  const selectedExportProfile =
    exportProfiles.find((profile) => profile.exportProfileId === (options?.exportProfileId ?? DEFAULT_BOOK_EXPORT_PROFILE_ID)) ??
    exportProfiles[0]!

  return {
    workspace,
    compare: compareData.compare,
    exportWorkspace: buildBookExportPreviewWorkspace({
      currentDraftWorkspace: workspace,
      compareWorkspace: compareData.compare,
      profile: selectedExportProfile,
      locale,
    }),
    exportProfiles,
    selectedExportProfile,
  }
}

export function buildBookDraftBranchStoryData(
  locale: Locale,
  options?: {
    variant?: BookStoryVariant
    selectedChapterId?: string
    branchId?: string
    branchBaseline?: 'current' | 'checkpoint'
    checkpointId?: string
  },
): {
  workspace: BookDraftWorkspaceViewModel
  branchWorkspace: BookExperimentBranchWorkspaceViewModel
  branches: BookExperimentBranchSummaryViewModel[]
  selectedBranch: BookExperimentBranchSummaryViewModel
} {
  const workspace = buildBookDraftStoryWorkspace(locale, options)
  const branchBaseline = options?.branchBaseline ?? 'current'
  const branchRecords = mockBookExperimentBranchSeeds['book-signal-arc'] ?? []
  const branches = branchRecords.map((record) => normalizeBookExperimentBranch(record, locale))
  const selectedBranch =
    branches.find((branch) => branch.branchId === (options?.branchId ?? DEFAULT_BOOK_EXPERIMENT_BRANCH_ID)) ?? branches[0]!
  const selectedBranchRecord =
    branchRecords.find((branch) => branch.branchId === selectedBranch.branchId) ?? branchRecords[0]!
  const checkpoint =
    branchBaseline === 'checkpoint'
      ? mockBookManuscriptCheckpointSeeds['book-signal-arc']?.find(
          (record) => record.checkpointId === (options?.checkpointId ?? DEFAULT_BOOK_MANUSCRIPT_CHECKPOINT_ID),
        ) ?? mockBookManuscriptCheckpointSeeds['book-signal-arc']?.[0]
      : null

  return {
    workspace,
    branchWorkspace: buildBookExperimentBranchWorkspace({
      currentDraftWorkspace: workspace,
      branch: selectedBranchRecord,
      branches: branchRecords,
      checkpoint: checkpoint ?? null,
      branchBaseline,
      locale,
    }),
    branches,
    selectedBranch,
  }
}

export function buildBookDraftReviewStoryData(
  locale: Locale,
  options?: {
    variant?: BookStoryVariant
    selectedChapterId?: string
    checkpointId?: string
    exportProfileId?: string
    branchId?: string
    branchBaseline?: 'current' | 'checkpoint'
    reviewFilter?: BookReviewFilter
    reviewStatusFilter?: BookReviewStatusFilter
    reviewIssueId?: string
    includeReviewSeeds?: boolean
    decisionStates?: Array<{
      issueId: string
      status: 'reviewed' | 'deferred' | 'dismissed'
      note?: string
      stale?: boolean
    }>
    fixActionStates?: Array<{
      issueId: string
      status: 'started' | 'checked' | 'blocked'
      note?: string
      stale?: boolean
    }>
  },
): {
  workspace: BookDraftWorkspaceViewModel
  compare: BookManuscriptCompareWorkspaceViewModel
  exportWorkspace: BookExportPreviewWorkspaceViewModel
  branchWorkspace: BookExperimentBranchWorkspaceViewModel
  reviewInbox: BookReviewInboxViewModel
} {
  const compareData = buildBookDraftCompareStoryData(locale, {
    variant: options?.variant,
    selectedChapterId: options?.selectedChapterId,
    checkpointId: options?.checkpointId,
  })
  const exportData = buildBookDraftExportStoryData(locale, {
    variant: options?.variant,
    selectedChapterId: options?.selectedChapterId,
    checkpointId: options?.checkpointId,
    exportProfileId: options?.exportProfileId,
  })
  const branchData = buildBookDraftBranchStoryData(locale, {
    variant: options?.variant,
    selectedChapterId: options?.selectedChapterId,
    checkpointId: options?.checkpointId,
    branchId: options?.branchId,
    branchBaseline: options?.branchBaseline,
  })
  const baseReviewInbox = buildBookReviewInboxViewModel({
    bookId: exportData.workspace.bookId,
    currentDraftWorkspace: exportData.workspace,
    compareWorkspace: compareData.compare,
    exportWorkspace: exportData.exportWorkspace,
    branchWorkspace: branchData.branchWorkspace,
    reviewSeeds: options?.includeReviewSeeds === false ? [] : getBookReviewSeeds(exportData.workspace.bookId),
    reviewFilter: options?.reviewFilter ?? 'all',
    reviewIssueId: options?.reviewIssueId,
  })
  const decisionRecords: ReviewIssueDecisionRecord[] =
    options?.decisionStates
      ?.map((decisionState) => {
        const issue =
          baseReviewInbox.issues.find((item) => item.id === decisionState.issueId) ??
          baseReviewInbox.selectedIssue ??
          baseReviewInbox.issues[0]
        if (!issue) {
          return null
        }

        return {
          id: `story-decision-${issue.id}`,
          bookId: exportData.workspace.bookId,
          issueId: issue.id,
          issueSignature: decisionState.stale ? 'story-stale-signature' : issue.issueSignature,
          status: decisionState.status,
          note: decisionState.note,
          updatedAtLabel: 'Story review decision',
          updatedByLabel: 'Story reviewer',
        } satisfies ReviewIssueDecisionRecord
      })
      .filter((record): record is ReviewIssueDecisionRecord => record !== null) ?? []
  const fixActions: ReviewIssueFixActionRecord[] =
    options?.fixActionStates
      ?.map((fixActionState) => {
        const issue =
          baseReviewInbox.issues.find((item) => item.id === fixActionState.issueId) ??
          baseReviewInbox.selectedIssue ??
          baseReviewInbox.issues[0]
        const handoff = issue?.primaryFixHandoff
        if (!issue || !handoff) {
          return null
        }

        return {
          id: `story-fix-action-${issue.id}`,
          bookId: exportData.workspace.bookId,
          issueId: issue.id,
          issueSignature: fixActionState.stale ? 'story-stale-fix-signature' : issue.issueSignature,
          sourceHandoffId: handoff.id,
          sourceHandoffLabel: handoff.label,
          targetScope: handoff.target.scope,
          status: fixActionState.status,
          note: fixActionState.note,
          startedAtLabel: 'Story source fix started',
          updatedAtLabel: 'Story source fix updated',
          updatedByLabel: 'Story reviewer',
        } satisfies ReviewIssueFixActionRecord
      })
      .filter((record): record is ReviewIssueFixActionRecord => record !== null) ?? []
  const reviewInbox = buildBookReviewInboxViewModel({
    bookId: exportData.workspace.bookId,
    currentDraftWorkspace: exportData.workspace,
    compareWorkspace: compareData.compare,
    exportWorkspace: exportData.exportWorkspace,
    branchWorkspace: branchData.branchWorkspace,
    reviewSeeds: options?.includeReviewSeeds === false ? [] : getBookReviewSeeds(exportData.workspace.bookId),
    reviewFilter: options?.reviewFilter ?? 'all',
    reviewStatusFilter: options?.reviewStatusFilter ?? 'open',
    reviewIssueId: options?.reviewIssueId,
    decisionRecords,
    fixActions,
  })

  return {
    workspace: exportData.workspace,
    compare: compareData.compare,
    exportWorkspace: exportData.exportWorkspace,
    branchWorkspace: branchData.branchWorkspace,
    reviewInbox,
  }
}

export function buildBookDraftExportBaselineError() {
  return new Error('Book manuscript checkpoint "checkpoint-missing" could not be found for "book-signal-arc".')
}

export function buildBookDraftBranchProblemsStoryData(
  locale: Locale,
  branchWorkspace: BookExperimentBranchWorkspaceViewModel,
): BookDraftBranchProblems {
  const blockers = branchWorkspace.readiness.issues.filter((issue) => issue.severity === 'blocker')
  const warnings = branchWorkspace.readiness.issues.filter((issue) => issue.severity === 'warning')
  const rows = branchWorkspace.chapters.flatMap((chapter) => chapter.sceneDeltas.map((scene) => ({ chapter, scene })))
  const draftMissingScenes = rows.filter(({ scene }) => scene.delta === 'draft_missing')
  const traceRegressions = rows.filter(
    ({ scene }) => scene.traceReadyChanged && scene.baselineScene?.traceReady && !scene.branchScene?.traceReady,
  )
  const warningIncreases = rows.filter(({ scene }) => scene.warningsDelta > 0)
  const addedWithoutSource = rows.filter(({ scene }) => scene.delta === 'added' && (scene.branchSourceProposalCount ?? 0) <= 0)
  const toIssueItems = (issues: typeof blockers) =>
    issues.map((issue) => ({
      chapterId: `${issue.chapterId ?? 'branch'}:${issue.id}`,
      title:
        issue.chapterId != null
          ? branchWorkspace.chapters.find((chapter) => chapter.chapterId === issue.chapterId)?.title ?? branchWorkspace.title
          : branchWorkspace.title,
      detail: issue.detail,
    }))
  const toSceneItems = (
    sceneRows: typeof draftMissingScenes,
    detailBuilder: (sceneTitle: string) => string,
  ) =>
    sceneRows.map(({ chapter, scene }) => ({
      chapterId: `${chapter.chapterId}:${scene.sceneId}`,
      title: chapter.title,
      detail: detailBuilder(scene.title),
    }))

  return {
    blockerCount: blockers.length,
    warningCount: warnings.length,
    draftMissingSceneCount: draftMissingScenes.length,
    traceRegressionCount: traceRegressions.length,
    warningIncreaseCount: warningIncreases.length,
    addedWithoutSourceCount: addedWithoutSource.length,
    blockers: toIssueItems(blockers),
    warnings: toIssueItems(warnings),
    draftMissingScenes: toSceneItems(draftMissingScenes, (sceneTitle) =>
      locale === 'zh-CN' ? `${sceneTitle} 仍然缺少分支正文。` : `${sceneTitle} is still draft-missing in the branch.`,
    ),
    traceRegressions: toSceneItems(traceRegressions, (sceneTitle) =>
      locale === 'zh-CN' ? `${sceneTitle} 相对基线失去了溯源就绪。` : `${sceneTitle} lost trace readiness against the baseline.`,
    ),
    warningIncreases: toSceneItems(warningIncreases, (sceneTitle) =>
      locale === 'zh-CN' ? `${sceneTitle} 的警告继续上升。` : `${sceneTitle} increases warning pressure against the baseline.`,
    ),
    addedWithoutSource: toSceneItems(addedWithoutSource, (sceneTitle) =>
      locale === 'zh-CN' ? `${sceneTitle} 是没有来源提案的新增场景。` : `${sceneTitle} was added without a source proposal.`,
    ),
  }
}

export const buildBookDraftReviewProblemsStoryData = buildReviewProblems

function getReviewFilterLabel(locale: Locale, filter: BookReviewFilter) {
  if (locale === 'zh-CN') {
    return filter === 'all'
      ? '全部'
      : filter === 'blockers'
        ? '阻塞项'
        : filter === 'trace-gaps'
          ? '溯源缺口'
          : filter === 'missing-drafts'
            ? '缺稿'
            : filter === 'compare-deltas'
              ? 'Compare 差异'
              : filter === 'export-readiness'
                ? '导出准备度'
                : filter === 'branch-readiness'
                  ? '实验稿准备度'
                  : '场景提案'
  }

  return filter === 'all'
    ? 'All'
    : filter === 'blockers'
      ? 'Blockers'
      : filter === 'trace-gaps'
        ? 'Trace gaps'
        : filter === 'missing-drafts'
          ? 'Missing drafts'
          : filter === 'compare-deltas'
            ? 'Compare deltas'
            : filter === 'export-readiness'
              ? 'Export readiness'
              : filter === 'branch-readiness'
                ? 'Branch readiness'
                : 'Scene proposals'
}

export function useLocalizedBookDraftWorkspace(options?: {
  variant?: BookStoryVariant
  selectedChapterId?: string
}) {
  const { locale } = useI18n()

  return useMemo(
    () =>
      buildBookDraftStoryWorkspace(locale, {
        variant: options?.variant,
        selectedChapterId: options?.selectedChapterId,
      }),
    [locale, options?.selectedChapterId, options?.variant],
  )
}

export function buildBookDraftStoryActivity(
  locale: Locale,
  workspace: BookDraftWorkspaceViewModel,
  options?: {
    quiet?: boolean
    draftView?: 'read' | 'compare' | 'export' | 'branch' | 'review'
    checkpointTitle?: string
    branchTitle?: string
    branchSummary?: string
    branchBaselineTitle?: string
    branchBaselineKind?: 'current' | 'checkpoint'
    branchBaselineCheckpointId?: string
    exportProfileTitle?: string
    exportProfileSummary?: string
    reviewFilter?: BookReviewFilter
    reviewIssueTitle?: string
    reviewIssueChapterTitle?: string
    reviewIssueSceneTitle?: string
    reviewSourceActionLabel?: string
  },
): BookWorkbenchActivityItem[] {
  if (options?.quiet) {
    return []
  }

  if (options?.draftView === 'compare') {
    return [
      {
        id: 'draft-view-0',
        kind: 'draft-view',
        title: locale === 'zh-CN' ? '进入 Compare' : 'Entered Compare',
        detail:
          locale === 'zh-CN'
            ? 'Compare 面板继续把 checkpoint 与章节焦点交给路由。'
            : 'Compare keeps checkpoint and chapter focus route-owned.',
        tone: 'accent',
      },
      {
        id: 'checkpoint-1',
        kind: 'checkpoint',
        title:
          locale === 'zh-CN'
            ? `选择 checkpoint ${options.checkpointTitle ?? 'PR11 Baseline'}`
            : `Selected checkpoint ${options.checkpointTitle ?? 'PR11 Baseline'}`,
        detail:
          locale === 'zh-CN'
            ? '对照手稿基线继续复核章节级差异。'
            : 'Review chapter-level deltas against the selected manuscript baseline.',
        tone: 'neutral',
      },
      {
        id: 'chapter-2',
        kind: 'chapter',
        title: locale === 'zh-CN' ? `聚焦${workspace.selectedChapter?.title ?? workspace.title}` : `Focused ${workspace.selectedChapter?.title ?? workspace.title}`,
        detail: workspace.selectedChapter?.summary ?? workspace.summary,
        tone: 'neutral',
      },
    ]
  }

  if (options?.draftView === 'export') {
    return [
      {
        id: 'draft-view-0',
        kind: 'draft-view',
        title: locale === 'zh-CN' ? '进入导出预览' : 'Entered Export Preview',
        detail:
          locale === 'zh-CN'
            ? 'Export 预览继续把 chapter focus 与 export profile 交给路由。'
            : 'Export preview keeps chapter focus and profile selection route-owned.',
        tone: 'accent',
      },
      {
        id: 'export-profile-1',
        kind: 'export-profile',
        title:
          locale === 'zh-CN'
            ? `选择导出配置 ${options.exportProfileTitle ?? '审阅包'}`
            : `Selected export profile ${options.exportProfileTitle ?? 'Review Packet'}`,
        detail:
          options.exportProfileSummary ??
          (locale === 'zh-CN'
            ? '导出预览继续沿用同一份 chapter package 数据。'
            : 'Export preview keeps using the same chapter package dataset.'),
        tone: 'neutral',
      },
      {
        id: 'chapter-2',
        kind: 'chapter',
        title: locale === 'zh-CN' ? `聚焦${workspace.selectedChapter?.title ?? workspace.title}` : `Focused ${workspace.selectedChapter?.title ?? workspace.title}`,
        detail: workspace.selectedChapter?.summary ?? workspace.summary,
        tone: 'neutral',
      },
    ]
  }

  if (options?.draftView === 'branch') {
    return [
      {
        id: 'draft-view-0',
        kind: 'draft-view',
        title: locale === 'zh-CN' ? '进入实验稿审阅' : 'Entered Branch Review',
        detail:
          locale === 'zh-CN'
            ? '实验稿审阅继续把 branch 选择与 baseline 都交给路由。'
            : 'Branch review keeps branch selection and baseline route-owned.',
        tone: 'accent',
      },
      {
        id: 'branch-1',
        kind: 'branch',
        title:
          locale === 'zh-CN'
            ? `选择实验稿 ${options.branchTitle ?? '静默收束稿'}`
            : `Selected branch ${options.branchTitle ?? 'Quiet Ending'}`,
        detail:
          options.branchSummary ??
          (locale === 'zh-CN'
            ? '实验稿继续沿用同一份 chapter selection。'
            : 'The branch view keeps using the same chapter selection.'),
        tone: 'neutral',
      },
      {
        id: 'branch-baseline-2',
        kind: 'branch-baseline',
        title:
          locale === 'zh-CN'
            ? `选择${options.branchBaselineTitle ?? '当前正文基线'}`
            : `Selected ${(options.branchBaselineTitle ?? 'Current baseline').toLowerCase()}`,
        detail:
          options.branchBaselineKind === 'current'
            ? locale === 'zh-CN'
              ? '继续以当前正文作为实验稿审阅基线。'
              : 'Keep the current manuscript as the branch review baseline.'
            : options.branchBaselineCheckpointId && options.branchBaselineTitle
              ? locale === 'zh-CN'
                ? `相对${options.branchBaselineTitle}继续复核分支差异（${options.branchBaselineCheckpointId}）。`
                : `Review branch deltas against ${options.branchBaselineTitle} (${options.branchBaselineCheckpointId}).`
              : locale === 'zh-CN'
                ? '继续相对 checkpoint 手稿基线复核分支差异。'
                : 'Review branch deltas against the checkpoint manuscript baseline.',
        tone: 'neutral',
      },
      {
        id: 'chapter-3',
        kind: 'chapter',
        title: locale === 'zh-CN' ? `聚焦${workspace.selectedChapter?.title ?? workspace.title}` : `Focused ${workspace.selectedChapter?.title ?? workspace.title}`,
        detail: workspace.selectedChapter?.summary ?? workspace.summary,
        tone: 'neutral',
      },
    ]
  }

  if (options?.draftView === 'review') {
    const reviewFilterLabel = getReviewFilterLabel(locale, options.reviewFilter ?? 'all')

    return [
      {
        id: 'draft-view-0',
        kind: 'draft-view',
        title: locale === 'zh-CN' ? '进入 Review' : 'Entered Review',
        detail:
          locale === 'zh-CN'
            ? 'Review 继续把筛选器与问题选择交给路由。'
            : 'Review keeps filter and issue selection route-owned.',
        tone: 'accent',
      },
      {
        id: 'review-filter-1',
        kind: 'review-filter',
        title: locale === 'zh-CN' ? `选择筛选器 ${reviewFilterLabel}` : `Selected review filter ${reviewFilterLabel}`,
        detail:
          locale === 'zh-CN'
            ? 'Review 队列继续把当前筛选器保留在 route state 中。'
            : 'The review queue keeps the active filter in route state.',
        tone: 'neutral',
      },
      {
        id: 'review-issue-2',
        kind: 'review-issue',
        title:
          locale === 'zh-CN'
            ? `选择审阅问题 ${options.reviewIssueTitle ?? '导出包仍被阻塞'}`
            : `Selected review issue ${options.reviewIssueTitle ?? 'Export packet is blocked'}`,
        detail:
          [options.reviewIssueChapterTitle, options.reviewIssueSceneTitle].filter(Boolean).join(' / ') ||
          (locale === 'zh-CN' ? '当前焦点章节' : 'Current chapter focus'),
        tone: 'neutral',
      },
      {
        id: 'review-source-3',
        kind: 'review-source',
        title:
          locale === 'zh-CN'
            ? `打开问题来源 ${options.reviewSourceActionLabel ?? '打开导出准备度'}`
            : `Opened issue source ${options.reviewSourceActionLabel ?? 'Open export readiness'}`,
        detail: options.reviewIssueTitle ?? (locale === 'zh-CN' ? '导出包仍被阻塞' : 'Export packet is blocked'),
        tone: 'neutral',
      },
    ]
  }

  return [
    {
      id: 'lens-0',
      kind: 'lens',
      title: locale === 'zh-CN' ? '进入成稿' : 'Entered Draft',
      detail:
        locale === 'zh-CN'
          ? '书籍草稿工作区继续保持 lens 与章节焦点都由路由拥有。'
          : 'The book draft workspace keeps both lens and chapter focus route-owned.',
      tone: 'accent',
    },
    {
      id: 'chapter-1',
      kind: 'chapter',
      title: locale === 'zh-CN' ? `聚焦${workspace.selectedChapter?.title ?? workspace.title}` : `Focused ${workspace.selectedChapter?.title ?? workspace.title}`,
      detail: workspace.selectedChapter?.summary ?? workspace.summary,
      tone: 'neutral',
    },
  ]
}
