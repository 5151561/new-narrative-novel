import { useMemo } from 'react'

import { useI18n, type Locale } from '@/app/i18n'
import type { BookWorkbenchActivityItem } from '@/features/book/hooks/useBookWorkbenchActivity'

import type {
  BookDraftChapterViewModel,
  BookDraftSceneSectionViewModel,
  BookDraftWorkspaceViewModel,
} from '../types/book-draft-view-models'
import { buildBookStoryWorkspace, type BookStoryVariant } from './book-storybook'

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
  options?: { quiet?: boolean },
): BookWorkbenchActivityItem[] {
  if (options?.quiet) {
    return []
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
