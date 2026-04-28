import { getChapterBacklogStatusLabel } from '@/app/i18n'
import type { SceneProseViewModel } from '@/features/scene/types/scene-view-models'

import {
  readLocalizedChapterDraftAssemblyText,
  type ChapterDraftAssemblyRecord,
  type ChapterDraftAssemblySceneRecord,
  type ChapterDraftAssemblySectionRecord,
} from '../api/chapter-draft-assembly-records'
import { readLocalizedChapterText, type ChapterStructureWorkspaceRecord } from '../api/chapter-records'
import type {
  ChapterDraftDockSummaryItem,
  ChapterDraftDockSummaryViewModel,
  ChapterDraftSceneSectionViewModel,
  ChapterDraftSceneViewModel,
  ChapterDraftSectionViewModel,
  ChapterDraftTransitionSectionViewModel,
  ChapterDraftTransitionStatus,
  ChapterDraftWorkspaceViewModel,
} from '../types/chapter-draft-view-models'

type Locale = 'en' | 'zh-CN'

export interface LegacyChapterDraftProseState {
  prose?: SceneProseViewModel
  isLoading?: boolean
  error?: Error | null
}

type LegacyChapterDraftProseEntry = SceneProseViewModel | LegacyChapterDraftProseState | undefined

interface TransitionCounts {
  gap: number
  ready: number
  weak: number
}

function deriveWordCount(proseDraft?: string, draftWordCount?: number) {
  if (draftWordCount !== undefined) {
    return draftWordCount
  }

  const trimmed = proseDraft?.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.split(/\s+/).length
}

function buildQueueDetail(locale: Locale, count: number) {
  return locale === 'zh-CN' ? `待处理修订 ${count}` : `${count} queued ${count === 1 ? 'revision' : 'revisions'}`
}

function buildDockItem(
  scene: ChapterDraftSceneViewModel,
  detail: string | undefined,
): ChapterDraftDockSummaryItem {
  return {
    sceneId: scene.sceneId,
    title: scene.title,
    detail: detail ?? scene.summary,
  }
}

function buildTransitionDockItem(section: ChapterDraftTransitionSectionViewModel): ChapterDraftDockSummaryItem {
  return {
    sceneId: section.id,
    title: `${section.fromSceneTitle} -> ${section.toSceneTitle}`,
    detail: section.detail,
  }
}

function getLoadingDraftLabel(locale: Locale) {
  return locale === 'zh-CN' ? '正在加载草稿' : 'Loading draft'
}

function getUnavailableDraftLabel(locale: Locale) {
  return locale === 'zh-CN' ? '草稿不可用' : 'Draft unavailable'
}

function getMissingDraftDetail(locale: Locale) {
  return locale === 'zh-CN' ? '当前场景还没有装配进章节手稿的正文。' : 'No chapter manuscript draft has been assembled for this scene yet.'
}

function getFallbackRunStatusLabel(locale: Locale, backlogStatus: ChapterDraftSceneViewModel['backlogStatus']) {
  switch (backlogStatus) {
    case 'running':
      return locale === 'zh-CN' ? '运行中' : 'Running'
    case 'needs_review':
      return locale === 'zh-CN' ? '等待 Review' : 'Run waiting for review'
    case 'drafted':
    case 'revised':
      return locale === 'zh-CN' ? '运行完成' : 'Run completed'
    case 'planned':
    default:
      return locale === 'zh-CN' ? '未开始' : 'Idle'
  }
}

function getWeakTransitionDetail(locale: Locale) {
  return locale === 'zh-CN'
    ? '相邻场景都已有草稿，但这条接缝还缺少带产物引用的过渡正文。'
    : 'Adjacent scene drafts exist, but this seam still lacks artifact-backed transition prose.'
}

function getGapTransitionDetail(locale: Locale) {
  return locale === 'zh-CN'
    ? '保持这条接缝显式可见，直到相邻场景草稿准备就绪。'
    : 'Keep this seam explicit until the adjacent scene drafts are ready.'
}

function getReadyTransitionDetail(locale: Locale) {
  return locale === 'zh-CN'
    ? '这条接缝已经有带产物引用的过渡正文，可继续作为章节阅读支持。'
    : 'This seam has artifact-backed transition prose and remains available as chapter reading support.'
}

function normalizeLegacyProseState(entry: LegacyChapterDraftProseEntry): LegacyChapterDraftProseState {
  if (!entry) {
    return {}
  }

  if ('sceneId' in entry) {
    return { prose: entry }
  }

  return entry
}

function buildTraceSummaryFromAssembly(scene: ChapterDraftAssemblySceneRecord): ChapterDraftSceneViewModel['traceSummary'] {
  return {
    sourceFactCount: scene.traceRollup.acceptedFactCount,
    relatedAssetCount: scene.traceRollup.relatedAssetCount,
    status: scene.traceReady ? 'ready' : 'missing',
  }
}

function buildTraceSummaryFromProse(prose?: SceneProseViewModel): ChapterDraftSceneViewModel['traceSummary'] | undefined {
  const traceSummary = prose?.traceSummary
  if (!traceSummary) {
    return undefined
  }

  return {
    sourceFactCount: traceSummary.acceptedFactIds?.length ?? 0,
    relatedAssetCount: traceSummary.relatedAssets?.length ?? 0,
    status: traceSummary.missingLinks?.includes('trace') ? 'missing' : 'ready',
  }
}

function countTransitionStatus(counts: TransitionCounts, status: ChapterDraftTransitionStatus) {
  if (status === 'ready') {
    counts.ready += 1
  } else if (status === 'weak') {
    counts.weak += 1
  } else {
    counts.gap += 1
  }
}

function buildTransitionSupport(
  selectedScene: ChapterDraftSceneViewModel | null,
  sections: ChapterDraftSectionViewModel[],
  transitionCounts: TransitionCounts,
) {
  if (!selectedScene) {
    return {
      readyCount: transitionCounts.ready,
      weakCount: transitionCounts.weak,
      gapCount: transitionCounts.gap,
      seams: [],
    }
  }

  const seams = sections
    .filter((section): section is ChapterDraftTransitionSectionViewModel => (
      section.kind === 'transition'
      && (section.fromSceneId === selectedScene.sceneId || section.toSceneId === selectedScene.sceneId)
    ))
    .map((section) => ({
      id: section.id,
      direction: section.toSceneId === selectedScene.sceneId ? 'incoming' as const : 'outgoing' as const,
      status: section.status,
      counterpartTitle: section.toSceneId === selectedScene.sceneId ? section.fromSceneTitle : section.toSceneTitle,
      detail: section.detail,
      artifactId: section.artifactId,
    }))

  return {
    readyCount: transitionCounts.ready,
    weakCount: transitionCounts.weak,
    gapCount: transitionCounts.gap,
    seams,
  }
}

function buildDockSummary(
  scenes: ChapterDraftSceneViewModel[],
  sections: ChapterDraftSectionViewModel[],
  locale: Locale,
  transitionCounts: TransitionCounts,
): ChapterDraftDockSummaryViewModel {
  const transitionSections = sections.filter((section): section is ChapterDraftTransitionSectionViewModel => section.kind === 'transition')

  return {
    missingDraftCount: scenes.filter((scene) => scene.isMissingDraft).length,
    warningsCount: scenes.reduce((total, scene) => total + scene.warningsCount, 0),
    queuedRevisionCount: scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0),
    waitingReviewCount: scenes.filter((scene) => scene.backlogStatus === 'needs_review').length,
    transitionGapCount: transitionCounts.gap,
    transitionReadyCount: transitionCounts.ready,
    transitionWeakCount: transitionCounts.weak,
    runnableScene: (() => {
      const runnableScene = scenes.find((scene) => scene.backlogStatus === 'planned')
      return runnableScene ? buildDockItem(runnableScene, runnableScene.summary) : undefined
    })(),
    missingDraftScenes: scenes
      .filter((scene) => scene.isMissingDraft)
      .map((scene) => buildDockItem(scene, scene.latestDiffSummary)),
    warningScenes: scenes
      .filter((scene) => scene.warningsCount > 0)
      .map((scene) => buildDockItem(scene, scene.latestDiffSummary)),
    queuedRevisionScenes: scenes
      .filter((scene) => (scene.revisionQueueCount ?? 0) > 0)
      .map((scene) => buildDockItem(scene, buildQueueDetail(locale, scene.revisionQueueCount ?? 0))),
    waitingReviewScenes: scenes
      .filter((scene) => scene.backlogStatus === 'needs_review')
      .map((scene) => buildDockItem(scene, scene.runStatusLabel)),
    transitionGapSections: transitionSections
      .filter((section) => section.status === 'gap')
      .map(buildTransitionDockItem),
    transitionWeakSections: transitionSections
      .filter((section) => section.status === 'weak')
      .map(buildTransitionDockItem),
  }
}

function buildSceneSection(scene: ChapterDraftSceneViewModel): ChapterDraftSceneSectionViewModel {
  return {
    kind: 'scene',
    ...scene,
  }
}

function resolveGapLikeTransitionStatus(
  fromScene: ChapterDraftSceneViewModel | undefined,
  toScene: ChapterDraftSceneViewModel | undefined,
): ChapterDraftTransitionStatus {
  return fromScene && toScene && !fromScene.isMissingDraft && !toScene.isMissingDraft ? 'weak' : 'gap'
}

function buildLiveSections(
  scenes: ChapterDraftSceneViewModel[],
  sourceSections: ChapterDraftAssemblySectionRecord[],
  locale: Locale,
) {
  const sceneById = new Map(scenes.map((scene) => [scene.sceneId, scene]))
  const transitionCounts: TransitionCounts = { gap: 0, ready: 0, weak: 0 }
  const sections = sourceSections.flatMap<ChapterDraftSectionViewModel>((section) => {
    if (section.kind === 'scene-draft' || section.kind === 'scene-gap') {
      const scene = sceneById.get(section.sceneId)
      return scene ? [buildSceneSection(scene)] : []
    }

    if (section.kind === 'transition-draft') {
      countTransitionStatus(transitionCounts, 'ready')
      return [{
        kind: 'transition',
        id: `${section.fromSceneId}::${section.toSceneId}`,
        fromSceneId: section.fromSceneId,
        toSceneId: section.toSceneId,
        fromSceneTitle: readLocalizedChapterDraftAssemblyText(section.fromSceneTitle, locale),
        toSceneTitle: readLocalizedChapterDraftAssemblyText(section.toSceneTitle, locale),
        status: 'ready',
        detail: getReadyTransitionDetail(locale),
        proseDraft: section.transitionProse,
        artifactId: section.artifactRef.id,
      }]
    }

    const fromScene = sceneById.get(section.fromSceneId)
    const toScene = sceneById.get(section.toSceneId)
    const status = resolveGapLikeTransitionStatus(fromScene, toScene)
    countTransitionStatus(transitionCounts, status)
    return [{
      kind: 'transition',
      id: `${section.fromSceneId}::${section.toSceneId}`,
      fromSceneId: section.fromSceneId,
      toSceneId: section.toSceneId,
      fromSceneTitle: readLocalizedChapterDraftAssemblyText(section.fromSceneTitle, locale),
      toSceneTitle: readLocalizedChapterDraftAssemblyText(section.toSceneTitle, locale),
      status,
      detail: status === 'weak'
        ? getWeakTransitionDetail(locale)
        : readLocalizedChapterDraftAssemblyText(section.gapReason, locale),
    }]
  })

  return { sections, transitionCounts }
}

function buildFallbackSections(
  scenes: ChapterDraftSceneViewModel[],
  locale: Locale,
) {
  const sections: ChapterDraftSectionViewModel[] = []
  const transitionCounts: TransitionCounts = { gap: 0, ready: 0, weak: 0 }

  for (const [index, scene] of scenes.entries()) {
    sections.push(buildSceneSection(scene))
    const nextScene = scenes[index + 1]
    if (!nextScene) {
      continue
    }

    const status = resolveGapLikeTransitionStatus(scene, nextScene)
    countTransitionStatus(transitionCounts, status)
    sections.push({
      kind: 'transition',
      id: `${scene.sceneId}::${nextScene.sceneId}`,
      fromSceneId: scene.sceneId,
      toSceneId: nextScene.sceneId,
      fromSceneTitle: scene.title,
      toSceneTitle: nextScene.title,
      status,
      detail: status === 'weak' ? getWeakTransitionDetail(locale) : getGapTransitionDetail(locale),
    })
  }

  return { sections, transitionCounts }
}

function buildWorkspace(
  input: {
    chapterId: string
    title: string
    summary: string
    scenes: ChapterDraftSceneViewModel[]
    sections: ChapterDraftSectionViewModel[]
    selectedSceneId?: string | null
    transitionCounts: TransitionCounts
    assembledWordCount?: number
  },
  locale: Locale,
): ChapterDraftWorkspaceViewModel {
  const selectedScene = input.scenes.find((scene) => scene.sceneId === input.selectedSceneId) ?? input.scenes[0] ?? null
  const draftedSceneCount = input.scenes.filter((scene) => !scene.isMissingDraft).length
  const missingDraftCount = input.scenes.filter((scene) => scene.isMissingDraft).length
  const assembledWordCount = input.assembledWordCount ?? input.scenes.reduce((total, scene) => total + (scene.draftWordCount ?? 0), 0)
  const warningsCount = input.scenes.reduce((total, scene) => total + scene.warningsCount, 0)
  const queuedRevisionCount = input.scenes.reduce((total, scene) => total + (scene.revisionQueueCount ?? 0), 0)
  const dockSummary = buildDockSummary(input.scenes, input.sections, locale, input.transitionCounts)

  return {
    chapterId: input.chapterId,
    title: input.title,
    summary: input.summary,
    selectedSceneId: selectedScene?.sceneId ?? null,
    scenes: input.scenes,
    sections: input.sections,
    assembledWordCount,
    draftedSceneCount,
    missingDraftCount,
    selectedScene,
    inspector: {
      selectedScene: selectedScene
        ? {
            sceneId: selectedScene.sceneId,
            title: selectedScene.title,
            summary: selectedScene.summary,
            proseStatusLabel: selectedScene.proseStatusLabel,
            draftWordCount: selectedScene.draftWordCount,
            revisionQueueCount: selectedScene.revisionQueueCount,
            warningsCount: selectedScene.warningsCount,
            latestDiffSummary: selectedScene.latestDiffSummary,
          }
        : null,
      chapterReadiness: {
        draftedSceneCount,
        missingDraftCount,
        assembledWordCount,
        warningsCount,
        queuedRevisionCount,
      },
      transitionSupport: buildTransitionSupport(selectedScene, input.sections, input.transitionCounts),
    },
    dockSummary,
  }
}

export function mapChapterDraftAssemblyRecord(
  record: ChapterDraftAssemblyRecord,
  selectedSceneId: string | null | undefined,
  locale: Locale,
): ChapterDraftWorkspaceViewModel {
  const scenes = [...record.scenes]
    .sort((left, right) => left.order - right.order)
    .map<ChapterDraftSceneViewModel>((scene) => {
      const proseDraft = scene.kind === 'scene-draft' ? scene.proseDraft : undefined
      const latestDiffSummary = scene.kind === 'scene-gap'
        ? scene.latestDiffSummary ?? readLocalizedChapterDraftAssemblyText(scene.gapReason, locale)
        : scene.latestDiffSummary

      return {
        sceneId: scene.sceneId,
        order: scene.order,
        title: readLocalizedChapterDraftAssemblyText(scene.title, locale),
        summary: readLocalizedChapterDraftAssemblyText(scene.summary, locale),
        proseDraft,
        draftWordCount: deriveWordCount(proseDraft, scene.draftWordCount),
        backlogStatus: scene.backlogStatus,
        backlogStatusLabel: getChapterBacklogStatusLabel(locale, scene.backlogStatus),
        proseStatusLabel: readLocalizedChapterDraftAssemblyText(scene.proseStatusLabel, locale),
        sceneStatusLabel: getChapterBacklogStatusLabel(locale, scene.backlogStatus),
        runStatusLabel: getFallbackRunStatusLabel(locale, scene.backlogStatus),
        latestDiffSummary,
        revisionQueueCount: scene.revisionQueueCount,
        warningsCount: scene.warningsCount,
        isMissingDraft: scene.kind === 'scene-gap',
        traceSummary: buildTraceSummaryFromAssembly(scene),
      }
    })

  const { sections, transitionCounts } = buildLiveSections(scenes, record.sections, locale)

  return buildWorkspace({
    chapterId: record.chapterId,
    title: readLocalizedChapterDraftAssemblyText(record.title, locale),
    summary: readLocalizedChapterDraftAssemblyText(record.summary, locale),
    scenes,
    sections,
    selectedSceneId,
    transitionCounts,
    assembledWordCount: record.assembledWordCount,
  }, locale)
}

export function mapLegacyChapterDraftWorkspace(
  record: ChapterStructureWorkspaceRecord,
  proseStateBySceneId: Record<string, LegacyChapterDraftProseEntry>,
  selectedSceneId: string | null | undefined,
  locale: Locale,
): ChapterDraftWorkspaceViewModel {
  const scenes = [...record.scenes]
    .sort((left, right) => left.order - right.order)
    .map<ChapterDraftSceneViewModel>((scene) => {
      const proseState = normalizeLegacyProseState(proseStateBySceneId[scene.id])
      const prose = proseState.prose
      const draftWordCount = deriveWordCount(prose?.proseDraft, prose?.draftWordCount)
      const isMissingDraft = prose ? !(prose.proseDraft && prose.proseDraft.trim().length > 0) : false
      const proseStatusLabel = prose
        ? prose.statusLabel ?? readLocalizedChapterText(scene.proseStatusLabel, locale)
        : proseState.error
          ? getUnavailableDraftLabel(locale)
          : proseState.isLoading
            ? getLoadingDraftLabel(locale)
            : readLocalizedChapterText(scene.proseStatusLabel, locale)
      const latestDiffSummary = prose
        ? prose.latestDiffSummary ?? (isMissingDraft ? getMissingDraftDetail(locale) : undefined)
        : proseState.error
          ? proseState.error.message
          : undefined

      return {
        sceneId: scene.id,
        order: scene.order,
        title: readLocalizedChapterText(scene.title, locale),
        summary: readLocalizedChapterText(scene.summary, locale),
        proseDraft: prose?.proseDraft,
        draftWordCount,
        backlogStatus: scene.backlogStatus,
        backlogStatusLabel: getChapterBacklogStatusLabel(locale, scene.backlogStatus),
        proseStatusLabel,
        sceneStatusLabel: readLocalizedChapterText(scene.statusLabel, locale),
        runStatusLabel: readLocalizedChapterText(scene.runStatusLabel, locale),
        latestDiffSummary,
        revisionQueueCount: prose?.revisionQueueCount,
        warningsCount: prose?.warningsCount ?? 0,
        isMissingDraft,
        traceSummary: buildTraceSummaryFromProse(prose),
      }
    })

  const { sections, transitionCounts } = buildFallbackSections(scenes, locale)

  return buildWorkspace({
    chapterId: record.chapterId,
    title: readLocalizedChapterText(record.title, locale),
    summary: readLocalizedChapterText(record.summary, locale),
    scenes,
    sections,
    selectedSceneId,
    transitionCounts,
  }, locale)
}
