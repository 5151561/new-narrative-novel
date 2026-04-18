import { useMemo, type PropsWithChildren } from 'react'

import { useI18n, type Locale } from '@/app/i18n'
import { AppProviders } from '@/app/providers'
import type { BookWorkbenchActivityItem } from '@/features/book/hooks/useBookWorkbenchActivity'
import type {
  BookStructureChapterViewModel,
  BookStructureDockSummaryViewModel,
  BookStructureInspectorViewModel,
  BookStructureRiskSummaryViewModel,
  BookStructureTotalsViewModel,
  BookStructureView,
  BookStructureWorkspaceViewModel,
} from '@/features/book/types/book-view-models'

export type BookStoryVariant = 'default' | 'signals-heavy' | 'quiet-book' | 'missing-trace-attention'

type LocalizedText = {
  en: string
  'zh-CN': string
}

interface ChapterSeed {
  chapterId: string
  order: number
  title: LocalizedText
  summary: LocalizedText
  sceneCount: number
  unresolvedCount: number
  draftedSceneCount: number
  missingDraftCount: number
  assembledWordCount: number
  warningsCount: number
  queuedRevisionCount: number
  tracedSceneCount: number
  missingTraceSceneCount: number
  coverageStatus: BookStructureChapterViewModel['coverageStatus']
  primaryProblemLabel?: LocalizedText
  primaryAssemblyHintLabel?: LocalizedText
}

const variantTitles: Record<BookStoryVariant, LocalizedText> = {
  default: {
    en: 'Signal Arc',
    'zh-CN': '信号弧线',
  },
  'signals-heavy': {
    en: 'Signal Arc Pressure Sweep',
    'zh-CN': '信号弧线压力总览',
  },
  'quiet-book': {
    en: 'Signal Arc Quiet Pass',
    'zh-CN': '信号弧线安静轮次',
  },
  'missing-trace-attention': {
    en: 'Signal Arc Trace Review',
    'zh-CN': '信号弧线溯源复核',
  },
}

const variantSummaries: Record<BookStoryVariant, LocalizedText> = {
  default: {
    en: 'Aggregate chapter pressure, draft readiness, and trace coverage into one route-owned book surface.',
    'zh-CN': '把章节压力、成稿准备度和溯源覆盖聚合到一个 route-owned 的书籍视图里。',
  },
  'signals-heavy': {
    en: 'Keep the noisiest structure signals visible when several chapters are waiting on the same review pass.',
    'zh-CN': '当多个章节同时排队待审时，保持最嘈杂的结构信号仍然可见。',
  },
  'quiet-book': {
    en: 'Show the steady-state pass where chapters are assembled and the dock stays intentionally quiet.',
    'zh-CN': '展示章节已经装配稳定、底部面板刻意保持安静的稳态轮次。',
  },
  'missing-trace-attention': {
    en: 'Focus on the chapters that still need trace rollups before the book can be treated as review-ready.',
    'zh-CN': '把仍然缺少溯源汇总、还不能当作 review-ready 的章节聚焦出来。',
  },
}

function localize(locale: Locale, text: LocalizedText) {
  return text[locale]
}

function getChapterSeeds(variant: BookStoryVariant): ChapterSeed[] {
  switch (variant) {
    case 'signals-heavy':
      return [
        {
          chapterId: 'chapter-signals-in-rain',
          order: 1,
          title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
          summary: {
            en: 'Platform pressure keeps slipping whenever the departure bell threatens to resolve the bargain too early.',
            'zh-CN': '每当发车铃声过早推动谈判收束时，站台压力都会继续滑动。',
          },
          sceneCount: 4,
          unresolvedCount: 12,
          draftedSceneCount: 2,
          missingDraftCount: 2,
          assembledWordCount: 1048,
          warningsCount: 9,
          queuedRevisionCount: 3,
          tracedSceneCount: 3,
          missingTraceSceneCount: 1,
          coverageStatus: 'attention',
          primaryProblemLabel: {
            en: 'Departure bell timing still lands before the last bargaining beat resolves.',
            'zh-CN': '发车铃声仍然早于最后一个谈判节拍落下。',
          },
          primaryAssemblyHintLabel: {
            en: 'Keep the platform witness audible without resolving the ledger.',
            'zh-CN': '让站台目击者保持可感，但不要提前解决账本。',
          },
        },
        {
          chapterId: 'chapter-open-water-signals',
          order: 2,
          title: { en: 'Open Water Signals', 'zh-CN': '开阔水域信号' },
          summary: {
            en: 'Warehouse pressure should stay legible while the courier handoff slips toward open water.',
            'zh-CN': '货仓压力要保持清晰，同时让信使交接逐步滑向开阔水域。',
          },
          sceneCount: 3,
          unresolvedCount: 7,
          draftedSceneCount: 2,
          missingDraftCount: 1,
          assembledWordCount: 846,
          warningsCount: 7,
          queuedRevisionCount: 2,
          tracedSceneCount: 1,
          missingTraceSceneCount: 2,
          coverageStatus: 'attention',
          primaryProblemLabel: {
            en: 'Warehouse to canal carry-through is still splitting across two summaries.',
            'zh-CN': '货仓到运河的承接仍然裂成了两段摘要。',
          },
          primaryAssemblyHintLabel: {
            en: 'Carry the courier leverage through the canal release.',
            'zh-CN': '把信使筹码一直带到运河放行。',
          },
        },
        {
          chapterId: 'chapter-dawn-slip',
          order: 3,
          title: { en: 'Dawn Slip', 'zh-CN': '黎明滑移' },
          summary: {
            en: 'The dawn release is assembled, but trace evidence is still too thin to close review.',
            'zh-CN': '黎明放行的装配已经成形，但溯源证据仍然太薄，无法收尾审阅。',
          },
          sceneCount: 2,
          unresolvedCount: 5,
          draftedSceneCount: 1,
          missingDraftCount: 1,
          assembledWordCount: 524,
          warningsCount: 8,
          queuedRevisionCount: 2,
          tracedSceneCount: 0,
          missingTraceSceneCount: 2,
          coverageStatus: 'missing',
          primaryProblemLabel: {
            en: 'No trace rollup ties the dawn release back to the courier bargain.',
            'zh-CN': '还没有任何溯源汇总把黎明放行接回信使谈判。',
          },
          primaryAssemblyHintLabel: {
            en: 'Add a final trace spine before closing the dawn release.',
            'zh-CN': '在结束黎明放行前，先补一条最后的溯源主干。',
          },
        },
      ]
    case 'quiet-book':
      return [
        {
          chapterId: 'chapter-signals-in-rain',
          order: 1,
          title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
          summary: {
            en: 'Platform pressure is already settled into the current review-ready pass.',
            'zh-CN': '站台压力已经稳定到当前这一轮可审阅状态里。',
          },
          sceneCount: 4,
          unresolvedCount: 0,
          draftedSceneCount: 4,
          missingDraftCount: 0,
          assembledWordCount: 1184,
          warningsCount: 0,
          queuedRevisionCount: 0,
          tracedSceneCount: 4,
          missingTraceSceneCount: 0,
          coverageStatus: 'ready',
          primaryAssemblyHintLabel: {
            en: 'Hold the current assembly order.',
            'zh-CN': '保持当前装配顺序。',
          },
        },
        {
          chapterId: 'chapter-open-water-signals',
          order: 2,
          title: { en: 'Open Water Signals', 'zh-CN': '开阔水域信号' },
          summary: {
            en: 'The canal release now reads cleanly from warehouse pressure to open-water exit.',
            'zh-CN': '运河放行现在已经能从货仓压力顺畅读到开阔水域出口。',
          },
          sceneCount: 3,
          unresolvedCount: 0,
          draftedSceneCount: 3,
          missingDraftCount: 0,
          assembledWordCount: 864,
          warningsCount: 0,
          queuedRevisionCount: 0,
          tracedSceneCount: 3,
          missingTraceSceneCount: 0,
          coverageStatus: 'ready',
          primaryAssemblyHintLabel: {
            en: 'Keep the handoff bridge as-is.',
            'zh-CN': '保持当前 handoff bridge。',
          },
        },
        {
          chapterId: 'chapter-dawn-slip',
          order: 3,
          title: { en: 'Dawn Slip', 'zh-CN': '黎明滑移' },
          summary: {
            en: 'Dawn release remains calm and fully traced in the current reading order.',
            'zh-CN': '黎明放行在当前阅读顺序里保持平静且溯源完整。',
          },
          sceneCount: 2,
          unresolvedCount: 0,
          draftedSceneCount: 2,
          missingDraftCount: 0,
          assembledWordCount: 536,
          warningsCount: 0,
          queuedRevisionCount: 0,
          tracedSceneCount: 2,
          missingTraceSceneCount: 0,
          coverageStatus: 'ready',
          primaryAssemblyHintLabel: {
            en: 'No further adjustments queued.',
            'zh-CN': '当前没有待排队调整。',
          },
        },
      ]
    case 'missing-trace-attention':
      return [
        {
          chapterId: 'chapter-signals-in-rain',
          order: 1,
          title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
          summary: {
            en: 'The platform draft is stable, but trace coverage still drops on one of the late beats.',
            'zh-CN': '站台正文已经稳定，但晚段仍有一个节拍缺少溯源覆盖。',
          },
          sceneCount: 4,
          unresolvedCount: 4,
          draftedSceneCount: 4,
          missingDraftCount: 0,
          assembledWordCount: 1152,
          warningsCount: 3,
          queuedRevisionCount: 1,
          tracedSceneCount: 2,
          missingTraceSceneCount: 2,
          coverageStatus: 'attention',
          primaryProblemLabel: {
            en: 'Late-beat witness trace is still missing.',
            'zh-CN': '后段目击者节拍仍然缺少溯源。',
          },
          primaryAssemblyHintLabel: {
            en: 'Reconnect the witness line before final review.',
            'zh-CN': '终审前先把目击者线重新接上。',
          },
        },
        {
          chapterId: 'chapter-open-water-signals',
          order: 2,
          title: { en: 'Open Water Signals', 'zh-CN': '开阔水域信号' },
          summary: {
            en: 'The canal handoff reads well, yet most scene-level trace summaries are still missing.',
            'zh-CN': '运河 handoff 的阅读感已经够好，但多数场景级溯源摘要仍然缺失。',
          },
          sceneCount: 3,
          unresolvedCount: 3,
          draftedSceneCount: 3,
          missingDraftCount: 0,
          assembledWordCount: 824,
          warningsCount: 4,
          queuedRevisionCount: 1,
          tracedSceneCount: 0,
          missingTraceSceneCount: 3,
          coverageStatus: 'attention',
          primaryProblemLabel: {
            en: 'Open-water release still has no usable trace spine.',
            'zh-CN': '开阔水域放行仍然没有可用的溯源主干。',
          },
          primaryAssemblyHintLabel: {
            en: 'Build one reviewable trace bundle for the whole handoff.',
            'zh-CN': '先为整段 handoff 织出一个可复核的溯源包。',
          },
        },
        {
          chapterId: 'chapter-dawn-slip',
          order: 3,
          title: { en: 'Dawn Slip', 'zh-CN': '黎明滑移' },
          summary: {
            en: 'Dawn release still reads like a placeholder because none of its trace rollups are in place.',
            'zh-CN': '黎明放行现在仍像占位稿，因为相关溯源汇总一个都没有落下来。',
          },
          sceneCount: 2,
          unresolvedCount: 1,
          draftedSceneCount: 2,
          missingDraftCount: 0,
          assembledWordCount: 502,
          warningsCount: 5,
          queuedRevisionCount: 2,
          tracedSceneCount: 0,
          missingTraceSceneCount: 2,
          coverageStatus: 'missing',
          primaryProblemLabel: {
            en: 'Dawn release still has zero trace coverage.',
            'zh-CN': '黎明放行仍然是零溯源覆盖。',
          },
          primaryAssemblyHintLabel: {
            en: 'Do not mark the book ready until dawn trace is rebuilt.',
            'zh-CN': '在黎明段溯源重建前，不要把整本书标为 ready。',
          },
        },
      ]
    default:
      return [
        {
          chapterId: 'chapter-signals-in-rain',
          order: 1,
          title: { en: 'Signals in Rain', 'zh-CN': '雨中信号' },
          summary: {
            en: 'Platform pressure should hold until the departure bell, with one draft still waiting on the last review note.',
            'zh-CN': '站台压力要一直撑到发车铃声，当前还有一段正文在等最后一条复核意见。',
          },
          sceneCount: 4,
          unresolvedCount: 8,
          draftedSceneCount: 3,
          missingDraftCount: 1,
          assembledWordCount: 1091,
          warningsCount: 6,
          queuedRevisionCount: 1,
          tracedSceneCount: 3,
          missingTraceSceneCount: 1,
          coverageStatus: 'attention',
          primaryProblemLabel: {
            en: 'Departure bell timing still lands before the last bargaining beat resolves.',
            'zh-CN': '发车铃声仍然早于最后一个谈判节拍落下。',
          },
          primaryAssemblyHintLabel: {
            en: 'Carry platform pressure into the ticket-window release.',
            'zh-CN': '把站台压力一直带到售票窗放行。',
          },
        },
        {
          chapterId: 'chapter-open-water-signals',
          order: 2,
          title: { en: 'Open Water Signals', 'zh-CN': '开阔水域信号' },
          summary: {
            en: 'Warehouse pressure should stay legible while the canal exit opens for the courier.',
            'zh-CN': '要让货仓压力保持清晰，同时把运河出口向信使打开。',
          },
          sceneCount: 3,
          unresolvedCount: 2,
          draftedSceneCount: 3,
          missingDraftCount: 0,
          assembledWordCount: 792,
          warningsCount: 2,
          queuedRevisionCount: 1,
          tracedSceneCount: 3,
          missingTraceSceneCount: 0,
          coverageStatus: 'ready',
          primaryProblemLabel: {
            en: 'Handoff bridge still needs one cleaner cause-and-effect summary.',
            'zh-CN': 'handoff bridge 还差一条更干净的因果摘要。',
          },
          primaryAssemblyHintLabel: {
            en: 'Warehouse to canal carry-through.',
            'zh-CN': '从货仓一直带到运河。',
          },
        },
        {
          chapterId: 'chapter-dawn-slip',
          order: 3,
          title: { en: 'Dawn Slip', 'zh-CN': '黎明滑移' },
          summary: {
            en: 'Dawn release reads cleanly, but one scene still needs a trace rollup before final review.',
            'zh-CN': '黎明放行整体读感已经顺了，但还有一个场景在终审前需要补溯源汇总。',
          },
          sceneCount: 2,
          unresolvedCount: 2,
          draftedSceneCount: 2,
          missingDraftCount: 0,
          assembledWordCount: 518,
          warningsCount: 2,
          queuedRevisionCount: 0,
          tracedSceneCount: 1,
          missingTraceSceneCount: 1,
          coverageStatus: 'attention',
          primaryProblemLabel: {
            en: 'One dawn scene still has no trace summary.',
            'zh-CN': '黎明段还有一个场景没有溯源摘要。',
          },
          primaryAssemblyHintLabel: {
            en: 'Tie the dawn release back to the courier choice.',
            'zh-CN': '把黎明放行重新接回信使抉择。',
          },
        },
      ]
  }
}

function mapSeed(locale: Locale, seed: ChapterSeed): BookStructureChapterViewModel {
  return {
    chapterId: seed.chapterId,
    order: seed.order,
    title: localize(locale, seed.title),
    summary: localize(locale, seed.summary),
    sceneCount: seed.sceneCount,
    unresolvedCount: seed.unresolvedCount,
    draftedSceneCount: seed.draftedSceneCount,
    missingDraftCount: seed.missingDraftCount,
    assembledWordCount: seed.assembledWordCount,
    warningsCount: seed.warningsCount,
    queuedRevisionCount: seed.queuedRevisionCount,
    tracedSceneCount: seed.tracedSceneCount,
    missingTraceSceneCount: seed.missingTraceSceneCount,
    coverageStatus: seed.coverageStatus,
    primaryProblemLabel: seed.primaryProblemLabel ? localize(locale, seed.primaryProblemLabel) : undefined,
    primaryAssemblyHintLabel: seed.primaryAssemblyHintLabel ? localize(locale, seed.primaryAssemblyHintLabel) : undefined,
  }
}

function buildTotals(chapters: BookStructureChapterViewModel[]): BookStructureTotalsViewModel {
  return chapters.reduce<BookStructureTotalsViewModel>(
    (totals, chapter) => ({
      chapterCount: totals.chapterCount + 1,
      sceneCount: totals.sceneCount + chapter.sceneCount,
      unresolvedCount: totals.unresolvedCount + chapter.unresolvedCount,
      draftedSceneCount: totals.draftedSceneCount + chapter.draftedSceneCount,
      missingDraftCount: totals.missingDraftCount + chapter.missingDraftCount,
      tracedSceneCount: totals.tracedSceneCount + chapter.tracedSceneCount,
      missingTraceSceneCount: totals.missingTraceSceneCount + chapter.missingTraceSceneCount,
      assembledWordCount: totals.assembledWordCount + chapter.assembledWordCount,
      warningsCount: totals.warningsCount + chapter.warningsCount,
      queuedRevisionCount: totals.queuedRevisionCount + chapter.queuedRevisionCount,
    }),
    {
      chapterCount: 0,
      sceneCount: 0,
      unresolvedCount: 0,
      draftedSceneCount: 0,
      missingDraftCount: 0,
      tracedSceneCount: 0,
      missingTraceSceneCount: 0,
      assembledWordCount: 0,
      warningsCount: 0,
      queuedRevisionCount: 0,
    },
  )
}

function buildRiskHighlights(
  locale: Locale,
  chapters: BookStructureChapterViewModel[],
  variant: BookStoryVariant,
): BookStructureRiskSummaryViewModel[] {
  if (variant === 'quiet-book') {
    return []
  }

  return chapters.flatMap((chapter) => {
    const items: BookStructureRiskSummaryViewModel[] = []

    if (chapter.primaryProblemLabel) {
      items.push({
        chapterId: chapter.chapterId,
        kind: 'problem',
        label: chapter.primaryProblemLabel,
        detail:
          locale === 'zh-CN'
            ? `${chapter.title} 仍然需要一次书籍级判断来确认装配是否能继续。`
            : `${chapter.title} still needs one book-level judgment before the assembly can move forward.`,
      })
    }

    if (chapter.missingDraftCount > 0) {
      items.push({
        chapterId: chapter.chapterId,
        kind: 'missing_draft',
        label:
          locale === 'zh-CN'
            ? `缺正文 ${chapter.missingDraftCount}`
            : `Missing draft ${chapter.missingDraftCount}`,
        detail:
          locale === 'zh-CN'
            ? `${chapter.title} 还有正文段落没有回到当前装配里。`
            : `${chapter.title} still has prose segments that have not returned to the assembled pass.`,
      })
    }

    if (chapter.missingTraceSceneCount > 0) {
      items.push({
        chapterId: chapter.chapterId,
        kind: 'missing_trace',
        label:
          locale === 'zh-CN'
            ? `缺溯源 ${chapter.missingTraceSceneCount}`
            : `Missing trace ${chapter.missingTraceSceneCount}`,
        detail:
          locale === 'zh-CN'
            ? `${chapter.title} 仍然需要把场景判断重新接回书籍级 trace rollup。`
            : `${chapter.title} still needs scene-level judgment tied back into the book trace rollup.`,
      })
    }

    return items
  })
}

export function getDefaultBookStorySelectedChapterId(variant: BookStoryVariant = 'default') {
  if (variant === 'missing-trace-attention') {
    return 'chapter-dawn-slip'
  }

  return 'chapter-signals-in-rain'
}

export function buildBookStoryWorkspace(
  locale: Locale,
  options?: {
    variant?: BookStoryVariant
    selectedChapterId?: string
  },
): BookStructureWorkspaceViewModel {
  const variant = options?.variant ?? 'default'
  const chapters = getChapterSeeds(variant).map((seed) => mapSeed(locale, seed))
  const selectedChapterId = options?.selectedChapterId ?? getDefaultBookStorySelectedChapterId(variant)
  const selectedChapter = chapters.find((chapter) => chapter.chapterId === selectedChapterId) ?? chapters[0] ?? null
  const totals = buildTotals(chapters)
  const riskHighlights = buildRiskHighlights(locale, chapters, variant)
  const dockSummary: BookStructureDockSummaryViewModel = {
    selectedChapter,
    unresolvedCount: totals.unresolvedCount,
    missingDraftCount: totals.missingDraftCount,
    missingTraceSceneCount: totals.missingTraceSceneCount,
    warningsCount: totals.warningsCount,
    problemItems: riskHighlights,
  }
  const inspector: BookStructureInspectorViewModel = {
    selectedChapter,
    overview: totals,
    riskHighlights,
  }

  return {
    bookId: 'book-storybook',
    title: localize(locale, variantTitles[variant]),
    summary: localize(locale, variantSummaries[variant]),
    selectedChapterId: selectedChapter?.chapterId ?? null,
    chapters,
    selectedChapter,
    totals,
    inspector,
    dockSummary,
    viewsMeta: {
      availableViews: ['sequence', 'outliner', 'signals'],
    },
  }
}

export function useLocalizedBookWorkspace(options?: {
  variant?: BookStoryVariant
  selectedChapterId?: string
}) {
  const { locale } = useI18n()

  return useMemo(
    () =>
      buildBookStoryWorkspace(locale, {
        variant: options?.variant,
        selectedChapterId: options?.selectedChapterId,
      }),
    [locale, options?.selectedChapterId, options?.variant],
  )
}

function getBookViewLabel(locale: Locale, view: BookStructureView) {
  if (locale === 'zh-CN') {
    return view === 'sequence' ? '顺序' : view === 'outliner' ? '大纲' : '信号'
  }

  return view === 'sequence' ? 'Sequence' : view === 'outliner' ? 'Outliner' : 'Signals'
}

export function buildBookStoryActivity(
  locale: Locale,
  workspace: BookStructureWorkspaceViewModel,
  options: {
    activeView: BookStructureView
    quiet?: boolean
  },
): BookWorkbenchActivityItem[] {
  if (options.quiet) {
    return []
  }

  const selectedTitle = workspace.selectedChapter?.title ?? workspace.title

  return [
    {
      id: 'view-0',
      kind: 'view',
      title:
        locale === 'zh-CN'
          ? `进入${getBookViewLabel(locale, options.activeView)}`
          : `Entered ${getBookViewLabel(locale, options.activeView)}`,
      detail:
        locale === 'zh-CN'
          ? '书籍工作台继续保持 route-owned 视图与章节焦点。'
          : 'The book workspace keeps the active view and selected chapter route-owned.',
      tone: 'accent',
    },
    {
      id: 'chapter-1',
      kind: 'chapter',
      title: locale === 'zh-CN' ? `聚焦${selectedTitle}` : `Focused ${selectedTitle}`,
      detail: workspace.selectedChapter?.summary ?? workspace.summary,
      tone: 'neutral',
    },
    {
      id: 'handoff-2',
      kind: 'handoff',
      title:
        locale === 'zh-CN'
          ? `关注${workspace.dockSummary.missingTraceSceneCount}个缺溯源场景`
          : `Watching ${workspace.dockSummary.missingTraceSceneCount} missing-trace scenes`,
      detail:
        locale === 'zh-CN'
          ? '底部活动只保留会话级判断，不替代主舞台。'
          : 'Session-local dock activity stays supportive without replacing the main stage.',
      tone: workspace.dockSummary.missingTraceSceneCount > 0 ? 'accent' : 'neutral',
    },
  ]
}

export function BookStoryShell({
  children,
  frameClassName,
}: PropsWithChildren<{ frameClassName: string }>) {
  return (
    <AppProviders>
      <div className="min-h-[780px] bg-app p-6">
        <div className={frameClassName}>{children}</div>
      </div>
    </AppProviders>
  )
}
